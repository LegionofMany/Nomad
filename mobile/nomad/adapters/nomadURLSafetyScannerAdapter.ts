import { secureGetItem, secureSetItem } from '../../services/nativeStubs';

import {
  nomadSafetyAdapter,
  type ReqriumReportDraft,
  type ReqriumScanRecord,
} from './nomadSafetyAdapter';

export type ReqriumURLCheckStatus = 'pass' | 'warning' | 'fail' | 'unavailable';

export type ReqriumURLCheck = {
  id:
    | 'url_structure'
    | 'https_transport'
    | 'embedded_credentials'
    | 'punycode_hostname'
    | 'direct_ip'
    | 'shortened_link'
    | 'wallet_language'
    | 'uncommon_port'
    | 'nested_destination'
    | 'remote_reputation'
    | 'redirect_chain'
    | 'tls_certificate'
    | 'malware_content'
    | 'community_reports';
  label: string;
  status: ReqriumURLCheckStatus;
  detail: string;
  provider: string;
};

export type ReqriumURLScanSession = {
  id: string;
  coreScanId: string;
  displayHost: string;
  persistedUrl: string;
  scheme: 'http' | 'https';
  score: number;
  risk: ReqriumScanRecord['risk'];
  summary: string;
  checks: ReqriumURLCheck[];
  evidence: string[];
  checkedAt: string;
  localCoveragePercent: number;
  reportDraftId?: string;
  rawQueryRetained: false;
  rawCredentialsRetained: false;
  provider: 'reqrium_local_heuristics';
};

export type ReqriumURLScannerEvent = {
  id: string;
  type: 'scan' | 'report' | 'system';
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
};

export type ReqriumURLScannerState = {
  selectedScan?: ReqriumURLScanSession;
  history: ReqriumURLScanSession[];
  activity: ReqriumURLScannerEvent[];
  totalUrlScans: number;
  flaggedUrlScans: number;
  localReportDrafts: number;
  remoteThreatIntelligenceConnected: false;
  redirectResolverConnected: false;
  tlsCertificateProviderConnected: false;
  malwareProviderConnected: false;
  communityReportsConnected: false;
  dataSource: 'reqrium_url_scanner_adapter';
  persistence: 'in_memory_stub';
  checkedAt: string;
};

export type ReqriumURLSafetyScannerAdapter = {
  getScannerState(selectedScanId?: string): Promise<ReqriumURLScannerState>;
  scanUrl(rawUrl: string): Promise<ReqriumURLScannerState>;
  selectScan(scanId: string): Promise<ReqriumURLScannerState>;
  createReportDraft(scanId: string, notes: string): Promise<ReqriumURLScannerState>;
};

type StoredURLScannerState = {
  sessions: ReqriumURLScanSession[];
  events: ReqriumURLScannerEvent[];
};

type ParsedURLInput = {
  normalizedForScan: string;
  persistedUrl: string;
  displayHost: string;
  scheme: 'http' | 'https';
  parsed: URL;
};

const STORAGE_KEY = 'nomad.reqrium.url-scanner';
const MAX_SESSIONS = 40;
const MAX_EVENTS = 50;
const SHORTENED_HOSTS = new Set([
  'bit.ly',
  'cutt.ly',
  'is.gd',
  'rb.gy',
  'shorturl.at',
  't.co',
  'tiny.cc',
  'tinyurl.com',
]);
const WALLET_LANGUAGE = [
  'airdrop',
  'claim-reward',
  'claim-token',
  'connect-wallet',
  'drain',
  'free-mint',
  'giveaway',
  'metamask-login',
  'mnemonic',
  'recover-seed',
  'seed-phrase',
  'support-login',
  'verify-wallet',
  'wallet-validation',
];
const NESTED_DESTINATION_KEYS = new Set([
  'continue',
  'destination',
  'next',
  'redirect',
  'redirect_uri',
  'return',
  'return_to',
  'url',
]);

function nowIso() {
  return new Date().toISOString();
}

function identifier(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStoredState(): StoredURLScannerState {
  return { sessions: [], events: [] };
}

async function loadStoredState(): Promise<StoredURLScannerState> {
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return defaultStoredState();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredURLScannerState>;
    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return defaultStoredState();
  }
}

