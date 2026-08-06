import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadUnlock } from '../nomad';
import type { NomadUnlockVerificationStatus } from '../nomad';
import { useAppState } from '../state/appState';
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

function statusInfo(status: NomadUnlockVerificationStatus) {
  switch (status) {
    case 'ready': return { color: C.green, title: 'READY TO VERIFY', timer: 'OPEN NOW', tone: 'green' as const };
    case 'unlocked': return { color: C.green, title: 'WALLET UNLOCKED', timer: 'UNLOCKED', tone: 'green' as const };
    case 'temporarily_locked': return { color: C.yellow, title: 'TRY AGAIN SOON', timer: 'LOCKED', tone: 'yellow' as const };
    case 'waiting': return { color: C.blue, title: 'ACCESS WINDOW CLOSED', timer: null, tone: 'blue' as const };
    case 'recovery_required': return { color: C.red, title: 'RECOVERY REQUIRED', timer: 'LOCKED', tone: 'red' as const };
    case 'not_configured': return { color: C.purple, title: 'TIME SET REQUIRED', timer: 'SETUP', tone: 'yellow' as const };
    case 'no_wallet': return { color: C.yellow, title: 'WALLET SETUP REQUIRED', timer: 'SETUP', tone: 'yellow' as const };
  }
}

function DetailRow({
  icon,
  label,
  value,
  color = C.muted,
  last,
}: {
  icon: string;
  label: string;
  value: string;
  color?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.rowBorder]}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
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
  const handleChange = (next: string) => {
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
        accessibilityLabel={`${label.toLowerCase()} for wallet verification`}
        autoComplete="off"
        editable={!disabled}
        keyboardType="number-pad"
        maxLength={2}
        onChangeText={handleChange}
        placeholder="00"
        placeholderTextColor="#61728a"
        selectTextOnFocus
        style={[styles.timeInput, disabled && styles.timeInputDisabled]}
        value={value}
      />
    </View>
  );
}

