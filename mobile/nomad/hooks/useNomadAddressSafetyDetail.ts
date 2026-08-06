import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  nomadAddressSafetyDetailAdapter,
  type ReqriumAddressSafetyDetailState,
} from '../adapters/nomadAddressSafetyDetailAdapter';

const fallbackState: ReqriumAddressSafetyDetailState = {
  maskedTarget: 'No address selected',
  chainLabel: 'Unknown network',
  score: 0,
  risk: 'high',
  summary: 'No recorded Reqrium address scan is available. Enter an address and run local checks.',
  evidence: [],
  checks: [],
  scanHistory: [],
  localReportDrafts: 0,
  activity: [],
  hasRecordedScan: false,
  remoteThreatIntelligenceConnected: false,
  transactionGraphConnected: false,
  sanctionsProviderConnected: false,
  communityReputationConnected: false,
  contractAnalysisConnected: false,
  provider: 'reqrium_local_heuristics',
  dataSource: 'reqrium_address_detail_adapter',
  persistence: 'in_memory_stub',
};

function normalizeDetail(next: ReqriumAddressSafetyDetailState): ReqriumAddressSafetyDetailState {
  const detailReportEvents = next.activity.filter((item) => item.type === 'report').length;
  return {
    ...next,
    localReportDrafts: Math.max(next.localReportDrafts, detailReportEvents),
  };
}

export function useNomadAddressSafetyDetail(initialAddress?: string) {
  const [detail, setDetail] = useState<ReqriumAddressSafetyDetailState>(fallbackState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (address?: string) => {
    setLoading(true);
    try {
      setError(null);
      const next = normalizeDetail(await nomadAddressSafetyDetailAdapter.getAddressDetail(address ?? initialAddress));
      setDetail(next);
      return next;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load Reqrium address details.');
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [initialAddress]);

  useEffect(() => {
    void refresh(initialAddress);
  }, [initialAddress, refresh]);

  const scanAddress = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    try {
      const next = normalizeDetail(await nomadAddressSafetyDetailAdapter.scanAddress(address));
      setDetail(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to scan this address.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveContact = useCallback(async (address: string, label: string, note?: string) => {
    setLoading(true);
    setError(null);
    try {
      const next = normalizeDetail(await nomadAddressSafetyDetailAdapter.saveContact(address, label, note));
      setDetail(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to save this address contact.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeContact = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    try {
      const next = normalizeDetail(await nomadAddressSafetyDetailAdapter.removeContact(address));
      setDetail(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to remove this address contact.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createReportDraft = useCallback(async (address: string, notes: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await nomadAddressSafetyDetailAdapter.createReportDraft(address, notes);
      const state = normalizeDetail(result.state);
      setDetail(state);
      return { ...result, state };
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to create the report draft.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(
    () => ({ detail, loading, error, refresh, scanAddress, saveContact, removeContact, createReportDraft }),
    [detail, loading, error, refresh, scanAddress, saveContact, removeContact, createReportDraft],
  );
}
