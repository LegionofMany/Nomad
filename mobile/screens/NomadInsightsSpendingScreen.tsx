import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadInsights } from '../nomad';
import type { NomadBudgetItem, NomadSpendingCategory, NomadSpendingTransaction } from '../nomad';

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[{ borderRadius: 16, borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(3,16,30,0.95)', padding: 16 }, style]}>{children}</View>;
}

function SecurePill() {
  return <View style={{ borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(3,16,30,0.95)', borderRadius: 28, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' }}><Text style={{ color: '#35f883', fontSize: 24, marginRight: 9 }}>▾</Text><View><Text style={{ color: '#d7e8ff', fontSize: 13 }}>All Systems</Text><Text style={{ color: '#35f883', fontSize: 13, fontWeight: '900' }}>SECURE</Text></View></View>;
}

function Header({ error }: { error: string | null }) {
  const navigation = useNavigation<any>();
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}><Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back"><Text style={{ color: 'white', fontSize: 36, marginRight: 12 }}>‹</Text></Pressable><Text style={{ color: '#35f883', fontSize: 43, fontWeight: '900', marginRight: 12 }}>⌁</Text><View><Text style={{ color: 'white', fontSize: 28, fontWeight: '900' }}>Nomad Insights</Text><Text style={{ color: '#d7e8ff', fontSize: 15, marginTop: 4 }}>Your spending. Your savings. Your freedom.</Text></View></View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}><SecurePill /><Text style={{ color: '#d7e8ff', fontSize: 25, marginLeft: 12 }}>?</Text></View>
      </View>
      {error ? <Text style={{ color: '#ff455c', marginTop: 10 }}>{error}</Text> : null}
      <View style={{ height: 1, backgroundColor: '#0a263f', marginTop: 18 }} />
    </View>
  );
}

function InsightsTabs() {
  const navigation = useNavigation<any>();
  const tabs = [{ label: 'Overview', route: 'NomadInsights' }, { label: 'Spending', route: 'NomadInsightsSpending' }, { label: 'Savings', route: 'NomadInsightsSpending' }, { label: 'Portfolio', route: 'NomadInsights' }, { label: 'Trends', route: 'NomadInsights' }];
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#0a263f', marginBottom: 12 }}>{tabs.map((tab) => { const active = tab.label === 'Spending'; return <Pressable key={tab.label} onPress={() => navigation.navigate(tab.route)} style={{ alignItems: 'center', paddingBottom: 11, flex: 1 }}><Text style={{ color: active ? '#35f883' : '#d7e8ff', fontSize: 17, fontWeight: active ? '900' : '500' }}>{tab.label}</Text>{active ? <View style={{ marginTop: 10, width: 92, height: 2, backgroundColor: '#35f883' }} /> : null}</Pressable>; })}</View>;
}

function BarChart() {
  const bars = [210, 310, 390, 220, 335, 245, 135, 175, 115, 225, 145, 160, 325, 405, 165, 210, 220, 305, 170, 135, 205, 120, 160, 285, 145, 285, 160];
  return <View style={{ flex: 1, height: 146, justifyContent: 'flex-end' }}><View style={{ position: 'absolute', left: 0, right: 0, top: 12, bottom: 26, justifyContent: 'space-between' }}>{[400, 300, 200, 100, 0].map((v) => <View key={v} style={{ borderTopWidth: 1, borderTopColor: '#123243', flexDirection: 'row', justifyContent: 'flex-end' }}><Text style={{ color: '#c8d4e6', fontSize: 12, marginTop: -8 }}>${v}</Text></View>)}</View><View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingRight: 42, height: 118 }}>{bars.map((height, index) => <View key={`${height}-${index}`} style={{ width: 9, height: height / 3, borderRadius: 4, backgroundColor: '#35f883', shadowColor: '#35f883', shadowOpacity: 0.45, shadowRadius: 8 }} />)}</View><View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: 42, marginTop: 7 }}>{['May 1', 'May 8', 'May 15', 'May 22', 'May 29'].map((label) => <Text key={label} style={{ color: '#c8d4e6', fontSize: 12 }}>{label}</Text>)}</View></View>;
}

