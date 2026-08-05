import React, { useMemo } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadWallet } from '../nomad/hooks';
import { useAppState } from '../state/appState';

type Asset = {
  symbol: string;
  amount: string;
  value: string;
  mark: string;
  tint: string;
};

type RouteName =
  | 'Portfolio'
  | 'Wallets'
  | 'SendBitcoin'
  | 'ReceiveBitcoin'
  | 'Swap'
  | 'TravelMode'
  | 'SecurityCenter'
  | 'Settings'
  | 'VoltaireProtocols';

const previewAssets: Asset[] = [
  { symbol: 'BTC', amount: '0.3567', value: '$22,123.10', mark: '₿', tint: '#ff9914' },
  { symbol: 'HBAR', amount: '3,250.00', value: '$1,250.25', mark: 'H', tint: '#6844ef' },
  { symbol: 'XRP', amount: '1,250.00', value: '$750.00', mark: 'X', tint: '#181c23' },
  { symbol: 'XLM', amount: '5,200.00', value: '$310.40', mark: 'S', tint: '#147ff5' },
];

const assetVisuals: Record<string, Pick<Asset, 'mark' | 'tint'>> = {
  BTC: { mark: '₿', tint: '#ff9914' },
  HBAR: { mark: 'H', tint: '#6844ef' },
  XRP: { mark: 'X', tint: '#181c23' },
  XLM: { mark: 'S', tint: '#147ff5' },
  ETH: { mark: 'Ξ', tint: '#6574ca' },
  USDC: { mark: '$', tint: '#2775ca' },
  USDT: { mark: '₮', tint: '#26a17b' },
  DAI: { mark: 'D', tint: '#f5ac37' },
};

const shieldSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 96">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#25b9ff"/><stop offset="1" stop-color="#0064ff"/></linearGradient></defs>
  <path d="M42 4 74 18v24c0 23-13 39-32 50C23 81 10 65 10 42V18Z" fill="#031120" stroke="url(#g)" stroke-width="6"/>
  <path d="m19 48 10-10 8 8 9-11 8 10 12-9" fill="none" stroke="#138cff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);

const chartSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 180" preserveAspectRatio="none">
  <defs>
    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#148cff" stop-opacity=".38"/><stop offset="1" stop-color="#148cff" stop-opacity="0"/></linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <path d="M10 158 C45 152 52 150 74 139 S117 145 139 128 S176 115 199 120 S228 102 250 88 S282 100 300 84 S331 66 351 73 S381 82 400 57 S435 61 455 37 S486 47 510 12 L510 180 L10 180Z" fill="url(#fill)"/>
  <path d="M10 158 C45 152 52 150 74 139 S117 145 139 128 S176 115 199 120 S228 102 250 88 S282 100 300 84 S331 66 351 73 S381 82 400 57 S435 61 455 37 S486 47 510 12" fill="none" stroke="#148cff" stroke-width="4" filter="url(#glow)"/>
</svg>`);

const ShieldLogo = ({ size = 66 }: { size?: number }) => (
  <Image
    source={{ uri: `data:image/svg+xml;utf8,${shieldSvg}` }}
    resizeMode="contain"
    style={{ width: size, height: size * 1.14 }}
    accessibilityLabel="Nomad shield"
  />
);

const Card = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const Token = ({ asset, size = 44 }: { asset: Asset; size?: number }) => (
  <View
    style={[
      styles.token,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: asset.tint,
      },
    ]}
  >
    <Text style={{ color: '#fff', fontSize: size * 0.48, fontWeight: '900' }}>{asset.mark}</Text>
  </View>
);

const ActionCard = ({ icon, label, onPress, compact }: { icon: string; label: string; onPress: () => void; compact: boolean }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    style={({ pressed }) => [
      styles.actionCard,
      { minHeight: compact ? 104 : 126, opacity: pressed ? 0.78 : 1 },
    ]}
  >
    <Text style={[styles.actionIcon, { fontSize: compact ? 38 : 48 }]}>{icon}</Text>
    <Text style={[styles.actionLabel, { fontSize: compact ? 14 : 17 }]}>{label}</Text>
  </Pressable>
);

const Metric = ({ label, value, unit, sub, percent, last }: { label: string; value: string; unit?: string; sub?: string; percent?: number; last?: boolean }) => (
  <View style={[styles.metric, last && styles.metricLast]}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}{unit ? <Text style={styles.metricUnit}> {unit}</Text> : null}</Text>
    {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
    {typeof percent === 'number' ? (
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${percent}%` }]} /></View>
        <Text style={styles.progressText}>{percent}%</Text>
      </View>
    ) : null}
  </View>
);

