/**
 * Wallet home for phones (the "Portfolio" route on Android and iOS).
 * Account header, network, balance, Send / Receive, assets and activity, bottom tabs.
 * The web preview keeps the original Portfolio screen.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAppState } from '../state/appState';
import { useNomadWallet } from '../nomad/hooks/useNomadWallet';
import { C, NomadGlyph } from '../ui/NomadShell';

type Tab = 'assets' | 'activity';

const shortAddress = (a: string) => (a.length > 18 ? `${a.slice(0, 10)}…${a.slice(-6)}` : a);

export default function WalletHomeScreen() {
  const navigation = useNavigation<any>();
  const { lockWallet } = useAppState();
  const { totalBalance, assets, loading, error, refresh, getReceiveAddress } = useNomadWallet();
  const [address, setAddress] = useState('');
  const [showFull, setShowFull] = useState(false);
  const [tab, setTab] = useState<Tab>('assets');

  useEffect(() => {
    let cancelled = false;
    getReceiveAddress('BTC')
      .then((a) => { if (!cancelled) setAddress(a); })
      .catch(() => { if (!cancelled) setAddress(''); });
    return () => { cancelled = true; };
  }, [getReceiveAddress]);

  const main = assets.find((a) => /btc/i.test(a.symbol)) ?? assets[0];
  const mainAmount = main ? `${main.balance} ${main.symbol}` : totalBalance;

  const Action = ({ label, icon, route, off }: { label: string; icon: any; route?: string; off?: boolean }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={off}
      onPress={() => route && navigation.navigate(route)}
      style={[s.action, off && { opacity: 0.4 }]}
    >
      <View style={s.actionIcon}><NomadGlyph kind={icon} color="#fff" size={22} /></View>
      <Text style={s.actionLabel}>{off ? `${label} · soon` : label}</Text>
    </Pressable>
  );

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor={C.green} />}
      >
        <View style={s.header}>
          <View style={s.account}>
            <View style={s.avatar}><Text style={s.avatarText}>N</Text></View>
            <View>
              <Text style={s.accountName}>Account 1</Text>
              <View style={s.networkPill}><View style={s.dot} /><Text style={s.networkText}>Bitcoin Testnet</Text></View>
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={() => void lockWallet()} style={s.lockBtn}><Text style={s.lockText}>Lock</Text></Pressable>
        </View>

        {address ? (
          <Pressable onPress={() => setShowFull(!showFull)} style={s.addressChip}>
            <Text selectable style={s.addressText}>{showFull ? address : shortAddress(address)}</Text>
            <Text style={s.addressHint}>{showFull ? 'tap to shorten' : 'tap to show full'}</Text>
          </Pressable>
        ) : null}

        <View style={s.balanceBox}>
          <Text style={s.balance}>{mainAmount}</Text>
          <Text style={s.balanceSub}>{main ? 'Test coins, no real value' : 'Fund this wallet from a testnet faucet'}</Text>
        </View>

        <View style={s.actions}>
          <Action label="Receive" icon="receive" route="ReceiveBitcoin" />
          <Action label="Send" icon="send" route="SendBitcoin" />
          <Action label="Swap" icon="swap" off />
        </View>

        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

        <View style={s.tabs}>
          {(['assets', 'activity'] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabOn]}>
              <Text style={[s.tabText, tab === t && s.tabTextOn]}>{t === 'assets' ? 'Assets' : 'Activity'}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'assets' ? (
          assets.length ? (
            assets.map((a, i) => (
              <View key={`${a.symbol}-${i}`} style={s.row}>
                <View style={s.coin}><Text style={s.coinText}>{a.symbol.slice(0, 1)}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{a.name ?? a.symbol}</Text>
                  <Text style={s.rowSub}>{a.network ?? 'Testnet'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.rowTitle}>{a.balance} {a.symbol}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>{loading ? 'Loading…' : 'No assets yet'}</Text>
              <Text style={s.emptySub}>Tap Receive to see your address, then use a Bitcoin testnet faucet to get free test coins.</Text>
            </View>
          )
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No activity yet</Text>
            <Text style={s.emptySub}>Transactions you send and receive will appear here.</Text>
          </View>
        )}
      </ScrollView>

      <View style={s.tabBar}>
        {([['Wallet', 'wallet', 'Portfolio'], ['Travel', 'travel', 'TravelMode'], ['Security', 'security', 'SecurityCenter'], ['Settings', 'settings', 'Settings']] as const).map(([label, icon, route]) => (
          <Pressable key={label} accessibilityRole="button" onPress={() => route !== 'Portfolio' && navigation.navigate(route)} style={s.bar}>
            <NomadGlyph kind={icon} color={route === 'Portfolio' ? C.green : C.muted2} size={22} />
            <Text style={[s.barText, route === 'Portfolio' && { color: C.green }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  account: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  accountName: { color: '#fff', fontSize: 17, fontWeight: '800' },
  networkPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.orange },
  networkText: { color: C.muted, fontSize: 12 },
  lockBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  lockText: { color: C.blue, fontSize: 13, fontWeight: '800' },
  addressChip: { alignSelf: 'center', marginTop: 20, borderRadius: 14, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.borderSoft, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', maxWidth: '100%' },
  addressText: { color: C.muted, fontSize: 12 },
  addressHint: { color: C.muted2, fontSize: 10, marginTop: 2 },
  balanceBox: { alignItems: 'center', marginTop: 26, marginBottom: 26 },
  balance: { color: '#fff', fontSize: 36, fontWeight: '900', textAlign: 'center' },
  balanceSub: { color: C.muted2, fontSize: 13, marginTop: 6, textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 22, marginBottom: 22 },
  action: { alignItems: 'center', width: 76 },
  actionIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  errorBox: { borderWidth: 1, borderColor: C.red, backgroundColor: 'rgba(255,75,75,.12)', borderRadius: 12, padding: 12, marginBottom: 14 },
  errorText: { color: '#ff9a9a', fontSize: 13, lineHeight: 19 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.borderSoft, marginBottom: 6 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: C.blue },
  tabText: { color: C.muted2, fontSize: 15, fontWeight: '700' },
  tabTextOn: { color: C.blue },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  coin: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  coinText: { color: C.blue, fontSize: 17, fontWeight: '900' },
  rowTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  rowSub: { color: C.muted2, fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 12 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  emptySub: { color: C.muted2, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 8 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.borderSoft, backgroundColor: C.panel, paddingVertical: 8 },
  bar: { flex: 1, alignItems: 'center', paddingVertical: 4, gap: 3 },
  barText: { color: C.muted2, fontSize: 11, fontWeight: '700' },
});
