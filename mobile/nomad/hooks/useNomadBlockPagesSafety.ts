import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters';
import type {
  NomadOverlayAdapters,
  ReqriumReportDraft,
  ReqriumSafetyAdapter,
  ReqriumSafetyState,
} from '../adapters';

const fallbackSafety: ReqriumSafetyState = {
  status: 'not_configured',
  readinessScore: 0,
  privacyScore: 0,
  protectionLabel: 'SETUP REQUIRED',
  localFlags: 0,
  scansRecorded: 0,
  openFindings: 0,
  reportDrafts: 0,
  lastScanLabel: 'No scans recorded',
  modules: [],
  exposures: [],
  activity: [],
  scans: [],
  remoteThreatIntelligenceConnected: false,
  breachProviderConnected: false,
  malwareProviderConnected: false,
  dataSource: 'reqrium_local_heuristics',
  persistence: 'in_memory_stub',
};

function isReqriumAdapter(adapter: unknown): adapter is ReqriumSafetyAdapter {
  return Boolean(
    adapter
    && typeof (adapter as ReqriumSafetyAdapter).getReqriumSafetyState === 'function'
    && typeof (adapter as ReqriumSafetyAdapter).runReqriumSafetyCheck === 'function'
    && typeof (adapter as ReqriumSafetyAdapter).createReportDraft === 'function',
  );
}

export type NomadBlockPagesSafetyHookState = ReqriumSafetyState & {
  loading: boolean;
  error: string | null;
  refresh(): Promise<ReqriumSafetyState | void>;
  runScan(): Promise<ReqriumSafetyState | void>;
  scanUrl(url: string): Promise<unknown>;
  scanAddress(address: string): Promise<unknown>;
  createReportDraft(
    category: ReqriumReportDraft['category'],
    target: string,
    notes: string,
  ): Promise<ReqriumReportDraft>;
};

export function useNomadBlockPagesSafety(adapters?: NomadOverlayAdapters): NomadBlockPagesSafetyHookState {
  const contextAdapters = useNomadAdapters();
  const safetyAdapter = (adapters ?? contextAdapters).safety;
  const [state, setState] = useState<ReqriumSafetyState>(fallbackSafety);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!safetyAdapter) {
      setError('Reqrium safety adapter is not connected.');
      setLoading(false);
      return;
    }
    if (!isReqriumAdapter(safetyAdapter)) {
      setError('The connected safety adapter does not expose Reqrium dashboard evidence.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const next = await safetyAdapter.getReqriumSafetyState();
      setState(next);
      return next;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load Reqrium safety evidence.');
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [safetyAdapter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runScan = useCallback(async () => {
    if (!isReqriumAdapter(safetyAdapter)) throw new Error('Reqrium dashboard checks are not available from the connected adapter.');
    setLoading(true);
    setError(null);
    try {
      const next = await safetyAdapter.runReqriumSafetyCheck();
      setState(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to run the Reqrium safety check.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [safetyAdapter]);

  const scanUrl = useCallback(async (url: string) => {
    if (!safetyAdapter) throw new Error('Reqrium URL scanning is not connected.');
    const result = await safetyAdapter.scanUrl(url);
    if (isReqriumAdapter(safetyAdapter)) setState(await safetyAdapter.getReqriumSafetyState());
    return result;
  }, [safetyAdapter]);

  const scanAddress = useCallback(async (address: string) => {
    if (!safetyAdapter) throw new Error('Reqrium address scanning is not connected.');
    const result = await safetyAdapter.scanAddress(address);
    if (isReqriumAdapter(safetyAdapter)) setState(await safetyAdapter.getReqriumSafetyState());
    return result;
  }, [safetyAdapter]);

  const createReportDraft = useCallback(async (
    category: ReqriumReportDraft['category'],
    target: string,
    notes: string,
  ) => {
    if (!isReqriumAdapter(safetyAdapter)) throw new Error('Reqrium report drafting is not available from the connected adapter.');
    const report = await safetyAdapter.createReportDraft(category, target, notes);
    setState(await safetyAdapter.getReqriumSafetyState());
    return report;
  }, [safetyAdapter]);

  return useMemo(
    () => ({ ...state, loading, error, refresh, runScan, scanUrl, scanAddress, createReportDraft }),
    [state, loading, error, refresh, runScan, scanUrl, scanAddress, createReportDraft],
  );
}
