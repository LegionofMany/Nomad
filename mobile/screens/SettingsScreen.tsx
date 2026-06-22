import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { NomadBottomNav, NomadCard, NomadHeader } from '../nomad/components';

type Shortcut = {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
};

type SettingRow = {
  title: string;
  subtitle: string;
  icon: string;
  color?: string;
  value?: string;
};

const shortcuts: Shortcut[] = [
  { title: 'Preferences', subtitle: 'App & display', icon: '≛', color: '#1684ff' },
  { title: 'Security', subtitle: 'Manage protection', icon: '▾', color: '#35f883' },
  { title: 'Wallets', subtitle: 'Manage wallets', icon: '▣', color: '#8b5cff' },
  { title: 'Connected Apps', subtitle: 'DApps & services', icon: '⌁', color: '#2af4e4' },
];

const preferenceRows: SettingRow[] = [
  { title: 'Currency & Language', subtitle: 'USD • English', icon: '◎' },
  { title: 'Appearance', subtitle: 'Dark Mode', icon: '◐' },
  { title: 'Notifications', subtitle: 'Push, email, and alerts', icon: '♢' },
  { title: 'Default Network', subtitle: 'Hedera Mainnet', icon: '⬡' },
];

const featureRows: SettingRow[] = [
  { title: 'Travel Pocket', subtitle: 'Manage regions, limits & spending', icon: '▤', color: '#35f883' },
  { title: 'Auto-Convert & Optimize', subtitle: 'Optimize for best rates & lowest fees', icon: '⇄', color: '#35f883', value: 'ON' },
  { title: 'Pay / Spend Settings', subtitle: 'Default currency, receipts & more', icon: '▭', color: '#35f883' },
];

const supportRows: SettingRow[] = [
  { title: 'Help Center', subtitle: 'Guides, FAQs & support', icon: '?' },
  { title: 'Contact Support', subtitle: "We're here to help", icon: '☏' },
  { title: 'About Nomad', subtitle: 'Version 2.1.0 (120) • Terms • Privacy', icon: 'i' },
];

function ShieldLogo({ size = 70 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#1684ff', fontSize: size * 0.86, fontWeight: '900', lineHeight: size }}>⬟</Text>
      <Text style={{ position: 'absolute', color: '#1684ff', fontSize: size * 0.24, fontWeight: '900' }}>⌁</Text>
    </View>
  );
}

function ProfileCard() {
  return (
    <NomadCard tone="blue" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <ShieldLogo size={76} />
        <View style={{ marginLeft: 16, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 22, fontWeight: '900' }}>Nomad User</Text>
            <View style={{ marginLeft: 10, borderRadius: 8, backgroundColor: 'rgba(22,132,255,0.18)', paddingHorizontal: 7, paddingVertical: 3 }}>
              <Text style={{ color: '#1684ff', fontSize: 16 }}>✎</Text>
            </View>
          </View>
          <Text style={{ color: '#c8d1df', fontSize: 17, marginTop: 8 }}>nomad.user@nomadwallet.io</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
            <Text style={{ color: '#35f883', fontSize: 16, fontWeight: '800' }}>▾ Identity Verified</Text>
            <Text style={{ color: '#587089', marginHorizontal: 12 }}>|</Text>
            <Text style={{ color: '#1684ff', fontSize: 16, fontWeight: '800' }}>▾ Level 2 Security</Text>
          </View>
        </View>
      </View>
      <Text style={{ color: '#b7a9e8', fontSize: 34 }}>›</Text>
    </NomadCard>
  );
}

function ShortcutCard({ item }: { item: Shortcut }) {
  return (
    <NomadCard style={{ width: '24%', minHeight: 116, padding: 14, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: item.color, fontSize: 30, fontWeight: '900' }}>{item.icon}</Text>
        <Text style={{ color: '#b7a9e8', fontSize: 24 }}>›</Text>
      </View>
      <View>
        <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>{item.title}</Text>
        <Text style={{ color: '#c8d1df', fontSize: 14, marginTop: 6 }}>{item.subtitle}</Text>
      </View>
    </NomadCard>
  );
}

function SettingSection({ title, rows }: { title: string; rows: SettingRow[] }) {
  return (
    <NomadCard style={{ marginTop: 16 }}>
      <Text style={{ color: '#9ed3ff', fontSize: 18, fontWeight: '900', marginBottom: 10 }}>{title}</Text>
      {rows.map((row, index) => (
        <View key={row.title} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: '#0a243d' }}>
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: `${row.color ?? '#1684ff'}22`, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <Text style={{ color: row.color ?? '#1684ff', fontSize: 24, fontWeight: '900' }}>{row.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>{row.title}</Text>
            <Text style={{ color: '#c8d1df', fontSize: 14, marginTop: 4 }}>{row.subtitle}</Text>
          </View>
          {row.value ? <Text style={{ color: '#35f883', fontSize: 16, fontWeight: '900', marginRight: 10 }}>{row.value}</Text> : null}
          <Text style={{ color: '#b7a9e8', fontSize: 28 }}>›</Text>
        </View>
      ))}
    </NomadCard>
  );
}

function LogoutCard() {
  return (
    <NomadCard tone="red" style={{ marginTop: 16, backgroundColor: 'rgba(42,8,20,0.72)', flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,45,85,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        <Text style={{ color: '#ff445d', fontSize: 28 }}>↪</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#ff445d', fontSize: 18, fontWeight: '900' }}>Log Out</Text>
        <Text style={{ color: '#d8d1dc', marginTop: 5, fontSize: 14 }}>Securely log out of your Nomad account</Text>
      </View>
      <Text style={{ color: '#b7a9e8', fontSize: 28 }}>›</Text>
    </NomadCard>
  );
}

export default function SettingsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#020812' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 116 }} showsVerticalScrollIndicator={false}>
        <NomadHeader title="Settings" subtitle="Customize your Nomad experience" showBack showSecurePill showHelp />
        <ProfileCard />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
          {shortcuts.map((item) => <ShortcutCard key={item.title} item={item} />)}
        </View>
        <SettingSection title="PREFERENCES" rows={preferenceRows} />
        <SettingSection title="NOMAD FEATURES" rows={featureRows} />
        <SettingSection title="SUPPORT & INFORMATION" rows={supportRows} />
        <LogoutCard />
      </ScrollView>
      <NomadBottomNav active="Settings" />
    </View>
  );
}
