/**
 * security/secureVault.ts
 *
 * Integration adapter between clock-derived unlock secrets and `wallet-core`
 * encryption primitives. This module provides a small, safe interface to:
 * - Accept an `EncryptedBlob` produced by `wallet-core.encryptSeed`
 * - Attempt unlock using a clock-derived secret (or an explicit secret)
 * - Respect lockout/throttling rules and fail safely on incorrect secrets
 *
 * Security constraints:
 * - This module NEVER persists or retains plaintext seed material. On
 *   successful unlock the plaintext is returned to the caller and not stored.
 * - No UI, no networking. Pure logic + caller-provided stateful `LockoutManager`.
 * - Caller is responsible for protecting `masterSecret` and persisted state.
 */

import { EncryptedBlob } from "../wallet-core/types";
import { decryptSeed } from "../wallet-core/encrypt";
import { LockoutManager } from "./lockout";
import { DailyUnlockConfig, getActiveUnlockSecret } from "./clock";

export interface UnlockResult {
  success: boolean;
  // plaintext seed returned only on success; caller must immediately handle it
  plaintext?: Buffer;
  reason?: "locked" | "not_in_window" | "bad_secret" | "no_blob" | "error";
}

export interface SecureVaultOptions {
  lockout?: LockoutManager; // optional external lockout manager
}

/**
 * SecureVault
 * - Holds only the `EncryptedBlob` reference (no plaintext stored)
 * - Uses `LockoutManager` to throttle repeated bad unlock attempts
 */
export class SecureVault {
  private blob: EncryptedBlob | null;
  private lockout: LockoutManager;

  constructor(blob: EncryptedBlob | null, opts?: SecureVaultOptions) {
    this.blob = blob;
    this.lockout = opts?.lockout ?? new LockoutManager();
  }

  /** Replace stored encrypted blob (rotating or importing a new wallet) */
  public setBlob(b: EncryptedBlob | null) {
    this.blob = b;
  }

  /** Remove stored blob and clear any volatile state. Does NOT expose plaintext. */
  public clear() {
    this.blob = null;
  }

  /** Returns whether unlock operations are currently blocked by the lockout manager. */
  public isLocked(): boolean {
    return this.lockout.isLocked();
  }

  /** Diagnostics passthrough for caller visibility (no sensitive data). */
  public diagnostics() {
    return this.lockout.diagnostics();
  }

  /**
   * Attempt unlock using a clock-derived secret.
   * - `masterSecret` and `cfg` are used to derive the secret for the current
   *   date/time via `getActiveUnlockSecret`. If the clock is outside the
   *   configured window this returns `not_in_window` and does not count as a
   *   failed attempt.
   * - On decryption failure the lockout manager records a failed attempt.
   */
  public async unlockWithClock(masterSecret: string, cfg: DailyUnlockConfig, now = new Date()): Promise<UnlockResult> {
    if (!this.blob) return { success: false, reason: "no_blob" };
    if (this.lockout.isLocked()) return { success: false, reason: "locked" };

    const secret = getActiveUnlockSecret(masterSecret, cfg, now);
    if (!secret) {
      // Not within configured daily window; caller may prompt for exact time
      return { success: false, reason: "not_in_window" };
    }

    try {
      const plaintext = decryptSeed(this.blob, secret);
      // Do NOT store plaintext; return to caller for immediate handling
      this.lockout.recordSuccessfulAttempt();
      return { success: true, plaintext };
    } catch (e) {
      // Bad secret or corrupted blob -> record failure and fail safely
      try { this.lockout.recordFailedAttempt(); } catch (_) {}
      return { success: false, reason: "bad_secret" };
    }
  }

  /**
   * Attempt unlock with an explicit unlock secret (useful for recovery flows).
   * Records failures on incorrect secrets.
   */
  public async unlockWithSecret(unlockSecret: string): Promise<UnlockResult> {
    if (!this.blob) return { success: false, reason: "no_blob" };
    if (this.lockout.isLocked()) return { success: false, reason: "locked" };

    try {
      const plaintext = decryptSeed(this.blob, unlockSecret);
      this.lockout.recordSuccessfulAttempt();
      return { success: true, plaintext };
    } catch (e) {
      try { this.lockout.recordFailedAttempt(); } catch (_) {}
      return { success: false, reason: "bad_secret" };
    }
  }

  /**
   * Explicitly lock the vault (e.g., after a sensitive operation or user action).
   */
  public lock(): void {
    this.lockout.setPermanentLock();
  }

  /**
   * Clear permanent lock after a verified recovery flow.
   * Caller must ensure recovery verification before calling.
   */
  public clearPermanentLock(): void {
    this.lockout.clearPermanentLock();
  }

  /**
   * Export serializable lockout state so the caller can persist it with the
   * rest of the user's metadata (no plaintext included).
   */
  public exportState() {
    return { lockout: this.lockout.toState() };
  }

  /**
   * Restore previously exported state. Does not restore any plaintext.
   */
  public importState(state: any) {
    if (state?.lockout) this.lockout.fromState(state.lockout);
  }
}

export default SecureVault;
