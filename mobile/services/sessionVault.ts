/**
 * sessionVault.ts
 *
 * Holds the decrypted wallet seed IN MEMORY ONLY, and only while the wallet is
 * unlocked. It is never written to disk, never logged, and never exposed to
 * screens. The wallet engine asks for a fresh copy per operation and wipes it.
 *
 * Locking, resetting, or closing the app clears it.
 */

let sessionSeed: Uint8Array | null = null;

/** Takes ownership of `seed` (the caller's array is wiped after copying). */
export function holdSessionSeed(seed: Uint8Array): void {
  clearSessionSeed();
  sessionSeed = new Uint8Array(seed);
  seed.fill(0);
}

export function isSessionUnlocked(): boolean {
  return sessionSeed !== null;
}

/** A fresh copy the caller must wipe after use. Throws if the wallet is locked. */
export function getSessionSeedCopy(): Uint8Array {
  if (!sessionSeed) throw new Error("The wallet is locked.");
  return new Uint8Array(sessionSeed);
}

export function clearSessionSeed(): void {
  if (sessionSeed) sessionSeed.fill(0);
  sessionSeed = null;
}
