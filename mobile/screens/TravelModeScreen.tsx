import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadSecurity, useNomadTravel } from '../nomad';
import type { NomadTravelFundingSource, NomadTravelPocketTransaction } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  ProgressBar,
  useNomadLayout,
} from '../ui/NomadShell';

type RegionConfig = {
  name: string;
  aliases: RegExp;
  flag: string;
  stablecoin: string;
  code: string;
};

const regions: RegionConfig[] = [
  { name: 'Global', aliases: /global|worldwide/i, flag: '🌐', stablecoin: 'USD Stable', code: 'USD' },
  { name: 'Canada', aliases: /canada|toronto|vancouver|montreal|alberta|ontario|quebec/i, flag: '🇨🇦', stablecoin: 'CAD Stable', code: 'CAD' },
  { name: 'United States', aliases: /united states|usa|america|new york|california|florida|texas/i, flag: '🇺🇸', stablecoin: 'USD Stable', code: 'USD' },
  { name: 'Mexico', aliases: /mexico|cancun|mexico city/i, flag: '🇲🇽', stablecoin: 'MXN Stable', code: 'MXN' },
  { name: 'Europe', aliases: /europe|france|germany|italy|spain|portugal|netherlands|ireland|greece|austria|belgium/i, flag: '🇪🇺', stablecoin: 'EUR Stable', code: 'EUR' },
  { name: 'United Kingdom', aliases: /united kingdom|england|scotland|wales|london/i, flag: '🇬🇧', stablecoin: 'GBP Stable', code: 'GBP' },
  { name: 'Japan', aliases: /japan|tokyo|osaka|kyoto/i, flag: '🇯🇵', stablecoin: 'JPY Stable', code: 'JPY' },
  { name: 'Nigeria', aliases: /nigeria|lagos|abuja/i, flag: '🇳🇬', stablecoin: 'NGN Stable', code: 'NGN' },
  { name: 'Australia', aliases: /australia|sydney|melbourne|brisbane/i, flag: '🇦🇺', stablecoin: 'AUD Stable', code: 'AUD' },
  { name: 'India', aliases: /india|delhi|mumbai|bangalore/i, flag: '🇮🇳', stablecoin: 'INR Stable', code: 'INR' },
  { name: 'UAE', aliases: /uae|united arab emirates|dubai|abu dhabi/i, flag: '🇦🇪', stablecoin: 'AED Stable', code: 'AED' },
  { name: 'Brazil', aliases: /brazil|rio|sao paulo/i, flag: '🇧🇷', stablecoin: 'BRL Stable', code: 'BRL' },
  { name: 'South Korea', aliases: /south korea|korea|seoul/i, flag: '🇰🇷', stablecoin: 'KRW Stable', code: 'KRW' },
];

const tokenVisuals: Record<string, { icon: string; tint: string }> = {
  BTC: { icon: '₿', tint: '#ff9900' },
  HBAR: { icon: 'H', tint: '#6b42ff' },
  XRP: { icon: 'X', tint: '#2c2f35' },
  XLM: { icon: 'S', tint: '#187bff' },
  XDC: { icon: 'X', tint: '#005ba8' },
  ADA: { icon: 'A', tint: '#246bff' },
  ALGO: { icon: 'A', tint: '#2e72d8' },
  USDC: { icon: '$', tint: '#1684ff' },
  USDT: { icon: '₮', tint: '#33d790' },
  DAI: { icon: 'D', tint: '#f5ac25' },
  ETH: { icon: '◆', tint: '#627eea' },
};

