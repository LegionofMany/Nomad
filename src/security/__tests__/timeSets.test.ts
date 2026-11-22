import { randomBytes } from 'crypto';
import { deriveEvmAccount } from '../../wallet-core/deriveEvm';
import { entropyToMnemonic, validateMnemonic } from '../../wallet-core/seed';
import {
  TIME_SET_COUNT,
  deriveRecoveryEntropy,
  formatTimeSet,
  generateTimeSets,
  parseTimeSets,
  validateTimeSets,
} from '../timeSets';
import type { TimeSet } from '../timeSets';

const FAST = 8; // iterations: logic tests only, the real count is a policy choice
const nodeRandom = (n: number) => new Uint8Array(randomBytes(n));
const fixed = (): TimeSet[] => Array.from({ length: TIME_SET_COUNT }, (_, i) => ({ hour: i, minute: (i * 7) % 60, second: (i * 13) % 60 }));
const hex = (b: Uint8Array) => Buffer.from(b).toString('hex');

describe('generating Time Sets', () => {
  test('produces 24 valid, distinct times', () => {
    const sets = generateTimeSets(nodeRandom);
    expect(sets).toHaveLength(24);
    expect(() => validateTimeSets(sets)).not.toThrow();
    expect(new Set(sets.map(formatTimeSet)).size).toBe(24);
  });

  test('two backups are different', () => {
    expect(generateTimeSets(nodeRandom).map(formatTimeSet)).not.toEqual(generateTimeSets(nodeRandom).map(formatTimeSet));
  });

  test('works with the global secure random source', () => {
    expect(generateTimeSets()).toHaveLength(24);
  });

  test('values that would bias the result are thrown away', () => {
    // 0xFFFFFFFF is above the unbiased limit, so it must be skipped, not wrapped into a time.
    const feed: number[][] = [[255, 255, 255, 255]];
    let i = 0;
    const random = (n: number) => {
      if (feed.length) return Uint8Array.from(feed.shift() as number[]);
      i += 1;
      return Uint8Array.from([0, 0, i >> 8, i & 255]); // increasing seconds-of-day 1,2,3...
    };
    const sets = generateTimeSets(random);
    expect(formatTimeSet(sets[0])).toBe('00:00:01');
    expect(formatTimeSet(sets[1])).toBe('00:00:02');
  });

  test('a repeated draw is skipped so all 24 stay distinct', () => {
    let calls = 0;
    const random = () => {
      calls += 1;
      const v = calls <= 2 ? 5 : calls; // 5, 5 (duplicate), 3, 4, 5 (duplicate)...
      return Uint8Array.from([0, 0, v >> 8, v & 255]);
    };
    const sets = generateTimeSets(random);
    expect(new Set(sets.map(formatTimeSet)).size).toBe(24);
  });

  test('refuses to run without secure random numbers', () => {
    const original = (globalThis as any).crypto;
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    try {
      expect(() => generateTimeSets()).toThrow(/secure random/i);
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
    }
  });
});

describe('typing Time Sets back in', () => {
  const text = fixed().map(formatTimeSet).join('\n');

  test('round-trips what the backup page shows', () => {
    const parsed = parseTimeSets(text);
    expect(parsed.problems).toEqual([]);
    expect(parsed.sets).toEqual(fixed());
  });

  test('accepts numbering, commas, spaces and one-digit hours', () => {
    const numbered = fixed().map((t, i) => `${i + 1}. ${formatTimeSet(t)}`).join(', ');
    expect(parseTimeSets(numbered).sets).toEqual(fixed());
    expect(parseTimeSets('9:05:07 | 10:00:00').sets).toEqual([{ hour: 9, minute: 5, second: 7 }, { hour: 10, minute: 0, second: 0 }]);
  });

  test('reports what it could not read', () => {
    const r = parseTimeSets('13:00:00 25:00:00 12:61:00 abc 12:00');
    expect(r.sets).toEqual([{ hour: 13, minute: 0, second: 0 }]);
    expect(r.problems).toEqual(['25:00:00', '12:61:00', 'abc', '12:00']);
  });

  test('handles empty and odd input without throwing', () => {
    expect(parseTimeSets('')).toEqual({ sets: [], problems: [] });
    expect(parseTimeSets(undefined as any)).toEqual({ sets: [], problems: [] });
  });
});

