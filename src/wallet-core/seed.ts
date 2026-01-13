/**
 * wallet-core `seed.ts` (moved into repo `src/wallet-core`)
 */

import { generateMnemonic as scureGenerate, mnemonicToSeedSync, validateMnemonic as scureValidate } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

// `@scure/bip39`'s published `wordlist` may be a newline-delimited string in
// some package builds. Normalize it to an array of words for runtime use.
const englishWordlist: string[] = Array.isArray(wordlist)
  ? (wordlist as unknown as string[])
  : (typeof wordlist === "string" ? (wordlist as string).split(/\r?\n/).filter(Boolean) : []);

export function generateMnemonic(): string {
  try {
      // Preferred call: (wordlist, strength)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return scureGenerate(englishWordlist as any, 256);
    } catch (e) {
      try {
        // Fallback: try calling with just the wordlist
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return scureGenerate(englishWordlist as any);
      } catch (err) {
        // Give up; rethrow original
        throw e;
      }
    }
  }
export function validateMnemonic(mnemonic: string): boolean {
  try {
    // `@scure/bip39` requires the wordlist to be passed for validation
    return scureValidate(mnemonic, englishWordlist as unknown as string[]);
  } catch (e) {
    return false;
  }
}

export function mnemonicToSeed(mnemonic: string, passphrase = ""): Uint8Array {
  // @ts-ignore
  const seed = mnemonicToSeedSync(mnemonic, passphrase);
  return seed as Uint8Array;
}
