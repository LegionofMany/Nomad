/**
 * connect/messages.ts
 *
 * The exact text a wallet signs, and helpers a BACKEND can use to check it.
 * Zonycs' Express server and Reqrium's Next.js app import `verifySignIn` /
 * `verifyAttestation` / `verifyPresentation`, so there is one implementation.
 */

import { keccak256, toUtf8Bytes, verifyMessage } from "ethers";
import type { Attestation, ClaimName, SignedAttestation } from "./types";

export function buildSignInMessage(p: {
  origin: string;
  address: string;
  nonce: string;
  requestId: string;
  issuedAt: string;
  expiresAt: string;
  statement?: string;
}): string {
  return [
    `${p.origin} wants you to sign in with your Nomad wallet.`,
    "",
    p.statement ? `${p.statement}\n` : "",
    `Address: ${p.address}`,
    `URI: ${p.origin}`,
    "Version: 1",
    `Nonce: ${p.nonce}`,
    `Request ID: ${p.requestId}`,
    `Issued At: ${p.issuedAt}`,
    `Expiration Time: ${p.expiresAt}`,
    "",
    "Signing this does not move money and does not give the app any access to your funds.",
  ]
    .filter((line, i, all) => !(line === "" && all[i - 1] === ""))
    .join("\n");
}

export function buildAttestationMessage(a: Attestation): string {
  return [
    `${a.issuer} attests that this wallet holds the claim: ${a.claim}`,
    `Subject: ${a.subject}`,
    "Version: 1",
    `Issued At: ${a.issuedAt}`,
    `Expiration Time: ${a.expiresAt}`,
  ].join("\n");
}

export const attestationHash = (a: Attestation): string => keccak256(toUtf8Bytes(buildAttestationMessage(a)));

export function buildPresentationMessage(p: { origin: string; claim: ClaimName; attestationHash: string; nonce: string; requestId: string }): string {
  return [
    `Nomad presents a verified claim to ${p.origin}.`,
    `Claim: ${p.claim}`,
    `Attestation: ${p.attestationHash}`,
    `Nonce: ${p.nonce}`,
    `Request ID: ${p.requestId}`,
    "No documents or personal details are shared.",
  ].join("\n");
}

const sameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function recover(message: string, signature: string): string | null {
  try {
    return verifyMessage(message, signature);
  } catch {
    return null;
  }
}

/** Backend check: did `address` sign exactly this message? The caller also checks the nonce it issued. */
export function verifySignIn(message: string, signature: string, address: string): boolean {
  const signer = recover(message, signature);
  return !!signer && sameAddress(signer, address) && message.includes(`Address: ${address}`);
}

/** Backend check: was this attestation signed by the issuer's known address, and is it still valid? */
export function verifyAttestation(signed: SignedAttestation, issuerAddress: string, now: Date = new Date()): boolean {
  const { attestation, signature } = signed;
  const signer = recover(buildAttestationMessage(attestation), signature);
  if (!signer || !sameAddress(signer, issuerAddress)) return false;
  return Date.parse(attestation.expiresAt) > now.getTime() && Date.parse(attestation.issuedAt) <= now.getTime() + 60_000;
}

/** Backend check: did the attested wallet present this attestation to this app, for this request? */
export function verifyPresentation(p: {
  signed: SignedAttestation;
  presentation: { message: string; signature: string };
  origin: string;
  nonce: string;
  requestId: string;
  issuerAddress: string;
  now?: Date;
}): boolean {
  if (!verifyAttestation(p.signed, p.issuerAddress, p.now)) return false;
  const expected = buildPresentationMessage({
    origin: p.origin,
    claim: p.signed.attestation.claim,
    attestationHash: attestationHash(p.signed.attestation),
    nonce: p.nonce,
    requestId: p.requestId,
  });
  if (p.presentation.message !== expected) return false;
  const signer = recover(p.presentation.message, p.presentation.signature);
  return !!signer && sameAddress(signer, p.signed.attestation.subject);
}
