import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

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

type RiskLevel = 'low' | 'medium' | 'high';
type ScanResult = { score: number; risk: RiskLevel; summary: string };

type Threat = { icon: string; title: string; subtitle: string; safe: string; warning: string; color: string };

const previewResult: ScanResult = {
  score: 92,
  risk: 'low',
  summary: 'Preview state: no local threat flags are shown. Run a scan before relying on this result.',
};

const threatChecks: Threat[] = [
  { icon: '♢', title: 'Drainer Detection', subtitle: 'Checks for crypto drainer scripts and malicious transaction prompts', safe: 'No threats found', warning: 'Review recommended', color: C.green },
  { icon: '☣', title: 'Malicious Activity', subtitle: 'Checks phishing, malware and suspicious redirect signals', safe: 'No malicious activity', warning: 'Suspicious signals', color: C.yellow },
  { icon: '▤', title: 'Smart Contract Risks', subtitle: 'Reviews known contract and wallet-connection risk indicators', safe: 'No issues detected', warning: 'Contract review needed', color: C.blue },
  { icon: '▽', title: 'Phishing / Fake', subtitle: 'Checks impersonation, look-alike and fake-login indicators', safe: 'Not detected', warning: 'Potential impersonation', color: C.purple },
  { icon: '♚', title: 'Community Reports', subtitle: 'Includes available community and connected safety reports', safe: '0 negative', warning: 'Reports found', color: C.orange },
];

function riskColor(risk: RiskLevel) {
  if (risk === 'high') return C.red;
  if (risk === 'medium') return C.yellow;
  return C.green;
}

function riskLabel(risk: RiskLevel) {
  if (risk === 'high') return 'High Risk';
  if (risk === 'medium') return 'Medium Risk';
  return 'Low Risk';
}

