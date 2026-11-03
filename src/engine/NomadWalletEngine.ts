/**
 * engine/NomadWalletEngine.ts
 *
 * TESTNET-ONLY wallet engine behind the Nomad bridge (`ClonedWalletEngineBridge`).
 *
 * Rules enforced here, in code, not just in documentation:
 *  - The seed is never stored. It is fetched per operation and wiped afterwards.
 *  - Every signature needs explicit owner approval of a readable review.
 *  - Only chains in this file are reachable. Mainnet is refused.
 *  - Broadcast only accepts transactions this engine signed in this session.
 *  - Locking clears every cache and pending transaction.
 */

import { formatEther } from "ethers";
import type { ClonedWalletEngineBridge } from "../../mobile/nomad/adapters/clonedWalletAdapterTemplate";
import type {
  NomadAsset,
  NomadBroadcastResult,
  NomadChain,
  NomadRecoveryAuthorization,
  NomadSignedTransaction,
  NomadTransactionDraft,
  NomadTransactionHistoryItem,
  NomadWalletAccount,
  NomadWalletProviderRestorationReceipt,
  NomadWalletSessionState,
} from "../../mobile/nomad/adapters/walletAdapter";
import { deriveBitcoinTestnetKey, deriveEvmKey, wipe } from "./derive";
import type { BitcoinKey } from "./derive";
import { formatSats, planBitcoinSend, signBitcoinPlan } from "./btc";
import type { BitcoinSendPlan, OwnedUtxo } from "./btc";
import { planEvmTransfer, signEvmTransfer } from "./evm";
import type { EvmTransferPlan } from "./evm";
import { NomadEngineError, invalid, locked, noProvider, toFailure } from "./errors";
import { assertBitcoinTestnetAddress, assertEvmAddress, parseBtcAmountToSats, parseEthAmountToWei } from "./validate";
import { BITCOIN_TESTNET_ID, EVM_SEPOLIA_ID } from "./types";
import type { EngineChainId, EngineConfig, TransactionReview } from "./types";

const BTC_SYMBOLS = ["BTC", "TBTC"];
const EVM_SYMBOLS = ["ETH", "SEPOLIAETH"];
const MAX_PENDING = 20;

type Prepared =
  | { chainId: typeof BITCOIN_TESTNET_ID; review: TransactionReview; btc: BitcoinSendPlan }
  | { chainId: typeof EVM_SEPOLIA_ID; review: TransactionReview; evm: EvmTransferPlan };

interface Addresses {
  btcReceive: string;
  btcChange: string;
  evm: string;
}

const accountIdFor = (chainId: EngineChainId) => `${chainId}-0`;

export class NomadWalletEngine implements ClonedWalletEngineBridge {
  private readonly cfg: EngineConfig;
  private addresses: Addresses | null = null;
  private pending = new Map<string, { chainId: EngineChainId; raw: string }>();

  constructor(config: EngineConfig) {
    this.cfg = config;
  }

  // ---- session ---------------------------------------------------------

  async getSessionState(): Promise<NomadWalletSessionState> {
    if (!(await this.cfg.session.hasWallet())) return { status: "no_wallet" };
    const unlocked = await this.cfg.session.isUnlocked();
    if (!unlocked) this.clearSessionData();
    return {
      status: unlocked ? "unlocked" : "locked",
      activeAccountId: accountIdFor(BITCOIN_TESTNET_ID),
      activeChainId: BITCOIN_TESTNET_ID,
    };
  }

  async lockWallet(): Promise<void> {
    await this.cfg.session.lock();
    this.clearSessionData();
  }

  /** Unlocking happens in the unlock flow (password + Time Key). The engine only confirms it. */
  async unlockWallet(): Promise<void> {
    if (!(await this.cfg.session.isUnlocked())) {
      throw new NomadEngineError("wallet_locked", "Unlock the wallet with your password and Time Key first.", true);
    }
    await this.loadAddresses();
  }

  // ---- chains, accounts, balances -------------------------------------