async function saveStoredState(state: StoredURLScannerState) {
  await secureSetItem(STORAGE_KEY, JSON.stringify({
    sessions: state.sessions.slice(0, MAX_SESSIONS),
    events: state.events.slice(0, MAX_EVENTS),
  }));
}

function appendEvent(
  stored: StoredURLScannerState,
  event: Omit<ReqriumURLScannerEvent, 'id' | 'timestamp'>,
): StoredURLScannerState {
  return {
    ...stored,
    events: [{ id: identifier('reqrium-url-event'), timestamp: nowIso(), ...event }, ...stored.events].slice(0, MAX_EVENTS),
  };
}

function stripControlCharacters(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

function parseURLInput(rawUrl: string): ParsedURLInput {
  const clean = stripControlCharacters(rawUrl).slice(0, 2048);
  if (!clean) throw new Error('Enter a website URL before scanning.');
  if (/\s/.test(clean)) throw new Error('Website URLs cannot contain spaces.');

  const explicitScheme = clean.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  if (explicitScheme && explicitScheme !== 'http' && explicitScheme !== 'https') {
    throw new Error(`Reqrium URL Scanner supports HTTP and HTTPS only. The ${explicitScheme} scheme was not scanned.`);
  }

  const normalizedForScan = explicitScheme ? clean : `https://${clean}`;
  let parsed: URL;
  try {
    parsed = new URL(normalizedForScan);
  } catch {
    throw new Error('The submitted value is not a valid website URL.');
  }

  if (!parsed.hostname) throw new Error('The submitted URL does not contain a website hostname.');
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Reqrium URL Scanner supports HTTP and HTTPS websites only.');
  }

  const scheme: 'http' | 'https' = parsed.protocol === 'https:' ? 'https' : 'http';
  const safe = new URL(parsed.toString());
  safe.username = '';
  safe.password = '';
  safe.search = '';
  safe.hash = '';
  const persistedUrl = safe.toString().slice(0, 500);

  return {
    normalizedForScan,
    persistedUrl,
    displayHost: parsed.hostname.toLowerCase(),
    scheme,
    parsed,
  };
}

function isIpv4(hostname: string) {
  const parts = hostname.split('.');
  return parts.length === 4 && parts.every((part) => {
    const value = Number(part);
    return Number.isInteger(value) && value >= 0 && value <= 255;
  });
}

function usesDirectIp(hostname: string) {
  return isIpv4(hostname) || hostname.includes(':');
}

function nestedDestinationKeys(parsed: URL) {
  const found: string[] = [];
  parsed.searchParams.forEach((_value, key) => {
    if (NESTED_DESTINATION_KEYS.has(key.toLowerCase())) found.push(key);
  });
  return found;
}

function walletLanguageMatches(parsed: URL) {
  const searchable = `${parsed.hostname}${parsed.pathname}${parsed.search}`.toLowerCase();
  return WALLET_LANGUAGE.filter((word) => searchable.includes(word));
}

