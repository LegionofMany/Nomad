import { getWalletMeta, lockWallet } from '../../services/walletService';
import { secureGetItem, secureSetItem } from '../../services/nativeStubs';

import { nomadSecurityAdapter } from './nomadSecurityAdapter';
import { nomadTravelAdapter } from './nomadTravelAdapter';
import type {
  NomadSettingsAdapter,
  NomadSettingsRow,
  NomadSettingsShortcut,
  NomadSettingsState,
} from './walletAdapter';

const STORAGE_KEY = 'nomad.settings.extended';
const SUPPORT_KEY = 'nomad.settings.supportDrafts';

export type NomadSettingsActionKey =
  | 'profile'
  | 'preferences'
  | 'connected_apps'
  | 'currency_language'
  | 'appearance'
  | 'notifications'
  | 'default_network'
  | 'travel_pocket'
  | 'auto_convert'
  | 'pay_spend'
  | 'help'
  | 'contact_support'
  | 'about';

export type NomadEditableSettingsRow = NomadSettingsRow & {
  actionKey?: NomadSettingsActionKey;
};

export type NomadEditableSettingsShortcut = NomadSettingsShortcut & {
  actionKey?: NomadSettingsActionKey;
};

export type NomadConnectedApp = {
  id: string;
  title: string;
  subtitle: string;
  status: 'system' | 'available' | 'not_connected';
  route?: string;
};

export type NomadNotificationSettings = {
  push: boolean;
  email: boolean;
  security: boolean;
  travel: boolean;
};

export type NomadEditableSettingsState = Omit<
  NomadSettingsState,
  'shortcuts' | 'preferenceRows' | 'featureRows' | 'supportRows'
> & {
  shortcuts: NomadEditableSettingsShortcut[];
  preferenceRows: NomadEditableSettingsRow[];
  featureRows: NomadEditableSettingsRow[];
  supportRows: NomadEditableSettingsRow[];
  notifications: NomadNotificationSettings;
  paySpendCurrency: string;
  connectedApps: NomadConnectedApp[];
  dataSource: 'local_settings_adapter';
  persistence: 'in_memory_stub';
  updatedAt: string;
};

export type NomadSettingsUpdate = Partial<{
  displayName: string;
  email: string;
  defaultCurrency: string;
  language: string;
  appearance: string;
  defaultNetwork: string;
  paySpendCurrency: string;
  notifications: NomadNotificationSettings;
}>;

export type NomadSupportDraft = {
  id: string;
  message: string;
  status: 'draft';
  createdAt: string;
};

export type NomadEditableSettingsAdapter = NomadSettingsAdapter & {
  getEditableSettingsState(): Promise<NomadEditableSettingsState>;
  updateSettings(update: NomadSettingsUpdate): Promise<NomadEditableSettingsState>;
  setAutoConvert(enabled: boolean): Promise<NomadEditableSettingsState>;
  createSupportDraft(message: string): Promise<NomadSupportDraft>;
};

type StoredSettings = {
  displayName: string;
  email: string;
  defaultCurrency: string;
  language: string;
  appearance: string;
  defaultNetwork: string;
  paySpendCurrency: string;
  notifications: NomadNotificationSettings;
  updatedAt: string;
};

const supportedCurrencies = new Set(['USD', 'CAD', 'EUR', 'GBP', 'JPY', 'NGN', 'AUD']);
const supportedLanguages = new Set(['English', 'French', 'Spanish']);
const supportedAppearances = new Set(['Dark Mode', 'System', 'Light Mode']);
const supportedNetworks = new Set([
  'Hedera Mainnet',
  'Bitcoin Mainnet',
  'Ethereum Mainnet',
  'XRPL Mainnet',
  'Stellar Mainnet',
]);

function nowIso() {
  return new Date().toISOString();
}

function defaultSettings(walletEmail: string): StoredSettings {
  return {
    displayName: 'Nomad User',
    email: walletEmail,
    defaultCurrency: 'USD',
    language: 'English',
    appearance: 'Dark Mode',
    defaultNetwork: 'Hedera Mainnet',
    paySpendCurrency: 'USD Stable',
    notifications: { push: true, email: true, security: true, travel: true },
    updatedAt: nowIso(),
  };
}

function cleanName(value: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, 50);
}

