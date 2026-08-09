import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useNomadRecovery, useNomadSecurity, useNomadTravel, useNomadWallet } from '../nomad';
import { useAppState } from '../state/appState';
import { BottomNav, C, NomadBrandMark, NomadPage, Panel, ProgressBar, useNomadLayout } from '../ui/NomadShell';

type RouteName =
  | 'Portfolio'
  | 'Wallets'
  | 'SendBitcoin'
  | 'ReceiveBitcoin'
  | 'Swap'
  | 'TravelMode'
  | 'SecurityCenter'
  | 'Settings'
  | 'RecoveryCenter'
  | 'CreateOwnerAuthority'
  | 'NomadWatch'
  | 'VoltaireProtocols'
  | 'BlockPagesSafety';

type Asset = {
  symbol: string;
  amount: string;
  value: string;
  mark: string;
  tint: string;
  textColor?: string;
};

type EcosystemItem = {
  label: string;
  mark: string;
  color: string;
  route: RouteName;
};

function SecureShield({ size = 30 }: { size?: number }) {
  return (
    <Svg accessibilityLabel="Secure shield" width={size} height={size * 1.15} viewBox="0 0 54 62" fill="none">
      <Path d="M27 3 49 13v17c0 16-9 27-22 34C14 57 5 46 5 30V13Z" fill="#021c18" stroke={C.green} strokeWidth="3" />
      <Path d="m17 31 7 7 14-16" stroke={C.green} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PortfolioChart({ style }: { style?: any }) {
  return (
    <Svg accessibilityLabel="Portfolio value trend" width="100%" height="100%" viewBox="0 0 520 190" fill="none" style={style}>
      <Defs><LinearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="190"><Stop stopColor={C.blue} stopOpacity={0.4} /><Stop offset="1" stopColor={C.blue} stopOpacity={0} /></LinearGradient></Defs>
      <G opacity={0.16} stroke={C.blue}><Path d="M0 42h520M0 84h520M0 126h520M0 168h520" /><Path d="M80 0v190M170 0v190M260 0v190M350 0v190M440 0v190" /></G>
      <Path d="M8 165 C42 160 53 154 78 145 S116 148 145 131 S177 116 208 121 S243 98 273 89 S311 99 335 79 S370 62 396 70 S430 50 454 31 S488 45 512 11 L512 190 L8 190Z" fill="url(#portfolioFill)" />
      <Path d="M8 165 C42 160 53 154 78 145 S116 148 145 131 S177 116 208 121 S243 98 273 89 S311 99 335 79 S370 62 396 70 S430 50 454 31 S488 45 512 11" stroke={C.blue} strokeWidth="5" strokeLinecap="round" />
    </Svg>
  );
}

function WorldBackdrop({ style }: { style?: any }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 640 240" fill="none" style={style}>
      <Defs><LinearGradient id="worldGlow" x1="0" y1="0" x2="640" y2="240"><Stop stopColor={C.green} stopOpacity={0.12} /><Stop offset="1" stopColor={C.green} stopOpacity={0} /></LinearGradient></Defs>
      <Rect width="640" height="240" fill="url(#worldGlow)" />
      <G stroke={C.green} strokeOpacity={0.23} strokeWidth="1.4"><Path d="M86 92c54-36 128-52 196-42 74 11 121 55 190 57 54 2 88-20 122-37" /><Path d="M74 136c76-27 139-19 198 10 63 31 130 35 210 5 46-17 79-34 116-27" /><Ellipse cx="457" cy="130" rx="142" ry="81" /><Ellipse cx="457" cy="130" rx="92" ry="81" /><Ellipse cx="457" cy="130" rx="42" ry="81" /><Path d="M315 130h284M335 92h244M335 169h244" /></G>
      <G fill={C.green} opacity={0.3}><Circle cx="408" cy="103" r="3" /><Circle cx="438" cy="83" r="2" /><Circle cx="492" cy="104" r="2" /><Circle cx="535" cy="145" r="3" /><Circle cx="462" cy="166" r="2" /></G>
    </Svg>
  );
}

function ActionArtwork({ kind, size }: { kind: 'send' | 'receive' | 'swap' | 'travel'; size: number }) {
  return (
    <Svg accessibilityLabel={`${kind} action`} width={size} height={size} viewBox="0 0 64 64" fill="none">
      {kind === 'send' ? <><Circle cx="32" cy="32" r="26" fill="#06244a" stroke={C.blue} strokeWidth="3" /><Path d="M32 47V18m0 0L21 29m11-11 11 11" stroke={C.blue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></> : null}
      {kind === 'receive' ? <Path d="M32 9v36m0 0L19 32m13 13 13-13M15 54h34" stroke={C.blue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {kind === 'swap' ? <Path d="M13 22h36m0 0-9-9m9 9-9 9M51 43H15m0 0 9-9m-9 9 9 9" stroke={C.blue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {kind === 'travel' ? <><Path d="M10 39h44M15 26h34l-6-10H24l-5 10m-1 13-3 14h10l3-14m18 0 3 14h-10l-3-14" stroke={C.blue} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><Path d="M32 15V7" stroke={C.blue} strokeWidth="4" strokeLinecap="round" /></> : null}
    </Svg>
  );
}

const previewAssets: Asset[] = [
  { symbol: 'BTC', amount: '0.3567', value: '$22,123.10', mark: '₿', tint: '#ff9814' },
  { symbol: 'HBAR', amount: '3,250.00', value: '$1,250.25', mark: 'H', tint: '#6544e9' },
  { symbol: 'XRP', amount: '1,250.00', value: '$750.00', mark: 'X', tint: '#111821' },
  { symbol: 'XLM', amount: '5,200.00', value: '$310.40', mark: 'S', tint: '#0f7ff7' },
];

const assetVisuals: Record<string, Pick<Asset, 'mark' | 'tint' | 'textColor'>> = {
  BTC: { mark: '₿', tint: '#ff9814' },
  HBAR: { mark: 'H', tint: '#6544e9' },
  XRP: { mark: 'X', tint: '#111821' },
  XLM: { mark: 'S', tint: '#0f7ff7' },
  ETH: { mark: 'Ξ', tint: '#6574ca' },
  USDC: { mark: '$', tint: '#2775ca' },
  USDT: { mark: '₮', tint: '#26a17b' },
  DAI: { mark: 'D', tint: '#f5ac37' },
};

const ecosystem: EcosystemItem[] = [
  { label: 'Nomad', mark: 'N', color: C.blue, route: 'Portfolio' },
  { label: 'AutoDeFi', mark: 'A', color: C.blue, route: 'VoltaireProtocols' },
  { label: 'Reqrium', mark: 'R', color: C.purple, route: 'BlockPagesSafety' },
  { label: 'Sovereign\nPayroll', mark: '$', color: C.green, route: 'VoltaireProtocols' },
  { label: 'Guardian\nTrader', mark: 'G', color: C.green, route: 'VoltaireProtocols' },
  { label: 'Quantum\nLottery', mark: 'Q', color: C.purple, route: 'VoltaireProtocols' },
  { label: 'Decentralized\nRetirement', mark: 'D', color: C.orange, route: 'VoltaireProtocols' },
];

function Token({ asset, size }: { asset: Asset; size: number }) {
  return (
    <View style={[styles.token, { width: size, height: size, borderRadius: size / 2, backgroundColor: asset.tint }]}>
      <Text style={{ color: asset.textColor ?? '#fff', fontSize: size * 0.46, fontWeight: '900' }}>{asset.mark}</Text>
    </View>
  );
}

function ActionCard({ kind, label, route }: { kind: 'send' | 'receive' | 'swap' | 'travel'; label: string; route: RouteName }) {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => navigation.navigate(route)}
      style={({ pressed }) => [styles.actionCard, compact && styles.actionCardCompact, pressed && styles.pressed]}
    >
      <ActionArtwork kind={kind} size={compact ? 47 : 58} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function SecurityItem({ icon, label, value, route, last }: { icon: string; label: string; value: string; route: RouteName; last?: boolean }) {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={() => navigation.navigate(route)}
      style={({ pressed }) => [styles.securityItem, last && styles.securityItemLast, pressed && styles.pressed]}
    >
      <View style={styles.securityGlyph}><Text style={styles.securityGlyphText}>{icon}</Text></View>
      <Text style={styles.securityLabel}>{label}</Text>
      <Text style={styles.securityValue}>{value}</Text>
    </Pressable>
  );
}

export default function PortfolioScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { walletStatus } = useAppState();
  const { totalBalance, assets: liveAssets, loading } = useNomadWallet();
  const { travelPocket } = useNomadTravel();
  const { security } = useNomadSecurity();
  const { recovery, ownerAuthorityRequest } = useNomadRecovery();
  const [hideBalance, setHideBalance] = useState(false);

  const assets = useMemo<Asset[]>(() => {
    const mapped = liveAssets.slice(0, 4).map((asset) => {
      const visual = assetVisuals[asset.symbol.toUpperCase()] ?? {
        mark: asset.symbol.slice(0, 1).toUpperCase(),
        tint: '#0a355d',
      };
      return { symbol: asset.symbol, amount: asset.balance, value: asset.fiatValueUsd, ...visual };
    });
    return mapped.length ? mapped : previewAssets;
  }, [liveAssets]);

  const portfolioValue = liveAssets.length ? totalBalance : '$24,832.45';
  const displayPortfolioValue = hideBalance ? '••••••••' : portfolioValue;
  const systemLabel = security.status === 'frozen' ? 'FROZEN' : security.status === 'warning' ? 'REVIEW' : 'SECURE';
  const systemColor = security.status === 'frozen' ? C.red : security.status === 'warning' ? C.yellow : C.green;
  const region = travelPocket.regionInput || 'Global';
  const localCurrency = travelPocket.localCurrency || travelPocket.preferredStablecoin || 'USD Stable';
  const pocketBalance = travelPocket.pocketBalanceLocal || travelPocket.pocketBalanceFiat || '0.021 BTC';
  const ownerAuthorityValue = ownerAuthorityRequest.status === 'pending' ? 'Pending' : recovery.signerQuorum > 0 ? 'Active' : 'Set Up';
  const recoveryValue = recovery.recoveryStatus === 'protected' ? 'Ready' : recovery.recoveryStatus === 'locked' ? 'Locked' : 'Review';
  const deviceValue = security.status === 'warning' ? 'Review' : 'Verified';

  return (
    <NomadPage maxWidth={1040}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <NomadBrandMark size={compact ? 54 : 68} />
          <View style={styles.brandCopy}>
            <Text style={[styles.brandTitle, compact && styles.brandTitleCompact]}>NOMAD</Text>
            <Text style={styles.brandSub}>Built on <Text style={styles.blue}>Voltaire Protocols</Text></Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Security Center"
            onPress={() => navigation.navigate('SecurityCenter')}
            style={[styles.statusPill, compact && styles.statusCompact]}
          >
            <SecureShield size={29} />
            <View>
              <Text style={styles.statusTop}>All Systems</Text>
              <Text style={[styles.statusBottom, { color: systemColor }]}>{systemLabel}</Text>
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Open alerts" onPress={() => navigation.navigate('SecurityCenter')} style={styles.alertButton}>
            <Text style={styles.alertBell}>♧</Text>
            <View style={styles.alertDot} />
          </Pressable>
        </View>
      </View>

      <Panel style={[styles.heroCard, compact && styles.heroCardCompact]}>
        <WorldBackdrop style={styles.heroBackdrop} />
        <View style={[styles.heroTop, compact && styles.heroTopCompact]}>
          <View style={styles.balanceArea}>
            <Pressable accessibilityRole="button" accessibilityLabel={hideBalance ? 'Show portfolio balance' : 'Hide portfolio balance'} onPress={() => setHideBalance((value) => !value)} style={styles.eyebrowRow}>
              <Text style={styles.eyebrow}>Total Portfolio Value</Text>
              <Text style={styles.eyeIcon}>{hideBalance ? '◉' : '◎'}</Text>
            </Pressable>
            <View style={styles.balanceLine}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.balance, compact && styles.balanceCompact]}>{displayPortfolioValue}</Text>
              {!hideBalance ? <Text style={styles.currency}>USD</Text> : null}
            </View>
            <Text style={styles.change}>{loading ? 'Syncing wallet data…' : '▲ 1.82% (24h)'}</Text>
          </View>
          <PortfolioChart style={[styles.chart, compact && styles.chartCompact]} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assetRow}>
          {assets.map((asset) => (
            <Pressable key={asset.symbol} accessibilityRole="button" accessibilityLabel={`Open ${asset.symbol} wallet`} onPress={() => navigation.navigate('Wallets')} style={({ pressed }) => [styles.asset, pressed && styles.pressed]}>
              <Token asset={asset} size={compact ? 42 : 50} />
              <Text style={styles.assetSymbol}>{asset.symbol}</Text>
              <Text style={styles.assetAmount}>{asset.amount}</Text>
              <Text style={styles.assetValue}>{asset.value}</Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" accessibilityLabel="View all wallets" onPress={() => navigation.navigate('Wallets')} style={({ pressed }) => [styles.asset, pressed && styles.pressed]}>
            <View style={[styles.token, styles.moreToken, { width: compact ? 42 : 50, height: compact ? 42 : 50, borderRadius: 25 }]}>
              <Text style={styles.moreText}>•••</Text>
            </View>
            <Text style={styles.assetSymbol}>More</Text>
          </Pressable>
        </ScrollView>
      </Panel>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <ActionCard kind="send" label="Send" route="SendBitcoin" />
        <ActionCard kind="receive" label="Receive" route="ReceiveBitcoin" />
        <ActionCard kind="swap" label="Swap" route="Swap" />
        <ActionCard kind="travel" label="Travel" route="TravelMode" />
      </View>

      <Panel tone="green" style={styles.travelCard}>
        <WorldBackdrop style={styles.travelBackdrop} />
        <Pressable accessibilityRole="button" accessibilityLabel="Open Travel Pocket" onPress={() => navigation.navigate('TravelMode')} style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.travelPlane}>✈</Text>
            <View>
              <Text style={styles.travelTitle}>Travel Pocket</Text>
              <Text style={styles.cardSub}>{region} • {localCurrency}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.activePill}>{travelPocket.enabled ? 'ACTIVE' : 'READY'}</Text>
            <Text style={styles.menuDots}>•••</Text>
          </View>
        </Pressable>

        <View style={[styles.travelMetrics, compact && styles.travelMetricsCompact]}>
          <View style={styles.travelMetric}>
            <Text style={styles.metricLabel}>Balance</Text>
            <Text style={styles.metricValue}>{pocketBalance}</Text>
            <Text style={styles.metricSub}>{travelPocket.pocketBalanceFiat || 'Regional stable value'}</Text>
          </View>
          <View style={styles.travelMetric}>
            <Text style={styles.metricLabel}>Daily Limit</Text>
            <Text style={styles.metricValue}>Owner set</Text>
            <View style={styles.progressRow}><ProgressBar value={42} color={C.green} height={8} /><Text style={styles.progressText}>42%</Text></View>
          </View>
          <View style={styles.travelMetric}>
            <Text style={styles.metricLabel}>Trip Limit</Text>
            <Text style={styles.metricValue}>Owner set</Text>
            <View style={styles.progressRow}><ProgressBar value={30} color={C.green} height={8} /><Text style={styles.progressText}>30%</Text></View>
          </View>
          <View style={[styles.travelMetric, styles.travelMetricLast]}>
            <Text style={styles.metricLabel}>Expires</Text>
            <Text style={styles.metricValue}>Not set</Text>
            <Text style={styles.metricSub}>Configure trip dates</Text>
          </View>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Manage Travel Pocket" onPress={() => navigation.navigate('TravelMode')} style={({ pressed }) => [styles.manageTravel, pressed && styles.pressed]}>
          <Text style={styles.manageTravelText}>Manage Travel Pocket</Text>
          <Text style={styles.greenArrow}>›</Text>
        </Pressable>
      </Panel>

      <Panel style={styles.securityCard}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Security Center" onPress={() => navigation.navigate('SecurityCenter')} style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <SecureShield size={27} />
            <Text style={styles.securityTitle}>Security Center</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.securePill}>{systemLabel}</Text>
            <Text style={styles.blueArrow}>›</Text>
          </View>
        </Pressable>
        <View style={styles.securityGrid}>
          <SecurityItem icon="▣" label="Secure Storage" value={security.status === 'warning' ? 'Review' : 'Secure'} route="Settings" />
          <SecurityItem icon="♙" label="Owner Authority" value={ownerAuthorityValue} route="CreateOwnerAuthority" />
          <SecurityItem icon="▤" label="Device Integrity" value={deviceValue} route="NomadWatch" />
          <SecurityItem icon="↻" label="Recovery Status" value={recoveryValue} route="RecoveryCenter" last />
        </View>
      </Panel>

      <Panel style={styles.ecosystemCard}>
        <Pressable accessibilityRole="button" accessibilityLabel="Explore Arkrilium Labs Ecosystem" onPress={() => navigation.navigate('VoltaireProtocols')} style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <View style={styles.arkriliumBadge}><Text style={styles.arkriliumBadgeText}>A</Text></View>
            <Text style={styles.ecoTitle}>Arkrilium Labs Ecosystem</Text>
          </View>
          <Text style={styles.exploreText}>Explore All  ›</Text>
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ecoRow}>
          {ecosystem.map((item) => (
            <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={`Open ${item.label.replace('\n', ' ')}`} onPress={() => navigation.navigate(item.route)} style={({ pressed }) => [styles.ecoItem, pressed && styles.pressed]}>
              <View style={[styles.ecoIcon, { borderColor: item.color }]}><Text style={[styles.ecoMark, { color: item.color }]}>{item.mark}</Text></View>
              <Text style={styles.ecoLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Panel>

      <BottomNav active="Home" />
      {Platform.OS === 'web' && walletStatus !== 'unlocked' ? <Text style={styles.previewNote}>Secure browser preview • Wallet actions still require owner approval.</Text> : null}
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 17 },
  brandRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  brandCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  brandTitle: { color: '#fff', fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: 1.1 },
  brandTitleCompact: { fontSize: 29, lineHeight: 34 },
  brandSub: { color: '#fff', fontSize: 12, marginTop: 3 },
  blue: { color: C.blue, fontWeight: '900' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#0b3f68', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: 'rgba(3,16,30,.96)' },
  statusCompact: { paddingHorizontal: 8, gap: 5 },
  statusTop: { color: '#dbe5f2', fontSize: 11 },
  statusBottom: { fontSize: 12, fontWeight: '900' },
  alertButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#0b3f68', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(3,16,30,.96)' },
  alertBell: { color: '#b7c4d9', fontSize: 24, lineHeight: 26 },
  alertDot: { position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: C.blue },
  heroCard: { minHeight: 338, padding: 25, position: 'relative' },
  heroCardCompact: { padding: 17, minHeight: 324 },
  heroBackdrop: { position: 'absolute', top: 0, right: 0, width: '75%', height: 188, opacity: 0.43 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  heroTopCompact: { gap: 3 },
  balanceArea: { flex: 1.05, minWidth: 0, zIndex: 2 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7 },
  eyebrow: { color: '#f2f6fb', fontSize: 15 },
  eyeIcon: { color: '#b9c6d8', fontSize: 20 },
  balanceLine: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 9 },
  balance: { flexShrink: 1, color: '#fff', fontSize: 62, lineHeight: 68, fontWeight: '900', letterSpacing: -2.2 },
  balanceCompact: { fontSize: 42, lineHeight: 50, letterSpacing: -1.4 },
  currency: { color: '#fff', fontSize: 15 },
  change: { color: C.green, fontSize: 15, fontWeight: '900', marginTop: 4 },
  chart: { flex: 0.97, minWidth: 120, height: 160, zIndex: 1 },
  chartCompact: { minWidth: 102, height: 106 },
  assetRow: { paddingTop: 26, paddingBottom: 2, flexGrow: 1, justifyContent: 'space-between' },
  asset: { minWidth: 82, paddingHorizontal: 5, alignItems: 'center' },
  token: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', marginBottom: 7, shadowColor: '#168cff', shadowOpacity: 0.22, shadowRadius: 9, shadowOffset: { width: 0, height: 0 } },
  moreToken: { backgroundColor: '#06172a', borderColor: '#164976' },
  moreText: { color: '#dce7f5', fontSize: 18, fontWeight: '900' },
  assetSymbol: { color: '#fff', fontSize: 12, fontWeight: '900' },
  assetAmount: { color: '#f2f6fb', fontSize: 10, marginTop: 4 },
  assetValue: { color: C.muted, fontSize: 9, marginTop: 3 },
  sectionTitle: { color: '#fff', fontSize: 19, fontWeight: '900', marginTop: 23, marginBottom: 11 },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionCard: { flex: 1, minWidth: 0, minHeight: 124, borderWidth: 1, borderColor: C.border, borderRadius: 15, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center' },
  actionCardCompact: { minHeight: 101 },
  actionLabel: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 4 },
  travelCard: { marginTop: 18, position: 'relative' },
  securityCard: { marginTop: 18 },
  ecosystemCard: { marginTop: 18 },
  travelBackdrop: { position: 'absolute', right: 0, bottom: 0, width: '58%', height: '88%', opacity: 0.34 },
  cardHeader: { minHeight: 65, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.borderSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, zIndex: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardSub: { color: C.muted, fontSize: 9, marginTop: 3 },
  travelPlane: { color: C.green, fontSize: 24 },
  travelTitle: { color: C.green, fontSize: 17, fontWeight: '900' },
  activePill: { color: C.green, borderWidth: 1, borderColor: C.green, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 10, fontWeight: '900', backgroundColor: 'rgba(32,239,112,.07)' },
  menuDots: { color: C.green, fontSize: 18, fontWeight: '900' },
  travelMetrics: { flexDirection: 'row', padding: 13, zIndex: 2 },
  travelMetricsCompact: { flexWrap: 'wrap' },
  travelMetric: { flex: 1, minWidth: 132, padding: 10, borderRightWidth: 1, borderRightColor: 'rgba(32,239,112,.18)' },
  travelMetricLast: { borderRightWidth: 0 },
  metricLabel: { color: C.muted, fontSize: 10 },
  metricValue: { color: '#fff', fontSize: 16, fontWeight: '800', marginVertical: 7 },
  metricSub: { color: C.muted, fontSize: 9 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressText: { color: '#dce8e2', fontSize: 10 },
  manageTravel: { minHeight: 57, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: 'rgba(32,239,112,.16)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 },
  manageTravelText: { color: C.green, fontSize: 13, fontWeight: '800' },
  greenArrow: { color: C.green, fontSize: 28 },
  securityTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  securePill: { color: C.blue, borderWidth: 1, borderColor: C.blue, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 9, fontWeight: '900' },
  blueArrow: { color: C.blue, fontSize: 28 },
  securityGrid: { flexDirection: 'row', padding: 8 },
  securityItem: { flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: 11, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: C.borderSoft },
  securityItemLast: { borderRightWidth: 0 },
  securityGlyph: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(32,239,112,.38)', backgroundColor: 'rgba(32,239,112,.08)', alignItems: 'center', justifyContent: 'center' },
  securityGlyphText: { color: C.green, fontSize: 22, fontWeight: '900' },
  securityLabel: { color: '#fff', fontSize: 9, textAlign: 'center', marginTop: 8 },
  securityValue: { color: C.green, fontSize: 9, fontWeight: '900', marginTop: 5 },
  arkriliumBadge: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: C.purple, backgroundColor: 'rgba(135,82,255,.12)', alignItems: 'center', justifyContent: 'center' },
  arkriliumBadgeText: { color: C.purple, fontSize: 16, fontWeight: '900' },
  ecoTitle: { color: C.purple, fontSize: 17, fontWeight: '900' },
  exploreText: { color: C.blue, fontSize: 11, fontWeight: '900' },
  ecoRow: { paddingHorizontal: 12, paddingVertical: 18 },
  ecoItem: { width: 88, alignItems: 'center' },
  ecoIcon: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, backgroundColor: '#061526', alignItems: 'center', justifyContent: 'center', shadowColor: '#168cff', shadowOpacity: 0.2, shadowRadius: 9, shadowOffset: { width: 0, height: 0 } },
  ecoMark: { fontSize: 22, fontWeight: '900' },
  ecoLabel: { color: '#fff', fontSize: 9, lineHeight: 13, textAlign: 'center', marginTop: 8 },
  previewNote: { color: C.muted2, textAlign: 'center', fontSize: 9, marginTop: 10 },
});
