import { disableTravelMode, enableTravelMode, getPortfolio, getTravelState } from '../../services/walletService';
import { secureGetItem, secureSetItem } from '../../services/nativeStubs';

import { localNomadSecurityAdapter } from './localNomadAdapters';
import type {
  NomadTravelAdapter,
  NomadTravelFundingSource,
  NomadTravelPocketState,
  NomadTravelPocketTransaction,
} from './walletAdapter';

const STORAGE_KEY = 'nomad.travelPocket.extended';
const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type RegionDefinition = {
  name: string;
  aliases: RegExp;
  stablecoin: string;
  code: string;
  symbol: string;
  previewRate: number;
  dailyLimitUsd: number;
  locale: string;
};

type StoredTravelPocket = {
  regionInput: string;
  autoConvertEnabled: boolean;
  pocketBalanceUsd: number;
  expiresAt: string;
  selectedAt: string;
};

const regions: RegionDefinition[] = [
  { name: 'Global', aliases: /global|worldwide/i, stablecoin: 'USD Stable', code: 'USD', symbol: '$', previewRate: 1, dailyLimitUsd: 500, locale: 'en-US' },
  { name: 'Canada', aliases: /canada|toronto|vancouver|montreal|alberta|ontario|quebec/i, stablecoin: 'CAD Stable', code: 'CAD', symbol: 'C$', previewRate: 1.35, dailyLimitUsd: 500, locale: 'en-CA' },
  { name: 'United States', aliases: /united states|usa|america|new york|california|florida|texas/i, stablecoin: 'USD Stable', code: 'USD', symbol: '$', previewRate: 1, dailyLimitUsd: 500, locale: 'en-US' },
  { name: 'Mexico', aliases: /mexico|cancun|mexico city/i, stablecoin: 'MXN Stable', code: 'MXN', symbol: 'MX$', previewRate: 17, dailyLimitUsd: 500, locale: 'es-MX' },
  { name: 'Europe', aliases: /europe|france|germany|italy|spain|portugal|netherlands|ireland|greece|austria|belgium/i, stablecoin: 'EUR Stable', code: 'EUR', symbol: '€', previewRate: 0.92, dailyLimitUsd: 500, locale: 'en-IE' },
  { name: 'United Kingdom', aliases: /united kingdom|england|scotland|wales|london/i, stablecoin: 'GBP Stable', code: 'GBP', symbol: '£', previewRate: 0.79, dailyLimitUsd: 500, locale: 'en-GB' },
  { name: 'Japan', aliases: /japan|tokyo|osaka|kyoto/i, stablecoin: 'JPY Stable', code: 'JPY', symbol: '¥', previewRate: 153.4, dailyLimitUsd: 500, locale: 'ja-JP' },
  { name: 'Nigeria', aliases: /nigeria|lagos|abuja/i, stablecoin: 'NGN Stable', code: 'NGN', symbol: '₦', previewRate: 1600, dailyLimitUsd: 500, locale: 'en-NG' },
  { name: 'Australia', aliases: /australia|sydney|melbourne|brisbane/i, stablecoin: 'AUD Stable', code: 'AUD', symbol: 'A$', previewRate: 1.52, dailyLimitUsd: 500, locale: 'en-AU' },
  { name: 'India', aliases: /india|delhi|mumbai|bangalore/i, stablecoin: 'INR Stable', code: 'INR', symbol: '₹', previewRate: 83.5, dailyLimitUsd: 500, locale: 'en-IN' },
  { name: 'UAE', aliases: /uae|united arab emirates|dubai|abu dhabi/i, stablecoin: 'AED Stable', code: 'AED', symbol: 'د.إ', previewRate: 3.67, dailyLimitUsd: 500, locale: 'en-AE' },
  { name: 'Brazil', aliases: /brazil|rio|sao paulo/i, stablecoin: 'BRL Stable', code: 'BRL', symbol: 'R$', previewRate: 5.1, dailyLimitUsd: 500, locale: 'pt-BR' },
  { name: 'South Korea', aliases: /south korea|korea|seoul/i, stablecoin: 'KRW Stable', code: 'KRW', symbol: '₩', previewRate: 1370, dailyLimitUsd: 500, locale: 'ko-KR' },
];

function resolveRegion(input?: string) {
  const normalized = input?.trim() || 'Global';
  return regions.find((region) => region.name.toLowerCase() === normalized.toLowerCase() || region.aliases.test(normalized)) ?? regions[0];
}

