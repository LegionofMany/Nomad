import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadRecovery } from '../nomad';
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

type RecoveryMethod = { title: string; subtitle: string; status: string; icon: string; route: string };
type RecoveryAction = { title: string; subtitle: string; icon: string; route: string; color?: string };

const methods: RecoveryMethod[] = [
  { title: 'Multi-Sig Recovery', subtitle: 'Owner-authority quorum', status: 'ACTIVE', icon: '♙', route: 'OwnerAuthorityApproval' },
  { title: '24 Time Sets', subtitle: 'Time-based recovery sequence', status: 'ACTIVE', icon: '◷', route: 'RecoverLostWallet' },
  { title: 'Owner Authority', subtitle: 'Protected approval layer', status: 'VERIFIED', icon: '◇', route: 'OwnerAuthorityApproval' },
  { title: 'Emergency Authorities', subtitle: 'Trusted recovery contacts', status: 'READY', icon: '♙♙', route: 'CreateOwnerAuthority' },
];

const deviceActions: RecoveryAction[] = [
  { title: 'Time Clock Access', subtitle: 'Use the daily unlock window', icon: '◷', route: 'TimeClockAccess' },
  { title: 'Device Migration', subtitle: 'Move Nomad to a new device', icon: '▯', route: 'OwnerAuthorityApproval' },
  { title: 'Recovery Test', subtitle: 'Verify the recovery sequence', icon: '◇', route: 'VerifyRecoverySequence' },
];

const emergencyActions: RecoveryAction[] = [
  { title: 'Recover Lost Wallet', subtitle: 'Start the full recovery flow', icon: '⚠', route: 'RecoverLostWallet', color: C.red },
  { title: 'Emergency Freeze', subtitle: 'Block outgoing wallet actions', icon: '❄', route: 'EmergencyFreeze', color: C.red },
];

function MethodCard({ item }: { item: RecoveryMethod }) {
  const navigation = useNavigation<any>();
  return (
    <Pressable onPress={() => navigation.navigate(item.route)} style={styles.methodCard}>
      <Text style={styles.methodIcon}>{item.icon}</Text>
      <Text style={styles.methodTitle}>{item.title}</Text>
      <Text style={styles.methodSub}>{item.subtitle}</Text>
      <Text style={styles.methodStatus}>{item.status}</Text>
    </Pressable>
  );
}

