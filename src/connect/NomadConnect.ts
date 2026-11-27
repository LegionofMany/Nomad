/**
 * connect/NomadConnect.ts
 *
 * Receives a request from another app, checks it, asks the owner, and answers.
 * Order of checks: parse -> known app -> exact origin -> allowed kind -> not a
 * replay -> owner approval -> sign. Nothing is signed before the owner says yes.
 */

import type {
  NomadBroadcastResult,
  NomadSignedTransaction,
  NomadTransactionDraft,
  NomadWalletAccount,
} from "../../mobile/nomad/adapters/walletAdapter";
import { Signature, formatUnits } from "ethers";
import type { TypedDataDomain, TypedDataField } from "ethers";
import { ConnectParseError, parseConnectRequest, toBase64Url } from "./parse";
import { findApp, findIssuer } from "./registry";
import type { ConnectRegistry, KnownApp } from "./registry";
import { attestationHash, buildPresentationMessage, buildSignInMessage, verifyAttestation } from "./messages";
import type {
  BuyRequest,
  ConnectApprovalGate,
  ConnectErrorCode,
  ConnectKind,
  ConnectRequest,
  ConnectResponse,
  PayRequest,
  ProveRequest,
  ReadRequest,
  SignInRequest,
  SignedAttestation,
} from "./types";
import { CONNECT_VERSION } from "./types";

/** The slice of NomadWalletEngine that Connect needs. The engine satisfies it as-is. */
export interface ConnectWallet {
  getAccounts(): Promise<NomadWalletAccount[]>;
  signConnectMessage(message: string): Promise<{ address: string; signature: string }>;
  signConnectTypedData(
    domain: TypedDataDomain,
    types: Record<string, TypedDataField[]>,
    value: Record<string, unknown>
  ): Promise<{ address: string; signature: string }>;
  signTransaction(draft: NomadTransactionDraft): Promise<NomadSignedTransaction>;
  broadcastTransaction(signed: NomadSignedTransaction): Promise<NomadBroadcastResult>;
}

export interface AttestationStore {
  list(): Promise<SignedAttestation[]>;
  save(item: SignedAttestation): Promise<void>;
}

export const createMemoryAttestationStore = (): AttestationStore => {
  let items: SignedAttestation[] = [];
  return {
    list: async () => [...items],
    save: async (item) => {
      items = [...items.filter((i) => i.attestation.claim !== item.attestation.claim), item];
    },
  };
};

export interface NomadConnectConfig {
  wallet: ConnectWallet;
  gate: ConnectApprovalGate;
  registry: ConnectRegistry;
  store?: AttestationStore;
  now?: () => Date;
}

const EVM_ACCOUNT_CHAIN = "evm-sepolia";
const MAX_REMEMBERED_REQUESTS = 500;
/** A purchase's signatures may be valid for at most this long (the app asks for ~15 minutes). */
const MAX_BUY_WINDOW_SECONDS = 30 * 60;

export class NomadConnect {
  private readonly cfg: NomadConnectConfig;
  private readonly store: AttestationStore;
  private readonly seen = new Map<string, number>(); // request id -> expiry time

  constructor(config: NomadConnectConfig) {
    this.cfg = config;
    this.store = config.store ?? createMemoryAttestationStore();
  }

  private now(): Date {
    return this.cfg.now ? this.cfg.now() : new Date();
  }

