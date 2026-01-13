/**
 * security/lockout.ts
 *
 * Simple lockout handling for failed unlock attempts.
 * - Tracks consecutive failed attempts and computes an exponential backoff lock
 *   duration.
 * - No persistence included; caller should persist state if desired.
 */

export interface LockoutState {
  attempts: number;
  lockedUntil?: string; // ISO timestamp when lock expires
}

export class LockoutManager {
  private attempts = 0;
  private lockedUntil: Date | null = null;
  private readonly baseDelaySeconds: number;
  private readonly maxDelaySeconds: number;

  constructor(baseDelaySeconds = 5, maxDelaySeconds = 60 * 60 * 24) {
    this.baseDelaySeconds = baseDelaySeconds;
    this.maxDelaySeconds = maxDelaySeconds;
  }

  recordSuccessfulAttempt() {
    this.attempts = 0;
    this.lockedUntil = null;
  }

  recordFailedAttempt() {
    this.attempts += 1;
    const delay = Math.min(this.baseDelaySeconds * Math.pow(2, this.attempts - 1), this.maxDelaySeconds);
    const until = new Date(Date.now() + delay * 1000);
    this.lockedUntil = until;
  }

  isLocked(now = new Date()): boolean {
    if (!this.lockedUntil) return false;
    return now < this.lockedUntil;
  }

  getRemainingLockSeconds(now = new Date()): number {
    if (!this.lockedUntil) return 0;
    const rem = Math.max(0, Math.ceil((this.lockedUntil.getTime() - now.getTime()) / 1000));
    return rem;
  }

  toState(): LockoutState {
    return { attempts: this.attempts, lockedUntil: this.lockedUntil ? this.lockedUntil.toISOString() : undefined };
  }

  fromState(s: LockoutState) {
    this.attempts = s.attempts || 0;
    this.lockedUntil = s.lockedUntil ? new Date(s.lockedUntil) : null;
  }
}
