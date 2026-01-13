/**
 * security/guard.ts
 *
 * Integration guard between the clock-based unlock (Phase C) and wallet-core
 * decryption. This module enforces that `wallet-core` decryptions are only
 * allowed when the daily unlock window is active.
 *
 * Rules:
 * - No UI, no persistence
 * - TypeScript-only, pure/side-effect free (except for calling deterministic
 *   crypto helpers)
 * - Uses `getActiveUnlockSecret` from `clock.ts` to validate unlock window
 * - Calls `decryptSeed` from `wallet-core/encrypt` to return plaintext seed
 */

import { EncryptedBlob } from "../wallet-core/types";
import { decryptSeed } from "../wallet-core/encrypt";
import { DailyUnlockConfig, getActiveUnlockSecret } from "./clock";

/**
 * Attempt to decrypt an `EncryptedBlob` only if the clock-derived unlock is
 * currently active for the supplied `masterSecret` and `cfg`.
 *
 * @param blob - Encrypted blob produced by `wallet-core.encryptSeed`
 * @param masterSecret - high-entropy secret held by caller (not persisted)
 * @param cfg - daily unlock configuration (hour/minute/toleranceMinutes)
 * @param now - optional override for current time (used for testing)
 * @returns Buffer with plaintext seed on success
 * @throws Error when vault is locked or decryption fails
 */
export function guardedDecrypt(
  blob: EncryptedBlob,
  masterSecret: string,
  cfg: DailyUnlockConfig,
  now?: Date
): Buffer {
  if (!blob) throw new Error("no encrypted blob provided");
  if (!masterSecret || typeof masterSecret !== "string") throw new Error("masterSecret required");

  // getActiveUnlockSecret returns a secret only when within the configured window
  const unlockSecret = getActiveUnlockSecret(masterSecret, cfg, now ?? new Date());
  if (!unlockSecret) {
    throw new Error("Wallet is locked: not within daily unlock window");
  }

  // Attempt decryption using the derived unlock secret. Let underlying
  // crypto errors surface as failures (caller may handle them).
  const plaintext = decryptSeed(blob, unlockSecret);
  return plaintext;
}

export default guardedDecrypt;
