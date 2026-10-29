import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useNomadPOSTransaction } from '../nomad';
import type {
  NomadPOSCheck,
  NomadPOSDraftReceipt,
  NomadPOSPaymentAsset,
  NomadPOSSource,
} from '../nomad';
import { C, NomadPage, Panel, useNomadLayout } from '../ui/NomadShell';

const tokenVisuals: Record<string, { mark: string; color: string; name: string }> = {
  BTC: { mark: '₿', color: '#ff9814', name: 'Bitcoin' },
  ETH: { mark: '♦', color: '#627eea', name: 'Ethereum' },
  HBAR: { mark: 'H', color: '#6b42ff', name: 'Hedera' },
  XRP: { mark: '×', color: '#31353c', name: 'XRP' },
  XLM: { mark: 'S', color: '#1684ff', name: 'Stellar' },
  XDC: { mark: 'X', color: '#075c9e', name: 'XDC Network' },
  USDC: { mark: '$', color: '#2775ca', name: 'USD Coin' },
  USDT: { mark: '₮', color: '#26a17b', name: 'Tether' },
  DAI: { mark: 'D', color: '#f5ac25', name: 'Dai Stablecoin' },
  ADA: { mark: 'A', color: '#246bff', name: 'Cardano' },
  ALGO: { mark: 'A', color: '#2e72d8', name: 'Algorand' },
};

function visualFor(symbol: string) {
  return tokenVisuals[symbol.toUpperCase()] ?? { mark: symbol.slice(0, 1), color: C.blue, name: symbol };
}

function formatDate(value?: string) {
  if (!value) return 'Not supplied';
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Time unavailable';
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function shortId(value?: string) {
  if (!value) return 'Unavailable';
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function checkAppearance(status?: NomadPOSCheck['status']) {
  if (status === 'pass') return { color: C.green, mark: '✓', label: 'Ready' };
  if (status === 'fail') return { color: C.red, mark: '×', label: 'Blocked' };
  if (status === 'warning') return { color: C.yellow, mark: '!', label: 'Review' };
  return { color: C.yellow, mark: '—', label: 'Unavailable' };
}

function Header({ onBack }: { onBack(): void }) {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text>
      </Pressable>
      <View style={styles.headerIcon}><Text style={styles.headerWaves}>)))</Text></View>
      <View style={styles.headerCopy}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.headerTitle, compact && styles.headerTitleCompact]}>Approve POS Transaction</Text>
        <Text style={styles.headerSubtitle}>Tap to Pay</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Cancel payment review" onPress={() => navigation.goBack()} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