function DonutChart({ total }: { total: string }) {
  return <View style={{ width: 142, height: 142, borderRadius: 71, borderWidth: 25, borderColor: '#24d481', alignItems: 'center', justifyContent: 'center', shadowColor: '#35f883', shadowOpacity: 0.25, shadowRadius: 16 }}><View style={{ position: 'absolute', width: 121, height: 121, borderRadius: 61, borderTopColor: '#1684ff', borderRightColor: '#8b5cff', borderBottomColor: '#ffb84d', borderLeftColor: '#cfd5dd', borderWidth: 15, transform: [{ rotate: '32deg' }] }} /><Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>{total}</Text><Text style={{ color: 'white', fontSize: 13 }}>Total Spent</Text></View>;
}

function SpendingSummary({ total, delta, categories }: { total: string; delta: string; categories: NomadSpendingCategory[] }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>SPENDING SUMMARY  ⓘ</Text><View style={{ borderWidth: 1, borderColor: '#2b5b8d', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}><Text style={{ color: 'white' }}>▣  This Month   ⌄</Text></View></View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: '32%' }}><Text style={{ color: '#d7e8ff', fontSize: 15 }}>Total Spent (This Month)</Text><Text style={{ color: 'white', fontSize: 37, fontWeight: '900', marginTop: 12 }}>{total}</Text><Text style={{ color: '#35f883', fontSize: 16, fontWeight: '900', marginTop: 8 }}>{delta}</Text></View><BarChart /></View>
      <View style={{ borderRadius: 14, borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(0,15,28,0.8)', padding: 14, marginTop: 20 }}><Text style={{ color: 'white', fontSize: 18, marginBottom: 16 }}>SPENDING BY CATEGORY  ⓘ</Text><View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: '38%', alignItems: 'center' }}><DonutChart total={total} /></View><View style={{ flex: 1 }}>{categories.map((item) => <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#0a263f', paddingVertical: 9 }}><Text style={{ color: item.color, fontSize: 20, width: 34 }}>{item.icon ?? '•'}</Text><Text style={{ color: 'white', flex: 1 }}>{item.label}</Text><Text style={{ color: 'white', width: 42, fontWeight: '900' }}>{item.percent}</Text><Text style={{ color: '#d7e8ff', width: 70, textAlign: 'right' }}>{item.amount}</Text><Text style={{ color: '#d7e8ff', fontSize: 24, marginLeft: 8 }}>›</Text></View>)}</View></View><Text style={{ color: '#35f883', textAlign: 'center', marginTop: 12, fontSize: 16, fontWeight: '800' }}>View All Categories   ›</Text></View>
    </Card>
  );
}

