import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadSwap } from '../nomad';
import {
  BottomNav,
  C,
  Divider,
  NomadPage,
  PageHeader,
  Panel,
  PrimaryButton,
  RoundIcon,
  SectionLabel,
  useNomadLayout,
} from '../ui/NomadShell';

type DetailRow = {
  icon: string;
  label: string;
  value: string;
  info?: boolean;
  onPress?: () => void;
};

function PercentButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.percentButton, pressed && { opacity: .7 }]}>
      <Text style={[styles.percentText, label === 'MAX' && { color: C.blue }]}>{label}</Text>
    </Pressable>
  );
}

function TokenBox({
  label,
  labelColor,
  balance,
  symbol,
  name,
  amount,
  usd,
  badge,
  tint,
  change,
}: {
  label: string;
  labelColor: string;
  balance: string;
  symbol: string;
  name: string;
  amount: string;
  usd: string;
  badge: string;
  tint: string;
  change?: string;
}) {
  const { compact } = useNomadLayout();
  return (
    <View>
      <View style={styles.tokenHeader}>
        <SectionLabel color={labelColor}>{label}</SectionLabel>
        <Text style={styles.balanceText}>{balance}</Text>
      </View>
      <View style={[styles.tokenBox, compact && styles.tokenBoxCompact]}>
        <RoundIcon symbol={badge} color="#fff" size={compact ? 52 : 60} filled />
        <View style={styles.tokenIdentity}>
          <Text style={styles.tokenSymbol}>{symbol} <Text style={styles.chevronSmall}>⌄</Text></Text>
          <Text style={styles.tokenName}>{name}</Text>
        </View>
        <View style={styles.tokenAmountWrap}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.tokenAmount, { fontSize: compact ? 29 : 37 }]}>{amount}</Text>
          <Text style={styles.tokenUsd}>≈ {usd}{change ? <Text style={styles.negative}> {change}</Text> : null}</Text>
        </View>
      </View>
    </View>
  );
}

function Detail({ row, last }: { row: DetailRow; last: boolean }) {
  return (
    <Pressable onPress={row.onPress} style={[styles.detailRow, !last && styles.detailBorder]}>
      <Text style={styles.detailIcon}>{row.icon}</Text>
      <Text style={styles.detailLabel}>{row.label}{row.info ? <Text style={styles.detailInfo}> ⓘ</Text> : null}</Text>
      <Text style={styles.detailValue}>{row.value}</Text>
      {row.onPress ? <Text style={styles.detailChevron}>›</Text> : null}
    </Pressable>
  );
}

