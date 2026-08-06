import { getWalletMeta, getWalletStatus } from '../../services/walletService';
import { secureGetItem, secureSetItem } from '../../services/nativeStubs';

import { nomadSecurityAdapter } from './nomadSecurityAdapter';
import type {
  NomadSafetyAdapter,
  NomadSafetyScanResult,
} from './walletAdapter';

export type ReqriumSafetyModuleStatus = 'available' | 'limited' | 'not_configured' | 'unavailable';

export type ReqriumSafetyModuleId =
  | 'phishing_url'
  | 'wallet_address'
  | 'identity_monitoring'
  | 'breach_monitoring'
  | 'malware_runtime'
  | 'social_engineering';

export type ReqriumSafetyModule = {
  id: ReqriumSafetyModuleId;
  title: string;
  subtitle: string;
  status: ReqriumSafetyModuleStatus;
  detail: string;
  route: string;
  provider: string;
};

export type ReqriumExposureItem = {
  id: 'email' | 'password' | 'phone' | 'address' | 'url';
  label: string;
  count: number;
  status: 'clear' | 'review' | 'unavailable';
  detail: string;
  route?: string;
};

export type ReqriumScanKind = 'url' | 'address' | 'full_check';

export type ReqriumScanRecord = {
  id: string;
  kind: ReqriumScanKind;
  targetLabel: string;
  score: number;
  risk: NomadSafetyScanResult['risk'];
  summary: string;
  evidence: string[];
  checkedAt: string;
  provider: 'reqrium_local_heuristics';
};

export type ReqriumSafetyEvent = {
  id: string;
  type: 'scan' | 'report' | 'security' | 'system';
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
};

export type ReqriumReportDraft = {
  id: string;
  category: 'phishing' | 'scam_address' | 'impersonation' | 'malware' | 'other';
  target: string;
  notes: string;
  status: 'local_draft';
  createdAt: string;
};

export type ReqriumSafetyState = {
  status: 'limited' | 'attention_required' | 'frozen' | 'not_configured';
  readinessScore: number;
  privacyScore: number;
  protectionLabel: string;
  localFlags: number;
  scansRecorded: number;
  openFindings: number;
  reportDrafts: number;
  lastScanLabel: string;
  lastCheckedAt?: string;
  modules: ReqriumSafetyModule[];
  exposures: ReqriumExposureItem[];
  activity: ReqriumSafetyEvent[];
  scans: ReqriumScanRecord[];
  remoteThreatIntelligenceConnected: false;
  breachProviderConnected: false;
  malwareProviderConnected: false;
  dataSource: 'reqrium_local_heuristics';
  persistence: 'in_memory_stub';
};

export type ReqriumSafetyAdapter = NomadSafetyAdapter & {
  getReqriumSafetyState(): Promise<ReqriumSafetyState>;
  runReqriumSafetyCheck(): Promise<ReqriumSafetyState>;
  createReportDraft(
    category: ReqriumReportDraft['category'],
    target: string,
    notes: string,
  ): Promise<ReqriumReportDraft>;
};

type StoredReqriumSafety = {
  scans: ReqriumScanRecord[];
  events: ReqriumSafetyEvent[];
  reports: ReqriumReportDraft[];
  lastCheckedAt?: string;
};

const STORAGE_KEY = 'nomad.reqrium.safety';
const MAX_SCANS = 60;
const MAX_EVENTS = 60;
const MAX_REPORTS = 30;

