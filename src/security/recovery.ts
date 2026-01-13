/**
 * security/recovery.ts
 *
 * Implements 24 deterministic recovery time positions. Each position is a
 * deterministic secret derived from a `masterSecret` and a position index
 * (0..23). These can be printed/stored offline and used to recover or unlock
 * the wallet when the daily unlock is unavailable.
 *
 * The API is intentionally simple:
 * - `deriveRecoverySlot(masterSecret, index)` -> hex secret for that slot
 * - `deriveAllRecoverySlots(masterSecret)` -> array[24]
 * - `findMatchingSlot(masterSecret, providedSecret)` -> index | -1
 */

import { createHmac } from "crypto";

/**
 * Derive a per-slot recovery secret as HMAC-SHA256(masterSecret, `recovery|slot:${index}`).
 * Returns hex string.
 */
export function deriveRecoverySlot(masterSecret: string, index: number): string {
  if (!Number.isInteger(index) || index < 0 || index > 23) {
    throw new Error("index must be integer between 0 and 23");
  }
  const payload = `recovery|slot:${index}`;
  const h = createHmac("sha256", Buffer.from(masterSecret, "utf8")).update(payload).digest("hex");
  return h;
}

export function deriveAllRecoverySlots(masterSecret: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < 24; i++) out.push(deriveRecoverySlot(masterSecret, i));
  return out;
}

export function findMatchingSlot(masterSecret: string, providedSecret: string): number {
  const slots = deriveAllRecoverySlots(masterSecret);
  return slots.indexOf(providedSecret);
}
