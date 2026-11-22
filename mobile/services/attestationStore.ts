/**
 * attestationStore.ts
 *
 * Keeps Reqrium verifications on the phone in secure storage so they survive
 * restarts. An attestation names a wallet and a claim only: no documents and no
 * personal details. Every entry is re-checked against the issuer's signature
 * before it is ever shown to an app.
 */

import type { AttestationStore } from "../../src/connect";
import type { SignedAttestation } from "../../src/connect";

import { secureGetItem, secureSetItem } from "./nativeStubs";

const KEY = "nomad.attestations.v1";

async function readAll(): Promise<SignedAttestation[]> {
  try {
    const raw = await secureGetItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SignedAttestation[]) : [];
  } catch {
    return [];
  }
}

export const secureAttestationStore: AttestationStore = {
  list: readAll,
  save: async (item) => {
    const others = (await readAll()).filter((i) => i.attestation.claim !== item.attestation.claim);
    await secureSetItem(KEY, JSON.stringify([...others, item]));
  },
};
