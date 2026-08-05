import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters';
import type {
  NomadOverlayAdapters,
  NomadSettingsRow,
  NomadSettingsState,
  NomadSettingsShortcut,
  NomadTravelPocketState,
} from '../adapters/walletAdapter';

type TravelCurrency = { match: RegExp; code: string; stablecoin: string };

const travelCurrencies: TravelCurrency[] = [
  { match: /canada|toronto|vancouver|montreal|alberta|ontario|quebec/i, code: 'CAD', stablecoin: 'CAD Stable' },
  { match: /united states|\busa\b|\bus\b|america|new york|california|florida|texas/i, code: 'USD', stablecoin: 'USD Stable' },
  { match: /mexico|cancun|mexico city/i, code: 'MXN', stablecoin: 'MXN Stable' },
  { match: /europe|france|germany|italy|spain|portugal|netherlands|ireland|greece|austria|belgium/i, code: 'EUR', stablecoin: 'EUR Stable' },
  { match: /united kingdom|\buk\b|england|scotland|wales|london/i, code: 'GBP', stablecoin: 'GBP Stable' },
  { match: /japan|tokyo|osaka|kyoto/i, code: 'JPY', stablecoin: 'JPY Stable' },
  { match: /nigeria|lagos|abuja/i, code: 'NGN', stablecoin: 'NGN Stable' },
  { match: /australia|sydney|melbourne|brisbane/i, code: 'AUD', stablecoin: 'AUD Stable' },
  { match: /india|delhi|mumbai|bangalore/i, code: 'INR', stablecoin: 'INR Stable' },
  { match: /uae|united arab emirates|dubai|abu dhabi/i, code: 'AED', stablecoin: 'AED Stable' },
  { match: /brazil|rio|sao paulo|são paulo/i, code: 'BRL', stablecoin: 'BRL Stable' },
  { match: /south korea|korea|seoul/i, code: 'KRW', stablecoin: 'KRW Stable' },
];

const globalTravelCurrency: TravelCurrency = { match: /.*/, code: 'USD', stablecoin: 'USD Stable' };

const fallbackSettings: NomadSettingsState = {
  displayName: 'Nomad User',
  email: 'nomad.user@nomadwallet.io',
  identityStatus: 'Identity Verified',
  securityLevel: 'Level 2 Security',
  defaultCurrency: 'USD',
  language: 'English',
  appearance: 'Dark Mode',
  defaultNetwork: 'Hedera Mainnet',
  notificationsLabel: 'Push, email, and alerts',
  travelPocketLabel: 'Global • USD Stable • Ready',
  autoConvertEnabled: true,
  paySpendLabel: 'Default currency • USD Stable',
  appVersion: 'Version 2.1.0 (120) • Terms • Privacy',
  shortcuts: [
    { title: 'Preferences', subtitle: 'App & display', icon: '≛', color: '#1684ff', route: 'Settings' },
    { title: 'Security', subtitle: 'Manage protection', icon: '▾', color: '#35f883', route: 'SecurityCenter' },
    { title: 'Wallets', subtitle: 'Manage wallets', icon: '▣', color: '#8b5cff', route: 'Wallets' },
    { title: 'Connected Apps', subtitle: 'DApps & services', icon: '⌁', color: '#2af4e4', route: 'VoltaireProtocols' },
  ],
  preferenceRows: [
    { title: 'Currency & Language', subtitle: 'USD • English', icon: '◎', route: 'Settings' },
    { title: 'Appearance', subtitle: 'Dark Mode', icon: '◐', route: 'Settings' },
    { title: 'Notifications', subtitle: 'Push, email, and alerts', icon: '♢', route: 'SecurityCenter' },
    { title: 'Default Network', subtitle: 'Hedera Mainnet', icon: '⬡', route: 'VoltaireProtocols' },
  ],
  featureRows: [
    { title: 'Travel Pocket', subtitle: 'Global • USD Stable • Ready', icon: '▤', color: '#35f883', route: 'TravelMode' },
    { title: 'Auto-Convert & Optimize', subtitle: 'Optimize for best rates & lowest fees', icon: '⇄', color: '#35f883', value: 'ON', route: 'Swap' },
    { title: 'Pay / Spend Settings', subtitle: 'Default currency • USD Stable', icon: '▭', color: '#35f883', route: 'ApprovePOSTransaction' },
  ],
  supportRows: [
    { title: 'Help Center', subtitle: 'Guides, FAQs & recovery support', icon: '?', route: 'RecoveryCenter' },
    { title: 'Contact Support', subtitle: 'Security and account assistance', icon: '☏', route: 'SecurityCenter' },
    { title: 'About Nomad', subtitle: 'Version 2.1.0 (120) • Terms • Privacy', icon: 'i', route: 'VoltaireProtocols' },
  ],
};

