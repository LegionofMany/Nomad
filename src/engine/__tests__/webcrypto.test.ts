/** The phone WebCrypto shim must produce exactly what real WebCrypto (Node) produces. */
import { webcrypto, randomBytes } from 'crypto';

jest.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => new Uint8Array(require('crypto').randomBytes(n)),
}), { virtual: true });

import { installNativeWebCrypto } from '../../../mobile/shims/webcrypto';
import { encryptSeedPortable, decryptSeedPortable } from '../../wallet-core/encrypt';

const real = webcrypto.subtle;
const enc = (s: string) => new TextEncoder().encode(s);

describe('phone WebCrypto shim', () => {
  const saved = (globalThis as any).crypto;
  let shim: any;

  beforeAll(() => {
    (globalThis as any).crypto = {};
    installNativeWebCrypto();
    shim = (globalThis as any).crypto;
  });
  afterAll(() => {
    Object.defineProperty(globalThis, 'crypto', { value: saved, configurable: true, writable: true });
  });

  it('PBKDF2-SHA256 matches real WebCrypto', async () => {
    const salt = new Uint8Array(randomBytes(16));
    const mine = new Uint8Array(await shim.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 5000 },
      await shim.subtle.importKey('raw', enc('pw'), 'PBKDF2'), 512));
    const ref = new Uint8Array(await real.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 5000 },
      await real.importKey('raw', enc('pw'), 'PBKDF2', false, ['deriveBits']), 512));
    expect(Buffer.from(mine).toString('hex')).toBe(Buffer.from(ref).toString('hex'));
  });

  it('HMAC-SHA256 and SHA-256 match', async () => {
    const k = await shim.subtle.importKey('raw', enc('secret'), { name: 'HMAC', hash: 'SHA-256' });
    const mine = Buffer.from(await shim.subtle.sign('HMAC', k, enc('payload'))).toString('hex');
    const rk = await real.importKey('raw', enc('secret'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    expect(mine).toBe(Buffer.from(await real.sign('HMAC', rk, enc('payload'))).toString('hex'));
    expect(Buffer.from(await shim.subtle.digest('SHA-256', enc('abc'))).toString('hex'))
      .toBe(Buffer.from(await real.digest('SHA-256', enc('abc'))).toString('hex'));
  });

  it('AES-GCM interoperates both ways with real WebCrypto', async () => {
    const raw = new Uint8Array(randomBytes(32));
    const iv = new Uint8Array(randomBytes(12));
    const data = enc('seed bytes');
    const sk = await shim.subtle.importKey('raw', raw, 'AES-GCM');
    const rk = await real.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
    const a = await shim.subtle.encrypt({ name: 'AES-GCM', iv }, sk, data);
    expect(Buffer.from(await real.decrypt({ name: 'AES-GCM', iv }, rk, a)).toString()).toBe('seed bytes');
    const b = await real.encrypt({ name: 'AES-GCM', iv }, rk, data);
    expect(Buffer.from(await shim.subtle.decrypt({ name: 'AES-GCM', iv }, sk, b)).toString()).toBe('seed bytes');
  });

  it('wallet seed encrypts and decrypts through the shim', async () => {
    const seed = new Uint8Array(randomBytes(64));
    const blob = await encryptSeedPortable(seed, 'unlock-secret');
    expect(blob.version).toBe(3);
    const out = await decryptSeedPortable(blob, 'unlock-secret');
    expect(Buffer.from(out).toString('hex')).toBe(Buffer.from(seed).toString('hex'));
  }, 120000);

  it('getRandomValues fills and varies', () => {
    const a = shim.getRandomValues(new Uint8Array(32));
    const b = shim.getRandomValues(new Uint8Array(32));
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });
});
