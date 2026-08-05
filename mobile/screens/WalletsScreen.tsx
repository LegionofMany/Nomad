import React, { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadWallet, type NomadAsset } from '../nomad';

type AssetRow = {
  name: string;
  symbol: string;
  amount: string;
  subValue: string;
  value: string;
  change: string;
  changeColor: string;
  badge: string;
  tint: string;
  group: 'Crypto' | 'Stablecoins' | 'Tokens' | 'Custom';
};

type FilterName = 'All Assets' | AssetRow['group'];

const fallbackAssets: AssetRow[] = [
  { name: 'Bitcoin', symbol: 'BTC', amount: '0.3567', subValue: '$22,123.10', value: '$22,123.10', change: '+1.82%', changeColor: '#20f878', badge: '₿', tint: '#ff9f1c', group: 'Crypto' },
  { name: 'Hedera', symbol: 'HBAR', amount: '3,250.00', subValue: '$1,250.25', value: '$1,250.25', change: '+2.35%', changeColor: '#20f878', badge: 'H', tint: '#6c4dff', group: 'Crypto' },
  { name: 'XRP', symbol: 'XRP', amount: '1,250.00', subValue: '$750.00', value: '$750.00', change: '+0.95%', changeColor: '#20f878', badge: 'X', tint: '#151a20', group: 'Crypto' },
  { name: 'Stellar', symbol: 'XLM', amount: '5,200.00', subValue: '$310.40', value: '$310.40', change: '+1.25%', changeColor: '#20f878', badge: 'S', tint: '#1684ff', group: 'Crypto' },
  { name: 'XDC Network', symbol: 'XDC', amount: '1,090.00', subValue: '$620.00', value: '$620.00', change: '+0.48%', changeColor: '#20f878', badge: 'X', tint: '#0a5c9e', group: 'Crypto' },
  { name: 'Cardano', symbol: 'ADA', amount: '7,200.00', subValue: '$412.70', value: '$412.70', change: '-0.32%', changeColor: '#ff4b42', badge: '✣', tint: '#2368d8', group: 'Crypto' },
  { name: 'Algorand', symbol: 'ALGO', amount: '1,700.00', subValue: '$267.90', value: '$267.90', change: '+1.15%', changeColor: '#20f878', badge: 'A', tint: '#2859b8', group: 'Crypto' },
  { name: 'Ethereum', symbol: 'ETH', amount: '1.2500', subValue: '$2,286.35', value: '$2,286.35', change: '+1.05%', changeColor: '#20f878', badge: '♦', tint: '#5a6174', group: 'Crypto' },
  { name: 'USD Coin', symbol: 'USDC', amount: '250.00', subValue: '$250.00', value: '$250.00', change: '0.00%', changeColor: '#d6dce8', badge: '$', tint: '#1684ff', group: 'Stablecoins' },
  { name: 'My Custom Token', symbol: 'CUSTOM', amount: '12,500.00', subValue: '$52.75', value: '$52.75', change: '+3.45%', changeColor: '#20f878', badge: '◇', tint: '#079b52', group: 'Custom' },
];

const badgeBySymbol: Record<string, string> = {
  BTC: '₿', HBAR: 'H', XRP: 'X', XLM: 'S', XDC: 'X', ADA: '✣', ALGO: 'A', ETH: '♦', USDC: '$', USDT: '₮', DAI: 'D',
};

const tintBySymbol: Record<string, string> = {
  BTC: '#ff9f1c', HBAR: '#6c4dff', XRP: '#151a20', XLM: '#1684ff', XDC: '#0a5c9e', ADA: '#2368d8', ALGO: '#2859b8', ETH: '#5a6174', USDC: '#1684ff', USDT: '#079b52', DAI: '#f2b84b',
};

function groupForSymbol(symbol: string): AssetRow['group'] {
  if (['USDC', 'USDT', 'DAI'].includes(symbol)) return 'Stablecoins';
  if (symbol === 'CUSTOM') return 'Custom';
  return 'Crypto';
}

