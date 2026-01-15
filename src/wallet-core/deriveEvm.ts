/**
 * wallet-core `deriveEvm.ts`
 *
 * Mobile-friendly EVM address derivation that avoids importing BTC/bip32
 * dependencies (which may rely on Node-only globals).
 */

import { Mnemonic } from "./types";
import { Wallet } from "ethers";

export function deriveEvmAccount(mnemonic: Mnemonic, index = 0): { address: string; path: string } {
  const path = `m/44'/60'/0'/0/${index}`;

  // ethers v5: Wallet.fromMnemonic
  // ethers v6: Wallet.fromPhrase
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if ((Wallet as any).fromMnemonic) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const wallet = (Wallet as any).fromMnemonic(mnemonic, path);
    return { address: wallet.address, path };
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if ((Wallet as any).fromPhrase) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const wallet = (Wallet as any).fromPhrase(mnemonic, path);
    return { address: wallet.address, path };
  }

  throw new Error("No supported Wallet.fromMnemonic/fromPhrase available in installed ethers version");
}
