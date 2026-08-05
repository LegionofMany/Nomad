import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadTravel, useNomadWallet } from '../nomad';
import type { NomadAsset } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  ProgressBar,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

type FundingSource = {
  symbol: string;
  icon: string;
  balance: string;
  share: string;
  tint: string;
};

type RegionConfig = {
  name: string;
  aliases: RegExp;
  flag: string;
  stablecoin: string;
  code: string;
  symbol: string;
  dailyLimit: number;
  locale: string;
};

type Transaction = {
  merchant: string;
  meta: string;
  amount: string;
  usd: string;
  icon: string;
};

const regions: RegionConfig[] = [
  { name: 'Global', aliases: /global|worldwide/i, flag: '🌐', stablecoin: 'USD Stable', code: 'USD', symbol: '$', dailyLimit: 500, locale: 'en-US' },
  { name: 'Canada', aliases: /canada|toronto|vancouver|montreal|alberta|ontario|quebec/i, flag: '🇨🇦', stablecoin: 'CAD Stable', code: 'CAD', symbol: 'C$', dailyLimit: 650, locale: 'en-CA' },
  { name: 'United States', aliases: /united states|usa|america|new york|california|florida|texas/i, flag: '🇺🇸', stablecoin: 'USD Stable', code: 'USD', symbol: '$', dailyLimit: 500, locale: 'en-US' },
  { name: 'Mexico', aliases: /mexico|cancun|mexico city/i, flag: '🇲🇽', stablecoin: 'MXN Stable', code: 'MXN', symbol: 'MX$', dailyLimit: 8500, locale: 'es-MX' },
  { name: 'Europe', aliases: /europe|france|germany|italy|spain|portugal|netherlands|ireland|greece|austria|belgium/i, flag: '🇪🇺', stablecoin: 'EUR Stable', code: 'EUR', symbol: '€', dailyLimit: 460, locale: 'en-IE' },
  { name: 'United Kingdom', aliases: /united kingdom|england|scotland|wales|london/i, flag: '🇬🇧', stablecoin: 'GBP Stable', code: 'GBP', symbol: '£', dailyLimit: 400, locale: 'en-GB' },
  { name: 'Japan', aliases: /japan|tokyo|osaka|kyoto/i, flag: '🇯🇵', stablecoin: 'JPY Stable', code: 'JPY', symbol: '¥', dailyLimit: 50000, locale: 'ja-JP' },
  { name: 'Nigeria', aliases: /nigeria|lagos|abuja/i, flag: '🇳🇬', stablecoin: 'NGN Stable', code: 'NGN', symbol: '₦', dailyLimit: 800000, locale: 'en-NG' },
  { name: 'Australia', aliases: /australia|sydney|melbourne|brisbane/i, flag: '🇦🇺', stablecoin: 'AUD Stable', code: 'AUD', symbol: 'A$', dailyLimit: 760, locale: 'en-AU' },
  { name: 'India', aliases: /india|delhi|mumbai|bangalore/i, flag: '🇮🇳', stablecoin: 'INR Stable', code: 'INR', symbol: '₹', dailyLimit: 42000, locale: 'en-IN' },
  { name: 'UAE', aliases: /uae|united arab emirates|dubai|abu dhabi/i, flag: '🇦🇪', stablecoin: 'AED Stable', code: 'AED', symbol: 'د.إ', dailyLimit: 1850, locale: 'en-AE' },
  { name: 'Brazil', aliases: /brazil|rio|sao paulo/i, flag: '🇧🇷', stablecoin: 'BRL Stable', code: 'BRL', symbol: 'R$', dailyLimit: 2550, locale: 'pt-BR' },
  { name: 'South Korea', aliases: /south korea|korea|seoul/i, flag: '🇰🇷', stablecoin: 'KRW Stable', code: 'KRW', symbol: '₩', dailyLimit: 685000, locale: 'ko-KR' },
];

