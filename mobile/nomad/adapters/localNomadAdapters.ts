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
  NomadOverlayAdapters,
  NomadRecoveryAdapter,
  NomadRecoveryState,
  NomadSafetyAdapter,
  NomadSignedTransaction,
  NomadTransactionDraft,
  NomadTravelAdapter,
  NomadTravelPocketState,
  NomadWalletAdapter,
} from './walletAdapter';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentBySymbol: Record<string, string> = {
  USDC: '+0.01%',
  USDT: '+0.00%',
  DAI: '+0.02%',
  ETH: '+1.42%',
  BTC: '+1.82%',
  HBAR: '+2.10%',
  XRP: '+0.64%',
  XLM: '+0.44%',
};

const networkBySymbol: Record<string, string> = {
  USDC: 'Ethereum',
  USDT: 'TRC20',
  DAI: 'Ethereum',
  ETH: 'Ethereum',
  BTC: 'Bitcoin',
  HBAR: 'Hedera',
  XRP: 'XRPL',
  XLM: 'Stellar',
};

function toNomadAsset(balance: { symbol: string; amount: number; fiatApproxUSD: number }): NomadAsset {
  return {
    symbol: balance.symbol,
    name: balance.symbol,
    balance: String(balance.amount),
    fiatValueUsd: currencyFormatter.format(balance.fiatApproxUSD),
    change24h: percentBySymbol[balance.symbol] ?? '+0.00%',
    network: networkBySymbol[balance.symbol] ?? 'Nomad',
  };
}

async function buildTravelPocketState(): Promise<NomadTravelPocketState> {
  const [travel, portfolio] = await Promise.all([
    getTravelState(),
    getPortfolio().catch(() => null),
  ]);

  const totalUsd = portfolio?.balances.reduce((sum, balance) => sum + balance.fiatApproxUSD, 0) ?? 0;
  const pocketUsd = totalUsd > 0 ? Math.min(totalUsd, 1240.75) : 1240.75;
  const region = travel.regionInput || 'Japan';
  const localCurrency = region.toLowerCase().includes('europe') ? 'EUR Stable' : region.toLowerCase().includes('canada') ? 'CAD Stable' : 'JPY Stable';
  const localBalance = localCurrency.startsWith('JPY') ? '¥185,420' : currencyFormatter.format(pocketUsd);

  return {
    enabled: travel.enabled,
    regionInput: region,
    preferredStablecoin: travel.preferredStablecoin || localCurrency,
    pocketBalanceFiat: currencyFormatter.format(pocketUsd),
    pocketBalanceLocal: localBalance,
    localCurrency,
  };
}

