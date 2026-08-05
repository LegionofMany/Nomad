import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadRecovery } from '../nomad';
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

function StepTracker({ verifiedSets, totalSets }: { verifiedSets: number; totalSets: number }) {
  const complete = verifiedSets >= totalSets;
  const steps = [
    { number: '✓', label: 'Enter Time Sets', done: true },
    { number: complete ? '✓' : '2', label: 'Verify Sequence', active: !complete, done: complete },
    { number: complete ? '3' : '3', label: 'Recover Wallet', active: complete },
    { number: '4', label: 'Complete' },
  ];
  return (
    <Panel style={styles.stepper}>
      {steps.map((step, index) => <React.Fragment key={`${step.number}-${step.label}`}><View style={styles.step}><View style={[styles.stepCircle, (step.active || step.done) && styles.stepActive]}><Text style={[styles.stepNumber, (step.active || step.done) && styles.stepNumberActive]}>{step.number}</Text></View><Text style={[(styles.stepLabel), (step.active || step.done) && { color: C.green }]}>{step.label}</Text></View>{index < steps.length - 1 ? <Text style={styles.stepArrow}>→</Text> : null}</React.Fragment>)}
    </Panel>
  );
}

function TimeField({ label, value, max, onChange }: { label: string; value: string; max: number; onChange: (value: string) => void }) {
  const handle = (next: string) => {
    const digits = next.replace(/[^0-9]/g, '').slice(0, 2);
    if (!digits) { onChange(''); return; }
    const number = Math.min(max, Number(digits));
    onChange(String(number).padStart(digits.length > 1 ? 2 : 1, '0'));
  };
  return (
    <View style={styles.timeField}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TextInput value={value} onChangeText={handle} keyboardType="number-pad" maxLength={2} placeholder="00" placeholderTextColor="#65778e" style={styles.timeInput} />
    </View>
  );
}

export default function VerifyRecoverySequenceScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { sequence, verifySet, completeSequence, error } = useNomadRecovery();
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [second, setSecond] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setHour('');
    setMinute('');
    setSecond('');
  }, [sequence.currentSet]);

  const totalSets = Math.max(1, sequence.totalSets);
  const verifiedSets = Math.min(sequence.verifiedSets, totalSets);
  const allVerified = verifiedSets >= totalSets || sequence.status === 'ready_to_recover' || sequence.status === 'complete';
  const progress = Math.round((verifiedSets / totalSets) * 100);
  const validTime = hour !== '' && minute !== '' && second !== '' && Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59;

  const verifyCurrent = async () => {
    if (!validTime) {
      setFeedback('Enter a valid hour, minute and second for the current Time Set.');
      return;
    }
    try {
      setBusy(true);
      setFeedback('Verifying this set locally…');
      const next = await verifySet(sequence.currentSet, { hour: Number(hour), minute: Number(minute), second: Number(second) });
      if (next.verifiedSets >= next.totalSets || next.status === 'ready_to_recover') {
        setFeedback('All Time Sets verified. The wallet is ready for final recovery.');
      } else {
        setFeedback(`Set ${sequence.currentSet} verified. Continue with set ${next.currentSet}.`);
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'The Time Set did not verify. Check the exact sequence and try again.');
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    try {
      setBusy(true);
      setFeedback('Completing owner-controlled recovery…');
      await completeSequence();
      navigation.navigate('WalletRecovered');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to complete wallet recovery.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <NomadPage maxWidth={880}>
      <PageHeader title="Verify Recovery Sequence" subtitle="Step 2 of 4" icon="◷" color={C.green} help />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <StepTracker verifiedSets={verifiedSets} totalSets={totalSets} />

      <Panel tone="green" style={[styles.hero, compact && styles.heroCompact]}>
        <RoundIcon symbol="♙" color={C.green} size={compact ? 83 : 112} filled />
        <View style={styles.heroCopy}><Text style={styles.heroTitle}>Verify Your Sequence</Text><Text style={styles.heroText}>Re-enter each Time Set in the original order. Values are sent only to the connected recovery adapter for owner-controlled verification.</Text></View>
      </Panel>

      <Panel style={styles.verificationPanel}>
        <View style={styles.sectionHeading}>
          <View><Text style={styles.sectionTitle}>{allVerified ? 'SEQUENCE VERIFIED' : 'CURRENT TIME SET'}</Text><Text style={styles.sectionSub}>{allVerified ? 'Ready for final recovery' : `Set ${sequence.currentSet} of ${totalSets}`}</Text></View>
          <View style={styles.currentSetBadge}><Text style={styles.currentSetText}>{allVerified ? '✓' : sequence.currentSet}</Text></View>
        </View>

        {!allVerified ? (
          <>
            <Text style={styles.enterLabel}>Enter the exact time, including seconds</Text>
            <View style={styles.timeRow}>
              <TimeField label="HH" value={hour} max={23} onChange={setHour} />
              <Text style={styles.colon}>:</Text>
              <TimeField label="MM" value={minute} max={59} onChange={setMinute} />
              <Text style={styles.colon}>:</Text>
              <TimeField label="SS" value={second} max={59} onChange={setSecond} />
            </View>
            <PrimaryButton label={busy ? 'Verifying Set…' : `Verify Set ${sequence.currentSet}`} subtitle="Compare this entry with the protected recovery sequence" icon="◇" tone="green" disabled={busy || !validTime} onPress={() => void verifyCurrent()} />
          </>
        ) : (
          <View style={styles.readyBox}><RoundIcon symbol="✓" color={C.green} size={58} filled /><View style={styles.readyCopy}><Text style={styles.readyTitle}>All {totalSets} Time Sets Verified</Text><Text style={styles.readySub}>The connected recovery adapter is ready to complete the wallet recovery step.</Text></View></View>
        )}

        <View style={styles.progressHeading}><Text style={styles.progressLabel}>Progress</Text><Text style={styles.progressValue}>{verifiedSets} of {totalSets} verified</Text></View>
        <ProgressBar value={progress} color={C.green} height={10} />
        <View style={styles.milestones}>{[6, 12, 18, 24].map((value) => <View key={value} style={styles.milestone}><Text style={[styles.milestoneMark, verifiedSets >= value && { color: C.green }]}>{verifiedSets >= value ? '✓' : '•'}</Text><Text style={styles.milestoneLabel}>{value} Sets</Text></View>)}</View>
      </Panel>

      {feedback ? <Text style={[styles.feedback, /unable|did not|invalid/i.test(feedback) && { color: C.red }]}>{feedback}</Text> : null}

      {allVerified ? <PrimaryButton label={busy ? 'Recovering Wallet…' : 'Recover Wallet'} subtitle="Complete the protected recovery sequence" icon="✓" tone="green" disabled={busy} onPress={() => void complete()} /> : null}

      <Panel tone="yellow" style={styles.warningPanel}><Text style={styles.warningIcon}>⚠</Text><View style={styles.warningCopy}><Text style={styles.warningTitle}>Important</Text><Text style={styles.warningText}>All Time Sets must match the original order. Stop immediately if the device, request or recovery details appear unfamiliar.</Text></View></Panel>

      <BottomNav active="Recovery" items={[
        ['⌂', 'Home', 'Portfolio'], ['▣', 'Wallets', 'Wallets'], ['✈', 'Travel', 'TravelMode'], ['◇', 'Security', 'SecurityCenter'], ['↻', 'Recovery', 'RecoveryCenter'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  stepper: { minHeight: 91, padding: 12, flexDirection: 'row', alignItems: 'center' },
  step: { flex: 1, alignItems: 'center' },
  stepCircle: { width: 33, height: 33, borderRadius: 17, borderWidth: 1, borderColor: '#46576a', alignItems: 'center', justifyContent: 'center' },
  stepActive: { borderColor: C.green, backgroundColor: C.green },
  stepNumber: { color: '#d9e4f2', fontWeight: '900' },
  stepNumberActive: { color: C.bg },
  stepLabel: { color: C.muted, fontSize: 8, textAlign: 'center', marginTop: 6 },
  stepArrow: { color: C.muted, fontSize: 17 },
  hero: { minHeight: 172, marginTop: 17, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 19 },
  heroCompact: { flexDirection: 'column', alignItems: 'flex-start' },
  heroCopy: { flex: 1, minWidth: 0 },
  heroTitle: { color: '#fff', fontSize: 23, fontWeight: '900' },
  heroText: { color: '#e5edf6', fontSize: 11, lineHeight: 18, marginTop: 8 },
  verificationPanel: { marginTop: 17, padding: 18 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  currentSetBadge: { width: 47, height: 47, borderRadius: 24, borderWidth: 1, borderColor: C.green, backgroundColor: 'rgba(32,239,112,.08)', alignItems: 'center', justifyContent: 'center' },
  currentSetText: { color: C.green, fontSize: 18, fontWeight: '900' },
  enterLabel: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeField: { flex: 1, alignItems: 'center' },
  timeLabel: { color: C.muted, fontSize: 10, marginBottom: 7 },
  timeInput: { width: '100%', minHeight: 72, borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.panel2, color: '#fff', fontSize: 30, fontWeight: '800', textAlign: 'center', outlineStyle: 'none' } as any,
  colon: { color: '#fff', fontSize: 31, marginHorizontal: 10, marginTop: 17 },
  readyBox: { minHeight: 90, marginTop: 18, borderWidth: 1, borderColor: C.green, borderRadius: 12, backgroundColor: 'rgba(32,239,112,.06)', padding: 14, flexDirection: 'row', alignItems: 'center' },
  readyCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  readyTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  readySub: { color: C.muted, fontSize: 9, lineHeight: 15, marginTop: 4 },
  progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  progressLabel: { color: '#fff', fontSize: 12, fontWeight: '800' },
  progressValue: { color: C.muted, fontSize: 10 },
  milestones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  milestone: { alignItems: 'center' },
  milestoneMark: { color: C.muted, fontSize: 16 },
  milestoneLabel: { color: C.muted, fontSize: 7, marginTop: 3 },
  feedback: { color: C.green, fontSize: 10, marginTop: 12 },
  warningPanel: { minHeight: 84, marginTop: 17, padding: 15, flexDirection: 'row', alignItems: 'center' },
  warningIcon: { color: C.yellow, fontSize: 29, marginRight: 14 },
  warningCopy: { flex: 1, minWidth: 0 },
  warningTitle: { color: C.yellow, fontSize: 13, fontWeight: '900' },
  warningText: { color: '#f1e8d4', fontSize: 9, lineHeight: 15, marginTop: 4 },
});
