import * as fs from 'fs';
import * as path from 'path';
import { encryptSeedPortable, decryptSeedPortable, PORTABLE_KDF_ITERATIONS } from '../encrypt';
import type { EncryptedBlob } from '../types';

const subtle = (globalThis as any).crypto.subtle as SubtleCrypto;

/** Builds a blob exactly like the old version 2 code did (PBKDF2 at 100,000 iterations). */
async function makeLegacyV2Blob(seed: Uint8Array, secret: string): Promise<EncryptedBlob> {
  const salt = (globalThis as any).crypto.getRandomValues(new Uint8Array(16)) as Uint8Array;
  const iv = (globalThis as any).crypto.getRandomValues(new Uint8Array(12)) as Uint8Array;
  const asBuf = (u: Uint8Array) => u as unknown as BufferSource;
  const base = await subtle.importKey('raw', asBuf(new TextEncoder().encode(secret)), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey(
    { name: 'PBKDF2', salt: asBuf(salt), iterations: 100_000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const enc = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv: asBuf(iv) }, key, asBuf(seed)));
  const tag = enc.slice(enc.length - 16);
  const ct = enc.slice(0, enc.length - 16);
  const joined = new Uint8Array(salt.length + ct.length);
  joined.set(salt, 0);
  joined.set(ct, salt.length);
  return {
    version: 2,
    iv: Buffer.from(iv).toString('base64'),
    authTag: Buffer.from(tag).toString('base64'),
    ciphertext: Buffer.from(joined).toString('base64'),
  };
}

describe('wallet-core encryption', () => {
  const seed = new Uint8Array(Array.from({ length: 32 }, (_, i) => (i * 7 + 3) % 256));

  test('portable encrypt/decrypt round-trips the seed', async () => {
    const blob = await encryptSeedPortable(seed, 'correct horse battery staple');
    const out = await decryptSeedPortable(blob, 'correct horse battery staple');
    expect(Buffer.from(out).equals(Buffer.from(seed))).toBe(true);
  });

  test('new blobs use version 3 and record their key-derivation settings', async () => {
    const blob = await encryptSeedPortable(seed, 'secret');
    expect(blob.version).toBe(3);
    expect(blob.kdf).toEqual({ name: 'PBKDF2-SHA256', iterations: PORTABLE_KDF_ITERATIONS });
    expect(PORTABLE_KDF_ITERATIONS).toBeGreaterThanOrEqual(600_000);
  });

  test('old version 2 blobs still decrypt', async () => {
    const legacy = await makeLegacyV2Blob(seed, 'legacy-secret');
    const out = await decryptSeedPortable(legacy, 'legacy-secret');
    expect(Buffer.from(out).equals(Buffer.from(seed))).toBe(true);
  });

  test('wrong unlock secret fails to decrypt', async () => {
    const blob = await encryptSeedPortable(seed, 'right-secret');
    await expect(decryptSeedPortable(blob, 'wrong-secret')).rejects.toBeDefined();
  });

  test('each encryption uses a fresh salt and IV', async () => {
    const a = await encryptSeedPortable(seed, 'same-secret');
    const b = await encryptSeedPortable(seed, 'same-secret');
    expect(a.iv).not.toEqual(b.iv);
    expect(a.ciphertext).not.toEqual(b.ciphertext);
  });

  test('rejects a version 3 blob whose iterations were lowered (downgrade)', async () => {
    const blob = await encryptSeedPortable(seed, 'secret');
    const tampered = { ...blob, kdf: { name: 'PBKDF2-SHA256' as const, iterations: 1_000 } };
    await expect(decryptSeedPortable(tampered, 'secret')).rejects.toThrow(/outside the accepted range/);
  });

  test('rejects a version 3 blob with absurdly high iterations (denial of service)', async () => {
    const blob = await encryptSeedPortable(seed, 'secret');
    const tampered = { ...blob, kdf: { name: 'PBKDF2-SHA256' as const, iterations: 2_000_000_000 } };
    await expect(decryptSeedPortable(tampered, 'secret')).rejects.toThrow(/outside the accepted range/);
  });

  test('rejects a version 3 blob with missing key-derivation settings', async () => {
    const blob = await encryptSeedPortable(seed, 'secret');
    const { kdf, ...withoutKdf } = blob;
    await expect(decryptSeedPortable(withoutKdf as EncryptedBlob, 'secret')).rejects.toThrow(/missing valid key-derivation/);
  });

  test('source never falls back to Math.random for salts or IVs', () => {
    const file = path.join(__dirname, '..', 'encrypt.ts');
    const code = fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .join('\n');
    expect(code).not.toMatch(/Math\.random/);
  });
});
