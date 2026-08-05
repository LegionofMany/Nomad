import React, { useMemo } from 'react';
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

function Sparkline({ positive = true }: { positive?: boolean }) {
  const values = positive ? [22, 31, 28, 39, 44, 41, 55, 62, 70] : [66, 59, 61, 48, 52, 42, 45, 34, 29];
  const color = positive ? C.green : C.red;
  return <View style={styles.sparkline}>{values.map((height, index) => <View key={`${height}-${index}`} style={styles.sparkColumn}><View style={[styles.sparkDot, { backgroundColor: color }]} /><View style={[styles.sparkStem, { height, backgroundColor: `${color}45` }]} /></View>)}</View>;
}

function StatCard({ label, value, note, icon, color }: { label: string; value: string; note: string; icon: string; color: string }) {
  return <View style={styles.statCard}><Text style={[styles.statIcon, { color }]}>{icon}</Text><Text style={styles.statLabel}>{label}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>{value}</Text><Text style={[styles.statNote, { color }]}>{note}</Text></View>;
}

function CategoryRow({ label, percent, amount, color }: { label: string; percent: string; amount: string; color: string }) {
  const numeric = Number(percent.replace('%', '')) || 0;
  return <View style={styles.categoryRow}><View style={[styles.categoryDot, { backgroundColor: color }]} /><View style={styles.categoryCopy}><View style={styles.categoryHeading}><Text style={styles.categoryLabel}>{label}</Text><Text style={styles.categoryAmount}>{amount}</Text></View><View style={styles.categoryProgress}><ProgressBar value={numeric} color={color} height={6} /></View></View><Text style={styles.categoryPercent}>{percent}</Text></View>;
}

