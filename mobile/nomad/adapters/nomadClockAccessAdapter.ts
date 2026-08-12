import type { ClockTime, WalletStatus } from '../../types';
import {
  getDailyUnlockTime,
  getWalletMeta,
  getWalletStatus,
  hasWalletPassword,
  setDailyUnlockTime,
  unlockWithClock,
} from '../../services/walletService';
import type { UnlockWithClockResult } from '../../services/walletService';
import { secureGetItem, secureSetItem } from '../../services/nativeStubs';

export type NomadClockAccessStatus =
  | 'no_wallet'
  | 'not_configured'
  | 'password_setup_required'
  | 'waiting'
  | 'window_open'
  | 'unlocked'
  | 'recovery_required';

export type NomadClockAccessEvent = {
  id: string;
  type: 'configured' | 'window_check' | 'unlock_success' | 'unlock_failure';
  title: string;
  detail: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
};

export type NomadClockAccessState = {
  status: NomadClockAccessStatus;
  walletStatus: WalletStatus;
  passwordConfigured: boolean;
  configuredTime: ClockTime | null;
  configuredTimeLabel: string;
  currentTimeLabel: string;
  accessWindowLabel: string;
  windowMinutes: number;
  windowStartAt?: string;
  windowEndAt?: string;
  nextWindowAt?: string;
  countdownSeconds: number;
  countdownLabel: string;
  cycleProgressPercent: number;
  cycleElapsedHours: number;
  timeZoneLabel: string;
  clockSource: 'device_local_clock';
  trustedTimeProviderConnected: false;
  persistence: 'in_memory_stub';
  events: NomadClockAccessEvent[];
};

export type NomadClockAccessResult = UnlockWithClockResult | {
  ok: false;
  reason: 'outside_window' | 'not_configured';
  secondsUntilWindow?: number;
};

export type NomadClockAccessAdapter = {
  getClockAccessState(): Promise<NomadClockAccessState>;
  configureDailyAccessTime(time: ClockTime, password: string): Promise<NomadClockAccessState>;
  verifyAccess(time: ClockTime, password: string): Promise<NomadClockAccessResult>;
};

type StoredClockAccess = {
  events: NomadClockAccessEvent[];
};

const STORAGE_KEY = 'nomad.clock.access.events';
const ACCESS_WINDOW_MINUTES = 15;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_EVENTS = 30;

function nowIso() {
  return new Date().toISOString();
}

