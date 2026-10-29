import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters/NomadAdaptersProvider';
import {
  nomadEmergencyFreezeAdapter,
  type NomadEmergencyFreezeReleaseMethod,
  type NomadEmergencyFreezeState,
} from '../adapters/nomadEmergencyFreezeAdapter';
import type {
  NomadAsset,
  NomadFreezeScope,
  NomadSecurityState,
  NomadWalletSessionState,
} from '../adapters/walletAdapter';

const fallbackSecurity: NomadSecurityState = {
  status: 'warning',
  protectedSince: 'Not available',
  protectedDays: 'Waiting for adapter',
  lastScanLabel: 'Not run',
  lastScanDetail: 'Security adapter unavailable',
  score: 0,
  freezeStatus: 'none',
  freezeActivity: [],
};

const fallbackState: NomadEmergencyFreezeState = {
  status: 'clear',
  centralSecurity: fallbackSecurity,
  incidents: [],
  activity: [],
  walletAssets: [],
  walletSessionStatus: 'unknown',
  checks: [],
  blockedActions: [],
  canActivateFreeze: false,
  canRequestRelease: false,
  directReleaseAllowed: false,
  specificAssetPolicyEnforced: false,
  walletPolicyProviderConnected: false,
  remoteAuthorityDeliveryConnected: false,
  signedReleaseReceiptProviderConnected: false,
  hardwareAttestationConnected: false,
  persistence: 'in_memory_stub',
  dataSource: 'nomad_emergency_freeze_adapter',
  checkedAt: new Date(0).toISOString(),
};

type WalletSnapshot = {
  assets: NomadAsset[];
  session?: NomadWalletSessionState;
  security: NomadSecurityState;
};

export type NomadEmergencyFreezeActivationRequest = {
  scope: NomadFreezeScope;
  selectedAssetKeys: string[];
  reason: string;
};

async function loadSnapshot(
  wallet: ReturnType<typeof useNomadAdapters>['wallet'],
  securityAdapter: ReturnType<typeof useNomadAdapters>['security'],
): Promise<WalletSnapshot> {
  if (!wallet) throw new Error('Nomad wallet adapter is not connected.');
  if (!securityAdapter) throw new Error('Nomad security adapter is not connected.');
  const [assets, session, security] = await Promise.all([
    wallet.getAssets(),
    wallet.getSessionState
      ? wallet.getSessionState().catch(() => undefined)
      : Promise.resolve(undefined),
    securityAdapter.getSecurityState(),
  ]);
  return { assets, session, security };
}

export function useNomadEmergencyFreeze() {
  const adapters = useNomadAdapters();
  const wallet = adapters.wallet;
  const securityAdapter = adapters.security;
  const recoveryAdapter = adapters.recovery;
  const [freeze, setFreeze] = useState<NomadEmergencyFreezeState>(fallbackState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const snapshot = await loadSnapshot(wallet, securityAdapter);
      const next = await nomadEmergencyFreezeAdapter.getFreezeState({
        walletAssets: snapshot.assets,
        walletSession: snapshot.session,
        securityState: snapshot.security,
      });
      setFreeze(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to load Emergency Freeze state.';
      setError(message);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [securityAdapter, wallet]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activateFreeze = useCallback(async (request: NomadEmergencyFreezeActivationRequest) => {
    if (!wallet) throw new Error('Nomad wallet adapter is not connected.');
    if (!securityAdapter) throw new Error('Nomad security adapter is not connected.');
    if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.');
    setLoading(true);
    setError(null);
    try {
      const before = await loadSnapshot(wallet, securityAdapter);
      await nomadEmergencyFreezeAdapter.validateActivation({
        scope: request.scope,
        selectedAssetKeys: request.selectedAssetKeys,
        reason: request.reason,
        walletAssets: before.assets,
        walletSession: before.session,
        securityState: before.security,
      });

      if (request.scope === 'owner_authority_alert') {
        const authority = await recoveryAdapter.getOwnerAuthorityRequest();
        if (authority.status === 'pending') {
          throw new Error('Another Owner Authority request is already pending. Review or cancel it before recording a new Emergency Freeze alert.');
        }
      }

      const centralSecurity = await securityAdapter.activateFreeze(request.scope);
      let walletLockRequested = false;
      let walletLockConfirmed = false;
      let session = before.session;

      if (request.scope === 'entire_wallet') {
        walletLockRequested = true;
        try {
          await wallet.lockWallet();
          session = wallet.getSessionState
            ? await wallet.getSessionState().catch(() => session)
            : session;
          walletLockConfirmed = session?.status === 'locked'
            || session?.status === 'expired'
            || session?.status === 'recovery';
        } catch {
          walletLockConfirmed = false;
        }
      }

      const next = await nomadEmergencyFreezeAdapter.recordActivation({
        scope: request.scope,
        selectedAssetKeys: request.selectedAssetKeys,
        reason: request.reason,
        walletAssets: before.assets,
        walletSession: session,
        securityState: centralSecurity,
        walletLockRequested,
        walletLockConfirmed,
      });
      setFreeze(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to activate Emergency Freeze.';
      setError(message);
      try {
        const snapshot = await loadSnapshot(wallet, securityAdapter);
        setFreeze(await nomadEmergencyFreezeAdapter.getFreezeState({
          walletAssets: snapshot.assets,
          walletSession: snapshot.session,
          securityState: snapshot.security,
        }));
      } catch {
        // Preserve the last known state when refresh also fails.
      }
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [recoveryAdapter, securityAdapter, wallet]);

  const requestRelease = useCallback(async (
    method: NomadEmergencyFreezeReleaseMethod,
    reason: string,
  ) => {
    if (!freeze.currentIncident) throw new Error('No Page 25 freeze incident is available for release review.');
    if (!recoveryAdapter) throw new Error('Nomad recovery adapter is not connected.');
    setLoading(true);
    setError(null);
    try {
      if (method === 'owner_authority') {
        const authority = await recoveryAdapter.getOwnerAuthorityRequest();
        const expectedBinding = `Release Emergency Freeze incident ${freeze.currentIncident.id}`;
        if (authority.status === 'pending' && !authority.reason?.includes(expectedBinding)) {
          throw new Error('An unrelated Owner Authority request is already pending. Review or cancel it before requesting authority-based freeze release.');
        }
      }

      const snapshot = await loadSnapshot(wallet, securityAdapter);
      const next = await nomadEmergencyFreezeAdapter.requestRelease({
        walletAssets: snapshot.assets,
        walletSession: snapshot.session,
        securityState: snapshot.security,
        incidentId: freeze.currentIncident.id,
        method,
        reason,
      });
      setFreeze(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to create the verified release request.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [freeze.currentIncident, recoveryAdapter, securityAdapter, wallet]);

  return useMemo(
    () => ({
      freeze,
      loading,
      error,
      refresh,
      activateFreeze,
      requestRelease,
    }),
    [freeze, loading, error, refresh, activateFreeze, requestRelease],
  );
}
