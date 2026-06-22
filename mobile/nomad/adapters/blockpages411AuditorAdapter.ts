import type { NomadSafetyAdapter, NomadSafetyScanResult } from './walletAdapter';

export type Blockpages411Report = {
  auditId?: string;
  url?: string;
  riskScore?: number;
  risk?: string;
  summary?: string;
  finalRisk?: {
    score?: number;
    level?: string;
    summary?: string;
  };
};

export type Blockpages411AuditorClient = {
  scanUrl(url: string): Promise<Blockpages411Report>;
};

function toRiskLevel(rawLevel: string | undefined, riskScore: number): NomadSafetyScanResult['risk'] {
  const level = (rawLevel || '').toLowerCase();
  if (level.includes('critical') || level.includes('high')) return 'high';
  if (level.includes('medium') || level.includes('moderate')) return 'medium';
  if (riskScore >= 7) return 'high';
  if (riskScore >= 4) return 'medium';
  return 'low';
}

function toNomadSafetyScore(riskScore: number): number {
  const normalizedRisk = Number.isFinite(riskScore) ? Math.max(0, Math.min(10, riskScore)) : 5;
  return Math.max(0, Math.min(100, Math.round(100 - normalizedRisk * 10)));
}

export function mapBlockpages411ReportToNomadSafety(report: Blockpages411Report): NomadSafetyScanResult {
  const riskScore = report.finalRisk?.score ?? report.riskScore ?? 5;
  const riskLevel = report.finalRisk?.level ?? report.risk;
  return {
    score: toNomadSafetyScore(riskScore),
    risk: toRiskLevel(riskLevel, riskScore),
    summary: report.finalRisk?.summary ?? report.summary ?? 'Blockpages411 Auditor completed the scan.',
    provider: 'blockpages',
    checkedAt: new Date().toISOString(),
  };
}

export function createBlockpages411AuditorAdapter(client?: Blockpages411AuditorClient): NomadSafetyAdapter {
  return {
    async scanUrl(url: string) {
      const normalized = url.trim();
      if (!normalized) {
        return { score: 0, risk: 'high', summary: 'No URL supplied for Blockpages411 scan.', provider: 'blockpages' };
      }

      if (!client) {
        return {
          score: 41,
          risk: 'medium',
          summary: 'Blockpages411 Auditor client is not connected. Configure the v8 queued auditor service before enabling live scans.',
          provider: 'blockpages',
          failure: { code: 'missing_provider', message: 'Missing Blockpages411 Auditor client.', recoverable: true },
        };
      }

      try {
        const report = await client.scanUrl(normalized);
        return mapBlockpages411ReportToNomadSafety(report);
      } catch (error) {
        return {
          score: 35,
          risk: 'medium',
          summary: `Blockpages411 scan could not complete: ${error instanceof Error ? error.message : 'Unknown error'}`,
          provider: 'blockpages',
          failure: { code: 'missing_provider', message: 'Blockpages411 Auditor client failed.', recoverable: true },
        };
      }
    },

    async scanAddress(address: string) {
      const normalized = address.trim();
      if (!normalized) return { score: 0, risk: 'high', summary: 'No address supplied.', provider: 'blockpages' };
      return {
        score: 75,
        risk: 'low',
        summary: 'Address-only live intelligence endpoint is not enabled in v8. URL and transaction-context scans use the queued Blockpages411 Auditor API.',
        provider: 'blockpages',
        checkedAt: new Date().toISOString(),
      };
    },
  };
}

export const blockpages411AuditorAdapter = createBlockpages411AuditorAdapter();
