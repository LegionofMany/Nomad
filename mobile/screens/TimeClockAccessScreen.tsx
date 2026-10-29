import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, Line, LinearGradient, Stop } from 'react-native-svg';

import { useNomadClockAccess, useNomadRecovery } from '../nomad';
import type { NomadClockAccessStatus } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

const COUNTDOWN_PATTERN = /^\d{2}:\d{2}:\d{2}$/;
const CLOCK_CENTER = 180;
const CLOCK_RADIUS = 154;
const CLOCK_CIRCUMFERENCE = 2 * Math.PI * CLOCK_RADIUS;
const CLOCK_TICKS = Array.from({ length: 60 }, (_, index) => {
  const angle = ((index * 6) - 90) * (Math.PI / 180);
  const major = index % 5 === 0;
  const inner = major ? 128 : 137;
  const outer = 145;
  return {
    id: `tick-${index}`,
    major,
    x1: CLOCK_CENTER + Math.cos(angle) * inner,
    y1: CLOCK_CENTER + Math.sin(angle) * inner,
    x2: CLOCK_CENTER + Math.cos(angle) * outer,
    y2: CLOCK_CENTER + Math.sin(angle) * outer,
  };
});

function statusInfo(status: NomadClockAccessStatus) {
  switch (status) {
    case 'unlocked': return { color: C.green, title: 'Wallet is Unlocked', tone: 'green' as const };
    case 'window_open': return { color: C.green, title: 'Access Window is Open', tone: 'green' as const };
    case 'waiting': return { color: C.green, title: 'Wallet is Time Locked', tone: 'green' as const };
    case 'not_configured': return { color: C.purple, title: 'Time Set Required', tone: 'yellow' as const };
    case 'password_setup_required': return { color: C.yellow, title: 'Password Setup Required', tone: 'yellow' as const };
    case 'recovery_required': return { color: C.red, title: 'Recovery is Required', tone: 'red' as const };
    case 'no_wallet': return { color: C.yellow, title: 'Wallet Setup Required', tone: 'yellow' as const };
  }
}