  /** Never throws: every outcome is a response the app (and the owner) can understand. */
  async handle(input: unknown): Promise<ConnectResponse> {
    let request: ConnectRequest;
    try {
      request = parseConnectRequest(input, this.now());
    } catch (error) {
      const code = error instanceof ConnectParseError ? error.code : "invalid_request";
      return this.fail(bestEffort(input), code, error instanceof Error ? error.message : "The request could not be read.");
    }
    const ref = { id: request.id, nonce: request.nonce, kind: request.kind };

    const app = findApp(this.cfg.registry, request.app.id);
    if (!app) return this.fail(ref, "unknown_app", "Nomad does not know this app, so it was not allowed to ask for anything.");
    if (!app.origins.includes(request.app.origin)) {
      return this.fail(ref, "origin_mismatch", `This request claims to be ${app.name} but did not come from ${app.name}'s real address. Nothing was shared.`);
    }
    if (!app.allowedKinds.includes(request.kind)) return this.fail(ref, "kind_not_allowed", `${app.name} is not allowed to make this kind of request.`);
    if (this.isReplay(request)) return this.fail(ref, "replayed", "This request was already used. Go back to the app and start again.");

    try {
      switch (request.kind) {
        case "signin":
          return await this.signIn(request, app);
        case "pay":
          return await this.pay(request, app);
        case "prove":
          return await this.prove(request, app);
        case "read":
          return await this.read(request, app);
        case "buy":
          return await this.buy(request, app);
      }
    } catch (error) {
      return this.fromError(ref, error);
    }
  }

  /** Stores a Reqrium attestation for this wallet after checking the issuer's signature. */
  async addAttestation(signed: SignedAttestation): Promise<void> {
    const issuer = findIssuer(this.cfg.registry, signed.attestation.issuer);
    if (!issuer) throw new Error("This issuer is not trusted by Nomad.");
    if (!verifyAttestation(signed, issuer.address, this.now())) throw new Error("This verification is not valid or has expired.");
    const address = await this.evmAddress();
    if (signed.attestation.subject.toLowerCase() !== address.toLowerCase()) throw new Error("This verification belongs to a different wallet.");
    await this.store.save(signed);
  }

  // ---- request types ----------------------------------------------------

  private async signIn(req: SignInRequest, app: KnownApp): Promise<ConnectResponse> {
    const address = await this.evmAddress();
    const message = buildSignInMessage({
      origin: req.app.origin,
      address,
      nonce: req.nonce,
      requestId: req.id,
      issuedAt: req.issuedAt,
      expiresAt: req.expiresAt,
      statement: req.statement,
    });
    const ok = await this.cfg.gate.request({
      appName: app.name,
      origin: req.app.origin,
      kind: "signin",
      title: `Sign in to ${app.name}`,
      lines: [`Wallet: ${address}`, req.statement ?? "", "This does not move money and gives no access to your funds."].filter(Boolean),
    });
    if (!ok) return this.fail(req, "declined", "You declined the sign-in.");
    const signed = await this.cfg.wallet.signConnectMessage(message);
    if (signed.address.toLowerCase() !== address.toLowerCase()) return this.fail(req, "failed", "The wallet address changed. Try again.");
    return { v: CONNECT_VERSION, id: req.id, nonce: req.nonce, kind: "signin", status: "approved", address, message, signature: signed.signature };
  }

  private async pay(req: PayRequest, app: KnownApp): Promise<ConnectResponse> {
    // The engine shows its own review (amount, destination, fee) and signs only on a yes.
    const memo = [app.name, req.orderRef, req.memo].filter(Boolean).join(" · ").slice(0, 120);
    const draft: NomadTransactionDraft = { fromAsset: req.assetSymbol, toAddress: req.toAddress, amount: req.amount, chainId: req.chainId, memo, intent: "send" };
    const signed = await this.cfg.wallet.signTransaction(draft);
    const sent = await this.cfg.wallet.broadcastTransaction(signed);
    if (sent.status !== "broadcasted") return this.fail(req, "failed", sent.failure?.message ?? "The payment could not be sent.");
    return { v: CONNECT_VERSION, id: req.id, nonce: req.nonce, kind: "pay", status: "approved", txHash: sent.txHash, chainId: req.chainId };
  }

