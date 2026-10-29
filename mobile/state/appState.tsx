import * as React from "react";

import type { ClockTime, Portfolio, WalletStatus } from "../types";
import {
  disableNfc,
  enableNfc,
  secureGetItem,
  secureRemoveItem,
  secureSetItem,
} from "../services/nativeStubs";

import * as walletService from "../services/walletService";
import {
  nomadClockAccessAdapter,
  type NomadClockAccessResult,
} from "../nomad/adapters/nomadClockAccessAdapter";

export type AppState = {
  walletStatus: WalletStatus;
  walletMeta: { evmAddress: string; createdAt: string } | null;

  unlockTime: ClockTime | null;
  setUnlockTime: (t: ClockTime, password: string) => Promise<void>;

  portfolio: Portfolio | null;

  travelModeEnabled: boolean;
  travelRegionInput: string;
  preferredStablecoin: string | null;

  enableTravelMode: (regionInput: string) => Promise<{ preferredStablecoin: string }>;
  disableTravelMode: () => Promise<void>;

  createWallet: (password: string, initialUnlockTime: ClockTime) => Promise<{ mnemonic: string; evmAddress: string }>;
  restoreWallet: (mnemonic: string, password: string, initialUnlockTime: ClockTime) => Promise<{ evmAddress: string }>;
  unlockWithClock: (time: ClockTime, password: string) => Promise<NomadClockAccessResult>;
  lockWallet: () => Promise<void>;
  refresh: () => Promise<void>;

  nfcEnabled: boolean;
  toggleNfc: () => Promise<void>;

  resetDemo: () => Promise<void>;
};

const STORAGE_KEYS = {
  nfcEnabled: "nomad.nfcEnabled",
} as const;

const AppStateContext = React.createContext<AppState | null>(null);

function parseBoolean(value: string | null, fallback = false): boolean {
  if (value === null) return fallback;
  return value === "true";
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [walletStatus, setWalletStatus] = React.useState<WalletStatus>("no_wallet");
  const [walletMeta, setWalletMeta] = React.useState<{ evmAddress: string; createdAt: string } | null>(null);
  const [unlockTime, setUnlockTimeState] = React.useState<ClockTime | null>(null);
  const [portfolio, setPortfolio] = React.useState<Portfolio | null>(null);

  const [travelModeEnabled, setTravelModeEnabled] = React.useState(false);
  const [travelRegionInput, setTravelRegionInput] = React.useState<string>("US");
  const [preferredStablecoin, setPreferredStablecoin] = React.useState<string | null>(null);

  const [nfcEnabled, setNfcEnabledState] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const status = await walletService.getWalletStatus();
    const meta = await walletService.getWalletMeta();
    const time = await walletService.getDailyUnlockTime();
    const travel = await walletService.getTravelState();

    setWalletStatus(status);
    setWalletMeta(meta);
    setUnlockTimeState(time);
    setTravelModeEnabled(!!travel.enabled);
    setTravelRegionInput(travel.regionInput ?? "US");
    setPreferredStablecoin(travel.preferredStablecoin ?? null);

    if (status === "unlocked") {
      try {
        setPortfolio(await walletService.getPortfolio());
      } catch {
        setPortfolio(null);
      }
    } else {
      setPortfolio(null);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const storedNfcEnabled = parseBoolean(await secureGetItem(STORAGE_KEYS.nfcEnabled), false);

      if (cancelled) return;
      setNfcEnabledState(storedNfcEnabled);

      await refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const api = React.useMemo<AppState>(() => {
    return {
      walletStatus,
      walletMeta,

      unlockTime,
      setUnlockTime: async (t, password) => {
        await nomadClockAccessAdapter.configureDailyAccessTime(t, password);
        await refresh();
      },

      portfolio,

      travelModeEnabled,
      travelRegionInput,
      preferredStablecoin,

      enableTravelMode: async (regionInput) => {
        const res = await walletService.enableTravelMode(regionInput);
        await refresh();
        return res;
      },
      disableTravelMode: async () => {
        await walletService.disableTravelMode();
        await refresh();
      },

      createWallet: async (password, initialUnlockTime) => {
        const res = await walletService.createWallet(password, initialUnlockTime);
        await refresh();
        return res;
      },
      restoreWallet: async (mnemonic, password, initialUnlockTime) => {
        const res = await walletService.restoreWallet(mnemonic, password, initialUnlockTime);
        await refresh();
        return res;
      },
      unlockWithClock: async (time, password) => {
        const res = await nomadClockAccessAdapter.verifyAccess(time, password);
        await refresh();
        return res;
      },
      lockWallet: async () => {
        await walletService.lockWallet();
        await refresh();
      },
      refresh,

      nfcEnabled,
      toggleNfc: async () => {
        const next = !nfcEnabled;
        setNfcEnabledState(next);
        await secureSetItem(STORAGE_KEYS.nfcEnabled, String(next));

        if (next) await enableNfc();
        else await disableNfc();
      },

      resetDemo: async () => {
        setNfcEnabledState(false);
        await secureRemoveItem(STORAGE_KEYS.nfcEnabled);

        await walletService.resetWallet();
        await refresh();
      },
    };
  }, [nfcEnabled, portfolio, preferredStablecoin, refresh, travelModeEnabled, travelRegionInput, unlockTime, walletMeta, walletStatus]);

  return React.createElement(AppStateContext.Provider, { value: api }, children);
}

export function useAppState(): AppState {
  const ctx = React.useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
