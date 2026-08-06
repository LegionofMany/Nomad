import { useCallback, useEffect, useMemo, useState } from 'react';

import { nomadClockAccessAdapter } from '../adapters/nomadClockAccessAdapter';
import type {
  NomadClockAccessResult,
  NomadClockAccessState,
} from '../adapters/nomadClockAccessAdapter';
import type { ClockTime } from '../../types';

const fallbackState: NomadClockAccessState = {
  status: 'not_configured',
  walletStatus: 'no_wallet',
  configuredTime: null,
  configuredTimeLabel: 'Not configured',
  currentTimeLabel: '--:--:--',
  accessWindowLabel: 'Not configured',
  windowMinutes: 15,
  countdownSeconds: 0,
  countdownLabel: '00:00:00',
  cycleProgressPercent: 0,
  cycleElapsedHours: 0,
  timeZoneLabel: 'Device local time',
  clockSource: 'device_local_clock',
  trustedTimeProviderConnected: false,
  persistence: 'in_memory_stub',
  events: [],
};

export function useNomadClockAccess() {
  const [clock, setClock] = useState<NomadClockAccessState>(fallbackState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const next = await nomadClockAccessAdapter.getClockAccessState();
      setClock(next);
      return next;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load Time Clock access state.');
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const configure = useCallback(async (time: ClockTime) => {
    setLoading(true);
    try {
      const next = await nomadClockAccessAdapter.configureDailyAccessTime(time);
      setClock(next);
      setError(null);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to configure the daily access time.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const verify = useCallback(async (time: ClockTime): Promise<NomadClockAccessResult> => {
    setLoading(true);
    try {
      const result = await nomadClockAccessAdapter.verifyAccess(time);
      await refresh();
      return result;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to verify Time Clock access.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  return useMemo(
    () => ({ clock, loading, error, refresh, configure, verify }),
    [clock, loading, error, refresh, configure, verify],
  );
}
