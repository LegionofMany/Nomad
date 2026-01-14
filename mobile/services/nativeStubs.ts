/**
 * mobile/services/nativeStubs.ts
 *
 * Safe stubs for native APIs so the Expo app (including web) won't crash.
 * - No hardware access
 * - No network calls
 * - Clearly marked as stubs
 *
 * Replace these with real native implementations (Expo modules or native
 * plugins) when the mobile app is promoted to a first-class package.
 */

/** NFC stubs */
export type NfcResult = { success: boolean; message?: string };

/** Returns whether NFC is available on this runtime. Always false for stubs. */
export async function isNfcAvailable(): Promise<boolean> {
  console.warn('nativeStubs: isNfcAvailable() — STUB (returns false)');
  return false;
}

/** Attempt to enable NFC — stub returns a harmless failure result. */
export async function enableNfc(): Promise<NfcResult> {
  console.warn('nativeStubs: enableNfc() — STUB (no hardware access)');
  return { success: false, message: 'stub: no hardware access' };
}

/** Attempt to disable NFC — stub returns a harmless success/failure. */
export async function disableNfc(): Promise<NfcResult> {
  console.warn('nativeStubs: disableNfc() — STUB (no hardware access)');
  return { success: false, message: 'stub: no hardware access' };
}

/** Secure storage stubs (in-memory, not persistent) */
const _inMemoryStore = new Map<string, string>();

/** Store a value securely — WARNING: in-memory only (stub). */
export async function secureSetItem(key: string, value: string): Promise<void> {
  console.warn('nativeStubs: secureSetItem() — STUB (in-memory, not persistent)');
  _inMemoryStore.set(key, value);
}

/** Retrieve a value from secure storage — returns null if not found. */
export async function secureGetItem(key: string): Promise<string | null> {
  const v = _inMemoryStore.get(key) ?? null;
  if (v === null) console.warn(`nativeStubs: secureGetItem(${key}) — STUB (returned null)`);
  return v;
}

/** Remove a key from secure storage (in-memory). */
export async function secureRemoveItem(key: string): Promise<void> {
  console.warn('nativeStubs: secureRemoveItem() — STUB (in-memory)');
  _inMemoryStore.delete(key);
}

/** Crypto randomness */
/**
 * Returns a Uint8Array of random bytes. Uses Web Crypto when available,
 * otherwise falls back to a not-cryptographically-secure Math.random().
 * The fallback is clearly marked so callers can decide whether it's acceptable.
 */
export function getRandomBytes(length: number): Uint8Array {
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto && typeof (globalThis as any).crypto.getRandomValues === 'function') {
    const arr = new Uint8Array(length);
    (globalThis as any).crypto.getRandomValues(arr);
    return arr;
  }

  // Fallback (NOT cryptographically secure) — clearly marked.
  console.warn('nativeStubs: getRandomBytes() — using insecure Math.random() fallback');
  const arr = new Uint8Array(length);
  for (let i = 0; i < length; i++) arr[i] = Math.floor(Math.random() * 256);
  return arr;
}

export default {
  // NFC
  isNfcAvailable,
  enableNfc,
  disableNfc,
  // Secure storage
  secureSetItem,
  secureGetItem,
  secureRemoveItem,
  // Randomness
  getRandomBytes,
};
