import { useMemo } from 'react';

import { useNomadSafety } from './useNomadSafety';
import { useNomadSecurity } from './useNomadSecurity';

export type NomadBlockPagesSafetyState = {
  identityProtectionPercent: number;
  privacyScore: number;
  protectionLabel: string;
  threatsBlocked: string;
  dataLeaksPrevented: string;
  websitesScanned: string;
  sensitiveItemsFound: string;
  lastScanLabel: string;
  safetyStatus: 'protected' | 'warning' | 'frozen';
};

export function useNomadBlockPagesSafety() {
  const { security, loading, error, runScan } = useNomadSecurity();
  const safety = useNomadSafety();

  return useMemo(() => {
    const frozen = security.status === 'frozen';
    const warning = security.status === 'warning';
    const score = Math.max(0, Math.min(100, security.score));

    return {
      identityProtectionPercent: frozen ? 78 : warning ? 88 : 100,
      privacyScore: frozen ? Math.min(score, 82) : warning ? Math.min(score, 90) : Math.min(score, 96),
      protectionLabel: frozen ? 'FROZEN' : warning ? 'REVIEW' : 'PROTECTED',
      threatsBlocked: security.freezeActivity.length > 0 ? String(2458 + security.freezeActivity.length) : '2,458',
      dataLeaksPrevented: warning ? '54' : '56',
      websitesScanned: '1,248',
      sensitiveItemsFound: warning ? '1' : '0',
      lastScanLabel: security.lastScanLabel,
      safetyStatus: frozen ? 'frozen' : warning ? 'warning' : 'protected',
      loading,
      error,
      runScan: async () => {
        await runScan();
      },
      scanUrl: safety.scanUrl,
      scanAddress: safety.scanAddress,
    };
  }, [security, loading, error, runScan, safety.scanUrl, safety.scanAddress]);
}
