/**
 * connect/parse.ts
 *
 * Strict parsing of an incoming request. Anything unexpected is refused:
 * unknown fields are dropped, sizes are capped, times are checked.
 */

import { isAcceptableOrigin } from "./registry";
import { CONNECT_VERSION, MAX_CLOCK_SKEW_MS, MAX_REQUEST_BYTES, MAX_REQUEST_LIFETIME_MS } from "./types";
import type { ClaimName, ConnectErrorCode, ConnectRequest } from "./types";

export class ConnectParseError extends Error {
  readonly code: ConnectErrorCode;
  constructor(code: ConnectErrorCode, message: string) {
    super(message);
    this.name = "ConnectParseError";
    this.code = code;
  }
}

const bad = (message: string) => new ConnectParseError("invalid_request", message);
const TOKEN = /^[A-Za-z0-9_-]{16,128}$/;
const APP_ID = /^[a-z][a-z0-9-]{1,31}$/;
const SYMBOL = /^[A-Za-z0-9]{2,12}$/;
const AMOUNT = /^\d{1,18}(\.\d{1,18})?$/;
const CLAIMS: ClaimName[] = ["verified_person", "verified_business"];

function str(o: Record<string, unknown>, key: string, max: number, required = true): string | undefined {
  const v = o[key];
  if (v === undefined || v === null) {
    if (required) throw bad(`Missing "${key}".`);
    return undefined;
  }
  if (typeof v !== "string" || v.length === 0 || v.length > max) throw bad(`"${key}" is not valid.`);
  // Printable text only: no control characters that could hide content in a review screen.
  if (/[\u0000-\u001f\u007f‪-‮⁦-⁩]/.test(v)) throw bad(`"${key}" contains characters that are not allowed.`);
  return v;
}

function time(o: Record<string, unknown>, key: string): number {
  const s = str(o, key, 40) as string;
  const t = Date.parse(s);
  if (Number.isNaN(t) || new Date(t).toISOString() !== s) throw bad(`"${key}" must be an ISO 8601 UTC time.`);
  return t;
}

export function parseConnectRequest(input: unknown, now: Date): ConnectRequest {
  let raw: unknown = input;
  if (typeof input === "string") {
    if (input.length > MAX_REQUEST_BYTES) throw bad("The request is too large.");
    try {
      raw = JSON.parse(input);
    } catch {
      throw bad("The request is not valid JSON.");
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw bad("The request must be an object.");
  const o = raw as Record<string, unknown>;

  if (o.v !== CONNECT_VERSION) throw bad("Unsupported request version.");
  const id = str(o, "id", 128) as string;
  const nonce = str(o, "nonce", 128) as string;
  if (!TOKEN.test(id)) throw bad('"id" must be 16-128 letters, numbers, "-" or "_".');
  if (!TOKEN.test(nonce)) throw bad('"nonce" must be 16-128 letters, numbers, "-" or "_".');

  const appRaw = o.app as Record<string, unknown> | undefined;
  if (!appRaw || typeof appRaw !== "object") throw bad('Missing "app".');
  const appId = str(appRaw, "id", 32) as string;
  const origin = str(appRaw, "origin", 200) as string;
  if (!APP_ID.test(appId)) throw bad('"app.id" is not valid.');
  if (!isAcceptableOrigin(origin)) throw new ConnectParseError("origin_mismatch", "The app origin must be an https address.");

  const issued = time(o, "issuedAt");
  const expires = time(o, "expiresAt");
  if (expires <= issued) throw bad("The request expires before it starts.");
  if (expires - issued > MAX_REQUEST_LIFETIME_MS) throw bad("The request stays valid for too long.");
  if (issued > now.getTime() + MAX_CLOCK_SKEW_MS) throw bad("The request is dated in the future.");
  if (expires <= now.getTime()) throw new ConnectParseError("expired", "This request has expired. Go back to the app and try again.");

  const base = { v: CONNECT_VERSION, id, nonce, app: { id: appId, origin }, issuedAt: o.issuedAt as string, expiresAt: o.expiresAt as string };

  switch (o.kind) {
    case "signin":
      return { ...base, kind: "signin", statement: str(o, "statement", 200, false) };
    case "pay": {
      const chainId = str(o, "chainId", 40) as string;
      const assetSymbol = str(o, "assetSymbol", 12) as string;
      const toAddress = str(o, "toAddress", 100) as string;
      const amount = str(o, "amount", 40) as string;
      if (!SYMBOL.test(assetSymbol)) throw bad('"assetSymbol" is not valid.');
      if (!AMOUNT.test(amount) || Number(amount) <= 0) throw bad('"amount" must be a positive number.');
      return { ...base, kind: "pay", chainId, assetSymbol, toAddress, amount, orderRef: str(o, "orderRef", 64, false), memo: str(o, "memo", 120, false) };
    }
    case "prove": {
      const claim = str(o, "claim", 40) as ClaimName;
      if (!CLAIMS.includes(claim)) throw bad("Unknown claim.");
      return { ...base, kind: "prove", claim };
    }
    case "read": {
      const scopes = o.scopes;
      if (!Array.isArray(scopes) || scopes.length === 0 || scopes.some((s) => s !== "addresses")) throw bad('"scopes" may only contain "addresses".');
      return { ...base, kind: "read", scopes: ["addresses"] };
    }
    default:
      throw bad("Unknown request type.");
  }
}

/** nomad://connect?r=<base64url JSON>  (also accepted as a QR payload) */
export function encodeConnectLink(request: ConnectRequest): string {
  return `nomad://connect?r=${toBase64Url(JSON.stringify(request))}`;
}

// Plain base64 plus character swaps: the phone's Buffer polyfill may lack the "base64url" encoding.
export const toBase64Url = (text: string): string =>
  Buffer.from(text, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const fromBase64Url = (value: string): string =>
  Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

export function decodeConnectLink(link: string): string {
  const prefix = "nomad://connect?r=";
  if (!link.startsWith(prefix)) throw bad("That is not a Nomad connect link.");
  const payload = link.slice(prefix.length);
  if (payload.length > MAX_REQUEST_BYTES * 2 || !/^[A-Za-z0-9_-]+$/.test(payload)) throw bad("The link is damaged.");
  return fromBase64Url(payload);
}