function mapNomadAsset(asset: NomadAsset): AssetRow {
  const symbol = asset.symbol.toUpperCase();
  const change = asset.change24h ?? '+0.00%';
  return {
    name: asset.name,
    symbol,
    amount: asset.balance,
    subValue: asset.fiatValueUsd,
    value: asset.fiatValueUsd,
    change,
    changeColor: change.startsWith('-') ? '#ff4b42' : change === '0.00%' || change === '+0.00%' ? '#d6dce8' : '#20f878',
    badge: badgeBySymbol[symbol] ?? symbol.slice(0, 1),
    tint: tintBySymbol[symbol] ?? '#079b52',
    group: groupForSymbol(symbol),
  };
}

const shieldSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 96">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#25b9ff"/><stop offset="1" stop-color="#0064ff"/></linearGradient></defs>
  <path d="M42 4 74 18v24c0 23-13 39-32 50C23 81 10 65 10 42V18Z" fill="#031120" stroke="url(#g)" stroke-width="6"/>
  <path d="m19 48 10-10 8 8 9-11 8 10 12-9" fill="none" stroke="#138cff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);

const walletSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0b2d68"/><stop offset="1" stop-color="#03152d"/></linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <ellipse cx="126" cy="80" rx="100" ry="55" fill="none" stroke="#087cff" stroke-opacity=".35"/>
  <ellipse cx="126" cy="80" rx="78" ry="38" fill="none" stroke="#19b8ff" stroke-opacity=".35" stroke-dasharray="4 7"/>
  <path d="M56 42 82 20h74l28 24v72H56Z" fill="url(#g)" stroke="#0e7cff" stroke-width="5" filter="url(#glow)"/>
  <path d="M56 56h122v62H56z" fill="#04172e" stroke="#168cff" stroke-width="5"/>
  <path d="M156 67h45v36h-45c-12 0-18-7-18-18s6-18 18-18Z" fill="#061a35" stroke="#168cff" stroke-width="5"/>
  <circle cx="165" cy="85" r="5" fill="#168cff"/>
  <path d="m104 71 18-8 18 8v16c0 12-7 21-18 27-11-6-18-15-18-27Z" fill="#052546" stroke="#168cff" stroke-width="4"/>
  <path d="m110 87 7-7 6 6 7-9 7 8" fill="none" stroke="#168cff" stroke-width="4" stroke-linecap="round"/>
