import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadInsights } from '../nomad';
import type { NomadInsightsPeriod, NomadInsightsSeriesPoint } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  ProgressBar,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

type InsightTab = 'Spending' | 'Savings' | 'Portfolio' | 'Trends';

const tabs: InsightTab[] = ['Spending', 'Savings', 'Portfolio', 'Trends'];
const periods: Array<{ value: NomadInsightsPeriod; label: string }> = [
  { value: '7D', label: 'Week' },
  { value: '1M', label: 'Month' },
  { value: '3M', label: 'Quarter' },
  { value: '1Y', label: 'Year' },
];

function parseMoney(value?: string) {
  const parsed = Number((value ?? '').replace(/,/g, '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

function parsePercent(value?: string) {
  const parsed = Number((value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function formatUpdated(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 'Not calculated';
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function PeriodSelector({ selected, loading, onSelect }: { selected: NomadInsightsPeriod; loading: boolean; onSelect(value: NomadInsightsPeriod): void }) {
  return (
    <View style={styles.periodSelector}>
      {periods.map((item) => {
        const active = item.value === selected;
        return (
          <Pressable
            key={item.value}
            disabled={loading}
            onPress={() => onSelect(item.value)}
            style={({ pressed }) => [styles.periodButton, active && styles.periodButtonActive, pressed && styles.pressed]}
          >
            <Text style={[styles.periodText, active && styles.periodTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SeriesBars({ points, color, emptyLabel }: { points: NomadInsightsSeriesPoint[]; color: string; emptyLabel: string }) {
  const maximum = Math.max(...points.map((point) => point.value), 0);
  if (!points.length) {
    return <View style={styles.emptyChart}><Text style={styles.emptyChartText}>{emptyLabel}</Text></View>;
  }
  return (
    <View style={styles.chart}>
      <View style={styles.chartGridLine} />
      <View style={[styles.chartGridLine, { top: '50%' }]} />
      <View style={[styles.chartGridLine, { top: '100%' }]} />
      <View style={styles.chartColumns}>
        {points.map((point, index) => {
          const ratio = maximum > 0 ? point.value / maximum : 0;
          const height = 8 + ratio * 104;
          return (
            <View key={`${point.label}-${index}`} style={styles.chartColumn}>
              <View style={styles.chartBarWrap}>
                <View style={[styles.chartBar, { height, backgroundColor: color }]} />
              </View>
              <Text numberOfLines={1} style={styles.chartLabel}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function DistributionBar({ categories }: { categories: Array<{ label: string; percent: string; color: string }> }) {
  const visible = categories.filter((category) => parsePercent(category.percent) > 0);
  if (!visible.length) return <View style={styles.distributionEmpty}><Text style={styles.distributionEmptyText}>No recorded spending</Text></View>;
  return (
    <View style={styles.distributionBar}>
      {visible.map((category) => (
        <View key={category.label} style={{ flex: Math.max(1, parsePercent(category.percent)), backgroundColor: category.color }} />
      ))}
    </View>
  );
}

function CategoryRow({
  category,
  selected,
  onPress,
}: {
  category: { label: string; icon?: string; percent: string; amount: string; color: string };
  selected: boolean;
  onPress(): void;
}) {
  const value = parsePercent(category.percent);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.categoryRow, selected && styles.categoryRowSelected, pressed && styles.pressed]}>
      <RoundIcon symbol={category.icon || '•'} color={category.color} size={38} filled />
      <View style={styles.categoryCopy}>
        <View style={styles.categoryHeading}>
          <Text style={styles.categoryLabel}>{category.label}</Text>
          <Text style={styles.categoryAmount}>{category.amount}</Text>
        </View>
        <ProgressBar value={value} color={category.color} height={6} />
      </View>
      <Text style={styles.categoryPercent}>{category.percent}</Text>
    </Pressable>
  );
}

function BudgetCard({
  budget,
  editing,
  draft,
  onEdit,
  onDraft,
  onSave,
}: {
  budget: { label: string; spent: string; total: string; percent: string; icon: string; color: string };
  editing: boolean;
  draft: string;
  onEdit(): void;
  onDraft(value: string): void;
  onSave(): void;
}) {
  const percent = parsePercent(budget.percent);
  const remaining = Math.max(0, parseMoney(budget.total) - parseMoney(budget.spent));
  return (
    <View style={[styles.budgetCard, editing && { borderColor: budget.color }]}>
      <View style={styles.budgetTop}>
        <Text style={[styles.budgetIcon, { color: budget.color }]}>{budget.icon}</Text>
        <Pressable onPress={onEdit}><Text style={styles.editLink}>{editing ? 'Close' : 'Edit'}</Text></Pressable>
      </View>
      <Text style={styles.budgetLabel}>{budget.label}</Text>
      <Text style={styles.budgetSpent}>{budget.spent} of {budget.total}</Text>
      <ProgressBar value={percent} color={budget.color} height={7} />
      <Text style={styles.budgetRemaining}>${remaining.toFixed(2)} remaining</Text>
      {editing ? (
        <View style={styles.budgetEditor}>
          <TextInput
            value={draft}
            onChangeText={onDraft}
            keyboardType="decimal-pad"
            placeholder="Monthly budget"
            placeholderTextColor={C.muted}
            style={styles.budgetInput}
          />
          <Pressable onPress={onSave} style={styles.saveBudgetButton}><Text style={styles.saveBudgetText}>Save</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function NomadInsightsSpendingScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { insights, period, loading, error, refresh, setPeriod, updateBudget } = useNomadInsights();
  const [activeTab, setActiveTab] = useState<InsightTab>('Spending');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setBudgetDrafts((current) => {
      const next = { ...current };
      insights.budgets.forEach((budget) => {
        if (editingBudget !== budget.label) next[budget.label] = parseMoney(budget.total).toFixed(2);
      });
      return next;
    });
  }, [editingBudget, insights.budgets]);

  const filteredTransactions = useMemo(
    () => selectedCategory
      ? insights.recentSpending.filter((transaction) => transaction.category === selectedCategory)
      : insights.recentSpending,
    [insights.recentSpending, selectedCategory],
  );

  const totalBudget = useMemo(
    () => insights.budgets.reduce((sum, budget) => sum + parseMoney(budget.total), 0),
    [insights.budgets],
  );
  const totalSpent = useMemo(
    () => insights.budgets.reduce((sum, budget) => sum + parseMoney(budget.spent), 0),
    [insights.budgets],
  );
  const budgetUsage = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;
  const budgetRemaining = Math.max(0, totalBudget - totalSpent);

  const selectTab = (tab: InsightTab) => {
    setActiveTab(tab);
    setSelectedCategory(null);
    setSelectedTransaction(null);
    setFeedback('');
  };

  const saveBudget = async (label: string) => {
    try {
      setFeedback('Saving budget…');
      const value = Number((budgetDrafts[label] ?? '').replace(/,/g, ''));
      await updateBudget(label, value);
      setEditingBudget(null);
      setFeedback(`${label} budget saved.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to save the budget.');
    }
  };

  const renderSpending = () => (
    <>
      <Panel style={styles.summaryPanel}>
        <View style={[styles.sectionHeading, compact && styles.sectionHeadingCompact]}>
          <View>
            <Text style={styles.sectionTitle}>SPENDING SUMMARY</Text>
            <Text style={styles.sectionSub}>{period} • {insights.travelLocation}</Text>
          </View>
          <PeriodSelector selected={period} loading={loading} onSelect={(next) => void setPeriod(next)} />
        </View>
        <View style={[styles.summaryBody, compact && styles.summaryCompact]}>
          <View style={styles.totalCopy}>
            <Text style={styles.totalLabel}>Total Spent</Text>
            <Text style={styles.totalValue}>{insights.spendingTotal}</Text>
            <Text style={styles.totalDelta}>{insights.spendingDelta}</Text>
            <Text style={styles.sourceLabel}>{insights.transactionFeedStatus.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
          <View style={styles.chartWrap}><SeriesBars points={insights.spendingSeries} color={C.green} emptyLabel="No spending activity" /></View>
        </View>

        <View style={styles.categoryPanel}>
          <View style={styles.categoryTitleRow}>
            <View><Text style={styles.categoryTitle}>SPENDING BY CATEGORY</Text><Text style={styles.sectionSub}>Tap a category to filter transactions</Text></View>
            {selectedCategory ? <Pressable onPress={() => setSelectedCategory(null)}><Text style={styles.clearLink}>Clear filter</Text></Pressable> : null}
          </View>
          <DistributionBar categories={insights.spendingCategories} />
          <View style={styles.categories}>
            {insights.spendingCategories.map((category) => (
              <CategoryRow
                key={category.label}
                category={category}
                selected={selectedCategory === category.label}
                onPress={() => setSelectedCategory((current) => current === category.label ? null : category.label)}
              />
            ))}
          </View>
        </View>
      </Panel>

      <Panel tone="green" style={[styles.insightPanel, compact && styles.insightCompact]}>
        <RoundIcon symbol="✪" color={C.green} size={56} filled />
        <View style={styles.insightCopy}><Text style={styles.insightLabel}>TOP INSIGHT</Text><Text style={styles.insightText}>{insights.topInsight}</Text></View>
        <View style={styles.savingsCopy}><Text style={styles.savingsLabel}>Budget headroom</Text><Text style={styles.savingsValue}>{insights.topSavings}</Text><Text style={styles.savingsNote}>Planning estimate</Text></View>
      </Panel>

      <Panel style={styles.recentPanel}>
        <View style={styles.sectionHeading}>
          <View><Text style={styles.sectionTitle}>RECENT SPENDING</Text><Text style={styles.sectionSub}>{selectedCategory || 'All categories'} • {period}</Text></View>
          <Pressable onPress={() => navigation.navigate('TravelMode')}><Text style={styles.link}>Travel Activity  ›</Text></Pressable>
        </View>
        {filteredTransactions.length ? filteredTransactions.map((row, index) => {
          const selected = selectedTransaction === `${row.name}-${index}`;
          return (
            <Pressable
              key={`${row.name}-${index}`}
              onPress={() => setSelectedTransaction(selected ? null : `${row.name}-${index}`)}
              style={({ pressed }) => [styles.transactionRow, index < filteredTransactions.length - 1 && styles.rowBorder, selected && styles.transactionSelected, pressed && styles.pressed]}
            >
              <RoundIcon symbol={row.icon} color={row.color} size={43} filled />
              <View style={styles.transactionCopy}>
                <Text numberOfLines={1} style={styles.transactionName}>{row.name}</Text>
                <Text style={styles.transactionMeta}>{row.meta}</Text>
                {selected ? <Text style={styles.transactionDetail}>Recorded category: {row.category}. Amount source: {insights.transactionFeedStatus.replace(/_/g, ' ')}.</Text> : null}
              </View>
              <Text style={[styles.transactionCategory, { color: row.color }]}>{row.category}</Text>
              <View style={styles.transactionAmount}><Text style={styles.transactionValue}>{row.amount}</Text><Text style={styles.transactionUsd}>{row.usd}</Text></View>
            </Pressable>
          );
        }) : <Text style={styles.emptyText}>No recorded transactions match this period and category.</Text>}
      </Panel>

      <Panel style={styles.budgetPanel}>
        <View style={[styles.sectionHeading, compact && styles.sectionHeadingCompact]}>
          <View><Text style={styles.sectionTitle}>MONTHLY BUDGET TRACKER</Text><Text style={styles.sectionSub}>Owner-defined planning limits</Text></View>
          <Text style={styles.budgetTotal}>{budgetUsage.toFixed(0)}% used</Text>
        </View>
        <ProgressBar value={budgetUsage} color={budgetUsage >= 90 ? C.red : C.green} height={8} />
        <View style={styles.budgetGrid}>
          {insights.budgets.map((budget) => (
            <BudgetCard
              key={budget.label}
              budget={budget}
              editing={editingBudget === budget.label}
              draft={budgetDrafts[budget.label] ?? ''}
              onEdit={() => setEditingBudget((current) => current === budget.label ? null : budget.label)}
              onDraft={(value) => setBudgetDrafts((current) => ({ ...current, [budget.label]: value }))}
              onSave={() => void saveBudget(budget.label)}
            />
          ))}
        </View>
      </Panel>
    </>
  );

  const renderSavings = () => (
    <Panel tone="green" style={styles.tabPanel}>
      <View style={[styles.sectionHeading, compact && styles.sectionHeadingCompact]}>
        <View><Text style={styles.sectionTitle}>SAVINGS & BUDGET HEADROOM</Text><Text style={styles.sectionSub}>Calculated from owner-defined category budgets</Text></View>
        <PeriodSelector selected={period} loading={loading} onSelect={(next) => void setPeriod(next)} />
      </View>
      <View style={styles.savingsHero}>
        <Text style={styles.savingsHeroLabel}>Remaining planned budget</Text>
        <Text style={styles.savingsHeroValue}>${budgetRemaining.toFixed(2)}</Text>
        <Text style={styles.savingsHeroNote}>{insights.topSavings} total headroom across all categories</Text>
        <ProgressBar value={100 - budgetUsage} color={C.green} height={9} />
      </View>
      <View style={styles.savingsGrid}>
        {insights.budgets.map((budget) => {
          const remaining = Math.max(0, parseMoney(budget.total) - parseMoney(budget.spent));
          return (
            <View key={budget.label} style={styles.savingsCard}>
              <Text style={[styles.savingsCardIcon, { color: budget.color }]}>{budget.icon}</Text>
              <Text style={styles.savingsCardLabel}>{budget.label}</Text>
              <Text style={styles.savingsCardValue}>${remaining.toFixed(2)}</Text>
              <Text style={styles.savingsCardNote}>remaining of {budget.total}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.integrityNote}>Budget headroom is a planning calculation. It is not income, guaranteed savings or financial advice.</Text>
    </Panel>
  );

  const renderPortfolio = () => (
    <Panel style={styles.tabPanel}>
      <View style={styles.sectionHeading}>
        <View><Text style={styles.sectionTitle}>PORTFOLIO SNAPSHOT</Text><Text style={styles.sectionSub}>Current wallet and Travel Pocket values</Text></View>
        <Pressable onPress={() => navigation.navigate('Wallets')}><Text style={styles.link}>Wallets  ›</Text></Pressable>
      </View>
      <Text style={styles.portfolioTotal}>{insights.totalPortfolioValue}</Text>
      <Text style={styles.historyWarning}>Historical performance is unavailable until a dated balance ledger and market-price provider are connected.</Text>
      <View style={styles.statGrid}>
        {insights.statCards.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={[styles.statIcon, { color: stat.color }]}>{stat.icon}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={[styles.statNote, { color: stat.color }]}>{stat.note}</Text>
          </View>
        ))}
      </View>
      <View style={styles.portfolioRows}>
        {insights.performanceRows.map((row, index) => (
          <Pressable key={`${row.symbol}-${index}`} onPress={() => navigation.navigate('Wallets')} style={[styles.performanceRow, index < insights.performanceRows.length - 1 && styles.rowBorder]}>
            <View style={styles.assetBadge}><Text style={styles.assetMark}>{row.icon}</Text></View>
            <View style={styles.assetCopy}><Text style={styles.assetName}>{row.asset}</Text><Text style={styles.assetSymbol}>{row.symbol}</Text></View>
            <Text style={styles.assetPrice}>{row.price}</Text>
            <Text style={styles.snapshotChange}>SNAPSHOT</Text>
          </Pressable>
        ))}
      </View>
    </Panel>
  );

  const renderTrends = () => (
    <Panel style={styles.tabPanel}>
      <View style={[styles.sectionHeading, compact && styles.sectionHeadingCompact]}>
        <View><Text style={styles.sectionTitle}>SPENDING TRENDS</Text><Text style={styles.sectionSub}>Timestamped activity grouped by selected period</Text></View>
        <PeriodSelector selected={period} loading={loading} onSelect={(next) => void setPeriod(next)} />
      </View>
      <View style={styles.trendChart}><SeriesBars points={insights.spendingSeries} color={C.green} emptyLabel="No trend data for this period" /></View>
      <View style={styles.trendStats}>
        <View style={styles.trendStat}><Text style={styles.trendLabel}>Period total</Text><Text style={styles.trendValue}>{insights.spendingTotal}</Text></View>
        <View style={styles.trendStat}><Text style={styles.trendLabel}>Daily average</Text><Text style={styles.trendValue}>{insights.travelDailyAverageUsd}</Text></View>
        <View style={styles.trendStat}><Text style={styles.trendLabel}>History status</Text><Text style={styles.trendValue}>{insights.historyAvailable ? 'Connected' : 'Limited'}</Text></View>
      </View>
      <View style={styles.notesPanel}>
        <Text style={styles.notesTitle}>DATA NOTES</Text>
        {insights.calculationNotes.map((note, index) => <Text key={`${note}-${index}`} style={styles.noteText}>• {note}</Text>)}
      </View>
    </Panel>
  );

  return (
    <NomadPage maxWidth={980}>
      <PageHeader title="Nomad Insights" subtitle="Your spending. Your savings. Your freedom." icon="⌁" color={C.green} help />

      <View style={styles.tabs}>
        <Pressable onPress={() => navigation.navigate('NomadInsights')} style={styles.tab}><Text style={styles.tabText}>Overview</Text></Pressable>
        {tabs.map((tab) => (
          <Pressable key={tab} onPress={() => selectTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}
      {feedback ? <Text style={[styles.feedback, feedback.toLowerCase().includes('unable') && { color: C.red }]}>{feedback}</Text> : null}

      {activeTab === 'Spending' ? renderSpending() : null}
      {activeTab === 'Savings' ? renderSavings() : null}
      {activeTab === 'Portfolio' ? renderPortfolio() : null}
      {activeTab === 'Trends' ? renderTrends() : null}

      <Panel style={styles.integrityPanel}>
        <View><Text style={styles.integrityTitle}>DATA INTEGRITY</Text><Text style={styles.integrityText}>Updated {formatUpdated(insights.updatedAt)} • {insights.dataSource.replace(/_/g, ' ')}</Text></View>
        <Text style={styles.integrityBadge}>{insights.persistence.replace(/_/g, ' ').toUpperCase()}</Text>
      </Panel>

      <BottomNav active="Insights" items={[
        ['⌂', 'Home', 'Portfolio'],
        ['▣', 'Wallets', 'Wallets'],
        ['✈', 'Travel', 'TravelMode'],
        ['◇', 'Security', 'SecurityCenter'],
        ['⌁', 'Insights', 'NomadInsightsSpending'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  tabs: { minHeight: 58, borderBottomWidth: 1, borderBottomColor: C.borderSoft, flexDirection: 'row', marginBottom: 16 },
  tab: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', paddingHorizontal: 2 },
  tabActive: { borderBottomColor: C.green },
  tabText: { color: '#d7e8ff', fontSize: 10 },
  tabTextActive: { color: C.green, fontWeight: '900' },
  errorBanner: { marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 11, backgroundColor: 'rgba(255,77,102,.08)', padding: 12, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  feedback: { color: C.green, fontSize: 10, marginBottom: 10 },
  summaryPanel: { padding: 17 },
  tabPanel: { padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionHeadingCompact: { alignItems: 'flex-start', flexWrap: 'wrap' },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  periodSelector: { flexDirection: 'row', borderWidth: 1, borderColor: C.border, borderRadius: 10, overflow: 'hidden' },
  periodButton: { minWidth: 54, paddingHorizontal: 9, paddingVertical: 9, alignItems: 'center' },
  periodButtonActive: { backgroundColor: 'rgba(32,239,112,.14)' },
  periodText: { color: C.muted, fontSize: 8 },
  periodTextActive: { color: C.green, fontWeight: '900' },
  summaryBody: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 18 },
  summaryCompact: { flexDirection: 'column', alignItems: 'stretch' },
  totalCopy: { width: 220 },
  totalLabel: { color: C.muted, fontSize: 10 },
  totalValue: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 8 },
  totalDelta: { color: C.yellow, fontSize: 9, fontWeight: '800', marginTop: 7 },
  sourceLabel: { color: C.green, fontSize: 8, fontWeight: '900', marginTop: 10 },
  chartWrap: { flex: 1, minWidth: 240 },
  chart: { height: 154, position: 'relative' },
  chartGridLine: { position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: C.borderSoft },
  chartColumns: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', paddingTop: 8 },
  chartColumn: { flex: 1, minWidth: 0, alignItems: 'center' },
  chartBarWrap: { flex: 1, minHeight: 116, justifyContent: 'flex-end', alignItems: 'center' },
  chartBar: { width: '48%', maxWidth: 20, minWidth: 5, borderTopLeftRadius: 4, borderTopRightRadius: 4, opacity: 0.9 },
  chartLabel: { color: C.muted, fontSize: 7, marginTop: 6, maxWidth: 55 },
  emptyChart: { height: 145, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyChartText: { color: C.muted, fontSize: 10 },
  categoryPanel: { marginTop: 20, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel2, padding: 14 },
  categoryTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  categoryTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  clearLink: { color: C.green, fontSize: 9, fontWeight: '900' },
  distributionBar: { height: 12, borderRadius: 6, overflow: 'hidden', flexDirection: 'row', marginTop: 14 },
  distributionEmpty: { height: 36, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  distributionEmptyText: { color: C.muted, fontSize: 9 },
  categories: { marginTop: 9 },
  categoryRow: { minHeight: 52, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7 },
  categoryRowSelected: { backgroundColor: 'rgba(32,239,112,.08)' },
  categoryCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  categoryHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  categoryLabel: { color: '#fff', fontSize: 9 },
  categoryAmount: { color: C.muted, fontSize: 8 },
  categoryPercent: { color: '#fff', fontSize: 9, fontWeight: '900', marginLeft: 9 },
  insightPanel: { minHeight: 100, marginTop: 15, padding: 15, flexDirection: 'row', alignItems: 'center' },
  insightCompact: { flexWrap: 'wrap' },
  insightCopy: { flex: 1, minWidth: 180, marginLeft: 13 },
  insightLabel: { color: C.green, fontSize: 10, fontWeight: '900' },
  insightText: { color: '#fff', fontSize: 11, lineHeight: 17, marginTop: 5 },
  savingsCopy: { width: 155, borderLeftWidth: 1, borderLeftColor: C.borderSoft, paddingLeft: 15, marginLeft: 13 },
  savingsLabel: { color: C.muted, fontSize: 8 },
  savingsValue: { color: C.green, fontSize: 18, fontWeight: '900', marginTop: 4 },
  savingsNote: { color: '#fff', fontSize: 8, marginTop: 4 },
  recentPanel: { marginTop: 15, paddingHorizontal: 16, paddingTop: 16 },
  link: { color: C.green, fontSize: 9, fontWeight: '900' },
  transactionRow: { minHeight: 69, flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 5 },
  transactionSelected: { backgroundColor: 'rgba(22,132,255,.07)' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  transactionCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  transactionName: { color: '#fff', fontSize: 11, fontWeight: '800' },
  transactionMeta: { color: C.muted, fontSize: 8, marginTop: 4 },
  transactionDetail: { color: '#c9d7e8', fontSize: 8, lineHeight: 13, marginTop: 6 },
  transactionCategory: { width: 92, fontSize: 8, textAlign: 'right' },
  transactionAmount: { width: 100, alignItems: 'flex-end', marginLeft: 8 },
  transactionValue: { color: '#fff', fontSize: 12, fontWeight: '800' },
  transactionUsd: { color: C.muted, fontSize: 8, marginTop: 4 },
  emptyText: { color: C.muted, fontSize: 10, textAlign: 'center', paddingVertical: 28 },
  budgetPanel: { marginTop: 15, padding: 16 },
  budgetTotal: { color: C.green, fontSize: 11, fontWeight: '900' },
  budgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 15 },
  budgetCard: { flexGrow: 1, flexBasis: 165, minHeight: 148, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12 },
  budgetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetIcon: { fontSize: 21 },
  editLink: { color: C.green, fontSize: 8, fontWeight: '900' },
  budgetLabel: { color: '#fff', fontSize: 10, fontWeight: '900', marginTop: 7 },
  budgetSpent: { color: C.muted, fontSize: 8, marginVertical: 8 },
  budgetRemaining: { color: C.green, fontSize: 8, marginTop: 7 },
  budgetEditor: { flexDirection: 'row', gap: 7, marginTop: 10 },
  budgetInput: { flex: 1, minWidth: 0, minHeight: 36, borderWidth: 1, borderColor: C.border, borderRadius: 8, color: '#fff', paddingHorizontal: 9, fontSize: 9 },
  saveBudgetButton: { minWidth: 48, borderRadius: 8, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  saveBudgetText: { color: '#00140b', fontSize: 8, fontWeight: '900' },
  savingsHero: { marginTop: 18, borderWidth: 1, borderColor: 'rgba(32,239,112,.32)', borderRadius: 14, backgroundColor: 'rgba(32,239,112,.07)', padding: 18 },
  savingsHeroLabel: { color: C.muted, fontSize: 10 },
  savingsHeroValue: { color: C.green, fontSize: 38, fontWeight: '900', marginVertical: 8 },
  savingsHeroNote: { color: '#fff', fontSize: 10, marginBottom: 13 },
  savingsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  savingsCard: { flexGrow: 1, flexBasis: 145, minHeight: 119, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12 },
  savingsCardIcon: { fontSize: 20 },
  savingsCardLabel: { color: '#fff', fontSize: 9, fontWeight: '900', marginTop: 8 },
  savingsCardValue: { color: C.green, fontSize: 18, fontWeight: '900', marginTop: 8 },
  savingsCardNote: { color: C.muted, fontSize: 8, marginTop: 4 },
  integrityNote: { color: C.muted, fontSize: 9, lineHeight: 15, marginTop: 16 },
  portfolioTotal: { color: '#fff', fontSize: 40, fontWeight: '900', marginTop: 20 },
  historyWarning: { color: C.yellow, fontSize: 9, lineHeight: 15, marginTop: 7 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 17 },
  statCard: { flexGrow: 1, flexBasis: 145, minHeight: 112, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12 },
  statIcon: { fontSize: 22 },
  statLabel: { color: C.muted, fontSize: 8, marginTop: 8 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 8 },
  statNote: { fontSize: 8, fontWeight: '900', marginTop: 5 },
  portfolioRows: { marginTop: 17, borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden' },
  performanceRow: { minHeight: 65, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  assetBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#27364a', alignItems: 'center', justifyContent: 'center' },
  assetMark: { color: '#fff', fontSize: 17, fontWeight: '900' },
  assetCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  assetName: { color: '#fff', fontSize: 10, fontWeight: '900' },
  assetSymbol: { color: C.muted, fontSize: 8, marginTop: 3 },
  assetPrice: { color: '#fff', fontSize: 11, fontWeight: '800' },
  snapshotChange: { color: C.muted, fontSize: 7, marginLeft: 12 },
  trendChart: { marginTop: 20 },
  trendStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  trendStat: { flexGrow: 1, flexBasis: 145, minHeight: 88, borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 12 },
  trendLabel: { color: C.muted, fontSize: 8 },
  trendValue: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 9 },
  notesPanel: { marginTop: 16, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.panel2, padding: 13 },
  notesTitle: { color: C.green, fontSize: 9, fontWeight: '900' },
  noteText: { color: '#d3deeb', fontSize: 8, lineHeight: 14, marginTop: 7 },
  integrityPanel: { minHeight: 72, marginTop: 15, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  integrityTitle: { color: C.green, fontSize: 9, fontWeight: '900' },
  integrityText: { color: C.muted, fontSize: 8, marginTop: 4 },
  integrityBadge: { color: C.yellow, borderWidth: 1, borderColor: C.yellow, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 7, fontWeight: '900' },
});
