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

import { useNomadSecurity, useNomadSwap, useNomadWallet } from '../nomad';
import type { NomadAsset, NomadSwapQuote } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

type PickerTarget = 'from' | 'to' | null;
type DetailPanel = 'network' | 'fee' | 'slippage' | null;
type SlippageChoice = '0.10%' | '0.50%' | '1.00%';

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
  return (
    <View style={[styles.assetBadge, { width: size, height: size, borderRadius: size / 2, backgroundColor: asset.color }]}>
      <Text style={[styles.assetBadgeText, { fontSize: size * 0.44 }]}>{asset.badge}</Text>
    </View>
  );
}

function PercentButton({ label, onPress }: { label: string; onPress(): void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.percentButton, pressed && styles.pressed]}>
      <Text style={[styles.percentText, label === 'MAX' && styles.maxText]}>{label}</Text>
    </Pressable>
  );
}

function DetailRow({ icon, label, value, onPress, last }: { icon: string; label: string; value: string; onPress?: () => void; last?: boolean }) {
  const content = (
    <View style={[styles.detailRow, !last && styles.detailBorder]}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.detailValue}>{value}</Text>
      {onPress ? <Text style={styles.detailChevron}>›</Text> : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

function AssetPicker({ title, assets, selected, onSelect, onClose }: { title: string; assets: SwapAsset[]; selected: string; onSelect(symbol: string): void; onClose(): void }) {
  return (
    <Panel style={styles.pickerPanel}>
      <View style={styles.pickerHeader}>
        <Text style={styles.pickerTitle}>{title}</Text>
        <Pressable onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerList}>
        {assets.map((asset) => {
          const active = selected === asset.symbol;
          return (
            <Pressable key={asset.symbol} onPress={() => onSelect(asset.symbol)} style={[styles.pickerAsset, active && styles.pickerAssetActive]}>
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
  const quoteSource = quote.quoteId?.startsWith('ark-local-') ? 'LOCAL ADAPTER QUOTE' : quote.quoteId ? 'CONNECTED QUOTE' : 'PREVIEW QUOTE';

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

  const confirmDraft = async () => {
    setFeedback('Creating a wallet-controlled Arkrilium swap draft…');
    const result = await createDraft({ ...quote, slippageTolerance: slippage });
    if (result.status === 'failed') {
      setFeedback(result.failure?.message ?? 'Unable to create the swap draft.');
      return;
    }
    setReviewOpen(false);
    setFeedback('Swap draft created. The connected wallet still controls final signing and broadcast.');
  };

  return (
    <NomadPage maxWidth={900}>
      <PageHeader title="Swap" subtitle="Swap tokens across supported networks" icon="⇄" color={C.blue} help />

      {walletFrozen ? <Text style={styles.freezeWarning}>Emergency Freeze is active. Swap review and draft creation are disabled.</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Panel style={styles.promo}>
        <Text style={styles.promoIcon}>⇄</Text>
        <View style={styles.promoCopy}>
          <Text style={styles.promoTitle}>Best Route. Secure. Non-Custodial.</Text>
          <Text style={styles.promoSub}>Quoted through the <Text style={styles.promoLink}>Arkrilium Liquidity Adapter</Text></Text>
          <Text style={styles.sourceLabel}>{quoteSource}{quoteSecondsRemaining !== null ? ` • ${quoteExpired ? 'EXPIRED' : `${quoteSecondsRemaining}s`}` : ''}</Text>
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

      <Panel style={styles.swapPanel}>
        <View style={styles.tokenHeader}>
          <Text style={styles.payLabel}>1. You Pay</Text>
          <Text style={styles.balanceText}>Balance: {selectedFrom.balance} {fromAsset}</Text>
        </View>
        <View style={[styles.tokenBox, compact && styles.tokenBoxCompact]}>
          <Pressable onPress={() => setPicker('from')} style={styles.assetSelector}>
            <AssetBadge asset={selectedFrom} size={compact ? 49 : 57} />
            <View style={styles.tokenIdentity}>
              <Text style={styles.tokenSymbol}>{fromAsset} <Text style={styles.chevronSmall}>⌄</Text></Text>
              <Text style={styles.tokenName}>{selectedFrom.name}</Text>
            </View>
          </Pressable>
          <View style={styles.tokenAmountWrap}>
            <TextInput
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
            <Text style={styles.tokenUsd}>{loading ? 'Refreshing quote…' : `≈ ${quote.fromValueUsd} USD`}</Text>
          </View>
        </View>

        <View style={styles.percentRow}>
          <PercentButton label="25%" onPress={() => setPercentage(0.25)} />
          <PercentButton label="50%" onPress={() => setPercentage(0.5)} />
          <PercentButton label="75%" onPress={() => setPercentage(0.75)} />
          <PercentButton label="MAX" onPress={() => setPercentage(1)} />
        </View>
        <Text style={styles.spendableText}>Spendable after estimated network fee: {formatInput(spendableMaximum, fromAsset)} {fromAsset}</Text>

        <View style={styles.switchRow}>
          <View style={styles.switchLine} />
          <Pressable onPress={switchAssets} style={({ pressed }) => [styles.switchButton, pressed && styles.pressed]}>
            <Text style={styles.switchIcon}>↕</Text>
          </Pressable>
          <View style={styles.switchLine} />
        </View>

        <View style={styles.tokenHeader}>
          <Text style={styles.receiveLabel}>2. You Receive</Text>
          <Text style={styles.balanceText}>Balance: {selectedTo.balance} {toAsset}</Text>
        </View>
        <View style={[styles.tokenBox, compact && styles.tokenBoxCompact]}>
          <Pressable onPress={() => setPicker('to')} style={styles.assetSelector}>
            <AssetBadge asset={selectedTo} size={compact ? 49 : 57} />
            <View style={styles.tokenIdentity}>
              <Text style={styles.tokenSymbol}>{toAsset} <Text style={styles.chevronSmall}>⌄</Text></Text>
              <Text style={styles.tokenName}>{selectedTo.name}</Text>
            </View>
          </Pressable>
          <View style={styles.tokenAmountWrap}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.receiveAmount, compact && styles.receiveAmountCompact]}>{loading ? '—' : quote.toAmount}</Text>
            <Text style={styles.tokenUsd}>≈ {quote.toValueUsd} USD</Text>
          </View>
        </View>

        <View style={styles.rateBox}>
          <View style={styles.rateCopy}>
            <Text style={styles.rateText}>{quote.rateLabel}</Text>
            <Text style={styles.minimumText}>Minimum received: {formatInput(minReceived, toAsset)} {toAsset}</Text>
          </View>
          <View style={styles.rateRight}>
            <Text style={styles.bestRate}>◇ Smart route</Text>
            <Text style={styles.priceImpact}>Price impact {quote.priceImpact}</Text>
          </View>
        </View>
      </Panel>

      <Panel style={styles.detailPanel}>
        <DetailRow icon="⇅" label="Network Route" value={quote.network} onPress={() => setDetailPanel(detailPanel === 'network' ? null : 'network')} />
        <DetailRow icon="▥" label="Network Fee" value={quote.networkFee} onPress={() => setDetailPanel(detailPanel === 'fee' ? null : 'fee')} />
        <DetailRow icon="◷" label="Estimated Time" value={quote.estimatedTime} />
        <DetailRow icon="☷" label="Slippage Tolerance" value={slippage} onPress={() => setDetailPanel(detailPanel === 'slippage' ? null : 'slippage')} last />
      </Panel>

      {detailPanel === 'network' ? (
        <Panel style={styles.infoPanel}>
          <Text style={styles.infoTitle}>Arkrilium Smart Route</Text>
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
              <Pressable key={choice} onPress={() => { setSlippage(choice); clearDraft(); setReviewOpen(false); }} style={[styles.slippageButton, slippage === choice && styles.slippageButtonActive]}>
                <Text style={[styles.slippageText, slippage === choice && styles.slippageTextActive]}>{choice}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.infoCopy}>Minimum received updates with the selected tolerance. The final wallet review must use the same value.</Text>
        </Panel>
      ) : null}

      <Pressable disabled={!canReview} onPress={openReview} style={({ pressed }) => [styles.swapButton, !canReview && styles.swapButtonDisabled, pressed && canReview && styles.pressed]}>
        <Text style={styles.swapButtonIcon}>⇄</Text>
        <View style={styles.swapButtonCopy}>
          <Text style={styles.swapButtonTitle}>{loading ? 'Refreshing Quote…' : quoteExpired ? 'Refresh Quote' : lastDraft?.status === 'created' ? 'Swap Draft Ready' : 'Swap Now'}</Text>
          <Text style={styles.swapButtonSub}>{walletFrozen ? 'Blocked by Emergency Freeze' : 'Review before wallet approval'}</Text>
        </View>
        <Text style={styles.swapButtonArrow}>›</Text>
      </Pressable>

      {quoteExpired ? (
        <Pressable onPress={() => void refreshQuote(fromAsset, toAsset, amount)} style={styles.refreshButton}>
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
            <Pressable onPress={() => setReviewOpen(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
            <Pressable onPress={() => void confirmDraft()} style={styles.confirmButton}><Text style={styles.confirmText}>Create Swap Draft</Text></Pressable>
          </View>
        </Panel>
      ) : null}

      {feedback ? <Text style={[styles.feedback, feedback.includes('blocks') || feedback.includes('Unable') || feedback.includes('expired') ? styles.feedbackError : null]}>{feedback}</Text> : null}

      <View style={styles.trustRow}>
        <Text style={styles.trustShield}>◇</Text>
        <Text style={styles.trustText}>Protected by <Text style={styles.trustLink}>Arkrilium</Text> • Non-Custodial • Final signing remains in the connected wallet</Text>
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
  freezeWarning: { color: C.red, borderWidth: 1, borderColor: C.red, borderRadius: 11, padding: 12, marginBottom: 12, backgroundColor: 'rgba(255,75,75,.06)' },
  error: { color: C.red, marginBottom: 10 },
  promo: { minHeight: 88, padding: 16, flexDirection: 'row', alignItems: 'center' },
  promoIcon: { color: C.blue, fontSize: 46, fontWeight: '900', marginHorizontal: 16, textShadowColor: C.blue, textShadowRadius: 15 },
  promoCopy: { flex: 1, minWidth: 0 },
  promoTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  promoSub: { color: '#c5d0df', fontSize: 13, marginTop: 6 },
  promoLink: { color: C.blue },
  sourceLabel: { color: C.green, fontSize: 9, fontWeight: '900', marginTop: 7 },
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
  tokenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 11 },
  payLabel: { color: C.blue, fontSize: 16, fontWeight: '900' },
  receiveLabel: { color: C.green, fontSize: 16, fontWeight: '900' },
  balanceText: { color: C.muted, fontSize: 11, textAlign: 'right' },
  tokenBox: { minHeight: 108, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.panel2, padding: 13, flexDirection: 'row', alignItems: 'center' },
  tokenBoxCompact: { minHeight: 102, paddingHorizontal: 10 },
  assetSelector: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  assetBadge: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.17)' },
  assetBadgeText: { color: '#fff', fontWeight: '900' },
  tokenIdentity: { flex: 1, minWidth: 0, marginLeft: 11 },
  tokenSymbol: { color: '#fff', fontSize: 20, fontWeight: '900' },
  chevronSmall: { color: '#91a7c1' },
  tokenName: { color: C.muted, fontSize: 12, marginTop: 5 },
  tokenAmountWrap: { width: '46%', alignItems: 'flex-end' },
  amountInput: { width: '100%', color: '#fff', fontSize: 34, fontWeight: '900', textAlign: 'right', outlineStyle: 'none' } as any,
  amountInputCompact: { fontSize: 27 },
  receiveAmount: { width: '100%', color: '#fff', fontSize: 34, fontWeight: '900', textAlign: 'right' },
  receiveAmountCompact: { fontSize: 27 },
  tokenUsd: { color: C.muted, fontSize: 11, marginTop: 6, textAlign: 'right' },
  percentRow: { flexDirection: 'row', gap: 8, marginTop: 13 },
  percentButton: { flex: 1, minWidth: 0, minHeight: 42, borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.panel2, alignItems: 'center', justifyContent: 'center' },
  percentText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  maxText: { color: C.blue },
  spendableText: { color: C.muted, fontSize: 9, textAlign: 'right', marginTop: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  switchLine: { flex: 1, height: 1, backgroundColor: C.blue },
  switchButton: { width: 54, height: 54, borderRadius: 27, marginHorizontal: 15, borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(0,80,170,.55)', alignItems: 'center', justifyContent: 'center' },
  switchIcon: { color: '#31a6ff', fontSize: 28, fontWeight: '900' },
  rateBox: { minHeight: 76, marginTop: 14, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel2, padding: 13, flexDirection: 'row', alignItems: 'center' },
  rateCopy: { flex: 1, minWidth: 0 },
  rateText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  minimumText: { color: C.muted, fontSize: 10, marginTop: 6 },
  rateRight: { alignItems: 'flex-end', marginLeft: 9 },
  bestRate: { color: C.green, fontSize: 11, fontWeight: '900' },
  priceImpact: { color: C.muted, fontSize: 9, marginTop: 6 },
  detailPanel: { marginTop: 18, paddingHorizontal: 16 },
  detailRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center' },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  detailIcon: { color: C.blue, fontSize: 25, width: 44, textAlign: 'center' },
  detailLabel: { color: '#fff', fontSize: 14, flex: 1 },
  detailValue: { color: '#dbe4f0', fontSize: 11, textAlign: 'right', maxWidth: '45%' },
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
  swapButtonDisabled: { opacity: 0.45 },
  swapButtonIcon: { color: '#fff', fontSize: 30, fontWeight: '900' },
  swapButtonCopy: { flex: 1 },
  swapButtonTitle: { color: '#fff', fontSize: 19, fontWeight: '900' },
  swapButtonSub: { color: 'rgba(255,255,255,.78)', fontSize: 11, marginTop: 4 },
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
  trustShield: { color: C.green, fontSize: 19, marginRight: 8 },
  trustText: { color: C.muted, fontSize: 11, textAlign: 'center', lineHeight: 18 },
  trustLink: { color: C.blue },
});
