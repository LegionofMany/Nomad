import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadTravel, useNomadWallet } from '../nomad';
import type { NomadAsset } from '../nomad';
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

type Step = 1 | 2 | 3;

type Asset = {
  baseSymbol: string;
  symbol: string;
  name: string;
  balance: string;
  value: string;
  icon: string;
  color: string;
  network?: string;
};

type DraftState = 'idle' | 'creating' | 'created' | 'failed';

const fallbackAssets: Asset[] = [
  { baseSymbol: 'USDT', symbol: 'USDT (TRC20)', name: 'Tether', balance: '1,250.00 USDT', value: '$1,250.00', icon: '₮', color: '#33d790', network: 'TRC20' },
  { baseSymbol: 'USDC', symbol: 'USDC (ERC20)', name: 'USD Coin', balance: '750.50 USDC', value: '$750.50', icon: '$', color: '#1684ff', network: 'Ethereum' },
  { baseSymbol: 'BTC', symbol: 'BTC', name: 'Bitcoin', balance: '0.025468 BTC', value: '$1,675.22', icon: '₿', color: '#ff9900', network: 'Bitcoin' },
  { baseSymbol: 'ETH', symbol: 'ETH', name: 'Ethereum', balance: '0.5234 ETH', value: '$1,234.11', icon: '◆', color: '#627eea', network: 'Ethereum' },
  { baseSymbol: 'DAI', symbol: 'DAI (ERC20)', name: 'Dai Stablecoin', balance: '300.00 DAI', value: '$300.00', icon: 'D', color: '#f5ac25', network: 'Ethereum' },
];

const tokenVisuals: Record<string, { icon: string; color: string }> = {
  USDT: { icon: '₮', color: '#33d790' }, USDC: { icon: '$', color: '#1684ff' }, BTC: { icon: '₿', color: '#ff9900' },
  ETH: { icon: '◆', color: '#627eea' }, DAI: { icon: 'D', color: '#f5ac25' }, HBAR: { icon: 'H', color: '#6b42ff' },
  XRP: { icon: 'X', color: '#2c2f35' }, XLM: { icon: 'S', color: '#187bff' }, XDC: { icon: 'X', color: '#005ba8' },
  ADA: { icon: 'A', color: '#246bff' }, ALGO: { icon: 'A', color: '#2e72d8' },
};

function toTopUpAsset(asset: NomadAsset): Asset {
  const baseSymbol = asset.symbol.toUpperCase();
  const visual = tokenVisuals[baseSymbol] ?? { icon: baseSymbol.slice(0, 1), color: C.blue };
  const network = asset.network && asset.network !== 'Nomad' ? asset.network : undefined;
  return {
    baseSymbol,
    symbol: network ? `${baseSymbol} (${network})` : baseSymbol,
    name: asset.name,
    balance: `${asset.balance} ${baseSymbol}`,
    value: asset.fiatValueUsd,
    icon: visual.icon,
    color: visual.color,
    network,
  };
}