function defaultStoredState(regionInput = 'Global'): StoredTravelPocket {
  const now = Date.now();
  return {
    regionInput: resolveRegion(regionInput).name,
    autoConvertEnabled: true,
    pocketBalanceUsd: 1208.64,
    selectedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

async function loadStoredState(regionInput?: string) {
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return defaultStoredState(regionInput);
  try {
    const parsed = JSON.parse(raw) as StoredTravelPocket;
    return {
      ...defaultStoredState(regionInput),
      ...parsed,
      regionInput: resolveRegion(regionInput || parsed.regionInput).name,
    };
  } catch {
    return defaultStoredState(regionInput);
  }
}

async function saveStoredState(state: StoredTravelPocket) {
  await secureSetItem(STORAGE_KEY, JSON.stringify(state));
}

function localAmount(valueUsd: number, region: RegionDefinition) {
  const fractionDigits = ['JPY', 'NGN', 'INR', 'KRW'].includes(region.code) ? 0 : 2;
  const value = valueUsd * region.previewRate;
  return `${region.symbol}${value.toLocaleString(region.locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

function timeAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function previewTransactions(region: RegionDefinition): NomadTravelPocketTransaction[] {
  const merchantNames: Record<string, [string, string, string]> = {
    Japan: ['Don Quijote Shibuya', 'JR Tokyo Station', 'Sushi Zanmai Ginza'],
    Canada: ['Local Market', 'Regional Transit', 'Neighbourhood Café'],
    Europe: ['Central Market', 'Metro Transit', 'Old Town Café'],
    Nigeria: ['Lagos Market', 'Regional Transit', 'Local Restaurant'],
    Australia: ['City Market', 'Regional Transit', 'Harbour Café'],
  };
  const names = merchantNames[region.name] ?? [`${region.name} Market`, `${region.name} Transit`, 'Local Restaurant'];
  const valuesUsd = [32.5, 9.5, 55.92];
  const categories: NomadTravelPocketTransaction['category'][] = ['shopping', 'transport', 'dining'];

  return names.map((merchant, index) => ({
    id: `preview-${region.code}-${index + 1}`,
    merchant,
    category: categories[index],
    amountLocal: `- ${localAmount(valuesUsd[index], region)}`,
    amountUsd: `≈ ${USD.format(valuesUsd[index])} USD`,
    timestamp: timeAgo(index === 0 ? 37 : index === 1 ? 135 : 24 * 60 + 72),
    status: 'confirmed',
    source: 'preview',
  }));
}

async function fundingSources(): Promise<NomadTravelFundingSource[]> {
  const portfolio = await getPortfolio().catch(() => null);
  if (!portfolio?.balances.length) return [];
  const totalUsd = portfolio.balances.reduce((sum, balance) => sum + Math.max(0, balance.fiatApproxUSD), 0);
  return portfolio.balances.map((balance) => ({
    symbol: balance.symbol,
    balance: String(balance.amount),
    fiatValueUsd: USD.format(balance.fiatApproxUSD),
    allocationPercent: totalUsd > 0 ? Math.round((balance.fiatApproxUSD / totalUsd) * 100) : 0,
    network: balance.symbol,
  }));
}

async function buildState(requestedRegion?: string): Promise<NomadTravelPocketState> {
  const base = await getTravelState();
  const stored = await loadStoredState(requestedRegion || base.regionInput);
  const region = resolveRegion(stored.regionInput);
  const transactions = previewTransactions(region);
  const spentTodayUsd = transactions
    .filter((transaction) => Date.now() - Date.parse(transaction.timestamp) < 24 * 60 * 60 * 1000)
    .reduce((sum, transaction) => sum + Number(transaction.amountUsd.replace(/[^0-9.]/g, '')), 0);
  const tripSpentUsd = transactions.reduce((sum, transaction) => sum + Number(transaction.amountUsd.replace(/[^0-9.]/g, '')), 0);
  const tripLimitUsd = region.dailyLimitUsd * 10;

  return {
    enabled: base.enabled,
    regionInput: region.name,
    preferredStablecoin: region.stablecoin,
    pocketBalanceFiat: USD.format(stored.pocketBalanceUsd),
    pocketBalanceLocal: localAmount(stored.pocketBalanceUsd, region),
    localCurrency: region.stablecoin,
    currencyCode: region.code,
    currencySymbol: region.symbol,
    exchangeRate: region.previewRate,
    exchangeRateSource: 'local_preview',
    exchangeRateUpdatedAt: new Date().toISOString(),
    dailyLimitLocal: localAmount(region.dailyLimitUsd, region),
    tripLimitLocal: localAmount(tripLimitUsd, region),
    spentTodayLocal: localAmount(spentTodayUsd, region),
    spentTodayPercent: Math.min(100, Math.round((spentTodayUsd / region.dailyLimitUsd) * 100)),
    tripSpentLocal: localAmount(tripSpentUsd, region),
    tripSpentPercent: Math.min(100, Math.round((tripSpentUsd / tripLimitUsd) * 100)),
    remainingTodayLocal: localAmount(Math.max(0, region.dailyLimitUsd - spentTodayUsd), region),
    expiresAt: stored.expiresAt,
    autoConvertEnabled: stored.autoConvertEnabled,
    fundingSources: await fundingSources(),
    recentTransactions: transactions,
    dataSource: 'local_preview',
  };
}

async function assertTravelNotFrozen() {
  const security = await localNomadSecurityAdapter.getSecurityState();
  if (security.freezeStatus === 'full' || security.freezeScope === 'travel_pocket') {
    throw new Error('Emergency Freeze currently blocks Travel Pocket changes.');
  }
}

async function selectRegion(regionInput: string) {
  await assertTravelNotFrozen();
  const current = await loadStoredState();
  const next = {
    ...current,
    regionInput: resolveRegion(regionInput).name,
    selectedAt: new Date().toISOString(),
  };
  await saveStoredState(next);
  return buildState(next.regionInput);
}

async function enable(regionInput: string) {
  await assertTravelNotFrozen();
  const region = resolveRegion(regionInput);
  const current = await loadStoredState(region.name);
  await saveStoredState({ ...current, regionInput: region.name });
  await enableTravelMode(region.name);
  return buildState(region.name);
}

async function disable() {
  await assertTravelNotFrozen();
  await disableTravelMode();
  return buildState();
}

async function setAutoConvert(enabled: boolean) {
  await assertTravelNotFrozen();
  const current = await loadStoredState();
  await saveStoredState({ ...current, autoConvertEnabled: enabled });
  return buildState(current.regionInput);
}

export const nomadTravelAdapter: NomadTravelAdapter = {
  getTravelPocketState: () => buildState(),
  refreshTravelPocket: () => buildState(),
  selectRegion,
  enableTravelPocket: enable,
  disableTravelPocket: disable,
  setAutoConvert,
};
