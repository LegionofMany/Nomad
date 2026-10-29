import { isWithinDailyUnlock, getActiveUnlockSecret } from '../clock';

describe('clock unlock', () => {
  test('unlocks at correct time', () => {
    const cfg = { hour: 12, minute: 30, second: 27, toleranceMinutes: 5 };
    const now = new Date(2026, 0, 13, 12, 30);
    expect(isWithinDailyUnlock(cfg, now)).toBe(true);
    const s = getActiveUnlockSecret('master-secret-xyz', cfg, now);
    expect(typeof s).toBe('string');
  });

  test('fails at wrong time', () => {
    const cfg = { hour: 9, minute: 15, second: 0, toleranceMinutes: 1 };
    const now = new Date(2026, 0, 13, 10, 15);
    expect(isWithinDailyUnlock(cfg, now)).toBe(false);
    expect(getActiveUnlockSecret('master-secret-xyz', cfg, now)).toBeNull();
  });

  test('seconds are part of the derived Time Key', () => {
    const now = new Date(2026, 0, 13, 12, 30, 27);
    const first = getActiveUnlockSecret('master-secret-xyz', { hour: 12, minute: 30, second: 27 }, now);
    const second = getActiveUnlockSecret('master-secret-xyz', { hour: 12, minute: 30, second: 28 }, now);
    expect(first).not.toEqual(second);
  });
});