export default function SwapScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { quote, loading, error, refreshQuote, createDraft } = useNomadSwap();

  const details: DetailRow[] = [
    { icon: '⇅', label: 'Network', value: quote.network, onPress: () => undefined },
    { icon: '▥', label: 'Network Fee', value: quote.networkFee, info: true, onPress: () => undefined },
    { icon: '◷', label: 'Estimated Time', value: quote.estimatedTime },
    { icon: '☷', label: 'Slippage Tolerance', value: quote.slippageTolerance, info: true, onPress: () => undefined },
  ];

  return (
    <NomadPage>
      <PageHeader title="Swap" subtitle="Swap tokens instantly across chains" icon="⇄" color={C.blue} help />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text style={styles.loading}>Loading best quote…</Text> : null}

      <Panel style={styles.promo}>
        <Text style={styles.promoIcon}>⇄</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.promoTitle}>Best Rates. Secure. Low Fees.</Text>
          <Text style={styles.promoSub}>Powered by <Text style={styles.promoLink}>Arkrilium Liquidity Protocol</Text></Text>
        </View>
      </Panel>

      <Panel style={styles.swapPanel}>
        <TokenBox
          label="1. You Pay"
          labelColor={C.blue}
          balance={quote.fromBalance}
          symbol={quote.fromAsset}
          name="Bitcoin"
          amount={quote.fromAmount}
          usd={`${quote.fromValueUsd} USD`}
          badge="₿"
          tint="#ff9f1c"
        />

        <View style={styles.percentRow}>
          <PercentButton label="25%" onPress={() => void refreshQuote('BTC', 'HBAR', '0.0025')} />
          <PercentButton label="50%" onPress={() => void refreshQuote('BTC', 'HBAR', '0.005')} />
          <PercentButton label="75%" onPress={() => void refreshQuote('BTC', 'HBAR', '0.0075')} />
          <PercentButton label="MAX" onPress={() => void refreshQuote('BTC', 'HBAR', '0.01')} />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLine} />
          <Pressable onPress={() => void refreshQuote('HBAR', 'BTC', quote.toAmount)} style={styles.switchButton}>
            <Text style={styles.switchIcon}>↕</Text>
          </Pressable>
          <View style={styles.switchLine} />
        </View>

        <TokenBox
          label="2. You Receive"
          labelColor={C.green}
          balance={quote.toBalance}
          symbol={quote.toAsset}
          name="Hedera"
          amount={quote.toAmount}
          usd={`${quote.toValueUsd} USD`}
          change="(-0.84%)"
          badge="H"
          tint="#6c4dff"
        />

        <View style={styles.rateBox}>
          <Text style={styles.rateText}>{quote.rateLabel} <Text style={styles.rateChart}>⌁</Text></Text>
          <View style={styles.rateRight}>
            <Text style={styles.bestRate}>◇ Best rate</Text>
            <Text style={styles.priceImpact}>Est. Price Impact</Text>
          </View>
          <Text style={styles.impactValue}>{quote.priceImpact}</Text>
        </View>
      </Panel>

      <Panel style={styles.detailPanel}>
        {details.map((row, index) => <Detail key={row.label} row={row} last={index === details.length - 1} />)}
      </Panel>

      <PrimaryButton
        icon="⇄"
        label={quote.status === 'draft_created' ? 'Swap Draft Ready' : 'Swap Now'}
        subtitle="Secure & Encrypted"
        onPress={() => void createDraft()}
      />

      <View style={styles.trustRow}>
        <Text style={styles.trustShield}>◇</Text>
        <Text style={styles.trustText}>Protected by <Text style={styles.trustLink}>Arkrilium</Text>  |  Audited  •  Non-Custodial  •  Secure</Text>
      </View>

      <BottomNav
        active="Swap"
        items={[
          ['⌂', 'Home', 'Portfolio'],
          ['▣', 'Wallets', 'Wallets'],
          ['⇄', 'Swap', 'Swap'],
          ['⊞', 'Travel', 'TravelMode'],
          ['◇', 'Security', 'SecurityCenter'],
        ]}
      />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  error: { color: C.red, marginBottom: 10 },
  loading: { color: C.muted, marginBottom: 10 },
  promo: { minHeight: 86, padding: 17, flexDirection: 'row', alignItems: 'center' },
  promoIcon: { color: C.blue, fontSize: 48, fontWeight: '900', marginHorizontal: 18, textShadowColor: C.blue, textShadowRadius: 16 },
  promoTitle: { color: '#fff', fontSize: 19, fontWeight: '900' },
  promoSub: { color: '#c5d0df', fontSize: 14, marginTop: 7 },
  promoLink: { color: C.blue },
  swapPanel: { marginTop: 18, padding: 18, borderColor: '#086bd1' },
  tokenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  balanceText: { color: C.muted, fontSize: 13, textAlign: 'right' },
  tokenBox: { minHeight: 112, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.panel2, padding: 14, flexDirection: 'row', alignItems: 'center' },
  tokenBoxCompact: { minHeight: 104, paddingHorizontal: 11 },
  tokenIdentity: { flex: 1, minWidth: 0, marginLeft: 13 },
  tokenSymbol: { color: '#fff', fontSize: 22, fontWeight: '900' },
  chevronSmall: { color: '#91a7c1' },
  tokenName: { color: C.muted, fontSize: 13, marginTop: 6 },
  tokenAmountWrap: { maxWidth: '45%', alignItems: 'flex-end' },
  tokenAmount: { color: '#fff', fontWeight: '900', letterSpacing: -.5 },
  tokenUsd: { color: C.muted, fontSize: 13, marginTop: 7 },
  negative: { color: C.red },
  percentRow: { flexDirection: 'row', gap: 9, marginTop: 14 },
  percentButton: { flex: 1, minWidth: 0, minHeight: 43, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.panel2, alignItems: 'center', justifyContent: 'center' },
  percentText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  switchLine: { flex: 1, height: 1, backgroundColor: C.blue },
  switchButton: { width: 56, height: 56, borderRadius: 28, marginHorizontal: 16, borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(0,80,170,.55)', alignItems: 'center', justifyContent: 'center' },
  switchIcon: { color: '#31a6ff', fontSize: 29, fontWeight: '900' },
  rateBox: { minHeight: 70, marginTop: 14, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.panel2, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  rateText: { color: '#fff', fontSize: 16, fontWeight: '800', flex: 1 },
  rateChart: { color: C.green },
  rateRight: { alignItems: 'flex-end', marginLeft: 8 },
  bestRate: { color: C.green, fontSize: 13, fontWeight: '900' },
  priceImpact: { color: C.muted, fontSize: 10, marginTop: 6 },
  impactValue: { color: '#fff', fontSize: 14, marginLeft: 12 },
  detailPanel: { marginTop: 18, paddingHorizontal: 18 },
  detailRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center' },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  detailIcon: { color: C.blue, fontSize: 27, width: 48, textAlign: 'center' },
  detailLabel: { color: '#fff', fontSize: 16, flex: 1 },
  detailInfo: { color: C.muted },
  detailValue: { color: '#dbe4f0', fontSize: 14, textAlign: 'right' },
  detailChevron: { color: '#88a4c6', fontSize: 29, marginLeft: 10 },
  trustRow: { marginTop: 20, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  trustShield: { color: C.green, fontSize: 20, marginRight: 8 },
  trustText: { color: C.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  trustLink: { color: C.blue },
});
