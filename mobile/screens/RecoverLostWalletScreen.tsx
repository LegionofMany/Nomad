import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadLostWallet } from '../nomad';
import type {
  NomadLostWalletPrerequisite,
  NomadLostWalletReason,
  NomadLostWalletStatus,
} from '../nomad';
import {
  C,
  NomadPage,
  PageHeader,
  Panel,
  PrimaryButton,
  ProgressBar,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

const reasonOptions: Array<{
  value: NomadLostWalletReason;
  label: string;
  subtitle: string;
  icon: string;
}> = [
  { value: 'lost_device', label: 'Lost Device', subtitle: 'The original phone or computer is unavailable', icon: '▯' },
  { value: 'replaced_device', label: 'Replaced Device', subtitle: 'Continue recovery on a replacement device', icon: '⇄' },
  { value: 'locked_out', label: 'Locked Out', subtitle: 'The wallet access policy requires recovery', icon: '▣' },
  { value: 'security_incident', label: 'Security Incident', subtitle: 'Recover after suspected compromise or coercion', icon: '◇' },
  { value: 'recovery_test', label: 'Recovery Test', subtitle: 'Verify readiness without claiming key restoration', icon: '✓' },
];

function statusInfo(status: NomadLostWalletStatus) {
  switch (status) {
    case 'ready':
      return { color: C.green, title: 'READY FOR VERIFICATION', subtitle: 'Required local recovery evidence is available.' };
    case 'verification_in_progress':
      return { color: C.blue, title: 'VERIFICATION IN PROGRESS', subtitle: 'Continue the protected Time Set sequence.' };
    case 'verification_locked':
      return { color: C.red, title: 'VERIFICATION TEMPORARILY LOCKED', subtitle: 'The failed-attempt policy is protecting the recovery flow.' };
    case 'verified_waiting_provider':
      return { color: C.yellow, title: 'TIME SETS VERIFIED', subtitle: 'A production provider is still required to restore wallet keys.' };
    case 'setup_required':
      return { color: C.purple, title: 'RECOVERY SETUP REQUIRED', subtitle: 'One or more required recovery checks are incomplete.' };
  }
}

function RecoveryStepper({ status }: { status: NomadLostWalletStatus }) {
  const currentStep = status === 'verified_waiting_provider'
    ? 3
    : status === 'verification_in_progress' || status === 'verification_locked'
      ? 2
      : 1;
  const steps = [
    ['1', 'Prepare Recovery'],
    ['2', 'Verify Sequence'],
    ['3', 'Restore Wallet'],
    ['4', 'Complete'],
  ];

  return (
    <Panel style={styles.stepper}>
      {steps.map(([number, label], index) => {
        const stepNumber = index + 1;
        const done = stepNumber < currentStep;
        const active = stepNumber === currentStep;
        return (
          <React.Fragment key={number}>
            <View style={styles.step}>
              <View style={[styles.stepCircle, (active || done) && styles.stepActive]}>
                <Text style={[styles.stepNumber, (active || done) && styles.stepNumberActive]}>{done ? '✓' : number}</Text>
              </View>
              <Text style={[styles.stepLabel, (active || done) && { color: C.green }]}>{label}</Text>
              <Text style={styles.stepSub}>{done ? 'Complete' : active ? 'Current' : 'Pending'}</Text>
            </View>
            {index < steps.length - 1 ? <Text style={styles.stepArrow}>→</Text> : null}
          </React.Fragment>
        );
      })}
    </Panel>
  );
}

function PrerequisiteRow({
  item,
  last,
}: {
  item: NomadLostWalletPrerequisite;
  last?: boolean;
}) {
  const navigation = useNavigation<any>();
  const color = item.status === 'pass' ? C.green : item.status === 'warning' ? C.yellow : C.red;
  const mark = item.status === 'pass' ? '✓' : item.status === 'warning' ? '!' : '×';

  return (
    <View style={[styles.checkRow, !last && styles.rowBorder]}>
      <View style={[styles.checkMark, { borderColor: color, backgroundColor: `${color}12` }]}>
        <Text style={[styles.checkMarkText, { color }]}>{mark}</Text>
      </View>
      <View style={styles.checkCopy}>
        <Text style={styles.checkTitle}>{item.label}</Text>
        <Text style={styles.checkDetail}>{item.detail}</Text>
      </View>
      {item.route ? (
        <Pressable onPress={() => navigation.navigate(item.route)} style={({ pressed }) => [styles.fixButton, pressed && styles.pressed]}>
          <Text style={[styles.fixButtonText, { color }]}>Review  ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function EnrollmentGrid({ enrolled, total }: { enrolled: number; total: number }) {
  return (
    <View style={styles.timeGrid}>
      {Array.from({ length: total }, (_, index) => {
        const active = index < enrolled;
        return (
          <View key={index} style={[styles.timeCell, active && styles.timeCellActive]}>
            <Text style={[styles.cellNumber, active && { color: C.green }]}>{index + 1}</Text>
            <Text style={[styles.cellStatus, active && { color: C.green }]}>{active ? 'ENROLLED' : 'NOT SET'}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function RecoverLostWalletScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { lostWallet, loading, error, refresh, beginRecovery } = useNomadLostWallet();
  const [reason, setReason] = useState<NomadLostWalletReason | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [feedback, setFeedback] = useState('');

  const status = statusInfo(lostWallet.status);
  const enrollmentPercent = Math.round((lostWallet.enrolledTimeSets / Math.max(1, lostWallet.totalTimeSets)) * 100);
  const requiredPasses = lostWallet.prerequisites.filter((item) => item.id !== 'restoration_provider' && item.status === 'pass').length;
  const requiredTotal = lostWallet.prerequisites.filter((item) => item.id !== 'restoration_provider').length;
  const reasonLabel = useMemo(
    () => reasonOptions.find((item) => item.value === reason)?.label ?? 'Not selected',
    [reason],
  );

  const needsVerificationAction = lostWallet.status === 'ready' || lostWallet.status === 'verification_in_progress';
  const canStart = needsVerificationAction && Boolean(reason) && acknowledged && !loading;

  const handlePrimary = async () => {
    if (lostWallet.status === 'setup_required' || lostWallet.status === 'verification_locked') {
      navigation.navigate('RecoveryCenter');
      return;
    }
    if (lostWallet.status === 'verified_waiting_provider') {
      navigation.navigate('VerifyRecoverySequence');
      return;
    }
    if (!reason) {
      setFeedback('Choose why you are starting recovery.');
      return;
    }
    if (!acknowledged) {
      setFeedback('Confirm the private recovery warning before continuing.');
      return;
    }

    try {
      setFeedback('Creating a local recovery-verification session…');
      await beginRecovery(reason);
      setFeedback('Recovery-verification session created. No password, seed phrase or raw Time Set value was stored.');
      navigation.navigate('VerifyRecoverySequence');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to begin the recovery-verification sequence.');
    }
  };

  const primaryLabel = lostWallet.status === 'ready'
    ? 'Begin Sequence Verification'
    : lostWallet.status === 'verification_in_progress'
      ? 'Continue Sequence Verification'
      : lostWallet.status === 'verified_waiting_provider'
        ? 'View Verification Status'
        : lostWallet.status === 'verification_locked'
          ? 'Open Recovery Center'
          : 'Review Recovery Setup';

  const primarySubtitle = needsVerificationAction
    ? 'Verify all enrolled Time Sets in their original order'
    : lostWallet.status === 'verified_waiting_provider'
      ? 'Review the verified sequence and provider boundary'
      : 'Resolve incomplete recovery checks before continuing';

  return (
    <NomadPage maxWidth={940}>
      <PageHeader
        title="Recover Lost Wallet"
        subtitle="Start an owner-controlled recovery verification"
        icon="◷"
        color={status.color}
        help
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <RecoveryStepper status={lostWallet.status} />

      <Panel style={[styles.hero, compact && styles.heroCompact]}>
        <View style={styles.heroCopy}>
          <Text style={[styles.eyebrow, { color: status.color }]}>STEP 1 OF 4</Text>
          <Text style={styles.heroTitle}>Prepare Lost-Wallet Recovery</Text>
          <Text style={styles.heroText}>
            Nomad checks whether the current installation has the wallet identity, all 24 enrolled Time Set digests and the cryptographic tools required to begin local verification.
          </Text>
          <View style={[styles.statusBox, { borderColor: status.color }]}>
            <Text style={[styles.statusMark, { color: status.color }]}>{lostWallet.status === 'ready' ? '✓' : lostWallet.status === 'verification_locked' ? '!' : '◇'}</Text>
            <View style={styles.statusCopy}>
              <Text style={[styles.statusTitle, { color: status.color }]}>{status.title}</Text>
              <Text style={styles.statusSub}>{status.subtitle}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.clock, { width: compact ? 210 : 270, height: compact ? 210 : 270, borderRadius: compact ? 105 : 135, borderColor: status.color }]}>
          <Text style={styles.clockTwelve}>12</Text>
          <Text style={[styles.clockIcon, { color: status.color }]}>◷</Text>
          <Text style={[styles.clockBrand, { color: status.color }]}>NOMAD</Text>
          <Text style={styles.clockSub}>LOST WALLET RECOVERY</Text>
          <Text style={styles.clockTime}>{lostWallet.enrolledTimeSets}/{lostWallet.totalTimeSets}</Text>
          <Text style={styles.clockFoot}>TIME SET DIGESTS</Text>
        </View>
      </Panel>

      <Panel style={styles.readinessPanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>RECOVERY READINESS</Text>
            <Text style={styles.sectionSub}>Evidence from the connected recovery adapter</Text>
          </View>
          <Text style={[styles.readinessCount, { color: requiredPasses === requiredTotal ? C.green : C.yellow }]}>{requiredPasses}/{requiredTotal}</Text>
        </View>
        {lostWallet.prerequisites.map((item, index) => (
          <PrerequisiteRow key={item.id} item={item} last={index === lostWallet.prerequisites.length - 1} />
        ))}
      </Panel>

      <Panel style={styles.reasonPanel}>
        <Text style={styles.sectionTitle}>WHY ARE YOU RECOVERING?</Text>
        <Text style={styles.sectionSub}>This selection is stored only as session metadata and does not change wallet keys.</Text>
        <View style={styles.reasonGrid}>
          {reasonOptions.map((item) => {
            const selected = reason === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => setReason(item.value)}
                style={({ pressed }) => [styles.reasonCard, selected && styles.reasonCardSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.reasonIcon, selected && { color: C.green }]}>{item.icon}</Text>
                <Text style={[styles.reasonTitle, selected && { color: C.green }]}>{item.label}</Text>
                <Text style={styles.reasonSub}>{item.subtitle}</Text>
                <Text style={[styles.reasonSelect, selected && { color: C.green }]}>{selected ? 'SELECTED ✓' : 'SELECT'}</Text>
              </Pressable>
            );
          })}
        </View>
      </Panel>

      <Panel style={styles.sequencePanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>24 TIME SET ENROLLMENT</Text>
            <Text style={styles.sectionSub}>Enrollment status only—Time Set values remain hidden</Text>
          </View>
          <Text style={styles.enrollmentCount}>{lostWallet.enrolledTimeSets}/{lostWallet.totalTimeSets}</Text>
        </View>
        <ProgressBar value={enrollmentPercent} color={C.green} height={8} />
        <EnrollmentGrid enrolled={lostWallet.enrolledTimeSets} total={lostWallet.totalTimeSets} />
      </Panel>

      <View style={[styles.infoColumns, compact && styles.infoColumnsCompact]}>
        <Panel style={styles.infoPanel}>
          <Text style={styles.sectionTitle}>SESSION DETAILS</Text>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Reason</Text><Text style={styles.detailValue}>{reasonLabel}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Attempts Remaining</Text><Text style={styles.detailValue}>{lostWallet.attemptsRemaining}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Owner Authority</Text><Text style={styles.detailValue}>{lostWallet.ownerAuthorityStatus.replace(/_/g, ' ')}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Password Provider</Text><Text style={[styles.detailValue, { color: C.yellow }]}>Not connected</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Restoration Provider</Text><Text style={[styles.detailValue, { color: C.yellow }]}>Not connected</Text></View>
          {lostWallet.activeSession ? (
            <View style={styles.sessionBox}>
              <Text style={styles.sessionTitle}>LOCAL SESSION</Text>
              <Text style={styles.sessionText}>{lostWallet.activeSession.id}</Text>
              <Text style={styles.sessionText}>Created {new Date(lostWallet.activeSession.createdAt).toLocaleString()}</Text>
              <Text style={styles.sessionText}>Contains secrets: No</Text>
            </View>
          ) : null}
        </Panel>

        <Panel style={styles.infoPanel}>
          <Text style={styles.sectionTitle}>OWNER AUTHORITY</Text>
          <Text style={styles.ownerText}>
            Owner Authority can record an independent approval request, but remote signed delivery is not connected in this build.
          </Text>
          <Pressable
            onPress={() => navigation.navigate(lostWallet.ownerAuthorityStatus === 'pending' ? 'OwnerAuthorityApproval' : 'CreateOwnerAuthority')}
            style={({ pressed }) => [styles.ownerButton, pressed && styles.pressed]}
          >
            <Text style={styles.ownerButtonText}>{lostWallet.ownerAuthorityStatus === 'pending' ? 'Review Pending Request' : 'Configure Owner Authority'}  ›</Text>
          </Pressable>
          <View style={styles.safetyNote}>
            <Text style={styles.safetyNoteIcon}>◇</Text>
            <Text style={styles.safetyNoteText}>Nomad will never ask for all 24 Time Sets in a message, support ticket, email or public website.</Text>
          </View>
        </Panel>
      </View>

      <Panel tone="yellow" style={styles.providerPanel}>
        <Text style={styles.providerIcon}>!</Text>
        <View style={styles.providerCopy}>
          <Text style={styles.providerTitle}>Verification is not wallet restoration</Text>
          <Text style={styles.providerText}>
            This build can compare enrolled Time Set digests locally. It cannot restore keys on a lost device, retrieve a seed phrase or synchronize a recovery package because the production restoration provider is not connected.
          </Text>
        </View>
      </Panel>

      <Pressable onPress={() => setAcknowledged((value) => !value)} style={styles.ackRow}>
        <View style={[styles.checkbox, acknowledged && styles.checkboxActive]}>
          <Text style={[styles.checkmark, acknowledged && { color: C.bg }]}>{acknowledged ? '✓' : ''}</Text>
        </View>
        <Text style={styles.ackText}>
          I am using a private, trusted device and understand that this starts local verification only; it does not prove that wallet keys have been restored.
        </Text>
      </Pressable>

      {feedback ? <Text style={[styles.feedback, /unable|cannot|incomplete|locked|required/i.test(feedback) && { color: C.red }]}>{feedback}</Text> : null}

      <PrimaryButton
        label={loading ? 'Checking Recovery…' : primaryLabel}
        subtitle={primarySubtitle}
        icon="◇"
        tone={lostWallet.status === 'verification_locked' ? 'red' : 'green'}
        disabled={needsVerificationAction ? !canStart : loading}
        onPress={() => void handlePrimary()}
      />

      <Panel tone="red" style={styles.warningPanel}>
        <Text style={styles.warningIcon}>⚠</Text>
        <Text style={styles.warningText}>
          Never enter a seed phrase, private key or full Time Set sequence into a support message or third-party form. Stop if the device, request or recovery details look unfamiliar.
        </Text>
      </Panel>
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  errorBanner: { minHeight: 48, marginBottom: 10, borderWidth: 1, borderColor: C.red, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  stepper: { minHeight: 94, padding: 12, flexDirection: 'row', alignItems: 'center' },
  step: { flex: 1, alignItems: 'center' },
  stepCircle: { width: 31, height: 31, borderRadius: 16, borderWidth: 1, borderColor: '#718097', alignItems: 'center', justifyContent: 'center' },
  stepActive: { borderColor: C.green, backgroundColor: C.green },
  stepNumber: { color: '#dce6f4', fontWeight: '900' },
  stepNumberActive: { color: C.bg },
  stepLabel: { color: C.muted, fontSize: 8, textAlign: 'center', marginTop: 6 },
  stepSub: { color: C.muted, fontSize: 7, textAlign: 'center', marginTop: 2 },
  stepArrow: { color: C.muted, fontSize: 18 },
  hero: { marginTop: 17, padding: 19, flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 11, fontWeight: '900' },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 12 },
  heroText: { color: '#d8e1ec', fontSize: 11, lineHeight: 18, marginTop: 9 },
  statusBox: { minHeight: 66, marginTop: 18, borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center' },
  statusMark: { fontSize: 24, marginRight: 11 },
  statusCopy: { flex: 1, minWidth: 0 },
  statusTitle: { fontSize: 11, fontWeight: '900' },
  statusSub: { color: '#e6edf7', fontSize: 9, lineHeight: 14, marginTop: 4 },
  clock: { alignSelf: 'center', borderWidth: 2, backgroundColor: 'rgba(0,30,20,.45)', alignItems: 'center', justifyContent: 'center' },
  clockTwelve: { color: '#fff', fontSize: 17, fontWeight: '900' },
  clockIcon: { fontSize: 36, marginTop: 12 },
  clockBrand: { fontSize: 14, fontWeight: '900' },
  clockSub: { color: C.muted, fontSize: 7, fontWeight: '800' },
  clockTime: { color: '#fff', fontSize: 27, fontWeight: '900', marginTop: 8 },
  clockFoot: { color: C.muted, fontSize: 7, marginTop: 3 },
  readinessPanel: { marginTop: 17, padding: 17 },
  reasonPanel: { marginTop: 17, padding: 17 },
  sequencePanel: { marginTop: 17, padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  sectionTitle: { color: C.green, fontSize: 13, fontWeight: '900', letterSpacing: .3 },
  sectionSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 3 },
  readinessCount: { fontSize: 16, fontWeight: '900' },
  checkRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  checkMark: { width: 37, height: 37, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkMarkText: { fontSize: 15, fontWeight: '900' },
  checkCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  checkTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  checkDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  fixButton: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 8 },
  fixButtonText: { fontSize: 8, fontWeight: '900' },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  reasonCard: { flexGrow: 1, flexBasis: 150, minHeight: 132, borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 12 },
  reasonCardSelected: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.06)' },
  reasonIcon: { color: C.muted, fontSize: 23 },
  reasonTitle: { color: '#fff', fontSize: 11, fontWeight: '900', marginTop: 8 },
  reasonSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 5 },
  reasonSelect: { color: C.muted, fontSize: 7, fontWeight: '900', marginTop: 9 },
  enrollmentCount: { color: C.green, fontSize: 15, fontWeight: '900' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  timeCell: { width: '15%', minWidth: 75, flexGrow: 1, minHeight: 57, borderWidth: 1, borderColor: '#2a3b4b', borderRadius: 8, padding: 9 },
  timeCellActive: { borderColor: C.green, backgroundColor: 'rgba(0,255,100,.06)' },
  cellNumber: { color: '#d4d8e1', fontSize: 10, fontWeight: '700' },
  cellStatus: { color: C.muted, fontSize: 7, fontWeight: '900', marginTop: 10 },
  infoColumns: { flexDirection: 'row', gap: 12, marginTop: 17 },
  infoColumnsCompact: { flexDirection: 'column' },
  infoPanel: { flex: 1, padding: 16 },
  detailRow: { minHeight: 37, borderBottomWidth: 1, borderBottomColor: C.borderSoft, flexDirection: 'row', alignItems: 'center' },
  detailLabel: { flex: 1, color: '#fff', fontSize: 9 },
  detailValue: { maxWidth: '52%', color: C.muted, fontSize: 8, textAlign: 'right', textTransform: 'capitalize' },
  sessionBox: { marginTop: 12, borderWidth: 1, borderColor: C.blue, borderRadius: 9, padding: 11 },
  sessionTitle: { color: C.blue, fontSize: 8, fontWeight: '900' },
  sessionText: { color: C.muted, fontSize: 7, lineHeight: 12, marginTop: 4 },
  ownerText: { color: '#d7dfec', fontSize: 9, lineHeight: 15, marginTop: 10 },
  ownerButton: { minHeight: 42, marginTop: 13, borderWidth: 1, borderColor: C.green, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  ownerButtonText: { color: C.green, fontSize: 9, fontWeight: '900' },
  safetyNote: { marginTop: 13, borderWidth: 1, borderColor: C.border, borderRadius: 9, padding: 11, flexDirection: 'row', alignItems: 'center' },
  safetyNoteIcon: { color: C.green, fontSize: 22, marginRight: 10 },
  safetyNoteText: { flex: 1, color: C.muted, fontSize: 8, lineHeight: 13 },
  providerPanel: { minHeight: 98, marginTop: 17, padding: 15, flexDirection: 'row', alignItems: 'center' },
  providerIcon: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: C.yellow, color: C.yellow, fontSize: 20, fontWeight: '900', textAlign: 'center', textAlignVertical: 'center' },
  providerCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  providerTitle: { color: C.yellow, fontSize: 13, fontWeight: '900' },
  providerText: { color: '#efe6d3', fontSize: 9, lineHeight: 15, marginTop: 5 },
  ackRow: { marginTop: 17, flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { width: 23, height: 23, borderRadius: 6, borderWidth: 1, borderColor: C.green, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxActive: { backgroundColor: C.green },
  checkmark: { color: C.green, fontWeight: '900' },
  ackText: { flex: 1, color: '#dbe4ed', fontSize: 9, lineHeight: 15 },
  feedback: { color: C.yellow, fontSize: 10, lineHeight: 15, marginTop: 10 },
  warningPanel: { minHeight: 76, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  warningIcon: { color: C.red, fontSize: 25, marginRight: 12 },
  warningText: { flex: 1, color: '#e7edf5', fontSize: 9, lineHeight: 15 },
  pressed: { opacity: .72 },
});
