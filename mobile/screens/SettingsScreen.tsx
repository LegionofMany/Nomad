import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

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

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ borderRadius: 16, borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(3,16,30,0.94)', padding: 16 }, style]}>
      {children}
    </View>
  );
}

function ShieldLogo({ size = 70 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#1684ff', fontSize: size * 0.86, fontWeight: '900', lineHeight: size }}>⬟</Text>
      <Text style={{ position: 'absolute', color: '#1684ff', fontSize: size * 0.24, fontWeight: '900' }}>⌁</Text>
    </View>
  );
}

function SecurePill() {
  return (
    <View style={{ borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(3,16,30,0.94)', borderRadius: 26, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ color: '#35f883', fontSize: 24, marginRight: 10 }}>▾</Text>
      <View>
        <Text style={{ color: '#d7e8ff', fontSize: 14 }}>All Systems</Text>
        <Text style={{ color: '#35f883', fontWeight: '900', fontSize: 14 }}>SECURE</Text>
      </View>
    </View>
  );
}

function Header() {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Text style={{ color: 'white', fontSize: 42 }}>‹</Text>
        </Pressable>
        <View>
          <Text style={{ color: 'white', fontSize: 30, fontWeight: '900' }}>Settings</Text>
          <Text style={{ color: '#c8d1df', fontSize: 16, marginTop: 2 }}>Customize your Nomad experience</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <SecurePill />
        <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#0a3862', alignItems: 'center', justifyContent: 'center', marginLeft: 10 }}>
          <Text style={{ color: '#c7d2e3', fontSize: 22, fontWeight: '900' }}>?</Text>
        </View>
      </View>
    </View>
  );
}

function ProfileCard() {
  return (
    <Card style={{ borderColor: '#1684ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
    </Card>
  );
}

function ShortcutCard({ item }: { item: Shortcut }) {
  return (
    <Card style={{ width: '24%', minHeight: 116, padding: 14, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: item.color, fontSize: 30, fontWeight: '900' }}>{item.icon}</Text>
        <Text style={{ color: '#b7a9e8', fontSize: 24 }}>›</Text>
      </View>
      <View>
        <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>{item.title}</Text>
        <Text style={{ color: '#c8d1df', fontSize: 14, marginTop: 6 }}>{item.subtitle}</Text>
      </View>
    </Card>
  );
}

function SettingSection({ title, rows }: { title: string; rows: SettingRow[] }) {
  return (
    <Card style={{ marginTop: 16 }}>
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
    </Card>
  );
}

function LogoutCard() {
  return (
    <Card style={{ marginTop: 16, borderColor: '#ff2d55', backgroundColor: 'rgba(42,8,20,0.72)', flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,45,85,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        <Text style={{ color: '#ff445d', fontSize: 28 }}>↪</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#ff445d', fontSize: 18, fontWeight: '900' }}>Log Out</Text>
        <Text style={{ color: '#d8d1dc', marginTop: 5, fontSize: 14 }}>Securely log out of your Nomad account</Text>
      </View>
      <Text style={{ color: '#b7a9e8', fontSize: 28 }}>›</Text>
    </Card>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items = [
    { label: 'Home', icon: '⌂', route: 'Portfolio' },
    { label: 'Wallets', icon: '▣', route: 'Wallets' },
    { label: 'Travel', icon: '✈', route: 'TravelMode' },
    { label: 'Security', icon: '▾', route: 'SecurityCenter' },
    { label: 'Settings', icon: '⚙', route: 'Settings' },
  ];

  return (
    <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18, height: 78, borderRadius: 18, borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(3,16,30,0.98)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
      {items.map((item) => {
        const active = item.label === 'Settings';
        return (
          <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => navigation.navigate(item.route)} style={{ alignItems: 'center', width: '20%' }}>
            <Text style={{ color: active ? '#1684ff' : '#c7d2e3', fontSize: 31, fontWeight: '900', textShadowColor: active ? '#1684ff' : 'transparent', textShadowRadius: active ? 16 : 0 }}>{item.icon}</Text>
            <Text style={{ color: active ? '#1684ff' : '#c7d2e3', marginTop: 2, fontSize: 13 }}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#020812' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 116 }} showsVerticalScrollIndicator={false}>
        <Header />
        <ProfileCard />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
          {shortcuts.map((item) => <ShortcutCard key={item.title} item={item} />)}
        </View>
        <SettingSection title="PREFERENCES" rows={preferenceRows} />
        <SettingSection title="NOMAD FEATURES" rows={featureRows} />
        <SettingSection title="SUPPORT & INFORMATION" rows={supportRows} />
        <LogoutCard />
      </ScrollView>
      <BottomNav />
    </View>
  );
}
