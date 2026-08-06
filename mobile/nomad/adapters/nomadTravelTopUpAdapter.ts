import { secureGetItem, secureSetItem } from '../../services/nativeStubs';

import { localNomadSecurityAdapter } from './localNomadAdapters';
import { nomadTravelAdapter } from './nomadTravelAdapter';
import type {
  NomadAsset,
  NomadSignedTransaction,
  NomadTransactionDraft,
  NomadTravelPocketState,
  NomadWalletSessionState,
} from './walletAdapter';

export type NomadTravelTopUpMode = 'top_up' | 'wallet_transfer';

export type NomadTravelTopUpAsset = {
  symbol: string;
  name: string;
  balance: number;
  balanceLabel: string;
  fiatValueUsd: number;
  fiatValueLabel: string;
  unitPriceUsd: number;
  network?: string;
  chainId?: string;
  accountId?: string;
  quoteAvailable: boolean;
  dataSource: 'wallet_snapshot';
};

export type NomadTravelTopUpQuote = {
  id: string;
  mode: NomadTravelTopUpMode;
  sourceAsset: NomadTravelTopUpAsset;
  amountAsset: number;
  amountAssetLabel: string;
  amountUsd: number;
  amountUsdLabel: string;
  destinationRegion: string;
  destinationStablecoin: string;
  destinationCurrencyCode: string;
  estimatedLocalAmount: number;
  estimatedLocalLabel: string;
  exchangeRate: number;
  exchangeRateSource: 'provider' | 'local_preview';
  networkFeeStatus: 'unavailable';
  networkFeeLabel: string;
  conversionExecutionStatus: 'preview_only';
  requiresWalletApproval: true;
  createdAt: string;
  expiresAt: string;
  status: 'quote' | 'expired';
  dataSource: 'nomad_travel_top_up_adapter';
};

export type NomadTravelTopUpDraftReceipt = {
  id: string;
  quoteId: string;
  mode: NomadTravelTopUpMode;
  sourceAsset: string;
  amountAssetLabel: string;
  estimatedLocalLabel: string;
  walletDraftStatus: NomadSignedTransaction['status'];
  createdAt: string;
  signed: boolean;
  submitted: boolean;
  broadcasted: boolean;
  pocketBalanceUpdated: false;
  failureMessage?: string;
};

export type NomadTravelTopUpEvent = {
  id: string;
  type: 'quote' | 'draft';
  title: string;
  detail: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
};

export type NomadTravelTopUpState = {
  mode: NomadTravelTopUpMode;
  travelPocket: NomadTravelPocketState;
  assets: NomadTravelTopUpAsset[];
  selectedAssetSymbol?: string;
  activeQuote?: NomadTravelTopUpQuote;
  recentDrafts: NomadTravelTopUpDraftReceipt[];
  activity: NomadTravelTopUpEvent[];
  walletSessionStatus: NomadWalletSessionState['status'] | 'unknown';
  walletSessionProviderConnected: boolean;
  frozen: boolean;
  canSelectAsset: boolean;
  canCreateQuote: boolean;
  canCreateDraft: boolean;
  destinationAddressType: 'internal_travel_pocket_intent';
  liveFeeProviderConnected: false;
  executableFxProviderConnected: false;
  signingProvider: 'wallet_adapter';
  dataSource: 'nomad_travel_top_up_adapter';
  persistence: 'in_memory_stub';
  checkedAt: string;
};

export type NomadTravelTopUpAdapter = {
  getTopUpState(input: {
    walletAssets: NomadAsset[];
    walletSession?: NomadWalletSessionState;
    mode?: NomadTravelTopUpMode;
    preferredAssetSymbol?: string;
  }): Promise<NomadTravelTopUpState>;
  createQuote(input: {
    walletAssets: NomadAsset[];
    walletSession?: NomadWalletSessionState;
    mode?: NomadTravelTopUpMode;
    assetSymbol: string;
    amount: string;
  }): Promise<NomadTravelTopUpState>;
  buildWalletDraft(quote: NomadTravelTopUpQuote): Promise<NomadTransactionDraft>;
  recordWalletDraft(
    quote: NomadTravelTopUpQuote,
    result: NomadSignedTransaction,
  ): Promise<NomadTravelTopUpState>;
};

