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

function clockTimeToDailyUnlockConfig(t: ClockTime): DailyUnlockConfig {
  // UI uses 1-12 hour; convert to 0-23 format by treating 12 as 0 for demo.
  // This is a demo wiring. Production should ask for AM/PM or use 24h.
  const hour12 = Math.max(1, Math.min(12, t.hour));
  const hour24 = hour12 % 12;
  return { hour: hour24, minute: Math.max(0, Math.min(59, t.minute)), toleranceMinutes: 60 };
}

const CLOCK_EPOCH_DATE = new Date(0);

async function deriveClockUnlockSecret(masterSecret: string, time: ClockTime): Promise<string> {
  const cfg = clockTimeToDailyUnlockConfig(time);
  // Use a fixed date to make the derived secret stable across days for this demo.
  // This preserves the "clock-based" property without requiring daily re-encryption.
  return deriveDailyUnlockSecretAsync(masterSecret, cfg, CLOCK_EPOCH_DATE);
}

function sameClockTime(a: ClockTime, b: ClockTime): boolean {
  return a.hour === b.hour && a.minute === b.minute;
}

async function getOrCreateMasterSecret(): Promise<string> {
  const existing = await secureGetItem(STORAGE_KEYS.masterSecret);
  if (existing) return existing;

  const bytes = getRandomBytes(32);
  // Avoid relying on Buffer/btoa presence in RN by storing a hex string.
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

  // Encrypt the seed for demo-safe storage.
  const seed = mnemonicToSeed(mnemonic);
  if (hasWebCryptoSubtle()) {
    const unlockSecret = await deriveClockUnlockSecret(masterSecret, unlockTime);
    const blob = await encryptSeedPortable(seed, unlockSecret);
    await secureSetItem(STORAGE_KEYS.encryptedSeed, JSON.stringify(blob));
    await secureRemoveItem(STORAGE_KEYS.plainSeed);
  } else {
    // Expo Go (native) may not provide WebCrypto. For demo usability, store the seed in-memory.
    // This is NOT production-safe; it's a fallback to keep the demo running.
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

  // Reset lockout on restore.
  await secureRemoveItem(STORAGE_KEYS.lockout);

  return { evmAddress };
}

export async function setDailyUnlockTime(time: ClockTime): Promise<void> {
  const prev = await getDailyUnlockTime();
  await secureSetItem(STORAGE_KEYS.unlockTime, JSON.stringify(time));

  // If a wallet exists, re-wrap the encrypted seed blob to the new clock secret
  // so changing the configured unlock time does not brick the demo wallet.
  const meta = await getWalletMeta();
  if (!meta) return;

  const blobRaw = await secureGetItem(STORAGE_KEYS.encryptedSeed);
  const blob = safeJsonParse<EncryptedBlob>(blobRaw);
  if (!blob) return;

  // If we are in the no-WebCrypto demo fallback mode, there is no blob to rewrap.
  if (!hasWebCryptoSubtle()) return;

  const masterSecret = await getOrCreateMasterSecret();
  const prevTime = prev ?? { hour: 12, minute: 0 };
  let seed: Uint8Array;
  try {
    const prevSecret = await deriveClockUnlockSecret(masterSecret, prevTime);
    seed = await decryptSeedPortable(blob, prevSecret);
  } catch {
    // Legacy migration: earlier demo builds encrypted with masterSecret directly.
    seed = await decryptSeedPortable(blob, masterSecret);
  }

  const nextSecret = await deriveClockUnlockSecret(masterSecret, time);
  const nextBlob = await encryptSeedPortable(seed, nextSecret);
  await secureSetItem(STORAGE_KEYS.encryptedSeed, JSON.stringify(nextBlob));
}

export async function getDailyUnlockTime(): Promise<ClockTime | null> {
  return safeJsonParse<ClockTime>(await secureGetItem(STORAGE_KEYS.unlockTime));
}

export async function lockWallet(): Promise<void> {
  await secureSetItem(STORAGE_KEYS.isUnlocked, "false");
}

export async function unlockWithClock(inputTime: ClockTime): Promise<UnlockWithClockResult> {
  const meta = await getWalletMeta();
  if (!meta) return { ok: false, reason: "no_wallet" };

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
  if (!configured) {
    // If not configured, treat the first successful attempt as configuration.
    await setDailyUnlockTime(inputTime);
  } else {
    if (!sameClockTime(inputTime, configured)) {
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
  }

  const masterSecret = await getOrCreateMasterSecret();

  // If we're in the no-WebCrypto demo fallback mode, just enforce time + lockout.
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
    const unlockSecret = await deriveClockUnlockSecret(masterSecret, configured ?? inputTime);
    await decryptSeedPortable(blob, unlockSecret);

    lockout.recordSuccessfulAttempt();
    await persistLockout(lockout);
    await secureSetItem(STORAGE_KEYS.isUnlocked, "true");
    return { ok: true };
  } catch (e) {
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

  // Demo balances: stable, deterministic, no network calls.
  const balances = [
    { symbol: "USDC", amount: 120.5, fiatApproxUSD: 120.5 },
    { symbol: "USDT", amount: 40.0, fiatApproxUSD: 40.0 },
    { symbol: "DAI", amount: 12.34, fiatApproxUSD: 12.34 },
    { symbol: "ETH", amount: 0.015, fiatApproxUSD: 45.0 },
  ];

  return { evmAddress: meta.evmAddress, balances };
}

export async function enableTravelMode(regionInput: string): Promise<{ preferredStablecoin: string }>{
  // Use canonical travel/ logic.
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

  // Keep masterSecret stable per device session, but allow clearing if desired.
  if (Platform.OS === "web") {
    // For web demos, leaving it is fine.
  }
}
