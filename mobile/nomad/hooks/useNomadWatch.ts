import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  nomadWatchAdapter,
  type NomadExtendedWatchState,
  type NomadWatchAdapterInput,
  type NomadWatchPreferenceId,
} from '../adapters/nomadWatchAdapter';
import type { NomadWatchEmergencyAction } from '../adapters/walletAdapter';

const fallbackState: NomadExtendedWatchState = {
  connected: false,
  deviceName: 'No Verified Watch',
  firmware: 'Unavailable',
  batteryPercent: 0,
  lastSyncedLabel: 'Never',
  securityStatus: 'warning',
  travelRegion: 'Global',
  travelSubregion: 'Destination detail unavailable',
  travelModeLabel: 'Unavailable',
  timeSetLabel: 'Not configured',
  travelPocketBalance: 'Unavailable',
  todaySpending: 'Unavailable',
  dailyLimit: 'Unavailable',
  ownerAuthorityAlertLabel: 'No active request',
  pairingStatus: 'not_paired',
  deviceProfiles: [],
  preferences: [],
  checks: [],
  activity: [],
  emergencyReceipts: [],
  walletStatus: 'no_wallet',
  centralSecurityStatus: 'warning',
  centralFreezeStatus: 'none',
  travelPocket: { enabled: false },
  travelSpentTodayPercent: 0,
  travelDataSource: 'unavailable',
  timeSetsComplete: 0,
  timeSetsTotal: 24,
  timeSetConfigured: false,
  deviceTimezone: 'Device local timezone',
  authorityRequestStatus: 'none',
  canCreatePairingDraft: false,
  canCancelPairingDraft: false,
  canSyncWatch: false,
  canFindWatch: false,
  canRemoteWipe: false,
  canTriggerAppEmergencyActions: false,
  wearableBridgeConnected: false,
  authenticatedBluetoothConnected: false,
  hardwareIdentityProviderConnected: false,
  telemetryProviderConnected: false,
  firmwareProviderConnected: false,
  findWatchProviderConnected: false,
  remoteWipeProviderConnected: false,
  authorityDeliveryProviderConnected: false,
  dataSource: 'nomad_watch_adapter',
  persistence: 'in_memory_stub',
  checkedAt: new Date(0).toISOString(),
};

export function useNomadWatch() {
  const [watch, setWatch] = useState<NomadExtendedWatchState>(fallbackState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const next = await nomadWatchAdapter.getWatchState();
      setWatch(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to load Nomad Watch evidence.';
      setError(message);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createPairingDraft = useCallback(async (input: NomadWatchAdapterInput) => {
    setLoading(true);
    setError(null);
    try {
      const next = await nomadWatchAdapter.createPairingDraft(input);
      setWatch(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to create the local watch pairing draft.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelPairingDraft = useCallback(async (profileId: string) => {
    setLoading(true);
    setError(null);
    try {
      const next = await nomadWatchAdapter.cancelPairingDraft(profileId);
      setWatch(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to cancel the local watch profile.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const setPreference = useCallback(async (id: NomadWatchPreferenceId, enabled: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const next = await nomadWatchAdapter.setPreference(id, enabled);
      setWatch(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to update the local watch preference.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const syncNow = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await nomadWatchAdapter.syncNow();
      setWatch(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to synchronize Nomad Watch.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const findWatch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await nomadWatchAdapter.findWatch();
      setWatch(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to locate Nomad Watch.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestRemoteWipe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await nomadWatchAdapter.requestRemoteWipe();
      setWatch(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to request a remote watch wipe.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerEmergencyAction = useCallback(async (action: NomadWatchEmergencyAction) => {
    setLoading(true);
    setError(null);
    try {
      const next = await nomadWatchAdapter.triggerEmergencyAction(action);
      setWatch(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to complete the emergency action.';
      setError(message);
      await refresh();
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const exportPairingSummary = useCallback(async (profileId: string) => {
    setError(null);
    try {
      return await nomadWatchAdapter.exportPairingSummary(profileId);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to prepare the watch pairing summary.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  return useMemo(
    () => ({
      watch,
      loading,
      error,
      refresh,
      createPairingDraft,
      cancelPairingDraft,
      setPreference,
      syncNow,
      findWatch,
      requestRemoteWipe,
      triggerEmergencyAction,
      exportPairingSummary,
    }),
    [
      watch,
      loading,
      error,
      refresh,
      createPairingDraft,
      cancelPairingDraft,
      setPreference,
      syncNow,
      findWatch,
      requestRemoteWipe,
      triggerEmergencyAction,
      exportPairingSummary,
    ],
  );
}
