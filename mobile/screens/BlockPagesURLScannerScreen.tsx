import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadSafety } from '../nomad';

const blue = '#0b8cff';
const green = '#22f060';
const yellow = '#ffb000';
const red = '#ff4d5e';
const bg = '#02070d';
const card = 'rgba(4,20,28,0.96)';
const border = '#173342';

type NavItem = { label: string; icon: string; route?: string; active?: boolean };
type Threat = { icon: string; title: string; subtitle: string; result: string; accent?: string };
type RiskLevel = 'low' | 'medium' | 'high';

type UrlScanResult = {
  score: number;
  risk: RiskLevel;
  summary: string;
};

const defaultUrl = 'blockpages.io';

const baseThreats: Threat[] = [
  { icon: '♢', title: 'Drainer Detection', subtitle: 'Checks for crypto drainer scripts and malicious contracts', result: 'No threats found' },
  { icon: '☣', title: 'Malicious Activity', subtitle: 'Checks for malware, phishing, and suspicious behavior', result: 'No malicious activity', accent: '#ffb000' },
  { icon: '▤', title: 'Smart Contract Risks', subtitle: 'Analyzes smart contracts for known vulnerabilities', result: 'No issues detected' },
  { icon: '▽', title: 'Phishing / Fake', subtitle: 'Checks for phishing indicators and fake websites', result: 'Not detected' },
  { icon: '♚', title: 'Community Reports', subtitle: 'Aggregates reports from the security community', result: '0 Negative' },
];

function riskColor(risk: RiskLevel) {
  if (risk === 'high') return red;
  if (risk === 'medium') return yellow;
  return green;
}

function riskLabel(risk: RiskLevel) {
  if (risk === 'high') return 'High Risk';
  if (risk === 'medium') return 'Medium Risk';
  return 'Low Risk';
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[{ borderWidth: 1, borderColor: border, borderRadius: 14, backgroundColor: card, padding: 18, marginBottom: 16 }, style]}>{children}</View>;
}

function HeaderIcon() {
  return (
    <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: green, alignItems: 'center', justifyContent: 'center', marginHorizontal: 14 }}>
      <Text style={{ color: green, fontSize: 27 }}>🌐</Text>
    </View>
  );
}

