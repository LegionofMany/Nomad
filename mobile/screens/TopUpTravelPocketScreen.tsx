import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useNomadTravelTopUp } from '../nomad';
import type {
  NomadTravelTopUpAsset,
  NomadTravelTopUpDraftReceipt,
  NomadTravelTopUpMode,
  NomadTravelTopUpQuote,
} from '../nomad';
import { C, NomadGlyph, NomadPage, Panel, ProgressBar, useNomadLayout } from '../ui/NomadShell';

type Step = 1 | 2 | 3;

const assetVisuals: Record<string, { mark: string; color: string; name: string }> = {
  USDT: { mark: '₮', color: '#26a17b', name: 'Tether' },
  USDC: { mark: '$', color: '#2775ca', name: 'USD Coin' },
  BTC: { mark: '₿', color: '#ff9814', name: 'Bitcoin' },
  ETH: { mark: '♦', color: '#627eea', name: 'Ethereum' },
  DAI: { mark: 'D', color: '#f5ac25', name: 'Dai Stablecoin' },
  HBAR: { mark: 'H', color: '#6b42ff', name: 'Hedera' },
  XRP: { mark: '×', color: '#31353c', name: 'XRP' },
  XLM: { mark: 'S', color: '#1684ff', name: 'Stellar' },
  XDC: { mark: 'X', color: '#075c9e', name: 'XDC Network' },
  ADA: { mark: 'A', color: '#246bff', name: 'Cardano' },
  ALGO: { mark: 'A', color: '#2e72d8', name: 'Algorand' },
};

function visualFor(symbol: string) {
  return assetVisuals[symbol.toUpperCase()] ?? { mark: symbol.slice(0, 1), color: C.blue, name: symbol };
}

function standardizedNetwork(asset: NomadTravelTopUpAsset) {
  const network = (asset.network || '').trim();
  const symbol = asset.symbol.toUpperCase();
  if (symbol === 'USDT' && /tron|trc/i.test(network)) return 'TRC20';
  if (['USDC', 'DAI'].includes(symbol) && /ethereum|erc/i.test(network)) return 'ERC20';
  if (symbol === 'ETH') return 'Ethereum';
  if (symbol === 'BTC') return 'Bitcoin';
  if (symbol === 'HBAR') return 'Hedera';
  if (symbol === 'XRP') return 'XRPL';
  if (symbol === 'XLM') return 'Stellar';
  return network || 'Network unavailable';
}

function displaySymbol(asset: NomadTravelTopUpAsset) {
  const network = standardizedNetwork(asset);
  return ['TRC20', 'ERC20'].includes(network) ? `${asset.symbol} (${network})` : asset.symbol;
}

function sanitizeAmount(value: string) {
  const clean = value.replace(/[^0-9.]/g, '');
  const [whole, ...fractions] = clean.split('.');
  return fractions.length ? `${whole}.${fractions.join('').slice(0, 8)}` : whole;
}

function Header({ title, step, onBack }: { title: string; step: Step; onBack(): void }) {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text>
      </Pressable>
      <View style={styles.headerCenter}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.headerTitle, compact && styles.headerTitleCompact]}>{title}</Text>
        <Text style={styles.headerSubtitle}>Step {step} of 3</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Open help" onPress={() => navigation.navigate('Settings')} style={styles.helpButton}>
        <Text style={styles.helpLabel}>Help</Text>
        <Text style={styles.helpQuestion}>?</Text>
      </Pressable>
    </View>
  );
}

