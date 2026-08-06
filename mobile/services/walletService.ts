import { Platform } from "react-native";

import type { ClockTime, Portfolio, WalletStatus } from "../types";
import type { EncryptedBlob } from "../../src/wallet-core/types";

import { generateMnemonic, validateMnemonic, mnemonicToSeed } from "../../src/wallet-core/seed";
import { deriveEvmAccount } from "../../src/wallet-core/deriveEvm";
import { encryptSeedPortable, decryptSeedPortable } from "../../src/wallet-core/encrypt";

import { LockoutManager } from "../../src/security/lockout";
import type { DailyUnlockConfig } from "../../src/security/clock";
import { deriveDailyUnlockSecretAsync } from "../../src/security/clock";

import { activateTravelMode } from "../../travel/travelMode";

import { getRandomBytes, secureGetItem, secureRemoveItem, secureSetItem } from "./nativeStubs";

const STORAGE_KEYS = {
  walletMeta: "nomad.wallet.meta",
  encryptedSeed: "nomad.wallet.encryptedSeed",
  plainSeed: "nomad.wallet.plainSeed",
  masterSecret: "nomad.wallet.masterSecret",
  unlockTime: "nomad.wallet.unlockTime",
  isUnlocked: "nomad.wallet.isUnlocked",
  lockout: "nomad.wallet.lockout",
  travel: "nomad.wallet.travel",
} as const;

type WalletMeta = {
  evmAddress: string;
  createdAt: string;
};

type TravelState = {
  enabled: boolean;
  regionInput?: string;
  preferredStablecoin?: string;
};

export type UnlockWithClockResult =
  | { ok: true }
  | { ok: false; reason: "no_wallet" | "locked_out" | "bad_time" | "decrypt_failed"; remainingLockSeconds?: number; permanentlyLocked?: boolean };