</svg>`);

function ShieldLogo({ size = 58 }: { size?: number }) {
  return <Image source={{ uri: `data:image/svg+xml;utf8,${shieldSvg}` }} resizeMode="contain" style={{ width: size, height: size * 1.14 }} />;
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function AssetBadge({ asset, size = 46 }: { asset: AssetRow; size?: number }) {
  return (
    <View style={[styles.assetBadge, { width: size, height: size, borderRadius: size / 2, backgroundColor: asset.tint }]}>
      <Text style={{ color: '#fff', fontSize: asset.badge.length > 1 ? size * 0.37 : size * 0.5, fontWeight: '900' }}>{asset.badge}</Text>
    </View>
  );
}

export default function WalletsScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const compact = width < 620;
  const desktop = width >= 980;
  const { totalBalance, assets: liveAssets, loading } = useNomadWallet();

  const [activeFilter, setActiveFilter] = useState<FilterName>('All Assets');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AssetRow | null>(null);
  const [customPanel, setCustomPanel] = useState(false);

  const assets = useMemo(() => liveAssets.length ? liveAssets.map(mapNomadAsset) : fallbackAssets, [liveAssets]);
  const filteredAssets = useMemo(() => assets.filter((asset) => {
    const filterMatch = activeFilter === 'All Assets' || asset.group === activeFilter || (activeFilter === 'Tokens' && asset.group !== 'Crypto');
    const q = query.trim().toLowerCase();
    const queryMatch = !q || asset.name.toLowerCase().includes(q) || asset.symbol.toLowerCase().includes(q);
    return filterMatch && queryMatch;
  }), [activeFilter, assets, query]);

  const filters: FilterName[] = ['All Assets', 'Crypto', 'Stablecoins', 'Tokens', 'Custom'];
  const navItems = [
    ['⌂', 'Home', 'Portfolio'], ['▣', 'Wallets', 'Wallets'], ['✈', 'Travel', 'TravelMode'], ['◇', 'Security', 'SecurityCenter'], ['⚙', 'Settings', 'Settings'],
  ] as const;

  const cycleFilter = () => {
    const index = filters.indexOf(activeFilter);
    setActiveFilter(filters[(index + 1) % filters.length]);
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.page, { paddingHorizontal: compact ? 14 : 24, maxWidth: desktop ? 1120 : 860 }]}>
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <ShieldLogo size={compact ? 48 : 60} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.title, { fontSize: compact ? 27 : 34 }]}>Wallets</Text>
              <Text style={[styles.subtitle, { fontSize: compact ? 12 : 15 }]}>Manage all your digital assets</Text>
            </View>
          </View>
          <View style={styles.headerButtons}>
            <Pressable accessibilityLabel="Search wallets" onPress={() => setSearchOpen((value) => !value)} style={styles.circleButton}><Text style={styles.circleIcon}>⌕</Text></Pressable>
            <Pressable accessibilityLabel="Cycle wallet filters" onPress={cycleFilter} style={styles.circleButton}><Text style={styles.circleIcon}>▽</Text></Pressable>
            <Pressable accessibilityLabel="Add custom asset" onPress={() => { setCustomPanel(true); setActiveFilter('Custom'); }} style={styles.circleButton}><Text style={styles.plusIcon}>＋</Text></Pressable>
          </View>
        </View>

        {searchOpen ? (
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput value={query} onChangeText={setQuery} placeholder="Search assets or symbols" placeholderTextColor="#71839a" style={styles.searchInput} autoFocus />
            {query ? <Pressable onPress={() => setQuery('')}><Text style={styles.clearSearch}>×</Text></Pressable> : null}
          </View>
        ) : null}

        <Card style={[styles.hero, { padding: compact ? 18 : 25 }]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { fontSize: compact ? 14 : 18 }]}>Total Wallet Balance  ◎</Text>
            <View style={styles.balanceRow}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.balance, { fontSize: compact ? 43 : 62, maxWidth: compact ? 270 : undefined }]}>{loading ? 'Loading…' : (liveAssets.length ? totalBalance : '$24,832.45')}</Text>
              {!loading ? <Text style={[styles.currency, { fontSize: compact ? 14 : 20 }]}>USD</Text> : null}
            </View>
            <Text style={[styles.change, { fontSize: compact ? 15 : 19 }]}>+1.82% (24h)</Text>
          </View>
          <Image source={{ uri: `data:image/svg+xml;utf8,${walletSvg}` }} resizeMode="contain" style={[styles.walletArt, { width: compact ? 120 : 210, height: compact ? 90 : 145 }]} />
        </Card>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((filter) => {
            const active = filter === activeFilter;
            return (
              <Pressable key={filter} onPress={() => setActiveFilter(filter)} style={[styles.filter, active && styles.filterActive]}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Card>
          {!compact ? (
            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, { flex: 1.7 }]}>Asset</Text>
              <Text style={[styles.columnHeader, { flex: 1.15 }]}>Balance  ↓</Text>
              <Text style={[styles.columnHeader, { flex: 1.05, textAlign: 'right' }]}>Value (USD)</Text>
              <Text style={[styles.columnHeader, { width: 112, textAlign: 'right' }]}>24h Change</Text>
              <View style={{ width: 25 }} />
            </View>
          ) : null}

          {filteredAssets.map((asset, index) => (
            <Pressable key={`${asset.symbol}-${index}`} onPress={() => setSelected(selected?.symbol === asset.symbol ? null : asset)} style={[styles.assetRow, compact && styles.assetRowCompact]}>
              <View style={[styles.assetIdentity, { flex: compact ? 1.35 : 1.7 }]}>
                <AssetBadge asset={asset} size={compact ? 42 : 48} />
                <View style={{ flexShrink: 1 }}>
                  <Text numberOfLines={1} style={[styles.assetName, { fontSize: compact ? 14 : 17 }]}>{asset.name}</Text>
                  <Text style={[styles.assetSymbol, { fontSize: compact ? 12 : 14 }]}>{asset.symbol}</Text>
                </View>
              </View>
              <View style={{ flex: compact ? 0.9 : 1.15 }}>
                <Text numberOfLines={1} style={[styles.assetAmount, { fontSize: compact ? 14 : 17 }]}>{asset.amount}</Text>
                <Text numberOfLines={1} style={styles.assetSub}>{asset.subValue}</Text>
              </View>
              {!compact ? <Text style={[styles.assetValue, { flex: 1.05 }]}>{asset.value}</Text> : null}
              <Text style={[styles.assetChange, { color: asset.changeColor, width: compact ? 66 : 112, fontSize: compact ? 13 : 16 }]}>{asset.change}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}

          {!filteredAssets.length ? <Text style={styles.empty}>No assets match this view.</Text> : null}
        </Card>

        {selected ? (
          <Card style={styles.selectedCard}>
            <View style={styles.selectedTop}>
              <View style={styles.assetIdentity}><AssetBadge asset={selected} size={50} /><View><Text style={styles.selectedTitle}>{selected.name}</Text><Text style={styles.assetSymbol}>{selected.symbol} wallet</Text></View></View>
              <Pressable onPress={() => setSelected(null)}><Text style={styles.close}>×</Text></Pressable>
            </View>
            <View style={styles.selectedMetrics}>
              <View><Text style={styles.selectedLabel}>Balance</Text><Text style={styles.selectedValue}>{selected.amount} {selected.symbol}</Text></View>
              <View><Text style={styles.selectedLabel}>USD value</Text><Text style={styles.selectedValue}>{selected.value}</Text></View>
              <View><Text style={styles.selectedLabel}>24h</Text><Text style={[styles.selectedValue, { color: selected.changeColor }]}>{selected.change}</Text></View>
            </View>
            <View style={styles.selectedActions}>
              <Pressable onPress={() => navigation.navigate('SendBitcoin')} style={styles.selectedButton}><Text style={styles.selectedButtonText}>Send</Text></Pressable>
              <Pressable onPress={() => navigation.navigate('ReceiveBitcoin')} style={styles.selectedButton}><Text style={styles.selectedButtonText}>Receive</Text></Pressable>
              <Pressable onPress={() => navigation.navigate('Swap')} style={styles.selectedButton}><Text style={styles.selectedButtonText}>Swap</Text></Pressable>
            </View>
          </Card>
        ) : null}

        <Pressable onPress={() => { setCustomPanel((value) => !value); setActiveFilter('Custom'); }} style={styles.addAsset}>
          <View style={styles.addIcon}><Text style={styles.plusIcon}>＋</Text></View>
          <View style={{ flex: 1 }}><Text style={styles.addTitle}>Add Custom Asset</Text><Text style={styles.addSub}>Add tokens or assets to your wallet</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {customPanel ? (
          <Card style={styles.customPanel}>
            <Text style={styles.customTitle}>Custom asset import</Text>
            <Text style={styles.customCopy}>Enter a token symbol or contract address in the production wallet connection. The preview keeps this control local and does not request funds or sign transactions.</Text>
            <Pressable onPress={() => setCustomPanel(false)} style={styles.customDone}><Text style={styles.customDoneText}>Done</Text></Pressable>
          </Card>
        ) : null}

        <View style={styles.bottomNav}>
          {navItems.map(([icon, label, route]) => {
            const active = label === 'Wallets';
            return (
              <Pressable key={label} onPress={() => navigation.navigate(route)} style={[styles.navItem, active && styles.navItemActive]}>
                <Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text>
                <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020812' },
  page: { width: '100%', alignSelf: 'center', paddingTop: 20, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  titleGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  title: { color: '#fff', fontWeight: '900' },
  subtitle: { color: '#c5d0df', marginTop: 3 },
  headerButtons: { flexDirection: 'row', gap: 8 },
  circleButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#0a3c64', backgroundColor: 'rgba(3,16,30,.96)', alignItems: 'center', justifyContent: 'center' },
  circleIcon: { color: '#dbe7f7', fontSize: 27 },
  plusIcon: { color: '#168cff', fontSize: 30, lineHeight: 32 },
  searchBar: { minHeight: 52, marginBottom: 16, borderWidth: 1, borderColor: '#0a426d', borderRadius: 14, backgroundColor: 'rgba(3,16,30,.96)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  searchIcon: { color: '#168cff', fontSize: 25, marginRight: 10 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, outlineStyle: 'none' } as any,
  clearSearch: { color: '#9cafc6', fontSize: 28 },
  card: { borderWidth: 1, borderColor: '#0a426d', backgroundColor: 'rgba(3,16,29,.97)', borderRadius: 18, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 16px 50px rgba(0,0,0,.28)' } as any, default: {} }) },
  hero: { flexDirection: 'row', alignItems: 'center', minHeight: 190 },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#f1f6fc' },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 },
  balance: { color: '#fff', fontWeight: '900', letterSpacing: -2, lineHeight: 66 },
  currency: { color: '#fff' },
  change: { color: '#20f878', fontWeight: '800', marginTop: 4 },
  walletArt: { marginLeft: 6 },
  filters: { paddingVertical: 20, paddingRight: 15 },
  filter: { minHeight: 48, minWidth: 118, marginRight: 12, borderWidth: 1, borderColor: '#1a2b40', borderRadius: 13, backgroundColor: 'rgba(8,14,24,.9)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  filterActive: { borderColor: '#168cff', backgroundColor: 'rgba(22,132,255,.21)', ...Platform.select({ web: { boxShadow: '0 0 18px rgba(22,132,255,.25)' } as any, default: {} }) },
  filterText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  filterTextActive: { fontWeight: '900' },
  tableHeader: { minHeight: 49, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  columnHeader: { color: '#cbd7e8', fontWeight: '700', fontSize: 13 },
  assetRow: { minHeight: 88, paddingHorizontal: 20, paddingVertical: 13, borderTopWidth: 1, borderTopColor: 'rgba(22,132,255,.13)', flexDirection: 'row', alignItems: 'center' },
  assetRowCompact: { paddingHorizontal: 12, minHeight: 82 },
  assetIdentity: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  assetBadge: { alignItems: 'center', justifyContent: 'center', marginRight: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' },
  assetName: { color: '#fff', fontWeight: '800' },
  assetSymbol: { color: '#c5d0df', marginTop: 4 },
  assetAmount: { color: '#fff', fontWeight: '700' },
  assetSub: { color: '#aebbd0', fontSize: 11, marginTop: 4 },
  assetValue: { color: '#fff', textAlign: 'right', fontSize: 16 },
  assetChange: { textAlign: 'right' },
  chevron: { color: '#168cff', fontSize: 30, marginLeft: 5 },
  empty: { color: '#9cafc6', textAlign: 'center', padding: 28 },
  selectedCard: { marginTop: 18, padding: 18 },
  selectedTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedTitle: { color: '#fff', fontWeight: '900', fontSize: 18 },
  close: { color: '#9cafc6', fontSize: 30 },
  selectedMetrics: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(22,132,255,.13)' },
  selectedLabel: { color: '#93a5bb', fontSize: 11 },
  selectedValue: { color: '#fff', fontWeight: '800', marginTop: 5 },
  selectedActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  selectedButton: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: '#168cff', borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(22,132,255,.12)' },
  selectedButtonText: { color: '#168cff', fontWeight: '800' },
  addAsset: { minHeight: 82, marginTop: 18, borderWidth: 1, borderColor: '#0a426d', backgroundColor: 'rgba(3,16,29,.97)', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' },
  addIcon: { width: 50, height: 50, borderRadius: 9, borderWidth: 1, borderStyle: 'dashed', borderColor: '#168cff', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  addTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  addSub: { color: '#aebbd0', fontSize: 12, marginTop: 5 },
  customPanel: { marginTop: 14, padding: 18 },
  customTitle: { color: '#fff', fontWeight: '900', fontSize: 17 },
  customCopy: { color: '#aebbd0', lineHeight: 20, marginTop: 8 },
  customDone: { alignSelf: 'flex-start', marginTop: 16, borderWidth: 1, borderColor: '#168cff', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  customDoneText: { color: '#168cff', fontWeight: '800' },
  bottomNav: { minHeight: 84, marginTop: 20, borderWidth: 1, borderColor: '#0a3559', borderRadius: 18, backgroundColor: 'rgba(3,14,25,.98)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 7 },
  navItem: { flex: 1, minHeight: 66, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  navItemActive: { backgroundColor: 'rgba(0,78,170,.12)' },
  navIcon: { color: '#aebacc', fontSize: 26 },
  navLabel: { color: '#aebacc', fontSize: 10, marginTop: 5 },
  navActive: { color: '#168cff' },
});
