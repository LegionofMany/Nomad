import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  nomadOwnerAuthorityEnrollmentAdapter,
  type NomadOwnerAuthorityEnrollmentInput,
  type NomadOwnerAuthorityEnrollmentState,
} from '../adapters/nomadOwnerAuthorityEnrollmentAdapter';

const fallbackState: NomadOwnerAuthorityEnrollmentState = {
  status: 'not_configured',
  profiles: [],
  recoveryRequest: { status: 'none' },
  checks: [],
  activity: [],
  walletStatus: 'no_wallet',
  walletIdentityAvailable: false,
  frozen: false,
  canCreateProfile: false,
  canOpenApproval: false,
  canCancelProfile: false,
  authorityDirectoryConnected: false,
  identityProviderConnected: false,
  deliveryProviderConnected: false,
  signedReceiptProviderConnected: false,
  multiAuthorityPolicyConnected: false,
  contactStorage: 'masked_and_optional_digest_only',
  dataSource: 'nomad_owner_authority_enrollment_adapter',
  persistence: 'in_memory_stub',
  checkedAt: new Date(0).toISOString(),
};

export function useNomadOwnerAuthorityEnrollment() {
  const [enrollment, setEnrollment] = useState<NomadOwnerAuthorityEnrollmentState>(fallbackState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const next = await nomadOwnerAuthorityEnrollmentAdapter.getEnrollmentState();
      setEnrollment(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to load Owner Authority enrollment state.';
      setError(message);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createEnrollment = useCallback(async (input: NomadOwnerAuthorityEnrollmentInput) => {
    setLoading(true);
    setError(null);
    try {
      const next = await nomadOwnerAuthorityEnrollmentAdapter.createEnrollment(input);
      setEnrollment(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to create the Owner Authority profile.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelEnrollment = useCallback(async (profileId: string) => {
    setLoading(true);
    setError(null);
    try {
      const next = await nomadOwnerAuthorityEnrollmentAdapter.cancelEnrollment(profileId);
      setEnrollment(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to cancel the Owner Authority profile.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportProfileSummary = useCallback(async (profileId: string) => {
    setError(null);
    try {
      return await nomadOwnerAuthorityEnrollmentAdapter.exportLocalProfileSummary(profileId);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to export the Owner Authority profile summary.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  return useMemo(
    () => ({
      enrollment,
      loading,
      error,
      refresh,
      createEnrollment,
      cancelEnrollment,
      exportProfileSummary,
    }),
    [enrollment, loading, error, refresh, createEnrollment, cancelEnrollment, exportProfileSummary],
  );
}
