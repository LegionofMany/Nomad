import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadSecurity, useNomadTravel } from '../nomad';
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

type SecurityModule = { title: string; subtitle: string; icon: string; route: string };
type BackupItem = { title: string; subtitle: string; status: string; note: string; icon: string };

type ActivityItem = {
  title: string;
  subtitle: string;
  time: string;
  icon: string;
  color: string;
};

const modules: SecurityModule[] = [
  { title: 'Secure Storage', subtitle: 'Wallet data remains encrypted and owner-controlled', icon: '▣', route: 'Settings' },
  { title: 'Owner Authority', subtitle: 'Approval authority and signer controls', icon: '♙', route: 'OwnerAuthorityApproval' },
  { title: 'Device Integrity', subtitle: 'Review connected and trusted devices', icon: '▤', route: 'NomadWatch' },
  { title: 'Recovery Status', subtitle: 'Recovery sequence, clock and verification', icon: '⟳', route: 'RecoveryCenter' },
  { title: 'Network Protection', subtitle: 'Protected by the Arkrilium Security Layer', icon: '◇', route: 'VoltaireProtocols' },
];

const backups: BackupItem[] = [
  { title: 'Recovery Sequence', subtitle: 'Time-set recovery', status: 'Protected', note: 'Owner verified', icon: '⚿' },
  { title: 'Multi-Sig Authority', subtitle: '2 of 3 required', status: 'Active', note: '3 signers set', icon: '⬡' },
  { title: 'Encrypted Backup', subtitle: 'Private recovery data', status: 'Ready', note: 'Adapter protected', icon: '☁' },
];

