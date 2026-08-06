import { secureGetItem, secureSetItem } from '../../services/nativeStubs';

import {
  nomadRecoveryAdapter,
  type NomadExtendedRecoverySequenceState,
  type NomadExtendedRecoveryState,
} from './nomadRecoveryAdapter';

export type NomadLostWalletReason =
  | 'lost_device'
  | 'replaced_device'
  | 'locked_out'
  | 'security_incident'
  | 'recovery_test';

export type NomadLostWalletStatus =
  | 'setup_required'
  | 'ready'
  | 'verification_in_progress'
  | 'verification_locked'
  | 'verified_waiting_provider';

export type NomadLostWalletPrerequisite = {
  id: 'wallet_identity' | 'time_sets' | 'cryptography' | 'attempt_policy' | 'restoration_provider';
  label: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
  route?: string;
};

export type NomadLostWalletSession = {
  id: string;
  reason: NomadLostWalletReason;
  status: 'local_verification_session';
  createdAt: string;
  updatedAt: string;
  containsSecrets: false;
  remoteDeliveryConfirmed: false;
};

export type NomadLostWalletEvent = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
};

export type NomadLostWalletState = {
  status: NomadLostWalletStatus;
  recovery: NomadExtendedRecoveryState;
  sequence: NomadExtendedRecoverySequenceState;
  prerequisites: NomadLostWalletPrerequisite[];
  activeSession?: NomadLostWalletSession;
  activity: NomadLostWalletEvent[];
  canBeginVerification: boolean;
  canContinueVerification: boolean;
  enrolledTimeSets: number;
  totalTimeSets: number;
  attemptsRemaining: number;
  lockedUntil?: string;
  ownerAuthorityStatus: NomadExtendedRecoveryState['ownerAuthorityStatus'];
  recoveryProviderConnected: false;
  passwordProviderConnected: false;
  remoteRecoveryPackageAvailable: false;
  dataSource: 'nomad_lost_wallet_adapter';
  persistence: 'in_memory_stub';
};

export type NomadLostWalletAdapter = {
  getLostWalletState(): Promise<NomadLostWalletState>;
  beginRecovery(reason: NomadLostWalletReason): Promise<NomadLostWalletState>;
};

type StoredLostWalletState = {
  session?: NomadLostWalletSession;
  events: NomadLostWalletEvent[];
};

const STORAGE_KEY = 'nomad.recovery.lost-wallet';
const MAX_EVENTS = 30;

function nowIso() {
  return new Date().toISOString();
}

