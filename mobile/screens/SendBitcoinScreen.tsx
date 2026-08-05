import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useNomadWallet } from '../nomad';
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

type DraftStatus = 'idle' | 'creating' | 'created' | 'failed';
type FeeChoice = 'Economy' | 'Standard' | 'Priority';
type NetworkChoice = 'Bitcoin Mainnet' | 'Bitcoin Testnet';

const BTC_USD = 61410;
const AVAILABLE_BTC = 0.3567;

const feeOptions: Record<FeeChoice, { fee: number; speed: string; rate: string }> = {
  Economy: { fee: 0.000012, speed: '30–60 minutes', rate: '~1 sat/vB' },
  Standard: { fee: 0.000028, speed: '10–30 minutes', rate: '~3 sat/vB' },
  Priority: { fee: 0.000062, speed: 'About 10 minutes', rate: '~7 sat/vB' },
};

function StepTitle({ number, title }: { number: number; title: string }) {
  return <Text style={styles.stepTitle}><Text style={styles.stepNumber}>{number}.</Text> {title}</Text>;
}

function ChoiceRow({
  selected,
  icon,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  selected?: boolean;
  icon: string;
  title: string;
  subtitle: string;
  trailing?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.choiceRow, selected && styles.choiceSelected]}>
      <RoundIcon symbol={icon} color={selected ? C.green : C.blue} size={43} filled />
      <View style={styles.choiceCopy}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.choiceSub}>{subtitle}</Text>
      </View>
      {trailing ? <Text style={[styles.choiceTrailing, selected && { color: C.green }]}>{trailing}</Text> : null}
      <Text style={[styles.choiceCheck, selected && { color: C.green }]}>{selected ? '✓' : '○'}</Text>
    </Pressable>
  );
}

