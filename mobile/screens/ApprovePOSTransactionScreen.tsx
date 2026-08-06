import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useNomadPOSTransaction } from '../nomad';
import type {
  NomadPOSCheck,
  NomadPOSDraftReceipt,
  NomadPOSPaymentAsset,
  NomadPOSSource,
} from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  PrimaryButton,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

const tokenVisuals: Record<string, { icon: string; color: string }> = {
  BTC: { icon: '₿', color: '#ff9900' },
  ETH: { icon: '◆', color: '#627eea' },
  HBAR: { icon: 'H', color: '#6b42ff' },
  XRP: { icon: 'X', color: '#2c2f35' },
  XLM: { icon: 'S', color: '#187bff' },
  XDC: { icon: 'X', color: '#005ba8' },
  USDC: { icon: '$', color: '#1684ff' },
  USDT: { icon: '₮', color: '#33d790' },
  DAI: { icon: 'D', color: '#f5ac25' },
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
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function checkInfo(status: NomadPOSCheck['status']) {
  if (status === 'pass') return { color: C.green, mark: '✓', label: 'PASS' };
  if (status === 'warning') return { color: C.yellow, mark: '!', label: 'REVIEW' };
  if (status === 'fail') return { color: C.red, mark: '×', label: 'FAIL' };
  return { color: C.muted, mark: '—', label: 'UNAVAILABLE' };
}

function DetailRow({ label, value, color = '#fff', last }: { label: string; value: string; color?: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, !last && styles.rowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
  );
}

function CheckRow({ item, last }: { item: NomadPOSCheck; last?: boolean }) {
  const info = checkInfo(item.status);
  return (
    <View style={[styles.checkRow, !last && styles.rowBorder]}>
      <View style={[styles.checkMark, { borderColor: info.color, backgroundColor: `${info.color}12` }]}>
        <Text style={[styles.checkMarkText, { color: info.color }]}>{info.mark}</Text>
      </View>
      <View style={styles.checkCopy}>
        <Text style={styles.checkTitle}>{item.label}</Text>
        <Text style={styles.checkDetail}>{item.detail}</Text>
        <Text style={styles.checkProvider}>Provider: {item.provider}</Text>
      </View>
      <Text style={[styles.checkStatus, { color: info.color }]}>{info.label}</Text>
    </View>
  );
}

function AssetRow({ item, selected, last, onPress }: { item: NomadPOSPaymentAsset; selected: boolean; last?: boolean; onPress(): void }) {
  const visual = visualFor(item.symbol);
  return (
    <Pressable
      disabled={!item.quoteAvailable}
      onPress={onPress}
      style={({ pressed }) => [styles.assetRow, !last && styles.rowBorder, selected && styles.assetSelected, !item.quoteAvailable && styles.disabled, pressed && styles.pressed]}
    >
      <View style={[styles.assetBadge, { backgroundColor: visual.color }]}><Text style={styles.assetMark}>{visual.icon}</Text></View>
      <View style={styles.assetCopy}>
        <Text style={styles.assetSymbol}>{item.symbol}</Text>
        <Text numberOfLines={1} style={styles.assetName}>{item.name} • {item.network || 'Network unavailable'}</Text>
      </View>
      <View style={styles.assetNumbers}>
        <Text numberOfLines={1} style={styles.assetBalance}>{item.balanceLabel}</Text>
        <Text style={styles.assetValue}>{item.fiatValueLabel}</Text>
      </View>
      <Text style={[styles.assetStatus, { color: item.quoteAvailable ? C.green : C.yellow }]}>{item.quoteAvailable ? (selected ? '✓' : '›') : 'NO PRICE'}</Text>
    </Pressable>
  );
}

function ReceiptPanel({ receipt }: { receipt: NomadPOSDraftReceipt }) {
  const failed = receipt.walletDraftStatus === 'failed';
  const color = failed ? C.red : receipt.broadcasted ? C.yellow : C.blue;
  return (
    <Panel tone={failed ? 'red' : 'yellow'} style={styles.receiptPanel}>
      <View style={styles.receiptHeader}>
        <RoundIcon symbol={failed ? '!' : '▰'} color={color} size={52} filled />
        <View style={styles.receiptCopy}>
          <Text style={[styles.receiptTitle, { color }]}>{failed ? 'Wallet Draft Failed' : 'Wallet Draft Recorded'}</Text>
          <Text style={styles.receiptText}>Wallet status: {receipt.walletDraftStatus}. Payment and merchant settlement remain unconfirmed.</Text>
        </View>
      </View>
      <DetailRow label="Merchant" value={receipt.merchantName} />
      <DetailRow label="Terminal" value={receipt.terminalId} />
      <DetailRow label="Local Total" value={receipt.localAmountLabel} />
      <DetailRow label="Source Amount" value={receipt.amountAssetLabel} />
      <DetailRow label="Signed" value={receipt.signed ? 'YES' : 'NO'} color={receipt.signed ? C.yellow : C.red} />
      <DetailRow label="Broadcast" value={receipt.broadcasted ? 'YES' : 'NO'} color={receipt.broadcasted ? C.yellow : C.red} />
      <DetailRow label="Payment Completed" value="NO" color={C.red} />
      <DetailRow label="Settlement Confirmed" value="NO" color={C.red} last />
    </Panel>
  );
}

export default function ApprovePOSTransactionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { compact } = useNomadLayout();
  const source: NomadPOSSource = route.params?.source === 'travel_qr'
    ? 'travel_qr'
    : route.params?.source === 'travel_pocket' ? 'travel_pocket' : 'manual';
  const initialPaymentRequest = typeof route.params?.paymentRequest === 'string' ? route.params.paymentRequest : undefined;
  const region = typeof route.params?.region === 'string' ? route.params.region : undefined;
  const preferredAssetSymbol = typeof route.params?.assetSymbol === 'string' ? route.params.assetSymbol : undefined;

  const {
    pos, loading, error, refresh, parseRequest, createQuote, createWalletDraft,
    quoteSecondsRemaining, requestSecondsRemaining,
  } = useNomadPOSTransaction(source, initialPaymentRequest, region, preferredAssetSymbol);

  const [rawRequest, setRawRequest] = useState(initialPaymentRequest || '');
  const [parsedRaw, setParsedRaw] = useState(initialPaymentRequest || '');
  const [selectedSymbol, setSelectedSymbol] = useState(preferredAssetSymbol?.toUpperCase() || '');
  const [feedback, setFeedback] = useState('');
  const [showRequestInput, setShowRequestInput] = useState(!initialPaymentRequest);
  const [showAllChecks, setShowAllChecks] = useState(true);
  const [receipt, setReceipt] = useState<NomadPOSDraftReceipt | null>(null);

  useEffect(() => {
    if (!selectedSymbol && pos.selectedAssetSymbol) setSelectedSymbol(pos.selectedAssetSymbol);
  }, [pos.selectedAssetSymbol, selectedSymbol]);

  const requestMatchesInput = Boolean(rawRequest.trim() && parsedRaw === rawRequest);
  const activeRequest = requestMatchesInput ? pos.request : undefined;
  const activeChecks = activeRequest ? pos.checks : [];
  const quote = activeRequest ? pos.activeQuote : undefined;
  const quoteExpired = Boolean(quote && quoteSecondsRemaining <= 0);
  const matchingReceipt = activeRequest
    ? pos.recentDrafts.find((item) => item.nonce === activeRequest.nonce)
    : undefined;
  const latestReceipt = receipt?.nonce === activeRequest?.nonce ? receipt : matchingReceipt ?? null;
  const selectedAsset = useMemo(() => pos.assets.find((item) => item.symbol === selectedSymbol), [pos.assets, selectedSymbol]);
  const visibleChecks = showAllChecks ? activeChecks : activeChecks.slice(0, 5);
  const requestProgress = activeChecks.length
    ? Math.round((activeChecks.filter((item) => item.status === 'pass').length / activeChecks.length) * 100)
    : 0;
  const hasFailure = activeChecks.some((item) => item.status === 'fail');
  const tint = pos.frozen || hasFailure ? C.red : activeRequest && pos.requestValid ? C.yellow : C.blue;
  const tone = pos.frozen || hasFailure ? 'red' as const : activeRequest && pos.requestValid ? 'yellow' as const : 'blue' as const;

  const handleParse = async () => {
    try {
      setFeedback('Parsing the merchant request and checking its local evidence…');
      await parseRequest(rawRequest);
      setParsedRaw(rawRequest);
      setReceipt(null);
      setShowRequestInput(false);
      setFeedback('Request parsed. Merchant identity and request signature remain unverified.');
    } catch (nextError) {
      setParsedRaw('');
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to parse the merchant request.');
    }
  };

  const handleQuote = async () => {
    if (!selectedAsset || !activeRequest) {
      setFeedback('Parse the request and choose a connected wallet asset before continuing.');
      return;
    }
    try {
      setFeedback('Calculating a 60-second POS payment preview…');
      const next = await createQuote(rawRequest, selectedAsset.symbol);
      if (!next) throw new Error('The POS adapter did not return a payment preview.');
      setReceipt(null);
      setFeedback('Preview created. Fees, merchant identity and settlement remain unavailable.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to create the POS payment preview.');
    }
  };

  const handleWalletDraft = async () => {
    try {
      setFeedback('Requesting a reviewable POS draft from the connected wallet…');
      const result = await createWalletDraft();
      if (!result.receipt) throw new Error('The wallet adapter did not return a local POS draft receipt.');
      setReceipt(result.receipt);
      setFeedback(result.result.status === 'failed'
        ? result.result.failure?.message || 'The wallet adapter rejected the POS draft.'
        : `Wallet draft status: ${result.result.status}. Payment and settlement are not confirmed.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to create the wallet-owned POS draft.');
    }
  };

  const editRequest = (value: string) => {
    setRawRequest(value);
    setParsedRaw('');
    setReceipt(null);
    setFeedback('');
  };

  const startOver = () => {
    setRawRequest('');
    setParsedRaw('');
    setSelectedSymbol('');
    setReceipt(null);
    setFeedback('Enter or scan a new merchant request.');
    setShowRequestInput(true);
  };

  return (
    <NomadPage maxWidth={960}>
      <PageHeader
        title="Approve POS Transaction"
        subtitle="Review a merchant request before wallet signing"
        icon=")))"
        color={tint}
        status={false}
        right={<Pressable onPress={() => navigation.goBack()} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh(requestMatchesInput ? rawRequest : undefined)} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel tone={tone} style={[styles.hero, compact && styles.heroCompact]}>
        <View style={[styles.posGraphic, { borderColor: tint }]}>
          <Text style={[styles.posMark, { color: tint }]}>▤</Text>
          <Text style={[styles.posWaves, { color: tint }]}>{')))'}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroEyebrow, { color: tint }]}>MERCHANT REQUEST • {source.replace('_', ' ').toUpperCase()}</Text>
          <Text style={styles.heroTitle}>{activeRequest?.merchantName || 'Merchant Request Required'}</Text>
          <Text style={styles.heroText}>{activeRequest
            ? `${activeRequest.amountLocal.toLocaleString()} ${activeRequest.currencyCode} • terminal ${activeRequest.terminalId}`
            : 'Scan or enter a supported Nomad POS request before reviewing a payment.'}</Text>
          <View style={styles.heroTags}>
            <Text style={[styles.heroTag, { borderColor: tint, color: tint }]}>{activeRequest && pos.requestValid ? 'LOCAL CHECKS VALID' : 'REVIEW REQUIRED'}</Text>
            <Text style={[styles.heroTag, { borderColor: C.red, color: C.red }]}>MERCHANT UNVERIFIED</Text>
            <Text style={[styles.heroTag, { borderColor: C.muted, color: C.muted }]}>SETTLEMENT OFFLINE</Text>
          </View>
        </View>
        <View style={styles.heroAmount}>
          <Text style={styles.heroAmountLabel}>LOCAL TOTAL</Text>
          <Text style={[styles.heroAmountValue, { color: tint }]}>{activeRequest ? `${activeRequest.amountLocal.toLocaleString()} ${activeRequest.currencyCode}` : '--'}</Text>
          <Text style={styles.heroAmountSub}>{activeRequest ? `${requestSecondsRemaining}s request validity` : 'No request loaded'}</Text>
        </View>
      </Panel>

      <View style={[styles.metricRow, compact && styles.metricRowCompact]}>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>TRAVEL MODE</Text>
          <Text style={[styles.metricStatus, { color: pos.travelPocket.enabled ? C.green : C.red }]}>{pos.travelPocket.enabled ? 'ACTIVE' : 'INACTIVE'}</Text>
          <Text style={styles.metricSub}>{pos.travelPocket.regionInput || 'Global'} • {pos.travelPocket.currencyCode || 'USD'}</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>WALLET SESSION</Text>
          <Text style={[styles.metricStatus, { color: pos.walletSessionStatus === 'unlocked' ? C.green : C.red }]}>{pos.walletSessionStatus.toUpperCase()}</Text>
          <Text style={styles.metricSub}>{pos.walletSessionProvider.replace(/_/g, ' ')}</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>LOCAL EVIDENCE</Text>
          <Text style={[styles.metricValue, { color: tint }]}>{requestProgress}%</Text>
          <Text style={styles.metricSub}>Unavailable providers do not count as pass</Text>
        </Panel>
      </View>

      <Panel style={styles.sectionPanel}>
        <Pressable onPress={() => setShowRequestInput((value) => !value)} style={styles.sectionHeading}>
          <View style={styles.sectionCopy}><Text style={styles.sectionTitle}>MERCHANT POS REQUEST</Text><Text style={styles.sectionSub}>JSON, nomadpos:// or NOMADPOS pipe format</Text></View>
          <Text style={styles.sectionToggle}>{showRequestInput ? 'Hide −' : 'Change +'}</Text>
        </Pressable>
        {showRequestInput ? (
          <>
            <TextInput
              accessibilityLabel="Merchant POS payment request"
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              onChangeText={editRequest}
              placeholder={'Paste nomadpos://pay?... or a structured JSON request'}
              placeholderTextColor="#718096"
              style={styles.requestInput}
              value={rawRequest}
            />
            <Text style={styles.requestHelp}>Never paste a seed phrase, private key, password or Time Set. Required fields: merchant, merchant ID, terminal ID, amount, currency, expiry and nonce.</Text>
            <PrimaryButton label={loading ? 'Checking Request…' : 'Parse Merchant Request'} subtitle="Validate structure, expiry, region, currency and replay status" icon="⌕" tone="blue" disabled={loading || rawRequest.trim().length < 8} onPress={() => void handleParse()} />
          </>
        ) : activeRequest ? (
          <View style={styles.summaryWrap}>
            <DetailRow label="Request ID" value={activeRequest.id} />
            <DetailRow label="Merchant ID" value={activeRequest.merchantId} />
            <DetailRow label="Terminal ID" value={activeRequest.terminalId} />
            <DetailRow label="Region" value={activeRequest.region || 'Not supplied'} />
            <DetailRow label="Expires" value={formatDate(activeRequest.expiresAt)} />
            <DetailRow label="Signature" value={activeRequest.signaturePresent ? 'PRESENT • UNVERIFIED' : 'NOT PRESENT'} color={C.yellow} />
            <DetailRow label="Contains Secrets" value="NO" color={C.green} last />
          </View>
        ) : null}
      </Panel>

      {activeRequest ? (
        <Panel style={styles.sectionPanel}>
          <Pressable onPress={() => setShowAllChecks((value) => !value)} style={styles.sectionHeading}>
            <View style={styles.sectionCopy}><Text style={styles.sectionTitle}>PAYMENT EVIDENCE</Text><Text style={styles.sectionSub}>Each safety and transaction boundary is evaluated independently</Text></View>
            <Text style={styles.sectionToggle}>{showAllChecks ? 'Show less −' : 'Show all +'}</Text>
          </Pressable>
          {visibleChecks.map((item, index) => <CheckRow key={item.id} item={item} last={index === visibleChecks.length - 1} />)}
        </Panel>
      ) : null}

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}><Text style={styles.sectionTitle}>PAYMENT ASSET</Text><Text style={styles.sectionSub}>Connected wallet snapshot only</Text></View>
          <Text style={styles.sectionCount}>{pos.assets.length}</Text>
        </View>
        {pos.assets.length ? pos.assets.map((item, index) => (
          <AssetRow key={`${item.symbol}-${item.accountId || index}`} item={item} selected={item.symbol === selectedSymbol} last={index === pos.assets.length - 1} onPress={() => { setSelectedSymbol(item.symbol); setReceipt(null); setFeedback(''); }} />
        )) : (
          <View style={styles.emptyState}><RoundIcon symbol="▣" color={C.yellow} size={54} filled /><Text style={styles.emptyTitle}>No Wallet Assets Available</Text><Text style={styles.emptyText}>Refresh or unlock the wallet before creating a POS preview.</Text></View>
        )}
      </Panel>

      {quote ? (
        <Panel tone={quoteExpired ? 'red' : 'yellow'} style={styles.sectionPanel}>
          <View style={styles.quoteHeader}>
            <View><Text style={[styles.quoteEyebrow, { color: quoteExpired ? C.red : C.yellow }]}>60-SECOND PAYMENT PREVIEW</Text><Text style={styles.quoteTitle}>{quoteExpired ? 'Preview Expired' : `${quoteSecondsRemaining}s remaining`}</Text></View>
            <Text style={[styles.quoteBadge, { color: quoteExpired ? C.red : C.yellow, borderColor: quoteExpired ? C.red : C.yellow }]}>{quote.exchangeRateSource === 'provider' ? 'PROVIDER FX' : 'PREVIEW FX'}</Text>
          </View>
          <DetailRow label="Merchant" value={quote.request.merchantName} />
          <DetailRow label="Local Total" value={quote.localAmountLabel} />
          <DetailRow label="USD Estimate" value={quote.amountUsdLabel} />
          <DetailRow label="Pay With" value={`${quote.sourceAsset.name} (${quote.sourceAsset.symbol})`} />
          <DetailRow label="Source Amount" value={quote.amountAssetLabel} color={C.yellow} />
          <DetailRow label="Network Fee" value={quote.networkFeeLabel} color={C.yellow} />
          <DetailRow label="Merchant Identity" value="UNVERIFIED" color={C.red} />
          <DetailRow label="Payment Completed" value="NO" color={C.red} last />
        </Panel>
      ) : null}

      {latestReceipt ? <ReceiptPanel receipt={latestReceipt} /> : null}

      {feedback ? (
        <Panel tone={/unable|failed|blocked|expired|exceeds|unverified/i.test(feedback) ? 'red' : 'yellow'} style={styles.feedbackPanel}>
          <Text style={styles.feedbackIcon}>!</Text><Text style={styles.feedbackText}>{feedback}</Text>
        </Panel>
      ) : null}

      {!quote || quoteExpired ? (
        <PrimaryButton label={loading ? 'Creating Preview…' : quoteExpired ? 'Create New Payment Preview' : 'Review POS Payment'} subtitle="Calculate a source-asset preview without signing or moving funds" icon="›" tone="green" disabled={loading || !activeRequest || !pos.canCreateQuote || !selectedAsset} onPress={() => void handleQuote()} />
      ) : latestReceipt ? (
        <PrimaryButton label="Return to Travel Pocket" subtitle="The local draft does not prove merchant payment or settlement" icon="✓" tone="green" onPress={() => navigation.navigate('TravelMode')} />
      ) : pos.frozen ? (
        <PrimaryButton label="Review Emergency Freeze" subtitle="Travel Pocket payments are blocked" icon="!" tone="green" onPress={() => navigation.navigate('EmergencyFreeze')} />
      ) : pos.walletSessionStatus !== 'unlocked' ? (
        <PrimaryButton label="Unlock Wallet to Continue" subtitle="An unlocked session is required for draft creation" icon="◷" tone="green" onPress={() => navigation.navigate('UnlockWallet')} />
      ) : (
        <View style={styles.approvalWrap}>
          <Pressable accessibilityRole="button" accessibilityLabel="Hold to create wallet review draft" delayLongPress={700} disabled={loading || !pos.canCreateDraft || quoteExpired} onLongPress={() => void handleWalletDraft()} style={({ pressed }) => [styles.approvalControl, pressed && styles.pressed, (loading || !pos.canCreateDraft || quoteExpired) && styles.disabled]}>
            <View style={styles.approvalKnob}><Text style={styles.approvalArrow}>→</Text></View>
            <View style={styles.approvalCopy}><Text style={styles.approvalTitle}>{loading ? 'Requesting Wallet Draft…' : 'Hold for Wallet Review Draft'}</Text><Text style={styles.approvalSub}>This does not approve, broadcast or settle the payment</Text></View>
          </Pressable>
          <Pressable disabled={loading || !pos.canCreateDraft || quoteExpired} onPress={() => void handleWalletDraft()} style={({ pressed }) => [styles.tapButton, pressed && styles.pressed, (loading || !pos.canCreateDraft || quoteExpired) && styles.disabled]}><Text style={styles.tapButtonText}>Create review draft without holding</Text></Pressable>
        </View>
      )}

      <View style={[styles.secondaryActions, compact && styles.secondaryActionsCompact]}>
        <Pressable onPress={startOver} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>New Merchant Request</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('BlockPagesSafety')} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Open Reqrium Safety</Text></Pressable>
      </View>

      <Panel style={styles.boundaryPanel}><RoundIcon symbol="i" color={C.blue} size={44} /><Text style={styles.boundaryText}>Page 22 validates request structure, local limits and wallet evidence. It cannot verify merchant ownership, NFC encryption, request signatures, network fees, transaction confirmation or merchant settlement until production providers are connected.</Text></Panel>
      <BottomNav active="Travel" fifth={['•••', 'More', 'Settings']} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  cancelButton: { paddingHorizontal: 10, paddingVertical: 8 },
  cancelText: { color: C.green, fontSize: 12, fontWeight: '900' },
  errorBanner: { minHeight: 60, marginBottom: 14, borderWidth: 1, borderColor: C.red, borderRadius: 11, backgroundColor: 'rgba(80,8,18,.42)', padding: 12, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 16 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 10 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { minHeight: 205, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 18 },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  posGraphic: { width: 126, height: 126, borderRadius: 63, borderWidth: 5, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  posMark: { fontSize: 47, fontWeight: '900' },
  posWaves: { position: 'absolute', right: 6, fontSize: 18, fontWeight: '900' },
  heroCopy: { flex: 1, minWidth: 0 },
  heroEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  heroTitle: { color: '#fff', fontSize: 25, fontWeight: '900', marginTop: 9 },
  heroText: { color: '#edf2f7', fontSize: 11, lineHeight: 18, marginTop: 8 },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  heroTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, fontSize: 7, fontWeight: '900' },
  heroAmount: { minWidth: 142, alignItems: 'flex-end' },
  heroAmountLabel: { color: C.muted, fontSize: 8 },
  heroAmountValue: { fontSize: 19, fontWeight: '900', marginTop: 7, textAlign: 'right' },
  heroAmountSub: { color: C.muted, fontSize: 8, marginTop: 6 },
  metricRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  metricRowCompact: { flexDirection: 'column' },
  metricCard: { flex: 1, minHeight: 102, padding: 14 },
  metricLabel: { color: C.muted, fontSize: 8, fontWeight: '900' },
  metricStatus: { fontSize: 14, fontWeight: '900', marginTop: 10 },
  metricValue: { fontSize: 25, fontWeight: '900', marginTop: 7 },
  metricSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 7 },
  sectionPanel: { marginTop: 16, padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  sectionToggle: { color: C.blue, fontSize: 9, fontWeight: '900' },
  sectionCount: { color: C.blue, fontSize: 20, fontWeight: '900' },
  requestInput: { minHeight: 145, marginTop: 15, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.panel2, color: '#fff', padding: 13, fontSize: 11, lineHeight: 18, textAlignVertical: 'top', outlineStyle: 'none' } as any,
  requestHelp: { color: C.yellow, fontSize: 9, lineHeight: 15, marginTop: 10 },
  summaryWrap: { marginTop: 10 },
  detailRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 9 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  detailLabel: { color: C.muted, fontSize: 10, flex: .8 },
  detailValue: { flex: 1.2, color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'right' },
  checkRow: { minHeight: 84, flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  checkMark: { width: 35, height: 35, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkMarkText: { fontSize: 15, fontWeight: '900' },
  checkCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  checkTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  checkDetail: { color: '#dce4ed', fontSize: 9, lineHeight: 14, marginTop: 4 },
  checkProvider: { color: C.muted, fontSize: 8, marginTop: 4 },
  checkStatus: { fontSize: 8, fontWeight: '900', marginLeft: 8 },
  assetRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  assetSelected: { backgroundColor: 'rgba(32,239,112,.045)' },
  assetBadge: { width: 47, height: 47, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  assetMark: { color: '#fff', fontSize: 20, fontWeight: '900' },
  assetCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  assetSymbol: { color: '#fff', fontSize: 13, fontWeight: '900' },
  assetName: { color: C.muted, fontSize: 9, marginTop: 4 },
  assetNumbers: { maxWidth: 180, alignItems: 'flex-end', marginLeft: 8 },
  assetBalance: { color: '#fff', fontSize: 10, fontWeight: '700' },
  assetValue: { color: C.muted, fontSize: 9, marginTop: 4 },
  assetStatus: { width: 58, fontSize: 8, fontWeight: '900', textAlign: 'right', marginLeft: 8 },
  emptyState: { minHeight: 140, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#fff', fontSize: 14, fontWeight: '900', marginTop: 12 },
  emptyText: { color: C.muted, fontSize: 9, marginTop: 7 },
  quoteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 },
  quoteEyebrow: { fontSize: 8, fontWeight: '900' },
  quoteTitle: { color: '#fff', fontSize: 19, fontWeight: '900', marginTop: 5 },
  quoteBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, fontSize: 8, fontWeight: '900' },
  receiptPanel: { marginTop: 16, padding: 17 },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  receiptCopy: { flex: 1, marginLeft: 12 },
  receiptTitle: { fontSize: 16, fontWeight: '900' },
  receiptText: { color: '#eef3f7', fontSize: 9, lineHeight: 15, marginTop: 5 },
  feedbackPanel: { minHeight: 72, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  feedbackIcon: { color: C.yellow, fontSize: 25, fontWeight: '900', marginRight: 12 },
  feedbackText: { flex: 1, color: '#fff0d9', fontSize: 10, lineHeight: 16 },
  approvalWrap: { marginTop: 18, alignItems: 'center' },
  approvalControl: { width: '100%', minHeight: 88, borderRadius: 44, backgroundColor: 'rgba(13,118,43,.72)', flexDirection: 'row', alignItems: 'center', padding: 8 },
  approvalKnob: { width: 70, height: 70, borderRadius: 35, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  approvalArrow: { color: C.bg, fontSize: 31, fontWeight: '900' },
  approvalCopy: { flex: 1, marginLeft: 15 },
  approvalTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  approvalSub: { color: '#d8f9e3', fontSize: 9, marginTop: 5 },
  tapButton: { minHeight: 43, marginTop: 10, justifyContent: 'center' },
  tapButtonText: { color: C.green, fontSize: 10, fontWeight: '900' },
  secondaryActions: { flexDirection: 'row', gap: 11, marginTop: 14 },
  secondaryActionsCompact: { flexDirection: 'column' },
  secondaryButton: { flex: 1, minHeight: 53, borderWidth: 1, borderColor: C.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: C.blue, fontSize: 10, fontWeight: '900' },
  boundaryPanel: { minHeight: 88, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  boundaryText: { flex: 1, color: '#edf2f7', fontSize: 9, lineHeight: 15, marginLeft: 12 },
  pressed: { opacity: .78 },
  disabled: { opacity: .42 },
});