function buildChecks(input: ParsedURLInput): ReqriumURLCheck[] {
  const host = input.parsed.hostname.toLowerCase();
  const punycode = host.startsWith('xn--') || host.includes('.xn--');
  const directIp = usesDirectIp(host);
  const shortened = SHORTENED_HOSTS.has(host);
  const walletWords = walletLanguageMatches(input.parsed);
  const nestedKeys = nestedDestinationKeys(input.parsed);
  const uncommonPort = Boolean(input.parsed.port && !['80', '443'].includes(input.parsed.port));
  const hasCredentials = Boolean(input.parsed.username || input.parsed.password);

  return [
    {
      id: 'url_structure',
      label: 'URL structure',
      status: 'pass',
      detail: `The input parsed as an ${input.scheme.toUpperCase()} website URL. Parsing does not verify ownership or safety.`,
      provider: 'Browser URL parser',
    },
    {
      id: 'https_transport',
      label: 'HTTPS transport',
      status: input.scheme === 'https' ? 'pass' : 'warning',
      detail: input.scheme === 'https'
        ? 'The URL requests HTTPS. Certificate validity and the final connection were not tested.'
        : 'The URL requests unencrypted HTTP transport.',
      provider: 'Reqrium local URL analysis',
    },
    {
      id: 'embedded_credentials',
      label: 'Embedded credentials',
      status: hasCredentials ? 'fail' : 'pass',
      detail: hasCredentials
        ? 'The URL contains embedded username or password fields that can obscure the actual destination.'
        : 'No embedded username or password fields were detected.',
      provider: 'Reqrium local URL analysis',
    },
    {
      id: 'punycode_hostname',
      label: 'Punycode hostname',
      status: punycode ? 'warning' : 'pass',
      detail: punycode
        ? 'The hostname uses punycode. Check carefully for internationalized lookalike characters.'
        : 'No punycode label was detected in the hostname.',
      provider: 'Reqrium local URL analysis',
    },
    {
      id: 'direct_ip',
      label: 'Direct IP destination',
      status: directIp ? 'warning' : 'pass',
      detail: directIp
        ? 'The URL points directly to an IP address instead of a named domain.'
        : 'The URL uses a named hostname.',
      provider: 'Reqrium local URL analysis',
    },
    {
      id: 'shortened_link',
      label: 'Shortened-link service',
      status: shortened ? 'warning' : 'pass',
      detail: shortened
        ? 'A URL-shortening service hides the final destination. Redirect resolution is unavailable.'
        : 'The hostname is not in Reqrium’s local shortener list.',
      provider: 'Reqrium local shortener list',
    },
    {
      id: 'wallet_language',
      label: 'High-risk wallet language',
      status: walletWords.length ? 'fail' : 'pass',
      detail: walletWords.length
        ? `The URL contains wallet-risk language: ${walletWords.join(', ')}.`
        : 'No configured wallet-drainer or recovery-secret phrases were detected in the URL.',
      provider: 'Reqrium local keyword analysis',
    },
    {
      id: 'uncommon_port',
      label: 'Network port',
      status: uncommonPort ? 'warning' : 'pass',
      detail: uncommonPort
        ? `The URL uses uncommon port ${input.parsed.port}.`
        : 'No uncommon explicit port was detected.',
      provider: 'Reqrium local URL analysis',
    },
    {
      id: 'nested_destination',
      label: 'Nested destination parameter',
      status: nestedKeys.length ? 'warning' : 'pass',
      detail: nestedKeys.length
        ? `Possible redirect parameters were detected: ${nestedKeys.join(', ')}. Their destinations were not opened.`
        : 'No configured nested-destination parameter names were detected.',
      provider: 'Reqrium local query-key analysis',
    },
    {
      id: 'remote_reputation',
      label: 'Remote domain reputation',
      status: 'unavailable',
      detail: 'No remote phishing, domain-age, abuse or reputation feed is connected.',
      provider: 'Not connected',
    },
    {
      id: 'redirect_chain',
      label: 'Redirect-chain resolution',
      status: 'unavailable',
      detail: 'Reqrium did not open the URL or follow HTTP redirects.',
      provider: 'Not connected',
    },
    {
      id: 'tls_certificate',
      label: 'TLS certificate verification',
      status: 'unavailable',
      detail: 'The server certificate, hostname binding and certificate chain were not inspected.',
      provider: 'Not connected',
    },
    {
      id: 'malware_content',
      label: 'Page and script inspection',
      status: 'unavailable',
      detail: 'The page, scripts, downloads, wallet prompts and smart contracts were not fetched or executed.',
      provider: 'Not connected',
    },
    {
      id: 'community_reports',
      label: 'Community reports',
      status: 'unavailable',
      detail: 'No remote community-report or verified incident database is connected.',
      provider: 'Not connected',
    },
  ];
}

function localCoverage(checks: ReqriumURLCheck[]) {
  const available = checks.filter((check) => check.status !== 'unavailable').length;
  return Math.round((available / checks.length) * 100);
}

