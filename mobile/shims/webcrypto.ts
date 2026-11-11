/**
 * Minimal WebCrypto for phones (Hermes has no crypto.subtle).
 * Covers only what Nomad uses: getRandomValues, SHA-256 digest, HMAC-SHA256 sign,
 * PBKDF2-SHA256 (deriveBits / deriveKey) and AES-256-GCM encrypt/decrypt.
 * Pure JavaScript (audited @noble libraries). Installed on native only.
 */
import { gcm } from '@noble/ciphers/aes';
import { hmac } from '@noble/hashes/hmac';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha2';
import * as ExpoCrypto from 'expo-crypto';

type KeyObj = { __nomadKey: true; kind: 'raw' | 'hmac' | 'aes'; bytes: Uint8Array };

const toBytes = (data: ArrayBuffer | ArrayBufferView): Uint8Array =>
  data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

const toBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const algoName = (a: unknown): string => (typeof a === 'string' ? a : (a as { name: string }).name).toUpperCase();

function getRandomValues<T extends ArrayBufferView>(array: T): T {
  const view = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  if (view.length > 65536) throw new Error('getRandomValues: request too large');
  view.set(ExpoCrypto.getRandomBytes(view.length));
  return array;
}

const subtle = {
  async importKey(_format: string, data: ArrayBuffer | ArrayBufferView, algorithm: unknown): Promise<KeyObj> {
    const name = algoName(algorithm);
    const kind = name === 'PBKDF2' ? 'raw' : name === 'HMAC' ? 'hmac' : 'aes';
    return { __nomadKey: true, kind, bytes: new Uint8Array(toBytes(data)) };
  },
  async deriveBits(params: any, key: KeyObj, length: number): Promise<ArrayBuffer> {
    if (algoName(params) !== 'PBKDF2') throw new Error('Only PBKDF2 is supported');
    const out = pbkdf2(sha256, key.bytes, toBytes(params.salt), { c: params.iterations, dkLen: length / 8 });
    return toBuffer(out);
  },
  async deriveKey(params: any, key: KeyObj, derived: any): Promise<KeyObj> {
    const bits = await subtle.deriveBits(params, key, derived.length);
    return { __nomadKey: true, kind: 'aes', bytes: new Uint8Array(bits) };
  },
  async sign(_algorithm: unknown, key: KeyObj, data: ArrayBuffer | ArrayBufferView): Promise<ArrayBuffer> {
    return toBuffer(hmac(sha256, key.bytes, toBytes(data)));
  },
  async digest(algorithm: unknown, data: ArrayBuffer | ArrayBufferView): Promise<ArrayBuffer> {
    if (algoName(algorithm) !== 'SHA-256') throw new Error('Only SHA-256 is supported');
    return toBuffer(sha256(toBytes(data)));
  },
  async encrypt(params: any, key: KeyObj, data: ArrayBuffer | ArrayBufferView): Promise<ArrayBuffer> {
    if (algoName(params) !== 'AES-GCM') throw new Error('Only AES-GCM is supported');
    return toBuffer(gcm(key.bytes, toBytes(params.iv)).encrypt(toBytes(data)));
  },
  async decrypt(params: any, key: KeyObj, data: ArrayBuffer | ArrayBufferView): Promise<ArrayBuffer> {
    if (algoName(params) !== 'AES-GCM') throw new Error('Only AES-GCM is supported');
    return toBuffer(gcm(key.bytes, toBytes(params.iv)).decrypt(toBytes(data)));
  },
};

export function installNativeWebCrypto(): void {
  const g = globalThis as any;
  if (!g.crypto) g.crypto = {};
  if (typeof g.crypto.getRandomValues !== 'function') g.crypto.getRandomValues = getRandomValues;
  if (!g.crypto.subtle || typeof g.crypto.subtle.encrypt !== 'function') g.crypto.subtle = subtle;
}
