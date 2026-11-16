import { randomBytes } from 'crypto';

describe('testnet fast key stretching', () => {
  it('is off by default and keeps the full counts', () => {
    jest.isolateModules(() => {
      const p = require('../kdfPolicy');
      expect(p.isTestnetFastKdf()).toBe(false);
      expect(p.kdfIterations(600_000)).toBe(600_000);
      expect(p.kdfMinAccepted(600_000)).toBe(600_000);
    });
  });

  it('fast mode makes quick wallets, and a normal build refuses to open them', async () => {
    const seed = new Uint8Array(randomBytes(64));
    let blob: any;

    await jest.isolateModulesAsync(async () => {
      require('../kdfPolicy').enableTestnetFastKdf();
      const enc = require('../../wallet-core/encrypt');
      const pw = require('../passwordCredential');
      blob = await enc.encryptSeedPortable(seed, 'unlock-secret');
      expect(blob.kdf.iterations).toBe(3_000);
      const out = await enc.decryptSeedPortable(blob, 'unlock-secret');
      expect(Buffer.from(out).equals(Buffer.from(seed))).toBe(true);
      const e = await pw.enrollPassword('a-long-test-password');
      expect(e.credential.iterations).toBe(3_000);
      expect((await pw.verifyPassword('a-long-test-password', e.credential)).ok).toBe(true);
    });

    await jest.isolateModulesAsync(async () => {
      const enc = require('../../wallet-core/encrypt');
      await expect(enc.decryptSeedPortable(blob, 'unlock-secret')).rejects.toThrow(/outside the accepted range/);
    });
  }, 60000);
});
