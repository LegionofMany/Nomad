/**
 * connectService.ts
 *
 * Builds Nomad Connect on top of the SAME engine instance the wallet uses, and
 * runs incoming nomad://connect links. Native only.
 *
 * The app registry is the development one (localhost origins). Replace it with
 * the real https origins before any release (see src/connect/registry.ts).
 */

import { Linking } from "react-native";

import { DEV_REGISTRY, NomadConnect, createMemoryAttestationStore, processConnectLink } from "../../src/connect";

import { connectGate, showConnectNotice } from "./connectBroker";
import { connectEngine } from "./engineService";

const connect = connectEngine
  ? new NomadConnect({
      wallet: connectEngine,
      gate: connectGate,
      registry: DEV_REGISTRY,
      // In memory for now: verification claims are lost when the app closes.
      store: createMemoryAttestationStore(),
    })
  : null;

/** Handles one link end to end: ask the owner, answer the app, tell the owner what happened. */
export async function runIncomingConnectLink(link: string): Promise<void> {
  if (!connect) return;
  const outcome = await processConnectLink(connect, DEV_REGISTRY, link);
  showConnectNotice(outcome.title, outcome.message);
  if (outcome.callbackUrl) {
    try {
      await Linking.openURL(outcome.callbackUrl);
    } catch {
      showConnectNotice("Could not return to the app", "Open the app yourself to continue.");
    }
  }
}
