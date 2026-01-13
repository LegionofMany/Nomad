/**
 * chains/bitcoin.ts
 *
 * Bitcoin helpers to build and sign transactions (legacy P2PKH / BIP44 m/44')
 * - Does not broadcast by default; returns raw tx hex ready for broadcast
 * - Uses `bip32` + `bitcoinjs-lib` and derives private keys from mnemonic
 */

import * as bip32 from "bip32";
import { payments, Psbt, networks as bitcoinNetworks } from "bitcoinjs-lib";
import { mnemonicToSeed } from "../wallet-core/seed";

export interface Utxo {
  txid: string;
  vout: number;
  value: number; // satoshis
  scriptPubKey?: string;
}

export interface BtcNetworkOptions {
  network?: "bitcoin" | "testnet";
}

function networkByName(name?: string) {
  return name === "testnet" ? bitcoinNetworks.testnet : bitcoinNetworks.bitcoin;
}

/**
 * Derive private key Buffer from mnemonic and BIP44 path index.
 */
function derivePrivateKey(mnemonic: string, index = 0) {
  const seed = mnemonicToSeed(mnemonic);
  const root = bip32.fromSeed(Buffer.from(seed));
  const path = `m/44'/0'/0'/0/${index}`;
  const child = root.derivePath(path);
  if (!child.privateKey) throw new Error("failed to derive private key");
  return child.privateKey;
}

/**
 * Build and sign a simple P2PKH Bitcoin transaction spending provided UTXOs to a single recipient.
 * Returns raw transaction hex (ready to broadcast).
 *
 * Note: This function assumes inputs belong to the derived address; fee must be provided.
 */
export function buildAndSignTransaction(mnemonic: string, index: number, utxos: Utxo[], to: string, amountSats: number, feeSats: number, opts?: BtcNetworkOptions): string {
  const network = networkByName(opts?.network);
  const key = derivePrivateKey(mnemonic, index);

  const psbt = new Psbt({ network });

  let inputSum = 0;
  for (const u of utxos) {
    inputSum += u.value;
    psbt.addInput({ hash: u.txid, index: u.vout, nonWitnessUtxo: Buffer.from(u.scriptPubKey || "", "hex") });
  }

  const change = inputSum - amountSats - feeSats;
  if (change < 0) throw new Error("insufficient funds");

  psbt.addOutput({ script: payments.p2pkh({ address: to, network }).output!, value: amountSats });
  if (change > 0) psbt.addOutput({ script: payments.p2pkh({ address: payments.p2pkh({ pubkey: bip32.fromSeed(Buffer.from(mnemonicToSeed(mnemonic))).publicKey, network }).address!, network }).output!, value: change });

  // Sign all inputs with same key
  const keyPair = bip32.fromSeed(Buffer.from(mnemonicToSeed(mnemonic))).derivePath(`m/44'/0'/0'/0/${index}`);
  const priv = keyPair.privateKey as Buffer;
  for (let i = 0; i < utxos.length; i++) {
    psbt.signInput(i, { publicKey: keyPair.publicKey, sign: (hash: Buffer) => { const ecdsa = require('tiny-secp256k1'); return ecdsa.sign(hash, priv); } } as any);
  }

  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction().toHex();
  return tx;
}