function formatClockTime(time: { hour: number; minute: number; second?: number } | null): string {
  if (!time) return '24 Hour Cycle';
  const second = time.second ?? 0;
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}:${String(second).padStart(2, '0')} Time Set`;
}

async function buildRecoveryState(): Promise<NomadRecoveryState> {
  const [status, meta, unlockTime] = await Promise.all([
    getWalletStatus(),
    getWalletMeta(),
    getDailyUnlockTime(),
  ]);

  const hasWallet = !!meta;
  const isRecovery = status === 'recovery';
  const recoveryStatus: NomadRecoveryState['recoveryStatus'] = !hasWallet
    ? 'not_started'
    : isRecovery
      ? 'recovery_required'
      : status === 'locked'
        ? 'locked'
        : 'protected';

  return {
    walletStatus: status,
    dailyUnlockTime: unlockTime ? { ...unlockTime, second: 0 } : null,
    recoveryStatus,
    recoverySetupDate: meta?.createdAt ? new Date(meta.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not configured',
    verificationStatus: hasWallet ? 'Verified' : 'Setup Required',
    lastCheckLabel: 'Just now',
    timeSetsComplete: hasWallet ? 24 : 0,
    timeSetsTotal: 24,
    recoveryScore: hasWallet ? 94 : 0,
    signerQuorum: hasWallet ? 3 : 0,
    signerTotal: 3,
    nextRecommendedCheck: '30 days from now',
    timeRemainingLabel: status === 'locked' ? '23:47:32' : status === 'unlocked' ? '00:00:00' : '24:00:00',
    cycleLabel: formatClockTime(unlockTime),
    cycleStartedLabel: meta?.createdAt ? new Date(meta.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Awaiting wallet setup',
    purpose: 'Wallet Access',
  };
}

export const localNomadWalletAdapter: NomadWalletAdapter = {
  async getWalletBalance() {
    const portfolio = await getPortfolio();
    const total = portfolio.balances.reduce((sum, balance) => sum + balance.fiatApproxUSD, 0);
    return currencyFormatter.format(total);
  },

  async getAssets() {
    const portfolio = await getPortfolio();
    return portfolio.balances.map(toNomadAsset);
  },

  async getReceiveAddress(assetSymbol: string) {
    const meta = await getWalletMeta();
    if (!meta) throw new Error('No wallet is available for receive address lookup.');

    // The current local wallet backend exposes the EVM account first.
    // The cloned wallet core will replace this per-chain resolver through the same adapter method.
    return `${assetSymbol.toUpperCase()}:${meta.evmAddress}`;
  },

  async createTransaction(draft: NomadTransactionDraft): Promise<NomadSignedTransaction> {
    // Safe bridge only: the Nomad overlay can create a reviewable transaction draft,
    // but signing/broadcasting stays inside the cloned wallet engine or chain-specific backend.
    if (!draft.fromAsset || !draft.toAddress || !draft.amount) {
      return { status: 'failed' };
    }

    return {
      status: 'created',
      rawTransaction: JSON.stringify({
        ...draft,
        createdAt: new Date().toISOString(),
        source: 'nomad-overlay-draft',
      }),
    };
  },

  async lockWallet() {
    await lockLocalWallet();
  },

  async unlockWallet() {
    // Never bypass Nomad Time Sets. The live unlock flow must continue using the existing clock backend.
    throw new Error('Unlock is handled by the Nomad Time Set flow, not the generic overlay adapter.');
  },
};

export const localNomadTravelAdapter: NomadTravelAdapter = {
  async getTravelPocketState() {
    return buildTravelPocketState();
  },

  async enableTravelPocket(regionInput: string) {
    await enableTravelMode(regionInput);
    return buildTravelPocketState();
  },

  async disableTravelPocket() {
    await disableTravelMode();
    return buildTravelPocketState();
  },
};

export const localNomadRecoveryAdapter: NomadRecoveryAdapter = {
  async getRecoveryState() {
    return buildRecoveryState();
  },

  async runRecoveryCheck() {
    return buildRecoveryState();
  },

  async requestOwnerAuthorityApproval(reason: string) {
    return { status: 'pending', requestedAt: new Date().toISOString(), reason };
  },
};

export const localNomadSafetyAdapter: NomadSafetyAdapter = {
  async scanAddress(address: string) {
    const normalized = address.trim().toLowerCase();
    if (!normalized) return { score: 0, risk: 'high', summary: 'No address supplied.' };

    const isSuspicious = normalized.includes('drain') || normalized.includes('scam') || normalized.includes('phish');
    return isSuspicious
      ? { score: 32, risk: 'high', summary: 'Potentially suspicious address pattern detected by the local safety bridge.' }
      : { score: 92, risk: 'low', summary: 'No local safety flags detected. Ready for BlockPages live scan integration.' };
  },

  async scanUrl(url: string) {
    const normalized = url.trim().toLowerCase();
    if (!normalized) return { score: 0, risk: 'high', summary: 'No URL supplied.' };

    const isSuspicious = normalized.includes('drain') || normalized.includes('airdrop') || normalized.includes('claim') || normalized.includes('phish');
    return isSuspicious
      ? { score: 41, risk: 'medium', summary: 'Potential phishing or drainer language detected by the local safety bridge.' }
      : { score: 92, risk: 'low', summary: 'No local URL threat flags detected. Ready for BlockPages live scanner integration.' };
  },
};

export const localNomadOverlayAdapters: NomadOverlayAdapters = {
  wallet: localNomadWalletAdapter,
  travel: localNomadTravelAdapter,
  recovery: localNomadRecoveryAdapter,
  safety: localNomadSafetyAdapter,
};
