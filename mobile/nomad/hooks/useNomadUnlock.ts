import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  nomadUnlockAdapter,
  type NomadUnlockAttempt,
  type NomadUnlockState,
} from '../adapters/nomadUnlockAdapter';
import type { ClockTime } from '../../types';

const fallbackState: NomadUnlockState = {
  status: 'not_configured',
  clock: {
    status: 'not_configured',
    walletStatus: 'no_wallet',
    passwordConfigured: false,
    configuredTime: null,
    configuredTimeLabel: 'Protected',
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
  },
  passwordConfigured: false,
  recentFailures: 0,
  remainingLockSeconds: 0,
  attemptsRemaining: 8,
  maximumFailuresBeforeRecovery: 8,
  canVerify: false,
  verificationProvider: 'nomad_wallet_service',
  clockEvidence: 'device_local_clock',
  trustedTimeProviderConnected: false,
  persistence: 'in_memory_stub',
};

export function useNomadUnlock() {
  const [unlock, setUnlock] = useState<NomadUnlockState>(fallbackState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const next = await nomadUnlockAdapter.getUnlockState();
      setUnlock(next);
      return next;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load wallet unlock state.');
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

  const verify = useCallback(async (time: ClockTime, password: string): Promise<NomadUnlockAttempt> => {
    setLoading(true);
    setError(null);
    try {
      const attempt = await nomadUnlockAdapter.verifyUnlock(time, password);
      setUnlock(attempt.state);
      return attempt;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to verify wallet access.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(
    () => ({ unlock, loading, error, refresh, verify }),
    [unlock, loading, error, refresh, verify],
  );
}
