/**
 * wallet-core `derive.ts` (moved into repo `src/wallet-core`)
 */

import { Mnemonic } from "./types";
import { Wallet } from "ethers";
import { mnemonicToSeed } from "./seed";
// bip32 has no bundled types in this workspace; require at runtime and silence TS.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const bip32 = require("bip32");
import { payments, networks as bitcoinNetworks } from "bitcoinjs-lib";

export function deriveEvmAccount(mnemonic: Mnemonic, index = 0): { address: string; path: string } {
  const path = `m/44'/60'/0'/0/${index}`;
  // Call the runtime helper to derive a wallet from mnemonic and path.
  // Some `ethers` versions expose `Wallet.fromMnemonic` or `Wallet.fromPhrase`.
  // Use a typed escape to call the method when it's available at runtime.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let wallet;
  // prefer fromMnemonic if present
  if ((Wallet as any).fromMnemonic) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    wallet = (Wallet as any).fromMnemonic(mnemonic, path);
  }
  else if ((Wallet as any).fromPhrase) {
    // ethers v6 exposes fromPhrase
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    wallet = (Wallet as any).fromPhrase(mnemonic, path);
  }
  else {
    throw new Error('No supported Wallet.fromMnemonic/fromPhrase available in installed ethers version');
  }
  return { address: wallet.address, path };
}

export function deriveBtcAccount(_mnemonic: Mnemonic, index = 0): { address: string; path: string } {
  const path = `m/44'/0'/0'/0/${index}`;
  // Convert mnemonic -> seed and derive HD node
  const seed = mnemonicToSeed(_mnemonic);
  const root = bip32.fromSeed(Buffer.from(seed));
  const child = root.derivePath(path);
  if (!child.publicKey) {
    throw new Error("Failed to derive child public key");
  }
  // Use P2PKH (legacy) address format for BIP44
  const { address } = payments.p2pkh({ pubkey: child.publicKey, network: bitcoinNetworks.bitcoin });
  return { address: address || "", path };
}
