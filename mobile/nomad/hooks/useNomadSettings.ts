import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters';
import type {
  NomadEditableSettingsAdapter,
  NomadEditableSettingsState,
  NomadOverlayAdapters,
  NomadSettingsUpdate,
  NomadSupportDraft,
} from '../adapters';

const fallbackSettings: NomadEditableSettingsState = {
  displayName: 'Nomad User',
  email: 'nomad.user@nomadwallet.local',
  identityStatus: 'Loading wallet identity',
  securityLevel: 'Security state loading',
  defaultCurrency: 'USD',
  language: 'English',
  appearance: 'Dark Mode',
  defaultNetwork: 'Hedera Mainnet',
  notificationsLabel: 'Loading notification settings',
  travelPocketLabel: 'Global • USD Stable • Ready',
  autoConvertEnabled: true,
  paySpendLabel: 'Default currency • USD Stable',
  paySpendCurrency: 'USD Stable',
  appVersion: 'Version 2.1.0 (120) • Terms • Privacy',
  notifications: { push: true, email: true, security: true, travel: true },
  connectedApps: [],
  shortcuts: [],
  preferenceRows: [],
  featureRows: [],
  supportRows: [],
  dataSource: 'local_settings_adapter',
  persistence: 'in_memory_stub',
  updatedAt: new Date(0).toISOString(),
};

export type NomadSettingsHookState = {
  settings: NomadEditableSettingsState;
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  updateSettings(update: NomadSettingsUpdate): Promise<NomadEditableSettingsState>;
  setAutoConvert(enabled: boolean): Promise<NomadEditableSettingsState>;
  createSupportDraft(message: string): Promise<NomadSupportDraft>;
  logOut(): Promise<void>;
};

export function useNomadSettings(adapters?: NomadOverlayAdapters): NomadSettingsHookState {
  const contextAdapters = useNomadAdapters();
  const selectedAdapters = adapters ?? contextAdapters;
  const settingsAdapter = selectedAdapters.settings as NomadEditableSettingsAdapter | undefined;
  const [settings, setSettings] = useState<NomadEditableSettingsState>(fallbackSettings);
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
      const next = settingsAdapter.getEditableSettingsState
        ? await settingsAdapter.getEditableSettingsState()
        : await settingsAdapter.getSettingsState() as NomadEditableSettingsState;
      setSettings(next);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load Nomad settings.');
    } finally {
      setLoading(false);
    }
  }, [settingsAdapter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateSettings = useCallback(async (update: NomadSettingsUpdate) => {
    if (!settingsAdapter?.updateSettings) throw new Error('Editable settings are unavailable.');
    try {
      setLoading(true);
      setError(null);
      const next = await settingsAdapter.updateSettings(update);
      setSettings(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to save settings.';
      setError(message);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [settingsAdapter]);

  const setAutoConvert = useCallback(async (enabled: boolean) => {
    if (!settingsAdapter?.setAutoConvert) throw new Error('Auto-Convert settings are unavailable.');
    try {
      setLoading(true);
      setError(null);
      const next = await settingsAdapter.setAutoConvert(enabled);
      setSettings(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, [settingsAdapter]);

  const createSupportDraft = useCallback(async (message: string) => {
    if (!settingsAdapter?.createSupportDraft) throw new Error('Support drafts are unavailable.');
    return settingsAdapter.createSupportDraft(message);
  }, [settingsAdapter]);

  const logOut = useCallback(async () => {
    if (!settingsAdapter) throw new Error('Nomad settings adapter is not connected.');
    await settingsAdapter.logOut();
  }, [settingsAdapter]);

  return useMemo(
    () => ({ settings, loading, error, refresh, updateSettings, setAutoConvert, createSupportDraft, logOut }),
    [settings, loading, error, refresh, updateSettings, setAutoConvert, createSupportDraft, logOut],
  );
}
