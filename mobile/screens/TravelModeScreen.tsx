import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { useNomadSecurity, useNomadTravel } from '../nomad';
import type { NomadTravelFundingSource, NomadTravelPocketTransaction } from '../nomad';
import {
  BottomNav,
  C,
  NomadBrandMark,
  NomadPage,
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

type TravelArtworkKind =
  | 'auto'
  | 'back'
  | 'chevron'
  | 'clock'
  | 'daily'
  | 'dining'
  | 'eye'
  | 'help'
  | 'pay'
  | 'plane'
  | 'scan'
  | 'send'
  | 'shield'
  | 'store'
  | 'topup'
  | 'train'
  | 'trip'
  | 'wallet';

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

const mapDots = [
  [57, 59], [68, 52], [78, 49], [90, 54], [99, 62], [86, 69], [73, 72], [64, 80],
  [103, 87], [112, 96], [106, 109], [96, 120], [91, 134], [85, 146], [80, 158],
  [148, 54], [159, 49], [171, 52], [181, 58], [193, 61], [203, 68], [212, 76], [223, 79],
  [160, 70], [171, 78], [177, 89], [168, 101], [164, 115], [169, 129], [176, 142], [184, 151],
  [229, 89], [241, 82], [253, 78], [265, 83], [274, 92], [283, 102], [292, 109], [302, 117],
  [247, 103], [257, 112], [266, 122], [276, 130], [285, 138], [296, 145],
  [318, 139], [329, 145], [339, 154], [330, 164], [317, 164], [307, 155],
];

function resolveRegion(regionInput?: string) {
  const value = regionInput?.trim() || 'Japan';
  return regions.find((region) => region.name.toLowerCase() === value.toLowerCase() || region.aliases.test(value)) ?? regions[6];
}

function formatExpiryDate(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Not set';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatExpiryRemaining(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Configure trip dates';
  const days = Math.max(0, Math.ceil((Date.parse(value) - Date.now()) / (24 * 60 * 60 * 1000)));
  if (days === 0) return 'expires today';
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

function formatTimestamp(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Unknown time';
  const date = new Date(parsed);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDifference = Math.round((startToday - startDate) / (24 * 60 * 60 * 1000));
  const day = dayDifference === 0 ? 'Today' : dayDifference === 1 ? 'Yesterday' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${day} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

function remainingUsdLabel(localAmount?: string, exchangeRate?: number) {
  if (localAmount === '¥33,920') return '≈ $221.25 USD';
  const value = Number((localAmount ?? '').replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(value) || !exchangeRate) return 'Available to spend';
  return `≈ $${(value / exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}

function TravelArtwork({ kind, color = C.blue, size = 28 }: { kind: TravelArtworkKind; color?: string; size?: number }) {
  const stroke = { stroke: color, strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let artwork: React.ReactNode;

  switch (kind) {
    case 'back':
      artwork = <><Path d="M30 8 14 24l16 16M15 24h26" {...stroke} /></>;
      break;
    case 'chevron':
      artwork = <Path d="m19 10 14 14-14 14" {...stroke} />;
      break;
    case 'help':
      artwork = <><Circle cx="24" cy="24" r="18" {...stroke} /><Path d="M18 18a6 6 0 0 1 12 1c0 5-6 5-6 10M24 36h.1" {...stroke} /></>;
      break;
    case 'shield':
      artwork = <><Path d="M24 4 41 12v12c0 11-6 18-17 23C13 42 7 35 7 24V12Z" fill={`${color}14`} {...stroke} /><Path d="m16 24 6 6 11-13" {...stroke} /></>;
      break;
    case 'eye':
      artwork = <><Path d="M3 24s7-12 21-12 21 12 21 12-7 12-21 12S3 24 3 24Z" {...stroke} /><Circle cx="24" cy="24" r="6" {...stroke} /></>;
      break;
    case 'plane':
      artwork = <Path d="m7 27 34-16-10 29-7-11-17-2ZM24 29l8-8" {...stroke} />;
      break;
    case 'pay':
      artwork = <><Path d="M8 18h32v23H8Z" {...stroke} /><Path d="M13 18v-6h22v6M8 27h32M13 34h7" {...stroke} /></>;
      break;
    case 'scan':
      artwork = <><Path d="M16 6H7v10M32 6h9v10M16 42H7V32M32 42h9V32" {...stroke} /><Rect x="14" y="14" width="8" height="8" {...stroke} /><Rect x="27" y="14" width="7" height="7" {...stroke} /><Rect x="14" y="27" width="7" height="7" {...stroke} /><Path d="M28 27h4v4h4v5h-9v-4" {...stroke} /></>;
      break;
    case 'topup':
      artwork = <><Circle cx="24" cy="24" r="18" {...stroke} /><Path d="M24 14v20M14 24h20" {...stroke} /></>;
      break;
    case 'send':
      artwork = <><Path d="M8 33c8-15 22-20 34-15M42 18l-8-7M42 18l-3 10" {...stroke} /><Path d="M10 35c7-5 14-4 21 3" opacity={0.6} {...stroke} /></>;
      break;
    case 'daily':
      artwork = <><Rect x="9" y="13" width="30" height="27" rx="4" {...stroke} /><Path d="M15 8v10M33 8v10M9 22h30M17 29h14" {...stroke} /></>;
      break;
    case 'trip':
      artwork = <><Rect x="8" y="17" width="32" height="23" rx="5" {...stroke} /><Path d="M17 17v-6h14v6M8 27h32M15 24v7M33 24v7" {...stroke} /></>;
      break;
    case 'wallet':
      artwork = <><Rect x="7" y="12" width="34" height="28" rx="7" {...stroke} /><Path d="M31 21h11v11H31a5.5 5.5 0 0 1 0-11Z" {...stroke} /><Circle cx="34" cy="26.5" r="1.5" fill={color} /></>;
      break;
    case 'clock':
      artwork = <><Circle cx="24" cy="25" r="17" {...stroke} /><Path d="M24 15v11l8 5M17 6h14" {...stroke} /></>;
      break;
    case 'auto':
      artwork = <><Path d="M10 19a16 16 0 0 1 26-6l4 4M40 9v8h-8M38 29a16 16 0 0 1-26 6l-4-4M8 39v-8h8" {...stroke} /></>;
      break;
    case 'store':
      artwork = <><Path d="M8 20h32l-4-10H12L8 20Z" {...stroke} /><Path d="M11 20v20h26V20M18 40V29h12v11M8 20c0 4 7 4 8 0 1 4 7 4 8 0 1 4 7 4 8 0 1 4 8 4 8 0" {...stroke} /></>;
      break;
    case 'train':
      artwork = <><Rect x="12" y="7" width="24" height="30" rx="6" {...stroke} /><Path d="M17 14h14M17 24h14M17 37l-5 6M31 37l5 6" {...stroke} /><Circle cx="18" cy="31" r="2" fill={color} /><Circle cx="30" cy="31" r="2" fill={color} /></>;
      break;
    case 'dining':
      artwork = <><Path d="M12 7v13M7 7v8c0 4 10 4 10 0V7M12 20v21M31 7c7 6 7 16 0 22v12M31 7v22" {...stroke} /></>;
      break;
    default:
      artwork = <><Path d="M8 17h28l-7-7M40 31H12l7 7" {...stroke} /></>;
  }

  return <Svg accessibilityLabel={`${kind} icon`} width={size} height={size} viewBox="0 0 48 48" fill="none">{artwork}</Svg>;
}

function RegionFlag({ region, compact = false }: { region: RegionConfig; compact?: boolean }) {
  if (region.name !== 'Japan') return <Text style={[styles.flagEmoji, compact && styles.flagEmojiCompact]}>{region.flag}</Text>;
  const width = compact ? 25 : 34;
  return (
    <Svg accessibilityLabel="Japan flag" width={width} height={width * 0.68} viewBox="0 0 34 23">
      <Rect width="34" height="23" rx="2" fill="#fff" />
      <Circle cx="17" cy="11.5" r="5" fill="#d7183f" />
    </Svg>
  );
}

function WorldMapGraphic({ compact }: { compact: boolean }) {
  return (
    <View pointerEvents="none" style={[styles.mapGraphic, compact && styles.mapGraphicCompact]}>
      <Svg width="100%" height="100%" viewBox="0 0 380 205" fill="none">
        <Defs>
          <RadialGradient id="travelGlow"><Stop stopColor={C.green} stopOpacity={0.27} /><Stop offset="1" stopColor={C.green} stopOpacity={0} /></RadialGradient>
        </Defs>
        <Rect width="380" height="205" fill="url(#travelGlow)" />
        <G stroke={C.green} strokeOpacity={0.28} strokeWidth="1">
          <Path d="M42 53c26-25 58-35 86-24 18 7 26 22 43 25 23 4 35-12 56-12 29 0 45 20 71 22 26 2 45-13 68-22" />
          <Path d="M48 93c32-15 64-11 92 4 34 18 67 24 105 10 32-12 64-8 100 9" />
          <Ellipse cx="270" cy="108" rx="91" ry="62" /><Ellipse cx="270" cy="108" rx="56" ry="62" /><Ellipse cx="270" cy="108" rx="27" ry="62" />
          <Path d="M180 108h181M195 78h151M195 139h151" />
        </G>
        <G fill={C.green} opacity={0.58}>{mapDots.map(([cx, cy], index) => <Circle key={`${cx}-${cy}-${index}`} cx={cx} cy={cy} r={index % 4 === 0 ? 2.1 : 1.45} />)}</G>
        <G transform="translate(286 54)">
          <Path d="M17 0C7 0 0 8 0 18c0 13 17 34 17 34s17-21 17-34C34 8 27 0 17 0Z" fill={C.green} />
          <Circle cx="17" cy="17" r="6" fill="#075630" />
        </G>
        <G stroke={C.green} strokeWidth="1.5" opacity={0.8}><Ellipse cx="303" cy="118" rx="30" ry="14" /><Ellipse cx="303" cy="118" rx="51" ry="25" opacity={0.45} /></G>
      </Svg>
    </View>
  );
}

function GlobalArtwork() {
  return (
    <View pointerEvents="none" style={styles.globalArtwork}>
      <Svg width="100%" height="100%" viewBox="0 0 330 100" fill="none">
        <Defs><LinearGradient id="globalFade" x1="0" y1="0" x2="330" y2="100"><Stop stopColor={C.blue} stopOpacity={0} /><Stop offset="1" stopColor={C.blue} stopOpacity={0.28} /></LinearGradient></Defs>
        <Path d="M126 98c18-55 69-91 127-91 38 0 72 16 96 42v49H126Z" fill="url(#globalFade)" />
        <Path d="M133 98c17-52 65-84 120-84 36 0 68 14 93 39M153 98c18-39 55-64 99-64 34 0 65 16 85 41" stroke={C.blue} strokeOpacity={0.65} />
        <G fill={C.blue} opacity={0.6}><Circle cx="188" cy="48" r="2" /><Circle cx="204" cy="39" r="1.5" /><Circle cx="221" cy="52" r="2" /><Circle cx="244" cy="31" r="1.5" /><Circle cx="268" cy="48" r="2" /><Circle cx="285" cy="63" r="1.5" /><Circle cx="307" cy="45" r="2" /></G>
      </Svg>
    </View>
  );
}

function TokenBadge({ symbol, compact }: { symbol: string; compact: boolean }) {
  const size = compact ? 27 : 42;
  const colors: Record<string, string> = { BTC: '#ff9814', HBAR: '#6844ef', XRP: '#151a20', XLM: '#147ff5', XDC: '#075995', ADA: '#1269ef', ALGO: '#2a65bd' };
  const color = colors[symbol] ?? C.blue;
  let mark: React.ReactNode = <SvgText x="24" y="31" fill="#fff" fontSize="20" fontWeight="900" textAnchor="middle">{symbol.slice(0, 1)}</SvgText>;
  if (symbol === 'BTC') mark = <Path d="M19 11v26M24 9v30M15 14h13c7 0 8 9 1 10H15m0 0h14c8 0 8 11 0 11H15" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />;
  if (symbol === 'HBAR') mark = <Path d="M16 11v26M32 11v26M16 19h16M16 29h16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />;
  if (symbol === 'XRP') mark = <Path d="M11 13c4 0 6 2 9 5l4 4 4-4c3-3 5-5 9-5M11 35c4 0 6-2 9-5l4-4 4 4c3 3 5 5 9 5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />;
  if (symbol === 'XLM') mark = <><Circle cx="24" cy="24" r="12" stroke="#fff" strokeWidth="2.3" /><Path d="M9 30 39 16M10 35l30-14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></>;
  if (symbol === 'ADA') mark = <><Circle cx="24" cy="24" r="3" fill="#fff" /><G fill="#fff"><Circle cx="24" cy="9" r="1.4" /><Circle cx="24" cy="39" r="1.4" /><Circle cx="9" cy="24" r="1.4" /><Circle cx="39" cy="24" r="1.4" /><Circle cx="14" cy="14" r="1.4" /><Circle cx="34" cy="14" r="1.4" /><Circle cx="14" cy="34" r="1.4" /><Circle cx="34" cy="34" r="1.4" /></G></>;
  if (symbol === 'ALGO') mark = <Path d="m28 9-15 30M28 9l7 30M19 27h18" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
  return (
    <View style={{ width: size, height: size }}>
      <Svg accessibilityLabel={`${symbol} logo`} width={size} height={size} viewBox="0 0 48 48">
        <Defs><LinearGradient id={`travel-${symbol}`} x1="6" y1="5" x2="42" y2="43"><Stop stopColor={symbol === 'HBAR' ? '#8d55ff' : color} /><Stop offset="1" stopColor={color} /></LinearGradient></Defs>
        <Circle cx="24" cy="24" r="22" fill={`url(#travel-${symbol})`} stroke="rgba(255,255,255,.2)" />
        <G>{mark}</G>
      </Svg>
    </View>
  );
}

function StatCard({ compact, icon, label, value, progress, note, last }: { compact: boolean; icon: TravelArtworkKind; label: string; value: string; progress?: number; note: string; last?: boolean }) {
  return (
    <View style={[styles.stat, compact && styles.statCompact, last && styles.statLast]}>
      <View style={styles.statTitleRow}>
        <TravelArtwork kind={icon} color={C.green} size={compact ? 17 : 24} />
        <Text style={[styles.statLabel, compact && styles.statLabelCompact]}>{label}</Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.statValue, compact && styles.statValueCompact]}>{value}</Text>
      {typeof progress === 'number' ? <ProgressBar value={progress} color={C.green} height={compact ? 4 : 7} /> : null}
      <Text numberOfLines={1} style={[styles.statNote, compact && styles.statNoteCompact]}>{note}</Text>
    </View>
  );
}

function ActionCard({ compact, icon, title, subtitle, disabled, onPress }: { compact: boolean; icon: TravelArtworkKind; title: string; subtitle: string; disabled?: boolean; onPress(): void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.actionCard, compact && styles.actionCardCompact, disabled && styles.actionDisabled, pressed && !disabled && styles.pressed]}>
      <TravelArtwork kind={icon} color={C.blue} size={compact ? 29 : 40} />
      <Text style={[styles.actionTitle, compact && styles.actionTitleCompact]}>{title}</Text>
      <Text style={[styles.actionSubtitle, compact && styles.actionSubtitleCompact]}>{subtitle}</Text>
    </Pressable>
  );
}

