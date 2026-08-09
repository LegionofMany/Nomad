import { secureGetItem, secureSetItem } from '../../services/nativeStubs';
import { getPortfolio } from '../../services/walletService';

import { nomadSecurityAdapter } from './nomadSecurityAdapter';
import { nomadTravelAdapter } from './nomadTravelAdapter';
import type {
  NomadBudgetItem,
  NomadInsightsAdapter,
  NomadInsightsState,
  NomadPerformanceRow,
  NomadSpendingCategory,
  NomadSpendingTransaction,
  NomadTravelPocketTransaction,
} from './walletAdapter';

export type NomadInsightsPeriod = '7D' | '1M' | '3M' | '1Y';

export type NomadInsightsSeriesPoint = {
  label: string;
  value: number;
};

export type NomadExtendedInsightsState = NomadInsightsState & {
  period: NomadInsightsPeriod;
  updatedAt: string;
  dataSource: 'wallet_snapshot_and_travel_adapter';
  persistence: 'in_memory_stub';
  portfolioSeries: NomadInsightsSeriesPoint[];
  spendingSeries: NomadInsightsSeriesPoint[];
  historyAvailable: boolean;
  priceFeedStatus: 'snapshot_only';
  transactionFeedStatus: 'travel_adapter_preview' | 'wallet_ledger';
  calculationNotes: string[];
};

export type NomadExtendedInsightsAdapter = NomadInsightsAdapter & {
  getInsightsStateForPeriod(period: NomadInsightsPeriod): Promise<NomadExtendedInsightsState>;
  updateBudget(categoryLabel: string, totalUsd: number, period: NomadInsightsPeriod): Promise<NomadExtendedInsightsState>;
};

type WalletBalance = {
  symbol: string;
  amount: number;
  fiatApproxUSD: number;
};

type CategoryDefinition = {
  label: string;
  icon: string;
  color: string;
  defaultBudget: number;
};

const BUDGET_STORAGE_KEY = 'nomad.insights.budgets';
const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const categoryMeta: Record<string, CategoryDefinition> = {
  dining: { label: 'Food & Dining', icon: '♨', color: '#35f883', defaultBudget: 600 },
  shopping: { label: 'Shopping', icon: '▢', color: '#1684ff', defaultBudget: 500 },
  transport: { label: 'Transport', icon: '▰', color: '#8b5cff', defaultBudget: 400 },
  lodging: { label: 'Travel', icon: '✈', color: '#ffb84d', defaultBudget: 700 },
  other: { label: 'Other', icon: '•••', color: '#9aa7ba', defaultBudget: 250 },
};

const assetMeta: Record<string, { name: string; icon: string }> = {
  BTC: { name: 'Bitcoin', icon: '₿' },
  ETH: { name: 'Ethereum', icon: 'Ξ' },
  HBAR: { name: 'Hedera', icon: 'H' },
  XRP: { name: 'XRP', icon: 'X' },
  XLM: { name: 'Stellar', icon: 'S' },
  XDC: { name: 'XDC Network', icon: 'X' },
  ADA: { name: 'Cardano', icon: 'A' },
  ALGO: { name: 'Algorand', icon: 'A' },
  USDC: { name: 'USD Coin', icon: '$' },
  USDT: { name: 'Tether', icon: '₮' },
  DAI: { name: 'Dai', icon: 'D' },
};

const stableAssets = new Set(['USDC', 'USDT', 'DAI']);

function periodDays(period: NomadInsightsPeriod) {
  switch (period) {
    case '7D': return 7;
    case '1M': return 30;
    case '3M': return 90;
    case '1Y': return 365;
  }
}

