import { secureGetItem, secureSetItem } from '../../services/nativeStubs';

import {
  nomadSafetyAdapter,
  type ReqriumReportDraft,
  type ReqriumScanRecord,
} from './nomadSafetyAdapter';
import type { NomadSafetyScanResult } from './walletAdapter';

export type ReqriumAddressCheckStatus = 'pass' | 'warning' | 'fail' | 'unavailable';

export type ReqriumAddressCheck = {
  id:
    | 'address_format'
    | 'embedded_text'
    | 'transaction_graph'
    | 'sanctions'
    | 'community_reports'
    | 'contract_safety';
  label: string;
  status: ReqriumAddressCheckStatus;
  detail: string;
  provider: string;
};

export type ReqriumAddressContact = {
  address: string;
  label: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  safetyEndorsement: false;
};

export type ReqriumAddressDetailEvent = {
  id: string;
  type: 'scan' | 'contact' | 'report';
  title: string;
  detail: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
};

export type ReqriumAddressSafetyDetailState = {
  target?: string;
  maskedTarget: string;
  chainLabel: string;
  score: number;
  risk: NomadSafetyScanResult['risk'];
  summary: string;
  checkedAt?: string;
  scanId?: string;
  evidence: string[];
  checks: ReqriumAddressCheck[];
  scanHistory: ReqriumScanRecord[];
  contact?: ReqriumAddressContact;
  localReportDrafts: number;
  activity: ReqriumAddressDetailEvent[];
  hasRecordedScan: boolean;
  remoteThreatIntelligenceConnected: false;
  transactionGraphConnected: false;
  sanctionsProviderConnected: false;
  communityReputationConnected: false;
  contractAnalysisConnected: false;
  provider: 'reqrium_local_heuristics';
  dataSource: 'reqrium_address_detail_adapter';
  persistence: 'in_memory_stub';
};

export type ReqriumAddressSafetyDetailAdapter = {
  getAddressDetail(address?: string): Promise<ReqriumAddressSafetyDetailState>;
  scanAddress(address: string): Promise<ReqriumAddressSafetyDetailState>;
  saveContact(address: string, label: string, note?: string): Promise<ReqriumAddressSafetyDetailState>;
  removeContact(address: string): Promise<ReqriumAddressSafetyDetailState>;
  createReportDraft(address: string, notes: string): Promise<{ draft: ReqriumReportDraft; state: ReqriumAddressSafetyDetailState }>;
};

type StoredAddressDetail = {
  lastAddress?: string;
  contacts: ReqriumAddressContact[];
  events: ReqriumAddressDetailEvent[];
};

const STORAGE_KEY = 'nomad.reqrium.address-detail';
const MAX_CONTACTS = 100;
const MAX_EVENTS = 60;

function nowIso() {
  return new Date().toISOString();
}

