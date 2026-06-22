import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type Category = { label: string; icon: string; percent: string; amount: string; color: string };
type Spending = { name: string; meta: string; category: string; amount: string; usd: string; icon: string; color: string };
type Budget = { label: string; spent: string; total: string; percent: string; icon: string; color: string };

const categories: Category[] = [
  { label: 'Food & Dining', icon: '♨', percent: '34%', amount: '$424.12', color: '#35f883' },
  { label: 'Shopping', icon: '▢', percent: '24%', amount: '$299.18', color: '#1684ff' },
  { label: 'Transport', icon: '▰', percent: '18%', amount: '$224.36', color: '#8b5cff' },
  { label: 'Travel', icon: '✈', percent: '14%', amount: '$174.50', color: '#ffb84d' },
  { label: 'Other', icon: '•••', percent: '10%', amount: '$126.74', color: '#9aa7ba' },
];

const spendingRows: Spending[] = [
  { name: 'Starbucks Tokyo', meta: 'May 12, 2025 • 09:41 AM', category: 'Food & Dining', amount: '¥860', usd: '≈ $5.61 USD', icon: '☕', color: '#35f883' },
  { name: 'Don Quijote Shibuya', meta: 'May 12, 2025 • 11:23 AM', category: 'Shopping', amount: '¥3,250', usd: '≈ $21.19 USD', icon: '🛒', color: '#1684ff' },
  { name: 'JR Tokyo Station', meta: 'May 12, 2025 • 02:15 PM', category: 'Transport', amount: '¥950', usd: '≈ $6.18 USD', icon: '▣', color: '#8b5cff' },
  { name: 'Sushi Zanmai Ginza', meta: 'May 11, 2025 • 07:12 PM', category: 'Food & Dining', amount: '¥8,600', usd: '≈ $55.92 USD', icon: '寿', color: '#35f883' },
];

const budgets: Budget[] = [
  { label: 'Food & Dining', spent: '$424', total: '$600', percent: '71%', icon: '♨', color: '#35f883' },
  { label: 'Shopping', spent: '$299', total: '$500', percent: '60%', icon: '▢', color: '#1684ff' },
  { label: 'Transport', spent: '$224', total: '$400', percent: '56%', icon: '▰', color: '#8b5cff' },
  { label: 'Travel', spent: '$174', total: '$300', percent: '58%', icon: '✈', color: '#ffb84d' },
  { label: 'Other', spent: '$126', total: '$200', percent: '63%', icon: '•••', color: '#9aa7ba' },
];

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[{ borderRadius: 16, borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(3,16,30,0.95)', padding: 16 }, style]}>{children}</View>;
}

function SecurePill() {
  return (
    <View style={{ borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(3,16,30,0.95)', borderRadius: 28, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ color: '#35f883', fontSize: 24, marginRight: 9 }}>▾</Text>
      <View>
        <Text style={{ color: '#d7e8ff', fontSize: 13 }}>All Systems</Text>
        <Text style={{ color: '#35f883', fontSize: 13, fontWeight: '900' }}>SECURE</Text>
      </View>
    </View>
  );
}

function Header() {
  const navigation = useNavigation<any>();
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={{ color: 'white', fontSize: 36, marginRight: 12 }}>‹</Text>
          </Pressable>
          <Text style={{ color: '#35f883', fontSize: 43, fontWeight: '900', marginRight: 12 }}>⌁</Text>
          <View>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '900' }}>Nomad Insights</Text>
            <Text style={{ color: '#d7e8ff', fontSize: 15, marginTop: 4 }}>Your spending. Your savings. Your freedom.</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <SecurePill />
          <Text style={{ color: '#d7e8ff', fontSize: 25, marginLeft: 12 }}>?</Text>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: '#0a263f', marginTop: 18 }} />
    </View>
  );
}

function InsightsTabs() {
  const tabs = ['Overview', 'Spending', 'Savings', 'Portfolio', 'Trends'];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#0a263f', marginBottom: 12 }}>
      {tabs.map((tab) => {
        const active = tab === 'Spending';
        return (
          <View key={tab} style={{ alignItems: 'center', paddingBottom: 11, flex: 1 }}>
            <Text style={{ color: active ? '#35f883' : '#d7e8ff', fontSize: 17, fontWeight: active ? '900' : '500' }}>{tab}</Text>
            {active ? <View style={{ marginTop: 10, width: 92, height: 2, backgroundColor: '#35f883' }} /> : null}
          </View>
        );
      })}
    </View>
  );
}

