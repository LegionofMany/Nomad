import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { useNomadSecurity, useNomadSwap, useNomadWallet } from '../nomad';
import type { NomadAsset, NomadSwapQuote } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  Panel,
  useNomadLayout,
} from '../ui/NomadShell';

type PickerTarget = 'from' | 'to' | null;
type DetailPanel = 'network' | 'fee' | 'slippage' | null;
type SlippageChoice = '0.10%' | '0.50%' | '1.00%';
type SwapIconKind = 'back' | 'chart' | 'chevron' | 'fee' | 'info' | 'lock' | 'network' | 'shield' | 'slippage' | 'swap' | 'switch' | 'time';

type SwapAsset = {
  symbol: string;
  name: string;
  balance: string;
  fiatValueUsd: string;
  badge: string;
  color: string;
  network: string;
};

const assetMeta: Record<string, Pick<SwapAsset, 'name' | 'badge' | 'color' | 'network'>> = {
  BTC: { name: 'Bitcoin', badge: '₿', color: '#ff9814', network: 'Bitcoin Mainnet' },
  ETH: { name: 'Ethereum', badge: 'Ξ', color: '#6574ca', network: 'Ethereum Mainnet' },
  HBAR: { name: 'Hedera', badge: 'H', color: '#6844ef', network: 'Hedera Mainnet' },
  XRP: { name: 'XRP', badge: 'X', color: '#151a20', network: 'XRPL Mainnet' },
  XLM: { name: 'Stellar', badge: 'S', color: '#147ff5', network: 'Stellar Mainnet' },
  XDC: { name: 'XDC Network', badge: 'X', color: '#0a5c9e', network: 'XDC Mainnet' },
  ADA: { name: 'Cardano', badge: 'A', color: '#2368d8', network: 'Cardano Mainnet' },
  ALGO: { name: 'Algorand', badge: 'A', color: '#2859b8', network: 'Algorand Mainnet' },
  USDC: { name: 'USD Coin', badge: '$', color: '#2775ca', network: 'Ethereum Mainnet' },
  USDT: { name: 'Tether', badge: '₮', color: '#26a17b', network: 'TRON Mainnet' },
  DAI: { name: 'Dai', badge: 'D', color: '#f5ac37', network: 'Ethereum Mainnet' },
};

const fallbackAssets: SwapAsset[] = [
  { symbol: 'BTC', balance: '0.3567', fiatValueUsd: '$22,123.10', ...assetMeta.BTC },
  { symbol: 'HBAR', balance: '3,250.00', fiatValueUsd: '$1,250.25', ...assetMeta.HBAR },
  { symbol: 'XRP', balance: '1,250.00', fiatValueUsd: '$750.00', ...assetMeta.XRP },
  { symbol: 'XLM', balance: '5,200.00', fiatValueUsd: '$310.40', ...assetMeta.XLM },
  { symbol: 'ETH', balance: '1.2500', fiatValueUsd: '$2,286.35', ...assetMeta.ETH },
  { symbol: 'USDC', balance: '250.00', fiatValueUsd: '$250.00', ...assetMeta.USDC },
];