export const PortfolioScreen = () => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const compact = width < 560;
  const desktop = width >= 980;
  const { walletStatus, travelModeEnabled } = useAppState();
  const { totalBalance, assets: liveAssets, loading } = useNomadWallet();

  const displayAssets = useMemo<Asset[]>(() => {
    const mapped = liveAssets.slice(0, 4).map((asset) => {
      const visual = assetVisuals[asset.symbol] ?? { mark: asset.symbol.slice(0, 1), tint: '#0a355d' };
      return {
        symbol: asset.symbol,
        amount: asset.balance,
        value: asset.fiatValueUsd,
        mark: visual.mark,
        tint: visual.tint,
      };
    });
    return mapped.length ? mapped : previewAssets;
  }, [liveAssets]);

  const navigate = (route: RouteName) => navigation.navigate(route);
  const portfolioValue = liveAssets.length ? totalBalance : '$24,832.45';
  const systemLabel = walletStatus === 'unlocked' ? 'SECURE' : Platform.OS === 'web' ? 'SECURE' : 'LOCKED';

  const navItems: Array<[string, string, RouteName]> = [
    ['⌂', 'Home', 'Portfolio'],
    ['▣', 'Wallets', 'Wallets'],
    ['✈', 'Travel', 'TravelMode'],
    ['◇', 'Security', 'SecurityCenter'],
    ['⚙', 'Settings', 'Settings'],
  ];

  const ecosystem = [
    ['⚡', 'Nomad', '#148cff'],
    ['∞', 'AutoDeFi', '#148cff'],
    ['R', 'Reqrium', '#8457ff'],
    ['$', 'Sovereign\nPayroll', '#23f57a'],
    ['♜', 'Guardian\nTrader', '#23f57a'],
    ['◉', 'Quantum\nLottery', '#8457ff'],
    ['☼', 'Decentralized\nRetirement', '#ffb22e'],
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.page,
          { paddingHorizontal: compact ? 14 : 24, maxWidth: desktop ? 1120 : 860 },
        ]}
      >
        <View style={[styles.header, compact && styles.headerCompact]}>
          <View style={styles.brandRow}>
            <ShieldLogo size={compact ? 50 : 66} />
            <View style={styles.brandCopy}>
              <Text style={[styles.brandTitle, { fontSize: compact ? 28 : 37 }]}>NOMAD</Text>
              <Text style={[styles.brandSub, { fontSize: compact ? 12 : 15 }]}>Built on <Text style={styles.blue}>Voltaire Protocols</Text></Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <View style={[styles.statusPill, compact && styles.statusPillCompact]}>
              <Text style={styles.statusShield}>♢</Text>
              <View>
                <Text style={[styles.statusTop, { fontSize: compact ? 10 : 12 }]}>All Systems</Text>
                <Text style={[styles.statusBottom, { fontSize: compact ? 11 : 13 }]}>{systemLabel}</Text>
              </View>
            </View>
            {!compact ? <View style={styles.bell}><Text style={styles.bellText}>♧</Text></View> : null}
          </View>
        </View>

        <Card style={[styles.heroCard, { padding: compact ? 18 : 28 }]}>
          <View style={[styles.heroTop, compact && styles.heroTopCompact]}>
            <View style={styles.balanceArea}>
              <Text style={[styles.eyebrow, { fontSize: compact ? 14 : 18 }]}>Total Portfolio Value  ◎</Text>
              <View style={styles.balanceLine}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[styles.balance, { fontSize: compact ? 43 : 65, maxWidth: compact ? 260 : undefined }]}
                >
                  {portfolioValue}
                </Text>
                <Text style={[styles.currency, { fontSize: compact ? 14 : 20 }]}>USD</Text>
              </View>
              <Text style={[styles.change, { fontSize: compact ? 15 : 19 }]}>{loading ? 'Syncing wallet data…' : '▲ 1.82% (24h)'}</Text>
            </View>
            <Image
              source={{ uri: `data:image/svg+xml;utf8,${chartSvg}` }}
              resizeMode="stretch"
              style={[styles.chart, { height: compact ? 105 : 170 }]}
              accessibilityLabel="Portfolio growth chart"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assetRow}>
            {displayAssets.map((asset) => (
              <View key={asset.symbol} style={[styles.asset, { width: compact ? 73 : 112 }]}>
                <Token asset={asset} size={compact ? 42 : 48} />
                <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                <Text style={styles.assetAmount}>{asset.amount}</Text>
                <Text style={styles.assetValue}>{asset.value}</Text>
              </View>
            ))}
            <View style={[styles.asset, { width: compact ? 73 : 112 }]}>
              <View style={[styles.token, styles.moreToken, { width: compact ? 42 : 48, height: compact ? 42 : 48, borderRadius: compact ? 21 : 24 }]}>
                <Text style={styles.moreText}>•••</Text>
              </View>
              <Text style={styles.assetSymbol}>More</Text>
            </View>
          </ScrollView>
        </Card>

        <Text style={[styles.sectionTitle, { fontSize: compact ? 18 : 22 }]}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <ActionCard compact={compact} icon="↑" label="Send" onPress={() => navigate('SendBitcoin')} />
          <ActionCard compact={compact} icon="↓" label="Receive" onPress={() => navigate('ReceiveBitcoin')} />
          <ActionCard compact={compact} icon="⇄" label="Swap" onPress={() => navigate('Swap')} />
          <ActionCard compact={compact} icon="▣" label="Travel" onPress={() => navigate('TravelMode')} />
        </View>

        <Card style={styles.travelCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}><Text style={styles.travelIcon}>✈</Text><Text style={styles.travelTitle}>Travel Pocket</Text></View>
            <View style={styles.cardHeaderRight}><Text style={styles.activePill}>{travelModeEnabled ? 'ACTIVE' : 'READY'}</Text><Text style={styles.dots}>•••</Text></View>
          </View>
          <View style={[styles.metrics, compact && styles.metricsCompact]}>
            <Metric label="Balance" value="0.021" unit="BTC" sub="$1,312.21 USD" />
            <Metric label="Daily Limit" value="0.050" unit="BTC" percent={42} />
            <Metric label="Trip Limit" value="0.500" unit="BTC" percent={30} />
            <Metric label="Expires" value="May 20, 2025" last />
          </View>
          <Pressable style={styles.manageLink} onPress={() => navigate('TravelMode')}>
            <Text style={styles.manageText}>Manage Travel Pocket</Text><Text style={styles.manageArrow}>›</Text>
          </Pressable>
        </Card>

        <Card style={styles.securityCard}>
          <Pressable style={styles.cardHeader} onPress={() => navigate('SecurityCenter')}>
            <View style={styles.cardTitleRow}><Text style={styles.securityHeaderIcon}>◇</Text><Text style={styles.securityTitle}>Security Center</Text></View>
            <View style={styles.cardHeaderRight}><Text style={styles.securePill}>SECURE</Text><Text style={styles.blueArrow}>›</Text></View>
          </Pressable>
          <View style={styles.securityGrid}>
            {[
              ['▣', 'Secure Storage', 'Secure'],
              ['♙', 'Owner Authority', 'Active'],
              ['▤', 'Device Integrity', 'Verified'],
              ['◌', 'Recovery Status', 'Ready'],
            ].map(([symbol, label, value], index) => (
              <View key={label} style={[styles.securityItem, index === 3 && styles.securityItemLast]}>
                <Text style={styles.securityIcon}>{symbol}</Text>
                <Text style={styles.securityLabel}>{label}</Text>
                <Text style={styles.securityValue}>{value}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.ecosystemCard}>
          <Pressable style={styles.cardHeader} onPress={() => navigate('VoltaireProtocols')}>
            <View style={styles.cardTitleRow}><Text style={styles.ecoHeaderIcon}>♛</Text><Text style={styles.ecoTitle}>Voltaire Ecosystem</Text></View>
            <Text style={styles.exploreText}>Explore All  ›</Text>
          </Pressable>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ecoRow}>
            {ecosystem.map(([symbol, label, tint]) => (
              <View key={label} style={styles.ecoItem}>
                <View style={[styles.ecoIcon, { borderColor: tint, shadowColor: tint }]}><Text style={[styles.ecoMark, { color: tint }]}>{symbol}</Text></View>
                <Text style={styles.ecoLabel}>{label}</Text>
              </View>
            ))}
          </ScrollView>
        </Card>

        <View style={styles.bottomNav}>
          {navItems.map(([symbol, label, route], index) => (
            <Pressable key={label} onPress={() => navigate(route)} style={[styles.navItem, index === 0 && styles.navItemActive]}>
              <Text style={[styles.navIcon, index === 0 && styles.navActive]}>{symbol}</Text>
              <Text style={[styles.navLabel, index === 0 && styles.navActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020812' },
  page: { width: '100%', alignSelf: 'center', paddingTop: 20, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 20 },
  headerCompact: { gap: 7 },
  brandRow: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  brandCopy: { marginLeft: 12, flexShrink: 1 },
  brandTitle: { color: '#fff', fontWeight: '900', letterSpacing: 0.5 },
  brandSub: { color: '#fff', marginTop: 3 },
  blue: { color: '#148cff' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#0c385d', borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14, backgroundColor: 'rgba(2,15,27,0.92)' },
  statusPillCompact: { paddingHorizontal: 9, paddingVertical: 7, gap: 6 },
  statusShield: { color: '#23f57a', fontSize: 25, fontWeight: '900' },
  statusTop: { color: '#dbe7f6' },
  statusBottom: { color: '#23f57a', fontWeight: '900', marginTop: 1 },
  bell: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#0c385d', alignItems: 'center', justifyContent: 'center' },
  bellText: { color: '#adc1d9', fontSize: 24 },
  card: { borderWidth: 1, borderColor: '#0a426d', backgroundColor: 'rgba(3,16,29,0.96)', borderRadius: 18, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 16px 55px rgba(0,0,0,.32)' } as any, default: {} }) },
  heroCard: { minHeight: 320 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  heroTopCompact: { gap: 3 },
  balanceArea: { flex: 1.05, minWidth: 0 },
  eyebrow: { color: '#f1f6fc' },
  balanceLine: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 },
  balance: { color: '#fff', fontWeight: '900', letterSpacing: -2.2, lineHeight: 70 },
  currency: { color: '#fff', marginBottom: 6 },
  change: { color: '#23f57a', fontWeight: '800', marginTop: 4 },
  chart: { flex: 0.95, minWidth: 110 },
  assetRow: { paddingTop: 25, paddingBottom: 3, alignItems: 'flex-start' },
  asset: { alignItems: 'center' },
  token: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.17)', marginBottom: 8 },
  moreToken: { backgroundColor: '#06172a', borderColor: '#164976' },
  moreText: { color: '#e3edf9', fontSize: 18, fontWeight: '900' },
  assetSymbol: { color: '#fff', fontWeight: '800', fontSize: 13 },
  assetAmount: { color: '#f4f8ff', marginTop: 4, fontSize: 12 },
  assetValue: { color: '#a9b7ca', marginTop: 4, fontSize: 11 },
  sectionTitle: { color: '#fff', fontWeight: '900', marginTop: 23, marginBottom: 13 },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionCard: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: '#0a426d', borderRadius: 16, backgroundColor: 'rgba(4,18,31,.94)', alignItems: 'center', justifyContent: 'center' },
  actionIcon: { color: '#148cff', fontWeight: '900', textShadowColor: 'rgba(20,140,255,.6)', textShadowRadius: 10 },
  actionLabel: { color: '#fff', fontWeight: '800', marginTop: 4 },
  travelCard: { marginTop: 20, borderColor: '#0b9d58', backgroundColor: 'rgba(0,41,28,.91)' },
  cardHeader: { minHeight: 64, paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(35,245,122,.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  travelIcon: { fontSize: 24 },
  travelTitle: { color: '#23f57a', fontWeight: '900', fontSize: 18 },
  activePill: { color: '#23f57a', fontWeight: '900', borderWidth: 1, borderColor: 'rgba(35,245,122,.45)', backgroundColor: 'rgba(0,105,50,.3)', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, fontSize: 12 },
  dots: { color: '#23f57a', fontSize: 20 },
  metrics: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 22 },
  metricsCompact: { paddingHorizontal: 4 },
  metric: { flex: 1, minWidth: 0, paddingHorizontal: 11, borderRightWidth: 1, borderRightColor: 'rgba(35,245,122,.2)' },
  metricLast: { borderRightWidth: 0 },
  metricLabel: { color: '#a9b7ca', fontSize: 11 },
  metricValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 7 },
  metricUnit: { fontSize: 11, fontWeight: '500' },
  metricSub: { color: '#c4d0df', fontSize: 10, marginTop: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 },
  progressTrack: { flex: 1, maxWidth: 65, height: 7, borderRadius: 7, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,.12)' },
  progressFill: { height: '100%', borderRadius: 7, backgroundColor: '#23f57a' },
  progressText: { color: '#fff', fontSize: 10 },
  manageLink: { minHeight: 57, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: 'rgba(35,245,122,.13)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  manageText: { color: '#23f57a', fontWeight: '800' },
  manageArrow: { color: '#23f57a', fontSize: 28 },
  securityCard: { marginTop: 20 },
  securityHeaderIcon: { color: '#148cff', fontSize: 28, fontWeight: '900' },
  securityTitle: { color: '#fff', fontWeight: '900', fontSize: 18 },
  securePill: { color: '#148cff', borderWidth: 1, borderColor: '#0b4e82', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, fontWeight: '900', fontSize: 11 },
  blueArrow: { color: '#148cff', fontSize: 28 },
  securityGrid: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 21 },
  securityItem: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 7, borderRightWidth: 1, borderRightColor: 'rgba(20,140,255,.17)' },
  securityItemLast: { borderRightWidth: 0 },
  securityIcon: { color: '#23f57a', fontSize: 27, fontWeight: '900' },
  securityLabel: { color: '#fff', textAlign: 'center', fontSize: 10, marginTop: 8 },
  securityValue: { color: '#23f57a', textAlign: 'center', fontSize: 10, fontWeight: '800', marginTop: 6 },
  ecosystemCard: { marginTop: 20 },
  ecoHeaderIcon: { color: '#8457ff', fontSize: 25 },
  ecoTitle: { color: '#8457ff', fontWeight: '900', fontSize: 18 },
  exploreText: { color: '#148cff', fontWeight: '800', fontSize: 13 },
  ecoRow: { paddingHorizontal: 14, paddingVertical: 20 },
  ecoItem: { width: 92, alignItems: 'center' },
  ecoIcon: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, backgroundColor: '#061526', alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.45, shadowRadius: 12 },
  ecoMark: { fontSize: 23, fontWeight: '900' },
  ecoLabel: { color: '#fff', textAlign: 'center', fontSize: 10, lineHeight: 14, marginTop: 9 },
  bottomNav: { minHeight: 84, marginTop: 20, borderWidth: 1, borderColor: '#0a3559', borderRadius: 18, backgroundColor: 'rgba(3,14,25,.98)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 7 },
  navItem: { flex: 1, minWidth: 0, minHeight: 66, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  navItemActive: { backgroundColor: 'rgba(0,78,170,.12)' },
  navIcon: { color: '#aebacc', fontSize: 26 },
  navLabel: { color: '#aebacc', fontSize: 10, marginTop: 5 },
  navActive: { color: '#148cff' },
});

export default PortfolioScreen;
