/**
 * connect/types.ts
 *
 * "Nomad Connect" v1: how other apps (Zonycs, Reqrium, Syaxio, Guardian Trader)
 * ask Nomad for things. Nomad is the key; the apps only ever ask.
 *
 *   signin : prove control of a wallet address (no password, no shared secret)
 *   pay    : ask for a payment; the engine's approval screen decides
 *   prove  : present a signed "verified" claim issued by Reqrium (never documents)
 *   read   : share public addresses only (never keys, never spend rights)
 *
 * TESTNET ONLY for now: `pay` is forwarded to the testnet engine, which refuses
 * every other network.
 */

export const CONNECT_VERSION = 1 as const;

/** Longest time a request may stay valid, so a stolen link goes stale quickly. */
export const MAX_REQUEST_LIFETIME_MS = 10 * 60 * 1000;
export const MAX_CLOCK_SKEW_MS = 60 * 1000;
export const MAX_REQUEST_BYTES = 4096;

export type ConnectKind = "signin" | "pay" | "prove" | "read" | "buy";
export type ClaimName = "verified_person" | "verified_business";

export interface ConnectAppRef {
  /** Registered app id, e.g. "zonycs". */
  id: string;
  /** The app's web origin, e.g. "https://zonycs.example". Must match the registry. */
  origin: string;
}

interface BaseRequest {
  v: typeof CONNECT_VERSION;
  /** Unique per request. Nomad refuses to process the same id twice. */
  id: string;
  /** Random value the app issued and will check again when the response comes back. */
  nonce: string;
  app: ConnectAppRef;
  issuedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
}

export interface SignInRequest extends BaseRequest {
  kind: "signin";
  /** Optional short human sentence shown to the owner. */
  statement?: string;
}

export interface PayRequest extends BaseRequest {
  kind: "pay";
  chainId: string;
  assetSymbol: string;
  toAddress: string;
  amount: string;
  /** The app's own order/invoice reference. */
  orderRef?: string;
  memo?: string;
}

export interface ProveRequest extends BaseRequest {
  kind: "prove";
  claim: ClaimName;
}

export interface ReadRequest extends BaseRequest {
  kind: "read";
  scopes: Array<"addresses">;
}

/**
 * Pay for a marketplace order held in escrow (Zonycs). The app picks ONLY the order, the amount, the
 * token permit's nonce and a deadline. Nomad builds the two messages it signs itself, using the
 * marketplace contract and token it has pinned for that app in the registry, so an app cannot
 * point a signature at any other contract, token or spender.
 */
export interface BuyRequest extends BaseRequest {
  kind: "buy";
  chainId: number;
  /** bytes32 hash of the seller's order (0x + 64 hex). */
  orderHash: string;
  /** Token amount in base units (for a 6-decimal token, 25 tokens = "25000000"). */
  amount: string;
  /** The token's current permit nonce for this wallet. */
  permitNonce: string;
  /** Unix seconds. Both signatures expire then. */
  deadline: number;
  /** What the app says is being bought. Shown to the owner as the app's own words, never trusted. */
  item?: string;
}

export type ConnectRequest = SignInRequest | PayRequest | ProveRequest | ReadRequest | BuyRequest;

/** What Reqrium signs. It names a wallet and a claim, and carries no personal data. */
export interface Attestation {
  v: typeof CONNECT_VERSION;
  issuer: string; // registered issuer id, e.g. "reqrium"
  subject: string; // wallet address the claim is about
  claim: ClaimName;
  issuedAt: string;
  expiresAt: string;
}

export interface SignedAttestation {
  attestation: Attestation;
  /** EIP-191 signature by the issuer's registered key. */
  signature: string;
}

export type ConnectErrorCode =
  | "invalid_request"
  | "unknown_app"
  | "origin_mismatch"
  | "kind_not_allowed"
  | "expired"
  | "replayed"
  | "declined"
  | "wallet_locked"
  | "no_attestation"
  | "failed";

interface BaseResponse {
  v: typeof CONNECT_VERSION;
  /** Echoes the request id and nonce so the app can match them. */
  id: string;
  nonce: string;
  kind: ConnectKind;
}

export type ConnectResponse =
  | (BaseResponse & { status: "error"; code: ConnectErrorCode; message: string })
  | (BaseResponse & { status: "approved"; kind: "signin"; address: string; message: string; signature: string })
  | (BaseResponse & { status: "approved"; kind: "pay"; txHash: string; chainId: string })
  | (BaseResponse & {
      status: "approved";
      kind: "prove";
      address: string;
      attestation: SignedAttestation;
      /** Wallet signature binding this attestation to this app and nonce. */
      presentation: { message: string; signature: string };
    })
  | (BaseResponse & { status: "approved"; kind: "read"; addresses: Array<{ chainId: string; address: string }> })
  | (BaseResponse & {
      status: "approved";
      kind: "buy";
      address: string;
      orderHash: string;
      /** The deadline both signatures carry. */
      deadline: number;
      /** EIP-712 BuyerAcceptance signature. */
      buyerSignature: string;
      /** EIP-2612 token permit, split for the contract call. */
      permit: { deadline: number; v: number; r: string; s: string };
    });

/** What the owner sees before saying yes. The UI renders `lines` as-is. */
export interface ConnectReview {
  appName: string;
  origin: string;
  kind: ConnectKind;
  title: string;
  lines: string[];
}

export interface ConnectApprovalGate {
  request(review: ConnectReview): Promise<boolean>;
}
