import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { useNomadRecovery, useNomadUnlock } from '../nomad';
import type { NomadUnlockVerificationStatus } from '../nomad';
import { useAppState } from '../state/appState';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

const TIME_VALUE_PATTERN = /^\d{1,2}$/;
const COUNTDOWN_PATTERN = /^\d{2}:\d{2}:\d{2}$/;
const DIAL_CENTER = 180;
const DIAL_RADIUS = 154;
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;
const DIAL_TICKS = Array.from({ length: 60 }, (_, index) => {
  const angle = ((index * 6) - 90) * (Math.PI / 180);
  const major = index % 5 === 0;
  const inner = major ? 127 : 137;
  const outer = 146;
  return {
    id: `unlock-tick-${index}`,
    major,
    x1: DIAL_CENTER + Math.cos(angle) * inner,
    y1: DIAL_CENTER + Math.sin(angle) * inner,
    x2: DIAL_CENTER + Math.cos(angle) * outer,
    y2: DIAL_CENTER + Math.sin(angle) * outer,
  };
});

function statusInfo(status: NomadUnlockVerificationStatus) {
  switch (status) {
    case 'ready': return { color: C.green, title: 'Ready to Verify', timer: 'OPEN NOW', tone: 'green' as const };
    case 'unlocked': return { color: C.green, title: 'Wallet Unlocked', timer: 'UNLOCKED', tone: 'green' as const };
    case 'temporarily_locked': return { color: C.yellow, title: 'Verification Paused', timer: 'LOCKED', tone: 'yellow' as const };
    case 'waiting': return { color: C.green, title: 'Waiting for Access Window', timer: null, tone: 'green' as const };
    case 'recovery_required': return { color: C.red, title: 'Recovery Required', timer: 'LOCKED', tone: 'red' as const };
    case 'not_configured': return { color: C.purple, title: 'Time Set Required', timer: 'SETUP', tone: 'yellow' as const };
    case 'no_wallet': return { color: C.yellow, title: 'Wallet Setup Required', timer: 'SETUP', tone: 'yellow' as const };
  }
}

function UnlockDial({
  color,
  label,
  progress,
  size,
  value,
}: {
  color: string;
  label: string;
  progress: number;
  size: number;
  value: string;
}) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  const markerAngle = ((safeProgress * 3.6) - 90) * (Math.PI / 180);
  const markerX = DIAL_CENTER + Math.cos(markerAngle) * DIAL_RADIUS;
  const markerY = DIAL_CENTER + Math.sin(markerAngle) * DIAL_RADIUS;
  const showUnits = COUNTDOWN_PATTERN.test(value);

  return (
    <View accessibilityLabel={`${label}: ${value}`} style={[styles.dial, { width: size, height: size, shadowColor: color }]}>
      <Svg width={size} height={size} viewBox="0 0 360 360" fill="none">
        <Defs>
          <LinearGradient id="unlockArc" x1="31" y1="38" x2="329" y2="322">
            <Stop stopColor="#27f379" />
            <Stop offset="0.5" stopColor={color} />
            <Stop offset="1" stopColor="#087541" />
          </LinearGradient>
        </Defs>
        <Circle cx={DIAL_CENTER} cy={DIAL_CENTER} r="166" fill="#031712" fillOpacity=".92" stroke="#073e31" strokeWidth="2" />
        <Circle cx={DIAL_CENTER} cy={DIAL_CENTER} r={DIAL_RADIUS} stroke="#0a543d" strokeWidth="13" opacity=".55" />
        <Circle
          cx={DIAL_CENTER}
          cy={DIAL_CENTER}
          r={DIAL_RADIUS}
          stroke="url(#unlockArc)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${DIAL_CIRCUMFERENCE} ${DIAL_CIRCUMFERENCE}`}
          strokeDashoffset={DIAL_CIRCUMFERENCE * (1 - safeProgress / 100)}
          rotation="-90"
          origin={`${DIAL_CENTER}, ${DIAL_CENTER}`}
        />
        {DIAL_TICKS.map((tick) => (
          <Line
            key={tick.id}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.major ? color : '#0a6b4b'}
            strokeWidth={tick.major ? 3 : 1.5}
            strokeLinecap="round"
            opacity={tick.major ? 0.78 : 0.43}
          />
        ))}
        <Circle cx={markerX} cy={markerY} r="7" fill={color} />
        <Circle cx={markerX} cy={markerY} r="15" fill={color} opacity=".18" />
      </Svg>
      <View style={styles.dialContent}>
        <Text style={[styles.timerLabel, { color }]}>{label}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.timerValue}>{value}</Text>
        {showUnits ? (
          <View style={styles.timerUnits}>
            <Text style={[styles.timerUnit, { color }]}>HOURS</Text>
            <Text style={[styles.timerUnit, { color }]}>MINUTES</Text>
            <Text style={[styles.timerUnit, { color }]}>SECONDS</Text>
          </View>
        ) : <Text style={[styles.timerState, { color }]}>OWNER-CONTROLLED ACCESS</Text>}
      </View>
    </View>
  );
}

