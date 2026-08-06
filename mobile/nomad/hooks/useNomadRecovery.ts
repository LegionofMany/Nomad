import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters';
import type {
  NomadExtendedRecoveryAdapter,
  NomadExtendedRecoverySequenceState,
  NomadExtendedRecoveryState,
  NomadOverlayAdapters,
  NomadOwnerAuthorityRequest,
  NomadRecoveryClockTime,
  NomadRecoverySequenceState,
  NomadRecoveryState,
} from '../adapters';

const fallbackRecoveryState: NomadExtendedRecoveryState = {
  walletStatus: 'no_wallet',
  dailyUnlockTime: null,
  recoveryStatus: 'not_started',
  recoverySetupDate: 'Not configured',
  verificationStatus: '0/24 Time Sets enrolled',
  lastCheckLabel: 'Never checked',
  timeSetsComplete: 0,
  timeSetsTotal: 24,
  recoveryScore: 0,
  signerQuorum: 1,
  signerTotal: 1,
  nextRecommendedCheck: 'Run a recovery check',
  timeRemainingLabel: 'Clock not configured',
  cycleLabel: 'Daily Time not configured',
  cycleStartedLabel: 'Awaiting recovery setup',
  purpose: 'Wallet Access',
  methods: [],
  signers: [],
  events: [],
  checks: [],
  enrolledTimeSets: 0,
  ownerAuthorityStatus: 'none',
  exportAvailable: false,
  dataSource: 'nomad_recovery_adapter',
  persistence: 'in_memory_stub',
  cryptographicEnrollment: 'unavailable',
};

const fallbackSequenceState: NomadExtendedRecoverySequenceState = {
  step: 1,
  enteredSets: 0,
  verifiedSets: 0,
  totalSets: 24,
  strengthScore: 0,
  currentSet: 1,
  sampleTime: { hour: 0, minute: 0, second: 0 },
  status: 'entry',
  attemptsRemaining: 5,
  enrollmentAvailable: false,
  recoveryProviderConnected: false,
};

function isExtendedRecoveryAdapter(adapter: unknown): adapter is NomadExtendedRecoveryAdapter {
  return Boolean(
    adapter
    && typeof (adapter as NomadExtendedRecoveryAdapter).getExtendedRecoveryState === 'function'
    && typeof (adapter as NomadExtendedRecoveryAdapter).getExtendedRecoverySequenceState === 'function',
  );
}

function extendRecoveryState(base: NomadRecoveryState): NomadExtendedRecoveryState {
  return {
    ...fallbackRecoveryState,
    ...base,
    enrolledTimeSets: base.timeSetsComplete,
    exportAvailable: base.walletStatus !== 'no_wallet',
  };
}

function extendSequenceState(base: NomadRecoverySequenceState): NomadExtendedRecoverySequenceState {
  return {
    ...fallbackSequenceState,
    ...base,
  };
}

export type NomadRecoveryHookState = {
  recovery: NomadExtendedRecoveryState;
  sequence: NomadExtendedRecoverySequenceState;
  loading: boolean;
  error: string | null;
  ownerAuthorityRequest: NomadOwnerAuthorityRequest;
  refresh(): Promise<void>;
  runCheck(): Promise<NomadExtendedRecoveryState>;
  requestOwnerAuthority(reason: string): Promise<NomadOwnerAuthorityRequest>;
  cancelOwnerAuthority(): Promise<NomadOwnerAuthorityRequest>;
  startSequence(): Promise<NomadExtendedRecoverySequenceState>;
  verifySet(setNumber: number, time: NomadRecoveryClockTime): Promise<NomadExtendedRecoverySequenceState>;
  completeSequence(): Promise<NomadExtendedRecoverySequenceState>;
  enrollSequence(times: NomadRecoveryClockTime[]): Promise<NomadExtendedRecoveryState>;
  clearEnrollment(): Promise<NomadExtendedRecoveryState>;
  exportSummary(): Promise<string>;
};

