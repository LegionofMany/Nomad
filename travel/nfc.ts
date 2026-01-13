/**
 * travel/nfc.ts
 *
 * Simple NFC toggle logic for travel mode. This module intentionally
 * does not access hardware — it only provides toggle/state functions
 * that a higher-level integration layer could use.
 *
 * NOTE: This module holds a minimal module-level boolean to simulate
 * an enabled/disabled toggle. Consumers should persist preferences
 * externally if needed.
 */

let enabled = false;

/** Enable NFC travel features (logical toggle only). */
export function enableNFC(): void {
  enabled = true;
}

/** Disable NFC travel features (logical toggle only). */
export function disableNFC(): void {
  enabled = false;
}

/** Return whether NFC features are enabled. */
export function isNFCEnabled(): boolean {
  return enabled;
}

export default { enableNFC, disableNFC, isNFCEnabled };
