import React, { useMemo } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadTravel, useNomadWallet } from '../nomad';
import { useAppState } from '../state/appState';
import {
  BottomNav,
  C,
  NomadPage,
  Panel,
  ProgressBar,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

type Asset = { symbol: string; amount: string; value: string; mark: string; tint: string };

type RouteName = 'Portfolio' | 'Wallets' | 'SendBitcoin' | 'ReceiveBitcoin' | 'Swap' | 'TravelMode' | 'SecurityCenter' | 'Settings' | 'VoltaireProtocols';

const previewAssets: Asset[] = [
  { symbol: 'BTC', amount: '0.3567', value: '$22,123.10', mark: '₿', tint: '#ff9914' },
  { symbol: 'HBAR', amount: '3,250.00', value: '$1,250.25', mark: 'H', tint: '#6844ef' },
  { symbol: 'XRP', amount: '1,250.00', value: '$750.00', mark: 'X', tint: '#181c23' },
  { symbol: 'XLM', amount: '5,200.00', value: '$310.40', mark: 'S', tint: '#147ff5' },
];

const assetVisuals: Record<string, Pick<Asset, 'mark' | 'tint'>> = {
  BTC: { mark: '₿', tint: '#ff9914' }, HBAR: { mark: 'H', tint: '#6844ef' }, XRP: { mark: 'X', tint: '#181c23' },
  XLM: { mark: 'S', tint: '#147ff5' }, ETH: { mark: 'Ξ', tint: '#6574ca' }, USDC: { mark: '$', tint: '#2775ca' },
  USDT: { mark: '₮', tint: '#26a17b' }, DAI: { mark: 'D', tint: '#f5ac37' },
};

const shieldSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 96">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#25b9ff"/><stop offset="1" stop-color="#0064ff"/></linearGradient></defs>
  <path d="M42 4 74 18v24c0 23-13 39-32 50C23 81 10 65 10 42V18Z" fill="#031120" stroke="url(#g)" stroke-width="6"/>
  <path d="m19 48 10-10 8 8 9-11 8 10 12-9" fill="none" stroke="#138cff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);

const chartSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 180" preserveAspectRatio="none">
  <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#148cff" stop-opacity=".38"/><stop offset="1" stop-color="#148cff" stop-opacity="0"/></linearGradient></defs>
  <path d="M10 158 C45 152 52 150 74 139 S117 145 139 128 S176 115 199 120 S228 102 250 88 S282 100 300 84 S331 66 351 73 S381 82 400 57 S435 61 455 37 S486 47 510 12 L510 180 L10 180Z" fill="url(#fill)"/>
  <path d="M10 158 C45 152 52 150 74 139 S117 145 139 128 S176 115 199 120 S228 102 250 88 S282 100 300 84 S331 66 351 73 S381 82 400 57 S435 61 455 37 S486 47 510 12" fill="none" stroke="#148cff" stroke-width="4"/>
</svg>`);

function ShieldLogo({ size }: { size: number }) {
  return <Image source={{ uri: `data:image/svg+xml;utf8,${shieldSvg}` }} resizeMode="contain" style={{ width: size, height: size * 1.14 }} />;
}

function Token({ asset, size }: { asset: Asset; size: number }) {
  return <View style={[styles.token, { width: size, height: size, borderRadius: size / 2, backgroundColor: asset.tint }]}><Text style={{ color: '#fff', fontSize: size * .48, fontWeight: '900' }}>{asset.mark}</Text></View>;
}

function ActionCard({ icon, label, route }: { icon: string; label: string; route: RouteName }) {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  return <Pressable onPress={() => navigation.navigate(route)} style={({ pressed }) => [styles.actionCard, { minHeight: compact ? 98 : 119, opacity: pressed ? .76 : 1 }]}><Text style={[styles.actionIcon, { fontSize: compact ? 35 : 44 }]}>{icon}</Text><Text style={styles.actionLabel}>{label}</Text></Pressable>;
}

function SecurityItem({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return <View style={[styles.securityItem, last && { borderRightWidth: 0 }]}><Text style={styles.securityIcon}>{icon}</Text><Text style={styles.securityLabel}>{label}</Text><Text style={styles.securityValue}>{value}</Text></View>;
}

export default function PortfolioScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { walletStatus } = useAppState();
  const { totalBalance, assets: liveAssets, loading } = useNomadWallet();
  const { travelPocket } = useNomadTravel();

  const assets = useMemo<Asset[]>(() => {
    const mapped = liveAssets.slice(0, 4).map((asset) => {
      const visual = assetVisuals[asset.symbol.toUpperCase()] ?? { mark: asset.symbol.slice(0, 1), tint: '#0a355d' };
      return { symbol: asset.symbol, amount: asset.balance, value: asset.fiatValueUsd, ...visual };
    });
    return mapped.length ? mapped : previewAssets;
  }, [liveAssets]);

  const portfolioValue = liveAssets.length ? totalBalance : '$24,832.45';
  const systemLabel = walletStatus === 'unlocked' || Platform.OS === 'web' ? 'SECURE' : 'LOCKED';
  const region = travelPocket.regionInput || 'Global';
  const localCurrency = travelPocket.localCurrency || travelPocket.preferredStablecoin || 'USD Stable';
  const pocketBalance = travelPocket.pocketBalanceLocal || travelPocket.pocketBalanceFiat || '$1,208.64';

  const ecosystem = [
    ['⌁', 'Nomad', C.blue], ['∞', 'AutoDeFi', C.blue], ['R', 'Reqrium', C.purple], ['$', 'Sovereign\nPayroll', C.green],
    ['♜', 'Guardian\nTrader', C.green], ['◉', 'Quantum\nLottery', C.purple], ['☼', 'Decentralized\nRetirement', C.orange],
  ] as const;

  return (
    <NomadPage maxWidth={1040}>
      <View style={styles.header}>
        <View style={styles.brandRow}><ShieldLogo size={compact ? 50 : 65} /><View style={styles.brandCopy}><Text style={[styles.brandTitle, { fontSize: compact ? 28 : 36 }]}>NOMAD</Text><Text style={styles.brandSub}>Built on <Text style={styles.blue}>Arkrilium</Text></Text></View></View>
        <View style={[styles.statusPill, compact && styles.statusCompact]}><Text style={styles.statusShield}>◇</Text><View><Text style={styles.statusTop}>All Systems</Text><Text style={styles.statusBottom}>{systemLabel}</Text></View></View>
      </View>

      <Panel style={[styles.heroCard, { padding: compact ? 17 : 26 }]}>
        <View style={[styles.heroTop, compact && styles.heroCompact]}>
          <View style={styles.balanceArea}><Text style={styles.eyebrow}>Total Portfolio Value  ◎</Text><View style={styles.balanceLine}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.balance, { fontSize: compact ? 42 : 62 }]}>{portfolioValue}</Text><Text style={styles.currency}>USD</Text></View><Text style={styles.change}>{loading ? 'Syncing wallet data…' : '▲ 1.82% (24h)'}</Text></View>
          <Image source={{ uri: `data:image/svg+xml;utf8,${chartSvg}` }} resizeMode="stretch" style={[styles.chart, { height: compact ? 105 : 160 }]} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assetRow}>
          {assets.map((asset) => <View key={asset.symbol} style={styles.asset}><Token asset={asset} size={compact ? 41 : 48} /><Text style={styles.assetSymbol}>{asset.symbol}</Text><Text style={styles.assetAmount}>{asset.amount}</Text><Text style={styles.assetValue}>{asset.value}</Text></View>)}
          <Pressable onPress={() => navigation.navigate('Wallets')} style={styles.asset}><View style={[styles.token, styles.moreToken, { width: compact ? 41 : 48, height: compact ? 41 : 48, borderRadius: 24 }]}><Text style={styles.moreText}>•••</Text></View><Text style={styles.assetSymbol}>More</Text></Pressable>
        </ScrollView>
      </Panel>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}><ActionCard icon="↑" label="Send" route="SendBitcoin" /><ActionCard icon="↓" label="Receive" route="ReceiveBitcoin" /><ActionCard icon="⇄" label="Swap" route="Swap" /><ActionCard icon="✈" label="Travel" route="TravelMode" /></View>

      <Panel tone="green" style={styles.travelCard}>
        <Pressable onPress={() => navigation.navigate('TravelMode')} style={styles.cardHeader}><View style={styles.titleRow}><Text style={styles.travelIcon}>✈</Text><View><Text style={styles.travelTitle}>Travel Pocket</Text><Text style={styles.cardSub}>{region} • {localCurrency}</Text></View></View><View style={styles.headerRight}><Text style={styles.activePill}>{travelPocket.enabled ? 'ACTIVE' : 'READY'}</Text><Text style={styles.greenArrow}>›</Text></View></Pressable>
        <View style={[styles.travelMetrics, compact && styles.travelMetricsCompact]}>
          <View style={styles.travelMetric}><Text style={styles.metricLabel}>Pocket Balance</Text><Text style={styles.metricValue}>{pocketBalance}</Text><Text style={styles.metricSub}>{travelPocket.pocketBalanceFiat || 'Regional stable value'}</Text></View>
          <View style={styles.travelMetric}><Text style={styles.metricLabel}>Daily Limit</Text><Text style={styles.metricValue}>Owner set</Text><ProgressBar value={32} color={C.green} height={7} /></View>
          <View style={styles.travelMetric}><Text style={styles.metricLabel}>Trip Limit</Text><Text style={styles.metricValue}>Owner set</Text><ProgressBar value={37} color={C.green} height={7} /></View>
          <View style={[styles.travelMetric, { borderRightWidth: 0 }]}><Text style={styles.metricLabel}>Trip Dates</Text><Text style={styles.metricValue}>Not set</Text><Text style={styles.metricSub}>Add in Travel Pocket</Text></View>
        </View>
      </Panel>

      <Panel style={styles.securityCard}>
        <Pressable onPress={() => navigation.navigate('SecurityCenter')} style={styles.cardHeader}><View style={styles.titleRow}><Text style={styles.securityHeaderIcon}>◇</Text><Text style={styles.securityTitle}>Security Center</Text></View><View style={styles.headerRight}><Text style={styles.securePill}>SECURE</Text><Text style={styles.blueArrow}>›</Text></View></Pressable>
        <View style={styles.securityGrid}><SecurityItem icon="▣" label="Secure Storage" value="Secure" /><SecurityItem icon="♙" label="Owner Authority" value="Active" /><SecurityItem icon="▤" label="Device Integrity" value="Verified" /><SecurityItem icon="↻" label="Recovery Status" value="Ready" last /></View>
      </Panel>

      <Panel style={styles.ecosystemCard}>
        <Pressable onPress={() => navigation.navigate('VoltaireProtocols')} style={styles.cardHeader}><View style={styles.titleRow}><Text style={styles.ecoHeaderIcon}>A</Text><Text style={styles.ecoTitle}>Arkrilium Ecosystem</Text></View><Text style={styles.exploreText}>Explore All  ›</Text></Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ecoRow}>{ecosystem.map(([icon, label, color]) => <View key={label} style={styles.ecoItem}><View style={[styles.ecoIcon, { borderColor: color }]}><Text style={[styles.ecoMark, { color }]}>{icon}</Text></View><Text style={styles.ecoLabel}>{label}</Text></View>)}</ScrollView>
      </Panel>

      <BottomNav active="Home" />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 18 },
  brandRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  brandCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  brandTitle: { color: '#fff', fontWeight: '900' },
  brandSub: { color: '#fff', fontSize: 11, marginTop: 3 },
  blue: { color: C.blue, fontWeight: '900' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: C.panel },
  statusCompact: { paddingHorizontal: 7, gap: 4 },
  statusShield: { color: C.green, fontSize: 23 },
  statusTop: { color: '#dbe5f2', fontSize: 9 },
  statusBottom: { color: C.green, fontSize: 10, fontWeight: '900' },
  heroCard: { minHeight: 305 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroCompact: { gap: 3 },
  balanceArea: { flex: 1.05, minWidth: 0 },
  eyebrow: { color: '#f2f6fb', fontSize: 14 },
  balanceLine: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 9 },
  balance: { flexShrink: 1, color: '#fff', fontWeight: '900', letterSpacing: -2 },
  currency: { color: '#fff', fontSize: 13 },
  change: { color: C.green, fontSize: 14, fontWeight: '900', marginTop: 5 },
  chart: { flex: .95, minWidth: 105 },
  assetRow: { paddingTop: 22, paddingBottom: 2 },
  asset: { width: 88, alignItems: 'center' },
  token: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', marginBottom: 7 },
  moreToken: { backgroundColor: '#06172a', borderColor: '#164976' },
  moreText: { color: '#dce7f5', fontSize: 17, fontWeight: '900' },
  assetSymbol: { color: '#fff', fontSize: 11, fontWeight: '900' },
  assetAmount: { color: '#f2f6fb', fontSize: 9, marginTop: 4 },
  assetValue: { color: C.muted, fontSize: 8, marginTop: 3 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 21, marginBottom: 11 },
  actionGrid: { flexDirection: 'row', gap: 9 },
  actionCard: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center' },
  actionIcon: { color: C.blue, fontWeight: '900' },
  actionLabel: { color: '#fff', fontSize: 12, fontWeight: '800', marginTop: 4 },
  travelCard: { marginTop: 18 },
  securityCard: { marginTop: 18 },
  ecosystemCard: { marginTop: 18 },
  cardHeader: { minHeight: 62, paddingHorizontal: 17, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.borderSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  cardSub: { color: C.muted, fontSize: 8, marginTop: 3 },
  travelIcon: { fontSize: 21 },
  travelTitle: { color: C.green, fontSize: 16, fontWeight: '900' },
  activePill: { color: C.green, borderWidth: 1, borderColor: C.green, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 8, fontWeight: '900' },
  greenArrow: { color: C.green, fontSize: 26 },
  travelMetrics: { flexDirection: 'row', padding: 12 },
  travelMetricsCompact: { flexWrap: 'wrap' },
  travelMetric: { flex: 1, minWidth: 135, padding: 10, borderRightWidth: 1, borderRightColor: 'rgba(32,239,112,.16)' },
  metricLabel: { color: C.muted, fontSize: 8 },
  metricValue: { color: '#fff', fontSize: 13, fontWeight: '800', marginVertical: 6 },
  metricSub: { color: C.muted, fontSize: 8 },
  securityHeaderIcon: { color: C.blue, fontSize: 24 },
  securityTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  securePill: { color: C.blue, borderWidth: 1, borderColor: C.blue, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 8, fontWeight: '900' },
  blueArrow: { color: C.blue, fontSize: 26 },
  securityGrid: { flexDirection: 'row', padding: 8 },
  securityItem: { flex: 1, minWidth: 0, alignItems: 'center', padding: 8, borderRightWidth: 1, borderRightColor: C.borderSoft },
  securityIcon: { color: C.green, fontSize: 24 },
  securityLabel: { color: '#fff', fontSize: 8, textAlign: 'center', marginTop: 7 },
  securityValue: { color: C.green, fontSize: 8, fontWeight: '900', marginTop: 5 },
  ecoHeaderIcon: { color: C.purple, fontSize: 22, fontWeight: '900' },
  ecoTitle: { color: C.purple, fontSize: 16, fontWeight: '900' },
  exploreText: { color: C.blue, fontSize: 10, fontWeight: '900' },
  ecoRow: { paddingHorizontal: 12, paddingVertical: 17 },
  ecoItem: { width: 85, alignItems: 'center' },
  ecoIcon: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, backgroundColor: '#061526', alignItems: 'center', justifyContent: 'center' },
  ecoMark: { fontSize: 20, fontWeight: '900' },
  ecoLabel: { color: '#fff', fontSize: 8, lineHeight: 12, textAlign: 'center', marginTop: 7 },
});