function ClockDial({
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
  const markerX = CLOCK_CENTER + Math.cos(markerAngle) * CLOCK_RADIUS;
  const markerY = CLOCK_CENTER + Math.sin(markerAngle) * CLOCK_RADIUS;
  const showUnits = COUNTDOWN_PATTERN.test(value);

  return (
    <View accessibilityLabel={`${label}: ${value}`} style={[styles.clockDial, { width: size, height: size, shadowColor: color }]}>
      <Svg width={size} height={size} viewBox="0 0 360 360" fill="none">
        <Defs>
          <LinearGradient id="clockArc" x1="32" y1="40" x2="324" y2="318">
            <Stop stopColor="#20f06f" />
            <Stop offset="0.5" stopColor={color} />
            <Stop offset="1" stopColor="#087542" />
          </LinearGradient>
        </Defs>
        <Circle cx={CLOCK_CENTER} cy={CLOCK_CENTER} r="166" fill="#031712" fillOpacity=".92" stroke="#063d31" strokeWidth="2" />
        <Circle cx={CLOCK_CENTER} cy={CLOCK_CENTER} r={CLOCK_RADIUS} stroke="#0a543d" strokeWidth="13" opacity=".55" />
        <Circle
          cx={CLOCK_CENTER}
          cy={CLOCK_CENTER}
          r={CLOCK_RADIUS}
          stroke="url(#clockArc)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${CLOCK_CIRCUMFERENCE} ${CLOCK_CIRCUMFERENCE}`}
          strokeDashoffset={CLOCK_CIRCUMFERENCE * (1 - safeProgress / 100)}
          rotation="-90"
          origin={`${CLOCK_CENTER}, ${CLOCK_CENTER}`}
        />
        {CLOCK_TICKS.map((tick) => (
          <Line
            key={tick.id}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.major ? color : '#0a6b4b'}
            strokeWidth={tick.major ? 3 : 1.5}
            strokeLinecap="round"
            opacity={tick.major ? 0.75 : 0.45}
          />
        ))}
        <Circle cx={markerX} cy={markerY} r="8" fill={color} />
        <Circle cx={markerX} cy={markerY} r="14" fill={color} opacity=".16" />
      </Svg>
      <View style={styles.clockDialContent}>
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

function AccessMethod({
  icon,
  color,
  title,
  subtitle,
  route,
  testID,
  last,
}: {
  icon: string;
  color: string;
  title: string;
  subtitle: string;
  route: string;
  testID: string;
  last?: boolean;
}) {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => navigation.navigate(route)}
      style={({ pressed }) => [styles.methodRow, !last && styles.rowBorder, pressed && styles.pressed]}
    >
      <RoundIcon symbol={icon} color={color} size={46} filled />
      <View style={styles.methodCopy}>
        <Text style={styles.methodTitle}>{title}</Text>
        <Text style={styles.methodSub}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export default function TimeClockAccessScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { clock, loading, error, refresh } = useNomadClockAccess();
  const { recovery, requestOwnerAuthority } = useNomadRecovery();
  const [requesting, setRequesting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const status = statusInfo(clock.status);
  const milestones = useMemo(() => [
    { label: '6 Hours', done: clock.cycleElapsedHours >= 6, note: 'Completed' },
    { label: '12 Hours', done: clock.cycleElapsedHours >= 12, note: 'Completed' },
    { label: '18 Hours', done: clock.cycleElapsedHours >= 18, note: 'Completed' },
    { label: '24 Hours', done: clock.status === 'window_open' || clock.status === 'unlocked', note: clock.status === 'unlocked' ? 'Unlocked' : 'Unlock' },
  ], [clock.cycleElapsedHours, clock.status]);

  const clockLabel = clock.status === 'waiting'
    ? 'TIME REMAINING'
    : clock.status === 'window_open'
      ? 'ACCESS WINDOW'
      : clock.status === 'unlocked'
        ? 'WALLET STATUS'
        : 'TIME CLOCK STATUS';

  const clockIntro = clock.status === 'waiting'
    ? 'Your wallet is protected by its password and owner-configured Nomad Time Key. Both must be verified when the daily access window opens.'
    : clock.status === 'window_open'
      ? `The ${clock.windowMinutes}-minute local access window is open. Verify the password and full HH:MM:SS Time Key to unlock the wallet.`
      : clock.status === 'unlocked'
        ? 'The wallet service reports an active unlocked session on this device.'
        : clock.status === 'recovery_required'
          ? 'The wallet lockout policy requires protected recovery before another access attempt.'
          : 'Complete wallet and recovery setup before relying on Time Clock access.';

  const handleEarlyAccess = async () => {
    try {
      setRequesting(true);
      setFeedback('Creating a protected Owner Authority request…');
      const request = await requestOwnerAuthority('Request early Time Clock access outside the configured daily window.');
      setFeedback(`Owner Authority request recorded as ${request.status}. Remote delivery is not confirmed until an authority provider is connected.`);
      navigation.navigate('OwnerAuthorityApproval');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to request early access.');
    } finally {
      setRequesting(false);
    }
  };

  const primaryAction = () => {
    if (clock.status === 'no_wallet') return navigation.navigate('Lock');
    if (clock.status === 'recovery_required') return navigation.navigate('RecoveryCenter');
    if (clock.status === 'unlocked') return navigation.navigate('Portfolio');
    if (clock.status === 'window_open') return navigation.navigate('ClockUnlock');
    if (clock.status === 'not_configured') return navigation.navigate('RecoveryCenter');
    if (clock.status === 'password_setup_required') return navigation.navigate('ClockUnlock');
    void handleEarlyAccess();
  };

  const actionTitle = clock.status === 'unlocked'
    ? 'Continue to Wallet'
    : clock.status === 'window_open'
      ? 'Verify Clock Access'
      : clock.status === 'waiting'
        ? 'Request Early Access'
        : clock.status === 'recovery_required'
          ? 'Open Recovery Center'
          : clock.status === 'password_setup_required'
            ? 'Review Password Setup'
          : clock.status === 'no_wallet'
            ? 'Create or Recover Wallet'
            : 'Review Recovery Setup';

  return (
    <NomadPage maxWidth={900}>
      <PageHeader
        title="Time Clock Access"
        subtitle="Your wallet. Your time. Your control."
        icon="◷"
        color={status.color}
        status={false}
        help
        helpRoute="RecoveryCenter"
        right={<Text style={[styles.helpLabel, { color: status.color }]}>Help</Text>}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel tone={status.tone} style={[styles.clockPanel, { borderColor: `${status.color}80` }]}>
        <View style={styles.clockHeading}>
          <RoundIcon symbol="▣" color={status.color} size={52} filled />
          <Text style={styles.clockTitle}>{status.title}</Text>
          <Text style={styles.clockIntro}>{clockIntro}</Text>
        </View>

        <ClockDial
          color={status.color}
          label={clockLabel}
          progress={clock.cycleProgressPercent}
          size={compact ? 278 : 368}
          value={clock.countdownLabel}
        />

        <View style={[styles.clockStats, compact && styles.clockStatsCompact]}>
          <View style={styles.clockStat}>
            <Text style={[styles.clockStatIcon, { color: status.color }]}>◷</Text>
            <View style={styles.clockStatCopy}><Text style={styles.clockStatTitle}>Time Set</Text><Text style={styles.clockStatValue}>{clock.configuredTime ? '24 Hour Cycle' : 'Not Configured'}</Text></View>
          </View>
          <View style={styles.clockStatDivider} />
          <View style={styles.clockStat}>
            <Text style={[styles.clockStatIcon, { color: status.color }]}>▦</Text>
            <View style={styles.clockStatCopy}><Text style={styles.clockStatTitle}>Started</Text><Text style={styles.clockStatValue}>{recovery.cycleStartedLabel}</Text></View>
          </View>
          <View style={styles.clockStatDivider} />
          <View style={styles.clockStat}>
            <Text style={[styles.clockStatIcon, { color: status.color }]}>◇</Text>
            <View style={styles.clockStatCopy}><Text style={styles.clockStatTitle}>Purpose</Text><Text style={styles.clockStatValue}>{recovery.purpose}</Text></View>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeading}>
            <Text style={[styles.progressTitle, { color: status.color }]}>TIME SET PROGRESS</Text>
            <Text style={styles.progressValue}>{clock.cycleProgressPercent}%</Text>
          </View>
          <View style={styles.progressRail} />
          <View style={styles.progressSteps}>
            {milestones.map((milestone, index) => (
              <View key={milestone.label} style={styles.progressStep}>
                <View style={[styles.progressMark, milestone.done && { backgroundColor: status.color, borderColor: status.color }]}>
                  <Text style={[styles.progressMarkText, milestone.done && styles.progressMarkTextDone]}>{milestone.done ? '✓' : index === 3 ? '●' : '·'}</Text>
                </View>
                <Text style={styles.progressStepLabel}>{milestone.label}</Text>
                <Text style={[styles.progressStepSub, milestone.done && { color: status.color }]}>{milestone.done ? 'Completed' : milestone.note}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.earlyPanel, compact && styles.earlyPanelCompact]}>
          <View style={styles.earlyCopy}>
            <Text style={styles.earlyTitle}>{clock.status === 'waiting' ? 'Need Access Now?' : status.title}</Text>
            <Text style={styles.earlySub}>
              {clock.status === 'waiting'
                ? 'Request early access through your Owner Authority. Nomad records the request locally; remote delivery is not yet connected.'
                : clock.status === 'window_open'
                  ? 'Continue to verify the wallet password and exact owner-configured HH:MM:SS Time Key.'
                  : clock.status === 'unlocked'
                    ? 'The current wallet session is already open.'
                    : 'Use the protected setup or recovery route required by the current wallet state.'}
            </Text>
          </View>
          <Pressable
            testID="time-clock-primary-action"
            accessibilityRole="button"
            accessibilityLabel={actionTitle}
            disabled={requesting || loading}
            onPress={primaryAction}
            style={({ pressed }) => [styles.earlyButton, { borderColor: status.color }, pressed && styles.pressed]}
          >
            <Text style={[styles.earlyButtonText, { color: status.color }]}>{requesting ? 'Requesting…' : actionTitle}</Text><Text style={[styles.earlyArrow, { color: status.color }]}>›</Text>
          </Pressable>
        </View>
        {feedback ? <Text style={[styles.feedback, /unable|not confirmed|requires/i.test(feedback) && { color: C.yellow }]}>{feedback}</Text> : null}
      </Panel>

      <Panel style={styles.methodsPanel}>
        <Text style={styles.sectionTitle}>ALTERNATE ACCESS METHODS</Text>
        <View style={styles.methodList}>
          <AccessMethod
            testID="time-clock-owner-authority"
            icon="♙"
            color={C.green}
            title="Owner Authority Approval"
            subtitle="Review a protected request; remote delivery remains unverified"
            route="OwnerAuthorityApproval"
          />
          <AccessMethod
            testID="time-clock-emergency-access"
            icon="⌕"
            color={C.blue}
            title="Emergency Access"
            subtitle="Start the protected lost-wallet verification flow"
            route="RecoverLostWallet"
          />
          <AccessMethod
            testID="time-clock-restore-backup"
            icon="◷"
            color={C.purple}
            title="Restore from Backup"
            subtitle="Review recovery backup status; restoration provider not connected"
            route="RecoveryCenter"
            last
          />
        </View>
      </Panel>

      <Panel tone="green" style={styles.whyPanel}>
        <RoundIcon symbol="♧" color={C.green} size={48} />
        <View style={styles.whyCopy}>
          <Text style={styles.whyTitle}>Why Time Sets?</Text>
          <Text style={styles.whyText}>Time Sets create a deliberate access window that can reduce impulsive or coerced actions. They do not replace encrypted storage, trusted time verification, or Owner Authority.</Text>
        </View>
        <Pressable testID="time-clock-learn-more" accessibilityRole="button" accessibilityLabel="Learn more about Time Sets" onPress={() => navigation.navigate('RecoveryCenter')} style={({ pressed }) => [styles.learnButton, pressed && styles.pressed]}>
          <Text style={styles.learnText}>Learn More</Text><Text style={[styles.chevron, { color: C.green }]}>›</Text>
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
  pressed: { opacity: 0.72 },
  helpLabel: { fontSize: 12, fontWeight: '800' },
  errorBanner: { minHeight: 52, marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 10, padding: 11, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, minWidth: 0, color: C.red, fontSize: 10 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  clockPanel: { padding: 0, alignItems: 'center', overflow: 'hidden', borderWidth: 1 },
  clockHeading: { width: '100%', alignItems: 'center', paddingHorizontal: 20, paddingTop: 23 },
  clockTitle: { color: '#fff', fontSize: 25, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  clockIntro: { maxWidth: 650, color: '#d5deea', fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  clockDial: { alignItems: 'center', justifyContent: 'center', marginTop: 20, shadowOpacity: 0.42, shadowRadius: 25 },
  clockDialContent: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: '15%' },
  timerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  timerValue: { width: '100%', color: '#fff', fontSize: 48, lineHeight: 60, fontWeight: '900', letterSpacing: -1.2, textAlign: 'center', marginTop: 8 },
  timerUnits: { flexDirection: 'row', gap: 20, marginTop: 5 },
  timerUnit: { fontSize: 8 },
  timerState: { fontSize: 8, fontWeight: '800', marginTop: 5 },
  clockStats: { alignSelf: 'stretch', flexDirection: 'row', marginHorizontal: 24, marginTop: 16, marginBottom: 18, borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: 'rgba(1,8,15,.74)', paddingVertical: 13 },
  clockStatsCompact: { marginHorizontal: 12, flexWrap: 'wrap', paddingHorizontal: 3 },
  clockStat: { flex: 1, minWidth: 105, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  clockStatDivider: { width: 1, minHeight: 48, backgroundColor: C.borderSoft },
  clockStatIcon: { fontSize: 23, marginRight: 10 },
  clockStatCopy: { flex: 1, minWidth: 0 },
  clockStatTitle: { color: '#fff', fontSize: 10, fontWeight: '800' },
  clockStatValue: { color: '#c6d0de', fontSize: 8, lineHeight: 13, marginTop: 4 },
  progressSection: { width: '100%', borderTopWidth: 1, borderTopColor: C.borderSoft, backgroundColor: 'rgba(1,12,19,.62)', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 18 },
  progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  progressTitle: { fontSize: 11, fontWeight: '900' },
  progressValue: { color: '#fff', fontSize: 10, fontWeight: '900' },
  progressRail: { position: 'absolute', left: '12%', right: '12%', top: 57, height: 2, backgroundColor: C.green },
  progressSteps: { flexDirection: 'row', justifyContent: 'space-between' },
  progressStep: { flex: 1, alignItems: 'center' },
  progressMark: { width: 31, height: 31, borderRadius: 16, borderWidth: 2, borderColor: C.green, backgroundColor: C.panel2, alignItems: 'center', justifyContent: 'center' },
  progressMarkText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  progressMarkTextDone: { color: '#02120a' },
  progressStepLabel: { color: '#fff', fontSize: 9, marginTop: 7 },
  progressStepSub: { color: C.muted, fontSize: 8, marginTop: 3 },
  earlyPanel: { alignSelf: 'stretch', minHeight: 91, marginHorizontal: 16, marginTop: 0, marginBottom: 16, paddingHorizontal: 15, paddingVertical: 13, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 10, backgroundColor: 'rgba(1,8,15,.72)', flexDirection: 'row', alignItems: 'center' },
  earlyPanelCompact: { marginHorizontal: 12, flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  earlyCopy: { flex: 1, minWidth: 0 },
  earlyTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  earlySub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  earlyButton: { minHeight: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  earlyButtonText: { fontSize: 9, fontWeight: '900' },
  earlyArrow: { fontSize: 22, marginLeft: 10 },
  feedback: { width: '100%', color: C.green, fontSize: 9, lineHeight: 14, paddingHorizontal: 18, paddingBottom: 15 },
  methodsPanel: { marginTop: 17, padding: 16 },
  sectionTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  methodList: { marginTop: 11, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 10, overflow: 'hidden' },
  methodRow: { minHeight: 75, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  methodCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  methodTitle: { color: '#fff', fontSize: 11, fontWeight: '800' },
  methodSub: { color: C.muted, fontSize: 8.5, lineHeight: 13, marginTop: 4 },
  chevron: { color: '#b8c5d7', fontSize: 27, marginLeft: 8 },
  whyPanel: { minHeight: 93, marginTop: 17, padding: 15, flexDirection: 'row', alignItems: 'center' },
  whyCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  whyTitle: { color: C.green, fontSize: 13, fontWeight: '900' },
  whyText: { color: C.muted, fontSize: 8.5, lineHeight: 14, marginTop: 4 },
  learnButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, marginLeft: 10 },
  learnText: { color: C.green, fontSize: 9, fontWeight: '900' },
});
