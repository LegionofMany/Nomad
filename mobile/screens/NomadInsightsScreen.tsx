import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

type InsightFocus = 'overview' | 'savings' | 'portfolio';

const periods: NomadInsightsPeriod[] = ['7D', '1M', '3M', '1Y'];

function parsePercent(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function formatUpdatedAt(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 'Not calculated yet';
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function PeriodSelector({ selected, loading, onSelect }: { selected: NomadInsightsPeriod; loading: boolean; onSelect(period: NomadInsightsPeriod): void }) {
  return (
    <View style={styles.periodSelector}>
      {periods.map((period) => {
        const active = selected === period;
        return (
          <Pressable
            key={period}
            disabled={loading}
            onPress={() => onSelect(period)}
            style={({ pressed }) => [styles.periodButton, active && styles.periodButtonActive, pressed && styles.pressed]}
          >
            <Text style={[styles.periodText, active && styles.periodTextActive]}>{period}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SeriesChart({ points, color, emptyLabel }: { points: NomadInsightsSeriesPoint[]; color: string; emptyLabel: string }) {
  const values = points.map((point) => point.value);
  const maximum = Math.max(...values, 0);
  const minimum = Math.min(...values, 0);
  const range = maximum - minimum;

  if (!points.length) {
    return <View style={styles.emptyChart}><Text style={styles.emptyChartText}>{emptyLabel}</Text></View>;
  }

  return (
    <View style={styles.chart}>
      <View style={styles.chartGridLine} />
      <View style={[styles.chartGridLine, { top: '50%' }]} />
      <View style={[styles.chartGridLine, { top: '100%' }]} />
      <View style={styles.chartPoints}>
        {points.map((point, index) => {
          const normalized = range > 0 ? (point.value - minimum) / range : 0.5;
          const height = 18 + normalized * 70;
          return (
            <View key={`${point.label}-${index}`} style={styles.chartColumn}>
              <View style={styles.chartStemWrap}>
                <View style={[styles.chartStem, { height, backgroundColor: `${color}4d` }]} />
                <View style={[styles.chartDot, { backgroundColor: color }]} />
              </View>
              <Text numberOfLines={1} style={styles.chartLabel}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function StatCard({ label, value, note, icon, color }: { label: string; value: string; note: string; icon: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { borderColor: color, backgroundColor: `${color}12` }]}><Text style={[styles.statIcon, { color }]}>{icon}</Text></View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>{value}</Text>
      <Text style={[styles.statNote, { color }]}>{note}</Text>
    </View>
  );
}

function CategoryRow({ label, percent, amount, color }: { label: string; percent: string; amount: string; color: string }) {
  const numeric = parsePercent(percent);
  return (
    <View style={styles.categoryRow}>
      <View style={[styles.categoryDot, { backgroundColor: color }]} />
      <View style={styles.categoryCopy}>
        <View style={styles.categoryHeading}>
          <Text style={styles.categoryLabel}>{label}</Text>
          <Text style={styles.categoryAmount}>{amount}</Text>
        </View>
        <ProgressBar value={numeric} color={color} height={6} />
      </View>
      <Text style={styles.categoryPercent}>{percent}</Text>
    </View>
  );
}

function DistributionBar({ categories }: { categories: Array<{ label: string; percent: string; color: string }> }) {
  const visible = categories.filter((category) => parsePercent(category.percent) > 0);
  if (!visible.length) return <View style={styles.distributionEmpty}><Text style={styles.distributionEmptyText}>No recorded spending</Text></View>;
  return (
    <View style={styles.distributionBar}>
      {visible.map((category) => (
        <View
          key={category.label}
          accessibilityLabel={`${category.label} ${category.percent}`}
          style={{ flex: Math.max(1, parsePercent(category.percent)), backgroundColor: category.color }}
        />
      ))}
    </View>
  );
}

function FocusPanel({ focus, savings, historyAvailable }: { focus: InsightFocus; savings: string; historyAvailable: boolean }) {
  if (focus === 'overview') return null;
  return (
    <Panel style={styles.focusPanel}>
      <Text style={styles.focusTitle}>{focus === 'savings' ? 'SAVINGS SNAPSHOT' : 'PORTFOLIO DATA STATUS'}</Text>
      <Text style={styles.focusValue}>{focus === 'savings' ? savings : historyAvailable ? 'Historical feed connected' : 'Current snapshot only'}</Text>
      <Text style={styles.focusNote}>
        {focus === 'savings'
          ? 'This value is the remaining Travel Pocket allowance reported by the adapter, not a guaranteed financial saving.'
          : 'Nomad will show historical growth after a dated balance ledger and market-price provider are connected.'}
      </Text>
    </Panel>
  );
}

export default function NomadInsightsScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { insights, period, loading, error, refresh, setPeriod } = useNomadInsights();
  const [focus, setFocus] = useState<InsightFocus>('overview');

  const performance = useMemo(() => insights.performanceRows.slice(0, 5), [insights.performanceRows]);
  const categories = useMemo(() => insights.spendingCategories, [insights.spendingCategories]);
  const sourceLabel = insights.transactionFeedStatus === 'wallet_ledger' ? 'WALLET LEDGER' : 'TRAVEL PREVIEW ACTIVITY';
  const largestCategoryPercent = categories.reduce((largest, item) => Math.max(largest, parsePercent(item.percent)), 0);

  return (
    <NomadPage maxWidth={980}>
      <PageHeader
        title="Nomad Insights"
        subtitle="Your spending. Your savings. Your freedom."
        icon="⌁"
        color={C.green}
        back={false}
        help
      />

      <View style={styles.tabs}>
        <Pressable onPress={() => setFocus('overview')} style={[styles.tab, focus === 'overview' && styles.tabActive]}><Text style={[styles.tabText, focus === 'overview' && styles.tabTextActive]}>Overview</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('NomadInsightsSpending')} style={styles.tab}><Text style={styles.tabText}>Spending</Text></Pressable>
        <Pressable onPress={() => setFocus('savings')} style={[styles.tab, focus === 'savings' && styles.tabActive]}><Text style={[styles.tabText, focus === 'savings' && styles.tabTextActive]}>Savings</Text></Pressable>
        <Pressable onPress={() => setFocus('portfolio')} style={[styles.tab, focus === 'portfolio' && styles.tabActive]}><Text style={[styles.tabText, focus === 'portfolio' && styles.tabTextActive]}>Portfolio</Text></Pressable>
      </View>

      <FocusPanel focus={focus} savings={insights.topSavings} historyAvailable={insights.historyAvailable} />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel tone="green" style={styles.overviewPanel}>
        <View style={styles.overviewHeader}>
          <View>
            <Text style={styles.eyebrow}>OVERVIEW</Text>
            <Text style={styles.snapshotLabel}>{insights.historyAvailable ? 'Historical portfolio' : 'Current wallet + Travel Pocket snapshot'}</Text>
          </View>
          <PeriodSelector selected={period} loading={loading} onSelect={(next) => void setPeriod(next)} />
        </View>

        <View style={[styles.portfolioRow, compact && styles.portfolioCompact]}>
          <View style={styles.portfolioCopy}>
            <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
            <View style={styles.portfolioValueRow}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.portfolioValue}>{insights.totalPortfolioValue}</Text>
              <Text style={styles.usd}>USD</Text>
            </View>
            <Text style={insights.historyAvailable ? styles.growth : styles.historyUnavailable}>
              {insights.historyAvailable
                ? `${insights.monthlyGrowth} (${insights.monthlyGrowthPercent}) for ${period}`
                : 'Historical growth unavailable until a dated portfolio ledger is connected'}
            </Text>
          </View>
          <View style={styles.portfolioChartWrap}>
            <SeriesChart points={insights.portfolioSeries} color={C.green} emptyLabel="Portfolio history unavailable" />
          </View>
        </View>

        <View style={styles.statGrid}>{insights.statCards.map((stat) => <StatCard key={stat.label} {...stat} />)}</View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>SPENDING OVERVIEW</Text>
            <Text style={styles.sectionSub}>{period} • {sourceLabel}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('NomadInsightsSpending')}><Text style={styles.link}>View Spending  ›</Text></Pressable>
        </View>

        <View style={[styles.spendingBody, compact && styles.spendingCompact]}>
          <View style={styles.spendingSummary}>
            <Text style={styles.spendingLabel}>Tracked Spending</Text>
            <Text style={styles.spendingValue}>{insights.spendingTotal}</Text>
            <Text style={styles.spendingDelta}>{insights.spendingDelta}</Text>
            <DistributionBar categories={categories} />
            <SeriesChart points={insights.spendingSeries} color={C.blue} emptyLabel="No spending activity" />
          </View>
          <View style={styles.categories}>
            {categories.length
              ? categories.map((category) => <CategoryRow key={category.label} {...category} />)
              : <Text style={styles.emptyText}>No category activity is available for this period.</Text>}
          </View>
        </View>

        <Pressable onPress={() => navigation.navigate('NomadInsightsSpending')} style={({ pressed }) => [styles.insightRow, pressed && styles.pressed]}>
          <RoundIcon symbol="✪" color={C.green} size={42} filled />
          <View style={styles.insightCopy}><Text style={styles.insightTitle}>Top Insight</Text><Text style={styles.insightText}>{insights.topInsight}</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </Panel>

      <Panel tone="green" style={styles.travelPanel}>
        <View style={styles.sectionHeading}>
          <View><Text style={styles.sectionTitle}>TRAVEL ACTIVITY</Text><Text style={styles.sectionSub}>{insights.travelDateRange}</Text></View>
          <Pressable onPress={() => navigation.navigate('TravelMode')}><Text style={styles.link}>Travel Pocket  ›</Text></Pressable>
        </View>
        <View style={[styles.travelBody, compact && styles.travelCompact]}>
          <RoundIcon symbol="✈" color={C.green} size={65} filled />
          <View style={styles.travelCopy}>
            <Text style={styles.travelName}>{insights.travelLocation}</Text>
            <Text style={styles.travelCurrency}>{sourceLabel}</Text>
            <ProgressBar value={largestCategoryPercent} color={C.green} height={7} />
          </View>
          <View style={styles.travelMetric}><Text style={styles.travelMetricLabel}>Period Spent</Text><Text style={styles.travelMetricValue}>{insights.travelPocketSpent}</Text><Text style={styles.travelMetricSub}>{insights.travelPocketSpentUsd}</Text></View>
          <View style={styles.travelMetric}><Text style={styles.travelMetricLabel}>Daily Average</Text><Text style={styles.travelMetricValue}>{insights.travelDailyAverage}</Text><Text style={styles.travelMetricSub}>{insights.travelDailyAverageUsd}</Text></View>
        </View>
      </Panel>

      <Panel style={styles.performancePanel}>
        <View style={styles.sectionHeading}>
          <View><Text style={styles.sectionTitle}>PORTFOLIO SNAPSHOT</Text><Text style={styles.sectionSub}>Current derived prices • no live performance feed</Text></View>
          <Pressable onPress={() => navigation.navigate('Wallets')}><Text style={styles.link}>Wallets  ›</Text></Pressable>
        </View>
        {performance.length ? performance.map((row, index) => (
          <Pressable
            key={row.symbol}
            onPress={() => navigation.navigate('Wallets', { asset: row.symbol })}
            style={({ pressed }) => [styles.performanceRow, index < performance.length - 1 && styles.rowBorder, pressed && styles.pressed]}
          >
            <View style={styles.assetBadge}><Text style={styles.assetMark}>{row.icon}</Text></View>
            <View style={styles.assetCopy}><Text style={styles.assetName}>{row.asset}</Text><Text style={styles.assetSymbol}>{row.symbol}</Text></View>
            <View style={styles.snapshotPill}><Text style={styles.snapshotPillText}>SNAPSHOT</Text></View>
            <Text style={styles.assetPrice}>{row.price}</Text>
            <Text style={styles.assetChange}>{row.change}</Text>
            <Text style={styles.rowChevron}>›</Text>
          </Pressable>
        )) : <Text style={styles.emptyText}>No wallet assets are available for performance calculations.</Text>}
      </Panel>

      <Panel tone="green" style={styles.freedomPanel}>
        <RoundIcon symbol="♕" color={C.green} size={57} filled />
        <View style={styles.freedomCopy}>
          <Text style={styles.freedomTitle}>Freedom Score</Text>
          <Text style={styles.freedomText}>Calculated from security posture, diversification, stable-value allocation and Travel Pocket limit usage. It is a planning indicator, not financial advice.</Text>
        </View>
        <View style={styles.scoreRing}><Text style={styles.scoreValue}>{insights.freedomScore}</Text><Text style={styles.scoreOut}>/100</Text></View>
      </Panel>

      <Panel style={styles.integrityPanel}>
        <View style={styles.integrityHeader}><Text style={styles.integrityTitle}>DATA INTEGRITY</Text><Text style={styles.integritySource}>{insights.dataSource.replace(/_/g, ' ').toUpperCase()}</Text></View>
        <Text style={styles.integrityText}>Updated {formatUpdatedAt(insights.updatedAt)} • Persistence: {insights.persistence.replace(/_/g, ' ')}</Text>
        {insights.calculationNotes.map((note, index) => <Text key={`${note}-${index}`} style={styles.integrityNote}>• {note}</Text>)}
      </Panel>

      <BottomNav active="Insights" items={[
        ['⌂', 'Home', 'Portfolio'],
        ['▣', 'Wallets', 'Wallets'],
        ['✈', 'Travel', 'TravelMode'],
        ['◇', 'Security', 'SecurityCenter'],
        ['⌁', 'Insights', 'NomadInsights'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  tabs: { minHeight: 56, marginBottom: 16, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel, flexDirection: 'row', overflow: 'hidden' },
  tab: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  tabActive: { backgroundColor: 'rgba(32,239,112,.1)', borderBottomWidth: 2, borderBottomColor: C.green },
  tabText: { color: C.muted, fontSize: 11, fontWeight: '800' },
  tabTextActive: { color: C.green },
  focusPanel: { marginBottom: 16, padding: 15 },
  focusTitle: { color: C.green, fontSize: 11, fontWeight: '900' },
  focusValue: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 8 },
  focusNote: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 7 },
  errorBanner: { marginBottom: 14, borderWidth: 1, borderColor: C.red, borderRadius: 12, backgroundColor: 'rgba(255,77,99,.08)', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  overviewPanel: { padding: 18 },
  overviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  eyebrow: { color: C.green, fontSize: 12, fontWeight: '900' },
  snapshotLabel: { color: C.muted, fontSize: 9, marginTop: 4 },
  periodSelector: { borderWidth: 1, borderColor: C.border, borderRadius: 10, flexDirection: 'row', overflow: 'hidden' },
  periodButton: { minWidth: 46, minHeight: 34, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  periodButtonActive: { backgroundColor: 'rgba(32,239,112,.14)' },
  periodText: { color: C.muted, fontSize: 9, fontWeight: '900' },
  periodTextActive: { color: C.green },
  portfolioRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 14 },
  portfolioCompact: { flexDirection: 'column', alignItems: 'stretch' },
  portfolioCopy: { flex: 1, minWidth: 0 },
  portfolioLabel: { color: '#fff', fontSize: 13, fontWeight: '700' },
  portfolioValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 8 },
  portfolioValue: { flexShrink: 1, color: '#fff', fontSize: 46, fontWeight: '900', letterSpacing: -1.2 },
  usd: { color: '#fff', fontSize: 12 },
  growth: { color: C.green, fontSize: 10, fontWeight: '900', marginTop: 7 },
  historyUnavailable: { color: C.yellow, fontSize: 9, lineHeight: 14, marginTop: 7 },
  portfolioChartWrap: { flex: 1, minWidth: 250 },
  chart: { height: 112, position: 'relative', marginTop: 8 },
  chartGridLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: C.borderSoft },
  chartPoints: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', paddingTop: 5 },
  chartColumn: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'flex-end' },
  chartStemWrap: { height: 88, alignItems: 'center', justifyContent: 'flex-end' },
  chartStem: { width: 2 },
  chartDot: { width: 7, height: 7, borderRadius: 4, marginTop: -3 },
  chartLabel: { color: C.muted, fontSize: 7, marginTop: 5, maxWidth: 46 },
  emptyChart: { height: 112, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  emptyChartText: { color: C.muted, fontSize: 9 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 20 },
  statCard: { flexGrow: 1, flexBasis: 145, minHeight: 122, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: 'rgba(0,25,45,.7)', padding: 12 },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statIcon: { fontSize: 19, fontWeight: '900' },
  statLabel: { color: '#fff', fontSize: 9, marginTop: 8 },
  statValue: { color: '#fff', fontSize: 19, fontWeight: '900', marginTop: 10 },
  statNote: { fontSize: 9, fontWeight: '900', marginTop: 6 },
  sectionPanel: { marginTop: 17, padding: 17 },
  performancePanel: { marginTop: 17, paddingHorizontal: 17, paddingTop: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  link: { color: C.green, fontSize: 9, fontWeight: '900' },
  spendingBody: { flexDirection: 'row', gap: 20, marginTop: 18 },
  spendingCompact: { flexDirection: 'column' },
  spendingSummary: { flex: 1, minWidth: 240 },
  spendingLabel: { color: C.muted, fontSize: 9 },
  spendingValue: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 6 },
  spendingDelta: { color: C.yellow, fontSize: 9, fontWeight: '800', marginTop: 5 },
  distributionBar: { height: 12, borderRadius: 6, overflow: 'hidden', flexDirection: 'row', marginTop: 15 },
  distributionEmpty: { height: 34, marginTop: 15, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  distributionEmptyText: { color: C.muted, fontSize: 8 },
  categories: { flex: 1, minWidth: 240 },
  categoryRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center' },
  categoryDot: { width: 9, height: 9, borderRadius: 5, marginRight: 9 },
  categoryCopy: { flex: 1, minWidth: 0 },
  categoryHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  categoryLabel: { color: '#fff', fontSize: 10 },
  categoryAmount: { color: C.muted, fontSize: 9 },
  categoryPercent: { color: '#fff', fontSize: 9, fontWeight: '900', marginLeft: 9 },
  emptyText: { color: C.muted, fontSize: 10, lineHeight: 16, paddingVertical: 18 },
  insightRow: { minHeight: 66, marginTop: 15, borderWidth: 1, borderColor: C.green, borderRadius: 11, backgroundColor: 'rgba(4,75,36,.25)', padding: 11, flexDirection: 'row', alignItems: 'center' },
  insightCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  insightTitle: { color: C.green, fontSize: 11, fontWeight: '900' },
  insightText: { color: '#fff', fontSize: 9, lineHeight: 14, marginTop: 4 },
  chevron: { color: C.green, fontSize: 26, marginLeft: 8 },
  travelPanel: { marginTop: 17, padding: 17 },
  travelBody: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 17 },
  travelCompact: { flexWrap: 'wrap', alignItems: 'flex-start' },
  travelCopy: { flex: 1, minWidth: 210 },
  travelName: { color: '#fff', fontSize: 16, fontWeight: '900' },
  travelCurrency: { color: C.muted, fontSize: 9, marginVertical: 8 },
  travelMetric: { minWidth: 130 },
  travelMetricLabel: { color: C.muted, fontSize: 8 },
  travelMetricValue: { color: '#fff', fontSize: 15, fontWeight: '900', marginTop: 6 },
  travelMetricSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  performanceRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  assetBadge: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(22,140,255,.12)', alignItems: 'center', justifyContent: 'center' },
  assetMark: { color: '#fff', fontSize: 19, fontWeight: '900' },
  assetCopy: { flex: 1, minWidth: 95, marginLeft: 11 },
  assetName: { color: '#fff', fontSize: 11, fontWeight: '900' },
  assetSymbol: { color: C.muted, fontSize: 8, marginTop: 3 },
  snapshotPill: { borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4, marginHorizontal: 8 },
  snapshotPillText: { color: C.muted, fontSize: 7, fontWeight: '900' },
  assetPrice: { color: '#fff', fontSize: 10, fontWeight: '900', minWidth: 74, textAlign: 'right' },
  assetChange: { color: C.muted, fontSize: 9, fontWeight: '900', minWidth: 48, textAlign: 'right', marginLeft: 7 },
  rowChevron: { color: C.muted, fontSize: 23, marginLeft: 7 },
  freedomPanel: { minHeight: 104, marginTop: 17, padding: 16, flexDirection: 'row', alignItems: 'center' },
  freedomCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  freedomTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  freedomText: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 5 },
  scoreRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 6, borderColor: C.green, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  scoreValue: { color: C.green, fontSize: 23, fontWeight: '900' },
  scoreOut: { color: C.muted, fontSize: 7 },
  integrityPanel: { marginTop: 17, padding: 15 },
  integrityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  integrityTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  integritySource: { color: C.blue, fontSize: 7, fontWeight: '900', textAlign: 'right' },
  integrityText: { color: C.muted, fontSize: 8, marginTop: 7 },
  integrityNote: { color: '#d9e4f2', fontSize: 8, lineHeight: 13, marginTop: 6 },
});
