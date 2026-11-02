/**
 * wallet-core `types.ts` (moved into repo `src/wallet-core`)
 */

export type Mnemonic = string;

/** Key-derivation settings stored inside version 3+ blobs so they can be raised later without breaking old data. */
export interface BlobKdfParams {
  name: "PBKDF2-SHA256";
  iterations: number;
}

export interface EncryptedBlob {
  version: number;
  /** Present on version 3+. Versions 1 and 2 use fixed legacy parameters. */
  kdf?: BlobKdfParams;
  iv: string; // base64
  authTag: string; // base64
  ciphertext: string; // base64
}
