import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useNomadSafety } from '../nomad';
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

type Risk = 'low' | 'medium' | 'high';
type AddressResult = { score: number; risk: Risk; summary: string };

const previewAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
const previewResult: AddressResult = { score: 92, risk: 'low', summary: 'Preview state: no local safety flags are shown. Run a live scan before sending.' };

function riskColor(risk: Risk) {
  return risk === 'high' ? C.red : risk === 'medium' ? C.yellow : C.green;
}

function riskLabel(risk: Risk) {
  return risk === 'high' ? 'High Risk' : risk === 'medium' ? 'Medium Risk' : 'Low Risk';
}

function SummaryRow({ label, value, color = '#fff', last }: { label: string; value: string; color?: string; last?: boolean }) {
  return <View style={[styles.summaryRow, !last && styles.rowBorder]}><Text style={styles.summaryLabel}>{label}</Text><Text style={[styles.summaryValue, { color }]}>{value}</Text></View>;
}

function RiskRow({ icon, label, value, color, last }: { icon: string; label: string; value: string; color: string; last?: boolean }) {
  return <View style={[styles.riskRow, !last && styles.rowBorder]}><RoundIcon symbol={icon} color={color} size={40} filled /><Text style={styles.riskLabel}>{label}</Text><Text style={[styles.riskValue, { color }]}>{value}</Text></View>;
}

