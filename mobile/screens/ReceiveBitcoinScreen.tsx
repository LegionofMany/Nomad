import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadSecurity, useNomadWallet } from '../nomad';
import { BottomNav, C, NomadPage, Panel, useNomadLayout } from '../ui/NomadShell';
import { NomadQRCode } from '../ui/NomadQRCode';

const PREVIEW_BTC_ADDRESS = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

type TabName = 'Address' | 'QR Code';
type AddressSource = 'loading' | 'live' | 'preview';

const svgUri = (viewBox: string, body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`)}`;

const shieldUri = svgUri(
  '0 0 74 86',
  `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2dc7ff"/><stop offset="1" stop-color="#0867ff"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
   <path d="M37 3 67 17v23c0 21-12 36-30 45C19 76 7 61 7 40V17Z" fill="#031221" stroke="url(#g)" stroke-width="5" filter="url(#glow)"/>
   <path d="M18 46h10l5-9 7 15 6-11h11" fill="none" stroke="#168cff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
);

const secureShieldUri = svgUri(
  '0 0 54 62',
  `<path d="M27 3 49 13v17c0 16-9 27-22 34C14 57 5 46 5 30V13Z" fill="#021c18" stroke="#20ef70" stroke-width="3"/><path d="m17 31 7 7 14-16" fill="none" stroke="#20ef70" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
);

const btcUri = svgUri(
  '0 0 64 64',
  `<circle cx="32" cy="32" r="30" fill="#ff9814"/><path d="M39 16c8 2 9 12 3 16 9 3 8 16-2 19M22 15h14c10 0 11 14 1 16H22m0 0h16c11 0 11 17 0 17H22m7-37v42m8-42v42" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
);

function isBitcoinAddress(value: string) {
  const address = value.trim();
  return /^(bc1)[ac-hj-np-z02-9]{11,71}$/i.test(address) || /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
}

function normalizeAdapterAddress(value: string) {
  const trimmed = value.trim();
  const prefixed = trimmed.match(/^BTC:(.+)$/i);
  return prefixed ? prefixed[1] : trimmed;
}

function SegmentTabs({ active, onChange }: { active: TabName; onChange(value: TabName): void }) {
  return (
    <View style={styles.tabs}>
      {(['Address', 'QR Code'] as TabName[]).map((tab) => {
        const selected = tab === active;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={tab}
            onPress={() => onChange(tab)}
            style={({ pressed }) => [styles.tab, selected && styles.tabActive, pressed && styles.pressed]}
          >
            <Text style={[styles.tabIcon, selected && styles.tabIconActive]}>{tab === 'Address' ? '▣' : '▦'}</Text>
            <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ActionButton({ icon, label, onPress }: { icon: string; label: string; onPress(): void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}>
      <Text style={styles.outlineIcon}>{icon}</Text>
      <Text style={styles.outlineText}>{label}</Text>
    </Pressable>
  );
}

export default function ReceiveBitcoinScreen() {
  const navigation = useNavigation<any>();
  const { compact, width } = useNomadLayout();
  const { getReceiveAddress } = useNomadWallet();
  const { security } = useNomadSecurity();
  const [tab, setTab] = useState<TabName>('QR Code');
  const [address, setAddress] = useState(PREVIEW_BTC_ADDRESS);
  const [source, setSource] = useState<AddressSource>('loading');
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const paymentUri = useMemo(() => `bitcoin:${address}`, [address]);
  const qrSize = Math.max(220, Math.min(330, width - (compact ? 74 : 120)));
  const systemLabel = security.status === 'frozen' ? 'FROZEN' : security.status === 'warning' ? 'REVIEW' : 'SECURE';
  const systemColor = security.status === 'frozen' ? C.red : security.status === 'warning' ? C.yellow : C.green;

  const loadAddress = useCallback(async () => {
    try {
      setSource('loading');
      setError(null);
      setFeedback('');
      const raw = await getReceiveAddress('BTC');
      const normalized = normalizeAdapterAddress(raw);
      if (!isBitcoinAddress(normalized)) {
        setAddress(PREVIEW_BTC_ADDRESS);
        setSource('preview');
        setError('The connected wallet did not return a valid Bitcoin Mainnet address. A clearly labelled preview address is shown.');
        return;
      }
      setAddress(normalized);
      setSource('live');
    } catch (nextError) {
      setAddress(PREVIEW_BTC_ADDRESS);
      setSource('preview');
      setError(nextError instanceof Error ? nextError.message : 'Unable to load the Bitcoin receive address.');
    }
  }, [getReceiveAddress]);

  useEffect(() => {
    void loadAddress();
  }, [loadAddress]);

  const copyText = async (value: string, success: string) => {
    try {
      const runtime = globalThis as unknown as {
        navigator?: { clipboard?: { writeText(text: string): Promise<void> } };
      };
      if (Platform.OS === 'web' && runtime.navigator?.clipboard) {
        await runtime.navigator.clipboard.writeText(value);
        setFeedback(success);
        return;
      }
      await Share.share({ message: value });
      setFeedback('Native share sheet opened');
    } catch {
      setFeedback('Unable to copy automatically. Press and hold the address to copy it manually.');
    }
  };

  const shareAddress = async () => {
    try {
      await Share.share({
        title: 'Nomad Bitcoin receive address',
        message: `Send Bitcoin to my Nomad wallet:\n${address}\n\nPayment request: ${paymentUri}`,
      });
      setFeedback('Share sheet opened');
    } catch {
      setFeedback('Unable to open sharing');
    }
  };

  return (
    <NomadPage maxWidth={900}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, compact && styles.titleCompact]}>Receive Bitcoin</Text>
            <Text style={styles.subtitle}>Receive BTC to your wallet</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => navigation.navigate('SecurityCenter')} style={styles.systemPill}>
            <Image source={{ uri: secureShieldUri }} style={styles.systemShield} />
            {!compact ? (
              <View>
                <Text style={styles.systemTop}>All Systems</Text>
                <Text style={[styles.systemBottom, { color: systemColor }]}>{systemLabel}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable accessibilityLabel="Open help" onPress={() => navigation.navigate('Settings')} style={styles.helpButton}>
            <Text style={styles.helpText}>?</Text>
          </Pressable>
        </View>
      </View>

      <SegmentTabs active={tab} onChange={(next) => { setTab(next); setFeedback(''); }} />

      <Panel style={[styles.receivePanel, { padding: compact ? 16 : 24 }]}>
        {tab === 'QR Code' ? (
          <View style={styles.qrSection}>
            <View style={styles.qrFrame}>
              <NomadQRCode payload={paymentUri} size={qrSize} />
              <View style={styles.qrLogoPlate}>
                <Image source={{ uri: shieldUri }} style={styles.qrLogo} />
              </View>
            </View>
            <View style={styles.verifiedRow}>
              <Text style={[styles.statusDot, { color: source === 'live' ? C.green : C.yellow }]}>●</Text>
              <Text style={styles.verifiedText}>
                {source === 'loading' ? 'Loading your BTC address…' : source === 'live' ? 'This QR code contains your live BTC payment URI' : 'Preview QR code — live BTC address unavailable'}
              </Text>
            </View>
            <Text style={styles.shareHint}>Scan this code to open a Bitcoin Mainnet payment request</Text>
          </View>
        ) : (
          <View style={styles.addressHero}>
            <Image source={{ uri: btcUri }} style={styles.btcHeroIcon} />
            <Text style={styles.addressHeroTitle}>Your Bitcoin Address</Text>
            <Text style={styles.addressHeroSub}>Bitcoin Mainnet • Tap Copy Address before sharing</Text>
            <Text selectable style={styles.largeAddress}>{source === 'loading' ? 'Loading wallet address…' : address}</Text>
            <View style={styles.uriBox}>
              <Text style={styles.uriLabel}>Bitcoin payment URI</Text>
              <Text selectable numberOfLines={2} style={styles.uriText}>{paymentUri}</Text>
            </View>
            <Pressable onPress={() => void copyText(paymentUri, 'Bitcoin payment URI copied')} style={styles.copyPaymentButton}>
              <Text style={styles.copyPaymentIcon}>▣</Text>
              <Text style={styles.copyPaymentText}>Copy Payment Request</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.addressBox}>
          <View style={styles.addressHeadingRow}>
            <View>
              <Text style={styles.addressLabel}>Your Bitcoin Address</Text>
              <Text style={styles.networkLabel}>Bitcoin Mainnet</Text>
            </View>
            <View style={[styles.sourcePill, source === 'live' ? styles.sourceLive : styles.sourcePreview]}>
              <Text style={[styles.sourceText, { color: source === 'live' ? C.green : C.yellow }]}>{source === 'live' ? 'LIVE' : source === 'loading' ? 'LOADING' : 'PREVIEW'}</Text>
            </View>
          </View>
          <View style={styles.addressLine}>
            <Text selectable numberOfLines={compact ? 3 : 2} style={styles.addressText}>{source === 'loading' ? 'Loading wallet address…' : address}</Text>
            <Pressable accessibilityLabel="Copy Bitcoin address" onPress={() => void copyText(address, 'Bitcoin address copied')} style={styles.copySquare}>
              <Text style={styles.copyIcon}>▣</Text>
            </Pressable>
          </View>
          {error ? (
            <View style={styles.errorRow}>
              <Text style={styles.warningText}>{error}</Text>
              <Pressable onPress={() => void loadAddress()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
            </View>
          ) : null}
          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        </View>

        <View style={styles.actionRow}>
          <ActionButton icon="⌯" label="Share" onPress={() => void shareAddress()} />
          <ActionButton icon="▣" label="Copy Address" onPress={() => void copyText(address, 'Bitcoin address copied')} />
        </View>

        <View style={styles.importantBox}>
          <View style={styles.infoIcon}><Text style={styles.infoText}>i</Text></View>
          <View style={styles.importantCopy}>
            <Text style={styles.importantTitle}>Important</Text>
            <Text style={styles.importantText}>Only send Bitcoin (BTC) on Bitcoin Mainnet to this address. Sending another asset or using the wrong network may cause permanent loss.</Text>
          </View>
        </View>
      </Panel>

      <Pressable onPress={() => navigation.navigate('Wallets')} style={({ pressed }) => [styles.historyCard, pressed && styles.pressed]}>
        <View style={styles.historyIcon}><Text style={styles.historyIconText}>↺</Text></View>
        <View style={styles.historyCopy}>
          <Text style={styles.historyTitle}>Transaction History</Text>
          <Text style={styles.historySub}>View incoming Bitcoin activity in Wallets</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <BottomNav
        active="Wallets"
        items={[
          ['⌂', 'Home', 'Portfolio'],
          ['▣', 'Wallets', 'Wallets'],
          ['✈', 'Travel', 'TravelMode'],
          ['◇', 'Security', 'SecurityCenter'],
          ['•••', 'More', 'Settings'],
        ]}
      />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  header: { minHeight: 72, marginBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headerLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 38, height: 50, alignItems: 'flex-start', justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 46, lineHeight: 46, fontWeight: '200' },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { color: '#fff', fontSize: 31, fontWeight: '900' },
  titleCompact: { fontSize: 25 },
  subtitle: { color: '#c5d0df', fontSize: 13, marginTop: 3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  systemPill: { minHeight: 44, borderWidth: 1, borderColor: '#0a3c64', borderRadius: 999, backgroundColor: 'rgba(3,16,30,.96)', paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
  systemShield: { width: 27, height: 32 },
  systemTop: { color: '#d9e5f4', fontSize: 9 },
  systemBottom: { fontSize: 10, fontWeight: '900' },
  helpButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#0a3c64', alignItems: 'center', justifyContent: 'center' },
  helpText: { color: C.green, fontSize: 22, fontWeight: '900' },
  tabs: { minHeight: 64, marginBottom: 18, borderWidth: 1, borderColor: C.border, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', backgroundColor: 'rgba(2,10,20,.92)' },
  tab: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  tabActive: { borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(11,76,178,.62)' },
  tabIcon: { color: '#aebbd0', fontSize: 23 },
  tabIconActive: { color: C.blue },
  tabText: { color: '#d9e4f2', fontSize: 15 },
  tabTextActive: { color: '#fff', fontWeight: '900' },
  receivePanel: { alignItems: 'stretch' },
  qrSection: { alignItems: 'center' },
  qrFrame: { alignSelf: 'center', position: 'relative', borderRadius: 18, borderWidth: 10, borderColor: '#fff', backgroundColor: '#fff', overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 0 36px rgba(22,140,255,.44)' } as any, default: { shadowColor: C.blue, shadowOpacity: 0.7, shadowRadius: 18 } }) },
  qrLogoPlate: { position: 'absolute', left: '50%', top: '50%', width: 42, height: 46, marginLeft: -21, marginTop: -23, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  qrLogo: { width: 34, height: 39 },
  verifiedRow: { marginTop: 23, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  statusDot: { fontSize: 12 },
  verifiedText: { flexShrink: 1, color: '#fff', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  shareHint: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  addressHero: { alignItems: 'center', paddingVertical: 8 },
  btcHeroIcon: { width: 76, height: 76 },
  addressHeroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 13 },
  addressHeroSub: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 6 },
  largeAddress: { color: '#fff', fontSize: 17, lineHeight: 25, textAlign: 'center', marginTop: 21 },
  uriBox: { width: '100%', marginTop: 18, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.panel2, padding: 14 },
  uriLabel: { color: C.muted, fontSize: 10 },
  uriText: { color: '#dce8f6', fontSize: 12, lineHeight: 18, marginTop: 6 },
  copyPaymentButton: { minHeight: 52, marginTop: 13, borderWidth: 1, borderColor: C.blue, borderRadius: 11, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  copyPaymentIcon: { color: C.blue, fontSize: 21 },
  copyPaymentText: { color: C.blue, fontSize: 13, fontWeight: '900' },
  addressBox: { marginTop: 22, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel2, padding: 15 },
  addressHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  addressLabel: { color: '#fff', fontSize: 13, fontWeight: '800' },
  networkLabel: { color: C.muted, fontSize: 10, marginTop: 4 },
  sourcePill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  sourceLive: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.06)' },
  sourcePreview: { borderColor: C.yellow, backgroundColor: 'rgba(255,189,24,.06)' },
  sourceText: { fontSize: 8, fontWeight: '900' },
  addressLine: { flexDirection: 'row', alignItems: 'center', marginTop: 13 },
  addressText: { flex: 1, minWidth: 0, color: '#fff', fontSize: 14, lineHeight: 21 },
  copySquare: { width: 45, height: 45, borderRadius: 9, borderWidth: 1, borderColor: C.blue, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  copyIcon: { color: C.blue, fontSize: 23 },
  errorRow: { marginTop: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  warningText: { flex: 1, minWidth: 0, color: C.yellow, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.yellow, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.yellow, fontSize: 9, fontWeight: '900' },
  feedback: { color: C.green, fontSize: 10, marginTop: 9 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  outlineButton: { flex: 1, minWidth: 0, minHeight: 56, borderWidth: 1, borderColor: C.blue, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 8 },
  outlineIcon: { color: C.blue, fontSize: 22 },
  outlineText: { color: C.blue, fontSize: 13, fontWeight: '800' },
  importantBox: { marginTop: 20, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel2, padding: 15, flexDirection: 'row', alignItems: 'flex-start' },
  infoIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(22,140,255,.08)', alignItems: 'center', justifyContent: 'center' },
  infoText: { color: C.blue, fontSize: 21, fontWeight: '900' },
  importantCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  importantTitle: { color: C.blue, fontSize: 15, fontWeight: '900' },
  importantText: { color: '#d5deeb', fontSize: 12, lineHeight: 19, marginTop: 6 },
  historyCard: { minHeight: 80, marginTop: 18, borderWidth: 1, borderColor: C.border, borderRadius: 16, backgroundColor: C.panel, padding: 14, flexDirection: 'row', alignItems: 'center' },
  historyIcon: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(22,140,255,.08)', alignItems: 'center', justifyContent: 'center' },
  historyIconText: { color: C.blue, fontSize: 25 },
  historyCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  historyTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  historySub: { color: C.muted, fontSize: 11, marginTop: 5 },
  chevron: { color: '#b5c3d5', fontSize: 31 },
});
