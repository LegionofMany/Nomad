import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  nomadURLSafetyScannerAdapter,
  type ReqriumURLScannerState,
} from '../adapters/nomadURLSafetyScannerAdapter';

const fallbackState: ReqriumURLScannerState = {
  history: [],
  activity: [],
  totalUrlScans: 0,
  flaggedUrlScans: 0,
  localReportDrafts: 0,
  remoteThreatIntelligenceConnected: false,
  redirectResolverConnected: false,
  tlsCertificateProviderConnected: false,
  malwareProviderConnected: false,
  communityReportsConnected: false,
  dataSource: 'reqrium_url_scanner_adapter',
  persistence: 'in_memory_stub',
  checkedAt: new Date(0).toISOString(),
};

function scopeURLReportCount(state: ReqriumURLScannerState): ReqriumURLScannerState {
  return {
    ...state,
    localReportDrafts: state.activity.filter((event) => event.type === 'report').length,
  };
}

export function useNomadURLSafetyScanner(initialUrl?: string) {
  const [scanner, setScanner] = useState<ReqriumURLScannerState>(fallbackState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialScanAttempted, setInitialScanAttempted] = useState(false);

  const refresh = useCallback(async (selectedScanId?: string) => {
    setLoading(true);
    try {
      setError(null);
      const next = scopeURLReportCount(await nomadURLSafetyScannerAdapter.getScannerState(selectedScanId));
      setScanner(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to load Reqrium URL scanner state.';
      setError(message);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  const scanUrl = useCallback(async (rawUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const next = scopeURLReportCount(await nomadURLSafetyScannerAdapter.scanUrl(rawUrl));
      setScanner(next);
      return next.selectedScan;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to scan this website URL.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectScan = useCallback(async (scanId: string) => {
    setLoading(true);
    setError(null);
    try {
      const next = scopeURLReportCount(await nomadURLSafetyScannerAdapter.selectScan(scanId));
      setScanner(next);
      return next.selectedScan;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to open the selected Reqrium URL scan.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createReportDraft = useCallback(async (scanId: string, notes: string) => {
    setLoading(true);
    setError(null);
    try {
      const next = scopeURLReportCount(await nomadURLSafetyScannerAdapter.createReportDraft(scanId, notes));
      setScanner(next);
      return next.selectedScan;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to save the URL report draft.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const clean = initialUrl?.trim();
    if (!clean || initialScanAttempted) return;
    setInitialScanAttempted(true);
    void scanUrl(clean).catch(() => undefined);
  }, [initialScanAttempted, initialUrl, scanUrl]);

  return useMemo(
    () => ({
      scanner,
      loading,
      error,
      refresh,
      scanUrl,
      selectScan,
      createReportDraft,
    }),
    [scanner, loading, error, refresh, scanUrl, selectScan, createReportDraft],
  );
}
