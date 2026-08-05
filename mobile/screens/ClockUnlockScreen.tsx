import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAppState } from '../state/appState';
import { C, NomadPage, Panel, RoundIcon, useNomadLayout } from '../ui/NomadShell';

function NumberField({ label, value, max, onChange }: { label: string; value: string; max: number; onChange: (value: string) => void }) {
  const handle = (next: string) => {
    const digits = next.replace(/[^0-9]/g, '').slice(0, 2);
    if (!digits) { onChange(''); return; }
    onChange(String(Math.min(max, Number(digits))).padStart(digits.length > 1 ? 2 : 1, '0'));
  };
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={handle} keyboardType="number-pad" maxLength={2} placeholder="00" placeholderTextColor="#68798f" style={styles.input} /></View>;
}

export default function ClockUnlockScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { walletStatus, unlockTime, setUnlockTime, unlockWithClock, resetDemo } = useAppState();
  const [hour, setHour] = useState(unlockTime ? String(unlockTime.hour).padStart(2, '0') : '12');
  const [minute, setMinute] = useState(unlockTime ? String(unlockTime.minute).padStart(2, '0') : '00');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const configuredLabel = useMemo(() => unlockTime ? `${String(unlockTime.hour).padStart(2, '0')}:${String(unlockTime.minute).padStart(2, '0')}` : 'Not configured', [unlockTime]);
  const valid = hour !== '' && minute !== '' && Number(hour) <= 23 && Number(minute) <= 59;
  const inputTime = { hour: Number(hour || 0), minute: Number(minute || 0) };

  const saveTime = async () => {
    if (!valid) { setMessage('Enter a valid hour and minute.'); return; }
    try {
      setBusy(true);
      setMessage('');
      await setUnlockTime(inputTime);
      setMessage(`Clock Unlock saved for ${String(inputTime.hour).padStart(2, '0')}:${String(inputTime.minute).padStart(2, '0')}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to save the unlock time.');
    } finally {
      setBusy(false);
    }
  };

  const unlock = async () => {
    if (!valid) { setMessage('Enter a valid hour and minute.'); return; }
    try {
      setBusy(true);
      setMessage('Verifying the owner-configured time…');
      const result = await unlockWithClock(inputTime);
      if (result.ok) {
        navigation.navigate('Portfolio');
        return;
      }
      if (result.reason === 'locked_out') {
        setMessage(result.permanentlyLocked ? 'Recovery is required before another unlock attempt.' : `Temporarily locked. Try again in approximately ${result.remainingLockSeconds ?? 0} seconds.`);
      } else if (result.reason === 'bad_time') {
        setMessage('The entered time does not match the configured Clock Unlock.');
      } else {
        setMessage('Clock Unlock could not be completed.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to verify Clock Unlock.');
    } finally {
      setBusy(false);
    }
  };

  if (walletStatus === 'no_wallet') {
    return (
      <NomadPage maxWidth={680}>
        <View style={styles.brand}><RoundIcon symbol="⌁" color={C.blue} size={86} filled /><Text style={styles.brandTitle}>NOMAD</Text></View>
        <Panel tone="yellow" style={styles.noWallet}><RoundIcon symbol="!" color={C.yellow} size={52} /><View style={styles.noWalletCopy}><Text style={styles.noWalletTitle}>Wallet setup required</Text><Text style={styles.noWalletText}>Create a wallet or start protected recovery before using Clock Unlock.</Text></View></Panel>
        <Pressable onPress={() => navigation.navigate('Lock')} style={styles.continueButton}><Text style={styles.continueText}>Create or Recover Wallet  ›</Text></Pressable>
      </NomadPage>
    );
  }

  return (
    <NomadPage maxWidth={720}>
      <View style={styles.brand}><RoundIcon symbol="⌁" color={C.blue} size={compact ? 68 : 82} filled /><Text style={styles.brandTitle}>NOMAD</Text><Text style={styles.brandSub}>Clock Unlock</Text></View>

      <Panel tone="green" style={styles.clockPanel}>
        <View style={[styles.clockFace, { width: compact ? 215 : 275, height: compact ? 215 : 275, borderRadius: compact ? 108 : 138 }]}>
          <Text style={styles.clockTop}>12</Text><Text style={styles.clockCenter}>◷</Text><Text style={styles.clockTime}>{String(Number(hour || 0)).padStart(2, '0')}:{String(Number(minute || 0)).padStart(2, '0')}</Text><Text style={styles.clockBottom}>6</Text>
        </View>
        <Text style={styles.configured}>Configured unlock time: <Text style={styles.configuredValue}>{configuredLabel}</Text></Text>
      </Panel>

      <Panel style={styles.entryPanel}>
        <Text style={styles.entryTitle}>ENTER CLOCK UNLOCK TIME</Text>
        <Text style={styles.entrySub}>Use the exact time configured by the wallet owner.</Text>
        <View style={styles.inputRow}><NumberField label="HOUR" value={hour} max={23} onChange={setHour} /><Text style={styles.colon}>:</Text><NumberField label="MINUTE" value={minute} max={59} onChange={setMinute} /></View>
        <View style={[styles.actionRow, compact && styles.actionCompact]}>
          <Pressable disabled={busy || !valid} onPress={() => void saveTime()} style={styles.saveButton}><Text style={styles.saveText}>{busy ? 'Working…' : 'Save Time'}</Text></Pressable>
          <Pressable disabled={busy || !valid} onPress={() => void unlock()} style={styles.unlockButton}><Text style={styles.unlockText}>{busy ? 'Verifying…' : 'Unlock Wallet'}</Text></Pressable>
        </View>
        {message ? <Text style={[styles.message, /unable|does not|locked|required|could not/i.test(message) && { color: C.yellow }]}>{message}</Text> : null}
      </Panel>

      <Panel style={styles.securityPanel}><RoundIcon symbol="◇" color={C.green} size={45} /><View style={styles.securityCopy}><Text style={styles.securityTitle}>Protected owner access</Text><Text style={styles.securityText}>Repeated incorrect attempts can trigger lockout or require the protected recovery sequence.</Text></View><Pressable onPress={() => navigation.navigate('RecoveryCenter')}><Text style={styles.recoveryLink}>Recovery  ›</Text></Pressable></Panel>

      <Pressable onPress={async () => { await resetDemo(); setMessage('Local preview state reset.'); navigation.navigate('Lock'); }} style={styles.reset}><Text style={styles.resetText}>Reset local preview state</Text></Pressable>
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginTop: 20, marginBottom: 20 },
  brandTitle: { color: '#fff', fontSize: 31, fontWeight: '900', letterSpacing: 1, marginTop: 10 },
  brandSub: { color: C.green, fontSize: 11, fontWeight: '900', marginTop: 4 },
  noWallet: { minHeight: 100, padding: 15, flexDirection: 'row', alignItems: 'center' },
  noWalletCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  noWalletTitle: { color: C.yellow, fontSize: 14, fontWeight: '900' },
  noWalletText: { color: '#fff', fontSize: 9, lineHeight: 15, marginTop: 4 },
  continueButton: { minHeight: 58, marginTop: 16, borderRadius: 10, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  continueText: { color: C.bg, fontSize: 12, fontWeight: '900' },
  clockPanel: { padding: 20, alignItems: 'center' },
  clockFace: { borderWidth: 3, borderColor: C.green, backgroundColor: 'rgba(0,32,21,.52)', alignItems: 'center', justifyContent: 'center', shadowColor: C.green, shadowOpacity: .35, shadowRadius: 22 },
  clockTop: { position: 'absolute', top: 15, color: '#fff', fontSize: 15, fontWeight: '900' },
  clockCenter: { color: C.green, fontSize: 48 },
  clockTime: { color: '#fff', fontSize: 31, fontWeight: '900', marginTop: 8 },
  clockBottom: { position: 'absolute', bottom: 15, color: '#fff', fontSize: 15, fontWeight: '900' },
  configured: { color: C.muted, fontSize: 10, marginTop: 16 },
  configuredValue: { color: C.green, fontWeight: '900' },
  entryPanel: { marginTop: 16, padding: 18 },
  entryTitle: { color: C.green, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  entrySub: { color: C.muted, fontSize: 9, textAlign: 'center', marginTop: 5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 17 },
  field: { flex: 1, alignItems: 'center' },
  fieldLabel: { color: C.muted, fontSize: 8, marginBottom: 6 },
  input: { width: '100%', minHeight: 71, borderWidth: 1, borderColor: C.green, borderRadius: 11, backgroundColor: C.panel2, color: '#fff', fontSize: 30, fontWeight: '900', textAlign: 'center', outlineStyle: 'none' } as any,
  colon: { color: '#fff', fontSize: 31, marginHorizontal: 13, marginTop: 16 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 17 },
  actionCompact: { flexDirection: 'column' },
  saveButton: { flex: 1, minHeight: 55, borderWidth: 1, borderColor: C.green, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: C.green, fontSize: 11, fontWeight: '900' },
  unlockButton: { flex: 1, minHeight: 55, borderRadius: 10, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  unlockText: { color: C.bg, fontSize: 11, fontWeight: '900' },
  message: { color: C.green, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 12 },
  securityPanel: { minHeight: 82, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  securityCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  securityTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  securityText: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  recoveryLink: { color: C.green, fontSize: 9, fontWeight: '900', marginLeft: 8 },
  reset: { alignSelf: 'center', padding: 14 },
  resetText: { color: C.muted, fontSize: 8 },
});
