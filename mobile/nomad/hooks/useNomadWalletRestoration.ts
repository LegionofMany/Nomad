import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  nomadWalletRestorationAdapter,
  type NomadWalletRestorationState,
} from '../adapters/nomadWalletRestorationAdapter';

const fallbackState: NomadWalletRestorationState = {
  status: 'setup_required',
  lostWallet: {
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
  },
  checks: [],
  sequenceVerified: false,
  activeRecoverySession: false,
  restorationProviderConnected: false,
  restorationReceiptAvailable: false,
  receiptSignatureVerified: false,
  privateKeysRestored: false,
  walletStateChangedByRecovery: false,
  canOpenRecoveredWallet: false,
  provider: 'not_connected',
  dataSource: 'nomad_wallet_restoration_adapter',
  persistence: 'in_memory_stub',
  checkedAt: new Date(0).toISOString(),
};

export function useNomadWalletRestoration() {
  const [restoration, setRestoration] = useState<NomadWalletRestorationState>(fallbackState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const next = await nomadWalletRestorationAdapter.getRestorationState();
      setRestoration(next);
      return next;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load wallet restoration status.');
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(
    () => ({ restoration, loading, error, refresh }),
    [restoration, loading, error, refresh],
  );
}