function POSArtwork({ color, size }: { color: string; size: number }) {
  return (
    <View style={[styles.artCircle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg accessibilityLabel="Nomad POS terminal and phone" width={size * .78} height={size * .78} viewBox="0 0 120 120" fill="none">
        <Rect x="17" y="22" width="43" height="65" rx="6" stroke={color} strokeWidth="4" />
        <Rect x="25" y="31" width="27" height="17" rx="2" stroke={color} strokeWidth="3" />
        <Path d="M27 58h4m8 0h4m8 0h4M27 67h4m8 0h4m8 0h4M27 76h4m8 0h4m8 0h4" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <Rect x="73" y="45" width="25" height="48" rx="5" stroke={color} strokeWidth="4" transform="rotate(-8 73 45)" />
        <Path d="M69 39c7-7 18-8 26-2M65 31c12-12 29-13 42-3M13 43c-7 7-7 19 0 27M7 35c-12 12-12 31-1 43" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
        <Circle cx="87" cy="84" r="2" fill={color} />
      </Svg>
    </View>
  );
}

function TokenBadge({ symbol, size = 44 }: { symbol: string; size?: number }) {
  const visual = visualFor(symbol);
  return (
    <View style={[styles.tokenBadge, { width: size, height: size, borderRadius: size / 2, backgroundColor: visual.color }]}>
      <Text style={[styles.tokenMark, { fontSize: size * .46 }]}>{visual.mark}</Text>
    </View>
  );
}

function DetailRow({ label, value, sub, color, last = false, icon }: { label: string; value: string; sub?: string; color?: string; last?: boolean; icon?: React.ReactNode }) {
  return (
    <View style={[styles.detailRow, !last && styles.rowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueWrap}>
        <View style={styles.detailValueLine}>{icon}<Text numberOfLines={1} adjustsFontSizeToFit style={[styles.detailValue, color ? { color } : null]}>{value}</Text></View>
        {sub ? <Text numberOfLines={2} style={styles.detailSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function SecurityRow({ title, detail, check, last = false, symbol }: { title: string; detail: string; check?: NomadPOSCheck; last?: boolean; symbol: string }) {
  const appearance = checkAppearance(check?.status);
  return (
    <View style={[styles.securityRow, !last && styles.rowBorder]}>
      <View style={[styles.securityIcon, { borderColor: appearance.color }]}><Text style={[styles.securitySymbol, { color: appearance.color }]}>{symbol}</Text></View>
      <View style={styles.securityCopy}>
        <Text style={styles.securityTitle}>{title}</Text>
        <Text numberOfLines={2} style={styles.securityDetail}>{detail}</Text>
      </View>
      <Text style={[styles.securityStatus, { color: appearance.color }]}>{appearance.label}</Text>
      <View style={[styles.statusCircle, { borderColor: appearance.color }]}><Text style={[styles.statusMark, { color: appearance.color }]}>{appearance.mark}</Text></View>
    </View>
  );
}

function AssetRow({ item, selected, last, onPress }: { item: NomadPOSPaymentAsset; selected: boolean; last: boolean; onPress(): void }) {
  const visual = visualFor(item.symbol);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Pay with ${visual.name}`}
      disabled={!item.quoteAvailable}
      onPress={onPress}
      style={({ pressed }) => [styles.assetRow, !last && styles.rowBorder, selected && styles.assetSelected, !item.quoteAvailable && styles.disabled, pressed && styles.pressed]}
    >
      <TokenBadge symbol={item.symbol} size={46} />
      <View style={styles.assetCopy}>
        <Text style={styles.assetTitle}>{visual.name} ({item.symbol})</Text>
        <Text style={styles.assetSub}>{item.network || 'Network unavailable'}</Text>
      </View>
      <View style={styles.assetNumbers}>
        <Text numberOfLines={1} style={styles.assetBalance}>{item.balanceLabel}</Text>
        <Text style={styles.assetValue}>{item.fiatValueLabel}</Text>
      </View>
      <Text style={[styles.assetArrow, selected && styles.assetArrowSelected]}>{selected ? '✓' : '›'}</Text>
    </Pressable>
  );
}

function ReceiptPanel({ receipt }: { receipt: NomadPOSDraftReceipt }) {
  const failed = receipt.walletDraftStatus === 'failed';
  const color = failed ? C.red : C.green;
  return (
    <Panel tone={failed ? 'red' : 'green'} style={styles.receiptPanel}>
      <View style={[styles.receiptIcon, { borderColor: color }]}><Text style={[styles.receiptMark, { color }]}>{failed ? '!' : '✓'}</Text></View>
      <View style={styles.receiptCopy}>
        <Text style={[styles.receiptTitle, { color }]}>{failed ? 'Wallet Draft Failed' : 'Wallet Review Draft Created'}</Text>
        <Text style={styles.receiptText}>{receipt.amountAssetLabel} for {receipt.merchantName}. Payment and merchant settlement are still unconfirmed.</Text>
        <Text style={styles.receiptMeta}>Signed {receipt.signed ? 'yes' : 'no'} · Broadcast {receipt.broadcasted ? 'yes' : 'no'} · Completed no</Text>
      </View>
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
  const [receipt, setReceipt] = useState<NomadPOSDraftReceipt | null>(null);

  useEffect(() => {
    if (selectedSymbol) return;
    const next = pos.selectedAssetSymbol || pos.assets.find((item) => item.quoteAvailable)?.symbol;
    if (next) setSelectedSymbol(next);
  }, [pos.assets, pos.selectedAssetSymbol, selectedSymbol]);

  const requestMatchesInput = Boolean(rawRequest.trim() && parsedRaw === rawRequest);
  const request = requestMatchesInput ? pos.request : undefined;
  const checks = request ? pos.checks : [];
  const quote = request ? pos.activeQuote : undefined;
  const quoteExpired = Boolean(quote && quoteSecondsRemaining <= 0);
  const selectedAsset = useMemo(() => pos.assets.find((item) => item.symbol === selectedSymbol), [pos.assets, selectedSymbol]);
  const matchingReceipt = request ? pos.recentDrafts.find((item) => item.nonce === request.nonce) : undefined;
  const latestReceipt = receipt?.nonce === request?.nonce ? receipt : matchingReceipt ?? null;
  const failures = checks.filter((item) => item.status === 'fail');
  const locallyReady = Boolean(request && pos.requestValid && pos.limitsSatisfied && !pos.frozen && !pos.nonceUsed);
  const tint = pos.frozen || failures.length ? C.red : locallyReady ? C.green : C.blue;
  const merchantCheck = checks.find((item) => item.id === 'merchant_identity');
  const signatureCheck = checks.find((item) => item.id === 'request_signature');
  const timeCheck = checks.find((item) => item.id === 'request_expiry');
  const balanceCheck = checks.find((item) => item.id === 'spending_limits');
  const amountAfter = quote && selectedAsset ? Math.max(0, selectedAsset.balance - quote.amountAsset) : 0;
  const fiatAfter = quote && selectedAsset ? Math.max(0, selectedAsset.fiatValueUsd - quote.amountUsd) : 0;

  const handleParse = async () => {
    try {
      setFeedback('Checking the merchant request…');
      await parseRequest(rawRequest);
      setParsedRaw(rawRequest);
      setReceipt(null);
      setFeedback('Request loaded. Reqrium identity and NFC security remain unverified until their providers are connected.');
    } catch (nextError) {
      setParsedRaw('');
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to parse the merchant request.');
    }
  };

  const handleQuote = async () => {
    if (!selectedAsset || !request) return;
    try {
      setFeedback('Creating a 60-second wallet payment preview…');
      const next = await createQuote(rawRequest, selectedAsset.symbol);
      if (!next) throw new Error('The POS preview was not returned.');
      setReceipt(null);
      setFeedback('Preview ready. The wallet will calculate its network fee during signing review.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to create the payment preview.');
    }
  };

  const handleWalletDraft = async () => {
    try {
      setFeedback('Requesting a reviewable draft from the connected wallet…');
      const result = await createWalletDraft();
      if (!result.receipt) throw new Error('The wallet did not return a local POS draft receipt.');
      setReceipt(result.receipt);
      setFeedback(result.result.status === 'failed'
        ? result.result.failure?.message || 'The wallet rejected the POS draft.'
        : `Wallet draft status: ${result.result.status}. Payment and settlement are not confirmed.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to create the wallet-owned POS draft.');
    }
  };

  const startOver = () => {
    setRawRequest('');
    setParsedRaw('');
    setSelectedSymbol('');
    setReceipt(null);
    setFeedback('Enter or scan a new merchant request.');
  };

  const goBack = () => {
    if (request) {
      startOver();
      return;
    }
    navigation.goBack();
  };

  return (
    <NomadPage maxWidth={850}>
      <Header onBack={goBack} />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh(requestMatchesInput ? rawRequest : undefined)} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      {!request ? (
        <>
          <Panel style={styles.requestPanel}>
            <View style={styles.requestHeading}>
              <View style={styles.scanCircle}><Text style={styles.scanWaves}>)))</Text></View>
              <View style={styles.requestHeadingCopy}>
                <Text style={styles.sectionTitle}>LOAD MERCHANT POS REQUEST</Text>
                <Text style={styles.requestIntro}>Scan or paste a structured Nomad POS request before reviewing any payment.</Text>
              </View>
            </View>
            <TextInput
              accessibilityLabel="Merchant POS payment request"
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              onChangeText={(value) => { setRawRequest(value); setParsedRaw(''); setFeedback(''); }}
              placeholder="Paste nomadpos://pay…, JSON, or NOMADPOS request"
              placeholderTextColor="#718096"
              style={styles.requestInput}
              value={rawRequest}
            />
            <Text style={styles.requestHelp}>Never enter a seed phrase, private key, password, or Time Set. Merchant, terminal, amount, currency, expiry, and nonce are required.</Text>
            <Pressable disabled={loading || rawRequest.trim().length < 8} onPress={() => void handleParse()} style={[styles.greenButton, (loading || rawRequest.trim().length < 8) && styles.disabled]}>
              <Text style={styles.greenButtonText}>{loading ? 'Checking Request…' : 'Review Merchant Request'}</Text>
            </Pressable>
          </Panel>
          <Panel style={styles.infoPanel}><View style={styles.infoIcon}><Text style={styles.infoMark}>i</Text></View><Text style={styles.infoText}>Nomad validates the request locally. Reqrium merchant identity, NFC encryption, network fees, and settlement require connected production providers.</Text></Panel>
        </>
      ) : (
        <>
          <Panel tone={locallyReady ? 'green' : failures.length || pos.frozen ? 'red' : 'yellow'} style={[styles.hero, compact && styles.heroCompact]}>
            <POSArtwork color={tint} size={compact ? 108 : 138} />
            <View style={styles.heroCopy}>
              <View style={styles.connectionLine}><Text style={[styles.miniShield, { color: tint }]}>♢</Text><Text style={[styles.connectionText, { color: tint }]}>{locallyReady ? 'Local POS Checks Ready' : 'POS Request Requires Review'}</Text></View>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.merchantName, compact && styles.merchantNameCompact]}>{request.merchantName}</Text>
              <Text style={styles.terminalText}>POS Terminal · {request.terminalId}</Text>
              <View style={styles.locationLine}><Text style={styles.locationPin}>⌖</Text><Text numberOfLines={1} style={styles.locationText}>{request.region || pos.travelPocket.regionInput || 'Region not supplied'}</Text></View>
              <Text style={styles.requestTimer}>{requestSecondsRemaining}s request validity</Text>
            </View>
          </Panel>

          {!quote ? (
            <Panel style={styles.assetPanel}>
              <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>PAY WITH</Text><Text style={styles.localTotal}>{request.amountLocal.toLocaleString()} {request.currencyCode}</Text></View>
              <View style={styles.sectionRule} />
              {pos.assets.length ? pos.assets.map((item, index) => (
                <AssetRow key={`${item.symbol}-${item.accountId || index}`} item={item} selected={item.symbol === selectedSymbol} last={index === pos.assets.length - 1} onPress={() => { setSelectedSymbol(item.symbol); setReceipt(null); setFeedback(''); }} />
              )) : <Text style={styles.emptyText}>No wallet assets are available. Unlock or reconnect the wallet and refresh.</Text>}
              <Pressable disabled={loading || !selectedAsset || !pos.canCreateQuote} onPress={() => void handleQuote()} style={[styles.greenButton, (loading || !selectedAsset || !pos.canCreateQuote) && styles.disabled]}>
                <Text style={styles.greenButtonText}>{loading ? 'Creating Preview…' : 'Continue to Transaction Review'}</Text>
              </Pressable>
            </Panel>
          ) : (
            <Panel style={styles.transactionPanel}>
              <Text style={styles.sectionTitle}>TRANSACTION DETAILS</Text>
              <View style={styles.sectionRule} />
              <DetailRow label="Pay With" value={`${visualFor(quote.sourceAsset.symbol).name} (${quote.sourceAsset.symbol})`} icon={<TokenBadge symbol={quote.sourceAsset.symbol} size={38} />} />
              <DetailRow label="Amount" value={quote.amountAssetLabel} sub={`≈ ${quote.amountUsdLabel} wallet snapshot`} />
              <DetailRow label="To" value={request.merchantName} sub={`NOMAD POS ID: ${shortId(request.merchantId)}`} />
              <DetailRow label="Network Fee" value="At wallet review" sub={quote.networkFeeLabel} color={C.yellow} />
              <DetailRow label="Review Total" value={quote.amountAssetLabel} sub="Before wallet-calculated fee" color={C.green} last />
            </Panel>
          )}

          <Panel style={styles.securityPanel}>
            <Text style={styles.sectionTitle}>SECURITY CONFIRMATION</Text>
            <View style={styles.sectionRule} />
            <SecurityRow symbol="R" title="Reqrium Merchant Identity" detail="Remote merchant verification provider not connected" check={merchantCheck} />
            <SecurityRow symbol="⌁" title="Request Security" detail="Merchant signature and NFC encryption are not remotely verified" check={signatureCheck} />
            <SecurityRow symbol="◷" title="Transaction Window" detail={timeCheck?.detail || formatDate(request.expiresAt)} check={timeCheck} />
            <SecurityRow symbol="▰" title="Balance & Spending Limits" detail={quote && selectedAsset ? `${amountAfter.toLocaleString('en-US', { maximumFractionDigits: 8 })} ${selectedAsset.symbol} (≈ $${fiatAfter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) estimated after payment` : balanceCheck?.detail || 'Awaiting payment preview'} check={balanceCheck} last />
          </Panel>

          {failures.length || pos.frozen ? (
            <Panel tone="red" style={styles.warningPanel}><Text style={styles.warningIcon}>!</Text><Text style={styles.warningText}>{pos.frozen ? 'Emergency Freeze blocks this Travel Pocket payment.' : `This request is blocked: ${failures.map((item) => item.label).join(', ')}.`}</Text></Panel>
          ) : (
            <Panel tone="yellow" style={styles.warningPanel}><Text style={styles.warningIcon}>!</Text><Text style={styles.warningText}>Review the details carefully. A wallet draft is not proof of payment, broadcast, or merchant settlement.</Text></Panel>
          )}

          {latestReceipt ? <ReceiptPanel receipt={latestReceipt} /> : null}

          {quoteExpired && !latestReceipt ? (
            <Pressable disabled={loading} onPress={() => void handleQuote()} style={[styles.greenButton, loading && styles.disabled]}><Text style={styles.greenButtonText}>Refresh Payment Preview</Text></Pressable>
          ) : latestReceipt ? (
            <Pressable onPress={() => navigation.navigate('TravelMode')} style={styles.greenButton}><Text style={styles.greenButtonText}>Return to Travel Pocket</Text></Pressable>
          ) : pos.frozen ? (
            <Pressable onPress={() => navigation.navigate('EmergencyFreeze')} style={styles.greenButton}><Text style={styles.greenButtonText}>Review Emergency Freeze</Text></Pressable>
          ) : pos.walletSessionStatus !== 'unlocked' ? (
            <Pressable onPress={() => navigation.navigate('UnlockWallet')} style={styles.greenButton}><Text style={styles.greenButtonText}>Unlock Wallet to Continue</Text></Pressable>
          ) : quote ? (
            <View style={styles.approvalWrap}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hold to request wallet review draft"
                delayLongPress={700}
                disabled={loading || !pos.canCreateDraft || quoteExpired}
                onLongPress={() => void handleWalletDraft()}
                style={({ pressed }) => [styles.approvalControl, pressed && styles.pressed, (loading || !pos.canCreateDraft || quoteExpired) && styles.disabled]}
              >
                <View style={styles.approvalKnob}><Text style={styles.approvalArrow}>→</Text></View>
                <View style={styles.approvalCopy}><Text style={styles.approvalTitle}>{loading ? 'Requesting Wallet Draft…' : 'Hold for Wallet Review'}</Text><Text style={styles.approvalSub}>Creates a reviewable draft · does not send payment</Text></View>
              </Pressable>
              <Pressable disabled={loading || !pos.canCreateDraft || quoteExpired} onPress={() => void handleWalletDraft()} style={[styles.tapButton, (loading || !pos.canCreateDraft || quoteExpired) && styles.disabled]}><Text style={styles.tapText}>Or tap to create review draft</Text></Pressable>
            </View>
          ) : null}

          <View style={styles.secondaryRow}>
            <Pressable onPress={startOver} style={styles.secondaryButton}><Text style={styles.secondaryText}>New Merchant Request</Text></Pressable>
            <Pressable onPress={() => navigation.navigate('BlockPagesSafety')} style={styles.secondaryButton}><Text style={styles.secondaryText}>Open Reqrium Safety</Text></Pressable>
          </View>
        </>
      )}

      {feedback ? <Text style={[styles.feedback, /unable|failed|blocked|expired|unverified|rejected/i.test(feedback) && { color: C.yellow }]}>{feedback}</Text> : null}
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 104, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 43, minHeight: 58, alignItems: 'flex-start', justifyContent: 'center' },
  backArrow: { color: '#fff', fontSize: 49, lineHeight: 49, fontWeight: '200' },
  headerIcon: { width: 57, height: 57, borderRadius: 29, borderWidth: 2, borderColor: C.green, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  headerWaves: { color: C.green, fontSize: 16, fontWeight: '900', letterSpacing: -2 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  headerTitleCompact: { fontSize: 21 },
  headerSubtitle: { color: '#d7dbe3', fontSize: 16, marginTop: 5 },
  cancelButton: { minWidth: 70, minHeight: 48, alignItems: 'flex-end', justifyContent: 'center', marginLeft: 8 },
  cancelText: { color: C.green, fontSize: 17 },
  errorBanner: { minHeight: 52, marginBottom: 13, borderWidth: 1, borderColor: C.red, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { minHeight: 250, padding: 28, flexDirection: 'row', alignItems: 'center', gap: 34 },
  heroCompact: { padding: 18, gap: 17 },
  artCircle: { borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,13,17,.48)' },
  heroCopy: { flex: 1, minWidth: 0 },
  connectionLine: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  miniShield: { fontSize: 24, fontWeight: '900' },
  connectionText: { fontSize: 15, fontWeight: '700' },
  merchantName: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 17 },
  merchantNameCompact: { fontSize: 24, marginTop: 10 },
  terminalText: { color: '#eef1f5', fontSize: 18, marginTop: 8 },
  locationLine: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  locationPin: { color: '#c8cdd7', fontSize: 22, marginRight: 8 },
  locationText: { flex: 1, color: '#c8cdd7', fontSize: 14 },
  requestTimer: { color: C.muted, fontSize: 10, marginTop: 10 },
  sectionTitle: { color: C.green, fontSize: 15, fontWeight: '800' },
  sectionRule: { height: 1, backgroundColor: 'rgba(255,255,255,.12)', marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  localTotal: { color: '#fff', fontSize: 15, fontWeight: '700' },
  requestPanel: { padding: 24 },
  requestHeading: { flexDirection: 'row', alignItems: 'center' },
  scanCircle: { width: 63, height: 63, borderRadius: 32, borderWidth: 1.5, borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  scanWaves: { color: C.green, fontSize: 17, fontWeight: '900', letterSpacing: -2 },
  requestHeadingCopy: { flex: 1, minWidth: 0, marginLeft: 15 },
  requestIntro: { color: '#d6dbe4', fontSize: 11, lineHeight: 17, marginTop: 5 },
  requestInput: { minHeight: 140, marginTop: 20, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.panel2, color: '#fff', padding: 14, fontSize: 11, lineHeight: 18, textAlignVertical: 'top', outlineStyle: 'none' } as any,
  requestHelp: { color: C.yellow, fontSize: 9, lineHeight: 15, marginTop: 10 },
  assetPanel: { marginTop: 16, padding: 22 },
  assetRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  assetSelected: { backgroundColor: 'rgba(32,239,112,.05)' },
  tokenBadge: { alignItems: 'center', justifyContent: 'center' },
  tokenMark: { color: '#fff', fontWeight: '900' },
  assetCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  assetTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  assetSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  assetNumbers: { minWidth: 105, alignItems: 'flex-end', marginLeft: 7 },
  assetBalance: { color: '#fff', fontSize: 10, fontWeight: '700' },
  assetValue: { color: C.muted, fontSize: 9, marginTop: 4 },
  assetArrow: { width: 27, color: C.green, fontSize: 30, fontWeight: '300', textAlign: 'right', marginLeft: 6 },
  assetArrowSelected: { fontSize: 17, fontWeight: '900' },
  emptyText: { color: C.muted, fontSize: 10, lineHeight: 16, paddingVertical: 24, textAlign: 'center' },
  transactionPanel: { marginTop: 16, padding: 26 },
  detailRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  detailLabel: { width: 125, color: '#d0d5de', fontSize: 15 },
  detailValueWrap: { flex: 1, minWidth: 0, alignItems: 'flex-end' },
  detailValueLine: { maxWidth: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 11 },
  detailValue: { flexShrink: 1, color: '#fff', fontSize: 18, textAlign: 'right' },
  detailSub: { color: '#c4cad4', fontSize: 12, lineHeight: 17, textAlign: 'right', marginTop: 5 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.11)' },
  securityPanel: { marginTop: 16, padding: 26 },
  securityRow: { minHeight: 84, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  securityIcon: { width: 37, height: 37, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  securitySymbol: { fontSize: 15, fontWeight: '900' },
  securityCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  securityTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  securityDetail: { color: '#cbd1da', fontSize: 10, lineHeight: 15, marginTop: 4 },
  securityStatus: { width: 75, textAlign: 'right', fontSize: 11, fontWeight: '700', marginLeft: 8 },
  statusCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  statusMark: { fontSize: 14, fontWeight: '900' },
  warningPanel: { minHeight: 90, marginTop: 16, padding: 18, flexDirection: 'row', alignItems: 'center' },
  warningIcon: { color: C.yellow, fontSize: 31, fontWeight: '900', marginRight: 18 },
  warningText: { flex: 1, color: '#f5f0e8', fontSize: 12, lineHeight: 19 },
  greenButton: { minHeight: 66, marginTop: 18, borderRadius: 11, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  greenButtonText: { color: '#001008', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  approvalWrap: { marginTop: 18, alignItems: 'center' },
  approvalControl: { width: '100%', minHeight: 102, borderRadius: 52, backgroundColor: 'rgba(4,92,36,.88)', flexDirection: 'row', alignItems: 'center', padding: 9 },
  approvalKnob: { width: 82, height: 82, borderRadius: 41, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  approvalArrow: { color: '#001008', fontSize: 39, fontWeight: '500' },
  approvalCopy: { flex: 1, minWidth: 0, marginLeft: 19, paddingRight: 12 },
  approvalTitle: { color: '#fff', fontSize: 19, fontWeight: '700' },
  approvalSub: { color: '#d7f0df', fontSize: 11, lineHeight: 16, marginTop: 6 },
  tapButton: { minHeight: 45, justifyContent: 'center', paddingHorizontal: 18 },
  tapText: { color: C.green, fontSize: 12, fontWeight: '700' },
  secondaryRow: { flexDirection: 'row', gap: 11, marginTop: 16 },
  secondaryButton: { flex: 1, minHeight: 52, borderWidth: 1, borderColor: C.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  secondaryText: { color: C.blue, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  receiptPanel: { minHeight: 115, marginTop: 16, padding: 18, flexDirection: 'row', alignItems: 'center' },
  receiptIcon: { width: 57, height: 57, borderRadius: 29, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  receiptMark: { fontSize: 27, fontWeight: '900' },
  receiptCopy: { flex: 1, minWidth: 0, marginLeft: 15 },
  receiptTitle: { fontSize: 16, fontWeight: '900' },
  receiptText: { color: '#eef2f5', fontSize: 10, lineHeight: 16, marginTop: 5 },
  receiptMeta: { color: C.muted, fontSize: 9, marginTop: 6 },
  infoPanel: { minHeight: 100, marginTop: 16, padding: 17, flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 47, height: 47, borderRadius: 24, borderWidth: 2, borderColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  infoMark: { color: C.blue, fontSize: 23, fontWeight: '800' },
  infoText: { flex: 1, color: '#e5eaf0', fontSize: 11, lineHeight: 18, marginLeft: 16 },
  feedback: { color: C.green, fontSize: 10, lineHeight: 16, marginTop: 13, textAlign: 'center' },
  pressed: { opacity: .76 },
  disabled: { opacity: .42 },
});
