import { useCallback, useEffect, useMemo, useState } from 'react';

import { localNomadOverlayAdapters } from '../adapters/localNomadAdapters';
import type { NomadOverlayAdapters, NomadOwnerAuthorityRequest, NomadRecoveryState } from '../adapters/walletAdapter';

const fallbackRecoveryState: NomadRecoveryState = {
  walletStatus: 'locked',
  dailyUnlockTime: { hour: 12, minute: 0, second: 0 },
  recoveryStatus: 'protected',
  recoverySetupDate: 'Mar 17, 2025',
  verificationStatus: 'Verified',
  lastCheckLabel: '2 min ago',
  timeSetsComplete: 24,
  timeSetsTotal: 24,
  recoveryScore: 94,
  signerQuorum: 3,
  signerTotal: 3,
  nextRecommendedCheck: 'Jun 17, 2025',
  timeRemainingLabel: '23:47:32',
  cycleLabel: '24 Hour Cycle',
  cycleStartedLabel: 'May 19, 2025 • 10:24 AM',
  purpose: 'Wallet Access',
};

export type NomadRecoveryHookState = {
  recovery: NomadRecoveryState;
  loading: boolean;
  error: string | null;
  ownerAuthorityRequest: NomadOwnerAuthorityRequest;
  refresh(): Promise<void>;
  runCheck(): Promise<NomadRecoveryState>;
  requestOwnerAuthority(reason: string): Promise<NomadOwnerAuthorityRequest>;
  cancelOwnerAuthority(): Promise<NomadOwnerAuthorityRequest>;
};

export function useNomadRecovery(adapters: NomadOverlayAdapters = localNomadOverlayAdapters): NomadRecoveryHookState {
  const recoveryAdapter = adapters.recovery;
  const [recovery, setRecovery] = useState<NomadRecoveryState>(fallbackRecoveryState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerAuthorityRequest, setOwnerAuthorityRequest] = useState<NomadOwnerAuthorityRequest>({ status: 'none' });

  const refresh = useCallback(async () => {
    if (!recoveryAdapter) {
      setError('Nomad recovery adapter is not connected.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [nextRecovery, nextOwnerAuthorityRequest] = await Promise.all([
        recoveryAdapter.getRecoveryState(),
        recoveryAdapter.getOwnerAuthorityRequest(),
      ]);
      setRecovery(nextRecovery);
      setOwnerAuthorityRequest(nextOwnerAuthorityRequest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Nomad recovery state.');
    } finally {
      setLoading(false);
    }
  }, [recoveryAdapter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runCheck = useCallback(async () => {
    if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.');
    const next = await recoveryAdapter.runRecoveryCheck();
    setRecovery(next);
    return next;
  }, [recoveryAdapter]);

  const requestOwnerAuthority = useCallback(
    async (reason: string) => {
      if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.');
      const request = await recoveryAdapter.requestOwnerAuthorityApproval(reason);
      setOwnerAuthorityRequest(request);
      return request;
    },
    [recoveryAdapter],
  );

  const cancelOwnerAuthority = useCallback(async () => {
    if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.');
    const request = await recoveryAdapter.cancelOwnerAuthorityRequest();
    setOwnerAuthorityRequest(request);
    return request;
  }, [recoveryAdapter]);

  return useMemo(
    () => ({ recovery, loading, error, ownerAuthorityRequest, refresh, runCheck, requestOwnerAuthority, cancelOwnerAuthority }),
    [recovery, loading, error, ownerAuthorityRequest, refresh, runCheck, requestOwnerAuthority, cancelOwnerAuthority],
  );
}