function identifier(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStoredState(): StoredAddressDetail {
  return { contacts: [], events: [] };
}

async function loadStoredState(): Promise<StoredAddressDetail> {
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return defaultStoredState();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredAddressDetail>;
    return {
      lastAddress: typeof parsed.lastAddress === 'string' ? parsed.lastAddress : undefined,
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return defaultStoredState();
  }
}

async function saveStoredState(state: StoredAddressDetail) {
  await secureSetItem(STORAGE_KEY, JSON.stringify({
    ...state,
    contacts: state.contacts.slice(0, MAX_CONTACTS),
    events: state.events.slice(0, MAX_EVENTS),
  }));
}

function addEvent(
  stored: StoredAddressDetail,
  event: Omit<ReqriumAddressDetailEvent, 'id' | 'timestamp'>,
): StoredAddressDetail {
  return {
    ...stored,
    events: [{ id: identifier('address-detail'), timestamp: nowIso(), ...event }, ...stored.events].slice(0, MAX_EVENTS),
  };
}

function cleanAddress(value: string) {
  return value.trim().slice(0, 500);
}

function maskedAddress(value?: string) {
  if (!value) return 'No address selected';
  if (value.length <= 22) return value;
  return `${value.slice(0, 12)}…${value.slice(-9)}`;
}

function targetLabel(value: string) {
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function chainLabel(value?: string) {
  if (!value) return 'Unknown network';
  if (/^0x[a-fA-F0-9]{40}$/.test(value)) return 'EVM-compatible address';
  if (/^xdc[a-fA-F0-9]{40}$/.test(value)) return 'XDC address';
  if (/^(bc1)[ac-hj-np-z02-9]{11,71}$/i.test(value) || /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(value)) return 'Bitcoin address';
  if (/^0\.0\.\d+$/.test(value)) return 'Hedera account';
  if (/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(value)) return 'XRPL address';
  if (/^G[A-Z2-7]{55}$/.test(value)) return 'Stellar address';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) return 'Base58-compatible address';
  return 'Unrecognized address format';
}

function riskFromScore(score: number): NomadSafetyScanResult['risk'] {
  if (score < 50) return 'high';
  if (score < 75) return 'medium';
  return 'low';
}

function latestMatchingRecord(scans: ReqriumScanRecord[], address: string) {
  const label = targetLabel(address);
  return scans.find((item) => item.kind === 'address' && item.targetLabel === label);
}

function buildChecks(
  address: string | undefined,
  record: ReqriumScanRecord | undefined,
  localReports: number,
): ReqriumAddressCheck[] {
  const evidence = record?.evidence ?? [];
  const formatRecognized = evidence.some((item) => /format recognized|account format|address format|base58-compatible/i.test(item));
  const invalidFormat = evidence.some((item) => /does not match a supported wallet-address format|must not contain spaces/i.test(item));
  const suspiciousText = evidence.some((item) => /suspicious text detected/i.test(item));

  return [
    {
      id: 'address_format',
      label: 'Address format',
      status: !address ? 'warning' : invalidFormat ? 'fail' : formatRecognized ? 'pass' : 'warning',
      detail: !address
        ? 'Scan an address to validate its structure.'
        : invalidFormat
          ? 'The submitted value failed one or more supported address-format checks.'
          : formatRecognized
            ? `${chainLabel(address)} structure recognized by local validation.`
            : 'The local record does not contain a conclusive format result.',
      provider: 'Reqrium local format validator',
    },
    {
      id: 'embedded_text',
      label: 'Suspicious embedded text',
      status: !record ? 'warning' : suspiciousText ? 'fail' : 'pass',
      detail: !record
        ? 'No recorded scan is available.'
        : suspiciousText
          ? 'Suspicious words were detected inside the submitted value.'
          : 'No suspicious embedded text was recorded by local heuristics.',
      provider: 'Reqrium local heuristics',
    },
    {
      id: 'transaction_graph',
      label: 'Transaction-graph reputation',
      status: 'unavailable',
      detail: 'No blockchain transaction-graph or wallet-reputation provider is connected.',
      provider: 'Not connected',
    },
    {
      id: 'sanctions',
      label: 'Sanctions screening',
      status: 'unavailable',
      detail: 'No sanctions, compliance or restricted-address provider is connected.',
      provider: 'Not connected',
    },
    {
      id: 'community_reports',
      label: 'Community reports',
      status: localReports > 0 ? 'warning' : 'unavailable',
      detail: localReports > 0
        ? `${localReports} local report draft${localReports === 1 ? '' : 's'} reference this address. They have not been remotely submitted or verified.`
        : 'No remote community-reputation provider is connected. Zero local drafts does not mean zero reports exist elsewhere.',
      provider: localReports > 0 ? 'Local Reqrium drafts' : 'Not connected',
    },
    {
      id: 'contract_safety',
      label: 'Contract and signing safety',
      status: 'unavailable',
      detail: 'Contract bytecode, requested permissions and transaction intent must be evaluated at signing time. No contract-analysis provider is connected here.',
      provider: 'Not connected',
    },
  ];
}

async function buildState(addressInput?: string): Promise<ReqriumAddressSafetyDetailState> {
  const [stored, safety] = await Promise.all([
    loadStoredState(),
    nomadSafetyAdapter.getReqriumSafetyState(),
  ]);
  const target = cleanAddress(addressInput || stored.lastAddress || '') || undefined;
  const matchingScans = target
    ? safety.scans.filter((item) => item.kind === 'address' && item.targetLabel === targetLabel(target))
    : [];
  const record = matchingScans[0];
  const contact = target ? stored.contacts.find((item) => item.address === target) : undefined;
  const localReports = target
    ? safety.activity.filter((item) => item.type === 'report' && item.detail.includes(target.slice(0, Math.min(12, target.length)))).length
    : 0;
  const score = record?.score ?? 0;
  const risk = record?.risk ?? riskFromScore(score);

  return {
    target,
    maskedTarget: maskedAddress(target),
    chainLabel: chainLabel(target),
    score,
    risk,
    summary: record?.summary ?? 'No recorded Reqrium address scan is available. Enter an address and run local checks.',
    checkedAt: record?.checkedAt,
    scanId: record?.id,
    evidence: record?.evidence ?? [],
    checks: buildChecks(target, record, localReports),
    scanHistory: matchingScans.slice(0, 10),
    contact,
    localReportDrafts: localReports,
    activity: stored.events.filter((item) => !target || item.detail.includes(maskedAddress(target)) || item.detail.includes(targetLabel(target))).slice(0, 20),
    hasRecordedScan: Boolean(record),
    remoteThreatIntelligenceConnected: false,
    transactionGraphConnected: false,
    sanctionsProviderConnected: false,
    communityReputationConnected: false,
    contractAnalysisConnected: false,
    provider: 'reqrium_local_heuristics',
    dataSource: 'reqrium_address_detail_adapter',
    persistence: 'in_memory_stub',
  };
}

async function scanAddress(addressInput: string) {
  const address = cleanAddress(addressInput);
  if (!address) throw new Error('Enter a wallet address before scanning.');
  const result = await nomadSafetyAdapter.scanAddress(address);
  const safety = await nomadSafetyAdapter.getReqriumSafetyState();
  const record = latestMatchingRecord(safety.scans, address);

  let stored = await loadStoredState();
  stored = addEvent({ ...stored, lastAddress: address }, {
    type: 'scan',
    title: 'Address safety scan recorded',
    detail: `${maskedAddress(address)} • ${(record?.risk ?? result.risk).toUpperCase()} • ${record?.score ?? result.score}/100 • local heuristics`,
    severity: (record?.risk ?? result.risk) === 'high' ? 'critical' : (record?.risk ?? result.risk) === 'medium' ? 'warning' : 'info',
  });
  await saveStoredState(stored);
  return buildState(address);
}

async function saveContact(addressInput: string, labelInput: string, noteInput = '') {
  const address = cleanAddress(addressInput);
  const label = labelInput.trim().slice(0, 50);
  const note = noteInput.trim().slice(0, 240);
  if (!address) throw new Error('Scan or enter an address before saving it.');
  if (label.length < 2) throw new Error('Enter a contact label with at least two characters.');

  const current = await buildState(address);
  if (!current.hasRecordedScan) throw new Error('Run a Reqrium address scan before saving this contact.');

  let stored = await loadStoredState();
  const existing = stored.contacts.find((item) => item.address === address);
  const timestamp = nowIso();
  const contact: ReqriumAddressContact = {
    address,
    label,
    note,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    safetyEndorsement: false,
  };
  stored = addEvent({
    ...stored,
    lastAddress: address,
    contacts: [contact, ...stored.contacts.filter((item) => item.address !== address)].slice(0, MAX_CONTACTS),
  }, {
    type: 'contact',
    title: existing ? 'Address contact updated' : 'Address contact saved',
    detail: `${maskedAddress(address)} • ${label} • local label only • not a safety endorsement`,
    severity: current.risk === 'high' ? 'critical' : current.risk === 'medium' ? 'warning' : 'info',
  });
  await saveStoredState(stored);
  return buildState(address);
}

async function removeContact(addressInput: string) {
  const address = cleanAddress(addressInput);
  if (!address) throw new Error('No address is selected.');
  let stored = await loadStoredState();
  stored = addEvent({
    ...stored,
    contacts: stored.contacts.filter((item) => item.address !== address),
  }, {
    type: 'contact',
    title: 'Address contact removed',
    detail: `${maskedAddress(address)} • local label removed`,
    severity: 'info',
  });
  await saveStoredState(stored);
  return buildState(address);
}

async function createReportDraft(addressInput: string, notesInput: string) {
  const address = cleanAddress(addressInput);
  const notes = notesInput.trim().slice(0, 1000);
  if (!address) throw new Error('Select an address before creating a report draft.');
  if (notes.length < 10) throw new Error('Add at least 10 characters describing the suspicious behavior.');

  const draft = await nomadSafetyAdapter.createReportDraft('scam_address', address, notes);
  let stored = await loadStoredState();
  stored = addEvent({ ...stored, lastAddress: address }, {
    type: 'report',
    title: 'Scam-address report draft saved',
    detail: `${maskedAddress(address)} • ${draft.id} • local draft only • not remotely submitted`,
    severity: 'warning',
  });
  await saveStoredState(stored);
  return { draft, state: await buildState(address) };
}

export const nomadAddressSafetyDetailAdapter: ReqriumAddressSafetyDetailAdapter = {
  getAddressDetail: buildState,
  scanAddress,
  saveContact,
  removeContact,
  createReportDraft,
};
