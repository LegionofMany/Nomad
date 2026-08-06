import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadRecovery } from '../nomad';
import type {
  NomadRecoveryCheck,
  NomadRecoveryEvent,
  NomadRecoveryMethodResult,
  NomadRecoveryMethodStatus,
  NomadRecoverySigner,
} from '../nomad';
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

type RecoveryAction = {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  color?: string;
};

const deviceActions: RecoveryAction[] = [
  { title: 'Time Clock Access', subtitle: 'Review the daily owner-controlled unlock window', icon: '◷', route: 'TimeClockAccess' },
  { title: 'Device Migration', subtitle: 'Request Owner Authority support for a new device', icon: '▯', route: 'OwnerAuthorityApproval' },
  { title: 'Recovery Test', subtitle: 'Verify enrolled Time Sets without restoring keys', icon: '◇', route: 'VerifyRecoverySequence' },
];

const emergencyActions: RecoveryAction[] = [
  { title: 'Recover Lost Wallet', subtitle: 'Start the protected verification flow', icon: '⚠', route: 'RecoverLostWallet', color: C.red },
  { title: 'Emergency Freeze', subtitle: 'Block restricted wallet actions', icon: '❄', route: 'EmergencyFreeze', color: C.red },
];

const methodIcons: Record<NomadRecoveryMethodResult['id'], string> = {
  time_sets: '◷',
  daily_clock: '◴',
  owner_authority: '♙',
  encrypted_backup: '▣',
};

function statusInfo(status: NomadRecoveryMethodStatus) {
  switch (status) {
    case 'ready': return { color: C.green, label: 'READY', mark: '✓' };
    case 'warning': return { color: C.yellow, label: 'REVIEW', mark: '!' };
    case 'not_configured': return { color: C.purple, label: 'SETUP', mark: '+' };
    case 'unavailable': return { color: C.muted, label: 'UNAVAILABLE', mark: '—' };
  }
}

function checkInfo(status: NomadRecoveryCheck['status']) {
  if (status === 'pass') return { color: C.green, label: 'PASS', mark: '✓' };
  if (status === 'warning') return { color: C.yellow, label: 'REVIEW', mark: '!' };
  return { color: C.red, label: 'FAILED', mark: '×' };
}

function MethodCard({
  item,
  expanded,
  onToggle,
}: {
  item: NomadRecoveryMethodResult;
  expanded: boolean;
  onToggle(): void;
}) {
  const navigation = useNavigation<any>();
  const status = statusInfo(item.status);
  return (
    <View style={[styles.methodCard, { borderColor: `${status.color}70` }]}>
      <Pressable onPress={onToggle} style={({ pressed }) => [styles.methodTop, pressed && styles.pressed]}>
        <View style={[styles.methodIconWrap, { borderColor: status.color, backgroundColor: `${status.color}12` }]}>
          <Text style={[styles.methodIcon, { color: status.color }]}>{methodIcons[item.id]}</Text>
        </View>
        <Text style={[styles.methodStatus, { color: status.color }]}>{status.mark} {status.label}</Text>
      </Pressable>
      <Text style={styles.methodTitle}>{item.title}</Text>
      <Text style={styles.methodSub}>{item.subtitle}</Text>
      {expanded ? <Text style={styles.methodDetail}>{item.detail}</Text> : null}
      <Pressable onPress={() => navigation.navigate(item.route)} style={({ pressed }) => [styles.methodAction, pressed && styles.pressed]}>
        <Text style={[styles.methodActionText, { color: status.color }]}>{item.status === 'ready' ? 'Review' : 'Open Setup'}  ›</Text>
      </Pressable>
    </View>
  );
}

