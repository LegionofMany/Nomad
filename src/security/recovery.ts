/**
 * security/recovery.ts
 *
 * 24-position time-based recovery system.
 *
 * Overview:
 * - Accepts an array of 24 user-defined time positions (hour/minute/second).
 * - Each position deterministically produces a recovery token derived with
 *   HMAC-SHA256 using a `masterSecret` (caller-managed secret) as key.
 * - Tokens MUST be hashed (SHA-256) before storage; only hashed tokens are
 *   compared during recovery to avoid storing raw tokens.
 * - The recovery verification requires a configurable quorum (number of
 *   matching positions) to succeed.
 *
 * Security decisions (short):
 * - Token derivation uses HMAC-SHA256(masterSecret, payload) producing a
 *   per-day/per-position token. HMAC provides a one-way, keyed derivation
 *   that resists trivial preimage attacks compared to simple concatenation.
 * - Stored values are the SHA-256 of the token (not the token itself). This
 *   prevents retrieval of usable tokens from storage.
 * - This module is pure logic only: it does not persist data, handle keys,
 *   or perform networking. The caller is responsible for protecting
 *   `masterSecret` and for storing the hashed tokens.
 * - No private keys or mnemonics are touched here.
 */

import { createHmac, createHash } from "crypto";

export interface TimePosition {
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
  label?: string; // optional user label
}

export interface RecoveryRegistryEntry {
  index: number; // 0-23
  hashedToken: string; // SHA-256 hex of the derived token
  label?: string;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function dateToYMDLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Validate that positions array contains exactly 24 valid time entries. */
export function validatePositions(positions: TimePosition[]): void {
  if (!Array.isArray(positions) || positions.length !== 24) {
    throw new Error("positions must be an array of exactly 24 TimePosition entries");
  }
  for (let i = 0; i < 24; i++) {
    const p = positions[i];
    if (!p || typeof p.hour !== "number" || typeof p.minute !== "number" || typeof p.second !== "number") {
      throw new Error(`position ${i} is invalid`);
    }
    if (p.hour < 0 || p.hour > 23 || p.minute < 0 || p.minute > 59 || p.second < 0 || p.second > 59) {
      throw new Error(`position ${i} has out-of-range hour/minute/second`);
    }
  }
}

/**
 * Derive a deterministic recovery token (hex) for a single position.
 * - `masterSecret` is used as the HMAC key and MUST be protected by caller.
 * - The token is suitable for display to a user (or ephemeral use), but
 *   MUST be hashed before being stored.
 */
export function deriveRecoveryToken(masterSecret: string, positionIndex: number, pos: TimePosition, date = new Date(), localSalt?: string): string {
  if (!masterSecret || typeof masterSecret !== "string") throw new Error("masterSecret must be a non-empty string");
  if (positionIndex < 0 || positionIndex > 23) throw new Error("positionIndex must be 0-23");
  if (pos.hour < 0 || pos.hour > 23 || pos.minute < 0 || pos.minute > 59 || pos.second < 0 || pos.second > 59) throw new Error("invalid TimePosition");

  // Use local date to keep recovery slot stable per user's day
  const d = dateToYMDLocal(date);
  const time = `${pad2(pos.hour)}:${pad2(pos.minute)}:${pad2(pos.second)}`;
  const payload = `${d}|${positionIndex}|${time}${localSalt ? `|${localSalt}` : ""}`;

  // HMAC-SHA256(masterSecret, payload) -> hex token
  const token = createHmac("sha256", Buffer.from(masterSecret, "utf8")).update(payload).digest("hex");
  return token;
}

/**
 * Hash a token for storage using SHA-256 (hex). Stored registry should
 * contain only these hashed values.
 */
export function hashTokenForStorage(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Build a registry of hashed tokens for the provided 24 positions. The
 * caller should store the returned array securely (e.g., encrypted storage).
 */
export function buildRecoveryRegistry(masterSecret: string, positions: TimePosition[], date = new Date(), localSalt?: string): RecoveryRegistryEntry[] {
  validatePositions(positions);
  const out: RecoveryRegistryEntry[] = [];
  for (let i = 0; i < positions.length; i++) {
    const token = deriveRecoveryToken(masterSecret, i, positions[i], date, localSalt);
    const hashed = hashTokenForStorage(token);
    out.push({ index: i, hashedToken: hashed, label: positions[i].label });
  }
  return out;
}

/**
 * Verify a set of provided tokens (preimages) against a stored registry.
 * - `providedTokens` may include tokens for arbitrary indices; each token
 *   will be hashed and compared to the stored registry.
 * - Returns the number of matches and boolean success against `quorum`.
 */
export function verifyRecoverySubmission(storedRegistry: RecoveryRegistryEntry[], providedTokens: { index: number; token: string }[], quorum = 3): { matches: number; success: boolean; matchedIndices: number[] } {
  if (!Array.isArray(storedRegistry) || storedRegistry.length === 0) throw new Error("storedRegistry required");
  const map = new Map<number, string>();
  for (const e of storedRegistry) map.set(e.index, e.hashedToken);

  const seen = new Set<number>();
  let matches = 0;
  const matchedIndices: number[] = [];
  for (const p of providedTokens) {
    if (typeof p.index !== "number" || typeof p.token !== "string") continue;
    const expectedHash = map.get(p.index);
    if (!expectedHash) continue;
    const h = hashTokenForStorage(p.token);
    if (h === expectedHash && !seen.has(p.index)) {
      seen.add(p.index);
      matches++;
      matchedIndices.push(p.index);
    }
  }
  return { matches, success: matches >= quorum, matchedIndices };
}

/**
 * Convenience: verify by deriving tokens locally from `masterSecret` and
 * `positions` and comparing to `storedRegistry`. Useful when caller still
 * has `masterSecret` available and wants to validate stored hashes.
 */
export function verifyByDerivation(masterSecret: string, positions: TimePosition[], storedRegistry: RecoveryRegistryEntry[], date = new Date(), localSalt?: string, quorum = 3) {
  validatePositions(positions);
  const provided = positions.map((p, i) => ({ index: i, token: deriveRecoveryToken(masterSecret, i, p, date, localSalt) }));
  return verifyRecoverySubmission(storedRegistry, provided, quorum);
}

export default {
  TimePosition: undefined,
};
