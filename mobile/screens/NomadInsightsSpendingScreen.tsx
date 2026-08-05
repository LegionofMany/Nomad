import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadInsights, useNomadTravel } from '../nomad';
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

function SpendingBars() {
  const bars = [30, 50, 66, 40, 59, 43, 24, 32, 21, 41, 25, 29, 58, 72, 31, 39, 41, 55, 32, 24, 38, 22, 30, 51, 27, 50, 29];
  return <View style={styles.barChart}>{bars.map((height, index) => <View key={`${height}-${index}`} style={[styles.bar, { height: `${height}%` }]} />)}</View>;
}

function CategoryRow({ category }: { category: { label: string; icon?: string; percent: string; amount: string; color: string } }) {
  const value = Number(category.percent.replace('%', '')) || 0;
  return <View style={styles.categoryRow}><RoundIcon symbol={category.icon || '•'} color={category.color} size={36} filled /><View style={styles.categoryCopy}><View style={styles.categoryHeading}><Text style={styles.categoryLabel}>{category.label}</Text><Text style={styles.categoryAmount}>{category.amount}</Text></View><ProgressBar value={value} color={category.color} height={6} /></View><Text style={styles.categoryPercent}>{category.percent}</Text></View>;
}

function BudgetCard({ budget }: { budget: { label: string; spent: string; total: string; percent: string; icon: string; color: string } }) {
  const percent = Number(budget.percent.replace('%', '')) || 0;
  return <View style={styles.budgetCard}><Text style={[styles.budgetIcon, { color: budget.color }]}>{budget.icon}</Text><Text style={styles.budgetLabel}>{budget.label}</Text><Text style={styles.budgetSpent}>{budget.spent} / {budget.total}</Text><View style={[styles.budgetRing, { borderColor: budget.color }]}><Text style={[styles.budgetPercent, { color: budget.color }]}>{budget.percent}</Text></View><ProgressBar value={percent} color={budget.color} height={5} /></View>;
}