function cleanEmail(value: string) {
  return value.trim().toLowerCase().slice(0, 120);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function walletIdentityEmail() {
  const meta = await getWalletMeta();
  if (!meta?.evmAddress) return 'nomad.user@nomadwallet.local';
  return `${meta.evmAddress.slice(0, 6).toLowerCase()}.${meta.evmAddress.slice(-4).toLowerCase()}@nomadwallet.local`;
}

async function loadStoredSettings(): Promise<StoredSettings> {
  const fallback = defaultSettings(await walletIdentityEmail());
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    return {
      ...fallback,
      ...parsed,
      notifications: { ...fallback.notifications, ...(parsed.notifications ?? {}) },
    };
  } catch {
    return fallback;
  }
}

async function saveStoredSettings(next: StoredSettings) {
  await secureSetItem(STORAGE_KEY, JSON.stringify(next));
}

function notificationLabel(settings: NomadNotificationSettings) {
  const enabled = [settings.push, settings.email, settings.security, settings.travel].filter(Boolean).length;
  return `${enabled}/4 notification channels enabled`;
}

function statusLabel(enabled: boolean) {
  return enabled ? 'ON' : 'OFF';
}

async function buildState(): Promise<NomadEditableSettingsState> {
  const [stored, security, travel, walletMeta] = await Promise.all([
    loadStoredSettings(),
    nomadSecurityAdapter.getSecurityState(),
    nomadTravelAdapter.getTravelPocketState(),
    getWalletMeta(),
  ]);

  const travelLabel = `${travel.regionInput ?? 'Global'} • ${travel.localCurrency ?? 'USD Stable'} • ${travel.enabled ? 'Active' : 'Ready'}`;
  const securityLevel = security.score >= 90 ? 'Level 2 Security' : security.score >= 70 ? 'Security Review' : 'Action Required';
  const identityStatus = walletMeta ? 'Wallet Identity Active' : 'Wallet Setup Required';
  const autoConvert = Boolean(travel.autoConvertEnabled);

  return {
    displayName: stored.displayName,
    email: stored.email,
    identityStatus,
    securityLevel,
    defaultCurrency: stored.defaultCurrency,
    language: stored.language,
    appearance: stored.appearance,
    defaultNetwork: stored.defaultNetwork,
    notificationsLabel: notificationLabel(stored.notifications),
    travelPocketLabel: travelLabel,
    autoConvertEnabled: autoConvert,
    paySpendLabel: `Default currency • ${stored.paySpendCurrency}`,
    paySpendCurrency: stored.paySpendCurrency,
    appVersion: 'Version 2.1.0 (120) • Terms • Privacy',
    notifications: stored.notifications,
    connectedApps: [
      { id: 'arkrilium', title: 'Arkrilium Protocols', subtitle: 'System protocol services', status: 'system', route: 'VoltaireProtocols' },
      { id: 'reqrium', title: 'Reqrium Safety', subtitle: 'Address and URL protection tools', status: 'system', route: 'BlockPagesSafety' },
      { id: 'watch', title: 'Nomad Watch', subtitle: 'Wearable connection and security controls', status: 'available', route: 'NomadWatch' },
      { id: 'external', title: 'External dApps', subtitle: 'No external dApp registry is connected', status: 'not_connected' },
    ],
    shortcuts: [
      { title: 'Preferences', subtitle: 'App & display', icon: '≛', color: '#1684ff', actionKey: 'preferences' },
      { title: 'Security', subtitle: `${security.score}/100 protection`, icon: '◇', color: '#35f883', route: 'SecurityCenter' },
      { title: 'Wallets', subtitle: 'Manage wallets', icon: '▣', color: '#8b5cff', route: 'Wallets' },
      { title: 'Connected Apps', subtitle: 'Services & permissions', icon: '⌁', color: '#2af4e4', actionKey: 'connected_apps' },
    ],
    preferenceRows: [
      { title: 'Currency & Language', subtitle: `${stored.defaultCurrency} • ${stored.language}`, icon: '◎', actionKey: 'currency_language' },
      { title: 'Appearance', subtitle: stored.appearance, icon: '◐', actionKey: 'appearance' },
      { title: 'Notifications', subtitle: notificationLabel(stored.notifications), icon: '♢', actionKey: 'notifications' },
      { title: 'Default Network', subtitle: stored.defaultNetwork, icon: '⬡', actionKey: 'default_network' },
    ],
    featureRows: [
      { title: 'Travel Pocket', subtitle: travelLabel, icon: '▤', color: '#35f883', route: 'TravelMode' },
      { title: 'Auto-Convert & Optimize', subtitle: 'Allocate Travel Pocket funding automatically', icon: '⇄', color: '#35f883', value: statusLabel(autoConvert), actionKey: 'auto_convert' },
      { title: 'Pay / Spend Settings', subtitle: `Default currency • ${stored.paySpendCurrency}`, icon: '▭', color: '#35f883', actionKey: 'pay_spend' },
    ],
    supportRows: [
      { title: 'Help Center', subtitle: 'Guides, recovery and security information', icon: '?', actionKey: 'help' },
      { title: 'Contact Support', subtitle: 'Create a local support draft', icon: '☏', actionKey: 'contact_support' },
      { title: 'About Nomad', subtitle: 'Version, terms and privacy information', icon: 'i', actionKey: 'about' },
    ],
    dataSource: 'local_settings_adapter',
    persistence: 'in_memory_stub',
    updatedAt: stored.updatedAt,
  };
}