function identifier(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStoredState(): StoredLostWalletState {
  return { events: [] };
}

async function loadStoredState(): Promise<StoredLostWalletState> {
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return defaultStoredState();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredLostWalletState>;
    return {
      session: parsed.session,
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return defaultStoredState();
  }
}

async function saveStoredState(state: StoredLostWalletState) {
  await secureSetItem(STORAGE_KEY, JSON.stringify({
    ...state,
    events: state.events.slice(0, MAX_EVENTS),
  }));
}

function appendEvent(
  stored: StoredLostWalletState,
  event: Omit<NomadLostWalletEvent, 'id' | 'timestamp'>,
): StoredLostWalletState {
  return {
    ...stored,
    events: [{ id: identifier('lost-wallet-event'), timestamp: nowIso(), ...event }, ...stored.events].slice(0, MAX_EVENTS),
  };
}

function buildPrerequisites(
  recovery: NomadExtendedRecoveryState,
  sequence: NomadExtendedRecoverySequenceState,
): NomadLostWalletPrerequisite[] {
  const hasWalletIdentity = recovery.walletStatus !== 'no_wallet';
  const hasAllTimeSets = recovery.enrolledTimeSets === recovery.timeSetsTotal;
  const cryptographyAvailable = recovery.cryptographicEnrollment === 'available';
  const verificationLocked = Boolean(sequence.lockedUntil);

  return [
    {
      id: 'wallet_identity',
      label: 'Wallet identity',
      status: hasWalletIdentity ? 'pass' : 'fail',
      detail: hasWalletIdentity
        ? 'A wallet identity is present on this Nomad installation.'
        : 'No wallet identity is available on this installation. A synchronized recovery package is not connected.',
      route: hasWalletIdentity ? undefined : 'Lock',
    },
    {
      id: 'time_sets',
      label: '24 Time Sets',
      status: hasAllTimeSets ? 'pass' : recovery.enrolledTimeSets > 0 ? 'warning' : 'fail',
      detail: hasAllTimeSets
        ? 'All 24 salted Time Set digests are enrolled. Raw values are not displayed or stored by this intake screen.'
        : `${recovery.enrolledTimeSets}/${recovery.timeSetsTotal} Time Set digests are enrolled. Verification cannot begin until enrollment is complete.`,
      route: hasAllTimeSets ? undefined : 'RecoveryCenter',
    },
    {
      id: 'cryptography',
      label: 'Cryptographic verification',
      status: cryptographyAvailable ? 'pass' : 'fail',
      detail: cryptographyAvailable
        ? 'SHA-256 Time Set verification is available in this runtime.'
        : 'The current runtime cannot perform cryptographic Time Set verification.',
      route: cryptographyAvailable ? undefined : 'RecoveryCenter',
    },
    {
      id: 'attempt_policy',
      label: 'Verification attempt policy',
      status: verificationLocked ? 'fail' : sequence.attemptsRemaining < 3 ? 'warning' : 'pass',
      detail: verificationLocked
        ? `Verification is locked until ${new Date(sequence.lockedUntil as string).toLocaleString()}.`
        : `${sequence.attemptsRemaining} verification attempt${sequence.attemptsRemaining === 1 ? '' : 's'} remain before a temporary lock.`,
      route: verificationLocked ? 'RecoveryCenter' : undefined,
    },
    {
      id: 'restoration_provider',
      label: 'Wallet restoration provider',
      status: 'warning',
      detail: 'Time Sets can be verified locally, but no production provider is connected to restore keys or synchronize a lost-device recovery package.',
      route: 'RecoveryCenter',
    },
  ];
}

async function buildState(): Promise<NomadLostWalletState> {
  const [recovery, sequence, stored] = await Promise.all([
    nomadRecoveryAdapter.getExtendedRecoveryState(),
    nomadRecoveryAdapter.getExtendedRecoverySequenceState(),
    loadStoredState(),
  ]);

  const prerequisites = buildPrerequisites(recovery, sequence);
  const requiredChecksPass = prerequisites
    .filter((item) => item.id !== 'restoration_provider')
    .every((item) => item.status === 'pass');
  const verified = sequence.status === 'ready_to_recover' || sequence.verifiedSets >= sequence.totalSets;
  const verificationLocked = Boolean(sequence.lockedUntil);
  const verificationInProgress = sequence.status === 'verifying';

  const status: NomadLostWalletStatus = verified
    ? 'verified_waiting_provider'
    : verificationLocked
      ? 'verification_locked'
      : verificationInProgress
        ? 'verification_in_progress'
        : requiredChecksPass
          ? 'ready'
          : 'setup_required';

  return {
    status,
    recovery,
    sequence,
    prerequisites,
    activeSession: stored.session,
    activity: stored.events,
    canBeginVerification: status === 'ready',
    canContinueVerification: status === 'verification_in_progress',
    enrolledTimeSets: recovery.enrolledTimeSets,
    totalTimeSets: recovery.timeSetsTotal,
    attemptsRemaining: sequence.attemptsRemaining,
    lockedUntil: sequence.lockedUntil,
    ownerAuthorityStatus: recovery.ownerAuthorityStatus,
    recoveryProviderConnected: false,
    passwordProviderConnected: false,
    remoteRecoveryPackageAvailable: false,
    dataSource: 'nomad_lost_wallet_adapter',
    persistence: 'in_memory_stub',
  };
}

async function beginRecovery(reason: NomadLostWalletReason) {
  const allowed = new Set<NomadLostWalletReason>([
    'lost_device',
    'replaced_device',
    'locked_out',
    'security_incident',
    'recovery_test',
  ]);
  if (!allowed.has(reason)) throw new Error('Choose a valid wallet-recovery reason.');

  const before = await buildState();
  if (before.status === 'verification_locked') {
    throw new Error(before.lockedUntil
      ? `Recovery verification is locked until ${new Date(before.lockedUntil).toLocaleString()}.`
      : 'Recovery verification is temporarily locked.');
  }
  if (before.status === 'verified_waiting_provider') {
    throw new Error('All Time Sets are already verified. A production wallet-restoration provider is still required.');
  }
  if (before.status === 'setup_required') {
    const failed = before.prerequisites.find((item) => item.status === 'fail');
    throw new Error(failed?.detail ?? 'Recovery prerequisites are incomplete.');
  }

  let stored = await loadStoredState();
  const timestamp = nowIso();
  const session: NomadLostWalletSession = stored.session && before.status === 'verification_in_progress'
    ? { ...stored.session, reason, updatedAt: timestamp }
    : {
        id: identifier('lost-wallet-session'),
        reason,
        status: 'local_verification_session',
        createdAt: timestamp,
        updatedAt: timestamp,
        containsSecrets: false,
        remoteDeliveryConfirmed: false,
      };

  if (before.status !== 'verification_in_progress') {
    await nomadRecoveryAdapter.startRecoverySequence();
  }

  stored = appendEvent({ ...stored, session }, {
    title: before.status === 'verification_in_progress'
      ? 'Recovery verification session resumed'
      : 'Recovery verification session created',
    detail: `${reason.replace(/_/g, ' ')} • local metadata only • no password or Time Set values stored`,
    severity: 'warning',
  });
  await saveStoredState(stored);
  return buildState();
}

export const nomadLostWalletAdapter: NomadLostWalletAdapter = {
  getLostWalletState: buildState,
  beginRecovery,
};
