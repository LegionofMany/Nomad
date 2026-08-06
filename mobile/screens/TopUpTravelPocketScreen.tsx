import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useNomadTravelTopUp } from '../nomad';
import type {
  NomadTravelTopUpAsset,
  NomadTravelTopUpDraftReceipt,
  NomadTravelTopUpMode,
  NomadTravelTopUpQuote,
} from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  PrimaryButton,
  ProgressBar,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

type Step = 1 | 2 | 3;

const tokenVisuals: Record<string, { icon: string; color: string }> = {
  USDT: { icon: '₮', color: '#33d790' },
  USDC: { icon: '$', color: '#1684ff' },
  BTC: { icon: '₿', color: '#ff9900' },
  ETH: { icon: '◆', color: '#627eea' },
  DAI: { icon: 'D', color: '#f5ac25' },
  HBAR: { icon: 'H', color: '#6b42ff' },
  XRP: { icon: 'X', color: '#2c2f35' },
  XLM: { icon: 'S', color: '#187bff' },
  XDC: { icon: 'X', color: '#005ba8' },
  ADA: { icon: 'A', color: '#246bff' },
  ALGO: { icon: 'A', color: '#2e72d8' },
};

function visualFor(symbol: string) {
  return tokenVisuals[symbol.toUpperCase()] ?? { icon: symbol.slice(0, 1), color: C.blue };
}

function formatDate(value?: string) {
  if (!value) return 'Not recorded';
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Time unavailable';
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function sanitizeAmount(value: string) {
  const clean = value.replace(/[^0-9.]/g, '');
  const [whole, ...fractions] = clean.split('.');
  return fractions.length ? `${whole}.${fractions.join('').slice(0, 8)}` : whole;
}

function Stepper({ step, completed }: { step: Step; completed: boolean }) {
  const steps: Array<{ number: Step; label: string }> = [
    { number: 1, label: 'Select Asset' },
    { number: 2, label: 'Enter Amount' },
    { number: 3, label: completed ? 'Draft Created' : 'Review Draft' },
  ];

  return (
    <Panel style={styles.stepper}>
      {steps.map((item, index) => {
        const done = item.number < step || (item.number === 3 && completed);
        const active = item.number === step && !done;
        const color = done ? C.green : active ? C.blue : C.muted;
        return (
          <React.Fragment key={item.number}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, { borderColor: color }, done && styles.stepDone, active && styles.stepActive]}>
                <Text style={[styles.stepNumber, { color: done ? C.bg : color }]}>{done ? '✓' : item.number}</Text>
              </View>
              <Text style={[styles.stepLabel, { color }]}>{item.label}</Text>
            </View>
            {index < steps.length - 1 ? <View style={[styles.stepLine, done && styles.stepLineDone]} /> : null}
          </React.Fragment>
        );
      })}
    </Panel>
  );
}

function AssetRow({
  asset,
  selected,
  last,
  onPress,
}: {
  asset: NomadTravelTopUpAsset;
  selected: boolean;
  last?: boolean;
  onPress(): void;
}) {
  const visual = visualFor(asset.symbol);
  return (
    <Pressable
      disabled={!asset.quoteAvailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.assetRow,
        !last && styles.rowBorder,
        selected && styles.assetSelected,
        !asset.quoteAvailable && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.assetBadge, { backgroundColor: visual.color }]}>
        <Text style={styles.assetMark}>{visual.icon}</Text>
      </View>
      <View style={styles.assetCopy}>
        <Text style={styles.assetSymbol}>{asset.symbol}</Text>
        <Text numberOfLines={1} style={styles.assetName}>{asset.name} • {asset.network || 'Network unavailable'}</Text>
      </View>
      <View style={styles.assetNumbers}>
        <Text numberOfLines={1} style={styles.assetBalance}>{asset.balanceLabel}</Text>
        <Text style={styles.assetValue}>{asset.fiatValueLabel}</Text>
      </View>
      <Text style={[styles.assetStatus, { color: asset.quoteAvailable ? C.green : C.yellow }]}>
        {asset.quoteAvailable ? (selected ? '✓' : '›') : 'NO PRICE'}
      </Text>
    </Pressable>
  );
}