  async getSupportedChains(): Promise<NomadChain[]> {
    return [
      { id: BITCOIN_TESTNET_ID, name: "Bitcoin Testnet", family: "bitcoin", nativeAsset: "tBTC", testnet: true },
      { id: EVM_SEPOLIA_ID, name: "Ethereum Sepolia", family: "evm", nativeAsset: "SepoliaETH", testnet: true },
    ];
  }

  async getAccounts(): Promise<NomadWalletAccount[]> {
    const a = await this.loadAddresses();
    return [
      {
        id: accountIdFor(BITCOIN_TESTNET_ID),
        label: "Bitcoin Testnet",
        address: a.btcReceive,
        assetSymbol: "tBTC",
        chainId: BITCOIN_TESTNET_ID,
        derivationPath: "m/84'/1'/0'/0/0",
        isPrimary: true,
      },
      {
        id: accountIdFor(EVM_SEPOLIA_ID),
        label: "Ethereum Sepolia",
        address: a.evm,
        assetSymbol: "SepoliaETH",
        chainId: EVM_SEPOLIA_ID,
        derivationPath: "m/44'/60'/0'/0/0",
      },
    ];
  }

  async getAssets(): Promise<NomadAsset[]> {
    const { bitcoin, evm } = this.cfg;
    if (!bitcoin && !evm) throw noProvider("blockchain");
    const a = await this.loadAddresses();
    const assets: NomadAsset[] = [];

    if (bitcoin) {
      const utxos = [...(await bitcoin.getUtxos(a.btcReceive)), ...(await bitcoin.getUtxos(a.btcChange))];
      const total = utxos.reduce((sum, u) => sum + u.value, 0n);
      assets.push({
        symbol: "tBTC",
        name: "Bitcoin Testnet",
        balance: formatSats(total),
        fiatValueUsd: "0.00", // testnet coins have no market value
        network: "Bitcoin Testnet",
        chainId: BITCOIN_TESTNET_ID,
        accountId: accountIdFor(BITCOIN_TESTNET_ID),
      });
    }
    if (evm) {
      assets.push({
        symbol: "SepoliaETH",
        name: "Sepolia Ether",
        balance: formatEther(await evm.getBalance(a.evm)),
        fiatValueUsd: "0.00",
        network: "Ethereum Sepolia",
        chainId: EVM_SEPOLIA_ID,
        accountId: accountIdFor(EVM_SEPOLIA_ID),
      });
    }
    return assets;
  }

  /** Total fiat value. Testnet coins are worthless, so this is always 0.00. */
  async getWalletBalance(): Promise<string> {
    await this.getAssets();
    return "0.00";
  }

  async getReceiveAddress(assetSymbol: string, chainId?: string, accountId?: string): Promise<string> {
    const chain = this.resolveChain(assetSymbol, chainId);
    if (accountId && accountId !== accountIdFor(chain)) throw invalid("That account does not exist on this network.");
    const a = await this.loadAddresses();
    return chain === BITCOIN_TESTNET_ID ? a.btcReceive : a.evm;
  }

  // ---- transactions ----------------------------------------------------

  /** Validates the draft and estimates the fee. Nothing is signed. */
  async createTransaction(draft: NomadTransactionDraft): Promise<NomadSignedTransaction> {
    await this.prepare(draft);
    return { status: "created" };
  }

  /** Shows the owner a review and signs ONLY if they approve. */
  async signTransaction(draft: NomadTransactionDraft): Promise<NomadSignedTransaction> {
    const prepared = await this.prepare(draft);

    const approved = await this.cfg.approval.requestApproval(prepared.review);
    if (approved !== true) throw new NomadEngineError("rejected_signing", "You declined to sign this transaction.", true);
    await this.requireUnlocked(); // the wallet may have been locked while the review was open

    if (this.pending.size >= MAX_PENDING) this.pending.delete(this.pending.keys().next().value as string);

    if (prepared.chainId === BITCOIN_TESTNET_ID) {
      const { rawHex, txid } = await this.withSeed((seed) => {
        const keys = { receive: deriveBitcoinTestnetKey(seed, 0, false), change: deriveBitcoinTestnetKey(seed, 0, true) };
        try {
          return signBitcoinPlan(prepared.btc, keys);
        } finally {
          this.wipeKey(keys.receive);
          this.wipeKey(keys.change);
        }
      });
      this.pending.set(txid, { chainId: BITCOIN_TESTNET_ID, raw: rawHex });
      return { status: "signed", txHash: txid, rawTransaction: rawHex };
    }

    const { rawHex, hash } = await this.withSeed((seed) => signEvmTransfer(prepared.evm, deriveEvmKey(seed, 0).privateKey));
    this.pending.set(hash, { chainId: EVM_SEPOLIA_ID, raw: rawHex });
    return { status: "signed", txHash: hash, rawTransaction: rawHex };
  }

