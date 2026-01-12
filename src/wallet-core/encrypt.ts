/**
 * wallet-core `encrypt.ts` (moved into repo `src/wallet-core`)
 */

import { scryptSync, randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { EncryptedBlob } from "./types";

const KEY_LEN = 32;
const IV_LEN = 12;

function deriveKey(unlockSecret: string, salt: Buffer): Buffer {
  return scryptSync(unlockSecret, salt, KEY_LEN) as Buffer;
}

export function encryptSeed(seed: Uint8Array | Buffer, unlockSecret: string): EncryptedBlob {
  const salt = randomBytes(16);
  const key = deriveKey(unlockSecret, salt);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(seed)), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload: EncryptedBlob = {
    version: 1,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: Buffer.concat([salt, ciphertext]).toString("base64")
  };

  return payload;
}

export function decryptSeed(blob: EncryptedBlob, unlockSecret: string): Buffer {
  const iv = Buffer.from(blob.iv, "base64");
  const authTag = Buffer.from(blob.authTag, "base64");
  const combined = Buffer.from(blob.ciphertext, "base64");
  const salt = combined.slice(0, 16);
  const ciphertext = combined.slice(16);
  const key = deriveKey(unlockSecret, salt);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext;
}