const fallbackFundingSources: FundingSource[] = [
  { symbol: 'BTC', icon: '₿', balance: '0.00421', share: '35%', tint: '#ff9900' },
  { symbol: 'HBAR', icon: 'H', balance: '1,250.00', share: '20%', tint: '#6b42ff' },
  { symbol: 'XRP', icon: 'X', balance: '950.00', share: '15%', tint: '#2c2f35' },
  { symbol: 'XLM', icon: 'S', balance: '1,800.00', share: '10%', tint: '#187bff' },
  { symbol: 'XDC', icon: 'X', balance: '600.00', share: '10%', tint: '#005ba8' },
  { symbol: 'ADA', icon: 'A', balance: '350.00', share: '5%', tint: '#246bff' },
  { symbol: 'ALGO', icon: 'A', balance: '250.00', share: '5%', tint: '#2e72d8' },
];

const tokenVisuals: Record<string, { icon: string; tint: string }> = {
  BTC: { icon: '₿', tint: '#ff9900' }, HBAR: { icon: 'H', tint: '#6b42ff' }, XRP: { icon: 'X', tint: '#2c2f35' },
  XLM: { icon: 'S', tint: '#187bff' }, XDC: { icon: 'X', tint: '#005ba8' }, ADA: { icon: 'A', tint: '#246bff' },
  ALGO: { icon: 'A', tint: '#2e72d8' }, USDC: { icon: '$', tint: '#1684ff' }, USDT: { icon: '₮', tint: '#33d790' },
  DAI: { icon: 'D', tint: '#f5ac25' }, ETH: { icon: '◆', tint: '#627eea' },
};

function resolveRegion(regionInput?: string): RegionConfig {
  const value = regionInput?.trim() || 'Global';
  return regions.find((region) => region.aliases.test(value) || region.name.toLowerCase() === value.toLowerCase()) ?? regions[0];
}

function toFundingSources(assets: NomadAsset[]): FundingSource[] {
  if (!assets.length) return fallbackFundingSources;
  const visible = assets.slice(0, 8);
  const weight = Math.max(5, Math.round(100 / visible.length));
  return visible.map((asset) => {
    const symbol = asset.symbol.toUpperCase();
    const visual = tokenVisuals[symbol] ?? { icon: symbol.slice(0, 1), tint: C.blue };
    return { symbol, icon: visual.icon, balance: asset.balance, share: `${weight}%`, tint: visual.tint };
  });
}

function formatRegionalAmount(region: RegionConfig, amount: number): string {
  const fractionDigits = ['JPY', 'NGN', 'INR', 'KRW'].includes(region.code) ? 0 : 2;
  return `${region.symbol}${amount.toLocaleString(region.locale, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`;
}

function transactionsForRegion(region: RegionConfig): Transaction[] {
  if (region.name === 'Japan') {
    return [
      { merchant: 'Don Quijote Shibuya', meta: 'Today • 11:23 AM', amount: '- ¥3,250', usd: '≈ $21.19 USD', icon: '▣' },
      { merchant: 'JR Tokyo Station', meta: 'Today • 09:45 AM', amount: '- ¥950', usd: '≈ $6.18 USD', icon: '▤' },
      { merchant: 'Sushi Zanmai Ginza', meta: 'Yesterday • 07:12 PM', amount: '- ¥8,600', usd: '≈ $55.92 USD', icon: '♨' },
    ];
  }
  if (region.name === 'Canada') {
    return [
      { merchant: 'Local Market', meta: 'Today • 11:23 AM', amount: '- C$32.50', usd: '≈ $24.07 USD', icon: '▣' },
      { merchant: 'Regional Transit', meta: 'Today • 09:45 AM', amount: '- C$4.25', usd: '≈ $3.15 USD', icon: '▤' },
      { merchant: 'Neighbourhood Café', meta: 'Yesterday • 07:12 PM', amount: '- C$18.60', usd: '≈ $13.78 USD', icon: '♨' },
    ];
  }
  return [
    { merchant: `${region.name} Market`, meta: 'Today • 11:23 AM', amount: `- ${formatRegionalAmount(region, region.dailyLimit * .065)}`, usd: 'Local purchase', icon: '▣' },
    { merchant: `${region.name} Transit`, meta: 'Today • 09:45 AM', amount: `- ${formatRegionalAmount(region, region.dailyLimit * .019)}`, usd: 'Transport', icon: '▤' },
    { merchant: 'Local Restaurant', meta: 'Yesterday • 07:12 PM', amount: `- ${formatRegionalAmount(region, region.dailyLimit * .11)}`, usd: 'Dining', icon: '♨' },
  ];
}

