import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters';
import type { NomadOverlayAdapters, NomadOwnerAuthorityRequest, NomadRecoveryClockTime, NomadRecoverySequenceState, NomadRecoveryState } from '../adapters/walletAdapter';

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

const fallbackSequenceState: NomadRecoverySequenceState = {
  step: 1,
  enteredSets: 0,
  verifiedSets: 0,
  totalSets: 24,
  strengthScore: 0,
  currentSet: 1,
  sampleTime: { hour: 3, minute: 15, second: 27 },
  status: 'entry',
};

export type NomadRecoveryHookState = {
  recovery: NomadRecoveryState;
  sequence: NomadRecoverySequenceState;
  loading: boolean;
  error: string | null;
  ownerAuthorityRequest: NomadOwnerAuthorityRequest;
  refresh(): Promise<void>;
  runCheck(): Promise<NomadRecoveryState>;
  requestOwnerAuthority(reason: string): Promise<NomadOwnerAuthorityRequest>;
  cancelOwnerAuthority(): Promise<NomadOwnerAuthorityRequest>;
  startSequence(): Promise<NomadRecoverySequenceState>;
  verifySet(setNumber: number, time: NomadRecoveryClockTime): Promise<NomadRecoverySequenceState>;
  completeSequence(): Promise<NomadRecoverySequenceState>;
};

export function useNomadRecovery(adapters?: NomadOverlayAdapters): NomadRecoveryHookState {
  const contextAdapters = useNomadAdapters();
  const recoveryAdapter = (adapters ?? contextAdapters).recovery;
  const [recovery, setRecovery] = useState<NomadRecoveryState>(fallbackRecoveryState);
  const [sequence, setSequence] = useState<NomadRecoverySequenceState>(fallbackSequenceState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerAuthorityRequest, setOwnerAuthorityRequest] = useState<NomadOwnerAuthorityRequest>({ status: 'none' });

  const refresh = useCallback(async () => {
    if (!recoveryAdapter) { setError('Nomad recovery adapter is not connected.'); setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const [nextRecovery, nextOwnerAuthorityRequest, nextSequence] = await Promise.all([
        recoveryAdapter.getRecoveryState(),
        recoveryAdapter.getOwnerAuthorityRequest(),
        recoveryAdapter.getRecoverySequenceState(),
      ]);
      setRecovery(nextRecovery);
      setOwnerAuthorityRequest(nextOwnerAuthorityRequest);
      setSequence(nextSequence);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Nomad recovery state.');
    } finally {
      setLoading(false);
    }
  }, [recoveryAdapter]);

  useEffect(() => { void refresh(); }, [refresh]);

  const runCheck = useCallback(async () => { if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.'); const next = await recoveryAdapter.runRecoveryCheck(); setRecovery(next); return next; }, [recoveryAdapter]);
  const requestOwnerAuthority = useCallback(async (reason: string) => { if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.'); const request = await recoveryAdapter.requestOwnerAuthorityApproval(reason); setOwnerAuthorityRequest(request); return request; }, [recoveryAdapter]);
  const cancelOwnerAuthority = useCallback(async () => { if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.'); const request = await recoveryAdapter.cancelOwnerAuthorityRequest(); setOwnerAuthorityRequest(request); return request; }, [recoveryAdapter]);
  const startSequence = useCallback(async () => { if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.'); const next = await recoveryAdapter.startRecoverySequence(); setSequence(next); return next; }, [recoveryAdapter]);
  const verifySet = useCallback(async (setNumber: number, time: NomadRecoveryClockTime) => { if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.'); const next = await recoveryAdapter.verifyRecoverySet(setNumber, time); setSequence(next); return next; }, [recoveryAdapter]);
  const completeSequence = useCallback(async () => { if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.'); const next = await recoveryAdapter.completeRecoverySequence(); setSequence(next); return next; }, [recoveryAdapter]);

  return useMemo(
    () => ({ recovery, sequence, loading, error, ownerAuthorityRequest, refresh, runCheck, requestOwnerAuthority, cancelOwnerAuthority, startSequence, verifySet, completeSequence }),
    [recovery, sequence, loading, error, ownerAuthorityRequest, refresh, runCheck, requestOwnerAuthority, cancelOwnerAuthority, startSequence, verifySet, completeSequence],
  );
}
