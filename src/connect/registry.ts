/**
 * connect/registry.ts
 *
 * The list of apps Nomad will talk to. An app that is not listed is refused,
 * and a request must come from the exact origin registered for its id, so a
 * look-alike website cannot borrow Zonycs' name.
 *
 * The origins below are DEVELOPMENT placeholders (localhost). Before any
 * release, replace them with the real https origins (Arkrilium domains).
 */

import type { ConnectKind } from "./types";

/**
 * What Nomad will let an app's "buy" request point at. These are PINNED here, never taken from the
 * request: the marketplace contract (which signs-for and spends the permit), the token, and the
 * signing names those two contracts use. A request can only choose the order, the amount (up to
 * maxAmount), the permit nonce and the deadline.
 */
export interface BuyPolicy {
  chainId: number;
  /** The marketplace settlement contract: the EIP-712 verifying contract AND the permit's spender. */
  settlement: string;
  settlementDomain: { name: string; version: string };
  token: { address: string; symbol: string; decimals: number; permitName: string; permitVersion: string };
  /** Largest amount one request may ask for, in token base units. */
  maxAmount: string;
}

export interface KnownApp {
  id: string;
  name: string;
  /** Exact origins allowed to send requests and receive answers. */
  origins: string[];
  allowedKinds: ConnectKind[];
  /** Path on the origin that receives the answer, e.g. "/nomad/callback". */
  callbackPath: string;
  /** Only for apps allowed to make "buy" requests. */
  buy?: BuyPolicy;
}

/** Zonycs on Hedera testnet (from Zonycs's deployments.testnet.json). TESTNET ONLY. */
export const ZONYCS_TESTNET_BUY: BuyPolicy = {
  chainId: 296,
  settlement: "0x05F7d670836c1f989f87ED365EB5E23F6B6Fb02c",
  settlementDomain: { name: "MarketplaceSettlementV2", version: "1" },
  token: { address: "0xFf9714970773CaA8647f3215A9C7959074629824", symbol: "SBUSD", decimals: 6, permitName: "Seller Block USD", permitVersion: "1" },
  maxAmount: "1000000000", // 1,000 SBUSD
};

export interface KnownIssuer {
  id: string;
  name: string;
  /** EVM address of the key that signs this issuer's attestations. */
  address: string;
}

export interface ConnectRegistry {
  apps: KnownApp[];
  issuers: KnownIssuer[];
}

export const DEV_REGISTRY: ConnectRegistry = {
  apps: [
    { id: "zonycs", name: "Zonycs", origins: ["http://localhost:3001"], allowedKinds: ["signin", "pay", "read", "buy"], callbackPath: "/sign-in/nomad", buy: ZONYCS_TESTNET_BUY },
    { id: "reqrium", name: "Reqrium", origins: ["http://localhost:3002"], allowedKinds: ["signin", "read"], callbackPath: "/nomad/callback" },
    { id: "syaxio", name: "Syaxio", origins: ["http://localhost:3003"], allowedKinds: ["signin", "read"], callbackPath: "/nomad/callback" },
    { id: "guardian-trader", name: "Guardian Trader", origins: ["http://localhost:3004"], allowedKinds: ["signin"], callbackPath: "/nomad/callback" },
  ],
  // Reqrium's signing address is set when Reqrium has a production key. Until then there is no trusted issuer.
  issuers: [],
};

export function findApp(registry: ConnectRegistry, id: string): KnownApp | undefined {
  return registry.apps.find((a) => a.id === id);
}

export function findIssuer(registry: ConnectRegistry, id: string): KnownIssuer | undefined {
  return registry.issuers.find((i) => i.id === id);
}

/** Plain http is only ever acceptable for local development. */
export function isAcceptableOrigin(origin: string): boolean {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.origin !== origin) return false; // no path, query or trailing slash
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
}

/**
 * Trusts one more exact origin for a registered app (its real https address, set at build time).
 * Only the origin is kept (scheme + host), never a path. An unknown app, a missing value or an
 * unacceptable address leaves the registry unchanged.
 */
export function withAppOrigin(registry: ConnectRegistry, appId: string, url: string | undefined): ConnectRegistry {
  if (!url) return registry;
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return registry;
  }
  if (!isAcceptableOrigin(origin)) return registry;
  if (!findApp(registry, appId)) return registry;
  return {
    ...registry,
    apps: registry.apps.map((app) => (app.id === appId && !app.origins.includes(origin) ? { ...app, origins: [...app.origins, origin] } : app)),
  };
}

/**
 * Adds the Nomad Connect test page as a registered app, for TESTNET preview builds only.
 * The origin must be https (or localhost). Returns the registry unchanged if it is missing or invalid.
 */
export function withDemoApp(registry: ConnectRegistry, origin: string | undefined): ConnectRegistry {
  if (!origin || !isAcceptableOrigin(origin)) return registry;
  const demo: KnownApp = {
    id: "nomad-demo",
    name: "Nomad Connect test page",
    origins: [origin],
    allowedKinds: ["signin", "read", "prove"],
    callbackPath: "/connect-demo.html",
  };
  return { ...registry, apps: [...registry.apps.filter((a) => a.id !== demo.id), demo] };
}
