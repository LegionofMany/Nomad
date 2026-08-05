import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadBlockPagesSafety } from '../nomad';
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

const threats = [
  ['⌁', 'Phishing Protection', 'Blocking malicious links and fake sign-ins', C.blue],
  ['♙', 'Identity Monitoring', 'Watching for identity exposure signals', C.purple],
  ['◎', 'Data Leak Scanner', 'Reviewing connected exposure sources', C.green],
  ['☀', 'Malware Protection', 'Warning before suspicious downloads', C.orange],
  ['◭', 'Social Engineering', 'Detecting impersonation and coercion patterns', C.blue],
] as const;

const tools = [
  ['◎', 'URL Scanner', 'Check links before opening', 'BlockPagesURLScanner', C.blue],
  ['⌕', 'Address Scanner', 'Review wallets before sending', 'AddressSafetyDetail', C.blue],
  ['▣', 'Security Center', 'Wallet and device protections', 'SecurityCenter', C.green],
  ['A', 'Arkrilium Protocols', 'Connected protocol health', 'VoltaireProtocols', C.purple],
  ['⚑', 'Report a Scam', 'Record suspicious activity', 'BlockPagesURLScanner', C.red],
] as const;

function ThreatCard({ item }: { item: typeof threats[number] }) {
  const [icon, title, subtitle, color] = item;
  return <View style={styles.threatCard}><RoundIcon symbol={icon} color={color} size={50} filled /><Text style={styles.threatTitle}>{title}</Text><Text style={[styles.threatStatus, { color }]}>ACTIVE</Text><Text style={styles.threatSub}>{subtitle}</Text></View>;
}

function ExposureRow({ icon, label, count, status, color, last }: { icon: string; label: string; count: string; status: string; color: string; last?: boolean }) {
  return <View style={[styles.exposureRow, !last && styles.rowBorder]}><Text style={[styles.exposureIcon, { color }]}>{icon}</Text><Text style={styles.exposureLabel}>{label}</Text><Text style={styles.exposureCount}>{count}</Text><Text style={[styles.exposureStatus, { color: status === 'Resolved' ? C.green : C.yellow }]}>✓ {status}</Text></View>;
}

