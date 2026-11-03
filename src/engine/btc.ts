/**
 * engine/btc.ts
 *
 * Plans and signs native SegWit (P2WPKH) Bitcoin TESTNET transactions.
 * Safety limits: fee-rate cap, absolute fee cap, dust handling, and exact
 * (not floating point) satoshi arithmetic.
 */

import { Psbt, networks } from "bitcoinjs-lib";
import type { BitcoinKey } from "./derive";
import type { BitcoinUtxo } from "./types";
import { invalid } from "./errors";

const DUST_SATS = 546n;
const MAX_FEE_RATE_SAT_PER_VB = 500;
const MAX_FEE_SATS = 1_000_000n; // 0.01 BTC: refuse anything above this

/** A coin and which of our two addresses holds it. No key material is stored in a plan. */
export interface OwnedUtxo extends BitcoinUtxo {
  kind: "receive" | "change";
}

export interface BitcoinSigningKeys {
  receive: BitcoinKey;
  change: BitcoinKey;
}

export interface BitcoinSendPlan {
  inputs: OwnedUtxo[];
  toAddress: string;
  amountSats: bigint;
  changeSats: bigint;
  changeAddress: string;
  feeSats: bigint;
  vbytes: number;
}

/** Approximate size of a P2WPKH transaction in virtual bytes. */
const vbytesFor = (inputs: number, outputs: number) => 11 + 68 * inputs + 31 * outputs;

export function planBitcoinSend(args: {
  utxos: OwnedUtxo[];
  toAddress: string;
  amountSats: bigint;
  feeRateSatPerVb: number;
  changeAddress: string;
}): BitcoinSendPlan {
  const { utxos, toAddress, amountSats, changeAddress } = args;
  const rate = args.feeRateSatPerVb;
  if (!Number.isFinite(rate) || rate <= 0) throw invalid("The network returned an unusable fee rate. Try again.");
  if (rate > MAX_FEE_RATE_SAT_PER_VB) {
    throw invalid(`The network fee rate (${rate} sat/vB) is unusually high, so the send was blocked. Try again later.`);
  }
  const rateBig = BigInt(Math.max(1, Math.ceil(rate)));

  const sorted = [...utxos].sort((a, b) => (a.value > b.value ? -1 : a.value < b.value ? 1 : 0));
  const selected: OwnedUtxo[] = [];
  let total = 0n;

  for (const utxo of sorted) {
    selected.push(utxo);
    total += utxo.value;

    const feeNoChange = BigInt(vbytesFor(selected.length, 1)) * rateBig;
    if (total < amountSats + feeNoChange) continue;

    const feeWithChange = BigInt(vbytesFor(selected.length, 2)) * rateBig;
    const change = total - amountSats - feeWithChange;
    const hasChange = change >= DUST_SATS;
    const feeSats = hasChange ? feeWithChange : total - amountSats; // dust change is absorbed into the fee
    if (feeSats > MAX_FEE_SATS) throw invalid("The network fee is too high for this send, so it was blocked.");

    return {
      inputs: selected,
      toAddress,
      amountSats,
      changeSats: hasChange ? change : 0n,
      changeAddress,
      feeSats,
      vbytes: vbytesFor(selected.length, hasChange ? 2 : 1),
    };
  }

  throw invalid("Insufficient funds to cover the amount and the network fee.");
}

export function signBitcoinPlan(plan: BitcoinSendPlan, keys: BitcoinSigningKeys): { rawHex: string; txid: string } {
  const psbt = new Psbt({ network: networks.testnet });
  for (const u of plan.inputs) {
    psbt.addInput({
      hash: u.txid,
      index: u.vout,
      witnessUtxo: { script: keys[u.kind].script, value: Number(u.value) },
    });
  }
  psbt.addOutput({ address: plan.toAddress, value: Number(plan.amountSats) });
  if (plan.changeSats > 0n) psbt.addOutput({ address: plan.changeAddress, value: Number(plan.changeSats) });

  plan.inputs.forEach((u, i) => psbt.signInput(i, keys[u.kind].node));
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();
  return { rawHex: tx.toHex(), txid: tx.getId() };
}

export function formatSats(sats: bigint): string {
  const whole = sats / 100_000_000n;
  const frac = (sats % 100_000_000n).toString().padStart(8, "0");
  return `${whole}.${frac}`;
}