export function useNomadRecovery(adapters?: NomadOverlayAdapters): NomadRecoveryHookState {
  const contextAdapters = useNomadAdapters();
  const recoveryAdapter = (adapters ?? contextAdapters).recovery;
  const [recovery, setRecovery] = useState<NomadExtendedRecoveryState>(fallbackRecoveryState);
  const [sequence, setSequence] = useState<NomadExtendedRecoverySequenceState>(fallbackSequenceState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerAuthorityRequest, setOwnerAuthorityRequest] = useState<NomadOwnerAuthorityRequest>({ status: 'none' });

  const loadRecoveryState = useCallback(async () => {
    if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.');
    return isExtendedRecoveryAdapter(recoveryAdapter)
      ? recoveryAdapter.getExtendedRecoveryState()
      : extendRecoveryState(await recoveryAdapter.getRecoveryState());
  }, [recoveryAdapter]);

  const loadSequenceState = useCallback(async () => {
    if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.');
    return isExtendedRecoveryAdapter(recoveryAdapter)
      ? recoveryAdapter.getExtendedRecoverySequenceState()
      : extendSequenceState(await recoveryAdapter.getRecoverySequenceState());
  }, [recoveryAdapter]);

  const refresh = useCallback(async () => {
    if (!recoveryAdapter) {
      setError('Nomad recovery adapter is not connected.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [nextRecovery, nextOwnerAuthorityRequest, nextSequence] = await Promise.all([
        loadRecoveryState(),
        recoveryAdapter.getOwnerAuthorityRequest(),
        loadSequenceState(),
      ]);
      setRecovery(nextRecovery);
      setOwnerAuthorityRequest(nextOwnerAuthorityRequest);
      setSequence(nextSequence);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load Nomad recovery state.');
    } finally {
      setLoading(false);
    }
  }, [loadRecoveryState, loadSequenceState, recoveryAdapter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runCheck = useCallback(async () => {
    if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.');
    setLoading(true);
    try {
      await recoveryAdapter.runRecoveryCheck();
      const next = await loadRecoveryState();
      setRecovery(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, [loadRecoveryState, recoveryAdapter]);

  const requestOwnerAuthority = useCallback(async (reason: string) => {
    if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.');
    const request = await recoveryAdapter.requestOwnerAuthorityApproval(reason);
    setOwnerAuthorityRequest(request);
    setRecovery(await loadRecoveryState());
    return request;
  }, [loadRecoveryState, recoveryAdapter]);

  const cancelOwnerAuthority = useCallback(async () => {
    if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.');
    const request = await recoveryAdapter.cancelOwnerAuthorityRequest();
    setOwnerAuthorityRequest(request);
    setRecovery(await loadRecoveryState());
    return request;
  }, [loadRecoveryState, recoveryAdapter]);

  const startSequence = useCallback(async () => {
    if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.');
    await recoveryAdapter.startRecoverySequence();
    const next = await loadSequenceState();
    setSequence(next);
    return next;
  }, [loadSequenceState, recoveryAdapter]);

  const verifySet = useCallback(async (setNumber: number, time: NomadRecoveryClockTime) => {
    if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.');
    await recoveryAdapter.verifyRecoverySet(setNumber, time);
    const next = await loadSequenceState();
    setSequence(next);
    return next;
  }, [loadSequenceState, recoveryAdapter]);

  const completeSequence = useCallback(async () => {
    if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.');
    await recoveryAdapter.completeRecoverySequence();
    const next = await loadSequenceState();
    setSequence(next);
    return next;
  }, [loadSequenceState, recoveryAdapter]);

  const enrollSequence = useCallback(async (times: NomadRecoveryClockTime[]) => {
    if (!isExtendedRecoveryAdapter(recoveryAdapter)) throw new Error('The connected recovery adapter does not support cryptographic Time Set enrollment.');
    const next = await recoveryAdapter.enrollRecoverySequence(times);
    setRecovery(next);
    setSequence(await recoveryAdapter.getExtendedRecoverySequenceState());
    return next;
  }, [recoveryAdapter]);

  const clearEnrollment = useCallback(async () => {
    if (!isExtendedRecoveryAdapter(recoveryAdapter)) throw new Error('The connected recovery adapter does not support clearing Time Set enrollment.');
    const next = await recoveryAdapter.clearRecoveryEnrollment();
    setRecovery(next);
    setSequence(await recoveryAdapter.getExtendedRecoverySequenceState());
    return next;
  }, [recoveryAdapter]);

  const exportSummary = useCallback(async () => {
    if (!isExtendedRecoveryAdapter(recoveryAdapter)) throw new Error('The connected recovery adapter does not support recovery-summary export.');
    const value = await recoveryAdapter.exportRecoverySummary();
    setRecovery(await recoveryAdapter.getExtendedRecoveryState());
    return value;
  }, [recoveryAdapter]);

  return useMemo(
    () => ({
      recovery,
      sequence,
      loading,
      error,
      ownerAuthorityRequest,
      refresh,
      runCheck,
      requestOwnerAuthority,
      cancelOwnerAuthority,
      startSequence,
      verifySet,
      completeSequence,
      enrollSequence,
      clearEnrollment,
      exportSummary,
    }),
    [
      recovery,
      sequence,
      loading,
      error,
      ownerAuthorityRequest,
      refresh,
      runCheck,
      requestOwnerAuthority,
      cancelOwnerAuthority,
      startSequence,
      verifySet,
      completeSequence,
      enrollSequence,
      clearEnrollment,
      exportSummary,
    ],
  );
}