function StatCard({ icon, label, value, note, progress, last }: { icon: string; label: string; value: string; note: string; progress?: number; last?: boolean }) {
  return (
    <View style={[styles.stat, last && styles.statLast]}>
      <View style={styles.statTitle}><Text style={styles.statIcon}>{icon}</Text><Text style={styles.statLabel}>{label}</Text></View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>{value}</Text>
      {typeof progress === 'number' ? <ProgressBar value={progress} color={C.green} height={7} /> : null}
      <Text style={styles.statNote}>{note}</Text>
    </View>
  );
}

function ActionCard({ icon, title, subtitle, onPress }: { icon: string; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, { opacity: pressed ? .76 : 1 }]}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSub}>{subtitle}</Text>
    </Pressable>
  );
}

function FundingSourceIcon({ source }: { source: FundingSource }) {
  return (
    <View style={styles.source}>
      <View style={[styles.sourceBadge, { backgroundColor: source.tint }]}><Text style={styles.sourceMark}>{source.icon}</Text></View>
      <Text style={styles.sourceSymbol}>{source.symbol}</Text>
      <Text numberOfLines={1} style={styles.sourceBalance}>{source.balance}</Text>
      <Text style={styles.sourceShare}>({source.share})</Text>
    </View>
  );
}

function TransactionRow({ transaction, last }: { transaction: Transaction; last?: boolean }) {
  return (
    <View style={[styles.transaction, !last && styles.transactionBorder]}>
      <RoundIcon symbol={transaction.icon} color={C.green} size={44} filled />
      <View style={styles.transactionCopy}>
        <Text numberOfLines={1} style={styles.transactionTitle}>{transaction.merchant}</Text>
        <Text style={styles.transactionMeta}>{transaction.meta}</Text>
      </View>
      <View style={styles.transactionAmount}><Text style={styles.transactionValue}>{transaction.amount}</Text><Text style={styles.transactionUsd}>{transaction.usd}</Text></View>
    </View>
  );
}