function BarChart() {
  const bars = [210, 310, 390, 220, 335, 245, 135, 175, 115, 225, 145, 160, 325, 405, 165, 210, 220, 305, 170, 135, 205, 120, 160, 285, 145, 285, 160];
  return (
    <View style={{ flex: 1, height: 146, justifyContent: 'flex-end' }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 12, bottom: 26, justifyContent: 'space-between' }}>
        {[400, 300, 200, 100, 0].map((v) => <View key={v} style={{ borderTopWidth: 1, borderTopColor: '#123243', flexDirection: 'row', justifyContent: 'flex-end' }}><Text style={{ color: '#c8d4e6', fontSize: 12, marginTop: -8 }}>${v}</Text></View>)}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingRight: 42, height: 118 }}>
        {bars.map((height, index) => <View key={`${height}-${index}`} style={{ width: 9, height: height / 3, borderRadius: 4, backgroundColor: '#35f883', shadowColor: '#35f883', shadowOpacity: 0.45, shadowRadius: 8 }} />)}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: 42, marginTop: 7 }}>
        {['May 1', 'May 8', 'May 15', 'May 22', 'May 29'].map((label) => <Text key={label} style={{ color: '#c8d4e6', fontSize: 12 }}>{label}</Text>)}
      </View>
    </View>
  );
}

function DonutChart() {
  return (
    <View style={{ width: 142, height: 142, borderRadius: 71, borderWidth: 25, borderColor: '#24d481', alignItems: 'center', justifyContent: 'center', shadowColor: '#35f883', shadowOpacity: 0.25, shadowRadius: 16 }}>
      <View style={{ position: 'absolute', width: 121, height: 121, borderRadius: 61, borderTopColor: '#1684ff', borderRightColor: '#8b5cff', borderBottomColor: '#ffb84d', borderLeftColor: '#cfd5dd', borderWidth: 15, transform: [{ rotate: '32deg' }] }} />
      <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>$1,248.90</Text>
      <Text style={{ color: 'white', fontSize: 13 }}>Total Spent</Text>
    </View>
  );
}

