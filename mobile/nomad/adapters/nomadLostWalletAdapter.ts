import { secureGetItem, secureSetItem } from '../../services/nativeStubs';
import { hasWalletPassword, verifyWalletPassword } from '../../services/walletService';

import {
  nomadRecoveryAdapter,
  type NomadExtendedRecoverySequenceState,
  type NomadExtendedRecoveryState,
} from './nomadRecoveryAdapter';
import type { NomadRecoveryClockTime } from './walletAdapter';

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
  id: 'wallet_identity' | 'wallet_password' | 'time_sets' | 'cryptography' | 'attempt_policy' | 'restoration_provider';
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
  passwordVerifiedAt: string;
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
  sessionRequired: boolean;
  enrolledTimeSets: number;
  totalTimeSets: number;
  attemptsRemaining: number;
  lockedUntil?: string;
  lockoutRemainingSeconds: number;
  ownerAuthorityStatus: NomadExtendedRecoveryState['ownerAuthorityStatus'];
  recoveryProviderConnected: false;
  passwordProviderConnected: boolean;
  remoteRecoveryPackageAvailable: false;
  verificationProvider: 'nomad_recovery_adapter';
  digestAlgorithm: 'SHA-256';
  rawTimeSetsStored: false;
  dataSource: 'nomad_lost_wallet_adapter';
  persistence: 'in_memory_stub';
};

export type NomadLostWalletVerificationResult = {
  ok: boolean;
  message: string;
  state: NomadLostWalletState;
  attemptedSet: number;
};

export type NomadLostWalletAdapter = {
  getLostWalletState(): Promise<NomadLostWalletState>;
  enrollRecoverySequence(password: string, times: NomadRecoveryClockTime[]): Promise<NomadLostWalletState>;
  beginRecovery(reason: NomadLostWalletReason, password: string): Promise<NomadLostWalletState>;
  verifyRecoverySet(setNumber: number, time: NomadRecoveryClockTime): Promise<NomadLostWalletVerificationResult>;
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

function lockoutRemainingSeconds(lockedUntil?: string) {
  if (!lockedUntil) return 0;
  const timestamp = Date.parse(lockedUntil);
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
}

function buildPrerequisites(
  recovery: NomadExtendedRecoveryState,
  sequence: NomadExtendedRecoverySequenceState,
  passwordConfigured: boolean,
): NomadLostWalletPrerequisite[] {
  const hasWalletIdentity = recovery.walletStatus !== 'no_wallet';
  const hasAllTimeSets = recovery.enrolledTimeSets === recovery.timeSetsTotal;
  const cryptographyAvailable = recovery.cryptographicEnrollment === 'available';
  const verificationLocked = Boolean(sequence.lockedUntil && lockoutRemainingSeconds(sequence.lockedUntil) > 0);

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
      id: 'wallet_password',
      label: 'Wallet password',
      status: passwordConfigured ? 'pass' : 'fail',
      detail: passwordConfigured
        ? 'A salted password verifier is available. The raw password is never stored.'
        : 'No wallet password credential is configured. Recovery cannot begin.',
      route: passwordConfigured ? undefined : 'Lock',
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
  const [recovery, sequence, passwordConfigured, stored] = await Promise.all([
    nomadRecoveryAdapter.getExtendedRecoveryState(),
    nomadRecoveryAdapter.getExtendedRecoverySequenceState(),
    hasWalletPassword(),
    loadStoredState(),
  ]);

  const prerequisites = buildPrerequisites(recovery, sequence, passwordConfigured);
  const requiredChecksPass = prerequisites
    .filter((item) => item.id !== 'restoration_provider')
    .every((item) => item.status === 'pass');
  const verified = sequence.status === 'ready_to_recover' || sequence.verifiedSets >= sequence.totalSets;
  const remainingLockSeconds = lockoutRemainingSeconds(sequence.lockedUntil);
  const verificationLocked = remainingLockSeconds > 0;
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
    canContinueVerification: status === 'verification_in_progress' && Boolean(stored.session?.passwordVerifiedAt),
    sessionRequired: status === 'verification_in_progress' && !stored.session?.passwordVerifiedAt,
    enrolledTimeSets: recovery.enrolledTimeSets,
    totalTimeSets: recovery.timeSetsTotal,
    attemptsRemaining: sequence.attemptsRemaining,
    lockedUntil: verificationLocked ? sequence.lockedUntil : undefined,
    lockoutRemainingSeconds: remainingLockSeconds,
    ownerAuthorityStatus: recovery.ownerAuthorityStatus,
    recoveryProviderConnected: false,
    passwordProviderConnected: passwordConfigured,
    remoteRecoveryPackageAvailable: false,
    verificationProvider: 'nomad_recovery_adapter',
    digestAlgorithm: 'SHA-256',
    rawTimeSetsStored: false,
    dataSource: 'nomad_lost_wallet_adapter',
    persistence: 'in_memory_stub',
  };
}

