/**
 * connect/linkFlow.ts
 *
 * Turns an incoming nomad://connect link into: an answer for the app, a callback
 * address (only ever a REGISTERED one) and a plain sentence for the owner.
 * Kept free of React and phone code so it can be tested directly.
 */

import { NomadConnect, buildCallbackUrl } from "./NomadConnect";
import { decodeAttestLink, decodeConnectLink } from "./parse";
import { findApp } from "./registry";
import type { ConnectRegistry } from "./registry";
import { CONNECT_VERSION } from "./types";
import type { ConnectResponse } from "./types";

export interface LinkOutcome {
  response: ConnectResponse;
  /** Where to send the owner (and the answer) next. Null when the app is not registered. */
  callbackUrl: string | null;
  /** Short heading and sentence to show the owner once the request is finished. */
  title: string;
  message: string;
}

export const isConnectLink = (url: string | null | undefined): url is string => typeof url === "string" && url.startsWith("nomad://connect?r=");

/** Reads only the app id and origin, so the answer can be routed. Everything else is checked by NomadConnect. */
function peekApp(json: string): { id: string; origin: string } | null {
  try {
    const app = (JSON.parse(json) as { app?: { id?: unknown; origin?: unknown } }).app;
    return app && typeof app.id === "string" && typeof app.origin === "string" ? { id: app.id, origin: app.origin } : null;
  } catch {
    return null;
  }
}

export async function processConnectLink(connect: NomadConnect, registry: ConnectRegistry, link: string): Promise<LinkOutcome> {
  let json: string;
  try {
    json = decodeConnectLink(link);
  } catch (error) {
    const message = error instanceof Error ? error.message : "That link could not be read.";
    return {
      response: { v: CONNECT_VERSION, id: "", nonce: "", kind: "signin", status: "error", code: "invalid_request", message },
      callbackUrl: null,
      title: "Request not accepted",
      message,
    };
  }

  const response = await connect.handle(json);
  const app = peekApp(json);
  const callbackUrl = app ? buildCallbackUrl(registry, app.id, app.origin, response) : null;
  const appName = (app && findApp(registry, app.id)?.name) || "the app";

  if (response.status === "approved") {
    return { response, callbackUrl, title: "Done", message: `Your answer was sent to ${appName}.` };
  }
  const title = response.code === "declined" ? "Declined" : "Request not completed";
  return { response, callbackUrl, title, message: response.message };
}

/** Stores a Reqrium verification handed over by nomad://attest. Nothing leaves the wallet. */
export async function processAttestLink(connect: NomadConnect, link: string): Promise<{ title: string; message: string; ok: boolean }> {
  try {
    const signed = decodeAttestLink(link);
    await connect.addAttestation(signed);
    const label = signed.attestation.claim === "verified_business" ? "verified business" : "verified person";
    return { ok: true, title: "Verification saved", message: `This wallet is now marked as a ${label}. Apps will only see it if you approve.` };
  } catch (error) {
    return { ok: false, title: "Verification not saved", message: error instanceof Error ? error.message : "The verification could not be read." };
  }
}
