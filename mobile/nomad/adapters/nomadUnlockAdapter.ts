import { LockoutManager } from '../../../src/security/lockout';
import type { LockoutState } from '../../../src/security/lockout';
import { secureGetItem } from '../../services/nativeStubs';
import { hasWalletPassword } from '../../services/walletService';
import type { ClockTime } from '../../types';

import {
  nomadClockAccessAdapter,
  type NomadClockAccessResult,
  type NomadClockAccessState,
} from './nomadClockAccessAdapter';

export type NomadUnlockVerificationStatus =
  | 'no_wallet'
  | 'not_configured'
  | 'password_setup_required'
  | 'waiting'
  | 'ready'
  | 'temporarily_locked'
  | 'unlocked'
  | 'recovery_required';

export type NomadUnlockState = {
  status: NomadUnlockVerificationStatus;
  clock: NomadClockAccessState;
  passwordConfigured: boolean;
  recentFailures: number;
  remainingLockSeconds: number;
  attemptsRemaining: number;
  maximumFailuresBeforeRecovery: number;
  canVerify: boolean;
  verificationProvider: 'nomad_wallet_service';
  clockEvidence: 'device_local_clock';
  trustedTimeProviderConnected: false;
  persistence: 'in_memory_stub';
};

export type NomadUnlockAttempt = {
  result: NomadClockAccessResult;
  state: NomadUnlockState;
};

export type NomadUnlockAdapter = {
  getUnlockState(): Promise<NomadUnlockState>;
  verifyUnlock(time: ClockTime, password: string): Promise<NomadUnlockAttempt>;
};

type StoredLockoutState = {
  failedTimestamps?: number[];
  lockUntil?: number | null;
  permanentlyLocked?: boolean;
};

const LOCKOUT_STORAGE_KEY = 'nomad.wallet.lockout';
const MAXIMUM_FAILURES = 8;

async function getLockoutDiagnostics() {
  const raw = await secureGetItem(LOCKOUT_STORAGE_KEY);
  let parsed: StoredLockoutState | undefined;
  if (raw) {
    try {
      parsed = JSON.parse(raw) as StoredLockoutState;
    } catch {
      parsed = undefined;
    }
  }

  const stored: LockoutState | undefined = parsed && Array.isArray(parsed.failedTimestamps)
    ? {
        failedTimestamps: parsed.failedTimestamps.filter((value) => Number.isFinite(value)),
        lockUntil: typeof parsed.lockUntil === 'number' ? parsed.lockUntil : null,
        permanentlyLocked: Boolean(parsed.permanentlyLocked),
      }
    : undefined;

  const lockout = new LockoutManager(
    {
      delaysSeconds: [0, 5, 10, 30, 60, 120, 300],
      failureWindowSeconds: 3600,
      permanentLockAfterFailures: MAXIMUM_FAILURES,
    },
    stored,
  );
  return lockout.diagnostics();
}

function statusFrom(
  clock: NomadClockAccessState,
  passwordConfigured: boolean,
  diagnostics: Awaited<ReturnType<typeof getLockoutDiagnostics>>,
): NomadUnlockVerificationStatus {
  if (clock.status === 'no_wallet') return 'no_wallet';
  if (clock.status === 'recovery_required' || diagnostics.permanentlyLocked) return 'recovery_required';
  if (!passwordConfigured || clock.status === 'password_setup_required') return 'password_setup_required';
  if (clock.status === 'not_configured') return 'not_configured';
  if (clock.status === 'unlocked') return 'unlocked';
  if (diagnostics.remainingLockSeconds > 0) return 'temporarily_locked';
  if (clock.status === 'window_open') return 'ready';
  return 'waiting';
}

async function buildState(): Promise<NomadUnlockState> {
  const [clock, diagnostics, passwordConfigured] = await Promise.all([
    nomadClockAccessAdapter.getClockAccessState(),
    getLockoutDiagnostics(),
    hasWalletPassword(),
  ]);
  const status = statusFrom(clock, passwordConfigured, diagnostics);
  const attemptsRemaining = diagnostics.permanentlyLocked
    ? 0
    : Math.max(0, MAXIMUM_FAILURES - diagnostics.recentFailures);

  return {
    status,
    clock,
    passwordConfigured,
    recentFailures: diagnostics.recentFailures,
    remainingLockSeconds: Number.isFinite(diagnostics.remainingLockSeconds)
      ? Math.max(0, diagnostics.remainingLockSeconds)
      : 0,
    attemptsRemaining,
    maximumFailuresBeforeRecovery: MAXIMUM_FAILURES,
    canVerify: status === 'ready',
    verificationProvider: 'nomad_wallet_service',
    clockEvidence: 'device_local_clock',
    trustedTimeProviderConnected: false,
    persistence: 'in_memory_stub',
  };
}

async function verifyUnlock(time: ClockTime, password: string): Promise<NomadUnlockAttempt> {
  const before = await buildState();

  if (before.status === 'temporarily_locked') {
    return {
      result: {
        ok: false,
        reason: 'locked_out',
        remainingLockSeconds: before.remainingLockSeconds,
        permanentlyLocked: false,
      },
      state: before,
    };
  }

  if (before.status === 'recovery_required') {
    return {
      result: { ok: false, reason: 'locked_out', permanentlyLocked: true },
      state: before,
    };
  }

  if (before.status === 'waiting') {
    return {
      result: {
        ok: false,
        reason: 'outside_window',
        secondsUntilWindow: before.clock.countdownSeconds,
      },
      state: before,
    };
  }

  if (before.status === 'not_configured') {
    return {
      result: { ok: false, reason: 'not_configured' },
      state: before,
    };
  }

  if (before.status === 'password_setup_required') {
    return {
      result: { ok: false, reason: 'password_not_configured' },
      state: before,
    };
  }

  if (before.status === 'no_wallet') {
    return {
      result: { ok: false, reason: 'no_wallet' },
      state: before,
    };
  }

  if (before.status === 'unlocked') {
    return { result: { ok: true }, state: before };
  }

  const result = await nomadClockAccessAdapter.verifyAccess(time, password);
  return { result, state: await buildState() };
}

export const nomadUnlockAdapter: NomadUnlockAdapter = {
  getUnlockState: buildState,
  verifyUnlock,
};
