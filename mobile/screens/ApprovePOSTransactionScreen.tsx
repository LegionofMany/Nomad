import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadTravel, useNomadWallet } from '../nomad';
import {
  C,
  NomadPage,
  PageHeader,
  Panel,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

type DraftState = 'idle' | 'creating' | 'created' | 'failed';

type PaymentAsset = {
  symbol: string;
  name: string;
  icon: string;
  color: string;
  amount: string;
  fee: string;
};

type MerchantContext = {
  name: string;
  terminal: string;
  location: string;
  localAmount: string;
};

const paymentAssets: PaymentAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: '#ff9900', amount: '0.000245', fee: '0.000005' },
  { symbol: 'HBAR', name: 'Hedera', icon: 'H', color: '#6b42ff', amount: '126.00', fee: '0.80' },
  { symbol: 'USDC', name: 'USD Coin', icon: '$', color: '#1684ff', amount: '15.75', fee: '0.12' },
];

function merchantForRegion(regionInput?: string): MerchantContext {
  const region = (regionInput || 'Global').toLowerCase();
  if (region.includes('japan')) return { name: 'Coffee Corner Shibuya', terminal: 'NOMAD POS • Tokyo', location: 'Shibuya, Tokyo, Japan', localAmount: '¥2,420' };
  if (region.includes('canada')) return { name: 'Coffee Corner', terminal: 'NOMAD POS • Canada', location: 'Calgary, Alberta, Canada', localAmount: 'C$21.50' };
  if (region.includes('europe')) return { name: 'Café Central', terminal: 'NOMAD POS • Europe', location: 'Regional merchant terminal', localAmount: '€14.50' };
  if (region.includes('united kingdom')) return { name: 'Corner Café', terminal: 'NOMAD POS • UK', location: 'London, United Kingdom', localAmount: '£12.50' };
  if (region.includes('nigeria')) return { name: 'City Café', terminal: 'NOMAD POS • Nigeria', location: 'Lagos, Nigeria', localAmount: '₦25,200' };
  if (region.includes('australia')) return { name: 'Harbour Coffee', terminal: 'NOMAD POS • Australia', location: 'Sydney, Australia', localAmount: 'A$24.00' };
  if (region.includes('united states')) return { name: 'Coffee Corner', terminal: 'NOMAD POS • USA', location: 'Austin, Texas, USA', localAmount: '$15.75' };
  return { name: 'Verified Local Merchant', terminal: 'NOMAD POS Terminal', location: `${regionInput || 'Selected travel region'}`, localAmount: 'Local 15.75' };
}

