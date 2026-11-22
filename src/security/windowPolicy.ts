/**
 * Daily access window policy helpers.
 *
 * 1. TESTNET-ONLY open-window mode. The daily 15-minute window locks the owner out of the
 *    wallet for most of the day (including after every auto-lock), which makes testing
 *    impossible. In test builds, mobile/polyfills.ts switches this on when
 *    EXPO_PUBLIC_NOMAD_TESTNET_OPEN_WINDOW=1. The wallet password and the exact HH:MM:SS
 *    Time Key are STILL required; only the time-of-day window is skipped. Off by default,
 *    so a normal build keeps the window. Never ship a release build with this on.
 *
 * 2. Display rounding. While the wallet is locked, nothing on screen may reveal the Time Key
 *    to the second, so countdowns are rounded up to whole minutes.
 */

let openWindow = false;

export function enableTestnetOpenWindow(): void {
  openWindow = true;
}

export function isTestnetOpenWindow(): boolean {
  return openWindow;
}

/** Rounds a number of seconds UP to a whole number of minutes (in seconds). */
export function roundUpToMinute(seconds: number): number {
  const safe = Math.max(0, Math.ceil(Number.isFinite(seconds) ? seconds : 0));
  return Math.ceil(safe / 60) * 60;
}

/** "about 18 h 40 min" or "about 25 min". Never shows seconds. */
export function formatApproxDuration(seconds: number): string {
  const minutes = Math.ceil(Math.max(0, Number.isFinite(seconds) ? seconds : 0) / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `about ${m} min` : `about ${h} h ${String(m).padStart(2, "0")} min`;
}

/** "13:00" from a configured time, dropping the seconds. */
export function minuteLabel(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