function ScoreRing({ score, risk }: { score: number; risk: RiskLevel }) {
  const tint = riskColor(risk);
  return (
    <View style={{ width: 144, height: 144, borderRadius: 72, borderWidth: 10, borderColor: tint, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,255,88,0.07)' }}>
      <Text style={{ color: tint, fontSize: 50, fontWeight: '900' }}>{score}</Text>
      <Text style={{ color: '#d6dde8', fontSize: 18 }}>/100</Text>
    </View>
  );
}

function ThreatRow({ item, risk }: { item: Threat; risk: RiskLevel }) {
  const tint = item.accent ?? riskColor(risk);
  const resultColor = risk === 'high' ? red : risk === 'medium' && item.title.includes('Phishing') ? yellow : green;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#12303c' }}>
      <Text style={{ color: tint, fontSize: 28, width: 50 }}>{item.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: 'white', fontSize: 17, fontWeight: '700' }}>{item.title}</Text>
        <Text style={{ color: '#aeb7c5', marginTop: 4, fontSize: 13, lineHeight: 18 }}>{item.subtitle}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
        <Text style={{ color: resultColor, fontSize: 15 }}>{item.result}</Text>
        <Text style={{ color: resultColor, fontSize: 25, marginTop: 4 }}>{risk === 'high' ? '!' : '✓'}</Text>
      </View>
    </View>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items: NavItem[] = [
    { label: 'Home', icon: '⌂', route: 'Portfolio' },
    { label: 'Wallets', icon: '▣', route: 'Wallets' },
    { label: 'Travel', icon: '✈', route: 'TravelMode' },
    { label: 'Security', icon: '♢', route: 'SecurityCenter' },
    { label: 'BlockPages', icon: '🌐', route: 'BlockPagesSafety', active: true },
  ];
  return (
    <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18, height: 76, borderRadius: 18, borderWidth: 1, borderColor: border, backgroundColor: 'rgba(4,16,24,0.98)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
      {items.map((item) => (
        <Pressable key={item.label} onPress={() => item.route && navigation.navigate(item.route)} style={{ alignItems: 'center', width: '20%' }}>
          <Text style={{ color: item.active ? green : '#d9d5df', fontSize: 27 }}>{item.icon}</Text>
          <Text style={{ color: item.active ? green : '#d9d5df', marginTop: 4, fontSize: 13 }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function BlockPagesURLScannerScreen() {
  const navigation = useNavigation<any>();
  const { scanUrl } = useNomadSafety();
  const [url, setUrl] = useState(defaultUrl);
  const [result, setResult] = useState<UrlScanResult>({ score: 92, risk: 'low', summary: 'No local URL threat flags detected. Ready for BlockPages live scanner integration.' });
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScan = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    try {
      const next = await scanUrl(url);
      setResult(next);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Unable to scan this URL right now.');
    } finally {
      setIsScanning(false);
    }
  }, [scanUrl, url]);

  useEffect(() => {
    void runScan();
  }, []);

  const threats = useMemo(() => {
    if (result.risk === 'low') return baseThreats;
    return baseThreats.map((item) => {
      if (item.title === 'Phishing / Fake') return { ...item, result: 'Review recommended' };
      if (item.title === 'Drainer Detection' && result.risk === 'high') return { ...item, result: 'Potential threat' };
      return item;
    });
  }, [result.risk]);

  const tint = riskColor(result.risk);
  const displayUrl = url.trim() || defaultUrl;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: 118 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 22 }}>
          <Pressable onPress={() => navigation.goBack()}><Text style={{ color: 'white', fontSize: 38 }}>‹</Text></Pressable>
          <HeaderIcon />
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 26, fontWeight: '900' }}>BlockPages URL Scanner</Text>
            <Text style={{ color: '#cfd5df', fontSize: 16, marginTop: 3 }}>Check any website before you click</Text>
          </View>
          <Text style={{ color: green, fontSize: 20, marginRight: 12 }}>History</Text>
          <Text style={{ color: green, fontSize: 26 }}>?</Text>
        </View>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', height: 62 }}>
            <View style={{ flex: 1, borderBottomWidth: 2, borderBottomColor: green, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: green, fontSize: 19, fontWeight: '800' }}>◉  Scan URL</Text></View>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' }}><Text style={{ color: '#d7d0d4', fontSize: 19 }}>🔗  Paste URL</Text></View>
          </View>
          <View style={{ margin: 18, minHeight: 64, borderWidth: 1, borderColor: '#263d49', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: green, fontSize: 31, marginHorizontal: 18 }}>⌕</Text>
            <TextInput
              accessibilityLabel="URL to scan"
              value={url}
              onChangeText={setUrl}
              placeholder="Enter or paste a URL to scan"
              placeholderTextColor="#918d94"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ color: 'white', flex: 1, fontSize: 18, paddingVertical: 12 }}
            />
            <Text style={{ color: green, fontSize: 25, marginRight: 16 }}>⌗</Text>
            <Pressable onPress={runScan} style={{ minHeight: 56, paddingHorizontal: 22, backgroundColor: '#35e843', borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
              <Text style={{ color: '#021108', fontSize: 19, fontWeight: '800' }}>{isScanning ? 'Scanning' : 'Scan'}</Text>
            </Pressable>
          </View>
          {error ? <Text style={{ color: red, marginHorizontal: 18, marginBottom: 16 }}>{error}</Text> : null}
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 170, height: 170, borderRadius: 85, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(25,255,80,0.07)' }}>
              <Text style={{ color: tint, fontSize: 88 }}>盾</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 28, fontWeight: '900' }}>{displayUrl}</Text>
                <Text style={{ color: tint, borderWidth: 1, borderColor: tint, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, fontSize: 16 }}>{result.risk === 'low' ? '✓ Verified Safe' : 'Review Required'}</Text>
              </View>
              <Text style={{ color: '#f3f5f7', fontSize: 18, lineHeight: 28, marginTop: 18 }}>{result.summary}</Text>
              <View style={{ flexDirection: 'row', marginTop: 14 }}>
                <Text style={{ color: tint, borderWidth: 1, borderColor: tint, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6, marginRight: 10 }}>Website</Text>
                <Text style={{ color: tint, borderWidth: 1, borderColor: tint, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 }}>{result.risk === 'low' ? 'Official' : 'Needs Review'}</Text>
              </View>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: '#17333d', marginVertical: 18 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View><Text style={{ color: '#cfd5df' }}>Scanned</Text><Text style={{ color: '#dfe5ef', marginTop: 6 }}>Live adapter check</Text></View>
            <View><Text style={{ color: '#cfd5df' }}>Source</Text><Text style={{ color: '#dfe5ef', marginTop: 6 }}>Nomad Safety Adapter</Text></View>
            <View><Text style={{ color: '#cfd5df' }}>Community Reports</Text><Text style={{ color: tint, marginTop: 6 }}>{result.risk === 'low' ? '0 Negative' : 'Pending Review'}</Text></View>
          </View>
        </Card>

        <Card>
          <Text style={{ color: tint, fontSize: 20, fontWeight: '900', marginBottom: 10 }}>RISK RATING  ⓘ</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ScoreRing score={result.score} risk={result.risk} />
            <View style={{ flex: 1, marginLeft: 26 }}>
              <Text style={{ color: tint, fontSize: 27 }}>{riskLabel(result.risk)}</Text>
              <Text style={{ color: 'white', fontSize: 18, lineHeight: 28, marginTop: 8 }}>{result.risk === 'low' ? 'No known threats detected. You can proceed with confidence.' : 'The safety adapter recommends reviewing this website before continuing.'}</Text>
              <View style={{ marginTop: 28, height: 10, borderRadius: 8, backgroundColor: '#e2323d', overflow: 'hidden' }}>
                <View style={{ width: `${Math.max(0, Math.min(100, result.score))}%`, height: 10, backgroundColor: tint }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}><Text style={{ color: '#bdc2ca' }}>0</Text><Text style={{ color: '#bdc2ca' }}>50</Text><Text style={{ color: '#bdc2ca' }}>100</Text></View>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={{ color: green, fontSize: 20, fontWeight: '900', marginBottom: 8 }}>THREAT ANALYSIS</Text>
          {threats.map((item) => <ThreatRow key={item.title} item={item} risk={result.risk} />)}
        </Card>

        <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#9c52ff', fontSize: 38, marginRight: 18 }}>♢</Text>
          <Text style={{ color: 'white', flex: 1, fontSize: 17, lineHeight: 25 }}>BlockPages protects you and the entire Web3 community. Report a false positive or contribute to the network.</Text>
          <Pressable style={{ borderWidth: 1, borderColor: '#9c52ff', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 18 }}><Text style={{ color: '#b36cff', fontSize: 16 }}>Report Issue</Text></Pressable>
        </Card>
      </ScrollView>
      <BottomNav />
    </View>
  );
}
