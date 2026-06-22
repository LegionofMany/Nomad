import { useCallback, useEffect, useMemo, useState } from 'react';

import { localNomadOverlayAdapters } from '../adapters/localNomadAdapters';
import type { NomadFreezeScope, NomadOverlayAdapters, NomadSecurityState } from '../adapters/walletAdapter';

const fallbackSecurityState: NomadSecurityState = {
  status: 'secure',
  protectedSince: 'Mar 17, 2025',
  protectedDays: '42 days',
  lastScanLabel: '2 min ago',
  lastScanDetail: 'May 12, 2025 9:39 AM',
  score: 100,
  freezeStatus: 'none',
  freezeActivity: [],
};

export type NomadSecurityHookState = {
  security: NomadSecurityState;
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  runScan(): Promise<NomadSecurityState>;
  activateFreeze(scope: NomadFreezeScope): Promise<NomadSecurityState>;
  clearFreeze(): Promise<NomadSecurityState>;
};

export function useNomadSecurity(adapters: NomadOverlayAdapters = localNomadOverlayAdapters): NomadSecurityHookState {
  const securityAdapter = adapters.security;
  const [security, setSecurity] = useState<NomadSecurityState>(fallbackSecurityState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!securityAdapter) {
      setError('Nomad security adapter is not connected.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSecurity(await securityAdapter.getSecurityState());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Nomad security state.');
    } finally {
      setLoading(false);
    }
  }, [securityAdapter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runScan = useCallback(async () => {
    if (!securityAdapter) throw new Error('Nomad security adapter is not connected.');
    const next = await securityAdapter.runSecurityScan();
    setSecurity(next);
    return next;
  }, [securityAdapter]);

  const activateFreeze = useCallback(
    async (scope: NomadFreezeScope) => {
      if (!securityAdapter) throw new Error('Nomad security adapter is not connected.');
      const next = await securityAdapter.activateFreeze(scope);
      setSecurity(next);
      return next;
    },
    [securityAdapter],
  );

  const clearFreeze = useCallback(async () => {
    if (!securityAdapter) throw new Error('Nomad security adapter is not connected.');
    const next = await securityAdapter.clearFreeze();
    setSecurity(next);
    return next;
  }, [securityAdapter]);

  return useMemo(
    () => ({ security, loading, error, refresh, runScan, activateFreeze, clearFreeze }),
    [security, loading, error, refresh, runScan, activateFreeze, clearFreeze],
  );
}
