import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadWallet } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

const PREVIEW_BTC_ADDRESS = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

type TabName = 'Address' | 'QR Code';

function QrCode({ compact }: { compact: boolean }) {
  const cell = compact ? 10 : 13;
  const gridSize = cell * 21;
  const cells = useMemo(() => Array.from({ length: 21 * 21 }, (_, index) => {
    const row = Math.floor(index / 21);
    const col = index % 21;
    const inFinder =
      (row <= 6 && col <= 6) ||
      (row <= 6 && col >= 14) ||
      (row >= 14 && col <= 6);
    const finderBorder = inFinder && (
      row === 0 || row === 6 || col === 0 || col === 6 ||
      row === 14 || row === 20 || col === 14 || col === 20
    );
    const finderCore =
      (row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
      (row >= 2 && row <= 4 && col >= 16 && col <= 18) ||
      (row >= 16 && row <= 18 && col >= 2 && col <= 4);
    const data = ((row * 11 + col * 7 + row * col) % 5) < 3;
    const active = finderBorder || finderCore || (!inFinder && data);
    return <View key={index} style={{ width: cell, height: cell, backgroundColor: active ? '#020202' : '#fff' }} />;
  }), [cell]);

  return (
    <View style={[styles.qrFrame, { width: gridSize + 36, height: gridSize + 36 }]}>
      <View style={{ width: gridSize, flexDirection: 'row', flexWrap: 'wrap' }}>{cells}</View>
      <View style={[styles.qrLogoPlate, { width: compact ? 70 : 84, height: compact ? 70 : 84, borderRadius: compact ? 15 : 18 }]}>
        <View style={[styles.qrShield, { width: compact ? 52 : 62, height: compact ? 58 : 68 }]}>
          <Text style={[styles.qrWave, { fontSize: compact ? 24 : 29 }]}>⌁</Text>
        </View>
      </View>
    </View>
  );
}

function SegmentTabs({ active, onChange }: { active: TabName; onChange(value: TabName): void }) {
  return (
    <View style={styles.tabs}>
      {(['Address', 'QR Code'] as TabName[]).map((tab) => {
        const selected = tab === active;
        return (
          <Pressable key={tab} onPress={() => onChange(tab)} style={[styles.tab, selected && styles.tabActive]}>
            <Text style={[styles.tabIcon, selected && styles.tabIconActive]}>{tab === 'Address' ? '▣' : '▦'}</Text>
            <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ReceiveBitcoinScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { getReceiveAddress } = useNomadWallet();
  const [tab, setTab] = useState<TabName>('Address');
  const [address, setAddress] = useState(PREVIEW_BTC_ADDRESS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadAddress() {
      try {
        setLoading(true);
        setError(null);
        const next = await getReceiveAddress('BTC');
        if (mounted && next) setAddress(next);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load the BTC receive address.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadAddress();
    return () => { mounted = false; };
  }, [getReceiveAddress]);

  const copyAddress = async () => {
    try {
      const runtime = globalThis as unknown as { navigator?: { clipboard?: { writeText(value: string): Promise<void> } } };
      if (Platform.OS === 'web' && runtime.navigator?.clipboard) {
        await runtime.navigator.clipboard.writeText(address);
        setFeedback('Bitcoin address copied');
      } else {
        setFeedback('Address ready to copy in the native wallet');
      }
    } catch {
      setFeedback('Unable to copy automatically');
    }
  };

  const shareAddress = async () => {
    try {
      await Share.share({ message: `My Nomad Bitcoin address: ${address}` });
      setFeedback('Share sheet opened');
    } catch {
      setFeedback('Unable to open sharing');
    }
  };

  return (
    <NomadPage>
      <PageHeader
        title="Receive Bitcoin"
        subtitle="Receive BTC to your wallet"
        icon="↓"
        color={C.blue}
        help
      />

      <SegmentTabs active={tab} onChange={setTab} />

      <Panel style={[styles.receivePanel, { padding: compact ? 16 : 24 }]}>
        <QrCode compact={compact} />

        <View style={styles.verifiedRow}>
          <RoundIcon symbol={error ? '!' : '✓'} color={error ? C.yellow : C.green} size={30} />
          <Text style={styles.verifiedText}>{error ? 'Preview BTC address shown' : 'This is your BTC address'}</Text>
        </View>
        <Text style={styles.shareHint}>Share this address to receive payments</Text>

        <View style={styles.addressBox}>
          <Text style={styles.addressLabel}>Your Bitcoin Address</Text>
          <View style={styles.addressLine}>
            <Text selectable numberOfLines={compact ? 2 : 1} style={styles.addressText}>{loading ? 'Loading wallet address…' : address}</Text>
            <Pressable onPress={copyAddress} style={styles.copySquare}><Text style={styles.copyIcon}>▣</Text></Pressable>
          </View>
          {error ? <Text style={styles.warningText}>{error}</Text> : null}
          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        </View>

        <View style={[styles.actionRow, compact && styles.actionRowCompact]}>
          <Pressable onPress={shareAddress} style={styles.outlineButton}><Text style={styles.outlineIcon}>⌯</Text><Text style={styles.outlineText}>Share</Text></Pressable>
          <Pressable onPress={copyAddress} style={styles.outlineButton}><Text style={styles.outlineIcon}>▣</Text><Text style={styles.outlineText}>Copy Address</Text></Pressable>
        </View>

        <View style={styles.importantBox}>
          <RoundIcon symbol="i" color={C.blue} size={42} />
          <View style={styles.importantCopy}>
            <Text style={styles.importantTitle}>Important</Text>
            <Text style={styles.importantText}>Only send BTC to this address. Sending other assets may result in permanent loss.</Text>
          </View>
        </View>
      </Panel>

      <Pressable onPress={() => navigation.navigate('Wallets')} style={styles.historyCard}>
        <RoundIcon symbol="↺" color={C.blue} size={54} filled />
        <View style={styles.historyCopy}>
          <Text style={styles.historyTitle}>Transaction History</Text>
          <Text style={styles.historySub}>View all incoming transactions</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <BottomNav
        active="Receive"
        items={[
          ['⌂', 'Home', 'Portfolio'],
          ['▣', 'Wallets', 'Wallets'],
          ['✈', 'Send', 'SendBitcoin'],
          ['▦', 'Receive', 'ReceiveBitcoin'],
          ['⊞', 'Travel', 'TravelMode'],
          ['◇', 'Security', 'SecurityCenter'],
        ]}
      />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  tabs: { minHeight: 68, marginBottom: 18, borderWidth: 1, borderColor: C.border, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', backgroundColor: 'rgba(2,10,20,.92)' },
  tab: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  tabActive: { borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(11,76,178,.62)' },
  tabIcon: { color: '#aebbd0', fontSize: 24 },
  tabIconActive: { color: C.blue },
  tabText: { color: '#d9e4f2', fontSize: 16 },
  tabTextActive: { color: '#fff', fontWeight: '900' },
  receivePanel: { alignItems: 'stretch' },
  qrFrame: { alignSelf: 'center', borderRadius: 18, borderWidth: 10, borderColor: '#fff', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: C.blue, shadowOpacity: .85, shadowRadius: 20 },
  qrLogoPlate: { position: 'absolute', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  qrShield: { borderWidth: 4, borderColor: C.blue, backgroundColor: '#021222', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, alignItems: 'center', justifyContent: 'center' },
  qrWave: { color: C.blue, fontWeight: '900' },
  verifiedRow: { marginTop: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  verifiedText: { color: '#fff', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  shareHint: { color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 8 },
  addressBox: { marginTop: 22, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel2, padding: 16 },
  addressLabel: { color: C.muted, fontSize: 12, marginBottom: 12 },
  addressLine: { flexDirection: 'row', alignItems: 'center' },
  addressText: { flex: 1, minWidth: 0, color: '#fff', fontSize: 16, lineHeight: 22 },
  copySquare: { width: 46, height: 46, borderRadius: 9, borderWidth: 1, borderColor: C.blue, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  copyIcon: { color: C.blue, fontSize: 25 },
  warningText: { color: C.yellow, fontSize: 11, marginTop: 10 },
  feedback: { color: C.green, fontSize: 11, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 14, marginTop: 20 },
  actionRowCompact: { gap: 8 },
  outlineButton: { flex: 1, minWidth: 0, minHeight: 58, borderWidth: 1, borderColor: C.blue, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 8 },
  outlineIcon: { color: C.blue, fontSize: 23 },
  outlineText: { color: C.blue, fontSize: 14, fontWeight: '800' },
  importantBox: { marginTop: 22, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel2, padding: 16, flexDirection: 'row', alignItems: 'flex-start' },
  importantCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  importantTitle: { color: C.blue, fontSize: 16, fontWeight: '900' },
  importantText: { color: '#d5deeb', fontSize: 13, lineHeight: 20, marginTop: 6 },
  historyCard: { minHeight: 80, marginTop: 18, borderWidth: 1, borderColor: C.border, borderRadius: 16, backgroundColor: C.panel, padding: 14, flexDirection: 'row', alignItems: 'center' },
  historyCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  historyTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  historySub: { color: C.muted, fontSize: 12, marginTop: 5 },
  chevron: { color: '#b5c3d5', fontSize: 32 },
});