function resolveTravelCurrency(regionInput?: string): TravelCurrency {
  const region = regionInput?.trim() || 'Global';
  return travelCurrencies.find((currency) => currency.match.test(region)) ?? globalTravelCurrency;
}

function normalizeShortcut(shortcut: NomadSettingsShortcut): NomadSettingsShortcut {
  if (shortcut.route) return shortcut;
  if (/preference/i.test(shortcut.title)) return { ...shortcut, route: 'Settings' };
  if (/security/i.test(shortcut.title)) return { ...shortcut, route: 'SecurityCenter' };
  if (/wallet/i.test(shortcut.title)) return { ...shortcut, route: 'Wallets' };
  return { ...shortcut, route: 'VoltaireProtocols' };
}

function normalizeRow(row: NomadSettingsRow, travelLabel: string, paySpendLabel: string, currencyCode: string, language: string, appearance: string): NomadSettingsRow {
  if (/currency/i.test(row.title)) return { ...row, subtitle: `${currencyCode} • ${language}`, route: 'Settings' };
  if (/appearance/i.test(row.title)) return { ...row, subtitle: appearance, route: 'Settings' };
  if (/notification/i.test(row.title)) return { ...row, route: 'SecurityCenter' };
  if (/network/i.test(row.title)) return { ...row, route: 'VoltaireProtocols' };
  if (/travel pocket/i.test(row.title)) return { ...row, subtitle: travelLabel, route: 'TravelMode' };
  if (/auto-convert|optimize/i.test(row.title)) return { ...row, route: 'Swap' };
  if (/pay|spend/i.test(row.title)) return { ...row, subtitle: paySpendLabel, route: 'ApprovePOSTransaction' };
  if (/help/i.test(row.title)) return { ...row, subtitle: 'Guides, FAQs & recovery support', route: 'RecoveryCenter' };
  if (/contact support/i.test(row.title)) return { ...row, subtitle: 'Security and account assistance', route: 'SecurityCenter' };
  if (/about/i.test(row.title)) return { ...row, route: 'VoltaireProtocols' };
  return { ...row, route: row.route ?? 'Settings' };
}

function normalizeSettings(base: NomadSettingsState, travel?: NomadTravelPocketState): NomadSettingsState {
  const regionInput = travel?.regionInput?.trim() || 'Global';
  const currency = resolveTravelCurrency(regionInput);
  const travelLabel = `${regionInput} • ${currency.stablecoin} • ${travel?.enabled ? 'Active' : 'Ready'}`;
  const paySpendLabel = `Default currency • ${currency.stablecoin}`;

  return {
    ...base,
    defaultCurrency: currency.code,
    travelPocketLabel: travelLabel,
    paySpendLabel,
    shortcuts: base.shortcuts.map(normalizeShortcut),
    preferenceRows: base.preferenceRows.map((row) => normalizeRow(row, travelLabel, paySpendLabel, currency.code, base.language, base.appearance)),
    featureRows: base.featureRows.map((row) => normalizeRow(row, travelLabel, paySpendLabel, currency.code, base.language, base.appearance)),
    supportRows: base.supportRows.map((row) => normalizeRow(row, travelLabel, paySpendLabel, currency.code, base.language, base.appearance)),
  };
}

export type NomadSettingsHookState = {
  settings: NomadSettingsState;
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  logOut(): Promise<void>;
};

export function useNomadSettings(adapters?: NomadOverlayAdapters): NomadSettingsHookState {
  const contextAdapters = useNomadAdapters();
  const selectedAdapters = adapters ?? contextAdapters;
  const settingsAdapter = selectedAdapters.settings;
  const travelAdapter = selectedAdapters.travel;
  const [settings, setSettings] = useState<NomadSettingsState>(normalizeSettings(fallbackSettings));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!settingsAdapter) {
      setError('Nomad settings adapter is not connected.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [nextSettings, travel] = await Promise.all([
        settingsAdapter.getSettingsState(),
        travelAdapter?.getTravelPocketState().catch(() => undefined),
      ]);
      setSettings(normalizeSettings(nextSettings, travel));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Nomad settings.');
    } finally {
      setLoading(false);
    }
  }, [settingsAdapter, travelAdapter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logOut = useCallback(async () => {
    if (!settingsAdapter) throw new Error('Nomad settings adapter is not connected.');
    await settingsAdapter.logOut();
    await refresh();
  }, [settingsAdapter, refresh]);

  return useMemo(() => ({ settings, loading, error, refresh, logOut }), [settings, loading, error, refresh, logOut]);
}
