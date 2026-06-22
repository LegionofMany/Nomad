import {
  disableTravelMode,
  enableTravelMode,
  getDailyUnlockTime,
  getPortfolio,
  getTravelState,
  getWalletMeta,
  getWalletStatus,
  lockWallet as lockLocalWallet,
} from '../../services/walletService';

import type {
  NomadAsset,
  NomadFreezeActivity,
  NomadFreezeScope,
  NomadInsightsAdapter,
  NomadInsightsState,
  NomadOverlayAdapters,
  NomadOwnerAuthorityRequest,
  NomadRecoveryAdapter,
  NomadRecoveryClockTime,
  NomadRecoverySequenceState,
  NomadRecoveryState,
  NomadSafetyAdapter,
  NomadSecurityAdapter,
  NomadSecurityState,
  NomadSignedTransaction,
  NomadSwapAdapter,
  NomadSwapQuote,
  NomadTransactionDraft,
  NomadTravelAdapter,
  NomadTravelPocketState,
  NomadWalletAdapter,
} from './walletAdapter';

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percentBySymbol: Record<string, string> = { USDC: '+0.01%', USDT: '+0.00%', DAI: '+0.02%', ETH: '+1.42%', BTC: '+1.82%', HBAR: '+2.10%', XRP: '+0.64%', XLM: '+0.44%' };
const networkBySymbol: Record<string, string> = { USDC: 'Ethereum', USDT: 'TRC20', DAI: 'Ethereum', ETH: 'Ethereum', BTC: 'Bitcoin', HBAR: 'Hedera', XRP: 'XRPL', XLM: 'Stellar' };

let ownerAuthorityRequest: NomadOwnerAuthorityRequest = { status: 'none' };
let recoverySequenceState: NomadRecoverySequenceState = { step: 1, enteredSets: 0, verifiedSets: 0, totalSets: 24, strengthScore: 0, currentSet: 1, sampleTime: { hour: 3, minute: 15, second: 27 }, status: 'entry' };
let freezeActivity: NomadFreezeActivity[] = [];

function toNomadAsset(balance: { symbol: string; amount: number; fiatApproxUSD: number }): NomadAsset {
  return { symbol: balance.symbol, name: balance.symbol, balance: String(balance.amount), fiatValueUsd: currencyFormatter.format(balance.fiatApproxUSD), change24h: percentBySymbol[balance.symbol] ?? '+0.00%', network: networkBySymbol[balance.symbol] ?? 'Nomad' };
}

async function buildTravelPocketState(): Promise<NomadTravelPocketState> {
  const [travel, portfolio] = await Promise.all([getTravelState(), getPortfolio().catch(() => null)]);
  const totalUsd = portfolio?.balances.reduce((sum, balance) => sum + balance.fiatApproxUSD, 0) ?? 0;
  const pocketUsd = totalUsd > 0 ? Math.min(totalUsd, 1240.75) : 1240.75;
  const region = travel.regionInput || 'Japan';
  const localCurrency = region.toLowerCase().includes('europe') ? 'EUR Stable' : region.toLowerCase().includes('canada') ? 'CAD Stable' : 'JPY Stable';
  const localBalance = localCurrency.startsWith('JPY') ? '¥185,420' : currencyFormatter.format(pocketUsd);
  return { enabled: travel.enabled, regionInput: region, preferredStablecoin: travel.preferredStablecoin || localCurrency, pocketBalanceFiat: currencyFormatter.format(pocketUsd), pocketBalanceLocal: localBalance, localCurrency };
}