type StoredTopUpState = {
  activeQuote?: NomadTravelTopUpQuote;
  recentDrafts: NomadTravelTopUpDraftReceipt[];
  events: NomadTravelTopUpEvent[];
};

const STORAGE_KEY = 'nomad.travelPocket.top-up';
const MAX_DRAFTS = 20;
const MAX_EVENTS = 40;
const QUOTE_LIFETIME_MS = 90_000;

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function nowIso() {
  return new Date().toISOString();
}

function identifier(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStoredState(): StoredTopUpState {
  return { recentDrafts: [], events: [] };
}

async function loadStoredState(): Promise<StoredTopUpState> {
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return defaultStoredState();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredTopUpState>;
    return {
      activeQuote: parsed.activeQuote,
      recentDrafts: Array.isArray(parsed.recentDrafts) ? parsed.recentDrafts : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return defaultStoredState();
  }
}

async function saveStoredState(state: StoredTopUpState) {
  await secureSetItem(STORAGE_KEY, JSON.stringify({
    ...state,
    recentDrafts: state.recentDrafts.slice(0, MAX_DRAFTS),
    events: state.events.slice(0, MAX_EVENTS),
  }));
}

function appendEvent(
  stored: StoredTopUpState,
  event: Omit<NomadTravelTopUpEvent, 'id' | 'timestamp'>,
): StoredTopUpState {
  return {
    ...stored,
    events: [{ id: identifier('travel-top-up-event'), timestamp: nowIso(), ...event }, ...stored.events].slice(0, MAX_EVENTS),
  };
}

function parseNumber(value?: string) {
  const parsed = Number((value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function assetDecimals(symbol: string) {
  return ['BTC', 'ETH'].includes(symbol.toUpperCase()) ? 8 : 6;
}

function formatAsset(value: number, symbol: string) {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: assetDecimals(symbol),
  })} ${symbol}`;
}

function formatLocal(value: number, travelPocket: NomadTravelPocketState) {
  const code = travelPocket.currencyCode || 'USD';
  const symbol = travelPocket.currencySymbol || '$';
  const fractionDigits = ['JPY', 'NGN', 'INR', 'KRW'].includes(code) ? 0 : 2;
  return `${symbol}${value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })} ${code}`;
}

function normalizeAssets(walletAssets: NomadAsset[]): NomadTravelTopUpAsset[] {
  return walletAssets
    .map((asset) => {
      const symbol = asset.symbol.trim().toUpperCase();
      const balance = parseNumber(asset.balance);
      const fiatValueUsd = parseNumber(asset.fiatValueUsd);
      const unitPriceUsd = balance > 0 && fiatValueUsd > 0 ? fiatValueUsd / balance : 0;
      return {
        symbol,
        name: asset.name || symbol,
        balance,
        balanceLabel: formatAsset(balance, symbol),
        fiatValueUsd,
        fiatValueLabel: USD.format(Math.max(0, fiatValueUsd)),
        unitPriceUsd,
        network: asset.network,
        chainId: asset.chainId,
        accountId: asset.accountId,
        quoteAvailable: balance > 0 && unitPriceUsd > 0,
        dataSource: 'wallet_snapshot' as const,
      };
    })
    .filter((asset) => asset.symbol.length > 0)
    .sort((a, b) => b.fiatValueUsd - a.fiatValueUsd);
}

function quoteStatus(quote?: NomadTravelTopUpQuote): NomadTravelTopUpQuote | undefined {
  if (!quote) return undefined;
  return {
    ...quote,
    status: Date.parse(quote.expiresAt) > Date.now() ? 'quote' : 'expired',
  };
}

function normalizeMode(mode?: NomadTravelTopUpMode): NomadTravelTopUpMode {
  return mode === 'wallet_transfer' ? 'wallet_transfer' : 'top_up';
}

async function freezeStatus() {
  const security = await localNomadSecurityAdapter.getSecurityState();
  return security.freezeStatus === 'full' || security.freezeScope === 'travel_pocket';
}

function walletAllowsDraft(status: NomadTravelTopUpState['walletSessionStatus']) {
  return status !== 'no_wallet'
    && status !== 'locked'
    && status !== 'expired'
    && status !== 'recovery';
}

async function buildState(input: {
  walletAssets: NomadAsset[];
  walletSession?: NomadWalletSessionState;
  mode?: NomadTravelTopUpMode;
  preferredAssetSymbol?: string;
}): Promise<NomadTravelTopUpState> {
  const [travelPocket, stored, frozen] = await Promise.all([
    nomadTravelAdapter.getTravelPocketState(),
    loadStoredState(),
    freezeStatus(),
  ]);
  const assets = normalizeAssets(input.walletAssets);
  const mode = normalizeMode(input.mode);
  const activeQuote = quoteStatus(stored.activeQuote);
  const walletSessionStatus = input.walletSession?.status ?? 'unknown';
  const preferred = input.preferredAssetSymbol?.trim().toUpperCase();
  const selectedAssetSymbol = preferred && assets.some((asset) => asset.symbol === preferred)
    ? preferred
    : activeQuote?.sourceAsset.symbol && assets.some((asset) => asset.symbol === activeQuote.sourceAsset.symbol)
      ? activeQuote.sourceAsset.symbol
      : undefined;

  return {
    mode,
    travelPocket,
    assets,
    selectedAssetSymbol,
    activeQuote,
    recentDrafts: stored.recentDrafts,
    activity: stored.events,
    walletSessionStatus,
    walletSessionProviderConnected: Boolean(input.walletSession),
    frozen,
    canSelectAsset: !frozen && assets.length > 0,
    canCreateQuote: !frozen && assets.some((asset) => asset.quoteAvailable),
    canCreateDraft: Boolean(activeQuote?.status === 'quote' && !frozen && walletAllowsDraft(walletSessionStatus)),
    destinationAddressType: 'internal_travel_pocket_intent',
    liveFeeProviderConnected: false,
    executableFxProviderConnected: false,
    signingProvider: 'wallet_adapter',
    dataSource: 'nomad_travel_top_up_adapter',
    persistence: 'in_memory_stub',
    checkedAt: nowIso(),
  };
}

async function createQuote(input: {
  walletAssets: NomadAsset[];
  walletSession?: NomadWalletSessionState;
  mode?: NomadTravelTopUpMode;
  assetSymbol: string;
  amount: string;
}) {
  const before = await buildState(input);
  if (before.frozen) throw new Error('Emergency Freeze currently blocks Travel Pocket funding.');

  const symbol = input.assetSymbol.trim().toUpperCase();
  const asset = before.assets.find((item) => item.symbol === symbol);
  if (!asset) throw new Error('Choose an asset from the connected wallet snapshot.');
  if (!asset.quoteAvailable) throw new Error(`${asset.symbol} does not have enough wallet price data to calculate a funding preview.`);

  const amountAsset = Number(input.amount);
  if (!Number.isFinite(amountAsset) || amountAsset <= 0) throw new Error('Enter an amount greater than zero.');
  if (amountAsset > asset.balance) throw new Error(`The amount exceeds the available ${asset.symbol} balance.`);

  const amountUsd = amountAsset * asset.unitPriceUsd;
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) throw new Error('Unable to calculate the current USD snapshot value.');

  const exchangeRate = before.travelPocket.exchangeRate ?? 1;
  const createdAt = nowIso();
  const quote: NomadTravelTopUpQuote = {
    id: identifier('travel-top-up-quote'),
    mode: normalizeMode(input.mode),
    sourceAsset: asset,
    amountAsset,
    amountAssetLabel: formatAsset(amountAsset, asset.symbol),
    amountUsd,
    amountUsdLabel: USD.format(amountUsd),
    destinationRegion: before.travelPocket.regionInput || 'Global',
    destinationStablecoin: before.travelPocket.localCurrency || before.travelPocket.preferredStablecoin || 'USD Stable',
    destinationCurrencyCode: before.travelPocket.currencyCode || 'USD',
    estimatedLocalAmount: amountUsd * exchangeRate,
    estimatedLocalLabel: formatLocal(amountUsd * exchangeRate, before.travelPocket),
    exchangeRate,
    exchangeRateSource: before.travelPocket.exchangeRateSource || 'local_preview',
    networkFeeStatus: 'unavailable',
    networkFeeLabel: 'Calculated by the wallet at signing review',
    conversionExecutionStatus: 'preview_only',
    requiresWalletApproval: true,
    createdAt,
    expiresAt: new Date(Date.now() + QUOTE_LIFETIME_MS).toISOString(),
    status: 'quote',
    dataSource: 'nomad_travel_top_up_adapter',
  };

  let stored = await loadStoredState();
  stored = appendEvent({ ...stored, activeQuote: quote }, {
    type: 'quote',
    title: 'Travel Pocket funding preview created',
    detail: `${quote.amountAssetLabel} • ${quote.estimatedLocalLabel} preview • fee unavailable • not signed`,
    severity: quote.exchangeRateSource === 'provider' ? 'info' : 'warning',
  });
  await saveStoredState(stored);

  return buildState({
    walletAssets: input.walletAssets,
    walletSession: input.walletSession,
    mode: quote.mode,
    preferredAssetSymbol: asset.symbol,
  });
}

async function buildWalletDraft(quote: NomadTravelTopUpQuote): Promise<NomadTransactionDraft> {
  if (quote.status === 'expired' || Date.parse(quote.expiresAt) <= Date.now()) {
    throw new Error('The Travel Pocket funding preview expired. Create a new quote before continuing.');
  }
  if (await freezeStatus()) throw new Error('Emergency Freeze currently blocks Travel Pocket funding.');

  return {
    fromAsset: quote.sourceAsset.symbol,
    toAddress: `nomad-travel-pocket:${quote.destinationCurrencyCode.toLowerCase()}`,
    amount: String(quote.amountAsset),
    networkFee: 'Unavailable until wallet signing review',
    memo: `${quote.mode === 'wallet_transfer' ? 'Wallet transfer to' : 'Top up'} Travel Pocket • ${quote.destinationRegion} • quote ${quote.id}`,
    chainId: quote.sourceAsset.chainId,
    fromAccountId: quote.sourceAsset.accountId,
    intent: 'travel_pocket_top_up',
    requiresUserApproval: true,
    createdBy: 'nomad_overlay',
  };
}

async function recordWalletDraft(
  quote: NomadTravelTopUpQuote,
  result: NomadSignedTransaction,
) {
  const signed = result.status === 'signed' || result.status === 'submitted' || result.status === 'broadcasted';
  const submitted = result.status === 'submitted' || result.status === 'broadcasted';
  const broadcasted = result.status === 'broadcasted';
  const receipt: NomadTravelTopUpDraftReceipt = {
    id: identifier('travel-top-up-draft'),
    quoteId: quote.id,
    mode: quote.mode,
    sourceAsset: quote.sourceAsset.symbol,
    amountAssetLabel: quote.amountAssetLabel,
    estimatedLocalLabel: quote.estimatedLocalLabel,
    walletDraftStatus: result.status,
    createdAt: nowIso(),
    signed,
    submitted,
    broadcasted,
    pocketBalanceUpdated: false,
    failureMessage: result.failure?.message,
  };

  let stored = await loadStoredState();
  stored = appendEvent({
    ...stored,
    activeQuote: undefined,
    recentDrafts: [receipt, ...stored.recentDrafts].slice(0, MAX_DRAFTS),
  }, {
    type: 'draft',
    title: result.status === 'failed' ? 'Travel Pocket draft failed' : 'Travel Pocket wallet draft recorded',
    detail: result.status === 'failed'
      ? `${quote.amountAssetLabel} • ${result.failure?.message || 'wallet adapter failure'}`
      : `${quote.amountAssetLabel} • wallet status ${result.status} • pocket balance unchanged`,
    severity: result.status === 'failed' ? 'critical' : broadcasted ? 'info' : 'warning',
  });
  await saveStoredState(stored);

  return buildState({
    walletAssets: [
      {
        symbol: quote.sourceAsset.symbol,
        name: quote.sourceAsset.name,
        balance: String(quote.sourceAsset.balance),
        fiatValueUsd: quote.sourceAsset.fiatValueLabel,
        network: quote.sourceAsset.network,
        chainId: quote.sourceAsset.chainId,
        accountId: quote.sourceAsset.accountId,
      },
    ],
    mode: quote.mode,
    preferredAssetSymbol: quote.sourceAsset.symbol,
  });
}

export const nomadTravelTopUpAdapter: NomadTravelTopUpAdapter = {
  getTopUpState: buildState,
  createQuote,
  buildWalletDraft,
  recordWalletDraft,
};
