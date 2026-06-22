import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type BottomItem = { label: string; icon: string; route?: string; active?: boolean };
type SummaryRow = { label: string; value: string; accent?: string; dot?: boolean };
type RiskRow = { label: string; value: string };

const BLUE = '#1494ff';
const GREEN = '#22f36d';
const BG = '#02070d';
const CARD = 'rgba(3, 18, 25, 0.94)';
const BORDER = '#0d332d';
const MUTED = '#c5c7d1';

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: BORDER,
          backgroundColor: CARD,
          borderRadius: 16,
          padding: 18,
          marginBottom: 14,
          shadowColor: GREEN,
          shadowOpacity: 0.12,
          shadowRadius: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function Header() {
  const navigation = useNavigation<any>();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
        <Text style={{ color: 'white', fontSize: 40 }}>‹</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 10 }}>
        <View style={{ width: 64, height: 64, borderRadius: 18, borderWidth: 3, borderColor: GREEN, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: GREEN, fontSize: 34 }}>🌐</Text>
        </View>
        <View style={{ marginLeft: 16 }}>
          <Text style={{ color: 'white', fontSize: 30, fontWeight: '900' }}>Address Safety Detail</Text>
          <Text style={{ color: MUTED, fontSize: 19, marginTop: 3 }}>BlockPages</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: GREEN, fontSize: 22, marginRight: 12 }}>Help</Text>
        <View style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: GREEN, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: GREEN, fontWeight: '900', fontSize: 22 }}>?</Text>
        </View>
      </View>
    </View>
  );
}

function AddressHero() {
  return (
    <Card style={{ borderColor: GREEN, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 150, alignItems: 'center' }}>
        <View style={{ width: 120, height: 145, borderWidth: 8, borderColor: GREEN, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: GREEN, fontSize: 66, fontWeight: '900' }}>✓</Text>
        </View>
      </View>
      <View style={{ flex: 1, marginLeft: 18 }}>
        <Text style={{ color: 'white', fontSize: 30, fontWeight: '900' }}>This address is safe</Text>
        <Text style={{ color: GREEN, fontSize: 24, marginTop: 10 }}>No known risks detected</Text>
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: 'white', fontSize: 24, lineHeight: 34, flex: 1 }}>bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</Text>
          <Text style={{ color: 'white', fontSize: 32, marginLeft: 12 }}>▣</Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 18 }}>
          <View style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>₿</Text>
            <Text style={{ color: 'white', fontSize: 19 }}>Bitcoin</Text>
          </View>
          <View style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 8 }}>
            <Text style={{ color: 'white', fontSize: 19 }}>Address</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const summaryRows: SummaryRow[] = [
  { label: 'Overall Risk', value: 'Low Risk', accent: GREEN, dot: true },
  { label: 'BlockPages Score', value: '92 / 100', accent: GREEN },
  { label: 'Last Scanned', value: 'May 20, 2025 • 10:24 AM' },
  { label: 'Source', value: 'BlockPages Network' },
  { label: 'Community Reports', value: '0 Negative' },
];

const riskRows: RiskRow[] = [
  { label: 'Drainer Detection', value: 'No threats found' },
  { label: 'Malicious Activity', value: 'No malicious activity' },
  { label: 'Sanction Check', value: 'Not flagged' },
  { label: 'Scam Reports', value: 'No reports' },
  { label: 'Phishing / Fake', value: 'Not detected' },
  { label: 'Contract Safety', value: 'Safe (if applicable)' },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: GREEN, fontSize: 22, fontWeight: '900', marginBottom: 14 }}>{children}</Text>;
}

function SafetySummary() {
  return (
    <Card>
      <SectionTitle>SAFETY SUMMARY</SectionTitle>
      {summaryRows.map((row, index) => (
        <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderTopWidth: index === 0 ? 1 : 0, borderBottomWidth: index < summaryRows.length - 1 ? 1 : 0, borderColor: 'rgba(255,255,255,0.08)' }}>
          <Text style={{ color: 'white', fontSize: 23 }}>{row.label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: row.accent || 'white', fontSize: 23 }}>{row.value}</Text>
            {row.dot ? <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: GREEN, marginLeft: 12 }} /> : null}
          </View>
        </View>
      ))}
    </Card>
  );
}

function RiskChecks() {
  return (
    <Card>
      <SectionTitle>RISK CHECKS</SectionTitle>
      {riskRows.map((row, index) => (
        <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderTopWidth: index === 0 ? 1 : 0, borderBottomWidth: index < riskRows.length - 1 ? 1 : 0, borderColor: 'rgba(255,255,255,0.08)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: GREEN, fontSize: 30, marginRight: 18 }}>✓</Text>
            <Text style={{ color: 'white', fontSize: 22 }}>{row.label}</Text>
          </View>
          <Text style={{ color: 'white', fontSize: 22 }}>{row.value}</Text>
        </View>
      ))}
    </Card>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items: BottomItem[] = [
    { label: 'Home', icon: '⌂', route: 'Portfolio' },
    { label: 'Wallets', icon: '▣', route: 'Wallets' },
    { label: 'Travel', icon: '✈', route: 'TravelMode' },
    { label: 'Security', icon: '♢', route: 'SecurityCenter' },
    { label: 'BlockPages', icon: '🌐', active: true },
  ];
  return (
    <View style={{ height: 86, borderRadius: 18, borderWidth: 1, borderColor: '#12303a', backgroundColor: 'rgba(3,16,25,0.98)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 6 }}>
      {items.map((item) => (
        <Pressable key={item.label} onPress={() => item.route && navigation.navigate(item.route)} style={{ alignItems: 'center', width: '20%' }}>
          <Text style={{ color: item.active ? GREEN : '#e5dce7', fontSize: 31 }}>{item.icon}</Text>
          <Text style={{ color: item.active ? GREEN : '#e5dce7', fontSize: 17, marginTop: 5 }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const AddressSafetyDetailScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <Header />
        <AddressHero />
        <SafetySummary />
        <RiskChecks />

        <Pressable accessibilityRole="button" style={{ borderWidth: 1, borderColor: GREEN, borderRadius: 10, paddingVertical: 20, alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ color: GREEN, fontSize: 25, fontWeight: '800' }}>View on BlockPages.io</Text>
        </Pressable>

        <Pressable accessibilityRole="button" style={{ backgroundColor: GREEN, borderRadius: 10, paddingVertical: 22, alignItems: 'center', marginBottom: 22 }}>
          <Text style={{ color: '#001507', fontSize: 25, fontWeight: '900' }}>Add to Phonebook</Text>
        </Pressable>

        <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 54, height: 54, borderRadius: 27, borderWidth: 3, borderColor: BLUE, alignItems: 'center', justifyContent: 'center', marginRight: 24 }}>
            <Text style={{ color: BLUE, fontSize: 30, fontWeight: '900' }}>i</Text>
          </View>
          <Text style={{ color: 'white', fontSize: 23, lineHeight: 36, flex: 1 }}>BlockPages uses a decentralized network of scanners and community reports to assess address safety.</Text>
        </Card>

        <BottomNav />
      </ScrollView>
    </View>
  );
};

export default AddressSafetyDetailScreen;