async function buildState(selectedScanId?: string): Promise<ReqriumURLScannerState> {
  const [stored, safety] = await Promise.all([
    loadStoredState(),
    nomadSafetyAdapter.getReqriumSafetyState(),
  ]);
  const selectedScan = selectedScanId
    ? stored.sessions.find((session) => session.id === selectedScanId)
    : stored.sessions[0];
  const coreUrlScans = safety.scans.filter((scan) => scan.kind === 'url');

  return {
    selectedScan,
    history: stored.sessions,
    activity: stored.events,
    totalUrlScans: coreUrlScans.length,
    flaggedUrlScans: coreUrlScans.filter((scan) => scan.risk !== 'low').length,
    localReportDrafts: safety.reportDrafts,
    remoteThreatIntelligenceConnected: false,
    redirectResolverConnected: false,
    tlsCertificateProviderConnected: false,
    malwareProviderConnected: false,
    communityReportsConnected: false,
    dataSource: 'reqrium_url_scanner_adapter',
    persistence: 'in_memory_stub',
    checkedAt: nowIso(),
  };
}

async function scanUrl(rawUrl: string) {
  const input = parseURLInput(rawUrl);
  await nomadSafetyAdapter.scanUrl(input.normalizedForScan);
  const safety = await nomadSafetyAdapter.getReqriumSafetyState();
  const coreRecord = safety.scans.find((scan) => scan.kind === 'url');
  if (!coreRecord) throw new Error('Reqrium did not return a URL scan record.');

  const checks = buildChecks(input);
  const session: ReqriumURLScanSession = {
    id: identifier('reqrium-url-session'),
    coreScanId: coreRecord.id,
    displayHost: input.displayHost,
    persistedUrl: input.persistedUrl,
    scheme: input.scheme,
    score: coreRecord.score,
    risk: coreRecord.risk,
    summary: coreRecord.summary,
    checks,
    evidence: coreRecord.evidence,
    checkedAt: coreRecord.checkedAt,
    localCoveragePercent: localCoverage(checks),
    rawQueryRetained: false,
    rawCredentialsRetained: false,
    provider: 'reqrium_local_heuristics',
  };

  let stored = await loadStoredState();
  stored = appendEvent({
    ...stored,
    sessions: [session, ...stored.sessions].slice(0, MAX_SESSIONS),
  }, {
    type: 'scan',
    title: 'Reqrium URL scan recorded',
    detail: `${session.displayHost} • ${session.risk.toUpperCase()} • ${session.score}/100 local score • remote intelligence unavailable`,
    severity: session.risk === 'high' ? 'critical' : session.risk === 'medium' ? 'warning' : 'info',
  });
  await saveStoredState(stored);
  return buildState(session.id);
}

async function selectScan(scanId: string) {
  const cleanId = scanId.trim();
  const stored = await loadStoredState();
  if (!stored.sessions.some((session) => session.id === cleanId)) {
    throw new Error('The selected Reqrium URL scan was not found.');
  }
  return buildState(cleanId);
}

async function createReportDraft(scanId: string, notes: string) {
  const cleanNotes = notes.trim().slice(0, 1200);
  if (cleanNotes.length < 10) throw new Error('Add at least 10 characters describing the suspicious website or false positive.');

  let stored = await loadStoredState();
  const session = stored.sessions.find((item) => item.id === scanId);
  if (!session) throw new Error('Run or select a URL scan before creating a report draft.');

  const report: ReqriumReportDraft = await nomadSafetyAdapter.createReportDraft(
    'phishing',
    session.persistedUrl,
    cleanNotes,
  );
  const updated: ReqriumURLScanSession = { ...session, reportDraftId: report.id };
  stored = appendEvent({
    ...stored,
    sessions: [updated, ...stored.sessions.filter((item) => item.id !== session.id)].slice(0, MAX_SESSIONS),
  }, {
    type: 'report',
    title: 'URL report saved as local draft',
    detail: `${session.displayHost} • ${report.id} • remote submission unavailable`,
    severity: 'warning',
  });
  await saveStoredState(stored);
  return buildState(updated.id);
}

export const nomadURLSafetyScannerAdapter: ReqriumURLSafetyScannerAdapter = {
  getScannerState: buildState,
  scanUrl,
  selectScan,
  createReportDraft,
};
