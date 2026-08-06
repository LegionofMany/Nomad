import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters';
import type {
  NomadExtendedInsightsAdapter,
  NomadExtendedInsightsState,
  NomadInsightsPeriod,
  NomadOverlayAdapters,
} from '../adapters';

const fallbackInsights: NomadExtendedInsightsState = {
  totalPortfolioValue: '$0.00',
  monthlyGrowth: '$0.00',
  monthlyGrowthPercent: '0.00%',
  statCards: [
    { label: 'Wallet Balance', value: '$0.00', note: '0%', icon: '▣', color: '#35f883' },
    { label: 'Travel Pocket', value: '$0.00', note: '0%', icon: '✈', color: '#35f883' },
    { label: 'Non-Stable Assets', value: '$0.00', note: '0%', icon: '◔', color: '#8b5cff' },
    { label: 'Total Assets', value: '0', note: 'Wallet snapshot', icon: '◎', color: '#ffc400' },
  ],
  spendingTotal: '$0.00',
  spendingDelta: 'No prior-period ledger',
  spendingCategories: [],
  recentSpending: [],
  budgets: [],
  performanceRows: [],
  topInsight: 'No recorded spending is available.',
  topSavings: '$0.00',
  travelLocation: 'Global',
  travelDateRange: 'Travel Pocket not loaded',
  travelPocketSpent: '$0.00',
  travelPocketSpentUsd: '≈ $0.00 USD',
  travelDailyAverage: '$0.00',
  travelDailyAverageUsd: '≈ $0.00 USD',
  freedomScore: 0,
  period: '1M',
  updatedAt: new Date(0).toISOString(),
  dataSource: 'wallet_snapshot_and_travel_adapter',
  persistence: 'in_memory_stub',
  portfolioSeries: [],
  spendingSeries: [],
  historyAvailable: false,
  priceFeedStatus: 'snapshot_only',
  transactionFeedStatus: 'travel_adapter_preview',
  calculationNotes: [],
};

function isExtendedAdapter(adapter: unknown): adapter is NomadExtendedInsightsAdapter {
  return Boolean(adapter && typeof (adapter as NomadExtendedInsightsAdapter).getInsightsStateForPeriod === 'function');
}

function extendBaseState(
  base: Awaited<ReturnType<NonNullable<NomadOverlayAdapters['insights']>['getInsightsState']>>,
  period: NomadInsightsPeriod,
): NomadExtendedInsightsState {
  return {
    ...fallbackInsights,
    ...base,
    period,
    updatedAt: new Date().toISOString(),
    calculationNotes: ['The connected insights provider does not expose period-specific history.'],
  };
}

export type NomadInsightsHookState = {
  insights: NomadExtendedInsightsState;
  period: NomadInsightsPeriod;
  loading: boolean;
  error: string | null;
  refresh(): Promise<NomadExtendedInsightsState | void>;
  setPeriod(period: NomadInsightsPeriod): Promise<NomadExtendedInsightsState | void>;
  updateBudget(categoryLabel: string, totalUsd: number): Promise<NomadExtendedInsightsState>;
};

export function useNomadInsights(adapters?: NomadOverlayAdapters): NomadInsightsHookState {
  const contextAdapters = useNomadAdapters();
  const insightsAdapter = (adapters ?? contextAdapters).insights;
  const [insights, setInsights] = useState<NomadExtendedInsightsState>(fallbackInsights);
  const [period, setSelectedPeriod] = useState<NomadInsightsPeriod>('1M');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextPeriod: NomadInsightsPeriod) => {
    if (!insightsAdapter) {
      setError('Nomad Insights adapter is not connected.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const next = isExtendedAdapter(insightsAdapter)
        ? await insightsAdapter.getInsightsStateForPeriod(nextPeriod)
        : extendBaseState(await insightsAdapter.getInsightsState(), nextPeriod);
      setInsights(next);
      return next;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to calculate Nomad Insights.');
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [insightsAdapter]);

  useEffect(() => {
    void load('1M');
  }, [load]);

  const refresh = useCallback(() => load(period), [load, period]);

  const setPeriod = useCallback(async (nextPeriod: NomadInsightsPeriod) => {
    setSelectedPeriod(nextPeriod);
    return load(nextPeriod);
  }, [load]);

  const updateBudget = useCallback(async (categoryLabel: string, totalUsd: number) => {
    if (!isExtendedAdapter(insightsAdapter) || typeof insightsAdapter.updateBudget !== 'function') {
      throw new Error('The connected Insights adapter does not support editable budgets.');
    }
    try {
      setLoading(true);
      setError(null);
      const next = await insightsAdapter.updateBudget(categoryLabel, totalUsd, period);
      setInsights(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to save the budget.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [insightsAdapter, period]);

  return useMemo(
    () => ({ insights, period, loading, error, refresh, setPeriod, updateBudget }),
    [insights, period, loading, error, refresh, setPeriod, updateBudget],
  );
}