export default function TravelModeScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { travelPocket, loading, error, enable, disable } = useNomadTravel();
  const { assets } = useNomadWallet();
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  const [regionSaving, setRegionSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [autoConvert, setAutoConvert] = useState(true);

  const activeRegion = resolveRegion(travelPocket.regionInput);
  const fundingSources = useMemo(() => toFundingSources(assets), [assets]);
  const transactions = useMemo(() => transactionsForRegion(activeRegion), [activeRegion]);
  const localBalance = travelPocket.pocketBalanceLocal || formatRegionalAmount(activeRegion, activeRegion.dailyLimit * 3.7);
  const fiatBalance = travelPocket.pocketBalanceFiat || '$1,208.64';
  const tripLimit = activeRegion.dailyLimit * 10;
  const remainingToday = activeRegion.dailyLimit * .68;

  const selectRegion = async (region: RegionConfig) => {
    try {
      setRegionSaving(true);
      setFeedback('');
      await enable(region.name);
      setFeedback(`${region.name} travel mode is ready`);
      setRegionPickerOpen(false);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to update the travel region.');
    } finally {
      setRegionSaving(false);
    }
  };

  const toggleTravelMode = async () => {
    try {
      setRegionSaving(true);
      if (travelPocket.enabled) {
        await disable();
        setFeedback('Travel mode paused');
      } else {
        await enable(activeRegion.name);
        setFeedback(`${activeRegion.name} travel mode activated`);
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to change Travel Mode.');
    } finally {
      setRegionSaving(false);
    }
  };

  return (
    <NomadPage maxWidth={940}>
      <PageHeader title="Travel Pocket" subtitle="Spend stable value anywhere" icon="✈" color={C.green} help />

      <Panel tone="green" style={styles.hero}>
        <View style={[styles.heroTop, compact && styles.heroTopCompact]}>
          <View style={styles.regionCopy}>
            <Text style={styles.greenEyebrow}>CURRENT REGION</Text>
            <Pressable onPress={() => setRegionPickerOpen((value) => !value)} style={styles.regionButton}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.regionName, { fontSize: compact ? 29 : 38 }]}>{activeRegion.name} {activeRegion.flag}</Text>
              <Text style={styles.regionArrow}>›</Text>
            </Pressable>

            <Text style={[styles.greenEyebrow, { marginTop: 18 }]}>SPENDING CURRENCY</Text>
            <View style={styles.currencyRow}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.currencyName, { fontSize: compact ? 25 : 34 }]}>{activeRegion.stablecoin}</Text>
              <Text style={styles.activePill}>{travelPocket.enabled ? 'ACTIVE' : 'READY'}</Text>
            </View>
            <Text style={styles.currencyNote}>Stable local-value display for {activeRegion.name}</Text>
            {loading ? <Text style={styles.syncText}>Syncing Travel Pocket…</Text> : null}
            {error ? <Text style={styles.warningText}>Using the approved preview state while the travel adapter reconnects.</Text> : null}
            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
          </View>

          <View style={[styles.travelGraphic, compact && styles.travelGraphicCompact]}>
            <Pressable disabled={regionSaving} onPress={toggleTravelMode} style={styles.travelModePill}>
              <Text style={styles.travelModeText}>✈  {regionSaving ? 'Updating…' : travelPocket.enabled ? 'Travel Mode On' : 'Activate Travel Mode'}</Text>
            </Pressable>
            <View style={styles.globeOuter}>
              <View style={styles.globeInner}><Text style={styles.globeFlag}>{activeRegion.flag}</Text><Text style={styles.globePin}>⌖</Text></View>
            </View>
          </View>
        </View>

        {regionPickerOpen ? (
          <View style={styles.regionPicker}>
            <Text style={styles.pickerTitle}>Choose the destination region</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionOptions}>
              {regions.map((region) => {
                const selected = region.name === activeRegion.name;
                return (
                  <Pressable key={region.name} disabled={regionSaving} onPress={() => void selectRegion(region)} style={[styles.regionOption, selected && styles.regionOptionSelected]}>
                    <Text style={styles.regionFlag}>{region.flag}</Text>
                    <Text style={[styles.regionOptionText, selected && styles.regionOptionTextSelected]}>{region.name}</Text>
                    <Text style={styles.regionStable}>{region.code}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE  ◎</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.balanceValue, { fontSize: compact ? 37 : 48 }]}>{localBalance}</Text>
          <Text style={styles.balanceUsd}>≈ {fiatBalance} USD</Text>
        </View>

        <View style={[styles.stats, compact && styles.statsCompact]}>
          <StatCard icon="▣" label="Daily Limit" value={formatRegionalAmount(activeRegion, activeRegion.dailyLimit)} progress={32} note="32% Used" />
          <StatCard icon="▣" label="Trip Limit" value={formatRegionalAmount(activeRegion, tripLimit)} progress={37} note="37% Used" />
          <StatCard icon="▱" label="Remaining Today" value={formatRegionalAmount(activeRegion, remainingToday)} note="Available to spend" />
          <StatCard icon="◴" label="Trip Schedule" value="Not set" note="Add dates in settings" last />
        </View>
      </Panel>

      <View style={styles.actionGrid}>
        <ActionCard icon="▰" title="Pay / Spend" subtitle="Use stable value" onPress={() => navigation.navigate('ApprovePOSTransaction')} />
        <ActionCard icon="▦" title="Scan to Pay" subtitle="Merchant QR" onPress={() => navigation.navigate('ApprovePOSTransaction')} />
        <ActionCard icon="＋" title="Top Up Pocket" subtitle="Add funds" onPress={() => navigation.navigate('TopUpTravelPocket')} />
        <ActionCard icon="⌁" title="Send to Pocket" subtitle="From wallets" onPress={() => navigation.navigate('Wallets')} />
      </View>

      <Panel style={styles.fundingPanel}>
        <View style={[styles.panelHeading, compact && styles.panelHeadingCompact]}>
          <View><Text style={styles.panelTitle}>FUNDING SOURCES</Text><Text style={styles.panelSub}>Assets used to fund your Travel Pocket</Text></View>
          <Pressable onPress={() => navigation.navigate('Wallets')} style={styles.viewButton}><Text style={styles.viewButtonText}>View All Wallets  ›</Text></Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sourceRow}>
          {fundingSources.map((source) => <FundingSourceIcon key={source.symbol} source={source} />)}
        </ScrollView>

        <View style={[styles.optimizeRow, compact && styles.optimizeRowCompact]}>
          <RoundIcon symbol="⇄" color={C.green} size={58} filled />
          <View style={styles.optimizeCopy}>
            <View style={styles.optimizeTitleRow}><Text style={styles.optimizeTitle}>Auto-Convert & Optimize</Text><Text style={styles.onPill}>{autoConvert ? 'ON' : 'OFF'}</Text></View>
            <Text style={styles.optimizeSub}>Allocate funding sources for the selected region while keeping approval with the wallet owner.</Text>
          </View>
          <Pressable onPress={() => setAutoConvert((value) => !value)} style={styles.manageButton}><Text style={styles.manageText}>{autoConvert ? 'Pause' : 'Enable'}  ›</Text></Pressable>
        </View>
      </Panel>

      <Panel style={styles.transactionsPanel}>
        <View style={styles.panelHeading}><Text style={styles.panelTitle}>RECENT TRANSACTIONS</Text><Pressable onPress={() => navigation.navigate('NomadInsightsSpending')}><Text style={styles.viewLink}>View All  ›</Text></Pressable></View>
        {transactions.map((transaction, index) => <TransactionRow key={`${transaction.merchant}-${index}`} transaction={transaction} last={index === transactions.length - 1} />)}
      </Panel>

      <Panel style={styles.globalPanel}>
        <RoundIcon symbol="◇" color={C.blue} size={58} filled />
        <View style={styles.globalCopy}><Text style={styles.globalTitle}>Nomad follows your selected destination</Text><Text style={styles.globalSub}>The region, stable-value display and spending context update together without changing wallet custody.</Text></View>
        <Text style={styles.globalArt}>◎</Text>
      </Panel>

      <BottomNav active="Travel" />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 20 },
  heroTop: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 18, gap: 18 },
  heroTopCompact: { flexDirection: 'column' },
  regionCopy: { flex: 1, minWidth: 0 },
  greenEyebrow: { color: C.green, fontSize: 12, fontWeight: '900', letterSpacing: .4 },
  regionButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', maxWidth: '100%', marginTop: 6 },
  regionName: { color: '#fff', fontWeight: '900', maxWidth: '90%' },
  regionArrow: { color: C.muted, fontSize: 34, marginLeft: 8 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 7 },
  currencyName: { color: '#fff', fontWeight: '900', maxWidth: '78%' },
  activePill: { color: C.green, borderWidth: 1, borderColor: 'rgba(32,239,112,.45)', borderRadius: 9, backgroundColor: 'rgba(32,239,112,.13)', paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: '900' },
  currencyNote: { color: C.muted, fontSize: 12, marginTop: 7 },
  syncText: { color: C.muted, fontSize: 11, marginTop: 8 },
  warningText: { color: C.yellow, fontSize: 11, marginTop: 8 },
  feedback: { color: C.green, fontSize: 11, marginTop: 8 },
  travelGraphic: { width: 285, minHeight: 190, alignItems: 'center', justifyContent: 'center' },
  travelGraphicCompact: { width: '100%', minHeight: 170 },
  travelModePill: { position: 'absolute', top: 0, right: 0, borderWidth: 1, borderColor: C.green, borderRadius: 999, backgroundColor: 'rgba(32,239,112,.12)', paddingHorizontal: 13, paddingVertical: 8, zIndex: 2 },
  travelModeText: { color: C.green, fontSize: 12, fontWeight: '900' },
  globeOuter: { width: 142, height: 142, borderRadius: 71, borderWidth: 2, borderColor: 'rgba(32,239,112,.38)', alignItems: 'center', justifyContent: 'center' },
  globeInner: { width: 102, height: 102, borderRadius: 51, borderWidth: 1, borderColor: 'rgba(32,239,112,.52)', backgroundColor: 'rgba(32,239,112,.07)', alignItems: 'center', justifyContent: 'center' },
  globeFlag: { fontSize: 43 },
  globePin: { position: 'absolute', color: C.green, fontSize: 30, bottom: 0, right: 2 },
  regionPicker: { marginHorizontal: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(32,239,112,.25)', borderRadius: 13, backgroundColor: 'rgba(0,19,14,.72)', paddingTop: 13 },
  pickerTitle: { color: '#fff', fontSize: 13, fontWeight: '800', paddingHorizontal: 14 },
  regionOptions: { padding: 13 },
  regionOption: { width: 102, minHeight: 92, marginRight: 10, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: 'rgba(2,14,25,.86)', alignItems: 'center', justifyContent: 'center', padding: 8 },
  regionOptionSelected: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.1)' },
  regionFlag: { fontSize: 25 },
  regionOptionText: { color: '#fff', textAlign: 'center', fontSize: 11, fontWeight: '700', marginTop: 6 },
  regionOptionTextSelected: { color: C.green },
  regionStable: { color: C.muted, fontSize: 9, marginTop: 4 },
  balanceBox: { marginHorizontal: 12, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: 'rgba(1,15,24,.66)', padding: 16 },
  balanceLabel: { color: C.muted, fontSize: 11 },
  balanceValue: { color: '#fff', fontWeight: '900', marginTop: 5 },
  balanceUsd: { color: C.muted, fontSize: 13, marginTop: 3 },
  stats: { flexDirection: 'row', marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(32,239,112,.14)' },
  statsCompact: { flexWrap: 'wrap' },
  stat: { flex: 1, minWidth: 150, padding: 14, borderRightWidth: 1, borderRightColor: 'rgba(32,239,112,.13)' },
  statLast: { borderRightWidth: 0 },
  statTitle: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statIcon: { color: C.green, fontSize: 16 },
  statLabel: { color: '#fff', fontSize: 11 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800', marginVertical: 8 },
  statNote: { color: C.muted, fontSize: 10, marginTop: 6 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  action: { flexGrow: 1, flexBasis: 155, minHeight: 105, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center', padding: 10 },
  actionIcon: { color: C.blue, fontSize: 31 },
  actionTitle: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 7, textAlign: 'center' },
  actionSub: { color: C.muted, fontSize: 10, marginTop: 4, textAlign: 'center' },
  fundingPanel: { marginTop: 18, padding: 17 },
  panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  panelHeadingCompact: { alignItems: 'flex-start' },
  panelTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: .3 },
  panelSub: { color: C.muted, fontSize: 11, marginTop: 4 },
  viewButton: { borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9 },
  viewButtonText: { color: C.blue, fontSize: 11, fontWeight: '800' },
  sourceRow: { paddingVertical: 18 },
  source: { width: 80, alignItems: 'center' },
  sourceBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sourceMark: { color: '#fff', fontSize: 22, fontWeight: '900' },
  sourceSymbol: { color: '#fff', fontSize: 12, fontWeight: '900', marginTop: 6 },
  sourceBalance: { color: '#fff', fontSize: 10, maxWidth: 72, marginTop: 3 },
  sourceShare: { color: C.muted, fontSize: 9, marginTop: 2 },
  optimizeRow: { minHeight: 84, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13 },
  optimizeRowCompact: { flexWrap: 'wrap' },
  optimizeCopy: { flex: 1, minWidth: 180 },
  optimizeTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  optimizeTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  onPill: { color: C.green, backgroundColor: 'rgba(32,239,112,.15)', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3, fontSize: 9, fontWeight: '900' },
  optimizeSub: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 5 },
  manageButton: { borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 10 },
  manageText: { color: C.blue, fontSize: 11, fontWeight: '900' },
  transactionsPanel: { marginTop: 18, paddingHorizontal: 17, paddingTop: 17 },
  viewLink: { color: C.blue, fontSize: 12, fontWeight: '800' },
  transaction: { minHeight: 73, flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  transactionBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  transactionCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  transactionTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  transactionMeta: { color: C.muted, fontSize: 10, marginTop: 4 },
  transactionAmount: { alignItems: 'flex-end', marginLeft: 8 },
  transactionValue: { color: '#fff', fontSize: 13, fontWeight: '900' },
  transactionUsd: { color: C.muted, fontSize: 9, marginTop: 4 },
  globalPanel: { minHeight: 90, marginTop: 18, padding: 15, flexDirection: 'row', alignItems: 'center' },
  globalCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  globalTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  globalSub: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  globalArt: { color: 'rgba(22,140,255,.42)', fontSize: 48, marginLeft: 8 },
});
