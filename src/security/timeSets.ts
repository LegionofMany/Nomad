/**
 * security/timeSets.ts
 *
 * Wallet recovery by 24 Time Sets plus a password.
 *
 *  - The APP generates 24 random times (HH:MM:SS). People never choose them: chosen times
 *    are guessable (birthdays, 12:00:00, 09:30:00). 24 random times carry about 390 bits.
 *  - The wallet's secret is derived from the 24 times IN ORDER together with the password,
 *    using PBKDF2-HMAC-SHA512. Losing either one means the wallet cannot be rebuilt;
 *    holding only one gives an attacker nothing.
 *  - The derived 32 bytes become a standard 24-word BIP39 phrase inside the app, so the
 *    wallet can still be moved to another standard wallet later (see seed.ts).
 *
 * Nothing here is stored. The same Time Sets and password always give the same wallet,
 * on any phone. The iteration count is part of the result: a TEST-profile backup
 * (fast, 3,000) rebuilds a different wallet under the standard profile, so the backup page
 * names its profile and recovery shows the address for the owner to compare.
 */

import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha512 } from "@noble/hashes/sha2";

import { isTestnetFastKdf, kdfIterations } from "./kdfPolicy";

export const TIME_SET_COUNT = 24;
/** Standard-profile iteration count (matches the wallet's other password stretching). */
export const RECOVERY_ITERATIONS = 210_000;

export interface TimeSet {
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
}

export type RecoveryProfile = "standard" | "test";

const SECONDS_PER_DAY = 86_400;
const pad2 = (n: number) => String(n).padStart(2, "0");

export const formatTimeSet = (t: TimeSet): string => `${pad2(t.hour)}:${pad2(t.minute)}:${pad2(t.second)}`;

/** Which profile new backups use in this build. */
export function currentRecoveryProfile(): RecoveryProfile {
  return isTestnetFastKdf() ? "test" : "standard";
}

function defaultRandom(length: number): Uint8Array {
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (!c || typeof c.getRandomValues !== "function") throw new Error("Secure random numbers are not available on this device.");
  const out = new Uint8Array(length);
  c.getRandomValues(out);
  return out;
}

/** Uniform number in [0, 86400). Rejects values that would bias the result. */
function randomSecondOfDay(random: (length: number) => Uint8Array): number {
  const limit = 0x1_0000_0000 - (0x1_0000_0000 % SECONDS_PER_DAY);
  for (;;) {
    const b = random(4);
    const value = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
    if (value < limit) return value % SECONDS_PER_DAY;
  }
}

/** Generates 24 distinct random Time Sets. `random` is injectable for tests only. */
export function generateTimeSets(random: (length: number) => Uint8Array = defaultRandom): TimeSet[] {
  const seen = new Set<number>();
  const sets: TimeSet[] = [];
  while (sets.length < TIME_SET_COUNT) {
    const s = randomSecondOfDay(random);
    if (seen.has(s)) continue;
    seen.add(s);
    sets.push({ hour: Math.floor(s / 3600), minute: Math.floor((s % 3600) / 60), second: s % 60 });
  }
  return sets;
}

/** Throws a plain-language error unless there are exactly 24 valid, distinct Time Sets. */
export function validateTimeSets(sets: TimeSet[]): void {
  if (!Array.isArray(sets) || sets.length !== TIME_SET_COUNT) {
    throw new Error(`Enter all ${TIME_SET_COUNT} Time Sets. You have ${Array.isArray(sets) ? sets.length : 0}.`);
  }
  sets.forEach((t, i) => {
    const ok =
      t &&
      Number.isInteger(t.hour) && t.hour >= 0 && t.hour <= 23 &&
      Number.isInteger(t.minute) && t.minute >= 0 && t.minute <= 59 &&
      Number.isInteger(t.second) && t.second >= 0 && t.second <= 59;
    if (!ok) throw new Error(`Time Set ${i + 1} is not a valid HH:MM:SS time.`);
  });
  if (new Set(sets.map(formatTimeSet)).size !== TIME_SET_COUNT) {
    throw new Error("Two of the Time Sets are the same. Every Time Set in a backup is different, so check what you typed.");
  }
}

/**
 * Reads Time Sets from typed or pasted text. Accepts spaces, commas, semicolons and new lines
 * between times, and ignores list numbers such as "1." or "2)". Returns what it could read and
 * a list of the pieces it could not.
 */
export function parseTimeSets(text: string): { sets: TimeSet[]; problems: string[] } {
  const sets: TimeSet[] = [];
  const problems: string[] = [];
  for (const raw of String(text ?? "").split(/[\s,;|]+/)) {
    const token = raw.trim();
    if (!token || /^\d{1,2}[.)]$/.test(token)) continue;
    const m = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(token);
    if (!m) {
      problems.push(token);
      continue;
    }
    const t = { hour: Number(m[1]), minute: Number(m[2]), second: Number(m[3]) };
    if (t.hour > 23 || t.minute > 59 || t.second > 59) problems.push(token);
    else sets.push(t);
  }
  return { sets, problems };
}

/**
 * 32 bytes of wallet entropy from the ordered Time Sets and the password.
 * `iterations` is only overridden in tests.
 */
export function deriveRecoveryEntropy(sets: TimeSet[], password: string, iterations: number = kdfIterations(RECOVERY_ITERATIONS)): Uint8Array {
  validateTimeSets(sets);
  if (typeof password !== "string" || password.length === 0) throw new Error("Enter the wallet password.");
  const enc = new TextEncoder();
  const salt = enc.encode(`nomad-recovery-v1|${sets.map(formatTimeSet).join(" ")}`);
  return pbkdf2(sha512, enc.encode(password.normalize("NFKD")), salt, { c: iterations, dkLen: 32 });
}
