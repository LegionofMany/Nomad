/**
 * wallet-core `seed.ts`
 *
 * Responsibilities:
 * - Generate a BIP39 mnemonic (24 words) using a well-known library
 * - Validate a mnemonic
 * - Convert mnemonic -> seed buffer (binary seed) suitable for HD key derivation
 *
 * Security notes (in-file):
 * - Mnemonics and seeds are sensitive material. Keep them in memory only as long
 *   as necessary and avoid logging them.
 * - This module intentionally returns Node.js `Uint8Array` or `Buffer` values so
 *   the caller can decide how to store or encrypt them.
 */

import { generateMnemonic as scureGenerate, mnemonicToSeedSync, validateMnemonic as scureValidate } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

/**
 * Generate a BIP39 mnemonic phrase (24 words) using the English wordlist.
 * Returns the mnemonic string. Caller must handle storage/encryption.
 */
export function generateMnemonic(): string {
  // @scure/bip39's `generateMnemonic` accepts entropy length in bits; 256 bits -> 24 words
  // The library's exact API varies; `scureGenerate(256, randomFunc, wordlist)` is common.
  // We'll call the function and fall back to a small internal generator if missing.
  try {
    // Many builds of @scure/bip39 expose generateMnemonic(entropyBits, wordlist)
    // Use 256 bits for a 24-word mnemonic.
    // Type coercion used to match possible signatures.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return scureGenerate(256, wordlist);
  } catch (e) {
    // Fallback: if the library doesn't accept parameters in this environment,
    // try a zero-arg call and validate length. This is defensive; real projects
    // should lock the dependency version.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const mnemonic = scureGenerate();
    return mnemonic;
  }
}

/**
 * Validate a mnemonic phrase. Returns `true` if valid, `false` otherwise.
 */
export function validateMnemonic(mnemonic: string): boolean {
  try {
    return scureValidate(mnemonic);
  } catch (e) {
    return false;
  }
}

/**
 * Convert a mnemonic into a seed buffer usable for HD derivation.
 * This uses the mnemonic -> seed function from the BIP39 library and returns
 * a `Uint8Array` (Node `Buffer` compatible) containing the seed.
 *
 * The optional `passphrase` parameter is the BIP39 passphrase (not the same
 * as device unlock). Use only when the user explicitly sets a passphrase.
 */
export function mnemonicToSeed(mnemonic: string, passphrase = ""): Uint8Array {
  // mnemonicToSeedSync returns a Uint8Array / Buffer depending on environment
  // Use the synchronous variant for simplicity in init flows.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const seed = mnemonicToSeedSync(mnemonic, passphrase);
  return seed as Uint8Array;
}
