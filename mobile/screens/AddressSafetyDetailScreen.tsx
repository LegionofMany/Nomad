import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadSafety } from '../nomad';

type BottomItem = { label: string; icon: string; route?: string; active?: boolean };
type SummaryRow = { label: string; value: string; accent?: string; dot?: boolean };
type RiskRow = { label: string; value: string; risk?: 'low' | 'medium' | 'high' };
type ScanRisk = 'low' | 'medium' | 'high';

type AddressScanResult = {
  score: number;
  risk: ScanRisk;
  summary: string;
};

const BLUE = '#1494ff';
const GREEN = '#22f36d';
const YELLOW = '#ffb000';
const RED = '#ff4d5e';
const BG = '#02070d';
const CARD = 'rgba(3, 18, 25, 0.94)';
const BORDER = '#0d332d';
const MUTED = '#c5c7d1';
const DEFAULT_ADDRESS = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

function riskColor(risk: ScanRisk) {
  if (risk === 'high') return RED;
  if (risk === 'medium') return YELLOW;
  return GREEN;
}

function riskLabel(risk: ScanRisk) {
  if (risk === 'high') return 'High Risk';
  if (risk === 'medium') return 'Medium Risk';
  return 'Low Risk';
}

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

function AddressHero({ address, result, loading }: { address: string; result: AddressScanResult; loading: boolean }) {
  const tint = riskColor(result.risk);
  const isSafe = result.risk === 'low';

  return (
    <Card style={{ borderColor: tint, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 150, alignItems: 'center' }}>
        <View style={{ width: 120, height: 145, borderWidth: 8, borderColor: tint, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: tint, fontSize: 66, fontWeight: '900' }}>{isSafe ? '✓' : '!'}</Text>
        </View>
      </View>
      <View style={{ flex: 1, marginLeft: 18 }}>
        <Text style={{ color: 'white', fontSize: 30, fontWeight: '900' }}>{isSafe ? 'This address is safe' : 'Review this address'}</Text>
        <Text style={{ color: tint, fontSize: 24, marginTop: 10 }}>{loading ? 'Scanning address...' : result.summary}</Text>
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: 'white', fontSize: 24, lineHeight: 34, flex: 1 }}>{address}</Text>
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: GREEN, fontSize: 22, fontWeight: '900', marginBottom: 14 }}>{children}</Text>;
}

function SafetySummary({ rows }: { rows: SummaryRow[] }) {
  return (
    <Card>
      <SectionTitle>SAFETY SUMMARY</SectionTitle>
      {rows.map((row, index) => (
        <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderTopWidth: index === 0 ? 1 : 0, borderBottomWidth: index < rows.length - 1 ? 1 : 0, borderColor: 'rgba(255,255,255,0.08)' }}>
          <Text style={{ color: 'white', fontSize: 23 }}>{row.label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: row.accent || 'white', fontSize: 23 }}>{row.value}</Text>
            {row.dot ? <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: row.accent || GREEN, marginLeft: 12 }} /> : null}
          </View>
        </View>
      ))}
    </Card>
  );
}

function RiskChecks({ rows }: { rows: RiskRow[] }) {
  return (
    <Card>
      <SectionTitle>RISK CHECKS</SectionTitle>
      {rows.map((row, index) => {
        const tint = row.risk ? riskColor(row.risk) : GREEN;
        return (
          <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderTopWidth: index === 0 ? 1 : 0, borderBottomWidth: index < rows.length - 1 ? 1 : 0, borderColor: 'rgba(255,255,255,0.08)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: tint, fontSize: 30, marginRight: 18 }}>{row.risk === 'high' ? '!' : '✓'}</Text>
              <Text style={{ color: 'white', fontSize: 22 }}>{row.label}</Text>
            </View>
            <Text style={{ color: 'white', fontSize: 22 }}>{row.value}</Text>
          </View>
        );
      })}
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
    { label: 'BlockPages', icon: '🌐', route: 'BlockPagesSafety', active: true },
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
  const { scanAddress } = useNomadSafety();
  const [result, setResult] = useState<AddressScanResult>({ score: 92, risk: 'low', summary: 'No local safety flags detected. Ready for BlockPages live scan integration.' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await scanAddress(DEFAULT_ADDRESS);
      setResult(next);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Unable to scan address right now.');
    } finally {
      setLoading(false);
    }
  }, [scanAddress]);

  useEffect(() => {
    void runScan();
  }, []);

  const tint = riskColor(result.risk);
  const summaryRows = useMemo<SummaryRow[]>(() => [
    { label: 'Overall Risk', value: riskLabel(result.risk), accent: tint, dot: true },
    { label: 'BlockPages Score', value: `${result.score} / 100`, accent: tint },
    { label: 'Last Scanned', value: loading ? 'Scanning now' : 'Live adapter check' },
    { label: 'Source', value: 'Nomad Safety Adapter' },
    { label: 'Community Reports', value: result.risk === 'low' ? '0 Negative' : 'Review Pending', accent: tint },
  ], [loading, result.risk, result.score, tint]);

  const riskRows = useMemo<RiskRow[]>(() => [
    { label: 'Drainer Detection', value: result.risk === 'high' ? 'Potential threat' : 'No threats found', risk: result.risk === 'high' ? 'high' : 'low' },
    { label: 'Malicious Activity', value: result.risk === 'low' ? 'No malicious activity' : 'Review recommended', risk: result.risk },
    { label: 'Sanction Check', value: 'Not flagged', risk: 'low' },
    { label: 'Scam Reports', value: result.risk === 'low' ? 'No reports' : 'Review pending', risk: result.risk },
    { label: 'Phishing / Fake', value: result.risk === 'low' ? 'Not detected' : 'Possible pattern', risk: result.risk },
    { label: 'Contract Safety', value: 'Safe (if applicable)', risk: 'low' },
  ], [result.risk]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <Header />
        <AddressHero address={DEFAULT_ADDRESS} result={result} loading={loading} />
        {error ? <Text style={{ color: RED, marginBottom: 12 }}>{error}</Text> : null}
        <SafetySummary rows={summaryRows} />
        <RiskChecks rows={riskRows} />

        <Pressable accessibilityRole="button" onPress={runScan} style={{ borderWidth: 1, borderColor: GREEN, borderRadius: 10, paddingVertical: 20, alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ color: GREEN, fontSize: 25, fontWeight: '800' }}>{loading ? 'Scanning BlockPages...' : 'View on BlockPages.io'}</Text>
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
