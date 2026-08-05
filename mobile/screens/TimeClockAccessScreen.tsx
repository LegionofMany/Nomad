import React, { useState } from 'react';
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

function AccessMethod({ icon, color, title, subtitle, route, last }: { icon: string; color: string; title: string; subtitle: string; route: string; last?: boolean }) {
  const navigation = useNavigation<any>();
  return (
    <Pressable onPress={() => navigation.navigate(route)} style={[styles.methodRow, !last && styles.rowBorder]}>
      <RoundIcon symbol={icon} color={color} size={44} filled />
      <View style={styles.methodCopy}><Text style={styles.methodTitle}>{title}</Text><Text style={styles.methodSub}>{subtitle}</Text></View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export default function TimeClockAccessScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { recovery, error, requestOwnerAuthority } = useNomadRecovery();
  const [requesting, setRequesting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const isUnlocked = recovery.walletStatus === 'unlocked';

  const handleEarlyAccess = async () => {
    try {
      setRequesting(true);
      setFeedback('');
      const request = await requestOwnerAuthority('Request early Time Clock access');
      setFeedback(`Owner Authority request ${request.status}.`);
      navigation.navigate('OwnerAuthorityApproval');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to request early access.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <NomadPage maxWidth={880}>
      <PageHeader title="Time Clock Access" subtitle="Your wallet. Your time. Your control." icon="◷" color={C.green} help />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Panel tone="green" style={styles.clockPanel}>
        <View style={styles.clockHeading}><RoundIcon symbol="▣" color={C.green} size={53} filled /><Text style={styles.clockTitle}>{isUnlocked ? 'Wallet Time Set Complete' : 'Wallet is Time Locked'}</Text><Text style={styles.clockIntro}>The owner-configured clock controls when the normal wallet access window opens.</Text></View>

        <View style={[styles.timerRing, { width: compact ? 220 : 285, height: compact ? 220 : 285, borderRadius: compact ? 110 : 143 }]}>
          <Text style={styles.timerLabel}>{isUnlocked ? 'READY' : 'TIME REMAINING'}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.timerValue, { fontSize: compact ? 38 : 48 }]}>{recovery.timeRemainingLabel}</Text>
          <View style={styles.timerUnits}><Text style={styles.timerUnit}>HOURS</Text><Text style={styles.timerUnit}>MINUTES</Text><Text style={styles.timerUnit}>SECONDS</Text></View>
        </View>

        <View style={[styles.clockStats, compact && styles.clockStatsCompact]}>
          {[
            ['◷', 'Time Set', recovery.cycleLabel],
            ['▦', 'Started', recovery.cycleStartedLabel],
            ['◇', 'Purpose', recovery.purpose],
          ].map(([icon, title, value]) => <View key={title} style={styles.clockStat}><Text style={styles.clockStatIcon}>{icon}</Text><View style={styles.clockStatCopy}><Text style={styles.clockStatTitle}>{title}</Text><Text style={styles.clockStatValue}>{value}</Text></View></View>)}
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>TIME SET PROGRESS</Text>
          <ProgressBar value={isUnlocked ? 100 : 75} color={C.green} height={8} />
          <View style={styles.progressSteps}>{[
            ['6 Hours', true], ['12 Hours', true], ['18 Hours', true], ['24 Hours', isUnlocked],
          ].map(([label, done]) => <View key={String(label)} style={styles.progressStep}><Text style={[styles.progressMark, done && { color: C.green }]}>{done ? '✓' : '•'}</Text><Text style={styles.progressStepLabel}>{label}</Text><Text style={[styles.progressStepSub, done && { color: C.green }]}>{done ? 'Completed' : 'Unlock'}</Text></View>)}</View>
        </View>

        <Panel style={styles.earlyPanel}>
          <View style={styles.earlyCopy}><Text style={styles.earlyTitle}>{isUnlocked ? 'Access Window Open' : 'Need Access Now?'}</Text><Text style={styles.earlySub}>{isUnlocked ? 'Continue to the wallet unlock confirmation.' : 'Request protected early access from your Owner Authority.'}</Text></View>
          <Pressable disabled={requesting} onPress={() => isUnlocked ? navigation.navigate('UnlockWallet') : void handleEarlyAccess()} style={styles.earlyButton}><Text style={styles.earlyButtonText}>{isUnlocked ? 'Continue  ›' : requesting ? 'Requesting…' : 'Request Early Access  ›'}</Text></Pressable>
        </Panel>
        {feedback ? <Text style={[styles.feedback, feedback.toLowerCase().includes('unable') && { color: C.red }]}>{feedback}</Text> : null}
      </Panel>

      <Panel style={styles.methodsPanel}>
        <Text style={styles.sectionTitle}>ALTERNATE ACCESS METHODS</Text>
        <AccessMethod icon="♙" color={C.green} title="Owner Authority Approval" subtitle="Request approval from the designated authority" route="OwnerAuthorityApproval" />
        <AccessMethod icon="⌕" color={C.blue} title="Emergency Recovery" subtitle="Start the protected lost-wallet flow" route="RecoverLostWallet" />
        <AccessMethod icon="◷" color={C.purple} title="Verify Recovery Sequence" subtitle="Use the time-set verification process" route="VerifyRecoverySequence" last />
      </Panel>

      <Panel tone="green" style={styles.whyPanel}>
        <RoundIcon symbol="♧" color={C.green} size={47} />
        <View style={styles.whyCopy}><Text style={styles.whyTitle}>Why Time Sets?</Text><Text style={styles.whyText}>Time Sets create a deliberate access window that can reduce impulsive or coerced wallet actions while preserving owner-controlled recovery.</Text></View>
        <Pressable onPress={() => navigation.navigate('RecoveryCenter')}><Text style={styles.chevron}>›</Text></Pressable>
      </Panel>

      <BottomNav
        active="Recovery"
        items={[
          ['⌂', 'Home', 'Portfolio'], ['▣', 'Wallets', 'Wallets'], ['✈', 'Travel', 'TravelMode'], ['◇', 'Security', 'SecurityCenter'], ['↻', 'Recovery', 'RecoveryCenter'],
        ]}
      />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  clockPanel: { padding: 19, alignItems: 'center' },
  clockHeading: { alignItems: 'center', maxWidth: 640 },
  clockTitle: { color: '#fff', fontSize: 21, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  clockIntro: { color: C.muted, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  timerRing: { borderWidth: 13, borderColor: C.green, backgroundColor: 'rgba(4,29,26,.86)', alignItems: 'center', justifyContent: 'center', marginTop: 24, shadowColor: C.green, shadowOpacity: .4, shadowRadius: 20 },
  timerLabel: { color: C.green, fontSize: 10, fontWeight: '900' },
  timerValue: { color: '#fff', fontWeight: '900', letterSpacing: -1, marginTop: 10, maxWidth: '82%' },
  timerUnits: { flexDirection: 'row', gap: 17, marginTop: 10 },
  timerUnit: { color: C.green, fontSize: 8 },
  clockStats: { width: '100%', flexDirection: 'row', marginTop: 22, borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 14 },
  clockStatsCompact: { flexWrap: 'wrap', gap: 13 },
  clockStat: { flex: 1, minWidth: 155, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  clockStatIcon: { color: C.green, fontSize: 22, marginRight: 10 },
  clockStatCopy: { flex: 1, minWidth: 0 },
  clockStatTitle: { color: '#fff', fontSize: 11, fontWeight: '800' },
  clockStatValue: { color: C.muted, fontSize: 9, lineHeight: 13, marginTop: 4 },
  progressSection: { width: '100%', marginTop: 20, borderTopWidth: 1, borderTopColor: C.borderSoft, paddingTop: 16 },
  progressTitle: { color: C.green, fontSize: 12, fontWeight: '900', marginBottom: 13 },
  progressSteps: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  progressStep: { alignItems: 'center', flex: 1 },
  progressMark: { color: C.muted, fontSize: 18 },
  progressStepLabel: { color: '#fff', fontSize: 9, marginTop: 4 },
  progressStepSub: { color: C.muted, fontSize: 8, marginTop: 3 },
  earlyPanel: { width: '100%', minHeight: 82, marginTop: 18, padding: 14, flexDirection: 'row', alignItems: 'center' },
  earlyCopy: { flex: 1, minWidth: 0 },
  earlyTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  earlySub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  earlyButton: { borderWidth: 1, borderColor: C.green, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, marginLeft: 10 },
  earlyButtonText: { color: C.green, fontSize: 9, fontWeight: '900' },
  feedback: { alignSelf: 'flex-start', color: C.green, fontSize: 9, marginTop: 9 },
  methodsPanel: { marginTop: 17, padding: 16 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900', marginBottom: 7 },
  methodRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  methodCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  methodTitle: { color: '#fff', fontSize: 12, fontWeight: '800' },
  methodSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  chevron: { color: '#b8c5d7', fontSize: 27, marginLeft: 8 },
  whyPanel: { minHeight: 88, marginTop: 17, padding: 14, flexDirection: 'row', alignItems: 'center' },
  whyCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  whyTitle: { color: C.green, fontSize: 13, fontWeight: '900' },
  whyText: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
});