function FundingSourceCard({ compact, source }: { compact: boolean; source: NomadTravelFundingSource }) {
  return (
    <View style={[styles.sourceCard, compact && styles.sourceCardCompact]}>
      <TokenBadge symbol={source.symbol.toUpperCase()} compact={compact} />
      <Text style={[styles.sourceSymbol, compact && styles.sourceSymbolCompact]}>{source.symbol}</Text>
      <Text numberOfLines={1} style={[styles.sourceBalance, compact && styles.sourceBalanceCompact]}>{source.balance}</Text>
      <Text style={[styles.sourceAllocation, compact && styles.sourceAllocationCompact]}>({source.allocationPercent}%)</Text>
    </View>
  );
}

function TransactionRow({ compact, transaction, last }: { compact: boolean; transaction: NomadTravelPocketTransaction; last?: boolean }) {
  const icon: TravelArtworkKind = transaction.category === 'shopping' ? 'store' : transaction.category === 'transport' ? 'train' : 'dining';
  return (
    <View accessibilityLabel={`${transaction.merchant}, ${transaction.amountLocal}, ${formatTimestamp(transaction.timestamp)}`} style={[styles.transactionRow, compact && styles.transactionRowCompact, !last && styles.transactionBorder]}>
      <View style={[styles.transactionIcon, compact && styles.transactionIconCompact]}><TravelArtwork kind={icon} color={C.green} size={compact ? 22 : 29} /></View>
      <View style={styles.transactionCopy}>
        <Text numberOfLines={1} style={[styles.transactionMerchant, compact && styles.transactionMerchantCompact]}>{transaction.merchant}</Text>
        <Text style={[styles.transactionMeta, compact && styles.transactionMetaCompact]}>{formatTimestamp(transaction.timestamp)}</Text>
      </View>
      <View style={styles.transactionAmountWrap}>
        <Text style={[styles.transactionAmount, compact && styles.transactionAmountCompact]}>{transaction.amountLocal}</Text>
        <Text style={[styles.transactionUsd, compact && styles.transactionUsdCompact]}>{transaction.amountUsd}</Text>
      </View>
    </View>
  );
}

