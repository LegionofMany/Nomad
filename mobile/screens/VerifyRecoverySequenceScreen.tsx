import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadLostWallet } from '../nomad';
import type { NomadLostWalletStatus } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  PrimaryButton,
  ProgressBar,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function statusInfo(status: NomadLostWalletStatus, sessionRequired: boolean) {
  if (sessionRequired) {
    return {
      color: C.yellow,
      title: 'PROTECTED SESSION REQUIRED',
      subtitle: 'Return to Recover Lost Wallet to create the metadata-only verification session.',
      tone: 'yellow' as const,
    };
  }
  switch (status) {
    case 'verification_in_progress':
      return {
        color: C.green,
        title: 'SEQUENCE VERIFICATION ACTIVE',
        subtitle: 'Enter only the current Time Set. The value is compared locally and then cleared.',
        tone: 'green' as const,
      };
    case 'verification_locked':
      return {
        color: C.red,
        title: 'VERIFICATION TEMPORARILY LOCKED',
        subtitle: 'The failed-attempt policy is preventing additional Time Set checks.',
        tone: 'red' as const,
      };
    case 'verified_waiting_provider':
      return {
        color: C.yellow,
        title: 'SEQUENCE VERIFIED',
        subtitle: 'All enrolled digests matched. Wallet keys have not been restored.',
        tone: 'yellow' as const,
      };
    case 'ready':
      return {
        color: C.blue,
        title: 'START RECOVERY SESSION',
        subtitle: 'Recovery evidence is ready, but a protected Page 16 session has not started.',
        tone: 'blue' as const,
      };
    case 'setup_required':
    default:
      return {
        color: C.purple,
        title: 'RECOVERY SETUP REQUIRED',
        subtitle: 'Complete the missing recovery requirements before sequence verification.',
        tone: 'yellow' as const,
      };
  }
}

function StepTracker({ status, hasSession }: { status: NomadLostWalletStatus; hasSession: boolean }) {
  const verified = status === 'verified_waiting_provider';
  const verifying = status === 'verification_in_progress' || status === 'verification_locked';
  const currentStep = verified ? 3 : verifying ? 2 : 1;
  const steps = [
    { label: 'Prepare Recovery', number: 1 },
    { label: 'Verify Sequence', number: 2 },
    { label: 'Restore Wallet', number: 3 },
    { label: 'Complete', number: 4 },
  ];

  return (
    <Panel style={styles.stepper}>
      {steps.map((step, index) => {
        const done = step.number < currentStep || (step.number === 1 && hasSession);
        const active = step.number === currentStep;
        return (
          <React.Fragment key={step.label}>
            <View style={styles.step}>
              <View style={[styles.stepCircle, (done || active) && styles.stepActive]}>
                <Text style={[styles.stepNumber, (done || active) && styles.stepNumberActive]}>{done ? '✓' : step.number}</Text>
              </View>
              <Text style={[styles.stepLabel, (done || active) && { color: C.green }]}>{step.label}</Text>
              <Text style={styles.stepSub}>{done ? 'Complete' : active ? 'Current' : 'Pending'}</Text>
            </View>
            {index < steps.length - 1 ? <Text style={styles.stepArrow}>→</Text> : null}
          </React.Fragment>
        );
      })}
    </Panel>
  );
}

function TimeField({
  label,
  value,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  max: number;
  disabled: boolean;
  onChange(value: string): void;
}) {
  const handle = (next: string) => {
    const digits = next.replace(/[^0-9]/g, '').slice(0, 2);
    if (!digits) {
      onChange('');
      return;
    }
    const number = Number(digits);
    onChange(number > max ? String(max).padStart(2, '0') : digits);
  };

  return (
    <View style={styles.timeField}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={`${label} for current recovery Time Set`}
        autoComplete="off"
        contextMenuHidden
        editable={!disabled}
        keyboardType="number-pad"
        maxLength={2}
        onChangeText={handle}
        placeholder="00"
        placeholderTextColor="#65778e"
        selectTextOnFocus
        style={[styles.timeInput, disabled && styles.timeInputDisabled]}
        value={value}
      />
    </View>
  );
}

