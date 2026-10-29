import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useNomadLostWallet } from '../nomad';
import type { NomadLostWalletStatus } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  ProgressBar,
  useNomadLayout,
} from '../ui/NomadShell';

const TWO_DIGIT_PATTERN = /^\d{2}$/;

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
      title: 'Protected Session Required',
      subtitle: 'Return to Page 16 and create a metadata-only recovery session.',
      tone: 'yellow' as const,
    };
  }
  switch (status) {
    case 'verification_in_progress':
      return {
        color: C.green,
        title: 'Verify Your Sequence',
        subtitle: 'Verify one Time Set at a time in the original exact order.',
        tone: 'green' as const,
      };
    case 'verification_locked':
      return {
        color: C.red,
        title: 'Verification Temporarily Locked',
        subtitle: 'The failed-attempt policy is preventing additional checks.',
        tone: 'red' as const,
      };
    case 'verified_waiting_provider':
      return {
        color: C.yellow,
        title: '24 Time Sets Verified',
        subtitle: 'Restoration Provider Not Connected',
        tone: 'yellow' as const,
      };
    case 'ready':
      return {
        color: C.blue,
        title: 'Protected Session Required',
        subtitle: 'Recovery evidence is ready, but Page 16 has not started a session.',
        tone: 'blue' as const,
      };
    case 'setup_required':
    default:
      return {
        color: C.purple,
        title: 'Recovery Setup Required',
        subtitle: 'Complete the missing recovery requirements before verification.',
        tone: 'yellow' as const,
      };
  }
}

function StepTracker({ status, hasSession }: { status: NomadLostWalletStatus; hasSession: boolean }) {
  const verified = status === 'verified_waiting_provider';
  const verifying = status === 'verification_in_progress' || status === 'verification_locked';
  const currentStep = verified ? 3 : verifying ? 2 : 1;
  const steps = [
    { label: 'Enter 24 Time Sets', number: 1 },
    { label: 'Verify Sequence', number: 2 },
    { label: 'Recover Wallet', number: 3 },
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
              <View style={[styles.stepCircle, (done || active) && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, (done || active) && styles.stepNumberActive]}>{done ? '✓' : step.number}</Text>
              </View>
              <Text style={[styles.stepLabel, (done || active) && { color: C.green }]}>{step.label}</Text>
              <Text style={styles.stepSub}>{done ? 'Complete' : active ? 'In Progress' : 'Pending'}</Text>
            </View>
            {index < steps.length - 1 ? <Text style={styles.stepArrow}>→</Text> : null}
          </React.Fragment>
        );
      })}
    </Panel>
  );
}

