import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadSettings } from '../nomad';
import type {
  NomadEditableSettingsRow,
  NomadEditableSettingsShortcut,
  NomadNotificationSettings,
  NomadSettingsActionKey,
} from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  useNomadLayout,
} from '../ui/NomadShell';

type ActivePanel = NomadSettingsActionKey | 'logout' | null;

const currencyChoices = ['USD', 'CAD', 'EUR', 'GBP', 'JPY', 'NGN', 'AUD'];
const languageChoices = ['English', 'French', 'Spanish'];
const appearanceChoices = ['Dark Mode', 'System', 'Light Mode'];
const networkChoices = ['Hedera Mainnet', 'Bitcoin Mainnet', 'Ethereum Mainnet', 'XRPL Mainnet', 'Stellar Mainnet'];
const spendChoices = ['USD Stable', 'CAD Stable', 'EUR Stable', 'JPY Stable', 'NGN Stable'];

function ChoiceGroup({ title, choices, selected, onSelect }: { title: string; choices: string[]; selected: string; onSelect(value: string): void }) {
  return (
    <View style={styles.choiceGroup}>
      <Text style={styles.choiceTitle}>{title}</Text>
      <View style={styles.choiceWrap}>
        {choices.map((choice) => {
          const active = choice === selected;
          return (
            <Pressable key={choice} onPress={() => onSelect(choice)} style={[styles.choiceButton, active && styles.choiceButtonActive]}>
              <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ToggleRow({ label, note, enabled, onPress }: { label: string; note: string; enabled: boolean; onPress(): void }) {
  return (
    <Pressable onPress={onPress} style={styles.toggleRow}>
      <View style={styles.toggleCopy}><Text style={styles.toggleLabel}>{label}</Text><Text style={styles.toggleNote}>{note}</Text></View>
      <View style={[styles.toggle, enabled && styles.toggleOn]}><View style={[styles.toggleKnob, enabled && styles.toggleKnobOn]} /></View>
    </Pressable>
  );
}

function ShortcutCard({ item, onAction }: { item: NomadEditableSettingsShortcut; onAction(action?: NomadSettingsActionKey, route?: string): void }) {
  return (
    <Pressable onPress={() => onAction(item.actionKey, item.route)} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}>
      <View style={styles.shortcutTop}><Text style={[styles.shortcutIcon, { color: item.color }]}>{item.icon}</Text><Text style={styles.chevron}>›</Text></View>
      <Text style={styles.shortcutTitle}>{item.title}</Text>
      <Text style={styles.shortcutSub}>{item.subtitle}</Text>
    </Pressable>
  );
}

function SettingSection({ title, rows, onAction }: { title: string; rows: NomadEditableSettingsRow[]; onAction(action?: NomadSettingsActionKey, route?: string): void }) {
  return (
    <Panel style={styles.sectionPanel}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rows.map((row, index) => (
        <Pressable key={row.title} onPress={() => onAction(row.actionKey, row.route)} style={({ pressed }) => [styles.settingRow, index > 0 && styles.rowBorder, pressed && styles.pressed]}>
          <View style={[styles.settingIcon, { backgroundColor: `${row.color || C.blue}18` }]}><Text style={[styles.settingMark, { color: row.color || C.blue }]}>{row.icon}</Text></View>
          <View style={styles.settingCopy}><Text style={styles.settingTitle}>{row.title}</Text><Text style={styles.settingSub}>{row.subtitle}</Text></View>
          {row.value ? <Text style={[styles.settingValue, row.value === 'OFF' && { color: C.muted }]}>{row.value}</Text> : null}
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </Panel>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { settings, loading, error, refresh, updateSettings, setAutoConvert, createSupportDraft, logOut } = useNomadSettings();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [displayName, setDisplayName] = useState(settings.displayName);
  const [email, setEmail] = useState(settings.email);
  const [supportMessage, setSupportMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(settings.displayName);
    setEmail(settings.email);
  }, [settings.displayName, settings.email]);

  const openAction = (action?: NomadSettingsActionKey, route?: string) => {
    setFeedback('');
    if (route) {
      navigation.navigate(route);
      return;
    }
    if (action === 'auto_convert') {
      void toggleAutoConvert();
      return;
    }
    setActivePanel(action ?? null);
  };

  const save = async (update: Parameters<typeof updateSettings>[0], message: string) => {
    try {
      setSaving(true);
      setFeedback('Saving…');
      await updateSettings(update);
      setFeedback(message);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to save the setting.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAutoConvert = async () => {
    try {
      setSaving(true);
      const next = !settings.autoConvertEnabled;
      await setAutoConvert(next);
      setFeedback(`Auto-Convert ${next ? 'enabled' : 'paused'} through Travel Pocket.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to update Auto-Convert.');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (key: keyof NomadNotificationSettings) => {
    void save({ notifications: { ...settings.notifications, [key]: !settings.notifications[key] } }, 'Notification preferences saved.');
  };

  const saveProfile = () => void save({ displayName, email }, 'Profile settings saved.');

  const saveSupportDraft = async () => {
    try {
      setSaving(true);
      const draft = await createSupportDraft(supportMessage);
      setFeedback(`Support draft created: ${draft.id}. It has not been submitted to a remote support service.`);
      setSupportMessage('');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to create the support draft.');
    } finally {
      setSaving(false);
    }
  };

  const confirmLogOut = async () => {
    try {
      setSaving(true);
      setFeedback('Locking the wallet session…');
      await logOut();
      navigation.reset({ index: 0, routes: [{ name: 'ClockUnlock' }] });
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to lock the wallet session.');
      setSaving(false);
    }
  };

  const renderEditor = () => {
    if (!activePanel) return null;

    if (activePanel === 'profile') {
      return (
        <Panel style={styles.editorPanel}>
          <Text style={styles.editorTitle}>EDIT PROFILE</Text>
          <Text style={styles.editorNote}>Profile details stay inside the current Nomad settings boundary.</Text>
          <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Display name" placeholderTextColor={C.muted} style={styles.input} />
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor={C.muted} style={styles.input} />
          <Pressable disabled={saving} onPress={saveProfile} style={styles.primaryButton}><Text style={styles.primaryText}>Save Profile</Text></Pressable>
        </Panel>
      );
    }

    if (activePanel === 'preferences') {
      return (
        <Panel style={styles.editorPanel}>
          <Text style={styles.editorTitle}>PREFERENCES</Text>
          <Text style={styles.editorNote}>Choose a preference below. Each choice opens its own working control.</Text>
          <View style={styles.quickGrid}>
            {(['currency_language', 'appearance', 'notifications', 'default_network'] as NomadSettingsActionKey[]).map((action) => (
              <Pressable key={action} onPress={() => setActivePanel(action)} style={styles.quickButton}><Text style={styles.quickText}>{action.replace(/_/g, ' ')}</Text></Pressable>
            ))}
          </View>
        </Panel>
      );
    }

    if (activePanel === 'currency_language') {
      return (
        <Panel style={styles.editorPanel}>
          <Text style={styles.editorTitle}>CURRENCY & LANGUAGE</Text>
          <ChoiceGroup title="Display currency" choices={currencyChoices} selected={settings.defaultCurrency} onSelect={(value) => void save({ defaultCurrency: value }, `${value} display currency saved.`)} />
          <ChoiceGroup title="Language" choices={languageChoices} selected={settings.language} onSelect={(value) => void save({ language: value }, `${value} language preference saved.`)} />
        </Panel>
      );
    }

    if (activePanel === 'appearance') {
      return (
        <Panel style={styles.editorPanel}>
          <Text style={styles.editorTitle}>APPEARANCE</Text>
          <ChoiceGroup title="Theme preference" choices={appearanceChoices} selected={settings.appearance} onSelect={(value) => void save({ appearance: value }, `${value} preference saved. The approved dark interface remains active until the global theme bridge is connected.`)} />
        </Panel>
      );
    }

    if (activePanel === 'notifications') {
      return (
        <Panel style={styles.editorPanel}>
          <Text style={styles.editorTitle}>NOTIFICATIONS</Text>
          <ToggleRow label="Push Notifications" note="Device alerts when a native bridge is connected" enabled={settings.notifications.push} onPress={() => toggleNotification('push')} />
          <ToggleRow label="Email Notifications" note="Email delivery when a mail provider is connected" enabled={settings.notifications.email} onPress={() => toggleNotification('email')} />
          <ToggleRow label="Security Alerts" note="Freeze, recovery and authority events" enabled={settings.notifications.security} onPress={() => toggleNotification('security')} />
          <ToggleRow label="Travel Alerts" note="Travel Pocket activity and limits" enabled={settings.notifications.travel} onPress={() => toggleNotification('travel')} />
        </Panel>
      );
    }

    if (activePanel === 'default_network') {
      return (
        <Panel style={styles.editorPanel}>
          <Text style={styles.editorTitle}>DEFAULT NETWORK</Text>
          <ChoiceGroup title="Preferred network" choices={networkChoices} selected={settings.defaultNetwork} onSelect={(value) => void save({ defaultNetwork: value }, `${value} saved as the preferred network.`)} />
          <Text style={styles.editorNote}>The selected network is a preference. Each transaction still validates its actual asset network before review.</Text>
        </Panel>
      );
    }

    if (activePanel === 'pay_spend') {
      return (
        <Panel style={styles.editorPanel}>
          <Text style={styles.editorTitle}>PAY / SPEND SETTINGS</Text>
          <ChoiceGroup title="Default stable-value currency" choices={spendChoices} selected={settings.paySpendCurrency} onSelect={(value) => void save({ paySpendCurrency: value }, `${value} saved for Pay / Spend presentation.`)} />
        </Panel>
      );
    }

    if (activePanel === 'connected_apps') {
      return (
        <Panel style={styles.editorPanel}>
          <Text style={styles.editorTitle}>CONNECTED APPS & SERVICES</Text>
          <Text style={styles.editorNote}>System services are separated from external dApps. This build does not claim external permissions that are not connected.</Text>
          {settings.connectedApps.map((app, index) => (
            <Pressable key={app.id} disabled={!app.route} onPress={() => app.route && navigation.navigate(app.route)} style={[styles.appRow, index > 0 && styles.rowBorder]}>
              <View style={styles.appCopy}><Text style={styles.appTitle}>{app.title}</Text><Text style={styles.appSub}>{app.subtitle}</Text></View>
              <Text style={[styles.appStatus, app.status === 'not_connected' && { color: C.muted }]}>{app.status.replace(/_/g, ' ').toUpperCase()}</Text>
              {app.route ? <Text style={styles.chevron}>›</Text> : null}
            </Pressable>
          ))}
        </Panel>
      );
    }

    if (activePanel === 'help') {
      return (
        <Panel style={styles.editorPanel}>
          <Text style={styles.editorTitle}>HELP CENTER</Text>
          <Text style={styles.helpHeading}>Wallet access</Text><Text style={styles.helpText}>Use Time Clock Access and the approved recovery flow. Nomad never asks for recovery material through support.</Text>
          <Text style={styles.helpHeading}>Security</Text><Text style={styles.helpText}>Use Security Center for independent module checks and Emergency Freeze for urgent protection.</Text>
          <Text style={styles.helpHeading}>Travel Pocket</Text><Text style={styles.helpText}>Select a destination first, then activate Travel Mode. Destination selection never activates spending automatically.</Text>
        </Panel>
      );
    }

    if (activePanel === 'contact_support') {
      return (
        <Panel style={styles.editorPanel}>
          <Text style={styles.editorTitle}>CONTACT SUPPORT</Text>
          <Text style={styles.editorNote}>This creates a local draft only. A remote support desk is not connected.</Text>
          <TextInput value={supportMessage} onChangeText={setSupportMessage} multiline placeholder="Describe the issue without including private keys or recovery material" placeholderTextColor={C.muted} style={[styles.input, styles.supportInput]} />
          <Pressable disabled={saving} onPress={() => void saveSupportDraft()} style={styles.primaryButton}><Text style={styles.primaryText}>Create Support Draft</Text></Pressable>
        </Panel>
      );
    }

    if (activePanel === 'about') {
      return (
        <Panel style={styles.editorPanel}>
          <Text style={styles.editorTitle}>ABOUT NOMAD</Text>
          <Text style={styles.aboutValue}>{settings.appVersion}</Text>
          <Text style={styles.editorNote}>Nomad is a non-custodial wallet interface built around Arkrilium protocol services and Reqrium safety tooling. The connected wallet engine remains responsible for private keys, signing and broadcasting.</Text>
          <Text style={styles.persistenceWarning}>Current settings persistence: {settings.persistence.replace(/_/g, ' ')}.</Text>
        </Panel>
      );
    }

    if (activePanel === 'logout') {
      return (
        <Panel style={styles.logoutConfirm}>
          <Text style={styles.logoutConfirmTitle}>LOCK WALLET SESSION?</Text>
          <Text style={styles.logoutConfirmText}>You will return to Time Clock Access. This does not delete the wallet or recovery setup.</Text>
          <View style={styles.confirmButtons}>
            <Pressable onPress={() => setActivePanel(null)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
            <Pressable disabled={saving} onPress={() => void confirmLogOut()} style={styles.logoutButton}><Text style={styles.logoutButtonText}>{saving ? 'Locking…' : 'Lock Session'}</Text></Pressable>
          </View>
        </Panel>
      );
    }

    return null;
  };

  return (
    <NomadPage maxWidth={920}>
      <PageHeader title="Settings" subtitle="Customize your Nomad experience" icon="⚙" color={C.blue} help />

      {error ? <View style={styles.errorBanner}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void refresh()}><Text style={styles.retry}>Retry</Text></Pressable></View> : null}

      <Panel style={[styles.profilePanel, compact && styles.profileCompact]}>
        <View style={styles.avatar}><View style={styles.avatarInner}><Text style={styles.avatarMark}>N</Text></View></View>
        <View style={styles.profileCopy}>
          <View style={styles.profileNameRow}><Text numberOfLines={1} style={styles.profileName}>{settings.displayName}</Text><Pressable onPress={() => setActivePanel('profile')} style={styles.editBadge}><Text style={styles.editText}>✎</Text></Pressable></View>
          <Text numberOfLines={1} style={styles.profileEmail}>{settings.email}</Text>
          <View style={styles.profileStatus}><Text style={styles.verified}>◇ {settings.identityStatus}</Text><Text style={styles.statusDivider}>|</Text><Text style={styles.securityLevel}>◇ {settings.securityLevel}</Text></View>
        </View>
        <Pressable onPress={() => setActivePanel('profile')}><Text style={styles.chevron}>›</Text></Pressable>
      </Panel>

      <View style={styles.shortcutGrid}>{settings.shortcuts.map((item) => <ShortcutCard key={item.title} item={item} onAction={openAction} />)}</View>

      {renderEditor()}
      {feedback ? <Text style={[styles.feedback, /unable|invalid|unsupported|blocks/i.test(feedback) && { color: C.red }]}>{feedback}</Text> : null}

      <SettingSection title="PREFERENCES" rows={settings.preferenceRows} onAction={openAction} />
      <SettingSection title="NOMAD FEATURES" rows={settings.featureRows} onAction={openAction} />
      <SettingSection title="SUPPORT & INFORMATION" rows={settings.supportRows} onAction={openAction} />

      <Pressable disabled={loading} onPress={() => { setFeedback(''); setActivePanel('logout'); }} style={({ pressed }) => [styles.logoutPanel, pressed && styles.pressed]}>
        <View style={styles.logoutIcon}><Text style={styles.logoutMark}>↪</Text></View>
        <View style={styles.logoutCopy}><Text style={styles.logoutTitle}>Log Out</Text><Text style={styles.logoutSub}>Securely lock the current Nomad wallet session</Text></View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Text style={styles.storageNote}>Settings source: {settings.dataSource.replace(/_/g, ' ')} • {settings.persistence.replace(/_/g, ' ')}</Text>
      <BottomNav active="More" />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  errorBanner: { marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 10, padding: 11, flexDirection: 'row', alignItems: 'center' },
  error: { flex: 1, color: C.red, fontSize: 11 },
  retry: { color: C.blue, fontSize: 11, fontWeight: '900' },
  profilePanel: { minHeight: 124, padding: 18, flexDirection: 'row', alignItems: 'center' },
  profileCompact: { minHeight: 112 },
  avatar: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderColor: C.blue, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(22,140,255,.08)' },
  avatarInner: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: C.green, alignItems: 'center', justifyContent: 'center', backgroundColor: '#031321' },
  avatarMark: { color: '#fff', fontSize: 26, fontWeight: '900' },
  profileCopy: { flex: 1, minWidth: 0, marginLeft: 14 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center' },
  profileName: { flexShrink: 1, color: '#fff', fontSize: 20, fontWeight: '900' },
  editBadge: { marginLeft: 9, borderRadius: 7, backgroundColor: 'rgba(22,140,255,.12)', paddingHorizontal: 8, paddingVertical: 4 },
  editText: { color: C.blue, fontSize: 12 },
  profileEmail: { color: C.muted, fontSize: 11, marginTop: 6 },
  profileStatus: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 12 },
  verified: { color: C.green, fontSize: 9, fontWeight: '800' },
  statusDivider: { color: '#52667d', marginHorizontal: 8 },
  securityLevel: { color: C.blue, fontSize: 9, fontWeight: '800' },
  chevron: { color: '#b7c4d6', fontSize: 28, marginLeft: 7 },
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  shortcut: { flexGrow: 1, flexBasis: 150, minHeight: 112, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.panel, padding: 14 },
  shortcutTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shortcutIcon: { fontSize: 27, fontWeight: '900' },
  shortcutTitle: { color: '#fff', fontSize: 13, fontWeight: '900', marginTop: 15 },
  shortcutSub: { color: C.muted, fontSize: 9, marginTop: 5 },
  editorPanel: { marginTop: 16, padding: 16, borderColor: '#135f9e' },
  editorTitle: { color: '#9ed3ff', fontSize: 14, fontWeight: '900', letterSpacing: .4 },
  editorNote: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 7 },
  input: { minHeight: 50, marginTop: 12, borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.panel2, color: '#fff', paddingHorizontal: 13, fontSize: 13 },
  supportInput: { minHeight: 110, paddingTop: 13, textAlignVertical: 'top' },
  primaryButton: { minHeight: 50, marginTop: 13, borderRadius: 10, backgroundColor: '#086bd1', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  choiceGroup: { marginTop: 15 },
  choiceTitle: { color: '#fff', fontSize: 12, fontWeight: '800' },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  choiceButton: { minHeight: 39, borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  choiceButtonActive: { borderColor: C.blue, backgroundColor: 'rgba(22,140,255,.16)' },
  choiceText: { color: C.muted, fontSize: 10, fontWeight: '800' },
  choiceTextActive: { color: '#fff' },
  toggleRow: { minHeight: 64, borderBottomWidth: 1, borderBottomColor: C.borderSoft, flexDirection: 'row', alignItems: 'center' },
  toggleCopy: { flex: 1, minWidth: 0 },
  toggleLabel: { color: '#fff', fontSize: 12, fontWeight: '900' },
  toggleNote: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  toggle: { width: 45, height: 25, borderRadius: 13, backgroundColor: '#243144', padding: 3 },
  toggleOn: { backgroundColor: 'rgba(32,239,112,.45)' },
  toggleKnob: { width: 19, height: 19, borderRadius: 10, backgroundColor: '#9aa7b8' },
  toggleKnobOn: { marginLeft: 20, backgroundColor: C.green },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  quickButton: { flexGrow: 1, flexBasis: 135, minHeight: 48, borderWidth: 1, borderColor: C.border, borderRadius: 9, alignItems: 'center', justifyContent: 'center', padding: 8 },
  quickText: { color: C.blue, fontSize: 10, fontWeight: '900', textTransform: 'capitalize' },
  appRow: { minHeight: 65, flexDirection: 'row', alignItems: 'center' },
  appCopy: { flex: 1, minWidth: 0 },
  appTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  appSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  appStatus: { color: C.green, fontSize: 8, fontWeight: '900', marginLeft: 8 },
  helpHeading: { color: C.blue, fontSize: 12, fontWeight: '900', marginTop: 14 },
  helpText: { color: '#d5dfec', fontSize: 10, lineHeight: 16, marginTop: 4 },
  aboutValue: { color: '#fff', fontSize: 13, fontWeight: '900', marginTop: 12 },
  persistenceWarning: { color: C.yellow, fontSize: 10, lineHeight: 16, marginTop: 12 },
  feedback: { color: C.green, fontSize: 10, lineHeight: 15, marginTop: 10 },
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
  logoutPanel: { minHeight: 79, marginTop: 16, borderWidth: 1, borderColor: '#7b2533', borderRadius: 15, backgroundColor: 'rgba(42,8,20,.72)', padding: 14, flexDirection: 'row', alignItems: 'center' },
  logoutIcon: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: C.red, alignItems: 'center', justifyContent: 'center' },
  logoutMark: { color: C.red, fontSize: 22 },
  logoutCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  logoutTitle: { color: C.red, fontSize: 13, fontWeight: '900' },
  logoutSub: { color: '#d8d1dc', fontSize: 9, marginTop: 4 },
  logoutConfirm: { marginTop: 16, padding: 16, borderColor: '#7b2533' },
  logoutConfirmTitle: { color: C.red, fontSize: 14, fontWeight: '900' },
  logoutConfirmText: { color: '#e4dce5', fontSize: 10, lineHeight: 16, marginTop: 7 },
  confirmButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelButton: { flex: 1, minHeight: 47, borderWidth: 1, borderColor: C.border, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  logoutButton: { flex: 1, minHeight: 47, borderRadius: 9, backgroundColor: '#8f2638', alignItems: 'center', justifyContent: 'center' },
  logoutButtonText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  storageNote: { color: C.muted, fontSize: 8, textAlign: 'center', marginTop: 12 },
});
