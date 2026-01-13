import { buildRecoveryRegistry, verifyByDerivation } from '../recovery';

describe('recovery flow', () => {
  test('verify by derivation succeeds for matching registry', () => {
    const master = 'master-secret-for-tests';
    const positions = Array.from({ length: 24 }, () => ({ hour: 0, minute: 0 }));
    const now = new Date(2026, 0, 13);
    const registry = buildRecoveryRegistry(master, positions, now);
    const res = verifyByDerivation(master, positions, registry, now);
    expect(res.success).toBe(true);
  });
});
