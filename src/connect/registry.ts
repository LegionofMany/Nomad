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

export interface KnownApp {
  id: string;
  name: string;
  /** Exact origins allowed to send requests and receive answers. */
  origins: string[];
  allowedKinds: ConnectKind[];
  /** Path on the origin that receives the answer, e.g. "/nomad/callback". */
  callbackPath: string;
}

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
    { id: "zonycs", name: "Zonycs", origins: ["http://localhost:3001"], allowedKinds: ["signin", "pay", "read"], callbackPath: "/nomad/callback" },
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
