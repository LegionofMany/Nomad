import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters';
import type {
  NomadExtendedSecurityState,
  NomadFreezeScope,
  NomadOverlayAdapters,
  NomadSecurityModuleResult,
} from '../adapters';

const fallbackModules: NomadSecurityModuleResult[] = [
  {
    id: 'secure_storage',
    title: 'Secure Storage',
    subtitle: 'Seed and wallet-state protection',
    status: 'unavailable',
    detail: 'Waiting for the connected security adapter.',
    route: 'Settings',
    checkedAt: new Date(0).toISOString(),
  },
  {
    id: 'owner_authority',
    title: 'Owner Authority',
    subtitle: 'Approval authority and signer controls',
    status: 'unavailable',
    detail: 'Waiting for the connected security adapter.',
    route: 'CreateOwnerAuthority',
    checkedAt: new Date(0).toISOString(),
  },
  {
    id: 'device_integrity',
    title: 'Device Integrity',
    subtitle: 'Browser runtime and trusted-device evidence',
    status: 'available',
    detail: 'Loading the current device evidence.',
    route: 'DeviceIntegrity',
    checkedAt: new Date(0).toISOString(),
  },
  {
    id: 'recovery_status',
    title: 'Recovery Status',
    subtitle: 'Recovery sequence and Time Set readiness',
    status: 'unavailable',
    detail: 'Waiting for the connected security adapter.',
    route: 'RecoveryCenter',
    checkedAt: new Date(0).toISOString(),
  },
  {
    id: 'network_protection',
    title: 'Network Protection',
    subtitle: 'Arkrilium policy and network controls',
    status: 'unavailable',
    detail: 'Waiting for the connected security adapter.',
    route: 'VoltaireProtocols',
    checkedAt: new Date(0).toISOString(),
  },
];

const fallbackSecurityState: NomadExtendedSecurityState = {
  status: 'warning',
  protectedSince: 'Not available',
  protectedDays: 'Waiting for adapter',
  lastScanLabel: 'Not run',
  lastScanDetail: 'Connect the security adapter to run checks',
  score: 0,
  freezeStatus: 'none',
  freezeActivity: [],
  modules: fallbackModules,
  backupMethods: [],
  activity: [],
  scanHistory: [],
  scanProvider: 'nomad_local_adapter',
  dataSource: 'local_preview',
  persistence: 'in_memory_stub',
};

function toExtendedSecurityState(value: unknown): NomadExtendedSecurityState {
  const candidate = value as Partial<NomadExtendedSecurityState>;
  return {
    ...fallbackSecurityState,
    ...candidate,
    freezeActivity: candidate.freezeActivity ?? [],
    modules: candidate.modules?.length ? candidate.modules : fallbackModules,
    backupMethods: candidate.backupMethods ?? [],
    activity: candidate.activity ?? [],
    scanHistory: candidate.scanHistory ?? [],
  };
}

export type NomadSecurityHookState = {
  security: NomadExtendedSecurityState;
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  runScan(): Promise<NomadExtendedSecurityState>;
  activateFreeze(scope: NomadFreezeScope): Promise<NomadExtendedSecurityState>;
  clearFreeze(): Promise<NomadExtendedSecurityState>;
};

export function useNomadSecurity(adapters?: NomadOverlayAdapters): NomadSecurityHookState {
  const contextAdapters = useNomadAdapters();
  const securityAdapter = (adapters ?? contextAdapters).security;
  const [security, setSecurity] = useState<NomadExtendedSecurityState>(fallbackSecurityState);
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
      setSecurity(toExtendedSecurityState(await securityAdapter.getSecurityState()));
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
    setLoading(true);
    try {
      const next = toExtendedSecurityState(await securityAdapter.runSecurityScan());
      setSecurity(next);
      setError(null);
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to run the security scan.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [securityAdapter]);

  const activateFreeze = useCallback(async (scope: NomadFreezeScope) => {
    if (!securityAdapter) throw new Error('Nomad security adapter is not connected.');
    const next = toExtendedSecurityState(await securityAdapter.activateFreeze(scope));
    setSecurity(next);
    setError(null);
    return next;
  }, [securityAdapter]);

  const clearFreeze = useCallback(async () => {
    if (!securityAdapter) throw new Error('Nomad security adapter is not connected.');
    try {
      const next = toExtendedSecurityState(await securityAdapter.clearFreeze());
      setSecurity(next);
      setError(null);
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to clear the freeze.';
      setError(message);
      throw err;
    }
  }, [securityAdapter]);

  return useMemo(
    () => ({ security, loading, error, refresh, runScan, activateFreeze, clearFreeze }),
    [security, loading, error, refresh, runScan, activateFreeze, clearFreeze],
  );
}
