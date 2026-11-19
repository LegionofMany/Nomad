/**
 * Secure random numbers for phones (Hermes has no crypto.getRandomValues).
 *
 * IMPORTANT: this file must not import any @noble package, and it must run BEFORE one is loaded.
 * @noble/hashes reads globalThis.crypto once, the moment it is first imported. If the random
 * function is added after that, noble keeps "no crypto" forever and wallet creation fails with
 * "crypto.getRandomValues must be defined".
 */
import * as ExpoCrypto from 'expo-crypto';

export function installRandomValues(): void {
  const g = globalThis as any;
  if (!g.crypto) g.crypto = {};
  if (typeof g.crypto.getRandomValues === 'function') return;
  g.crypto.getRandomValues = <T extends ArrayBufferView>(array: T): T => {
    const view = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    if (view.length > 65536) throw new Error('getRandomValues: request too large');
    view.set(ExpoCrypto.getRandomBytes(view.length));
    return array;
  };
}

installRandomValues();