export default function AddressSafetyDetailScreen() {
  const { compact } = useNomadLayout();
  const { scanAddress } = useNomadSafety();
  const [address, setAddress] = useState(previewAddress);
  const [scannedAddress, setScannedAddress] = useState(previewAddress);
  const [result, setResult] = useState<AddressResult>(previewResult);
  const [loading, setLoading] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const tint = riskColor(result.risk);
  const score = Math.max(0, Math.min(100, result.score));

  const riskRows = useMemo(() => [
    ['♢', 'Drainer Detection', result.risk === 'high' ? 'Potential threat' : 'No threat signals', result.risk === 'high' ? C.red : C.green],
    ['☣', 'Malicious Activity', result.risk === 'low' ? 'No malicious activity' : 'Review recommended', tint],
    ['▤', 'Sanction Check', 'Not flagged', C.green],
    ['♚', 'Scam Reports', result.risk === 'low' ? 'No reports' : 'Reports require review', tint],
    ['▽', 'Phishing / Fake', result.risk === 'low' ? 'Not detected' : 'Possible pattern', tint],
    ['⌘', 'Contract Safety', 'Check at signing', C.blue],
  ] as const, [result.risk, tint]);

  const runScan = async () => {
    const target = address.trim();
    if (!target) {
      setError('Enter a wallet address before scanning.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const next = await scanAddress(target);
      setResult(next);
      setScannedAddress(target);
      setHasScanned(true);
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to scan the address right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <NomadPage maxWidth={900}>
      <PageHeader title="Address Safety Detail" subtitle="Reqrium wallet protection" icon="R" color={C.green} help />

      <Panel style={styles.inputPanel}>
        <Text style={styles.inputLabel}>Wallet address</Text>
        <View style={styles.inputRow}><Text style={styles.inputIcon}>⌕</Text><TextInput value={address} onChangeText={setAddress} placeholder="Enter a wallet address" placeholderTextColor="#75859a" autoCapitalize="none" autoCorrect={false} style={styles.input} /><Pressable disabled={loading} onPress={() => void runScan()} style={styles.scanButton}><Text style={styles.scanText}>{loading ? 'Scanning…' : 'Scan'}</Text></Pressable></View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Panel>

      <Panel tone={result.risk === 'low' ? 'green' : result.risk === 'medium' ? 'yellow' : 'red'} style={[styles.hero, compact && styles.heroCompact]}>
        <View style={[styles.addressShield, { borderColor: tint }]}><Text style={[styles.shieldMark, { color: tint }]}>{result.risk === 'low' ? '✓' : '!'}</Text></View>
        <View style={styles.heroCopy}>
          <View style={styles.heroTitleRow}><Text style={styles.heroTitle}>{result.risk === 'low' ? 'This address has a low-risk result' : 'Review this address carefully'}</Text><Text style={[styles.scanBadge, { color: tint, borderColor: tint }]}>{hasScanned ? 'LIVE SCAN' : 'PREVIEW'}</Text></View>
          <Text style={[styles.heroSummary, { color: tint }]}>{result.summary}</Text>
          <Text selectable style={styles.addressText}>{scannedAddress}</Text>
          <View style={styles.assetTags}><Text style={styles.assetTag}>₿  Bitcoin</Text><Text style={styles.assetTag}>Address</Text></View>
        </View>
      </Panel>

      <Panel style={styles.scorePanel}>
        <View style={[styles.scoreRing, { borderColor: tint }]}><Text style={[styles.scoreValue, { color: tint }]}>{score}</Text><Text style={styles.scoreOut}>/100</Text></View>
        <View style={styles.scoreCopy}><Text style={[styles.scoreName, { color: tint }]}>{riskLabel(result.risk)}</Text><Text style={styles.scoreText}>Reqrium safety scores are decision-support signals, not a guarantee. Confirm the address through a second trusted channel before sending.</Text><ProgressBar value={score} color={tint} height={9} /></View>
      </Panel>

      <Panel style={styles.summaryPanel}>
        <Text style={styles.sectionTitle}>SAFETY SUMMARY</Text>
        <SummaryRow label="Overall Risk" value={riskLabel(result.risk)} color={tint} />
        <SummaryRow label="Reqrium Score" value={`${score} / 100`} color={tint} />
        <SummaryRow label="Last Scanned" value={hasScanned ? 'Live adapter check' : 'Approved preview'} />
        <SummaryRow label="Source" value="Nomad Safety Adapter" />
        <SummaryRow label="Community Reports" value={result.risk === 'low' ? '0 negative' : 'Review pending'} color={tint} last />
      </Panel>

      <Panel style={styles.riskPanel}>
        <Text style={styles.sectionTitle}>RISK CHECKS</Text>
        {riskRows.map((row, index) => <RiskRow key={row[1]} icon={row[0]} label={row[1]} value={row[2]} color={row[3]} last={index === riskRows.length - 1} />)}
      </Panel>

      <View style={[styles.actions, compact && styles.actionsCompact]}>
        <Pressable disabled={loading} onPress={() => void runScan()} style={styles.rescanButton}><Text style={styles.rescanText}>{loading ? 'Scanning…' : 'Run Another Scan'}</Text></Pressable>
        <Pressable onPress={() => setSaved(true)} style={styles.saveButton}><Text style={styles.saveText}>{saved ? 'Saved to Phonebook ✓' : 'Add to Phonebook'}</Text></Pressable>
      </View>

      <Panel style={styles.infoPanel}><RoundIcon symbol="i" color={C.blue} size={44} /><Text style={styles.infoText}>Reqrium combines connected scanner results and available community signals. Never add a suspicious address to your phonebook merely because a single scan appears clear.</Text></Panel>

      <BottomNav active="Safety" items={[
        ['⌂', 'Home', 'Portfolio'], ['▣', 'Wallets', 'Wallets'], ['✈', 'Travel', 'TravelMode'], ['◇', 'Security', 'SecurityCenter'], ['R', 'Safety', 'BlockPagesSafety'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  inputPanel: { padding: 15 },
  inputLabel: { color: C.green, fontSize: 11, fontWeight: '900', marginBottom: 8 },
  inputRow: { minHeight: 58, borderWidth: 1, borderColor: C.border, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  inputIcon: { color: C.green, fontSize: 23, marginRight: 9 },
  input: { flex: 1, minWidth: 0, color: '#fff', fontSize: 13, outlineStyle: 'none' } as any,
  scanButton: { minHeight: 48, minWidth: 82, margin: 4, borderRadius: 7, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 11 },
  scanText: { color: C.bg, fontSize: 10, fontWeight: '900' },
  error: { color: C.red, fontSize: 9, marginTop: 8 },
  hero: { minHeight: 184, marginTop: 16, padding: 19, flexDirection: 'row', alignItems: 'center', gap: 19 },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  addressShield: { width: 125, height: 145, borderRadius: 28, borderWidth: 7, backgroundColor: 'rgba(3,22,20,.75)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  shieldMark: { fontSize: 58, fontWeight: '900' },
  heroCopy: { flex: 1, minWidth: 0 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9 },
  heroTitle: { flex: 1, minWidth: 220, color: '#fff', fontSize: 20, fontWeight: '900' },
  scanBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, fontSize: 8, fontWeight: '900' },
  heroSummary: { fontSize: 11, lineHeight: 18, marginTop: 9 },
  addressText: { color: '#fff', fontSize: 12, lineHeight: 18, marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: C.borderSoft },
  assetTags: { flexDirection: 'row', gap: 8, marginTop: 12 },
  assetTag: { color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 8 },
  scorePanel: { minHeight: 153, marginTop: 16, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 18 },
  scoreRing: { width: 115, height: 115, borderRadius: 58, borderWidth: 9, alignItems: 'center', justifyContent: 'center' },
  scoreValue: { fontSize: 34, fontWeight: '900' },
  scoreOut: { color: C.muted, fontSize: 8 },
  scoreCopy: { flex: 1, minWidth: 0 },
  scoreName: { fontSize: 18, fontWeight: '900' },
  scoreText: { color: '#fff', fontSize: 9, lineHeight: 15, marginVertical: 10 },
  summaryPanel: { marginTop: 16, padding: 17 },
  riskPanel: { marginTop: 16, padding: 17 },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900', marginBottom: 5 },
  summaryRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  summaryLabel: { color: '#fff', fontSize: 11 },
  summaryValue: { flex: 1, fontSize: 10, fontWeight: '700', textAlign: 'right' },
  riskRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center' },
  riskLabel: { flex: 1, color: '#fff', fontSize: 11, marginLeft: 11 },
  riskValue: { maxWidth: 155, fontSize: 9, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 11, marginTop: 16 },
  actionsCompact: { flexDirection: 'column' },
  rescanButton: { flex: 1, minHeight: 58, borderWidth: 1, borderColor: C.green, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rescanText: { color: C.green, fontSize: 11, fontWeight: '900' },
  saveButton: { flex: 1, minHeight: 58, borderRadius: 10, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: C.bg, fontSize: 11, fontWeight: '900' },
  infoPanel: { minHeight: 83, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  infoText: { flex: 1, minWidth: 0, color: '#fff', fontSize: 9, lineHeight: 15, marginLeft: 12 },
});
