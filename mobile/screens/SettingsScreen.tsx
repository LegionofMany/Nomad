import React from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { NomadBottomNav, NomadCard, NomadHeader, useNomadSettings } from '../nomad';
import type { NomadSettingsRow, NomadSettingsShortcut } from '../nomad';

function ShieldLogo({ size = 70 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#1684ff', fontSize: size * 0.86, fontWeight: '900', lineHeight: size }}>⬟</Text>
      <Text style={{ position: 'absolute', color: '#1684ff', fontSize: size * 0.24, fontWeight: '900' }}>⌁</Text>
    </View>
  );
}

function ProfileCard({ displayName, email, identityStatus, securityLevel }: { displayName: string; email: string; identityStatus: string; securityLevel: string }) {
  return (
    <NomadCard tone="blue" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <ShieldLogo size={76} />
        <View style={{ marginLeft: 16, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 22, fontWeight: '900' }}>{displayName}</Text>
            <View style={{ marginLeft: 10, borderRadius: 8, backgroundColor: 'rgba(22,132,255,0.18)', paddingHorizontal: 7, paddingVertical: 3 }}>
              <Text style={{ color: '#1684ff', fontSize: 16 }}>✎</Text>
            </View>
          </View>
          <Text style={{ color: '#c8d1df', fontSize: 17, marginTop: 8 }}>{email}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
            <Text style={{ color: '#35f883', fontSize: 16, fontWeight: '800' }}>▾ {identityStatus}</Text>
            <Text style={{ color: '#587089', marginHorizontal: 12 }}>|</Text>
            <Text style={{ color: '#1684ff', fontSize: 16, fontWeight: '800' }}>▾ {securityLevel}</Text>
          </View>
        </View>
      </View>
      <Text style={{ color: '#b7a9e8', fontSize: 34 }}>›</Text>
    </NomadCard>
  );
}

function ShortcutCard({ item }: { item: NomadSettingsShortcut }) {
  const navigation = useNavigation<any>();
  return (
    <Pressable onPress={() => item.route && navigation.navigate(item.route)} style={{ width: '24%' }}>
      <NomadCard style={{ minHeight: 116, padding: 14, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: item.color, fontSize: 30, fontWeight: '900' }}>{item.icon}</Text>
          <Text style={{ color: '#b7a9e8', fontSize: 24 }}>›</Text>
        </View>
        <View>
          <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>{item.title}</Text>
          <Text style={{ color: '#c8d1df', fontSize: 14, marginTop: 6 }}>{item.subtitle}</Text>
        </View>
      </NomadCard>
    </Pressable>
  );
}

function SettingSection({ title, rows }: { title: string; rows: NomadSettingsRow[] }) {
  const navigation = useNavigation<any>();
  return (
    <NomadCard style={{ marginTop: 16 }}>
      <Text style={{ color: '#9ed3ff', fontSize: 18, fontWeight: '900', marginBottom: 10 }}>{title}</Text>
      {rows.map((row, index) => (
        <Pressable key={row.title} onPress={() => row.route && navigation.navigate(row.route)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: '#0a243d' }}>
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: `${row.color ?? '#1684ff'}22`, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <Text style={{ color: row.color ?? '#1684ff', fontSize: 24, fontWeight: '900' }}>{row.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>{row.title}</Text>
            <Text style={{ color: '#c8d1df', fontSize: 14, marginTop: 4 }}>{row.subtitle}</Text>
          </View>
          {row.value ? <Text style={{ color: '#35f883', fontSize: 16, fontWeight: '900', marginRight: 10 }}>{row.value}</Text> : null}
          <Text style={{ color: '#b7a9e8', fontSize: 28 }}>›</Text>
        </Pressable>
      ))}
    </NomadCard>
  );
}

function LogoutCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
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
    </Pressable>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { settings, error, logOut } = useNomadSettings();

  const handleLogOut = async () => {
    await logOut();
    navigation.navigate('ClockUnlock');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#020812' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 116 }} showsVerticalScrollIndicator={false}>
        <NomadHeader title="Settings" subtitle="Customize your Nomad experience" showBack showSecurePill showHelp />
        {error ? <Text style={{ color: '#ff445d', marginBottom: 10 }}>{error}</Text> : null}
        <ProfileCard displayName={settings.displayName} email={settings.email} identityStatus={settings.identityStatus} securityLevel={settings.securityLevel} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
          {settings.shortcuts.map((item) => <ShortcutCard key={item.title} item={item} />)}
        </View>
        <SettingSection title="PREFERENCES" rows={settings.preferenceRows} />
        <SettingSection title="NOMAD FEATURES" rows={settings.featureRows} />
        <SettingSection title="SUPPORT & INFORMATION" rows={settings.supportRows} />
        <LogoutCard onPress={() => { void handleLogOut(); }} />
      </ScrollView>
      <NomadBottomNav active="Settings" />
    </View>
  );
}
