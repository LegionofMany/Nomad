import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters';
import type { NomadOverlayAdapters, NomadTravelPocketState } from '../adapters/walletAdapter';

const fallbackTravelPocket: NomadTravelPocketState = {
  enabled: false,
  regionInput: 'Japan',
  preferredStablecoin: 'JPY Stable',
  pocketBalanceFiat: '$1,208.64',
  pocketBalanceLocal: '¥185,420',
  localCurrency: 'JPY Stable',
};

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
      setTravelPocket(await travel.getTravelPocketState());
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
      const next = await travel.enableTravelPocket(regionInput);
      setTravelPocket(next);
      return next;
    },
    [travel],
  );

  const disable = useCallback(async () => {
    if (!travel) throw new Error('Nomad travel adapter is not connected.');
    const next = await travel.disableTravelPocket();
    setTravelPocket(next);
    return next;
  }, [travel]);

  return useMemo(
    () => ({ travelPocket, loading, error, refresh, enable, disable }),
    [travelPocket, loading, error, refresh, enable, disable],
  );
}