function parseBalance(asset?: Asset | null): number {
  if (!asset) return 0;
  const parsed = Number(asset.balance.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function Stepper({ step }: { step: Step }) {
  const steps: Array<{ number: Step; label: string }> = [
    { number: 1, label: 'Select Asset' },
    { number: 2, label: 'Enter Amount' },
    { number: 3, label: 'Review & Confirm' },
  ];
  return (
    <View style={styles.stepper}>
      {steps.map((item, index) => {
        const active = item.number <= step;
        return (
          <React.Fragment key={item.number}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, active && styles.stepCircleActive]}><Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{item.number}</Text></View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{item.label}</Text>
            </View>
            {index < steps.length - 1 ? <View style={[styles.stepLine, item.number < step && styles.stepLineActive]} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function AssetRow({ asset, selected, last, onPress }: { asset: Asset; selected: boolean; last?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.assetRow, !last && styles.assetBorder, selected && styles.assetSelected]}>
      <View style={[styles.assetBadge, { backgroundColor: asset.color }]}><Text style={styles.assetMark}>{asset.icon}</Text></View>
      <View style={styles.assetCopy}>
        <Text numberOfLines={1} style={styles.assetSymbol}>{asset.symbol}</Text>
        <Text style={styles.assetName}>{asset.name}</Text>
      </View>
      <View style={styles.assetNumbers}>
        <Text numberOfLines={1} style={styles.assetBalance}>{asset.balance}</Text>
        <Text style={styles.assetValue}>{asset.value}</Text>
      </View>
      <Text style={[styles.assetArrow, selected && { color: C.green }]}>{selected ? '✓' : '›'}</Text>
    </Pressable>
  );
}

export default function TopUpTravelPocketScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { assets: walletAssets, loading: walletLoading, error: walletError, createTransaction } = useNomadWallet();
  const { travelPocket } = useNomadTravel();
  const topUpAssets = useMemo(() => walletAssets.length ? walletAssets.map(toTopUpAsset) : fallbackAssets, [walletAssets]);

  const [step, setStep] = useState<Step>(1);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [amount, setAmount] = useState('');
  const [draftState, setDraftState] = useState<DraftState>('idle');
  const [feedback, setFeedback] = useState('');

  const available = parseBalance(selectedAsset);
  const numericAmount = Number(amount);
  const validAmount = !!selectedAsset && Number.isFinite(numericAmount) && numericAmount > 0 && numericAmount <= available;
  const region = travelPocket.regionInput || 'Global';
  const localCurrency = travelPocket.localCurrency || travelPocket.preferredStablecoin || 'USD Stable';

  const selectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setAmount('');
    setFeedback('');
    setDraftState('idle');
    setStep(2);
  };

  const applyPercent = (percent: number) => {
    if (!selectedAsset) return;
    const value = available * percent;
    const decimals = ['BTC', 'ETH'].includes(selectedAsset.baseSymbol) ? 6 : 2;
    setAmount(value.toFixed(decimals));
  };

  const createTopUpDraft = async () => {
    if (!selectedAsset || !validAmount) {
      setFeedback('Enter an amount within the available wallet balance.');
      return;
    }
    try {
      setDraftState('creating');
      setFeedback('');
      const result = await createTransaction({
        fromAsset: selectedAsset.baseSymbol,
        toAddress: 'nomad-travel-pocket',
        amount,
        networkFee: 'Calculated at review',
        memo: `Travel Pocket top up for ${region}`,
        intent: 'travel_pocket_top_up',
        requiresUserApproval: true,
        createdBy: 'nomad_overlay',
      });
      if (result.status === 'failed') {
        setDraftState('failed');
        setFeedback(result.failure?.message || 'Unable to create the top-up draft.');
      } else {
        setDraftState('created');
        setFeedback('Top-up draft created. The wallet owner still controls final approval.');
      }
    } catch (err) {
      setDraftState('failed');
      setFeedback(err instanceof Error ? err.message : 'Unable to create the top-up draft.');
    }
  };

  return (
    <NomadPage maxWidth={900}>
      <PageHeader title="Top Up Travel Pocket" subtitle={`Step ${step} of 3`} icon="＋" color={C.green} help />
      <Stepper step={step} />

      <Panel tone="green" style={[styles.balancePanel, compact && styles.balancePanelCompact]}>
        <View style={styles.balanceIdentity}>
          <RoundIcon symbol="▰" color={C.green} size={compact ? 52 : 66} filled />
          <View style={styles.balanceCopy}>
            <Text style={styles.balanceTitle}>Travel Pocket Balance</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.balanceMain, { fontSize: compact ? 31 : 42 }]}>{travelPocket.pocketBalanceLocal || travelPocket.pocketBalanceFiat || '$1,208.64'}</Text>
            <Text style={styles.balanceSub}>{travelPocket.pocketBalanceFiat || '$1,208.64'} USD value</Text>
          </View>
        </View>
        <View style={styles.regionSummary}>
          <RoundIcon symbol="◎" color={C.green} size={46} />
          <View style={{ marginLeft: 10 }}><Text style={styles.regionName}>{region}</Text><Text style={styles.regionSub}>{localCurrency}</Text></View>
        </View>
      </Panel>

      {step === 1 ? (
        <Panel style={styles.contentPanel}>
          <Text style={styles.sectionTitle}>SELECT ASSET TO TOP UP</Text>
          <View style={styles.divider} />
          {topUpAssets.map((asset, index) => (
            <AssetRow key={`${asset.symbol}-${index}`} asset={asset} selected={selectedAsset?.symbol === asset.symbol} last={index === topUpAssets.length - 1} onPress={() => selectAsset(asset)} />
          ))}
          {walletLoading ? <Text style={styles.helper}>Loading live wallet assets…</Text> : null}
          {walletError ? <Text style={styles.warning}>Using approved preview assets until wallet data is available.</Text> : null}
        </Panel>
      ) : null}

      {step === 2 && selectedAsset ? (
        <Panel style={styles.contentPanel}>
          <Text style={styles.sectionTitle}>ENTER TOP-UP AMOUNT</Text>
          <View style={styles.selectedAssetHeader}>
            <View style={[styles.assetBadge, { backgroundColor: selectedAsset.color }]}><Text style={styles.assetMark}>{selectedAsset.icon}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.selectedAssetTitle}>{selectedAsset.symbol}</Text><Text style={styles.assetName}>Available: {selectedAsset.balance}</Text></View>
            <Pressable onPress={() => setStep(1)}><Text style={styles.changeAsset}>Change</Text></Pressable>
          </View>
          <View style={styles.amountBox}>
            <TextInput
              value={amount}
              onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor="#62748b"
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />
            <Text style={styles.amountSymbol}>{selectedAsset.baseSymbol}</Text>
          </View>
          <View style={styles.percentRow}>
            {[.25, .5, .75, 1].map((percent) => (
              <Pressable key={percent} onPress={() => applyPercent(percent)} style={styles.percentButton}><Text style={styles.percentText}>{percent === 1 ? 'MAX' : `${percent * 100}%`}</Text></Pressable>
            ))}
          </View>
          {!validAmount && amount ? <Text style={styles.warning}>Amount must be greater than zero and no more than {selectedAsset.balance}.</Text> : null}
          <PrimaryButton label="Review Top Up" subtitle="Check the amount and destination before creating a draft" icon="›" disabled={!validAmount} onPress={() => setStep(3)} tone="green" />
        </Panel>
      ) : null}

      {step === 3 && selectedAsset ? (
        <Panel style={styles.contentPanel}>
          <Text style={styles.sectionTitle}>REVIEW & CONFIRM</Text>
          <View style={styles.reviewBox}>
            <View style={styles.reviewRow}><Text style={styles.reviewLabel}>From asset</Text><Text style={styles.reviewValue}>{selectedAsset.symbol}</Text></View>
            <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Amount</Text><Text style={styles.reviewValue}>{amount} {selectedAsset.baseSymbol}</Text></View>
            <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Destination</Text><Text style={styles.reviewValue}>Travel Pocket</Text></View>
            <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Region</Text><Text style={styles.reviewValue}>{region}</Text></View>
            <View style={[styles.reviewRow, { borderBottomWidth: 0 }]}><Text style={styles.reviewLabel}>Local stable value</Text><Text style={[styles.reviewValue, { color: C.green }]}>{localCurrency}</Text></View>
          </View>
          <Text style={styles.reviewNote}>This creates a reviewable transaction draft only. Nomad does not sign or move funds without wallet-owner approval.</Text>
          {feedback ? <Text style={[styles.feedback, draftState === 'failed' && { color: C.red }]}>{feedback}</Text> : null}
          {draftState === 'created' ? (
            <PrimaryButton label="Return to Travel Pocket" subtitle="Review the updated pocket after wallet approval" icon="✓" onPress={() => navigation.navigate('TravelMode')} tone="green" />
          ) : (
            <PrimaryButton label={draftState === 'creating' ? 'Creating Draft…' : 'Create Top-Up Draft'} subtitle="Final signing remains inside the connected wallet" icon="▰" disabled={draftState === 'creating'} onPress={() => void createTopUpDraft()} tone="green" />
          )}
          <Pressable onPress={() => setStep(2)} style={styles.backEdit}><Text style={styles.backEditText}>‹ Edit amount</Text></Pressable>
        </Panel>
      ) : null}

      <Panel style={styles.infoPanel}>
        <RoundIcon symbol="i" color={C.blue} size={44} />
        <Text style={styles.infoText}>Top-ups are converted into the selected region’s stable-value display for spending. The connected wallet remains non-custodial and controls every final approval.</Text>
      </Panel>

      <BottomNav active="Travel" fifth={['•••', 'More', 'Settings']} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  stepper: { minHeight: 92, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 18 },
  stepItem: { width: 92, alignItems: 'center' },
  stepCircle: { width: 43, height: 43, borderRadius: 22, borderWidth: 1, borderColor: '#526070', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { borderColor: C.green, backgroundColor: C.green },
  stepNumber: { color: '#d7e1ee', fontWeight: '900' },
  stepNumberActive: { color: '#001407' },
  stepLabel: { color: '#b2bfd1', fontSize: 10, textAlign: 'center', marginTop: 9 },
  stepLabelActive: { color: C.green, fontWeight: '900' },
  stepLine: { flex: 1, maxWidth: 100, height: 1, backgroundColor: '#526070', marginTop: 21 },
  stepLineActive: { backgroundColor: C.green },
  balancePanel: { minHeight: 126, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balancePanelCompact: { alignItems: 'flex-start', flexDirection: 'column', gap: 17 },
  balanceIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  balanceCopy: { flex: 1, minWidth: 0, marginLeft: 14 },
  balanceTitle: { color: C.green, fontSize: 14, fontWeight: '900' },
  balanceMain: { color: '#fff', fontWeight: '900', marginTop: 6 },
  balanceSub: { color: C.muted, fontSize: 11, marginTop: 4 },
  regionSummary: { flexDirection: 'row', alignItems: 'center', marginLeft: 18 },
  regionName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  regionSub: { color: C.muted, fontSize: 10, marginTop: 4 },
  contentPanel: { marginTop: 18, padding: 18 },
  sectionTitle: { color: C.green, fontSize: 16, fontWeight: '900', letterSpacing: .3 },
  divider: { height: 1, backgroundColor: C.borderSoft, marginTop: 14 },
  assetRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 4 },
  assetBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  assetSelected: { backgroundColor: 'rgba(32,239,112,.05)' },
  assetBadge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  assetMark: { color: '#fff', fontSize: 24, fontWeight: '900' },
  assetCopy: { flex: 1, minWidth: 0 },
  assetSymbol: { color: '#fff', fontSize: 14, fontWeight: '900' },
  assetName: { color: C.muted, fontSize: 11, marginTop: 4 },
  assetNumbers: { alignItems: 'flex-end', maxWidth: '36%', marginLeft: 8 },
  assetBalance: { color: '#fff', fontSize: 12 },
  assetValue: { color: C.muted, fontSize: 10, marginTop: 4 },
  assetArrow: { color: C.green, fontSize: 27, marginLeft: 8 },
  helper: { color: C.muted, fontSize: 11, marginTop: 12 },
  warning: { color: C.yellow, fontSize: 11, marginTop: 12, lineHeight: 17 },
  selectedAssetHeader: { minHeight: 72, flexDirection: 'row', alignItems: 'center', marginTop: 17, borderBottomWidth: 1, borderBottomColor: C.borderSoft, paddingBottom: 15 },
  selectedAssetTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  changeAsset: { color: C.blue, fontSize: 12, fontWeight: '800' },
  amountBox: { minHeight: 90, marginTop: 18, borderWidth: 1, borderColor: C.green, borderRadius: 13, backgroundColor: C.panel2, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  amountInput: { flex: 1, minWidth: 0, color: '#fff', fontSize: 34, fontWeight: '800', outlineStyle: 'none' } as any,
  amountSymbol: { color: C.green, fontSize: 18, fontWeight: '900', marginLeft: 10 },
  percentRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  percentButton: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: C.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  percentText: { color: C.green, fontSize: 12, fontWeight: '900' },
  reviewBox: { marginTop: 17, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel2, paddingHorizontal: 16 },
  reviewRow: { minHeight: 58, borderBottomWidth: 1, borderBottomColor: C.borderSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 15 },
  reviewLabel: { color: C.muted, fontSize: 12 },
  reviewValue: { color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'right', flexShrink: 1 },
  reviewNote: { color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 14 },
  feedback: { color: C.green, fontSize: 11, lineHeight: 17, marginTop: 12 },
  backEdit: { alignSelf: 'center', marginTop: 15, padding: 8 },
  backEditText: { color: C.blue, fontSize: 12, fontWeight: '800' },
  infoPanel: { minHeight: 82, marginTop: 18, padding: 15, flexDirection: 'row', alignItems: 'center' },
  infoText: { flex: 1, minWidth: 0, color: '#d5deea', fontSize: 11, lineHeight: 18, marginLeft: 13 },
});