export default function BlockPagesURLScannerScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { scanUrl } = useNomadSafety();
  const [url, setUrl] = useState('https://reqrium.com');
  const [result, setResult] = useState<ScanResult>(previewResult);
  const [scannedUrl, setScannedUrl] = useState('https://reqrium.com');
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [error, setError] = useState('');
  const [reported, setReported] = useState(false);

  const tint = riskColor(result.risk);
  const score = Math.max(0, Math.min(100, result.score));
  const displayHost = useMemo(() => {
    try { return new URL(scannedUrl).hostname || scannedUrl; } catch { return scannedUrl || 'No URL selected'; }
  }, [scannedUrl]);

  const runScan = async () => {
    const target = url.trim();
    if (!target) {
      setError('Enter a URL before scanning.');
      return;
    }
    try {
      setIsScanning(true);
      setError('');
      const next = await scanUrl(target);
      setResult(next);
      setScannedUrl(target);
      setHasScanned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to scan this URL right now.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <NomadPage maxWidth={920}>
      <PageHeader title="Reqrium URL Scanner" subtitle="Check a website before you click" icon="◎" color={C.green} help />

      <Panel style={styles.inputPanel}>
        <View style={styles.tabs}><View style={[styles.tab, styles.tabActive]}><Text style={styles.tabActiveText}>◎  Scan URL</Text></View><View style={styles.tab}><Text style={styles.tabText}>🔗  Paste or type</Text></View></View>
        <View style={[styles.inputRow, compact && styles.inputCompact]}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput value={url} onChangeText={setUrl} placeholder="Enter or paste a URL" placeholderTextColor="#7d8b9d" autoCapitalize="none" autoCorrect={false} keyboardType="url" style={styles.input} />
          <Pressable disabled={isScanning} onPress={() => void runScan()} style={styles.scanButton}><Text style={styles.scanText}>{isScanning ? 'Scanning…' : 'Scan'}</Text></Pressable>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Panel>

      <Panel tone={result.risk === 'low' ? 'green' : result.risk === 'medium' ? 'yellow' : 'red'} style={styles.resultPanel}>
        <View style={[styles.resultTop, compact && styles.resultCompact]}>
          <View style={[styles.siteShield, { borderColor: tint }]}><Text style={[styles.siteShieldMark, { color: tint }]}>R</Text><Text style={[styles.siteShieldCheck, { backgroundColor: tint }]}>{result.risk === 'low' ? '✓' : '!'}</Text></View>
          <View style={styles.resultCopy}>
            <View style={styles.resultHeading}><Text numberOfLines={1} style={styles.host}>{displayHost}</Text><Text style={[styles.resultBadge, { color: tint, borderColor: tint }]}>{hasScanned ? (result.risk === 'low' ? '✓ Verified by scan' : 'Review required') : 'PREVIEW'}</Text></View>
            <Text style={styles.summary}>{result.summary}</Text>
            <View style={styles.tags}><Text style={[styles.tag, { color: tint, borderColor: tint }]}>Website</Text><Text style={[styles.tag, { color: tint, borderColor: tint }]}>{result.risk === 'low' ? 'Low risk' : 'Needs review'}</Text></View>
          </View>
        </View>
        <View style={styles.metadata}>
          <View style={styles.metadataItem}><Text style={styles.metadataLabel}>Status</Text><Text style={styles.metadataValue}>{hasScanned ? 'Live adapter check' : 'Approved preview'}</Text></View>
          <View style={styles.metadataItem}><Text style={styles.metadataLabel}>Source</Text><Text style={styles.metadataValue}>Nomad Safety Adapter</Text></View>
          <View style={styles.metadataItem}><Text style={styles.metadataLabel}>Community Reports</Text><Text style={[styles.metadataValue, { color: tint }]}>{result.risk === 'low' ? '0 negative' : 'Review available reports'}</Text></View>
        </View>
      </Panel>

      <Panel style={styles.riskPanel}>
        <Text style={[styles.sectionTitle, { color: tint }]}>RISK RATING  ⓘ</Text>
        <View style={[styles.riskBody, compact && styles.riskCompact]}>
          <View style={[styles.scoreRing, { borderColor: tint }]}><Text style={[styles.scoreValue, { color: tint }]}>{score}</Text><Text style={styles.scoreOut}>/100</Text></View>
          <View style={styles.riskCopy}><Text style={[styles.riskName, { color: tint }]}>{riskLabel(result.risk)}</Text><Text style={styles.riskDescription}>{result.risk === 'low' ? 'No known threat signals were returned by the current scan. Still verify the domain and requested wallet action.' : 'Pause before opening, connecting a wallet or signing. Review every flagged signal.'}</Text><ProgressBar value={score} color={tint} height={10} /><View style={styles.scale}><Text style={styles.scaleText}>0</Text><Text style={styles.scaleText}>50</Text><Text style={styles.scaleText}>100</Text></View></View>
        </View>
      </Panel>

      <Panel style={styles.threatPanel}>
        <Text style={styles.sectionTitle}>THREAT ANALYSIS</Text>
        {threatChecks.map((threat, index) => {
          const safe = result.risk === 'low' || (result.risk === 'medium' && index < 2);
          return <View key={threat.title} style={[styles.threatRow, index < threatChecks.length - 1 && styles.rowBorder]}><RoundIcon symbol={threat.icon} color={threat.color} size={44} filled /><View style={styles.threatCopy}><Text style={styles.threatTitle}>{threat.title}</Text><Text style={styles.threatSub}>{threat.subtitle}</Text></View><View style={styles.threatResult}><Text style={[styles.threatResultText, { color: safe ? C.green : tint }]}>{safe ? threat.safe : threat.warning}</Text><Text style={[styles.threatCheck, { color: safe ? C.green : tint }]}>{safe ? '✓' : '!'}</Text></View></View>;
        })}
      </Panel>

      <Panel style={styles.communityPanel}>
        <RoundIcon symbol="R" color={C.purple} size={50} filled />
        <View style={styles.communityCopy}><Text style={styles.communityTitle}>Help strengthen Reqrium</Text><Text style={styles.communityText}>Report a false positive or suspicious URL. Reports should never include recovery phrases, private keys or passwords.</Text></View>
        <Pressable onPress={() => setReported(true)} style={styles.reportButton}><Text style={styles.reportText}>{reported ? 'Reported ✓' : 'Report Issue'}</Text></Pressable>
      </Panel>

      <BottomNav active="Safety" items={[
        ['⌂', 'Home', 'Portfolio'], ['▣', 'Wallets', 'Wallets'], ['✈', 'Travel', 'TravelMode'], ['◇', 'Security', 'SecurityCenter'], ['R', 'Safety', 'BlockPagesSafety'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  inputPanel: { overflow: 'hidden' },
  tabs: { minHeight: 56, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: C.green, backgroundColor: 'rgba(32,239,112,.04)' },
  tabText: { color: '#d6dee9', fontSize: 11 },
  tabActiveText: { color: C.green, fontSize: 11, fontWeight: '900' },
  inputRow: { minHeight: 67, margin: 16, borderWidth: 1, borderColor: C.border, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingLeft: 13 },
  inputCompact: { minHeight: 61 },
  searchIcon: { color: C.green, fontSize: 25, marginRight: 10 },
  input: { flex: 1, minWidth: 0, color: '#fff', fontSize: 14, outlineStyle: 'none' } as any,
  scanButton: { minHeight: 53, minWidth: 88, margin: 4, borderRadius: 7, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13 },
  scanText: { color: C.bg, fontSize: 12, fontWeight: '900' },
  error: { color: C.red, fontSize: 10, marginHorizontal: 16, marginBottom: 12 },
  resultPanel: { marginTop: 16, padding: 18 },
  resultTop: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  resultCompact: { flexDirection: 'column', alignItems: 'stretch' },
  siteShield: { width: 130, height: 130, borderRadius: 31, borderWidth: 5, backgroundColor: 'rgba(3,22,31,.88)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  siteShieldMark: { fontSize: 57, fontWeight: '900' },
  siteShieldCheck: { position: 'absolute', right: -9, bottom: -9, width: 42, height: 42, borderRadius: 21, color: C.bg, fontSize: 22, fontWeight: '900', textAlign: 'center', textAlignVertical: 'center' },
  resultCopy: { flex: 1, minWidth: 0 },
  resultHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  host: { flex: 1, minWidth: 180, color: '#fff', fontSize: 22, fontWeight: '900' },
  resultBadge: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, fontSize: 9, fontWeight: '900' },
  summary: { color: '#f0f4f7', fontSize: 11, lineHeight: 18, marginTop: 11 },
  tags: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 8 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 18, paddingTop: 15, borderTopWidth: 1, borderTopColor: C.borderSoft },
  metadataItem: { flex: 1, minWidth: 145 },
  metadataLabel: { color: C.muted, fontSize: 8 },
  metadataValue: { color: '#dfe5ef', fontSize: 9, marginTop: 5 },
  riskPanel: { marginTop: 16, padding: 18 },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900' },
  riskBody: { flexDirection: 'row', alignItems: 'center', gap: 22, marginTop: 15 },
  riskCompact: { flexDirection: 'column' },
  scoreRing: { width: 134, height: 134, borderRadius: 67, borderWidth: 10, alignItems: 'center', justifyContent: 'center' },
  scoreValue: { fontSize: 42, fontWeight: '900' },
  scoreOut: { color: C.muted, fontSize: 10 },
  riskCopy: { flex: 1, width: '100%' },
  riskName: { fontSize: 21, fontWeight: '900' },
  riskDescription: { color: '#fff', fontSize: 11, lineHeight: 18, marginVertical: 11 },
  scale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  scaleText: { color: C.muted, fontSize: 8 },
  threatPanel: { marginTop: 16, padding: 17 },
  threatRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  threatCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  threatTitle: { color: '#fff', fontSize: 12, fontWeight: '800' },
  threatSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  threatResult: { alignItems: 'flex-end', marginLeft: 8, maxWidth: 135 },
  threatResultText: { fontSize: 8, textAlign: 'right' },
  threatCheck: { fontSize: 19, marginTop: 4 },
  communityPanel: { minHeight: 88, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  communityCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  communityTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  communityText: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  reportButton: { borderWidth: 1, borderColor: C.purple, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, marginLeft: 8 },
  reportText: { color: C.purple, fontSize: 9, fontWeight: '900' },
});