function ActionRow({ item, last }: { item: RecoveryAction; last?: boolean }) {
  const navigation = useNavigation<any>();
  const color = item.color || C.green;
  return (
    <Pressable onPress={() => navigation.navigate(item.route)} style={[styles.actionRow, !last && styles.rowBorder]}>
      <RoundIcon symbol={item.icon} color={color} size={43} filled />
      <View style={styles.actionCopy}><Text style={styles.actionTitle}>{item.title}</Text><Text style={styles.actionSub}>{item.subtitle}</Text></View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export default function RecoveryCenterScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { recovery, sequence, loading, error, runCheck } = useNomadRecovery();
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState('');

  const protectedState = recovery.recoveryStatus !== 'not_started' && recovery.recoveryStatus !== 'recovery_required';
  const statusColor = protectedState ? C.green : C.red;
  const setPercent = Math.round((recovery.timeSetsComplete / Math.max(1, recovery.timeSetsTotal)) * 100);

  const milestones = useMemo(() => [6, 12, 18, 24].map((value) => ({ value, done: recovery.timeSetsComplete >= value })), [recovery.timeSetsComplete]);

  const handleCheck = async () => {
    try {
      setChecking(true);
      setFeedback('Running recovery readiness checks…');
      const next = await runCheck();
      setFeedback(`Recovery check complete: ${next.recoveryScore}/100.`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to complete the recovery check.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <NomadPage maxWidth={940}>
      <PageHeader title="Recovery Center" subtitle="Your recovery. Your control. Your peace of mind." icon="↻" color={C.green} help />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Panel tone={protectedState ? 'green' : 'red'} style={styles.statusPanel}>
        <View style={[styles.statusContent, compact && styles.statusContentCompact]}>
          <View style={styles.statusCopy}>
            <Text style={[styles.eyebrow, { color: statusColor }]}>RECOVERY STATUS</Text>
            <View style={styles.statusLine}><Text style={[styles.statusTitle, { color: statusColor, fontSize: compact ? 31 : 43 }]}>{protectedState ? 'FULLY PROTECTED' : 'SETUP REQUIRED'}</Text><Text style={[styles.statusMark, { color: statusColor }]}>{protectedState ? '✓' : '!'}</Text></View>
            <Text style={styles.statusDescription}>{protectedState ? 'Recovery methods are configured and ready for owner-controlled use.' : 'Complete the missing recovery steps before relying on emergency recovery.'}</Text>
            <View style={styles.statusMetrics}>
              <View style={styles.statusMetric}><Text style={styles.metricLabel}>▣ Recovery Setup</Text><Text style={styles.metricValue}>{recovery.recoverySetupDate}</Text><Text style={styles.metricNote}>{protectedState ? 'Wallet protected' : 'Setup required'}</Text></View>
              <View style={styles.statusMetric}><Text style={styles.metricLabel}>♙ Verification</Text><Text style={styles.metricValue}>{recovery.verificationStatus}</Text><Text style={styles.metricNote}>{recovery.signerQuorum}/{recovery.signerTotal} signers ready</Text></View>
              <View style={styles.statusMetric}><Text style={styles.metricLabel}>◷ Last Check</Text><Text style={styles.metricValue}>{recovery.lastCheckLabel}</Text><Text style={styles.metricNote}>{loading ? 'Syncing…' : 'Recovery adapter online'}</Text></View>
            </View>
          </View>
          <View style={styles.recoveryGraphic}><View style={[styles.recoveryRing, { borderColor: statusColor }]}><Text style={[styles.recoveryScore, { color: statusColor }]}>{recovery.recoveryScore}</Text><Text style={styles.recoveryScoreLabel}>RECOVERY</Text></View></View>
        </View>
        <Pressable onPress={() => navigation.navigate('RecoverLostWallet')} style={styles.guideRow}><Text style={styles.guideIcon}>▭</Text><View style={styles.guideCopy}><Text style={styles.guideTitle}>Recovery Guide</Text><Text style={styles.guideSub}>Review the protected recovery sequence</Text></View><Text style={styles.chevron}>›</Text></Pressable>
      </Panel>

      <Panel style={styles.timePanel}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>24 TIME SET RECOVERY</Text><Text style={styles.sectionSub}>Time-based owner verification</Text></View><Text style={styles.timeSetCount}>{recovery.timeSetsComplete}/{recovery.timeSetsTotal}</Text></View>
        <View style={[styles.timeBody, compact && styles.timeBodyCompact]}>
          <View style={styles.timeRing}><Text style={styles.timeRingValue}>{setPercent}%</Text><Text style={styles.timeRingLabel}>Complete</Text></View>
          <View style={styles.timeCopy}>
            <ProgressBar value={setPercent} color={C.green} height={9} />
            <View style={styles.milestones}>{milestones.map((milestone) => <View key={milestone.value} style={styles.milestone}><Text style={[styles.milestoneMark, milestone.done && { color: C.green }]}>{milestone.done ? '✓' : '•'}</Text><Text style={styles.milestoneText}>{milestone.value} Sets</Text></View>)}</View>
            <View style={styles.nextCheck}><View style={styles.nextCheckCopy}><Text style={styles.nextCheckLabel}>Next Recommended Check</Text><Text style={styles.nextCheckValue}>{recovery.nextRecommendedCheck}</Text></View><Pressable disabled={checking} onPress={() => void handleCheck()}><Text style={styles.runCheck}>{checking ? 'Checking…' : 'Run Check Now  ›'}</Text></Pressable></View>
            {feedback ? <Text style={[styles.feedback, feedback.toLowerCase().includes('unable') && { color: C.red }]}>{feedback}</Text> : null}
          </View>
        </View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <Text style={styles.sectionTitle}>RECOVERY METHODS</Text>
        <View style={styles.methodGrid}>{methods.map((item) => <MethodCard key={item.title} item={item} />)}</View>
        <Pressable onPress={() => navigation.navigate('VerifyRecoverySequence')} style={styles.scoreRow}><RoundIcon symbol="◇" color={C.green} size={45} filled /><View style={styles.scoreCopy}><Text style={styles.scoreTitle}>Recovery Security Score</Text><Text style={styles.scoreSub}>Combined readiness across all configured methods</Text></View><Text style={styles.scoreValue}>{recovery.recoveryScore}<Text style={styles.scoreOut}>/100</Text></Text><Text style={styles.chevron}>›</Text></Pressable>
      </Panel>

      <View style={[styles.twoColumn, compact && styles.twoColumnCompact]}>
        <Panel style={styles.actionPanel}><Text style={styles.sectionTitle}>DEVICE & RECOVERY</Text>{deviceActions.map((item, index) => <ActionRow key={item.title} item={item} last={index === deviceActions.length - 1} />)}</Panel>
        <Panel style={styles.actionPanel}><Text style={styles.sectionTitle}>EMERGENCY RECOVERY</Text>{emergencyActions.map((item, index) => <ActionRow key={item.title} item={item} last={index === emergencyActions.length - 1} />)}</Panel>
      </View>

      <Panel style={styles.signerPanel}>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>RECOVERY SIGNERS</Text><Pressable onPress={() => navigation.navigate('CreateOwnerAuthority')}><Text style={styles.link}>Manage  ›</Text></Pressable></View>
        {[
          ['♙', 'Nomad User', 'Primary signer • Owner verified'],
          ['▣', 'Security Authority #1', 'Recovery signer • Ready'],
          ['▣', 'Security Authority #2', 'Recovery signer • Ready'],
        ].map(([icon, name, role], index) => <View key={name} style={[styles.signerRow, index < 2 && styles.rowBorder]}><RoundIcon symbol={icon} color={C.green} size={40} filled /><View style={styles.signerCopy}><Text style={styles.signerName}>{name}</Text><Text style={styles.signerRole}>{role}</Text></View><Text style={styles.signerStatus}>VERIFIED</Text></View>)}
      </Panel>

      <BottomNav
        active="Recovery"
        items={[
          ['⌂', 'Home', 'Portfolio'],
          ['▣', 'Wallets', 'Wallets'],
          ['✈', 'Travel', 'TravelMode'],
          ['◇', 'Security', 'SecurityCenter'],
          ['↻', 'Recovery', 'RecoveryCenter'],
        ]}
      />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  statusPanel: { padding: 19 },
  statusContent: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  statusContentCompact: { flexDirection: 'column', alignItems: 'stretch' },
  statusCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: .4 },
  statusLine: { flexDirection: 'row', alignItems: 'center', marginTop: 7 },
  statusTitle: { fontWeight: '900', letterSpacing: -1 },
  statusMark: { fontSize: 29, marginLeft: 11 },
  statusDescription: { color: '#fff', fontSize: 12, lineHeight: 18, marginTop: 6 },
  statusMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  statusMetric: { flex: 1, minWidth: 140 },
  metricLabel: { color: C.muted, fontSize: 9 },
  metricValue: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 6 },
  metricNote: { color: C.muted, fontSize: 9, marginTop: 5 },
  recoveryGraphic: { width: 175, alignItems: 'center' },
  recoveryRing: { width: 126, height: 126, borderRadius: 63, borderWidth: 8, backgroundColor: 'rgba(2,12,21,.72)', alignItems: 'center', justifyContent: 'center' },
  recoveryScore: { fontSize: 37, fontWeight: '900' },
  recoveryScoreLabel: { color: C.muted, fontSize: 8, marginTop: 2 },
  guideRow: { minHeight: 62, marginTop: 16, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  guideIcon: { color: C.green, fontSize: 22, marginRight: 11 },
  guideCopy: { flex: 1, minWidth: 0 },
  guideTitle: { color: C.green, fontSize: 12, fontWeight: '900' },
  guideSub: { color: C.muted, fontSize: 9, marginTop: 3 },
  chevron: { color: '#b8c5d7', fontSize: 27, marginLeft: 7 },
  timePanel: { marginTop: 17, padding: 17 },
  sectionPanel: { marginTop: 17, padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: .3 },
  sectionSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  timeSetCount: { color: C.green, fontSize: 18, fontWeight: '900' },
  timeBody: { flexDirection: 'row', alignItems: 'center', gap: 22, marginTop: 18 },
  timeBodyCompact: { flexDirection: 'column' },
  timeRing: { width: 130, height: 130, borderRadius: 65, borderWidth: 12, borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  timeRingValue: { color: '#fff', fontSize: 27, fontWeight: '900' },
  timeRingLabel: { color: C.green, fontSize: 10, fontWeight: '800', marginTop: 4 },
  timeCopy: { flex: 1, minWidth: 0, width: '100%' },
  milestones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 13 },
  milestone: { alignItems: 'center' },
  milestoneMark: { color: C.muted, fontSize: 18 },
  milestoneText: { color: C.muted, fontSize: 8, marginTop: 3 },
  nextCheck: { minHeight: 65, marginTop: 15, borderWidth: 1, borderColor: 'rgba(32,239,112,.38)', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center' },
  nextCheckCopy: { flex: 1, minWidth: 0 },
  nextCheckLabel: { color: C.muted, fontSize: 9 },
  nextCheckValue: { color: C.green, fontSize: 13, fontWeight: '900', marginTop: 5 },
  runCheck: { color: C.green, fontSize: 9, fontWeight: '900', marginLeft: 8 },
  feedback: { color: C.green, fontSize: 9, marginTop: 9 },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  methodCard: { flexGrow: 1, flexBasis: 150, minHeight: 122, borderWidth: 1, borderColor: C.border, borderRadius: 11, alignItems: 'center', justifyContent: 'center', padding: 11 },
  methodIcon: { color: C.green, fontSize: 31, fontWeight: '900' },
  methodTitle: { color: '#fff', fontSize: 11, fontWeight: '900', textAlign: 'center', marginTop: 7 },
  methodSub: { color: C.muted, fontSize: 8, textAlign: 'center', marginTop: 4 },
  methodStatus: { color: C.green, fontSize: 8, fontWeight: '900', marginTop: 7 },
  scoreRow: { minHeight: 75, marginTop: 13, borderWidth: 1, borderColor: 'rgba(32,239,112,.35)', borderRadius: 11, backgroundColor: 'rgba(32,239,112,.06)', padding: 12, flexDirection: 'row', alignItems: 'center' },
  scoreCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  scoreTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  scoreSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  scoreValue: { color: '#fff', fontSize: 24, fontWeight: '900', marginLeft: 8 },
  scoreOut: { color: C.muted, fontSize: 9 },
  twoColumn: { flexDirection: 'row', gap: 13, marginTop: 17 },
  twoColumnCompact: { flexDirection: 'column' },
  actionPanel: { flex: 1, padding: 15 },
  actionRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  actionCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  actionTitle: { color: '#fff', fontSize: 11, fontWeight: '800' },
  actionSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  signerPanel: { marginTop: 17, padding: 15 },
  link: { color: C.blue, fontSize: 10, fontWeight: '800' },
  signerRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  signerCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  signerName: { color: '#fff', fontSize: 11, fontWeight: '800' },
  signerRole: { color: C.muted, fontSize: 8, marginTop: 4 },
  signerStatus: { color: C.green, fontSize: 8, fontWeight: '900' },
});
