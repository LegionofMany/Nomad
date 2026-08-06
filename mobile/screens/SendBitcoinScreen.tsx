import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadSecurity, useNomadWallet } from '../nomad';
import { BottomNav, C, NomadPage, Panel, useNomadLayout } from '../ui/NomadShell';

type DraftStatus = 'idle' | 'creating' | 'created' | 'failed';
type FeeChoice = 'Economy' | 'Standard' | 'Priority';
type NetworkChoice = 'Bitcoin Mainnet' | 'Bitcoin Testnet';

type SavedAddress = {
  label: string;
  value: string;
  note: string;
};

const FALLBACK_BTC_PRICE = 61410;
const FALLBACK_BTC_BALANCE = 0.3567;

const feeOptions: Record<FeeChoice, { fee: number; speed: string; rate: string; caption: string }> = {
  Economy: { fee: 0.000012, speed: 'Slow', rate: '~1 sat/vB', caption: 'Lowest estimated fee' },
  Standard: { fee: 0.000028, speed: 'Standard', rate: '~3 sat/vB', caption: 'Balanced speed and cost' },
  Priority: { fee: 0.000062, speed: 'Fast', rate: '~7 sat/vB', caption: 'Priority network handling' },
};

const savedAddresses: SavedAddress[] = [
  {
    label: 'Primary Bitcoin Wallet',
    value: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    note: 'Saved address • review before sending',
  },
  {
    label: 'Nomad Travel Wallet',
    value: 'nomad.travel',
    note: 'Reqrium identity • resolves during wallet review',
  },
];