function ActionRow({ item, last }: { item: RecoveryAction; last?: boolean }) {
  const navigation = useNavigation<any>();
  const color = item.color || C.green;
  return (
    <Pressable onPress={() => navigation.navigate(item.route)} style={({ pressed }) => [styles.actionRow, !last && styles.rowBorder, pressed && styles.pressed]}>
      <RoundIcon symbol={item.icon} color={color} size={43} filled />
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{item.title}</Text>
        <Text style={styles.actionSub}>{item.subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function CheckRow({ item, last }: { item: NomadRecoveryCheck; last?: boolean }) {
  const status = checkInfo(item.status);
  return (
    <View style={[styles.checkRow, !last && styles.rowBorder]}>
      <View style={[styles.checkMark, { borderColor: status.color, backgroundColor: `${status.color}12` }]}>
        <Text style={[styles.checkMarkText, { color: status.color }]}>{status.mark}</Text>
      </View>
      <View style={styles.checkCopy}>
        <Text style={styles.checkLabel}>{item.label}</Text>
        <Text style={styles.checkDetail}>{item.detail}</Text>
      </View>
      <Text style={[styles.checkStatus, { color: status.color }]}>{status.label}</Text>
    </View>
  );
}

function SignerRow({ signer, last }: { signer: NomadRecoverySigner; last?: boolean }) {
  const color = signer.status === 'verified' ? C.green : signer.status === 'pending' ? C.yellow : C.muted;
  return (
    <View style={[styles.signerRow, !last && styles.rowBorder]}>
      <RoundIcon symbol={signer.source === 'wallet_owner' ? '♙' : '◇'} color={color} size={40} filled />
      <View style={styles.signerCopy}>
        <Text style={styles.signerName}>{signer.name}</Text>
        <Text style={styles.signerRole}>{signer.role}</Text>
      </View>
      <Text style={[styles.signerStatus, { color }]}>{signer.status.replace(/_/g, ' ').toUpperCase()}</Text>
    </View>
  );
}

function formatEventTime(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Unknown time';
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function EventRow({ item, last }: { item: NomadRecoveryEvent; last?: boolean }) {
  const color = item.severity === 'critical' ? C.red : item.severity === 'warning' ? C.yellow : C.green;
  const icon = item.type === 'authority' ? '♙' : item.type === 'verification' ? '◷' : item.type === 'export' ? '⇩' : '◇';
  return (
    <View style={[styles.eventRow, !last && styles.rowBorder]}>
      <View style={[styles.eventIcon, { borderColor: color, backgroundColor: `${color}12` }]}>
        <Text style={[styles.eventIconText, { color }]}>{icon}</Text>
      </View>
      <View style={styles.eventCopy}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDetail}>{item.detail}</Text>
      </View>
      <Text style={styles.eventTime}>{formatEventTime(item.timestamp)}</Text>
    </View>
  );
}

export default function RecoveryCenterScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { recovery, loading, error, refresh, runCheck, exportSummary } = useNomadRecovery();
  const [checking, setChecking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);

  const fullyReady = recovery.recoveryStatus === 'protected'
    && recovery.enrolledTimeSets === recovery.timeSetsTotal
    && recovery.ownerAuthorityStatus === 'approved';
  const partiallyReady = recovery.walletStatus !== 'no_wallet' && recovery.enrolledTimeSets > 0;
  const statusColor = fullyReady ? C.green : partiallyReady ? C.yellow : C.red;
  const statusTitle = fullyReady ? 'FULLY PROTECTED' : partiallyReady ? 'RECOVERY REVIEW' : 'SETUP REQUIRED';
  const setPercent = Math.round((recovery.enrolledTimeSets / Math.max(1, recovery.timeSetsTotal)) * 100);
  const milestones = useMemo(
    () => [6, 12, 18, 24].map((value) => ({ value, done: recovery.enrolledTimeSets >= value })),
    [recovery.enrolledTimeSets],
  );
  const recentEvents = recovery.events.slice(0, 5);

  const handleCheck = async () => {
    try {
      setChecking(true);
      setFeedback('Running wallet, Time Set, clock, authority and persistence checks…');
      const next = await runCheck();
      setFeedback(`Recovery check complete: ${next.recoveryScore}/100.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to complete the recovery check.');
    } finally {
      setChecking(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setFeedback('Generating a metadata-only recovery summary…');
      const summary = await exportSummary();
      const runtime = globalThis as unknown as { navigator?: { clipboard?: { writeText(value: string): Promise<void> } } };
      if (Platform.OS === 'web' && runtime.navigator?.clipboard) {
        await runtime.navigator.clipboard.writeText(summary);
        setFeedback('Recovery summary copied. It contains metadata only—no seed, private keys or raw Time Sets.');
      } else {
        await Share.share({ title: 'Nomad Recovery Summary', message: summary });
        setFeedback('Recovery summary opened in the native share sheet. No recovery secrets were included.');
      }
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to export the recovery summary.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <NomadPage maxWidth={940}>
      <PageHeader
        title="Recovery Center"
        subtitle="Your recovery. Your control. Your peace of mind."
        icon="↻"
        color={statusColor}
        help
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel tone={fullyReady ? 'green' : partiallyReady ? 'yellow' : 'red'} style={styles.statusPanel}>
        <View style={[styles.statusContent, compact && styles.statusContentCompact]}>
          <View style={styles.statusCopy}>
            <Text style={[styles.eyebrow, { color: statusColor }]}>RECOVERY STATUS</Text>
            <View style={styles.statusLine}>
              <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.statusTitle, { color: statusColor }]}>{statusTitle}</Text>
              <Text style={[styles.statusMark, { color: statusColor }]}>{fullyReady ? '✓' : partiallyReady ? '!' : '×'}</Text>
            </View>
            <Text style={styles.statusDescription}>
              {fullyReady
                ? 'The enrolled Time Set sequence and Owner Authority evidence are available.'
                : partiallyReady
                  ? 'Some recovery evidence exists, but one or more required protections still need review.'
                  : 'Nomad will not label recovery as protected until verifiable recovery evidence exists.'}
            </Text>
            <View style={styles.statusMetrics}>
              <View style={styles.statusMetric}>
                <Text style={styles.metricLabel}>▣ Recovery Setup</Text>
                <Text style={styles.metricValue}>{recovery.recoverySetupDate}</Text>
                <Text style={styles.metricNote}>{recovery.persistence.replace(/_/g, ' ')}</Text>
              </View>
              <View style={styles.statusMetric}>
                <Text style={styles.metricLabel}>♙ Verification</Text>
                <Text style={styles.metricValue}>{recovery.verificationStatus}</Text>
                <Text style={styles.metricNote}>{recovery.signerQuorum}/{recovery.signerTotal} signer quorum</Text>
              </View>
              <View style={styles.statusMetric}>
                <Text style={styles.metricLabel}>◷ Last Check</Text>
                <Text style={styles.metricValue}>{recovery.lastCheckLabel}</Text>
                <Text style={styles.metricNote}>{loading ? 'Loading evidence…' : recovery.dataSource.replace(/_/g, ' ')}</Text>
              </View>
            </View>
          </View>
          <View style={styles.recoveryGraphic}>
            <View style={[styles.recoveryRing, { borderColor: statusColor }]}>
              <Text style={[styles.recoveryScore, { color: statusColor }]}>{recovery.recoveryScore}</Text>
              <Text style={styles.recoveryScoreLabel}>RECOVERY</Text>
            </View>
            <Text style={styles.scoreDisclaimer}>Evidence-based readiness score</Text>
          </View>
        </View>
        <Pressable onPress={() => navigation.navigate('RecoverLostWallet')} style={({ pressed }) => [styles.guideRow, pressed && styles.pressed]}>
          <Text style={styles.guideIcon}>▭</Text>
          <View style={styles.guideCopy}>
            <Text style={styles.guideTitle}>Recovery Guide</Text>
            <Text style={styles.guideSub}>Review enrollment, verification and production-provider requirements</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </Panel>

      <Panel style={styles.timePanel}>
        <View style={[styles.sectionHeading, compact && styles.sectionHeadingCompact]}>
          <View>
            <Text style={styles.sectionTitle}>24 TIME SET RECOVERY</Text>
            <Text style={styles.sectionSub}>Only salted digests are retained by the recovery adapter</Text>
          </View>
          <Text style={styles.timeSetCount}>{recovery.enrolledTimeSets}/{recovery.timeSetsTotal}</Text>
        </View>
        <View style={[styles.timeBody, compact && styles.timeBodyCompact]}>
          <View style={[styles.timeRing, { borderColor: setPercent === 100 ? C.green : setPercent > 0 ? C.yellow : C.border }]}>
            <Text style={styles.timeRingValue}>{setPercent}%</Text>
            <Text style={[styles.timeRingLabel, { color: setPercent === 100 ? C.green : setPercent > 0 ? C.yellow : C.muted }]}>Enrolled</Text>
          </View>
          <View style={styles.timeCopy}>
            <ProgressBar value={setPercent} color={setPercent === 100 ? C.green : C.yellow} height={9} />
            <View style={styles.milestones}>
              {milestones.map((milestone) => (
                <View key={milestone.value} style={styles.milestone}>
                  <Text style={[styles.milestoneMark, milestone.done && { color: C.green }]}>{milestone.done ? '✓' : '•'}</Text>
                  <Text style={styles.milestoneText}>{milestone.value} Sets</Text>
                </View>
              ))}
            </View>
            <View style={[styles.nextCheck, compact && styles.nextCheckCompact]}>
              <View style={styles.nextCheckCopy}>
                <Text style={styles.nextCheckLabel}>Next Recommended Check</Text>
                <Text style={styles.nextCheckValue}>{recovery.nextRecommendedCheck}</Text>
              </View>
              <Pressable disabled={checking || loading} onPress={() => void handleCheck()} style={({ pressed }) => [styles.runCheckButton, pressed && styles.pressed]}>
                <Text style={styles.runCheck}>{checking ? 'Checking…' : 'Run Check Now'}</Text>
              </Pressable>
            </View>
            <Text style={styles.cryptoStatus}>Cryptographic Time Set enrollment: {recovery.cryptographicEnrollment.toUpperCase()}</Text>
          </View>
        </View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>RECOVERY READINESS CHECKS</Text>
            <Text style={styles.sectionSub}>Each protection is evaluated independently</Text>
          </View>
          <Text style={styles.scoreMini}>{recovery.recoveryScore}/100</Text>
        </View>
        <View style={styles.checkList}>
          {recovery.checks.length ? recovery.checks.map((item, index) => (
            <CheckRow key={item.id} item={item} last={index === recovery.checks.length - 1} />
          )) : <Text style={styles.emptyText}>Run a recovery check to calculate current evidence.</Text>}
        </View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <Text style={styles.sectionTitle}>RECOVERY METHODS</Text>
        <View style={styles.methodGrid}>
          {recovery.methods.map((item) => (
            <MethodCard
              key={item.id}
              item={item}
              expanded={expandedMethod === item.id}
              onToggle={() => setExpandedMethod((current) => current === item.id ? null : item.id)}
            />
          ))}
        </View>
      </Panel>

      <View style={[styles.twoColumn, compact && styles.twoColumnCompact]}>
        <Panel style={styles.actionPanel}>
          <Text style={styles.sectionTitle}>DEVICE & RECOVERY</Text>
          {deviceActions.map((item, index) => <ActionRow key={item.title} item={item} last={index === deviceActions.length - 1} />)}
        </Panel>
        <Panel style={styles.actionPanel}>
          <Text style={styles.sectionTitle}>EMERGENCY RECOVERY</Text>
          {emergencyActions.map((item, index) => <ActionRow key={item.title} item={item} last={index === emergencyActions.length - 1} />)}
        </Panel>
      </View>

      <Panel style={styles.signerPanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>RECOVERY SIGNERS</Text>
            <Text style={styles.sectionSub}>Only signers supported by current adapter evidence are shown</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('CreateOwnerAuthority')}><Text style={styles.link}>Manage  ›</Text></Pressable>
        </View>
        {recovery.signers.length ? recovery.signers.map((signer, index) => (
          <SignerRow key={signer.id} signer={signer} last={index === recovery.signers.length - 1} />
        )) : <Text style={styles.emptyText}>No recovery signers are configured.</Text>}
      </Panel>

      <Panel style={styles.exportPanel}>
        <View style={styles.exportIcon}><Text style={styles.exportIconText}>⇩</Text></View>
        <View style={styles.exportCopy}>
          <Text style={styles.exportTitle}>Export Recovery Data</Text>
          <Text style={styles.exportText}>Generate a metadata-only JSON summary. Seed phrases, private keys and raw Time Sets are never included.</Text>
        </View>
        <Pressable
          disabled={!recovery.exportAvailable || exporting}
          onPress={() => void handleExport()}
          style={({ pressed }) => [styles.exportButton, (!recovery.exportAvailable || exporting) && styles.disabled, pressed && styles.pressed]}
        >
          <Text style={styles.exportButtonText}>{exporting ? 'Preparing…' : 'Export Summary'}</Text>
        </Pressable>
      </Panel>

      <Panel style={styles.activityPanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>RECOVERY ACTIVITY</Text>
            <Text style={styles.sectionSub}>Local recovery adapter audit events</Text>
          </View>
          <Text style={styles.sourcePill}>LOCAL</Text>
        </View>
        {recentEvents.length ? recentEvents.map((item, index) => (
          <EventRow key={item.id} item={item} last={index === recentEvents.length - 1} />
        )) : <Text style={styles.emptyText}>No recovery activity has been recorded yet.</Text>}
      </Panel>

      {feedback ? <Text style={[styles.feedback, /unable|failed|error/i.test(feedback) && { color: C.red }]}>{feedback}</Text> : null}

      <Panel style={styles.integrityPanel}>
        <Text style={styles.integrityTitle}>DATA INTEGRITY</Text>
        <Text style={styles.integrityText}>Source: {recovery.dataSource.replace(/_/g, ' ')} • Persistence: {recovery.persistence.replace(/_/g, ' ')}</Text>
        <Text style={styles.integrityWarning}>Production recovery still requires encrypted persistent storage, verified Owner Authority delivery and a wallet-key restoration provider.</Text>
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
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.42 },
  errorBanner: { marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 12, backgroundColor: 'rgba(125,20,36,.16)', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  statusPanel: { padding: 19 },
  statusContent: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  statusContentCompact: { flexDirection: 'column', alignItems: 'stretch' },
  statusCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  statusLine: { flexDirection: 'row', alignItems: 'center', marginTop: 7 },
  statusTitle: { flexShrink: 1, fontSize: 42, fontWeight: '900', letterSpacing: -1 },
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
  scoreDisclaimer: { color: C.muted, fontSize: 8, textAlign: 'center', marginTop: 8 },
  guideRow: { minHeight: 62, marginTop: 16, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  guideIcon: { color: C.green, fontSize: 22, marginRight: 11 },
  guideCopy: { flex: 1, minWidth: 0 },
  guideTitle: { color: C.green, fontSize: 12, fontWeight: '900' },
  guideSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 3 },
  chevron: { color: '#b8c5d7', fontSize: 27, marginLeft: 7 },
  timePanel: { marginTop: 17, padding: 17 },
  sectionPanel: { marginTop: 17, padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionHeadingCompact: { flexDirection: 'column', alignItems: 'stretch' },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.3 },
  sectionSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  timeSetCount: { color: C.green, fontSize: 18, fontWeight: '900' },
  timeBody: { flexDirection: 'row', alignItems: 'center', gap: 22, marginTop: 18 },
  timeBodyCompact: { flexDirection: 'column' },
  timeRing: { width: 130, height: 130, borderRadius: 65, borderWidth: 12, alignItems: 'center', justifyContent: 'center' },
  timeRingValue: { color: '#fff', fontSize: 27, fontWeight: '900' },
  timeRingLabel: { fontSize: 10, fontWeight: '800', marginTop: 4 },
  timeCopy: { flex: 1, minWidth: 0, width: '100%' },
  milestones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 13 },
  milestone: { alignItems: 'center' },
  milestoneMark: { color: C.muted, fontSize: 18 },
  milestoneText: { color: C.muted, fontSize: 8, marginTop: 3 },
  nextCheck: { minHeight: 65, marginTop: 15, borderWidth: 1, borderColor: 'rgba(32,239,112,.38)', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  nextCheckCompact: { flexDirection: 'column', alignItems: 'stretch' },
  nextCheckCopy: { flex: 1, minWidth: 0 },
  nextCheckLabel: { color: C.muted, fontSize: 9 },
  nextCheckValue: { color: C.green, fontSize: 13, fontWeight: '900', marginTop: 5 },
  runCheckButton: { borderWidth: 1, borderColor: C.green, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9 },
  runCheck: { color: C.green, fontSize: 9, fontWeight: '900' },
  cryptoStatus: { color: C.muted, fontSize: 8, marginTop: 10 },
  scoreMini: { color: C.green, fontSize: 17, fontWeight: '900' },
  checkList: { marginTop: 13, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, overflow: 'hidden' },
  checkRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  checkMark: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkMarkText: { fontSize: 16, fontWeight: '900' },
  checkCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  checkLabel: { color: '#fff', fontSize: 11, fontWeight: '900' },
  checkDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  checkStatus: { fontSize: 8, fontWeight: '900', marginLeft: 8 },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  methodCard: { flexGrow: 1, flexBasis: 185, minHeight: 164, borderWidth: 1, borderRadius: 12, backgroundColor: C.panel2, padding: 13 },
  methodTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  methodIconWrap: { width: 43, height: 43, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  methodIcon: { fontSize: 22, fontWeight: '900' },
  methodStatus: { fontSize: 8, fontWeight: '900' },
  methodTitle: { color: '#fff', fontSize: 12, fontWeight: '900', marginTop: 13 },
  methodSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 5 },
  methodDetail: { color: '#d8e4f2', fontSize: 8, lineHeight: 13, marginTop: 9 },
  methodAction: { marginTop: 'auto', paddingTop: 11 },
  methodActionText: { fontSize: 9, fontWeight: '900' },
  twoColumn: { flexDirection: 'row', gap: 13, marginTop: 17 },
  twoColumnCompact: { flexDirection: 'column' },
  actionPanel: { flex: 1, padding: 15 },
  actionRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  actionCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  actionTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  actionSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  signerPanel: { marginTop: 17, paddingHorizontal: 16, paddingTop: 16 },
  link: { color: C.green, fontSize: 9, fontWeight: '900' },
  signerRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  signerCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  signerName: { color: '#fff', fontSize: 11, fontWeight: '900' },
  signerRole: { color: C.muted, fontSize: 8, marginTop: 4 },
  signerStatus: { fontSize: 8, fontWeight: '900', marginLeft: 8 },
  exportPanel: { minHeight: 102, marginTop: 17, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  exportIcon: { width: 52, height: 52, borderRadius: 14, borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(22,132,255,.1)', alignItems: 'center', justifyContent: 'center' },
  exportIconText: { color: C.blue, fontSize: 27, fontWeight: '900' },
  exportCopy: { flex: 1, minWidth: 0 },
  exportTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  exportText: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 5 },
  exportButton: { minHeight: 42, borderWidth: 1, borderColor: C.blue, borderRadius: 9, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  exportButtonText: { color: C.blue, fontSize: 9, fontWeight: '900' },
  activityPanel: { marginTop: 17, paddingHorizontal: 16, paddingTop: 16 },
  sourcePill: { color: C.green, fontSize: 8, fontWeight: '900', borderWidth: 1, borderColor: C.green, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  eventRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  eventIcon: { width: 39, height: 39, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eventIconText: { fontSize: 18, fontWeight: '900' },
  eventCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  eventTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  eventDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  eventTime: { color: C.muted, fontSize: 7, textAlign: 'right', marginLeft: 8, maxWidth: 90 },
  emptyText: { color: C.muted, fontSize: 9, lineHeight: 14, paddingVertical: 18, textAlign: 'center' },
  feedback: { color: C.green, fontSize: 10, lineHeight: 15, marginTop: 12 },
  integrityPanel: { marginTop: 14, padding: 14 },
  integrityTitle: { color: C.blue, fontSize: 10, fontWeight: '900' },
  integrityText: { color: '#fff', fontSize: 9, marginTop: 7 },
  integrityWarning: { color: C.yellow, fontSize: 8, lineHeight: 13, marginTop: 7 },
});
