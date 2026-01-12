/**
 * wallet-core `encrypt.ts`
 *
 * Responsibilities:
 * - Provide local encryption helpers to encrypt/decrypt the raw seed bytes.
 * - Uses Node.js `crypto` AES-256-GCM for symmetric encryption. Derives a
 *   32-byte key from the provided `unlockSecret` using `scrypt`.
 *
 * Security notes:
 * - Use strong, user-chosen unlock secrets. Prefer platform secure storage
 *   (Keychain / Keystore) to hold derived keys where possible.
 * - This module never transmits secrets to any server.
 */

import { scryptSync, randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { EncryptedBlob } from "./types";

const KEY_LEN = 32; // AES-256
const IV_LEN = 12; // recommended for GCM

/**
 * Derive a 32-byte key from an unlock secret using scrypt.
 */
function deriveKey(unlockSecret: string, salt: Buffer): Buffer {
  return scryptSync(unlockSecret, salt, KEY_LEN) as Buffer;
}

/**
 * Encrypt a seed (Uint8Array/Buffer) with the provided unlock secret.
 * Returns an `EncryptedBlob` containing base64-encoded pieces.
 */
export function encryptSeed(seed: Uint8Array | Buffer, unlockSecret: string): EncryptedBlob {
  const salt = randomBytes(16);
  const key = deriveKey(unlockSecret, salt);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(seed)), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Pack salt into the iv field or include it separately; here we include salt in ciphertext blob
  const payload: EncryptedBlob = {
    version: 1,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: Buffer.concat([salt, ciphertext]).toString("base64")
  };

  return payload;
}

/**
 * Decrypt an `EncryptedBlob` with the provided unlock secret, returning the
 * original seed `Buffer` on success. Throws on auth error or invalid input.
 */
export function decryptSeed(blob: EncryptedBlob, unlockSecret: string): Buffer {
  const iv = Buffer.from(blob.iv, "base64");
  const authTag = Buffer.from(blob.authTag, "base64");
  const combined = Buffer.from(blob.ciphertext, "base64");

  // First 16 bytes is salt (as stored in encryptSeed)
  const salt = combined.slice(0, 16);
  const ciphertext = combined.slice(16);
  const key = deriveKey(unlockSecret, salt);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext;
}