function TopInsight({ insight, savings }: { insight: string; savings: string }) {
  return <Card style={{ borderColor: '#13b55b', backgroundColor: 'rgba(4,75,36,0.35)', marginTop: 14 }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 78, height: 78, borderRadius: 39, borderWidth: 1, borderColor: '#13b55b', backgroundColor: 'rgba(18,163,80,0.35)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}><Text style={{ color: '#35f883', fontSize: 36 }}>✪</Text></View><View style={{ flex: 1 }}><Text style={{ color: '#35f883', fontSize: 16, fontWeight: '900' }}>TOP INSIGHT</Text><Text style={{ color: 'white', fontSize: 18, marginTop: 6 }}>{insight}</Text></View><View style={{ width: 1, height: 74, backgroundColor: '#0a3862', marginRight: 20 }} /><View style={{ width: 190 }}><Text style={{ color: '#d7e8ff' }}>You saved</Text><Text style={{ color: '#35f883', fontSize: 22, fontWeight: '900', marginTop: 3 }}>{savings}</Text><Text style={{ color: 'white', marginTop: 3 }}>Great job!</Text></View><Text style={{ color: '#35f883', fontSize: 52, transform: [{ rotate: '-35deg' }] }}>⌁</Text></View></Card>;
}

function RecentSpending({ rows }: { rows: NomadSpendingTransaction[] }) {
  return <Card style={{ marginTop: 14 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}><Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>RECENT SPENDING  ⓘ</Text><Text style={{ color: '#35f883', fontWeight: '900' }}>View All  ›</Text></View>{rows.map((row, index) => <View key={row.name} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: index === rows.length - 1 ? 0 : 1, borderBottomColor: '#0a263f', paddingVertical: 10 }}><View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${row.color}22`, borderWidth: 1, borderColor: row.color, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}><Text style={{ color: row.color, fontSize: 20 }}>{row.icon}</Text></View><View style={{ flex: 1 }}><Text style={{ color: 'white', fontSize: 16, fontWeight: '800' }}>{row.name}</Text><Text style={{ color: '#c8d4e6', marginTop: 4 }}>{row.meta}</Text></View><Text style={{ color: row.color, width: 130 }}>{row.category}</Text><View style={{ width: 90, alignItems: 'flex-end' }}><Text style={{ color: 'white', fontSize: 20 }}>{row.amount}</Text><Text style={{ color: '#c8d4e6', marginTop: 3 }}>{row.usd}</Text></View></View>)}</Card>;
}

function BudgetTracker({ budgets }: { budgets: NomadBudgetItem[] }) {
  return <Card style={{ marginTop: 14 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}><Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>MONTHLY BUDGET TRACKER  ⓘ</Text><Text style={{ color: '#35f883', fontWeight: '900' }}>Manage Budgets  ›</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>{budgets.map((budget) => <View key={budget.label} style={{ width: '19%', alignItems: 'center' }}><Text style={{ color: budget.color, fontSize: 20 }}>{budget.icon} <Text style={{ color: 'white', fontSize: 12 }}>{budget.label}</Text></Text><Text style={{ color: '#c8d4e6', marginTop: 8 }}>{budget.spent} / {budget.total}</Text><View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 6, borderColor: budget.color, alignItems: 'center', justifyContent: 'center', marginTop: 12, backgroundColor: `${budget.color}11` }}><Text style={{ color: budget.color, fontSize: 18, fontWeight: '900' }}>{budget.percent}</Text></View></View>)}</View></Card>;
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items = [{ label: 'Home', icon: '⌂', route: 'Portfolio' }, { label: 'Wallets', icon: '▣', route: 'Wallets' }, { label: 'Travel', icon: '✈', route: 'TravelMode' }, { label: 'Security', icon: '♢', route: 'SecurityCenter' }, { label: 'Insights', icon: '▥', route: 'NomadInsightsSpending' }];
  return <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18, height: 82, borderRadius: 18, borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(3,16,30,0.98)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>{items.map((item) => { const active = item.label === 'Insights'; return <Pressable key={item.label} onPress={() => navigation.navigate(item.route)} style={{ alignItems: 'center', width: '19%' }} accessibilityRole="button" accessibilityLabel={`Go to ${item.label}`}><Text style={{ color: active ? '#35f883' : '#d7e8ff', fontSize: 29 }}>{item.icon}</Text><Text style={{ color: active ? '#35f883' : '#d7e8ff', marginTop: 4, fontSize: 14 }}>{item.label}</Text></Pressable>; })}</View>;
}

export const NomadInsightsSpendingScreen = () => {
  const { insights, error } = useNomadInsights();
  return (
    <View style={{ flex: 1, backgroundColor: '#020812' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: 118 }} showsVerticalScrollIndicator={false}>
        <Header error={error} />
        <InsightsTabs />
        <SpendingSummary total={insights.spendingTotal} delta={insights.spendingDelta} categories={insights.spendingCategories} />
        <TopInsight insight={insights.topInsight} savings={insights.topSavings} />
        <RecentSpending rows={insights.recentSpending} />
        <BudgetTracker budgets={insights.budgets} />
      </ScrollView>
      <BottomNav />
    </View>
  );
};

export default NomadInsightsSpendingScreen;
