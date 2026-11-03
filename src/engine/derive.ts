/**
 * engine/derive.ts
 *
 * Key derivation straight from the wallet seed (never from a stored phrase).
 *   Bitcoin testnet : BIP84 native SegWit  m/84'/1'/0'/{0|1}/index  (tb1q... addresses)
 *   Ethereum Sepolia: BIP44                m/44'/60'/0'/0/index
 */

import { fromSeed } from "bip32";
import { payments, networks } from "bitcoinjs-lib";

/** The parts of a bip32 node the engine uses (the package is declared without types in this repo). */
export interface Bip32Node {
  publicKey: Buffer;
  privateKey?: Buffer;
  derivePath(path: string): Bip32Node;
  sign(hash: Buffer, lowR?: boolean): Buffer;
}
import { HDNodeWallet } from "ethers";

export const BTC_TESTNET_RECEIVE_PATH = (index: number) => `m/84'/1'/0'/0/${index}`;
export const BTC_TESTNET_CHANGE_PATH = (index: number) => `m/84'/1'/0'/1/${index}`;
export const EVM_PATH = (index: number) => `m/44'/60'/0'/0/${index}`;

export interface BitcoinKey {
  address: string;
  path: string;
  node: Bip32Node;
  script: Buffer;
}

export function deriveBitcoinTestnetKey(seed: Uint8Array, index = 0, change = false): BitcoinKey {
  const root = fromSeed(Buffer.from(seed), networks.testnet);
  const path = change ? BTC_TESTNET_CHANGE_PATH(index) : BTC_TESTNET_RECEIVE_PATH(index);
  const node = root.derivePath(path);
  const payment = payments.p2wpkh({ pubkey: node.publicKey, network: networks.testnet });
  if (!payment.address || !payment.output) throw new Error("Failed to derive a Bitcoin testnet address");
  return { address: payment.address, path, node, script: payment.output };
}

export interface EvmKey {
  address: string;
  path: string;
  privateKey: string;
}

export function deriveEvmKey(seed: Uint8Array, index = 0): EvmKey {
  const path = EVM_PATH(index);
  const node = HDNodeWallet.fromSeed(seed).derivePath(path);
  return { address: node.address, path, privateKey: node.privateKey };
}

/** Best-effort wipe of a seed copy once it is no longer needed. */
export function wipe(bytes: Uint8Array | null | undefined): void {
  if (bytes) bytes.fill(0);
}
