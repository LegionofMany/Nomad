/**
 * wallet-core `seed.ts` (moved into repo `src/wallet-core`)
 */

import { generateMnemonic as scureGenerate, mnemonicToSeedSync, validateMnemonic as scureValidate } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

export function generateMnemonic(): string {
  try {
    // @ts-ignore
    return scureGenerate(256, wordlist);
  } catch (e) {
    // @ts-ignore
    return scureGenerate();
  }
}

export function validateMnemonic(mnemonic: string): boolean {
  try {
    return scureValidate(mnemonic);
  } catch (e) {
    return false;
  }
}

export function mnemonicToSeed(mnemonic: string, passphrase = ""): Uint8Array {
  // @ts-ignore
  const seed = mnemonicToSeedSync(mnemonic, passphrase);
  return seed as Uint8Array;
}
