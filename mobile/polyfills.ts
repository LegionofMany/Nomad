/**
 * Runtime setup for the wallet engine. Import this FIRST in index.ts.
 * Hermes has no global Buffer; the Bitcoin libraries expect one.
 * The browser (and Hermes) also have no process.version, which the
 * readable-stream package reads while loading.
 */
import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import { installNativeWebCrypto } from './shims/webcrypto';

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
}
