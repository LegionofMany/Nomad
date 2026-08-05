import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters';
import type { NomadOverlayAdapters, NomadTravelPocketState } from '../adapters/walletAdapter';

type RegionCurrency = {
  match: RegExp;
  stablecoin: string;
  code: string;
  symbol: string;
  previewRate: number;
};

const regionCurrencies: RegionCurrency[] = [
  { match: /canada|toronto|vancouver|montreal|alberta|ontario|quebec/i, stablecoin: 'CAD Stable', code: 'CAD', symbol: 'C$', previewRate: 1.35 },
  { match: /united states|usa|america|new york|california|florida|texas/i, stablecoin: 'USD Stable', code: 'USD', symbol: '$', previewRate: 1 },
  { match: /mexico|cancun|mexico city/i, stablecoin: 'MXN Stable', code: 'MXN', symbol: 'MX$', previewRate: 17 },
  { match: /europe|france|germany|italy|spain|portugal|netherlands|ireland|greece|austria|belgium/i, stablecoin: 'EUR Stable', code: 'EUR', symbol: '€', previewRate: 0.92 },
  { match: /united kingdom|england|scotland|wales|london/i, stablecoin: 'GBP Stable', code: 'GBP', symbol: '£', previewRate: 0.79 },
  { match: /japan|tokyo|osaka|kyoto/i, stablecoin: 'JPY Stable', code: 'JPY', symbol: '¥', previewRate: 153.4 },
  { match: /nigeria|lagos|abuja/i, stablecoin: 'NGN Stable', code: 'NGN', symbol: '₦', previewRate: 1600 },
  { match: /australia|sydney|melbourne|brisbane/i, stablecoin: 'AUD Stable', code: 'AUD', symbol: 'A$', previewRate: 1.52 },
  { match: /india|delhi|mumbai|bangalore/i, stablecoin: 'INR Stable', code: 'INR', symbol: '₹', previewRate: 83.5 },
  { match: /uae|united arab emirates|dubai|abu dhabi/i, stablecoin: 'AED Stable', code: 'AED', symbol: 'د.إ', previewRate: 3.67 },
  { match: /brazil|rio|sao paulo/i, stablecoin: 'BRL Stable', code: 'BRL', symbol: 'R$', previewRate: 5.1 },
  { match: /south korea|korea|seoul/i, stablecoin: 'KRW Stable', code: 'KRW', symbol: '₩', previewRate: 1370 },
];

const globalCurrency: RegionCurrency = {
  match: /.*/,
  stablecoin: 'USD Stable',
  code: 'USD',
  symbol: '$',
  previewRate: 1,
};

const fallbackTravelPocket: NomadTravelPocketState = {
  enabled: false,
  regionInput: 'Global',
  preferredStablecoin: 'USD Stable',
  pocketBalanceFiat: '$1,208.64',
  pocketBalanceLocal: '$1,208.64',
  localCurrency: 'USD Stable',
};

function resolveRegionCurrency(regionInput?: string): RegionCurrency {
  const region = regionInput?.trim() || 'Global';
  return regionCurrencies.find((item) => item.match.test(region)) ?? globalCurrency;
}

function parseUsd(value?: string): number {
  const parsed = Number((value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1208.64;
}

function formatLocalBalance(usdValue: number, currency: RegionCurrency): string {
  const amount = usdValue * currency.previewRate;
  const maximumFractionDigits = ['JPY', 'NGN', 'INR', 'KRW'].includes(currency.code) ? 0 : 2;
  return `${currency.symbol}${amount.toLocaleString('en-US', { maximumFractionDigits, minimumFractionDigits: maximumFractionDigits })}`;
}

function normalizeTravelPocket(next: NomadTravelPocketState, requestedRegion?: string): NomadTravelPocketState {
  const regionInput = requestedRegion?.trim() || next.regionInput?.trim() || 'Global';
  const currency = resolveRegionCurrency(regionInput);
  const pocketBalanceFiat = next.pocketBalanceFiat || fallbackTravelPocket.pocketBalanceFiat;
  const pocketUsd = parseUsd(pocketBalanceFiat);

  return {
    ...next,
    regionInput,
    preferredStablecoin: currency.stablecoin,
    localCurrency: currency.stablecoin,
    pocketBalanceFiat,
    pocketBalanceLocal: formatLocalBalance(pocketUsd, currency),
  };
}

export type NomadTravelState = {
  travelPocket: NomadTravelPocketState;
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  enable(regionInput: string): Promise<NomadTravelPocketState>;
  disable(): Promise<NomadTravelPocketState>;
};

export function useNomadTravel(adapters?: NomadOverlayAdapters): NomadTravelState {
  const contextAdapters = useNomadAdapters();
  const travel = (adapters ?? contextAdapters).travel;
  const [travelPocket, setTravelPocket] = useState<NomadTravelPocketState>(fallbackTravelPocket);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!travel) {
      setError('Nomad travel adapter is not connected.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const next = await travel.getTravelPocketState();
      setTravelPocket(normalizeTravelPocket(next));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Travel Pocket data.');
    } finally {
      setLoading(false);
    }
  }, [travel]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(
    async (regionInput: string) => {
      if (!travel) throw new Error('Nomad travel adapter is not connected.');
      const next = normalizeTravelPocket(await travel.enableTravelPocket(regionInput), regionInput);
      setTravelPocket(next);
      return next;
    },
    [travel],
  );

  const disable = useCallback(async () => {
    if (!travel) throw new Error('Nomad travel adapter is not connected.');
    const next = normalizeTravelPocket(await travel.disableTravelPocket());
    setTravelPocket(next);
    return next;
  }, [travel]);

  return useMemo(
    () => ({ travelPocket, loading, error, refresh, enable, disable }),
    [travelPocket, loading, error, refresh, enable, disable],
  );
}
