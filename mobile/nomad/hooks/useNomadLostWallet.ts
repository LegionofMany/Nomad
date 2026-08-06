import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  nomadLostWalletAdapter,
  type NomadLostWalletReason,
  type NomadLostWalletState,
  type NomadLostWalletVerificationResult,
} from '../adapters/nomadLostWalletAdapter';
import type { NomadRecoveryClockTime } from '../adapters/walletAdapter';

const fallbackState: NomadLostWalletState = {
  status: 'setup_required',
  recovery: {
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
  },
  sequence: {
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
  },
  prerequisites: [],
  activity: [],
  canBeginVerification: false,
  canContinueVerification: false,
  sessionRequired: false,
  enrolledTimeSets: 0,
  totalTimeSets: 24,
  attemptsRemaining: 5,
  lockoutRemainingSeconds: 0,
  ownerAuthorityStatus: 'none',
  recoveryProviderConnected: false,
  passwordProviderConnected: false,
  remoteRecoveryPackageAvailable: false,
  verificationProvider: 'nomad_recovery_adapter',
  digestAlgorithm: 'SHA-256',
  rawTimeSetsStored: false,
  dataSource: 'nomad_lost_wallet_adapter',
  persistence: 'in_memory_stub',
};

export function useNomadLostWallet() {
  const [lostWallet, setLostWallet] = useState<NomadLostWalletState>(fallbackState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const next = await nomadLostWalletAdapter.getLostWalletState();
      setLostWallet(next);
      return next;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load lost-wallet recovery state.');
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

  const beginRecovery = useCallback(async (reason: NomadLostWalletReason) => {
    setLoading(true);
    setError(null);
    try {
      const next = await nomadLostWalletAdapter.beginRecovery(reason);
      setLostWallet(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to start lost-wallet recovery.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifySet = useCallback(async (
    setNumber: number,
    time: NomadRecoveryClockTime,
  ): Promise<NomadLostWalletVerificationResult> => {
    setLoading(true);
    setError(null);
    try {
      const result = await nomadLostWalletAdapter.verifyRecoverySet(setNumber, time);
      setLostWallet(result.state);
      return result;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to verify the recovery Time Set.';
      setError(message);
      await refresh();
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  return useMemo(
    () => ({ lostWallet, loading, error, refresh, beginRecovery, verifySet }),
    [lostWallet, loading, error, refresh, beginRecovery, verifySet],
  );
}