  private async prove(req: ProveRequest, app: KnownApp): Promise<ConnectResponse> {
    const address = await this.evmAddress();
    const issuer = findIssuer(this.cfg.registry, "reqrium");
    if (!issuer) return this.fail(req, "no_attestation", "Verification is not set up yet.");

    const now = this.now();
    const candidates = await this.store.list();
    const held = candidates.find(
      (s) =>
        s.attestation.claim === req.claim &&
        s.attestation.issuer === issuer.id &&
        s.attestation.subject.toLowerCase() === address.toLowerCase() &&
        verifyAttestation(s, issuer.address, now)
    );
    if (!held) return this.fail(req, "no_attestation", "This wallet does not hold that verification yet.");

    const label = req.claim === "verified_business" ? "verified business" : "verified person";
    const ok = await this.cfg.gate.request({
      appName: app.name,
      origin: req.app.origin,
      kind: "prove",
      title: `Show ${app.name} that you are a ${label}`,
      lines: [`${issuer.name} has confirmed this wallet as a ${label}.`, "Only the confirmation is shared. No documents or personal details leave Nomad."],
    });
    if (!ok) return this.fail(req, "declined", "You declined to share your verification.");

    const message = buildPresentationMessage({
      origin: req.app.origin,
      claim: req.claim,
      attestationHash: attestationHash(held.attestation),
      nonce: req.nonce,
      requestId: req.id,
    });
    const signed = await this.cfg.wallet.signConnectMessage(message);
    return {
      v: CONNECT_VERSION,
      id: req.id,
      nonce: req.nonce,
      kind: "prove",
      status: "approved",
      address,
      attestation: held,
      presentation: { message, signature: signed.signature },
    };
  }

  private async read(req: ReadRequest, app: KnownApp): Promise<ConnectResponse> {
    const accounts = await this.cfg.wallet.getAccounts();
    const ok = await this.cfg.gate.request({
      appName: app.name,
      origin: req.app.origin,
      kind: "read",
      title: `Share your addresses with ${app.name}`,
      lines: ["Public addresses only. The app can see them but cannot spend from them.", ...accounts.map((a) => `${a.label}: ${a.address}`)],
    });
    if (!ok) return this.fail(req, "declined", "You declined to share your addresses.");
    return {
      v: CONNECT_VERSION,
      id: req.id,
      nonce: req.nonce,
      kind: "read",
      status: "approved",
      addresses: accounts.map((a) => ({ chainId: a.chainId ?? "", address: a.address })),
    };
  }

