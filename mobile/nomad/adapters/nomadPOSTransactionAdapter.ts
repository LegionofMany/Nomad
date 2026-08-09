import { secureGetItem, secureSetItem } from '../../services/nativeStubs';
import { getWalletStatus } from '../../services/walletService';

import { localNomadSecurityAdapter } from './localNomadAdapters';
import { nomadTravelAdapter } from './nomadTravelAdapter';
import type {
  NomadAsset,
  NomadSignedTransaction,
  NomadTransactionDraft,
  NomadTravelPocketState,
  NomadWalletSessionState,
} from './walletAdapter';

export type NomadPOSSource = 'travel_pocket' | 'travel_qr' | 'manual';
export type NomadPOSCheckStatus = 'pass' | 'warning' | 'fail' | 'unavailable';

export type NomadPOSMerchantRequest = {
  id: string;
  source: NomadPOSSource;
  merchantName: string;
  merchantId: string;
  terminalId: string;
  amountLocal: number;
  currencyCode: string;
  region?: string;
  nonce: string;
  memo?: string;
  createdAt?: string;
  expiresAt: string;
  signaturePresent: boolean;
  containsSecrets: false;
};

export type NomadPOSPaymentAsset = {
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
};

export type NomadPOSCheck = {
  id:
    | 'request_structure'
    | 'request_expiry'
    | 'region_currency'
    | 'travel_mode'
    | 'spending_limits'
    | 'merchant_identity'
    | 'request_signature'
    | 'replay_protection'
    | 'wallet_session'
    | 'emergency_freeze';
  label: string;
  status: NomadPOSCheckStatus;
  detail: string;
  provider: string;
};

export type NomadPOSQuote = {
  id: string;
  request: NomadPOSMerchantRequest;
  sourceAsset: NomadPOSPaymentAsset;
  amountUsd: number;
  amountUsdLabel: string;
  amountAsset: number;
  amountAssetLabel: string;
  localAmountLabel: string;
  exchangeRate: number;
  exchangeRateSource: 'provider' | 'local_preview';
  networkFeeStatus: 'unavailable';
  networkFeeLabel: string;
  merchantIdentityVerified: false;
  requestSignatureVerified: false;
  requiresWalletApproval: true;
  paymentCompleted: false;
  createdAt: string;
  expiresAt: string;
  status: 'quote' | 'expired';
};

export type NomadPOSDraftReceipt = {
  id: string;
  quoteId: string;
  requestId: string;
  nonce: string;
  merchantName: string;
  terminalId: string;
  sourceAsset: string;
  amountAssetLabel: string;
  localAmountLabel: string;
  walletDraftStatus: NomadSignedTransaction['status'];
  signed: boolean;
  submitted: boolean;
  broadcasted: boolean;
  paymentCompleted: false;
  settlementConfirmed: false;
  createdAt: string;
  failureMessage?: string;
};

export type NomadPOSEvent = {
  id: string;
  type: 'request' | 'quote' | 'draft' | 'replay';
  title: string;
  detail: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
};

export type NomadPOSState = {
  source: NomadPOSSource;
  travelPocket: NomadTravelPocketState;
  request?: NomadPOSMerchantRequest;
  assets: NomadPOSPaymentAsset[];
  selectedAssetSymbol?: string;
  activeQuote?: NomadPOSQuote;
  recentDrafts: NomadPOSDraftReceipt[];
  activity: NomadPOSEvent[];
  checks: NomadPOSCheck[];
  walletSessionStatus: NomadWalletSessionState['status'] | 'unknown';
  walletSessionProvider: 'wallet_adapter' | 'local_wallet_service' | 'unavailable';
  frozen: boolean;
  requestValid: boolean;
  limitsSatisfied: boolean;
  nonceUsed: boolean;
  canCreateQuote: boolean;
  canCreateDraft: boolean;
  remoteMerchantRegistryConnected: false;
  requestSignatureProviderConnected: false;
  liveFeeProviderConnected: false;
  settlementProviderConnected: false;
  dataSource: 'nomad_pos_transaction_adapter';
  persistence: 'in_memory_stub';
  checkedAt: string;
};