export default function UnlockWalletScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { refresh: refreshAppState } = useAppState();
  const { unlock, loading, error, refresh, verify } = useNomadUnlock();
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [feedback, setFeedback] = useState('');
  const [verified, setVerified] = useState(false);

  const status = statusInfo(unlock.status);
  const validTime = /^\d{1,2}$/.test(hour)
    && /^\d{1,2}$/.test(minute)
    && Number(hour) >= 0
    && Number(hour) <= 23
    && Number(minute) >= 0
    && Number(minute) <= 59;
  const inputComplete = hour.length > 0 && minute.length > 0 && validTime;
  const isUnlocked = unlock.status === 'unlocked' || verified;
  const canSubmit = unlock.canVerify && inputComplete && !loading && !isUnlocked;

  const completedSteps = useMemo(() => {
    const windowReady = ['ready', 'temporarily_locked', 'unlocked'].includes(unlock.status);
    return [windowReady, inputComplete, verified || isUnlocked, isUnlocked];
  }, [unlock.status, inputComplete, verified, isUnlocked]);
  const progress = completedSteps.filter(Boolean).length * 25;

  const timerValue = unlock.status === 'temporarily_locked'
    ? `00:${String(Math.floor(unlock.remainingLockSeconds / 60)).padStart(2, '0')}:${String(unlock.remainingLockSeconds % 60).padStart(2, '0')}`
    : status.timer ?? unlock.clock.countdownLabel;

  const clearEntry = () => {
    setHour('');
    setMinute('');
  };

  const handleVerify = async () => {
    if (!validTime) {
      setFeedback('Enter a valid 24-hour time between 00:00 and 23:59.');
      return;
    }

    try {
      setFeedback('Verifying the daily access window and wallet secret…');
      const attempt = await verify({ hour: Number(hour), minute: Number(minute) });
      const result = attempt.result;

      if (result.ok) {
        await refreshAppState();
        setVerified(true);
        setFeedback('Wallet verification complete. The wallet service opened the local session.');
        clearEntry();
        return;
      }

      setVerified(false);
      clearEntry();
      switch (result.reason) {
        case 'outside_window':
          setFeedback(`The daily access window is closed. Return in ${attempt.state.clock.countdownLabel}.`);
          break;
        case 'locked_out':
          setFeedback(result.permanentlyLocked
            ? 'The attempt limit was reached. Verified recovery is required.'
            : `Attempts are temporarily paused for ${result.remainingLockSeconds ?? attempt.state.remainingLockSeconds} seconds.`);
          break;
        case 'bad_time':
          setFeedback(`The entered Time Set did not match. ${attempt.state.attemptsRemaining} attempt${attempt.state.attemptsRemaining === 1 ? '' : 's'} remain before recovery is required.`);
          break;
        case 'decrypt_failed':
          setFeedback(`Wallet verification failed. ${attempt.state.attemptsRemaining} attempt${attempt.state.attemptsRemaining === 1 ? '' : 's'} remain before recovery is required.`);
          break;
        case 'not_configured':
          setFeedback('Daily Time Clock access has not been configured.');
          break;
        case 'no_wallet':
          setFeedback('Create or restore a wallet before attempting access.');
          break;
      }
    } catch (nextError) {
      setVerified(false);
      clearEntry();
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to verify wallet access.');
    }
  };

  const primaryRoute = isUnlocked
    ? 'Portfolio'
    : unlock.status === 'no_wallet'
      ? 'Lock'
      : unlock.status === 'recovery_required' || unlock.status === 'not_configured'
        ? 'RecoveryCenter'
        : 'TimeClockAccess';

  const primaryLabel = isUnlocked
    ? 'View Wallet'
    : unlock.status === 'no_wallet'
      ? 'Wallet Setup'
      : unlock.status === 'recovery_required'
        ? 'Start Recovery'
        : unlock.status === 'not_configured'
          ? 'Review Setup'
          : 'View Time Clock';

  const latestEvent = unlock.clock.events[0];

  return (
    <NomadPage maxWidth={880}>
      <PageHeader
        title="Unlock Wallet"
        subtitle={isUnlocked ? 'Owner access verified' : 'Verify your owner-controlled Time Set'}
        icon="▣"
        color={status.color}
        status={false}
        right={(
          <Pressable onPress={() => navigation.navigate('TimeClockAccess')}>
            <Text style={[styles.cancel, { color: status.color }]}>Cancel</Text>
          </Pressable>
        )}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <Panel style={styles.topStats}>
        <View style={styles.topStat}>
          <Text style={[styles.topIcon, { color: status.color }]}>◷</Text>
          <View style={styles.topCopy}>
            <Text style={styles.topTitle}>Access Window</Text>
            <Text style={styles.topValue}>{unlock.clock.accessWindowLabel}</Text>
          </View>
        </View>
        <View style={styles.topDivider} />
        <View style={styles.topStat}>
          <Text style={[styles.topIcon, { color: status.color }]}>◎</Text>
          <View style={styles.topCopy}>
            <Text style={styles.topTitle}>Device Time</Text>
            <Text style={styles.topValue}>{unlock.clock.currentTimeLabel} • {unlock.clock.timeZoneLabel}</Text>
          </View>
        </View>
        <Text style={[styles.topShield, { color: status.color }]}>◇</Text>
      </Panel>

      <View style={styles.timerSection}>
        <View
          style={[
            styles.timer,
            {
              width: compact ? 225 : 300,
              height: compact ? 225 : 300,
              borderRadius: compact ? 113 : 150,
              borderColor: status.color,
            },
          ]}
        >
          <Text style={[styles.timerLabel, { color: status.color }]}>{status.title}</Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.timerValue, { fontSize: compact ? 37 : 49 }]}
          >
            {timerValue}
          </Text>
          {timerValue.includes(':') ? (
            <View style={styles.timerUnits}>
              <Text style={[styles.timerUnit, { color: status.color }]}>HOURS</Text>
              <Text style={[styles.timerUnit, { color: status.color }]}>MINUTES</Text>
              <Text style={[styles.timerUnit, { color: status.color }]}>SECONDS</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.unlockTitle}>{isUnlocked ? 'Access Granted' : status.title.replace(/_/g, ' ')}</Text>
        <Text style={styles.unlockSub}>
          {isUnlocked
            ? 'The wallet service confirmed the Time Set and opened the local wallet session.'
            : unlock.status === 'ready'
              ? 'Enter the exact owner-configured time. It is not displayed or prefilled on this page.'
              : unlock.status === 'waiting'
                ? 'Verification is disabled until the owner-configured daily access window opens.'
                : unlock.status === 'temporarily_locked'
                  ? 'Progressive lockout is active after an incorrect verification attempt.'
                  : unlock.status === 'recovery_required'
                    ? 'The maximum failed-attempt limit was reached. The clock cannot bypass recovery.'
                    : 'Complete the required wallet and recovery setup before verification.'}
        </Text>
      </View>

      <Panel tone={status.tone} style={styles.verificationPanel}>
        <View style={styles.verificationHeading}>
          <View>
            <Text style={[styles.verificationEyebrow, { color: status.color }]}>OWNER TIME SET</Text>
            <Text style={styles.verificationTitle}>Enter 24-hour verification time</Text>
            <Text style={styles.verificationSub}>The value is checked only by the local wallet service after the daily window opens.</Text>
          </View>
          <View style={[styles.attemptPill, { borderColor: unlock.attemptsRemaining <= 2 ? C.red : status.color }]}>
            <Text style={[styles.attemptValue, { color: unlock.attemptsRemaining <= 2 ? C.red : status.color }]}>{unlock.attemptsRemaining}</Text>
            <Text style={styles.attemptLabel}>ATTEMPTS LEFT</Text>
          </View>
        </View>

        <View style={[styles.timeEntryRow, compact && styles.timeEntryCompact]}>
          <TimeField label="HOUR" value={hour} max={23} disabled={!unlock.canVerify || loading || isUnlocked} onChange={setHour} />
          <Text style={styles.colon}>:</Text>
          <TimeField label="MINUTE" value={minute} max={59} disabled={!unlock.canVerify || loading || isUnlocked} onChange={setMinute} />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!canSubmit}
          onPress={() => void handleVerify()}
          style={({ pressed }) => [
            styles.verifyButton,
            { backgroundColor: canSubmit ? status.color : '#183047' },
            pressed && canSubmit && styles.pressed,
          ]}
        >
          <Text style={[styles.verifyButtonText, { color: canSubmit ? C.bg : C.muted }]}>
            {loading ? 'VERIFYING…' : isUnlocked ? 'WALLET UNLOCKED' : 'VERIFY & UNLOCK'}
          </Text>
        </Pressable>

        {feedback ? (
          <Text style={[
            styles.feedback,
            /failed|incorrect|closed|locked|required|unable|did not/i.test(feedback) && { color: C.yellow },
            /complete|opened/i.test(feedback) && { color: C.green },
          ]}>
            {feedback}
          </Text>
        ) : null}
      </Panel>

      <Panel style={styles.progressPanel}>
        <View style={styles.progressHeading}>
          <Text style={styles.progressTitle}>VERIFICATION PROGRESS</Text>
          <Text style={[styles.progressValue, { color: status.color }]}>{progress}%</Text>
        </View>
        <ProgressBar value={progress} color={status.color} height={8} />
        <View style={styles.steps}>
          {[
            'Window Open',
            'Time Entered',
            'Wallet Verified',
            'Access Granted',
          ].map((label, index) => {
            const done = completedSteps[index];
            return (
              <View key={label} style={styles.step}>
                <View style={[styles.stepCircle, { borderColor: status.color }, done && { backgroundColor: status.color }]}>
                  <Text style={[styles.stepMark, { color: status.color }, done && { color: C.bg }]}>{done ? '✓' : index + 1}</Text>
                </View>
                <Text style={[styles.stepText, done && { color: status.color }]}>{label}</Text>
              </View>
            );
          })}
        </View>
      </Panel>

      <Panel tone={isUnlocked ? 'green' : status.tone} style={styles.resultPanel}>
        <RoundIcon symbol={isUnlocked ? '✓' : unlock.status === 'recovery_required' ? '!' : '◷'} color={isUnlocked ? C.green : status.color} size={62} filled />
        <View style={styles.resultCopy}>
          <Text style={styles.resultTitle}>{isUnlocked ? 'Wallet Unlocked' : status.title}</Text>
          <Text style={styles.resultSub}>
            {isUnlocked
              ? 'Final signing and transaction approval remain controlled by the connected wallet service.'
              : `Verification provider: ${unlock.verificationProvider.replace(/_/g, ' ')}.`}
          </Text>
        </View>
        <Pressable onPress={() => navigation.navigate(primaryRoute)} style={[styles.resultButton, { borderColor: status.color }]}>
          <Text style={[styles.resultButtonText, { color: status.color }]}>{primaryLabel}  ›</Text>
        </Pressable>
      </Panel>

      <Panel style={styles.detailsPanel}>
        <Text style={styles.detailsTitle}>ACCESS EVIDENCE</Text>
        <DetailRow icon="◷" label="Daily Window" value={unlock.clock.accessWindowLabel} />
        <DetailRow icon="◎" label="Clock Source" value="Device local clock" color={C.yellow} />
        <DetailRow icon="⌁" label="Trusted Time" value="Not connected" color={C.yellow} />
        <DetailRow icon="!" label="Recent Failures" value={`${unlock.recentFailures} / ${unlock.maximumFailuresBeforeRecovery}`} color={unlock.recentFailures ? C.yellow : C.green} />
        <DetailRow icon="▣" label="Session" value={isUnlocked ? 'Unlocked' : 'Protected'} color={isUnlocked ? C.green : status.color} />
        <DetailRow icon="◇" label="Persistence" value="In-memory development stub" color={C.yellow} last />
      </Panel>

      {latestEvent ? (
        <Panel style={styles.eventPanel}>
          <RoundIcon symbol={latestEvent.type === 'unlock_success' ? '✓' : '!'} color={latestEvent.severity === 'critical' ? C.red : latestEvent.severity === 'warning' ? C.yellow : C.green} size={43} filled />
          <View style={styles.eventCopy}>
            <Text style={styles.eventTitle}>{latestEvent.title}</Text>
            <Text style={styles.eventDetail}>{latestEvent.detail}</Text>
            <Text style={styles.eventTime}>{new Date(latestEvent.timestamp).toLocaleString()}</Text>
          </View>
        </Panel>
      ) : null}

      <Panel tone="green" style={styles.footerPanel}>
        <RoundIcon symbol="◇" color={C.green} size={45} />
        <View style={styles.footerCopy}>
          <Text style={styles.footerTitle}>Protected by owner-controlled Time Sets</Text>
          <Text style={styles.footerText}>Nomad does not reveal the configured verification value, bypass the daily access window or claim access before wallet-service confirmation.</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('RecoveryCenter')}>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
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
  pressed: { opacity: 0.74 },
  cancel: { fontSize: 12, fontWeight: '800' },
  errorBanner: { minHeight: 48, marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 10, backgroundColor: 'rgba(255,68,90,.08)', padding: 11, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, minWidth: 0, color: C.red, fontSize: 10 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginLeft: 8 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  topStats: { minHeight: 84, padding: 13, flexDirection: 'row', alignItems: 'center' },
  topStat: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  topCopy: { flex: 1, minWidth: 0 },
  topIcon: { fontSize: 25, marginRight: 11 },
  topTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  topValue: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  topDivider: { width: 1, height: 55, backgroundColor: C.borderSoft, marginHorizontal: 12 },
  topShield: { fontSize: 33, marginLeft: 10 },
  timerSection: { alignItems: 'center', marginTop: 24 },
  timer: { borderWidth: 13, backgroundColor: 'rgba(4,29,26,.86)', alignItems: 'center', justifyContent: 'center', shadowColor: C.green, shadowOpacity: .45, shadowRadius: 25 },
  timerLabel: { fontSize: 10, fontWeight: '900', textAlign: 'center', paddingHorizontal: 20 },
  timerValue: { color: '#fff', fontWeight: '900', letterSpacing: -1, marginTop: 11, maxWidth: '82%' },
  timerUnits: { flexDirection: 'row', gap: 18, marginTop: 11 },
  timerUnit: { fontSize: 8 },
  unlockTitle: { color: '#fff', fontSize: 23, fontWeight: '900', textAlign: 'center', marginTop: 20 },
  unlockSub: { color: C.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 7, maxWidth: 570 },
  verificationPanel: { marginTop: 21, padding: 18 },
  verificationHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  verificationEyebrow: { fontSize: 9, fontWeight: '900' },
  verificationTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 5 },
  verificationSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 5, maxWidth: 560 },
  attemptPill: { minWidth: 82, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7, alignItems: 'center' },
  attemptValue: { fontSize: 18, fontWeight: '900' },
  attemptLabel: { color: C.muted, fontSize: 6, marginTop: 2 },
  timeEntryRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 18 },
  timeEntryCompact: { paddingHorizontal: 0 },
  timeField: { flex: 1 },
  timeLabel: { color: C.muted, fontSize: 8, textAlign: 'center', marginBottom: 6 },
  timeInput: { minHeight: 72, borderWidth: 1, borderColor: C.green, borderRadius: 11, backgroundColor: C.panel2, color: '#fff', fontSize: 31, fontWeight: '900', textAlign: 'center', outlineStyle: 'none' } as any,
  timeInputDisabled: { borderColor: C.border, color: C.muted, opacity: 0.65 },
  colon: { color: '#fff', fontSize: 34, marginHorizontal: 13, marginBottom: 14 },
  verifyButton: { minHeight: 57, marginTop: 16, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  verifyButtonText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  feedback: { color: C.muted, fontSize: 9, lineHeight: 15, textAlign: 'center', marginTop: 11 },
  progressPanel: { marginTop: 17, padding: 17 },
  progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  progressTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  progressValue: { fontSize: 12, fontWeight: '900' },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  step: { flex: 1, alignItems: 'center' },
  stepCircle: { width: 31, height: 31, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepMark: { fontSize: 10, fontWeight: '900' },
  stepText: { color: C.muted, fontSize: 8, lineHeight: 11, textAlign: 'center', marginTop: 6, paddingHorizontal: 2 },
  resultPanel: { minHeight: 94, marginTop: 17, padding: 15, flexDirection: 'row', alignItems: 'center' },
  resultCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  resultTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  resultSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  resultButton: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, marginLeft: 8 },
  resultButtonText: { fontSize: 9, fontWeight: '900' },
  detailsPanel: { marginTop: 17, padding: 16 },
  detailsTitle: { color: '#fff', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  detailRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  detailIcon: { color: C.green, fontSize: 18, width: 30 },
  detailLabel: { color: '#fff', fontSize: 11, flex: 1 },
  detailValue: { maxWidth: '56%', fontSize: 9, lineHeight: 13, textAlign: 'right' },
  eventPanel: { minHeight: 83, marginTop: 17, padding: 13, flexDirection: 'row', alignItems: 'center' },
  eventCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  eventTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  eventDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  eventTime: { color: C.muted, fontSize: 7, marginTop: 4 },
  footerPanel: { minHeight: 82, marginTop: 17, padding: 14, flexDirection: 'row', alignItems: 'center' },
  footerCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  footerTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  footerText: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  chevron: { color: C.green, fontSize: 27, marginLeft: 8 },
});