async function beginRecovery(reason: NomadLostWalletReason, password: string) {
  const allowed = new Set<NomadLostWalletReason>([
    'lost_device',
    'replaced_device',
    'locked_out',
    'security_incident',
    'recovery_test',
  ]);
  if (!allowed.has(reason)) throw new Error('Choose a valid wallet-recovery reason.');
  if (!password) throw new Error('Enter the wallet password to begin recovery.');

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

  const passwordVerified = await verifyWalletPassword(password);
  if (!passwordVerified) {
    let failedState = await loadStoredState();
    failedState = appendEvent(failedState, {
      title: 'Recovery password rejected',
      detail: 'Password verification failed. No Time Set verification session was opened and no password was stored.',
      severity: 'warning',
    });
    await saveStoredState(failedState);
    throw new Error('The wallet password is incorrect. Recovery was not started.');
  }

  let stored = await loadStoredState();
  const timestamp = nowIso();
  const session: NomadLostWalletSession = stored.session && before.status === 'verification_in_progress'
    ? { ...stored.session, reason, updatedAt: timestamp, passwordVerifiedAt: timestamp }
    : {
        id: identifier('lost-wallet-session'),
        reason,
        status: 'local_verification_session',
        createdAt: timestamp,
        updatedAt: timestamp,
        passwordVerifiedAt: timestamp,
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
    detail: `${reason.replace(/_/g, ' ')} • password verified locally • no password or Time Set values stored`,
    severity: 'warning',
  });
  await saveStoredState(stored);
  return buildState();
}

async function enrollRecoverySequence(password: string, times: NomadRecoveryClockTime[]) {
  if (!password) throw new Error('Enter the wallet password before enrolling Time Sets.');
  const before = await buildState();
  const failed = before.prerequisites.find((item) =>
    (item.id === 'wallet_identity' || item.id === 'wallet_password' || item.id === 'cryptography')
    && item.status === 'fail'
  );
  if (failed) throw new Error(failed.detail);

  if (!(await verifyWalletPassword(password))) {
    throw new Error('The wallet password is incorrect. Time Sets were not enrolled.');
  }

  await nomadRecoveryAdapter.enrollRecoverySequence(times);
  let stored = await loadStoredState();
  stored = appendEvent({ ...stored, session: undefined }, {
    title: 'Recovery Time Sets enrolled',
    detail: '24 unique HH:MM:SS values were converted to salted digests in exact order. Raw values and the password were not retained.',
    severity: 'info',
  });
  await saveStoredState(stored);
  return buildState();
}

async function verifyRecoverySet(
  setNumber: number,
  time: NomadRecoveryClockTime,
): Promise<NomadLostWalletVerificationResult> {
  const before = await buildState();
  const attemptedSet = Number(setNumber);

  if (!before.activeSession?.passwordVerifiedAt) {
    return {
      ok: false,
      message: 'Verify the wallet password on Recover Lost Wallet before entering Time Sets.',
      state: before,
      attemptedSet,
    };
  }
  if (before.status === 'verification_locked') {
    return {
      ok: false,
      message: before.lockedUntil
        ? `Recovery verification is locked until ${new Date(before.lockedUntil).toLocaleString()}.`
        : 'Recovery verification is temporarily locked.',
      state: before,
      attemptedSet,
    };
  }
  if (before.status === 'verified_waiting_provider') {
    return {
      ok: false,
      message: 'All 24 Time Sets are already verified. A production wallet-restoration provider is still required.',
      state: before,
      attemptedSet,
    };
  }
  if (before.status !== 'verification_in_progress') {
    return {
      ok: false,
      message: 'Recovery verification is not active. Return to Recover Lost Wallet and start a protected session.',
      state: before,
      attemptedSet,
    };
  }
  if (!Number.isInteger(attemptedSet) || attemptedSet !== before.sequence.currentSet) {
    return {
      ok: false,
      message: `Verify Time Set ${before.sequence.currentSet} next.`,
      state: before,
      attemptedSet,
    };
  }

  try {
    await nomadRecoveryAdapter.verifyRecoverySet(attemptedSet, time);
    let stored = await loadStoredState();
    const timestamp = nowIso();
    if (stored.session) stored = { ...stored, session: { ...stored.session, updatedAt: timestamp } };
    const after = await buildState();
    stored = appendEvent(stored, {
      title: after.status === 'verified_waiting_provider'
        ? 'Recovery sequence verified'
        : `Time Set ${attemptedSet} verified`,
      detail: after.status === 'verified_waiting_provider'
        ? 'All 24 salted digests matched. No wallet keys were restored because the production restoration provider is not connected.'
        : `Proceed to Time Set ${after.sequence.currentSet}. Raw values were not retained by the lost-wallet session.`,
      severity: after.status === 'verified_waiting_provider' ? 'warning' : 'info',
    });
    await saveStoredState(stored);
    return {
      ok: true,
      message: after.status === 'verified_waiting_provider'
        ? 'All 24 Time Sets matched. Verification is complete; wallet restoration remains unavailable until a production provider is connected.'
        : `Time Set ${attemptedSet} verified. Continue with Time Set ${after.sequence.currentSet}.`,
      state: await buildState(),
      attemptedSet,
    };
  } catch (error) {
    let stored = await loadStoredState();
    const afterFailure = await buildState();
    const timestamp = nowIso();
    if (stored.session) stored = { ...stored, session: { ...stored.session, updatedAt: timestamp } };
    const message = error instanceof Error ? error.message : 'The Time Set did not match the enrolled digest.';
    stored = appendEvent(stored, {
      title: afterFailure.status === 'verification_locked'
        ? 'Recovery verification locked'
        : `Time Set ${attemptedSet} rejected`,
      detail: `${message} • ${afterFailure.attemptsRemaining} attempt${afterFailure.attemptsRemaining === 1 ? '' : 's'} remaining`,
      severity: afterFailure.status === 'verification_locked' ? 'critical' : 'warning',
    });
    await saveStoredState(stored);
    return {
      ok: false,
      message,
      state: await buildState(),
      attemptedSet,
    };
  }
}

export const nomadLostWalletAdapter: NomadLostWalletAdapter = {
  getLostWalletState: buildState,
  enrollRecoverySequence,
  beginRecovery,
  verifyRecoverySet,
};