function SwapIcon({ kind, color = C.blue, size = 24 }: { kind: SwapIconKind; color?: string; size?: number }) {
  const stroke = { stroke: color, strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let artwork: React.ReactNode;

  switch (kind) {
    case 'back':
      artwork = <><Path d="M30 8 14 24l16 16M15 24h26" {...stroke} /></>;
      break;
    case 'chart':
      artwork = <><Path d="M7 37 18 26l8 7 15-19" {...stroke} /><Path d="M32 14h9v9" {...stroke} /></>;
      break;
    case 'chevron':
      artwork = <Path d="m19 10 14 14-14 14" {...stroke} />;
      break;
    case 'fee':
      artwork = <><Path d="M10 42V8h21v34M8 42h26M15 15h11v9H15Z" {...stroke} /><Path d="M31 18h5l4 5v14a4 4 0 0 1-8 0V27" {...stroke} /></>;
      break;
    case 'info':
      artwork = <><Circle cx="24" cy="24" r="18" {...stroke} /><Path d="M24 21v12" {...stroke} /><Circle cx="24" cy="15" r="1.8" fill={color} /></>;
      break;
    case 'lock':
      artwork = <><Rect x="12" y="21" width="24" height="20" rx="4" {...stroke} /><Path d="M17 21v-5a7 7 0 0 1 14 0v5" {...stroke} /></>;
      break;
    case 'network':
      artwork = <><Circle cx="24" cy="24" r="18" {...stroke} /><Path d="M11 20h25l-6-6M37 28H12l6 6" {...stroke} /></>;
      break;
    case 'shield':
      artwork = <><Path d="M24 4 41 12v12c0 11-6 18-17 23C13 42 7 35 7 24V12Z" fill={`${color}14`} {...stroke} /><Path d="m16 24 6 6 11-13" {...stroke} /></>;
      break;
    case 'slippage':
      artwork = <><Path d="M7 14h34M7 24h34M7 34h34" {...stroke} /><Circle cx="17" cy="14" r="4" fill="#03101e" {...stroke} /><Circle cx="31" cy="24" r="4" fill="#03101e" {...stroke} /><Circle cx="21" cy="34" r="4" fill="#03101e" {...stroke} /></>;
      break;
    case 'switch':
      artwork = <><Path d="M17 7v33M17 7l-7 8M17 7l7 8M31 41V8M31 41l-7-8M31 41l7-8" {...stroke} /></>;
      break;
    case 'time':
      artwork = <><Circle cx="24" cy="24" r="18" {...stroke} /><Path d="M24 13v12l8 5" {...stroke} /></>;
      break;
    default:
      artwork = <><Path d="M8 17h28l-7-7M40 31H12l7 7" {...stroke} /></>;
  }

  return <Svg accessibilityLabel={`${kind} icon`} width={size} height={size} viewBox="0 0 48 48" fill="none">{artwork}</Svg>;
}

function parseNumber(value?: string) {
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapAsset(asset: NomadAsset): SwapAsset {
  const symbol = asset.symbol.toUpperCase();
  const meta = assetMeta[symbol] ?? {
    name: asset.name || symbol,
    badge: symbol.slice(0, 1),
    color: '#0a5c9e',
    network: asset.network || `${symbol} network`,
  };
  return {
    symbol,
    name: asset.name || meta.name,
    balance: asset.balance,
    fiatValueUsd: asset.fiatValueUsd,
    badge: meta.badge,
    color: meta.color,
    network: asset.network || meta.network,
  };
}

function formatInput(value: number, symbol: string) {
  const digits = ['BTC', 'ETH'].includes(symbol) ? 8 : ['USDC', 'USDT', 'DAI'].includes(symbol) ? 2 : 6;
  return Math.max(0, value).toFixed(digits).replace(/\.?0+$/, '');
}

function minimumReceived(quote: NomadSwapQuote, slippage: SlippageChoice) {
  const amount = parseNumber(quote.toAmount);
  const percent = parseNumber(slippage);
  return amount * (1 - percent / 100);
}

function AssetBadge({ asset, size = 54 }: { asset: SwapAsset; size?: number }) {
  const gradientId = `swap-${asset.symbol.toLowerCase()}`;
  return (
    <Svg accessibilityLabel={`${asset.name} logo`} width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id={gradientId} x1="7" y1="5" x2="41" y2="43">
          <Stop stopColor={asset.symbol === 'HBAR' ? '#8d55ff' : asset.color} />
          <Stop offset="1" stopColor={asset.symbol === 'BTC' ? '#ff8a00' : asset.color} />
        </LinearGradient>
      </Defs>
      <Circle cx="24" cy="24" r="22" fill={`url(#${gradientId})`} stroke="rgba(255,255,255,.2)" />
      {asset.symbol === 'BTC' ? (
        <><Path d="M19 12v24M24 10v28M15 15h12c7 0 8 9 1 10H15m0 0h13c8 0 8 11 0 11H15" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></>
      ) : asset.symbol === 'HBAR' ? (
        <><Path d="M16 12v24M32 12v24M16 20h16M16 28h16" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></>
      ) : (
        <SvgText x="24" y="31" fill="#fff" fontSize="20" fontWeight="900" textAnchor="middle">{asset.badge}</SvgText>
      )}
    </Svg>
  );
}

function PercentButton({ label, onPress }: { label: string; onPress(): void }) {
  return (
    <Pressable accessibilityLabel={`Use ${label} of available balance`} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.percentButton, pressed && styles.pressed]}>
      <Text style={[styles.percentText, label === 'MAX' && styles.maxText]}>{label}</Text>
    </Pressable>
  );
}

function DetailRow({ compact, icon, label, value, onPress, last }: { compact: boolean; icon: SwapIconKind; label: string; value: string; onPress?: () => void; last?: boolean }) {
  const content = (
    <View style={[styles.detailRow, compact && styles.detailRowCompact, !last && styles.detailBorder]}>
      <View style={[styles.detailIcon, compact && styles.detailIconCompact]}><SwapIcon kind={icon} size={compact ? 22 : 28} /></View>
      <Text style={[styles.detailLabel, compact && styles.detailLabelCompact]}>{label}</Text>
      <Text numberOfLines={2} style={[styles.detailValue, compact && styles.detailValueCompact]}>{value}</Text>
      {onPress ? <SwapIcon kind="chevron" color="#88a4c6" size={compact ? 18 : 23} /> : null}
    </View>
  );
  return onPress ? <Pressable accessibilityLabel={`${label}: ${value}`} accessibilityRole="button" onPress={onPress}>{content}</Pressable> : content;
}