const suspiciousWords = [
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

const shortenedHosts = new Set([
  'bit.ly',
  'cutt.ly',
  'is.gd',
  'rb.gy',
  'shorturl.at',
  't.co',
  'tiny.cc',
  'tinyurl.com',
]);

function nowIso() {
  return new Date().toISOString();
}

function identifier(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStoredState(): StoredReqriumSafety {
  return { scans: [], events: [], reports: [] };
}

async function loadStoredState(): Promise<StoredReqriumSafety> {
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return defaultStoredState();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredReqriumSafety>;
    return {
      scans: Array.isArray(parsed.scans) ? parsed.scans : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
      lastCheckedAt: parsed.lastCheckedAt,
    };
  } catch {
    return defaultStoredState();
  }
}

async function saveStoredState(state: StoredReqriumSafety) {
  await secureSetItem(STORAGE_KEY, JSON.stringify({
    ...state,
    scans: state.scans.slice(0, MAX_SCANS),
    events: state.events.slice(0, MAX_EVENTS),
    reports: state.reports.slice(0, MAX_REPORTS),
  }));
}

function addEvent(
  stored: StoredReqriumSafety,
  event: Omit<ReqriumSafetyEvent, 'id' | 'timestamp'>,
): StoredReqriumSafety {
  return {
    ...stored,
    events: [{ id: identifier('reqrium-event'), timestamp: nowIso(), ...event }, ...stored.events].slice(0, MAX_EVENTS),
  };
}

function riskFromScore(score: number): NomadSafetyScanResult['risk'] {
  if (score < 50) return 'high';
  if (score < 75) return 'medium';
  return 'low';
}

function resultFromRecord(record: ReqriumScanRecord): NomadSafetyScanResult {
  return {
    score: record.score,
    risk: record.risk,
    summary: record.summary,
    provider: 'local',
    checkedAt: record.checkedAt,
  };
}

function sanitizeTarget(value: string) {
  return value.trim().slice(0, 500);
}

function addressLabel(value: string) {
  const clean = value.trim();
  if (clean.length <= 16) return clean;
  return `${clean.slice(0, 8)}…${clean.slice(-6)}`;
}

function urlLabel(value: string) {
  try {
    const prepared = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(prepared).hostname || value.slice(0, 80);
  } catch {
    return value.slice(0, 80);
  }
}

function isIpv4(hostname: string) {
  const parts = hostname.split('.');
  return parts.length === 4 && parts.every((part) => {
    const value = Number(part);
    return Number.isInteger(value) && value >= 0 && value <= 255;
  });
}

function analyzeUrl(input: string) {
  const clean = sanitizeTarget(input);
  const evidence: string[] = [];
  let score = 90;

  if (!clean) {
    return { score: 0, evidence: ['No URL was supplied.'], summary: 'Enter a URL to run Reqrium local checks.' };
  }

  const hasExplicitScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(clean);
  const prepared = hasExplicitScheme ? clean : `https://${clean}`;
  let parsed: URL;
  try {
    parsed = new URL(prepared);
  } catch {
    return { score: 10, evidence: ['The value is not a valid URL.'], summary: 'Reqrium could not parse this URL.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  const normalized = prepared.toLowerCase();

  if (!hasExplicitScheme) {
    score -= 8;
    evidence.push('No scheme was supplied; HTTPS was inferred for analysis.');
  }
  if (parsed.protocol !== 'https:') {
    score -= 22;
    evidence.push('The URL does not use HTTPS.');
  }
  if (parsed.username || parsed.password) {
    score -= 35;
    evidence.push('The URL contains embedded user information, which can hide the real destination.');
  }
  if (hostname.startsWith('xn--') || hostname.includes('.xn--')) {
    score -= 20;
    evidence.push('The hostname uses punycode and should be checked for lookalike characters.');
  }
  if (isIpv4(hostname) || hostname.includes(':')) {
    score -= 18;
    evidence.push('The destination uses a direct IP address instead of a named domain.');
  }
  if (shortenedHosts.has(hostname)) {
    score -= 20;
    evidence.push('The destination is hidden behind a URL-shortening service.');
  }

  const matchedWords = suspiciousWords.filter((word) => normalized.includes(word));
  if (matchedWords.length) {
    score -= Math.min(55, 24 + matchedWords.length * 8);
    evidence.push(`High-risk wallet language detected: ${matchedWords.join(', ')}.`);
  }
  if ((normalized.match(/-/g) ?? []).length >= 5) {
    score -= 8;
    evidence.push('The URL contains an unusually high number of hyphens.');
  }
  if (parsed.port && !['80', '443'].includes(parsed.port)) {
    score -= 8;
    evidence.push(`The URL uses uncommon port ${parsed.port}.`);
  }

  score = Math.max(0, Math.min(90, score));
  if (!evidence.length) {
    evidence.push('No local structural or keyword flags were detected.');
  }
  const risk = riskFromScore(score);
  const summary = risk === 'low'
    ? 'No local URL flags were detected. Remote reputation and threat intelligence are not connected.'
    : risk === 'medium'
      ? 'Reqrium found URL characteristics that require manual review.'
      : 'Reqrium found multiple high-risk URL characteristics. Do not connect a wallet or enter credentials.';
  return { score, evidence, summary };
}

function recognizedAddressFormat(value: string) {
  const address = value.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'EVM address format';
  if (/^xdc[a-fA-F0-9]{40}$/.test(address)) return 'XDC address format';
  if (/^(bc1)[ac-hj-np-z02-9]{11,71}$/i.test(address) || /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return 'Bitcoin address format';
  if (/^0\.0\.\d+$/.test(address)) return 'Hedera account format';
  if (/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address)) return 'XRPL address format';
  if (/^G[A-Z2-7]{55}$/.test(address)) return 'Stellar address format';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return 'Base58-compatible address format';
  return null;
}

function analyzeAddress(input: string) {
  const clean = sanitizeTarget(input);
  const evidence: string[] = [];
  let score = 85;

  if (!clean) {
    return { score: 0, evidence: ['No wallet address was supplied.'], summary: 'Enter a wallet address to run Reqrium local checks.' };
  }

  const normalized = clean.toLowerCase();
  const suspicious = ['drain', 'scam', 'phish', 'seed', 'support'].filter((word) => normalized.includes(word));
  if (suspicious.length) {
    score -= 60;
    evidence.push(`Suspicious text detected inside the submitted value: ${suspicious.join(', ')}.`);
  }

  const format = recognizedAddressFormat(clean);
  if (format) {
    evidence.push(`${format} recognized.`);
  } else {
    score -= 42;
    evidence.push('The value does not match a supported wallet-address format.');
  }

  if (/\s/.test(clean)) {
    score -= 30;
    evidence.push('Wallet addresses must not contain spaces.');
  }

  score = Math.max(0, Math.min(85, score));
  const risk = riskFromScore(score);
  const summary = risk === 'low'
    ? 'The address format passed local checks. Ownership, reputation and sanctions data are not verified.'
    : risk === 'medium'
      ? 'The submitted value requires manual address verification.'
      : 'The submitted value failed local wallet-address checks.';
  return { score, evidence, summary };
}

async function recordScan(
  kind: 'url' | 'address',
  targetLabel: string,
  analysis: { score: number; evidence: string[]; summary: string },
) {
  let stored = await loadStoredState();
  const checkedAt = nowIso();
  const risk = riskFromScore(analysis.score);
  const record: ReqriumScanRecord = {
    id: identifier(`reqrium-${kind}`),
    kind,
    targetLabel,
    score: analysis.score,
    risk,
    summary: analysis.summary,
    evidence: analysis.evidence,
    checkedAt,
    provider: 'reqrium_local_heuristics',
  };
  stored = addEvent({
    ...stored,
    scans: [record, ...stored.scans].slice(0, MAX_SCANS),
    lastCheckedAt: checkedAt,
  }, {
    type: 'scan',
    title: `${kind === 'url' ? 'URL' : 'Address'} check completed`,
    detail: `${targetLabel || 'Unlabelled target'} • ${risk.toUpperCase()} • ${analysis.score}/100 • local heuristics`,
    severity: risk === 'high' ? 'critical' : risk === 'medium' ? 'warning' : 'info',
  });
  await saveStoredState(stored);
  return record;
}

function modulePoints(status: ReqriumSafetyModuleStatus) {
  switch (status) {
    case 'available': return 100;
    case 'limited': return 65;
    case 'not_configured': return 25;
    case 'unavailable': return 0;
  }
}

function lastScanLabel(scans: ReqriumScanRecord[]) {
  const latest = scans[0];
  if (!latest) return 'No scans recorded';
  const timestamp = Date.parse(latest.checkedAt);
  if (!Number.isFinite(timestamp)) return 'Scan time unavailable';
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function buildState(storedInput?: StoredReqriumSafety): Promise<ReqriumSafetyState> {
  const stored = storedInput ?? await loadStoredState();
  const [walletMeta, walletStatus, security] = await Promise.all([
    getWalletMeta(),
    getWalletStatus(),
    nomadSecurityAdapter.getSecurityState(),
  ]);
  const hasWallet = Boolean(walletMeta);
  const modules: ReqriumSafetyModule[] = [
    {
      id: 'phishing_url',
      title: 'Phishing URL Checks',
      subtitle: 'Local structural and high-risk language analysis',
      status: 'limited',
      detail: 'Reqrium can inspect URL structure, HTTPS use, punycode, shortened links and wallet-drainer language. Remote reputation feeds are not connected.',
      route: 'BlockPagesURLScanner',
      provider: 'Reqrium local heuristics',
    },
    {
      id: 'wallet_address',
      title: 'Wallet Address Checks',
      subtitle: 'Format and suspicious-value validation',
      status: hasWallet ? 'limited' : 'not_configured',
      detail: hasWallet
        ? 'Supported address formats can be validated locally. Ownership, sanctions, transaction graph and reputation feeds are not connected.'
        : 'Create or restore a wallet before using wallet-context safety checks.',
      route: 'AddressSafetyDetail',
      provider: 'Reqrium local heuristics',
    },
    {
      id: 'identity_monitoring',
      title: 'Identity Monitoring',
      subtitle: 'Email, phone and impersonation exposure',
      status: 'unavailable',
      detail: 'No identity-monitoring, email-breach or phone-exposure provider is connected.',
      route: 'Settings',
      provider: 'No identity provider',
    },
    {
      id: 'breach_monitoring',
      title: 'Data Leak Monitoring',
      subtitle: 'Credential and breach-source intelligence',
      status: 'unavailable',
      detail: 'No breach corpus, credential exposure feed or dark-web monitoring provider is connected.',
      route: 'Settings',
      provider: 'No breach provider',
    },
    {
      id: 'malware_runtime',
      title: 'Malware Protection',
      subtitle: 'File, application and runtime inspection',
      status: 'unavailable',
      detail: 'No antivirus engine, downloaded-file scanner, application attestation or runtime malware provider is connected.',
      route: 'NomadWatch',
      provider: 'No malware provider',
    },
    {
      id: 'social_engineering',
      title: 'Social Engineering Review',
      subtitle: 'Decision-support warnings before signing',
      status: 'limited',
      detail: 'Nomad can surface local warnings and review steps, but impersonation and communication analysis are not automated.',
      route: 'SecurityCenter',
      provider: 'Nomad review controls',
    },
  ];

  const flaggedScans = stored.scans.filter((scan) => scan.risk !== 'low');
  const addressFlags = flaggedScans.filter((scan) => scan.kind === 'address').length;
  const urlFlags = flaggedScans.filter((scan) => scan.kind === 'url').length;
  const exposures: ReqriumExposureItem[] = [
    { id: 'email', label: 'Email Exposures', count: 0, status: 'unavailable', detail: 'No email-breach provider is connected.' },
    { id: 'password', label: 'Password Exposures', count: 0, status: 'unavailable', detail: 'No credential-breach provider is connected.' },
    { id: 'phone', label: 'Phone Exposures', count: 0, status: 'unavailable', detail: 'No phone-exposure provider is connected.' },
    { id: 'address', label: 'Address Risk Findings', count: addressFlags, status: addressFlags ? 'review' : 'clear', detail: 'Based only on recorded Reqrium local address checks.', route: 'AddressSafetyDetail' },
    { id: 'url', label: 'URL Risk Findings', count: urlFlags, status: urlFlags ? 'review' : 'clear', detail: 'Based only on recorded Reqrium local URL checks.', route: 'BlockPagesURLScanner' },
  ];

  const moduleAverage = modules.reduce((sum, module) => sum + modulePoints(module.status), 0) / modules.length;
  const readinessScore = Math.round(moduleAverage * 0.65 + Math.max(0, Math.min(100, security.score)) * 0.35);
  const privacyScore = Math.round(moduleAverage * 0.5 + (hasWallet ? 25 : 5) + (security.freezeStatus === 'none' ? 15 : 5));
  const openFindings = flaggedScans.length + stored.reports.length;
  const status: ReqriumSafetyState['status'] = security.status === 'frozen' || walletStatus === 'recovery'
    ? 'frozen'
    : openFindings > 0
      ? 'attention_required'
      : hasWallet
        ? 'limited'
        : 'not_configured';

  return {
    status,
    readinessScore: Math.max(0, Math.min(100, readinessScore)),
    privacyScore: Math.max(0, Math.min(100, privacyScore)),
    protectionLabel: status === 'frozen' ? 'FROZEN' : status === 'attention_required' ? 'REVIEW' : status === 'limited' ? 'LIMITED' : 'SETUP REQUIRED',
    localFlags: flaggedScans.length,
    scansRecorded: stored.scans.length,
    openFindings,
    reportDrafts: stored.reports.length,
    lastScanLabel: lastScanLabel(stored.scans),
    lastCheckedAt: stored.lastCheckedAt,
    modules,
    exposures,
    activity: stored.events,
    scans: stored.scans,
    remoteThreatIntelligenceConnected: false,
    breachProviderConnected: false,
    malwareProviderConnected: false,
    dataSource: 'reqrium_local_heuristics',
    persistence: 'in_memory_stub',
  };
}

async function runReqriumSafetyCheck() {
  let stored = await loadStoredState();
  const checkedAt = nowIso();
  const stateBeforeEvent = await buildState({ ...stored, lastCheckedAt: checkedAt });
  const fullRecord: ReqriumScanRecord = {
    id: identifier('reqrium-full-check'),
    kind: 'full_check',
    targetLabel: 'Reqrium Safety Hub',
    score: stateBeforeEvent.readinessScore,
    risk: stateBeforeEvent.status === 'frozen' ? 'high' : stateBeforeEvent.status === 'attention_required' ? 'medium' : 'low',
    summary: 'Reqrium recalculated registered local safety modules and provider availability.',
    evidence: [
      `${stateBeforeEvent.modules.filter((module) => module.status === 'limited' || module.status === 'available').length}/${stateBeforeEvent.modules.length} modules have local functionality.`,
      'Remote threat intelligence, identity monitoring, breach data and malware scanning are not connected.',
    ],
    checkedAt,
    provider: 'reqrium_local_heuristics',
  };
  stored = addEvent({
    ...stored,
    lastCheckedAt: checkedAt,
    scans: [fullRecord, ...stored.scans].slice(0, MAX_SCANS),
  }, {
    type: 'system',
    title: 'Reqrium Safety check completed',
    detail: `${stateBeforeEvent.readinessScore}/100 local readiness • remote intelligence unavailable`,
    severity: stateBeforeEvent.status === 'frozen' ? 'critical' : stateBeforeEvent.status === 'attention_required' ? 'warning' : 'info',
  });
  await saveStoredState(stored);
  return buildState(stored);
}

async function scanUrl(url: string) {
  const analysis = analyzeUrl(url);
  const record = await recordScan('url', urlLabel(url), analysis);
  return resultFromRecord(record);
}

async function scanAddress(address: string) {
  const analysis = analyzeAddress(address);
  const record = await recordScan('address', addressLabel(address), analysis);
  return resultFromRecord(record);
}

async function createReportDraft(
  category: ReqriumReportDraft['category'],
  target: string,
  notes: string,
) {
  const cleanTarget = sanitizeTarget(target);
  const cleanNotes = notes.trim().slice(0, 1200);
  if (cleanTarget.length < 3) throw new Error('Enter the suspicious URL, address, account or contact.');
  if (cleanNotes.length < 10) throw new Error('Add at least 10 characters describing the suspicious activity.');
  const allowed = new Set<ReqriumReportDraft['category']>(['phishing', 'scam_address', 'impersonation', 'malware', 'other']);
  if (!allowed.has(category)) throw new Error('Choose a valid report category.');

  const report: ReqriumReportDraft = {
    id: identifier('reqrium-report'),
    category,
    target: cleanTarget,
    notes: cleanNotes,
    status: 'local_draft',
    createdAt: nowIso(),
  };
  let stored = await loadStoredState();
  stored = addEvent({
    ...stored,
    reports: [report, ...stored.reports].slice(0, MAX_REPORTS),
  }, {
    type: 'report',
    title: 'Scam report saved as local draft',
    detail: `${category.replace(/_/g, ' ')} • remote submission provider not connected`,
    severity: 'warning',
  });
  await saveStoredState(stored);
  return report;
}

export const nomadSafetyAdapter: ReqriumSafetyAdapter = {
  scanAddress,
  scanUrl,
  getReqriumSafetyState: () => buildState(),
  runReqriumSafetyCheck,
  createReportDraft,
};
