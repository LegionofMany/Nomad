import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadTravel, useNomadWallet } from '../nomad';
import type { NomadAsset } from '../nomad';

type Asset = {
  symbol: string;
  name: string;
  balance: string;
  value: string;
  icon: string;
  color: string;
};

const fallbackAssets: Asset[] = [
  { symbol: 'USDT (TRC20)', name: 'Tether', balance: '1,250.00 USDT', value: '$1,250.00', icon: '₮', color: '#33d790' },
  { symbol: 'USDC (ERC20)', name: 'USD Coin', balance: '750.50 USDC', value: '$750.50', icon: '$', color: '#1684ff' },
  { symbol: 'BTC', name: 'Bitcoin', balance: '0.025468 BTC', value: '$1,675.22', icon: '₿', color: '#ff9900' },
  { symbol: 'ETH', name: 'Ethereum', balance: '0.5234 ETH', value: '$1,234.11', icon: '◆', color: '#627eea' },
  { symbol: 'DAI (ERC20)', name: 'Dai Stablecoin', balance: '300.00 DAI', value: '$300.00', icon: 'D', color: '#f5ac25' },
];

const bottomItems = [
  { label: 'Home', icon: '⌂', route: 'Portfolio' },
  { label: 'Wallets', icon: '▣', route: 'Wallets' },
  { label: 'Travel', icon: '✈', route: 'TravelMode', active: true },
  { label: 'Security', icon: '♢', route: 'SecurityCenter' },
  { label: 'More', icon: '•••', route: 'Settings' },
];

const tokenVisuals: Record<string, { icon: string; color: string }> = {
  USDT: { icon: '₮', color: '#33d790' },
  USDC: { icon: '$', color: '#1684ff' },
  BTC: { icon: '₿', color: '#ff9900' },
  ETH: { icon: '◆', color: '#627eea' },
  DAI: { icon: 'D', color: '#f5ac25' },
  HBAR: { icon: 'H', color: '#6b42ff' },
  XRP: { icon: '×', color: '#2c2f35' },
  XLM: { icon: '≋', color: '#187bff' },
};

function toTopUpAsset(asset: NomadAsset): Asset {
  const baseSymbol = asset.symbol.toUpperCase();
  const visual = tokenVisuals[baseSymbol] ?? { icon: baseSymbol.slice(0, 1), color: '#1684ff' };
  const network = asset.network && asset.network !== 'Nomad' ? ` (${asset.network})` : '';

  return {
    symbol: `${asset.symbol}${network}`,
    name: asset.name,
    balance: `${asset.balance} ${asset.symbol}`,
    value: asset.fiatValueUsd,
    icon: visual.icon,
    color: visual.color,
  };
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{
      borderWidth: 1,
      borderColor: '#123447',
      borderRadius: 18,
      backgroundColor: 'rgba(3,17,26,0.94)',
      padding: 18,
    }, style]}>
      {children}
    </View>
  );
}

function Stepper() {
  const steps = [
    { number: '1', label: 'Select Asset', active: true },
    { number: '2', label: 'Enter Amount' },
    { number: '3', label: 'Review & Confirm' },
  ];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 26, marginBottom: 22 }}>
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <View style={{ alignItems: 'center', width: 116 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: step.active ? '#19e45f' : '#4e5866',
              backgroundColor: step.active ? '#19d957' : 'transparent',
            }}>
              <Text style={{ color: step.active ? '#001307' : '#d8e1ea', fontSize: 19, fontWeight: '900' }}>{step.number}</Text>
            </View>
            <Text style={{ color: step.active ? '#19e45f' : '#e7ecf4', fontSize: 18, fontWeight: step.active ? '900' : '500', marginTop: 14, textAlign: 'center' }}>
              {step.label}
            </Text>
          </View>
          {index < steps.length - 1 && <View style={{ height: 1, width: 86, backgroundColor: '#6c6f77', marginTop: 24, opacity: 0.6 }} />}
        </React.Fragment>
      ))}
    </View>
  );
}

function BalanceCard({ balance, region }: { balance: string; region: string }) {
  return (
    <Card style={{ borderColor: '#18b653', backgroundColor: 'rgba(0,42,25,0.42)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Text style={{ color: '#19e45f', fontSize: 72, marginRight: 24 }}>▰</Text>
        <View>
          <Text style={{ color: '#19e45f', fontSize: 21, fontWeight: '900' }}>Travel Pocket Balance</Text>
          <Text style={{ color: 'white', fontSize: 42, fontWeight: '900', marginTop: 10 }}>{balance}</Text>
          <Text style={{ color: '#d8dce6', fontSize: 23, marginTop: 4 }}>USD Value</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: '#19e45f', fontSize: 54, marginRight: 18 }}>◎</Text>
        <View>
          <Text style={{ color: 'white', fontSize: 27, fontWeight: '800' }}>{region}</Text>
          <Text style={{ color: '#d3d8e0', fontSize: 20, marginTop: 4 }}>Active Region</Text>
        </View>
      </View>
    </Card>
  );
}

