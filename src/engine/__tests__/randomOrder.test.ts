/**
 * Regression: @noble/hashes captures globalThis.crypto the first time it is imported.
 * The phone random-values shim must be installed before that, or wallet creation fails with
 * "crypto.getRandomValues must be defined".
 */
jest.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => new Uint8Array(require('crypto').randomBytes(n)),
}), { virtual: true });

describe('phone random values are installed before noble loads', () => {
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

  afterAll(() => {
    if (saved) Object.defineProperty(globalThis, 'crypto', saved);
  });

  it('noble randomBytes works when the engine has no crypto of its own', () => {
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true, writable: true });
    jest.isolateModules(() => {
      require('../../../mobile/shims/randomValues');
      const { randomBytes } = require('@noble/hashes/utils');
      const out = randomBytes(16);
      expect(out).toBeInstanceOf(Uint8Array);
      expect(out.length).toBe(16);
    });
  });

  it('a fresh phrase can be generated in that situation', () => {
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true, writable: true });
    jest.isolateModules(() => {
      require('../../../mobile/shims/randomValues');
      const { generateMnemonic } = require('../../wallet-core/seed');
      expect(generateMnemonic().split(' ').length).toBe(12);
    });
  });
});