  /** Only broadcasts transactions this engine signed in this session. */
  async broadcastTransaction(signed: NomadSignedTransaction): Promise<NomadBroadcastResult> {
    const entry = signed.txHash ? this.pending.get(signed.txHash) : undefined;
    if (!entry || entry.raw !== signed.rawTransaction) {
      throw invalid("This wallet only sends transactions it has just signed. Create and approve the transaction again.");
    }
    const provider = entry.chainId === BITCOIN_TESTNET_ID ? this.cfg.bitcoin : this.cfg.evm;
    if (!provider) throw noProvider("blockchain");

    try {
      const txHash = await provider.broadcast(entry.raw);
      this.pending.delete(signed.txHash as string);
      return { txHash, status: "broadcasted", chainId: entry.chainId };
    } catch (error) {
      const failure = toFailure(error);
      return {
        txHash: signed.txHash as string,
        status: "failed",
        chainId: entry.chainId,
        failure: { code: "broadcast_failed", message: failure.message, recoverable: true },
      };
    }
  }

  async getTransactionHistory(accountId?: string): Promise<NomadTransactionHistoryItem[]> {
    const wantBtc = !accountId || accountId === accountIdFor(BITCOIN_TESTNET_ID);
    const wantEvm = !accountId || accountId === accountIdFor(EVM_SEPOLIA_ID);
    if (!wantBtc && !wantEvm) throw invalid("That account does not exist.");
    const a = await this.loadAddresses();
    const items: NomadTransactionHistoryItem[] = [];

    if (wantBtc) {
      if (!this.cfg.bitcoin?.getHistory) throw noProvider("Bitcoin transaction history");
      items.push(...(await this.cfg.bitcoin.getHistory([a.btcReceive, a.btcChange])));
    }
    if (wantEvm) {
      if (!this.cfg.evm?.getHistory) throw noProvider("Ethereum transaction history");
      items.push(...(await this.cfg.evm.getHistory(a.evm)));
    }
    return items.sort((x, y) => (x.timestamp < y.timestamp ? 1 : -1));
  }

  /** Honest stub: recovery needs the recovery backend, which does not exist yet. */
  async restoreFromNomadAuthorization(
    _authorization: NomadRecoveryAuthorization
  ): Promise<NomadWalletProviderRestorationReceipt> {
    throw new NomadEngineError(
      "not_implemented",
      "Recovery restoration needs the recovery service, which is not built yet. No keys were changed.",
      false
    );
  }

  // ---- internals -------------------------------------------------------

  private clearSessionData(): void {
    this.addresses = null;
    this.pending.clear();
  }

  private async requireUnlocked(): Promise<void> {
    if (!(await this.cfg.session.isUnlocked())) {
      this.clearSessionData();
      throw locked();
    }
  }

  /** Runs `fn` with a fresh seed copy and always wipes it afterwards. */
  private async withSeed<T>(fn: (seed: Uint8Array) => T | Promise<T>): Promise<T> {
    await this.requireUnlocked();
    const seed = await this.cfg.session.getSeed();
    try {
      return await fn(seed);
    } finally {
      wipe(seed);
    }
  }

  private wipeKey(key: BitcoinKey): void {
    try {
      key.node.privateKey?.fill(0);
    } catch {
      /* best effort */
    }
  }

