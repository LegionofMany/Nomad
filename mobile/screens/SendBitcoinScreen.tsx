import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

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

const savedAddresses: SavedAddress[] = [];

function BackArrow({ size = 28 }: { size?: number }) {
  return <Svg accessibilityLabel="Back" width={size} height={size} viewBox="0 0 32 32" fill="none"><Path d="M27 16H5m0 0 9-9m-9 9 9 9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

function SecureShield({ size = 34, color = C.green }: { size?: number; color?: string }) {
  return <Svg accessibilityLabel="Secure shield" width={size} height={size * 1.1} viewBox="0 0 54 62" fill="none"><Path d="M27 3 49 13v17c0 16-9 27-22 34C14 57 5 46 5 30V13Z" fill="#021c18" stroke={color} strokeWidth="3" /><Path d="m17 31 7 7 14-16" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

function PaperPlane({ size = 42, color = '#fff' }: { size?: number; color?: string }) {
  return <Svg accessibilityLabel="Send" width={size} height={size} viewBox="0 0 72 72" fill="none"><Path d="M9 29 62 8 43 64 32 42 9 29Z" stroke={color} strokeWidth="4" strokeLinejoin="round" /><Path d="m32 42 14-17" stroke={color} strokeWidth="4" strokeLinecap="round" /></Svg>;
}

function AddressBook({ size = 26 }: { size?: number }) {
  return <Svg accessibilityLabel="Address book" width={size} height={size} viewBox="0 0 36 36" fill="none"><Rect x="5" y="4" width="25" height="28" rx="3" stroke={C.blue} strokeWidth="2.2" /><Circle cx="17" cy="14" r="4" stroke={C.blue} strokeWidth="2" /><Path d="M10 26c1-5 4-7 7-7s6 2 7 7M30 10h3M30 18h3M30 26h3" stroke={C.blue} strokeWidth="2" strokeLinecap="round" /></Svg>;
}

function ScanFrame({ size = 27 }: { size?: number }) {
  return <Svg accessibilityLabel="QR scanner" width={size} height={size} viewBox="0 0 36 36" fill="none"><Path d="M14 5H6v8M22 5h8v8M14 31H6v-8m16 8h8v-8M9 18h18" stroke={C.blue} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

function Lightning({ size = 25 }: { size?: number }) {
  return <Svg accessibilityLabel="Network fee" width={size} height={size} viewBox="0 0 32 32" fill="none"><Path d="m19 3-10 15h7l-3 11 10-15h-7l3-11Z" stroke={C.blue} strokeWidth="2.4" strokeLinejoin="round" /></Svg>;
}

function parseNumber(value?: string) {
  if (!value) return 0;
  const numeric = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatUsd(value: number) {
  return (Math.floor((value + Number.EPSILON) * 100) / 100).toFixed(2);
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

function StepTitle({ number, title, compact }: { number: number; title: string; compact?: boolean }) {
  return (
    <Text style={[styles.stepTitle, compact && styles.stepTitleCompact]}>
      <Text style={styles.stepNumber}>{number}. </Text>
      {title}
    </Text>
  );
}

function SummaryRow({ label, value, sub, strong, last, compact }: { label: string; value: string; sub?: string; strong?: boolean; last?: boolean; compact?: boolean }) {
  return (
    <View style={[styles.summaryRow, compact && styles.summaryRowCompact, !last && styles.summaryBorder]}>
      <Text style={[styles.summaryLabel, compact && styles.summaryLabelCompact, strong && styles.summaryStrong]}>{label}</Text>
      <View style={styles.summaryRight}>
        <Text style={[styles.summaryValue, compact && styles.summaryValueCompact, strong && styles.summaryTotal, strong && compact && styles.summaryTotalCompact]}>{value}</Text>
        {sub ? <Text style={[styles.summarySub, compact && styles.summarySubCompact]}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function BtcBadge({ size = 48 }: { size?: number }) {
  return <Svg accessibilityLabel="Bitcoin" width={size} height={size} viewBox="0 0 64 64" fill="none"><Circle cx="32" cy="32" r="30" fill="#ff9814" /><Path d="M39 16c8 2 9 12 3 16 9 3 8 16-2 19M22 15h14c10 0 11 14 1 16H22m0 0h16c11 0 11 17 0 17H22m7-37v42m8-42v42" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
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
  const availableFiatLabel = btcAsset?.fiatValueUsd || '$22,123.10';

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
    setFeedback('QR scanning requires the connected device camera. No preview address was inserted.');
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
      <View style={[styles.header, compact && styles.headerCompact]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={[styles.backButton, compact && styles.backButtonCompact]}>
          <BackArrow size={compact ? 22 : 30} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, compact && styles.titleCompact]}>Send Bitcoin</Text>
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>Send BTC securely to any address</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`All systems ${systemLabel}`}
          onPress={() => navigation.navigate('SecurityCenter')}
          style={[styles.statusPill, compact && styles.statusPillCompact]}
        >
          <SecureShield size={compact ? 24 : 34} color={systemColor} />
          <View>
            <Text style={[styles.statusTop, compact && styles.statusTopCompact]}>All Systems</Text>
            <Text style={[styles.statusBottom, compact && styles.statusBottomCompact, { color: systemColor }]}>{systemLabel}</Text>
          </View>
        </Pressable>
      </View>

      {walletError ? <Text style={styles.error}>{walletError}</Text> : null}

      <Panel style={[styles.sectionPanel, compact && styles.sectionPanelCompact]}>
        <StepTitle number={1} title="Recipient" compact={compact} />
        <View style={[styles.recipientBox, compact && styles.recipientBoxCompact]}>
          <TextInput
            accessibilityLabel="Bitcoin recipient"
            value={recipient}
            onChangeText={(value) => { setRecipient(value); resetDraft(); }}
            placeholder="Bitcoin address or Reqrium name"
            placeholderTextColor="#74869d"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.recipientInput, compact && styles.recipientInputCompact]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use a saved address"
            onPress={() => setSavedAddressOpen((value) => !value)}
            style={[styles.inputAction, compact && styles.inputActionCompact]}
          >
            <AddressBook size={compact ? 19 : 26} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Scan a Bitcoin QR code" onPress={scanPreviewAddress} style={[styles.inputAction, compact && styles.inputActionCompact]}>
            <ScanFrame size={compact ? 20 : 27} />
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Open my addresses" onPress={() => setSavedAddressOpen((value) => !value)} style={[styles.savedAddressHeader, compact && styles.savedAddressHeaderCompact]}>
          <View style={[styles.savedIcon, compact && styles.savedIconCompact]}><AddressBook size={compact ? 19 : 25} /></View>
          <View style={[styles.savedCopy, compact && styles.savedCopyCompact]}>
            <Text style={[styles.savedTitle, compact && styles.savedTitleCompact]}>My Addresses</Text>
            <Text style={[styles.savedSub, compact && styles.savedSubCompact]}>Choose from saved addresses</Text>
          </View>
          <Text style={[styles.chevron, compact && styles.chevronCompact]}>{savedAddressOpen ? '⌃' : '›'}</Text>
        </Pressable>

        {savedAddressOpen ? (
          <View style={[styles.menuPanel, compact && styles.menuPanelCompact]}>
            {savedAddresses.length ? savedAddresses.map((address) => (
              <Pressable accessibilityRole="button" accessibilityLabel={`Use ${address.label}`} key={address.value} onPress={() => chooseRecipient(address)} style={[styles.savedOption, compact && styles.savedOptionCompact]}>
                <View style={styles.savedOptionMark}><Text style={styles.savedOptionMarkText}>✓</Text></View>
                <View style={styles.savedCopy}>
                  <Text style={styles.savedTitle}>{address.label}</Text>
                  <Text numberOfLines={1} style={styles.savedSub}>{address.value}</Text>
                  <Text style={styles.savedNote}>{address.note}</Text>
                </View>
              </Pressable>
            )) : <Text style={[styles.emptySaved, compact && styles.emptySavedCompact]}>No saved addresses are connected yet.</Text>}
          </View>
        ) : null}

        {recipient ? (
          <Text style={[styles.validationText, { color: validRecipient ? C.green : C.red }]}>
            {validRecipient ? 'Recipient format accepted for review.' : `This does not match the selected ${network === 'Bitcoin Mainnet' ? 'mainnet' : 'testnet'} format.`}
          </Text>
        ) : null}
      </Panel>

      <Panel style={[styles.sectionPanel, compact && styles.sectionPanelCompact]}>
        <StepTitle number={2} title="Amount" compact={compact} />
        <View style={[styles.amountBox, compact && styles.amountBoxCompact]}>
          <View style={styles.amountCopy}>
            <TextInput
              accessibilityLabel="Bitcoin amount"
              value={amount}
              onChangeText={(value) => { setAmount(value.replace(/[^0-9.]/g, '')); resetDraft(); }}
              keyboardType="decimal-pad"
              placeholder="0.000000"
              placeholderTextColor="#66798f"
              style={[styles.amountInput, compact && styles.amountInputCompact]}
            />
            <Text style={[styles.amountUsd, compact && styles.amountUsdCompact]}>≈ ${formatUsd(amountUsd)} USD</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose asset" onPress={() => setAssetOpen((value) => !value)} style={[styles.assetSelector, compact && styles.assetSelectorCompact]}>
            <BtcBadge size={compact ? 30 : 42} />
            <Text style={[styles.assetName, compact && styles.assetNameCompact]}>BTC</Text>
            <Text style={[styles.assetChevron, compact && styles.assetChevronCompact]}>{assetOpen ? '⌃' : '⌄'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Use maximum available Bitcoin" onPress={useMaximum} style={[styles.maxButton, compact && styles.maxButtonCompact]}><Text style={[styles.maxText, compact && styles.maxTextCompact]}>MAX</Text></Pressable>
        </View>

        {assetOpen ? (
          <View style={[styles.assetMenu, compact && styles.assetMenuCompact]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Use Bitcoin" onPress={() => setAssetOpen(false)} style={[styles.assetMenuRow, compact && styles.assetMenuRowCompact]}>
              <BtcBadge size={compact ? 30 : 38} />
              <View style={styles.assetMenuCopy}><Text style={styles.savedTitle}>Bitcoin (BTC)</Text><Text style={styles.savedSub}>Selected for this Send Bitcoin screen</Text></View>
              <Text style={styles.greenCheck}>✓</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Choose another asset" onPress={() => navigation.navigate('Wallets')} style={[styles.assetMenuRow, compact && styles.assetMenuRowCompact]}>
              <View style={styles.otherAssetIcon}><Text style={styles.otherAssetText}>＋</Text></View>
              <View style={styles.assetMenuCopy}><Text style={styles.savedTitle}>Choose another asset</Text><Text style={styles.savedSub}>Return to Wallets to select another token</Text></View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.availableRow, compact && styles.availableRowCompact]}>
          <Text style={[styles.availableLabel, compact && styles.availableLabelCompact]}>Available Balance</Text>
          <Text style={[styles.availableValue, compact && styles.availableValueCompact]}>{availableBtc.toFixed(4)} BTC ({availableFiatLabel})</Text>
        </View>
        {!validAmount && amount ? <Text style={styles.warning}>Amount plus fee must remain within the available balance.</Text> : null}
      </Panel>

      <Panel style={[styles.sectionPanel, compact && styles.sectionPanelCompact]}>
        <StepTitle number={3} title="Network" compact={compact} />
        <Pressable accessibilityRole="button" accessibilityLabel="Choose Bitcoin network" onPress={() => setNetworkOpen((value) => !value)} style={[styles.choiceRow, compact && styles.choiceRowCompact]}>
          <BtcBadge size={compact ? 31 : 46} />
          <View style={[styles.choiceCopy, compact && styles.choiceCopyCompact]}>
            <View style={styles.choiceTitleRow}>
              <Text style={[styles.choiceTitle, compact && styles.choiceTitleCompact]}>{network === 'Bitcoin Mainnet' ? 'Bitcoin' : 'Bitcoin Testnet'}</Text>
              <View style={[styles.recommendedPill, compact && styles.recommendedPillCompact, network === 'Bitcoin Testnet' && styles.testPill]}>
                <Text style={[styles.recommendedText, compact && styles.recommendedTextCompact, network === 'Bitcoin Testnet' && styles.testText]}>{network === 'Bitcoin Mainnet' ? 'Recommended' : 'Testing'}</Text>
              </View>
            </View>
            <Text style={[styles.choiceSub, compact && styles.choiceSubCompact]}>{network === 'Bitcoin Mainnet' ? 'Secure • Fast • Low Fee' : 'Testing only • no real-value transfer'}</Text>
          </View>
          <Text style={[styles.rowChevron, compact && styles.rowChevronCompact]}>{networkOpen ? '⌃' : '⌄'}</Text>
        </Pressable>

        {networkOpen ? (
          <View style={styles.menuPanel}>
            {(['Bitcoin Mainnet', 'Bitcoin Testnet'] as NetworkChoice[]).map((option) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Use ${option}`}
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

      <Panel style={[styles.sectionPanel, compact && styles.sectionPanelCompact]}>
        <StepTitle number={4} title="Network Fee" compact={compact} />
        <Pressable accessibilityRole="button" accessibilityLabel="Choose network fee" onPress={() => setFeeOpen((value) => !value)} style={[styles.choiceRow, compact && styles.choiceRowCompact]}>
          <View style={[styles.lightningIcon, compact && styles.lightningIconCompact]}><Lightning size={compact ? 18 : 25} /></View>
          <View style={[styles.choiceCopy, compact && styles.choiceCopyCompact]}>
            <Text style={[styles.choiceTitle, compact && styles.choiceTitleCompact]}>{feeChoice} ({feeOptions[feeChoice].speed})</Text>
            <Text style={[styles.choiceSub, compact && styles.choiceSubCompact]}>{feeOptions[feeChoice].rate}</Text>
          </View>
          <View style={[styles.feeTrailing, compact && styles.feeTrailingCompact]}>
            <Text style={[styles.feeValue, compact && styles.feeValueCompact]}>{formatted.fee} BTC</Text>
            <Text style={[styles.feeUsd, compact && styles.feeUsdCompact]}>≈ ${formatUsd(feeUsd)} USD</Text>
          </View>
          <Text style={[styles.rowChevron, compact && styles.rowChevronCompact]}>{feeOpen ? '⌃' : '⌄'}</Text>
        </Pressable>

        {feeOpen ? (
          <View style={styles.menuPanel}>
            {(Object.keys(feeOptions) as FeeChoice[]).map((choice) => {
              const option = feeOptions[choice];
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${choice} network fee`}
                  key={choice}
                  onPress={() => { setFeeChoice(choice); setFeeOpen(false); resetDraft(); }}
                  style={[styles.menuChoice, feeChoice === choice && styles.menuChoiceActive]}
                >
                  <Text style={styles.menuChoiceTitle}>{choice} • {option.speed}</Text>
                  <Text style={styles.menuChoiceSub}>{option.rate} • {option.fee.toFixed(6)} BTC • ${formatUsd(option.fee * btcPrice)}</Text>
                  <Text style={[styles.menuChoiceCheck, feeChoice === choice && { color: C.green }]}>{feeChoice === choice ? '✓' : '○'}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </Panel>

      <Panel style={[styles.sectionPanel, compact && styles.sectionPanelCompact]}>
        <StepTitle number={5} title="Summary" compact={compact} />
        <View style={[styles.summaryBox, compact && styles.summaryBoxCompact]}>
          <SummaryRow label="You are sending" value={`${formatted.amount} BTC`} sub={`≈ $${formatUsd(amountUsd)} USD`} compact={compact} />
          <SummaryRow label="Network Fee" value={`${formatted.fee} BTC`} sub={`≈ $${formatUsd(feeUsd)} USD`} compact={compact} />
          <SummaryRow label="Total" value={`${formatted.total} BTC`} sub={`≈ $${formatUsd(totalUsd)} USD`} strong last compact={compact} />
        </View>
      </Panel>

      {feedback ? <Text style={[styles.feedback, draftStatus === 'failed' && { color: C.red }]}>{feedback}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Review Transaction"
        onPress={openReview}
        style={({ pressed }) => [styles.reviewButton, compact && styles.reviewButtonCompact, pressed && styles.pressed]}
      >
        <View style={[styles.reviewIcon, compact && styles.reviewIconCompact]}><PaperPlane size={compact ? 31 : 48} /></View>
        <View style={styles.reviewCopy}>
          <Text style={[styles.reviewTitle, compact && styles.reviewTitleCompact]}>Review Transaction</Text>
          <Text style={[styles.reviewSub, compact && styles.reviewSubCompact]}>Review and confirm before sending</Text>
        </View>
        <Text style={[styles.reviewChevron, compact && styles.reviewChevronCompact]}>›</Text>
      </Pressable>

      {reviewOpen ? (
        <Panel style={styles.reviewPanel}>
          <View style={styles.reviewPanelHeader}>
            <View>
              <Text style={styles.reviewPanelEyebrow}>FINAL WALLET REVIEW</Text>
              <Text style={styles.reviewPanelTitle}>Confirm transaction draft</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close transaction review" onPress={() => setReviewOpen(false)}><Text style={styles.close}>×</Text></Pressable>
          </View>
          <View style={styles.reviewDetail}><Text style={styles.reviewDetailLabel}>Recipient</Text><Text numberOfLines={2} style={styles.reviewDetailValue}>{recipient}</Text></View>
          <View style={styles.reviewDetail}><Text style={styles.reviewDetailLabel}>Network</Text><Text style={styles.reviewDetailValue}>{network}</Text></View>
          <View style={styles.reviewDetail}><Text style={styles.reviewDetailLabel}>Amount</Text><Text style={styles.reviewDetailValue}>{formatted.amount} BTC</Text></View>
          <View style={styles.reviewDetail}><Text style={styles.reviewDetailLabel}>Fee</Text><Text style={styles.reviewDetailValue}>{formatted.fee} BTC</Text></View>
          <View style={[styles.reviewDetail, styles.reviewTotalRow]}><Text style={styles.reviewTotalLabel}>Total</Text><Text style={styles.reviewTotalValue}>{formatted.total} BTC</Text></View>
          <Text style={styles.reviewNotice}>Nomad remains non-custodial. This creates a reviewable draft; the connected wallet controls final signing and broadcast.</Text>
          <View style={styles.reviewActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit transaction" onPress={() => setReviewOpen(false)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Edit</Text></Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create wallet draft"
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
  headerCompact: { minHeight: 45, marginBottom: 10, gap: 5 },
  backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  backButtonCompact: { width: 29, height: 36, alignItems: 'flex-start' },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -0.7 },
  titleCompact: { fontSize: 18, letterSpacing: -0.3 },
  subtitle: { color: '#c5d0df', fontSize: 15, marginTop: 4 },
  subtitleCompact: { fontSize: 10, marginTop: 2 },
  statusPill: { minHeight: 64, minWidth: 190, borderWidth: 1, borderColor: '#0a426d', borderRadius: 32, backgroundColor: 'rgba(3,16,29,.97)', paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statusPillCompact: { minWidth: 103, minHeight: 38, borderRadius: 20, paddingHorizontal: 8, gap: 5 },
  statusTop: { color: '#e9f1fb', fontSize: 13 },
  statusTopCompact: { fontSize: 9 },
  statusBottom: { fontSize: 14, fontWeight: '900', marginTop: 2 },
  statusBottomCompact: { fontSize: 10, marginTop: 1 },
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  sectionPanel: { marginBottom: 13, padding: 17 },
  sectionPanelCompact: { marginBottom: 4, padding: 10, borderRadius: 12 },
  stepTitle: { color: C.blue, fontSize: 17, fontWeight: '900', marginBottom: 13 },
  stepTitleCompact: { fontSize: 11, marginBottom: 7 },
  stepNumber: { color: C.blue },
  recipientBox: { minHeight: 72, borderWidth: 1, borderColor: '#1b568a', borderRadius: 13, backgroundColor: '#04111f', flexDirection: 'row', alignItems: 'center', paddingLeft: 17 },
  recipientBoxCompact: { minHeight: 39, borderRadius: 8, paddingLeft: 10 },
  recipientInput: { flex: 1, minWidth: 0, color: '#fff', fontSize: 15, outlineStyle: 'none' } as any,
  recipientInputCompact: { fontSize: 11 },
  inputAction: { width: 58, height: 52, borderLeftWidth: 1, borderLeftColor: 'rgba(22,140,255,.13)', alignItems: 'center', justifyContent: 'center' },
  inputActionCompact: { width: 34, height: 32 },
  savedAddressHeader: { minHeight: 76, marginTop: 13, borderWidth: 1, borderColor: '#0a426d', borderRadius: 12, backgroundColor: '#03101d', padding: 12, flexDirection: 'row', alignItems: 'center' },
  savedAddressHeaderCompact: { minHeight: 44, marginTop: 7, borderRadius: 8, padding: 7 },
  savedIcon: { width: 46, height: 46, borderRadius: 11, borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(22,140,255,.09)', alignItems: 'center', justifyContent: 'center' },
  savedIconCompact: { width: 28, height: 28, borderRadius: 6 },
  savedCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  savedCopyCompact: { marginLeft: 8 },
  savedTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  savedTitleCompact: { fontSize: 11 },
  savedSub: { color: C.muted, fontSize: 11, marginTop: 4 },
  savedSubCompact: { fontSize: 9, marginTop: 2 },
  savedNote: { color: C.green, fontSize: 9, marginTop: 4 },
  chevron: { color: '#b8c5d7', fontSize: 29 },
  chevronCompact: { fontSize: 19 },
  menuPanel: { marginTop: 10, borderWidth: 1, borderColor: '#0a426d', borderRadius: 12, overflow: 'hidden', backgroundColor: '#020c16' },
  menuPanelCompact: { marginTop: 7, borderRadius: 8 },
  savedOption: { minHeight: 76, padding: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(22,140,255,.12)' },
  savedOptionCompact: { minHeight: 52, padding: 8 },
  savedOptionMark: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(32,239,112,.11)', borderWidth: 1, borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  savedOptionMarkText: { color: C.green, fontWeight: '900' },
  emptySaved: { color: C.muted, fontSize: 11, padding: 14, textAlign: 'center' },
  emptySavedCompact: { fontSize: 9, padding: 10 },
  validationText: { fontSize: 10, marginTop: 10 },
  amountBox: { minHeight: 111, borderWidth: 1, borderColor: '#1b568a', borderRadius: 13, backgroundColor: '#04111f', flexDirection: 'row', alignItems: 'center', padding: 15 },
  amountBoxCompact: { minHeight: 64, borderRadius: 8, padding: 9 },
  amountCopy: { flex: 1, minWidth: 0 },
  amountInput: { color: '#fff', fontSize: 38, fontWeight: '500', outlineStyle: 'none' } as any,
  amountInputCompact: { fontSize: 22 },
  amountUsd: { color: C.muted, fontSize: 13, marginTop: 6 },
  amountUsdCompact: { fontSize: 9, marginTop: 3 },
  assetSelector: { minHeight: 70, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#1b568a', paddingLeft: 16, marginLeft: 12 },
  assetSelectorCompact: { minHeight: 46, paddingLeft: 9, marginLeft: 6 },
  assetName: { color: '#fff', fontSize: 20, fontWeight: '900', marginLeft: 9 },
  assetNameCompact: { fontSize: 14, marginLeft: 6 },
  assetChevron: { color: '#9db4cf', fontSize: 22, marginLeft: 7 },
  assetChevronCompact: { fontSize: 15, marginLeft: 4 },
  maxButton: { minHeight: 45, borderWidth: 1, borderColor: C.blue, borderRadius: 8, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  maxButtonCompact: { minHeight: 32, borderRadius: 6, paddingHorizontal: 8, marginLeft: 7 },
  maxText: { color: C.blue, fontSize: 13, fontWeight: '900' },
  maxTextCompact: { fontSize: 10 },
  assetMenu: { marginTop: 10, borderWidth: 1, borderColor: '#0a426d', borderRadius: 12, backgroundColor: '#020c16', overflow: 'hidden' },
  assetMenuCompact: { marginTop: 7, borderRadius: 8 },
  assetMenuRow: { minHeight: 70, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(22,140,255,.12)' },
  assetMenuRowCompact: { minHeight: 48, paddingHorizontal: 9 },
  assetMenuCopy: { flex: 1, marginLeft: 12 },
  greenCheck: { color: C.green, fontSize: 21 },
  otherAssetIcon: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  otherAssetText: { color: C.blue, fontSize: 24 },
  availableRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 2 },
  availableRowCompact: { minHeight: 31, gap: 5 },
  availableLabel: { color: C.muted, fontSize: 13 },
  availableLabelCompact: { fontSize: 10 },
  availableValue: { color: '#fff', fontSize: 13, textAlign: 'right' },
  availableValueCompact: { fontSize: 10 },
  warning: { color: C.yellow, fontSize: 10, marginTop: 3 },
  choiceRow: { minHeight: 91, borderWidth: 1, borderColor: '#1b568a', borderRadius: 13, padding: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#03101d' },
  choiceRowCompact: { minHeight: 50, borderRadius: 8, padding: 8 },
  choiceCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  choiceCopyCompact: { marginLeft: 8 },
  choiceTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  choiceTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  choiceTitleCompact: { fontSize: 11 },
  choiceSub: { color: C.muted, fontSize: 12, marginTop: 5 },
  choiceSubCompact: { fontSize: 9, marginTop: 2 },
  recommendedPill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: 'rgba(32,239,112,.12)', borderWidth: 1, borderColor: 'rgba(32,239,112,.25)' },
  recommendedPillCompact: { borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2 },
  recommendedText: { color: C.green, fontSize: 9, fontWeight: '900' },
  recommendedTextCompact: { fontSize: 7 },
  testPill: { backgroundColor: 'rgba(22,140,255,.12)', borderColor: 'rgba(22,140,255,.25)' },
  testText: { color: C.blue },
  rowChevron: { color: '#9db4cf', fontSize: 24, marginLeft: 10 },
  rowChevronCompact: { fontSize: 15, marginLeft: 5 },
  menuChoice: { minHeight: 68, padding: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(22,140,255,.12)', position: 'relative' },
  menuChoiceActive: { backgroundColor: 'rgba(32,239,112,.05)' },
  menuChoiceTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  menuChoiceSub: { color: C.muted, fontSize: 10, marginTop: 4, paddingRight: 34 },
  menuChoiceCheck: { position: 'absolute', right: 15, top: 22, color: '#596a80', fontSize: 18 },
  lightningIcon: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(22,140,255,.08)', alignItems: 'center', justifyContent: 'center' },
  lightningIconCompact: { width: 31, height: 31, borderRadius: 16 },
  feeTrailing: { alignItems: 'flex-end', marginLeft: 12 },
  feeTrailingCompact: { marginLeft: 5 },
  feeValue: { color: '#fff', fontSize: 15 },
  feeValueCompact: { fontSize: 10 },
  feeUsd: { color: C.muted, fontSize: 11, marginTop: 5 },
  feeUsdCompact: { fontSize: 9, marginTop: 2 },
  summaryBox: { borderWidth: 1, borderColor: '#1b568a', borderRadius: 13, backgroundColor: '#03101d', paddingHorizontal: 16 },
  summaryBoxCompact: { borderRadius: 8, paddingHorizontal: 10 },
  summaryRow: { minHeight: 87, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  summaryRowCompact: { minHeight: 48, gap: 8 },
  summaryBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(22,140,255,.15)' },
  summaryLabel: { color: C.muted, fontSize: 14 },
  summaryLabelCompact: { fontSize: 10 },
  summaryStrong: { color: '#fff', fontWeight: '900' },
  summaryRight: { alignItems: 'flex-end', flexShrink: 1 },
  summaryValue: { color: '#fff', fontSize: 18, textAlign: 'right' },
  summaryValueCompact: { fontSize: 12 },
  summaryTotal: { fontSize: 23, fontWeight: '900' },
  summaryTotalCompact: { fontSize: 15 },
  summarySub: { color: C.muted, fontSize: 12, marginTop: 5 },
  summarySubCompact: { fontSize: 9, marginTop: 2 },
  feedback: { color: C.green, fontSize: 11, lineHeight: 17, marginBottom: 11 },
  reviewButton: { minHeight: 112, borderRadius: 18, backgroundColor: '#0b59f0', paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', marginBottom: 15, ...Platform.select({ web: { boxShadow: '0 18px 45px rgba(11,89,240,.24)' } as any, default: {} }) },
  reviewButtonCompact: { minHeight: 62, borderRadius: 12, paddingHorizontal: 12, marginBottom: 8 },
  reviewIcon: { width: 58, height: 58, marginRight: 17, alignItems: 'center', justifyContent: 'center' },
  reviewIconCompact: { width: 34, height: 34, marginRight: 10 },
  reviewCopy: { flex: 1 },
  reviewTitle: { color: '#fff', fontSize: 21, fontWeight: '900' },
  reviewTitleCompact: { fontSize: 13 },
  reviewSub: { color: '#dce8ff', fontSize: 13, marginTop: 5 },
  reviewSubCompact: { fontSize: 10, marginTop: 2 },
  reviewChevron: { color: '#fff', fontSize: 42, fontWeight: '300' },
  reviewChevronCompact: { fontSize: 24 },
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
