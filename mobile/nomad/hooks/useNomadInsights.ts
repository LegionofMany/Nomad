import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters';
import type { NomadInsightsState, NomadOverlayAdapters } from '../adapters/walletAdapter';

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
    { asset: 'JPY Stable', symbol: 'JPY', icon: '¥', price: '¥1.00', change: '+0.00%', positive: true },
  ],
  topInsight: 'You spent 12% less on dining compared to last month.',
  topSavings: '$56.40',
  travelLocation: 'Tokyo, Japan',
  travelDateRange: 'May 12 – May 20, 2025',
  travelPocketSpent: '¥36,480',
  travelPocketSpentUsd: '≈ $234.29 USD',
  travelDailyAverage: '¥4,560',
  travelDailyAverageUsd: '≈ $29.00 USD',
  freedomScore: 84,
};

export type NomadInsightsHookState = {
  insights: NomadInsightsState;
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
};

export function useNomadInsights(adapters?: NomadOverlayAdapters): NomadInsightsHookState {
  const contextAdapters = useNomadAdapters();
  const insightsAdapter = (adapters ?? contextAdapters).insights;
  const [insights, setInsights] = useState<NomadInsightsState>(fallbackInsights);
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
      setInsights(await insightsAdapter.getInsightsState());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Nomad insights.');
    } finally {
      setLoading(false);
    }
  }, [insightsAdapter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(() => ({ insights, loading, error, refresh }), [insights, loading, error, refresh]);
}