  /** Public addresses only. Cached until the wallet locks. */
  private async loadAddresses(): Promise<Addresses> {
    await this.requireUnlocked();
    if (this.addresses) return this.addresses;
    this.addresses = await this.withSeed((seed) => {
      const receive = deriveBitcoinTestnetKey(seed, 0, false);
      const change = deriveBitcoinTestnetKey(seed, 0, true);
      const result: Addresses = { btcReceive: receive.address, btcChange: change.address, evm: deriveEvmKey(seed, 0).address };
      this.wipeKey(receive);
      this.wipeKey(change);
      return result;
    });
    return this.addresses;
  }

  private resolveChain(assetSymbol?: string, chainId?: string): EngineChainId {
    let chain: EngineChainId | null = null;
    if (chainId) {
      if (chainId !== BITCOIN_TESTNET_ID && chainId !== EVM_SEPOLIA_ID) {
        throw new NomadEngineError(
          "unsupported_chain",
          "This wallet is testnet-only. Only Bitcoin Testnet and Ethereum Sepolia are available.",
          true
        );
      }
      chain = chainId;
    }
    const symbol = (assetSymbol ?? "").trim().toUpperCase();
    const bySymbol: EngineChainId | null = BTC_SYMBOLS.includes(symbol) ? BITCOIN_TESTNET_ID : EVM_SYMBOLS.includes(symbol) ? EVM_SEPOLIA_ID : null;
    if (!chain && !bySymbol) throw new NomadEngineError("unsupported_chain", "That asset is not supported on the testnet wallet.", true);
    if (chain && bySymbol && chain !== bySymbol) throw invalid("The asset does not belong to the selected network.");
    return (chain ?? bySymbol) as EngineChainId;
  }

  private async prepare(draft: NomadTransactionDraft): Promise<Prepared> {
    await this.requireUnlocked();
    const chain = this.resolveChain(draft.fromAsset, draft.chainId);
    if (draft.fromAccountId && draft.fromAccountId !== accountIdFor(chain)) throw invalid("That account does not exist on this network.");
    const a = await this.loadAddresses();

    if (chain === BITCOIN_TESTNET_ID) {
      const provider = this.cfg.bitcoin;
      if (!provider) throw noProvider("Bitcoin");
      const to = assertBitcoinTestnetAddress(draft.toAddress);
      const amountSats = parseBtcAmountToSats(draft.amount);

      const utxos: OwnedUtxo[] = [
        ...(await provider.getUtxos(a.btcReceive)).map((u) => ({ ...u, kind: "receive" as const })),
        ...(await provider.getUtxos(a.btcChange)).map((u) => ({ ...u, kind: "change" as const })),
      ];
      const plan = planBitcoinSend({
        utxos,
        toAddress: to,
        amountSats,
        feeRateSatPerVb: await provider.getFeeRateSatPerVb(),
        changeAddress: a.btcChange,
      });
      return {
        chainId: BITCOIN_TESTNET_ID,
        btc: plan,
        review: {
          chainId: BITCOIN_TESTNET_ID,
          fromAddress: a.btcReceive,
          toAddress: to,
          amount: formatSats(amountSats),
          assetSymbol: "tBTC",
          feeEstimate: formatSats(plan.feeSats),
          feeAssetSymbol: "tBTC",
          memo: draft.memo,
        },
      };
    }

    const provider = this.cfg.evm;
    if (!provider) throw noProvider("Ethereum");
    const to = assertEvmAddress(draft.toAddress);
    const valueWei = parseEthAmountToWei(draft.amount);
    const plan = await planEvmTransfer(provider, a.evm, to, valueWei);
    return {
      chainId: EVM_SEPOLIA_ID,
      evm: plan,
      review: {
        chainId: EVM_SEPOLIA_ID,
        fromAddress: a.evm,
        toAddress: to,
        amount: formatEther(valueWei),
        assetSymbol: "SepoliaETH",
        feeEstimate: formatEther(plan.maxFeeWei),
        feeAssetSymbol: "SepoliaETH",
        memo: draft.memo,
      },
    };
  }
}
