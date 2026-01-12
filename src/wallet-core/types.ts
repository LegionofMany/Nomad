/**
 * wallet-core `types.ts` (moved into repo `src/wallet-core`)
 */

export type Mnemonic = string;

export interface EncryptedBlob {
  version: number;
  iv: string; // base64
  authTag: string; // base64
  ciphertext: string; // base64
}