export type NomadPOSTransactionAdapter = {
  getPOSState(input: {
    walletAssets: NomadAsset[];
    walletSession?: NomadWalletSessionState;
    source?: NomadPOSSource;
    paymentRequest?: string;
    region?: string;
    preferredAssetSymbol?: string;
  }): Promise<NomadPOSState>;
  parsePaymentRequest(raw: string, source?: NomadPOSSource): Promise<NomadPOSMerchantRequest>;
  createQuote(input: {
    walletAssets: NomadAsset[];
    walletSession?: NomadWalletSessionState;
    source?: NomadPOSSource;
    paymentRequest: string;
    region?: string;
    assetSymbol: string;
  }): Promise<NomadPOSState>;
  buildWalletDraft(quote: NomadPOSQuote): Promise<NomadTransactionDraft>;
  recordWalletDraft(quote: NomadPOSQuote, result: NomadSignedTransaction): Promise<NomadPOSState>;
};

type StoredPOSState = {
  activeRequest?: NomadPOSMerchantRequest;
  activeQuote?: NomadPOSQuote;
  drafts: NomadPOSDraftReceipt[];
  events: NomadPOSEvent[];
};

const STORAGE_KEY = 'nomad.travel-pos';
const QUOTE_LIFETIME_MS = 60_000;
const MAX_DRAFTS = 30;
const MAX_EVENTS = 60;
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

function defaultStoredState(): StoredPOSState {
  return { drafts: [], events: [] };
}

async function loadStoredState(): Promise<StoredPOSState> {
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return defaultStoredState();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredPOSState>;
    return {
      activeRequest: parsed.activeRequest,
      activeQuote: parsed.activeQuote,
      drafts: Array.isArray(parsed.drafts) ? parsed.drafts : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return defaultStoredState();
  }
}

async function saveStoredState(state: StoredPOSState) {
  await secureSetItem(STORAGE_KEY, JSON.stringify({
    ...state,
    drafts: state.drafts.slice(0, MAX_DRAFTS),
    events: state.events.slice(0, MAX_EVENTS),
  }));
}

function appendEvent(
  stored: StoredPOSState,
  event: Omit<NomadPOSEvent, 'id' | 'timestamp'>,
): StoredPOSState {
  return {
    ...stored,
    events: [{ id: identifier('pos-event'), timestamp: nowIso(), ...event }, ...stored.events].slice(0, MAX_EVENTS),
  };
}

function cleanText(value: unknown, max = 160) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanSource(value?: NomadPOSSource): NomadPOSSource {
  return value === 'travel_qr' || value === 'travel_pocket' ? value : 'manual';
}

function valueFrom(object: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = object[key];
    if (value !== undefined && value !== null && String(value).trim()) return value;
  }
  return undefined;
}

function parsePipeRequest(raw: string): Record<string, unknown> | null {
  const parts = raw.split('|').map((item) => item.trim());
  if (parts.length < 8 || parts[0].toUpperCase() !== 'NOMADPOS') return null;
  return {
    merchantName: parts[1],
    merchantId: parts[2],
    terminalId: parts[3],
    amount: parts[4],
    currency: parts[5],
    region: parts[6],
    expiresAt: parts[7],
    nonce: parts[8],
    memo: parts[9],
  };
}

function parseUriRequest(raw: string): Record<string, unknown> | null {
  if (!/^nomadpos:\/\//i.test(raw)) return null;
  try {
    const parsed = new URL(raw);
    const query = parsed.searchParams;
    return {
      merchantName: query.get('merchant') || query.get('merchantName'),
      merchantId: query.get('merchantId') || parsed.hostname,
      terminalId: query.get('terminal') || query.get('terminalId'),
      amount: query.get('amount'),
      currency: query.get('currency'),
      region: query.get('region'),
      expiresAt: query.get('expires') || query.get('expiresAt'),
      createdAt: query.get('created') || query.get('createdAt'),
      nonce: query.get('nonce'),
      memo: query.get('memo'),
      signature: query.get('signature'),
    };
  } catch {
    return null;
  }
}

function parseRawObject(raw: string): Record<string, unknown> {
  const value = raw.trim();
  if (!value) throw new Error('Enter or scan a merchant POS request before continuing.');
  if (value.length > 4_000) throw new Error('The merchant POS request is too large.');

  if (value.startsWith('{')) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid object');
      return parsed as Record<string, unknown>;
    } catch {
      throw new Error('The merchant POS JSON request is invalid.');
    }
  }

  const uri = parseUriRequest(value);
  if (uri) return uri;
  const pipe = parsePipeRequest(value);
  if (pipe) return pipe;
  throw new Error('Unsupported POS request. Use Nomad POS JSON, nomadpos://, or NOMADPOS pipe format.');
}

