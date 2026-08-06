import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadClockAccess, useNomadRecovery } from '../nomad';
import type { NomadClockAccessEvent, NomadClockAccessStatus } from '../nomad';
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

function statusInfo(status: NomadClockAccessStatus) {
  switch (status) {
    case 'unlocked': return { color: C.green, title: 'WALLET UNLOCKED', mark: '✓', tone: 'green' as const };
    case 'window_open': return { color: C.green, title: 'ACCESS WINDOW OPEN', mark: '✓', tone: 'green' as const };
    case 'waiting': return { color: C.green, title: 'WALLET IS TIME LOCKED', mark: '◷', tone: 'green' as const };
    case 'not_configured': return { color: C.purple, title: 'TIME SET REQUIRED', mark: '+', tone: 'yellow' as const };
    case 'recovery_required': return { color: C.red, title: 'RECOVERY REQUIRED', mark: '!', tone: 'red' as const };
    case 'no_wallet': return { color: C.yellow, title: 'WALLET SETUP REQUIRED', mark: '!', tone: 'yellow' as const };
  }
}

function AccessMethod({
  icon,
  color,
  title,
  subtitle,
  route,
  last,
}: {
  icon: string;
  color: string;
  title: string;
  subtitle: string;
  route: string;
  last?: boolean;
}) {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      onPress={() => navigation.navigate(route)}
      style={({ pressed }) => [styles.methodRow, !last && styles.rowBorder, pressed && styles.pressed]}
    >
      <RoundIcon symbol={icon} color={color} size={44} filled />
      <View style={styles.methodCopy}>
        <Text style={styles.methodTitle}>{title}</Text>
        <Text style={styles.methodSub}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function EventRow({ item, last }: { item: NomadClockAccessEvent; last?: boolean }) {
  const color = item.severity === 'critical' ? C.red : item.severity === 'warning' ? C.yellow : C.green;
  return (
    <View style={[styles.eventRow, !last && styles.rowBorder]}>
      <View style={[styles.eventMark, { borderColor: color, backgroundColor: `${color}12` }]}>
        <Text style={[styles.eventMarkText, { color }]}>{item.type === 'unlock_success' ? '✓' : item.type === 'configured' ? '◷' : '!'}</Text>
      </View>
      <View style={styles.eventCopy}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDetail}>{item.detail}</Text>
        <Text style={styles.eventTime}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>
    </View>
  );
}

