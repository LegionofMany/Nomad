/**
 * security/clock.ts
 *
 * Pure logic for the daily clock-based unlock.
 * - Defines a single daily unlock time (hour/minute)
 * - Provides helpers to check if "now" is within the allowed unlock window
 * - Produces a deterministic `unlockSecret` string derived from a master secret
 *   and the current date + configured daily time. That `unlockSecret` can be
 *   supplied to `wallet-core` encryption helpers.
 *
 * Security notes:
 * - The `masterSecret` should be high-entropy (user passphrase or derived key)
 *   and stored/encrypted by the caller.
 * - All cryptographic operations use HMAC-SHA256 (Node `crypto`) deterministically.
 */

import { createHmac } from "crypto";

export interface DailyUnlockConfig {
  hour: number; // 0-23
  minute: number; // 0-59
  toleranceMinutes?: number; // +/- minutes allowed around target time (default 5)
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function dateToYMD(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/**
 * Returns true if the supplied `date` is within the configured daily unlock time
 * +/- tolerance.
 */
export function isWithinDailyUnlock(cfg: DailyUnlockConfig, date = new Date()): boolean {
  const tol = cfg.toleranceMinutes ?? 5;
  const targetMinutes = cfg.hour * 60 + cfg.minute;
  const nowUtc = new Date(date);
  const nowMinutes = nowUtc.getUTCHours() * 60 + nowUtc.getUTCMinutes();
  return Math.abs(nowMinutes - targetMinutes) <= tol;
}

/**
 * Derive a deterministic unlock secret (hex) for the given `date` and
 * `DailyUnlockConfig` using HMAC-SHA256(masterSecret, date|HH:MM).
 * This secret can be passed as `unlockSecret` to `wallet-core` encryption.
 */
export function deriveDailyUnlockSecret(masterSecret: string, cfg: DailyUnlockConfig, date = new Date()): string {
  const d = dateToYMD(date);
  const time = `${pad2(cfg.hour)}:${pad2(cfg.minute)}`;
  const payload = `${d}|${time}`;
  const h = createHmac("sha256", Buffer.from(masterSecret, "utf8")).update(payload).digest("hex");
  return h;
}

/**
 * Convenience: if `isWithinDailyUnlock(cfg)` returns true, produce the unlock secret
 * for `date`, otherwise return `null` to indicate locked state.
 */
export function getActiveUnlockSecret(masterSecret: string, cfg: DailyUnlockConfig, date = new Date()): string | null {
  if (!isWithinDailyUnlock(cfg, date)) return null;
  return deriveDailyUnlockSecret(masterSecret, cfg, date);
}
