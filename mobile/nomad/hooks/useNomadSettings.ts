import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters';
import type { NomadOverlayAdapters, NomadSettingsState } from '../adapters/walletAdapter';

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
  travelPocketLabel: 'Manage regions, limits & spending',
  autoConvertEnabled: true,
  paySpendLabel: 'Default currency, receipts & more',
  appVersion: 'Version 2.1.0 (120) • Terms • Privacy',
  shortcuts: [
    { title: 'Preferences', subtitle: 'App & display', icon: '≛', color: '#1684ff' },
    { title: 'Security', subtitle: 'Manage protection', icon: '▾', color: '#35f883', route: 'SecurityCenter' },
    { title: 'Wallets', subtitle: 'Manage wallets', icon: '▣', color: '#8b5cff', route: 'Wallets' },
    { title: 'Connected Apps', subtitle: 'DApps & services', icon: '⌁', color: '#2af4e4', route: 'VoltaireProtocols' },
  ],
  preferenceRows: [
    { title: 'Currency & Language', subtitle: 'USD • English', icon: '◎' },
    { title: 'Appearance', subtitle: 'Dark Mode', icon: '◐' },
    { title: 'Notifications', subtitle: 'Push, email, and alerts', icon: '♢', route: 'SecurityCenter' },
    { title: 'Default Network', subtitle: 'Hedera Mainnet', icon: '⬡', route: 'VoltaireProtocols' },
  ],
  featureRows: [
    { title: 'Travel Pocket', subtitle: 'Manage regions, limits & spending', icon: '▤', color: '#35f883', route: 'TravelMode' },
    { title: 'Auto-Convert & Optimize', subtitle: 'Optimize for best rates & lowest fees', icon: '⇄', color: '#35f883', value: 'ON', route: 'Swap' },
    { title: 'Pay / Spend Settings', subtitle: 'Default currency, receipts & more', icon: '▭', color: '#35f883', route: 'ApprovePOSTransaction' },
  ],
  supportRows: [
    { title: 'Help Center', subtitle: 'Guides, FAQs & support', icon: '?' },
    { title: 'Contact Support', subtitle: "We're here to help", icon: '☏' },
    { title: 'About Nomad', subtitle: 'Version 2.1.0 (120) • Terms • Privacy', icon: 'i' },
  ],
};

export type NomadSettingsHookState = {
  settings: NomadSettingsState;
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  logOut(): Promise<void>;
};

export function useNomadSettings(adapters?: NomadOverlayAdapters): NomadSettingsHookState {
  const contextAdapters = useNomadAdapters();
  const settingsAdapter = (adapters ?? contextAdapters).settings;
  const [settings, setSettings] = useState<NomadSettingsState>(fallbackSettings);
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
      setSettings(await settingsAdapter.getSettingsState());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Nomad settings.');
    } finally {
      setLoading(false);
    }
  }, [settingsAdapter]);

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