export default function NomadInsightsSpendingScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { insights, loading, error, refresh } = useNomadInsights();
  const { travelPocket } = useNomadTravel();
  const [activeTab, setActiveTab] = useState<InsightTab>('Spending');
  const [period, setPeriod] = useState<'Month' | 'Week'>('Month');

  const region = travelPocket.regionInput || 'Global';
  const currentRows = useMemo(() => {
    if (/global|japan/i.test(region)) return insights.recentSpending;
    const genericNames = ['Local Dining', 'Regional Market', 'Public Transit', 'Local Services'];
    return insights.recentSpending.map((row, index) => ({
      ...row,
      name: `${region} ${genericNames[index % genericNames.length]}`,
      meta: `Recent activity • ${region}`,
      amount: row.usd,
      usd: travelPocket.localCurrency || travelPocket.preferredStablecoin || 'Local stable value',
    }));
  }, [insights.recentSpending, region, travelPocket.localCurrency, travelPocket.preferredStablecoin]);

  const tabs: InsightTab[] = ['Spending', 'Savings', 'Portfolio', 'Trends'];
  const summaryTitle = activeTab === 'Spending' ? 'SPENDING SUMMARY' : activeTab === 'Savings' ? 'SAVINGS SUMMARY' : activeTab === 'Portfolio' ? 'PORTFOLIO SUMMARY' : 'SPENDING TRENDS';

  return (
    <NomadPage maxWidth={980}>
      <PageHeader
        title="Nomad Insights"
        subtitle="Your spending. Your savings. Your freedom."
        icon="⌁"
        color={C.green}
        right={<Pressable disabled={loading} onPress={() => void refresh()} style={styles.refreshButton}><Text style={styles.refreshText}>{loading ? 'Syncing…' : 'Refresh'}</Text></Pressable>}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.tabs}>
        <Pressable onPress={() => navigation.navigate('NomadInsights')} style={styles.tab}><Text style={styles.tabText}>Overview</Text></Pressable>
        {tabs.map((tab) => <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}><Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text></Pressable>)}
      </View>

      <Panel style={styles.summaryPanel}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>{summaryTitle}</Text><Text style={styles.sectionSub}>{period === 'Month' ? 'Current month' : 'Current week'}</Text></View><Pressable onPress={() => setPeriod((value) => value === 'Month' ? 'Week' : 'Month')} style={styles.periodButton}><Text style={styles.periodText}>▣  This {period}  ⌄</Text></Pressable></View>

        <View style={[styles.summaryBody, compact && styles.summaryCompact]}>
          <View style={styles.totalCopy}><Text style={styles.totalLabel}>{activeTab === 'Savings' ? 'Estimated Savings' : activeTab === 'Portfolio' ? 'Portfolio Value' : 'Total Spent'}</Text><Text style={styles.totalValue}>{activeTab === 'Savings' ? insights.topSavings : activeTab === 'Portfolio' ? insights.totalPortfolioValue : insights.spendingTotal}</Text><Text style={styles.totalDelta}>{activeTab === 'Portfolio' ? insights.monthlyGrowthPercent : insights.spendingDelta}</Text></View>
          <View style={styles.chartWrap}><SpendingBars /><View style={styles.chartLabels}><Text style={styles.chartLabel}>Start</Text><Text style={styles.chartLabel}>Mid</Text><Text style={styles.chartLabel}>Now</Text></View></View>
        </View>

        <View style={styles.categoryPanel}>
          <Text style={styles.categoryTitle}>SPENDING BY CATEGORY</Text>
          <View style={[styles.categoryBody, compact && styles.categoryCompact]}>
            <View style={styles.donut}><Text style={styles.donutValue}>{insights.spendingTotal}</Text><Text style={styles.donutLabel}>TOTAL</Text></View>
            <View style={styles.categories}>{insights.spendingCategories.map((category) => <CategoryRow key={category.label} category={category} />)}</View>
          </View>
        </View>
      </Panel>

      <Panel tone="green" style={styles.insightPanel}>
        <RoundIcon symbol="✪" color={C.green} size={56} filled />
        <View style={styles.insightCopy}><Text style={styles.insightLabel}>TOP INSIGHT</Text><Text style={styles.insightText}>{insights.topInsight}</Text></View>
        <View style={styles.savingsCopy}><Text style={styles.savingsLabel}>You saved</Text><Text style={styles.savingsValue}>{insights.topSavings}</Text><Text style={styles.savingsNote}>Compared with your recent pattern</Text></View>
      </Panel>

      <Panel style={styles.recentPanel}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>RECENT SPENDING</Text><Text style={styles.sectionSub}>{region} • {travelPocket.localCurrency || 'Local value'}</Text></View><Pressable onPress={() => navigation.navigate('TravelMode')}><Text style={styles.link}>Travel Activity  ›</Text></Pressable></View>
        {currentRows.map((row, index) => <View key={`${row.name}-${index}`} style={[styles.transactionRow, index < currentRows.length - 1 && styles.rowBorder]}><RoundIcon symbol={row.icon} color={row.color} size={43} filled /><View style={styles.transactionCopy}><Text numberOfLines={1} style={styles.transactionName}>{row.name}</Text><Text style={styles.transactionMeta}>{row.meta}</Text></View><Text style={[styles.transactionCategory, { color: row.color }]}>{row.category}</Text><View style={styles.transactionAmount}><Text style={styles.transactionValue}>{row.amount}</Text><Text style={styles.transactionUsd}>{row.usd}</Text></View></View>)}
      </Panel>

      <Panel style={styles.budgetPanel}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>MONTHLY BUDGET TRACKER</Text><Text style={styles.sectionSub}>Planning indicators only</Text></View><Text style={styles.link}>Manage in Settings</Text></View>
        <View style={styles.budgetGrid}>{insights.budgets.map((budget) => <BudgetCard key={budget.label} budget={budget} />)}</View>
      </Panel>

      <BottomNav active="Insights" items={[
        ['⌂', 'Home', 'Portfolio'], ['▣', 'Wallets', 'Wallets'], ['✈', 'Travel', 'TravelMode'], ['◇', 'Security', 'SecurityCenter'], ['⌁', 'Insights', 'NomadInsightsSpending'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  refreshButton: { minHeight: 36, borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  refreshText: { color: C.green, fontSize: 9, fontWeight: '900' },
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  tabs: { minHeight: 57, borderBottomWidth: 1, borderBottomColor: C.borderSoft, flexDirection: 'row', marginBottom: 15 },
  tab: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: C.green },
  tabText: { color: '#d7e8ff', fontSize: 10 },
  tabTextActive: { color: C.green, fontWeight: '900' },
  summaryPanel: { padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  periodButton: { borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8 },
  periodText: { color: '#fff', fontSize: 9 },
  summaryBody: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 17 },
  summaryCompact: { flexDirection: 'column', alignItems: 'stretch' },
  totalCopy: { width: 215 },
  totalLabel: { color: C.muted, fontSize: 10 },
  totalValue: { color: '#fff', fontSize: 31, fontWeight: '900', marginTop: 8 },
  totalDelta: { color: C.green, fontSize: 10, fontWeight: '900', marginTop: 6 },
  chartWrap: { flex: 1, minWidth: 240 },
  barChart: { height: 135, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  bar: { flex: 1, maxWidth: 12, minHeight: 6, marginHorizontal: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: C.green, shadowColor: C.green, shadowOpacity: .3, shadowRadius: 6 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  chartLabel: { color: C.muted, fontSize: 8 },
  categoryPanel: { marginTop: 19, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel2, padding: 14 },
  categoryTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  categoryBody: { flexDirection: 'row', alignItems: 'center', gap: 22, marginTop: 15 },
  categoryCompact: { flexDirection: 'column' },
  donut: { width: 140, height: 140, borderRadius: 70, borderWidth: 18, borderColor: C.green, borderTopColor: C.blue, borderRightColor: C.purple, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '18deg' }] },
  donutValue: { color: '#fff', fontSize: 15, fontWeight: '900', transform: [{ rotate: '-18deg' }] },
  donutLabel: { color: C.muted, fontSize: 7, marginTop: 2, transform: [{ rotate: '-18deg' }] },
  categories: { flex: 1, width: '100%' },
  categoryRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center' },
  categoryCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  categoryHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  categoryLabel: { color: '#fff', fontSize: 9 },
  categoryAmount: { color: C.muted, fontSize: 8 },
  categoryPercent: { color: '#fff', fontSize: 9, fontWeight: '900', marginLeft: 9 },
  insightPanel: { minHeight: 100, marginTop: 15, padding: 15, flexDirection: 'row', alignItems: 'center' },
  insightCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  insightLabel: { color: C.green, fontSize: 10, fontWeight: '900' },
  insightText: { color: '#fff', fontSize: 11, lineHeight: 17, marginTop: 5 },
  savingsCopy: { width: 150, borderLeftWidth: 1, borderLeftColor: C.borderSoft, paddingLeft: 15, marginLeft: 13 },
  savingsLabel: { color: C.muted, fontSize: 8 },
  savingsValue: { color: C.green, fontSize: 18, fontWeight: '900', marginTop: 4 },
  savingsNote: { color: '#fff', fontSize: 8, marginTop: 4 },
  recentPanel: { marginTop: 15, paddingHorizontal: 16, paddingTop: 16 },
  link: { color: C.green, fontSize: 9, fontWeight: '900' },
  transactionRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  transactionCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  transactionName: { color: '#fff', fontSize: 11, fontWeight: '800' },
  transactionMeta: { color: C.muted, fontSize: 8, marginTop: 4 },
  transactionCategory: { width: 90, fontSize: 8, textAlign: 'right' },
  transactionAmount: { width: 95, alignItems: 'flex-end', marginLeft: 8 },
  transactionValue: { color: '#fff', fontSize: 12, fontWeight: '800' },
  transactionUsd: { color: C.muted, fontSize: 8, marginTop: 4 },
  budgetPanel: { marginTop: 15, padding: 16 },
  budgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 15 },
  budgetCard: { flexGrow: 1, flexBasis: 140, minHeight: 151, borderWidth: 1, borderColor: C.border, borderRadius: 12, alignItems: 'center', padding: 11 },
  budgetIcon: { fontSize: 20 },
  budgetLabel: { color: '#fff', fontSize: 9, fontWeight: '800', marginTop: 5 },
  budgetSpent: { color: C.muted, fontSize: 8, marginTop: 5 },
  budgetRing: { width: 59, height: 59, borderRadius: 30, borderWidth: 6, alignItems: 'center', justifyContent: 'center', marginVertical: 9 },
  budgetPercent: { fontSize: 12, fontWeight: '900' },
});