function Stepper({ step, complete }: { step: Step; complete: boolean }) {
  const { compact } = useNomadLayout();
  const items = [
    { number: 1 as const, label: 'Select Asset' },
    { number: 2 as const, label: 'Enter Amount' },
    { number: 3 as const, label: 'Review & Confirm' },
  ];
  return (
    <View style={styles.stepper}>
      {items.map((item, index) => {
        const done = item.number < step || (item.number === 3 && complete);
        const active = item.number === step && !done;
        return (
          <React.Fragment key={item.number}>
            <View style={[styles.stepItem, compact && styles.stepItemCompact]}>
              <View style={[styles.stepCircle, active && styles.stepCircleActive, done && styles.stepCircleDone]}>
                <Text style={[styles.stepNumber, (active || done) && styles.stepNumberActive]}>{done ? '✓' : item.number}</Text>
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive, done && styles.stepLabelDone]}>{item.label}</Text>
            </View>
            {index < items.length - 1 ? <View style={[styles.stepLine, item.number < step && styles.stepLineDone]} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function TravelPocketArtwork({ color = C.green, size = 94 }: { color?: string; size?: number }) {
  return (
    <Svg accessibilityLabel="Travel Pocket" width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="pocketGlow" x1="10" y1="10" x2="90" y2="90">
          <Stop stopColor={color} stopOpacity=".35" />
          <Stop offset="1" stopColor={color} stopOpacity=".04" />
        </LinearGradient>
      </Defs>
      <Path d="M17 42h66v43H17z" fill="url(#pocketGlow)" stroke={color} strokeWidth="3" strokeLinejoin="round" />
      <Path d="M28 42V28h18l7 8h20v6M23 24l11-6 15 8M74 26l9 5-8 6" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m39 62 29-13-8 25-8-9-13-3Z" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m52 65 8-8" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

function GlobeArtwork({ size = 70 }: { size?: number }) {
  return (
    <Svg accessibilityLabel="Active region" width={size} height={size} viewBox="0 0 72 72" fill="none">
      <Circle cx="36" cy="36" r="29" stroke={C.green} strokeWidth="3" />
      <Path d="M7 36h58M36 7v58M36 7c9 8 14 18 14 29S45 57 36 65C27 57 22 47 22 36S27 15 36 7Z" stroke={C.green} strokeWidth="2.4" strokeLinecap="round" />
      <Path d="M13 21h46M13 51h46" stroke={C.green} strokeWidth="2" strokeLinecap="round" opacity=".8" />
    </Svg>
  );
}

function TokenBadge({ symbol, size = 55 }: { symbol: string; size?: number }) {
  const visual = visualFor(symbol);
  if (symbol.toUpperCase() === 'ETH') {
    return (
      <View style={[styles.tokenBadge, { width: size, height: size, borderRadius: size / 2, backgroundColor: visual.color }]}>
        <Svg width={size * .58} height={size * .58} viewBox="0 0 40 40" fill="none">
          <Path d="M20 2 8 21l12 7 12-7L20 2Z" fill="#fff" opacity=".95" />
          <Path d="m8 24 12 14 12-14-12 7-12-7Z" fill="#fff" opacity=".68" />
        </Svg>
      </View>
    );
  }
  return (
    <View style={[styles.tokenBadge, { width: size, height: size, borderRadius: size / 2, backgroundColor: visual.color }]}>
      {symbol.toUpperCase() === 'USDC' ? <View style={[styles.usdcRing, { width: size * .72, height: size * .72, borderRadius: size * .36 }]} /> : null}
      <Text style={[styles.tokenMark, { fontSize: size * .44 }]}>{visual.mark}</Text>
      {symbol.toUpperCase() === 'DAI' ? <View style={[styles.daiLine, { width: size * .48 }]} /> : null}
    </View>
  );
}

function AssetRow({ asset, selected, last, compact, onPress }: { asset: NomadTravelTopUpAsset; selected: boolean; last: boolean; compact: boolean; onPress(): void }) {
  const visual = visualFor(asset.symbol);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${visual.name}`}
      disabled={!asset.quoteAvailable}
      onPress={onPress}
      style={({ pressed }) => [styles.assetRow, compact && styles.assetRowCompact, !last && styles.rowBorder, selected && styles.assetRowSelected, !asset.quoteAvailable && styles.disabled, pressed && styles.pressed]}
    >
      <TokenBadge symbol={asset.symbol} size={compact ? 45 : 55} />
      <View style={[styles.assetCopy, compact && styles.assetCopyCompact]}>
        <Text style={[styles.assetTitle, compact && styles.assetTitleCompact]}>{displaySymbol(asset)}</Text>
        <Text style={[styles.assetName, compact && styles.assetNameCompact]}>{visual.name}</Text>
      </View>
      <View style={[styles.assetNumbers, compact && styles.assetNumbersCompact]}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.assetBalance, compact && styles.assetBalanceCompact]}>{asset.balanceLabel}</Text>
        <Text style={[styles.assetValue, compact && styles.assetValueCompact]}>{asset.fiatValueLabel}</Text>
      </View>
      <Text style={[styles.assetArrow, compact && styles.assetArrowCompact, selected && styles.assetArrowSelected]}>{selected ? '✓' : asset.quoteAvailable ? '›' : '—'}</Text>
    </Pressable>
  );
}

function DetailRow({ label, value, color, last = false }: { label: string; value: string; color?: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, !last && styles.rowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const bottomItems = [
  { label: 'Home', route: 'Portfolio', kind: 'home' as const },
  { label: 'Wallets', route: 'Wallets', kind: 'wallet' as const },
  { label: 'Travel', route: 'TravelMode', kind: 'travel' as const },
  { label: 'Security', route: 'SecurityCenter', kind: 'security' as const },
  { label: 'More', route: 'Settings', kind: 'settings' as const },
];

function PageBottomNav() {
  const navigation = useNavigation<any>();
  const { compact, desktop } = useNomadLayout();
  if (desktop) return null;
  return (
    <View style={[styles.bottomNav, compact && styles.bottomNavCompact]}>
      {bottomItems.map((item) => {
        const active = item.label === 'Travel';
        return (
          <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={`Open ${item.label}`} onPress={() => navigation.navigate(item.route)} style={[styles.navItem, compact && styles.navItemCompact, active && styles.navItemActive]}>
            <NomadGlyph kind={item.kind} color={active ? C.green : C.muted} size={compact ? 21 : 25} />
            <Text style={[styles.navLabel, compact && styles.navLabelCompact, active && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TopUpTravelPocketScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { compact } = useNomadLayout();
  const mode: NomadTravelTopUpMode = route.params?.mode === 'wallet_transfer' ? 'wallet_transfer' : 'top_up';
  const preferredAssetSymbol = typeof route.params?.assetSymbol === 'string' ? route.params.assetSymbol : undefined;
  const { topUp, loading, error, refresh, createQuote, createWalletDraft, quoteSecondsRemaining } = useNomadTravelTopUp(mode, preferredAssetSymbol);

  const [step, setStep] = useState<Step>(1);
  const [selectedSymbol, setSelectedSymbol] = useState(preferredAssetSymbol?.toUpperCase() || '');
  const [amount, setAmount] = useState('');
  const [reviewQuote, setReviewQuote] = useState<NomadTravelTopUpQuote | null>(null);
  const [draftReceipt, setDraftReceipt] = useState<NomadTravelTopUpDraftReceipt | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!selectedSymbol && topUp.selectedAssetSymbol) setSelectedSymbol(topUp.selectedAssetSymbol);
  }, [selectedSymbol, topUp.selectedAssetSymbol]);

  useEffect(() => {
    setStep(1);
    setAmount('');
    setReviewQuote(null);
    setDraftReceipt(null);
    setFeedback('');
  }, [mode]);

  const selectedAsset = useMemo(() => topUp.assets.find((asset) => asset.symbol === selectedSymbol), [selectedSymbol, topUp.assets]);
  const numericAmount = Number(amount);
  const validAmount = Boolean(selectedAsset && selectedAsset.quoteAvailable && Number.isFinite(numericAmount) && numericAmount > 0 && numericAmount <= selectedAsset.balance);
  const quote = topUp.activeQuote ?? reviewQuote;
  const quoteExpired = Boolean(quote && !draftReceipt && quoteSecondsRemaining <= 0);
  const travel = topUp.travelPocket;
  const modeTitle = mode === 'wallet_transfer' ? 'Send to Travel Pocket' : 'Top Up Travel Pocket';
  const flowComplete = Boolean(draftReceipt && draftReceipt.walletDraftStatus !== 'failed');

  const chooseAsset = (asset: NomadTravelTopUpAsset) => {
    setSelectedSymbol(asset.symbol);
    setAmount('');
    setReviewQuote(null);
    setDraftReceipt(null);
    setFeedback('');
  };

  const continueToAmount = () => {
    if (!selectedAsset || !selectedAsset.quoteAvailable) return;
    setStep(2);
    setFeedback('');
  };

  const applyPercent = (percent: number) => {
    if (!selectedAsset) return;
    const decimals = ['BTC', 'ETH'].includes(selectedAsset.symbol) ? 8 : 6;
    setAmount((selectedAsset.balance * percent).toFixed(decimals).replace(/0+$/, '').replace(/\.$/, ''));
    setFeedback('');
  };

  const reviewFunding = async () => {
    if (!selectedAsset || !validAmount) {
      setFeedback('Enter an amount greater than zero and within the connected wallet balance.');
      return;
    }
    try {
      setFeedback('Creating a time-limited Travel Pocket funding preview…');
      const next = await createQuote(selectedAsset.symbol, amount);
      if (!next) throw new Error('The funding preview was not returned.');
      setReviewQuote(next);
      setDraftReceipt(null);
      setStep(3);
      setFeedback('Preview created. Network fees remain unavailable until wallet review.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to create the funding preview.');
    }
  };

  const requestWalletDraft = async () => {
    try {
      setFeedback('Requesting a reviewable draft from the wallet adapter…');
      const result = await createWalletDraft();
      if (!result.receipt) throw new Error('The wallet adapter did not return a draft receipt.');
      setDraftReceipt(result.receipt);
      setFeedback(result.result.status === 'failed'
        ? result.result.failure?.message || 'The wallet adapter rejected the funding draft.'
        : `Wallet draft recorded with status ${result.result.status}. The Travel Pocket balance has not changed.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to create the wallet-owned funding draft.');
    }
  };

  const goBack = () => {
    if (step === 3) {
      setDraftReceipt(null);
      setReviewQuote(null);
      setStep(2);
      setFeedback('Create a new preview after changing the amount.');
      return;
    }
    if (step === 2) {
      setStep(1);
      setFeedback('');
      return;
    }
    navigation.goBack();
  };

  return (
    <NomadPage maxWidth={850}>
      <Header title={modeTitle} step={step} onBack={goBack} />
      <View style={styles.headerRule} />
      <Stepper step={step} complete={flowComplete} />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel tone={topUp.frozen ? 'red' : 'green'} style={[styles.balancePanel, compact && styles.balancePanelCompact]}>
        <View style={styles.balanceIdentity}>
          <TravelPocketArtwork color={topUp.frozen ? C.red : C.green} size={compact ? 64 : 96} />
          <View style={[styles.balanceCopy, compact && styles.balanceCopyCompact]}>
            <Text style={[styles.balanceLabel, compact && styles.balanceLabelCompact, topUp.frozen && { color: C.red }]}>Travel Pocket Balance</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.balanceValue, compact && styles.balanceValueCompact]}>{travel.pocketBalanceFiat || 'Balance unavailable'}</Text>
            <Text style={[styles.balanceSub, compact && styles.balanceSubCompact]}>USD Value</Text>
          </View>
        </View>
        <View style={[styles.regionBlock, compact && styles.regionBlockCompact]}>
          <GlobeArtwork size={compact ? 46 : 72} />
          <View style={[styles.regionCopy, compact && styles.regionCopyCompact]}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.regionName, compact && styles.regionNameCompact]}>{travel.regionInput || 'Global'}</Text>
            <Text style={[styles.regionSub, compact && styles.regionSubCompact]}>Active Region</Text>
          </View>
        </View>
      </Panel>

      {topUp.frozen ? (
        <Panel tone="red" style={styles.freezePanel}>
          <View style={styles.freezeIcon}><Text style={styles.freezeMark}>!</Text></View>
          <View style={styles.freezeCopy}>
            <Text style={styles.freezeTitle}>Travel Pocket funding is frozen</Text>
            <Text style={styles.freezeText}>No quote or wallet draft can be created until Emergency Freeze is cleared.</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('EmergencyFreeze')} style={styles.freezeButton}><Text style={styles.freezeButtonText}>Review</Text></Pressable>
        </Panel>
      ) : null}

      {step === 1 ? (
        <>
          <Panel style={styles.assetPanel}>
            <Text style={styles.sectionTitle}>SELECT ASSET TO TOP UP</Text>
            <View style={styles.sectionRule} />
            {topUp.assets.length ? topUp.assets.map((asset, index) => (
              <AssetRow
                key={`${asset.symbol}-${asset.chainId || asset.network || index}`}
                asset={asset}
                selected={asset.symbol === selectedSymbol}
                last={index === topUp.assets.length - 1}
                compact={compact}
                onPress={() => chooseAsset(asset)}
              />
            )) : (
              <View style={styles.emptyState}>
                <NomadGlyph kind="wallet" color={C.yellow} size={48} />
                <Text style={styles.emptyTitle}>No funding assets available</Text>
                <Text style={styles.emptyText}>Connect or unlock the wallet to load its current asset snapshot. Demo balances are not substituted.</Text>
                <Pressable onPress={() => void refresh()} style={styles.refreshButton}><Text style={styles.refreshText}>Refresh Wallet Snapshot</Text></Pressable>
              </View>
            )}
          </Panel>

          <Panel style={styles.infoPanel}>
            <View style={styles.infoIcon}><Text style={styles.infoMark}>i</Text></View>
            <Text style={styles.infoText}>Choose an asset returned by your connected wallet. Nomad will prepare a local-value preview before requesting any wallet-owned funding draft.</Text>
          </Panel>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue to enter amount"
            disabled={!selectedAsset || !selectedAsset.quoteAvailable || loading || topUp.frozen}
            onPress={continueToAmount}
            style={[styles.continueButton, (!selectedAsset || !selectedAsset.quoteAvailable || loading || topUp.frozen) && styles.disabled]}
          >
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </>
      ) : null}

      {step === 2 && selectedAsset ? (
        <Panel style={styles.amountPanel}>
          <View style={styles.amountHeading}>
            <Text style={styles.sectionTitle}>ENTER TOP UP AMOUNT</Text>
            <Pressable onPress={() => setStep(1)} style={styles.changeButton}><Text style={styles.changeText}>Change Asset</Text></Pressable>
          </View>
          <View style={styles.sectionRule} />
          <View style={styles.selectedAssetCard}>
            <TokenBadge symbol={selectedAsset.symbol} size={64} />
            <View style={styles.selectedAssetCopy}>
              <Text style={styles.selectedAssetTitle}>{displaySymbol(selectedAsset)}</Text>
              <Text style={styles.selectedAssetSub}>{visualFor(selectedAsset.symbol).name} · Available {selectedAsset.balanceLabel}</Text>
            </View>
            <Text style={styles.selectedAssetValue}>{selectedAsset.fiatValueLabel}</Text>
          </View>

          <Text style={styles.inputLabel}>AMOUNT</Text>
          <View style={styles.amountInputRow}>
            <TextInput
              accessibilityLabel="Travel Pocket funding amount"
              keyboardType="decimal-pad"
              onChangeText={(value) => { setAmount(sanitizeAmount(value)); setFeedback(''); }}
              placeholder="0.00"
              placeholderTextColor="#718196"
              style={styles.amountInput}
              value={amount}
            />
            <Text style={styles.amountSymbol}>{selectedAsset.symbol}</Text>
          </View>
          <View style={styles.percentRow}>
            {[.25, .5, .75, 1].map((percent) => (
              <Pressable key={percent} onPress={() => applyPercent(percent)} style={styles.percentButton}>
                <Text style={styles.percentText}>{percent === 1 ? 'MAX' : `${percent * 100}%`}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.amountSummary}>
            <DetailRow label="Available Balance" value={selectedAsset.balanceLabel} />
            <DetailRow label="Wallet Snapshot Value" value={selectedAsset.fiatValueLabel} />
            <DetailRow label="Validation" value={validAmount ? 'READY FOR PREVIEW' : 'ENTER A VALID AMOUNT'} color={validAmount ? C.green : C.yellow} last />
          </View>
          <Pressable disabled={!validAmount || loading || topUp.frozen} onPress={() => void reviewFunding()} style={[styles.continueButton, (!validAmount || loading || topUp.frozen) && styles.disabled]}>
            <Text style={styles.continueText}>{loading ? 'Creating Preview…' : 'Review & Confirm'}</Text>
          </Pressable>
        </Panel>
      ) : null}

      {step === 3 && quote ? (
        <Panel style={styles.reviewPanel}>
          <View style={styles.reviewHeading}>
            <View>
              <Text style={styles.sectionTitle}>{draftReceipt ? 'WALLET DRAFT STATUS' : 'REVIEW TOP UP'}</Text>
              <Text style={styles.reviewSubtitle}>{draftReceipt ? 'The pocket balance remains unchanged until settlement.' : 'Preview only · wallet approval is required.'}</Text>
            </View>
            {!draftReceipt ? <Text style={[styles.timerBadge, quoteExpired && styles.timerExpired]}>{quoteExpired ? 'EXPIRED' : `${quoteSecondsRemaining}s`}</Text> : null}
          </View>
          <View style={styles.sectionRule} />
          <View style={styles.transferGraphic}>
            <View style={styles.transferAsset}>
              <TokenBadge symbol={quote.sourceAsset.symbol} size={70} />
              <Text style={styles.transferTitle}>{quote.amountAssetLabel}</Text>
              <Text style={styles.transferSub}>{quote.amountUsdLabel} snapshot</Text>
            </View>
            <Text style={styles.transferArrow}>→</Text>
            <View style={styles.transferAsset}>
              <TravelPocketArtwork size={72} />
              <Text style={styles.transferTitle}>{quote.estimatedLocalLabel}</Text>
              <Text style={styles.transferSub}>{quote.destinationStablecoin} preview</Text>
            </View>
          </View>
          <View style={styles.reviewDetails}>
            <DetailRow label="Funding Asset" value={`${quote.sourceAsset.symbol} · ${standardizedNetwork(quote.sourceAsset)}`} />
            <DetailRow label="Destination" value={`${quote.destinationRegion} · ${quote.destinationStablecoin}`} />
            <DetailRow label="FX Evidence" value={quote.exchangeRateSource === 'provider' ? 'CONNECTED PROVIDER' : 'LOCAL PREVIEW'} color={quote.exchangeRateSource === 'provider' ? C.green : C.yellow} />
            <DetailRow label="Network Fee" value="AT WALLET REVIEW" color={C.yellow} />
            <DetailRow label="Wallet Approval" value="REQUIRED" color={C.green} last />
          </View>

          {draftReceipt ? (
            <View style={styles.draftStatusCard}>
              <Text style={[styles.draftStatusTitle, { color: draftReceipt.walletDraftStatus === 'failed' ? C.red : C.green }]}>Draft {draftReceipt.walletDraftStatus.toUpperCase()}</Text>
              <Text style={styles.draftStatusText}>Signed: {draftReceipt.signed ? 'Yes' : 'No'} · Submitted: {draftReceipt.submitted ? 'Yes' : 'No'} · Broadcast: {draftReceipt.broadcasted ? 'Yes' : 'No'}</Text>
              <ProgressBar value={draftReceipt.broadcasted ? 100 : draftReceipt.submitted ? 75 : draftReceipt.signed ? 50 : 25} color={draftReceipt.walletDraftStatus === 'failed' ? C.red : C.green} height={7} />
            </View>
          ) : null}

          {quoteExpired && !draftReceipt ? (
            <Pressable disabled={loading} onPress={() => void reviewFunding()} style={[styles.continueButton, loading && styles.disabled]}><Text style={styles.continueText}>Refresh Preview</Text></Pressable>
          ) : draftReceipt ? (
            <Pressable onPress={() => navigation.navigate('TravelMode')} style={styles.continueButton}><Text style={styles.continueText}>Return to Travel Pocket</Text></Pressable>
          ) : topUp.walletSessionStatus === 'locked' || topUp.walletSessionStatus === 'expired' ? (
            <Pressable onPress={() => navigation.navigate('UnlockWallet')} style={styles.continueButton}><Text style={styles.continueText}>Unlock Wallet to Continue</Text></Pressable>
          ) : (
            <Pressable disabled={loading || quoteExpired || topUp.frozen || !topUp.canCreateDraft} onPress={() => void requestWalletDraft()} style={[styles.continueButton, (loading || quoteExpired || topUp.frozen || !topUp.canCreateDraft) && styles.disabled]}>
              <Text style={styles.continueText}>{loading ? 'Requesting Draft…' : 'Create Wallet-Owned Draft'}</Text>
            </Pressable>
          )}
        </Panel>
      ) : null}

      {feedback ? <Text style={[styles.feedback, /unable|failed|frozen|blocked|expired|rejected/i.test(feedback) && { color: C.yellow }]}>{feedback}</Text> : null}

      {step !== 1 ? (
        <Panel style={styles.boundaryPanel}>
          <View style={styles.boundaryIcon}><Text style={styles.boundaryIconText}>i</Text></View>
          <Text style={styles.boundaryText}>Nomad prepares a reviewable Travel Pocket intent. It does not custody, convert, sign, broadcast, or settle funds on this screen. Live fees appear only during wallet review.</Text>
        </Panel>
      ) : null}

      <PageBottomNav />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 80, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 43, minHeight: 56, alignItems: 'flex-start', justifyContent: 'center' },
  backArrow: { color: '#fff', fontSize: 49, lineHeight: 49, fontWeight: '200' },
  headerCenter: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 10 },
  headerTitle: { color: '#fff', fontSize: 30, fontWeight: '800', textAlign: 'center' },
  headerTitleCompact: { fontSize: 23 },
  headerSubtitle: { color: '#d5d9e1', fontSize: 17, marginTop: 4 },
  helpButton: { minWidth: 75, minHeight: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  helpLabel: { color: C.green, fontSize: 15 },
  helpQuestion: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: C.green, color: C.green, textAlign: 'center', lineHeight: 31, fontSize: 21, fontWeight: '700' },
  headerRule: { height: 1, backgroundColor: 'rgba(255,255,255,.12)', marginTop: 3 },
  stepper: { minHeight: 125, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 24, paddingHorizontal: 10 },
  stepItem: { width: 116, alignItems: 'center' },
  stepItemCompact: { width: 90 },
  stepCircle: { width: 43, height: 43, borderRadius: 22, borderWidth: 1.3, borderColor: '#586170', backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { borderColor: C.green, backgroundColor: C.green },
  stepCircleDone: { borderColor: C.green, backgroundColor: C.green },
  stepNumber: { color: '#d8dde6', fontSize: 17 },
  stepNumberActive: { color: '#001108', fontWeight: '900' },
  stepLabel: { color: '#d8dde6', fontSize: 11, lineHeight: 15, textAlign: 'center', marginTop: 10 },
  stepLabelActive: { color: C.green, fontWeight: '900' },
  stepLabelDone: { color: C.green },
  stepLine: { flex: 1, height: 1.5, backgroundColor: '#414a57', marginTop: 21 },
  stepLineDone: { backgroundColor: C.green },
  errorBanner: { minHeight: 48, marginBottom: 13, borderWidth: 1, borderColor: C.red, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  balancePanel: { minHeight: 174, padding: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 25, backgroundColor: 'rgba(1,28,22,.84)' },
  balancePanelCompact: { padding: 18, gap: 12 },
  balanceIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  balanceCopy: { flex: 1, minWidth: 0, marginLeft: 20 },
  balanceCopyCompact: { marginLeft: 10 },
  balanceLabel: { color: C.green, fontSize: 14, fontWeight: '800' },
  balanceLabelCompact: { fontSize: 10 },
  balanceValue: { color: '#fff', fontSize: 37, fontWeight: '500', marginTop: 6 },
  balanceValueCompact: { fontSize: 27, marginTop: 3 },
  balanceSub: { color: '#c7ccd5', fontSize: 15, marginTop: 5 },
  balanceSubCompact: { fontSize: 10, marginTop: 3 },
  regionBlock: { minWidth: 235, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  regionBlockCompact: { minWidth: 0, flexShrink: 1 },
  regionCopy: { minWidth: 0, marginLeft: 16 },
  regionCopyCompact: { marginLeft: 7 },
  regionName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  regionNameCompact: { fontSize: 13 },
  regionSub: { color: '#c7ccd5', fontSize: 13, marginTop: 5 },
  regionSubCompact: { fontSize: 9, marginTop: 3 },
  freezePanel: { minHeight: 86, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  freezeIcon: { width: 45, height: 45, borderRadius: 23, borderWidth: 1.5, borderColor: C.red, alignItems: 'center', justifyContent: 'center' },
  freezeMark: { color: C.red, fontSize: 23, fontWeight: '900' },
  freezeCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  freezeTitle: { color: C.red, fontSize: 13, fontWeight: '900' },
  freezeText: { color: '#f0dfe3', fontSize: 9, lineHeight: 14, marginTop: 4 },
  freezeButton: { borderWidth: 1, borderColor: C.red, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9, marginLeft: 10 },
  freezeButtonText: { color: C.red, fontSize: 9, fontWeight: '900' },
  assetPanel: { marginTop: 24, paddingHorizontal: 28, paddingTop: 25, paddingBottom: 11 },
  sectionTitle: { color: C.green, fontSize: 17, fontWeight: '900' },
  sectionRule: { height: 1, backgroundColor: 'rgba(255,255,255,.1)', marginTop: 15 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' },
  assetRow: { minHeight: 105, flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 8, borderLeftWidth: 2, borderLeftColor: 'transparent' },
  assetRowCompact: { minHeight: 83, paddingVertical: 10, paddingHorizontal: 3 },
  assetRowSelected: { borderLeftColor: C.green, backgroundColor: 'rgba(40,233,120,.045)' },
  assetCopy: { flex: 1, minWidth: 0, marginLeft: 20 },
  assetCopyCompact: { marginLeft: 10 },
  assetTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  assetTitleCompact: { fontSize: 12 },
  assetName: { color: '#d4d7de', fontSize: 14, marginTop: 6 },
  assetNameCompact: { fontSize: 9, marginTop: 3 },
  assetNumbers: { minWidth: 180, alignItems: 'flex-end', marginLeft: 10 },
  assetNumbersCompact: { minWidth: 105, marginLeft: 5 },
  assetBalance: { color: '#fff', fontSize: 15 },
  assetBalanceCompact: { fontSize: 10 },
  assetValue: { color: '#d4d7de', fontSize: 14, marginTop: 6 },
  assetValueCompact: { fontSize: 9, marginTop: 3 },
  assetArrow: { width: 34, color: C.green, fontSize: 39, lineHeight: 39, fontWeight: '300', textAlign: 'right', marginLeft: 9 },
  assetArrowCompact: { width: 21, fontSize: 29, lineHeight: 31, marginLeft: 4 },
  assetArrowSelected: { fontSize: 20, fontWeight: '900' },
  tokenBadge: { position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tokenMark: { zIndex: 2, color: '#fff', fontWeight: '900' },
  usdcRing: { position: 'absolute', borderWidth: 2.2, borderColor: '#fff' },
  daiLine: { position: 'absolute', bottom: 14, height: 2, backgroundColor: '#fff' },
  emptyState: { minHeight: 255, alignItems: 'center', justifyContent: 'center', padding: 22 },
  emptyTitle: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 13 },
  emptyText: { maxWidth: 470, color: C.muted, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  refreshButton: { minHeight: 44, marginTop: 15, borderWidth: 1, borderColor: C.green, borderRadius: 9, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  refreshText: { color: C.green, fontSize: 10, fontWeight: '900' },
  infoPanel: { minHeight: 127, marginTop: 25, padding: 27, flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 55, height: 55, borderRadius: 28, borderWidth: 2.5, borderColor: C.blue, alignItems: 'center', justifyContent: 'center', marginRight: 26 },
  infoMark: { color: C.blue, fontSize: 31, fontWeight: '700' },
  infoText: { flex: 1, color: '#d7dbe2', fontSize: 15, lineHeight: 25 },
  continueButton: { minHeight: 75, marginTop: 25, borderRadius: 13, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  continueText: { color: '#001108', fontSize: 21, fontWeight: '800' },
  amountPanel: { marginTop: 24, padding: 26 },
  amountHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  changeButton: { borderWidth: 1, borderColor: C.green, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8 },
  changeText: { color: C.green, fontSize: 9, fontWeight: '900' },
  selectedAssetCard: { minHeight: 90, marginTop: 18, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center' },
  selectedAssetCopy: { flex: 1, minWidth: 0, marginLeft: 14 },
  selectedAssetTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  selectedAssetSub: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  selectedAssetValue: { color: '#fff', fontSize: 13, marginLeft: 10 },
  inputLabel: { color: C.green, fontSize: 10, fontWeight: '900', marginTop: 22, marginBottom: 8 },
  amountInputRow: { minHeight: 92, borderWidth: 1.5, borderColor: C.green, borderRadius: 13, backgroundColor: C.panel2, paddingHorizontal: 19, flexDirection: 'row', alignItems: 'center' },
  amountInput: { flex: 1, minWidth: 0, color: '#fff', fontSize: 36, fontWeight: '700', outlineStyle: 'none' } as any,
  amountSymbol: { color: C.green, fontSize: 18, fontWeight: '900', marginLeft: 12 },
  percentRow: { flexDirection: 'row', gap: 9, marginTop: 13 },
  percentButton: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: C.border, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  percentText: { color: C.green, fontSize: 10, fontWeight: '900' },
  amountSummary: { marginTop: 18, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, paddingHorizontal: 13 },
  detailRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  detailLabel: { color: C.muted, fontSize: 11 },
  detailValue: { flex: 1, color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'right' },
  reviewPanel: { marginTop: 24, padding: 26 },
  reviewHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  reviewSubtitle: { color: C.muted, fontSize: 10, marginTop: 4 },
  timerBadge: { color: C.green, borderWidth: 1, borderColor: C.green, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, fontSize: 10, fontWeight: '900' },
  timerExpired: { color: C.red, borderColor: C.red },
  transferGraphic: { minHeight: 185, marginTop: 20, borderWidth: 1, borderColor: C.border, borderRadius: 13, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  transferAsset: { flex: 1, alignItems: 'center' },
  transferTitle: { color: '#fff', fontSize: 14, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  transferSub: { color: C.muted, fontSize: 9, textAlign: 'center', marginTop: 4 },
  transferArrow: { color: C.green, fontSize: 34, fontWeight: '700', marginHorizontal: 8 },
  reviewDetails: { marginTop: 18, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, paddingHorizontal: 13 },
  draftStatusCard: { marginTop: 18, borderWidth: 1, borderColor: C.green, borderRadius: 11, padding: 15 },
  draftStatusTitle: { fontSize: 13, fontWeight: '900' },
  draftStatusText: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 5, marginBottom: 12 },
  feedback: { color: C.green, fontSize: 10, lineHeight: 16, marginTop: 12, paddingHorizontal: 3 },
  boundaryPanel: { minHeight: 104, marginTop: 18, padding: 19, flexDirection: 'row', alignItems: 'center' },
  boundaryIcon: { width: 43, height: 43, borderRadius: 22, borderWidth: 2, borderColor: C.blue, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  boundaryIconText: { color: C.blue, fontSize: 23, fontWeight: '800' },
  boundaryText: { flex: 1, color: '#d4dce7', fontSize: 11, lineHeight: 18 },
  bottomNav: { minHeight: 82, marginTop: 28, borderWidth: 1, borderColor: C.border, borderRadius: 20, backgroundColor: 'rgba(3,13,25,.98)', padding: 6, flexDirection: 'row', alignItems: 'center' },
  bottomNavCompact: { minHeight: 60, borderRadius: 14, padding: 4 },
  navItem: { flex: 1, minHeight: 68, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  navItemCompact: { minHeight: 50, borderRadius: 10 },
  navItemActive: { backgroundColor: 'rgba(40,233,120,.08)' },
  navLabel: { color: C.muted, fontSize: 11, marginTop: 5 },
  navLabelCompact: { fontSize: 8, marginTop: 2 },
  navLabelActive: { color: C.green },
  pressed: { opacity: .74 },
  disabled: { opacity: .42 },
});
