/**
 * wallet-core `derive.ts`
 *
 * Responsibilities:
 * - Provide helper functions to derive account keys for EVM (Ethereum) and
 *   Bitcoin (BIP44) from a BIP39 mnemonic/seed. For EVM we use `ethers` helper
 *   since it provides a convenient and well-tested HD derivation API.
 * - By default the functions return only public information (address, xpub)
 *   and will not log or expose private keys unless explicitly requested by
 *   a well-audited caller.
 */

import { Mnemonic } from "./types";
import { Wallet } from "ethers";

/**
 * Derive a single Ethereum account (address + path) from a mnemonic.
 * - `index` selects the account index in the account chain (m/44'/60'/0'/0/index)
 * Returns the address and the derivation path used.
 */
export function deriveEvmAccount(mnemonic: Mnemonic, index = 0): { address: string; path: string } {
  const path = `m/44'/60'/0'/0/${index}`;
  const wallet = Wallet.fromMnemonic(mnemonic, path);
  return { address: wallet.address, path };
}

/**
 * Derive a single Bitcoin address (P2PKH m/44'/0'/0'/0/index) - light-weight
 * implementation that returns the path and a placeholder address. Implementing
 * a full Bitcoin derivation (and address format conversion) should use
 * `bip32` + `bitcoinjs-lib` and take the network (testnet/mainnet) as input.
 *
 * For phase A we provide a TODO placeholder to avoid exposing raw privkeys here.
 */
export function deriveBtcAccount(_mnemonic: Mnemonic, index = 0): { address: string; path: string } {
  const path = `m/44'/0'/0'/0/${index}`;
  // TODO: derive using bip32 + bitcoinjs-lib and return an address appropriate
  // for the network. For now return a placeholder so consumers can be built.
  return { address: "<derive-btc-address-IMPLEMENT_ME>", path };
}
