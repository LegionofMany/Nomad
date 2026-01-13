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
  /**
   * Optional device-specific local salt. This should be a stable string that
   * is unique to the device (or user device instance). It is included in the
   * derived payload to bind the unlock secret to this local environment.
   * The salt itself should not be treated as a secret (but should not be
   * globally shared). If omitted, derivation still works but is not bound
   * to a device instance.
   */
  localSalt?: string;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function dateToYMD(d: Date): string {
  // Use local date components to reflect the user's daily boundary in their
  // local timezone. This avoids surprising behavior around UTC midnight.
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Returns true if the supplied `date` is within the configured daily unlock time
 * +/- tolerance.
 */
export function isWithinDailyUnlock(cfg: DailyUnlockConfig, date = new Date()): boolean {
  // Validate config ranges
  if (cfg.hour < 0 || cfg.hour > 23) throw new Error("DailyUnlockConfig.hour must be 0-23");
  if (cfg.minute < 0 || cfg.minute > 59) throw new Error("DailyUnlockConfig.minute must be 0-59");

  const tol = cfg.toleranceMinutes ?? 5;
  const targetMinutes = cfg.hour * 60 + cfg.minute;
  // Use local time to match user expectation for daily unlock time
  const nowLocal = new Date(date);
  const nowMinutes = nowLocal.getHours() * 60 + nowLocal.getMinutes();
  return Math.abs(nowMinutes - targetMinutes) <= tol;
}

/**
 * Derive a deterministic unlock secret (hex) for the given `date` and
 * `DailyUnlockConfig` using HMAC-SHA256(masterSecret, date|HH:MM).
 * This secret can be passed as `unlockSecret` to `wallet-core` encryption.
 */
/**
 * Derive a deterministic unlock secret from a `masterSecret`, the configured
 * daily time, and an optional `localSalt`.
 *
 * Design/Threat notes:
 * - We never return the master secret; only a one-way HMAC-SHA256 hex digest
 *   derived from it. The HMAC key is `masterSecret` and the message includes
 *   the date and configured time + local salt. This binds the secret to the
 *   specific day/time and optionally to the local device.
 * - Using HMAC (instead of raw hashing of concatenated values) ensures the
 *   secret cannot be trivially reversed to expose the payload values.
 * - The caller is responsible for protecting `masterSecret` (e.g., storing
 *   it encrypted or deriving it from a passphrase). This module performs
 *   pure deterministic derivation and does not persist any secrets.
 * - The output is suitable as `unlockSecret` for `wallet-core` encryption
 *   (it is a hex string which can be supplied to `scrypt` as a password).
 */
export function deriveDailyUnlockSecret(masterSecret: string, cfg: DailyUnlockConfig, date = new Date()): string {
  if (!masterSecret || typeof masterSecret !== "string") throw new Error("masterSecret must be a non-empty string");
  // Use local date components
  const d = dateToYMD(date);
  const time = `${pad2(cfg.hour)}:${pad2(cfg.minute)}`;
  const saltPart = cfg.localSalt ? `|${cfg.localSalt}` : "";
  const payload = `${d}|${time}${saltPart}`;
  // Use HMAC-SHA256 with masterSecret as key for deterministic, one-way output
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