function normalizeRequest(raw: string, source?: NomadPOSSource): NomadPOSMerchantRequest {
  const object = parseRawObject(raw);
  const merchantName = cleanText(valueFrom(object, 'merchantName', 'merchant', 'name'), 100);
  const merchantId = cleanText(valueFrom(object, 'merchantId', 'merchant_id'), 100);
  const terminalId = cleanText(valueFrom(object, 'terminalId', 'terminal', 'terminal_id'), 100);
  const currencyCode = cleanText(valueFrom(object, 'currencyCode', 'currency'), 8).toUpperCase();
  const region = cleanText(valueFrom(object, 'region', 'location'), 100) || undefined;
  const nonce = cleanText(valueFrom(object, 'nonce', 'requestNonce', 'request_id'), 120);
  const memo = cleanText(valueFrom(object, 'memo', 'note'), 240) || undefined;
  const createdAt = cleanText(valueFrom(object, 'createdAt', 'created'), 80) || undefined;
  const expiresAt = cleanText(valueFrom(object, 'expiresAt', 'expires', 'expiry'), 80);
  const signature = cleanText(valueFrom(object, 'signature', 'sig'), 1_000);
  const amountLocal = Number(valueFrom(object, 'amountLocal', 'amount', 'total'));

  if (merchantName.length < 2) throw new Error('The merchant request is missing a valid merchant name.');
  if (merchantId.length < 3) throw new Error('The merchant request is missing a valid merchant ID.');
  if (terminalId.length < 3) throw new Error('The merchant request is missing a valid terminal ID.');
  if (!Number.isFinite(amountLocal) || amountLocal <= 0 || amountLocal > 1_000_000_000) {
    throw new Error('The merchant request contains an invalid payment amount.');
  }
  if (!/^[A-Z0-9]{3,8}$/.test(currencyCode)) throw new Error('The merchant request contains an invalid currency code.');
  if (nonce.length < 8) throw new Error('The merchant request needs a unique nonce of at least eight characters.');

  const expiry = Date.parse(expiresAt);
  if (!Number.isFinite(expiry)) throw new Error('The merchant request is missing a valid expiry time.');
  if (expiry <= Date.now()) throw new Error('The merchant POS request has expired.');
  if (expiry - Date.now() > 24 * 60 * 60 * 1_000) {
    throw new Error('The merchant POS request expiry is more than 24 hours away and cannot be accepted.');
  }

  return {
    id: cleanText(valueFrom(object, 'id', 'requestId'), 120) || `pos-${nonce.slice(0, 12)}`,
    source: cleanSource(source),
    merchantName,
    merchantId,
    terminalId,
    amountLocal,
    currencyCode,
    region,
    nonce,
    memo,
    createdAt,
    expiresAt: new Date(expiry).toISOString(),
    signaturePresent: Boolean(signature),
    containsSecrets: false,
  };
}

