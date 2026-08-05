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
  PrimaryButton,
  RoundIcon,
} from '../ui/NomadShell';

function CompletionSteps() {
  const steps = ['Enter Time Sets', 'Verify Sequence', 'Recover Wallet', 'Complete'];
  return (
    <Panel style={styles.stepper}>
      {steps.map((step, index) => <React.Fragment key={step}><View style={styles.step}><View style={[styles.stepCircle, index === 3 && styles.stepCurrent]}><Text style={[styles.stepMark, index === 3 && styles.stepMarkCurrent]}>{index === 3 ? '4' : '✓'}</Text></View><Text style={[styles.stepText, index === 3 && { color: C.green }]}>{step}</Text></View>{index < steps.length - 1 ? <Text style={styles.stepArrow}>→</Text> : null}</React.Fragment>)}
    </Panel>
  );
}

function SummaryRow({ label, value, accent, last }: { label: string; value: string; accent?: boolean; last?: boolean }) {
  return <View style={[styles.summaryRow, !last && styles.rowBorder]}><Text style={styles.summaryLabel}>{label}</Text><Text style={[styles.summaryValue, accent && { color: C.green }]}>{value}</Text></View>;
}

export default function WalletRecoveredScreen() {
  const navigation = useNavigation<any>();
  const { sequence } = useNomadRecovery();
  const complete = sequence.status === 'complete';
  const recoveredAt = sequence.recoveredAt
    ? new Date(sequence.recoveredAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : complete ? 'Just now' : 'Recovery not complete';

  return (
    <NomadPage maxWidth={820}>
      <PageHeader title="Wallet Recovered" subtitle="Step 4 of 4" icon="◇" color={complete ? C.green : C.yellow} help />
      <CompletionSteps />

      <Panel tone={complete ? 'green' : 'yellow'} style={styles.successPanel}>
        <View style={[styles.successBadge, { borderColor: complete ? C.green : C.yellow }]}><Text style={[styles.successMark, { color: complete ? C.green : C.yellow }]}>{complete ? '✓' : '!'}</Text></View>
        <Text style={[styles.successTitle, { color: complete ? C.green : C.yellow }]}>{complete ? 'Recovery Successful' : 'Recovery Confirmation Required'}</Text>
        <Text style={styles.successText}>{complete ? 'The connected wallet recovery adapter reports that the owner-controlled sequence completed successfully.' : 'The recovery adapter has not reported completion. Return to sequence verification before opening the wallet.'}</Text>
      </Panel>

      <Panel style={styles.summaryPanel}>
        <Text style={styles.sectionTitle}>WALLET SUMMARY</Text>
        <SummaryRow label="Wallet" value="My Nomad Wallet" />
        <SummaryRow label="Recovery Date" value={recoveredAt} />
        <SummaryRow label="Recovery Method" value="24 Time Sets" />
        <SummaryRow label="Time Sets Verified" value={`${sequence.verifiedSets} of ${sequence.totalSets}`} />
        <SummaryRow label="Recovery Strength" value={`${sequence.strengthScore || '--'} / 100`} accent last />
      </Panel>

      <Panel tone="green" style={styles.protectionPanel}>
        <RoundIcon symbol="▣" color={C.green} size={54} filled />
        <View style={styles.protectionCopy}><Text style={styles.protectionTitle}>Local protections restored</Text><Text style={styles.protectionText}>Wallet settings, Time Sets and owner-authority controls remain subject to the connected wallet engine. Review Security Center after opening the wallet.</Text></View>
      </Panel>

      {complete ? (
        <PrimaryButton label="Open Wallet" subtitle="Return to the Nomad Portfolio" icon="▣" tone="green" onPress={() => navigation.navigate('Portfolio')} />
      ) : (
        <PrimaryButton label="Return to Verification" subtitle="Complete the protected recovery sequence" icon="◷" tone="green" onPress={() => navigation.navigate('VerifyRecoverySequence')} />
      )}
      <Pressable onPress={() => navigation.navigate('RecoveryCenter')} style={styles.secondaryAction}><Text style={styles.secondaryText}>Recovery Center</Text></Pressable>

      <BottomNav active="Recovery" items={[
        ['⌂', 'Home', 'Portfolio'], ['▣', 'Wallets', 'Wallets'], ['✈', 'Travel', 'TravelMode'], ['◇', 'Security', 'SecurityCenter'], ['↻', 'Recovery', 'RecoveryCenter'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  stepper: { minHeight: 90, padding: 12, flexDirection: 'row', alignItems: 'center' },
  step: { flex: 1, alignItems: 'center' },
  stepCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: C.green, backgroundColor: 'rgba(32,239,112,.08)', alignItems: 'center', justifyContent: 'center' },
  stepCurrent: { backgroundColor: C.green },
  stepMark: { color: C.green, fontWeight: '900' },
  stepMarkCurrent: { color: C.bg },
  stepText: { color: '#fff', fontSize: 8, textAlign: 'center', marginTop: 6 },
  stepArrow: { color: C.muted, fontSize: 17 },
  successPanel: { minHeight: 325, marginTop: 17, padding: 23, alignItems: 'center', justifyContent: 'center' },
  successBadge: { width: 128, height: 128, borderRadius: 64, borderWidth: 7, backgroundColor: 'rgba(2,18,12,.72)', alignItems: 'center', justifyContent: 'center' },
  successMark: { fontSize: 65, fontWeight: '900' },
  successTitle: { fontSize: 29, fontWeight: '900', textAlign: 'center', marginTop: 20 },
  successText: { color: '#f2f6fa', fontSize: 11, lineHeight: 18, textAlign: 'center', maxWidth: 520, marginTop: 10 },
  summaryPanel: { marginTop: 17, padding: 17 },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900', marginBottom: 5 },
  summaryRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 15 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  summaryLabel: { color: '#eef3f7', fontSize: 11 },
  summaryValue: { flex: 1, color: '#eef3f7', fontSize: 11, fontWeight: '700', textAlign: 'right' },
  protectionPanel: { minHeight: 91, marginTop: 17, padding: 15, flexDirection: 'row', alignItems: 'center' },
  protectionCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  protectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  protectionText: { color: C.muted, fontSize: 9, lineHeight: 15, marginTop: 4 },
  secondaryAction: { alignSelf: 'center', padding: 13 },
  secondaryText: { color: C.green, fontSize: 11, fontWeight: '800' },
});
