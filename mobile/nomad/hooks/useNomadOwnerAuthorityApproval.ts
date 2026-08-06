import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  nomadOwnerAuthorityApprovalAdapter,
  type NomadOwnerAuthorityApprovalState,
} from '../adapters/nomadOwnerAuthorityApprovalAdapter';

const fallbackState: NomadOwnerAuthorityApprovalState = {
  status: 'not_requested',
  request: { status: 'none' },
  action: 'Protected Wallet Action',
  reason: 'Protected recovery action',
  checks: [],
  activity: [],
  packageAvailable: false,
  authorityIdentityVerified: false,
  authorityDirectoryConnected: false,
  deliveryProviderConnected: false,
  deliveryConfirmed: false,
  signedReceiptAvailable: false,
  receiptSignatureVerified: false,
  canContinueRecovery: false,
  canCancelRequest: false,
  canPreparePackage: false,
  provider: 'not_connected',
  dataSource: 'nomad_owner_authority_approval_adapter',
  persistence: 'in_memory_stub',
  checkedAt: new Date(0).toISOString(),
};

export function useNomadOwnerAuthorityApproval() {
  const [approval, setApproval] = useState<NomadOwnerAuthorityApprovalState>(fallbackState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const next = await nomadOwnerAuthorityApprovalAdapter.getApprovalState();
      setApproval(next);
      return next;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load Owner Authority approval evidence.');
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const preparePackage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await nomadOwnerAuthorityApprovalAdapter.prepareApprovalPackage();
      setApproval(result.state);
      return result;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to prepare the Owner Authority package.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkDelivery = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await nomadOwnerAuthorityApprovalAdapter.checkDelivery();
      setApproval(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to check Owner Authority delivery.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await nomadOwnerAuthorityApprovalAdapter.cancelRequest();
      setApproval(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to cancel the Owner Authority request.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(
    () => ({ approval, loading, error, refresh, preparePackage, checkDelivery, cancelRequest }),
    [approval, loading, error, refresh, preparePackage, checkDelivery, cancelRequest],
  );
}
