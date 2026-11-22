/** "More" tab: Zonycs plus the wallet's own areas (Travel, Security, Settings, protocols). */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { AppTabBar } from '../components/AppTabBar';
import { C, NomadGlyph } from '../ui/NomadShell';

type Item = { label: string; sub: string; glyph: 'travel' | 'security' | 'settings' | 'swap' | 'insights'; go: (nav: any) => void };

const ITEMS: Item[] = [
  { label: 'Zonycs', sub: 'Marketplace · buy and sell with crypto', glyph: 'swap', go: (n) => n.navigate('EcosystemApp', { appId: 'zonycs' }) },
  { label: 'Travel', sub: 'Travel mode and spending pocket', glyph: 'travel', go: (n) => n.navigate('TravelMode') },
  { label: 'Security', sub: 'Device checks, freeze, recovery', glyph: 'security', go: (n) => n.navigate('SecurityCenter') },
  { label: 'Arkrilium protocols', sub: 'How the apps connect', glyph: 'insights', go: (n) => n.navigate('VoltaireProtocols') },
  { label: 'Settings', sub: 'Wallet and app settings', glyph: 'settings', go: (n) => n.navigate('Settings') },
];

export default function MoreScreen() {
  const navigation = useNavigation<any>();
  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>More</Text>
        {ITEMS.map((item) => (
          <Pressable key={item.label} accessibilityRole="button" onPress={() => item.go(navigation)} style={s.row}>
            <View style={s.icon}><NomadGlyph kind={item.glyph} color="#fff" size={20} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{item.label}</Text>
              <Text style={s.sub}>{item.sub}</Text>
            </View>
            <Text style={s.chev}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
      <AppTabBar active="more" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 28 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 12, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  label: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sub: { color: C.muted2, fontSize: 12, marginTop: 2 },
  chev: { color: C.muted2, fontSize: 22 },
});