  /**
   * Pays for an escrowed marketplace order. Nomad builds both messages itself from the contract and
   * token pinned in the registry; the request only chooses order, amount, permit nonce and deadline.
   * The permit lets the marketplace contract (and nobody else) take exactly this amount, until the deadline.
   */
  private async buy(req: BuyRequest, app: KnownApp): Promise<ConnectResponse> {
    const policy = app.buy;
    if (!policy) return this.fail(req, "kind_not_allowed", `${app.name} is not set up to take payments in Nomad.`);
    if (req.chainId !== policy.chainId) return this.fail(req, "invalid_request", "This payment is for a network Nomad does not allow for this app.");
    const amount = BigInt(req.amount);
    if (amount > BigInt(policy.maxAmount)) {
      return this.fail(req, "invalid_request", `This payment is larger than Nomad allows for one purchase (${formatUnits(policy.maxAmount, policy.token.decimals)} ${policy.token.symbol}).`);
    }
    const nowSec = Math.floor(this.now().getTime() / 1000);
    if (req.deadline <= nowSec + 30) return this.fail(req, "expired", "This payment request has expired. Go back to the app and try again.");
    if (req.deadline > nowSec + MAX_BUY_WINDOW_SECONDS) return this.fail(req, "invalid_request", "This payment stays valid for too long.");

    const address = await this.evmAddress();
    const pretty = formatUnits(amount, policy.token.decimals);
    const short = (value: string) => `${value.slice(0, 8)}…${value.slice(-6)}`;
    const ok = await this.cfg.gate.request({
      appName: app.name,
      origin: req.app.origin,
      kind: "buy",
      title: `Pay ${pretty} ${policy.token.symbol} to ${app.name} escrow`,
      lines: [
        `Amount: ${pretty} ${policy.token.symbol}`,
        "It goes into the marketplace's escrow contract, not straight to the seller. It is released after delivery.",
        `Order: ${short(req.orderHash)}`,
        `Escrow contract: ${short(policy.settlement)}`,
        `Network: test network ${policy.chainId}`,
        req.item ? `${app.name} says this is: ${req.item}` : "",
        `Valid until ${new Date(req.deadline * 1000).toISOString()}.`,
      ].filter(Boolean),
    });
    if (!ok) return this.fail(req, "declined", "You declined the payment.");

    // Both messages are built here. The request cannot change the contract, token, spender or owner.
    const acceptance = await this.cfg.wallet.signConnectTypedData(
      { ...policy.settlementDomain, chainId: policy.chainId, verifyingContract: policy.settlement },
      { BuyerAcceptance: [{ name: "orderHash", type: "bytes32" }, { name: "buyer", type: "address" }, { name: "deadline", type: "uint64" }] },
      { orderHash: req.orderHash, buyer: address, deadline: req.deadline }
    );
    const permit = await this.cfg.wallet.signConnectTypedData(
      { name: policy.token.permitName, version: policy.token.permitVersion, chainId: policy.chainId, verifyingContract: policy.token.address },
      {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      { owner: address, spender: policy.settlement, value: amount, nonce: BigInt(req.permitNonce), deadline: req.deadline }
    );
    if (acceptance.address.toLowerCase() !== address.toLowerCase() || permit.address.toLowerCase() !== address.toLowerCase()) {
      return this.fail(req, "failed", "The wallet address changed. Try again.");
    }
    const split = Signature.from(permit.signature);
    return {
      v: CONNECT_VERSION,
      id: req.id,
      nonce: req.nonce,
      kind: "buy",
      status: "approved",
      address,
      orderHash: req.orderHash,
      deadline: req.deadline,
      buyerSignature: acceptance.signature,
      permit: { deadline: req.deadline, v: split.v, r: split.r, s: split.s },
    };
  }

  // ---- helpers ----------------------------------------------------------

  private async evmAddress(): Promise<string> {
    const account = (await this.cfg.wallet.getAccounts()).find((a) => a.chainId === EVM_ACCOUNT_CHAIN);
    if (!account) throw new Error("This wallet has no Ethereum account.");
    return account.address;
  }

  private isReplay(req: ConnectRequest): boolean {
    const nowMs = this.now().getTime();
    for (const [id, expires] of this.seen) if (expires <= nowMs) this.seen.delete(id);
    if (this.seen.has(req.id)) return true;
    if (this.seen.size >= MAX_REMEMBERED_REQUESTS) this.seen.delete(this.seen.keys().next().value as string);
    this.seen.set(req.id, Date.parse(req.expiresAt));
    return false;
  }

  private fail(ref: { id: string; nonce: string; kind: ConnectKind }, code: ConnectErrorCode, message: string): ConnectResponse {
    return { v: CONNECT_VERSION, id: ref.id, nonce: ref.nonce, kind: ref.kind, status: "error", code, message };
  }

  private fromError(ref: { id: string; nonce: string; kind: ConnectKind }, error: unknown): ConnectResponse {
    const code = (error as { code?: string } | null)?.code;
    if (code === "wallet_locked" || code === "expired_session") return this.fail(ref, "wallet_locked", "Unlock Nomad first, then try again.");
    if (code === "rejected_signing") return this.fail(ref, "declined", "You declined this request.");
    return this.fail(ref, "failed", error instanceof Error ? error.message : "Something went wrong. Nothing was shared.");
  }
}

function bestEffort(input: unknown): { id: string; nonce: string; kind: ConnectKind } {
  let o: unknown = input;
  if (typeof input === "string") {
    try {
      o = JSON.parse(input);
    } catch {
      o = null;
    }
  }
  const r = (o && typeof o === "object" ? o : {}) as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(v) ? v : "");
  const kind = r.kind === "pay" || r.kind === "prove" || r.kind === "read" || r.kind === "buy" ? r.kind : "signin";
  return { id: text(r.id), nonce: text(r.nonce), kind };
}

/**
 * Where the answer goes: the app's REGISTERED origin and callback path, never an address
 * taken from the request. The answer is in the fragment so it is not sent to servers in logs.
 */
export function buildCallbackUrl(registry: ConnectRegistry, appId: string, origin: string, response: ConnectResponse): string | null {
  const app = findApp(registry, appId);
  if (!app || !app.origins.includes(origin)) return null;
  return `${origin}${app.callbackPath}#r=${toBase64Url(JSON.stringify(response))}`;
}
