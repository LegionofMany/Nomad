/**
 * Runtime gateways used by the Nomad feature layer.
 *
 * Wallet custody remains behind the base-wallet adapter. Nomad persists only
 * its own encrypted wallet preview material, credentials, security metadata,
 * recovery digests, preferences, and feature state here.
 */

import * as ExpoCrypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** NFC remains guarded until a native request-only provider is connected. */
export type NfcResult = { success: boolean; message?: string };

export async function isNfcAvailable(): Promise<boolean> {
  return false;
}

export async function enableNfc(): Promise<NfcResult> {
  return { success: false, message: 'NFC provider not configured. Nomad will not emulate hardware access.' };
}

export async function disableNfc(): Promise<NfcResult> {
  return { success: true, message: 'NFC request handling is disabled.' };
}

export type NomadPersistenceMode =
  | 'encrypted_device_store'
  | 'browser_local_storage'
  | 'memory_fallback';

/** Used by hook fallbacks as well as adapters backed by the runtime gateway. */
export type NomadPersistenceEvidence = NomadPersistenceMode | 'in_memory_stub';

const memoryFallback = new Map<string, string>();
const SECURE_STORE_CHUNK_CHARS = 1500;

type SecureStoreChunkManifest = {
  version: 1;
  chunks: number;
};

const manifestKey = (key: string) => `${key}.__nomad_chunks__`;
const chunkKey = (key: string, index: number) => `${key}.__nomad_chunk__.${index}`;

async function readChunkManifest(key: string): Promise<SecureStoreChunkManifest | null> {
  const raw = await SecureStore.getItemAsync(manifestKey(key));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SecureStoreChunkManifest>;
    if (parsed.version !== 1 || !Number.isInteger(parsed.chunks) || Number(parsed.chunks) < 1) return null;
    return { version: 1, chunks: Number(parsed.chunks) };
  } catch {
    return null;
  }
}

async function removeNativeChunks(key: string, manifest?: SecureStoreChunkManifest | null) {
  const current = manifest ?? await readChunkManifest(key);
  if (current) {
    await Promise.all(Array.from({ length: current.chunks }, (_, index) => SecureStore.deleteItemAsync(chunkKey(key, index))));
  }
  await SecureStore.deleteItemAsync(manifestKey(key));
}

function browserStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof globalThis === 'undefined') return null;
  try {
    const storage = globalThis.localStorage;
    const probe = '__nomad_storage_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export function getSecureStorageMode(): NomadPersistenceMode {
  if (Platform.OS !== 'web') return 'encrypted_device_store';
  return browserStorage() ? 'browser_local_storage' : 'memory_fallback';
}

export async function secureSetItem(key: string, value: string): Promise<void> {
  if (Platform.OS !== 'web') {
    const previousManifest = await readChunkManifest(key);
    const options = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };
    if (value.length <= SECURE_STORE_CHUNK_CHARS) {
      await SecureStore.setItemAsync(key, value, options);
      await removeNativeChunks(key, previousManifest);
      return;
    }

    const chunks = Array.from(
      { length: Math.ceil(value.length / SECURE_STORE_CHUNK_CHARS) },
      (_, index) => value.slice(index * SECURE_STORE_CHUNK_CHARS, (index + 1) * SECURE_STORE_CHUNK_CHARS),
    );
    await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(chunkKey(key, index), chunk, options)));
    await SecureStore.setItemAsync(manifestKey(key), JSON.stringify({ version: 1, chunks: chunks.length }), options);
    await SecureStore.deleteItemAsync(key);
    if (previousManifest && previousManifest.chunks > chunks.length) {
      await Promise.all(Array.from(
        { length: previousManifest.chunks - chunks.length },
        (_, index) => SecureStore.deleteItemAsync(chunkKey(key, chunks.length + index)),
      ));
    }
    return;
  }

  const storage = browserStorage();
  if (storage) {
    storage.setItem(key, value);
    return;
  }
  memoryFallback.set(key, value);
}

export async function secureGetItem(key: string): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const manifest = await readChunkManifest(key);
    if (!manifest) return SecureStore.getItemAsync(key);
    const chunks = await Promise.all(Array.from(
      { length: manifest.chunks },
      (_, index) => SecureStore.getItemAsync(chunkKey(key, index)),
    ));
    if (chunks.some((chunk) => chunk === null)) throw new Error(`Nomad encrypted storage is incomplete for ${key}.`);
    return chunks.join('');
  }
  const storage = browserStorage();
  return storage ? storage.getItem(key) : memoryFallback.get(key) ?? null;
}

export async function secureRemoveItem(key: string): Promise<void> {
  if (Platform.OS !== 'web') {
    await removeNativeChunks(key);
    await SecureStore.deleteItemAsync(key);
    return;
  }
  const storage = browserStorage();
  if (storage) storage.removeItem(key);
  memoryFallback.delete(key);
}

/** Cryptographically secure randomness only; there is no Math.random fallback. */
export function getRandomBytes(length: number): Uint8Array {
  if (!Number.isInteger(length) || length <= 0) throw new Error('Random byte length must be a positive integer.');
  if (typeof globalThis !== 'undefined' && typeof globalThis.crypto?.getRandomValues === 'function') {
    return globalThis.crypto.getRandomValues(new Uint8Array(length));
  }
  return ExpoCrypto.getRandomBytes(length);
}

export async function sha256Hex(value: string): Promise<string> {
  return ExpoCrypto.digestStringAsync(ExpoCrypto.CryptoDigestAlgorithm.SHA256, value, {
    encoding: ExpoCrypto.CryptoEncoding.HEX,
  });
}

export default {
  isNfcAvailable,
  enableNfc,
  disableNfc,
  secureSetItem,
  secureGetItem,
  secureRemoveItem,
  getSecureStorageMode,
  getRandomBytes,
  sha256Hex,
};