function parseMoney(value?: string) {
  const parsed = Number((value ?? '').replace(/,/g, '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

function formatPercent(value: number) {
  return `${Math.max(0, value).toFixed(0)}%`;
}

function localAmount(usd: number, symbol: string, rate: number, code: string) {
  const whole = ['JPY', 'NGN', 'INR', 'KRW'].includes(code);
  return `${symbol}${(usd * rate).toLocaleString('en-US', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })}`;
}

function defaultBudgetLimits() {
  return Object.values(categoryMeta).reduce<Record<string, number>>((result, category) => {
    result[category.label] = category.defaultBudget;
    return result;
  }, {});
}

async function loadBudgetLimits() {
  const fallback = defaultBudgetLimits();
  const raw = await secureGetItem(BUDGET_STORAGE_KEY);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.keys(fallback).reduce<Record<string, number>>((result, label) => {
      const value = Number(parsed[label]);
      result[label] = Number.isFinite(value) && value > 0 ? value : fallback[label];
      return result;
    }, {});
  } catch {
    return fallback;
  }
}

async function saveBudgetLimits(limits: Record<string, number>) {
  await secureSetItem(BUDGET_STORAGE_KEY, JSON.stringify(limits));
}

function withinPeriod(transaction: NomadTravelPocketTransaction, days: number) {
  const timestamp = Date.parse(transaction.timestamp);
  return Number.isFinite(timestamp) && timestamp >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function transactionUsd(transaction: NomadTravelPocketTransaction) {
  return parseMoney(transaction.amountUsd);
}

function categoryFor(transaction: NomadTravelPocketTransaction) {
  return categoryMeta[transaction.category] ?? categoryMeta.other;
}

function buildCategories(transactions: NomadTravelPocketTransaction[]): NomadSpendingCategory[] {
  const totals = new Map<string, number>();
  transactions.forEach((transaction) => {
    const meta = categoryFor(transaction);
    totals.set(meta.label, (totals.get(meta.label) ?? 0) + transactionUsd(transaction));
  });
  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);

  return Object.values(categoryMeta).map((meta) => {
    const amount = totals.get(meta.label) ?? 0;
    return {
      label: meta.label,
      icon: meta.icon,
      percent: formatPercent(total > 0 ? (amount / total) * 100 : 0),
      amount: USD.format(amount),
      color: meta.color,
    };
  });
}

function buildBudgets(categories: NomadSpendingCategory[], limits: Record<string, number>): NomadBudgetItem[] {
  return categories.map((category) => {
    const meta = Object.values(categoryMeta).find((item) => item.label === category.label) ?? categoryMeta.other;
    const spent = parseMoney(category.amount);
    const total = limits[category.label] ?? meta.defaultBudget;
    return {
      label: category.label,
      spent: USD.format(spent),
      total: USD.format(total),
      percent: formatPercent(Math.min(100, total > 0 ? (spent / total) * 100 : 0)),
      icon: meta.icon,
      color: meta.color,
    };
  });
}

function buildRecentSpending(transactions: NomadTravelPocketTransaction[]): NomadSpendingTransaction[] {
  return transactions
    .slice()
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
    .map((transaction) => {
      const meta = categoryFor(transaction);
      return {
        name: transaction.merchant,
        meta: `${new Date(transaction.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} • ${transaction.status} • ${transaction.source}`,
        category: meta.label,
        amount: transaction.amountLocal,
        usd: transaction.amountUsd,
        icon: meta.icon,
        color: meta.color,
      };
    });
}

function buildPerformanceRows(balances: WalletBalance[]): NomadPerformanceRow[] {
  return balances
    .slice()
    .sort((left, right) => right.fiatApproxUSD - left.fiatApproxUSD)
    .map((balance) => {
      const symbol = balance.symbol.toUpperCase();
      const meta = assetMeta[symbol] ?? { name: symbol, icon: symbol.slice(0, 1) };
      const price = balance.amount > 0 ? balance.fiatApproxUSD / balance.amount : 0;
      return {
        asset: meta.name,
        symbol,
        icon: meta.icon,
        price: USD.format(price),
        change: '0.00%',
        positive: true,
      };
    });
}

function buildSpendingSeries(transactions: NomadTravelPocketTransaction[], days: number): NomadInsightsSeriesPoint[] {
  const pointCount = days <= 7 ? 7 : days <= 30 ? 30 : days <= 90 ? 13 : 12;
  const bucketDays = Math.max(1, Math.ceil(days / pointCount));
  return Array.from({ length: pointCount }, (_, index) => {
    const end = Date.now() - (pointCount - 1 - index) * bucketDays * 24 * 60 * 60 * 1000;
    const start = end - bucketDays * 24 * 60 * 60 * 1000;
    const value = transactions
      .filter((transaction) => {
        const timestamp = Date.parse(transaction.timestamp);
        return timestamp > start && timestamp <= end;
      })
      .reduce((sum, transaction) => sum + transactionUsd(transaction), 0);
    return {
      label: new Date(end).toLocaleDateString('en-US', days <= 30 ? { month: 'short', day: 'numeric' } : { month: 'short' }),
      value,
    };
  });
}

function flatPortfolioSeries(total: number, days: number): NomadInsightsSeriesPoint[] {
  const pointCount = days <= 7 ? 7 : days <= 90 ? 6 : 12;
  return Array.from({ length: pointCount }, (_, index) => ({ label: `${index + 1}`, value: total }));
}

function freedomScore(params: { securityScore: number; assetCount: number; stableRatio: number; spentTodayPercent: number }) {
  const security = Math.min(35, params.securityScore * 0.35);
  const diversification = Math.min(25, (params.assetCount / 8) * 25);
  const stability = Math.min(20, (params.stableRatio / 0.5) * 20);
  const discipline = Math.max(0, 20 * (1 - Math.min(100, params.spentTodayPercent) / 100));
  return Math.round(security + diversification + stability + discipline);
}

async function buildState(period: NomadInsightsPeriod): Promise<NomadExtendedInsightsState> {
  const [portfolio, travel, security, budgetLimits] = await Promise.all([
    getPortfolio().catch(() => null),
    nomadTravelAdapter.getTravelPocketState(),
    nomadSecurityAdapter.getSecurityState(),
    loadBudgetLimits(),
  ]);

  const balances = portfolio?.balances ?? [];
  const walletTotal = balances.reduce((sum, balance) => sum + Math.max(0, balance.fiatApproxUSD), 0);
  const pocketTotal = parseMoney(travel.pocketBalanceFiat);
  const totalPortfolio = walletTotal + pocketTotal;
  const stableTotal = balances
    .filter((balance) => stableAssets.has(balance.symbol.toUpperCase()))
    .reduce((sum, balance) => sum + Math.max(0, balance.fiatApproxUSD), 0);
  const investmentTotal = balances
    .filter((balance) => !stableAssets.has(balance.symbol.toUpperCase()))
    .reduce((sum, balance) => sum + Math.max(0, balance.fiatApproxUSD), 0);

  const days = periodDays(period);
  const allTravelTransactions = travel.recentTransactions ?? [];
  const transactions = allTravelTransactions.filter((transaction) => withinPeriod(transaction, days));
  const spendingTotal = transactions.reduce((sum, transaction) => sum + transactionUsd(transaction), 0);
  const categories = buildCategories(transactions);
  const budgets = buildBudgets(categories, budgetLimits);
  const dominant = categories.slice().sort((left, right) => parseMoney(right.amount) - parseMoney(left.amount))[0];
  const activeDays = new Set(transactions.map((transaction) => new Date(transaction.timestamp).toDateString())).size;
  const dailyAverageUsd = activeDays > 0 ? spendingTotal / activeDays : 0;
  const exchangeRate = travel.exchangeRate ?? 1;
  const currencySymbol = travel.currencySymbol ?? '$';
  const currencyCode = travel.currencyCode ?? 'USD';
  const spentTodayPercent = travel.spentTodayPercent ?? 0;
  const stableRatio = walletTotal > 0 ? stableTotal / walletTotal : 0;
  const score = freedomScore({ securityScore: security.score, assetCount: balances.length, stableRatio, spentTodayPercent });
  const expiresAt = travel.expiresAt && Number.isFinite(Date.parse(travel.expiresAt))
    ? new Date(travel.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No expiry configured';
  const budgetHeadroom = budgets.reduce((sum, budget) => Math.max(0, sum + parseMoney(budget.total) - parseMoney(budget.spent)), 0);

  return {
    totalPortfolioValue: USD.format(totalPortfolio),
    monthlyGrowth: '$0.00',
    monthlyGrowthPercent: '0.00%',
    statCards: [
      { label: 'Wallet Balance', value: USD.format(walletTotal), note: totalPortfolio > 0 ? formatPercent((walletTotal / totalPortfolio) * 100) : '0%', icon: '▣', color: '#35f883' },
      { label: 'Travel Pocket', value: USD.format(pocketTotal), note: totalPortfolio > 0 ? formatPercent((pocketTotal / totalPortfolio) * 100) : '0%', icon: '✈', color: '#35f883' },
      { label: 'Non-Stable Assets', value: USD.format(investmentTotal), note: walletTotal > 0 ? formatPercent((investmentTotal / walletTotal) * 100) : '0%', icon: '◔', color: '#8b5cff' },
      { label: 'Total Assets', value: String(balances.length), note: 'Wallet snapshot', icon: '◎', color: '#ffc400' },
    ],
    spendingTotal: USD.format(spendingTotal),
    spendingDelta: 'No prior-period ledger',
    spendingCategories: categories,
    recentSpending: buildRecentSpending(transactions),
    budgets,
    performanceRows: buildPerformanceRows(balances),
    topInsight: dominant && parseMoney(dominant.amount) > 0
      ? `${dominant.label} is the largest recorded category for ${period}, representing ${dominant.percent} of tracked spending.`
      : `No recorded Travel Pocket spending is available for ${period}.`,
    topSavings: USD.format(budgetHeadroom),
    travelLocation: travel.regionInput ?? 'Global',
    travelDateRange: travel.enabled ? `Active • Expires ${expiresAt}` : `Ready • Expires ${expiresAt}`,
    travelPocketSpent: localAmount(spendingTotal, currencySymbol, exchangeRate, currencyCode),
    travelPocketSpentUsd: `≈ ${USD.format(spendingTotal)} USD`,
    travelDailyAverage: localAmount(dailyAverageUsd, currencySymbol, exchangeRate, currencyCode),
    travelDailyAverageUsd: `≈ ${USD.format(dailyAverageUsd)} USD`,
    freedomScore: score,
    period,
    updatedAt: new Date().toISOString(),
    dataSource: 'wallet_snapshot_and_travel_adapter',
    persistence: 'in_memory_stub',
    portfolioSeries: flatPortfolioSeries(totalPortfolio, days),
    spendingSeries: buildSpendingSeries(transactions, days),
    historyAvailable: false,
    priceFeedStatus: 'snapshot_only',
    transactionFeedStatus: allTravelTransactions.some((transaction) => transaction.source === 'wallet') ? 'wallet_ledger' : 'travel_adapter_preview',
    calculationNotes: [
      'Portfolio totals use the current wallet and Travel Pocket snapshots.',
      'Spending periods are recalculated from timestamped Travel Pocket activity.',
      'Historical portfolio growth and prior-period comparisons require a dated wallet ledger and market-price provider.',
      'Budget limits are owner preferences stored through the current Nomad storage boundary.',
    ],
  };
}

async function updateBudget(categoryLabel: string, totalUsd: number, period: NomadInsightsPeriod) {
  const knownLabels = new Set(Object.values(categoryMeta).map((category) => category.label));
  if (!knownLabels.has(categoryLabel)) throw new Error('Unknown spending category.');
  if (!Number.isFinite(totalUsd) || totalUsd < 1 || totalUsd > 1000000) {
    throw new Error('Budget must be between $1 and $1,000,000.');
  }
  const limits = await loadBudgetLimits();
  limits[categoryLabel] = Math.round(totalUsd * 100) / 100;
  await saveBudgetLimits(limits);
  return buildState(period);
}

export const nomadInsightsAdapter: NomadExtendedInsightsAdapter = {
  getInsightsState: () => buildState('1M'),
  getInsightsStateForPeriod: buildState,
  updateBudget,
};
