import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters';
import type {
  NomadInsightsState,
  NomadOverlayAdapters,
  NomadSpendingTransaction,
  NomadTravelPocketState,
} from '../adapters/walletAdapter';

type RegionInsightProfile = {
  match: RegExp;
  label: string;
  currencyCode: string;
  currencyName: string;
  symbol: string;
  previewRate: number;
  merchants: [string, string, string, string];
};

const regionProfiles: RegionInsightProfile[] = [
  { match: /canada|toronto|vancouver|montreal|alberta|ontario|quebec/i, label: 'Canada', currencyCode: 'CAD', currencyName: 'CAD Stable', symbol: 'C$', previewRate: 1.35, merchants: ['Tim Hortons', 'Canadian Tire', 'Local Transit', 'The Keg'] },
  { match: /united states|\busa\b|\bus\b|america|new york|california|florida|texas/i, label: 'United States', currencyCode: 'USD', currencyName: 'USD Stable', symbol: '$', previewRate: 1, merchants: ['Starbucks', 'Target', 'Metro Transit', 'Local Grill'] },
  { match: /mexico|cancun|mexico city/i, label: 'Mexico', currencyCode: 'MXN', currencyName: 'MXN Stable', symbol: 'MX$', previewRate: 17, merchants: ['Café de Olla', 'Mercado Local', 'Metro CDMX', 'Taquería Central'] },
  { match: /europe|france|germany|italy|spain|portugal|netherlands|ireland|greece|austria|belgium/i, label: 'Europe', currencyCode: 'EUR', currencyName: 'EUR Stable', symbol: '€', previewRate: 0.92, merchants: ['Café Central', 'Galeries Market', 'City Transit', 'Bistro Local'] },
  { match: /united kingdom|\buk\b|england|scotland|wales|london/i, label: 'United Kingdom', currencyCode: 'GBP', currencyName: 'GBP Stable', symbol: '£', previewRate: 0.79, merchants: ['Pret A Manger', 'Marks & Spencer', 'Underground', 'Local Pub'] },
  { match: /japan|tokyo|osaka|kyoto/i, label: 'Japan', currencyCode: 'JPY', currencyName: 'JPY Stable', symbol: '¥', previewRate: 153.4, merchants: ['Starbucks Tokyo', 'Don Quijote', 'JR Station', 'Sushi Restaurant'] },
  { match: /nigeria|lagos|abuja/i, label: 'Nigeria', currencyCode: 'NGN', currencyName: 'NGN Stable', symbol: '₦', previewRate: 1600, merchants: ['Chicken Republic', 'Shoprite', 'Local Ride', 'Nigerian Kitchen'] },
  { match: /australia|sydney|melbourne|brisbane/i, label: 'Australia', currencyCode: 'AUD', currencyName: 'AUD Stable', symbol: 'A$', previewRate: 1.52, merchants: ['Coffee Club', 'Woolworths', 'Local Transit', 'Harbour Grill'] },
  { match: /india|delhi|mumbai|bangalore/i, label: 'India', currencyCode: 'INR', currencyName: 'INR Stable', symbol: '₹', previewRate: 83.5, merchants: ['Café Coffee Day', 'Reliance Retail', 'Metro Transit', 'Local Restaurant'] },
  { match: /uae|united arab emirates|dubai|abu dhabi/i, label: 'United Arab Emirates', currencyCode: 'AED', currencyName: 'AED Stable', symbol: 'د.إ', previewRate: 3.67, merchants: ['Costa Coffee', 'Carrefour', 'Dubai Metro', 'Marina Dining'] },
  { match: /brazil|rio|sao paulo|são paulo/i, label: 'Brazil', currencyCode: 'BRL', currencyName: 'BRL Stable', symbol: 'R$', previewRate: 5.1, merchants: ['Café do Brasil', 'Mercado Local', 'Metrô', 'Churrascaria'] },
  { match: /south korea|korea|seoul/i, label: 'South Korea', currencyCode: 'KRW', currencyName: 'KRW Stable', symbol: '₩', previewRate: 1370, merchants: ['Mega Coffee', 'Lotte Mart', 'Seoul Metro', 'Local BBQ'] },
];

const globalProfile: RegionInsightProfile = {
  match: /.*/,
  label: 'Global Travel',
  currencyCode: 'USD',
  currencyName: 'USD Stable',
  symbol: '$',
  previewRate: 1,
  merchants: ['Local Café', 'Local Market', 'Local Transit', 'Local Restaurant'],
};

