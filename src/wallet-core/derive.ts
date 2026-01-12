/**
 * wallet-core `derive.ts` (moved into repo `src/wallet-core`)
 */

import { Mnemonic } from "./types";
import { Wallet } from "ethers";

export function deriveEvmAccount(mnemonic: Mnemonic, index = 0): { address: string; path: string } {
  const path = `m/44'/60'/0'/0/${index}`;
  const wallet = Wallet.fromMnemonic(mnemonic, path);
  return { address: wallet.address, path };
}

export function deriveBtcAccount(_mnemonic: Mnemonic, index = 0): { address: string; path: string } {
  const path = `m/44'/0'/0'/0/${index}`;
  return { address: "<derive-btc-address-IMPLEMENT_ME>", path };
}
