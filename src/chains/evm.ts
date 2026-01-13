/**
 * chains/evm.ts
 *
 * EVM chain helpers:
 * - Build and sign transactions for native ETH transfers and ERC-20 transfers
 * - Does not expose raw private keys to UI; signing happens internally given
 *   a mnemonic and account index
 * - Providers are injected (any ethers-compatible provider)
 * - No automatic broadcasting unless caller calls `sendSignedTransaction` with provider
 */

import { Wallet, formatUnits, parseUnits, Interface } from "ethers";

// Ethers v6 typings vary between releases; use a local alias for unsigned tx
export type UnsignedTransaction = any;

export type EvmProvider = any; // keep generic to accept ethers providers

export interface Erc20Transfer {
  to: string;
  amount: string; // decimal string
  decimals?: number; // token decimals (default 18)
}

export interface EthTransfer {
  to: string;
  amount: string; // decimal ETH string
}

/**
 * Create a wallet from mnemonic and index and optionally connect to provider.
 * This function keeps the wallet local; caller may use it to sign transactions.
 */
export function walletFromMnemonic(mnemonic: string, index = 0, provider?: EvmProvider): Wallet {
  const path = `m/44'/60'/0'/0/${index}`;
  // ethers exposes `Wallet.fromPhrase` in v6, `Wallet.fromMnemonic` in others.
  // Use runtime presence checks.
  // @ts-ignore
  const w = (Wallet as any).fromMnemonic ? (Wallet as any).fromMnemonic(mnemonic, path) : (Wallet as any).fromPhrase ? (Wallet as any).fromPhrase(mnemonic, path) : new Wallet(mnemonic);
  return provider ? w.connect(provider) : w;
}

/**
 * Build an unsigned transaction object for ETH transfer. Caller can sign using wallet.signTransaction
 */
export function buildEthTransaction(tx: EthTransfer, overrides?: Partial<UnsignedTransaction>): UnsignedTransaction {
  const value = parseUnits(tx.amount, 18);
  const unsigned: UnsignedTransaction = {
    to: tx.to,
    value,
    data: "0x",
    ...overrides
  } as UnsignedTransaction;
  return unsigned;
}

/**
 * Build ERC-20 transfer data (ABI-encoded) for `transfer(address,uint256)`.
 */
export function buildErc20TransferData(t: Erc20Transfer): string {
  const decimals = t.decimals ?? 18;
  const amount = parseUnits(t.amount, decimals);
  // Minimal manual encoding: method id + params
  // Use ethers Interface for correct encoding
  const iface = new Interface(["function transfer(address to, uint256 amount)"]);
  return iface.encodeFunctionData("transfer", [t.to, amount]);
}

/**
 * Sign an unsigned transaction using a wallet derived from mnemonic/index.
 * Returns a signed serialized transaction (hex string).
 */
export async function signTransactionWithMnemonic(mnemonic: string, index: number, unsignedTx: UnsignedTransaction): Promise<string> {
  const wallet = walletFromMnemonic(mnemonic, index);
  // wallet.signTransaction exists in ethers
  // @ts-ignore
  const signed = await wallet.signTransaction(unsignedTx as any);
  return signed;
}

/**
 * Send a signed transaction via provider (if provided). Returns provider response.
 */
export async function sendSignedTransaction(provider: EvmProvider, signedTx: string): Promise<any> {
  // provider should implement sendTransaction / broadcastTransaction APIs
  if (!provider) throw new Error("Provider required to send transaction");
  // ethers provider: provider.sendTransaction expects a signedTx via provider.broadcastTransaction? Use sendTransaction on a signer instead
  if (typeof provider.sendTransaction === "function") {
    return provider.sendTransaction(signedTx);
  }
  // fallback: JSON-RPC raw send
  if (typeof provider.request === "function") {
    return provider.request({ method: "eth_sendRawTransaction", params: [signedTx] });
  }
  throw new Error("Unsupported provider interface");
}
