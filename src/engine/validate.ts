/**
 * engine/validate.ts
 *
 * Strict input checks. Anything that does not pass is rejected before a fee is
 * estimated or a key is touched. Mainnet addresses are rejected on purpose.
 */

import { address as btcAddress, networks } from "bitcoinjs-lib";
import { getAddress, isAddress, parseUnits } from "ethers";
import { invalid } from "./errors";

const SATS_PER_BTC = 100_000_000n;
const MAX_SATS = 21_000_000n * SATS_PER_BTC;

/** Parses a decimal BTC string (max 8 decimals) into satoshis. */
export function parseBtcAmountToSats(amount: string): bigint {
  if (typeof amount !== "string" || !/^\d+(\.\d{1,8})?$/.test(amount.trim())) {
    throw invalid("Enter a valid amount with at most 8 decimal places.");
  }
  const [whole, frac = ""] = amount.trim().split(".");
  const sats = BigInt(whole) * SATS_PER_BTC + BigInt(frac.padEnd(8, "0"));
  if (sats <= 0n) throw invalid("The amount must be greater than zero.");
  if (sats > MAX_SATS) throw invalid("The amount is larger than the total Bitcoin supply.");
  return sats;
}

/** Parses a decimal ETH string (max 18 decimals) into wei. */
export function parseEthAmountToWei(amount: string): bigint {
  if (typeof amount !== "string" || !/^\d+(\.\d{1,18})?$/.test(amount.trim())) {
    throw invalid("Enter a valid amount with at most 18 decimal places.");
  }
  const wei = parseUnits(amount.trim(), 18);
  if (wei <= 0n) throw invalid("The amount must be greater than zero.");
  return wei;
}

/** Accepts Bitcoin TESTNET addresses only. A mainnet address throws. */
export function assertBitcoinTestnetAddress(address: string): string {
  if (typeof address !== "string" || address.trim().length === 0) throw invalid("Enter a recipient address.");
  const trimmed = address.trim();
  try {
    btcAddress.toOutputScript(trimmed, networks.testnet);
  } catch {
    throw invalid("That is not a valid Bitcoin testnet address. Mainnet addresses are not accepted by this wallet.");
  }
  return trimmed;
}

/** Accepts a valid EVM address (checksum enforced when mixed case). Returns the checksummed form. */
export function assertEvmAddress(address: string): string {
  if (typeof address !== "string" || !isAddress(address.trim())) {
    throw invalid("That is not a valid Ethereum address, or its checksum is wrong.");
  }
  return getAddress(address.trim());
}
