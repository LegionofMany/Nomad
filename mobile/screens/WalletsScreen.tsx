import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useNomadWallet, type NomadAsset } from '../nomad';
import { BottomNav, NomadBrandMark, NomadPage, useNomadLayout } from '../ui/NomadShell';

type AssetGroup = 'Crypto' | 'Stablecoins' | 'Tokens' | 'Custom';
type FilterName = 'All Assets' | AssetGroup;
type SortMode = 'default' | 'value-desc' | 'value-asc' | 'change-desc' | 'name';

type AssetRow = {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  subValue: string;
  value: string;
  change: string;
  changeColor: string;
  badge: string;
  tint: string;
  textColor?: string;
  group: AssetGroup;
};

const GREEN = '#20f878';
const BLUE = '#168cff';
const BORDER = '#0a426d';
const PANEL = 'rgba(3,16,29,.97)';
const MUTED = '#aebbd0';

const fallbackAssets: AssetRow[] = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', amount: '0.3567', subValue: '$22,123.10', value: '$22,123.10', change: '+1.82%', changeColor: GREEN, badge: '₿', tint: '#ff9412', group: 'Crypto' },
  { id: 'hbar', name: 'Hedera', symbol: 'HBAR', amount: '3,250.00', subValue: '$1,250.25', value: '$1,250.25', change: '+2.35%', changeColor: GREEN, badge: 'H', tint: '#6844ef', group: 'Crypto' },
  { id: 'xrp', name: 'XRP', symbol: 'XRP', amount: '1,250.00', subValue: '$750.00', value: '$750.00', change: '+0.95%', changeColor: GREEN, badge: 'X', tint: '#161a20', group: 'Crypto' },
  { id: 'xlm', name: 'Stellar', symbol: 'XLM', amount: '5,200.00', subValue: '$310.40', value: '$310.40', change: '+1.25%', changeColor: GREEN, badge: 'S', tint: '#147ff5', group: 'Crypto' },
  { id: 'xdc', name: 'XDC Network', symbol: 'XDC', amount: '1,090.00', subValue: '$620.00', value: '$620.00', change: '+0.48%', changeColor: GREEN, badge: 'X', tint: '#095ba0', group: 'Crypto' },
  { id: 'ada', name: 'Cardano', symbol: 'ADA', amount: '7,200.00', subValue: '$412.70', value: '$412.70', change: '-0.32%', changeColor: '#ff4b42', badge: '✣', tint: '#2368d8', group: 'Crypto' },
  { id: 'algo', name: 'Algorand', symbol: 'ALGO', amount: '1,700.00', subValue: '$267.90', value: '$267.90', change: '+1.15%', changeColor: GREEN, badge: 'A', tint: '#2859b8', group: 'Crypto' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', amount: '1.2500', subValue: '$2,286.35', value: '$2,286.35', change: '+1.05%', changeColor: GREEN, badge: '♦', tint: '#596174', group: 'Crypto' },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', amount: '250.00', subValue: '$250.00', value: '$250.00', change: '0.00%', changeColor: '#d6dce8', badge: '$', tint: '#1684ff', group: 'Stablecoins' },
  { id: 'custom', name: 'My Custom Token', symbol: 'CUSTOM', amount: '12,500.00', subValue: '$52.75', value: '$52.75', change: '+3.45%', changeColor: GREEN, badge: '◇', tint: '#079b52', group: 'Custom' },
];

const badgeBySymbol: Record<string, string> = {
  BTC: '₿', HBAR: 'H', XRP: 'X', XLM: 'S', XDC: 'X', ADA: '✣', ALGO: 'A', ETH: '♦',
  USDC: '$', USDT: '₮', DAI: 'D', SOL: 'S', QNT: 'Q', IOTA: 'I',
};