async function updateSettings(update: NomadSettingsUpdate) {
  const current = await loadStoredSettings();
  const next: StoredSettings = { ...current, updatedAt: nowIso() };

  if (typeof update.displayName === 'string') {
    const name = cleanName(update.displayName);
    if (name.length < 2) throw new Error('Display name must contain at least two characters.');
    next.displayName = name;
  }
  if (typeof update.email === 'string') {
    const email = cleanEmail(update.email);
    if (!validEmail(email)) throw new Error('Enter a valid email address.');
    next.email = email;
  }
  if (typeof update.defaultCurrency === 'string') {
    if (!supportedCurrencies.has(update.defaultCurrency)) throw new Error('Unsupported display currency.');
    next.defaultCurrency = update.defaultCurrency;
  }
  if (typeof update.language === 'string') {
    if (!supportedLanguages.has(update.language)) throw new Error('Unsupported language.');
    next.language = update.language;
  }
  if (typeof update.appearance === 'string') {
    if (!supportedAppearances.has(update.appearance)) throw new Error('Unsupported appearance preference.');
    next.appearance = update.appearance;
  }
  if (typeof update.defaultNetwork === 'string') {
    if (!supportedNetworks.has(update.defaultNetwork)) throw new Error('Unsupported default network.');
    next.defaultNetwork = update.defaultNetwork;
  }
  if (typeof update.paySpendCurrency === 'string') {
    const value = update.paySpendCurrency.trim().slice(0, 40);
    if (!value) throw new Error('Choose a Pay / Spend currency.');
    next.paySpendCurrency = value;
  }
  if (update.notifications) {
    next.notifications = { ...current.notifications, ...update.notifications };
  }

  await saveStoredSettings(next);
  return buildState();
}

async function setAutoConvert(enabled: boolean) {
  if (!nomadTravelAdapter.setAutoConvert) throw new Error('Travel Pocket Auto-Convert is unavailable.');
  await nomadTravelAdapter.setAutoConvert(enabled);
  return buildState();
}

async function createSupportDraft(message: string): Promise<NomadSupportDraft> {
  const normalized = message.trim().replace(/\s+/g, ' ').slice(0, 1000);
  if (normalized.length < 10) throw new Error('Describe the issue in at least ten characters.');
  const draft: NomadSupportDraft = {
    id: `support-draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    message: normalized,
    status: 'draft',
    createdAt: nowIso(),
  };
  const raw = await secureGetItem(SUPPORT_KEY);
  let drafts: NomadSupportDraft[] = [];
  try {
    drafts = raw ? JSON.parse(raw) as NomadSupportDraft[] : [];
  } catch {
    drafts = [];
  }
  await secureSetItem(SUPPORT_KEY, JSON.stringify([draft, ...drafts].slice(0, 10)));
  return draft;
}

export const nomadSettingsAdapter: NomadEditableSettingsAdapter = {
  getSettingsState: () => buildState(),
  getEditableSettingsState: () => buildState(),
  updateSettings,
  setAutoConvert,
  createSupportDraft,
  async logOut() {
    await lockWallet();
    return { status: 'locked' };
  },
};
