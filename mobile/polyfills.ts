/**
 * Runtime setup for the wallet engine. Import this FIRST in index.ts.
 * Hermes has no global Buffer; the Bitcoin libraries expect one.
 * The browser (and Hermes) also have no process.version, which the
 * readable-stream package reads while loading.
 */
import { Platform } from 'react-native';
import './shims/randomValues'; // first, before any @noble package is loaded
import { Buffer } from 'buffer';
import { installNativeWebCrypto } from './shims/webcrypto';
import { enableTestnetFastKdf } from '../src/security/kdfPolicy';
import { enableTestnetOpenWindow } from '../src/security/windowPolicy';

const g = globalThis as unknown as {
  Buffer?: typeof Buffer;
  process?: { version?: string; versions?: Record<string, string>; env?: Record<string, string | undefined> };
};
if (typeof g.Buffer === 'undefined') {
  g.Buffer = Buffer;
}
if (typeof g.process === 'undefined') {
  g.process = { env: {} };
}
if (typeof g.process.version !== 'string') {
  g.process.version = 'v20.0.0';
}
if (!g.process.versions) {
  g.process.versions = { node: '20.0.0' };
}
// Phones: add the secure random and encryption functions the wallet needs.
if (Platform.OS !== 'web') {
  installNativeWebCrypto();
  // TESTNET-ONLY Expo Go testing: shorter key stretching, because plain JavaScript on a
  // phone is too slow for the full count. Off unless explicitly switched on. Never ship on.
  if (process.env.EXPO_PUBLIC_NOMAD_TESTNET_FAST_KDF === '1') {
    enableTestnetFastKdf();
    console.warn('[Nomad] TESTNET FAST KDF is ON. Test builds only; never use with real funds.');
  }
  // TESTNET-ONLY: skip the daily time-of-day window so testers are not locked out for 23 hours.
  // The password and the exact HH:MM:SS Time Key are still required. Off unless switched on.
  if (process.env.EXPO_PUBLIC_NOMAD_TESTNET_OPEN_WINDOW === '1') {
    enableTestnetOpenWindow();
    console.warn('[Nomad] TESTNET OPEN WINDOW is ON. Test builds only; never use with real funds.');
  }
}