function SummaryRow({ label, value, sub, strong, last }: { label: string; value: string; sub?: string; strong?: boolean; last?: boolean }) {
  return (
    <View style={[styles.summaryRow, !last && styles.rowBorder]}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <View style={styles.summaryRight}>
        <Text style={[styles.summaryValue, strong && styles.summaryValueStrong]}>{value}</Text>
        {sub ? <Text style={styles.summarySub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

export default function SendBitcoinScreen() {
  const { compact } = useNomadLayout();
  const { createTransaction, error: walletError } = useNomadWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('0.001000');
  const [network, setNetwork] = useState<NetworkChoice>('Bitcoin Mainnet');
  const [feeChoice, setFeeChoice] = useState<FeeChoice>('Economy');
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle');
  const [feedback, setFeedback] = useState('');
  const [savedAddressOpen, setSavedAddressOpen] = useState(false);

  const numericAmount = Number(amount);
  const fee = feeOptions[feeChoice].fee;
  const total = Number.isFinite(numericAmount) ? numericAmount + fee : fee;
  const amountUsd = Number.isFinite(numericAmount) ? numericAmount * BTC_USD : 0;
  const feeUsd = fee * BTC_USD;
  const totalUsd = total * BTC_USD;
  const validRecipient = recipient.trim().length >= 8;
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0 && total <= AVAILABLE_BTC;
  const canReview = validRecipient && validAmount;

  const formatted = useMemo(() => ({
    amount: Number.isFinite(numericAmount) ? numericAmount.toFixed(6) : '0.000000',
    fee: fee.toFixed(6),
    total: total.toFixed(6),
  }), [fee, numericAmount, total]);

  const createDraft = async () => {
    if (!canReview) {
      setDraftStatus('failed');
      setFeedback(!validRecipient ? 'Enter a valid Bitcoin address or Reqrium identity.' : 'Enter an amount within the available balance.');
      return;
    }

    try {
      setDraftStatus('creating');
      setFeedback('Creating a wallet-owned transaction draft…');
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
      } else {
        setDraftStatus('created');
        setFeedback('Transaction draft created. Final review and signing remain inside the connected wallet.');
      }
    } catch (err) {
      setDraftStatus('failed');
      setFeedback(err instanceof Error ? err.message : 'Unable to create the transaction draft.');
    }
  };

  return (
    <NomadPage maxWidth={900}>
      <PageHeader title="Send Bitcoin" subtitle="Send BTC securely" icon="↑" color={C.blue} help />
      {walletError ? <Text style={styles.error}>{walletError}</Text> : null}

      <Panel style={styles.sectionPanel}>
        <StepTitle number={1} title="Recipient" />
        <View style={styles.inputBox}>
          <TextInput
            value={recipient}
            onChangeText={(value) => { setRecipient(value); setDraftStatus('idle'); setFeedback(''); }}
            placeholder="Bitcoin address or Reqrium identity"
            placeholderTextColor="#74869d"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.recipientInput}
          />
          <Pressable onPress={() => setRecipient('bc1qnomad7f3a9c2b5d8e1ownerverified')} style={styles.inputAction}><Text style={styles.inputActionText}>▦</Text></Pressable>
          <Pressable onPress={() => setRecipient('bc1qnomadscannedaddress7f3a9c2b')} style={styles.inputAction}><Text style={styles.inputActionText}>⌗</Text></Pressable>
        </View>
        <Pressable onPress={() => setSavedAddressOpen((value) => !value)} style={styles.savedAddress}>
          <RoundIcon symbol="▣" color={C.blue} size={43} filled />
          <View style={styles.savedCopy}><Text style={styles.savedTitle}>My Addresses</Text><Text style={styles.savedSub}>Choose from saved and Reqrium-verified addresses</Text></View>
          <Text style={styles.chevron}>{savedAddressOpen ? '⌃' : '›'}</Text>
        </Pressable>
        {savedAddressOpen ? (
          <Pressable onPress={() => { setRecipient('bc1qnomadtravelwallet7f3a9c2b'); setSavedAddressOpen(false); }} style={styles.savedOption}>
            <RoundIcon symbol="✓" color={C.green} size={36} filled />
            <View style={styles.savedCopy}><Text style={styles.savedTitle}>Nomad Travel Wallet</Text><Text style={styles.savedSub}>bc1qnomad…9c2b • Reqrium verified</Text></View>
          </Pressable>
        ) : null}
      </Panel>

      <Panel style={styles.sectionPanel}>
        <StepTitle number={2} title="Amount" />
        <View style={[styles.amountBox, compact && styles.amountCompact]}>
          <View style={styles.amountCopy}>
            <TextInput
              value={amount}
              onChangeText={(value) => { setAmount(value.replace(/[^0-9.]/g, '')); setDraftStatus('idle'); }}
              keyboardType="decimal-pad"
              placeholder="0.000000"
              placeholderTextColor="#66798f"
              style={styles.amountInput}
            />
            <Text style={styles.amountUsd}>≈ ${amountUsd.toFixed(2)} USD</Text>
          </View>
          <View style={styles.assetSelector}><RoundIcon symbol="₿" color="#ff9900" size={43} /><Text style={styles.assetName}>BTC</Text></View>
          <Pressable onPress={() => setAmount(AVAILABLE_BTC.toFixed(6))} style={styles.maxButton}><Text style={styles.maxText}>MAX</Text></Pressable>
        </View>
        <View style={styles.availableRow}><Text style={styles.availableLabel}>Available Balance</Text><Text style={styles.availableValue}>{AVAILABLE_BTC.toFixed(4)} BTC (${(AVAILABLE_BTC * BTC_USD).toFixed(2)})</Text></View>
        {!validAmount && amount ? <Text style={styles.warning}>The amount plus fee must stay within the available balance.</Text> : null}
      </Panel>

      <Panel style={styles.sectionPanel}>
        <StepTitle number={3} title="Network" />
        <ChoiceRow selected={network === 'Bitcoin Mainnet'} icon="₿" title="Bitcoin Mainnet" subtitle="Production Bitcoin network" trailing="Recommended" onPress={() => setNetwork('Bitcoin Mainnet')} />
        <ChoiceRow selected={network === 'Bitcoin Testnet'} icon="T" title="Bitcoin Testnet" subtitle="Testing only • no real-value transfer" trailing="Test" onPress={() => setNetwork('Bitcoin Testnet')} />
      </Panel>

      <Panel style={styles.sectionPanel}>
        <StepTitle number={4} title="Network Fee" />
        {(Object.keys(feeOptions) as FeeChoice[]).map((choice) => {
          const option = feeOptions[choice];
          return <ChoiceRow key={choice} selected={feeChoice === choice} icon="ϟ" title={`${choice} • ${option.speed}`} subtitle={`${option.rate} • ${option.fee.toFixed(6)} BTC`} trailing={`$${(option.fee * BTC_USD).toFixed(2)}`} onPress={() => setFeeChoice(choice)} />;
        })}
      </Panel>

      <Panel style={styles.sectionPanel}>
        <StepTitle number={5} title="Summary" />
        <View style={styles.summaryBox}>
          <SummaryRow label="You are sending" value={`${formatted.amount} BTC`} sub={`≈ $${amountUsd.toFixed(2)} USD`} />
          <SummaryRow label="Network Fee" value={`${formatted.fee} BTC`} sub={`≈ $${feeUsd.toFixed(2)} USD`} />
          <SummaryRow label="Network" value={network} />
          <SummaryRow label="Total" value={`${formatted.total} BTC`} sub={`≈ $${totalUsd.toFixed(2)} USD`} strong last />
        </View>
      </Panel>

      {feedback ? <Text style={[styles.feedback, draftStatus === 'failed' && { color: C.red }]}>{feedback}</Text> : null}
      <PrimaryButton
        label={draftStatus === 'creating' ? 'Creating Draft…' : draftStatus === 'created' ? 'Draft Ready' : 'Review Transaction'}
        subtitle={draftStatus === 'created' ? 'Open the connected wallet to review and sign' : 'Review every detail before final wallet approval'}
        icon={draftStatus === 'created' ? '✓' : '↑'}
        tone={draftStatus === 'created' ? 'green' : 'blue'}
        disabled={draftStatus === 'creating' || !canReview}
        onPress={() => void createDraft()}
      />

      <Panel style={styles.noticePanel}><RoundIcon symbol="◇" color={C.green} size={43} /><Text style={styles.noticeText}>Nomad creates a reviewable draft only. The connected wallet retains custody and controls final signing and broadcast.</Text></Panel>

      <BottomNav active="Send" items={[
        ['⌂', 'Home', 'Portfolio'], ['▣', 'Wallets', 'Wallets'], ['↑', 'Send', 'SendBitcoin'], ['↓', 'Receive', 'ReceiveBitcoin'], ['⇄', 'Swap', 'Swap'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  sectionPanel: { marginBottom: 13, padding: 17 },
  stepTitle: { color: '#fff', fontSize: 15, fontWeight: '900', marginBottom: 13 },
  stepNumber: { color: C.blue },
  inputBox: { minHeight: 59, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.panel2, flexDirection: 'row', alignItems: 'center', paddingLeft: 14 },
  recipientInput: { flex: 1, minWidth: 0, color: '#fff', fontSize: 13, outlineStyle: 'none' } as any,
  inputAction: { width: 47, height: 47, alignItems: 'center', justifyContent: 'center' },
  inputActionText: { color: C.blue, fontSize: 23 },
  savedAddress: { minHeight: 63, marginTop: 11, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center' },
  savedOption: { minHeight: 59, marginTop: 8, borderWidth: 1, borderColor: C.green, borderRadius: 10, backgroundColor: 'rgba(32,239,112,.05)', padding: 10, flexDirection: 'row', alignItems: 'center' },
  savedCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  savedTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  savedSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  chevron: { color: '#b8c5d7', fontSize: 26 },
  amountBox: { minHeight: 92, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.panel2, flexDirection: 'row', alignItems: 'center', padding: 13 },
  amountCompact: { flexWrap: 'wrap' },
  amountCopy: { flex: 1, minWidth: 180 },
  amountInput: { color: '#fff', fontSize: 30, fontWeight: '800', outlineStyle: 'none' } as any,
  amountUsd: { color: C.muted, fontSize: 10, marginTop: 5 },
  assetSelector: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  assetName: { color: '#fff', fontSize: 15, fontWeight: '900', marginLeft: 8 },
  maxButton: { minHeight: 39, borderWidth: 1, borderColor: C.blue, borderRadius: 8, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  maxText: { color: C.blue, fontSize: 10, fontWeight: '900' },
  availableRow: { minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  availableLabel: { color: C.muted, fontSize: 9 },
  availableValue: { color: '#fff', fontSize: 9, textAlign: 'right' },
  warning: { color: C.yellow, fontSize: 9, marginTop: 4 },
  choiceRow: { minHeight: 70, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 11, flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  choiceSelected: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.05)' },
  choiceCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  choiceTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  choiceSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  choiceTrailing: { color: '#fff', fontSize: 8, textAlign: 'right', marginLeft: 8 },
  choiceCheck: { color: C.muted, fontSize: 17, marginLeft: 8 },
  summaryBox: { borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.panel2, paddingHorizontal: 14 },
  summaryRow: { minHeight: 61, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 15 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  summaryLabel: { color: C.muted, fontSize: 10 },
  summaryStrong: { color: '#fff', fontWeight: '900' },
  summaryRight: { flex: 1, alignItems: 'flex-end' },
  summaryValue: { color: '#fff', fontSize: 12, textAlign: 'right' },
  summaryValueStrong: { fontSize: 16, fontWeight: '900' },
  summarySub: { color: C.muted, fontSize: 8, marginTop: 4 },
  feedback: { color: C.green, fontSize: 10, marginBottom: 4 },
  noticePanel: { minHeight: 78, marginTop: 14, padding: 13, flexDirection: 'row', alignItems: 'center' },
  noticeText: { flex: 1, minWidth: 0, color: C.muted, fontSize: 9, lineHeight: 14, marginLeft: 11 },
});