function DetailRow({
  label,
  value,
  color = '#fff',
  last,
}: {
  label: string;
  value: string;
  color?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.rowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
  );
}

function DraftRow({ item, last }: { item: NomadTravelTopUpDraftReceipt; last?: boolean }) {
  const color = item.walletDraftStatus === 'failed'
    ? C.red
    : item.broadcasted
      ? C.green
      : C.yellow;
  return (
    <View style={[styles.draftRow, !last && styles.rowBorder]}>
      <RoundIcon symbol={item.broadcasted ? '✓' : item.walletDraftStatus === 'failed' ? '!' : '▰'} color={color} size={42} filled />
      <View style={styles.draftCopy}>
        <Text style={styles.draftTitle}>{item.amountAssetLabel} • {item.sourceAsset}</Text>
        <Text style={styles.draftDetail}>{item.estimatedLocalLabel} preview • pocket balance unchanged</Text>
        <Text style={styles.draftTime}>{formatDate(item.createdAt)} • {item.mode.replace('_', ' ')}</Text>
      </View>
      <Text style={[styles.draftStatus, { color }]}>{item.walletDraftStatus.toUpperCase()}</Text>
    </View>
  );
}

export default function TopUpTravelPocketScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { compact } = useNomadLayout();
  const mode: NomadTravelTopUpMode = route.params?.mode === 'wallet_transfer' ? 'wallet_transfer' : 'top_up';
  const preferredAssetSymbol = typeof route.params?.assetSymbol === 'string' ? route.params.assetSymbol : undefined;
  const {
    topUp,
    loading,
    error,
    refresh,
    createQuote,
    createWalletDraft,
    quoteSecondsRemaining,
  } = useNomadTravelTopUp(mode, preferredAssetSymbol);

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

  const selectedAsset = useMemo(
    () => topUp.assets.find((asset) => asset.symbol === selectedSymbol),
    [selectedSymbol, topUp.assets],
  );
  const numericAmount = Number(amount);
  const validAmount = Boolean(
    selectedAsset
      && selectedAsset.quoteAvailable
      && Number.isFinite(numericAmount)
      && numericAmount > 0
      && numericAmount <= selectedAsset.balance,
  );
  const quote = topUp.activeQuote ?? reviewQuote;
  const quoteExpired = Boolean(quote && !draftReceipt && quoteSecondsRemaining <= 0);
  const travel = topUp.travelPocket;
  const dataPreview = travel.dataSource !== 'connected';
  const modeTitle = mode === 'wallet_transfer' ? 'Send to Travel Pocket' : 'Top Up Travel Pocket';
  const modeSubtitle = mode === 'wallet_transfer'
    ? 'Create a wallet transfer draft for your Travel Pocket'
    : 'Create a reviewable Travel Pocket funding draft';

  const chooseAsset = (asset: NomadTravelTopUpAsset) => {
    setSelectedSymbol(asset.symbol);
    setAmount('');
    setReviewQuote(null);
    setDraftReceipt(null);
    setFeedback('');
    setStep(2);
  };

  const applyPercent = (percent: number) => {
    if (!selectedAsset) return;
    const value = selectedAsset.balance * percent;
    const decimals = ['BTC', 'ETH'].includes(selectedAsset.symbol) ? 8 : 6;
    setAmount(value.toFixed(decimals).replace(/0+$/, '').replace(/\.$/, ''));
    setFeedback('');
  };

  const reviewFunding = async () => {
    if (!selectedAsset || !validAmount) {
      setFeedback('Enter an amount greater than zero and within the connected wallet balance.');
      return;
    }
    try {
      setFeedback('Calculating a time-limited Travel Pocket funding preview…');
      const next = await createQuote(selectedAsset.symbol, amount);
      if (!next) throw new Error('The funding preview was not returned by the adapter.');
      setReviewQuote(next);
      setDraftReceipt(null);
      setStep(3);
      setFeedback('Preview created. Network fees remain unavailable until wallet signing review.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to create the funding preview.');
    }
  };

  const requestWalletDraft = async () => {
    try {
      setFeedback('Requesting a reviewable draft from the connected wallet adapter…');
      const result = await createWalletDraft();
      if (!result.receipt) throw new Error('The wallet adapter did not return a local draft receipt.');
      setDraftReceipt(result.receipt);
      setFeedback(result.result.status === 'failed'
        ? result.result.failure?.message || 'The wallet adapter rejected the funding draft.'
        : `Wallet draft recorded with status ${result.result.status}. The Travel Pocket balance has not changed.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to create the wallet-owned funding draft.');
    }
  };

  const editFunding = () => {
    setDraftReceipt(null);
    setReviewQuote(null);
    setFeedback('Create a new preview after changing the amount.');
    setStep(2);
  };

  return (
    <NomadPage maxWidth={940}>
      <PageHeader title={modeTitle} subtitle={modeSubtitle} icon="＋" color={topUp.frozen ? C.red : C.green} help />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Stepper step={step} completed={Boolean(draftReceipt && draftReceipt.walletDraftStatus !== 'failed')} />

      <Panel tone={topUp.frozen ? 'red' : 'green'} style={[styles.balancePanel, compact && styles.balancePanelCompact]}>
        <View style={styles.balanceIdentity}>
          <RoundIcon symbol="▰" color={topUp.frozen ? C.red : C.green} size={compact ? 55 : 70} filled />
          <View style={styles.balanceCopy}>
            <Text style={styles.balanceEyebrow}>CURRENT TRAVEL POCKET</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.balanceMain}>
              {travel.pocketBalanceLocal || 'Balance unavailable'}
            </Text>
            <Text style={styles.balanceSub}>{travel.pocketBalanceFiat || 'USD value unavailable'} • balance changes only after confirmation</Text>
          </View>
        </View>
        <View style={styles.destinationCard}>
          <Text style={styles.destinationLabel}>DESTINATION</Text>
          <Text style={styles.destinationRegion}>{travel.regionInput || 'Global'}</Text>
          <Text style={styles.destinationCurrency}>{travel.localCurrency || travel.preferredStablecoin || 'USD Stable'}</Text>
          <Text style={[styles.sourceBadge, { color: dataPreview ? C.yellow : C.green, borderColor: dataPreview ? C.yellow : C.green }]}>
            {dataPreview ? 'PREVIEW FX' : 'CONNECTED FX'}
          </Text>
        </View>
      </Panel>

      {topUp.frozen ? (
        <Panel tone="red" style={styles.blockedPanel}>
          <RoundIcon symbol="!" color={C.red} size={48} filled />
          <View style={styles.blockedCopy}>
            <Text style={styles.blockedTitle}>Travel Pocket Funding Blocked</Text>
            <Text style={styles.blockedText}>Emergency Freeze is active for the wallet or Travel Pocket. No quote or wallet draft will be created.</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('EmergencyFreeze')} style={styles.blockedButton}><Text style={styles.blockedButtonText}>Review Freeze</Text></Pressable>
        </Panel>
      ) : null}

      <View style={[styles.metricRow, compact && styles.metricRowCompact]}>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>WALLET SESSION</Text>
          <Text style={[styles.metricStatus, { color: topUp.walletSessionStatus === 'unlocked' ? C.green : topUp.walletSessionStatus === 'unknown' ? C.yellow : C.red }]}>
            {topUp.walletSessionStatus.toUpperCase()}
          </Text>
          <Text style={styles.metricSub}>{topUp.walletSessionProviderConnected ? 'Session provider connected' : 'Session check unavailable'}</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>FUNDING ASSETS</Text>
          <Text style={[styles.metricValue, { color: topUp.assets.length ? C.blue : C.yellow }]}>{topUp.assets.length}</Text>
          <Text style={styles.metricSub}>Connected wallet snapshot</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>NETWORK FEE</Text>
          <Text style={[styles.metricStatus, { color: C.yellow }]}>AT WALLET REVIEW</Text>
          <Text style={styles.metricSub}>No live fee provider</Text>
        </Panel>
      </View>

      {step === 1 ? (
        <Panel style={styles.contentPanel}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>SELECT A WALLET ASSET</Text>
              <Text style={styles.sectionSub}>Only balances returned by the connected wallet adapter are listed</Text>
            </View>
            <Text style={styles.sectionCount}>{topUp.assets.length}</Text>
          </View>

          {topUp.assets.length ? topUp.assets.map((asset, index) => (
            <AssetRow
              key={`${asset.symbol}-${asset.chainId || asset.network || index}`}
              asset={asset}
              selected={asset.symbol === selectedSymbol}
              last={index === topUp.assets.length - 1}
              onPress={() => chooseAsset(asset)}
            />
          )) : (
            <View style={styles.emptyState}>
              <RoundIcon symbol="▣" color={C.yellow} size={56} filled />
              <Text style={styles.emptyTitle}>No Funding Assets Available</Text>
              <Text style={styles.emptyText}>Page 21 no longer uses invented fallback balances. Unlock or connect the wallet and refresh its asset snapshot.</Text>
              <Pressable onPress={() => void refresh()} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Refresh Wallet Snapshot</Text></Pressable>
            </View>
          )}
        </Panel>
      ) : null}

      {step === 2 && selectedAsset ? (
        <Panel style={styles.contentPanel}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>ENTER FUNDING AMOUNT</Text>
              <Text style={styles.sectionSub}>The amount is validated against the current wallet snapshot</Text>
            </View>
            <Pressable onPress={() => setStep(1)} style={styles.changeButton}><Text style={styles.changeText}>Change Asset</Text></Pressable>
          </View>

          <View style={styles.selectedAssetCard}>
            <View style={[styles.assetBadge, { backgroundColor: visualFor(selectedAsset.symbol).color }]}>
              <Text style={styles.assetMark}>{visualFor(selectedAsset.symbol).icon}</Text>
            </View>
            <View style={styles.selectedAssetCopy}>
              <Text style={styles.selectedAssetTitle}>{selectedAsset.symbol} • {selectedAsset.name}</Text>
              <Text style={styles.selectedAssetSub}>Available {selectedAsset.balanceLabel} • {selectedAsset.fiatValueLabel}</Text>
            </View>
          </View>

          <View style={styles.amountBox}>
            <TextInput
              accessibilityLabel="Travel Pocket funding amount"
              keyboardType="decimal-pad"
              onChangeText={(value) => {
                setAmount(sanitizeAmount(value));
                setFeedback('');
              }}
              placeholder="0.00"
              placeholderTextColor="#62748b"
              style={styles.amountInput}
              value={amount}
            />
            <Text style={styles.amountSymbol}>{selectedAsset.symbol}</Text>
          </View>

          <View style={styles.percentRow}>
            {[0.25, 0.5, 0.75, 1].map((percent) => (
              <Pressable key={percent} onPress={() => applyPercent(percent)} style={({ pressed }) => [styles.percentButton, pressed && styles.pressed]}>
                <Text style={styles.percentText}>{percent === 1 ? 'MAX' : `${percent * 100}%`}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.validationBox}>
            <DetailRow label="Entered Amount" value={amount ? `${amount} ${selectedAsset.symbol}` : 'Not entered'} />
            <DetailRow label="Available Balance" value={selectedAsset.balanceLabel} />
            <DetailRow label="Snapshot Unit Price" value={selectedAsset.unitPriceUsd > 0 ? `$${selectedAsset.unitPriceUsd.toLocaleString('en-US', { maximumFractionDigits: 6 })}` : 'Unavailable'} />
            <DetailRow label="Validation" value={validAmount ? 'READY FOR PREVIEW' : 'ENTER VALID AMOUNT'} color={validAmount ? C.green : C.yellow} last />
          </View>

          <PrimaryButton
            label={loading ? 'Calculating Preview…' : 'Review Funding Preview'}
            subtitle="Create a 90-second estimate before requesting a wallet draft"
            icon="›"
            disabled={!validAmount || loading || topUp.frozen}
            onPress={() => void reviewFunding()}
            tone="green"
          />
        </Panel>
      ) : null}

      {step === 3 && quote ? (
        <Panel style={styles.contentPanel}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>{draftReceipt ? 'WALLET DRAFT RECEIPT' : 'REVIEW FUNDING PREVIEW'}</Text>
              <Text style={styles.sectionSub}>{draftReceipt ? 'The pocket balance remains unchanged until confirmation' : 'This estimate is not an executable exchange rate'}</Text>
            </View>
            {!draftReceipt ? (
              <View style={[styles.countdownBadge, { borderColor: quoteExpired ? C.red : C.green }]}>
                <Text style={[styles.countdownText, { color: quoteExpired ? C.red : C.green }]}>{quoteExpired ? 'EXPIRED' : `${quoteSecondsRemaining}s`}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.transferGraphic}>
            <View style={styles.transferAsset}>
              <View style={[styles.largeAssetBadge, { backgroundColor: visualFor(quote.sourceAsset.symbol).color }]}><Text style={styles.largeAssetMark}>{visualFor(quote.sourceAsset.symbol).icon}</Text></View>
              <Text style={styles.transferAssetTitle}>{quote.amountAssetLabel}</Text>
              <Text style={styles.transferAssetSub}>{quote.amountUsdLabel} wallet snapshot</Text>
            </View>
            <Text style={styles.transferArrow}>→</Text>
            <View style={styles.transferAsset}>
              <RoundIcon symbol="▰" color={C.green} size={68} filled />
              <Text style={styles.transferAssetTitle}>{quote.estimatedLocalLabel}</Text>
              <Text style={styles.transferAssetSub}>{quote.destinationStablecoin} preview</Text>
            </View>
          </View>

          <View style={styles.reviewBox}>
            <DetailRow label="Funding Mode" value={quote.mode === 'wallet_transfer' ? 'Wallet Transfer' : 'Travel Pocket Top Up'} />
            <DetailRow label="Source Asset" value={`${quote.sourceAsset.symbol} • ${quote.sourceAsset.network || 'Network unavailable'}`} />
            <DetailRow label="Source Amount" value={quote.amountAssetLabel} />
            <DetailRow label="Snapshot USD Value" value={quote.amountUsdLabel} />
            <DetailRow label="Destination" value={`${quote.destinationRegion} • ${quote.destinationStablecoin}`} />
            <DetailRow label="Estimated Local Value" value={quote.estimatedLocalLabel} color={C.green} />
            <DetailRow label="FX Evidence" value={`${quote.exchangeRateSource.replace('_', ' ')} • ${quote.exchangeRate}`} color={quote.exchangeRateSource === 'provider' ? C.green : C.yellow} />
            <DetailRow label="Network Fee" value={quote.networkFeeLabel} color={C.yellow} />
            <DetailRow label="Wallet Approval" value="REQUIRED" color={C.green} />
            <DetailRow label="Pocket Balance Updated" value={draftReceipt?.pocketBalanceUpdated ? 'YES' : 'NO'} color={C.yellow} last />
          </View>

          <ProgressBar value={draftReceipt?.broadcasted ? 100 : draftReceipt?.submitted ? 75 : draftReceipt?.signed ? 50 : draftReceipt ? 25 : 0} color={draftReceipt?.broadcasted ? C.green : C.yellow} height={8} />

          {draftReceipt ? (
            <Panel tone={draftReceipt.walletDraftStatus === 'failed' ? 'red' : 'yellow'} style={styles.receiptPanel}>
              <RoundIcon symbol={draftReceipt.walletDraftStatus === 'failed' ? '!' : '▰'} color={draftReceipt.walletDraftStatus === 'failed' ? C.red : C.yellow} size={50} filled />
              <View style={styles.receiptCopy}>
                <Text style={styles.receiptTitle}>Wallet Status: {draftReceipt.walletDraftStatus.toUpperCase()}</Text>
                <Text style={styles.receiptText}>Signed: {draftReceipt.signed ? 'Yes' : 'No'} • Submitted: {draftReceipt.submitted ? 'Yes' : 'No'} • Broadcast: {draftReceipt.broadcasted ? 'Yes' : 'No'}</Text>
                <Text style={styles.receiptText}>Travel Pocket balance updated: No</Text>
              </View>
            </Panel>
          ) : null}

          {quoteExpired && !draftReceipt ? (
            <PrimaryButton
              label="Refresh Funding Preview"
              subtitle="Recalculate current wallet and local-currency values"
              icon="↻"
              disabled={loading}
              onPress={() => void reviewFunding()}
              tone="green"
            />
          ) : draftReceipt ? (
            <PrimaryButton
              label="Return to Travel Pocket"
              subtitle="The current balance remains unchanged until broadcast confirmation"
              icon="✈"
              onPress={() => navigation.navigate('TravelMode')}
              tone="green"
            />
          ) : topUp.walletSessionStatus === 'locked' || topUp.walletSessionStatus === 'expired' ? (
            <PrimaryButton
              label="Unlock Wallet to Continue"
              subtitle="Wallet verification is required before draft creation"
              icon="◷"
              onPress={() => navigation.navigate('UnlockWallet')}
              tone="green"
            />
          ) : (
            <PrimaryButton
              label={loading ? 'Requesting Wallet Draft…' : 'Create Wallet-Owned Draft'}
              subtitle="Nomad requests the draft; the wallet controls signing and broadcast"
              icon="▰"
              disabled={loading || quoteExpired || topUp.frozen || !topUp.canCreateDraft}
              onPress={() => void requestWalletDraft()}
              tone="green"
            />
          )}

          {!draftReceipt ? <Pressable onPress={editFunding} style={styles.editButton}><Text style={styles.editText}>‹ Edit asset or amount</Text></Pressable> : null}
        </Panel>
      ) : null}

      {feedback ? (
        <Text style={[styles.feedback, /unable|failed|blocked|expired|rejected/i.test(feedback) && { color: C.yellow }]}>{feedback}</Text>
      ) : null}

      <View style={[styles.infoColumns, compact && styles.infoColumnsCompact]}>
        <Panel style={styles.infoPanel}>
          <Text style={styles.sectionTitle}>FUNDING BOUNDARY</Text>
          <Text style={styles.infoText}>Page 21 calculates a wallet-snapshot preview and creates an internal Travel Pocket transaction intent. It does not custody, convert, sign or broadcast funds.</Text>
          <DetailRow label="Destination Type" value="Internal Travel Pocket intent" />
          <DetailRow label="Signing Provider" value="Connected wallet adapter" />
          <DetailRow label="Live Fee Provider" value="NOT CONNECTED" color={C.yellow} />
          <DetailRow label="Executable FX Provider" value="NOT CONNECTED" color={C.yellow} last />
        </Panel>

        <Panel style={styles.infoPanel}>
          <Text style={styles.sectionTitle}>DATA INTEGRITY</Text>
          <DetailRow label="Wallet Assets" value="Connected wallet snapshot" />
          <DetailRow label="Travel Currency" value={dataPreview ? 'Local preview' : 'Connected provider'} color={dataPreview ? C.yellow : C.green} />
          <DetailRow label="Storage" value="In-memory stub" color={C.yellow} />
          <DetailRow label="Checked" value={formatDate(topUp.checkedAt)} last />
        </Panel>
      </View>

      <Panel style={styles.draftsPanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>RECENT FUNDING DRAFTS</Text>
            <Text style={styles.sectionSub}>Local receipts do not prove signing, broadcast or Travel Pocket settlement</Text>
          </View>
          <Text style={styles.sectionCount}>{topUp.recentDrafts.length}</Text>
        </View>
        {topUp.recentDrafts.length ? topUp.recentDrafts.slice(0, 5).map((item, index) => (
          <DraftRow key={item.id} item={item} last={index === Math.min(5, topUp.recentDrafts.length) - 1} />
        )) : <Text style={styles.emptyDrafts}>No Travel Pocket funding drafts are recorded yet.</Text>}
      </Panel>

      <BottomNav active="Travel" items={[
        ['⌂', 'Home', 'Portfolio'],
        ['▣', 'Wallets', 'Wallets'],
        ['✈', 'Travel', 'TravelMode'],
        ['◇', 'Security', 'SecurityCenter'],
        ['•••', 'More', 'Settings'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  errorBanner: { minHeight: 48, marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  stepper: { minHeight: 90, padding: 13, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  stepItem: { width: 100, alignItems: 'center' },
  stepCircle: { width: 39, height: 39, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: C.green },
  stepActive: { backgroundColor: 'rgba(22,132,255,.12)' },
  stepNumber: { fontWeight: '900' },
  stepLabel: { fontSize: 9, fontWeight: '800', textAlign: 'center', marginTop: 7 },
  stepLine: { flex: 1, height: 1, backgroundColor: C.border, marginTop: 20 },
  stepLineDone: { backgroundColor: C.green },
  balancePanel: { minHeight: 176, marginTop: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18 },
  balancePanelCompact: { flexDirection: 'column', alignItems: 'stretch' },
  balanceIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  balanceCopy: { flex: 1, minWidth: 0, marginLeft: 14 },
  balanceEyebrow: { color: C.green, fontSize: 9, fontWeight: '900' },
  balanceMain: { color: '#fff', fontSize: 37, fontWeight: '900', marginTop: 5 },
  balanceSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 5 },
  destinationCard: { minWidth: 205, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: 'rgba(1,14,19,.5)', padding: 14 },
  destinationLabel: { color: C.muted, fontSize: 8, fontWeight: '900' },
  destinationRegion: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 6 },
  destinationCurrency: { color: C.green, fontSize: 10, marginTop: 4 },
  sourceBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, fontSize: 7, fontWeight: '900', marginTop: 10 },
  blockedPanel: { minHeight: 91, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  blockedCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  blockedTitle: { color: C.red, fontSize: 13, fontWeight: '900' },
  blockedText: { color: '#f4e7e9', fontSize: 9, lineHeight: 15, marginTop: 4 },
  blockedButton: { borderWidth: 1, borderColor: C.red, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, marginLeft: 10 },
  blockedButtonText: { color: C.red, fontSize: 9, fontWeight: '900' },
  metricRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  metricRowCompact: { flexDirection: 'column' },
  metricCard: { flex: 1, minHeight: 102, padding: 14 },
  metricLabel: { color: C.muted, fontSize: 8, fontWeight: '900' },
  metricValue: { fontSize: 28, fontWeight: '900', marginTop: 8 },
  metricStatus: { fontSize: 13, fontWeight: '900', marginTop: 11 },
  metricSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 5 },
  contentPanel: { marginTop: 16, padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  sectionCount: { color: C.blue, fontSize: 22, fontWeight: '900' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  assetRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  assetSelected: { backgroundColor: 'rgba(32,239,112,.04)' },
  assetBadge: { width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  assetMark: { color: '#fff', fontSize: 19, fontWeight: '900' },
  assetCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  assetSymbol: { color: '#fff', fontSize: 13, fontWeight: '900' },
  assetName: { color: C.muted, fontSize: 9, marginTop: 4 },
  assetNumbers: { minWidth: 130, alignItems: 'flex-end', marginLeft: 8 },
  assetBalance: { color: '#fff', fontSize: 10, fontWeight: '700' },
  assetValue: { color: C.muted, fontSize: 9, marginTop: 4 },
  assetStatus: { minWidth: 54, marginLeft: 10, fontSize: 9, fontWeight: '900', textAlign: 'right' },
  emptyState: { minHeight: 220, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 12 },
  emptyText: { color: C.muted, fontSize: 10, lineHeight: 16, textAlign: 'center', maxWidth: 460, marginTop: 7 },
  outlineButton: { minHeight: 42, marginTop: 14, borderWidth: 1, borderColor: C.green, borderRadius: 9, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  outlineButtonText: { color: C.green, fontSize: 10, fontWeight: '900' },
  changeButton: { borderWidth: 1, borderColor: C.green, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 8 },
  changeText: { color: C.green, fontSize: 9, fontWeight: '900' },
  selectedAssetCard: { minHeight: 76, marginTop: 16, borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 12, flexDirection: 'row', alignItems: 'center' },
  selectedAssetCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  selectedAssetTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  selectedAssetSub: { color: C.muted, fontSize: 9, marginTop: 5 },
  amountBox: { minHeight: 86, marginTop: 16, borderWidth: 1, borderColor: C.green, borderRadius: 12, backgroundColor: C.panel2, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  amountInput: { flex: 1, minWidth: 0, color: '#fff', fontSize: 32, fontWeight: '900', outlineStyle: 'none' } as any,
  amountSymbol: { color: C.green, fontSize: 16, fontWeight: '900', marginLeft: 12 },
  percentRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  percentButton: { flex: 1, minHeight: 40, borderWidth: 1, borderColor: C.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  percentText: { color: C.green, fontSize: 9, fontWeight: '900' },
  validationBox: { marginTop: 16, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 10, paddingHorizontal: 12 },
  detailRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  detailLabel: { color: C.muted, fontSize: 10 },
  detailValue: { flex: 1, color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'right' },
  countdownBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  countdownText: { fontSize: 10, fontWeight: '900' },
  transferGraphic: { minHeight: 164, marginTop: 16, borderWidth: 1, borderColor: C.border, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: 16 },
  transferAsset: { flex: 1, alignItems: 'center' },
  largeAssetBadge: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  largeAssetMark: { color: '#fff', fontSize: 28, fontWeight: '900' },
  transferAssetTitle: { color: '#fff', fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  transferAssetSub: { color: C.muted, fontSize: 8, textAlign: 'center', marginTop: 4 },
  transferArrow: { color: C.green, fontSize: 31, fontWeight: '900', marginHorizontal: 8 },
  reviewBox: { marginTop: 16, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 10, paddingHorizontal: 12 },
  receiptPanel: { minHeight: 86, marginTop: 16, padding: 13, flexDirection: 'row', alignItems: 'center' },
  receiptCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  receiptTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  receiptText: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  editButton: { alignSelf: 'center', padding: 13 },
  editText: { color: C.green, fontSize: 10, fontWeight: '800' },
  feedback: { color: C.green, fontSize: 10, lineHeight: 16, marginTop: 12 },
  infoColumns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  infoColumnsCompact: { flexDirection: 'column' },
  infoPanel: { flex: 1, padding: 16 },
  infoText: { color: '#eef3f7', fontSize: 9, lineHeight: 15, marginTop: 9, marginBottom: 8 },
  draftsPanel: { marginTop: 16, padding: 17 },
  draftRow: { minHeight: 76, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  draftCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  draftTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  draftDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  draftTime: { color: C.muted, fontSize: 7, marginTop: 4 },
  draftStatus: { fontSize: 8, fontWeight: '900', marginLeft: 8 },
  emptyDrafts: { color: C.muted, fontSize: 9, paddingVertical: 22, textAlign: 'center' },
  pressed: { opacity: .74 },
  disabled: { opacity: .45 },
});
