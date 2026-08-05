import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadSettings } from '../nomad';
import type { NomadSettingsRow, NomadSettingsShortcut } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

function visibleLabel(value: string): string {
  return value.replace(/Voltaire Protocols?/gi, 'Arkrilium').replace(/BlockPages(?:411)?/gi, 'Reqrium');
}

function ShortcutCard({ item }: { item: NomadSettingsShortcut }) {
  const navigation = useNavigation<any>();
  return (
    <Pressable onPress={() => item.route && navigation.navigate(item.route)} style={({ pressed }) => [styles.shortcut, { opacity: pressed ? .76 : 1 }]}>
      <View style={styles.shortcutTop}><Text style={[styles.shortcutIcon, { color: item.color }]}>{item.icon}</Text><Text style={styles.chevron}>›</Text></View>
      <Text style={styles.shortcutTitle}>{visibleLabel(item.title)}</Text>
      <Text style={styles.shortcutSub}>{visibleLabel(item.subtitle)}</Text>
    </Pressable>
  );
}

function SettingSection({ title, rows }: { title: string; rows: NomadSettingsRow[] }) {
  const navigation = useNavigation<any>();
  return (
    <Panel style={styles.sectionPanel}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rows.map((row, index) => {
        const enabled = !!row.route;
        return (
          <Pressable key={row.title} disabled={!enabled} onPress={() => enabled && navigation.navigate(row.route)} style={[styles.settingRow, index > 0 && styles.rowBorder]}>
            <View style={[styles.settingIcon, { backgroundColor: `${row.color || C.blue}18` }]}><Text style={[styles.settingMark, { color: row.color || C.blue }]}>{row.icon}</Text></View>
            <View style={styles.settingCopy}><Text style={styles.settingTitle}>{visibleLabel(row.title)}</Text><Text style={styles.settingSub}>{visibleLabel(row.subtitle)}</Text></View>
            {row.value ? <Text style={styles.settingValue}>{visibleLabel(row.value)}</Text> : null}
            <Text style={[styles.chevron, !enabled && { opacity: .25 }]}>›</Text>
          </Pressable>
        );
      })}
    </Panel>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { settings, loading, error, logOut } = useNomadSettings();
  const [loggingOut, setLoggingOut] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleLogOut = async () => {
    try {
      setLoggingOut(true);
      setFeedback('Securing the wallet session…');
      await logOut();
      navigation.navigate('ClockUnlock');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to lock the wallet session.');
      setLoggingOut(false);
    }
  };

  return (
    <NomadPage maxWidth={920}>
      <PageHeader title="Settings" subtitle="Customize your Nomad experience" icon="⚙" color={C.blue} help />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Panel style={[styles.profilePanel, compact && styles.profileCompact]}>
        <RoundIcon symbol="⌁" color={C.blue} size={compact ? 68 : 82} filled />
        <View style={styles.profileCopy}>
          <View style={styles.profileNameRow}><Text style={styles.profileName}>{settings.displayName}</Text><Text style={styles.editBadge}>✎</Text></View>
          <Text style={styles.profileEmail}>{settings.email}</Text>
          <View style={styles.profileStatus}><Text style={styles.verified}>◇ {settings.identityStatus}</Text><Text style={styles.statusDivider}>|</Text><Text style={styles.securityLevel}>◇ {settings.securityLevel}</Text></View>
        </View>
        <Pressable onPress={() => navigation.navigate('SecurityCenter')}><Text style={styles.chevron}>›</Text></Pressable>
      </Panel>

      <View style={styles.shortcutGrid}>
        {settings.shortcuts.map((item) => <ShortcutCard key={item.title} item={item} />)}
      </View>

      <SettingSection title="PREFERENCES" rows={settings.preferenceRows} />
      <SettingSection title="NOMAD FEATURES" rows={settings.featureRows} />
      <SettingSection title="SUPPORT & INFORMATION" rows={settings.supportRows} />

      <Panel style={styles.arkriliumPanel}>
        <RoundIcon symbol="A" color={C.purple} size={51} filled />
        <View style={styles.arkriliumCopy}><Text style={styles.arkriliumTitle}>Arkrilium Ecosystem</Text><Text style={styles.arkriliumSub}>Explore connected protocols, Reqrium protection and Nomad services.</Text></View>
        <Pressable onPress={() => navigation.navigate('VoltaireProtocols')}><Text style={styles.chevron}>›</Text></Pressable>
      </Panel>

      <Pressable disabled={loggingOut} onPress={() => void handleLogOut()} style={styles.logoutPanel}>
        <RoundIcon symbol="↪" color={C.red} size={48} filled />
        <View style={styles.logoutCopy}><Text style={styles.logoutTitle}>{loggingOut ? 'Locking Wallet…' : 'Log Out'}</Text><Text style={styles.logoutSub}>Securely lock the current Nomad wallet session</Text></View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      {loading ? <Text style={styles.helper}>Loading current settings…</Text> : null}
      {feedback ? <Text style={[styles.feedback, feedback.toLowerCase().includes('unable') && { color: C.red }]}>{feedback}</Text> : null}

      <BottomNav active="Settings" />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  profilePanel: { minHeight: 124, padding: 18, flexDirection: 'row', alignItems: 'center' },
  profileCompact: { minHeight: 110 },
  profileCopy: { flex: 1, minWidth: 0, marginLeft: 14 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center' },
  profileName: { color: '#fff', fontSize: 20, fontWeight: '900' },
  editBadge: { color: C.blue, backgroundColor: 'rgba(22,140,255,.12)', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3, marginLeft: 9 },
  profileEmail: { color: C.muted, fontSize: 11, marginTop: 6 },
  profileStatus: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 12 },
  verified: { color: C.green, fontSize: 10, fontWeight: '800' },
  statusDivider: { color: '#52667d', marginHorizontal: 8 },
  securityLevel: { color: C.blue, fontSize: 10, fontWeight: '800' },
  chevron: { color: '#b7c4d6', fontSize: 28, marginLeft: 7 },
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  shortcut: { flexGrow: 1, flexBasis: 150, minHeight: 112, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.panel, padding: 14 },
  shortcutTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shortcutIcon: { fontSize: 27, fontWeight: '900' },
  shortcutTitle: { color: '#fff', fontSize: 13, fontWeight: '900', marginTop: 15 },
  shortcutSub: { color: C.muted, fontSize: 9, marginTop: 5 },
  sectionPanel: { marginTop: 16, padding: 16 },
  sectionTitle: { color: '#9ed3ff', fontSize: 14, fontWeight: '900', marginBottom: 5 },
  settingRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  rowBorder: { borderTopWidth: 1, borderTopColor: C.borderSoft },
  settingIcon: { width: 43, height: 43, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingMark: { fontSize: 21, fontWeight: '900' },
  settingCopy: { flex: 1, minWidth: 0 },
  settingTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  settingSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  settingValue: { color: C.green, fontSize: 9, fontWeight: '900', marginLeft: 8 },
  arkriliumPanel: { minHeight: 83, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  arkriliumCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  arkriliumTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  arkriliumSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  logoutPanel: { minHeight: 79, marginTop: 16, borderWidth: 1, borderColor: '#7b2533', borderRadius: 15, backgroundColor: 'rgba(42,8,20,.72)', padding: 14, flexDirection: 'row', alignItems: 'center' },
  logoutCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  logoutTitle: { color: C.red, fontSize: 13, fontWeight: '900' },
  logoutSub: { color: '#d8d1dc', fontSize: 9, marginTop: 4 },
  helper: { color: C.muted, fontSize: 9, marginTop: 10 },
  feedback: { color: C.green, fontSize: 10, marginTop: 10 },
});
