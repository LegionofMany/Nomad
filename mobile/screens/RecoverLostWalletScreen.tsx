import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadRecovery } from '../nomad';
import {
  C,
  NomadPage,
  PageHeader,
  Panel,
  PrimaryButton,
  ProgressBar,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

function RecoveryStepper() {
  const steps = [
    ['1', 'Enter Time Sets', 'In Progress'], ['2', 'Verify Sequence', 'Pending'], ['3', 'Recover Wallet', 'Pending'], ['4', 'Complete', 'Pending'],
  ];
  return (
    <Panel style={styles.stepper}>
      {steps.map((step, index) => <React.Fragment key={step[0]}><View style={styles.step}><View style={[styles.stepCircle, index === 0 && styles.stepActive]}><Text style={[styles.stepNumber, index === 0 && styles.stepNumberActive]}>{step[0]}</Text></View><Text style={[styles.stepLabel, index === 0 && { color: C.green }]}>{step[1]}</Text><Text style={styles.stepSub}>{step[2]}</Text></View>{index < steps.length - 1 ? <Text style={styles.stepArrow}>→</Text> : null}</React.Fragment>)}
    </Panel>
  );
}

function TimeGrid({ entered, sample }: { entered: number; sample: string }) {
  return (
    <View style={styles.timeGrid}>
      {Array.from({ length: 24 }, (_, index) => {
        const active = index < entered;
        return <View key={index} style={[styles.timeCell, active && styles.timeCellActive]}><Text style={[styles.cellNumber, active && { color: C.green }]}>{index + 1}</Text><Text style={[styles.cellTime, active && { color: C.green }]}>{active ? sample : '--:--:--'}</Text></View>;
      })}
    </View>
  );
}

export default function RecoverLostWalletScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { sequence, startSequence, error } = useNomadRecovery();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const sampleTime = `${String(sequence.sampleTime.hour).padStart(2, '0')}:${String(sequence.sampleTime.minute).padStart(2, '0')}:${String(sequence.sampleTime.second ?? 0).padStart(2, '0')}`;
  const canContinue = password.length >= 6 && acknowledged;
  const sequencePercent = Math.round((sequence.enteredSets / Math.max(1, sequence.totalSets)) * 100);

  const beginVerification = async () => {
    if (!canContinue) {
      setFeedback('Enter the wallet password and confirm the private recovery warning.');
      return;
    }
    try {
      setBusy(true);
      setFeedback('');
      await startSequence();
      navigation.navigate('VerifyRecoverySequence');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to start the recovery sequence.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <NomadPage maxWidth={920}>
      <PageHeader title="Recover Lost Wallet" subtitle="Use the protected Time Set recovery sequence" icon="◷" color={C.green} help />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <RecoveryStepper />

      <Panel style={[styles.hero, compact && styles.heroCompact]}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>STEP 1 OF 4</Text>
          <Text style={styles.heroTitle}>Prepare Your 24 Time Sets</Text>
          <Text style={styles.heroText}>Recovery verifies the exact time positions and order configured by the wallet owner. Nomad does not receive or store the private sequence.</Text>
          <View style={styles.privateBox}><Text style={styles.privateIcon}>◇</Text><Text style={styles.privateText}>Complete this process in a private location on a trusted device.</Text></View>
        </View>
        <View style={[styles.clock, { width: compact ? 210 : 270, height: compact ? 210 : 270, borderRadius: compact ? 105 : 135 }]}>
          <Text style={styles.clockTwelve}>12</Text><Text style={styles.clockIcon}>◷</Text><Text style={styles.clockBrand}>NOMAD</Text><Text style={styles.clockSub}>TIME RECOVERY</Text><Text style={styles.clockTime}>{sampleTime}</Text>
        </View>
      </Panel>

      <Panel style={styles.passwordPanel}>
        <Text style={styles.sectionTitle}>WALLET PASSWORD</Text>
        <View style={styles.passwordBox}><Text style={styles.passwordIcon}>▣</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry={!showPassword} placeholder="Enter your wallet password" placeholderTextColor="#718196" style={styles.passwordInput} /><Pressable onPress={() => setShowPassword((value) => !value)}><Text style={styles.eye}>{showPassword ? '◉' : '◎'}</Text></Pressable></View>
        <Text style={styles.helper}>The password is used locally by the wallet recovery flow and is not stored by this screen.</Text>
      </Panel>

      <Panel style={styles.sequencePanel}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>24 TIME SET SEQUENCE</Text><Text style={styles.sectionSub}>Each set is verified individually on the next page</Text></View><Text style={styles.count}>{sequence.enteredSets}/{sequence.totalSets}</Text></View>
        <ProgressBar value={sequencePercent} color={C.green} height={8} />
        <TimeGrid entered={sequence.enteredSets} sample={sampleTime} />
      </Panel>

      <View style={[styles.infoColumns, compact && styles.infoColumnsCompact]}>
        <Panel style={styles.infoPanel}><Text style={styles.sectionTitle}>INSTRUCTIONS</Text>{[
          'Use the exact 24 time positions in their original order.',
          'Verify hours, minutes and seconds before submitting each set.',
          'Do not share screenshots, recordings or the full sequence.',
          'Continue only from a trusted device and private location.',
        ].map((line, index) => <Text key={line} style={styles.infoLine}>{index + 1}.  {line}</Text>)}</Panel>
        <Panel style={styles.infoPanel}><Text style={styles.sectionTitle}>RECOVERY TIPS</Text>{[
          ['☼', 'Use a private and secure location.'], ['▣', 'Keep the device connected and charged.'], ['◇', 'Pause if any recovery detail looks unfamiliar.'],
        ].map(([icon, text]) => <View key={text} style={styles.tipRow}><Text style={styles.tipIcon}>{icon}</Text><Text style={styles.tipText}>{text}</Text></View>)}</Panel>
      </View>

      <Panel style={styles.strengthPanel}>
        <RoundIcon symbol="◇" color={C.green} size={52} filled />
        <View style={styles.strengthCopy}><Text style={styles.sectionTitle}>RECOVERY STRENGTH</Text><Text style={styles.strengthValue}>{sequence.strengthScore || '--'}<Text style={styles.strengthOut}> /100</Text></Text><Text style={styles.strengthSub}>Strength increases as the protected sequence is verified.</Text></View>
        <View style={styles.strengthChecks}>{['24 unique times', 'Correct sequence', 'Owner completion'].map((item, index) => <Text key={item} style={[styles.strengthCheck, index === 0 && { color: C.green }]}>○ {item}</Text>)}</View>
      </Panel>

      <Pressable onPress={() => setAcknowledged((value) => !value)} style={styles.ackRow}><View style={[styles.checkbox, acknowledged && styles.checkboxActive]}><Text style={[styles.checkmark, acknowledged && { color: C.bg }]}>{acknowledged ? '✓' : ''}</Text></View><Text style={styles.ackText}>I am in a private location and understand that incorrect recovery information can block access.</Text></Pressable>
      {feedback ? <Text style={[styles.feedback, feedback.toLowerCase().includes('unable') && { color: C.red }]}>{feedback}</Text> : null}

      <PrimaryButton label={busy ? 'Starting Recovery…' : 'Begin Sequence Verification'} subtitle="Verify all 24 Time Sets before wallet recovery" icon="◇" tone="green" disabled={busy || !canContinue} onPress={() => void beginVerification()} />
      <Panel tone="red" style={styles.warningPanel}><Text style={styles.warningIcon}>⚠</Text><Text style={styles.warningText}>Never enter Time Sets into a website, message or third-party support form. This recovery flow should remain inside the trusted Nomad application.</Text></Panel>
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  stepper: { minHeight: 94, padding: 12, flexDirection: 'row', alignItems: 'center' },
  step: { flex: 1, alignItems: 'center' },
  stepCircle: { width: 31, height: 31, borderRadius: 16, borderWidth: 1, borderColor: '#718097', alignItems: 'center', justifyContent: 'center' },
  stepActive: { borderColor: C.green, backgroundColor: C.green },
  stepNumber: { color: '#dce6f4', fontWeight: '900' },
  stepNumberActive: { color: C.bg },
  stepLabel: { color: C.muted, fontSize: 8, textAlign: 'center', marginTop: 6 },
  stepSub: { color: C.muted, fontSize: 7, textAlign: 'center', marginTop: 2 },
  stepArrow: { color: C.muted, fontSize: 18 },
  hero: { marginTop: 17, padding: 19, flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: C.green, fontSize: 11, fontWeight: '900' },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 12 },
  heroText: { color: '#d8e1ec', fontSize: 11, lineHeight: 18, marginTop: 9 },
  privateBox: { minHeight: 60, marginTop: 18, borderWidth: 1, borderColor: C.green, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center' },
  privateIcon: { color: C.green, fontSize: 23, marginRight: 11 },
  privateText: { flex: 1, color: '#e6edf7', fontSize: 9, lineHeight: 14 },
  clock: { alignSelf: 'center', borderWidth: 2, borderColor: C.green, backgroundColor: 'rgba(0,30,20,.45)', alignItems: 'center', justifyContent: 'center' },
  clockTwelve: { color: '#fff', fontSize: 17, fontWeight: '900' },
  clockIcon: { color: C.green, fontSize: 36, marginTop: 16 },
  clockBrand: { color: C.green, fontSize: 14, fontWeight: '900' },
  clockSub: { color: C.muted, fontSize: 7, fontWeight: '800' },
  clockTime: { color: '#fff', fontSize: 21, fontWeight: '800', marginTop: 7 },
  passwordPanel: { marginTop: 17, padding: 17 },
  sectionTitle: { color: C.green, fontSize: 13, fontWeight: '900', letterSpacing: .3 },
  passwordBox: { minHeight: 56, marginTop: 12, borderWidth: 1, borderColor: C.border, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13 },
  passwordIcon: { color: C.green, fontSize: 22, marginRight: 10 },
  passwordInput: { flex: 1, color: '#fff', fontSize: 13, outlineStyle: 'none' } as any,
  eye: { color: '#dbe5f5', fontSize: 20 },
  helper: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 8 },
  sequencePanel: { marginTop: 17, padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionSub: { color: C.muted, fontSize: 8, marginTop: 3 },
  count: { color: C.green, fontSize: 15, fontWeight: '900' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  timeCell: { width: '15%', minWidth: 75, flexGrow: 1, minHeight: 61, borderWidth: 1, borderColor: '#2a3b4b', borderRadius: 8, padding: 9 },
  timeCellActive: { borderColor: C.green, backgroundColor: 'rgba(0,255,100,.06)' },
  cellNumber: { color: '#d4d8e1', fontSize: 10, fontWeight: '700' },
  cellTime: { color: C.muted, fontSize: 9, fontWeight: '900', marginTop: 12 },
  infoColumns: { flexDirection: 'row', gap: 12, marginTop: 17 },
  infoColumnsCompact: { flexDirection: 'column' },
  infoPanel: { flex: 1, padding: 16 },
  infoLine: { color: '#d7dfec', fontSize: 9, lineHeight: 15, marginTop: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  tipIcon: { color: C.green, fontSize: 19, width: 27 },
  tipText: { color: '#d7dfec', flex: 1, fontSize: 9, lineHeight: 14 },
  strengthPanel: { minHeight: 96, marginTop: 17, padding: 15, flexDirection: 'row', alignItems: 'center' },
  strengthCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  strengthValue: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 5 },
  strengthOut: { color: C.muted, fontSize: 9 },
  strengthSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  strengthChecks: { marginLeft: 10 },
  strengthCheck: { color: C.muted, fontSize: 8, marginVertical: 3 },
  ackRow: { marginTop: 17, flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { width: 23, height: 23, borderRadius: 6, borderWidth: 1, borderColor: C.green, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxActive: { backgroundColor: C.green },
  checkmark: { color: C.green, fontWeight: '900' },
  ackText: { flex: 1, color: '#dbe4ed', fontSize: 9, lineHeight: 15 },
  feedback: { color: C.yellow, fontSize: 10, marginTop: 10 },
  warningPanel: { minHeight: 76, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  warningIcon: { color: C.red, fontSize: 25, marginRight: 12 },
  warningText: { flex: 1, color: '#e7edf5', fontSize: 9, lineHeight: 15 },
});