function AssetPicker({ title, assets, selected, onSelect, onClose }: { title: string; assets: SwapAsset[]; selected: string; onSelect(symbol: string): void; onClose(): void }) {
  return (
    <Panel style={styles.pickerPanel}>
      <View style={styles.pickerHeader}>
        <Text style={styles.pickerTitle}>{title}</Text>
        <Pressable accessibilityLabel="Close asset picker" accessibilityRole="button" onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerList}>
        {assets.map((asset) => {
          const active = selected === asset.symbol;
          return (
            <Pressable accessibilityLabel={`Select ${asset.name}`} accessibilityRole="button" key={asset.symbol} onPress={() => onSelect(asset.symbol)} style={[styles.pickerAsset, active && styles.pickerAssetActive]}>
              <AssetBadge asset={asset} size={43} />
              <Text style={styles.pickerSymbol}>{asset.symbol}</Text>
              <Text style={styles.pickerBalance}>{asset.balance}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Panel>
  );
}

export default function SwapScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { assets: liveAssets } = useNomadWallet();
  const { security } = useNomadSecurity();
  const { quote, loading, error, lastDraft, refreshQuote, createDraft, clearDraft } = useNomadSwap();

  const [fromAsset, setFromAsset] = useState('BTC');
  const [toAsset, setToAsset] = useState('HBAR');
  const [amount, setAmount] = useState('0.01');
  const [slippage, setSlippage] = useState<SlippageChoice>('0.50%');
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [detailPanel, setDetailPanel] = useState<DetailPanel>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [now, setNow] = useState(Date.now());

  const assets = useMemo(() => {
    const mapped = liveAssets.map(mapAsset);
    const source = mapped.length ? mapped : fallbackAssets;
    const unique = new Map<string, SwapAsset>();
    source.forEach((asset) => unique.set(asset.symbol, asset));
    if (!unique.has(fromAsset) && assetMeta[fromAsset]) unique.set(fromAsset, { symbol: fromAsset, balance: '0', fiatValueUsd: '$0.00', ...assetMeta[fromAsset] });
    if (!unique.has(toAsset) && assetMeta[toAsset]) unique.set(toAsset, { symbol: toAsset, balance: '0', fiatValueUsd: '$0.00', ...assetMeta[toAsset] });
    return Array.from(unique.values());
  }, [fromAsset, liveAssets, toAsset]);

  const selectedFrom = assets.find((asset) => asset.symbol === fromAsset) ?? fallbackAssets[0];
  const selectedTo = assets.find((asset) => asset.symbol === toAsset) ?? fallbackAssets[1];
  const fromBalance = parseNumber(selectedFrom.balance);
  const feeAmount = quote.networkFee.startsWith(fromAsset) ? 0 : parseNumber(quote.networkFee.split(' ')[0]);
  const spendableMaximum = Math.max(0, fromBalance - feeAmount);
  const numericAmount = parseNumber(amount);
  const minReceived = minimumReceived(quote, slippage);
  const quoteExpiresAt = quote.expiresAt ? Date.parse(quote.expiresAt) : 0;
  const quoteSecondsRemaining = quoteExpiresAt ? Math.max(0, Math.ceil((quoteExpiresAt - now) / 1000)) : null;
  const quoteExpired = quoteExpiresAt > 0 && quoteSecondsRemaining === 0;
  const walletFrozen = security.freezeStatus === 'full';
  const amountValid = numericAmount > 0 && numericAmount <= spendableMaximum;
  const canReview = quote.status === 'quote' && !loading && !quoteExpired && !walletFrozen && amountValid && fromAsset !== toAsset;
  const canRefresh = quoteExpired && !loading && !walletFrozen && amountValid && fromAsset !== toAsset;
  const primaryActionEnabled = canReview || canRefresh;
  const quoteSource = 'LOCAL ADAPTER QUOTE';
  const fromValue = parseNumber(quote.fromValueUsd);
  const toValue = parseNumber(quote.toValueUsd);
  const valueDifference = fromValue > 0 ? ((toValue / fromValue) - 1) * 100 : 0;
  const valueDifferenceLabel = `${valueDifference >= 0 ? '+' : ''}${valueDifference.toFixed(2)}%`;
  const systemLabel = walletFrozen ? 'FROZEN' : security.status === 'warning' ? 'REVIEW' : 'SECURE';
  const systemColor = walletFrozen ? C.red : security.status === 'warning' ? C.yellow : C.green;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (parseNumber(amount) > 0 && fromAsset !== toAsset) {
        void refreshQuote(fromAsset, toAsset, amount).catch(() => undefined);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [amount, fromAsset, refreshQuote, toAsset]);

  const chooseAsset = (target: Exclude<PickerTarget, null>, symbol: string) => {
    clearDraft();
    setFeedback('');
    setReviewOpen(false);
    if (target === 'from') {
      if (symbol === toAsset) setToAsset(fromAsset);
      setFromAsset(symbol);
    } else {
      if (symbol === fromAsset) setFromAsset(toAsset);
      setToAsset(symbol);
    }
    setPicker(null);
  };

  const setPercentage = (percentage: number) => {
    clearDraft();
    setReviewOpen(false);
    const selectedAmount = percentage >= 1 ? spendableMaximum : fromBalance * percentage;
    setAmount(formatInput(selectedAmount, fromAsset));
  };

  const switchAssets = () => {
    clearDraft();
    setFeedback('');
    setReviewOpen(false);
    const nextAmount = parseNumber(quote.toAmount) > 0 ? quote.toAmount.replace(/,/g, '') : amount;
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    setAmount(nextAmount);
  };

  const openReview = () => {
    if (!canReview) {
      if (walletFrozen) setFeedback('Emergency Freeze blocks new swaps.');
      else if (quoteExpired) setFeedback('The quote expired. Refresh it before continuing.');
      else if (!amountValid) setFeedback(`Enter an amount within the spendable ${fromAsset} balance.`);
      else setFeedback(error ?? quote.failure?.message ?? 'A valid swap quote is required.');
      return;
    }
    setFeedback('');
    setReviewOpen(true);
  };

  const handlePrimaryAction = () => {
    if (!quoteExpired) {
      openReview();
      return;
    }
    setFeedback('');
    void refreshQuote(fromAsset, toAsset, amount).catch((refreshError) => {
      setFeedback(refreshError instanceof Error ? refreshError.message : 'Unable to refresh the swap quote.');
    });
  };

  const confirmDraft = async () => {
    if (quoteExpired) {
      setReviewOpen(false);
      setFeedback('The quote expired. Refresh it before creating a draft.');
      return;
    }
    setFeedback('Creating a wallet-controlled Arkrilium swap draft…');
    try {
      const result = await createDraft({ ...quote, slippageTolerance: slippage });
      if (result.status === 'failed') {
        setFeedback(result.failure?.message ?? 'Unable to create the swap draft.');
        return;
      }
      setReviewOpen(false);
      setFeedback('Swap draft created. A wallet must still approve final signing and broadcast.');
    } catch (draftError) {
      setFeedback(draftError instanceof Error ? draftError.message : 'Unable to create the swap draft.');
    }
  };

  return (
    <NomadPage maxWidth={900}>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <View style={styles.headerLeft}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => navigation.goBack()} style={[styles.backButton, compact && styles.backButtonCompact]}>
            <SwapIcon kind="back" color="#fff" size={compact ? 21 : 27} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, compact && styles.titleCompact]}>Swap</Text>
            <Text numberOfLines={1} style={[styles.subtitle, compact && styles.subtitleCompact]}>Swap tokens instantly across chains</Text>
          </View>
        </View>
        <View style={[styles.headerRight, compact && styles.headerRightCompact]}>
          <Pressable accessibilityLabel={`Open Security Center. All Systems ${systemLabel}`} accessibilityRole="button" onPress={() => navigation.navigate('SecurityCenter')} style={[styles.systemPill, compact && styles.systemPillCompact]}>
            <SwapIcon kind="shield" color={systemColor} size={compact ? 20 : 26} />
            <View>
              <Text style={[styles.systemTop, compact && styles.systemTopCompact]}>All Systems</Text>
              <Text style={[styles.systemBottom, compact && styles.systemBottomCompact, { color: systemColor }]}>{systemLabel}</Text>
            </View>
          </Pressable>
          <Pressable accessibilityLabel="Open swap information" accessibilityRole="button" onPress={() => navigation.navigate('Settings')} style={[styles.helpButton, compact && styles.helpButtonCompact]}>
            <SwapIcon kind="info" color={systemColor} size={compact ? 21 : 27} />
          </Pressable>
        </View>
      </View>

      {walletFrozen ? <Text style={[styles.freezeWarning, compact && styles.freezeWarningCompact]}>Emergency Freeze is active. Swap review and draft creation are disabled.</Text> : null}
      {error ? <Text style={[styles.error, compact && styles.errorCompact]}>{error}</Text> : null}

      <Panel style={[styles.promo, compact && styles.promoCompact]}>
        <View style={[styles.promoIcon, compact && styles.promoIconCompact]}><SwapIcon kind="swap" size={compact ? 56 : 72} /></View>
        <View style={styles.promoCopy}>
          <Text style={[styles.promoTitle, compact && styles.promoTitleCompact]}>Best Rates. Secure. Low Fees.</Text>
          <Text style={[styles.promoSub, compact && styles.promoSubCompact]}>Powered by <Text style={styles.promoLink}>Arkrilium Liquidity Protocol</Text></Text>
          <Text style={[styles.sourceLabel, compact && styles.sourceLabelCompact]}>{quoteSource}{quoteSecondsRemaining !== null ? ` • ${quoteExpired ? 'EXPIRED' : `${quoteSecondsRemaining}s`}` : ''}</Text>
        </View>
      </Panel>

      {picker ? (
        <AssetPicker
          title={picker === 'from' ? 'Choose the asset you pay' : 'Choose the asset you receive'}
          assets={assets}
          selected={picker === 'from' ? fromAsset : toAsset}
          onSelect={(symbol) => chooseAsset(picker, symbol)}
          onClose={() => setPicker(null)}
        />
      ) : null}

      <Panel style={[styles.swapPanel, compact && styles.swapPanelCompact]}>
        <View style={styles.tokenHeader}>
          <Text style={[styles.payLabel, compact && styles.sectionLabelCompact]}>1. You Pay</Text>
          <Text style={[styles.balanceText, compact && styles.balanceTextCompact]}>Balance: {selectedFrom.balance} {fromAsset}</Text>
        </View>
        <View style={[styles.tokenBox, compact && styles.tokenBoxCompact]}>
          <Pressable accessibilityLabel={`Choose pay asset. ${fromAsset} selected`} accessibilityRole="button" onPress={() => setPicker('from')} style={styles.assetSelector}>
            <AssetBadge asset={selectedFrom} size={compact ? 42 : 57} />
            <View style={styles.tokenIdentity}>
              <Text style={[styles.tokenSymbol, compact && styles.tokenSymbolCompact]}>{fromAsset} <Text style={styles.chevronSmall}>⌄</Text></Text>
              <Text style={[styles.tokenName, compact && styles.tokenNameCompact]}>{selectedFrom.name}</Text>
            </View>
          </Pressable>
          <View style={styles.tokenAmountWrap}>
            <TextInput
              accessibilityLabel={`Amount of ${fromAsset} to pay`}
              value={amount}
              onChangeText={(value) => {
                clearDraft();
                setReviewOpen(false);
                setFeedback('');
                setAmount(value.replace(/[^0-9.]/g, ''));
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#64778e"
              style={[styles.amountInput, compact && styles.amountInputCompact]}
            />
            <Text style={[styles.tokenUsd, compact && styles.tokenUsdCompact]}>{loading ? 'Refreshing quote…' : `≈ ${quote.fromValueUsd} USD`}</Text>
          </View>
        </View>

        <View style={styles.percentRow}>
          <PercentButton label="25%" onPress={() => setPercentage(0.25)} />
          <PercentButton label="50%" onPress={() => setPercentage(0.5)} />
          <PercentButton label="75%" onPress={() => setPercentage(0.75)} />
          <PercentButton label="MAX" onPress={() => setPercentage(1)} />
        </View>
        {!compact ? <Text style={styles.spendableText}>Spendable after estimated network fee: {formatInput(spendableMaximum, fromAsset)} {fromAsset}</Text> : null}

        <View style={[styles.switchRow, compact && styles.switchRowCompact]}>
          <View style={styles.switchLine} />
          <Pressable accessibilityLabel="Switch pay and receive assets" accessibilityRole="button" onPress={switchAssets} style={({ pressed }) => [styles.switchButton, compact && styles.switchButtonCompact, pressed && styles.pressed]}>
            <SwapIcon kind="switch" size={compact ? 27 : 34} />
          </Pressable>
          <View style={styles.switchLine} />
        </View>

        <View style={styles.tokenHeader}>
          <Text style={[styles.receiveLabel, compact && styles.sectionLabelCompact]}>2. You Receive</Text>
          <Text style={[styles.balanceText, compact && styles.balanceTextCompact]}>Balance: {selectedTo.balance} {toAsset}</Text>
        </View>
        <View style={[styles.tokenBox, compact && styles.tokenBoxCompact]}>
          <Pressable accessibilityLabel={`Choose receive asset. ${toAsset} selected`} accessibilityRole="button" onPress={() => setPicker('to')} style={styles.assetSelector}>
            <AssetBadge asset={selectedTo} size={compact ? 42 : 57} />
            <View style={styles.tokenIdentity}>
              <Text style={[styles.tokenSymbol, compact && styles.tokenSymbolCompact]}>{toAsset} <Text style={styles.chevronSmall}>⌄</Text></Text>
              <Text style={[styles.tokenName, compact && styles.tokenNameCompact]}>{selectedTo.name}</Text>
            </View>
          </Pressable>
          <View style={styles.tokenAmountWrap}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.receiveAmount, compact && styles.receiveAmountCompact]}>{loading ? '—' : quote.toAmount}</Text>
            <Text style={[styles.tokenUsd, compact && styles.tokenUsdCompact]}>≈ {quote.toValueUsd} USD <Text style={styles.valueDifference}>({valueDifferenceLabel})</Text></Text>
          </View>
        </View>

        <View style={[styles.rateBox, compact && styles.rateBoxCompact]}>
          <View style={styles.rateCopy}>
            <View style={styles.rateLabelRow}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.rateText, compact && styles.rateTextCompact]}>{quote.rateLabel}</Text><SwapIcon kind="chart" color={C.green} size={compact ? 17 : 20} /></View>
            {!compact ? <Text style={styles.minimumText}>Minimum received: {formatInput(minReceived, toAsset)} {toAsset}</Text> : null}
          </View>
          <View style={styles.rateRight}>
            <View style={styles.bestRateRow}><SwapIcon kind="shield" color={C.green} size={compact ? 17 : 20} /><Text style={[styles.bestRate, compact && styles.bestRateCompact]}>Best rate</Text></View>
            <Text style={[styles.priceImpact, compact && styles.priceImpactCompact]}>{quote.priceImpact}</Text>
            <Text style={[styles.impactLabel, compact && styles.impactLabelCompact]}>Est. Price Impact</Text>
          </View>
        </View>
      </Panel>

      <Panel style={[styles.detailPanel, compact && styles.detailPanelCompact]}>
        <DetailRow compact={compact} icon="network" label="Network" value={quote.network} onPress={() => setDetailPanel(detailPanel === 'network' ? null : 'network')} />
        <DetailRow compact={compact} icon="fee" label="Network Fee" value={quote.networkFee} onPress={() => setDetailPanel(detailPanel === 'fee' ? null : 'fee')} />
        <DetailRow compact={compact} icon="time" label="Estimated Time" value={quote.estimatedTime} />
        <DetailRow compact={compact} icon="slippage" label="Slippage Tolerance" value={slippage} onPress={() => setDetailPanel(detailPanel === 'slippage' ? null : 'slippage')} last />
      </Panel>

      {detailPanel === 'network' ? (
        <Panel style={styles.infoPanel}>
          <Text style={styles.infoTitle}>Arkrilium Network Route</Text>
          <Text style={styles.infoCopy}>The adapter selects the destination network for {toAsset}. A production liquidity provider must replace the local quote source before this is considered a live market route.</Text>
        </Panel>
      ) : null}

      {detailPanel === 'fee' ? (
        <Panel style={styles.infoPanel}>
          <Text style={styles.infoTitle}>Estimated Network Fee</Text>
          <Text style={styles.infoCopy}>{quote.networkFee}. The wallet must recalculate the final fee immediately before signing because network conditions can change.</Text>
        </Panel>
      ) : null}

      {detailPanel === 'slippage' ? (
        <Panel style={styles.slippagePanel}>
          <Text style={styles.infoTitle}>Choose Slippage Tolerance</Text>
          <View style={styles.slippageRow}>
            {(['0.10%', '0.50%', '1.00%'] as SlippageChoice[]).map((choice) => (
              <Pressable accessibilityLabel={`Set slippage tolerance to ${choice}`} accessibilityRole="button" key={choice} onPress={() => { setSlippage(choice); clearDraft(); setReviewOpen(false); }} style={[styles.slippageButton, slippage === choice && styles.slippageButtonActive]}>
                <Text style={[styles.slippageText, slippage === choice && styles.slippageTextActive]}>{choice}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.infoCopy}>Minimum received updates with the selected tolerance. The final wallet review must use the same value.</Text>
        </Panel>
      ) : null}

      <Pressable accessibilityLabel={quoteExpired ? 'Refresh swap quote' : 'Review swap'} accessibilityRole="button" disabled={!primaryActionEnabled} onPress={handlePrimaryAction} style={({ pressed }) => [styles.swapButton, compact && styles.swapButtonCompact, !primaryActionEnabled && styles.swapButtonDisabled, pressed && primaryActionEnabled && styles.pressed]}>
        <SwapIcon kind="swap" color="#fff" size={compact ? 31 : 38} />
        <View style={styles.swapButtonCopy}>
          <Text style={[styles.swapButtonTitle, compact && styles.swapButtonTitleCompact]}>{loading ? 'Refreshing Quote…' : quoteExpired ? 'Refresh Quote' : lastDraft?.status === 'created' ? 'Swap Draft Ready' : 'Swap Now'}</Text>
          <View style={styles.swapButtonSubRow}><SwapIcon kind="lock" color="rgba(255,255,255,.78)" size={compact ? 15 : 18} /><Text style={[styles.swapButtonSub, compact && styles.swapButtonSubCompact]}>{walletFrozen ? 'Blocked by Emergency Freeze' : 'Secure Review • Wallet Approval'}</Text></View>
        </View>
      </Pressable>

      {quoteExpired ? (
        <Pressable accessibilityLabel="Refresh expired quote" accessibilityRole="button" onPress={() => void refreshQuote(fromAsset, toAsset, amount)} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh expired quote</Text>
        </Pressable>
      ) : null}

      {reviewOpen ? (
        <Panel tone="green" style={styles.reviewPanel}>
          <Text style={styles.reviewTitle}>Review Swap</Text>
          <Text style={styles.reviewSub}>No transaction has been signed or broadcast.</Text>
          <View style={styles.reviewRows}>
            <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Pay</Text><Text style={styles.reviewValue}>{quote.fromAmount} {fromAsset}</Text></View>
            <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Receive estimate</Text><Text style={styles.reviewValue}>{quote.toAmount} {toAsset}</Text></View>
            <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Minimum received</Text><Text style={styles.reviewValue}>{formatInput(minReceived, toAsset)} {toAsset}</Text></View>
            <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Network fee</Text><Text style={styles.reviewValue}>{quote.networkFee}</Text></View>
            <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Slippage</Text><Text style={styles.reviewValue}>{slippage}</Text></View>
            <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Quote expires</Text><Text style={styles.reviewValue}>{quoteSecondsRemaining ?? '—'} seconds</Text></View>
          </View>
          <View style={styles.reviewActions}>
            <Pressable accessibilityLabel="Cancel swap review" accessibilityRole="button" onPress={() => setReviewOpen(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
            <Pressable accessibilityLabel="Create swap draft" accessibilityRole="button" disabled={quoteExpired || loading} onPress={() => void confirmDraft()} style={[styles.confirmButton, (quoteExpired || loading) && styles.swapButtonDisabled]}><Text style={styles.confirmText}>Create Swap Draft</Text></Pressable>
          </View>
        </Panel>
      ) : null}

      {feedback ? <Text accessibilityLiveRegion="polite" style={[styles.feedback, feedback.includes('blocks') || feedback.includes('Unable') || feedback.includes('expired') ? styles.feedbackError : null]}>{feedback}</Text> : null}

      <View style={[styles.trustRow, compact && styles.trustRowCompact]}>
        <SwapIcon kind="shield" color={C.green} size={compact ? 18 : 22} />
        <Text style={[styles.trustText, compact && styles.trustTextCompact]}>Protected by <Text style={styles.trustLink}>Arkrilium Protocols</Text> | Local Quote • Non-Custodial • Wallet Approval Required</Text>
      </View>

      <BottomNav
        active="Swap"
        items={[
          ['⌂', 'Home', 'Portfolio'],
          ['▣', 'Wallets', 'Wallets'],
          ['⇄', 'Swap', 'Swap'],
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
  freezeWarning: { color: C.red, borderWidth: 1, borderColor: C.red, borderRadius: 11, padding: 12, marginBottom: 12, backgroundColor: 'rgba(255,75,75,.06)' },
  freezeWarningCompact: { borderRadius: 8, padding: 8, marginBottom: 8, fontSize: 9 },
  error: { color: C.red, marginBottom: 10 },
  errorCompact: { marginBottom: 7, fontSize: 9 },
  promo: { minHeight: 88, padding: 16, flexDirection: 'row', alignItems: 'center' },
  promoCompact: { minHeight: 55, padding: 8, borderRadius: 10 },
  promoIcon: { width: 92, marginHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  promoIconCompact: { width: 76, marginHorizontal: 2 },
  promoCopy: { flex: 1, minWidth: 0 },
  promoTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  promoTitleCompact: { fontSize: 12 },
  promoSub: { color: '#c5d0df', fontSize: 13, marginTop: 6 },
  promoSubCompact: { fontSize: 10, marginTop: 3 },
  promoLink: { color: C.blue },
  sourceLabel: { color: C.yellow, fontSize: 9, fontWeight: '900', marginTop: 7 },
  sourceLabelCompact: { fontSize: 6, marginTop: 3 },
  pickerPanel: { marginTop: 14, padding: 14 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  closeText: { color: C.muted, fontSize: 29 },
  pickerList: { paddingTop: 14, paddingBottom: 3 },
  pickerAsset: { width: 105, minHeight: 116, marginRight: 10, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel2, alignItems: 'center', justifyContent: 'center', padding: 9 },
  pickerAssetActive: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.06)' },
  pickerSymbol: { color: '#fff', fontSize: 13, fontWeight: '900', marginTop: 7 },
  pickerBalance: { color: C.muted, fontSize: 9, marginTop: 4 },
  swapPanel: { marginTop: 18, padding: 17, borderColor: '#086bd1' },
  swapPanelCompact: { marginTop: 10, padding: 11, borderRadius: 12 },
  tokenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 11 },
  payLabel: { color: C.blue, fontSize: 16, fontWeight: '900' },
  receiveLabel: { color: C.green, fontSize: 16, fontWeight: '900' },
  sectionLabelCompact: { fontSize: 11 },
  balanceText: { color: C.muted, fontSize: 11, textAlign: 'right' },
  balanceTextCompact: { fontSize: 9 },
  tokenBox: { minHeight: 108, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.panel2, padding: 13, flexDirection: 'row', alignItems: 'center' },
  tokenBoxCompact: { minHeight: 66, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 7 },
  assetSelector: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  assetBadge: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.17)' },
  assetBadgeText: { color: '#fff', fontWeight: '900' },
  tokenIdentity: { flex: 1, minWidth: 0, marginLeft: 11 },
  tokenSymbol: { color: '#fff', fontSize: 20, fontWeight: '900' },
  tokenSymbolCompact: { fontSize: 14 },
  chevronSmall: { color: '#91a7c1' },
  tokenName: { color: C.muted, fontSize: 12, marginTop: 5 },
  tokenNameCompact: { fontSize: 9, marginTop: 2 },
  tokenAmountWrap: { width: '46%', alignItems: 'flex-end' },
  amountInput: { width: '100%', color: '#fff', fontSize: 34, fontWeight: '900', textAlign: 'right', outlineStyle: 'none' } as any,
  amountInputCompact: { fontSize: 24, lineHeight: 29 },
  receiveAmount: { width: '100%', color: '#fff', fontSize: 34, fontWeight: '900', textAlign: 'right' },
  receiveAmountCompact: { fontSize: 24, lineHeight: 29 },
  tokenUsd: { color: C.muted, fontSize: 11, marginTop: 6, textAlign: 'right' },
  tokenUsdCompact: { fontSize: 9, marginTop: 3 },
  valueDifference: { color: C.red },
  percentRow: { flexDirection: 'row', gap: 7, marginTop: 8 },
  percentButton: { flex: 1, minWidth: 0, minHeight: 29, borderWidth: 1, borderColor: C.border, borderRadius: 7, backgroundColor: C.panel2, alignItems: 'center', justifyContent: 'center' },
  percentText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  maxText: { color: C.blue },
  spendableText: { color: C.muted, fontSize: 9, textAlign: 'right', marginTop: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  switchRowCompact: { marginVertical: 11 },
  switchLine: { flex: 1, height: 1, backgroundColor: C.blue },
  switchButton: { width: 54, height: 54, borderRadius: 27, marginHorizontal: 15, borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(0,80,170,.55)', alignItems: 'center', justifyContent: 'center' },
  switchButtonCompact: { width: 39, height: 39, borderRadius: 20, marginHorizontal: 10 },
  switchIcon: { color: '#31a6ff', fontSize: 28, fontWeight: '900' },
  rateBox: { minHeight: 76, marginTop: 14, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel2, padding: 13, flexDirection: 'row', alignItems: 'center' },
  rateBoxCompact: { minHeight: 47, marginTop: 8, borderRadius: 8, padding: 8 },
  rateCopy: { flex: 1, minWidth: 0 },
  rateLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rateText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  rateTextCompact: { flexShrink: 1, fontSize: 11 },
  minimumText: { color: C.muted, fontSize: 10, marginTop: 6 },
  rateRight: { alignItems: 'flex-end', marginLeft: 9 },
  bestRateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bestRate: { color: C.green, fontSize: 11, fontWeight: '900' },
  bestRateCompact: { fontSize: 10 },
  priceImpact: { color: '#fff', fontSize: 10, marginTop: 2 },
  priceImpactCompact: { fontSize: 9 },
  impactLabel: { color: C.muted, fontSize: 8, marginTop: 2 },
  impactLabelCompact: { fontSize: 7 },
  detailPanel: { marginTop: 18, paddingHorizontal: 16 },
  detailPanelCompact: { marginTop: 10, paddingHorizontal: 9, borderRadius: 11 },
  detailRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center' },
  detailRowCompact: { minHeight: 42 },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  detailIcon: { width: 44, alignItems: 'center', justifyContent: 'center' },
  detailIconCompact: { width: 35 },
  detailLabel: { color: '#fff', fontSize: 14, flex: 1 },
  detailLabelCompact: { fontSize: 11 },
  detailValue: { color: '#dbe4f0', fontSize: 11, textAlign: 'right', maxWidth: '45%' },
  detailValueCompact: { fontSize: 9 },
  detailChevron: { color: '#88a4c6', fontSize: 28, marginLeft: 8 },
  infoPanel: { marginTop: 11, padding: 16 },
  infoTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  infoCopy: { color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 7 },
  slippagePanel: { marginTop: 11, padding: 16 },
  slippageRow: { flexDirection: 'row', gap: 9, marginTop: 12 },
  slippageButton: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: C.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  slippageButtonActive: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.07)' },
  slippageText: { color: '#fff', fontWeight: '800' },
  slippageTextActive: { color: C.green },
  swapButton: { minHeight: 80, marginTop: 18, borderRadius: 16, backgroundColor: '#0b65f4', paddingHorizontal: 19, flexDirection: 'row', alignItems: 'center', gap: 13 },
  swapButtonCompact: { minHeight: 66, marginTop: 10, borderRadius: 11, paddingHorizontal: 16, justifyContent: 'center', gap: 10 },
  swapButtonDisabled: { opacity: 0.45 },
  swapButtonIcon: { color: '#fff', fontSize: 30, fontWeight: '900' },
  swapButtonCopy: { flex: 1 },
  swapButtonTitle: { color: '#fff', fontSize: 19, fontWeight: '900' },
  swapButtonTitleCompact: { fontSize: 17 },
  swapButtonSubRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  swapButtonSub: { color: 'rgba(255,255,255,.78)', fontSize: 11 },
  swapButtonSubCompact: { fontSize: 9 },
  swapButtonArrow: { color: '#fff', fontSize: 33 },
  refreshButton: { alignSelf: 'center', marginTop: 10, borderWidth: 1, borderColor: C.blue, borderRadius: 9, paddingHorizontal: 15, paddingVertical: 9 },
  refreshText: { color: C.blue, fontSize: 11, fontWeight: '900' },
  reviewPanel: { marginTop: 15, padding: 17 },
  reviewTitle: { color: C.green, fontSize: 19, fontWeight: '900' },
  reviewSub: { color: C.muted, fontSize: 11, marginTop: 5 },
  reviewRows: { marginTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(32,239,112,.16)' },
  reviewRow: { minHeight: 48, borderBottomWidth: 1, borderBottomColor: 'rgba(32,239,112,.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  reviewLabel: { color: C.muted, fontSize: 11 },
  reviewValue: { flex: 1, color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'right' },
  reviewActions: { flexDirection: 'row', gap: 10, marginTop: 15 },
  cancelButton: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: C.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#fff', fontWeight: '800' },
  confirmButton: { flex: 1.4, minHeight: 48, borderRadius: 10, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#01140a', fontWeight: '900' },
  feedback: { color: C.green, textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 13 },
  feedbackError: { color: C.red },
  trustRow: { marginTop: 19, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  trustRowCompact: { minHeight: 29, marginTop: 8, marginBottom: 0, gap: 4 },
  trustShield: { color: C.green, fontSize: 19, marginRight: 8 },
  trustText: { color: C.muted, fontSize: 11, textAlign: 'center', lineHeight: 18 },
  trustTextCompact: { flexShrink: 1, fontSize: 7, lineHeight: 11 },
  trustLink: { color: C.blue },
});