const fallbackInsights: NomadInsightsState = {
  totalPortfolioValue: '$24,680.45',
  monthlyGrowth: '+$1,248.32',
  monthlyGrowthPercent: '5.32%',
  statCards: [
    { label: 'Wallet Balance', value: '$18,542.12', note: '75.1%', icon: '▣', color: '#35f883' },
    { label: 'Travel Pocket', value: '$4,652.33', note: '18.8%', icon: '✈', color: '#35f883' },
    { label: 'Investments', value: '$1,486.77', note: '6.0%', icon: '◔', color: '#8b5cff' },
    { label: 'Total Assets', value: '8', note: 'Chains', icon: '◎', color: '#ffc400' },
  ],
  spendingTotal: '$1,248.90',
  spendingDelta: '-8.4% vs last month',
  spendingCategories: [
    { label: 'Food & Dining', icon: '♨', percent: '34%', amount: '$424.12', color: '#35f883' },
    { label: 'Shopping', icon: '▢', percent: '24%', amount: '$299.18', color: '#1684ff' },
    { label: 'Transport', icon: '▰', percent: '18%', amount: '$224.36', color: '#8b5cff' },
    { label: 'Travel', icon: '✈', percent: '14%', amount: '$174.50', color: '#ffb84d' },
    { label: 'Other', icon: '•••', percent: '10%', amount: '$126.74', color: '#9aa7ba' },
  ],
  recentSpending: [],
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
    { asset: 'USD Stable', symbol: 'USD', icon: '$', price: '$1.00', change: '+0.00%', positive: true },
  ],
  topInsight: 'You spent 12% less on dining compared to last month.',
  topSavings: '$56.40',
  travelLocation: 'Global Travel',
  travelDateRange: 'Active travel session',
  travelPocketSpent: '$234.29',
  travelPocketSpentUsd: '≈ $234.29 USD',
  travelDailyAverage: '$29.00',
  travelDailyAverageUsd: '≈ $29.00 USD',
  freedomScore: 84,
};

const previewTransactions = [
  { usd: 5.61, category: 'Food & Dining', icon: '☕', color: '#35f883' },
  { usd: 21.19, category: 'Shopping', icon: '🛒', color: '#1684ff' },
  { usd: 6.18, category: 'Transport', icon: '▣', color: '#8b5cff' },
  { usd: 55.92, category: 'Food & Dining', icon: '♨', color: '#35f883' },
] as const;

function resolveProfile(regionInput?: string): RegionInsightProfile {
  const region = regionInput?.trim() || 'Global';
  return regionProfiles.find((profile) => profile.match.test(region)) ?? globalProfile;
}

function formatLocal(usd: number, profile: RegionInsightProfile): string {
  const amount = usd * profile.previewRate;
  const wholeNumber = ['JPY', 'NGN', 'INR', 'KRW'].includes(profile.currencyCode);
  return `${profile.symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: wholeNumber ? 0 : 2,
    maximumFractionDigits: wholeNumber ? 0 : 2,
  })}`;
}

function formatTripRange(): string {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 8);
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}

function buildRecentSpending(profile: RegionInsightProfile): NomadSpendingTransaction[] {
  return previewTransactions.map((transaction, index) => ({
    name: profile.merchants[index],
    meta: index < 3 ? 'Today • Preview transaction' : 'Yesterday • Preview transaction',
    category: transaction.category,
    amount: formatLocal(transaction.usd, profile),
    usd: `≈ $${transaction.usd.toFixed(2)} USD`,
    icon: transaction.icon,
    color: transaction.color,
  }));
}

function normalizeInsights(base: NomadInsightsState, travel?: NomadTravelPocketState): NomadInsightsState {
  const regionInput = travel?.regionInput?.trim() || 'Global';
  const profile = resolveProfile(regionInput);
  const stableRow = {
    asset: profile.currencyName,
    symbol: profile.currencyCode,
    icon: profile.symbol,
    price: `${profile.symbol}1.00`,
    change: '+0.00%',
    positive: true,
  };

  return {
    ...base,
    recentSpending: buildRecentSpending(profile),
    performanceRows: [...base.performanceRows.filter((row) => !/Stable$/i.test(row.asset)), stableRow],
    travelLocation: regionInput === 'Global' ? profile.label : regionInput,
    travelDateRange: formatTripRange(),
    travelPocketSpent: formatLocal(234.29, profile),
    travelPocketSpentUsd: '≈ $234.29 USD',
    travelDailyAverage: formatLocal(29, profile),
    travelDailyAverageUsd: '≈ $29.00 USD',
  };
}

export type NomadInsightsHookState = {
  insights: NomadInsightsState;
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
};

export function useNomadInsights(adapters?: NomadOverlayAdapters): NomadInsightsHookState {
  const contextAdapters = useNomadAdapters();
  const selectedAdapters = adapters ?? contextAdapters;
  const insightsAdapter = selectedAdapters.insights;
  const travelAdapter = selectedAdapters.travel;
  const [insights, setInsights] = useState<NomadInsightsState>(normalizeInsights(fallbackInsights));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!insightsAdapter) {
      setError('Nomad insights adapter is not connected.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [nextInsights, travel] = await Promise.all([
        insightsAdapter.getInsightsState(),
        travelAdapter?.getTravelPocketState().catch(() => undefined),
      ]);
      setInsights(normalizeInsights(nextInsights, travel));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Nomad insights.');
    } finally {
      setLoading(false);
    }
  }, [insightsAdapter, travelAdapter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(() => ({ insights, loading, error, refresh }), [insights, loading, error, refresh]);
}