function SpendingSummary() {
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>SPENDING SUMMARY  ⓘ</Text>
        <View style={{ borderWidth: 1, borderColor: '#2b5b8d', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}><Text style={{ color: 'white' }}>▣  This Month   ⌄</Text></View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: '32%' }}>
          <Text style={{ color: '#d7e8ff', fontSize: 15 }}>Total Spent (This Month)</Text>
          <Text style={{ color: 'white', fontSize: 37, fontWeight: '900', marginTop: 12 }}>$1,248.90</Text>
          <Text style={{ color: '#35f883', fontSize: 16, fontWeight: '900', marginTop: 8 }}>-8.4% vs last month</Text>
        </View>
        <BarChart />
      </View>
      <View style={{ borderRadius: 14, borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(0,15,28,0.8)', padding: 14, marginTop: 20 }}>
        <Text style={{ color: 'white', fontSize: 18, marginBottom: 16 }}>SPENDING BY CATEGORY  ⓘ</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: '38%', alignItems: 'center' }}><DonutChart /></View>
          <View style={{ flex: 1 }}>
            {categories.map((item) => (
              <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#0a263f', paddingVertical: 9 }}>
                <Text style={{ color: item.color, fontSize: 20, width: 34 }}>{item.icon}</Text>
                <Text style={{ color: 'white', flex: 1 }}>{item.label}</Text>
                <Text style={{ color: 'white', width: 42, fontWeight: '900' }}>{item.percent}</Text>
                <Text style={{ color: '#d7e8ff', width: 70, textAlign: 'right' }}>{item.amount}</Text>
                <Text style={{ color: '#d7e8ff', fontSize: 24, marginLeft: 8 }}>›</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={{ color: '#35f883', textAlign: 'center', marginTop: 12, fontSize: 16, fontWeight: '800' }}>View All Categories   ›</Text>
      </View>
    </Card>
  );
}

function TopInsight() {
  return (
    <Card style={{ borderColor: '#13b55b', backgroundColor: 'rgba(4,75,36,0.35)', marginTop: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 78, height: 78, borderRadius: 39, borderWidth: 1, borderColor: '#13b55b', backgroundColor: 'rgba(18,163,80,0.35)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}><Text style={{ color: '#35f883', fontSize: 36 }}>✪</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#35f883', fontSize: 16, fontWeight: '900' }}>TOP INSIGHT</Text>
          <Text style={{ color: 'white', fontSize: 18, marginTop: 6 }}>You spent 12% less on dining</Text>
          <Text style={{ color: '#d7e8ff', fontSize: 16, marginTop: 4 }}>compared to last month.</Text>
        </View>
        <View style={{ width: 1, height: 74, backgroundColor: '#0a3862', marginRight: 20 }} />
        <View style={{ width: 190 }}>
          <Text style={{ color: '#d7e8ff' }}>You saved</Text>
          <Text style={{ color: '#35f883', fontSize: 22, fontWeight: '900', marginTop: 3 }}>$56.40</Text>
          <Text style={{ color: 'white', marginTop: 3 }}>Great job!</Text>
        </View>
        <Text style={{ color: '#35f883', fontSize: 52, transform: [{ rotate: '-35deg' }] }}>⌁</Text>
      </View>
    </Card>
  );
}

function RecentSpending() {
  return (
    <Card style={{ marginTop: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>RECENT SPENDING  ⓘ</Text>
        <Text style={{ color: '#35f883', fontWeight: '900' }}>View All  ›</Text>
      </View>
      {spendingRows.map((row, index) => (
        <View key={row.name} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: index === spendingRows.length - 1 ? 0 : 1, borderBottomColor: '#0a263f', paddingVertical: 10 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${row.color}22`, borderWidth: 1, borderColor: row.color, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Text style={{ fontSize: 22 }}>{row.icon}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '800' }}>{row.name}</Text>
            <Text style={{ color: '#c8d4e6', marginTop: 4 }}>{row.meta}</Text>
          </View>
          <Text style={{ color: row.color, width: 130 }}>{row.category}</Text>
          <View style={{ width: 90, alignItems: 'flex-end' }}>
            <Text style={{ color: 'white', fontSize: 20 }}>{row.amount}</Text>
            <Text style={{ color: '#c8d4e6', marginTop: 3 }}>{row.usd}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

function BudgetTracker() {
  return (
    <Card style={{ marginTop: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>MONTHLY BUDGET TRACKER  ⓘ</Text>
        <Text style={{ color: '#35f883', fontWeight: '900' }}>Manage Budgets  ›</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {budgets.map((budget) => (
          <View key={budget.label} style={{ width: '19%', alignItems: 'center' }}>
            <Text style={{ color: budget.color, fontSize: 20 }}>{budget.icon} <Text style={{ color: 'white', fontSize: 12 }}>{budget.label}</Text></Text>
            <Text style={{ color: '#c8d4e6', marginTop: 8 }}>{budget.spent} / {budget.total}</Text>
            <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 6, borderColor: budget.color, alignItems: 'center', justifyContent: 'center', marginTop: 12, backgroundColor: `${budget.color}11` }}>
              <Text style={{ color: budget.color, fontSize: 18, fontWeight: '900' }}>{budget.percent}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items = [
    { label: 'Home', icon: '⌂', route: 'Portfolio' },
    { label: 'Wallets', icon: '▣', route: 'Wallets' },
    { label: 'Travel', icon: '✈', route: 'TravelMode' },
    { label: 'Security', icon: '♢', route: 'SecurityCenter' },
    { label: 'Insights', icon: '▥', route: 'NomadInsightsSpending' },
  ];
  return (
    <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18, height: 82, borderRadius: 18, borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(3,16,30,0.98)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
      {items.map((item) => {
        const active = item.label === 'Insights';
        return (
          <Pressable key={item.label} onPress={() => navigation.navigate(item.route)} style={{ alignItems: 'center', width: '19%' }} accessibilityRole="button" accessibilityLabel={`Go to ${item.label}`}>
            <Text style={{ color: active ? '#35f883' : '#d7e8ff', fontSize: 29 }}>{item.icon}</Text>
            <Text style={{ color: active ? '#35f883' : '#d7e8ff', marginTop: 4, fontSize: 14 }}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const NomadInsightsSpendingScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#020812' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: 118 }} showsVerticalScrollIndicator={false}>
        <Header />
        <InsightsTabs />
        <SpendingSummary />
        <TopInsight />
        <RecentSpending />
        <BudgetTracker />
      </ScrollView>
      <BottomNav />
    </View>
  );
};

export default NomadInsightsSpendingScreen;
