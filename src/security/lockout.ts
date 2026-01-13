/**
 * security/lockout.ts
 *
 * Lockout and throttling manager (pure logic).
 *
 * Responsibilities:
 * - Track failed unlock attempts (counts and timestamps)
 * - Apply progressive delays between attempts (configurable schedule)
 * - Support permanent lock state until recovery flow
 * - Provide serializable state so caller can persist it securely
 *
 * Security notes:
 * - This module does not store secrets or keys; it only manages counters
 *   and timestamps. The caller must persist the serialized state if needed.
 * - Delays are deterministic and derived from the number of recent failures.
 * - No network or UI code here. All functions are pure/side-effect-free
 *   except for reading the current time when evaluating lock windows.
 */

export interface LockoutConfig {
  // delay schedule in seconds for each subsequent failure (index 0 = first failure)
  delaysSeconds?: number[];
  // if failures within this sliding window (seconds) are considered recent
  failureWindowSeconds?: number;
  // number of failures that triggers permanent lock (0 = disabled)
  permanentLockAfterFailures?: number;
}

export interface LockoutState {
  failedTimestamps: number[]; // epoch ms of failed attempts (kept only while relevant)
  lockUntil?: number | null; // epoch ms until which actions are blocked
  permanentlyLocked?: boolean;
}

const DEFAULT_CONFIG: Required<LockoutConfig> = {
  delaysSeconds: [0, 30, 60, 120, 300, 900, 1800],
  failureWindowSeconds: 3600, // keep failures for 1 hour by default
  permanentLockAfterFailures: 0,
};

/**
 * LockoutManager tracks attempts and enforces progressive delays.
 * Use `toState()`/`fromState()` to persist across restarts.
 */
export class LockoutManager {
  private config: Required<LockoutConfig>;
  private failedTimestamps: number[]; // epoch ms
  private lockUntil: number | null;
  private permanentlyLocked: boolean;

  constructor(config?: LockoutConfig, state?: LockoutState) {
    this.config = { ...DEFAULT_CONFIG, ...(config || {}) } as Required<LockoutConfig>;
    this.failedTimestamps = [];
    this.lockUntil = null;
    this.permanentlyLocked = false;
    if (state) this.fromState(state);
  }

  private nowMs(): number {
    return Date.now();
  }

  /** Purge old failures outside of the configured window. */
  private purgeOldFailures(now = this.nowMs()) {
    const cutoff = now - this.config.failureWindowSeconds * 1000;
    this.failedTimestamps = this.failedTimestamps.filter((t) => t >= cutoff);
  }

  /** Record a failed unlock attempt and compute new lockUntil if needed. */
  recordFailedAttempt(now = Date.now()): void {
    if (this.permanentlyLocked) return;
    this.failedTimestamps.push(now);
    this.purgeOldFailures(now);

    const recentFailures = this.failedTimestamps.length;
    // Determine delay using schedule; pick last delay for overflow
    const delays = this.config.delaysSeconds;
    const idx = Math.max(0, Math.min(delays.length - 1, recentFailures - 1));
    const delaySec = delays[idx];
    if (delaySec > 0) {
      this.lockUntil = now + delaySec * 1000;
    }

    if (this.config.permanentLockAfterFailures > 0 && recentFailures >= this.config.permanentLockAfterFailures) {
      this.permanentlyLocked = true;
    }
  }

  /** Record a successful unlock: clear failures and unlock. */
  recordSuccessfulAttempt(): void {
    this.failedTimestamps = [];
    this.lockUntil = null;
    // Do not clear permanent lock automatically; recovery flow must clear it.
  }

  /** Mark the manager as permanently locked until recovery flow clears it. */
  setPermanentLock(): void {
    this.permanentlyLocked = true;
  }

  /** Clear permanent lock (after verified recovery flow). */
  clearPermanentLock(): void {
    this.permanentlyLocked = false;
    this.recordSuccessfulAttempt();
  }

  /** Returns true if currently locked (temporary or permanent). */
  isLocked(now = Date.now()): boolean {
    if (this.permanentlyLocked) return true;
    if (this.lockUntil && now < this.lockUntil) return true;
    return false;
  }

  /** Returns remaining lock seconds (0 if not locked). */
  getRemainingLockSeconds(now = Date.now()): number {
    if (this.permanentlyLocked) return Infinity as unknown as number;
    if (!this.lockUntil) return 0;
    const rem = Math.ceil((this.lockUntil - now) / 1000);
    return rem > 0 ? rem : 0;
  }

  /** Serialize state for persistence. */
  toState(): LockoutState {
    this.purgeOldFailures();
    return {
      failedTimestamps: [...this.failedTimestamps],
      lockUntil: this.lockUntil ?? null,
      permanentlyLocked: !!this.permanentlyLocked,
    };
  }

  /** Restore manager from persisted state. */
  fromState(state: LockoutState): void {
    this.failedTimestamps = Array.isArray(state.failedTimestamps) ? state.failedTimestamps.slice() : [];
    this.lockUntil = state.lockUntil ?? null;
    this.permanentlyLocked = !!state.permanentlyLocked;
    this.purgeOldFailures();
  }

  /** Expose read-only diagnostics (counts and next unlock). */
  diagnostics(now = Date.now()): { recentFailures: number; permanentlyLocked: boolean; remainingLockSeconds: number } {
    this.purgeOldFailures(now);
    return { recentFailures: this.failedTimestamps.length, permanentlyLocked: this.permanentlyLocked, remainingLockSeconds: this.getRemainingLockSeconds(now) };
  }
}

export default LockoutManager;

