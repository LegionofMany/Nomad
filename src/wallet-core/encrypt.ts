/**
 * wallet-core `encrypt.ts` (moved into repo `src/wallet-core`)
 */

import { EncryptedBlob } from "./types";

const KEY_LEN = 32;
const IV_LEN = 12;

function getNodeCrypto(): null | {
  scryptSync: any;
  randomBytes: any;
  createCipheriv: any;
  createDecipheriv: any;
} {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const c = require("crypto");
    return {
      scryptSync: c.scryptSync,
      randomBytes: c.randomBytes,
      createCipheriv: c.createCipheriv,
      createDecipheriv: c.createDecipheriv,
    };
  } catch {
    return null;
  }
}

function hasWebCrypto(): boolean {
  return !!(
    typeof globalThis !== "undefined" &&
    (globalThis as any).crypto &&
    (globalThis as any).crypto.subtle &&
    typeof (globalThis as any).crypto.subtle.encrypt === "function"
  );
}

function toBase64(bytes: Uint8Array): string {
  // Prefer Buffer when available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B: any = (globalThis as any).Buffer;
  if (typeof B !== "undefined") return B.from(bytes).toString("base64");

  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const btoaFn: any = (globalThis as any).btoa;
  if (typeof btoaFn !== "function") throw new Error("No base64 encoder available");
  return btoaFn(binary);
}

function fromBase64(b64: string): Uint8Array {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B: any = (globalThis as any).Buffer;
  if (typeof B !== "undefined") return new Uint8Array(B.from(b64, "base64"));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const atobFn: any = (globalThis as any).atob;
  if (typeof atobFn !== "function") throw new Error("No base64 decoder available");
  const binary = atobFn(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function utf8Bytes(s: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(s);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B: any = (globalThis as any).Buffer;
  if (typeof B !== "undefined") return new Uint8Array(B.from(s, "utf8"));
  throw new Error("No UTF-8 encoder available");
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const start = bytes.byteOffset;
  const end = bytes.byteOffset + bytes.byteLength;
  return bytes.buffer.slice(start, end) as ArrayBuffer;
}

function deriveKeyNode(unlockSecret: string, salt: Buffer): Buffer {
  const c = getNodeCrypto();
  if (!c) throw new Error("Node crypto not available");
  return c.scryptSync(unlockSecret, salt, KEY_LEN) as Buffer;
}

/**
 * Node-only (sync) encryption using scrypt + AES-256-GCM.
 * This is used by the Node runtime and tests.
 */
export function encryptSeed(seed: Uint8Array | Buffer, unlockSecret: string): EncryptedBlob {
  const c = getNodeCrypto();
  if (!c) {
    throw new Error("encryptSeed() requires Node crypto. Use encryptSeedPortable() in web/mobile runtimes.");
  }

  const salt = c.randomBytes(16);
  const key = deriveKeyNode(unlockSecret, salt);
  const iv = c.randomBytes(IV_LEN);
  const cipher = c.createCipheriv("aes-256-gcm", key, iv);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B: any = (globalThis as any).Buffer;
  const ciphertext = B.concat([cipher.update(B.from(seed)), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload: EncryptedBlob = {
    version: 1,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: B.concat([salt, ciphertext]).toString("base64"),
  };

  return payload;
}

/**
 * Node-only (sync) decryption for version=1 blobs.
 */
export function decryptSeed(blob: EncryptedBlob, unlockSecret: string): Buffer {
  const c = getNodeCrypto();
  if (!c) {
    throw new Error("decryptSeed() requires Node crypto. Use decryptSeedPortable() in web/mobile runtimes.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B: any = (globalThis as any).Buffer;
  const iv = B.from(blob.iv, "base64");
  const authTag = B.from(blob.authTag, "base64");
  const combined = B.from(blob.ciphertext, "base64");
  const salt = combined.slice(0, 16);
  const ciphertext = combined.slice(16);
  const key = deriveKeyNode(unlockSecret, salt);

  const decipher = c.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = B.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext;
}

async function randomBytesPortable(length: number): Promise<Uint8Array> {
  // Prefer WebCrypto
  if (typeof globalThis !== "undefined" && (globalThis as any).crypto && typeof (globalThis as any).crypto.getRandomValues === "function") {
    const out = new Uint8Array(length);
    (globalThis as any).crypto.getRandomValues(out);
    return out;
  }

  // Fallback to Node crypto when available
  const c = getNodeCrypto();
  if (c) return new Uint8Array(c.randomBytes(length));

  // Last-resort fallback
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) out[i] = Math.floor(Math.random() * 256);
  return out;
}

async function deriveKeyPortable(unlockSecret: string, salt: Uint8Array): Promise<CryptoKey> {
  if (!hasWebCrypto()) throw new Error("WebCrypto not available for portable key derivation");

  const subtle = (globalThis as any).crypto.subtle as SubtleCrypto;
  const baseKey = await subtle.importKey("raw", toArrayBuffer(utf8Bytes(unlockSecret)), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: 100_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Portable (async) encryption for web/mobile using WebCrypto.
 * Produces version=2 blobs.
 */
export async function encryptSeedPortable(seed: Uint8Array | Buffer, unlockSecret: string): Promise<EncryptedBlob> {
  if (!hasWebCrypto()) {
    // If we're in Node, we can still encrypt (sync) using version=1.
    const c = getNodeCrypto();
    if (c) return encryptSeed(seed, unlockSecret);
    throw new Error("No crypto runtime available for encryption");
  }

  const subtle = (globalThis as any).crypto.subtle as SubtleCrypto;
  const salt = await randomBytesPortable(16);
  const iv = await randomBytesPortable(IV_LEN);
  const key = await deriveKeyPortable(unlockSecret, salt);

  const seedBytes = seed instanceof Uint8Array ? seed : new Uint8Array(seed);
  const encrypted = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(seedBytes)));

  // AES-GCM tag is appended to ciphertext (16 bytes typical)
  const tagLen = 16;
  const tag = encrypted.slice(encrypted.length - tagLen);
  const ct = encrypted.slice(0, encrypted.length - tagLen);

  return {
    version: 2,
    iv: toBase64(iv),
    authTag: toBase64(tag),
    ciphertext: toBase64(concatBytes(salt, ct)),
  };
}

/**
 * Portable (async) decryption for version=2 blobs.
 */
export async function decryptSeedPortable(blob: EncryptedBlob, unlockSecret: string): Promise<Uint8Array> {
  if (blob.version === 1) {
    // Node-only legacy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const B: any = (globalThis as any).Buffer;
    const out = decryptSeed(blob, unlockSecret);
    return new Uint8Array(out);
  }

  if (blob.version !== 2) throw new Error(`Unsupported EncryptedBlob version: ${blob.version}`);
  if (!hasWebCrypto()) throw new Error("WebCrypto not available for portable decryption");

  const subtle = (globalThis as any).crypto.subtle as SubtleCrypto;
  const iv = fromBase64(blob.iv);
  const tag = fromBase64(blob.authTag);
  const combined = fromBase64(blob.ciphertext);
  const salt = combined.slice(0, 16);
  const ct = combined.slice(16);

  const key = await deriveKeyPortable(unlockSecret, salt);
  const payload = concatBytes(ct, tag);
  const plaintext = new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(payload)));
  return plaintext;
}
