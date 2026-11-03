/**
 * engine/providers.ts
 *
 * Real network connections for the TESTNET engine.
 *   Bitcoin testnet : Esplora REST API (default: Blockstream testnet)
 *   Ethereum Sepolia: any Sepolia JSON-RPC endpoint (via ethers)
 *
 * Only public addresses and signed transactions ever leave the device.
 * NOTE: unit-tested with a fake network only; run against the live testnet
 * with a funded test wallet before relying on it.
 */

import { JsonRpcProvider } from "ethers";
import type { NomadTransactionHistoryItem } from "../../mobile/nomad/adapters/walletAdapter";
import type { BitcoinProvider, BitcoinUtxo, EvmChainProvider } from "./types";
import { BITCOIN_TESTNET_ID, SEPOLIA_CHAIN_ID } from "./types";
import { NomadEngineError } from "./errors";

export type FetchLike = (
  url: string,
  init?: { method?: string; body?: string; headers?: Record<string, string> }
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export const DEFAULT_ESPLORA_TESTNET_URL = "https://blockstream.info/testnet/api";
const REQUEST_TIMEOUT_MS = 15_000;

const netError = (msg: string) => new NomadEngineError("missing_provider", msg, true);

async function request(fetchFn: FetchLike, url: string, init?: { method?: string; body?: string }): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const res = await Promise.race([
      fetchFn(url, init),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), REQUEST_TIMEOUT_MS);
      }),
    ]);
    const text = await res.text();
    if (!res.ok) throw netError(`The network returned an error (${res.status}). ${text.slice(0, 120)}`);
    return text;
  } catch (e) {
    if (e instanceof NomadEngineError) throw e;
    throw netError("Could not reach the Bitcoin testnet network. Check your connection and try again.");
  } finally {
    if (timer) clearTimeout(timer);
  }
}

interface EsploraTx {
  txid: string;
  vin: { prevout?: { scriptpubkey_address?: string; value: number } }[];
  vout: { scriptpubkey_address?: string; value: number }[];
  status: { confirmed: boolean; block_time?: number };
}

export function createEsploraProvider(
  baseUrl: string = DEFAULT_ESPLORA_TESTNET_URL,
  fetchFn: FetchLike = (globalThis as any).fetch
): BitcoinProvider {
  if (!/^https:\/\//.test(baseUrl)) throw new Error("Esplora URL must use https");
  if (typeof fetchFn !== "function") throw new Error("No fetch implementation available");
  const base = baseUrl.replace(/\/+$/, "");

  return {
    async getUtxos(address): Promise<BitcoinUtxo[]> {
      const list = JSON.parse(await request(fetchFn, `${base}/address/${address}/utxo`)) as {
        txid: string;
        vout: number;
        value: number;
      }[];
      return list.map((u) => ({ txid: u.txid, vout: u.vout, value: BigInt(u.value) }));
    },

    async getFeeRateSatPerVb() {
      const est = JSON.parse(await request(fetchFn, `${base}/fee-estimates`)) as Record<string, number>;
      const rate = est["3"] ?? est["6"] ?? est["12"] ?? est["1"];
      return typeof rate === "number" && rate > 0 ? Math.max(1, Math.ceil(rate)) : 2;
    },

    async broadcast(rawHex) {
      if (!/^[0-9a-f]+$/i.test(rawHex)) throw new Error("Refusing to broadcast malformed data");
      return (await request(fetchFn, `${base}/tx`, { method: "POST", body: rawHex })).trim();
    },

    async getHistory(addresses): Promise<NomadTransactionHistoryItem[]> {
      const mine = new Set(addresses);
      const seen = new Map<string, EsploraTx>();
      for (const a of addresses) {
        const txs = JSON.parse(await request(fetchFn, `${base}/address/${a}/txs`)) as EsploraTx[];
        for (const t of txs) seen.set(t.txid, t);
      }
      return [...seen.values()].map((t) => {
        const spent = t.vin.reduce(
          (s, i) => (i.prevout?.scriptpubkey_address && mine.has(i.prevout.scriptpubkey_address) ? s + i.prevout.value : s),
          0
        );
        const back = t.vout.reduce((s, o) => (o.scriptpubkey_address && mine.has(o.scriptpubkey_address) ? s + o.value : s), 0);
        const net = back - spent;
        const sent = net < 0;
        const other = t.vout.find((o) => o.scriptpubkey_address && !mine.has(o.scriptpubkey_address))?.scriptpubkey_address;
        const abs = BigInt(Math.abs(net));
        const amount = `${abs / 100_000_000n}.${(abs % 100_000_000n).toString().padStart(8, "0")}`;
        return {
          id: t.txid,
          txHash: t.txid,
          assetSymbol: "tBTC",
          amount,
          direction: sent ? "sent" : "received",
          status: t.status.confirmed ? "confirmed" : "pending",
          counterparty: sent ? other : t.vin[0]?.prevout?.scriptpubkey_address,
          chainId: BITCOIN_TESTNET_ID,
          timestamp: new Date((t.status.block_time ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
        } as NomadTransactionHistoryItem;
      });
    },
  };
}

/** Sepolia over JSON-RPC. The RPC URL is configuration (use your own provider key in production). */
export function createSepoliaProvider(rpcUrl: string): EvmChainProvider {
  if (!/^https:\/\//.test(rpcUrl)) throw new Error("Sepolia RPC URL must use https");
  const rpc = new JsonRpcProvider(rpcUrl, SEPOLIA_CHAIN_ID, { staticNetwork: true });

  return {
    getBalance: (address) => rpc.getBalance(address),
    getNonce: (address) => rpc.getTransactionCount(address, "pending"),
    async getFeeData() {
      const f = await rpc.getFeeData();
      if (f.maxFeePerGas == null || f.maxPriorityFeePerGas == null) throw netError("The network did not return fee data.");
      return { maxFeePerGas: f.maxFeePerGas, maxPriorityFeePerGas: f.maxPriorityFeePerGas };
    },
    estimateGas: (tx) => rpc.estimateGas(tx),
    async broadcast(rawHex) {
      const res = await rpc.broadcastTransaction(rawHex);
      return res.hash;
    },
    // Sepolia history needs an indexer (plain RPC cannot list by address), so it is intentionally not provided.
  };
}
