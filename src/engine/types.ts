/**
 * engine/types.ts
 *
 * Contracts the wallet engine depends on. Everything that touches the outside
 * world (the seed store, the approval screen, the blockchain) is injected so the
 * engine can be tested without a network and so Nomad screens never see keys.
 */

import type { NomadTransactionHistoryItem } from "../../mobile/nomad/adapters/walletAdapter";

/** The engine is TESTNET-ONLY. These are the only chains it will touch. */
export const BITCOIN_TESTNET_ID = "bitcoin-testnet";
export const EVM_SEPOLIA_ID = "evm-sepolia";
export const SEPOLIA_CHAIN_ID = 11155111;
export type EngineChainId = typeof BITCOIN_TESTNET_ID | typeof EVM_SEPOLIA_ID;

/**
 * Where the seed lives. The engine NEVER stores the seed: it asks for a fresh
 * copy for each signing or derivation step and wipes it afterwards.
 */
export interface SessionAuthority {
  hasWallet(): Promise<boolean>;
  isUnlocked(): Promise<boolean>;
  /** Returns a fresh copy of the seed. Must throw if the wallet is locked. */
  getSeed(): Promise<Uint8Array>;
  lock(): Promise<void>;
}

export interface TransactionReview {
  chainId: EngineChainId;
  fromAddress: string;
  toAddress: string;
  amount: string;
  assetSymbol: string;
  feeEstimate: string;
  feeAssetSymbol: string;
  memo?: string;
}

/** Every signature requires the owner to approve a human-readable review. */
export interface ApprovalGate {
  requestApproval(review: TransactionReview): Promise<boolean>;
}

export interface BitcoinUtxo {
  txid: string;
  vout: number;
  value: bigint; // satoshis
}

export interface BitcoinProvider {
  getUtxos(address: string): Promise<BitcoinUtxo[]>;
  /** Suggested fee rate in satoshis per virtual byte. */
  getFeeRateSatPerVb(): Promise<number>;
  /** Broadcasts a raw hex transaction and returns its txid. */
  broadcast(rawHex: string): Promise<string>;
  getHistory?(addresses: string[]): Promise<NomadTransactionHistoryItem[]>;
}

export interface EvmChainProvider {
  getBalance(address: string): Promise<bigint>;
  getNonce(address: string): Promise<number>;
  getFeeData(): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }>;
  estimateGas(tx: { from: string; to: string; value: bigint }): Promise<bigint>;
  /** Broadcasts a raw signed transaction and returns its hash. */
  broadcast(rawHex: string): Promise<string>;
  getHistory?(address: string): Promise<NomadTransactionHistoryItem[]>;
}

export interface EngineConfig {
  session: SessionAuthority;
  approval: ApprovalGate;
  bitcoin?: BitcoinProvider;
  evm?: EvmChainProvider;
  now?: () => Date;
}
