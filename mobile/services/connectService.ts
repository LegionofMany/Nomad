/**
 * connectService.ts
 *
 * Builds Nomad Connect on top of the SAME engine instance the wallet uses, and
 * runs incoming nomad:// links. Native only.
 *
 * Registry: the development apps (localhost origins), plus two optional settings
 * baked in at build time (see eas.json):
 *   EXPO_PUBLIC_NOMAD_DEMO_ORIGIN         https origin of the Nomad Connect test page
 *   EXPO_PUBLIC_REQRIUM_ISSUER_ADDRESS    address of Reqrium's signing key (0x...)
 * Replace the development registry with the real https origins before any release.
 */

import { Linking } from "react-native";

import {
  DEV_REGISTRY,
  NomadConnect,
  isAttestLink,
  isConnectLink,
  processAttestLink,
  processConnectLink,
  withDemoApp,
} from "../../src/connect";
import type { ConnectRegistry } from "../../src/connect";

import { secureAttestationStore } from "./attestationStore";
import { connectGate, showConnectNotice } from "./connectBroker";
import { connectEngine } from "./engineService";

function buildRegistry(): ConnectRegistry {
  let registry = withDemoApp(DEV_REGISTRY, process.env.EXPO_PUBLIC_NOMAD_DEMO_ORIGIN);
  const issuer = process.env.EXPO_PUBLIC_REQRIUM_ISSUER_ADDRESS;
  if (issuer && /^0x[0-9a-fA-F]{40}$/.test(issuer)) {
    registry = { ...registry, issuers: [{ id: "reqrium", name: "Reqrium", address: issuer }] };
  }
  return registry;
}

const registry = buildRegistry();

const connect = connectEngine
  ? new NomadConnect({ wallet: connectEngine, gate: connectGate, registry, store: secureAttestationStore })
  : null;

/** Handles one link end to end: ask the owner, answer the app, tell the owner what happened. */
export async function runIncomingLink(link: string): Promise<void> {
  if (!connect) return;

  if (isAttestLink(link)) {
    const result = await processAttestLink(connect, link);
    showConnectNotice(result.title, result.message);
    return;
  }
  if (!isConnectLink(link)) return;

  const outcome = await processConnectLink(connect, registry, link);
  showConnectNotice(outcome.title, outcome.message);
  if (outcome.callbackUrl) {
    try {
      await Linking.openURL(outcome.callbackUrl);
    } catch {
      showConnectNotice("Could not return to the app", "Open the app yourself to continue.");
    }
  }
}
