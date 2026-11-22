import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { C, NomadGlyph } from '../ui/NomadShell';
import { ReqriumBadge } from './ReqriumBadge';

export type TabId = 'wallet' | 'reqrium' | 'guardian-trader' | 'syaxio' | 'more';

const TABS: Array<{ id: TabId; label: string; glyph: 'wallet' | 'swap' | 'insights' | 'settings' | null }> = [
  { id: 'wallet', label: 'Wallet', glyph: 'wallet' },
  { id: 'reqrium', label: 'Reqrium', glyph: null },
  { id: 'guardian-trader', label: 'Guardian', glyph: 'swap' },
  { id: 'syaxio', label: 'Syaxio', glyph: 'insights' },
  { id: 'more', label: 'More', glyph: 'settings' },
];

/**
 * Bottom bar shared by the main screens: the wallet, the three Arkrilium apps, and "More".
 * Switching tabs resets the stack, so the bar always behaves like a tab bar.
 */
export function AppTabBar({ active }: { active: TabId }) {
  const navigation = useNavigation<any>();

  const go = (id: TabId) => {
    if (id === active) return;
    const route =
      id === 'wallet' ? { name: 'Portfolio' } : id === 'more' ? { name: 'More' } : { name: 'EcosystemApp', params: { appId: id } };
    navigation.reset({ index: 0, routes: [route] });
  };

  return (
    <View style={s.tabBar}>
      {TABS.map((tab) => {
        const on = tab.id === active;
        return (
          <Pressable key={tab.id} accessibilityRole="button" accessibilityLabel={tab.label} onPress={() => go(tab.id)} style={s.bar}>
            {tab.glyph ? <NomadGlyph kind={tab.glyph} color={on ? C.green : C.muted2} size={22} /> : <ReqriumBadge size={22} />}
            <Text style={[s.barText, on && { color: C.green }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.borderSoft, backgroundColor: C.panel, paddingVertical: 8 },
  bar: { flex: 1, alignItems: 'center', paddingVertical: 4, gap: 3 },
  barText: { color: C.muted2, fontSize: 11, fontWeight: '700' },
});