export default function BlockPagesSafetyScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const safety = useNomadBlockPagesSafety();
  const [scanState, setScanState] = useState<'idle' | 'running' | 'complete' | 'failed'>('idle');
  const [feedback, setFeedback] = useState('');

  const statusColor = safety.safetyStatus === 'protected' ? C.green : safety.safetyStatus === 'warning' ? C.yellow : C.red;
  const exposures = useMemo(() => [
    ['✉', 'Email Exposures', safety.sensitiveItemsFound === '0' ? '0' : '1', safety.sensitiveItemsFound === '0' ? 'Resolved' : 'Review', C.blue],
    ['♧', 'Password Exposures', '0', 'Resolved', C.green],
    ['▯', 'Phone Exposures', '0', 'Resolved', C.purple],
    ['◇', 'Address Exposures', '0', 'Resolved', C.purple],
    ['▭', 'Financial Exposures', '0', 'Resolved', C.orange],
  ] as const, [safety.sensitiveItemsFound]);

  const runFullScan = async () => {
    try {
      setScanState('running');
      setFeedback('Running Reqrium protection checks…');
      await safety.runScan();
      setScanState('complete');
      setFeedback('Reqrium scan complete. Review any flagged items before acting.');
    } catch (err) {
      setScanState('failed');
      setFeedback(err instanceof Error ? err.message : 'Unable to complete the Reqrium scan.');
    }
  };

  return (
    <NomadPage maxWidth={980}>
      <PageHeader
        title="Reqrium Safety"
        subtitle="Your identity. Your data. Your safety online."
        icon="R"
        color={C.blue}
        right={<Text style={styles.hubBadge}>SAFETY HUB</Text>}
      />
      {safety.error ? <Text style={styles.error}>{safety.error}</Text> : null}

      <Panel style={styles.hero}>
        <View style={[styles.heroBody, compact && styles.heroCompact]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>YOUR IDENTITY IS PROTECTED</Text>
            <View style={styles.protectionRow}><Text style={[styles.protectionValue, { color: statusColor, fontSize: compact ? 43 : 57 }]}>{safety.identityProtectionPercent}%</Text><Text style={[styles.protectionMark, { color: statusColor }]}>✓</Text></View>
            <Text style={styles.heroText}>Reqrium is actively checking connected safety signals across your Nomad experience.</Text>
            <Text style={styles.lastScan}>Last scan: {safety.lastScanLabel}</Text>
          </View>
          <View style={styles.logoGraphic}><View style={styles.logoOrbit}><RoundIcon symbol="R" color={C.blue} size={110} filled /><Text style={[styles.orbitIcon, styles.orbitTop]}>◎</Text><Text style={[styles.orbitIcon, styles.orbitRight]}>✉</Text><Text style={[styles.orbitIcon, styles.orbitBottom]}>⌕</Text><Text style={[styles.orbitIcon, styles.orbitLeft]}>♙</Text></View></View>
        </View>
        <View style={styles.heroStats}>
          {[
            ['⌁', 'Threats Blocked', safety.threatsBlocked, 'This month'],
            ['♙', 'Leaks Prevented', safety.dataLeaksPrevented, 'This month'],
            ['◎', 'Websites Scanned', safety.websitesScanned, 'This month'],
            ['▣', 'Sensitive Items', safety.sensitiveItemsFound, safety.sensitiveItemsFound === '0' ? 'All clear' : 'Review'],
          ].map(([icon, label, value, note]) => <View key={label} style={styles.heroStat}><Text style={styles.heroStatLabel}>{icon} {label}</Text><Text style={styles.heroStatValue}>{value}</Text><Text style={[styles.heroStatNote, { color: note === 'Review' ? C.yellow : C.green }]}>{note}</Text></View>)}
        </View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>THREAT PROTECTION</Text><Text style={styles.sectionSub}>Active protection modules</Text></View><Pressable disabled={scanState === 'running'} onPress={() => void runFullScan()} style={styles.scanButton}><Text style={styles.scanButtonText}>{scanState === 'running' ? 'Scanning…' : 'Run Full Scan'}</Text></Pressable></View>
        <View style={styles.threatGrid}>{threats.map((item) => <ThreatCard key={item[1]} item={item} />)}</View>
        {feedback ? <Text style={[styles.feedback, scanState === 'failed' && { color: C.red }]}>{feedback}</Text> : null}
      </Panel>

      <View style={[styles.twoColumn, compact && styles.twoColumnCompact]}>
        <Panel style={styles.privacyPanel}>
          <Text style={styles.sectionTitle}>PRIVACY SCORE</Text>
          <View style={styles.privacyBody}><View style={styles.scoreRing}><Text style={styles.scoreValue}>{safety.privacyScore}</Text><Text style={styles.scoreOut}>/100</Text></View><View style={styles.privacyCopy}><Text style={styles.privacyStatus}>{safety.privacyScore >= 90 ? 'Excellent' : 'Review'}</Text><Text style={styles.privacyText}>Your current privacy posture is based on connected Reqrium and Nomad security signals.</Text><ProgressBar value={safety.privacyScore} color={C.blue} height={7} /></View></View>
        </Panel>
        <Panel style={styles.exposurePanel}>
          <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>EXPOSURE SUMMARY</Text><Pressable onPress={() => navigation.navigate('AddressSafetyDetail')}><Text style={styles.link}>Details  ›</Text></Pressable></View>
          {exposures.map((item, index) => <ExposureRow key={item[1]} icon={item[0]} label={item[1]} count={item[2]} status={item[3]} color={item[4]} last={index === exposures.length - 1} />)}
        </Panel>
      </View>

      <Panel style={styles.activityPanel}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>RECENT ACTIVITY</Text><Text style={styles.sectionSub}>Protection events and checks</Text></View><Text style={styles.link}>Reqrium Log</Text></View>
        {[
          ['◇', 'Security scan completed', safety.lastScanLabel, safety.sensitiveItemsFound === '0' ? 'All Clear' : 'Review', C.green],
          ['♙', 'Identity monitoring active', 'Connected signals', 'Active', C.purple],
          ['✉', 'Phishing protection ready', 'URL checks available', 'Protected', C.blue],
          ['▤', 'Wallet safety tools online', 'Address checks available', 'Ready', C.orange],
        ].map(([icon, title, subtitle, status, color], index, array) => <View key={title} style={[styles.activityRow, index < array.length - 1 && styles.rowBorder]}><RoundIcon symbol={icon} color={color} size={43} filled /><View style={styles.activityCopy}><Text style={styles.activityTitle}>{title}</Text><Text style={styles.activitySub}>{subtitle}</Text></View><Text style={[styles.activityStatus, { color }]}>{status}</Text></View>)}
      </Panel>

      <Panel style={styles.toolsPanel}>
        <Text style={styles.sectionTitle}>SAFETY TOOLS</Text>
        <View style={styles.toolGrid}>{tools.map(([icon, title, subtitle, route, color]) => <Pressable key={title} onPress={() => navigation.navigate(route)} style={styles.toolCard}><RoundIcon symbol={icon} color={color} size={47} filled /><Text style={styles.toolTitle}>{title}</Text><Text style={styles.toolSub}>{subtitle}</Text><Text style={styles.toolArrow}>›</Text></Pressable>)}</View>
      </Panel>

      <Panel tone="green" style={styles.footerPanel}><RoundIcon symbol="R" color={C.blue} size={50} filled /><View style={styles.footerCopy}><Text style={styles.footerTitle}>Reqrium protection inside Nomad</Text><Text style={styles.footerSub}>Safety results are decision-support signals. Always verify recipients, URLs and transaction details before signing.</Text></View></Panel>

      <BottomNav active="Safety" items={[
        ['⌂', 'Home', 'Portfolio'], ['▣', 'Wallets', 'Wallets'], ['✈', 'Travel', 'TravelMode'], ['R', 'Safety', 'BlockPagesSafety'], ['⚙', 'Settings', 'Settings'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  hubBadge: { color: C.blue, borderWidth: 1, borderColor: C.blue, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 8, fontWeight: '900' },
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  hero: { padding: 19 },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: C.blue, fontSize: 11, fontWeight: '900' },
  protectionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  protectionValue: { fontWeight: '900', letterSpacing: -1 },
  protectionMark: { fontSize: 31, marginLeft: 12 },
  heroText: { color: '#fff', fontSize: 12, lineHeight: 18, marginTop: 7 },
  lastScan: { color: C.muted, fontSize: 9, marginTop: 8 },
  logoGraphic: { width: 240, alignItems: 'center' },
  logoOrbit: { width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(22,140,255,.28)', alignItems: 'center', justifyContent: 'center' },
  orbitIcon: { position: 'absolute', width: 41, height: 41, borderRadius: 21, borderWidth: 1, borderColor: C.blue, backgroundColor: C.bg, color: C.blue, fontSize: 20, textAlign: 'center', textAlignVertical: 'center' },
  orbitTop: { top: -2 },
  orbitRight: { right: -2, top: 69 },
  orbitBottom: { bottom: -2 },
  orbitLeft: { left: -2, top: 69 },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.borderSoft },
  heroStat: { flex: 1, minWidth: 135 },
  heroStatLabel: { color: C.muted, fontSize: 8 },
  heroStatValue: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 6 },
  heroStatNote: { fontSize: 8, marginTop: 5 },
  sectionPanel: { marginTop: 17, padding: 16 },
  activityPanel: { marginTop: 17, paddingHorizontal: 16, paddingTop: 16 },
  toolsPanel: { marginTop: 17, padding: 16 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  scanButton: { borderWidth: 1, borderColor: C.blue, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8 },
  scanButtonText: { color: C.blue, fontSize: 9, fontWeight: '900' },
  threatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  threatCard: { flexGrow: 1, flexBasis: 145, minHeight: 147, borderWidth: 1, borderColor: C.border, borderRadius: 11, alignItems: 'center', justifyContent: 'center', padding: 11 },
  threatTitle: { color: '#fff', fontSize: 10, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  threatStatus: { fontSize: 8, fontWeight: '900', marginTop: 6 },
  threatSub: { color: C.muted, fontSize: 8, lineHeight: 13, textAlign: 'center', marginTop: 5 },
  feedback: { color: C.green, fontSize: 9, marginTop: 10 },
  twoColumn: { flexDirection: 'row', gap: 12, marginTop: 17 },
  twoColumnCompact: { flexDirection: 'column' },
  privacyPanel: { flex: .8, padding: 16 },
  exposurePanel: { flex: 1.2, padding: 16 },
  privacyBody: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 17 },
  scoreRing: { width: 112, height: 112, borderRadius: 56, borderWidth: 10, borderColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  scoreValue: { color: '#fff', fontSize: 30, fontWeight: '900' },
  scoreOut: { color: C.muted, fontSize: 8 },
  privacyCopy: { flex: 1, minWidth: 0 },
  privacyStatus: { color: C.blue, fontSize: 14, fontWeight: '900' },
  privacyText: { color: C.muted, fontSize: 8, lineHeight: 13, marginVertical: 9 },
  link: { color: C.blue, fontSize: 9, fontWeight: '900' },
  exposureRow: { minHeight: 47, flexDirection: 'row', alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  exposureIcon: { width: 27, fontSize: 18 },
  exposureLabel: { flex: 1, color: '#fff', fontSize: 9 },
  exposureCount: { color: '#fff', width: 25, fontSize: 9 },
  exposureStatus: { fontSize: 8, fontWeight: '800' },
  activityRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  activityCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  activityTitle: { color: '#fff', fontSize: 11, fontWeight: '800' },
  activitySub: { color: C.muted, fontSize: 8, marginTop: 4 },
  activityStatus: { fontSize: 8, fontWeight: '900', marginLeft: 8 },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  toolCard: { flexGrow: 1, flexBasis: 145, minHeight: 119, borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 12 },
  toolTitle: { color: '#fff', fontSize: 10, fontWeight: '900', marginTop: 8 },
  toolSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  toolArrow: { position: 'absolute', right: 10, top: 10, color: '#c7cfdf', fontSize: 22 },
  footerPanel: { minHeight: 84, marginTop: 17, padding: 14, flexDirection: 'row', alignItems: 'center' },
  footerCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  footerTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  footerSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
});
