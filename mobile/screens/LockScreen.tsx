import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAppState } from '../state/appState';
import { C, NomadPage, Panel, RoundIcon, useNomadLayout } from '../ui/NomadShell';

export default function LockScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { walletStatus, walletMeta, createWallet, resetDemo } = useAppState();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const status = useMemo(() => {
    if (walletStatus === 'no_wallet') return { label: 'WALLET SETUP', color: C.blue, text: 'Create a new owner-controlled wallet or start protected recovery.' };
    if (walletStatus === 'locked') return { label: 'WALLET LOCKED', color: C.green, text: 'Use the configured Clock Unlock to access Nomad.' };
    if (walletStatus === 'recovery') return { label: 'RECOVERY REQUIRED', color: C.yellow, text: 'Continue through the protected Time Set recovery sequence.' };
    return { label: 'WALLET READY', color: C.green, text: 'The wallet session is ready to open.' };
  }, [walletStatus]);

  const create = async () => {
    try {
      setBusy(true);
      setMessage('Creating the local wallet…');
      await createWallet();
      setMessage('Wallet created. Continue to configure or use Clock Unlock.');
      navigation.navigate('ClockUnlock');
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
        <View style={[styles.actionGrid, compact && styles.actionGridCompact]}>
          <Pressable disabled={busy} onPress={() => void create()} style={styles.primaryCard}><RoundIcon symbol="＋" color={C.green} size={55} filled /><Text style={styles.cardTitle}>{busy ? 'Creating Wallet…' : 'Create Wallet'}</Text><Text style={styles.cardSub}>Start a new non-custodial Nomad wallet on this device.</Text><Text style={styles.cardArrow}>›</Text></Pressable>
          <Pressable onPress={() => navigation.navigate('RecoverLostWallet')} style={styles.secondaryCard}><RoundIcon symbol="↻" color={C.blue} size={55} filled /><Text style={styles.cardTitle}>Recover Wallet</Text><Text style={styles.cardSub}>Use the protected Time Set and Owner Authority recovery flow.</Text><Text style={styles.cardArrow}>›</Text></Pressable>
        </View>
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