function hasWebCryptoSubtle(): boolean {
  return !!(
    typeof globalThis !== "undefined" &&
    (globalThis as any).crypto &&
    (globalThis as any).crypto.subtle &&
    typeof (globalThis as any).crypto.subtle.importKey === "function"
  );
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeClockTime(time: ClockTime): ClockTime {
  const hour = Number(time.hour);
  const minute = Number(time.minute);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error("Clock hour must be between 00 and 23.");
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error("Clock minute must be between 00 and 59.");
  return { hour, minute };
}

function clockTimeToDailyUnlockConfig(time: ClockTime): DailyUnlockConfig {
  const normalized = normalizeClockTime(time);
  return { hour: normalized.hour, minute: normalized.minute, toleranceMinutes: 15 };
}

function legacyClockTimeToDailyUnlockConfig(time: ClockTime): DailyUnlockConfig {
  const hour12 = Math.max(1, Math.min(12, time.hour));
  const hour24 = hour12 % 12;
  return { hour: hour24, minute: Math.max(0, Math.min(59, time.minute)), toleranceMinutes: 60 };
}

const CLOCK_EPOCH_DATE = new Date(0);

async function deriveClockUnlockSecret(masterSecret: string, time: ClockTime, legacy = false): Promise<string> {
  const config = legacy ? legacyClockTimeToDailyUnlockConfig(time) : clockTimeToDailyUnlockConfig(time);
  return deriveDailyUnlockSecretAsync(masterSecret, config, CLOCK_EPOCH_DATE);
}

function sameClockTime(a: ClockTime, b: ClockTime): boolean {
  return a.hour === b.hour && a.minute === b.minute;
}

async function getOrCreateMasterSecret(): Promise<string> {
  const existing = await secureGetItem(STORAGE_KEYS.masterSecret);
  if (existing) return existing;

  const bytes = getRandomBytes(32);
  const secret = bytesToHex(bytes);
  await secureSetItem(STORAGE_KEYS.masterSecret, secret);
  return secret;
}

async function loadLockout(): Promise<LockoutManager> {
  const raw = await secureGetItem(STORAGE_KEYS.lockout);
  const state = safeJsonParse<any>(raw) ?? undefined;

  return new LockoutManager(
    {
      delaysSeconds: [0, 5, 10, 30, 60, 120, 300],
      failureWindowSeconds: 3600,
      permanentLockAfterFailures: 8,
    },
    state
  );
}

async function persistLockout(lockout: LockoutManager): Promise<void> {
  await secureSetItem(STORAGE_KEYS.lockout, JSON.stringify(lockout.toState()));
}

export async function getWalletStatus(): Promise<WalletStatus> {
  const metaRaw = await secureGetItem(STORAGE_KEYS.walletMeta);
  if (!metaRaw) return "no_wallet";

  const lockout = await loadLockout();
  const diag = lockout.diagnostics();
  if (diag.permanentlyLocked) return "recovery";

  const unlocked = (await secureGetItem(STORAGE_KEYS.isUnlocked)) === "true";
  return unlocked ? "unlocked" : "locked";
}

export async function getWalletMeta(): Promise<WalletMeta | null> {
  return safeJsonParse<WalletMeta>(await secureGetItem(STORAGE_KEYS.walletMeta));
}

export async function createWallet(): Promise<{ mnemonic: string; evmAddress: string }>{
  const mnemonic = generateMnemonic();
  const masterSecret = await getOrCreateMasterSecret();

  const existingTime = await getDailyUnlockTime();
  const unlockTime: ClockTime = existingTime ?? { hour: 12, minute: 0 };
  if (!existingTime) await setDailyUnlockTime(unlockTime);

  const { address: evmAddress } = deriveEvmAccount(mnemonic, 0);

  const seed = mnemonicToSeed(mnemonic);
  if (hasWebCryptoSubtle()) {
    const unlockSecret = await deriveClockUnlockSecret(masterSecret, unlockTime);
    const blob = await encryptSeedPortable(seed, unlockSecret);
    await secureSetItem(STORAGE_KEYS.encryptedSeed, JSON.stringify(blob));
    await secureRemoveItem(STORAGE_KEYS.plainSeed);
  } else {
    await secureSetItem(STORAGE_KEYS.plainSeed, JSON.stringify(Array.from(seed)));
    await secureRemoveItem(STORAGE_KEYS.encryptedSeed);
  }

  const meta: WalletMeta = { evmAddress, createdAt: new Date().toISOString() };

  await secureSetItem(STORAGE_KEYS.walletMeta, JSON.stringify(meta));
  await secureSetItem(STORAGE_KEYS.isUnlocked, "false");

  return { mnemonic, evmAddress };
}

export async function restoreWallet(mnemonic: string): Promise<{ evmAddress: string }>{
  if (!validateMnemonic(mnemonic)) throw new Error("Invalid mnemonic");

  const masterSecret = await getOrCreateMasterSecret();
  const existingTime = await getDailyUnlockTime();
  const unlockTime: ClockTime = existingTime ?? { hour: 12, minute: 0 };
  if (!existingTime) await setDailyUnlockTime(unlockTime);

  const { address: evmAddress } = deriveEvmAccount(mnemonic, 0);

  const seed = mnemonicToSeed(mnemonic);
  if (hasWebCryptoSubtle()) {
    const unlockSecret = await deriveClockUnlockSecret(masterSecret, unlockTime);
    const blob = await encryptSeedPortable(seed, unlockSecret);
    await secureSetItem(STORAGE_KEYS.encryptedSeed, JSON.stringify(blob));
    await secureRemoveItem(STORAGE_KEYS.plainSeed);
  } else {
    await secureSetItem(STORAGE_KEYS.plainSeed, JSON.stringify(Array.from(seed)));
    await secureRemoveItem(STORAGE_KEYS.encryptedSeed);
  }

  const meta: WalletMeta = { evmAddress, createdAt: new Date().toISOString() };

  await secureSetItem(STORAGE_KEYS.walletMeta, JSON.stringify(meta));
  await secureSetItem(STORAGE_KEYS.isUnlocked, "false");
  await secureRemoveItem(STORAGE_KEYS.lockout);

  return { evmAddress };
}

export async function setDailyUnlockTime(time: ClockTime): Promise<void> {
  const normalizedTime = normalizeClockTime(time);
  const previousTime = await getDailyUnlockTime();

  const meta = await getWalletMeta();
  const blobRaw = await secureGetItem(STORAGE_KEYS.encryptedSeed);
  const blob = safeJsonParse<EncryptedBlob>(blobRaw);

  if (meta && blob && hasWebCryptoSubtle()) {
    const masterSecret = await getOrCreateMasterSecret();
    const previous = previousTime ?? { hour: 12, minute: 0 };
    let seed: Uint8Array | null = null;

    try {
      const previousSecret = await deriveClockUnlockSecret(masterSecret, previous);
      seed = await decryptSeedPortable(blob, previousSecret);
    } catch {
      try {
        const legacySecret = await deriveClockUnlockSecret(masterSecret, previous, true);
        seed = await decryptSeedPortable(blob, legacySecret);
      } catch {
        try {
          seed = await decryptSeedPortable(blob, masterSecret);
        } catch {
          seed = null;
        }
      }
    }

    if (!seed) throw new Error("Unable to re-encrypt the wallet for the new Clock Unlock time.");

    const nextSecret = await deriveClockUnlockSecret(masterSecret, normalizedTime);
    const nextBlob = await encryptSeedPortable(seed, nextSecret);
    await secureSetItem(STORAGE_KEYS.encryptedSeed, JSON.stringify(nextBlob));
  }

  await secureSetItem(STORAGE_KEYS.unlockTime, JSON.stringify(normalizedTime));
}

export async function getDailyUnlockTime(): Promise<ClockTime | null> {
  const stored = safeJsonParse<ClockTime>(await secureGetItem(STORAGE_KEYS.unlockTime));
  if (!stored) return null;
  try {
    return normalizeClockTime(stored);
  } catch {
    return null;
  }
}

export async function lockWallet(): Promise<void> {
  await secureSetItem(STORAGE_KEYS.isUnlocked, "false");
}

export async function unlockWithClock(inputTime: ClockTime): Promise<UnlockWithClockResult> {
  const meta = await getWalletMeta();
  if (!meta) return { ok: false, reason: "no_wallet" };

  const normalizedInput = normalizeClockTime(inputTime);
  const lockout = await loadLockout();
  if (lockout.isLocked()) {
    const d = lockout.diagnostics();
    return {
      ok: false,
      reason: "locked_out",
      remainingLockSeconds: d.remainingLockSeconds,
      permanentlyLocked: d.permanentlyLocked,
    };
  }

  const configured = await getDailyUnlockTime();
  if (!configured || !sameClockTime(normalizedInput, configured)) {
    lockout.recordFailedAttempt();
    await persistLockout(lockout);
    const d = lockout.diagnostics();
    return {
      ok: false,
      reason: "bad_time",
      remainingLockSeconds: d.remainingLockSeconds,
      permanentlyLocked: d.permanentlyLocked,
    };
  }

  const masterSecret = await getOrCreateMasterSecret();

  const plainSeed = await secureGetItem(STORAGE_KEYS.plainSeed);
  if (plainSeed) {
    lockout.recordSuccessfulAttempt();
    await persistLockout(lockout);
    await secureSetItem(STORAGE_KEYS.isUnlocked, "true");
    return { ok: true };
  }

  const blobRaw = await secureGetItem(STORAGE_KEYS.encryptedSeed);
  const blob = safeJsonParse<EncryptedBlob>(blobRaw);
  if (!blob) return { ok: false, reason: "no_wallet" };

  try {
    let decrypted = false;
    try {
      const unlockSecret = await deriveClockUnlockSecret(masterSecret, configured);
      await decryptSeedPortable(blob, unlockSecret);
      decrypted = true;
    } catch {
      try {
        const legacySecret = await deriveClockUnlockSecret(masterSecret, configured, true);
        await decryptSeedPortable(blob, legacySecret);
        decrypted = true;

        const currentSecret = await deriveClockUnlockSecret(masterSecret, configured);
        const seed = await decryptSeedPortable(blob, legacySecret);
        const migratedBlob = await encryptSeedPortable(seed, currentSecret);
        await secureSetItem(STORAGE_KEYS.encryptedSeed, JSON.stringify(migratedBlob));
      } catch {
        try {
          const seed = await decryptSeedPortable(blob, masterSecret);
          decrypted = true;
          const currentSecret = await deriveClockUnlockSecret(masterSecret, configured);
          const migratedBlob = await encryptSeedPortable(seed, currentSecret);
          await secureSetItem(STORAGE_KEYS.encryptedSeed, JSON.stringify(migratedBlob));
        } catch {
          decrypted = false;
        }
      }
    }

    if (!decrypted) throw new Error("Clock secret decryption failed.");

    lockout.recordSuccessfulAttempt();
    await persistLockout(lockout);
    await secureSetItem(STORAGE_KEYS.isUnlocked, "true");
    return { ok: true };
  } catch {
    lockout.recordFailedAttempt();
    await persistLockout(lockout);
    const d = lockout.diagnostics();
    return {
      ok: false,
      reason: "decrypt_failed",
      remainingLockSeconds: d.remainingLockSeconds,
      permanentlyLocked: d.permanentlyLocked,
    };
  }
}

export async function getPortfolio(): Promise<Portfolio> {
  const meta = await getWalletMeta();
  if (!meta) throw new Error("No wallet");

  const balances = [
    { symbol: "USDC", amount: 120.5, fiatApproxUSD: 120.5 },
    { symbol: "USDT", amount: 40.0, fiatApproxUSD: 40.0 },
    { symbol: "DAI", amount: 12.34, fiatApproxUSD: 12.34 },
    { symbol: "ETH", amount: 0.015, fiatApproxUSD: 45.0 },
  ];

  return { evmAddress: meta.evmAddress, balances };
}

export async function enableTravelMode(regionInput: string): Promise<{ preferredStablecoin: string }>{
  const settings = activateTravelMode(regionInput);

  const state: TravelState = {
    enabled: true,
    regionInput,
    preferredStablecoin: settings.preferredStablecoin,
  };
  await secureSetItem(STORAGE_KEYS.travel, JSON.stringify(state));

  return { preferredStablecoin: settings.preferredStablecoin };
}

export async function disableTravelMode(): Promise<void> {
  const state: TravelState = { enabled: false };
  await secureSetItem(STORAGE_KEYS.travel, JSON.stringify(state));
}

export async function getTravelState(): Promise<TravelState> {
  return safeJsonParse<TravelState>(await secureGetItem(STORAGE_KEYS.travel)) ?? { enabled: false };
}

export async function resetWallet(): Promise<void> {
  await secureRemoveItem(STORAGE_KEYS.walletMeta);
  await secureRemoveItem(STORAGE_KEYS.encryptedSeed);
  await secureRemoveItem(STORAGE_KEYS.plainSeed);
  await secureRemoveItem(STORAGE_KEYS.isUnlocked);
  await secureRemoveItem(STORAGE_KEYS.unlockTime);
  await secureRemoveItem(STORAGE_KEYS.lockout);
  await secureRemoveItem(STORAGE_KEYS.travel);

  if (Platform.OS === "web") {
    // The device-scoped master secret intentionally survives a local preview reset.
  }
}
