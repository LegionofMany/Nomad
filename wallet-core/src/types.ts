/**
 * wallet-core `types.ts`
 * Shared TypeScript types used across the wallet-core package.
 */

export type Mnemonic = string;

export interface EncryptedBlob {
  version: number;
  iv: string; // base64
  authTag: string; // base64
  ciphertext: string; // base64
}
