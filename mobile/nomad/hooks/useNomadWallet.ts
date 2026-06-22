import { useCallback, useEffect, useMemo, useState } from 'react';

import { localNomadOverlayAdapters } from '../adapters/localNomadAdapters';
import type { NomadAsset, NomadOverlayAdapters } from '../adapters/walletAdapter';

export type NomadWalletState = {
  totalBalance: string;
  assets: NomadAsset[];
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  getReceiveAddress(assetSymbol: string): Promise<string>;
};

export function useNomadWallet(adapters: NomadOverlayAdapters = localNomadOverlayAdapters): NomadWalletState {
  const wallet = adapters.wallet;
  const [totalBalance, setTotalBalance] = useState('$0.00');
  const [assets, setAssets] = useState<NomadAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!wallet) {
      setError('Nomad wallet adapter is not connected.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [nextBalance, nextAssets] = await Promise.all([
        wallet.getWalletBalance(),
        wallet.getAssets(),
      ]);
      setTotalBalance(nextBalance);
      setAssets(nextAssets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Nomad wallet data.');
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getReceiveAddress = useCallback(
    async (assetSymbol: string) => {
      if (!wallet) throw new Error('Nomad wallet adapter is not connected.');
      return wallet.getReceiveAddress(assetSymbol);
    },
    [wallet],
  );

  return useMemo(
    () => ({ totalBalance, assets, loading, error, refresh, getReceiveAddress }),
    [totalBalance, assets, loading, error, refresh, getReceiveAddress],
  );
}
