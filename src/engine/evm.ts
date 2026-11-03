/**
 * engine/evm.ts
 *
 * Plans and signs native-coin transfers on Ethereum SEPOLIA (testnet) using
 * EIP-1559 transactions. Fee caps and a balance check run before signing.
 */

import { Transaction, Wallet } from "ethers";
import type { EvmChainProvider } from "./types";
import { SEPOLIA_CHAIN_ID } from "./types";
import { invalid } from "./errors";

const MAX_FEE_PER_GAS_WEI = 1_000n * 1_000_000_000n; // 1000 gwei cap
const MIN_GAS_LIMIT = 21_000n;

export interface EvmTransferPlan {
  from: string;
  to: string;
  valueWei: bigint;
  nonce: number;
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  chainId: number;
  maxFeeWei: bigint;
}

export async function planEvmTransfer(
  provider: EvmChainProvider,
  from: string,
  to: string,
  valueWei: bigint
): Promise<EvmTransferPlan> {
  const [nonce, fees, estimate, balance] = await Promise.all([
    provider.getNonce(from),
    provider.getFeeData(),
    provider.estimateGas({ from, to, value: valueWei }),
    provider.getBalance(from),
  ]);

  if (fees.maxFeePerGas <= 0n || fees.maxFeePerGas > MAX_FEE_PER_GAS_WEI) {
    throw invalid("The network fee is unusually high or unavailable, so the send was blocked. Try again later.");
  }
  if (fees.maxPriorityFeePerGas > fees.maxFeePerGas) {
    throw invalid("The network returned inconsistent fee data. Try again.");
  }

  let gasLimit = estimate + estimate / 10n; // 10% safety margin
  if (gasLimit < MIN_GAS_LIMIT) gasLimit = MIN_GAS_LIMIT;

  const maxFeeWei = gasLimit * fees.maxFeePerGas;
  if (balance < valueWei + maxFeeWei) throw invalid("Insufficient funds to cover the amount and the network fee.");

  return {
    from,
    to,
    valueWei,
    nonce,
    gasLimit,
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    chainId: SEPOLIA_CHAIN_ID,
    maxFeeWei,
  };
}

export async function signEvmTransfer(plan: EvmTransferPlan, privateKey: string): Promise<{ rawHex: string; hash: string }> {
  const wallet = new Wallet(privateKey);
  if (wallet.address !== plan.from) throw invalid("Signing key does not match the sending account.");

  const rawHex = await wallet.signTransaction({
    type: 2,
    chainId: plan.chainId,
    nonce: plan.nonce,
    to: plan.to,
    value: plan.valueWei,
    gasLimit: plan.gasLimit,
    maxFeePerGas: plan.maxFeePerGas,
    maxPriorityFeePerGas: plan.maxPriorityFeePerGas,
  });

  const parsed = Transaction.from(rawHex);
  if (!parsed.hash || parsed.from !== plan.from || parsed.chainId !== BigInt(SEPOLIA_CHAIN_ID)) {
    throw invalid("The signed transaction failed its self-check and was discarded.");
  }
  return { rawHex, hash: parsed.hash };
}