export default function NomadInsightsScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { insights, loading, error, refresh } = useNomadInsights();
  const { travelPocket } = useNomadTravel();

  const region = travelPocket.regionInput || 'Global';
  const regionCurrency = travelPocket.localCurrency || travelPocket.preferredStablecoin || 'USD Stable';
  const travelLocation = region === 'Global' ? insights.travelLocation : region;
  const travelBalance = travelPocket.pocketBalanceLocal || insights.travelPocketSpent;

  const performance = useMemo(() => insights.performanceRows.slice(0, 5), [insights.performanceRows]);

  return (
    <NomadPage maxWidth={980}>
      <PageHeader
        title="Nomad Insights"
        subtitle="Your spending. Your savings. Your freedom."
        icon="⌁"
        color={C.green}
        back={false}
        right={<Pressable disabled={loading} onPress={() => void refresh()} style={styles.refreshButton}><Text style={styles.refreshText}>{loading ? 'Syncing…' : 'Refresh'}</Text></Pressable>}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Panel tone="green" style={styles.overviewPanel}>
        <Text style={styles.eyebrow}>OVERVIEW</Text>
        <View style={[styles.portfolioRow, compact && styles.portfolioCompact]}>
          <View style={styles.portfolioCopy}><Text style={styles.portfolioLabel}>Total Portfolio Value  ◎</Text><View style={styles.portfolioValueRow}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.portfolioValue, { fontSize: compact ? 38 : 54 }]}>{insights.totalPortfolioValue}</Text><Text style={styles.usd}>USD</Text></View><Text style={styles.growth}>{insights.monthlyGrowth} ({insights.monthlyGrowthPercent}) <Text style={styles.growthLabel}>this month</Text></Text></View>
          <View style={styles.largeSpark}><Sparkline /></View>
        </View>
        <View style={styles.statGrid}>{insights.statCards.map((stat) => <StatCard key={stat.label} {...stat} />)}</View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>SPENDING OVERVIEW</Text><Text style={styles.sectionSub}>This month</Text></View><Pressable onPress={() => navigation.navigate('NomadInsightsSpending')}><Text style={styles.link}>View Spending  ›</Text></Pressable></View>
        <View style={[styles.spendingBody, compact && styles.spendingCompact]}>
          <View style={styles.spendingTotal}><Text style={styles.spendingLabel}>Total Spent</Text><Text style={styles.spendingValue}>{insights.spendingTotal}</Text><Text style={styles.spendingDelta}>{insights.spendingDelta}</Text><View style={styles.donut}><Text style={styles.donutValue}>{insights.spendingTotal}</Text><Text style={styles.donutLabel}>TOTAL</Text></View></View>
          <View style={styles.categories}>{insights.spendingCategories.map((category) => <CategoryRow key={category.label} {...category} />)}</View>
        </View>
        <Pressable onPress={() => navigation.navigate('NomadInsightsSpending')} style={styles.insightRow}><RoundIcon symbol="✪" color={C.green} size={42} filled /><View style={styles.insightCopy}><Text style={styles.insightTitle}>Top Insight</Text><Text style={styles.insightText}>{insights.topInsight}</Text></View><Text style={styles.chevron}>›</Text></Pressable>
      </Panel>

      <Panel tone="green" style={styles.travelPanel}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>TRAVEL ACTIVITY</Text><Text style={styles.sectionSub}>Current regional pocket</Text></View><Pressable onPress={() => navigation.navigate('TravelMode')}><Text style={styles.link}>Travel Pocket  ›</Text></Pressable></View>
        <View style={[styles.travelBody, compact && styles.travelCompact]}>
          <RoundIcon symbol="✈" color={C.green} size={65} filled />
          <View style={styles.travelCopy}><View style={styles.travelNameRow}><Text style={styles.travelName}>{travelLocation}</Text><Text style={styles.activePill}>{travelPocket.enabled ? 'ACTIVE' : 'READY'}</Text></View><Text style={styles.travelCurrency}>{regionCurrency}</Text><ProgressBar value={travelPocket.enabled ? 64 : 20} color={C.green} height={7} /></View>
          <View style={styles.travelMetric}><Text style={styles.travelMetricLabel}>Pocket Value</Text><Text style={styles.travelMetricValue}>{travelBalance}</Text><Text style={styles.travelMetricSub}>{travelPocket.pocketBalanceFiat || insights.travelPocketSpentUsd}</Text></View>
          <View style={styles.travelMetric}><Text style={styles.travelMetricLabel}>Daily Average</Text><Text style={styles.travelMetricValue}>{region === 'Global' ? insights.travelDailyAverage : 'Regional'}</Text><Text style={styles.travelMetricSub}>{region === 'Global' ? insights.travelDailyAverageUsd : 'Updates with activity'}</Text></View>
        </View>
      </Panel>

      <Panel style={styles.performancePanel}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>PORTFOLIO PERFORMANCE</Text><Text style={styles.sectionSub}>Current asset movement</Text></View><Pressable onPress={() => navigation.navigate('Wallets')}><Text style={styles.link}>Wallets  ›</Text></Pressable></View>
        {performance.map((row, index) => <View key={row.symbol} style={[styles.performanceRow, index < performance.length - 1 && styles.rowBorder]}><View style={[styles.assetBadge, { backgroundColor: row.symbol === 'BTC' ? '#ff9500' : row.symbol === 'HBAR' ? '#6246ea' : row.symbol === 'USDC' ? C.blue : '#26313d' }]}><Text style={styles.assetMark}>{row.icon}</Text></View><View style={styles.assetCopy}><Text style={styles.assetName}>{row.asset}</Text><Text style={styles.assetSymbol}>{row.symbol}</Text></View><View style={styles.rowSpark}><Sparkline positive={row.positive} /></View><Text style={styles.assetPrice}>{row.price}</Text><Text style={[styles.assetChange, { color: row.positive ? C.green : C.red }]}>{row.change}</Text></View>)}
      </Panel>

      <Panel tone="green" style={styles.freedomPanel}>
        <RoundIcon symbol="♕" color={C.green} size={57} filled />
        <View style={styles.freedomCopy}><Text style={styles.freedomTitle}>Freedom Score</Text><Text style={styles.freedomText}>A planning indicator based on savings, spending and wallet diversification—not financial advice.</Text></View>
        <View style={styles.scoreRing}><Text style={styles.scoreValue}>{insights.freedomScore}</Text><Text style={styles.scoreOut}>/100</Text></View>
      </Panel>

      <BottomNav active="Insights" items={[
        ['⌂', 'Home', 'Portfolio'], ['▣', 'Wallets', 'Wallets'], ['✈', 'Travel', 'TravelMode'], ['◇', 'Security', 'SecurityCenter'], ['⌁', 'Insights', 'NomadInsights'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  refreshButton: { minHeight: 36, borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  refreshText: { color: C.green, fontSize: 9, fontWeight: '900' },
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  overviewPanel: { padding: 18 },
  eyebrow: { color: C.green, fontSize: 12, fontWeight: '900' },
  portfolioRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 14 },
  portfolioCompact: { flexDirection: 'column', alignItems: 'stretch' },
  portfolioCopy: { flex: 1, minWidth: 0 },
  portfolioLabel: { color: '#fff', fontSize: 13, fontWeight: '700' },
  portfolioValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 8 },
  portfolioValue: { color: '#fff', fontWeight: '900', letterSpacing: -1.5 },
  usd: { color: '#fff', fontSize: 13 },
  growth: { color: C.green, fontSize: 12, fontWeight: '900', marginTop: 7 },
  growthLabel: { color: '#fff', fontWeight: '400' },
  largeSpark: { flex: 1, minWidth: 230 },
  sparkline: { height: 75, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sparkColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  sparkDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 2 },
  sparkStem: { width: 2 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 20 },
  statCard: { flexGrow: 1, flexBasis: 145, minHeight: 112, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: 'rgba(0,25,45,.7)', padding: 12 },
  statIcon: { fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#fff', fontSize: 9, marginTop: 7 },
  statValue: { color: '#fff', fontSize: 19, fontWeight: '900', marginTop: 11 },
  statNote: { fontSize: 9, fontWeight: '900', marginTop: 6 },
  sectionPanel: { marginTop: 17, padding: 17 },
  performancePanel: { marginTop: 17, paddingHorizontal: 17, paddingTop: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  link: { color: C.green, fontSize: 9, fontWeight: '900' },
  spendingBody: { flexDirection: 'row', gap: 20, marginTop: 18 },
  spendingCompact: { flexDirection: 'column' },
  spendingTotal: { width: 210, alignItems: 'center' },
  spendingLabel: { color: C.muted, fontSize: 9 },
  spendingValue: { color: '#fff', fontSize: 25, fontWeight: '900', marginTop: 6 },
  spendingDelta: { color: C.green, fontSize: 9, fontWeight: '800', marginTop: 5 },
  donut: { width: 130, height: 130, borderRadius: 65, borderWidth: 17, borderColor: C.green, borderTopColor: C.blue, borderRightColor: C.purple, alignItems: 'center', justifyContent: 'center', marginTop: 13, transform: [{ rotate: '12deg' }] },
  donutValue: { color: '#fff', fontSize: 14, fontWeight: '900', transform: [{ rotate: '-12deg' }] },
  donutLabel: { color: C.muted, fontSize: 7, marginTop: 2, transform: [{ rotate: '-12deg' }] },
  categories: { flex: 1, minWidth: 220 },
  categoryRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center' },
  categoryDot: { width: 9, height: 9, borderRadius: 5, marginRight: 9 },
  categoryCopy: { flex: 1, minWidth: 0 },
  categoryHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryLabel: { color: '#fff', fontSize: 10 },
  categoryAmount: { color: C.muted, fontSize: 9 },
  categoryProgress: { marginTop: 5 },
  categoryPercent: { color: '#fff', fontSize: 9, fontWeight: '900', marginLeft: 9 },
  insightRow: { minHeight: 66, marginTop: 15, borderWidth: 1, borderColor: C.green, borderRadius: 11, backgroundColor: 'rgba(4,75,36,.25)', padding: 11, flexDirection: 'row', alignItems: 'center' },
  insightCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  insightTitle: { color: C.green, fontSize: 11, fontWeight: '900' },
  insightText: { color: '#fff', fontSize: 9, marginTop: 4 },
  chevron: { color: C.green, fontSize: 26, marginLeft: 8 },
  travelPanel: { marginTop: 17, padding: 17 },
  travelBody: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 17 },
  travelCompact: { flexWrap: 'wrap', alignItems: 'flex-start' },
  travelCopy: { flex: 1, minWidth: 210 },
  travelNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  travelName: { color: '#fff', fontSize: 16, fontWeight: '900' },
  activePill: { color: C.green, backgroundColor: 'rgba(32,239,112,.14)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 8, fontWeight: '900' },
  travelCurrency: { color: C.muted, fontSize: 9, marginVertical: 8 },
  travelMetric: { minWidth: 120 },
  travelMetricLabel: { color: C.muted, fontSize: 8 },
  travelMetricValue: { color: '#fff', fontSize: 15, fontWeight: '900', marginTop: 6 },
  travelMetricSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  performanceRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  assetBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  assetMark: { color: '#fff', fontSize: 19, fontWeight: '900' },
  assetCopy: { width: 110 },
  assetName: { color: '#fff', fontSize: 11, fontWeight: '800' },
  assetSymbol: { color: C.muted, fontSize: 8, marginTop: 3 },
  rowSpark: { flex: 1, minWidth: 80, marginHorizontal: 8 },
  assetPrice: { color: '#fff', width: 85, fontSize: 10, textAlign: 'right' },
  assetChange: { width: 62, fontSize: 9, fontWeight: '900', textAlign: 'right' },
  freedomPanel: { minHeight: 105, marginTop: 17, padding: 15, flexDirection: 'row', alignItems: 'center' },
  freedomCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  freedomTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  freedomText: { color: '#fff', fontSize: 9, lineHeight: 14, marginTop: 5 },
  scoreRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 8, borderColor: C.green, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  scoreValue: { color: '#fff', fontSize: 21, fontWeight: '900' },
  scoreOut: { color: '#fff', fontSize: 7 },
});
