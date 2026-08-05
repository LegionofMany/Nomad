import React from 'react';
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

function DetailRow({ icon, label, value, color = C.muted, last }: { icon: string; label: string; value: string; color?: string; last?: boolean }) {
  return <View style={[styles.detailRow, !last && styles.rowBorder]}><Text style={styles.detailIcon}>{icon}</Text><Text style={styles.detailLabel}>{label}</Text><Text style={[styles.detailValue, { color }]}>{value}</Text></View>;
}

export default function UnlockWalletScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { recovery, error } = useNomadRecovery();
  const isUnlocked = recovery.walletStatus === 'unlocked';
  const unlockLabel = isUnlocked ? 'Wallet Unlocked' : 'Time Set Verification';
  const unlockSubtitle = isUnlocked ? 'Access granted. Welcome back.' : 'The wallet remains protected until the owner access window completes.';

  return (
    <NomadPage maxWidth={860}>
      <PageHeader
        title="Unlock Wallet"
        subtitle={isUnlocked ? 'Time Set complete' : 'Time Set in progress'}
        icon="▣"
        color={C.green}
        status={false}
        right={<Pressable onPress={() => navigation.navigate('RecoveryCenter')}><Text style={styles.cancel}>Cancel</Text></Pressable>}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Panel style={styles.topStats}>
        <View style={styles.topStat}><Text style={styles.topIcon}>◷</Text><View><Text style={styles.topTitle}>Time Set</Text><Text style={styles.topValue}>{recovery.cycleLabel}</Text></View></View>
        <View style={styles.topDivider} />
        <View style={styles.topStat}><Text style={styles.topIcon}>▦</Text><View><Text style={styles.topTitle}>Started</Text><Text style={styles.topValue}>{recovery.cycleStartedLabel}</Text></View></View>
        <Text style={styles.topShield}>◇</Text>
      </Panel>

      <View style={styles.timerSection}>
        <View style={[styles.timer, { width: compact ? 225 : 300, height: compact ? 225 : 300, borderRadius: compact ? 113 : 150 }]}>
          <Text style={styles.timerLabel}>{isUnlocked ? 'UNLOCKED' : 'TIME REMAINING'}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.timerValue, { fontSize: compact ? 38 : 52 }]}>{recovery.timeRemainingLabel}</Text>
          <View style={styles.timerUnits}><Text style={styles.timerUnit}>HOURS</Text><Text style={styles.timerUnit}>MINUTES</Text><Text style={styles.timerUnit}>SECONDS</Text></View>
        </View>
        <Text style={styles.unlockTitle}>{unlockLabel}</Text>
        <Text style={styles.unlockSub}>{unlockSubtitle}</Text>
      </View>

      <Panel style={styles.progressPanel}>
        <ProgressBar value={isUnlocked ? 100 : 75} color={C.green} height={8} />
        <View style={styles.steps}>{[
          ['Time Set Verified', true], ['Cycle Complete', true], ['Security Check', true], ['Wallet Access', isUnlocked],
        ].map(([label, done]) => <View key={String(label)} style={styles.step}><View style={[styles.stepCircle, done && styles.stepDone]}><Text style={[styles.stepMark, done && styles.stepMarkDone]}>{done ? '✓' : '•'}</Text></View><Text style={[styles.stepText, done && { color: C.green }]}>{label}</Text></View>)}</View>
      </Panel>

      <Panel tone={isUnlocked ? 'green' : 'blue'} style={styles.resultPanel}>
        <RoundIcon symbol={isUnlocked ? '✓' : '◷'} color={isUnlocked ? C.green : C.blue} size={62} filled />
        <View style={styles.resultCopy}><Text style={styles.resultTitle}>{unlockLabel}</Text><Text style={styles.resultSub}>{unlockSubtitle}</Text></View>
        <Pressable onPress={() => navigation.navigate(isUnlocked ? 'Portfolio' : 'TimeClockAccess')} style={styles.resultButton}><Text style={styles.resultButtonText}>{isUnlocked ? 'View Wallet' : 'View Clock'}  ›</Text></Pressable>
      </Panel>

      <Panel style={styles.detailsPanel}>
        <Text style={styles.detailsTitle}>DETAILS</Text>
        <DetailRow icon="◷" label="Time Set" value={recovery.cycleLabel} />
        <DetailRow icon="▦" label="Started" value={recovery.cycleStartedLabel} />
        <DetailRow icon="▣" label="Access" value={isUnlocked ? 'Open now' : 'Pending Time Set'} />
        <DetailRow icon="◇" label="Security Status" value={isUnlocked ? 'All Clear' : 'Protected'} color={C.green} last />
      </Panel>

      <Panel tone="green" style={styles.footerPanel}><RoundIcon symbol="◇" color={C.green} size={45} /><View style={styles.footerCopy}><Text style={styles.footerTitle}>Protected by owner-controlled Time Sets</Text><Text style={styles.footerText}>Nomad does not bypass the configured recovery clock or grant access independently.</Text></View><Pressable onPress={() => navigation.navigate('RecoveryCenter')}><Text style={styles.chevron}>›</Text></Pressable></Panel>

      <BottomNav active="Recovery" items={[
        ['⌂', 'Home', 'Portfolio'], ['▣', 'Wallets', 'Wallets'], ['✈', 'Travel', 'TravelMode'], ['◇', 'Security', 'SecurityCenter'], ['↻', 'Recovery', 'RecoveryCenter'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  cancel: { color: C.green, fontSize: 12, fontWeight: '800' },
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  topStats: { minHeight: 84, padding: 13, flexDirection: 'row', alignItems: 'center' },
  topStat: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  topIcon: { color: C.green, fontSize: 25, marginRight: 11 },
  topTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  topValue: { color: C.muted, fontSize: 9, marginTop: 4 },
  topDivider: { width: 1, height: 55, backgroundColor: C.borderSoft, marginHorizontal: 12 },
  topShield: { color: C.green, fontSize: 33, marginLeft: 10 },
  timerSection: { alignItems: 'center', marginTop: 24 },
  timer: { borderWidth: 13, borderColor: C.green, backgroundColor: 'rgba(4,29,26,.86)', alignItems: 'center', justifyContent: 'center', shadowColor: C.green, shadowOpacity: .45, shadowRadius: 25 },
  timerLabel: { color: C.green, fontSize: 10, fontWeight: '900' },
  timerValue: { color: '#fff', fontWeight: '900', letterSpacing: -1, marginTop: 11, maxWidth: '82%' },
  timerUnits: { flexDirection: 'row', gap: 18, marginTop: 11 },
  timerUnit: { color: C.green, fontSize: 8 },
  unlockTitle: { color: '#fff', fontSize: 23, fontWeight: '900', textAlign: 'center', marginTop: 20 },
  unlockSub: { color: C.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 7, maxWidth: 520 },
  progressPanel: { marginTop: 21, padding: 17 },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  step: { flex: 1, alignItems: 'center' },
  stepCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: C.green },
  stepMark: { color: C.green, fontWeight: '900' },
  stepMarkDone: { color: C.bg },
  stepText: { color: C.muted, fontSize: 8, textAlign: 'center', marginTop: 6 },
  resultPanel: { minHeight: 91, marginTop: 17, padding: 15, flexDirection: 'row', alignItems: 'center' },
  resultCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  resultTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  resultSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  resultButton: { borderWidth: 1, borderColor: C.green, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, marginLeft: 8 },
  resultButtonText: { color: C.green, fontSize: 9, fontWeight: '900' },
  detailsPanel: { marginTop: 17, padding: 16 },
  detailsTitle: { color: '#fff', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  detailRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  detailIcon: { color: C.green, fontSize: 18, width: 30 },
  detailLabel: { color: '#fff', fontSize: 11, flex: 1 },
  detailValue: { fontSize: 10, textAlign: 'right' },
  footerPanel: { minHeight: 82, marginTop: 17, padding: 14, flexDirection: 'row', alignItems: 'center' },
  footerCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  footerTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  footerText: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  chevron: { color: C.green, fontSize: 27, marginLeft: 8 },
});
