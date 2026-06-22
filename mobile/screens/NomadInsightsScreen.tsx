import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadInsights } from '../nomad';
import type { NomadInsightStat, NomadPerformanceRow, NomadSpendingCategory } from '../nomad';

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[{ borderRadius: 16, borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(3,16,30,0.94)', padding: 16 }, style]}>{children}</View>;
}

function SecurePill() {
  return (
    <View style={{ borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(3,16,30,0.94)', borderRadius: 26, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ color: '#35f883', fontSize: 24, marginRight: 10 }}>▾</Text>
      <View><Text style={{ color: '#d7e8ff', fontSize: 14 }}>All Systems</Text><Text style={{ color: '#35f883', fontWeight: '900', fontSize: 14 }}>SECURE</Text></View>
    </View>
  );
}

function Header({ error }: { error: string | null }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={{ color: '#35f883', fontSize: 44, fontWeight: '900', marginRight: 12 }}>⌁</Text>
          <View><Text style={{ color: 'white', fontSize: 28, fontWeight: '900' }}>Nomad Insights</Text><Text style={{ color: '#d7e8ff', fontSize: 16, marginTop: 4 }}>Your spending. Your savings. Your freedom.</Text></View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}><SecurePill /><Text style={{ color: '#d7e8ff', fontSize: 25, marginLeft: 10 }}>?</Text></View>
      </View>
      {error ? <Text style={{ color: '#ff455c', marginTop: 10 }}>{error}</Text> : null}
    </View>
  );
}

function TrendLine({ color = '#35f883' }: { color?: string }) {
  return <View style={{ height: 72, flex: 1, justifyContent: 'center' }}><View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', opacity: 0.95 }}>{[15, 25, 24, 42, 42, 58, 50, 70, 80].map((height, index) => <View key={`${height}-${index}`} style={{ width: 22, alignItems: 'center' }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, marginBottom: 2 }} /><View style={{ height, width: 2, backgroundColor: `${color}55` }} /></View>)}</View></View>;
}

function DonutChart({ total }: { total: string }) {
  return (
    <View style={{ width: 142, height: 142, borderRadius: 71, borderWidth: 24, borderColor: '#24d481', alignItems: 'center', justifyContent: 'center', shadowColor: '#35f883', shadowOpacity: 0.25, shadowRadius: 18 }}>
      <View style={{ position: 'absolute', width: 118, height: 118, borderRadius: 59, borderTopColor: '#1684ff', borderRightColor: '#8b5cff', borderBottomColor: '#ffb84d', borderLeftColor: '#cfd5dd', borderWidth: 13, transform: [{ rotate: '32deg' }] }} />
      <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>{total}</Text><Text style={{ color: 'white', fontSize: 13 }}>Total Spent</Text>
    </View>
  );
}

function StatTile({ stat }: { stat: NomadInsightStat }) {
  return <View style={{ width: '24%', borderRadius: 12, borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(0,25,45,0.72)', padding: 12 }}><Text style={{ color: stat.color, fontSize: 24, fontWeight: '900' }}>{stat.icon}</Text><Text style={{ color: 'white', marginTop: 8, fontSize: 13 }}>{stat.label}</Text><Text style={{ color: 'white', marginTop: 12, fontSize: 24, fontWeight: '900' }}>{stat.value}</Text><Text style={{ color: stat.color, marginTop: 8, fontWeight: '900' }}>{stat.note}</Text></View>;
}

function SpendingOverview({ total, delta, categories, insight }: { total: string; delta: string; categories: NomadSpendingCategory[]; insight: string }) {
  return (
    <Card style={{ marginTop: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>SPENDING OVERVIEW</Text><View style={{ borderWidth: 1, borderColor: '#2b5b8d', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}><Text style={{ color: 'white' }}>This Month ⌄</Text></View></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18 }}>
        <View style={{ width: '30%' }}><Text style={{ color: 'white', fontSize: 15 }}>Total Spent (This Month) ⓘ</Text><Text style={{ color: 'white', fontSize: 32, fontWeight: '900', marginTop: 12 }}>{total}</Text><Text style={{ color: '#35f883', fontSize: 16, fontWeight: '900', marginTop: 8 }}>{delta}</Text></View>
        <View style={{ width: '32%', alignItems: 'center' }}><DonutChart total={total} /></View>
        <View style={{ flex: 1 }}>{categories.map((item) => <View key={item.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}><View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color, marginRight: 8 }} /><Text style={{ color: 'white', fontSize: 13 }}>{item.label}</Text></View><Text style={{ color: 'white', width: 38, fontWeight: '900' }}>{item.percent}</Text><Text style={{ color: '#c8d4e6', width: 62, textAlign: 'right', fontSize: 12 }}>{item.amount}</Text></View>)}</View>
      </View>
      <View style={{ marginTop: 16, borderRadius: 10, borderWidth: 1, borderColor: '#13b55b', backgroundColor: 'rgba(4,75,36,0.35)', padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}><Text style={{ color: '#35f883', fontSize: 24, marginRight: 10 }}>✪</Text><View><Text style={{ color: '#35f883', fontWeight: '900' }}>Top Insight</Text><Text style={{ color: 'white', marginTop: 3 }}>{insight}</Text></View></View><Text style={{ color: '#35f883', fontSize: 28 }}>›</Text></View>
    </Card>
  );
}

function TravelActivity({ location, dateRange, spent, spentUsd, average, averageUsd }: { location: string; dateRange: string; spent: string; spentUsd: string; average: string; averageUsd: string }) {
  return <Card style={{ marginTop: 18 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}><Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>TRAVEL ACTIVITY</Text><Text style={{ color: '#35f883', fontWeight: '900' }}>View All Trips  ›</Text></View><View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: 'rgba(18,163,80,0.35)', borderWidth: 1, borderColor: '#13b55b', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}><Text style={{ color: '#35f883', fontSize: 34 }}>⌂</Text><Text style={{ position: 'absolute', bottom: -4, color: 'white' }}>🇯🇵</Text></View><View style={{ flex: 1 }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>{location}</Text><Text style={{ color: '#35f883', marginLeft: 12, fontWeight: '900', backgroundColor: 'rgba(19,181,91,0.35)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>ACTIVE</Text></View><Text style={{ color: '#c8d4e6', marginTop: 10 }}>{dateRange}</Text><View style={{ marginTop: 14, height: 6, borderRadius: 8, backgroundColor: '#123243', width: '75%' }}><View style={{ width: '84%', height: 6, borderRadius: 8, backgroundColor: '#35f883' }} /></View></View><View style={{ width: 150 }}><Text style={{ color: '#c8d4e6' }}>Spent from Pocket</Text><Text style={{ color: 'white', fontSize: 22, fontWeight: '900', marginTop: 10 }}>{spent}</Text><Text style={{ color: '#c8d4e6', marginTop: 4 }}>{spentUsd}</Text></View><View style={{ width: 140 }}><Text style={{ color: '#c8d4e6' }}>Daily Average</Text><Text style={{ color: 'white', fontSize: 22, fontWeight: '900', marginTop: 10 }}>{average}</Text><Text style={{ color: '#c8d4e6', marginTop: 4 }}>{averageUsd}</Text></View></View></Card>;
}

function PerformanceTable({ rows }: { rows: NomadPerformanceRow[] }) {
  return <Card style={{ marginTop: 18 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>PORTFOLIO PERFORMANCE</Text><Text style={{ color: 'white' }}>This Month ⌄</Text></View>{rows.map((row, index) => <View key={row.symbol} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: index === rows.length - 1 ? 0 : 1, borderBottomColor: '#0a263f', paddingVertical: 10 }}><View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: row.symbol === 'BTC' ? '#ff9500' : row.symbol === 'HBAR' ? '#6246ea' : row.symbol === 'XRP' ? '#2e3337' : row.symbol === 'USDC' ? '#1684ff' : '#19a669', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>{row.icon}</Text></View><View style={{ width: 154 }}><Text style={{ color: 'white', fontSize: 16, fontWeight: '800' }}>{row.asset}</Text><Text style={{ color: '#c8d4e6' }}>{row.symbol}</Text></View><TrendLine color={row.positive ? '#35f883' : '#ff3b4f'} /><Text style={{ color: 'white', width: 110, textAlign: 'right', fontSize: 16 }}>{row.price}</Text><Text style={{ color: row.positive ? '#35f883' : '#ff3b4f', width: 84, textAlign: 'right', fontSize: 16, fontWeight: '900' }}>{row.change}</Text></View>)}</Card>;
}

function FreedomScore({ score }: { score: number }) {
  return <View style={{ marginTop: 18, borderRadius: 16, borderWidth: 1, borderColor: '#13b55b', backgroundColor: 'rgba(4,75,36,0.35)', padding: 16, flexDirection: 'row', alignItems: 'center' }}><Text style={{ color: '#35f883', fontSize: 48, marginRight: 18 }}>♕</Text><View style={{ flex: 1 }}><Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>Freedom Score ⓘ</Text><Text style={{ color: 'white', marginTop: 8 }}>You're building true financial freedom.</Text></View><View style={{ width: 110, height: 110, borderRadius: 55, borderWidth: 13, borderColor: '#35f883', alignItems: 'center', justifyContent: 'center', marginRight: 22 }}><Text style={{ color: 'white', fontSize: 34, fontWeight: '900' }}>{score}</Text><Text style={{ color: 'white' }}>/100</Text></View><View style={{ width: 170 }}>{['Save consistently', 'Spend mindfully', 'Travel freely'].map((item) => <View key={item} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 5 }}><Text style={{ color: 'white', fontSize: 15 }}>{item}</Text><Text style={{ color: '#35f883', fontWeight: '900' }}>✓</Text></View>)}</View></View>;
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items = [{ label: 'Home', icon: '⌂', route: 'Portfolio' }, { label: 'Wallets', icon: '▣', route: 'Wallets' }, { label: 'Travel', icon: '✈', route: 'TravelMode' }, { label: 'Security', icon: '▾', route: 'SecurityCenter' }, { label: 'Insights', icon: '⌁', route: 'NomadInsights' }];
  return <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18, height: 82, borderRadius: 18, borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(3,16,30,0.98)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>{items.map((item) => { const active = item.label === 'Insights'; return <Pressable key={item.label} onPress={() => navigation.navigate(item.route)} style={{ alignItems: 'center', minWidth: 68 }}><Text style={{ color: active ? '#35f883' : '#c8d4e6', fontSize: 28, fontWeight: '900' }}>{item.icon}</Text><Text style={{ color: active ? '#35f883' : '#c8d4e6', fontSize: 14, marginTop: 4 }}>{item.label}</Text></Pressable>; })}</View>;
}

export default function NomadInsightsScreen() {
  const { insights, error } = useNomadInsights();
  return (
    <View style={{ flex: 1, backgroundColor: '#020812' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 26, paddingBottom: 118 }}>
        <Header error={error} />
        <Card style={{ borderColor: '#13b55b' }}>
          <Text style={{ color: '#35f883', fontSize: 16, fontWeight: '900' }}>OVERVIEW</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}><View style={{ width: '42%' }}><Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>Total Portfolio Value  ◎</Text><View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 14 }}><Text style={{ color: 'white', fontSize: 42, lineHeight: 46, fontWeight: '900' }}>{insights.totalPortfolioValue}</Text><Text style={{ color: 'white', fontSize: 20, marginLeft: 6, marginBottom: 4 }}>USD</Text></View><Text style={{ color: '#35f883', fontSize: 16, marginTop: 10, fontWeight: '900' }}>{insights.monthlyGrowth} ({insights.monthlyGrowthPercent}) <Text style={{ color: 'white', fontWeight: '400' }}>This Month</Text></Text></View><TrendLine /></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 }}>{insights.statCards.map((stat) => <StatTile key={stat.label} stat={stat} />)}</View>
        </Card>
        <SpendingOverview total={insights.spendingTotal} delta={insights.spendingDelta} categories={insights.spendingCategories} insight={insights.topInsight} />
        <TravelActivity location={insights.travelLocation} dateRange={insights.travelDateRange} spent={insights.travelPocketSpent} spentUsd={insights.travelPocketSpentUsd} average={insights.travelDailyAverage} averageUsd={insights.travelDailyAverageUsd} />
        <PerformanceTable rows={insights.performanceRows} />
        <FreedomScore score={insights.freedomScore} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}
