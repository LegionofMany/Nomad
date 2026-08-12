/**
 * Password credential enrollment and verification for Nomad Wallet.
 *
 * The persisted credential contains only a random salt and a PBKDF2 verifier.
 * The password and the derived wallet access key are never persisted here.
 */

export const MIN_WALLET_PASSWORD_LENGTH = 12;
export const PASSWORD_CREDENTIAL_ITERATIONS = 210_000;

export type PasswordCredential = {
  version: 1;
  algorithm: "PBKDF2-SHA-256";
  iterations: number;
  saltHex: string;
  verifierHex: string;
};

export type PasswordEnrollment = {
  credential: PasswordCredential;
  accessKey: string;
};

function getNodeCrypto(): null | {
  pbkdf2Sync: (password: string, salt: Uint8Array, iterations: number, keyLength: number, digest: string) => Uint8Array;
  randomBytes: (size: number) => Uint8Array;
} {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require("crypto");
    return { pbkdf2Sync: crypto.pbkdf2Sync, randomBytes: crypto.randomBytes };
  } catch {
    return null;
  }
}

function hasWebCrypto(): boolean {
  return !!(
    typeof globalThis !== "undefined" &&
    (globalThis as any).crypto?.subtle &&
    typeof (globalThis as any).crypto.getRandomValues === "function"
  );
}

function utf8Bytes(value: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BufferCtor: any = (globalThis as any).Buffer;
  if (BufferCtor) return new Uint8Array(BufferCtor.from(value, "utf8"));
  throw new Error("No UTF-8 encoder is available.");
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) throw new Error("Invalid credential encoding.");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function secureRandomBytes(length: number): Uint8Array {
  if (hasWebCrypto()) {
    const bytes = new Uint8Array(length);
    (globalThis as any).crypto.getRandomValues(bytes);
    return bytes;
  }
  const nodeCrypto = getNodeCrypto();
  if (nodeCrypto) return new Uint8Array(nodeCrypto.randomBytes(length));
  throw new Error("Secure random generation is unavailable; wallet password enrollment cannot continue.");
}

async function deriveMaterial(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  if (hasWebCrypto()) {
    const subtle = (globalThis as any).crypto.subtle as SubtleCrypto;
    const key = await subtle.importKey("raw", toArrayBuffer(utf8Bytes(password)), "PBKDF2", false, ["deriveBits"]);
    const bits = await subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: toArrayBuffer(salt), iterations },
      key,
      512
    );
    return new Uint8Array(bits);
  }

  const nodeCrypto = getNodeCrypto();
  if (nodeCrypto) return new Uint8Array(nodeCrypto.pbkdf2Sync(password, salt, iterations, 64, "sha256"));
  throw new Error("Secure password derivation is unavailable.");
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let i = 0; i < length; i++) difference |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return difference === 0;
}

function assertPassword(password: string): void {
  if (typeof password !== "string" || password.length < MIN_WALLET_PASSWORD_LENGTH) {
    throw new Error(`Wallet password must be at least ${MIN_WALLET_PASSWORD_LENGTH} characters.`);
  }
}

function assertCredential(credential: PasswordCredential): void {
  if (
    credential?.version !== 1 ||
    credential.algorithm !== "PBKDF2-SHA-256" ||
    !Number.isInteger(credential.iterations) ||
    credential.iterations < 100_000
  ) {
    throw new Error("Unsupported wallet password credential.");
  }
}

export async function enrollPassword(password: string): Promise<PasswordEnrollment> {
  assertPassword(password);
  const salt = secureRandomBytes(16);
  const material = await deriveMaterial(password, salt, PASSWORD_CREDENTIAL_ITERATIONS);
  return {
    credential: {
      version: 1,
      algorithm: "PBKDF2-SHA-256",
      iterations: PASSWORD_CREDENTIAL_ITERATIONS,
      saltHex: bytesToHex(salt),
      verifierHex: bytesToHex(material.slice(0, 32)),
    },
    accessKey: bytesToHex(material.slice(32, 64)),
  };
}

export async function verifyPassword(
  password: string,
  credential: PasswordCredential
): Promise<{ ok: true; accessKey: string } | { ok: false }> {
  assertCredential(credential);
  if (typeof password !== "string" || password.length === 0) return { ok: false };
  const material = await deriveMaterial(password, hexToBytes(credential.saltHex), credential.iterations);
  const verifier = material.slice(0, 32);
  if (!constantTimeEqual(verifier, hexToBytes(credential.verifierHex))) return { ok: false };
  return { ok: true, accessKey: bytesToHex(material.slice(32, 64)) };
}
