import type { NomadSafetyScanResult } from '../adapters/walletAdapter';

export type Blockpages411ClientConfig = {
  baseUrl?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
  maxPolls?: number;
};

type QueuedAuditResponse = {
  auditId?: string;
  status?: string;
  error?: string;
};

type AuditStatusResponse = {
  auditId?: string;
  status?: 'queued' | 'active' | 'completed' | 'failed' | string;
  error?: string;
};

type Blockpages411Report = {
  url?: string;
  auditId?: string;
  riskScore?: number;
  riskLevel?: string;
  summary?: string;
  recommendation?: string;
  clonedSite?: boolean;
  static?: unknown;
  dynamic?: unknown;
  payloads?: unknown;
  chainSimulation?: unknown;
  threatIntel?: unknown;
};

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_POLL_INTERVAL_MS = 1500;
const DEFAULT_MAX_POLLS = 18;

function getEnvBaseUrl() {
  // Expo exposes public build-time env vars under EXPO_PUBLIC_*.
  return process.env.EXPO_PUBLIC_BLOCKPAGES411_API_URL;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function normalizeBaseUrl(config?: Blockpages411ClientConfig) {
  const value = config?.baseUrl ?? getEnvBaseUrl();
  if (!value) return null;
  return trimTrailingSlash(value);
}

function riskFromScore(score: number): NomadSafetyScanResult['risk'] {
  if (score >= 70) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function nomadScoreFromRiskScore(riskScore: number) {
  // Blockpages riskScore is danger-oriented. Nomad score is safety-oriented.
  const danger = Math.max(0, Math.min(100, riskScore <= 10 ? riskScore * 10 : riskScore));
  return Math.max(0, Math.min(100, 100 - danger));
}

function normalizeReport(report: Blockpages411Report): NomadSafetyScanResult {
  const dangerScore = Number(report.riskScore ?? 0);
  const score = nomadScoreFromRiskScore(dangerScore);
  const risk = report.riskLevel ? riskFromScore(dangerScore <= 10 ? dangerScore * 10 : dangerScore) : riskFromScore(100 - score);
  const summary = report.summary || report.recommendation || (risk === 'low'
    ? 'Blockpages411 completed a live queued scan with no high-risk findings.'
    : 'Blockpages411 found indicators that require review before interacting with this site.');

  return {
    score,
    risk,
    summary,
    provider: 'blockpages',
    checkedAt: new Date().toISOString(),
  };
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function scanUrlWithBlockpages411(url: string, config?: Blockpages411ClientConfig): Promise<NomadSafetyScanResult> {
  const baseUrl = normalizeBaseUrl(config);
  if (!baseUrl) {
    throw new Error('Blockpages411 API URL is not configured. Set EXPO_PUBLIC_BLOCKPAGES411_API_URL for live scans.');
  }

  const timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const pollIntervalMs = config?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const maxPolls = config?.maxPolls ?? DEFAULT_MAX_POLLS;

  const submitResponse = await fetchWithTimeout(`${baseUrl}/audits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }, timeoutMs);

  if (!submitResponse.ok) {
    throw new Error(`Blockpages411 scan submit failed: ${submitResponse.status}`);
  }

  const submitted = await readJson<QueuedAuditResponse>(submitResponse);
  if (!submitted.auditId) {
    throw new Error(submitted.error || 'Blockpages411 did not return an audit ID.');
  }

  for (let attempt = 0; attempt < maxPolls; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    const statusResponse = await fetchWithTimeout(`${baseUrl}/audits/${encodeURIComponent(submitted.auditId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }, timeoutMs);

    if (!statusResponse.ok) {
      throw new Error(`Blockpages411 status check failed: ${statusResponse.status}`);
    }

    const status = await readJson<AuditStatusResponse>(statusResponse);
    if (status.status === 'failed') {
      throw new Error(status.error || 'Blockpages411 scan failed.');
    }

    if (status.status === 'completed') {
      const reportResponse = await fetchWithTimeout(`${baseUrl}/audits/${encodeURIComponent(submitted.auditId)}/report`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }, timeoutMs);

      if (!reportResponse.ok) {
        throw new Error(`Blockpages411 report fetch failed: ${reportResponse.status}`);
      }

      const report = await readJson<Blockpages411Report>(reportResponse);
      return normalizeReport(report);
    }
  }

  throw new Error('Blockpages411 scan timed out before a report was ready.');
}