describe('validating', () => {
  test('wrong count is refused with a plain message', () => {
    expect(() => validateTimeSets(fixed().slice(0, 23))).toThrow(/all 24.*have 23/i);
  });
  test('out of range and duplicate times are refused', () => {
    const bad = fixed();
    bad[3] = { hour: 24, minute: 0, second: 0 };
    expect(() => validateTimeSets(bad)).toThrow(/Time Set 4/);
    const dup = fixed();
    dup[5] = dup[2];
    expect(() => validateTimeSets(dup)).toThrow(/same/i);
  });
});

describe('deriving the wallet', () => {
  test('the same Time Sets and password always give the same wallet', () => {
    expect(hex(deriveRecoveryEntropy(fixed(), 'correct horse', FAST))).toBe(hex(deriveRecoveryEntropy(fixed(), 'correct horse', FAST)));
    expect(deriveRecoveryEntropy(fixed(), 'correct horse', FAST)).toHaveLength(32);
  });

  test('a different password gives a different wallet', () => {
    expect(hex(deriveRecoveryEntropy(fixed(), 'correct horse', FAST))).not.toBe(hex(deriveRecoveryEntropy(fixed(), 'correct horsf', FAST)));
  });

  test('one changed second gives a different wallet', () => {
    const changed = fixed();
    changed[10] = { ...changed[10], second: (changed[10].second + 1) % 60 };
    expect(hex(deriveRecoveryEntropy(changed, 'pw', FAST))).not.toBe(hex(deriveRecoveryEntropy(fixed(), 'pw', FAST)));
  });

  test('the ORDER of the Time Sets matters', () => {
    const swapped = fixed();
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    expect(hex(deriveRecoveryEntropy(swapped, 'pw', FAST))).not.toBe(hex(deriveRecoveryEntropy(fixed(), 'pw', FAST)));
  });

  test('the iteration count changes the result (so the backup page names its profile)', () => {
    expect(hex(deriveRecoveryEntropy(fixed(), 'pw', 8))).not.toBe(hex(deriveRecoveryEntropy(fixed(), 'pw', 9)));
  });

  test('accented passwords give the same wallet however they are typed', () => {
    expect(hex(deriveRecoveryEntropy(fixed(), 'café', FAST))).toBe(hex(deriveRecoveryEntropy(fixed(), 'café', FAST)));
  });

  test('an empty password or bad Time Sets are refused', () => {
    expect(() => deriveRecoveryEntropy(fixed(), '', FAST)).toThrow(/password/i);
    expect(() => deriveRecoveryEntropy(fixed().slice(1), 'pw', FAST)).toThrow();
  });
});

describe('create, lose the phone, recover', () => {
  test('the same Time Sets and password rebuild the same wallet address', () => {
    // Day 1: create.
    const sets = generateTimeSets(nodeRandom);
    const created = entropyToMnemonic(deriveRecoveryEntropy(sets, 'My strong password', FAST));
    expect(created.split(' ')).toHaveLength(24);
    expect(validateMnemonic(created)).toBe(true);
    const originalAddress = deriveEvmAccount(created, 0).address;

    // Later, on a new phone: the owner types the backup page back in.
    const typed = parseTimeSets(sets.map((t, i) => `${i + 1}. ${formatTimeSet(t)}`).join('\n'));
    expect(typed.problems).toEqual([]);
    const recovered = entropyToMnemonic(deriveRecoveryEntropy(typed.sets, 'My strong password', FAST));
    expect(deriveEvmAccount(recovered, 0).address).toBe(originalAddress);
  });

  test('a wrong password does NOT recover the wallet, it gives a different empty one', () => {
    const sets = generateTimeSets(nodeRandom);
    const right = deriveEvmAccount(entropyToMnemonic(deriveRecoveryEntropy(sets, 'right', FAST)), 0).address;
    const wrong = deriveEvmAccount(entropyToMnemonic(deriveRecoveryEntropy(sets, 'wrong', FAST)), 0).address;
    expect(wrong).not.toBe(right);
  });
});