const svgUri = (viewBox: string, body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`)}`;

const secureShieldUri = svgUri(
  '0 0 54 62',
  `<path d="M27 3 49 13v17c0 16-9 27-22 34C14 57 5 46 5 30V13Z" fill="#021c18" stroke="#20ef70" stroke-width="3"/>
   <path d="m17 31 7 7 14-16" fill="none" stroke="#20ef70" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
);

const sendUri = svgUri(
  '0 0 72 72',
  `<defs><filter id="g"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
   <path d="M9 29 62 8 43 64 32 42 9 29Z" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round" filter="url(#g)"/>
   <path d="m32 42 14-17" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
);

const btcUri = svgUri(
  '0 0 64 64',
  `<circle cx="32" cy="32" r="30" fill="#ff9814"/>
   <path d="M39 16c8 2 9 12 3 16 9 3 8 16-2 19M22 15h14c10 0 11 14 1 16H22m0 0h16c11 0 11 17 0 17H22m7-37v42m8-42v42" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
);

function parseNumber(value?: string) {
  if (!value) return 0;
  const numeric = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function isReqriumIdentity(value: string) {
  return /^[a-z0-9][a-z0-9._-]{2,31}$/i.test(value.trim()) && !value.trim().includes(' ');
}

function isBitcoinAddress(value: string, network: NetworkChoice) {
  const address = value.trim();
  if (isReqriumIdentity(address) && !address.startsWith('bc1') && !address.startsWith('tb1')) return true;
  if (network === 'Bitcoin Mainnet') {
    return /^(bc1)[ac-hj-np-z02-9]{11,71}$/i.test(address) || /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  }
  return /^(tb1|bcrt1)[ac-hj-np-z02-9]{11,71}$/i.test(address) || /^[mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
}

function StepTitle({ number, title }: { number: number; title: string }) {
  return (
    <Text style={styles.stepTitle}>
      <Text style={styles.stepNumber}>{number}. </Text>
      {title}
    </Text>
  );
}

function SummaryRow({ label, value, sub, strong, last }: { label: string; value: string; sub?: string; strong?: boolean; last?: boolean }) {
  return (
    <View style={[styles.summaryRow, !last && styles.summaryBorder]}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <View style={styles.summaryRight}>
        <Text style={[styles.summaryValue, strong && styles.summaryTotal]}>{value}</Text>
        {sub ? <Text style={styles.summarySub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function BtcBadge({ size = 48 }: { size?: number }) {
  return <Image source={{ uri: btcUri }} resizeMode="contain" style={{ width: size, height: size }} />;
}

export default function SendBitcoinScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { assets, createTransaction, error: walletError } = useNomadWallet();
  const { security } = useNomadSecurity();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('0.001000');
  const [network, setNetwork] = useState<NetworkChoice>('Bitcoin Mainnet');
  const [feeChoice, setFeeChoice] = useState<FeeChoice>('Economy');
  const [savedAddressOpen, setSavedAddressOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle');
  const [feedback, setFeedback] = useState('');

  const btcAsset = useMemo(() => assets.find((asset) => asset.symbol.toUpperCase() === 'BTC'), [assets]);
  const availableBtc = parseNumber(btcAsset?.balance) || FALLBACK_BTC_BALANCE;
  const fiatValue = parseNumber(btcAsset?.fiatValueUsd);
  const derivedPrice = availableBtc > 0 && fiatValue > 0 ? fiatValue / availableBtc : FALLBACK_BTC_PRICE;
  const btcPrice = Number.isFinite(derivedPrice) && derivedPrice > 0 ? derivedPrice : FALLBACK_BTC_PRICE;

  const numericAmount = Number(amount);
  const fee = feeOptions[feeChoice].fee;
  const total = Number.isFinite(numericAmount) ? numericAmount + fee : fee;
  const amountUsd = Number.isFinite(numericAmount) ? numericAmount * btcPrice : 0;
  const feeUsd = fee * btcPrice;
  const totalUsd = total * btcPrice;
  const validRecipient = isBitcoinAddress(recipient, network);
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0 && total <= availableBtc;
  const canReview = validRecipient && validAmount && security.status !== 'frozen';

  const formatted = useMemo(() => ({
    amount: Number.isFinite(numericAmount) ? numericAmount.toFixed(6) : '0.000000',
    fee: fee.toFixed(6),
    total: total.toFixed(6),
  }), [fee, numericAmount, total]);

  const systemLabel = security.status === 'frozen' ? 'FROZEN' : security.status === 'warning' ? 'REVIEW' : 'SECURE';
  const systemColor = security.status === 'frozen' ? C.red : security.status === 'warning' ? C.yellow : C.green;

  const resetDraft = () => {
    setDraftStatus('idle');
    setFeedback('');
    setReviewOpen(false);
  };

  const chooseRecipient = (address: SavedAddress) => {
    setRecipient(address.value);
    setSavedAddressOpen(false);
    resetDraft();
  };

  const scanPreviewAddress = () => {
    setRecipient(network === 'Bitcoin Mainnet'
      ? 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
      : 'tb1qnomadpreview7f3a9c2b5d8e1ownercheck');
    setFeedback('Preview QR value inserted. A production build must use the device camera and verify the scanned network.');
    setDraftStatus('idle');
    setReviewOpen(false);
  };

  const useMaximum = () => {
    const maximum = Math.max(0, availableBtc - fee);
    setAmount(maximum.toFixed(6));
    resetDraft();
  };

  const openReview = () => {
    if (security.status === 'frozen') {
      setDraftStatus('failed');
      setFeedback('Transactions are disabled while Emergency Freeze is active.');
      return;
    }
    if (!validRecipient) {
      setDraftStatus('failed');
      setFeedback(`Enter a valid ${network === 'Bitcoin Mainnet' ? 'mainnet' : 'testnet'} Bitcoin address or Reqrium identity.`);
      return;
    }
    if (!validAmount) {
      setDraftStatus('failed');
      setFeedback('Enter an amount that remains within the available balance after the network fee.');
      return;
    }
    setDraftStatus('idle');
    setFeedback('Review the recipient, amount, network and fee before creating the wallet draft.');
    setReviewOpen(true);
  };

  const createDraft = async () => {
    if (!canReview) {
      openReview();
      return;
    }

    try {
      setDraftStatus('creating');
      setFeedback('Creating a non-custodial wallet draft…');
      const result = await createTransaction({
        fromAsset: 'BTC',
        toAddress: recipient.trim(),
        amount: formatted.amount,
        networkFee: formatted.fee,
        chainId: network === 'Bitcoin Testnet' ? 'bitcoin-testnet' : 'bitcoin-mainnet',
        intent: 'send',
        requiresUserApproval: true,
        createdBy: 'nomad_overlay',
      });

      if (result.status === 'failed') {
        setDraftStatus('failed');
        setFeedback(result.failure?.message || 'Unable to create the transaction draft.');
        return;
      }

      setDraftStatus('created');
      setFeedback('Draft created. Final signing and network broadcast remain inside the connected wallet.');
    } catch (error) {
      setDraftStatus('failed');
      setFeedback(error instanceof Error ? error.message : 'Unable to create the transaction draft.');
    }
  };

  return (
    <NomadPage maxWidth={900}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, compact && styles.titleCompact]}>Send Bitcoin</Text>
          <Text style={styles.subtitle}>Send BTC securely to any address</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`All systems ${systemLabel}`}
          onPress={() => navigation.navigate('SecurityCenter')}
          style={[styles.statusPill, compact && styles.statusPillCompact]}
        >
          <Image source={{ uri: secureShieldUri }} style={styles.statusShield} />
          {!compact ? (
            <View>
              <Text style={styles.statusTop}>All Systems</Text>
              <Text style={[styles.statusBottom, { color: systemColor }]}>{systemLabel}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {walletError ? <Text style={styles.error}>{walletError}</Text> : null}

      <Panel style={styles.sectionPanel}>
        <StepTitle number={1} title="Recipient" />
        <View style={styles.recipientBox}>
          <TextInput
            value={recipient}
            onChangeText={(value) => { setRecipient(value); resetDraft(); }}
            placeholder="Bitcoin address or Reqrium name"
            placeholderTextColor="#74869d"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.recipientInput}
          />
          <Pressable
            accessibilityLabel="Use a saved address"
            onPress={() => setSavedAddressOpen((value) => !value)}
            style={styles.inputAction}
          >
            <Text style={styles.addressBookIcon}>▣</Text>
          </Pressable>
          <Pressable accessibilityLabel="Scan a Bitcoin QR code" onPress={scanPreviewAddress} style={styles.inputAction}>
            <Text style={styles.scanIcon}>⌗</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setSavedAddressOpen((value) => !value)} style={styles.savedAddressHeader}>
          <View style={styles.savedIcon}><Text style={styles.savedIconText}>▣</Text></View>
          <View style={styles.savedCopy}>
            <Text style={styles.savedTitle}>My Addresses</Text>
            <Text style={styles.savedSub}>Choose from saved addresses</Text>
          </View>
          <Text style={styles.chevron}>{savedAddressOpen ? '⌃' : '›'}</Text>
        </Pressable>

        {savedAddressOpen ? (
          <View style={styles.menuPanel}>
            {savedAddresses.map((address) => (
              <Pressable key={address.value} onPress={() => chooseRecipient(address)} style={styles.savedOption}>
                <View style={styles.savedOptionMark}><Text style={styles.savedOptionMarkText}>✓</Text></View>
                <View style={styles.savedCopy}>
                  <Text style={styles.savedTitle}>{address.label}</Text>
                  <Text numberOfLines={1} style={styles.savedSub}>{address.value}</Text>
                  <Text style={styles.savedNote}>{address.note}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {recipient ? (
          <Text style={[styles.validationText, { color: validRecipient ? C.green : C.red }]}>
            {validRecipient ? 'Recipient format accepted for review.' : `This does not match the selected ${network === 'Bitcoin Mainnet' ? 'mainnet' : 'testnet'} format.`}
          </Text>
        ) : null}
      </Panel>

      <Panel style={styles.sectionPanel}>
        <StepTitle number={2} title="Amount" />
        <View style={[styles.amountBox, compact && styles.amountBoxCompact]}>
          <View style={styles.amountCopy}>
            <TextInput
              value={amount}
              onChangeText={(value) => { setAmount(value.replace(/[^0-9.]/g, '')); resetDraft(); }}
              keyboardType="decimal-pad"
              placeholder="0.000000"
              placeholderTextColor="#66798f"
              style={styles.amountInput}
            />
            <Text style={styles.amountUsd}>≈ ${amountUsd.toFixed(2)} USD</Text>
          </View>
          <Pressable onPress={() => setAssetOpen((value) => !value)} style={styles.assetSelector}>
            <BtcBadge size={42} />
            <Text style={styles.assetName}>BTC</Text>
            <Text style={styles.assetChevron}>{assetOpen ? '⌃' : '⌄'}</Text>
          </Pressable>
          <Pressable onPress={useMaximum} style={styles.maxButton}><Text style={styles.maxText}>MAX</Text></Pressable>
        </View>

        {assetOpen ? (
          <View style={styles.assetMenu}>
            <Pressable onPress={() => setAssetOpen(false)} style={styles.assetMenuRow}>
              <BtcBadge size={38} />
              <View style={styles.assetMenuCopy}><Text style={styles.savedTitle}>Bitcoin (BTC)</Text><Text style={styles.savedSub}>Selected for this Send Bitcoin screen</Text></View>
              <Text style={styles.greenCheck}>✓</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Wallets')} style={styles.assetMenuRow}>
              <View style={styles.otherAssetIcon}><Text style={styles.otherAssetText}>＋</Text></View>
              <View style={styles.assetMenuCopy}><Text style={styles.savedTitle}>Choose another asset</Text><Text style={styles.savedSub}>Return to Wallets to select another token</Text></View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.availableRow}>
          <Text style={styles.availableLabel}>Available Balance</Text>
          <Text style={styles.availableValue}>{availableBtc.toFixed(4)} BTC (${(availableBtc * btcPrice).toFixed(2)})</Text>
        </View>
        {!validAmount && amount ? <Text style={styles.warning}>Amount plus fee must remain within the available balance.</Text> : null}
      </Panel>

      <Panel style={styles.sectionPanel}>
        <StepTitle number={3} title="Network" />
        <Pressable onPress={() => setNetworkOpen((value) => !value)} style={styles.choiceRow}>
          <BtcBadge size={46} />
          <View style={styles.choiceCopy}>
            <View style={styles.choiceTitleRow}>
              <Text style={styles.choiceTitle}>{network === 'Bitcoin Mainnet' ? 'Bitcoin' : 'Bitcoin Testnet'}</Text>
              <View style={[styles.recommendedPill, network === 'Bitcoin Testnet' && styles.testPill]}>
                <Text style={[styles.recommendedText, network === 'Bitcoin Testnet' && styles.testText]}>{network === 'Bitcoin Mainnet' ? 'Recommended' : 'Testing'}</Text>
              </View>
            </View>
            <Text style={styles.choiceSub}>{network === 'Bitcoin Mainnet' ? 'Secure • Fast • Low Fee' : 'Testing only • no real-value transfer'}</Text>
          </View>
          <Text style={styles.rowChevron}>{networkOpen ? '⌃' : '⌄'}</Text>
        </Pressable>

        {networkOpen ? (
          <View style={styles.menuPanel}>
            {(['Bitcoin Mainnet', 'Bitcoin Testnet'] as NetworkChoice[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => { setNetwork(option); setNetworkOpen(false); resetDraft(); }}
                style={[styles.menuChoice, network === option && styles.menuChoiceActive]}
              >
                <Text style={styles.menuChoiceTitle}>{option}</Text>
                <Text style={styles.menuChoiceSub}>{option === 'Bitcoin Mainnet' ? 'Production Bitcoin network' : 'Preview and development only'}</Text>
                <Text style={[styles.menuChoiceCheck, network === option && { color: C.green }]}>{network === option ? '✓' : '○'}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </Panel>

      <Panel style={styles.sectionPanel}>
        <StepTitle number={4} title="Network Fee" />
        <Pressable onPress={() => setFeeOpen((value) => !value)} style={styles.choiceRow}>
          <View style={styles.lightningIcon}><Text style={styles.lightningText}>ϟ</Text></View>
          <View style={styles.choiceCopy}>
            <Text style={styles.choiceTitle}>{feeChoice} ({feeOptions[feeChoice].speed})</Text>
            <Text style={styles.choiceSub}>{feeOptions[feeChoice].rate} • {feeOptions[feeChoice].caption}</Text>
          </View>
          <View style={styles.feeTrailing}>
            <Text style={styles.feeValue}>{formatted.fee} BTC</Text>
            <Text style={styles.feeUsd}>≈ ${feeUsd.toFixed(2)} USD</Text>
          </View>
          <Text style={styles.rowChevron}>{feeOpen ? '⌃' : '⌄'}</Text>
        </Pressable>

        {feeOpen ? (
          <View style={styles.menuPanel}>
            {(Object.keys(feeOptions) as FeeChoice[]).map((choice) => {
              const option = feeOptions[choice];
              return (
                <Pressable
                  key={choice}
                  onPress={() => { setFeeChoice(choice); setFeeOpen(false); resetDraft(); }}
                  style={[styles.menuChoice, feeChoice === choice && styles.menuChoiceActive]}
                >
                  <Text style={styles.menuChoiceTitle}>{choice} • {option.speed}</Text>
                  <Text style={styles.menuChoiceSub}>{option.rate} • {option.fee.toFixed(6)} BTC • ${(option.fee * btcPrice).toFixed(2)}</Text>
                  <Text style={[styles.menuChoiceCheck, feeChoice === choice && { color: C.green }]}>{feeChoice === choice ? '✓' : '○'}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </Panel>

      <Panel style={styles.sectionPanel}>
        <StepTitle number={5} title="Summary" />
        <View style={styles.summaryBox}>
          <SummaryRow label="You are sending" value={`${formatted.amount} BTC`} sub={`≈ $${amountUsd.toFixed(2)} USD`} />
          <SummaryRow label="Network Fee" value={`${formatted.fee} BTC`} sub={`≈ $${feeUsd.toFixed(2)} USD`} />
          <SummaryRow label="Total" value={`${formatted.total} BTC`} sub={`≈ $${totalUsd.toFixed(2)} USD`} strong last />
        </View>
      </Panel>

      {feedback ? <Text style={[styles.feedback, draftStatus === 'failed' && { color: C.red }]}>{feedback}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Review Transaction"
        onPress={openReview}
        style={({ pressed }) => [styles.reviewButton, pressed && styles.pressed]}
      >
        <Image source={{ uri: sendUri }} style={styles.reviewIcon} />
        <View style={styles.reviewCopy}>
          <Text style={styles.reviewTitle}>Review Transaction</Text>
          <Text style={styles.reviewSub}>Review and confirm before sending</Text>
        </View>
        <Text style={styles.reviewChevron}>›</Text>
      </Pressable>

      {reviewOpen ? (
        <Panel style={styles.reviewPanel}>
          <View style={styles.reviewPanelHeader}>
            <View>
              <Text style={styles.reviewPanelEyebrow}>FINAL WALLET REVIEW</Text>
              <Text style={styles.reviewPanelTitle}>Confirm transaction draft</Text>
            </View>
            <Pressable onPress={() => setReviewOpen(false)}><Text style={styles.close}>×</Text></Pressable>
          </View>
          <View style={styles.reviewDetail}><Text style={styles.reviewDetailLabel}>Recipient</Text><Text numberOfLines={2} style={styles.reviewDetailValue}>{recipient}</Text></View>
          <View style={styles.reviewDetail}><Text style={styles.reviewDetailLabel}>Network</Text><Text style={styles.reviewDetailValue}>{network}</Text></View>
          <View style={styles.reviewDetail}><Text style={styles.reviewDetailLabel}>Amount</Text><Text style={styles.reviewDetailValue}>{formatted.amount} BTC</Text></View>
          <View style={styles.reviewDetail}><Text style={styles.reviewDetailLabel}>Fee</Text><Text style={styles.reviewDetailValue}>{formatted.fee} BTC</Text></View>
          <View style={[styles.reviewDetail, styles.reviewTotalRow]}><Text style={styles.reviewTotalLabel}>Total</Text><Text style={styles.reviewTotalValue}>{formatted.total} BTC</Text></View>
          <Text style={styles.reviewNotice}>Nomad remains non-custodial. This creates a reviewable draft; the connected wallet controls final signing and broadcast.</Text>
          <View style={styles.reviewActions}>
            <Pressable onPress={() => setReviewOpen(false)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Edit</Text></Pressable>
            <Pressable
              disabled={draftStatus === 'creating' || draftStatus === 'created'}
              onPress={() => void createDraft()}
              style={[styles.confirmButton, (draftStatus === 'creating' || draftStatus === 'created') && styles.disabled]}
            >
              <Text style={styles.confirmButtonText}>{draftStatus === 'creating' ? 'Creating…' : draftStatus === 'created' ? 'Draft Ready ✓' : 'Create Wallet Draft'}</Text>
            </Pressable>
          </View>
        </Panel>
      ) : null}

      <BottomNav active="Send" items={[
        ['⌂', 'Home', 'Portfolio'],
        ['▣', 'Wallets', 'Wallets'],
        ['➤', 'Send', 'SendBitcoin'],
        ['✈', 'Travel', 'TravelMode'],
        ['⚙', 'Settings', 'Settings'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 12 },
  backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 48, fontWeight: '300', lineHeight: 48 },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -0.7 },
  titleCompact: { fontSize: 27 },
  subtitle: { color: '#c5d0df', fontSize: 15, marginTop: 4 },
  statusPill: { minHeight: 64, minWidth: 190, borderWidth: 1, borderColor: '#0a426d', borderRadius: 32, backgroundColor: 'rgba(3,16,29,.97)', paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statusPillCompact: { minWidth: 58, width: 58, minHeight: 58, paddingHorizontal: 0 },
  statusShield: { width: 37, height: 43, marginRight: 10 },
  statusTop: { color: '#e9f1fb', fontSize: 13 },
  statusBottom: { fontSize: 14, fontWeight: '900', marginTop: 2 },
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  sectionPanel: { marginBottom: 13, padding: 17 },
  stepTitle: { color: C.blue, fontSize: 17, fontWeight: '900', marginBottom: 13 },
  stepNumber: { color: C.blue },
  recipientBox: { minHeight: 72, borderWidth: 1, borderColor: '#1b568a', borderRadius: 13, backgroundColor: '#04111f', flexDirection: 'row', alignItems: 'center', paddingLeft: 17 },
  recipientInput: { flex: 1, minWidth: 0, color: '#fff', fontSize: 15, outlineStyle: 'none' } as any,
  inputAction: { width: 58, height: 52, borderLeftWidth: 1, borderLeftColor: 'rgba(22,140,255,.13)', alignItems: 'center', justifyContent: 'center' },
  addressBookIcon: { color: C.blue, fontSize: 26 },
  scanIcon: { color: C.blue, fontSize: 29 },
  savedAddressHeader: { minHeight: 76, marginTop: 13, borderWidth: 1, borderColor: '#0a426d', borderRadius: 12, backgroundColor: '#03101d', padding: 12, flexDirection: 'row', alignItems: 'center' },
  savedIcon: { width: 46, height: 46, borderRadius: 11, borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(22,140,255,.09)', alignItems: 'center', justifyContent: 'center' },
  savedIconText: { color: C.blue, fontSize: 25 },
  savedCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  savedTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  savedSub: { color: C.muted, fontSize: 11, marginTop: 4 },
  savedNote: { color: C.green, fontSize: 9, marginTop: 4 },
  chevron: { color: '#b8c5d7', fontSize: 29 },
  menuPanel: { marginTop: 10, borderWidth: 1, borderColor: '#0a426d', borderRadius: 12, overflow: 'hidden', backgroundColor: '#020c16' },
  savedOption: { minHeight: 76, padding: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(22,140,255,.12)' },
  savedOptionMark: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(32,239,112,.11)', borderWidth: 1, borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  savedOptionMarkText: { color: C.green, fontWeight: '900' },
  validationText: { fontSize: 10, marginTop: 10 },
  amountBox: { minHeight: 111, borderWidth: 1, borderColor: '#1b568a', borderRadius: 13, backgroundColor: '#04111f', flexDirection: 'row', alignItems: 'center', padding: 15 },
  amountBoxCompact: { flexWrap: 'wrap' },
  amountCopy: { flex: 1, minWidth: 190 },
  amountInput: { color: '#fff', fontSize: 38, fontWeight: '500', outlineStyle: 'none' } as any,
  amountUsd: { color: C.muted, fontSize: 13, marginTop: 6 },
  assetSelector: { minHeight: 70, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#1b568a', paddingLeft: 16, marginLeft: 12 },
  assetName: { color: '#fff', fontSize: 20, fontWeight: '900', marginLeft: 9 },
  assetChevron: { color: '#9db4cf', fontSize: 22, marginLeft: 7 },
  maxButton: { minHeight: 45, borderWidth: 1, borderColor: C.blue, borderRadius: 8, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  maxText: { color: C.blue, fontSize: 13, fontWeight: '900' },
  assetMenu: { marginTop: 10, borderWidth: 1, borderColor: '#0a426d', borderRadius: 12, backgroundColor: '#020c16', overflow: 'hidden' },
  assetMenuRow: { minHeight: 70, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(22,140,255,.12)' },
  assetMenuCopy: { flex: 1, marginLeft: 12 },
  greenCheck: { color: C.green, fontSize: 21 },
  otherAssetIcon: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  otherAssetText: { color: C.blue, fontSize: 24 },
  availableRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 2 },
  availableLabel: { color: C.muted, fontSize: 13 },
  availableValue: { color: '#fff', fontSize: 13, textAlign: 'right' },
  warning: { color: C.yellow, fontSize: 10, marginTop: 3 },
  choiceRow: { minHeight: 91, borderWidth: 1, borderColor: '#1b568a', borderRadius: 13, padding: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#03101d' },
  choiceCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  choiceTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  choiceTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  choiceSub: { color: C.muted, fontSize: 12, marginTop: 5 },
  recommendedPill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: 'rgba(32,239,112,.12)', borderWidth: 1, borderColor: 'rgba(32,239,112,.25)' },
  recommendedText: { color: C.green, fontSize: 9, fontWeight: '900' },
  testPill: { backgroundColor: 'rgba(22,140,255,.12)', borderColor: 'rgba(22,140,255,.25)' },
  testText: { color: C.blue },
  rowChevron: { color: '#9db4cf', fontSize: 24, marginLeft: 10 },
  menuChoice: { minHeight: 68, padding: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(22,140,255,.12)', position: 'relative' },
  menuChoiceActive: { backgroundColor: 'rgba(32,239,112,.05)' },
  menuChoiceTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  menuChoiceSub: { color: C.muted, fontSize: 10, marginTop: 4, paddingRight: 34 },
  menuChoiceCheck: { position: 'absolute', right: 15, top: 22, color: '#596a80', fontSize: 18 },
  lightningIcon: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(22,140,255,.08)', alignItems: 'center', justifyContent: 'center' },
  lightningText: { color: C.blue, fontSize: 28, fontWeight: '900' },
  feeTrailing: { alignItems: 'flex-end', marginLeft: 12 },
  feeValue: { color: '#fff', fontSize: 15 },
  feeUsd: { color: C.muted, fontSize: 11, marginTop: 5 },
  summaryBox: { borderWidth: 1, borderColor: '#1b568a', borderRadius: 13, backgroundColor: '#03101d', paddingHorizontal: 16 },
  summaryRow: { minHeight: 87, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  summaryBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(22,140,255,.15)' },
  summaryLabel: { color: C.muted, fontSize: 14 },
  summaryStrong: { color: '#fff', fontWeight: '900' },
  summaryRight: { alignItems: 'flex-end', flexShrink: 1 },
  summaryValue: { color: '#fff', fontSize: 18, textAlign: 'right' },
  summaryTotal: { fontSize: 23, fontWeight: '900' },
  summarySub: { color: C.muted, fontSize: 12, marginTop: 5 },
  feedback: { color: C.green, fontSize: 11, lineHeight: 17, marginBottom: 11 },
  reviewButton: { minHeight: 112, borderRadius: 18, backgroundColor: '#0b59f0', paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', marginBottom: 15, ...Platform.select({ web: { boxShadow: '0 18px 45px rgba(11,89,240,.24)' } as any, default: {} }) },
  reviewIcon: { width: 58, height: 58, marginRight: 17 },
  reviewCopy: { flex: 1 },
  reviewTitle: { color: '#fff', fontSize: 21, fontWeight: '900' },
  reviewSub: { color: '#dce8ff', fontSize: 13, marginTop: 5 },
  reviewChevron: { color: '#fff', fontSize: 42, fontWeight: '300' },
  reviewPanel: { marginBottom: 15, padding: 19, borderColor: C.blue },
  reviewPanelHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 13 },
  reviewPanelEyebrow: { color: C.blue, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  reviewPanelTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 5 },
  close: { color: '#aebbd0', fontSize: 31 },
  reviewDetail: { minHeight: 55, borderBottomWidth: 1, borderBottomColor: 'rgba(22,140,255,.15)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  reviewDetailLabel: { color: C.muted, fontSize: 12 },
  reviewDetailValue: { color: '#fff', fontSize: 12, textAlign: 'right', flexShrink: 1, maxWidth: '70%' },
  reviewTotalRow: { borderBottomWidth: 0, marginTop: 4 },
  reviewTotalLabel: { color: '#fff', fontSize: 16, fontWeight: '900' },
  reviewTotalValue: { color: C.green, fontSize: 19, fontWeight: '900' },
  reviewNotice: { color: C.muted, fontSize: 10, lineHeight: 17, marginTop: 12 },
  reviewActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  secondaryButton: { flex: 0.4, minHeight: 48, borderWidth: 1, borderColor: C.blue, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: C.blue, fontWeight: '900' },
  confirmButton: { flex: 1, minHeight: 48, borderRadius: 11, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  confirmButtonText: { color: '#00130a', fontWeight: '900' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.995 }] },
});