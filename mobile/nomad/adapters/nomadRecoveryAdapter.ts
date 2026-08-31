import {
  getDailyUnlockTime,
  getWalletMeta,
  getWalletStatus,
} from '../../services/walletService';
import {
  getRandomBytes,
  getSecureStorageMode,
  secureGetItem,
  secureSetItem,
  sha256Hex,
  type NomadPersistenceEvidence,
} from '../../services/nativeStubs';

import type {
  NomadOwnerAuthorityRequest,
  NomadRecoveryAdapter,
  NomadRecoveryAuthorization,
  NomadRecoveryClockTime,
  NomadRecoverySequenceState,
  NomadRecoveryState,
} from './walletAdapter';

export type NomadRecoveryMethodStatus = 'ready' | 'warning' | 'not_configured' | 'unavailable';

export type NomadRecoveryMethodResult = {
  id: 'time_sets' | 'daily_clock' | 'owner_authority' | 'encrypted_backup';
  title: string;
  subtitle: string;
  status: NomadRecoveryMethodStatus;
  detail: string;
  route: string;
};

export type NomadRecoverySigner = {
  id: string;
  name: string;
  role: string;
  status: 'verified' | 'pending' | 'not_configured';
  source: 'wallet_owner' | 'owner_authority';
};

export type NomadRecoveryEvent = {
  id: string;
  type: 'check' | 'enrollment' | 'verification' | 'authority' | 'export';
  title: string;
  detail: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
};

export type NomadRecoveryCheck = {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
};

export type NomadExtendedRecoveryState = NomadRecoveryState & {
  methods: NomadRecoveryMethodResult[];
  signers: NomadRecoverySigner[];
  events: NomadRecoveryEvent[];
  checks: NomadRecoveryCheck[];
  enrolledTimeSets: number;
  ownerAuthorityStatus: NomadOwnerAuthorityRequest['status'];
  exportAvailable: boolean;
  dataSource: 'nomad_recovery_adapter';
  persistence: NomadPersistenceEvidence;
  cryptographicEnrollment: 'available' | 'unavailable';
};

export type NomadExtendedRecoverySequenceState = NomadRecoverySequenceState & {
  attemptsRemaining: number;
  lockedUntil?: string;
  enrollmentAvailable: boolean;
  recoveryProviderConnected: boolean;
  authorization?: NomadRecoveryAuthorization;
};

export type NomadRecoveryExport = {
  generatedAt: string;
  format: 'nomad-recovery-summary-v1';
  containsSecrets: false;
  walletStatus: NomadRecoveryState['walletStatus'];
  recoveryStatus: NomadRecoveryState['recoveryStatus'];
  setupDate: string;
  enrolledTimeSets: number;
  timeSetsTotal: number;
  ownerAuthorityStatus: NomadOwnerAuthorityRequest['status'];
  signerCount: number;
  recoveryScore: number;
  lastCheckedAt?: string;
  nextRecommendedCheck?: string;
  persistence: NomadPersistenceEvidence;
  warning: string;
};

export type NomadExtendedRecoveryAdapter = NomadRecoveryAdapter & {
  getExtendedRecoveryState(): Promise<NomadExtendedRecoveryState>;
  getExtendedRecoverySequenceState(): Promise<NomadExtendedRecoverySequenceState>;
  enrollRecoverySequence(times: NomadRecoveryClockTime[]): Promise<NomadExtendedRecoveryState>;
  clearRecoveryEnrollment(): Promise<NomadExtendedRecoveryState>;
  exportRecoverySummary(): Promise<string>;
};

type StoredRecoveryState = {
  setupAt?: string;
  lastCheckedAt?: string;
  nextCheckAt?: string;
  digestSalt?: string;
  timeSetDigests: string[];
  ownerAuthority: NomadOwnerAuthorityRequest;
  sequence: NomadRecoverySequenceState;
  failedVerificationAttempts: number;
  lockedUntil?: string;
  authorization?: NomadRecoveryAuthorization;
  events: NomadRecoveryEvent[];
};