const svgUri = (viewBox: string, body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`)}`;

const worldMapUri = svgUri(
  '0 0 680 300',
  `<defs>
    <radialGradient id="r"><stop stop-color="#20ef70" stop-opacity=".23"/><stop offset="1" stop-color="#20ef70" stop-opacity="0"/></radialGradient>
    <filter id="g"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="680" height="300" fill="url(#r)"/>
  <g fill="none" stroke="#20ef70" stroke-opacity=".42" stroke-width="2">
    <path d="M42 112c45-44 93-63 142-52 30 7 48 24 75 33 24 8 51 6 74-3 35-14 56-11 81 2 30 15 57 16 84 8 34-10 67-5 108 17"/>
    <path d="M52 170c57-26 111-25 162-2 55 24 102 31 157 13 49-16 91-14 139 4 43 16 79 18 126 1"/>
    <ellipse cx="360" cy="149" rx="250" ry="116"/>
    <ellipse cx="360" cy="149" rx="170" ry="116"/>
    <ellipse cx="360" cy="149" rx="84" ry="116"/>
    <path d="M110 149h500M138 97h444M138 205h444"/>
  </g>
  <g fill="#20ef70" filter="url(#g)">
    <circle cx="205" cy="113" r="5"/><circle cx="310" cy="86" r="4"/><circle cx="405" cy="128" r="5"/><circle cx="500" cy="174" r="4"/><circle cx="375" cy="218" r="4"/>
  </g>`,
);

function resolveRegion(regionInput?: string) {
  const value = regionInput?.trim() || 'Global';
  return regions.find((region) => region.name.toLowerCase() === value.toLowerCase() || region.aliases.test(value)) ?? regions[0];
}

function formatExpiry(value?: string) {
  if (!value) return 'Not set';
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Not set';
  const days = Math.max(0, Math.ceil((parsed - Date.now()) / (24 * 60 * 60 * 1000)));
  return days === 0 ? 'Today' : `${days} days`;
}

function formatTimestamp(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Unknown time';
  const date = new Date(parsed);
  const sameDay = new Date().toDateString() === date.toDateString();
  return `${sameDay ? 'Today' : 'Recent'} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

function StatCard({ icon, label, value, progress, note, last }: { icon: string; label: string; value: string; progress?: number; note: string; last?: boolean }) {
  return (
    <View style={[styles.stat, last && styles.statLast]}>
      <View style={styles.statTitleRow}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>{value}</Text>
      {typeof progress === 'number' ? <ProgressBar value={progress} color={C.green} height={7} /> : null}
      <Text style={styles.statNote}>{note}</Text>
    </View>
  );
}

function ActionCard({ icon, title, subtitle, disabled, onPress }: { icon: string; title: string; subtitle: string; disabled?: boolean; onPress(): void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.actionCard, disabled && styles.actionDisabled, pressed && styles.pressed]}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function FundingSourceCard({ source }: { source: NomadTravelFundingSource }) {
  const visual = tokenVisuals[source.symbol.toUpperCase()] ?? { icon: source.symbol.slice(0, 1), tint: C.blue };
  return (
    <View style={styles.sourceCard}>
      <View style={[styles.sourceBadge, { backgroundColor: visual.tint }]}><Text style={styles.sourceBadgeText}>{visual.icon}</Text></View>
      <Text style={styles.sourceSymbol}>{source.symbol}</Text>
      <Text numberOfLines={1} style={styles.sourceBalance}>{source.balance}</Text>
      <Text style={styles.sourceAllocation}>{source.allocationPercent}%</Text>
    </View>
  );
}

function TransactionRow({ transaction, last }: { transaction: NomadTravelPocketTransaction; last?: boolean }) {
  const icon = transaction.category === 'shopping' ? '▣' : transaction.category === 'transport' ? '▤' : transaction.category === 'dining' ? '♨' : '•';
  return (
    <View style={[styles.transactionRow, !last && styles.transactionBorder]}>
      <View style={styles.transactionIcon}><Text style={styles.transactionIconText}>{icon}</Text></View>
      <View style={styles.transactionCopy}>
        <Text numberOfLines={1} style={styles.transactionMerchant}>{transaction.merchant}</Text>
        <Text style={styles.transactionMeta}>{formatTimestamp(transaction.timestamp)} • {transaction.status}</Text>
      </View>
      <View style={styles.transactionAmountWrap}>
        <Text style={styles.transactionAmount}>{transaction.amountLocal}</Text>
        <Text style={styles.transactionUsd}>{transaction.amountUsd}</Text>
      </View>
    </View>
  );
}

export default function TravelModeScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { security } = useNomadSecurity();
  const {
    travelPocket,
    loading,
    error,
    refresh,
    selectRegion,
    enable,
    disable,
    setAutoConvert,
  } = useNomadTravel();

  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  const [scanPanelOpen, setScanPanelOpen] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const region = resolveRegion(travelPocket.regionInput);
  const frozen = security.freezeStatus === 'full' || security.freezeScope === 'travel_pocket';
  const fundingSources = travelPocket.fundingSources ?? [];
  const transactions = travelPocket.recentTransactions ?? [];
  const previewData = travelPocket.dataSource !== 'connected';
  const localCurrency = travelPocket.localCurrency || travelPocket.preferredStablecoin || region.stablecoin;
  const currencyCode = travelPocket.currencyCode || region.code;
  const autoConvert = travelPocket.autoConvertEnabled ?? false;

  const chooseRegion = async (nextRegion: RegionConfig) => {
    try {
      setSaving(true);
      setFeedback('');
      await selectRegion(nextRegion.name);
      setRegionPickerOpen(false);
      setFeedback(`${nextRegion.name} selected. Travel Mode was not activated automatically.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to select the destination.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTravelMode = async () => {
    try {
      setSaving(true);
      setFeedback('');
      if (travelPocket.enabled) {
        await disable();
        setFeedback('Travel Mode paused. Your selected destination was preserved.');
      } else {
        await enable(region.name);
        setFeedback(`${region.name} Travel Mode activated.`);
      }
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to change Travel Mode.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAutoConvert = async () => {
    try {
      setSaving(true);
      const next = !autoConvert;
      await setAutoConvert(next);
      setFeedback(`Auto-Convert ${next ? 'enabled' : 'paused'}.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to update Auto-Convert.');
    } finally {
      setSaving(false);
    }
  };

  const openSpend = () => {
    if (frozen) {
      setFeedback('Emergency Freeze blocks Travel Pocket payments.');
      return;
    }
    if (!travelPocket.enabled) {
      setFeedback('Activate Travel Mode before starting a payment.');
      return;
    }
    navigation.navigate('ApprovePOSTransaction', { source: 'travel_pocket', region: region.name });
  };

  const continueScannedPayment = () => {
    const value = scanCode.trim();
    if (value.length < 8) {
      setFeedback('Enter or scan a valid merchant payment request.');
      return;
    }
    if (frozen || !travelPocket.enabled) {
      setFeedback(frozen ? 'Emergency Freeze blocks Travel Pocket payments.' : 'Activate Travel Mode before reviewing the payment.');
      return;
    }
    navigation.navigate('ApprovePOSTransaction', {
      source: 'travel_qr',
      paymentRequest: value,
      region: region.name,
    });
  };

  return (
    <NomadPage maxWidth={960}>
      <PageHeader title="Travel Pocket" subtitle="Spend stable value anywhere" icon="✈" color={C.green} help />

      <Panel tone="green" style={styles.heroPanel}>
        <View style={[styles.heroTop, compact && styles.heroTopCompact]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>CURRENT REGION</Text>
            <Pressable onPress={() => setRegionPickerOpen((value) => !value)} style={styles.regionButton}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.regionName, compact && styles.regionNameCompact]}>{region.name} {region.flag}</Text>
              <Text style={styles.regionChevron}>›</Text>
            </Pressable>

            <Text style={[styles.eyebrow, styles.currencyEyebrow]}>SPENDING CURRENCY</Text>
            <View style={styles.currencyRow}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.currencyName, compact && styles.currencyNameCompact]}>{localCurrency}</Text>
              <View style={[styles.modePill, travelPocket.enabled ? styles.modePillActive : styles.modePillReady]}>
                <Text style={[styles.modePillText, { color: travelPocket.enabled ? C.green : C.blue }]}>{travelPocket.enabled ? 'ACTIVE' : 'READY'}</Text>
              </View>
            </View>
            <Text style={styles.currencyNote}>{currencyCode} local-value display • owner-controlled activation</Text>
            <View style={styles.sourceLine}>
              <Text style={[styles.sourceState, { color: previewData ? C.yellow : C.green }]}>{previewData ? 'LOCAL PREVIEW DATA' : 'CONNECTED DATA'}</Text>
              {travelPocket.exchangeRateUpdatedAt ? <Text style={styles.rateTime}>Rate updated {new Date(travelPocket.exchangeRateUpdatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</Text> : null}
            </View>
          </View>

          <View style={[styles.mapWrap, compact && styles.mapWrapCompact]}>
            <Image source={{ uri: worldMapUri }} resizeMode="contain" style={styles.mapImage} />
            <View style={styles.mapPin}><Text style={styles.mapPinFlag}>{region.flag}</Text></View>
            <Pressable disabled={saving || frozen} onPress={() => void toggleTravelMode()} style={[styles.travelToggle, frozen && styles.actionDisabled]}>
              <Text style={styles.travelToggleText}>{saving ? 'Updating…' : travelPocket.enabled ? 'Pause Travel Mode' : 'Activate Travel Mode'}</Text>
            </Pressable>
          </View>
        </View>

        {regionPickerOpen ? (
          <View style={styles.regionPicker}>
            <Text style={styles.pickerTitle}>Choose a destination</Text>
            <Text style={styles.pickerSubtitle}>Selecting a region changes display context only. Activation remains separate.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionOptions}>
              {regions.map((item) => {
                const selected = item.name === region.name;
                return (
                  <Pressable key={item.name} disabled={saving || frozen} onPress={() => void chooseRegion(item)} style={[styles.regionOption, selected && styles.regionOptionSelected]}>
                    <Text style={styles.regionFlag}>{item.flag}</Text>
                    <Text style={[styles.regionOptionName, selected && styles.regionOptionNameSelected]}>{item.name}</Text>
                    <Text style={styles.regionCode}>{item.code}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.balanceValue, compact && styles.balanceValueCompact]}>{travelPocket.pocketBalanceLocal || '$0.00'}</Text>
            <Text style={styles.balanceUsd}>≈ {travelPocket.pocketBalanceFiat || '$0.00'} USD</Text>
          </View>
          <View style={styles.balanceStatus}>
            <Text style={styles.balanceStatusTitle}>{travelPocket.enabled ? 'Ready to spend' : 'Travel Mode paused'}</Text>
            <Text style={styles.balanceStatusSub}>{region.name} • {currencyCode}</Text>
          </View>
        </View>

        <View style={[styles.statsRow, compact && styles.statsRowCompact]}>
          <StatCard icon="▣" label="Daily Limit" value={travelPocket.dailyLimitLocal || '—'} progress={travelPocket.spentTodayPercent ?? 0} note={`${travelPocket.spentTodayPercent ?? 0}% used today`} />
          <StatCard icon="▣" label="Trip Limit" value={travelPocket.tripLimitLocal || '—'} progress={travelPocket.tripSpentPercent ?? 0} note={`${travelPocket.tripSpentPercent ?? 0}% used this trip`} />
          <StatCard icon="▱" label="Remaining Today" value={travelPocket.remainingTodayLocal || '—'} note="Available to spend" />
          <StatCard icon="◴" label="Expires" value={formatExpiry(travelPocket.expiresAt)} note={travelPocket.expiresAt ? new Date(travelPocket.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No expiration configured'} last />
        </View>
      </Panel>

      {loading ? <Text style={styles.loadingText}>Synchronizing Travel Pocket…</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {frozen ? <Text style={styles.freezeText}>Emergency Freeze is active. Travel payments and settings are disabled.</Text> : null}
      {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

      <View style={styles.actionGrid}>
        <ActionCard icon="▰" title="Pay / Spend" subtitle="Use Travel Pocket" disabled={frozen} onPress={openSpend} />
        <ActionCard icon="▦" title="Scan to Pay" subtitle="Merchant request" disabled={frozen} onPress={() => setScanPanelOpen((value) => !value)} />
        <ActionCard icon="＋" title="Top Up Pocket" subtitle="Add funds" disabled={frozen} onPress={() => navigation.navigate('TopUpTravelPocket', { mode: 'top_up' })} />
        <ActionCard icon="⌁" title="Send to Pocket" subtitle="From a wallet" disabled={frozen} onPress={() => navigation.navigate('TopUpTravelPocket', { mode: 'wallet_transfer' })} />
      </View>

      {scanPanelOpen ? (
        <Panel style={styles.scanPanel}>
          <View style={styles.scanHeader}>
            <View>
              <Text style={styles.panelTitle}>SCAN TO PAY</Text>
              <Text style={styles.panelSub}>Paste a merchant QR payload while the native camera bridge is pending.</Text>
            </View>
            <Pressable onPress={() => setScanPanelOpen(false)}><Text style={styles.closeText}>×</Text></Pressable>
          </View>
          <View style={styles.scanInputRow}>
            <TextInput
              value={scanCode}
              onChangeText={setScanCode}
              placeholder="nomadpay:merchant-request"
              placeholderTextColor="#71839a"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.scanInput}
            />
            <Pressable onPress={continueScannedPayment} style={styles.scanContinue}><Text style={styles.scanContinueText}>Review</Text></Pressable>
          </View>
          <Text style={styles.scanNotice}>The payment request will be revalidated on Page 22 before any wallet draft is created.</Text>
        </Panel>
      ) : null}

      <Panel style={styles.fundingPanel}>
        <View style={[styles.panelHeading, compact && styles.panelHeadingCompact]}>
          <View>
            <Text style={styles.panelTitle}>FUNDING SOURCES</Text>
            <Text style={styles.panelSub}>Allocation is calculated from current wallet fiat values.</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Wallets')} style={styles.viewButton}><Text style={styles.viewButtonText}>View Wallets  ›</Text></Pressable>
        </View>

        {fundingSources.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sourceRow}>
            {fundingSources.map((source) => <FundingSourceCard key={source.symbol} source={source} />)}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>No connected wallet funding sources are available.</Text>
        )}

        <View style={[styles.optimizeRow, compact && styles.optimizeRowCompact]}>
          <View style={styles.optimizeIcon}><Text style={styles.optimizeIconText}>⇄</Text></View>
          <View style={styles.optimizeCopy}>
            <View style={styles.optimizeTitleRow}>
              <Text style={styles.optimizeTitle}>Auto-Convert & Optimize</Text>
              <View style={[styles.autoPill, autoConvert ? styles.autoPillOn : styles.autoPillOff]}><Text style={[styles.autoPillText, { color: autoConvert ? C.green : C.muted }]}>{autoConvert ? 'ON' : 'OFF'}</Text></View>
            </View>
            <Text style={styles.optimizeSub}>The setting is saved by the Travel Pocket adapter. Final conversions still require wallet approval.</Text>
          </View>
          <Pressable disabled={saving || frozen} onPress={() => void toggleAutoConvert()} style={[styles.manageButton, frozen && styles.actionDisabled]}><Text style={styles.manageButtonText}>{autoConvert ? 'Pause' : 'Enable'}  ›</Text></Pressable>
        </View>
      </Panel>

      <Panel style={styles.transactionsPanel}>
        <View style={styles.panelHeading}>
          <View>
            <Text style={styles.panelTitle}>RECENT TRANSACTIONS</Text>
            <Text style={styles.panelSub}>{previewData ? 'Preview activity — connected ledger pending' : 'Connected Travel Pocket ledger'}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('NomadInsightsSpending')}><Text style={styles.viewLink}>View All  ›</Text></Pressable>
        </View>
        {transactions.length ? transactions.map((transaction, index) => <TransactionRow key={transaction.id} transaction={transaction} last={index === transactions.length - 1} />) : <Text style={styles.emptyText}>No Travel Pocket transactions yet.</Text>}
      </Panel>

      <Panel style={styles.globalPanel}>
        <View style={styles.globalShield}><Text style={styles.globalShieldText}>◇</Text></View>
        <View style={styles.globalCopy}>
          <Text style={styles.globalTitle}>Your destination, one consistent policy</Text>
          <Text style={styles.globalSub}>Region, local-value display, limits, expiry and spending context now come from the same Travel Pocket adapter without changing wallet custody.</Text>
        </View>
        <Text style={styles.globalGlobe}>◎</Text>
      </Panel>

      <BottomNav
        active="Travel"
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
  pressed: { opacity: 0.74 },
  heroPanel: { overflow: 'hidden' },
  heroTop: { flexDirection: 'row', gap: 20, padding: 20 },
  heroTopCompact: { flexDirection: 'column' },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: C.green, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  currencyEyebrow: { marginTop: 20 },
  regionButton: { alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  regionName: { color: '#fff', fontSize: 38, fontWeight: '900', maxWidth: '91%' },
  regionNameCompact: { fontSize: 29 },
  regionChevron: { color: C.muted, fontSize: 34, marginLeft: 8 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 7 },
  currencyName: { color: '#fff', fontSize: 31, fontWeight: '900', maxWidth: '78%' },
  currencyNameCompact: { fontSize: 24 },
  modePill: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 5 },
  modePillActive: { borderColor: 'rgba(32,239,112,.5)', backgroundColor: 'rgba(32,239,112,.12)' },
  modePillReady: { borderColor: 'rgba(22,140,255,.5)', backgroundColor: 'rgba(22,140,255,.12)' },
  modePillText: { fontSize: 9, fontWeight: '900' },
  currencyNote: { color: C.muted, fontSize: 11, marginTop: 7 },
  sourceLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  sourceState: { fontSize: 9, fontWeight: '900' },
  rateTime: { color: C.muted, fontSize: 9 },
  mapWrap: { width: 350, minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  mapWrapCompact: { width: '100%', minHeight: 190 },
  mapImage: { width: '100%', height: 190 },
  mapPin: { position: 'absolute', width: 55, height: 55, borderRadius: 28, borderWidth: 2, borderColor: C.green, backgroundColor: 'rgba(2,20,14,.94)', alignItems: 'center', justifyContent: 'center' },
  mapPinFlag: { fontSize: 26 },
  travelToggle: { position: 'absolute', right: 5, bottom: 0, borderWidth: 1, borderColor: C.green, borderRadius: 999, backgroundColor: 'rgba(32,239,112,.1)', paddingHorizontal: 14, paddingVertical: 9 },
  travelToggleText: { color: C.green, fontSize: 11, fontWeight: '900' },
  regionPicker: { marginHorizontal: 14, marginBottom: 17, borderWidth: 1, borderColor: 'rgba(32,239,112,.25)', borderRadius: 13, backgroundColor: 'rgba(0,19,14,.72)', paddingTop: 13 },
  pickerTitle: { color: '#fff', fontSize: 13, fontWeight: '900', paddingHorizontal: 14 },
  pickerSubtitle: { color: C.muted, fontSize: 10, lineHeight: 15, paddingHorizontal: 14, marginTop: 5 },
  regionOptions: { padding: 13 },
  regionOption: { width: 104, minHeight: 94, marginRight: 10, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: 'rgba(2,14,25,.86)', alignItems: 'center', justifyContent: 'center', padding: 8 },
  regionOptionSelected: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.1)' },
  regionFlag: { fontSize: 25 },
  regionOptionName: { color: '#fff', textAlign: 'center', fontSize: 10, fontWeight: '800', marginTop: 6 },
  regionOptionNameSelected: { color: C.green },
  regionCode: { color: C.muted, fontSize: 9, marginTop: 4 },
  balanceCard: { marginHorizontal: 13, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: 'rgba(1,15,24,.68)', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  balanceLabel: { color: C.muted, fontSize: 10 },
  balanceValue: { color: '#fff', fontSize: 47, fontWeight: '900', marginTop: 5 },
  balanceValueCompact: { fontSize: 34 },
  balanceUsd: { color: C.muted, fontSize: 12, marginTop: 4 },
  balanceStatus: { maxWidth: 160, alignItems: 'flex-end' },
  balanceStatusTitle: { color: C.green, fontSize: 11, fontWeight: '900', textAlign: 'right' },
  balanceStatusSub: { color: C.muted, fontSize: 10, marginTop: 5, textAlign: 'right' },
  statsRow: { flexDirection: 'row', marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(32,239,112,.14)' },
  statsRowCompact: { flexWrap: 'wrap' },
  stat: { flex: 1, minWidth: 150, padding: 14, borderRightWidth: 1, borderRightColor: 'rgba(32,239,112,.13)' },
  statLast: { borderRightWidth: 0 },
  statTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statIcon: { color: C.green, fontSize: 16 },
  statLabel: { color: '#fff', fontSize: 10 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800', marginVertical: 8 },
  statNote: { color: C.muted, fontSize: 9, marginTop: 6 },
  loadingText: { color: C.muted, fontSize: 11, marginTop: 12 },
  errorText: { color: C.yellow, fontSize: 11, marginTop: 10 },
  freezeText: { color: C.red, fontSize: 11, marginTop: 10 },
  feedbackText: { color: C.green, fontSize: 11, marginTop: 10 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  actionCard: { flexGrow: 1, flexBasis: 155, minHeight: 106, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center', padding: 10 },
  actionDisabled: { opacity: 0.45 },
  actionIcon: { color: C.blue, fontSize: 31 },
  actionTitle: { color: '#fff', fontSize: 13, fontWeight: '900', marginTop: 7, textAlign: 'center' },
  actionSubtitle: { color: C.muted, fontSize: 9, marginTop: 4, textAlign: 'center' },
  scanPanel: { marginTop: 16, padding: 16 },
  scanHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  closeText: { color: C.muted, fontSize: 30, lineHeight: 30 },
  scanInputRow: { minHeight: 54, marginTop: 14, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.panel2, flexDirection: 'row', alignItems: 'center', paddingLeft: 13 },
  scanInput: { flex: 1, minWidth: 0, color: '#fff', fontSize: 12, outlineStyle: 'none' } as any,
  scanContinue: { minHeight: 42, marginRight: 6, borderWidth: 1, borderColor: C.blue, borderRadius: 8, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  scanContinueText: { color: C.blue, fontSize: 11, fontWeight: '900' },
  scanNotice: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 10 },
  fundingPanel: { marginTop: 18, padding: 17 },
  panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  panelHeadingCompact: { alignItems: 'flex-start' },
  panelTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.3 },
  panelSub: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  viewButton: { borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9 },
  viewButtonText: { color: C.blue, fontSize: 10, fontWeight: '800' },
  sourceRow: { paddingVertical: 18 },
  sourceCard: { width: 82, alignItems: 'center' },
  sourceBadge: { width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  sourceBadgeText: { color: '#fff', fontSize: 21, fontWeight: '900' },
  sourceSymbol: { color: '#fff', fontSize: 11, fontWeight: '900', marginTop: 6 },
  sourceBalance: { color: '#fff', fontSize: 9, maxWidth: 72, marginTop: 3 },
  sourceAllocation: { color: C.green, fontSize: 9, fontWeight: '900', marginTop: 3 },
  emptyText: { color: C.muted, fontSize: 11, textAlign: 'center', paddingVertical: 22 },
  optimizeRow: { minHeight: 86, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13 },
  optimizeRowCompact: { flexWrap: 'wrap' },
  optimizeIcon: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: C.green, backgroundColor: 'rgba(32,239,112,.08)', alignItems: 'center', justifyContent: 'center' },
  optimizeIconText: { color: C.green, fontSize: 27, fontWeight: '900' },
  optimizeCopy: { flex: 1, minWidth: 180 },
  optimizeTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  optimizeTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  optimizeSub: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  autoPill: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  autoPillOn: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.08)' },
  autoPillOff: { borderColor: C.border },
  autoPillText: { fontSize: 8, fontWeight: '900' },
  manageButton: { borderWidth: 1, borderColor: C.green, borderRadius: 9, paddingHorizontal: 13, paddingVertical: 10 },
  manageButtonText: { color: C.green, fontSize: 10, fontWeight: '900' },
  transactionsPanel: { marginTop: 18, padding: 17 },
  viewLink: { color: C.blue, fontSize: 10, fontWeight: '900' },
  transactionRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center' },
  transactionBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  transactionIcon: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: C.green, backgroundColor: 'rgba(32,239,112,.06)', alignItems: 'center', justifyContent: 'center' },
  transactionIconText: { color: C.green, fontSize: 18 },
  transactionCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  transactionMerchant: { color: '#fff', fontSize: 12, fontWeight: '900' },
  transactionMeta: { color: C.muted, fontSize: 9, marginTop: 5 },
  transactionAmountWrap: { maxWidth: '38%', alignItems: 'flex-end' },
  transactionAmount: { color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'right' },
  transactionUsd: { color: C.muted, fontSize: 9, marginTop: 4, textAlign: 'right' },
  globalPanel: { marginTop: 18, minHeight: 96, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
  globalShield: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(22,140,255,.07)', alignItems: 'center', justifyContent: 'center' },
  globalShieldText: { color: C.blue, fontSize: 26 },
  globalCopy: { flex: 1, minWidth: 0 },
  globalTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  globalSub: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 5 },
  globalGlobe: { color: C.blue, fontSize: 35 },
});