const tintBySymbol: Record<string, string> = {
  BTC: '#ff9412', HBAR: '#6844ef', XRP: '#161a20', XLM: '#147ff5', XDC: '#095ba0', ADA: '#2368d8',
  ALGO: '#2859b8', ETH: '#596174', USDC: '#1684ff', USDT: '#079b52', DAI: '#f2aa22', SOL: '#6946ff',
  QNT: '#d32f4f', IOTA: '#17324f',
};

const cryptoSymbols = new Set(['BTC', 'HBAR', 'XRP', 'XLM', 'XDC', 'ADA', 'ALGO', 'ETH', 'SOL', 'QNT', 'IOTA']);
const stableSymbols = new Set(['USDC', 'USDT', 'DAI', 'USDP', 'TUSD']);

function groupForSymbol(symbol: string): AssetGroup {
  if (stableSymbols.has(symbol)) return 'Stablecoins';
  if (symbol === 'CUSTOM') return 'Custom';
  if (cryptoSymbols.has(symbol)) return 'Crypto';
  return 'Tokens';
}

function mapNomadAsset(asset: NomadAsset, index: number): AssetRow {
  const symbol = asset.symbol.toUpperCase();
  const change = asset.change24h ?? '+0.00%';
  return {
    id: `${symbol}-${index}`,
    name: asset.name,
    symbol,
    amount: asset.balance,
    subValue: asset.fiatValueUsd,
    value: asset.fiatValueUsd,
    change,
    changeColor: change.startsWith('-') ? '#ff4b42' : change === '0.00%' || change === '+0.00%' ? '#d6dce8' : GREEN,
    badge: badgeBySymbol[symbol] ?? symbol.slice(0, 1),
    tint: tintBySymbol[symbol] ?? '#0b4c78',
    group: groupForSymbol(symbol),
  };
}

