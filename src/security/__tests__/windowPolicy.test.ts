import { enableTestnetOpenWindow, formatApproxDuration, isTestnetOpenWindow, minuteLabel, roundUpToMinute } from '../windowPolicy';

test('open-window mode is off until explicitly enabled', () => {
  expect(isTestnetOpenWindow()).toBe(false);
  enableTestnetOpenWindow();
  expect(isTestnetOpenWindow()).toBe(true);
});

test('countdowns are rounded up to whole minutes, never revealing seconds', () => {
  expect(roundUpToMinute(0)).toBe(0);
  expect(roundUpToMinute(1)).toBe(60);
  expect(roundUpToMinute(59)).toBe(60);
  expect(roundUpToMinute(60)).toBe(60);
  expect(roundUpToMinute(61)).toBe(120);
  expect(roundUpToMinute(18 * 3600 + 39 * 60 + 38)).toBe(18 * 3600 + 40 * 60);
  expect(roundUpToMinute(-5)).toBe(0);
  expect(roundUpToMinute(Number.NaN)).toBe(0);
});

test('durations read as hours and minutes only', () => {
  expect(formatApproxDuration(18 * 3600 + 39 * 60 + 38)).toBe('about 18 h 40 min');
  expect(formatApproxDuration(25 * 60)).toBe('about 25 min');
  expect(formatApproxDuration(3600)).toBe('about 1 h 00 min');
  expect(formatApproxDuration(0)).toBe('about 0 min');
  expect(formatApproxDuration(Number.NaN)).toBe('about 0 min');
  expect(formatApproxDuration(18 * 3600 + 39 * 60 + 38)).not.toMatch(/:\d\d:\d\d/);
});

test('minute label drops the seconds', () => {
  expect(minuteLabel(13, 0)).toBe('13:00');
  expect(minuteLabel(7, 5)).toBe('07:05');
});