const STORAGE_KEY = 'nomad.recovery.extended';
const TIME_SET_TOTAL = 24;
const MAX_EVENTS = 40;
const MAX_FAILED_ATTEMPTS = 8;
const VERIFICATION_LOCK_MS = 15 * 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

function identifier(prefix: string) {
  return `${prefix}-${Date.now()}-${Array.from(getRandomBytes(6)).map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function defaultSequence(): NomadRecoverySequenceState {
  return {
    step: 1,
    enteredSets: 0,
    verifiedSets: 0,
    totalSets: TIME_SET_TOTAL,
    strengthScore: 0,
    currentSet: 1,
    sampleTime: { hour: 0, minute: 0, second: 0 },
    status: 'entry',
  };
}

function defaultStoredState(): StoredRecoveryState {
  return {
    timeSetDigests: [],
    ownerAuthority: { status: 'none' },
    sequence: defaultSequence(),
    failedVerificationAttempts: 0,
    events: [],
  };
}

async function loadStoredState(): Promise<StoredRecoveryState> {
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return defaultStoredState();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredRecoveryState>;
    return {
      ...defaultStoredState(),
      ...parsed,
      timeSetDigests: Array.isArray(parsed.timeSetDigests) ? parsed.timeSetDigests : [],
      ownerAuthority: parsed.ownerAuthority ?? { status: 'none' },
      sequence: parsed.sequence ?? defaultSequence(),
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return defaultStoredState();
  }
}

async function saveStoredState(state: StoredRecoveryState) {
  await secureSetItem(STORAGE_KEY, JSON.stringify({
    ...state,
    events: state.events.slice(0, MAX_EVENTS),
  }));
}

function appendEvent(state: StoredRecoveryState, event: Omit<NomadRecoveryEvent, 'id' | 'timestamp'>): StoredRecoveryState {
  return {
    ...state,
    events: [{ id: identifier('recovery'), timestamp: nowIso(), ...event }, ...state.events].slice(0, MAX_EVENTS),
  };
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes).map((value) => value.toString(16).padStart(2, '0')).join('');
}

function normalizeTime(time: NomadRecoveryClockTime) {
  const hour = Number(time.hour);
  const minute = Number(time.minute);
  const second = Number(time.second);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error('Recovery hour must be between 00 and 23.');
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error('Recovery minute must be between 00 and 59.');
  if (!Number.isInteger(second) || second < 0 || second > 59) throw new Error('Recovery second must be between 00 and 59.');
  return { hour, minute, second };
}

function canonicalTime(time: NomadRecoveryClockTime) {
  const normalized = normalizeTime(time);
  return `${String(normalized.hour).padStart(2, '0')}:${String(normalized.minute).padStart(2, '0')}:${String(normalized.second).padStart(2, '0')}`;
}

async function digestTime(time: NomadRecoveryClockTime, saltHex: string, setNumber: number) {
  const payload = `${saltHex}:${setNumber}:${canonicalTime(time)}`;
  return sha256Hex(payload);
}

function generateSalt() {
  return bytesToHex(getRandomBytes(24));
}

function formatDate(value?: string, fallback = 'Not configured') {
  if (!value) return fallback;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return fallback;
  return new Date(parsed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function relativeCheckLabel(value?: string) {
  if (!value) return 'Never checked';
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Never checked';
  const minutes = Math.max(0, Math.round((Date.now() - parsed) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function nextCheckDate(value?: string) {
  return formatDate(value, 'Run a recovery check');
}

function timeRemaining(unlockTime: NomadRecoveryClockTime | null) {
  if (!unlockTime) return 'Clock not configured';
  const now = new Date();
  const next = new Date(now);
  next.setHours(unlockTime.hour, unlockTime.minute, unlockTime.second, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  const seconds = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function buildChecks(params: {
  hasWallet: boolean;
  unlockConfigured: boolean;
  enrolledSets: number;
  authority: NomadOwnerAuthorityRequest;
}): NomadRecoveryCheck[] {
  const authorityRecorded = params.authority.status === 'pending' || params.authority.status === 'approved';
  const persistence = getSecureStorageMode();
  return [
    {
      id: 'wallet',
      label: 'Wallet identity',
      status: params.hasWallet ? 'pass' : 'fail',
      detail: params.hasWallet ? 'A wallet identity is available.' : 'Create or restore a wallet before configuring recovery.',
    },
    {
      id: 'clock',
      label: 'Daily Time Clock',
      status: params.unlockConfigured ? 'pass' : 'warning',
      detail: params.unlockConfigured ? 'A daily unlock time is configured.' : 'No daily unlock time is configured.',
    },
    {
      id: 'sets',
      label: '24 Time Sets',
      status: params.enrolledSets === TIME_SET_TOTAL ? 'pass' : params.enrolledSets > 0 ? 'warning' : 'fail',
      detail: `${params.enrolledSets}/${TIME_SET_TOTAL} salted Time Set digests are enrolled.`,
    },
    {
      id: 'authority',
      label: 'Owner Authority',
      status: authorityRecorded ? 'warning' : 'fail',
      detail: params.authority.status === 'approved'
        ? 'An approved flag is recorded, but no signed authority receipt or verified signature is available.'
        : params.authority.status === 'pending'
          ? 'A local Owner Authority request is pending. Delivery, identity and signed consent remain unverified.'
          : 'No verified Owner Authority enrollment is recorded.',
    },
    {
      id: 'storage',
      label: 'Encrypted persistence',
      status: persistence === 'encrypted_device_store' ? 'pass' : persistence === 'browser_local_storage' ? 'warning' : 'fail',
      detail: persistence === 'encrypted_device_store'
        ? 'Nomad recovery evidence is stored in device-encrypted storage.'
        : persistence === 'browser_local_storage'
          ? 'Web preview persistence is available, but browser local storage is not a production credential vault.'
          : 'Persistent storage is unavailable; this session is using a volatile memory fallback.',
    },
  ];
}

function scoreChecks(checks: NomadRecoveryCheck[]) {
  const points = checks.reduce((sum, check) => sum + (check.status === 'pass' ? 20 : check.status === 'warning' ? 10 : 0), 0);
  return Math.max(0, Math.min(100, points));
}

async function buildExtendedState(): Promise<NomadExtendedRecoveryState> {
  const [stored, walletStatus, walletMeta, dailyUnlockTime] = await Promise.all([
    loadStoredState(),
    getWalletStatus(),
    getWalletMeta(),
    getDailyUnlockTime(),
  ]);
  const hasWallet = Boolean(walletMeta);
  const enrolledTimeSets = Math.min(TIME_SET_TOTAL, stored.timeSetDigests.length);
  const checks = buildChecks({
    hasWallet,
    unlockConfigured: Boolean(dailyUnlockTime),
    enrolledSets: enrolledTimeSets,
    authority: stored.ownerAuthority,
  });
  const score = scoreChecks(checks);
  const sequenceReady = enrolledTimeSets === TIME_SET_TOTAL;
  const recoveryStatus: NomadRecoveryState['recoveryStatus'] = !hasWallet
    ? 'not_started'
    : walletStatus === 'recovery'
      ? 'recovery_required'
      : sequenceReady
        ? 'protected'
        : walletStatus === 'locked'
          ? 'locked'
          : 'not_started';
  const setupAt = stored.setupAt ?? walletMeta?.createdAt;
  const signers: NomadRecoverySigner[] = [
    {
      id: 'wallet-owner',
      name: 'Wallet Owner',
      role: 'Primary owner-controlled signer',
      status: hasWallet ? 'verified' : 'not_configured',
      source: 'wallet_owner',
    },
  ];
  if (stored.ownerAuthority.status !== 'none' && stored.ownerAuthority.status !== 'cancelled') {
    signers.push({
      id: 'owner-authority',
      name: stored.ownerAuthority.requestedBy || 'Owner Authority',
      role: stored.ownerAuthority.status === 'approved'
        ? 'Approval flag present; signed receipt unverified'
        : 'Approval request pending',
      status: 'pending',
      source: 'owner_authority',
    });
  }

  const methods: NomadRecoveryMethodResult[] = [
    {
      id: 'time_sets',
      title: '24 Time Sets',
      subtitle: 'Salted time-sequence verification',
      status: sequenceReady ? 'ready' : enrolledTimeSets > 0 ? 'warning' : 'not_configured',
      detail: sequenceReady ? 'All 24 Time Set digests are enrolled.' : `${enrolledTimeSets}/${TIME_SET_TOTAL} Time Sets are enrolled.`,
      route: 'RecoverLostWallet',
    },
    {
      id: 'daily_clock',
      title: 'Daily Time Clock',
      subtitle: 'Owner-controlled wallet access window',
      status: dailyUnlockTime ? 'ready' : 'not_configured',
      detail: dailyUnlockTime ? 'A daily wallet access time is configured.' : 'Configure a daily wallet access time.',
      route: 'TimeClockAccess',
    },
    {
      id: 'owner_authority',
      title: 'Owner Authority',
      subtitle: 'Independent approval and recovery support',
      status: stored.ownerAuthority.status === 'pending' || stored.ownerAuthority.status === 'approved' ? 'warning' : 'not_configured',
      detail: stored.ownerAuthority.status === 'approved'
        ? 'An approved flag exists, but a verified signed enrollment receipt is unavailable.'
        : stored.ownerAuthority.status === 'pending'
          ? 'A local request is pending; delivery and signed consent remain unverified.'
          : 'No Owner Authority is configured.',
      route: stored.ownerAuthority.status === 'pending' || stored.ownerAuthority.status === 'approved'
        ? 'OwnerAuthorityApproval'
        : 'CreateOwnerAuthority',
    },
    {
      id: 'encrypted_backup',
      title: 'Encrypted Backup',
      subtitle: 'Portable recovery material',
      status: 'unavailable',
      detail: 'A production encrypted backup provider is not connected. No seed or Time Set secret is exported by this adapter.',
      route: 'Settings',
    },
  ];

  return {
    walletStatus,
    dailyUnlockTime: dailyUnlockTime ? { ...dailyUnlockTime } : null,
    recoveryStatus,
    recoverySetupDate: formatDate(setupAt),
    verificationStatus: sequenceReady ? '24 Time Sets enrolled' : `${enrolledTimeSets}/${TIME_SET_TOTAL} Time Sets enrolled`,
    lastCheckLabel: relativeCheckLabel(stored.lastCheckedAt),
    timeSetsComplete: enrolledTimeSets,
    timeSetsTotal: TIME_SET_TOTAL,
    recoveryScore: score,
    signerQuorum: 1,
    signerTotal: signers.length,
    nextRecommendedCheck: nextCheckDate(stored.nextCheckAt),
    timeRemainingLabel: timeRemaining(dailyUnlockTime),
    cycleLabel: dailyUnlockTime
      ? `${String(dailyUnlockTime.hour).padStart(2, '0')}:${String(dailyUnlockTime.minute).padStart(2, '0')}:${String(dailyUnlockTime.second).padStart(2, '0')} Daily Time`
      : 'Daily Time not configured',
    cycleStartedLabel: formatDate(setupAt, 'Awaiting recovery setup'),
    purpose: walletStatus === 'recovery' ? 'Recovery Required' : 'Wallet Access',
    methods,
    signers,
    events: stored.events,
    checks,
    enrolledTimeSets,
    ownerAuthorityStatus: stored.ownerAuthority.status,
    exportAvailable: hasWallet,
    dataSource: 'nomad_recovery_adapter',
    persistence: getSecureStorageMode(),
    cryptographicEnrollment: 'available',
  };
}

async function buildSequenceState(): Promise<NomadExtendedRecoverySequenceState> {
  const stored = await loadStoredState();
  const lockedUntil = stored.lockedUntil && Date.parse(stored.lockedUntil) > Date.now() ? stored.lockedUntil : undefined;
  const authorization = stored.authorization && Date.parse(stored.authorization.expiresAt) > Date.now()
    ? stored.authorization
    : undefined;
  return {
    ...stored.sequence,
    attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - stored.failedVerificationAttempts),
    lockedUntil,
    enrollmentAvailable: true,
    recoveryProviderConnected: false,
    authorization,
  };
}

async function runRecoveryCheck() {
  let stored = await loadStoredState();
  const checkedAt = nowIso();
  stored = appendEvent({
    ...stored,
    lastCheckedAt: checkedAt,
    nextCheckAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }, {
    type: 'check',
    title: 'Recovery readiness checked',
    detail: 'Wallet, Time Set, Owner Authority, clock and persistence checks were recalculated.',
    severity: 'info',
  });
  await saveStoredState(stored);
  return buildExtendedState();
}

async function requestOwnerAuthorityApproval(reason: string) {
  const cleanReason = reason.trim().slice(0, 300);
  if (cleanReason.length < 8) throw new Error('Provide a clear reason for the Owner Authority request.');
  let stored = await loadStoredState();
  if (stored.ownerAuthority.status === 'pending') return stored.ownerAuthority;
  const request: NomadOwnerAuthorityRequest = {
    status: 'pending',
    requestedAt: nowIso(),
    reason: cleanReason,
    requestedBy: 'Wallet Owner',
    device: 'Current Nomad device',
  };
  stored = appendEvent({ ...stored, ownerAuthority: request }, {
    type: 'authority',
    title: 'Owner Authority request created',
    detail: 'The request is local and pending. A remote delivery provider is not connected.',
    severity: 'warning',
  });
  await saveStoredState(stored);
  return request;
}

async function cancelOwnerAuthorityRequest() {
  let stored = await loadStoredState();
  if (stored.ownerAuthority.status !== 'pending') return stored.ownerAuthority;
  const request: NomadOwnerAuthorityRequest = { ...stored.ownerAuthority, status: 'cancelled' };
  stored = appendEvent({ ...stored, ownerAuthority: request }, {
    type: 'authority',
    title: 'Owner Authority request cancelled',
    detail: 'The local pending request was cancelled.',
    severity: 'info',
  });
  await saveStoredState(stored);
  return request;
}

async function enrollRecoverySequence(times: NomadRecoveryClockTime[]) {
  if (times.length !== TIME_SET_TOTAL) throw new Error(`Exactly ${TIME_SET_TOTAL} Time Sets are required.`);
  const canonical = times.map(canonicalTime);
  if (new Set(canonical).size !== TIME_SET_TOTAL) throw new Error('Each Time Set must be unique.');
  const salt = generateSalt();
  const digests: string[] = [];
  for (let index = 0; index < times.length; index += 1) {
    digests.push(await digestTime(times[index], salt, index + 1));
  }
  let stored = await loadStoredState();
  stored = appendEvent({
    ...stored,
    setupAt: stored.setupAt ?? nowIso(),
    digestSalt: salt,
    timeSetDigests: digests,
    failedVerificationAttempts: 0,
    lockedUntil: undefined,
    sequence: defaultSequence(),
    authorization: undefined,
  }, {
    type: 'enrollment',
    title: '24 Time Sets enrolled',
    detail: 'Salted SHA-256 digests were stored. Raw Time Set values were not retained.',
    severity: 'info',
  });
  await saveStoredState(stored);
  return buildExtendedState();
}

async function clearRecoveryEnrollment() {
  let stored = await loadStoredState();
  stored = appendEvent({
    ...stored,
    digestSalt: undefined,
    timeSetDigests: [],
    failedVerificationAttempts: 0,
    lockedUntil: undefined,
    sequence: defaultSequence(),
    authorization: undefined,
  }, {
    type: 'enrollment',
    title: 'Time Set enrollment cleared',
    detail: 'Stored Time Set digests were removed from the current recovery adapter.',
    severity: 'critical',
  });
  await saveStoredState(stored);
  return buildExtendedState();
}

async function startRecoverySequence() {
  let stored = await loadStoredState();
  if (stored.timeSetDigests.length !== TIME_SET_TOTAL || !stored.digestSalt) {
    throw new Error('A complete 24 Time Set enrollment is required before verification can begin.');
  }
  if (stored.lockedUntil && Date.parse(stored.lockedUntil) > Date.now()) {
    throw new Error(`Recovery verification is locked until ${new Date(stored.lockedUntil).toLocaleString()}.`);
  }
  stored = {
    ...stored,
    authorization: undefined,
    sequence: {
      ...defaultSequence(),
      step: 2,
      status: 'verifying',
    },
  };
  await saveStoredState(stored);
  return buildSequenceState();
}

async function verifyRecoverySet(setNumber: number, time: NomadRecoveryClockTime) {
  let stored = await loadStoredState();
  if (stored.lockedUntil && Date.parse(stored.lockedUntil) > Date.now()) {
    throw new Error(`Recovery verification is locked until ${new Date(stored.lockedUntil).toLocaleString()}.`);
  }
  if (stored.timeSetDigests.length !== TIME_SET_TOTAL || !stored.digestSalt) {
    throw new Error('No complete Time Set enrollment is available.');
  }
  if (stored.sequence.status !== 'verifying') throw new Error('Start the recovery verification sequence first.');
  if (!Number.isInteger(setNumber) || setNumber !== stored.sequence.currentSet) {
    throw new Error(`Verify Time Set ${stored.sequence.currentSet} next.`);
  }
  const digest = await digestTime(time, stored.digestSalt, setNumber);
  if (digest !== stored.timeSetDigests[setNumber - 1]) {
    const failures = stored.failedVerificationAttempts + 1;
    const lockedUntil = failures >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + VERIFICATION_LOCK_MS).toISOString()
      : undefined;
    stored = appendEvent({
      ...stored,
      failedVerificationAttempts: failures,
      lockedUntil,
    }, {
      type: 'verification',
      title: 'Time Set verification failed',
      detail: lockedUntil ? 'Maximum failed attempts reached. Verification is temporarily locked.' : `Incorrect Time Set ${setNumber}.`,
      severity: lockedUntil ? 'critical' : 'warning',
    });
    await saveStoredState(stored);
    throw new Error(lockedUntil ? 'Too many failed attempts. Recovery verification is temporarily locked.' : 'The Time Set did not match the enrolled digest.');
  }

  const verifiedSets = setNumber;
  const ready = verifiedSets === TIME_SET_TOTAL;
  stored = appendEvent({
    ...stored,
    failedVerificationAttempts: 0,
    lockedUntil: undefined,
    sequence: {
      ...stored.sequence,
      step: ready ? 3 : 2,
      enteredSets: verifiedSets,
      verifiedSets,
      currentSet: ready ? TIME_SET_TOTAL : setNumber + 1,
      strengthScore: Math.round((verifiedSets / TIME_SET_TOTAL) * 100),
      sampleTime: normalizeTime(time),
      status: ready ? 'ready_to_recover' : 'verifying',
    },
  }, {
    type: 'verification',
    title: `Time Set ${setNumber} verified`,
    detail: ready ? 'All Time Sets matched. A connected recovery provider is still required to restore wallet keys.' : `Proceed to Time Set ${setNumber + 1}.`,
    severity: 'info',
  });
  await saveStoredState(stored);
  return buildSequenceState();
}

async function completeRecoverySequence(recoverySessionId?: string): Promise<NomadRecoverySequenceState> {
  let stored = await loadStoredState();
  if (!recoverySessionId) throw new Error('A protected recovery session is required before Nomad can issue authorization.');
  if (stored.sequence.status !== 'ready_to_recover' || stored.sequence.verifiedSets !== TIME_SET_TOTAL) {
    throw new Error('All 24 Time Sets must be verified before recovery authorization.');
  }
  const issuedAt = nowIso();
  const authorization: NomadRecoveryAuthorization = {
    id: identifier('nomad-recovery-authorization'),
    issuedAt,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    recoverySessionId,
    walletBinding: 'active_wallet_provider_session',
    verifiedSets: 24,
    method: 'ordered_time_sets',
    source: 'nomad_recovery_adapter_v1',
    containsSecrets: false,
    walletKeysChanged: false,
    requiresExplicitOwnerConfirmation: true,
    status: 'ready_for_wallet_provider',
  };
  stored = appendEvent({
    ...stored,
    authorization,
    sequence: {
      ...stored.sequence,
      step: 4,
      status: 'complete',
      authorizedAt: issuedAt,
    },
  }, {
    type: 'verification',
    title: 'Nomad recovery authorization issued',
    detail: 'The ordered Time Set checks completed. The metadata-only authorization contains no secrets and did not restore or change wallet keys.',
    severity: 'info',
  });
  await saveStoredState(stored);
  return stored.sequence;
}

async function getRecoveryAuthorization() {
  const authorization = (await loadStoredState()).authorization;
  if (!authorization || Date.parse(authorization.expiresAt) <= Date.now()) return null;
  return authorization;
}

async function exportRecoverySummary() {
  let stored = await loadStoredState();
  const state = await buildExtendedState();
  const summary: NomadRecoveryExport = {
    generatedAt: nowIso(),
    format: 'nomad-recovery-summary-v1',
    containsSecrets: false,
    walletStatus: state.walletStatus,
    recoveryStatus: state.recoveryStatus,
    setupDate: state.recoverySetupDate,
    enrolledTimeSets: state.enrolledTimeSets,
    timeSetsTotal: state.timeSetsTotal,
    ownerAuthorityStatus: state.ownerAuthorityStatus,
    signerCount: state.signers.filter((signer) => signer.status === 'verified').length,
    recoveryScore: state.recoveryScore,
    lastCheckedAt: stored.lastCheckedAt,
    nextRecommendedCheck: stored.nextCheckAt,
    persistence: getSecureStorageMode(),
    warning: 'This summary contains metadata only. It does not contain a seed phrase, private keys, raw Time Sets or authority secrets.',
  };
  stored = appendEvent(stored, {
    type: 'export',
    title: 'Recovery summary exported',
    detail: 'A metadata-only recovery summary was generated. No recovery secrets were included.',
    severity: 'info',
  });
  await saveStoredState(stored);
  return JSON.stringify(summary, null, 2);
}

export const nomadRecoveryAdapter: NomadExtendedRecoveryAdapter = {
  getRecoveryState: () => buildExtendedState(),
  getExtendedRecoveryState: buildExtendedState,
  runRecoveryCheck,
  async getOwnerAuthorityRequest() {
    return (await loadStoredState()).ownerAuthority;
  },
  requestOwnerAuthorityApproval,
  cancelOwnerAuthorityRequest,
  getRecoverySequenceState: () => buildSequenceState(),
  getExtendedRecoverySequenceState: buildSequenceState,
  startRecoverySequence,
  verifyRecoverySet,
  completeRecoverySequence,
  getRecoveryAuthorization,
  enrollRecoverySequence,
  clearRecoveryEnrollment,
  exportRecoverySummary,
};