function parseMoney(value?: string) {
  const parsed = Number((value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatLocal(value: number, pocket: NomadTravelPocketState) {
  const code = pocket.currencyCode || 'USD';
  const symbol = pocket.currencySymbol || '';
  const digits = ['JPY', 'NGN', 'INR', 'KRW'].includes(code) ? 0 : 2;
  return `${symbol}${value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} ${code}`;
}

function normalizeAssets(walletAssets: NomadAsset[]): NomadPOSPaymentAsset[] {
  return walletAssets.map((asset) => {
    const balance = Number(asset.balance);
    const fiatValueUsd = parseMoney(asset.fiatValueUsd);
    const unitPriceUsd = Number.isFinite(balance) && balance > 0 ? fiatValueUsd / balance : 0;
    const symbol = asset.symbol.trim().toUpperCase();
    return {
      symbol,
      name: asset.name || symbol,
      balance: Number.isFinite(balance) && balance >= 0 ? balance : 0,
      balanceLabel: `${Number.isFinite(balance) ? asset.balance : '0'} ${symbol}`,
      fiatValueUsd,
      fiatValueLabel: asset.fiatValueUsd || USD.format(0),
      unitPriceUsd: Number.isFinite(unitPriceUsd) ? unitPriceUsd : 0,
      network: asset.network,
      chainId: asset.chainId,
      accountId: asset.accountId,
      quoteAvailable: Number.isFinite(balance) && balance > 0 && fiatValueUsd > 0 && unitPriceUsd > 0,
    };
  });
}

function quoteStatus(quote?: NomadPOSQuote) {
  if (!quote) return undefined;
  if (Date.parse(quote.expiresAt) <= Date.now()) return { ...quote, status: 'expired' as const };
  return quote;
}

async function resolveWalletSession(walletSession?: NomadWalletSessionState) {
  if (walletSession) {
    return { status: walletSession.status as NomadPOSState['walletSessionStatus'], provider: 'wallet_adapter' as const };
  }
  try {
    const status = await getWalletStatus();
    return { status: status as NomadPOSState['walletSessionStatus'], provider: 'local_wallet_service' as const };
  } catch {
    return { status: 'unknown' as const, provider: 'unavailable' as const };
  }
}

function sessionAllowsDraft(status: NomadPOSState['walletSessionStatus']) {
  return status === 'unlocked';
}

function sameRegion(left?: string, right?: string) {
  if (!left || !right) return true;
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function buildChecks(input: {
  request?: NomadPOSMerchantRequest;
  pocket: NomadTravelPocketState;
  frozen: boolean;
  nonceUsed: boolean;
  walletStatus: NomadPOSState['walletSessionStatus'];
}) {
  const { request, pocket, frozen, nonceUsed, walletStatus } = input;
  const currencyMatches = Boolean(request && request.currencyCode === (pocket.currencyCode || 'USD').toUpperCase());
  const regionMatches = Boolean(request && sameRegion(request.region, pocket.regionInput));
  const remainingToday = parseMoney(pocket.remainingTodayLocal || pocket.dailyLimitLocal);
  const balanceLocal = parseMoney(pocket.pocketBalanceLocal);
  const limitsSatisfied = Boolean(request && request.amountLocal <= remainingToday && request.amountLocal <= balanceLocal);
  const expiryValid = Boolean(request && Date.parse(request.expiresAt) > Date.now());

  const checks: NomadPOSCheck[] = [
    {
      id: 'request_structure',
      label: 'Merchant request structure',
      status: request ? 'pass' : 'fail',
      detail: request
        ? 'Merchant, terminal, amount, currency, nonce and expiry fields passed local structural validation.'
        : 'A supported merchant POS request has not been parsed.',
      provider: 'Nomad local POS parser',
    },
    {
      id: 'request_expiry',
      label: 'Request expiry',
      status: expiryValid ? 'pass' : 'fail',
      detail: request
        ? expiryValid ? `Request expires ${new Date(request.expiresAt).toLocaleString()}.` : 'The merchant request has expired.'
        : 'No request expiry is available.',
      provider: 'Device-local clock',
    },
    {
      id: 'region_currency',
      label: 'Region and currency match',
      status: request && currencyMatches && regionMatches ? 'pass' : 'fail',
      detail: !request
        ? 'No merchant request is available.'
        : !currencyMatches
          ? `Request currency ${request.currencyCode} does not match Travel Pocket currency ${pocket.currencyCode || 'USD'}.`
          : !regionMatches
            ? `Request region ${request.region} does not match selected Travel Pocket region ${pocket.regionInput || 'Global'}.`
            : 'The request matches the selected Travel Pocket region and currency.',
      provider: 'Nomad Travel Pocket adapter',
    },
    {
      id: 'travel_mode',
      label: 'Travel Mode active',
      status: pocket.enabled ? 'pass' : 'fail',
      detail: pocket.enabled ? 'Travel Mode is active for the selected region.' : 'Activate Travel Mode before creating a POS payment draft.',
      provider: 'Nomad Travel Pocket adapter',
    },
    {
      id: 'spending_limits',
      label: 'Pocket balance and daily limit',
      status: limitsSatisfied ? 'pass' : 'fail',
      detail: !request
        ? 'No payment amount is available.'
        : limitsSatisfied
          ? `The request is within the displayed pocket balance and remaining daily limit.`
          : `Requested ${formatLocal(request.amountLocal, pocket)} exceeds the displayed balance or remaining daily limit.`,
      provider: pocket.dataSource === 'connected' ? 'Connected Travel Pocket ledger' : 'Travel Pocket preview state',
    },
    {
      id: 'merchant_identity',
      label: 'Merchant identity',
      status: 'unavailable',
      detail: 'No remote merchant directory, certificate authority or Reqrium merchant-reputation provider is connected.',
      provider: 'Not connected',
    },
    {
      id: 'request_signature',
      label: 'Merchant request signature',
      status: 'unavailable',
      detail: request?.signaturePresent
        ? 'A signature field is present, but no merchant public-key registry or signature verifier is connected.'
        : 'No merchant signature is present and no signature verifier is connected.',
      provider: 'Not connected',
    },
    {
      id: 'replay_protection',
      label: 'Local replay protection',
      status: nonceUsed ? 'fail' : request ? 'pass' : 'warning',
      detail: nonceUsed
        ? 'This request nonce already has a local wallet-draft receipt and cannot be reused.'
        : request ? 'The request nonce has not been used in the local POS receipt history.' : 'No nonce is available.',
      provider: 'Nomad local POS receipt store',
    },
    {
      id: 'wallet_session',
      label: 'Wallet session',
      status: walletStatus === 'unlocked' ? 'pass' : walletStatus === 'unknown' ? 'warning' : 'fail',
      detail: walletStatus === 'unlocked'
        ? 'The wallet session is unlocked for reviewable draft creation.'
        : walletStatus === 'unknown'
          ? 'Wallet session status could not be verified.'
          : `Wallet session is ${walletStatus}; unlock the wallet before continuing.`,
      provider: 'Wallet session boundary',
    },
    {
      id: 'emergency_freeze',
      label: 'Emergency Freeze',
      status: frozen ? 'fail' : 'pass',
      detail: frozen ? 'Emergency Freeze blocks Travel Pocket payments.' : 'No wallet or Travel Pocket freeze blocks this draft.',
      provider: 'Nomad Security adapter',
    },
  ];

  return { checks, limitsSatisfied, currencyMatches, regionMatches, expiryValid };
}

async function buildState(input: {
  walletAssets: NomadAsset[];
  walletSession?: NomadWalletSessionState;
  source?: NomadPOSSource;
  paymentRequest?: string;
  region?: string;
  preferredAssetSymbol?: string;
}): Promise<NomadPOSState> {
  const [pocket, security, stored, wallet] = await Promise.all([
    nomadTravelAdapter.getTravelPocketState(),
    localNomadSecurityAdapter.getSecurityState(),
    loadStoredState(),
    resolveWalletSession(input.walletSession),
  ]);
  const frozen = security.freezeStatus === 'full' || security.freezeScope === 'travel_pocket';
  const source = cleanSource(input.source);
  let request = stored.activeRequest;
  if (input.paymentRequest?.trim()) request = normalizeRequest(input.paymentRequest, source);
  const activeQuote = quoteStatus(stored.activeQuote);
  const assets = normalizeAssets(input.walletAssets);
  const nonceUsed = Boolean(request && stored.drafts.some((item) => item.nonce === request?.nonce && item.walletDraftStatus !== 'failed'));
  const evaluation = buildChecks({ request, pocket, frozen, nonceUsed, walletStatus: wallet.status });
  const requestValid = Boolean(
    request
      && evaluation.currencyMatches
      && evaluation.regionMatches
      && evaluation.expiryValid
      && pocket.enabled
      && !nonceUsed,
  );
  const preferred = input.preferredAssetSymbol?.trim().toUpperCase();
  const selectedAssetSymbol = preferred && assets.some((item) => item.symbol === preferred)
    ? preferred
    : activeQuote?.sourceAsset.symbol && assets.some((item) => item.symbol === activeQuote.sourceAsset.symbol)
      ? activeQuote.sourceAsset.symbol
      : undefined;

  return {
    source,
    travelPocket: pocket,
    request,
    assets,
    selectedAssetSymbol,
    activeQuote,
    recentDrafts: stored.drafts,
    activity: stored.events,
    checks: evaluation.checks,
    walletSessionStatus: wallet.status,
    walletSessionProvider: wallet.provider,
    frozen,
    requestValid,
    limitsSatisfied: evaluation.limitsSatisfied,
    nonceUsed,
    canCreateQuote: Boolean(requestValid && evaluation.limitsSatisfied && !frozen && assets.some((item) => item.quoteAvailable)),
    canCreateDraft: Boolean(
      activeQuote?.status === 'quote'
        && requestValid
        && evaluation.limitsSatisfied
        && !frozen
        && sessionAllowsDraft(wallet.status),
    ),
    remoteMerchantRegistryConnected: false,
    requestSignatureProviderConnected: false,
    liveFeeProviderConnected: false,
    settlementProviderConnected: false,
    dataSource: 'nomad_pos_transaction_adapter',
    persistence: 'in_memory_stub',
    checkedAt: nowIso(),
  };
}

async function parsePaymentRequest(raw: string, source?: NomadPOSSource) {
  const request = normalizeRequest(raw, source);
  let stored = await loadStoredState();
  stored = appendEvent({ ...stored, activeRequest: request, activeQuote: undefined }, {
    type: 'request',
    title: 'Merchant POS request parsed',
    detail: `${request.merchantName} • ${request.amountLocal} ${request.currencyCode} • expires ${request.expiresAt} • identity unverified`,
    severity: 'warning',
  });
  await saveStoredState(stored);
  return request;
}

async function createQuote(input: {
  walletAssets: NomadAsset[];
  walletSession?: NomadWalletSessionState;
  source?: NomadPOSSource;
  paymentRequest: string;
  region?: string;
  assetSymbol: string;
}) {
  const request = await parsePaymentRequest(input.paymentRequest, input.source);
  const before = await buildState({ ...input, paymentRequest: undefined });
  if (before.frozen) throw new Error('Emergency Freeze currently blocks Travel Pocket payments.');
  if (!before.requestValid) throw new Error('The merchant request failed expiry, replay, region, currency or Travel Mode validation.');
  if (!before.limitsSatisfied) throw new Error('The payment exceeds the displayed Travel Pocket balance or daily limit.');

  const asset = before.assets.find((item) => item.symbol === input.assetSymbol.trim().toUpperCase());
  if (!asset) throw new Error('Choose a payment asset from the connected wallet snapshot.');
  if (!asset.quoteAvailable) throw new Error(`${asset.symbol} does not have enough wallet price data to calculate a payment preview.`);

  const exchangeRate = before.travelPocket.exchangeRate ?? 1;
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) throw new Error('The Travel Pocket exchange-rate preview is unavailable.');
  const amountUsd = request.amountLocal / exchangeRate;
  const amountAsset = amountUsd / asset.unitPriceUsd;
  if (!Number.isFinite(amountAsset) || amountAsset <= 0) throw new Error('Unable to calculate the source-asset amount.');
  if (amountAsset > asset.balance) throw new Error(`The payment requires more ${asset.symbol} than the connected wallet balance.`);

  const createdAt = nowIso();
  const quote: NomadPOSQuote = {
    id: identifier('pos-quote'),
    request,
    sourceAsset: asset,
    amountUsd,
    amountUsdLabel: USD.format(amountUsd),
    amountAsset,
    amountAssetLabel: `${amountAsset.toFixed(['BTC', 'ETH'].includes(asset.symbol) ? 8 : 6).replace(/0+$/, '').replace(/\.$/, '')} ${asset.symbol}`,
    localAmountLabel: formatLocal(request.amountLocal, before.travelPocket),
    exchangeRate,
    exchangeRateSource: before.travelPocket.exchangeRateSource || 'local_preview',
    networkFeeStatus: 'unavailable',
    networkFeeLabel: 'Calculated by the wallet at signing review',
    merchantIdentityVerified: false,
    requestSignatureVerified: false,
    requiresWalletApproval: true,
    paymentCompleted: false,
    createdAt,
    expiresAt: new Date(Math.min(Date.parse(request.expiresAt), Date.now() + QUOTE_LIFETIME_MS)).toISOString(),
    status: 'quote',
  };

  let stored = await loadStoredState();
  stored = appendEvent({ ...stored, activeRequest: request, activeQuote: quote }, {
    type: 'quote',
    title: 'POS payment preview created',
    detail: `${request.merchantName} • ${quote.localAmountLabel} • ${quote.amountAssetLabel} • fee unavailable • not signed`,
    severity: 'warning',
  });
  await saveStoredState(stored);

  return buildState({
    walletAssets: input.walletAssets,
    walletSession: input.walletSession,
    source: input.source,
    region: input.region,
    preferredAssetSymbol: asset.symbol,
  });
}

async function buildWalletDraft(quote: NomadPOSQuote): Promise<NomadTransactionDraft> {
  if (quote.status === 'expired' || Date.parse(quote.expiresAt) <= Date.now()) {
    throw new Error('The POS payment preview expired. Re-scan the merchant request and create a new preview.');
  }
  const security = await localNomadSecurityAdapter.getSecurityState();
  if (security.freezeStatus === 'full' || security.freezeScope === 'travel_pocket') {
    throw new Error('Emergency Freeze currently blocks Travel Pocket payments.');
  }
  const stored = await loadStoredState();
  if (stored.drafts.some((item) => item.nonce === quote.request.nonce && item.walletDraftStatus !== 'failed')) {
    const replayEvent: NomadPOSEvent = {
      id: identifier('pos-event'),
      type: 'replay',
      title: 'Duplicate POS request blocked',
      detail: `${quote.request.merchantName} • nonce ${quote.request.nonce.slice(0, 8)}… already has a local wallet-draft receipt`,
      timestamp: nowIso(),
      severity: 'critical',
    };
    stored.events = [replayEvent, ...stored.events].slice(0, MAX_EVENTS);
    await saveStoredState(stored);
    throw new Error('This merchant request nonce has already been used locally.');
  }

  return {
    fromAsset: quote.sourceAsset.symbol,
    toAddress: `nomad-pos:${quote.request.merchantId}:${quote.request.terminalId}`,
    amount: String(quote.amountAsset),
    networkFee: 'Unavailable until wallet signing review',
    memo: `${quote.request.merchantName} • request ${quote.request.id} • nonce ${quote.request.nonce}${quote.request.memo ? ` • ${quote.request.memo}` : ''}`,
    chainId: quote.sourceAsset.chainId,
    fromAccountId: quote.sourceAsset.accountId,
    intent: 'pos_approval',
    requiresUserApproval: true,
    createdBy: 'nomad_overlay',
  };
}

async function recordWalletDraft(quote: NomadPOSQuote, result: NomadSignedTransaction) {
  const signed = result.status === 'signed' || result.status === 'submitted' || result.status === 'broadcasted';
  const submitted = result.status === 'submitted' || result.status === 'broadcasted';
  const broadcasted = result.status === 'broadcasted';
  const receipt: NomadPOSDraftReceipt = {
    id: identifier('pos-draft'),
    quoteId: quote.id,
    requestId: quote.request.id,
    nonce: quote.request.nonce,
    merchantName: quote.request.merchantName,
    terminalId: quote.request.terminalId,
    sourceAsset: quote.sourceAsset.symbol,
    amountAssetLabel: quote.amountAssetLabel,
    localAmountLabel: quote.localAmountLabel,
    walletDraftStatus: result.status,
    signed,
    submitted,
    broadcasted,
    paymentCompleted: false,
    settlementConfirmed: false,
    createdAt: nowIso(),
    failureMessage: result.failure?.message,
  };

  let stored = await loadStoredState();
  stored = appendEvent({
    ...stored,
    activeQuote: undefined,
    drafts: [receipt, ...stored.drafts].slice(0, MAX_DRAFTS),
  }, {
    type: 'draft',
    title: result.status === 'failed' ? 'POS wallet draft failed' : 'POS wallet draft recorded',
    detail: result.status === 'failed'
      ? `${quote.request.merchantName} • ${result.failure?.message || 'wallet adapter failure'}`
      : `${quote.request.merchantName} • wallet status ${result.status} • payment and settlement unconfirmed`,
    severity: result.status === 'failed' ? 'critical' : broadcasted ? 'warning' : 'warning',
  });
  await saveStoredState(stored);

  return buildState({
    walletAssets: [{
      symbol: quote.sourceAsset.symbol,
      name: quote.sourceAsset.name,
      balance: String(quote.sourceAsset.balance),
      fiatValueUsd: quote.sourceAsset.fiatValueLabel,
      network: quote.sourceAsset.network,
      chainId: quote.sourceAsset.chainId,
      accountId: quote.sourceAsset.accountId,
    }],
    source: quote.request.source,
    preferredAssetSymbol: quote.sourceAsset.symbol,
  });
}

export const nomadPOSTransactionAdapter: NomadPOSTransactionAdapter = {
  getPOSState: buildState,
  parsePaymentRequest,
  createQuote,
  buildWalletDraft,
  recordWalletDraft,
};