function RecoveryShieldGraphic({ color, compact }: { color: string; compact: boolean }) {
  const width = compact ? 132 : 178;
  const height = compact ? 145 : 194;
  return (
    <View accessibilityLabel="Protected recovery sequence" style={[styles.shieldGraphic, { width, height, shadowColor: color }]}>
      <Svg width={width} height={height} viewBox="0 0 178 194" fill="none">
        <Path d="M89 10C66 27 43 34 22 39v52c0 44 26 75 67 94 41-19 67-50 67-94V39c-21-5-44-12-67-29Z" fill="#05241a" stroke={color} strokeWidth="9" strokeLinejoin="round" />
        <Circle cx="89" cy="77" r="22" stroke={color} strokeWidth="6" />
        <Path d="M57 136v-14c0-16 14-28 32-28s32 12 32 28v14c-19 9-45 9-64 0Z" stroke={color} strokeWidth="6" strokeLinejoin="round" />
        <Circle cx="139" cy="142" r="29" fill="#03150f" stroke={color} strokeWidth="4" />
        <Path d="m125 142 10 10 18-22" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

function TimeField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange(value: string): void;
}) {
  const handleChange = (next: string) => onChange(next.replace(/[^0-9]/g, '').slice(0, 2));
  return (
    <View style={styles.timeField}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TextInput
        testID={`recovery-time-${label.toLowerCase()}`}
        accessibilityLabel={`${label} for current recovery Time Set`}
        autoComplete="off"
        contextMenuHidden
        editable={!disabled}
        keyboardType="number-pad"
        maxLength={2}
        onChangeText={handleChange}
        placeholder="00"
        placeholderTextColor="#65778e"
        selectTextOnFocus
        style={[styles.timeInput, disabled && styles.timeInputDisabled]}
        value={value}
      />
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
  const validTime = TWO_DIGIT_PATTERN.test(hour)
    && TWO_DIGIT_PATTERN.test(minute)
    && TWO_DIGIT_PATTERN.test(second)
    && Number(hour) <= 23
    && Number(minute) <= 59
    && Number(second) <= 59;
  const canVerify = lostWallet.canContinueVerification && validTime && !loading && !allVerified && !locked;
  const inputStarted = hour.length > 0 || minute.length > 0 || second.length > 0;
  const invalidEntry = inputStarted && !validTime;

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

  const explainOrderedSet = () => {
    setFeedback(`Exact ordering is enforced. Verify Set ${sequence.currentSet} next.`);
  };

  const verifyCurrent = async () => {
    if (!validTime) {
      setFeedback('Enter strict HH:MM:SS using two digits for every field.');
      return;
    }
    if (!hasSession) {
      setFeedback('Start a protected recovery session from Page 16 before entering Time Sets.');
      return;
    }

    const attemptedSet = sequence.currentSet;
    try {
      setFeedback(`Comparing Time Set ${attemptedSet} with its enrolled salted digest…`);
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

  const heroText = allVerified
    ? 'Every enrolled digest matched in exact order. Wallet keys remain unchanged until a production restoration provider confirms recovery.'
    : locked
      ? 'Verification is paused after incorrect attempts. No comparison is performed until the live lockout reaches zero.'
      : lostWallet.canContinueVerification
        ? 'Re-enter each Time Set one at a time in the same exact order. Every value is cleared immediately after its attempt.'
        : status.subtitle;

  return (
    <NomadPage maxWidth={920}>
      <PageHeader title="Verify Recovery Sequence" subtitle="Step 2 of 4" icon="◷" color={status.color} help />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retry recovery verification state" onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <StepTracker status={lostWallet.status} hasSession={hasSession} />

      <Panel tone={status.tone} style={[styles.hero, compact && styles.heroCompact]}>
        <RecoveryShieldGraphic color={status.color} compact={compact} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>{status.title}</Text>
          <Text style={styles.heroText}>{heroText}</Text>
          <View style={styles.heroEvidence}>
            <Text style={[styles.heroEvidenceText, { color: hasSession ? C.green : C.yellow }]}>{hasSession ? '● PROTECTED SESSION ACTIVE' : '○ PAGE 16 SESSION REQUIRED'}</Text>
            <Text style={[styles.heroEvidenceText, { color: lostWallet.attemptsRemaining <= 2 ? C.red : C.green }]}>{lostWallet.attemptsRemaining} ATTEMPTS LEFT</Text>
          </View>
        </View>
      </Panel>

      <Panel style={styles.verificationPanel}>
        <Text style={[styles.sectionTitle, { color: status.color }]}>{allVerified ? 'SEQUENCE VERIFICATION COMPLETE' : locked ? 'VERIFICATION PAUSED' : 'SELECT SET NUMBER TO VERIFY'}</Text>

        <View style={styles.setSelector}>
          <Pressable
            testID="recovery-previous-set"
            accessibilityRole="button"
            accessibilityLabel="Previous set unavailable because exact order is enforced"
            onPress={explainOrderedSet}
            style={({ pressed }) => [styles.setArrow, pressed && styles.pressed]}
          ><Text style={styles.setArrowText}>‹</Text></Pressable>
          <View style={styles.setDisplay}>
            <Text style={styles.setDisplayText}>{allVerified ? `Set ${totalSets} of ${totalSets}` : `Set ${sequence.currentSet} of ${totalSets}`}</Text>
          </View>
          <Pressable
            testID="recovery-next-set"
            accessibilityRole="button"
            accessibilityLabel="Next set unavailable because exact order is enforced"
            onPress={explainOrderedSet}
            style={({ pressed }) => [styles.setArrow, pressed && styles.pressed]}
          ><Text style={styles.setArrowText}>›</Text></Pressable>
        </View>

        {allVerified ? (
          <View style={styles.verifiedBox}>
            <Text style={styles.verifiedMark}>✓</Text>
            <View style={styles.verifiedCopy}>
              <Text style={styles.verifiedTitle}>24 Time Sets Verified</Text>
              <Text style={styles.verifiedBoundary}>Restoration Provider Not Connected</Text>
              <Text style={styles.verifiedText}>Digest verification is complete. Nomad has not restored keys, unlocked another device, or marked the wallet recovered.</Text>
            </View>
          </View>
        ) : locked ? (
          <View style={styles.lockBox}>
            <Text style={styles.lockLabel}>TIME REMAINING</Text>
            <Text style={styles.lockValue}>{formatDuration(lostWallet.lockoutRemainingSeconds)}</Text>
            <Text style={styles.lockText}>No recovery comparison is attempted during lockout.</Text>
          </View>
        ) : lostWallet.canContinueVerification ? (
          <>
            <Text style={styles.enterLabel}>Enter Time (including seconds)</Text>
            <View style={styles.timeRow}>
              <TimeField label="HH" value={hour} disabled={loading} onChange={setHour} />
              <Text style={styles.colon}>:</Text>
              <TimeField label="MM" value={minute} disabled={loading} onChange={setMinute} />
              <Text style={styles.colon}>:</Text>
              <TimeField label="SS" value={second} disabled={loading} onChange={setSecond} />
            </View>
            {invalidEntry ? <Text style={styles.validationText}>Use strict HH:MM:SS: hours 00–23 and minutes/seconds 00–59.</Text> : null}
            <Pressable
              testID="recovery-verify-set"
              accessibilityRole="button"
              accessibilityLabel={`Verify Set ${sequence.currentSet}`}
              disabled={!canVerify}
              onPress={() => void verifyCurrent()}
              style={({ pressed }) => [styles.verifyButton, !canVerify && styles.verifyButtonDisabled, pressed && canVerify && styles.pressed]}
            >
              <Text style={styles.verifyButtonText}>{loading ? 'Verifying…' : `Verify Set ${sequence.currentSet}`}</Text>
              <Text style={styles.verifyArrow}>›</Text>
            </Pressable>
          </>
        ) : (
          <Pressable testID="recovery-return-page16" accessibilityRole="button" accessibilityLabel="Return to Page 16" onPress={() => navigation.navigate('RecoverLostWallet')} style={styles.sessionBox}>
            <Text style={styles.sessionIcon}>▣</Text>
            <View style={styles.sessionCopy}><Text style={styles.sessionTitle}>Protected Recovery Session Required</Text><Text style={styles.sessionText}>Return to Page 16, select a recovery reason, and confirm the private-device warning.</Text></View>
            <Text style={styles.sessionArrow}>›</Text>
          </Pressable>
        )}

        <View style={styles.progressHeading}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{verifiedSets} of {totalSets} verified</Text>
        </View>
        <ProgressBar value={progress} color={C.green} height={10} />
      </Panel>

      {feedback ? <Text style={[styles.feedback, /did not|locked|unable|required|unavailable|not match/i.test(feedback) && { color: C.yellow }]}>{feedback}</Text> : null}

      <Panel tone="yellow" style={styles.warningPanel}>
        <Text style={styles.warningIcon}>⚠</Text>
        <View style={styles.warningCopy}>
          <Text style={styles.warningTitle}>Important</Text>
          <Text style={styles.warningText}>All 24 Time Sets must be verified one at a time in the exact same order. Too many incorrect attempts trigger lockout; successful digest matching alone does not restore wallet keys.</Text>
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
  pressed: { opacity: 0.72 },
  errorBanner: { minHeight: 48, marginBottom: 10, borderWidth: 1, borderColor: C.red, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  stepper: { minHeight: 106, padding: 13, flexDirection: 'row', alignItems: 'center' },
  step: { flex: 1, alignItems: 'center' },
  stepCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#485668', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { borderColor: C.green, backgroundColor: C.green },
  stepNumber: { color: '#e1e8f0', fontSize: 11, fontWeight: '900' },
  stepNumberActive: { color: C.bg },
  stepLabel: { color: C.muted, fontSize: 8, lineHeight: 11, textAlign: 'center', marginTop: 7 },
  stepSub: { color: C.muted, fontSize: 7, marginTop: 3 },
  stepArrow: { color: '#7f8996', fontSize: 22 },
  hero: { minHeight: 220, marginTop: 19, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 28 },
  heroCompact: { flexDirection: 'column', alignItems: 'center', gap: 15 },
  shieldGraphic: { alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.38, shadowRadius: 22 },
  heroCopy: { flex: 1, minWidth: 0 },
  heroTitle: { color: '#fff', fontSize: 25, fontWeight: '900' },
  heroText: { color: '#e5edf6', fontSize: 12, lineHeight: 20, marginTop: 10 },
  heroEvidence: { minHeight: 42, marginTop: 14, borderTopWidth: 1, borderTopColor: C.borderSoft, paddingTop: 11, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  heroEvidenceText: { fontSize: 7.5, fontWeight: '900' },
  verificationPanel: { marginTop: 21, padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '900' },
  setSelector: { marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 18 },
  setArrow: { width: 66, height: 66, borderRadius: 33, borderWidth: 1, borderColor: '#445365', alignItems: 'center', justifyContent: 'center' },
  setArrowText: { color: '#fff', fontSize: 38, lineHeight: 43, fontWeight: '300' },
  setDisplay: { flex: 1, minHeight: 66, borderWidth: 1, borderColor: '#435165', borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  setDisplayText: { color: '#fff', fontSize: 19, fontWeight: '900' },
  enterLabel: { color: '#fff', fontSize: 13, marginTop: 24, marginBottom: 14 },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeField: { flex: 1, alignItems: 'center' },
  timeLabel: { color: '#d8dee8', fontSize: 10, marginBottom: 8 },
  timeInput: { width: '100%', minHeight: 72, borderWidth: 1, borderColor: '#405065', borderRadius: 10, backgroundColor: C.panel2, color: '#fff', fontSize: 30, fontWeight: '500', textAlign: 'center', outlineStyle: 'none' } as any,
  timeInputDisabled: { opacity: 0.5 },
  colon: { color: '#fff', fontSize: 29, marginHorizontal: 10, marginTop: 18 },
  validationText: { color: C.yellow, fontSize: 8, lineHeight: 13, textAlign: 'center', marginTop: 9 },
  verifyButton: { minHeight: 72, marginTop: 22, borderRadius: 10, backgroundColor: C.green, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center' },
  verifyButtonDisabled: { backgroundColor: '#183448', opacity: 0.72 },
  verifyButtonText: { flex: 1, color: C.bg, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  verifyArrow: { color: C.bg, fontSize: 34 },
  progressHeading: { marginTop: 24, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { color: '#fff', fontSize: 12 },
  progressValue: { color: '#dce4ee', fontSize: 11 },
  verifiedBox: { minHeight: 132, marginTop: 22, borderWidth: 1, borderColor: C.yellow, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,185,35,.05)' },
  verifiedMark: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: C.green, color: C.green, fontSize: 29, lineHeight: 54, textAlign: 'center', fontWeight: '900' },
  verifiedCopy: { flex: 1, minWidth: 0, marginLeft: 14 },
  verifiedTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  verifiedBoundary: { color: C.yellow, fontSize: 10, fontWeight: '900', marginTop: 5 },
  verifiedText: { color: C.muted, fontSize: 8.5, lineHeight: 14, marginTop: 5 },
  lockBox: { minHeight: 145, marginTop: 22, borderWidth: 1, borderColor: C.red, borderRadius: 12, backgroundColor: 'rgba(255,67,74,.05)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  lockLabel: { color: C.red, fontSize: 9, fontWeight: '900' },
  lockValue: { color: '#fff', fontSize: 38, fontWeight: '900', marginTop: 8 },
  lockText: { color: C.muted, fontSize: 9, textAlign: 'center', lineHeight: 15, marginTop: 8 },
  sessionBox: { minHeight: 94, marginTop: 22, borderWidth: 1, borderColor: C.yellow, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center' },
  sessionIcon: { color: C.yellow, fontSize: 29, marginRight: 12 },
  sessionCopy: { flex: 1, minWidth: 0 },
  sessionTitle: { color: C.yellow, fontSize: 12, fontWeight: '900' },
  sessionText: { color: C.muted, fontSize: 8.5, lineHeight: 14, marginTop: 4 },
  sessionArrow: { color: C.yellow, fontSize: 27, marginLeft: 8 },
  feedback: { color: C.green, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 12 },
  warningPanel: { minHeight: 112, marginTop: 21, padding: 18, flexDirection: 'row', alignItems: 'center' },
  warningIcon: { color: C.yellow, fontSize: 35, marginRight: 18 },
  warningCopy: { flex: 1, minWidth: 0 },
  warningTitle: { color: C.yellow, fontSize: 14, fontWeight: '900' },
  warningText: { color: '#e6e8ec', fontSize: 10, lineHeight: 17, marginTop: 6 },
});
