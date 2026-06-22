import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters';
import type { NomadOverlayAdapters, NomadWatchEmergencyAction, NomadWatchState } from '../adapters/walletAdapter';

const fallbackWatch: NomadWatchState = {
  connected: true,
  deviceName: 'Nomad Watch 1',
  firmware: 'v1.2.0',
  batteryPercent: 87,
  lastSyncedLabel: 'Today, 10:24 AM',
  securityStatus: 'secure',
  travelRegion: 'Europe',
  travelSubregion: 'France',
  travelModeLabel: 'Active',
  timeSetLabel: '10:24 AM Local',
  travelPocketBalance: '$1,240.75',
  todaySpending: '$142.30',
  dailyLimit: '$500.00',
  ownerAuthorityAlertLabel: 'No new alerts',
};

export function useNomadWatch(adapters?: NomadOverlayAdapters) {
  const contextAdapters = useNomadAdapters();
  const watchAdapter = (adapters ?? contextAdapters).watch;
  const [watch, setWatch] = useState<NomadWatchState>(fallbackWatch);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!watchAdapter) {
      setError('Nomad Watch adapter is not connected.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setWatch(await watchAdapter.getWatchState());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Nomad Watch state.');
    } finally {
      setLoading(false);
    }
  }, [watchAdapter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const syncNow = useCallback(async () => {
    if (!watchAdapter) throw new Error('Nomad Watch adapter is not connected.');
    const next = await watchAdapter.syncNow();
    setWatch(next);
    return next;
  }, [watchAdapter]);

  const triggerEmergencyAction = useCallback(async (action: NomadWatchEmergencyAction) => {
    if (!watchAdapter) throw new Error('Nomad Watch adapter is not connected.');
    const next = await watchAdapter.triggerEmergencyAction(action);
    setWatch(next);
    return next;
  }, [watchAdapter]);

  return useMemo(() => ({ watch, loading, error, refresh, syncNow, triggerEmergencyAction }), [watch, loading, error, refresh, syncNow, triggerEmergencyAction]);
}