function numericCurrency(value: string): number {
  const parsed = Number(value.replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function numericPercent(value: string): number {
  const parsed = Number(value.replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function ActionGlyph({ kind, size }: { kind: 'search' | 'filter' | 'plus'; size: number }) {
  return (
    <Svg accessibilityLabel={`${kind} icon`} width={size} height={size} viewBox="0 0 64 64" fill="none">
      {kind === 'search' ? <><Circle cx="27" cy="27" r="14" stroke="#d8e4f4" strokeWidth="4" /><Path d="m38 38 12 12" stroke="#d8e4f4" strokeWidth="4" strokeLinecap="round" /></> : null}
      {kind === 'filter' ? <Path d="M11 14h42L38 32v15l-12 6V32Z" stroke="#d8e4f4" strokeWidth="4" strokeLinejoin="round" /> : null}
      {kind === 'plus' ? <Path d="M32 12v40M12 32h40" stroke={BLUE} strokeWidth="4" strokeLinecap="round" /> : null}
    </Svg>
  );
}

function WalletArtwork({ compact }: { compact: boolean }) {
  return (
    <Svg accessibilityLabel="Nomad wallet illustration" width={compact ? 132 : 230} height={compact ? 96 : 150} viewBox="0 0 280 165" fill="none" style={styles.walletArt}>
      <Defs><LinearGradient id="walletGradient" x1="78" y1="18" x2="225" y2="123"><Stop stopColor="#0a2d69" /><Stop offset="1" stopColor="#02152f" /></LinearGradient></Defs>
      <Ellipse cx="155" cy="84" rx="112" ry="55" stroke="#087cff" strokeOpacity={0.35} />
      <Ellipse cx="155" cy="84" rx="87" ry="39" stroke="#21baff" strokeOpacity={0.3} strokeDasharray="4 7" />
      <Path d="M78 43 106 18h89l30 26v74H78Z" fill="url(#walletGradient)" stroke="#0e7cff" strokeWidth="5" />
      <Rect x="78" y="56" width="136" height="67" fill="#04172e" stroke={BLUE} strokeWidth="5" />
      <Path d="M190 68h54v38h-54c-12 0-19-8-19-19s7-19 19-19Z" fill="#061a35" stroke={BLUE} strokeWidth="5" />
      <Circle cx="199" cy="87" r="5" fill={BLUE} />
      <Path d="m125 72 19-8 19 8v16c0 13-7 22-19 28-12-6-19-15-19-28Z" fill="#052546" stroke={BLUE} strokeWidth="4" />
      <Path d="m132 88 7-7 6 6 7-9 7 8" stroke={BLUE} strokeWidth="4" strokeLinecap="round" />
    </Svg>
  );
}

function AssetBadge({ asset, size = 46 }: { asset: AssetRow; size?: number }) {
  return (
    <View style={[styles.assetBadge, { width: size, height: size, borderRadius: size / 2, backgroundColor: asset.tint }]}>
      <Text style={{ color: asset.textColor ?? '#fff', fontSize: asset.badge.length > 1 ? size * .34 : size * .48, fontWeight: '900' }}>{asset.badge}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText(value: string): void; placeholder: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#708196"
        autoCapitalize="characters"
        style={styles.field}
      />
    </View>
  );
}

export default function WalletsScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { totalBalance, assets: liveAssets, loading } = useNomadWallet();

  const [activeFilter, setActiveFilter] = useState<FilterName>('All Assets');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [selected, setSelected] = useState<AssetRow | null>(null);
  const [customPanel, setCustomPanel] = useState(false);
  const [customAssets, setCustomAssets] = useState<AssetRow[]>([]);
  const [customName, setCustomName] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [customContract, setCustomContract] = useState('');
  const [feedback, setFeedback] = useState('');

  const baseAssets = useMemo(
    () => liveAssets.length ? liveAssets.map(mapNomadAsset) : fallbackAssets,
    [liveAssets],
  );

  const assets = useMemo(() => [...baseAssets, ...customAssets], [baseAssets, customAssets]);

  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = assets.filter((asset) => {
      const filterMatch = activeFilter === 'All Assets' || asset.group === activeFilter;
      const queryMatch = !q || asset.name.toLowerCase().includes(q) || asset.symbol.toLowerCase().includes(q);
      return filterMatch && queryMatch;
    });

    if (sortMode === 'value-desc') return [...next].sort((a, b) => numericCurrency(b.value) - numericCurrency(a.value));
    if (sortMode === 'value-asc') return [...next].sort((a, b) => numericCurrency(a.value) - numericCurrency(b.value));
    if (sortMode === 'change-desc') return [...next].sort((a, b) => numericPercent(b.change) - numericPercent(a.change));
    if (sortMode === 'name') return [...next].sort((a, b) => a.name.localeCompare(b.name));
    return next;
  }, [activeFilter, assets, query, sortMode]);

  const filters: FilterName[] = ['All Assets', 'Crypto', 'Stablecoins', 'Tokens', 'Custom'];

  const openCustomAsset = () => {
    setCustomPanel(true);
    setActiveFilter('Custom');
    setFeedback('');
  };

  const addCustomAsset = () => {
    const name = customName.trim();
    const symbol = customSymbol.trim().toUpperCase();
    if (name.length < 2 || symbol.length < 2) {
      setFeedback('Enter an asset name and symbol.');
      return;
    }
    if (assets.some((asset) => asset.symbol === symbol)) {
      setFeedback(`${symbol} already exists in this wallet view.`);
      return;
    }
    const created: AssetRow = {
      id: `custom-${Date.now()}`,
      name,
      symbol,
      amount: '0.00',
      subValue: '$0.00',
      value: '$0.00',
      change: '0.00%',
      changeColor: '#d6dce8',
      badge: symbol.slice(0, 1),
      tint: '#079b52',
      group: 'Custom',
    };
    setCustomAssets((current) => [...current, created]);
    setCustomName('');
    setCustomSymbol('');
    setCustomContract('');
    setFeedback(`${symbol} added to this wallet preview.`);
  };

  const toggleValueSort = () => {
    setSortMode((current) => current === 'value-desc' ? 'value-asc' : 'value-desc');
  };

  const balanceLabel = loading ? 'Loading…' : liveAssets.length ? totalBalance : '$24,832.45';

  return (
    <NomadPage maxWidth={1120}>
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <NomadBrandMark size={compact ? 48 : 58} />
            <View style={styles.titleCopy}>
              <Text style={[styles.title, { fontSize: compact ? 28 : 35 }]}>Wallets</Text>
              <Text style={[styles.subtitle, { fontSize: compact ? 12 : 15 }]}>Manage all your digital assets</Text>
            </View>
          </View>
          <View style={styles.headerButtons}>
            <Pressable accessibilityRole="button" accessibilityLabel="Search assets" onPress={() => setSearchOpen((value) => !value)} style={styles.circleButton}>
              <ActionGlyph kind="search" size={compact ? 24 : 28} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Open wallet filters" onPress={() => setFilterOpen((value) => !value)} style={[styles.circleButton, filterOpen && styles.circleButtonActive]}>
              <ActionGlyph kind="filter" size={compact ? 23 : 27} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Add custom asset" onPress={openCustomAsset} style={styles.circleButton}>
              <ActionGlyph kind="plus" size={compact ? 25 : 30} />
            </Pressable>
          </View>
        </View>

        {searchOpen ? (
          <View style={styles.searchBar}>
            <ActionGlyph kind="search" size={23} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search assets or symbols"
              placeholderTextColor="#71839a"
              autoFocus
              style={styles.searchInput}
            />
            {query ? <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')}><Text style={styles.clearSearch}>×</Text></Pressable> : null}
          </View>
        ) : null}

        {filterOpen ? (
          <View style={styles.filterPanel}>
            <View style={styles.filterPanelHead}>
              <View><Text style={styles.filterPanelTitle}>Sort & filter</Text><Text style={styles.filterPanelSub}>{filteredAssets.length} assets shown</Text></View>
              <Pressable onPress={() => { setSortMode('default'); setActiveFilter('All Assets'); }}><Text style={styles.resetText}>Reset</Text></Pressable>
            </View>
            <View style={styles.sortRow}>
              {([
                ['default', 'Wallet order'],
                ['value-desc', 'Highest value'],
                ['change-desc', 'Top movers'],
                ['name', 'A–Z'],
              ] as const).map(([mode, label]) => (
                <Pressable key={mode} onPress={() => setSortMode(mode)} style={[styles.sortChip, sortMode === mode && styles.sortChipActive]}>
                  <Text style={[styles.sortChipText, sortMode === mode && styles.sortChipTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={[styles.card, styles.hero, { padding: compact ? 18 : 25 }]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { fontSize: compact ? 14 : 18 }]}>Total Wallet Balance  ◉</Text>
            <View style={styles.balanceRow}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.balance, { fontSize: compact ? 43 : 62, maxWidth: compact ? 250 : undefined }]}>{balanceLabel}</Text>
              {!loading ? <Text style={[styles.currency, { fontSize: compact ? 14 : 20 }]}>USD</Text> : null}
            </View>
            <Text style={[styles.change, { fontSize: compact ? 15 : 19 }]}>+1.82% (24h)</Text>
          </View>
          <WalletArtwork compact={compact} />
        </View>

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

        <View style={styles.card}>
          <View style={[styles.tableHeader, compact && styles.tableHeaderCompact]}>
            <Text style={[styles.columnHeader, styles.assetColumn]}>Asset</Text>
            <Text style={[styles.columnHeader, styles.balanceColumn]}>Balance  ↓</Text>
            <Pressable onPress={toggleValueSort} style={styles.valueHeaderPress}>
              <Text style={[styles.columnHeader, styles.valueColumn]}>Value (USD)</Text>
            </Pressable>
            <Text style={[styles.columnHeader, styles.changeColumn]}>24h Change</Text>
            <View style={styles.chevronColumn} />
          </View>

          {filteredAssets.map((asset) => (
            <Pressable
              key={asset.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${asset.name}`}
              onPress={() => setSelected(selected?.id === asset.id ? null : asset)}
              style={({ pressed }) => [styles.assetRow, compact && styles.assetRowCompact, pressed && styles.rowPressed]}
            >
              <View style={[styles.assetIdentity, styles.assetColumn]}>
                <AssetBadge asset={asset} size={compact ? 39 : 48} />
                <View style={styles.assetCopy}>
                  <Text numberOfLines={1} style={[styles.assetName, { fontSize: compact ? 13 : 17 }]}>{asset.name}</Text>
                  <Text style={[styles.assetSymbol, { fontSize: compact ? 11 : 14 }]}>{asset.symbol}</Text>
                </View>
              </View>
              <View style={styles.balanceColumn}>
                <Text numberOfLines={1} style={[styles.assetAmount, { fontSize: compact ? 12 : 16 }]}>{asset.amount}</Text>
                <Text numberOfLines={1} style={[styles.assetSub, { fontSize: compact ? 9 : 11 }]}>{asset.subValue}</Text>
              </View>
              <Text numberOfLines={1} style={[styles.assetValue, styles.valueColumn, { fontSize: compact ? 11 : 16 }]}>{asset.value}</Text>
              <Text numberOfLines={1} style={[styles.assetChange, styles.changeColumn, { color: asset.changeColor, fontSize: compact ? 11 : 16 }]}>{asset.change}</Text>
              <Text style={[styles.chevron, styles.chevronColumn]}>›</Text>
            </Pressable>
          ))}

          {!filteredAssets.length ? <Text style={styles.empty}>No assets match this view.</Text> : null}
        </View>

        {selected ? (
          <View style={[styles.card, styles.selectedCard]}>
            <View style={styles.selectedTop}>
              <View style={styles.assetIdentity}>
                <AssetBadge asset={selected} size={50} />
                <View><Text style={styles.selectedTitle}>{selected.name}</Text><Text style={styles.assetSymbol}>{selected.symbol} wallet</Text></View>
              </View>
              <Pressable accessibilityLabel="Close asset details" onPress={() => setSelected(null)}><Text style={styles.close}>×</Text></Pressable>
            </View>
            <View style={styles.selectedMetrics}>
              <View style={styles.selectedMetric}><Text style={styles.selectedLabel}>Balance</Text><Text style={styles.selectedValue}>{selected.amount} {selected.symbol}</Text></View>
              <View style={styles.selectedMetric}><Text style={styles.selectedLabel}>USD value</Text><Text style={styles.selectedValue}>{selected.value}</Text></View>
              <View style={styles.selectedMetric}><Text style={styles.selectedLabel}>24h</Text><Text style={[styles.selectedValue, { color: selected.changeColor }]}>{selected.change}</Text></View>
            </View>
            <View style={styles.selectedActions}>
              <Pressable onPress={() => navigation.navigate('SendBitcoin')} style={styles.selectedButton}><Text style={styles.selectedButtonText}>Send</Text></Pressable>
              <Pressable onPress={() => navigation.navigate('ReceiveBitcoin')} style={styles.selectedButton}><Text style={styles.selectedButtonText}>Receive</Text></Pressable>
              <Pressable onPress={() => navigation.navigate('Swap')} style={styles.selectedButton}><Text style={styles.selectedButtonText}>Swap</Text></Pressable>
            </View>
          </View>
        ) : null}

        <Pressable accessibilityRole="button" accessibilityLabel="Add custom asset" onPress={openCustomAsset} style={styles.addAsset}>
          <View style={styles.addIcon}><ActionGlyph kind="plus" size={29} /></View>
          <View style={styles.addCopy}><Text style={styles.addTitle}>Add Custom Asset</Text><Text style={styles.addSub}>Add tokens or assets to your wallet</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {customPanel ? (
          <View style={[styles.card, styles.customPanel]}>
            <View style={styles.customHead}><View><Text style={styles.customTitle}>Add Custom Asset</Text><Text style={styles.customSub}>Add a token to this wallet view</Text></View><Pressable onPress={() => setCustomPanel(false)}><Text style={styles.close}>×</Text></Pressable></View>
            <View style={[styles.fields, compact && styles.fieldsCompact]}>
              <Field label="Asset name" value={customName} onChangeText={setCustomName} placeholder="Example Token" />
              <Field label="Symbol" value={customSymbol} onChangeText={setCustomSymbol} placeholder="TOKEN" />
            </View>
            <Field label="Contract or asset ID (optional)" value={customContract} onChangeText={setCustomContract} placeholder="0x… or network asset ID" />
            <Text style={styles.previewNotice}>This preview adds the asset locally. Persistent token import will use the connected wallet adapter.</Text>
            {feedback ? <Text style={[styles.feedback, feedback.includes('added') && styles.feedbackSuccess]}>{feedback}</Text> : null}
            <Pressable onPress={addCustomAsset} style={({ pressed }) => [styles.addCustomButton, pressed && { opacity: .75 }]}><Text style={styles.addCustomButtonText}>Add Asset</Text></Pressable>
          </View>
        ) : null}

        <BottomNav active="Wallets" />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 18 },
  titleGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  titleCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  title: { color: '#fff', fontWeight: '900' },
  subtitle: { color: '#c5d0df', marginTop: 3 },
  headerButtons: { flexDirection: 'row', gap: 7 },
  circleButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#0a3c64', backgroundColor: 'rgba(3,16,30,.96)', alignItems: 'center', justifyContent: 'center' },
  circleButtonActive: { borderColor: BLUE, backgroundColor: 'rgba(22,132,255,.13)' },
  searchBar: { minHeight: 54, marginBottom: 14, borderWidth: 1, borderColor: BORDER, borderRadius: 14, backgroundColor: PANEL, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, outlineStyle: 'none' } as any,
  clearSearch: { color: '#9cafc6', fontSize: 28 },
  filterPanel: { marginBottom: 14, borderWidth: 1, borderColor: BORDER, borderRadius: 14, backgroundColor: PANEL, padding: 15 },
  filterPanelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterPanelTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  filterPanelSub: { color: MUTED, fontSize: 11, marginTop: 3 },
  resetText: { color: BLUE, fontWeight: '800' },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  sortChip: { borderWidth: 1, borderColor: '#203246', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  sortChipActive: { borderColor: BLUE, backgroundColor: 'rgba(22,132,255,.14)' },
  sortChipText: { color: '#c5d0df', fontSize: 11 },
  sortChipTextActive: { color: '#fff', fontWeight: '800' },
  card: { borderWidth: 1, borderColor: BORDER, backgroundColor: PANEL, borderRadius: 18, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 16px 50px rgba(0,0,0,.28)' } as any, default: {} }) },
  hero: { flexDirection: 'row', alignItems: 'center', minHeight: 190 },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#f1f6fc' },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 },
  balance: { color: '#fff', fontWeight: '900', letterSpacing: -2, lineHeight: 66 },
  currency: { color: '#fff' },
  change: { color: GREEN, fontWeight: '800', marginTop: 4 },
  walletArt: { marginLeft: 2, flexShrink: 0 },
  filters: { paddingVertical: 20, paddingRight: 10 },
  filter: { minHeight: 49, minWidth: 112, marginRight: 11, borderWidth: 1, borderColor: '#1a2b40', borderRadius: 13, backgroundColor: 'rgba(8,14,24,.9)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  filterActive: { borderColor: BLUE, backgroundColor: 'rgba(22,132,255,.21)', ...Platform.select({ web: { boxShadow: '0 0 18px rgba(22,132,255,.25)' } as any, default: {} }) },
  filterText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  filterTextActive: { fontWeight: '900' },
  tableHeader: { minHeight: 49, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  tableHeaderCompact: { paddingHorizontal: 9 },
  columnHeader: { color: '#cbd7e8', fontWeight: '700', fontSize: 12 },
  assetColumn: { flex: 1.48, minWidth: 0 },
  balanceColumn: { flex: .9, minWidth: 0 },
  valueHeaderPress: { flex: .92, minWidth: 0 },
  valueColumn: { flex: .92, minWidth: 0, textAlign: 'right' },
  changeColumn: { width: 86, textAlign: 'right' },
  chevronColumn: { width: 18, textAlign: 'right' },
  assetRow: { minHeight: 88, paddingHorizontal: 20, paddingVertical: 13, borderTopWidth: 1, borderTopColor: 'rgba(22,132,255,.13)', flexDirection: 'row', alignItems: 'center' },
  assetRowCompact: { paddingHorizontal: 9, minHeight: 81 },
  rowPressed: { backgroundColor: 'rgba(22,132,255,.08)' },
  assetIdentity: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  assetCopy: { flex: 1, minWidth: 0 },
  assetBadge: { alignItems: 'center', justifyContent: 'center', marginRight: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,.14)', ...Platform.select({ web: { boxShadow: '0 0 18px rgba(22,132,255,.12)' } as any, default: {} }) },
  assetName: { color: '#fff', fontWeight: '800' },
  assetSymbol: { color: '#c5d0df', marginTop: 4 },
  assetAmount: { color: '#fff', fontWeight: '700' },
  assetSub: { color: MUTED, marginTop: 4 },
  assetValue: { color: '#fff' },
  assetChange: { textAlign: 'right' },
  chevron: { color: BLUE, fontSize: 29, marginLeft: 1 },
  empty: { color: '#9cafc6', textAlign: 'center', padding: 28 },
  selectedCard: { marginTop: 16, padding: 18 },
  selectedTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedTitle: { color: '#fff', fontWeight: '900', fontSize: 18 },
  close: { color: '#9cafc6', fontSize: 30 },
  selectedMetrics: { flexDirection: 'row', gap: 12, marginTop: 18, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(22,132,255,.13)' },
  selectedMetric: { flex: 1, minWidth: 0 },
  selectedLabel: { color: '#93a5bb', fontSize: 11 },
  selectedValue: { color: '#fff', fontWeight: '800', marginTop: 5 },
  selectedActions: { flexDirection: 'row', gap: 10, marginTop: 17 },
  selectedButton: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: BLUE, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(22,132,255,.12)' },
  selectedButtonText: { color: BLUE, fontWeight: '800' },
  addAsset: { minHeight: 82, marginTop: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: PANEL, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' },
  addIcon: { width: 50, height: 50, borderRadius: 9, borderWidth: 1, borderStyle: 'dashed', borderColor: BLUE, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  addCopy: { flex: 1, minWidth: 0 },
  addTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  addSub: { color: MUTED, fontSize: 12, marginTop: 5 },
  customPanel: { marginTop: 14, padding: 18 },
  customHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  customTitle: { color: '#fff', fontWeight: '900', fontSize: 17 },
  customSub: { color: MUTED, fontSize: 11, marginTop: 3 },
  fields: { flexDirection: 'row', gap: 12, marginTop: 15 },
  fieldsCompact: { flexDirection: 'column' },
  fieldWrap: { flex: 1, minWidth: 0, marginTop: 12 },
  fieldLabel: { color: '#cbd7e8', fontSize: 11, marginBottom: 7 },
  field: { minHeight: 48, borderWidth: 1, borderColor: '#1a3d5c', borderRadius: 11, color: '#fff', paddingHorizontal: 13, backgroundColor: '#04101e', outlineStyle: 'none' } as any,
  previewNotice: { color: MUTED, fontSize: 11, lineHeight: 17, marginTop: 13 },
  feedback: { color: '#ffbd18', marginTop: 11, fontWeight: '700' },
  feedbackSuccess: { color: GREEN },
  addCustomButton: { alignSelf: 'flex-start', minHeight: 45, marginTop: 15, borderRadius: 11, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: BLUE },
  addCustomButtonText: { color: '#fff', fontWeight: '900' },
});