function AssetIcon({ asset }: { asset: Asset }) {
  return (
    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: asset.color, alignItems: 'center', justifyContent: 'center', marginRight: 22 }}>
      <Text style={{ color: 'white', fontSize: 39, fontWeight: '900' }}>{asset.icon}</Text>
    </View>
  );
}

function AssetRow({ asset, isLast }: { asset: Asset; isLast?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Select ${asset.symbol}`} style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 20,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: '#193341',
    }}>
      <AssetIcon asset={asset} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: 'white', fontSize: 25, fontWeight: '900' }}>{asset.symbol}</Text>
        <Text style={{ color: '#c8ced8', fontSize: 24, marginTop: 6 }}>{asset.name}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', marginRight: 18 }}>
        <Text style={{ color: 'white', fontSize: 24 }}>{asset.balance}</Text>
        <Text style={{ color: '#d2d6df', fontSize: 23, marginTop: 8 }}>{asset.value}</Text>
      </View>
      <Text style={{ color: '#19e45f', fontSize: 45, fontWeight: '400' }}>›</Text>
    </Pressable>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 0, paddingBottom: 0 }}>
      <View style={{ height: 120, borderRadius: 24, borderWidth: 1, borderColor: '#123447', backgroundColor: 'rgba(4,16,24,0.98)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
        {bottomItems.map((item) => (
          <Pressable key={item.label} onPress={() => navigation.navigate(item.route)} style={{ alignItems: 'center', minWidth: 80 }}>
            <Text style={{ color: item.active ? '#19e45f' : '#e0d9e2', fontSize: 39, lineHeight: 43 }}>{item.icon}</Text>
            <Text style={{ color: item.active ? '#19e45f' : '#e0d9e2', fontSize: 20, marginTop: 7 }}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function TopUpTravelPocketScreen() {
  const navigation = useNavigation<any>();
  const { assets: walletAssets, loading: walletLoading, error: walletError } = useNomadWallet();
  const { travelPocket } = useNomadTravel();
  const topUpAssets = useMemo(() => (walletAssets.length > 0 ? walletAssets.map(toTopUpAsset) : fallbackAssets), [walletAssets]);

  return (
    <View style={{ flex: 1, backgroundColor: '#02070c' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 28, paddingBottom: 152 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()}>
            <Text style={{ color: 'white', fontSize: 45 }}>‹</Text>
          </Pressable>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 31, fontWeight: '900' }}>Top Up Travel Pocket</Text>
            <Text style={{ color: '#d7d9e0', fontSize: 23, marginTop: 6 }}>Step 1 of 3</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', width: 88, justifyContent: 'flex-end' }}>
            <Text style={{ color: '#19e45f', fontSize: 27, marginRight: 12 }}>Help</Text>
            <Text style={{ color: '#19e45f', fontSize: 29, fontWeight: '900' }}>?</Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: '#26313a', marginTop: 18 }} />
        <Stepper />
        <BalanceCard balance={travelPocket.pocketBalanceFiat ?? '$1,240.75'} region={travelPocket.regionInput ?? 'Europe'} />

        <Card style={{ marginTop: 24 }}>
          <Text style={{ color: '#19e45f', fontSize: 26, fontWeight: '900', marginBottom: 18 }}>SELECT ASSET TO TOP UP</Text>
          <View style={{ height: 1, backgroundColor: '#1f3540', marginBottom: 0 }} />
          {topUpAssets.map((asset, index) => <AssetRow key={`${asset.symbol}-${index}`} asset={asset} isLast={index === topUpAssets.length - 1} />)}
          {walletLoading ? <Text style={{ color: '#d2d6df', fontSize: 18, marginTop: 14 }}>Loading live wallet assets…</Text> : null}
          {walletError ? <Text style={{ color: '#ffb347', fontSize: 18, marginTop: 14 }}>Using approved preview assets until wallet data is available.</Text> : null}
        </Card>

        <Card style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', paddingVertical: 26 }}>
          <Text style={{ color: '#1684ff', fontSize: 48, marginRight: 24 }}>ⓘ</Text>
          <Text style={{ color: '#d9dde4', fontSize: 24, lineHeight: 36, flex: 1 }}>
            Top up your Travel Pocket with stable-value assets. They will be converted to local stable value for spending while you travel.
          </Text>
        </Card>

        <Pressable accessibilityRole="button" accessibilityLabel="Continue" style={{ marginTop: 34, height: 86, borderRadius: 12, backgroundColor: '#12d650', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#001707', fontSize: 29, fontWeight: '900' }}>Continue</Text>
        </Pressable>
      </ScrollView>
      <BottomNav />
    </View>
  );
}
