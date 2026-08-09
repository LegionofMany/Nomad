import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

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
  NomadBrandMark,
  NomadPage,
  Panel,
  useNomadLayout,
} from '../ui/NomadShell';

type ActivePanel = NomadSettingsActionKey | 'logout' | 'terms' | 'privacy' | null;
type SettingsArtworkKind =
  | 'back'
  | 'shield'
  | 'help'
  | 'edit'
  | 'preferences'
  | 'wallets'
  | 'connected'
  | 'globe'
  | 'appearance'
  | 'notifications'
  | 'network'
  | 'travel'
  | 'auto'
  | 'spend'
  | 'support'
  | 'contact'
  | 'info'
  | 'logout';

const currencyChoices = ['USD', 'CAD', 'EUR', 'GBP', 'JPY', 'NGN', 'AUD'];
const languageChoices = ['English', 'French', 'Spanish'];
const appearanceChoices = ['Dark Mode', 'System', 'Light Mode'];
const networkChoices = ['Hedera Mainnet', 'Bitcoin Mainnet', 'Ethereum Mainnet', 'XRPL Mainnet', 'Stellar Mainnet'];
const spendChoices = ['USD Stable', 'CAD Stable', 'EUR Stable', 'JPY Stable', 'NGN Stable'];

const shortcutArtwork: Record<string, SettingsArtworkKind> = {
  Preferences: 'preferences',
  Security: 'shield',
  Wallets: 'wallets',
  'Connected Apps': 'connected',
};

const rowArtwork: Record<string, SettingsArtworkKind> = {
  'Currency & Language': 'globe',
  Appearance: 'appearance',
  Notifications: 'notifications',
  'Default Network': 'network',
  'Travel Pocket': 'travel',
  'Auto-Convert & Optimize': 'auto',
  'Pay / Spend Settings': 'spend',
  'Help Center': 'support',
  'Contact Support': 'contact',
  'About Nomad': 'info',
};

function testSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function SettingsArtwork({ kind, color = C.blue, size = 36 }: { kind: SettingsArtworkKind; color?: string; size?: number }) {
  const stroke = {
    stroke: color,
    strokeWidth: 2.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  let artwork: React.ReactNode;

  switch (kind) {
    case 'back':
      artwork = <><Path d="m27 8-14 16 14 16M14 24h27" {...stroke} /></>;
      break;
    case 'shield':
      artwork = <><Path d="M24 4 41 12v13c0 11-6 18-17 23C13 43 7 36 7 25V12Z" {...stroke} /><Path d="m15 25 6 6 12-14" {...stroke} /></>;
      break;
    case 'help':
      artwork = <><Circle cx="24" cy="24" r="19" {...stroke} /><Path d="M18 18c1-5 11-7 13-1 2 5-5 6-7 10v3M24 37h.1" {...stroke} /></>;
      break;
    case 'edit':
      artwork = <><Path d="m13 34 3-10L34 6l8 8-18 18-11 2Z" {...stroke} /><Path d="m30 10 8 8M13 34l9-2" {...stroke} /></>;
      break;
    case 'preferences':
      artwork = <><Path d="M7 13h34M7 24h34M7 35h34" {...stroke} /><Circle cx="18" cy="13" r="4" fill="#03101d" {...stroke} /><Circle cx="31" cy="24" r="4" fill="#03101d" {...stroke} /><Circle cx="15" cy="35" r="4" fill="#03101d" {...stroke} /></>;
      break;
    case 'wallets':
      artwork = <><Rect x="7" y="11" width="34" height="29" rx="5" {...stroke} /><Path d="M7 18h29M29 24h12v10H29a5 5 0 0 1 0-10Z" {...stroke} /><Circle cx="33" cy="29" r="1.5" fill={color} /></>;
      break;
    case 'connected':
      artwork = <><Path d="m20 29-4 4a8 8 0 1 1-11-11l7-7a8 8 0 0 1 12 1M28 19l4-4a8 8 0 1 1 11 11l-7 7a8 8 0 0 1-12-1M16 32l16-16" {...stroke} /></>;
      break;
    case 'globe':
      artwork = <><Circle cx="23" cy="23" r="18" {...stroke} /><Path d="M5 23h36M23 5c6 6 9 12 9 18s-3 12-9 18M23 5c-6 6-9 12-9 18s3 12 9 18" {...stroke} /><Circle cx="38" cy="38" r="7" fill="#052544" stroke={color} strokeWidth="2" /><Path d="M35 38h6M38 35v6" {...stroke} /></>;
      break;
    case 'appearance':
      artwork = <Path d="M32 7a17 17 0 1 0 9 27A16 16 0 0 1 32 7Z" {...stroke} />;
      break;
    case 'notifications':
      artwork = <><Path d="M10 35h28l-4-6v-8c0-7-4-12-10-12S14 14 14 21v8ZM20 40c1 4 7 4 8 0" {...stroke} /><Path d="M24 5v4" {...stroke} /></>;
      break;
    case 'network':
      artwork = <><Path d="m24 4 17 10v20L24 44 7 34V14Z" {...stroke} /><Circle cx="24" cy="13" r="2" fill={color} /><Circle cx="15" cy="28" r="2" fill={color} /><Circle cx="33" cy="28" r="2" fill={color} /><Path d="m24 15-9 11m9-11 9 11M17 28h14M24 15v21M15 28l9 8 9-8" {...stroke} /></>;
      break;
    case 'travel':
      artwork = <><Rect x="8" y="16" width="32" height="25" rx="5" {...stroke} /><Path d="M18 16v-5h12v5M8 25h32" {...stroke} /><Rect x="19" y="23" width="10" height="13" rx="2" {...stroke} /></>;
      break;
    case 'auto':
      artwork = <><Path d="M9 19A16 16 0 0 1 36 11l4 5M40 9v7h-8M39 29A16 16 0 0 1 12 37l-4-5M8 39v-7h8" {...stroke} /></>;
      break;
    case 'spend':
      artwork = <><Rect x="6" y="12" width="36" height="26" rx="5" {...stroke} /><Path d="M6 20h36M13 31h10" {...stroke} /></>;
      break;
    case 'support':
      artwork = <><Circle cx="24" cy="24" r="19" {...stroke} /><Path d="M18 18c1-5 11-7 13-1 2 5-5 6-7 10v3M24 37h.1" {...stroke} /></>;
      break;
    case 'contact':
      artwork = <><Path d="M8 27v-5a16 16 0 0 1 32 0v5M8 26h7v12H9a4 4 0 0 1-4-4v-4a4 4 0 0 1 3-4ZM40 26h-7v12h6a4 4 0 0 0 4-4v-4a4 4 0 0 0-3-4ZM33 38c-2 4-5 5-10 5" {...stroke} /></>;
      break;
    case 'info':
      artwork = <><Circle cx="24" cy="24" r="19" {...stroke} /><Path d="M24 21v13M24 14h.1" {...stroke} /></>;
      break;
    case 'logout':
      artwork = <><Path d="M21 8H9v32h12M29 16l8 8-8 8M16 24h21" {...stroke} /></>;
      break;
    default:
      artwork = null;
  }

  return <Svg accessibilityLabel={kind + ' settings icon'} width={size} height={size} viewBox="0 0 48 48" fill="none">{artwork}</Svg>;
}

function StatusBadge({ label, color, shield = false, compact }: { label: string; color: string; shield?: boolean; compact: boolean }) {
  return (
    <View style={styles.statusBadge}>
      {shield ? <SettingsArtwork kind="shield" color={color} size={compact ? 16 : 20} /> : <View style={[styles.statusDot, { borderColor: color }]}><Text style={[styles.statusCheck, { color }]}>✓</Text></View>}
      <Text numberOfLines={1} style={[styles.statusBadgeText, compact && styles.statusBadgeTextCompact, { color }]}>{label}</Text>
    </View>
  );
}

function SystemStatusPill({ label, color, compact }: { label: string; color: string; compact: boolean }) {
  return (
    <View accessibilityLabel={'All Systems ' + label} style={[styles.systemPill, compact && styles.systemPillCompact, { borderColor: color + '55' }]}>
      <SettingsArtwork kind="shield" color={color} size={compact ? 27 : 35} />
      <View>
        <Text style={[styles.systemTop, compact && styles.systemTopCompact]}>All Systems</Text>
        <Text style={[styles.systemBottom, compact && styles.systemBottomCompact, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

function SettingsHeader({ compact, statusLabel, statusColor, onHelp }: { compact: boolean; statusLabel: string; statusColor: string; onHelp(): void }) {
  const navigation = useNavigation<any>();
  const goBack = () => {
    if (navigation.canGoBack?.()) navigation.goBack();
    else navigation.navigate('Portfolio');
  };

  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <Pressable testID="settings-back" accessibilityRole="button" accessibilityLabel="Go back from Settings" onPress={goBack} style={({ pressed }) => [styles.backButton, compact && styles.backButtonCompact, pressed && styles.pressed]}>
        <SettingsArtwork kind="back" color={C.text} size={compact ? 27 : 36} />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text numberOfLines={1} style={[styles.headerTitle, compact && styles.headerTitleCompact]}>Settings</Text>
        <Text numberOfLines={1} style={[styles.headerSubtitle, compact && styles.headerSubtitleCompact]}>Customize your Nomad experience</Text>
      </View>
      <View style={[styles.headerActions, compact && styles.headerActionsCompact]}>
        <SystemStatusPill label={statusLabel} color={statusColor} compact={compact} />
        <Pressable testID="settings-header-help" accessibilityRole="button" accessibilityLabel="Open Settings help" onPress={onHelp} style={({ pressed }) => [styles.helpButton, compact && styles.helpButtonCompact, pressed && styles.pressed]}>
          <SettingsArtwork kind="help" color="#c8d4e6" size={compact ? 25 : 33} />
        </Pressable>
      </View>
    </View>
  );
}

function ChoiceGroup({ title, choices, selected, onSelect }: { title: string; choices: string[]; selected: string; onSelect(value: string): void }) {
  return (
    <View style={styles.choiceGroup}>
      <Text style={styles.choiceTitle}>{title}</Text>
      <View style={styles.choiceWrap}>
        {choices.map((choice) => {
          const active = choice === selected;
          return (
            <Pressable
              key={choice}
              testID={'settings-choice-' + testSlug(title) + '-' + testSlug(choice)}
              accessibilityRole="button"
              accessibilityLabel={'Choose ' + choice + ' for ' + title}
              onPress={() => onSelect(choice)}
              style={[styles.choiceButton, active && styles.choiceButtonActive]}
            >
              <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ToggleRow({ id, label, note, enabled, onPress }: { id: string; label: string; note: string; enabled: boolean; onPress(): void }) {
  return (
    <Pressable testID={'settings-toggle-' + id} accessibilityRole="switch" accessibilityState={{ checked: enabled }} accessibilityLabel={label} onPress={onPress} style={styles.toggleRow}>
      <View style={styles.toggleCopy}><Text style={styles.toggleLabel}>{label}</Text><Text style={styles.toggleNote}>{note}</Text></View>
      <View style={[styles.toggle, enabled && styles.toggleOn]}><View style={[styles.toggleKnob, enabled && styles.toggleKnobOn]} /></View>
    </Pressable>
  );
}

function IconTile({ kind, color, compact }: { kind: SettingsArtworkKind; color: string; compact: boolean }) {
  return (
    <View style={[styles.iconTile, compact && styles.iconTileCompact, { borderColor: color + '45', backgroundColor: color + '10' }]}>
      <SettingsArtwork kind={kind} color={color} size={compact ? 27 : 36} />
    </View>
  );
}

function ShortcutCard({ item, compact, onAction }: { item: NomadEditableSettingsShortcut; compact: boolean; onAction(action?: NomadSettingsActionKey, route?: string): void }) {
  const color = item.color || C.blue;
  return (
    <Pressable
      testID={'settings-shortcut-' + testSlug(item.title)}
      accessibilityRole="button"
      accessibilityLabel={'Open ' + item.title}
      onPress={() => onAction(item.actionKey, item.route)}
      style={({ pressed }) => [styles.shortcut, compact && styles.shortcutCompact, pressed && styles.pressed]}
    >
      <View style={styles.shortcutTop}><IconTile kind={shortcutArtwork[item.title] || 'preferences'} color={color} compact={compact} /><Text style={[styles.chevron, compact && styles.chevronCompact]}>›</Text></View>
      <Text numberOfLines={1} style={[styles.shortcutTitle, compact && styles.shortcutTitleCompact]}>{item.title}</Text>
      <Text numberOfLines={1} style={[styles.shortcutSub, compact && styles.shortcutSubCompact]}>{item.subtitle}</Text>
    </Pressable>
  );
}

function SettingSection({ title, rows, compact, onAction }: { title: string; rows: NomadEditableSettingsRow[]; compact: boolean; onAction(action?: NomadSettingsActionKey, route?: string): void }) {
  return (
    <Panel style={[styles.sectionPanel, compact && styles.sectionPanelCompact]}>
      <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>{title}</Text>
      <View style={styles.sectionRows}>
        {rows.map((row, index) => {
          const color = row.color || C.blue;
          return (
            <Pressable
              key={row.title}
              testID={'settings-row-' + testSlug(row.title)}
              accessibilityRole="button"
              accessibilityLabel={'Open ' + row.title}
              onPress={() => onAction(row.actionKey, row.route)}
              style={({ pressed }) => [styles.settingRow, compact && styles.settingRowCompact, index > 0 && styles.rowBorder, pressed && styles.pressed]}
            >
              <IconTile kind={rowArtwork[row.title] || 'info'} color={color} compact={compact} />
              <View style={styles.settingCopy}><Text style={[styles.settingTitle, compact && styles.settingTitleCompact]}>{row.title}</Text><Text numberOfLines={1} style={[styles.settingSub, compact && styles.settingSubCompact]}>{row.subtitle}</Text></View>
              {row.value ? <Text style={[styles.settingValue, compact && styles.settingValueCompact, row.value === 'OFF' && { color: C.muted }]}>{row.value}</Text> : null}
              <Text style={[styles.chevron, compact && styles.chevronCompact]}>›</Text>
            </Pressable>
          );
        })}
      </View>
    </Panel>
  );
}

function LegalPanel({ kind, compact, onBack }: { kind: 'terms' | 'privacy'; compact: boolean; onBack(): void }) {
  const terms = kind === 'terms';
  return (
    <Panel style={[styles.editorPanel, compact && styles.editorPanelCompact]}>
      <View style={styles.editorHeadingRow}>
        <Text style={[styles.editorTitle, compact && styles.editorTitleCompact]}>{terms ? 'TERMS OF USE' : 'PRIVACY'}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Return to About Nomad" onPress={onBack}><Text style={styles.editorLink}>About Nomad ›</Text></Pressable>
      </View>
      <Text style={styles.legalText}>
        {terms
          ? 'Nomad is a non-custodial interface. Wallet owners remain responsible for addresses, approvals, network fees, recovery material and applicable laws. Preview or unavailable providers never represent a completed financial transaction.'
          : 'Nomad does not need custody of raw private keys or recovery phrases. Local preview settings and support drafts remain inside the current device storage boundary unless a clearly identified remote provider is connected and approved.'}
      </Text>
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

  const identityActive = settings.identityStatus === 'Wallet Identity Active';
  const levelTwo = settings.securityLevel === 'Level 2 Security';
  const allSecure = identityActive && levelTwo && !error;
  const statusLabel = loading ? 'CHECKING' : allSecure ? 'SECURE' : 'REVIEW';
  const statusColor = loading ? C.blue : allSecure ? C.green : C.yellow;
  const identityColor = identityActive ? C.green : C.yellow;
  const levelColor = levelTwo ? C.blue : C.yellow;

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
      setFeedback('Auto-Convert ' + (next ? 'enabled' : 'paused') + ' through Travel Pocket.');
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
      setFeedback('Support draft created: ' + draft.id + '. It has not been submitted to a remote support service.');
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
    if (activePanel === 'terms' || activePanel === 'privacy') return <LegalPanel kind={activePanel} compact={compact} onBack={() => setActivePanel('about')} />;

    if (activePanel === 'profile') {
      return (
        <Panel style={[styles.editorPanel, compact && styles.editorPanelCompact]}>
          <Text style={[styles.editorTitle, compact && styles.editorTitleCompact]}>EDIT PROFILE</Text>
          <Text style={styles.editorNote}>Profile details stay inside the current Nomad settings boundary.</Text>
          <TextInput testID="settings-profile-name" accessibilityLabel="Nomad display name" value={displayName} onChangeText={setDisplayName} placeholder="Display name" placeholderTextColor={C.muted} style={styles.input} />
          <TextInput testID="settings-profile-email" accessibilityLabel="Nomad email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor={C.muted} style={styles.input} />
          <Pressable testID="settings-save-profile" accessibilityRole="button" accessibilityLabel="Save Nomad profile" disabled={saving} onPress={saveProfile} style={[styles.primaryButton, saving && styles.disabled]}><Text style={styles.primaryText}>Save Profile</Text></Pressable>
        </Panel>
      );
    }

    if (activePanel === 'preferences') {
      const actions: NomadSettingsActionKey[] = ['currency_language', 'appearance', 'notifications', 'default_network'];
      return (
        <Panel style={[styles.editorPanel, compact && styles.editorPanelCompact]}>
          <Text style={[styles.editorTitle, compact && styles.editorTitleCompact]}>PREFERENCES</Text>
          <Text style={styles.editorNote}>Choose a preference below. Each choice opens its working control.</Text>
          <View style={styles.quickGrid}>
            {actions.map((action) => <Pressable key={action} testID={'settings-quick-' + action} accessibilityRole="button" onPress={() => setActivePanel(action)} style={styles.quickButton}><Text style={styles.quickText}>{action.replace(/_/g, ' ')}</Text></Pressable>)}
          </View>
        </Panel>
      );
    }

    if (activePanel === 'currency_language') {
      return (
        <Panel style={[styles.editorPanel, compact && styles.editorPanelCompact]}>
          <Text style={[styles.editorTitle, compact && styles.editorTitleCompact]}>CURRENCY & LANGUAGE</Text>
          <ChoiceGroup title="Display currency" choices={currencyChoices} selected={settings.defaultCurrency} onSelect={(value) => void save({ defaultCurrency: value }, value + ' display currency saved.')} />
          <ChoiceGroup title="Language" choices={languageChoices} selected={settings.language} onSelect={(value) => void save({ language: value }, value + ' language preference saved.')} />
        </Panel>
      );
    }

    if (activePanel === 'appearance') {
      return (
        <Panel style={[styles.editorPanel, compact && styles.editorPanelCompact]}>
          <Text style={[styles.editorTitle, compact && styles.editorTitleCompact]}>APPEARANCE</Text>
          <ChoiceGroup title="Theme preference" choices={appearanceChoices} selected={settings.appearance} onSelect={(value) => void save({ appearance: value }, value + ' preference saved. The approved dark interface remains active until the global theme bridge is connected.')} />
        </Panel>
      );
    }

    if (activePanel === 'notifications') {
      return (
        <Panel style={[styles.editorPanel, compact && styles.editorPanelCompact]}>
          <Text style={[styles.editorTitle, compact && styles.editorTitleCompact]}>NOTIFICATIONS</Text>
          <ToggleRow id="push" label="Push Notifications" note="Device alerts when a native bridge is connected" enabled={settings.notifications.push} onPress={() => toggleNotification('push')} />
          <ToggleRow id="email" label="Email Notifications" note="Email delivery when a mail provider is connected" enabled={settings.notifications.email} onPress={() => toggleNotification('email')} />
          <ToggleRow id="security" label="Security Alerts" note="Freeze, recovery and authority events" enabled={settings.notifications.security} onPress={() => toggleNotification('security')} />
          <ToggleRow id="travel" label="Travel Alerts" note="Travel Pocket activity and limits" enabled={settings.notifications.travel} onPress={() => toggleNotification('travel')} />
        </Panel>
      );
    }

    if (activePanel === 'default_network') {
      return (
        <Panel style={[styles.editorPanel, compact && styles.editorPanelCompact]}>
          <Text style={[styles.editorTitle, compact && styles.editorTitleCompact]}>DEFAULT NETWORK</Text>
          <ChoiceGroup title="Preferred network" choices={networkChoices} selected={settings.defaultNetwork} onSelect={(value) => void save({ defaultNetwork: value }, value + ' saved as the preferred network.')} />
          <Text style={styles.editorNote}>This is a preference. Each transaction still validates its actual asset network before review.</Text>
        </Panel>
      );
    }

    if (activePanel === 'pay_spend') {
      return (
        <Panel style={[styles.editorPanel, compact && styles.editorPanelCompact]}>
          <Text style={[styles.editorTitle, compact && styles.editorTitleCompact]}>PAY / SPEND SETTINGS</Text>
          <ChoiceGroup title="Default stable-value currency" choices={spendChoices} selected={settings.paySpendCurrency} onSelect={(value) => void save({ paySpendCurrency: value }, value + ' saved for Pay / Spend presentation.')} />
        </Panel>
      );
    }

    if (activePanel === 'connected_apps') {
      return (
        <Panel style={[styles.editorPanel, compact && styles.editorPanelCompact]}>
          <Text style={[styles.editorTitle, compact && styles.editorTitleCompact]}>CONNECTED APPS & SERVICES</Text>
          <Text style={styles.editorNote}>System services are separated from external dApps. This build does not claim external permissions that are not connected.</Text>
          {settings.connectedApps.map((app, index) => (
            <Pressable key={app.id} testID={'settings-connected-' + app.id} accessibilityRole="button" accessibilityLabel={'Open ' + app.title} disabled={!app.route} onPress={() => app.route && navigation.navigate(app.route)} style={[styles.appRow, index > 0 && styles.rowBorder, !app.route && styles.disabled]}>
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
        <Panel style={[styles.editorPanel, compact && styles.editorPanelCompact]}>
          <Text style={[styles.editorTitle, compact && styles.editorTitleCompact]}>HELP CENTER</Text>
          <Text style={styles.helpHeading}>Wallet access</Text><Text style={styles.helpText}>Use Time Clock Access and the approved recovery flow. Nomad never asks for recovery material through support.</Text>
          <Text style={styles.helpHeading}>Security</Text><Text style={styles.helpText}>Use Security Center for independent module checks and Emergency Freeze for urgent protection.</Text>
          <Text style={styles.helpHeading}>Travel Pocket</Text><Text style={styles.helpText}>Select a destination first, then activate Travel Mode. Destination selection never activates spending automatically.</Text>
        </Panel>
      );
    }

    if (activePanel === 'contact_support') {
      return (
        <Panel style={[styles.editorPanel, compact && styles.editorPanelCompact]}>
          <Text style={[styles.editorTitle, compact && styles.editorTitleCompact]}>CONTACT SUPPORT</Text>
          <Text style={styles.editorNote}>This creates a local draft only. A remote support desk is not connected.</Text>
          <TextInput testID="settings-support-message" accessibilityLabel="Support message" value={supportMessage} onChangeText={setSupportMessage} multiline placeholder="Describe the issue without including private keys or recovery material" placeholderTextColor={C.muted} style={[styles.input, styles.supportInput]} />
          <Pressable testID="settings-create-support-draft" accessibilityRole="button" accessibilityLabel="Create local support draft" disabled={saving} onPress={() => void saveSupportDraft()} style={[styles.primaryButton, saving && styles.disabled]}><Text style={styles.primaryText}>Create Support Draft</Text></Pressable>
        </Panel>
      );
    }

    if (activePanel === 'about') {
      return (
        <Panel style={[styles.editorPanel, compact && styles.editorPanelCompact]}>
          <Text style={[styles.editorTitle, compact && styles.editorTitleCompact]}>ABOUT NOMAD</Text>
          <Text style={styles.aboutValue}>{settings.appVersion}</Text>
          <Text style={styles.editorNote}>Nomad is a non-custodial wallet interface built around Arkrilium protocol services and Reqrium safety tooling. The connected wallet engine remains responsible for private keys, signing and broadcasting.</Text>
          <View style={styles.legalButtons}>
            <Pressable testID="settings-about-terms" accessibilityRole="button" accessibilityLabel="Read Nomad Terms of Use" onPress={() => setActivePanel('terms')} style={styles.legalButton}><Text style={styles.legalButtonText}>Terms of Use</Text></Pressable>
            <Pressable testID="settings-about-privacy" accessibilityRole="button" accessibilityLabel="Read Nomad Privacy information" onPress={() => setActivePanel('privacy')} style={styles.legalButton}><Text style={styles.legalButtonText}>Privacy</Text></Pressable>
          </View>
          <Text style={styles.persistenceWarning}>Current settings persistence: {settings.persistence.replace(/_/g, ' ')}.</Text>
        </Panel>
      );
    }

    if (activePanel === 'logout') {
      return (
        <Panel style={[styles.logoutConfirm, compact && styles.editorPanelCompact]}>
          <Text style={[styles.logoutConfirmTitle, compact && styles.editorTitleCompact]}>LOCK WALLET SESSION?</Text>
          <Text style={styles.logoutConfirmText}>You will return to Time Clock Access. This does not delete the wallet or recovery setup.</Text>
          <View style={styles.confirmButtons}>
            <Pressable testID="settings-cancel-logout" accessibilityRole="button" accessibilityLabel="Cancel wallet logout" onPress={() => setActivePanel(null)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
            <Pressable testID="settings-confirm-logout" accessibilityRole="button" accessibilityLabel="Lock Nomad wallet session" disabled={saving} onPress={() => void confirmLogOut()} style={[styles.logoutButton, saving && styles.disabled]}><Text style={styles.logoutButtonText}>{saving ? 'Locking…' : 'Lock Session'}</Text></Pressable>
          </View>
        </Panel>
      );
    }

    return null;
  };

  return (
    <NomadPage maxWidth={920}>
      <SettingsHeader compact={compact} statusLabel={statusLabel} statusColor={statusColor} onHelp={() => { setFeedback(''); setActivePanel('help'); }} />

      {error ? <View style={styles.errorBanner}><Text style={styles.error}>{error}</Text><Pressable accessibilityRole="button" accessibilityLabel="Retry Settings" onPress={() => void refresh()}><Text style={styles.retry}>Retry</Text></Pressable></View> : null}

      <Panel tone="blue" style={[styles.profilePanel, compact && styles.profilePanelCompact]}>
        <NomadBrandMark size={compact ? 61 : 82} />
        <View style={[styles.profileCopy, compact && styles.profileCopyCompact]}>
          <View style={styles.profileNameRow}>
            <Text numberOfLines={1} style={[styles.profileName, compact && styles.profileNameCompact]}>{settings.displayName}</Text>
            <Pressable testID="settings-edit-profile" accessibilityRole="button" accessibilityLabel="Edit Nomad profile" onPress={() => setActivePanel('profile')} style={({ pressed }) => [styles.editBadge, compact && styles.editBadgeCompact, pressed && styles.pressed]}><SettingsArtwork kind="edit" color={C.blue} size={compact ? 19 : 24} /></Pressable>
          </View>
          <Text numberOfLines={1} style={[styles.profileEmail, compact && styles.profileEmailCompact]}>{settings.email}</Text>
          <View style={[styles.profileStatus, compact && styles.profileStatusCompact]}>
            <StatusBadge label={settings.identityStatus} color={identityColor} compact={compact} />
            <View style={styles.statusDivider} />
            <StatusBadge label={settings.securityLevel} color={levelColor} shield compact={compact} />
          </View>
        </View>
        <Pressable testID="settings-profile" accessibilityRole="button" accessibilityLabel="Open Nomad profile" onPress={() => setActivePanel('profile')}><Text style={[styles.chevron, compact && styles.chevronCompact]}>›</Text></Pressable>
      </Panel>

      <View style={[styles.shortcutGrid, compact && styles.shortcutGridCompact]}>{settings.shortcuts.map((item) => <ShortcutCard key={item.title} item={item} compact={compact} onAction={openAction} />)}</View>

      {renderEditor()}
      {feedback ? <Text accessibilityLiveRegion="polite" style={[styles.feedback, /unable|invalid|unsupported|blocks/i.test(feedback) && { color: C.red }]}>{feedback}</Text> : null}

      <SettingSection title="PREFERENCES" rows={settings.preferenceRows} compact={compact} onAction={openAction} />
      <SettingSection title="NOMAD FEATURES" rows={settings.featureRows} compact={compact} onAction={openAction} />
      <SettingSection title="SUPPORT & INFORMATION" rows={settings.supportRows} compact={compact} onAction={openAction} />

      <Pressable testID="settings-logout" accessibilityRole="button" accessibilityLabel="Log out of Nomad" disabled={loading} onPress={() => { setFeedback(''); setActivePanel('logout'); }} style={({ pressed }) => [styles.logoutPanel, compact && styles.logoutPanelCompact, pressed && styles.pressed, loading && styles.disabled]}>
        <View style={[styles.logoutIcon, compact && styles.logoutIconCompact]}><SettingsArtwork kind="logout" color={C.red} size={compact ? 29 : 38} /></View>
        <View style={styles.logoutCopy}><Text style={[styles.logoutTitle, compact && styles.logoutTitleCompact]}>Log Out</Text><Text style={[styles.logoutSub, compact && styles.logoutSubCompact]}>Securely lock the current Nomad wallet session</Text></View>
        <Text style={[styles.chevron, compact && styles.chevronCompact]}>›</Text>
      </Pressable>

      <BottomNav
        active="Settings"
        items={[
          ['⌂', 'Home', 'Portfolio'],
          ['▣', 'Wallets', 'Wallets'],
          ['✈', 'Travel', 'TravelMode'],
          ['◇', 'Security', 'SecurityCenter'],
          ['⚙', 'Settings', 'Settings'],
        ]}
      />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: .7 },
  disabled: { opacity: .48 },
  header: { minHeight: 82, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCompact: { minHeight: 58, marginBottom: 10, gap: 6 },
  backButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  backButtonCompact: { width: 34, height: 34, borderRadius: 17 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: C.text, fontSize: 31, fontWeight: '900', letterSpacing: -.7 },
  headerTitleCompact: { fontSize: 20 },
  headerSubtitle: { color: '#c8d2df', fontSize: 13, marginTop: 3 },
  headerSubtitleCompact: { fontSize: 8.5, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerActionsCompact: { gap: 5 },
  systemPill: { minHeight: 54, borderWidth: 1, borderRadius: 999, backgroundColor: 'rgba(2,15,27,.94)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  systemPillCompact: { minHeight: 39, paddingHorizontal: 8, gap: 4 },
  systemTop: { color: '#d8e3ef', fontSize: 11 },
  systemTopCompact: { fontSize: 7.5 },
  systemBottom: { fontSize: 13, fontWeight: '900', marginTop: 1 },
  systemBottomCompact: { fontSize: 8.5 },
  helpButton: { width: 45, height: 45, borderRadius: 23, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  helpButtonCompact: { width: 34, height: 34, borderRadius: 17 },
  errorBanner: { marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 10, padding: 11, flexDirection: 'row', alignItems: 'center' },
  error: { flex: 1, color: C.red, fontSize: 11 },
  retry: { color: C.blue, fontSize: 11, fontWeight: '900' },
  profilePanel: { minHeight: 132, paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', borderColor: C.blue },
  profilePanelCompact: { minHeight: 101, paddingHorizontal: 13, paddingVertical: 13 },
  profileCopy: { flex: 1, minWidth: 0, marginLeft: 18 },
  profileCopyCompact: { marginLeft: 11 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center' },
  profileName: { flexShrink: 1, color: '#fff', fontSize: 23, fontWeight: '900' },
  profileNameCompact: { fontSize: 16 },
  editBadge: { marginLeft: 10, borderRadius: 8, backgroundColor: 'rgba(22,140,255,.13)', padding: 5 },
  editBadgeCompact: { marginLeft: 7, borderRadius: 6, padding: 3 },
  profileEmail: { color: '#c0c9d6', fontSize: 13, marginTop: 6 },
  profileEmailCompact: { fontSize: 9, marginTop: 4 },
  profileStatus: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  profileStatusCompact: { gap: 5, marginTop: 8 },
  statusBadge: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  statusCheck: { fontSize: 10, fontWeight: '900', lineHeight: 12 },
  statusBadgeText: { flexShrink: 1, fontSize: 10.5, fontWeight: '800' },
  statusBadgeTextCompact: { fontSize: 7 },
  statusDivider: { width: 1, height: 19, backgroundColor: '#52667d' },
  chevron: { color: '#b7c4d6', fontSize: 28, marginLeft: 7 },
  chevronCompact: { fontSize: 21, marginLeft: 3 },
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  shortcutGridCompact: { gap: 6, marginTop: 10 },
  shortcut: { flexGrow: 1, flexBasis: 190, minHeight: 126, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.panel, padding: 15 },
  shortcutCompact: { flexBasis: 82, minHeight: 83, borderRadius: 10, padding: 9 },
  shortcutTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  shortcutTitle: { color: '#fff', fontSize: 14, fontWeight: '900', marginTop: 13 },
  shortcutTitleCompact: { fontSize: 9.5, marginTop: 8 },
  shortcutSub: { color: C.muted, fontSize: 10, marginTop: 5 },
  shortcutSubCompact: { fontSize: 7, marginTop: 3 },
  iconTile: { width: 52, height: 52, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconTileCompact: { width: 36, height: 36, borderRadius: 9 },
  editorPanel: { marginTop: 16, padding: 16, borderColor: '#135f9e' },
  editorPanelCompact: { marginTop: 10, padding: 11 },
  editorHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  editorTitle: { color: '#9ed3ff', fontSize: 14, fontWeight: '900', letterSpacing: .4 },
  editorTitleCompact: { fontSize: 11 },
  editorLink: { color: C.blue, fontSize: 10, fontWeight: '900' },
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
  legalButtons: { flexDirection: 'row', gap: 9, marginTop: 13 },
  legalButton: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: C.blue, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  legalButtonText: { color: C.blue, fontSize: 10, fontWeight: '900' },
  legalText: { color: '#d5dfec', fontSize: 10, lineHeight: 17, marginTop: 12 },
  persistenceWarning: { color: C.yellow, fontSize: 10, lineHeight: 16, marginTop: 12 },
  feedback: { color: C.green, fontSize: 10, lineHeight: 15, marginTop: 10 },
  sectionPanel: { marginTop: 16, padding: 16 },
  sectionPanelCompact: { marginTop: 10, padding: 10 },
  sectionTitle: { color: '#a5d6ff', fontSize: 14, fontWeight: '900', marginBottom: 5 },
  sectionTitleCompact: { fontSize: 10.5, marginBottom: 3 },
  sectionRows: { borderWidth: 1, borderColor: C.borderSoft, borderRadius: 12, overflow: 'hidden' },
  settingRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9 },
  settingRowCompact: { minHeight: 55, paddingHorizontal: 8, paddingVertical: 7 },
  rowBorder: { borderTopWidth: 1, borderTopColor: C.borderSoft },
  settingCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  settingTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  settingTitleCompact: { fontSize: 9.5 },
  settingSub: { color: C.muted, fontSize: 10, lineHeight: 14, marginTop: 4 },
  settingSubCompact: { fontSize: 7.5, lineHeight: 11, marginTop: 2 },
  settingValue: { color: C.green, fontSize: 10, fontWeight: '900', marginLeft: 8 },
  settingValueCompact: { fontSize: 8 },
  logoutPanel: { minHeight: 86, marginTop: 16, borderWidth: 1, borderColor: C.red, borderRadius: 15, backgroundColor: 'rgba(42,8,20,.72)', padding: 14, flexDirection: 'row', alignItems: 'center' },
  logoutPanelCompact: { minHeight: 66, marginTop: 10, borderRadius: 11, padding: 10 },
  logoutIcon: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255,46,74,.12)', alignItems: 'center', justifyContent: 'center' },
  logoutIconCompact: { width: 39, height: 39, borderRadius: 9 },
  logoutCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  logoutTitle: { color: C.red, fontSize: 14, fontWeight: '900' },
  logoutTitleCompact: { fontSize: 10.5 },
  logoutSub: { color: '#d8d1dc', fontSize: 10, marginTop: 4 },
  logoutSubCompact: { fontSize: 7.5, marginTop: 2 },
  logoutConfirm: { marginTop: 16, padding: 16, borderColor: C.red },
  logoutConfirmTitle: { color: C.red, fontSize: 14, fontWeight: '900' },
  logoutConfirmText: { color: '#e4dce5', fontSize: 10, lineHeight: 16, marginTop: 7 },
  confirmButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelButton: { flex: 1, minHeight: 47, borderWidth: 1, borderColor: C.border, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  logoutButton: { flex: 1, minHeight: 47, borderRadius: 9, backgroundColor: '#8f2638', alignItems: 'center', justifyContent: 'center' },
  logoutButtonText: { color: '#fff', fontSize: 11, fontWeight: '900' },
});
