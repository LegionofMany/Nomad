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

function formatSeconds(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ClockUnlockScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { walletStatus, unlockTime, setUnlockTime, unlockWithClock, resetDemo } = useAppState();
  const [hour, setHour] = useState(unlockTime ? String(unlockTime.hour).padStart(2, '0') : '12');
  const [minute, setMinute] = useState(unlockTime ? String(unlockTime.minute).padStart(2, '0') : '00');
  const [second, setSecond] = useState(unlockTime ? String(unlockTime.second).padStart(2, '0') : '00');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const configuredLabel = useMemo(() => unlockTime ? `${String(unlockTime.hour).padStart(2, '0')}:${String(unlockTime.minute).padStart(2, '0')}:${String(unlockTime.second).padStart(2, '0')}` : 'Not configured', [unlockTime]);
  const validTime = hour !== '' && minute !== '' && second !== '' && Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59;
  const valid = validTime && password.length > 0;
  const inputTime = { hour: Number(hour || 0), minute: Number(minute || 0), second: Number(second || 0) };
  const canConfigure = walletStatus === 'unlocked';

  const saveTime = async () => {
    if (!validTime) { setMessage('Enter a valid HH:MM:SS Time Key.'); return; }
    if (!password) { setMessage('Enter the wallet password.'); return; }
    if (!canConfigure) { setMessage('Unlock the wallet or complete verified recovery before changing the daily access time.'); return; }
    try {
      setBusy(true);
      setMessage('');
      await setUnlockTime(inputTime, password);
      setPassword('');
      setMessage(`Daily access Time Key saved for ${String(inputTime.hour).padStart(2, '0')}:${String(inputTime.minute).padStart(2, '0')}:${String(inputTime.second).padStart(2, '0')} device local time.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to save the unlock time.');
    } finally {
      setBusy(false);
    }
  };

  const unlock = async () => {
    if (!validTime) { setMessage('Enter a valid HH:MM:SS Time Key.'); return; }
    if (!password) { setMessage('Enter the wallet password.'); return; }
    try {
      setBusy(true);
      setMessage('Verifying the wallet password, access window and full Time Key…');
      const result = await unlockWithClock(inputTime, password);
      setPassword('');
      if (result.ok) {
        navigation.navigate('Portfolio');
        return;
      }
      if (result.reason === 'outside_window') {
        setMessage(`The daily access window is closed. Next window begins in ${formatSeconds(result.secondsUntilWindow ?? 0)}.`);
      } else if (result.reason === 'not_configured') {
        setMessage('A daily access time has not been configured. Open Recovery Center to complete setup.');
      } else if (result.reason === 'locked_out') {
        setMessage(result.permanentlyLocked ? 'Recovery is required before another unlock attempt.' : `Temporarily locked. Try again in approximately ${result.remainingLockSeconds ?? 0} seconds.`);
      } else if (result.reason === 'bad_time') {
        setMessage('The entered HH:MM:SS Time Key does not match the configured value.');
      } else if (result.reason === 'bad_password') {
        setMessage('The wallet password is incorrect.');
      } else if (result.reason === 'password_not_configured') {
        setMessage('This legacy preview wallet has no password credential. Reset it and create a password-protected wallet.');
      } else if (result.reason === 'no_wallet') {
        setMessage('Create or recover a wallet before using Time Clock access.');
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
          <Text style={styles.clockTop}>12</Text><Text style={styles.clockCenter}>◷</Text><Text style={styles.clockTime}>{String(Number(hour || 0)).padStart(2, '0')}:{String(Number(minute || 0)).padStart(2, '0')}:{String(Number(second || 0)).padStart(2, '0')}</Text><Text style={styles.clockBottom}>6</Text>
        </View>
        <Text style={styles.configured}>Configured access time: <Text style={styles.configuredValue}>{configuredLabel}</Text></Text>
      </Panel>

      <Panel style={styles.entryPanel}>
        <Text style={styles.entryTitle}>ENTER PASSWORD + TIME KEY</Text>
        <Text style={styles.entrySub}>The device clock must be inside the daily access window. The complete HH:MM:SS key and wallet password are both required.</Text>
        <TextInput
          accessibilityLabel="Wallet password"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Wallet password"
          placeholderTextColor={C.muted}
          style={styles.passwordInput}
        />
        <View style={styles.inputRow}><NumberField label="HOUR" value={hour} max={23} onChange={setHour} /><Text style={styles.colon}>:</Text><NumberField label="MINUTE" value={minute} max={59} onChange={setMinute} /><Text style={styles.colon}>:</Text><NumberField label="SECOND" value={second} max={59} onChange={setSecond} /></View>
        <View style={[styles.actionRow, compact && styles.actionCompact]}>
          <Pressable disabled={busy || !valid || !canConfigure} onPress={() => void saveTime()} style={[styles.saveButton, !canConfigure && styles.disabled]}><Text style={styles.saveText}>{busy ? 'Working…' : canConfigure ? 'Change Daily Time' : 'Unlock Required to Change'}</Text></Pressable>
          <Pressable disabled={busy || !valid} onPress={() => void unlock()} style={styles.unlockButton}><Text style={styles.unlockText}>{busy ? 'Verifying…' : 'Verify & Unlock'}</Text></Pressable>
        </View>
        {message ? <Text style={[styles.message, /unable|does not|locked|required|could not|closed|not been/i.test(message) && { color: C.yellow }]}>{message}</Text> : null}
      </Panel>

      <Panel style={styles.securityPanel}><RoundIcon symbol="◇" color={C.green} size={45} /><View style={styles.securityCopy}><Text style={styles.securityTitle}>Protected owner access</Text><Text style={styles.securityText}>Unlock requires the wallet password, full HH:MM:SS Time Key and an open daily window. Repeated incorrect attempts can trigger recovery.</Text></View><Pressable onPress={() => navigation.navigate('TimeClockAccess')}><Text style={styles.recoveryLink}>View Clock  ›</Text></Pressable></Panel>

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
  passwordInput: { minHeight: 50, marginTop: 15, borderWidth: 1, borderColor: C.green, borderRadius: 10, backgroundColor: C.panel2, color: '#fff', paddingHorizontal: 13, fontSize: 13, outlineStyle: 'none' } as any,
  field: { flex: 1, alignItems: 'center' },
  fieldLabel: { color: C.muted, fontSize: 8, marginBottom: 6 },
  input: { width: '100%', minHeight: 71, borderWidth: 1, borderColor: C.green, borderRadius: 11, backgroundColor: C.panel2, color: '#fff', fontSize: 30, fontWeight: '900', textAlign: 'center', outlineStyle: 'none' } as any,
  colon: { color: '#fff', fontSize: 25, marginHorizontal: 7, marginTop: 16 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 17 },
  actionCompact: { flexDirection: 'column' },
  saveButton: { flex: 1, minHeight: 55, borderWidth: 1, borderColor: C.green, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: C.green, fontSize: 10, fontWeight: '900' },
  disabled: { opacity: 0.45 },
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