function formatClockTime(time: { hour: number; minute: number; second?: number } | null): string {
  if (!time) return '24 Hour Cycle';
  const second = time.second ?? 0;
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}:${String(second).padStart(2, '0')} Time Set`;
}

async function buildRecoveryState(): Promise<NomadRecoveryState> {
  const [status, meta, unlockTime] = await Promise.all([getWalletStatus(), getWalletMeta(), getDailyUnlockTime()]);
  const hasWallet = !!meta;
  const isRecovery = status === 'recovery';
  const recoveryStatus: NomadRecoveryState['recoveryStatus'] = !hasWallet ? 'not_started' : isRecovery ? 'recovery_required' : status === 'locked' ? 'locked' : 'protected';
  return {
    walletStatus: status,
    dailyUnlockTime: unlockTime ? { ...unlockTime, second: 0 } : null,
    recoveryStatus,
    recoverySetupDate: meta?.createdAt ? new Date(meta.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not configured',
    verificationStatus: hasWallet ? 'Verified' : 'Setup Required',
    lastCheckLabel: 'Just now',
    timeSetsComplete: hasWallet ? 24 : recoverySequenceState.verifiedSets,
    timeSetsTotal: 24,
    recoveryScore: hasWallet ? 94 : recoverySequenceState.strengthScore,
    signerQuorum: hasWallet ? 3 : 0,
    signerTotal: 3,
    nextRecommendedCheck: '30 days from now',
    timeRemainingLabel: status === 'locked' ? '23:47:32' : status === 'unlocked' ? '00:00:00' : '24:00:00',
    cycleLabel: formatClockTime(unlockTime),
    cycleStartedLabel: meta?.createdAt ? new Date(meta.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Awaiting wallet setup',
    purpose: 'Wallet Access',
  };
}

async function buildSecurityState(): Promise<NomadSecurityState> {
  const meta = await getWalletMeta();
  const protectedSince = meta?.createdAt ? new Date(meta.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not configured';
  const activeFreeze = freezeActivity.find((item) => item.status === 'active');
  const ownerAlert = freezeActivity.find((item) => item.status === 'alert_sent');
  const freezeStatus: NomadSecurityState['freezeStatus'] = activeFreeze?.scope === 'entire_wallet' ? 'full' : activeFreeze || ownerAlert ? 'partial' : 'none';
  return { status: activeFreeze ? 'frozen' : meta ? 'secure' : 'warning', protectedSince, protectedDays: meta ? '42 days' : 'Setup required', lastScanLabel: 'Just now', lastScanDetail: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }), score: activeFreeze ? 88 : meta ? 100 : 64, freezeStatus, freezeScope: activeFreeze?.scope ?? ownerAlert?.scope, freezeActivity };
}

async function buildInsightsState(): Promise<NomadInsightsState> {
  const [portfolio, travel] = await Promise.all([getPortfolio().catch(() => null), buildTravelPocketState().catch(() => null)]);
  const totalUsd = portfolio?.balances.reduce((sum, balance) => sum + balance.fiatApproxUSD, 0) ?? 24680.45;
  const walletUsd = Math.max(0, totalUsd - 1240.75);
  const travelUsd = Number((travel?.pocketBalanceFiat ?? '$4,652.33').replace(/[^0-9.]/g, '')) || 4652.33;
  const spendingCategories = [
    { label: 'Food & Dining', icon: '♨', percent: '34%', amount: '$424.12', color: '#35f883' },
    { label: 'Shopping', icon: '▢', percent: '24%', amount: '$299.18', color: '#1684ff' },
    { label: 'Transport', icon: '▰', percent: '18%', amount: '$224.36', color: '#8b5cff' },
    { label: 'Travel', icon: '✈', percent: '14%', amount: '$174.50', color: '#ffb84d' },
    { label: 'Other', icon: '•••', percent: '10%', amount: '$126.74', color: '#9aa7ba' },
  ];
  return {
    totalPortfolioValue: currencyFormatter.format(totalUsd), monthlyGrowth: '+$1,248.32', monthlyGrowthPercent: '5.32%',
    statCards: [
      { label: 'Wallet Balance', value: currencyFormatter.format(walletUsd), note: '75.1%', icon: '▣', color: '#35f883' },
      { label: 'Travel Pocket', value: currencyFormatter.format(travelUsd), note: '18.8%', icon: '✈', color: '#35f883' },
      { label: 'Investments', value: '$1,486.77', note: '6.0%', icon: '◔', color: '#8b5cff' },
      { label: 'Total Assets', value: String(portfolio?.balances.length ?? 8), note: 'Chains', icon: '◎', color: '#ffc400' },
    ],
    spendingTotal: '$1,248.90', spendingDelta: '-8.4% vs last month', spendingCategories,
    recentSpending: [
      { name: 'Starbucks Tokyo', meta: 'May 12, 2025 • 09:41 AM', category: 'Food & Dining', amount: '¥860', usd: '≈ $5.61 USD', icon: '☕', color: '#35f883' },
      { name: 'Don Quijote Shibuya', meta: 'May 12, 2025 • 11:23 AM', category: 'Shopping', amount: '¥3,250', usd: '≈ $21.19 USD', icon: '🛒', color: '#1684ff' },
      { name: 'JR Tokyo Station', meta: 'May 12, 2025 • 02:15 PM', category: 'Transport', amount: '¥950', usd: '≈ $6.18 USD', icon: '▣', color: '#8b5cff' },
      { name: 'Sushi Zanmai Ginza', meta: 'May 11, 2025 • 07:12 PM', category: 'Food & Dining', amount: '¥8,600', usd: '≈ $55.92 USD', icon: '寿', color: '#35f883' },
    ],
    budgets: [
      { label: 'Food & Dining', spent: '$424', total: '$600', percent: '71%', icon: '♨', color: '#35f883' },
      { label: 'Shopping', spent: '$299', total: '$500', percent: '60%', icon: '▢', color: '#1684ff' },
      { label: 'Transport', spent: '$224', total: '$400', percent: '56%', icon: '▰', color: '#8b5cff' },
      { label: 'Travel', spent: '$174', total: '$300', percent: '58%', icon: '✈', color: '#ffb84d' },
      { label: 'Other', spent: '$126', total: '$200', percent: '63%', icon: '•••', color: '#9aa7ba' },
    ],
    performanceRows: [
      { asset: 'Bitcoin', symbol: 'BTC', icon: '₿', price: '$63,852.21', change: '+6.27%', positive: true },
      { asset: 'Hedera', symbol: 'HBAR', icon: 'H', price: '$0.1234', change: '+4.18%', positive: true },
      { asset: 'XRP', symbol: 'XRP', icon: '×', price: '$0.5218', change: '-1.35%', positive: false },
      { asset: 'USDC', symbol: 'USDC', icon: '$', price: '$1.00', change: '+0.01%', positive: true },
      { asset: travel?.localCurrency ?? 'JPY Stable', symbol: 'JPY', icon: '¥', price: '¥1.00', change: '+0.00%', positive: true },
    ],
    topInsight: 'You spent 12% less on dining compared to last month.', topSavings: '$56.40',
    travelLocation: `${travel?.regionInput ?? 'Tokyo'}, Japan`, travelDateRange: 'May 12 – May 20, 2025', travelPocketSpent: '¥36,480', travelPocketSpentUsd: '≈ $234.29 USD', travelDailyAverage: '¥4,560', travelDailyAverageUsd: '≈ $29.00 USD', freedomScore: 84,
  };
}

function freezeLabel(scope: NomadFreezeScope): string {
  switch (scope) { case 'entire_wallet': return 'Entire wallet freeze activated'; case 'travel_pocket': return 'Travel Pocket freeze activated'; case 'specific_assets': return 'Specific asset freeze selected'; case 'owner_authority_alert': return 'Owner Authority alert sent'; }
}

function normalizeTime(time: NomadRecoveryClockTime): NomadRecoveryClockTime {
  return { hour: Math.max(0, Math.min(23, time.hour)), minute: Math.max(0, Math.min(59, time.minute)), second: Math.max(0, Math.min(59, time.second ?? 0)) };
}

async function buildSwapQuote(fromAsset: string, toAsset: string, amount: string): Promise<NomadSwapQuote> {
  const portfolio = await getPortfolio().catch(() => null);
  const fromBalance = portfolio?.balances.find((item) => item.symbol === fromAsset)?.amount ?? 0.3567;
  const toBalance = portfolio?.balances.find((item) => item.symbol === toAsset)?.amount ?? 3250;
  const numericAmount = Number(amount) || 0.01;
  const rate = fromAsset === 'BTC' && toAsset === 'HBAR' ? 124578 : 1000;
  const toAmount = numericAmount * rate;
  const fromUsd = numericAmount * 61410;
  const toUsd = fromUsd * 0.9916;
  return {
    fromAsset,
    toAsset,
    fromAmount: String(numericAmount),
    toAmount: toAmount.toLocaleString('en-US', { maximumFractionDigits: 2 }),
    fromValueUsd: currencyFormatter.format(fromUsd),
    toValueUsd: currencyFormatter.format(toUsd),
    fromBalance: `Balance: ${fromBalance} ${fromAsset}`,
    toBalance: `Balance: ${toBalance.toLocaleString('en-US')} ${toAsset}`,
    rateLabel: `1 ${fromAsset} ≈ ${rate.toLocaleString('en-US')} ${toAsset}`,
    priceImpact: '0.30%',
    network: toAsset === 'HBAR' ? 'Hedera Mainnet' : networkBySymbol[toAsset] ?? 'Nomad Liquidity',
    networkFee: '0.00012 BTC (≈ $0.73)',
    estimatedTime: '~ 15 seconds',
    slippageTolerance: '0.50%',
    status: 'quote',
  };
}

export const localNomadWalletAdapter: NomadWalletAdapter = {
  async getWalletBalance() { const portfolio = await getPortfolio(); return currencyFormatter.format(portfolio.balances.reduce((sum, balance) => sum + balance.fiatApproxUSD, 0)); },
  async getAssets() { const portfolio = await getPortfolio(); return portfolio.balances.map(toNomadAsset); },
  async getReceiveAddress(assetSymbol: string) { const meta = await getWalletMeta(); if (!meta) throw new Error('No wallet is available for receive address lookup.'); return `${assetSymbol.toUpperCase()}:${meta.evmAddress}`; },
  async createTransaction(draft: NomadTransactionDraft): Promise<NomadSignedTransaction> { if (!draft.fromAsset || !draft.toAddress || !draft.amount) return { status: 'failed' }; return { status: 'created', rawTransaction: JSON.stringify({ ...draft, createdAt: new Date().toISOString(), source: 'nomad-overlay-draft' }) }; },
  async lockWallet() { await lockLocalWallet(); },
  async unlockWallet() { throw new Error('Unlock is handled by the Nomad Time Set flow, not the generic overlay adapter.'); },
};

export const localNomadTravelAdapter: NomadTravelAdapter = { async getTravelPocketState() { return buildTravelPocketState(); }, async enableTravelPocket(regionInput: string) { await enableTravelMode(regionInput); return buildTravelPocketState(); }, async disableTravelPocket() { await disableTravelMode(); return buildTravelPocketState(); } };

export const localNomadRecoveryAdapter: NomadRecoveryAdapter = {
  async getRecoveryState() { return buildRecoveryState(); }, async runRecoveryCheck() { return buildRecoveryState(); }, async getOwnerAuthorityRequest() { return ownerAuthorityRequest; },
  async requestOwnerAuthorityApproval(reason: string) { ownerAuthorityRequest = { status: 'pending', requestedAt: new Date().toISOString(), reason, requestedBy: 'You (Owner)', device: 'Android Device' }; return ownerAuthorityRequest; },
  async cancelOwnerAuthorityRequest() { ownerAuthorityRequest = { status: 'cancelled', requestedAt: new Date().toISOString(), reason: 'Request cancelled by owner' }; return ownerAuthorityRequest; },
  async getRecoverySequenceState() { return recoverySequenceState; },
  async startRecoverySequence() { recoverySequenceState = { ...recoverySequenceState, step: 1, enteredSets: 24, verifiedSets: 0, strengthScore: 96, currentSet: 1, status: 'entry' }; return recoverySequenceState; },
  async verifyRecoverySet(setNumber: number, time: NomadRecoveryClockTime) { const nextVerified = Math.min(24, Math.max(recoverySequenceState.verifiedSets, setNumber)); recoverySequenceState = { ...recoverySequenceState, step: nextVerified >= 24 ? 3 : 2, verifiedSets: nextVerified, currentSet: Math.min(24, nextVerified + 1), sampleTime: normalizeTime(time), strengthScore: Math.max(96, recoverySequenceState.strengthScore), status: nextVerified >= 24 ? 'ready_to_recover' : 'verifying' }; return recoverySequenceState; },
  async completeRecoverySequence() { recoverySequenceState = { ...recoverySequenceState, step: 4, enteredSets: 24, verifiedSets: 24, strengthScore: 96, status: 'complete', recoveredAt: new Date().toISOString() }; return recoverySequenceState; },
};

export const localNomadSecurityAdapter: NomadSecurityAdapter = { async getSecurityState() { return buildSecurityState(); }, async runSecurityScan() { return buildSecurityState(); }, async activateFreeze(scope: NomadFreezeScope) { const status = scope === 'owner_authority_alert' ? 'alert_sent' : 'active'; freezeActivity = [{ scope, label: freezeLabel(scope), requestedAt: new Date().toISOString(), status }, ...freezeActivity.filter((item) => item.status !== 'active')].slice(0, 5); return buildSecurityState(); }, async clearFreeze() { freezeActivity = freezeActivity.map((item) => item.status === 'active' ? { ...item, status: 'cleared' } : item); return buildSecurityState(); } };
export const localNomadInsightsAdapter: NomadInsightsAdapter = { async getInsightsState() { return buildInsightsState(); } };
export const localNomadSwapAdapter: NomadSwapAdapter = { async getSwapQuote(fromAsset: string, toAsset: string, amount: string) { return buildSwapQuote(fromAsset, toAsset, amount); }, async createSwapDraft(quote: NomadSwapQuote) { return localNomadWalletAdapter.createTransaction({ fromAsset: quote.fromAsset, toAddress: `SWAP:${quote.toAsset}`, amount: quote.fromAmount, networkFee: quote.networkFee, memo: `Nomad swap ${quote.fromAsset} to ${quote.toAsset}` }); } };

export const localNomadSafetyAdapter: NomadSafetyAdapter = {
  async scanAddress(address: string) { const normalized = address.trim().toLowerCase(); if (!normalized) return { score: 0, risk: 'high', summary: 'No address supplied.' }; const isSuspicious = normalized.includes('drain') || normalized.includes('scam') || normalized.includes('phish'); return isSuspicious ? { score: 32, risk: 'high', summary: 'Potentially suspicious address pattern detected by the local safety bridge.' } : { score: 92, risk: 'low', summary: 'No local safety flags detected. Ready for BlockPages live scan integration.' }; },
  async scanUrl(url: string) { const normalized = url.trim().toLowerCase(); if (!normalized) return { score: 0, risk: 'high', summary: 'No URL supplied.' }; const isSuspicious = normalized.includes('drain') || normalized.includes('airdrop') || normalized.includes('claim') || normalized.includes('phish'); return isSuspicious ? { score: 41, risk: 'medium', summary: 'Potential phishing or drainer language detected by the local safety bridge.' } : { score: 92, risk: 'low', summary: 'No local URL threat flags detected. Ready for BlockPages live scanner integration.' }; },
};

export const localNomadOverlayAdapters: NomadOverlayAdapters = { wallet: localNomadWalletAdapter, travel: localNomadTravelAdapter, recovery: localNomadRecoveryAdapter, security: localNomadSecurityAdapter, insights: localNomadInsightsAdapter, swap: localNomadSwapAdapter, safety: localNomadSafetyAdapter };
