import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useNomadSecurity, useNomadWallet } from '../nomad';
import { BottomNav, C, NomadBrandMark, NomadPage, Panel, useNomadLayout } from '../ui/NomadShell';
import { NomadQRCode } from '../ui/NomadQRCode';

const PREVIEW_BTC_ADDRESS = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

type TabName = 'Address' | 'QR Code';
type AddressSource = 'loading' | 'live' | 'preview';
type ReceiveIconKind = 'address' | 'bitcoin' | 'copy' | 'history' | 'info' | 'qr' | 'share';

function ReceiveIcon({ kind, color = C.blue, size = 24 }: { kind: ReceiveIconKind; color?: string; size?: number }) {
  const stroke = { stroke: color, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let artwork: React.ReactNode;

  switch (kind) {
    case 'address':
      artwork = <><Rect x="8" y="12" width="31" height="25" rx="4" {...stroke} /><Path d="M28 12V8h12v21h-5" {...stroke} /><Path d="M23 22h10M28 17v10" {...stroke} /></>;
      break;
    case 'bitcoin':
      artwork = <><Circle cx="24" cy="24" r="21" fill="#ff9814" /><Path d="M28 11c7 2 7 9 2 12 8 2 7 12-1 14M16 13h12c8 0 8 10 0 11H16m0 0h13c9 0 9 12 0 12H16m7-27v30m6-30v30" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></>;
      break;
    case 'copy':
      artwork = <><Rect x="15" y="7" width="24" height="29" rx="3" {...stroke} /><Rect x="8" y="14" width="24" height="27" rx="3" fill="#03101e" {...stroke} /></>;
      break;
    case 'history':
      artwork = <><Path d="M12 17a16 16 0 1 1-2 14" {...stroke} /><Path d="M12 8v9H3" {...stroke} /><Path d="M24 14v11l8 5" {...stroke} /></>;
      break;
    case 'info':
      artwork = <><Circle cx="24" cy="24" r="18" {...stroke} /><Path d="M24 21v12" {...stroke} /><Circle cx="24" cy="15" r="1.8" fill={color} /></>;
      break;
    case 'qr':
      artwork = <><Path d="M7 17V7h10M31 7h10v10M7 31v10h10M41 31v10H31" {...stroke} /><Rect x="13" y="13" width="9" height="9" {...stroke} /><Rect x="27" y="13" width="8" height="8" {...stroke} /><Rect x="13" y="27" width="8" height="8" {...stroke} /><Path d="M28 27h4v4h4v5h-9v-4" {...stroke} /></>;
      break;
    default:
      artwork = <><Circle cx="13" cy="24" r="4" {...stroke} /><Circle cx="35" cy="12" r="4" {...stroke} /><Circle cx="35" cy="36" r="4" {...stroke} /><Path d="m17 22 14-8M17 26l14 8" {...stroke} /></>;
  }

  return <Svg accessibilityLabel={`${kind} icon`} width={size} height={size} viewBox="0 0 48 48" fill="none">{artwork}</Svg>;
}

function SecurityShield({ color, size = 25 }: { color: string; size?: number }) {
  return (
    <Svg accessibilityLabel="Security status shield" width={size} height={size * 1.12} viewBox="0 0 50 56" fill="none">
      <Path d="M25 3 45 12v15c0 14-8 24-20 30C13 51 5 41 5 27V12Z" fill="#031a1d" stroke={color} strokeWidth="3" />
      <Path d="m15 27 7 7 13-16" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BackArrow({ size = 24 }: { size?: number }) {
  return (
    <Svg accessibilityLabel="Back" width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path d="M30 8 14 24l16 16M15 24h26" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function VerifiedShield({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg accessibilityLabel="Address status" width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path d="M24 4 41 12v12c0 11-6 18-17 23C13 42 7 35 7 24V12Z" fill={`${color}18`} stroke={color} strokeWidth="2.7" />
      <Path d="m16 24 6 6 11-13" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function isBitcoinAddress(value: string) {
  const address = value.trim();
  return /^(bc1)[ac-hj-np-z02-9]{11,71}$/i.test(address) || /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
}

function normalizeAdapterAddress(value: string) {
  const trimmed = value.trim();
  const prefixed = trimmed.match(/^BTC:(.+)$/i);
  return prefixed ? prefixed[1] : trimmed;
}

function SegmentTabs({ active, compact, onChange }: { active: TabName; compact: boolean; onChange(value: TabName): void }) {
  return (
    <View accessibilityRole="tablist" style={[styles.tabs, compact && styles.tabsCompact]}>
      {(['Address', 'QR Code'] as TabName[]).map((tab) => {
        const selected = tab === active;
        return (
          <Pressable
            accessibilityLabel={`Show ${tab}`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            aria-selected={selected}
            key={tab}
            onPress={() => onChange(tab)}
            style={({ pressed }) => [styles.tab, selected && styles.tabActive, pressed && styles.pressed]}
          >
            <ReceiveIcon kind={tab === 'Address' ? 'address' : 'qr'} color={selected ? C.blue : C.muted} size={compact ? 18 : 24} />
            <Text style={[styles.tabText, compact && styles.tabTextCompact, selected && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ActionButton({ compact, icon, label, onPress }: { compact: boolean; icon: 'share' | 'copy'; label: string; onPress(): void }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.outlineButton, compact && styles.outlineButtonCompact, pressed && styles.pressed]}>
      <ReceiveIcon kind={icon} size={compact ? 20 : 25} />
      <Text style={[styles.outlineText, compact && styles.outlineTextCompact]}>{label}</Text>
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
  const qrSize = compact ? Math.max(202, Math.min(236, width - 86)) : Math.max(250, Math.min(340, width - 150));
  const systemLabel = security.status === 'frozen' ? 'FROZEN' : security.status === 'warning' ? 'REVIEW' : 'SECURE';
  const systemColor = security.status === 'frozen' ? C.red : security.status === 'warning' ? C.yellow : C.green;
  const addressColor = source === 'live' ? C.green : C.yellow;

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
        setError('Live wallet address unavailable. The displayed address is preview data only.');
        return;
      }
      setAddress(normalized);
      setSource('live');
    } catch (nextError) {
      setAddress(PREVIEW_BTC_ADDRESS);
      setSource('preview');
      setError(nextError instanceof Error ? nextError.message : 'Unable to load the live Bitcoin receive address.');
    }
  }, [getReceiveAddress]);

  useEffect(() => {
    void loadAddress();
  }, [loadAddress]);

  const copyText = async (value: string, success: string) => {
    try {
      const runtime = globalThis as unknown as { navigator?: { clipboard?: { writeText(text: string): Promise<void> } } };
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
      <View style={[styles.header, compact && styles.headerCompact]}>
        <View style={styles.headerLeft}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => navigation.goBack()} style={[styles.backButton, compact && styles.backButtonCompact]}>
            <BackArrow size={compact ? 21 : 27} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={[styles.title, compact && styles.titleCompact]}>Receive Bitcoin</Text>
            <Text numberOfLines={1} style={[styles.subtitle, compact && styles.subtitleCompact]}>Receive BTC to your wallet</Text>
          </View>
        </View>
        <View style={[styles.headerRight, compact && styles.headerRightCompact]}>
          <Pressable accessibilityLabel={`Open Security Center. All Systems ${systemLabel}`} accessibilityRole="button" onPress={() => navigation.navigate('SecurityCenter')} style={[styles.systemPill, compact && styles.systemPillCompact]}>
            <SecurityShield color={systemColor} size={compact ? 20 : 26} />
            <View>
              <Text style={[styles.systemTop, compact && styles.systemTopCompact]}>All Systems</Text>
              <Text style={[styles.systemBottom, compact && styles.systemBottomCompact, { color: systemColor }]}>{systemLabel}</Text>
            </View>
          </Pressable>
          <Pressable accessibilityLabel="Open help" accessibilityRole="button" onPress={() => navigation.navigate('Settings')} style={[styles.helpButton, compact && styles.helpButtonCompact]}>
            <Text style={[styles.helpText, { color: systemColor }]}>?</Text>
          </Pressable>
        </View>
      </View>

      <SegmentTabs active={tab} compact={compact} onChange={(next) => { setTab(next); setFeedback(''); }} />

      <Panel style={[styles.receivePanel, compact && styles.receivePanelCompact]}>
        {tab === 'QR Code' ? (
          <View style={styles.qrSection}>
            <View style={[styles.qrFrame, compact && styles.qrFrameCompact]}>
              <NomadQRCode payload={paymentUri} size={qrSize} />
              <View style={[styles.qrLogoPlate, compact && styles.qrLogoPlateCompact]}>
                <NomadBrandMark size={compact ? 44 : 54} />
              </View>
            </View>
            <View style={[styles.verifiedRow, compact && styles.verifiedRowCompact]}>
              <VerifiedShield color={addressColor} size={compact ? 18 : 22} />
              <Text style={[styles.verifiedText, compact && styles.verifiedTextCompact]}>
                {source === 'loading' ? 'Loading your BTC address…' : source === 'live' ? 'This is your BTC address' : 'Preview BTC address — live wallet unavailable'}
              </Text>
            </View>
            <Text style={[styles.shareHint, compact && styles.shareHintCompact]}>Share this address to receive payments</Text>
          </View>
        ) : (
          <View style={[styles.addressHero, compact && styles.addressHeroCompact]}>
            <ReceiveIcon kind="bitcoin" size={compact ? 47 : 68} />
            <Text style={[styles.addressHeroTitle, compact && styles.addressHeroTitleCompact]}>Your Bitcoin Address</Text>
            <Text style={[styles.addressHeroSub, compact && styles.addressHeroSubCompact]}>Bitcoin Mainnet · Tap Copy Address before sharing</Text>
            <Text selectable style={[styles.largeAddress, compact && styles.largeAddressCompact]}>{source === 'loading' ? 'Loading wallet address…' : address}</Text>
            <View style={[styles.uriBox, compact && styles.uriBoxCompact]}>
              <Text style={styles.uriLabel}>Bitcoin payment URI</Text>
              <Text selectable numberOfLines={2} style={[styles.uriText, compact && styles.uriTextCompact]}>{paymentUri}</Text>
            </View>
            <Pressable accessibilityLabel="Copy Bitcoin payment request" accessibilityRole="button" onPress={() => void copyText(paymentUri, 'Bitcoin payment URI copied')} style={[styles.copyPaymentButton, compact && styles.copyPaymentButtonCompact]}>
              <ReceiveIcon kind="copy" size={compact ? 19 : 23} />
              <Text style={[styles.copyPaymentText, compact && styles.copyPaymentTextCompact]}>Copy Payment Request</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.addressBox, compact && styles.addressBoxCompact]}>
          <View style={styles.addressHeadingRow}>
            <View>
              <Text style={[styles.addressLabel, compact && styles.addressLabelCompact]}>Your Bitcoin Address</Text>
              <Text style={[styles.networkLabel, compact && styles.networkLabelCompact]}>Bitcoin Mainnet</Text>
            </View>
            <View style={[styles.sourcePill, source === 'live' ? styles.sourceLive : styles.sourcePreview]}>
              <Text style={[styles.sourceText, { color: addressColor }]}>{source === 'live' ? 'LIVE' : source === 'loading' ? 'LOADING' : 'PREVIEW'}</Text>
            </View>
          </View>
          <View style={[styles.addressLine, compact && styles.addressLineCompact]}>
            <Text selectable numberOfLines={compact ? 2 : 1} style={[styles.addressText, compact && styles.addressTextCompact]}>{source === 'loading' ? 'Loading wallet address…' : address}</Text>
            <Pressable accessibilityLabel="Copy Bitcoin address" accessibilityRole="button" onPress={() => void copyText(address, 'Bitcoin address copied')} style={[styles.copySquare, compact && styles.copySquareCompact]}>
              <ReceiveIcon kind="copy" size={compact ? 19 : 24} />
            </Pressable>
          </View>
          {error ? (
            <View style={[styles.errorRow, compact && styles.errorRowCompact]}>
              <Text style={[styles.warningText, compact && styles.warningTextCompact]}>{error}</Text>
              <Pressable accessibilityLabel="Retry loading address" accessibilityRole="button" onPress={() => void loadAddress()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
            </View>
          ) : null}
          {feedback ? <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback}</Text> : null}
        </View>

        <View style={[styles.actionRow, compact && styles.actionRowCompact]}>
          <ActionButton compact={compact} icon="share" label="Share" onPress={() => void shareAddress()} />
          <ActionButton compact={compact} icon="copy" label="Copy Address" onPress={() => void copyText(address, 'Bitcoin address copied')} />
        </View>

        <View style={[styles.importantBox, compact && styles.importantBoxCompact]}>
          <View style={[styles.infoIcon, compact && styles.infoIconCompact]}><ReceiveIcon kind="info" size={compact ? 24 : 31} /></View>
          <View style={[styles.importantCopy, compact && styles.importantCopyCompact]}>
            <Text style={[styles.importantTitle, compact && styles.importantTitleCompact]}>Important</Text>
            <Text style={[styles.importantText, compact && styles.importantTextCompact]}>Only send BTC to this address. Sending other assets may result in permanent loss.</Text>
          </View>
        </View>
      </Panel>

      <Pressable accessibilityLabel="Open incoming Bitcoin transaction history" accessibilityRole="button" onPress={() => navigation.navigate('Wallets')} style={({ pressed }) => [styles.historyCard, compact && styles.historyCardCompact, pressed && styles.pressed]}>
        <View style={[styles.historyIcon, compact && styles.historyIconCompact]}><ReceiveIcon kind="history" size={compact ? 24 : 31} /></View>
        <View style={[styles.historyCopy, compact && styles.historyCopyCompact]}>
          <Text style={[styles.historyTitle, compact && styles.historyTitleCompact]}>Transaction History</Text>
          <Text style={[styles.historySub, compact && styles.historySubCompact]}>View all incoming transactions</Text>
        </View>
        <Text style={[styles.chevron, compact && styles.chevronCompact]}>›</Text>
      </Pressable>

      <BottomNav
        active="Receive"
        items={[
          ['⌂', 'Home', 'Portfolio'],
          ['▣', 'Wallets', 'Wallets'],
          ['⌯', 'Send', 'SendBitcoin'],
          ['▦', 'Receive', 'ReceiveBitcoin'],
          ['✈', 'Travel', 'TravelMode'],
          ['◇', 'Security', 'SecurityCenter'],
        ]}
      />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  header: { minHeight: 72, marginBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headerCompact: { minHeight: 50, marginBottom: 10, gap: 5 },
  headerLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 46, height: 50, alignItems: 'flex-start', justifyContent: 'center' },
  backButtonCompact: { width: 30, height: 38 },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { color: '#fff', fontSize: 31, fontWeight: '900' },
  titleCompact: { fontSize: 18, lineHeight: 22 },
  subtitle: { color: '#c5d0df', fontSize: 13, marginTop: 3 },
  subtitleCompact: { fontSize: 9, lineHeight: 12, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRightCompact: { gap: 5 },
  systemPill: { minHeight: 46, borderWidth: 1, borderColor: '#0a3c64', borderRadius: 999, backgroundColor: 'rgba(3,16,30,.96)', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  systemPillCompact: { minHeight: 38, paddingHorizontal: 7, gap: 5 },
  systemTop: { color: '#d9e5f4', fontSize: 10 },
  systemTopCompact: { fontSize: 8, lineHeight: 10 },
  systemBottom: { fontSize: 11, fontWeight: '900' },
  systemBottomCompact: { fontSize: 9, lineHeight: 11 },
  helpButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#0a3c64', alignItems: 'center', justifyContent: 'center' },
  helpButtonCompact: { width: 34, height: 34, borderRadius: 17 },
  helpText: { fontSize: 22, fontWeight: '900' },
  tabs: { minHeight: 64, marginBottom: 18, borderWidth: 1, borderColor: C.border, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', backgroundColor: 'rgba(2,10,20,.92)' },
  tabsCompact: { minHeight: 40, marginBottom: 10, borderRadius: 9 },
  tab: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  tabActive: { borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(11,76,178,.62)' },
  tabText: { color: '#d9e4f2', fontSize: 15 },
  tabTextCompact: { fontSize: 11 },
  tabTextActive: { color: '#fff', fontWeight: '900' },
  receivePanel: { alignItems: 'stretch', padding: 24 },
  receivePanelCompact: { padding: 10, borderRadius: 13 },
  qrSection: { alignItems: 'center' },
  qrFrame: { alignSelf: 'center', position: 'relative', borderRadius: 18, borderWidth: 10, borderColor: '#fff', backgroundColor: '#fff', overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 0 36px rgba(22,140,255,.5)' } as any, default: { shadowColor: C.blue, shadowOpacity: 0.7, shadowRadius: 18 } }) },
  qrFrameCompact: { borderWidth: 7, borderRadius: 13 },
  qrLogoPlate: { position: 'absolute', left: '50%', top: '50%', width: 68, height: 74, marginLeft: -34, marginTop: -37, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  qrLogoPlateCompact: { width: 56, height: 62, marginLeft: -28, marginTop: -31, borderRadius: 10 },
  verifiedRow: { marginTop: 23, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  verifiedRowCompact: { marginTop: 13, gap: 6 },
  verifiedText: { flexShrink: 1, color: '#fff', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  verifiedTextCompact: { fontSize: 11 },
  shareHint: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  shareHintCompact: { fontSize: 9, marginTop: 4 },
  addressHero: { alignItems: 'center', paddingVertical: 8 },
  addressHeroCompact: { paddingVertical: 3 },
  addressHeroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 13 },
  addressHeroTitleCompact: { fontSize: 15, marginTop: 8 },
  addressHeroSub: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 6 },
  addressHeroSubCompact: { fontSize: 9, marginTop: 3 },
  largeAddress: { color: '#fff', fontSize: 17, lineHeight: 25, textAlign: 'center', marginTop: 21 },
  largeAddressCompact: { fontSize: 12, lineHeight: 18, marginTop: 12 },
  uriBox: { width: '100%', marginTop: 18, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.panel2, padding: 14 },
  uriBoxCompact: { marginTop: 10, borderRadius: 8, padding: 9 },
  uriLabel: { color: C.muted, fontSize: 9 },
  uriText: { color: '#dce8f6', fontSize: 12, lineHeight: 18, marginTop: 6 },
  uriTextCompact: { fontSize: 9, lineHeight: 13, marginTop: 3 },
  copyPaymentButton: { minHeight: 52, marginTop: 13, borderWidth: 1, borderColor: C.blue, borderRadius: 11, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  copyPaymentButtonCompact: { minHeight: 40, marginTop: 9, borderRadius: 8 },
  copyPaymentText: { color: C.blue, fontSize: 13, fontWeight: '900' },
  copyPaymentTextCompact: { fontSize: 10 },
  addressBox: { marginTop: 22, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel2, padding: 15 },
  addressBoxCompact: { marginTop: 12, borderRadius: 9, padding: 10 },
  addressHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  addressLabel: { color: '#fff', fontSize: 13, fontWeight: '800' },
  addressLabelCompact: { fontSize: 10 },
  networkLabel: { color: C.muted, fontSize: 10, marginTop: 4 },
  networkLabelCompact: { fontSize: 8, marginTop: 2 },
  sourcePill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  sourceLive: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.06)' },
  sourcePreview: { borderColor: C.yellow, backgroundColor: 'rgba(255,189,24,.06)' },
  sourceText: { fontSize: 8, fontWeight: '900' },
  addressLine: { flexDirection: 'row', alignItems: 'center', marginTop: 13 },
  addressLineCompact: { marginTop: 7 },
  addressText: { flex: 1, minWidth: 0, color: '#fff', fontSize: 14, lineHeight: 21 },
  addressTextCompact: { fontSize: 11, lineHeight: 15 },
  copySquare: { width: 45, height: 45, borderRadius: 9, borderWidth: 1, borderColor: C.blue, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  copySquareCompact: { width: 32, height: 32, borderRadius: 7, marginLeft: 8 },
  errorRow: { marginTop: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorRowCompact: { marginTop: 7 },
  warningText: { flex: 1, minWidth: 0, color: C.yellow, fontSize: 10, lineHeight: 15 },
  warningTextCompact: { fontSize: 8, lineHeight: 11 },
  retryButton: { borderWidth: 1, borderColor: C.yellow, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 },
  retryText: { color: C.yellow, fontSize: 8, fontWeight: '900' },
  feedback: { color: C.green, fontSize: 9, marginTop: 7 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionRowCompact: { marginTop: 10, gap: 10 },
  outlineButton: { flex: 1, minWidth: 0, minHeight: 56, borderWidth: 1, borderColor: C.blue, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 8 },
  outlineButtonCompact: { minHeight: 44, borderRadius: 8, gap: 6 },
  outlineText: { color: C.blue, fontSize: 13, fontWeight: '800' },
  outlineTextCompact: { fontSize: 11 },
  importantBox: { marginTop: 20, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel2, padding: 15, flexDirection: 'row', alignItems: 'flex-start' },
  importantBoxCompact: { marginTop: 10, borderRadius: 9, padding: 10 },
  infoIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(22,140,255,.08)', alignItems: 'center', justifyContent: 'center' },
  infoIconCompact: { width: 30, height: 30, borderRadius: 15 },
  importantCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  importantCopyCompact: { marginLeft: 8 },
  importantTitle: { color: C.blue, fontSize: 15, fontWeight: '900' },
  importantTitleCompact: { fontSize: 11 },
  importantText: { color: '#d5deeb', fontSize: 12, lineHeight: 19, marginTop: 6 },
  importantTextCompact: { fontSize: 9, lineHeight: 14, marginTop: 3 },
  historyCard: { minHeight: 80, marginTop: 18, borderWidth: 1, borderColor: C.border, borderRadius: 16, backgroundColor: C.panel, padding: 14, flexDirection: 'row', alignItems: 'center' },
  historyCardCompact: { minHeight: 58, marginTop: 10, borderRadius: 10, padding: 9 },
  historyIcon: { width: 50, height: 50, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(22,140,255,.08)', alignItems: 'center', justifyContent: 'center' },
  historyIconCompact: { width: 38, height: 38, borderRadius: 9 },
  historyCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  historyCopyCompact: { marginLeft: 9 },
  historyTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  historyTitleCompact: { fontSize: 11 },
  historySub: { color: C.muted, fontSize: 11, marginTop: 5 },
  historySubCompact: { fontSize: 9, marginTop: 3 },
  chevron: { color: '#b5c3d5', fontSize: 31 },
  chevronCompact: { fontSize: 24 },
});