function DetailRow({ label, value, subValue, accent, leading, onPress, last }: { label: string; value: string; subValue?: string; accent?: boolean; leading?: React.ReactNode; onPress?: () => void; last?: boolean }) {
  const body = (
    <View style={[styles.detailRow, !last && styles.rowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueWrap}>
        <View style={styles.detailValueLine}>{leading}<Text style={[styles.detailValue, accent && { color: C.green }]}>{value}</Text>{onPress ? <Text style={styles.chevron}>›</Text> : null}</View>
        {subValue ? <Text style={styles.detailSub}>{subValue}</Text> : null}
      </View>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

function SecurityRow({ icon, title, subtitle, status, last }: { icon: string; title: string; subtitle: string; status: string; last?: boolean }) {
  return (
    <View style={[styles.securityRow, !last && styles.rowBorder]}>
      <RoundIcon symbol={icon} color={C.green} size={42} filled />
      <View style={styles.securityCopy}><Text style={styles.securityTitle}>{title}</Text><Text style={styles.securitySub}>{subtitle}</Text></View>
      <Text style={styles.securityStatus}>{status}</Text>
      <Text style={styles.securityCheck}>✓</Text>
    </View>
  );
}

export default function ApprovePOSTransactionScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { totalBalance, createTransaction, error } = useNomadWallet();
  const { travelPocket } = useNomadTravel();
  const [assetIndex, setAssetIndex] = useState(0);
  const [draftState, setDraftState] = useState<DraftState>('idle');
  const [feedback, setFeedback] = useState('');

  const asset = paymentAssets[assetIndex];
  const merchant = useMemo(() => merchantForRegion(travelPocket.regionInput), [travelPocket.regionInput]);
  const total = asset.symbol === 'BTC'
    ? (Number(asset.amount) + Number(asset.fee)).toFixed(6)
    : (Number(asset.amount) + Number(asset.fee)).toFixed(2);

  const cycleAsset = () => {
    if (draftState === 'creating') return;
    setAssetIndex((index) => (index + 1) % paymentAssets.length);
    setDraftState('idle');
    setFeedback('');
  };

  const handleApprove = async () => {
    if (draftState === 'creating' || draftState === 'created') return;
    try {
      setDraftState('creating');
      setFeedback('Creating a wallet-owned approval draft…');
      const draft = await createTransaction({
        fromAsset: asset.symbol,
        toAddress: 'NOMAD_POS_ID_7F3A_9C2B',
        amount: asset.amount,
        networkFee: asset.fee,
        memo: `${merchant.name} POS approval in ${travelPocket.regionInput || 'selected region'}`,
        intent: 'pos_approval',
        requiresUserApproval: true,
        createdBy: 'nomad_overlay',
      });
      if (draft.status === 'failed') {
        setDraftState('failed');
        setFeedback(draft.failure?.message || 'Unable to create the POS approval draft.');
      } else {
        setDraftState('created');
        setFeedback('POS draft is ready. Final signing remains inside the connected wallet.');
      }
    } catch (err) {
      setDraftState('failed');
      setFeedback(err instanceof Error ? err.message : 'Unable to create the POS approval draft.');
    }
  };

  return (
    <NomadPage maxWidth={900}>
      <PageHeader
        title="Approve POS Transaction"
        subtitle="Tap to Pay"
        icon=")))"
        color={C.green}
        status={false}
        right={<Pressable onPress={() => navigation.goBack()} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>}
      />

      <Panel style={[styles.merchantPanel, compact && styles.merchantPanelCompact]}>
        <View style={styles.nfcArt}><Text style={styles.nfcIcon}>▤</Text><Text style={styles.nfcWaves}>)))</Text></View>
        <View style={styles.merchantCopy}>
          <Text style={styles.connectionLabel}>◇  Secure NFC Connection</Text>
          <Text style={[styles.merchantName, { fontSize: compact ? 27 : 36 }]}>{merchant.name}</Text>
          <Text style={styles.merchantTerminal}>{merchant.terminal}</Text>
          <Text style={styles.merchantLocation}>⌖  {merchant.location}</Text>
        </View>
        <View style={styles.localAmount}><Text style={styles.localAmountLabel}>LOCAL TOTAL</Text><Text style={styles.localAmountValue}>{merchant.localAmount}</Text></View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <Text style={styles.sectionTitle}>TRANSACTION DETAILS</Text>
        <View style={styles.sectionDivider} />
        <DetailRow
          label="Pay With"
          value={`${asset.name} (${asset.symbol})`}
          leading={<View style={[styles.coinBadge, { backgroundColor: asset.color }]}><Text style={styles.coinMark}>{asset.icon}</Text></View>}
          onPress={cycleAsset}
        />
        <DetailRow label="Amount" value={`${asset.amount} ${asset.symbol}`} subValue="≈ $15.75 USD" />
        <DetailRow label="To" value={merchant.name} subValue="NOMAD POS ID: 7F3A…9C2B" />
        <DetailRow label="Network Fee ⓘ" value={`${asset.fee} ${asset.symbol}`} subValue="Calculated by the connected network" />
        <DetailRow label="Total" value={`${total} ${asset.symbol}`} subValue={`≈ $16.07 USD • Wallet ${totalBalance}`} accent last />
      </Panel>

      <Panel style={styles.sectionPanel}>
        <Text style={styles.sectionTitle}>SECURITY CONFIRMATION</Text>
        <View style={styles.sectionDivider} />
        <SecurityRow icon="◇" title="Merchant Verified" subtitle="Verified through Reqrium Safety" status="Verified" />
        <SecurityRow icon="▣" title="Connection Secure" subtitle="Encrypted NFC approval session" status="Secure" />
        <SecurityRow icon="◷" title="Transaction Session" subtitle="Live POS request with expiring context" status="Verified" />
        <SecurityRow icon="▰" title="Balance After Payment" subtitle="Recalculated by the wallet before signing" status="Sufficient" last />
      </Panel>

      <Panel tone={error || draftState === 'failed' ? 'red' : 'yellow'} style={styles.warningPanel}>
        <Text style={[styles.warningIcon, { color: error || draftState === 'failed' ? C.red : C.yellow }]}>{error || draftState === 'failed' ? '!' : '⚠'}</Text>
        <Text style={styles.warningCopy}>{error || feedback || 'Review the merchant, amount and network carefully. Blockchain transactions cannot be reversed after final wallet signing.'}</Text>
      </Panel>

      {draftState === 'created' ? (
        <Pressable onPress={() => navigation.navigate('TravelMode')} style={styles.approvedControl}>
          <View style={styles.approvedKnob}><Text style={styles.approvedCheck}>✓</Text></View>
          <View style={styles.approvalCopy}><Text style={styles.approvalTitle}>Draft Ready for Wallet Review</Text><Text style={styles.approvalSub}>Return to Travel Pocket while final approval remains in the wallet</Text></View>
          <Text style={styles.approvalArrow}>›</Text>
        </Pressable>
      ) : (
        <View style={styles.approvalWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hold to approve payment"
            disabled={draftState === 'creating'}
            delayLongPress={650}
            onLongPress={() => void handleApprove()}
            style={({ pressed }) => [styles.approvalControl, { opacity: pressed ? .82 : 1 }]}
          >
            <View style={styles.approvalKnob}><Text style={styles.approvalKnobArrow}>→</Text></View>
            <View style={styles.approvalCopy}><Text style={styles.approvalTitle}>{draftState === 'creating' ? 'Creating Approval Draft…' : 'Hold to Approve Payment'}</Text><Text style={styles.approvalSub}>Press and hold to create a reviewable wallet draft</Text></View>
          </Pressable>
          <Pressable disabled={draftState === 'creating'} onPress={() => void handleApprove()} style={styles.tapConfirm}><Text style={styles.tapConfirmText}>Or tap to confirm</Text></Pressable>
        </View>
      )}
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  cancelButton: { paddingHorizontal: 10, paddingVertical: 8 },
  cancelText: { color: C.green, fontSize: 13, fontWeight: '800' },
  merchantPanel: { minHeight: 190, padding: 20, flexDirection: 'row', alignItems: 'center' },
  merchantPanelCompact: { flexWrap: 'wrap', alignItems: 'flex-start' },
  nfcArt: { width: 116, height: 116, borderRadius: 58, borderWidth: 1, borderColor: '#2e3b43', alignItems: 'center', justifyContent: 'center', marginRight: 22 },
  nfcIcon: { color: C.green, fontSize: 42 },
  nfcWaves: { position: 'absolute', color: C.green, fontSize: 20, right: 6 },
  merchantCopy: { flex: 1, minWidth: 190 },
  connectionLabel: { color: C.green, fontSize: 12, fontWeight: '800' },
  merchantName: { color: '#fff', fontWeight: '900', marginTop: 13 },
  merchantTerminal: { color: '#d7dfe9', fontSize: 16, marginTop: 7 },
  merchantLocation: { color: C.muted, fontSize: 12, marginTop: 13 },
  localAmount: { alignItems: 'flex-end', marginLeft: 15 },
  localAmountLabel: { color: C.muted, fontSize: 9 },
  localAmountValue: { color: C.green, fontSize: 19, fontWeight: '900', marginTop: 5 },
  sectionPanel: { marginTop: 18, padding: 18 },
  sectionTitle: { color: C.green, fontSize: 15, fontWeight: '900', letterSpacing: .3 },
  sectionDivider: { height: 1, backgroundColor: C.borderSoft, marginTop: 13 },
  detailRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  detailLabel: { color: '#e5e9ef', fontSize: 13, flex: .7 },
  detailValueWrap: { flex: 1.3, alignItems: 'flex-end', minWidth: 0 },
  detailValueLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', minWidth: 0 },
  detailValue: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  detailSub: { color: C.muted, fontSize: 10, textAlign: 'right', marginTop: 5 },
  chevron: { color: C.green, fontSize: 27, marginLeft: 8 },
  coinBadge: { width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  coinMark: { color: '#fff', fontSize: 20, fontWeight: '900' },
  securityRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  securityCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  securityTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  securitySub: { color: C.muted, fontSize: 10, marginTop: 4 },
  securityStatus: { color: C.green, fontSize: 11, fontWeight: '800', marginLeft: 8 },
  securityCheck: { color: C.green, fontSize: 19, marginLeft: 8 },
  warningPanel: { minHeight: 78, marginTop: 18, padding: 16, flexDirection: 'row', alignItems: 'center' },
  warningIcon: { fontSize: 31, fontWeight: '900', marginRight: 15 },
  warningCopy: { flex: 1, color: '#f1e7d6', fontSize: 11, lineHeight: 18 },
  approvalWrap: { marginTop: 22, alignItems: 'center' },
  approvalControl: { width: '100%', minHeight: 91, borderRadius: 46, backgroundColor: 'rgba(13,118,43,.72)', flexDirection: 'row', alignItems: 'center', padding: 8 },
  approvalKnob: { width: 75, height: 75, borderRadius: 38, backgroundColor: '#26dc52', alignItems: 'center', justifyContent: 'center', marginRight: 17 },
  approvalKnobArrow: { color: '#00220a', fontSize: 37 },
  approvalCopy: { flex: 1, minWidth: 0 },
  approvalTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  approvalSub: { color: '#d8e7db', fontSize: 10, lineHeight: 15, marginTop: 5 },
  tapConfirm: { padding: 13 },
  tapConfirmText: { color: C.green, fontSize: 12, fontWeight: '800' },
  approvedControl: { minHeight: 91, marginTop: 22, borderRadius: 46, borderWidth: 1, borderColor: C.green, backgroundColor: 'rgba(13,118,43,.45)', flexDirection: 'row', alignItems: 'center', padding: 8 },
  approvedKnob: { width: 75, height: 75, borderRadius: 38, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginRight: 17 },
  approvedCheck: { color: '#00220a', fontSize: 32, fontWeight: '900' },
  approvalArrow: { color: C.green, fontSize: 31, marginRight: 14 },
});