function identifier(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTime(time: ClockTime): ClockTime {
  const hour = Number(time.hour);
  const minute = Number(time.minute);
  const second = Number(time.second);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error('Hour must be between 00 and 23.');
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error('Minute must be between 00 and 59.');
  if (!Number.isInteger(second) || second < 0 || second > 59) throw new Error('Second must be between 00 and 59.');
  return { hour, minute, second };
}

function formatClock(time: ClockTime | null) {
  if (!time) return 'Not configured';
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}:${String(time.second).padStart(2, '0')}`;
}

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getTimeZoneLabel() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Device local time';
  } catch {
    return 'Device local time';
  }
}

function windowFor(time: ClockTime, now: Date) {
  const todayStart = new Date(now);
  todayStart.setHours(time.hour, time.minute, time.second, 0);
  const todayEnd = new Date(todayStart.getTime() + ACCESS_WINDOW_MINUTES * 60 * 1000);

  if (now.getTime() < todayStart.getTime()) {
    return {
      previousStart: new Date(todayStart.getTime() - DAY_MS),
      activeStart: todayStart,
      activeEnd: todayEnd,
      nextStart: todayStart,
      open: false,
    };
  }

  if (now.getTime() <= todayEnd.getTime()) {
    return {
      previousStart: new Date(todayStart.getTime() - DAY_MS),
      activeStart: todayStart,
      activeEnd: todayEnd,
      nextStart: todayStart,
      open: true,
    };
  }

  const tomorrowStart = new Date(todayStart.getTime() + DAY_MS);
  return {
    previousStart: todayStart,
    activeStart: todayStart,
    activeEnd: todayEnd,
    nextStart: tomorrowStart,
    open: false,
  };
}

async function loadStoredState(): Promise<StoredClockAccess> {
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return { events: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<StoredClockAccess>;
    return { events: Array.isArray(parsed.events) ? parsed.events : [] };
  } catch {
    return { events: [] };
  }
}

async function addEvent(event: Omit<NomadClockAccessEvent, 'id' | 'timestamp'>) {
  const stored = await loadStoredState();
  const next: StoredClockAccess = {
    events: [{ id: identifier('clock-event'), timestamp: nowIso(), ...event }, ...stored.events].slice(0, MAX_EVENTS),
  };
  await secureSetItem(STORAGE_KEY, JSON.stringify(next));
}

async function buildState(now = new Date()): Promise<NomadClockAccessState> {
  const [walletStatus, configuredTime, walletMeta, passwordConfigured, stored] = await Promise.all([
    getWalletStatus(),
    getDailyUnlockTime(),
    getWalletMeta(),
    hasWalletPassword(),
    loadStoredState(),
  ]);

  const currentTimeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const base = {
    walletStatus,
    passwordConfigured,
    configuredTime,
    configuredTimeLabel: formatClock(configuredTime),
    currentTimeLabel,
    windowMinutes: ACCESS_WINDOW_MINUTES,
    timeZoneLabel: getTimeZoneLabel(),
    clockSource: 'device_local_clock' as const,
    trustedTimeProviderConnected: false as const,
    persistence: 'in_memory_stub' as const,
    events: stored.events,
  };

  if (!walletMeta || walletStatus === 'no_wallet') {
    return {
      ...base,
      status: 'no_wallet',
      accessWindowLabel: 'Wallet setup required',
      countdownSeconds: 0,
      countdownLabel: '00:00:00',
      cycleProgressPercent: 0,
      cycleElapsedHours: 0,
    };
  }

  if (walletStatus === 'recovery') {
    return {
      ...base,
      status: 'recovery_required',
      accessWindowLabel: configuredTime ? `${formatClock(configuredTime)} local` : 'Recovery required',
      countdownSeconds: 0,
      countdownLabel: 'LOCKED',
      cycleProgressPercent: 0,
      cycleElapsedHours: 0,
    };
  }

  if (!passwordConfigured) {
    return {
      ...base,
      status: 'password_setup_required',
      accessWindowLabel: 'Password setup required',
      countdownSeconds: 0,
      countdownLabel: 'LOCKED',
      cycleProgressPercent: 0,
      cycleElapsedHours: 0,
    };
  }

  if (!configuredTime) {
    return {
      ...base,
      status: 'not_configured',
      accessWindowLabel: 'Not configured',
      countdownSeconds: 0,
      countdownLabel: '00:00:00',
      cycleProgressPercent: 0,
      cycleElapsedHours: 0,
    };
  }

  const window = windowFor(configuredTime, now);
  const countdownSeconds = window.open ? 0 : Math.max(0, Math.ceil((window.nextStart.getTime() - now.getTime()) / 1000));
  const elapsedSincePreviousStart = Math.max(0, now.getTime() - window.previousStart.getTime());
  const cycleProgressPercent = window.open ? 100 : Math.max(0, Math.min(99, Math.round((elapsedSincePreviousStart / DAY_MS) * 100)));
  const cycleElapsedHours = Math.max(0, Math.min(24, elapsedSincePreviousStart / (60 * 60 * 1000)));
  const endTime: ClockTime = {
    hour: window.activeEnd.getHours(),
    minute: window.activeEnd.getMinutes(),
    second: window.activeEnd.getSeconds(),
  };
  const status: NomadClockAccessStatus = walletStatus === 'unlocked'
    ? 'unlocked'
    : window.open
      ? 'window_open'
      : 'waiting';

  return {
    ...base,
    status,
    accessWindowLabel: `${formatClock(configuredTime)}–${formatClock(endTime)} local`,
    windowStartAt: window.activeStart.toISOString(),
    windowEndAt: window.activeEnd.toISOString(),
    nextWindowAt: window.nextStart.toISOString(),
    countdownSeconds,
    countdownLabel: walletStatus === 'unlocked' ? 'UNLOCKED' : window.open ? 'OPEN NOW' : formatCountdown(countdownSeconds),
    cycleProgressPercent,
    cycleElapsedHours,
  };
}

async function configureDailyAccessTime(time: ClockTime, password: string) {
  const normalized = normalizeTime(time);
  const walletStatus = await getWalletStatus();
  if (walletStatus === 'locked' || walletStatus === 'recovery') {
    throw new Error('Unlock the wallet or complete verified recovery before changing the daily access time.');
  }
  await setDailyUnlockTime(normalized, password);
  await addEvent({
    type: 'configured',
    title: 'Daily access time configured',
    detail: `${formatClock(normalized)} device local time • ${ACCESS_WINDOW_MINUTES}-minute access window`,
    severity: 'warning',
  });
  return buildState();
}

async function verifyAccess(time: ClockTime, password: string): Promise<NomadClockAccessResult> {
  const normalized = normalizeTime(time);
  const state = await buildState();

  if (state.status === 'not_configured') {
    return { ok: false, reason: 'not_configured' };
  }
  if (state.status === 'password_setup_required') {
    return { ok: false, reason: 'password_not_configured' };
  }
  if (state.status === 'waiting') {
    await addEvent({
      type: 'unlock_failure',
      title: 'Clock access attempted outside window',
      detail: `Next local access window begins in ${state.countdownLabel}. No wallet decryption was attempted.`,
      severity: 'warning',
    });
    return { ok: false, reason: 'outside_window', secondsUntilWindow: state.countdownSeconds };
  }
  if (state.status === 'no_wallet') return { ok: false, reason: 'no_wallet' };
  if (state.status === 'recovery_required') {
    return { ok: false, reason: 'locked_out', permanentlyLocked: true };
  }
  if (state.status === 'unlocked') return { ok: true };

  const result = await unlockWithClock(normalized, password);
  await addEvent(result.ok ? {
    type: 'unlock_success',
    title: 'Password and Time Key verified',
    detail: 'The wallet password and full HH:MM:SS Time Key matched inside the daily access window.',
    severity: 'info',
  } : {
    type: 'unlock_failure',
    title: 'Clock access verification failed',
    detail: `Wallet service result: ${result.reason.replace(/_/g, ' ')}.`,
    severity: result.permanentlyLocked ? 'critical' : 'warning',
  });
  return result;
}

export const nomadClockAccessAdapter: NomadClockAccessAdapter = {
  getClockAccessState: () => buildState(),
  configureDailyAccessTime,
  verifyAccess,
};