export default function TimeClockAccessScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { clock, loading, error, refresh } = useNomadClockAccess();
  const { requestOwnerAuthority } = useNomadRecovery();
  const [requesting, setRequesting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const status = statusInfo(clock.status);
  const milestones = useMemo(() => [
    { label: '6 Hours', done: clock.cycleElapsedHours >= 6 },
    { label: '12 Hours', done: clock.cycleElapsedHours >= 12 },
    { label: '18 Hours', done: clock.cycleElapsedHours >= 18 },
    { label: '24 Hours', done: clock.status === 'window_open' || clock.status === 'unlocked' },
  ], [clock.cycleElapsedHours, clock.status]);

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
    if (clock.status === 'no_wallet') {
      navigation.navigate('Lock');
      return;
    }
    if (clock.status === 'recovery_required') {
      navigation.navigate('RecoveryCenter');
      return;
    }
    if (clock.status === 'unlocked') {
      navigation.navigate('Portfolio');
      return;
    }
    if (clock.status === 'window_open') {
      navigation.navigate('ClockUnlock');
      return;
    }
    if (clock.status === 'not_configured') {
      navigation.navigate('RecoveryCenter');
      return;
    }
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
        help
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel tone={status.tone} style={styles.clockPanel}>
        <View style={styles.clockHeading}>
          <RoundIcon symbol="▣" color={status.color} size={53} filled />
          <Text style={[styles.clockTitle, { color: status.color }]}>{status.title}</Text>
          <Text style={styles.clockIntro}>
            {clock.status === 'waiting'
              ? 'The owner-configured daily access window has not opened yet.'
              : clock.status === 'window_open'
                ? `The ${clock.windowMinutes}-minute local access window is open. The configured time must still be verified.`
                : clock.status === 'unlocked'
                  ? 'The wallet service reports an active unlocked session.'
                  : clock.status === 'recovery_required'
                    ? 'The wallet lockout policy requires protected recovery before another access attempt.'
                    : 'Complete wallet and recovery setup before relying on Time Clock access.'}
          </Text>
        </View>

        <View
          style={[
            styles.timerRing,
            {
              width: compact ? 220 : 285,
              height: compact ? 220 : 285,
              borderRadius: compact ? 110 : 143,
              borderColor: status.color,
            },
          ]}
        >
          <Text style={[styles.timerLabel, { color: status.color }]}>
            {clock.status === 'waiting' ? 'UNTIL NEXT WINDOW' : clock.status === 'window_open' ? 'WINDOW STATUS' : 'ACCESS STATUS'}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.timerValue, { fontSize: compact ? 37 : 48 }]}
          >
            {clock.countdownLabel}
          </Text>
          <View style={styles.timerUnits}>
            <Text style={[styles.timerUnit, { color: status.color }]}>HOURS</Text>
            <Text style={[styles.timerUnit, { color: status.color }]}>MINUTES</Text>
            <Text style={[styles.timerUnit, { color: status.color }]}>SECONDS</Text>
          </View>
        </View>

        <View style={[styles.clockStats, compact && styles.clockStatsCompact]}>
          <View style={styles.clockStat}>
            <Text style={[styles.clockStatIcon, { color: status.color }]}>◷</Text>
            <View style={styles.clockStatCopy}>
              <Text style={styles.clockStatTitle}>Daily Time</Text>
              <Text style={styles.clockStatValue}>{clock.configuredTimeLabel}</Text>
            </View>
          </View>
          <View style={styles.clockStat}>
            <Text style={[styles.clockStatIcon, { color: status.color }]}>▦</Text>
            <View style={styles.clockStatCopy}>
              <Text style={styles.clockStatTitle}>Access Window</Text>
              <Text style={styles.clockStatValue}>{clock.accessWindowLabel}</Text>
            </View>
          </View>
          <View style={styles.clockStat}>
            <Text style={[styles.clockStatIcon, { color: status.color }]}>◎</Text>
            <View style={styles.clockStatCopy}>
              <Text style={styles.clockStatTitle}>Time Zone</Text>
              <Text style={styles.clockStatValue}>{clock.timeZoneLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeading}>
            <Text style={[styles.progressTitle, { color: status.color }]}>DAILY CYCLE PROGRESS</Text>
            <Text style={styles.progressValue}>{clock.cycleProgressPercent}%</Text>
          </View>
          <ProgressBar value={clock.cycleProgressPercent} color={status.color} height={8} />
          <View style={styles.progressSteps}>
            {milestones.map((milestone) => (
              <View key={milestone.label} style={styles.progressStep}>
                <Text style={[styles.progressMark, milestone.done && { color: status.color }]}>{milestone.done ? '✓' : '•'}</Text>
                <Text style={styles.progressStepLabel}>{milestone.label}</Text>
                <Text style={[styles.progressStepSub, milestone.done && { color: status.color }]}>{milestone.done ? 'Reached' : 'Pending'}</Text>
              </View>
            ))}
          </View>
        </View>

        <Panel style={[styles.earlyPanel, compact && styles.earlyPanelCompact]}>
          <View style={styles.earlyCopy}>
            <Text style={styles.earlyTitle}>{clock.status === 'waiting' ? 'Need Access Before the Window?' : status.title}</Text>
            <Text style={styles.earlySub}>
              {clock.status === 'waiting'
                ? 'Owner Authority can review an early-access request. Nomad does not grant or deliver approval by itself.'
                : clock.status === 'window_open'
                  ? 'Continue to enter the exact owner-configured daily time.'
                  : clock.status === 'unlocked'
                    ? 'The current wallet session is already open.'
                    : 'Use the protected setup or recovery route required by the current wallet state.'}
            </Text>
          </View>
          <Pressable
            disabled={requesting || loading}
            onPress={primaryAction}
            style={({ pressed }) => [styles.earlyButton, { borderColor: status.color }, pressed && styles.pressed]}
          >
            <Text style={[styles.earlyButtonText, { color: status.color }]}>{requesting ? 'Requesting…' : actionTitle}  ›</Text>
          </Pressable>
        </Panel>
        {feedback ? <Text style={[styles.feedback, /unable|not confirmed|requires/i.test(feedback) && { color: C.yellow }]}>{feedback}</Text> : null}
      </Panel>

      <Panel style={styles.evidencePanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>CLOCK ACCESS EVIDENCE</Text>
            <Text style={styles.sectionSub}>Local device time and wallet-service boundaries</Text>
          </View>
          <Text style={styles.currentClock}>{clock.currentTimeLabel}</Text>
        </View>
        <View style={styles.evidenceGrid}>
          <View style={styles.evidenceCard}>
            <Text style={styles.evidenceLabel}>CLOCK SOURCE</Text>
            <Text style={styles.evidenceValue}>Device Local Clock</Text>
            <Text style={styles.evidenceNote}>Not a trusted network time source</Text>
          </View>
          <View style={styles.evidenceCard}>
            <Text style={styles.evidenceLabel}>TRUSTED TIME PROVIDER</Text>
            <Text style={[styles.evidenceValue, { color: C.yellow }]}>NOT CONNECTED</Text>
            <Text style={styles.evidenceNote}>Secure server or hardware time remains required</Text>
          </View>
          <View style={styles.evidenceCard}>
            <Text style={styles.evidenceLabel}>STATE PERSISTENCE</Text>
            <Text style={[styles.evidenceValue, { color: C.yellow }]}>IN-MEMORY STUB</Text>
            <Text style={styles.evidenceNote}>Encrypted device persistence is not connected</Text>
          </View>
        </View>
      </Panel>

      <Panel style={styles.methodsPanel}>
        <Text style={styles.sectionTitle}>ALTERNATE ACCESS METHODS</Text>
        <AccessMethod
          icon="♙"
          color={C.green}
          title="Owner Authority Approval"
          subtitle="Review a protected access request; remote delivery is not yet connected"
          route="OwnerAuthorityApproval"
        />
        <AccessMethod
          icon="⌕"
          color={C.blue}
          title="Emergency Recovery"
          subtitle="Start the evidence-based lost-wallet verification flow"
          route="RecoverLostWallet"
        />
        <AccessMethod
          icon="◷"
          color={C.purple}
          title="Verify Recovery Sequence"
          subtitle="Verify enrolled Time Set digests in their required order"
          route="VerifyRecoverySequence"
          last
        />
      </Panel>

      <Panel style={styles.activityPanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>CLOCK ACCESS ACTIVITY</Text>
            <Text style={styles.sectionSub}>Local configuration and verification records</Text>
          </View>
          <Text style={styles.activityCount}>{clock.events.length} records</Text>
        </View>
        {clock.events.length ? clock.events.slice(0, 5).map((item, index, array) => (
          <EventRow key={item.id} item={item} last={index === array.length - 1} />
        )) : <Text style={styles.emptyText}>No Time Clock access activity has been recorded.</Text>}
      </Panel>

      <Panel tone="green" style={styles.whyPanel}>
        <RoundIcon symbol="♧" color={C.green} size={47} />
        <View style={styles.whyCopy}>
          <Text style={styles.whyTitle}>Why Time Sets?</Text>
          <Text style={styles.whyText}>Time Sets create a deliberate access window that can reduce impulsive or coerced actions. They do not replace encrypted storage, trusted time verification or Owner Authority.</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('RecoveryCenter')}><Text style={styles.chevron}>›</Text></Pressable>
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
  errorBanner: { minHeight: 52, marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 10, padding: 11, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, minWidth: 0, color: C.red, fontSize: 10 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  clockPanel: { padding: 19, alignItems: 'center' },
  clockHeading: { alignItems: 'center', maxWidth: 660 },
  clockTitle: { fontSize: 21, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  clockIntro: { color: C.muted, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  timerRing: { borderWidth: 13, backgroundColor: 'rgba(4,29,26,.86)', alignItems: 'center', justifyContent: 'center', marginTop: 24, shadowColor: C.green, shadowOpacity: .4, shadowRadius: 20 },
  timerLabel: { fontSize: 10, fontWeight: '900' },
  timerValue: { color: '#fff', fontWeight: '900', letterSpacing: -1, marginTop: 10, maxWidth: '82%' },
  timerUnits: { flexDirection: 'row', gap: 17, marginTop: 10 },
  timerUnit: { fontSize: 8 },
  clockStats: { width: '100%', flexDirection: 'row', marginTop: 22, borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 14 },
  clockStatsCompact: { flexWrap: 'wrap', gap: 13 },
  clockStat: { flex: 1, minWidth: 155, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  clockStatIcon: { fontSize: 22, marginRight: 10 },
  clockStatCopy: { flex: 1, minWidth: 0 },
  clockStatTitle: { color: '#fff', fontSize: 11, fontWeight: '800' },
  clockStatValue: { color: C.muted, fontSize: 9, lineHeight: 13, marginTop: 4 },
  progressSection: { width: '100%', marginTop: 20, borderTopWidth: 1, borderTopColor: C.borderSoft, paddingTop: 16 },
  progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  progressTitle: { fontSize: 12, fontWeight: '900' },
  progressValue: { color: '#fff', fontSize: 12, fontWeight: '900' },
  progressSteps: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  progressStep: { alignItems: 'center', flex: 1 },
  progressMark: { color: C.muted, fontSize: 18 },
  progressStepLabel: { color: '#fff', fontSize: 9, marginTop: 4 },
  progressStepSub: { color: C.muted, fontSize: 8, marginTop: 3 },
  earlyPanel: { width: '100%', minHeight: 88, marginTop: 18, padding: 14, flexDirection: 'row', alignItems: 'center' },
  earlyPanelCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  earlyCopy: { flex: 1, minWidth: 0 },
  earlyTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  earlySub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  earlyButton: { minHeight: 42, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  earlyButtonText: { fontSize: 9, fontWeight: '900' },
  feedback: { alignSelf: 'flex-start', color: C.green, fontSize: 9, lineHeight: 14, marginTop: 9 },
  evidencePanel: { marginTop: 17, padding: 16 },
  methodsPanel: { marginTop: 17, padding: 16 },
  activityPanel: { marginTop: 17, padding: 16 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  currentClock: { color: C.green, fontSize: 14, fontWeight: '900' },
  evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  evidenceCard: { flexGrow: 1, flexBasis: 190, minHeight: 105, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12 },
  evidenceLabel: { color: C.muted, fontSize: 8, fontWeight: '900' },
  evidenceValue: { color: '#fff', fontSize: 12, fontWeight: '900', marginTop: 10 },
  evidenceNote: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 6 },
  methodRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  methodCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  methodTitle: { color: '#fff', fontSize: 12, fontWeight: '800' },
  methodSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  chevron: { color: '#b8c5d7', fontSize: 27, marginLeft: 8 },
  activityCount: { color: C.muted, fontSize: 9 },
  eventRow: { minHeight: 84, flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  eventMark: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eventMarkText: { fontSize: 17, fontWeight: '900' },
  eventCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  eventTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  eventDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  eventTime: { color: '#718096', fontSize: 7, marginTop: 5 },
  emptyText: { color: C.muted, fontSize: 9, textAlign: 'center', paddingVertical: 22 },
  whyPanel: { minHeight: 88, marginTop: 17, padding: 14, flexDirection: 'row', alignItems: 'center' },
  whyCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  whyTitle: { color: C.green, fontSize: 13, fontWeight: '900' },
  whyText: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
});