function ActivityRow({
  title,
  detail,
  timestamp,
  severity,
  last,
}: {
  title: string;
  detail: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  last?: boolean;
}) {
  const color = severity === 'critical' ? C.red : severity === 'warning' ? C.yellow : C.green;
  return (
    <View style={[styles.activityRow, !last && styles.rowBorder]}>
      <View style={[styles.activityMark, { borderColor: color, backgroundColor: `${color}12` }]}>
        <Text style={[styles.activityMarkText, { color }]}>{severity === 'info' ? '✓' : '!'}</Text>
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityDetail}>{detail}</Text>
        <Text style={styles.activityTime}>{new Date(timestamp).toLocaleString()}</Text>
      </View>
    </View>
  );
}

export default function VerifyRecoverySequenceScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { lostWallet, loading, error, refresh, verifySet } = useNomadLostWallet();
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [second, setSecond] = useState('');
  const [feedback, setFeedback] = useState('');

  const sequence = lostWallet.sequence;
  const totalSets = Math.max(1, sequence.totalSets);
  const verifiedSets = Math.min(sequence.verifiedSets, totalSets);
  const allVerified = lostWallet.status === 'verified_waiting_provider';
  const locked = lostWallet.status === 'verification_locked';
  const hasSession = Boolean(lostWallet.activeSession);
  const status = statusInfo(lostWallet.status, lostWallet.sessionRequired);
  const progress = Math.round((verifiedSets / totalSets) * 100);
  const validTime = /^\d{1,2}$/.test(hour)
    && /^\d{1,2}$/.test(minute)
    && /^\d{1,2}$/.test(second)
    && Number(hour) >= 0
    && Number(hour) <= 23
    && Number(minute) >= 0
    && Number(minute) <= 59
    && Number(second) >= 0
    && Number(second) <= 59;
  const canVerify = lostWallet.canContinueVerification && validTime && !loading && !allVerified && !locked;

  const sessionReason = useMemo(
    () => lostWallet.activeSession?.reason.replace(/_/g, ' ') ?? 'No active recovery session',
    [lostWallet.activeSession],
  );

  useEffect(() => {
    setHour('');
    setMinute('');
    setSecond('');
  }, [sequence.currentSet, lostWallet.status]);

  const clearEntry = () => {
    setHour('');
    setMinute('');
    setSecond('');
  };

  const verifyCurrent = async () => {
    if (!validTime) {
      setFeedback('Enter a valid 24-hour value including seconds.');
      return;
    }
    if (!hasSession) {
      setFeedback('Start a protected recovery session from Recover Lost Wallet before entering Time Sets.');
      return;
    }

    const attemptedSet = sequence.currentSet;
    try {
      setFeedback(`Comparing Time Set ${attemptedSet} with its enrolled digest…`);
      const result = await verifySet(attemptedSet, {
        hour: Number(hour),
        minute: Number(minute),
        second: Number(second),
      });
      clearEntry();
      setFeedback(result.message);
    } catch (nextError) {
      clearEntry();
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to verify the current Time Set.');
    }
  };

  const openPrimaryDestination = () => {
    if (lostWallet.status === 'verified_waiting_provider') {
      navigation.navigate(lostWallet.ownerAuthorityStatus === 'pending' ? 'OwnerAuthorityApproval' : 'CreateOwnerAuthority');
      return;
    }
    if (lostWallet.status === 'verification_locked' || lostWallet.status === 'setup_required') {
      navigation.navigate('RecoveryCenter');
      return;
    }
    navigation.navigate('RecoverLostWallet');
  };

  const destinationLabel = lostWallet.status === 'verified_waiting_provider'
    ? lostWallet.ownerAuthorityStatus === 'pending'
      ? 'Review Owner Authority'
      : 'Configure Owner Authority'
    : lostWallet.status === 'verification_locked' || lostWallet.status === 'setup_required'
      ? 'Open Recovery Center'
      : 'Start Protected Session';

  const recentActivity = lostWallet.activity.slice(0, 4);

  return (
    <NomadPage maxWidth={920}>
      <PageHeader
        title="Verify Recovery Sequence"
        subtitle="Step 2 of 4 • owner-controlled digest verification"
        icon="◷"
        color={status.color}
        help
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <StepTracker status={lostWallet.status} hasSession={hasSession} />

      <Panel tone={status.tone} style={[styles.hero, compact && styles.heroCompact]}>
        <RoundIcon symbol={allVerified ? '✓' : locked ? '!' : '♙'} color={status.color} size={compact ? 82 : 108} filled />
        <View style={styles.heroCopy}>
          <Text style={[styles.heroEyebrow, { color: status.color }]}>{status.title}</Text>
          <Text style={styles.heroTitle}>{allVerified ? 'Verification Complete—Restoration Pending' : 'Verify One Time Set at a Time'}</Text>
          <Text style={styles.heroText}>{status.subtitle}</Text>
          <Text style={styles.heroNote}>No enrolled Time Set value is displayed. Each entry is cleared after the attempt and the lost-wallet session stores metadata only.</Text>
        </View>
      </Panel>

      <View style={[styles.metricRow, compact && styles.metricRowCompact]}>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>CURRENT SET</Text>
          <Text style={[styles.metricValue, { color: status.color }]}>{allVerified ? '✓' : sequence.currentSet}</Text>
          <Text style={styles.metricSub}>{allVerified ? 'All verified' : `of ${totalSets}`}</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>ATTEMPTS LEFT</Text>
          <Text style={[styles.metricValue, { color: lostWallet.attemptsRemaining < 3 ? C.yellow : C.green }]}>{lostWallet.attemptsRemaining}</Text>
          <Text style={styles.metricSub}>before temporary lock</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>SESSION</Text>
          <Text numberOfLines={1} style={[styles.metricSession, { color: hasSession ? C.green : C.yellow }]}>{hasSession ? 'ACTIVE' : 'REQUIRED'}</Text>
          <Text numberOfLines={1} style={styles.metricSub}>{sessionReason}</Text>
        </Panel>
      </View>

      <Panel style={styles.verificationPanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={[styles.sectionTitle, { color: status.color }]}>
              {allVerified ? '24 TIME SETS VERIFIED' : locked ? 'ATTEMPTS PAUSED' : 'CURRENT TIME SET'}
            </Text>
            <Text style={styles.sectionSub}>
              {allVerified
                ? 'Digest comparison is complete; key restoration is not connected.'
                : locked
                  ? `Verification resumes after ${lostWallet.lockedUntil ? new Date(lostWallet.lockedUntil).toLocaleString() : 'the lockout period'}.`
                  : lostWallet.canContinueVerification
                    ? `Enter Time Set ${sequence.currentSet} of ${totalSets}.`
                    : 'Start the protected recovery session before entering any values.'}
            </Text>
          </View>
          <View style={[styles.currentSetBadge, { borderColor: status.color, backgroundColor: `${status.color}12` }]}>
            <Text style={[styles.currentSetText, { color: status.color }]}>{allVerified ? '✓' : locked ? '!' : sequence.currentSet}</Text>
          </View>
        </View>

        {allVerified ? (
          <View style={styles.verifiedBox}>
            <RoundIcon symbol="✓" color={C.green} size={59} filled />
            <View style={styles.verifiedCopy}>
              <Text style={styles.verifiedTitle}>All {totalSets} Salted Digests Matched</Text>
              <Text style={styles.verifiedText}>This proves the locally entered sequence matched the enrolled digests. It does not retrieve a seed phrase, restore private keys or unlock a different device.</Text>
            </View>
          </View>
        ) : locked ? (
          <View style={styles.lockBox}>
            <Text style={styles.lockLabel}>TIME REMAINING</Text>
            <Text style={styles.lockValue}>{formatDuration(lostWallet.lockoutRemainingSeconds)}</Text>
            <Text style={styles.lockText}>No recovery comparison is attempted while the verification policy is locked.</Text>
          </View>
        ) : lostWallet.canContinueVerification ? (
          <>
            <Text style={styles.enterLabel}>Enter the exact 24-hour time, including seconds</Text>
            <View style={styles.timeRow}>
              <TimeField label="HH" value={hour} max={23} disabled={loading} onChange={setHour} />
              <Text style={styles.colon}>:</Text>
              <TimeField label="MM" value={minute} max={59} disabled={loading} onChange={setMinute} />
              <Text style={styles.colon}>:</Text>
              <TimeField label="SS" value={second} max={59} disabled={loading} onChange={setSecond} />
            </View>
            <PrimaryButton
              label={loading ? 'Verifying Time Set…' : `Verify Time Set ${sequence.currentSet}`}
              subtitle="Compare against the protected salted digest"
              icon="◇"
              tone="green"
              disabled={!canVerify}
              onPress={() => void verifyCurrent()}
            />
          </>
        ) : (
          <Pressable onPress={() => navigation.navigate('RecoverLostWallet')} style={styles.sessionRequiredBox}>
            <RoundIcon symbol="▣" color={C.yellow} size={48} filled />
            <View style={styles.sessionRequiredCopy}>
              <Text style={styles.sessionRequiredTitle}>Protected Recovery Session Required</Text>
              <Text style={styles.sessionRequiredText}>Return to Page 16, choose a recovery reason and confirm the private-device warning.</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}

        <View style={styles.progressHeading}>
          <Text style={styles.progressLabel}>Sequence Progress</Text>
          <Text style={styles.progressValue}>{verifiedSets} of {totalSets} verified</Text>
        </View>
        <ProgressBar value={progress} color={C.green} height={10} />
        <View style={styles.milestones}>
          {[6, 12, 18, 24].map((value) => (
            <View key={value} style={styles.milestone}>
              <Text style={[styles.milestoneMark, verifiedSets >= value && { color: C.green }]}>{verifiedSets >= value ? '✓' : '•'}</Text>
              <Text style={styles.milestoneLabel}>{value} Sets</Text>
            </View>
          ))}
        </View>
      </Panel>

      {feedback ? (
        <Text style={[styles.feedback, /did not|locked|unable|required|unavailable|not match/i.test(feedback) && { color: C.yellow }]}>{feedback}</Text>
      ) : null}

      <View style={[styles.infoColumns, compact && styles.infoColumnsCompact]}>
        <Panel style={styles.infoPanel}>
          <Text style={styles.infoTitle}>VERIFICATION EVIDENCE</Text>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Provider</Text><Text style={styles.detailValue}>Nomad recovery adapter</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Digest</Text><Text style={styles.detailValue}>{lostWallet.digestAlgorithm}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Raw Time Sets Stored</Text><Text style={[styles.detailValue, { color: C.green }]}>No</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Session Contains Secrets</Text><Text style={[styles.detailValue, { color: C.green }]}>{lostWallet.activeSession?.containsSecrets === false ? 'No' : 'No session'}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Persistence</Text><Text style={[styles.detailValue, { color: C.yellow }]}>In-memory stub</Text></View>
        </Panel>

        <Panel style={styles.infoPanel}>
          <Text style={styles.infoTitle}>RESTORATION BOUNDARY</Text>
          <Text style={styles.boundaryText}>The current adapter can compare all 24 Time Sets. It cannot restore private keys, synchronize a lost-device recovery package or mark the wallet as recovered.</Text>
          <View style={styles.boundaryStatus}>
            <Text style={styles.boundaryStatusLabel}>Production restoration provider</Text>
            <Text style={styles.boundaryStatusValue}>NOT CONNECTED</Text>
          </View>
          <Pressable onPress={openPrimaryDestination} style={styles.boundaryButton}>
            <Text style={styles.boundaryButtonText}>{destinationLabel}  ›</Text>
          </Pressable>
        </Panel>
      </View>

      <Panel style={styles.activityPanel}>
        <View style={styles.activityHeading}>
          <View>
            <Text style={styles.infoTitle}>RECOVERY SESSION ACTIVITY</Text>
            <Text style={styles.activitySub}>Local metadata records—no Time Set values</Text>
          </View>
          <Text style={styles.activityCount}>{lostWallet.activity.length}</Text>
        </View>
        {recentActivity.length ? recentActivity.map((item, index) => (
          <ActivityRow
            key={item.id}
            title={item.title}
            detail={item.detail}
            timestamp={item.timestamp}
            severity={item.severity}
            last={index === recentActivity.length - 1}
          />
        )) : <Text style={styles.emptyActivity}>No protected recovery-session activity is recorded yet.</Text>}
      </Panel>

      <Panel tone="red" style={styles.warningPanel}>
        <Text style={styles.warningIcon}>⚠</Text>
        <View style={styles.warningCopy}>
          <Text style={styles.warningTitle}>Keep the sequence private</Text>
          <Text style={styles.warningText}>Never send Time Sets through email, chat, screenshots or support tickets. Stop immediately if the device, request or recovery details look unfamiliar.</Text>
        </View>
      </Panel>

      <BottomNav active="Recovery" items={[
        ['⌂', 'Home', 'Portfolio'],
        ['▣', 'Wallets', 'Wallets'],
        ['✈', 'Travel', 'TravelMode'],
        ['◇', 'Security', 'SecurityCenter'],
        ['↻', 'Recovery', 'RecoveryCenter'],
      ]} />
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
  stepCircle: { width: 33, height: 33, borderRadius: 17, borderWidth: 1, borderColor: '#46576a', alignItems: 'center', justifyContent: 'center' },
  stepActive: { borderColor: C.green, backgroundColor: C.green },
  stepNumber: { color: '#d9e4f2', fontWeight: '900' },
  stepNumberActive: { color: C.bg },
  stepLabel: { color: C.muted, fontSize: 8, textAlign: 'center', marginTop: 6 },
  stepSub: { color: C.muted, fontSize: 7, marginTop: 2 },
  stepArrow: { color: C.muted, fontSize: 17 },
  hero: { minHeight: 172, marginTop: 17, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 19 },
  heroCompact: { flexDirection: 'column', alignItems: 'flex-start' },
  heroCopy: { flex: 1, minWidth: 0 },
  heroEyebrow: { fontSize: 10, fontWeight: '900' },
  heroTitle: { color: '#fff', fontSize: 23, fontWeight: '900', marginTop: 7 },
  heroText: { color: '#e5edf6', fontSize: 11, lineHeight: 18, marginTop: 8 },
  heroNote: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 8 },
  metricRow: { flexDirection: 'row', gap: 10, marginTop: 17 },
  metricRowCompact: { flexDirection: 'column' },
  metricCard: { flex: 1, minHeight: 103, padding: 14 },
  metricLabel: { color: C.muted, fontSize: 8, fontWeight: '900' },
  metricValue: { fontSize: 27, fontWeight: '900', marginTop: 7 },
  metricSession: { fontSize: 15, fontWeight: '900', marginTop: 11 },
  metricSub: { color: C.muted, fontSize: 8, marginTop: 4, textTransform: 'capitalize' },
  verificationPanel: { marginTop: 17, padding: 18 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { fontSize: 14, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  currentSetBadge: { width: 49, height: 49, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  currentSetText: { fontSize: 18, fontWeight: '900' },
  enterLabel: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeField: { flex: 1, alignItems: 'center' },
  timeLabel: { color: C.muted, fontSize: 10, marginBottom: 7 },
  timeInput: { width: '100%', minHeight: 72, borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.panel2, color: '#fff', fontSize: 30, fontWeight: '800', textAlign: 'center', outlineStyle: 'none' } as any,
  timeInputDisabled: { opacity: .5 },
  colon: { color: '#fff', fontSize: 31, marginHorizontal: 10, marginTop: 17 },
  verifiedBox: { minHeight: 112, marginTop: 18, borderWidth: 1, borderColor: C.green, borderRadius: 12, backgroundColor: 'rgba(32,239,112,.06)', padding: 15, flexDirection: 'row', alignItems: 'center' },
  verifiedCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  verifiedTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  verifiedText: { color: C.muted, fontSize: 9, lineHeight: 15, marginTop: 5 },
  lockBox: { minHeight: 145, marginTop: 18, borderWidth: 1, borderColor: C.red, borderRadius: 12, backgroundColor: 'rgba(255,67,74,.05)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  lockLabel: { color: C.red, fontSize: 9, fontWeight: '900' },
  lockValue: { color: '#fff', fontSize: 38, fontWeight: '900', marginTop: 8 },
  lockText: { color: C.muted, fontSize: 9, textAlign: 'center', lineHeight: 15, marginTop: 8 },
  sessionRequiredBox: { minHeight: 92, marginTop: 18, borderWidth: 1, borderColor: C.yellow, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center' },
  sessionRequiredCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  sessionRequiredTitle: { color: C.yellow, fontSize: 12, fontWeight: '900' },
  sessionRequiredText: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  chevron: { color: C.yellow, fontSize: 27, marginLeft: 8 },
  progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  progressLabel: { color: '#fff', fontSize: 12, fontWeight: '800' },
  progressValue: { color: C.muted, fontSize: 10 },
  milestones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  milestone: { alignItems: 'center' },
  milestoneMark: { color: C.muted, fontSize: 16 },
  milestoneLabel: { color: C.muted, fontSize: 7, marginTop: 3 },
  feedback: { color: C.green, fontSize: 10, lineHeight: 15, marginTop: 12 },
  infoColumns: { flexDirection: 'row', gap: 12, marginTop: 17 },
  infoColumnsCompact: { flexDirection: 'column' },
  infoPanel: { flex: 1, padding: 16 },
  infoTitle: { color: C.green, fontSize: 12, fontWeight: '900' },
  detailRow: { minHeight: 39, borderBottomWidth: 1, borderBottomColor: C.borderSoft, flexDirection: 'row', alignItems: 'center' },
  detailLabel: { flex: 1, color: '#fff', fontSize: 9 },
  detailValue: { maxWidth: '55%', color: C.muted, fontSize: 8, textAlign: 'right' },
  boundaryText: { color: '#dce5ef', fontSize: 9, lineHeight: 15, marginTop: 11 },
  boundaryStatus: { marginTop: 13, borderWidth: 1, borderColor: C.yellow, borderRadius: 9, padding: 11 },
  boundaryStatusLabel: { color: C.muted, fontSize: 8 },
  boundaryStatusValue: { color: C.yellow, fontSize: 10, fontWeight: '900', marginTop: 5 },
  boundaryButton: { minHeight: 43, marginTop: 12, borderWidth: 1, borderColor: C.green, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  boundaryButtonText: { color: C.green, fontSize: 9, fontWeight: '900' },
  activityPanel: { marginTop: 17, padding: 16 },
  activityHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  activitySub: { color: C.muted, fontSize: 8, marginTop: 3 },
  activityCount: { color: C.green, fontSize: 15, fontWeight: '900' },
  activityRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  activityMark: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  activityMarkText: { fontSize: 15, fontWeight: '900' },
  activityCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  activityTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  activityDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  activityTime: { color: '#66788f', fontSize: 7, marginTop: 4 },
  emptyActivity: { color: C.muted, fontSize: 9, lineHeight: 15, paddingVertical: 14 },
  warningPanel: { minHeight: 84, marginTop: 17, padding: 15, flexDirection: 'row', alignItems: 'center' },
  warningIcon: { color: C.red, fontSize: 29, marginRight: 14 },
  warningCopy: { flex: 1, minWidth: 0 },
  warningTitle: { color: C.red, fontSize: 13, fontWeight: '900' },
  warningText: { color: '#f1e2e2', fontSize: 9, lineHeight: 15, marginTop: 4 },
});
