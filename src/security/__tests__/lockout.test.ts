import LockoutManager from '../lockout';

describe('lockout behavior', () => {
  test('temporary lock after failures', () => {
    const cfg = { delaysSeconds: [0, 1, 2], failureWindowSeconds: 60, permanentLockAfterFailures: 0 };
    const m = new LockoutManager(cfg as any);
    const t0 = Date.now();
    m.recordFailedAttempt(t0);
    expect(m.getRemainingLockSeconds(t0)).toBe(0);
    m.recordFailedAttempt(t0 + 10);
    // after second failure a short delay should be set
    expect(m.getRemainingLockSeconds(t0 + 10)).toBeGreaterThanOrEqual(1);
  });

  test('permanent lock triggers after threshold', () => {
    const m = new LockoutManager({ permanentLockAfterFailures: 2 } as any);
    const t = Date.now();
    m.recordFailedAttempt(t);
    m.recordFailedAttempt(t + 1);
    const d = m.diagnostics();
    expect(d.permanentlyLocked).toBe(true);
    expect(m.isLocked()).toBe(true);
  });
});