function ModuleRow({ item, last }: { item: SecurityModule; last?: boolean }) {
  const navigation = useNavigation<any>();
  return (
    <Pressable onPress={() => navigation.navigate(item.route)} style={[styles.moduleRow, !last && styles.rowBorder]}>
      <RoundIcon symbol={item.icon} color={C.green} size={45} filled />
      <View style={styles.moduleCopy}><Text style={styles.moduleTitle}>{item.title}</Text><Text style={styles.moduleSub}>{item.subtitle}</Text></View>
      <Text style={styles.secureText}>● SECURE</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function BackupCard({ item }: { item: BackupItem }) {
  return (
    <View style={styles.backupCard}>
      <Text style={styles.backupIcon}>{item.icon}</Text>
      <Text style={styles.backupTitle}>{item.title}</Text>
      <Text style={styles.backupSub}>{item.subtitle}</Text>
      <Text style={styles.backupStatus}>● {item.status}</Text>
      <Text style={styles.backupNote}>{item.note}</Text>
    </View>
  );
}

function ActivityRow({ item, last }: { item: ActivityItem; last?: boolean }) {
  return (
    <View style={[styles.activityRow, !last && styles.rowBorder]}>
      <RoundIcon symbol={item.icon} color={item.color} size={43} filled />
      <View style={styles.activityCopy}><Text style={styles.activityTitle}>{item.title}</Text><Text style={styles.activitySub}>{item.subtitle}</Text></View>
      <Text style={styles.activityTime}>{item.time}</Text>
    </View>
  );
}

export default function SecurityCenterScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { security, loading, error, runScan } = useNomadSecurity();
  const { travelPocket } = useNomadTravel();
  const [scanState, setScanState] = useState<'idle' | 'running' | 'complete' | 'failed'>('idle');
  const [scanFeedback, setScanFeedback] = useState('');

  const frozen = security.status === 'frozen';
  const warning = security.status === 'warning';
  const statusColor = frozen ? C.red : warning ? C.yellow : C.green;
  const statusLabel = frozen ? 'FROZEN' : warning ? 'REVIEW' : 'SECURE';

  const activity = useMemo<ActivityItem[]>(() => {
    if (security.freezeActivity.length) {
      return security.freezeActivity.map((item) => ({
        title: item.label,
        subtitle: item.scope.replace(/_/g, ' '),
        time: new Date(item.requestedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        icon: item.status === 'active' ? '❄' : '♙',
        color: item.status === 'active' ? C.red : C.green,
      }));
    }
    return [
      { title: 'Security state verified', subtitle: 'Wallet adapter and owner authority available', time: security.lastScanLabel, icon: '◇', color: C.green },
      { title: 'Travel Pocket context updated', subtitle: `${travelPocket.regionInput || 'Global'} • ${travelPocket.localCurrency || 'USD Stable'}`, time: 'Travel', icon: '✈', color: C.yellow },
      { title: 'Reqrium protection available', subtitle: 'Address and URL safety tools are ready', time: 'Safety', icon: 'R', color: C.purple },
    ];
  }, [security.freezeActivity, security.lastScanLabel, travelPocket.localCurrency, travelPocket.regionInput]);

  const handleScan = async () => {
    try {
      setScanState('running');
      setScanFeedback('Running wallet, device and network checks…');
      const next = await runScan();
      setScanState('complete');
      setScanFeedback(`Security scan complete: ${next.score}/100.`);
    } catch (err) {
      setScanState('failed');
      setScanFeedback(err instanceof Error ? err.message : 'Unable to complete the security scan.');
    }
  };

  return (
    <NomadPage maxWidth={940}>
      <PageHeader
        title="Security Center"
        subtitle="Your assets. Your keys. Your sovereignty."
        icon={frozen ? '❄' : '◇'}
        color={statusColor}
        back={false}
        right={<Pressable onPress={() => navigation.navigate('EmergencyFreeze')} style={[styles.freezeShortcut, frozen && { borderColor: C.red }]}><Text style={[styles.freezeShortcutText, frozen && { color: C.red }]}>{frozen ? 'Freeze Active' : 'Emergency'}</Text></Pressable>}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Panel tone={frozen ? 'red' : warning ? 'yellow' : 'green'} style={styles.hero}>
        <View style={[styles.heroContent, compact && styles.heroContentCompact]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: statusColor }]}>SECURITY STATUS</Text>
            <View style={styles.statusLine}><Text style={[styles.statusWord, { color: statusColor, fontSize: compact ? 42 : 54 }]}>{statusLabel}</Text><Text style={[styles.statusMark, { color: statusColor }]}>{frozen ? '❄' : '●'}</Text></View>
            <Text style={styles.statusDescription}>{frozen ? 'Emergency protection is active' : warning ? 'One or more modules need review' : 'All systems are operating normally'}</Text>
            <View style={styles.heroDivider} />
            <View style={[styles.heroMetrics, compact && styles.heroMetricsCompact]}>
              <View style={styles.heroMetric}><Text style={styles.metricLabel}>◇ Protected Since</Text><Text style={styles.metricValue}>{security.protectedSince}</Text><Text style={[styles.metricNote, { color: C.green }]}>{security.protectedDays}</Text></View>
              <View style={styles.heroMetric}><Text style={styles.metricLabel}>▣ Last Scan</Text><Text style={styles.metricValue}>{security.lastScanLabel}</Text><Text style={styles.metricNote}>{security.lastScanDetail}</Text></View>
              <View style={styles.heroMetric}><Text style={styles.metricLabel}>Security Score</Text><Text style={styles.metricValue}>{security.score}/100</Text><Text style={styles.metricNote}>{security.score >= 90 ? 'Excellent' : 'Review recommended'}</Text></View>
            </View>
          </View>
          <View style={styles.scoreGraphic}>
            <View style={[styles.scoreRing, { borderColor: statusColor }]}><Text style={[styles.scoreNumber, { color: statusColor }]}>{security.score}</Text><Text style={styles.scoreLabel}>SCORE</Text></View>
            <View style={styles.scoreBar}><ProgressBar value={security.score} color={statusColor} height={8} /></View>
          </View>
        </View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeading}>
          <View><Text style={styles.sectionTitle}>SECURITY MODULES</Text><Text style={styles.sectionSub}>Review each protection layer</Text></View>
          <Pressable disabled={scanState === 'running'} onPress={() => void handleScan()} style={styles.scanButton}><Text style={styles.scanButtonText}>{scanState === 'running' ? 'Scanning…' : 'Run Scan  ›'}</Text></Pressable>
        </View>
        {scanFeedback ? <Text style={[styles.scanFeedback, scanState === 'failed' && { color: C.red }]}>{scanFeedback}</Text> : null}
        <View style={styles.moduleList}>{modules.map((item, index) => <ModuleRow key={item.title} item={item} last={index === modules.length - 1} />)}</View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>RECOVERY & BACKUP</Text><Pressable onPress={() => navigation.navigate('RecoveryCenter')}><Text style={styles.link}>Manage  ›</Text></Pressable></View>
        <View style={styles.backupGrid}>{backups.map((item) => <BackupCard key={item.title} item={item} />)}</View>
      </Panel>

      <Panel style={styles.activityPanel}>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>SECURITY ACTIVITY</Text><Pressable onPress={() => navigation.navigate('EmergencyFreeze')}><Text style={styles.link}>Freeze Center  ›</Text></Pressable></View>
        {activity.map((item, index) => <ActivityRow key={`${item.title}-${index}`} item={item} last={index === activity.length - 1} />)}
      </Panel>

      <Panel style={styles.arkriliumPanel}>
        <RoundIcon symbol="A" color={C.blue} size={54} filled />
        <View style={styles.arkriliumCopy}><Text style={styles.arkriliumTitle}>Protected by Arkrilium</Text><Text style={styles.arkriliumSub}>Nomad combines owner authority, recovery, Reqrium safety and network protection without taking custody of wallet funds.</Text></View>
        <Pressable onPress={() => navigation.navigate('VoltaireProtocols')}><Text style={styles.chevron}>›</Text></Pressable>
      </Panel>

      <BottomNav active="Security" />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  freezeShortcut: { minHeight: 38, borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  freezeShortcutText: { color: C.blue, fontSize: 10, fontWeight: '900' },
  error: { color: C.red, fontSize: 11, marginBottom: 12 },
  hero: { padding: 20 },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  heroContentCompact: { flexDirection: 'column', alignItems: 'stretch' },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: .5 },
  statusLine: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statusWord: { fontWeight: '900', letterSpacing: -1 },
  statusMark: { fontSize: 31, marginLeft: 12 },
  statusDescription: { color: '#fff', fontSize: 13, marginTop: 5 },
  heroDivider: { height: 1, backgroundColor: C.borderSoft, marginVertical: 17 },
  heroMetrics: { flexDirection: 'row' },
  heroMetricsCompact: { flexWrap: 'wrap', gap: 15 },
  heroMetric: { flex: 1, minWidth: 140, paddingRight: 12 },
  metricLabel: { color: C.muted, fontSize: 9 },
  metricValue: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 7 },
  metricNote: { color: C.muted, fontSize: 9, lineHeight: 13, marginTop: 6 },
  scoreGraphic: { width: 185, alignItems: 'center' },
  scoreRing: { width: 125, height: 125, borderRadius: 63, borderWidth: 8, backgroundColor: 'rgba(2,12,21,.72)', alignItems: 'center', justifyContent: 'center' },
  scoreNumber: { fontSize: 38, fontWeight: '900' },
  scoreLabel: { color: C.muted, fontSize: 9, fontWeight: '800', marginTop: 2 },
  scoreBar: { width: 145, marginTop: 13 },
  sectionPanel: { marginTop: 17, padding: 15 },
  activityPanel: { marginTop: 17, paddingHorizontal: 15, paddingTop: 15 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: .3 },
  sectionSub: { color: C.muted, fontSize: 10, marginTop: 4 },
  link: { color: C.blue, fontSize: 11, fontWeight: '800' },
  scanButton: { borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9 },
  scanButtonText: { color: C.blue, fontSize: 10, fontWeight: '900' },
  scanFeedback: { color: C.green, fontSize: 10, marginTop: 10 },
  moduleList: { marginTop: 13, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, overflow: 'hidden' },
  moduleRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  moduleCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  moduleTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  moduleSub: { color: C.muted, fontSize: 10, lineHeight: 14, marginTop: 4 },
  secureText: { color: C.green, fontSize: 9, fontWeight: '900', marginLeft: 7 },
  chevron: { color: '#b7c4d6', fontSize: 28, marginLeft: 7 },
  backupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  backupCard: { flexGrow: 1, flexBasis: 165, minHeight: 132, borderWidth: 1, borderColor: C.border, borderRadius: 11, alignItems: 'center', justifyContent: 'center', padding: 12 },
  backupIcon: { color: C.blue, fontSize: 34 },
  backupTitle: { color: '#fff', fontSize: 12, fontWeight: '900', textAlign: 'center', marginTop: 7 },
  backupSub: { color: C.muted, fontSize: 9, textAlign: 'center', marginTop: 3 },
  backupStatus: { color: C.green, fontSize: 9, fontWeight: '900', marginTop: 9 },
  backupNote: { color: C.muted, fontSize: 9, textAlign: 'center', marginTop: 4 },
  activityRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  activityCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  activityTitle: { color: '#fff', fontSize: 12, fontWeight: '800' },
  activitySub: { color: C.muted, fontSize: 9, marginTop: 4 },
  activityTime: { color: C.muted, fontSize: 9, textAlign: 'right', marginLeft: 8, maxWidth: 100 },
  arkriliumPanel: { minHeight: 88, marginTop: 17, padding: 14, flexDirection: 'row', alignItems: 'center' },
  arkriliumCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  arkriliumTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  arkriliumSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
});