function SuccessSeal({ size }: { size: number }) {
  return (
    <View accessibilityLabel="Wallet service confirmed access" style={[styles.successSeal, { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg width={size * 0.58} height={size * 0.58} viewBox="0 0 100 100" fill="none">
        <Defs><LinearGradient id="successCheck" x1="16" y1="20" x2="86" y2="83"><Stop stopColor="#28f27a" /><Stop offset="1" stopColor="#04a95a" /></LinearGradient></Defs>
        <Circle cx="50" cy="50" r="45" fill="#062119" stroke="url(#successCheck)" strokeWidth="4" />
        <Path d="m27 51 15 15 31-34" stroke="url(#successCheck)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Text style={styles.successSealTitle}>ACCESS GRANTED</Text>
      <Text style={styles.successSealSub}>Wallet service confirmed</Text>
    </View>
  );
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
    if (!digits) return onChange('');
    const number = Number(digits);
    onChange(number > max ? String(max).padStart(2, '0') : digits);
  };

  return (
    <View style={styles.timeField}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TextInput
        testID={`unlock-${label.toLowerCase()}`}
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
  const { recovery } = useNomadRecovery();
  const { unlock, loading, error, refresh, verify } = useNomadUnlock();
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [feedback, setFeedback] = useState('');
  const [attempted, setAttempted] = useState(false);

  const status = statusInfo(unlock.status);
  const validTime = TIME_VALUE_PATTERN.test(hour)
    && TIME_VALUE_PATTERN.test(minute)
    && Number(hour) >= 0
    && Number(hour) <= 23
    && Number(minute) >= 0
    && Number(minute) <= 59;
  const inputComplete = hour.length > 0 && minute.length > 0 && validTime;
  const isUnlocked = unlock.status === 'unlocked';
  const canSubmit = unlock.canVerify && inputComplete && !loading && !isUnlocked;

  const completedSteps = useMemo(() => {
    const windowReady = ['ready', 'temporarily_locked', 'unlocked'].includes(unlock.status);
    const timeEntered = attempted || unlock.recentFailures > 0 || isUnlocked;
    return [windowReady, timeEntered, isUnlocked, isUnlocked];
  }, [unlock.status, unlock.recentFailures, attempted, isUnlocked]);
  const progress = completedSteps.filter(Boolean).length * 25;

  const timerValue = loading && attempted && unlock.status === 'ready'
    ? 'VERIFYING'
    : unlock.status === 'temporarily_locked'
      ? `00:${String(Math.floor(unlock.remainingLockSeconds / 60)).padStart(2, '0')}:${String(unlock.remainingLockSeconds % 60).padStart(2, '0')}`
      : status.timer ?? unlock.clock.countdownLabel;
  const timerLabel = unlock.status === 'waiting'
    ? 'TIME REMAINING'
    : unlock.status === 'temporarily_locked'
      ? 'TRY AGAIN IN'
      : unlock.status === 'ready'
        ? 'ACCESS WINDOW'
        : 'WALLET STATUS';
  const dialProgress = unlock.status === 'ready'
    ? 100
    : unlock.status === 'temporarily_locked'
      ? Math.max(8, 100 - Math.min(100, (unlock.remainingLockSeconds / 300) * 100))
      : unlock.clock.cycleProgressPercent;

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
      setAttempted(true);
      setFeedback('Verifying the daily access window and owner-controlled Time Set…');
      const attempt = await verify({ hour: Number(hour), minute: Number(minute) });
      const result = attempt.result;

      if (result.ok && attempt.state.status === 'unlocked') {
        await refreshAppState();
        setFeedback('Wallet verification complete. The wallet service opened the local session.');
        clearEntry();
        return;
      }

      if (result.ok) {
        clearEntry();
        setFeedback('Wallet verification succeeded, but access is still awaiting confirmed session state.');
        return;
      }

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
  const unlockEvent = unlock.clock.events.find((item) => item.type === 'unlock_success');
  const unlockedAt = isUnlocked
    ? unlockEvent ? new Date(unlockEvent.timestamp).toLocaleString() : 'Confirmed session'
    : 'Not unlocked';
  const mainTitle = isUnlocked
    ? 'Wallet Unlocked!'
    : unlock.status === 'ready'
      ? 'Ready to Unlock Wallet'
      : unlock.status === 'waiting'
        ? 'Time Set in Progress…'
        : status.title;
  const mainSubtitle = isUnlocked
    ? 'Access granted. The wallet service confirmed this local session.'
    : unlock.status === 'ready'
      ? 'Enter the exact owner-configured time to begin wallet verification.'
      : unlock.status === 'waiting'
        ? 'Verification remains disabled until the daily access window opens.'
        : unlock.status === 'temporarily_locked'
          ? `Progressive lockout is active. ${unlock.attemptsRemaining} attempts remain before recovery is required.`
          : unlock.status === 'recovery_required'
            ? 'The attempt limit was reached. Continue through protected recovery.'
            : 'Complete the required wallet and recovery setup before verification.';
  const headerSubtitle = isUnlocked
    ? 'Owner access verified'
    : unlock.status === 'waiting'
      ? 'Time Set in progress…'
      : unlock.status === 'ready'
        ? 'Access window open'
        : unlock.status === 'temporarily_locked'
          ? 'Verification paused'
          : 'Protected owner access';

  return (
    <NomadPage maxWidth={880}>
      <PageHeader
        title="Unlock Wallet"
        subtitle={headerSubtitle}
        icon="▣"
        color={status.color}
        status={false}
        right={!isUnlocked ? (
          <Pressable testID="unlock-cancel" accessibilityRole="button" accessibilityLabel="Cancel wallet unlock" onPress={() => navigation.navigate('TimeClockAccess')}>
            <Text style={[styles.cancel, { color: status.color }]}>Cancel</Text>
          </Pressable>
        ) : null}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel style={styles.topStats}>
        <View style={styles.topStat}>
          <RoundIcon symbol="▦" color={status.color} size={44} filled />
          <View style={styles.topCopy}><Text style={styles.topTitle}>Time Set</Text><Text style={styles.topValue}>{unlock.clock.configuredTime ? '24 Hour Cycle' : 'Not Configured'}</Text></View>
        </View>
        <View style={styles.topDivider} />
        <View style={styles.topStat}>
          <Text style={[styles.topIcon, { color: status.color }]}>◷</Text>
          <View style={styles.topCopy}><Text style={styles.topTitle}>Started</Text><Text style={styles.topValue}>{recovery.cycleStartedLabel}</Text></View>
        </View>
        <Text style={[styles.topShield, { color: status.color }]}>◇</Text>
      </Panel>

      <View style={styles.heroSection}>
        {isUnlocked ? (
          <SuccessSeal size={compact ? 225 : 306} />
        ) : (
          <UnlockDial color={status.color} label={timerLabel} progress={dialProgress} size={compact ? 278 : 368} value={timerValue} />
        )}
        <Text style={styles.unlockTitle}>{mainTitle}</Text>
        <Text style={styles.unlockSub}>{mainSubtitle}</Text>
      </View>

      {unlock.status === 'ready' ? (
        <Panel tone="green" style={styles.verificationPanel}>
          <View style={styles.verificationHeading}>
            <View style={styles.verificationCopy}>
              <Text style={styles.verificationEyebrow}>OWNER TIME SET</Text>
              <Text style={styles.verificationTitle}>Enter 24-hour verification time</Text>
              <Text style={styles.verificationSub}>Checked only by the local wallet service. The configured value is never displayed or prefilled.</Text>
            </View>
            <View style={[styles.attemptPill, { borderColor: unlock.attemptsRemaining <= 2 ? C.red : C.green }]}>
              <Text style={[styles.attemptValue, { color: unlock.attemptsRemaining <= 2 ? C.red : C.green }]}>{unlock.attemptsRemaining}</Text>
              <Text style={styles.attemptLabel}>ATTEMPTS LEFT</Text>
            </View>
          </View>
          <View style={styles.timeEntryRow}>
            <TimeField label="HOUR" value={hour} max={23} disabled={loading} onChange={setHour} />
            <Text style={styles.colon}>:</Text>
            <TimeField label="MINUTE" value={minute} max={59} disabled={loading} onChange={setMinute} />
          </View>
          <Pressable
            testID="unlock-verify"
            accessibilityRole="button"
            accessibilityLabel="Verify Time Set and unlock wallet"
            disabled={!canSubmit}
            onPress={() => void handleVerify()}
            style={({ pressed }) => [styles.verifyButton, { backgroundColor: canSubmit ? C.green : '#183047' }, pressed && canSubmit && styles.pressed]}
          >
            <Text style={[styles.verifyButtonText, { color: canSubmit ? C.bg : C.muted }]}>{loading ? 'VERIFYING…' : 'VERIFY & UNLOCK'}</Text>
          </Pressable>
        </Panel>
      ) : null}

      {feedback ? (
        <Text style={[
          styles.feedback,
          /failed|incorrect|closed|locked|required|unable|did not/i.test(feedback) && { color: C.yellow },
          /complete|opened/i.test(feedback) && { color: C.green },
        ]}>{feedback}</Text>
      ) : null}

      <Panel style={styles.progressPanel}>
        <View style={styles.progressHeading}><Text style={styles.progressTitle}>VERIFICATION PROGRESS</Text><Text style={[styles.progressValue, { color: status.color }]}>{progress}%</Text></View>
        <View style={[styles.progressRail, { backgroundColor: `${status.color}70` }]} />
        <View style={styles.steps}>
          {['Window Open', 'Time Entered', 'Wallet Verified', 'Access Granted'].map((label, index) => {
            const done = completedSteps[index];
            return (
              <View key={label} style={styles.step}>
                <View style={[styles.stepCircle, { borderColor: status.color }, done && { backgroundColor: status.color }]}><Text style={[styles.stepMark, { color: status.color }, done && { color: C.bg }]}>{done ? '✓' : index + 1}</Text></View>
                <Text style={[styles.stepText, done && { color: status.color }]}>{label}</Text>
              </View>
            );
          })}
        </View>
      </Panel>

      {isUnlocked || unlock.status !== 'ready' ? (
        <Panel tone={isUnlocked ? 'green' : status.tone} style={styles.resultPanel}>
          <RoundIcon symbol={isUnlocked ? '✓' : unlock.status === 'recovery_required' ? '!' : '◷'} color={isUnlocked ? C.green : status.color} size={62} filled />
          <View style={styles.resultCopy}>
            <Text style={styles.resultTitle}>{isUnlocked ? 'Wallet Unlocked!' : status.title}</Text>
            <Text style={styles.resultSub}>{isUnlocked ? 'Access granted. Welcome back.' : mainSubtitle}</Text>
          </View>
          <Pressable testID="unlock-result-action" accessibilityRole="button" accessibilityLabel={primaryLabel} onPress={() => navigation.navigate(primaryRoute)} style={[styles.resultButton, { borderColor: status.color }]}>
            <Text style={[styles.resultButtonText, { color: status.color }]}>{primaryLabel}</Text><Text style={[styles.resultArrow, { color: status.color }]}>›</Text>
          </Pressable>
        </Panel>
      ) : null}

      <Panel style={styles.detailsPanel}>
        <Text style={styles.detailsTitle}>DETAILS</Text>
        <DetailRow icon="▦" label="Time Set" value={unlock.clock.configuredTime ? '24 Hour Cycle' : 'Not Configured'} />
        <DetailRow icon="◷" label="Started" value={recovery.cycleStartedLabel} />
        <DetailRow icon="▣" label="Unlocked" value={unlockedAt} color={isUnlocked ? C.green : C.muted} />
        <DetailRow icon="◇" label="Security Status" value={isUnlocked ? 'Wallet Service Confirmed' : status.title} color={isUnlocked ? C.green : status.color} last />
      </Panel>

      {latestEvent && !isUnlocked ? (
        <Panel style={styles.eventPanel}>
          <RoundIcon symbol={latestEvent.type === 'unlock_success' ? '✓' : '!'} color={latestEvent.severity === 'critical' ? C.red : latestEvent.severity === 'warning' ? C.yellow : C.green} size={43} filled />
          <View style={styles.eventCopy}><Text style={styles.eventTitle}>{latestEvent.title}</Text><Text style={styles.eventDetail}>{latestEvent.detail}</Text><Text style={styles.eventTime}>{new Date(latestEvent.timestamp).toLocaleString()}</Text></View>
        </Panel>
      ) : null}

      <Panel tone="green" style={styles.footerPanel}>
        <RoundIcon symbol="◇" color={C.green} size={46} />
        <View style={styles.footerCopy}><Text style={styles.footerTitle}>Your wallet is protected by Nomad Time Sets.</Text><Text style={styles.footerText}>You’re in control. Your time. Your freedom. Nomad never displays the configured value or bypasses wallet-service confirmation.</Text></View>
        <Pressable testID="unlock-learn-more" accessibilityRole="button" accessibilityLabel="Learn more about Nomad Time Sets" onPress={() => navigation.navigate('RecoveryCenter')} style={({ pressed }) => [styles.learnButton, pressed && styles.pressed]}><Text style={styles.learnText}>Learn More</Text><Text style={styles.chevron}>›</Text></Pressable>
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
  cancel: { fontSize: 12, fontWeight: '800' },
  errorBanner: { minHeight: 48, marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 10, backgroundColor: 'rgba(255,68,90,.08)', padding: 11, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, minWidth: 0, color: C.red, fontSize: 10 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginLeft: 8 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  topStats: { minHeight: 92, padding: 13, flexDirection: 'row', alignItems: 'center' },
  topStat: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  topCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  topIcon: { fontSize: 25, marginRight: 11 },
  topTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  topValue: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  topDivider: { width: 1, height: 56, backgroundColor: C.borderSoft, marginHorizontal: 13 },
  topShield: { fontSize: 34, marginLeft: 10 },
  heroSection: { alignItems: 'center', marginTop: 22 },
  dial: { alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.46, shadowRadius: 27 },
  dialContent: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: '15%' },
  timerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  timerValue: { width: '100%', color: '#fff', fontSize: 48, lineHeight: 60, fontWeight: '900', letterSpacing: -1.2, textAlign: 'center', marginTop: 8 },
  timerUnits: { flexDirection: 'row', gap: 20, marginTop: 5 },
  timerUnit: { fontSize: 8 },
  timerState: { fontSize: 8, fontWeight: '800', marginTop: 5 },
  successSeal: { borderWidth: 2, borderColor: C.green, backgroundColor: 'rgba(3,28,20,.82)', alignItems: 'center', justifyContent: 'center', shadowColor: C.green, shadowOpacity: 0.43, shadowRadius: 26 },
  successSealTitle: { color: C.green, fontSize: 13, fontWeight: '900', marginTop: 7 },
  successSealSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  unlockTitle: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 18 },
  unlockSub: { color: '#cdd6e3', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 7, maxWidth: 590 },
  verificationPanel: { marginTop: 20, padding: 18 },
  verificationHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  verificationCopy: { flex: 1, minWidth: 0 },
  verificationEyebrow: { color: C.green, fontSize: 9, fontWeight: '900' },
  verificationTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 5 },
  verificationSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 5, maxWidth: 560 },
  attemptPill: { minWidth: 82, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7, alignItems: 'center' },
  attemptValue: { fontSize: 18, fontWeight: '900' },
  attemptLabel: { color: C.muted, fontSize: 6, marginTop: 2 },
  timeEntryRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 18 },
  timeField: { flex: 1 },
  timeLabel: { color: C.muted, fontSize: 8, textAlign: 'center', marginBottom: 6 },
  timeInput: { minHeight: 72, borderWidth: 1, borderColor: C.green, borderRadius: 11, backgroundColor: C.panel2, color: '#fff', fontSize: 31, fontWeight: '900', textAlign: 'center', outlineStyle: 'none' } as any,
  timeInputDisabled: { borderColor: C.border, color: C.muted, opacity: 0.65 },
  colon: { color: '#fff', fontSize: 34, marginHorizontal: 13, marginBottom: 14 },
  verifyButton: { minHeight: 57, marginTop: 16, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  verifyButtonText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  feedback: { color: C.muted, fontSize: 9, lineHeight: 15, textAlign: 'center', marginTop: 12 },
  progressPanel: { marginTop: 17, padding: 17 },
  progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  progressTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  progressValue: { fontSize: 11, fontWeight: '900' },
  progressRail: { position: 'absolute', left: '12%', right: '12%', top: 64, height: 2 },
  steps: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { flex: 1, alignItems: 'center' },
  stepCircle: { width: 31, height: 31, borderRadius: 16, borderWidth: 2, backgroundColor: C.panel2, alignItems: 'center', justifyContent: 'center' },
  stepMark: { fontSize: 10, fontWeight: '900' },
  stepText: { color: C.muted, fontSize: 8, lineHeight: 11, textAlign: 'center', marginTop: 7, paddingHorizontal: 2 },
  resultPanel: { minHeight: 105, marginTop: 17, padding: 15, flexDirection: 'row', alignItems: 'center' },
  resultCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  resultTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  resultSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  resultButton: { minHeight: 43, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  resultButtonText: { fontSize: 9, fontWeight: '900' },
  resultArrow: { fontSize: 22, marginLeft: 9 },
  detailsPanel: { marginTop: 17, padding: 16 },
  detailsTitle: { color: '#fff', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  detailRow: { minHeight: 57, flexDirection: 'row', alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  detailIcon: { color: C.green, fontSize: 19, width: 31 },
  detailLabel: { color: '#fff', fontSize: 11, flex: 1 },
  detailValue: { maxWidth: '58%', fontSize: 9, lineHeight: 13, textAlign: 'right' },
  eventPanel: { minHeight: 83, marginTop: 17, padding: 13, flexDirection: 'row', alignItems: 'center' },
  eventCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  eventTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  eventDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  eventTime: { color: C.muted, fontSize: 7, marginTop: 4 },
  footerPanel: { minHeight: 88, marginTop: 17, padding: 14, flexDirection: 'row', alignItems: 'center' },
  footerCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  footerTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  footerText: { color: C.muted, fontSize: 8.5, lineHeight: 14, marginTop: 4 },
  learnButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', marginLeft: 9 },
  learnText: { color: C.green, fontSize: 9, fontWeight: '900' },
  chevron: { color: C.green, fontSize: 27, marginLeft: 8 },
});
