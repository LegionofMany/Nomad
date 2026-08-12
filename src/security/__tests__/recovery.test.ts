import { buildRecoveryRegistry, verifyByDerivation } from '../recovery';

describe('recovery flow', () => {
  test('verify by derivation succeeds for matching registry', () => {
    const master = 'master-secret-for-tests';
    const positions = Array.from({ length: 24 }, (_, index) => ({
      hour: index,
      minute: index,
      second: index,
    }));
    const now = new Date(2026, 0, 13);
    const registry = buildRecoveryRegistry(master, positions, now);
    const res = verifyByDerivation(master, positions, registry, now);
    expect(res.success).toBe(true);
  });

  test('a different second does not verify', () => {
    const master = 'master-secret-for-tests';
    const positions = Array.from({ length: 24 }, (_, index) => ({ hour: index, minute: 0, second: index }));
    const now = new Date(2026, 0, 13);
    const registry = buildRecoveryRegistry(master, positions, now);
    const changed = positions.map((position, index) => index === 0 ? { ...position, second: 59 } : position);
    const result = verifyByDerivation(master, changed, registry, now, undefined, 24);
    expect(result.success).toBe(false);
    expect(result.matches).toBe(23);
  });
});