export default function TravelModeScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { security } = useNomadSecurity();
  const { travelPocket, loading, error, selectRegion, enable, disable, setAutoConvert } = useNomadTravel();

  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  const [scanPanelOpen, setScanPanelOpen] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [hideBalance, setHideBalance] = useState(false);

  const region = resolveRegion(travelPocket.regionInput);
  const frozen = security.freezeStatus === 'full' || security.freezeScope === 'travel_pocket';
  const fundingSources = travelPocket.fundingSources ?? [];
  const transactions = travelPocket.recentTransactions ?? [];
  const previewData = travelPocket.dataSource !== 'connected';
  const localCurrency = travelPocket.localCurrency || travelPocket.preferredStablecoin || region.stablecoin;
  const currencyCode = travelPocket.currencyCode || region.code;
  const autoConvert = travelPocket.autoConvertEnabled ?? false;
  const systemLabel = frozen ? 'FROZEN' : security.status === 'warning' ? 'REVIEW' : 'SECURE';
  const systemColor = frozen ? C.red : security.status === 'warning' ? C.yellow : C.green;

  const chooseRegion = async (nextRegion: RegionConfig) => {
    try {
      setSaving(true);
      setFeedback('');
      await selectRegion(nextRegion.name);
      setRegionPickerOpen(false);
      setFeedback(`${nextRegion.name} selected. Travel Mode activation was not changed.`);
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
      setFeedback(`Auto-Convert ${next ? 'enabled' : 'paused'}. Wallet approval remains required for conversion drafts.`);
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
    navigation.navigate('ApprovePOSTransaction', { source: 'travel_qr', paymentRequest: value, region: region.name });
  };

  return (
    <NomadPage maxWidth={960}>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <View style={styles.headerLeft}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={[styles.backButton, compact && styles.backButtonCompact]}>
            <TravelArtwork kind="back" color="#fff" size={compact ? 22 : 29} />
          </Pressable>
          <NomadBrandMark size={compact ? 39 : 56} />
          <View style={styles.headerCopy}>
            <Text style={[styles.title, compact && styles.titleCompact]}>Travel Pocket</Text>
            <Text numberOfLines={1} style={[styles.subtitle, compact && styles.subtitleCompact]}>Spend stable value anywhere</Text>
          </View>
        </View>
        <View style={[styles.headerActions, compact && styles.headerActionsCompact]}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Open Security Center. All Systems ${systemLabel}`} onPress={() => navigation.navigate('SecurityCenter')} style={[styles.systemPill, compact && styles.systemPillCompact]}>
            <TravelArtwork kind="shield" color={systemColor} size={compact ? 21 : 28} />
            <View><Text style={[styles.systemTop, compact && styles.systemTopCompact]}>All Systems</Text><Text style={[styles.systemBottom, compact && styles.systemBottomCompact, { color: systemColor }]}>{systemLabel}</Text></View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Open Travel Pocket help" onPress={() => navigation.navigate('Settings')} style={[styles.helpButton, compact && styles.helpButtonCompact]}>
            <TravelArtwork kind="help" color={C.muted} size={compact ? 22 : 28} />
          </Pressable>
        </View>
      </View>

      <Panel tone="green" style={[styles.heroPanel, compact && styles.heroPanelCompact]}>
        <View style={[styles.heroTop, compact && styles.heroTopCompact]}>
          <WorldMapGraphic compact={compact} />
          <Pressable accessibilityRole="button" accessibilityLabel={travelPocket.enabled ? 'Pause Travel Mode' : 'Activate Travel Mode'} disabled={saving || frozen} onPress={() => void toggleTravelMode()} style={[styles.travelToggle, compact && styles.travelToggleCompact, frozen && styles.actionDisabled]}>
            <TravelArtwork kind="plane" color={C.green} size={compact ? 17 : 22} />
            <Text style={[styles.travelToggleText, compact && styles.travelToggleTextCompact]}>{saving ? 'Updating…' : 'Travel Mode'}</Text>
          </Pressable>

          <View style={[styles.heroCopy, compact && styles.heroCopyCompact]}>
            <Text style={[styles.eyebrow, compact && styles.eyebrowCompact]}>CURRENT REGION</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Choose region. ${region.name} selected`} onPress={() => setRegionPickerOpen((value) => !value)} style={styles.regionButton}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.regionName, compact && styles.regionNameCompact]}>{region.name}</Text>
              <RegionFlag region={region} compact={compact} />
              <TravelArtwork kind="chevron" color={C.muted} size={compact ? 17 : 24} />
            </Pressable>

            <Text style={[styles.eyebrow, styles.currencyEyebrow, compact && styles.eyebrowCompact, compact && styles.currencyEyebrowCompact]}>SPENDING CURRENCY</Text>
            <View style={styles.currencyRow}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.currencyName, compact && styles.currencyNameCompact]}>{localCurrency}</Text>
              <View style={[styles.modePill, compact && styles.modePillCompact, travelPocket.enabled ? styles.modePillActive : styles.modePillReady]}><Text style={[styles.modePillText, compact && styles.modePillTextCompact, { color: travelPocket.enabled ? C.green : C.blue }]}>{travelPocket.enabled ? 'ACTIVE' : 'READY'}</Text></View>
            </View>
            <Text numberOfLines={1} style={[styles.currencyNote, compact && styles.currencyNoteCompact]}>1 {currencyCode} ≈ 1 {localCurrency}</Text>
            <Text style={[styles.previewLabel, compact && styles.previewLabelCompact]}>{previewData ? 'LOCAL PREVIEW • WALLET APPROVAL' : 'CONNECTED TRAVEL POCKET'}</Text>

            <View style={[styles.balanceCard, compact && styles.balanceCardCompact]}>
              <Pressable accessibilityRole="button" accessibilityLabel={hideBalance ? 'Show Travel Pocket balance' : 'Hide Travel Pocket balance'} onPress={() => setHideBalance((value) => !value)} style={styles.balanceTitleRow}>
                <Text style={[styles.balanceLabel, compact && styles.balanceLabelCompact]}>AVAILABLE BALANCE</Text>
                <TravelArtwork kind="eye" color={C.muted} size={compact ? 16 : 21} />
              </Pressable>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.balanceValue, compact && styles.balanceValueCompact]}>{hideBalance ? '••••••' : travelPocket.pocketBalanceLocal || '$0.00'}</Text>
              <Text style={[styles.balanceUsd, compact && styles.balanceUsdCompact]}>{hideBalance ? 'Balance hidden' : `≈ ${travelPocket.pocketBalanceFiat || '$0.00'} USD`}</Text>
            </View>
          </View>
        </View>

        {regionPickerOpen ? (
          <View style={[styles.regionPicker, compact && styles.regionPickerCompact]}>
            <View style={styles.pickerHeading}><View><Text style={styles.pickerTitle}>Choose a destination</Text><Text style={styles.pickerSubtitle}>Selection does not activate Travel Mode.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close region picker" onPress={() => setRegionPickerOpen(false)}><Text style={styles.closeText}>×</Text></Pressable></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionOptions}>
              {regions.map((item) => {
                const selected = item.name === region.name;
                return (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Select ${item.name}`} key={item.name} disabled={saving || frozen} onPress={() => void chooseRegion(item)} style={[styles.regionOption, compact && styles.regionOptionCompact, selected && styles.regionOptionSelected]}>
                    <Text style={[styles.regionFlag, compact && styles.regionFlagCompact]}>{item.flag}</Text>
                    <Text style={[styles.regionOptionName, selected && styles.regionOptionNameSelected]}>{item.name}</Text>
                    <Text style={styles.regionCode}>{item.code}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <StatCard compact={compact} icon="daily" label="Daily Limit" value={travelPocket.dailyLimitLocal || '—'} progress={travelPocket.spentTodayPercent ?? 0} note={`${travelPocket.spentTodayPercent ?? 0}% Used`} />
          <StatCard compact={compact} icon="trip" label="Trip Limit" value={travelPocket.tripLimitLocal || '—'} progress={travelPocket.tripSpentPercent ?? 0} note={`${travelPocket.tripSpentPercent ?? 0}% Used`} />
          <StatCard compact={compact} icon="wallet" label="Remaining Today" value={travelPocket.remainingTodayLocal || '—'} note={remainingUsdLabel(travelPocket.remainingTodayLocal, travelPocket.exchangeRate)} />
          <StatCard compact={compact} icon="clock" label="Expires" value={formatExpiryDate(travelPocket.expiresAt)} note={formatExpiryRemaining(travelPocket.expiresAt)} last />
        </View>
      </Panel>

      {loading ? <Text style={[styles.stateText, compact && styles.stateTextCompact]}>Synchronizing Travel Pocket…</Text> : null}
      {error ? <Text style={[styles.errorText, compact && styles.stateTextCompact]}>{error}</Text> : null}
      {frozen ? <Text style={[styles.freezeText, compact && styles.stateTextCompact]}>Emergency Freeze is active. Travel payments and settings are disabled.</Text> : null}
      {feedback ? <Text accessibilityLiveRegion="polite" style={[styles.feedbackText, compact && styles.stateTextCompact, feedback.includes('blocks') || feedback.includes('Unable') ? styles.feedbackError : null]}>{feedback}</Text> : null}

      <View style={[styles.actionGrid, compact && styles.actionGridCompact]}>
        <ActionCard compact={compact} icon="pay" title="Pay / Spend" subtitle={`Use ${localCurrency}`} disabled={frozen} onPress={openSpend} />
        <ActionCard compact={compact} icon="scan" title="Scan to Pay" subtitle="Merchant QR" disabled={frozen} onPress={() => setScanPanelOpen((value) => !value)} />
        <ActionCard compact={compact} icon="topup" title="Top Up Pocket" subtitle="Add Funds" disabled={frozen} onPress={() => navigation.navigate('TopUpTravelPocket', { mode: 'top_up' })} />
        <ActionCard compact={compact} icon="send" title="Send to Pocket" subtitle="From Wallets" disabled={frozen} onPress={() => navigation.navigate('TopUpTravelPocket', { mode: 'wallet_transfer' })} />
      </View>

      {scanPanelOpen ? (
        <Panel style={[styles.scanPanel, compact && styles.scanPanelCompact]}>
          <View style={styles.scanHeader}><View><Text style={styles.panelTitle}>SCAN TO PAY</Text><Text style={styles.panelSub}>Enter a merchant QR payload for local review.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close scan panel" onPress={() => setScanPanelOpen(false)}><Text style={styles.closeText}>×</Text></Pressable></View>
          <View style={styles.scanInputRow}>
            <TextInput accessibilityLabel="Merchant payment request" value={scanCode} onChangeText={setScanCode} placeholder="nomadpay:merchant-request" placeholderTextColor="#71839a" autoCapitalize="none" autoCorrect={false} style={styles.scanInput} />
            <Pressable accessibilityRole="button" accessibilityLabel="Review merchant payment" onPress={continueScannedPayment} style={styles.scanContinue}><Text style={styles.scanContinueText}>Review</Text></Pressable>
          </View>
          <Text style={styles.scanNotice}>The request is revalidated before any wallet-controlled draft is created.</Text>
        </Panel>
      ) : null}

      <Panel style={[styles.fundingPanel, compact && styles.fundingPanelCompact]}>
        <View style={styles.panelHeading}>
          <View style={styles.panelHeadingCopy}><Text style={[styles.panelTitle, compact && styles.panelTitleCompact]}>FUNDING SOURCES</Text><Text style={[styles.panelSub, compact && styles.panelSubCompact]}>Assets used to fund your Travel Pocket</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="View all wallets" onPress={() => navigation.navigate('Wallets')} style={[styles.viewButton, compact && styles.viewButtonCompact]}><Text style={[styles.viewButtonText, compact && styles.viewButtonTextCompact]}>View All Wallets</Text><TravelArtwork kind="chevron" color={C.blue} size={compact ? 15 : 20} /></Pressable>
        </View>

        {fundingSources.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.sourceRow, compact && styles.sourceRowCompact]}>{fundingSources.map((source) => <FundingSourceCard compact={compact} key={source.symbol} source={source} />)}</ScrollView> : <Text style={styles.emptyText}>No wallet funding sources are available.</Text>}

        <View style={[styles.optimizeRow, compact && styles.optimizeRowCompact]}>
          <View style={[styles.optimizeIcon, compact && styles.optimizeIconCompact]}><TravelArtwork kind="auto" color={C.green} size={compact ? 30 : 42} /></View>
          <View style={styles.optimizeCopy}>
            <View style={styles.optimizeTitleRow}><Text style={[styles.optimizeTitle, compact && styles.optimizeTitleCompact]}>Auto-Convert & Optimize</Text><View style={[styles.autoPill, autoConvert ? styles.autoPillOn : styles.autoPillOff]}><Text style={[styles.autoPillText, { color: autoConvert ? C.green : C.muted }]}>{autoConvert ? 'ON' : 'OFF'}</Text></View></View>
            <Text style={[styles.optimizeSub, compact && styles.optimizeSubCompact]}>We prepare conversion allocations for best rates and lowest fees. Wallet approval required.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={autoConvert ? 'Pause Auto-Convert' : 'Enable Auto-Convert'} disabled={saving || frozen} onPress={() => void toggleAutoConvert()} style={[styles.manageButton, compact && styles.manageButtonCompact, frozen && styles.actionDisabled]}><Text style={[styles.manageButtonText, compact && styles.manageButtonTextCompact]}>Manage</Text><TravelArtwork kind="chevron" color={C.blue} size={compact ? 15 : 20} /></Pressable>
        </View>
      </Panel>

      <Panel style={[styles.transactionsPanel, compact && styles.transactionsPanelCompact]}>
        <View style={styles.panelHeading}><Text style={[styles.panelTitle, compact && styles.panelTitleCompact]}>RECENT TRANSACTIONS</Text><Pressable accessibilityRole="button" accessibilityLabel="View all Travel Pocket transactions" onPress={() => navigation.navigate('NomadInsightsSpending')} style={styles.viewLinkButton}><Text style={[styles.viewLink, compact && styles.viewLinkCompact]}>View All</Text><TravelArtwork kind="chevron" color={C.blue} size={compact ? 15 : 19} /></Pressable></View>
        {transactions.length ? transactions.map((transaction, index) => <TransactionRow compact={compact} key={transaction.id} transaction={transaction} last={index === transactions.length - 1} />) : <Text style={styles.emptyText}>No Travel Pocket transactions yet.</Text>}
      </Panel>

      <Panel style={[styles.globalPanel, compact && styles.globalPanelCompact]}>
        <GlobalArtwork />
        <NomadBrandMark size={compact ? 36 : 52} />
        <View style={styles.globalCopy}><Text style={[styles.globalTitle, compact && styles.globalTitleCompact]}>Nomad works in 190+ countries</Text><Text style={[styles.globalSub, compact && styles.globalSubCompact]}>Travel Pocket gives you local stability, global freedom.</Text></View>
      </Panel>

      <BottomNav active="Travel" items={[["⌂", 'Home', 'Portfolio'], ["▣", 'Wallets', 'Wallets'], ["✈", 'Travel', 'TravelMode'], ["◇", 'Security', 'SecurityCenter'], ["⚙", 'Settings', 'Settings']]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  header: { minHeight: 76, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerCompact: { minHeight: 58, marginBottom: 8, gap: 5 },
  headerLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { width: 36, minHeight: 44, alignItems: 'flex-start', justifyContent: 'center' },
  backButtonCompact: { width: 24, minHeight: 34 },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { color: '#fff', fontSize: 29, fontWeight: '900' },
  titleCompact: { fontSize: 18, lineHeight: 22 },
  subtitle: { color: '#c5d0df', fontSize: 13, marginTop: 4 },
  subtitleCompact: { fontSize: 9, lineHeight: 12, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerActionsCompact: { gap: 5 },
  systemPill: { minHeight: 48, borderWidth: 1, borderColor: '#0a3c64', borderRadius: 999, backgroundColor: 'rgba(3,16,30,.96)', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  systemPillCompact: { minHeight: 36, paddingHorizontal: 7, gap: 5 },
  systemTop: { color: '#d9e5f4', fontSize: 10 },
  systemTopCompact: { fontSize: 8, lineHeight: 10 },
  systemBottom: { color: C.green, fontSize: 11, fontWeight: '900' },
  systemBottomCompact: { fontSize: 9, lineHeight: 11 },
  helpButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#0a3c64', alignItems: 'center', justifyContent: 'center' },
  helpButtonCompact: { width: 34, height: 34, borderRadius: 17 },
  heroPanel: { overflow: 'hidden' },
  heroPanelCompact: { borderRadius: 11 },
  heroTop: { minHeight: 360, padding: 24, position: 'relative' },
  heroTopCompact: { minHeight: 184, padding: 13 },
  heroCopy: { width: '54%', zIndex: 2 },
  heroCopyCompact: { width: '61%' },
  eyebrow: { color: C.green, fontSize: 12, fontWeight: '900', letterSpacing: 0.4 },
  eyebrowCompact: { fontSize: 8, lineHeight: 10 },
  currencyEyebrow: { marginTop: 22 },
  currencyEyebrowCompact: { marginTop: 10 },
  regionButton: { alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 7 },
  regionName: { color: '#fff', fontSize: 36, fontWeight: '900', maxWidth: '64%' },
  regionNameCompact: { fontSize: 21, lineHeight: 26 },
  flagEmoji: { fontSize: 29 },
  flagEmojiCompact: { fontSize: 20 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 7 },
  currencyName: { color: '#fff', fontSize: 30, fontWeight: '900', maxWidth: '72%' },
  currencyNameCompact: { fontSize: 18, lineHeight: 23, maxWidth: '70%' },
  modePill: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 5 },
  modePillCompact: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  modePillActive: { borderColor: 'rgba(32,239,112,.45)', backgroundColor: 'rgba(32,239,112,.14)' },
  modePillReady: { borderColor: 'rgba(49,148,255,.45)', backgroundColor: 'rgba(49,148,255,.12)' },
  modePillText: { fontSize: 9, fontWeight: '900' },
  modePillTextCompact: { fontSize: 7 },
  currencyNote: { color: '#d3dce8', fontSize: 11, marginTop: 8 },
  currencyNoteCompact: { fontSize: 8, marginTop: 3 },
  previewLabel: { color: C.yellow, fontSize: 8, fontWeight: '900', marginTop: 7 },
  previewLabelCompact: { fontSize: 5.5, marginTop: 3 },
  mapGraphic: { position: 'absolute', right: 0, top: 6, width: '62%', height: 260 },
  mapGraphicCompact: { right: -12, top: 5, width: '66%', height: 145 },
  travelToggle: { position: 'absolute', right: 20, top: 18, minHeight: 42, borderWidth: 1, borderColor: C.green, borderRadius: 999, backgroundColor: 'rgba(3,38,22,.9)', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 7, zIndex: 3 },
  travelToggleCompact: { right: 9, top: 9, minHeight: 26, paddingHorizontal: 8, gap: 4 },
  travelToggleText: { color: C.green, fontSize: 12, fontWeight: '900' },
  travelToggleTextCompact: { fontSize: 8 },
  balanceCard: { marginTop: 18, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: 'rgba(1,15,24,.72)', padding: 16 },
  balanceCardCompact: { marginTop: 8, borderRadius: 7, padding: 8 },
  balanceTitleRow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceLabel: { color: C.muted, fontSize: 11 },
  balanceLabelCompact: { fontSize: 7 },
  balanceValue: { color: '#fff', fontSize: 43, fontWeight: '900', marginTop: 5 },
  balanceValueCompact: { fontSize: 25, lineHeight: 29, marginTop: 2 },
  balanceUsd: { color: '#e2e9f1', fontSize: 12, marginTop: 4 },
  balanceUsdCompact: { fontSize: 8, marginTop: 1 },
  regionPicker: { marginHorizontal: 16, marginBottom: 17, borderWidth: 1, borderColor: 'rgba(32,239,112,.25)', borderRadius: 13, backgroundColor: 'rgba(0,19,14,.9)', paddingTop: 13 },
  regionPickerCompact: { marginHorizontal: 8, marginBottom: 8, borderRadius: 8, paddingTop: 8 },
  pickerHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 14 },
  pickerTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  pickerSubtitle: { color: C.muted, fontSize: 9, marginTop: 4 },
  closeText: { color: C.muted, fontSize: 27, lineHeight: 27 },
  regionOptions: { padding: 12 },
  regionOption: { width: 99, minHeight: 90, marginRight: 9, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: 'rgba(2,14,25,.92)', alignItems: 'center', justifyContent: 'center', padding: 7 },
  regionOptionCompact: { width: 75, minHeight: 68, borderRadius: 8 },
  regionOptionSelected: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.1)' },
  regionFlag: { fontSize: 24 },
  regionFlagCompact: { fontSize: 19 },
  regionOptionName: { color: '#fff', textAlign: 'center', fontSize: 9, fontWeight: '800', marginTop: 5 },
  regionOptionNameSelected: { color: C.green },
  regionCode: { color: C.muted, fontSize: 8, marginTop: 3 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(32,239,112,.22)', backgroundColor: 'rgba(0,9,17,.5)' },
  stat: { flex: 1, minWidth: 0, minHeight: 116, padding: 14, borderRightWidth: 1, borderRightColor: 'rgba(32,239,112,.15)' },
  statCompact: { minHeight: 70, paddingHorizontal: 8, paddingVertical: 7 },
  statLast: { borderRightWidth: 0 },
  statTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statLabel: { color: '#fff', fontSize: 10 },
  statLabelCompact: { fontSize: 7 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800', marginVertical: 9 },
  statValueCompact: { fontSize: 12, marginVertical: 5 },
  statNote: { color: '#d7e0ec', fontSize: 9, marginTop: 6 },
  statNoteCompact: { fontSize: 6.5, marginTop: 4 },
  stateText: { color: C.muted, fontSize: 11, marginTop: 10 },
  stateTextCompact: { fontSize: 8, marginTop: 6 },
  errorText: { color: C.yellow, fontSize: 11, marginTop: 10 },
  freezeText: { color: C.red, fontSize: 11, marginTop: 10 },
  feedbackText: { color: C.green, fontSize: 11, marginTop: 10 },
  feedbackError: { color: C.red },
  actionGrid: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionGridCompact: { gap: 6, marginTop: 10 },
  actionCard: { flex: 1, minWidth: 0, minHeight: 112, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center', padding: 10 },
  actionCardCompact: { minHeight: 68, borderRadius: 8, paddingHorizontal: 3, paddingVertical: 6 },
  actionDisabled: { opacity: 0.45 },
  actionTitle: { color: '#fff', fontSize: 13, fontWeight: '900', marginTop: 7, textAlign: 'center' },
  actionTitleCompact: { fontSize: 8, marginTop: 4 },
  actionSubtitle: { color: C.muted, fontSize: 9, marginTop: 4, textAlign: 'center' },
  actionSubtitleCompact: { fontSize: 6.5, marginTop: 2 },
  scanPanel: { marginTop: 16, padding: 16 },
  scanPanelCompact: { marginTop: 9, padding: 9 },
  scanHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  scanInputRow: { minHeight: 52, marginTop: 13, borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.panel2, flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  scanInput: { flex: 1, minWidth: 0, color: '#fff', fontSize: 11, outlineStyle: 'none' } as any,
  scanContinue: { minHeight: 40, marginRight: 6, borderWidth: 1, borderColor: C.blue, borderRadius: 8, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  scanContinueText: { color: C.blue, fontSize: 10, fontWeight: '900' },
  scanNotice: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 9 },
  fundingPanel: { marginTop: 18, padding: 17 },
  fundingPanelCompact: { marginTop: 10, padding: 10, borderRadius: 10 },
  panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  panelHeadingCopy: { flex: 1, minWidth: 0 },
  panelTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.3 },
  panelTitleCompact: { fontSize: 9 },
  panelSub: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  panelSubCompact: { fontSize: 7, lineHeight: 10, marginTop: 2 },
  viewButton: { minHeight: 39, borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  viewButtonCompact: { minHeight: 26, borderRadius: 6, paddingHorizontal: 8, gap: 2 },
  viewButtonText: { color: C.blue, fontSize: 10, fontWeight: '800' },
  viewButtonTextCompact: { fontSize: 7 },
  sourceRow: { width: '100%', justifyContent: 'space-between', paddingVertical: 18 },
  sourceRowCompact: { paddingVertical: 10 },
  sourceCard: { width: 88, alignItems: 'center' },
  sourceCardCompact: { width: 52 },
  sourceSymbol: { color: '#fff', fontSize: 11, fontWeight: '900', marginTop: 6 },
  sourceSymbolCompact: { fontSize: 8, marginTop: 4 },
  sourceBalance: { color: '#fff', fontSize: 9, maxWidth: 78, marginTop: 3 },
  sourceBalanceCompact: { fontSize: 6.5, maxWidth: 48, marginTop: 2 },
  sourceAllocation: { color: '#dbe4ef', fontSize: 9, marginTop: 3 },
  sourceAllocationCompact: { fontSize: 6.5, marginTop: 2 },
  emptyText: { color: C.muted, fontSize: 10, textAlign: 'center', paddingVertical: 20 },
  optimizeRow: { minHeight: 86, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 13 },
  optimizeRowCompact: { minHeight: 58, borderRadius: 8, padding: 8, gap: 8 },
  optimizeIcon: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: C.green, backgroundColor: 'rgba(32,239,112,.09)', alignItems: 'center', justifyContent: 'center' },
  optimizeIconCompact: { width: 39, height: 39, borderRadius: 20 },
  optimizeCopy: { flex: 1, minWidth: 0 },
  optimizeTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  optimizeTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  optimizeTitleCompact: { fontSize: 8.5 },
  optimizeSub: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  optimizeSubCompact: { fontSize: 6.5, lineHeight: 9, marginTop: 2 },
  autoPill: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  autoPillOn: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.09)' },
  autoPillOff: { borderColor: C.border },
  autoPillText: { fontSize: 8, fontWeight: '900' },
  manageButton: { minHeight: 40, borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 5 },
  manageButtonCompact: { minHeight: 30, borderRadius: 6, paddingHorizontal: 8, gap: 2 },
  manageButtonText: { color: C.blue, fontSize: 10, fontWeight: '900' },
  manageButtonTextCompact: { fontSize: 7 },
  transactionsPanel: { marginTop: 18, padding: 17 },
  transactionsPanelCompact: { marginTop: 10, padding: 10, borderRadius: 10 },
  viewLinkButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewLink: { color: C.blue, fontSize: 10, fontWeight: '900' },
  viewLinkCompact: { fontSize: 7 },
  transactionRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center' },
  transactionRowCompact: { minHeight: 43 },
  transactionBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  transactionIcon: { width: 43, height: 43, borderRadius: 22, borderWidth: 1, borderColor: C.green, backgroundColor: 'rgba(32,239,112,.07)', alignItems: 'center', justifyContent: 'center' },
  transactionIconCompact: { width: 29, height: 29, borderRadius: 15 },
  transactionCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  transactionMerchant: { color: '#fff', fontSize: 12, fontWeight: '800' },
  transactionMerchantCompact: { fontSize: 8 },
  transactionMeta: { color: C.muted, fontSize: 9, marginTop: 5 },
  transactionMetaCompact: { fontSize: 6.5, marginTop: 2 },
  transactionAmountWrap: { maxWidth: '38%', alignItems: 'flex-end' },
  transactionAmount: { color: '#fff', fontSize: 12, fontWeight: '800', textAlign: 'right' },
  transactionAmountCompact: { fontSize: 8.5 },
  transactionUsd: { color: C.muted, fontSize: 9, marginTop: 4, textAlign: 'right' },
  transactionUsdCompact: { fontSize: 6.5, marginTop: 2 },
  globalPanel: { marginTop: 18, minHeight: 92, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 13, overflow: 'hidden' },
  globalPanelCompact: { marginTop: 10, minHeight: 51, padding: 8, borderRadius: 9, gap: 8 },
  globalArtwork: { position: 'absolute', right: 0, top: 0, width: '48%', height: '100%' },
  globalCopy: { flex: 1, minWidth: 0, zIndex: 2 },
  globalTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  globalTitleCompact: { fontSize: 9 },
  globalSub: { color: C.muted, fontSize: 10, marginTop: 5 },
  globalSubCompact: { fontSize: 7, marginTop: 2 },
});
