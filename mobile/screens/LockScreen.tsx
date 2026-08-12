import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAppState } from '../state/appState';
import { C, NomadPage, Panel, RoundIcon, useNomadLayout } from '../ui/NomadShell';

export default function LockScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { walletStatus, walletMeta, createWallet, resetDemo } = useAppState();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [second, setSecond] = useState('');

  const status = useMemo(() => {
    if (walletStatus === 'no_wallet') return { label: 'WALLET SETUP', color: C.blue, text: 'Create a new owner-controlled wallet or start protected recovery.' };
    if (walletStatus === 'locked') return { label: 'WALLET LOCKED', color: C.green, text: 'Use the configured Clock Unlock to access Nomad.' };
    if (walletStatus === 'recovery') return { label: 'RECOVERY REQUIRED', color: C.yellow, text: 'Continue through the protected Time Set recovery sequence.' };
    return { label: 'WALLET READY', color: C.green, text: 'The wallet session is ready to open.' };
  }, [walletStatus]);

  const create = async () => {
    const validTime = /^\d{1,2}$/.test(hour)
      && /^\d{1,2}$/.test(minute)
      && /^\d{1,2}$/.test(second)
      && Number(hour) <= 23
      && Number(minute) <= 59
      && Number(second) <= 59;
    if (!validTime) {
      setMessage('Choose a valid 24-hour HH:MM:SS Time Key.');
      return;
    }
    if (password.length < 12) {
      setMessage('Create a wallet password with at least 12 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('The wallet passwords do not match.');
      return;
    }
    try {
      setBusy(true);
      setMessage('Creating the local wallet…');
      await createWallet(password, { hour: Number(hour), minute: Number(minute), second: Number(second) });
      setPassword('');
      setConfirmPassword('');
      setHour('');
      setMinute('');
      setSecond('');
      setMessage('Wallet created. Continue to enroll the 24 ordered recovery Time Sets.');
      navigation.navigate('RecoverLostWallet');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to create the wallet.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <NomadPage maxWidth={760}>
      <View style={styles.brand}><RoundIcon symbol="⌁" color={C.blue} size={compact ? 74 : 92} filled /><Text style={styles.brandTitle}>NOMAD</Text><Text style={styles.brandSub}>Built on <Text style={styles.arkrilium}>Arkrilium</Text></Text></View>

      <Panel tone={walletStatus === 'recovery' ? 'yellow' : 'green'} style={styles.statusPanel}>
        <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        <Text style={styles.statusText}>{status.text}</Text>
        {walletMeta?.evmAddress ? <Text selectable numberOfLines={1} style={styles.address}>EVM: {walletMeta.evmAddress}</Text> : null}
      </Panel>

      {walletStatus === 'no_wallet' ? (
        <>
          <Panel style={styles.passwordPanel}>
            <Text style={styles.passwordTitle}>CREATE WALLET PASSWORD</Text>
            <Text style={styles.passwordHelp}>At least 12 characters. Nomad stores a salted verifier, never the raw password.</Text>
            <TextInput
              accessibilityLabel="New wallet password"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="Wallet password"
              placeholderTextColor={C.muted}
              style={styles.passwordInput}
            />
            <TextInput
              accessibilityLabel="Confirm wallet password"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm wallet password"
              placeholderTextColor={C.muted}
              style={styles.passwordInput}
            />
            <Text style={styles.timeKeyTitle}>CHOOSE 24-HOUR TIME KEY</Text>
            <Text style={styles.passwordHelp}>Use all three fields. This exact HH:MM:SS value will be required during the daily access window.</Text>
            <View style={styles.timeKeyRow}>
              {[
                ['HOUR', hour, setHour, 23],
                ['MINUTE', minute, setMinute, 59],
                ['SECOND', second, setSecond, 59],
              ].map(([label, value, setter, max], index) => (
                <React.Fragment key={String(label)}>
                  {index > 0 ? <Text style={styles.timeKeyColon}>:</Text> : null}
                  <View style={styles.timeKeyField}>
                    <Text style={styles.timeKeyLabel}>{label as string}</Text>
                    <TextInput
                      accessibilityLabel={`Wallet Time Key ${String(label).toLowerCase()}`}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={value as string}
                      onChangeText={(next) => {
                        const digits = next.replace(/[^0-9]/g, '').slice(0, 2);
                        (setter as React.Dispatch<React.SetStateAction<string>>)(digits && Number(digits) > Number(max) ? String(max) : digits);
                      }}
                      placeholder="00"
                      placeholderTextColor={C.muted}
                      style={styles.timeKeyInput}
                    />
                  </View>
                </React.Fragment>
              ))}
            </View>
          </Panel>
          <View style={[styles.actionGrid, compact && styles.actionGridCompact]}>
            <Pressable disabled={busy} onPress={() => void create()} style={styles.primaryCard}><RoundIcon symbol="＋" color={C.green} size={55} filled /><Text style={styles.cardTitle}>{busy ? 'Creating Wallet…' : 'Create Wallet'}</Text><Text style={styles.cardSub}>Create a password-protected, non-custodial Nomad wallet.</Text><Text style={styles.cardArrow}>›</Text></Pressable>
            <Pressable onPress={() => navigation.navigate('RecoverLostWallet')} style={styles.secondaryCard}><RoundIcon symbol="↻" color={C.blue} size={55} filled /><Text style={styles.cardTitle}>Recover Wallet</Text><Text style={styles.cardSub}>Use your password and all 24 ordered Time Sets.</Text><Text style={styles.cardArrow}>›</Text></Pressable>
          </View>
        </>
      ) : (
        <Pressable onPress={() => navigation.navigate(walletStatus === 'recovery' ? 'RecoveryCenter' : walletStatus === 'unlocked' ? 'Portfolio' : 'ClockUnlock')} style={styles.unlockButton}><RoundIcon symbol={walletStatus === 'recovery' ? '↻' : '◷'} color={C.green} size={51} filled /><View style={styles.unlockCopy}><Text style={styles.unlockTitle}>{walletStatus === 'recovery' ? 'Open Recovery Center' : walletStatus === 'unlocked' ? 'Open Wallet' : 'Continue to Clock Unlock'}</Text><Text style={styles.unlockSub}>Owner verification remains required before protected actions.</Text></View><Text style={styles.unlockArrow}>›</Text></Pressable>
      )}

      {message ? <Text style={[styles.message, /unable|failed/i.test(message) && { color: C.red }]}>{message}</Text> : null}

      <Panel style={styles.securityPanel}><RoundIcon symbol="◇" color={C.green} size={45} /><View style={styles.securityCopy}><Text style={styles.securityTitle}>Owner-controlled security</Text><Text style={styles.securityText}>Nomad does not display recovery secrets on this entry screen. Backup and recovery setup continue inside protected wallet flows.</Text></View></Panel>

      <Pressable onPress={async () => { await resetDemo(); setMessage('Local preview state reset.'); }} style={styles.reset}><Text style={styles.resetText}>Reset local preview state</Text></Pressable>
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginTop: 34, marginBottom: 25 },
  brandTitle: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: 1, marginTop: 12 },
  brandSub: { color: '#fff', fontSize: 12, marginTop: 4 },
  arkrilium: { color: C.blue, fontWeight: '900' },
  statusPanel: { minHeight: 135, padding: 20, alignItems: 'center', justifyContent: 'center' },
  statusLabel: { fontSize: 13, fontWeight: '900', letterSpacing: .6 },
  statusText: { color: '#fff', fontSize: 12, lineHeight: 19, textAlign: 'center', maxWidth: 510, marginTop: 9 },
  address: { color: C.muted, fontSize: 9, marginTop: 12, maxWidth: '90%' },
  passwordPanel: { marginTop: 17, padding: 16 },
  passwordTitle: { color: C.green, fontSize: 12, fontWeight: '900' },
  passwordHelp: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 5, marginBottom: 7 },
  passwordInput: { minHeight: 48, marginTop: 9, borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.panel2, color: '#fff', paddingHorizontal: 13, fontSize: 13, outlineStyle: 'none' } as any,
  timeKeyTitle: { color: C.green, fontSize: 10, fontWeight: '900', marginTop: 17 },
  timeKeyRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 7 },
  timeKeyField: { flex: 1, minWidth: 0 },
  timeKeyLabel: { color: C.muted, fontSize: 7, textAlign: 'center', marginBottom: 5 },
  timeKeyInput: { minHeight: 53, borderWidth: 1, borderColor: C.green, borderRadius: 9, backgroundColor: C.panel2, color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', outlineStyle: 'none' } as any,
  timeKeyColon: { color: '#fff', fontSize: 23, marginHorizontal: 6, marginBottom: 13 },
  actionGrid: { flexDirection: 'row', gap: 12, marginTop: 17 },
  actionGridCompact: { flexDirection: 'column' },
  primaryCard: { flex: 1, minHeight: 195, borderWidth: 1, borderColor: C.green, borderRadius: 16, backgroundColor: 'rgba(0,39,24,.72)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  secondaryCard: { flex: 1, minHeight: 195, borderWidth: 1, borderColor: C.blue, borderRadius: 16, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center', padding: 18 },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  cardSub: { color: C.muted, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 7 },
  cardArrow: { color: C.green, fontSize: 28, marginTop: 8 },
  unlockButton: { minHeight: 93, marginTop: 17, borderWidth: 1, borderColor: C.green, borderRadius: 16, backgroundColor: 'rgba(0,39,24,.72)', padding: 15, flexDirection: 'row', alignItems: 'center' },
  unlockCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  unlockTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  unlockSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  unlockArrow: { color: C.green, fontSize: 29 },
  message: { color: C.green, fontSize: 10, textAlign: 'center', marginTop: 12 },
  securityPanel: { minHeight: 83, marginTop: 17, padding: 14, flexDirection: 'row', alignItems: 'center' },
  securityCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  securityTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  securityText: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  reset: { alignSelf: 'center', padding: 14 },
  resetText: { color: C.muted, fontSize: 9 },
});
