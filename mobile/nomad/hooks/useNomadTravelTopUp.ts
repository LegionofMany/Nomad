import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters/NomadAdaptersProvider';
import {
  nomadTravelTopUpAdapter,
  type NomadTravelTopUpMode,
  type NomadTravelTopUpState,
} from '../adapters/nomadTravelTopUpAdapter';
import type { NomadAsset, NomadWalletSessionState } from '../adapters/walletAdapter';

const fallbackState: NomadTravelTopUpState = {
  mode: 'top_up',
  travelPocket: {
    enabled: false,
    regionInput: 'Global',
    preferredStablecoin: 'USD Stable',
    pocketBalanceFiat: '$0.00',
    pocketBalanceLocal: '$0.00',
    localCurrency: 'USD Stable',
    currencyCode: 'USD',
    currencySymbol: '$',
    exchangeRate: 1,
    exchangeRateSource: 'local_preview',
    dataSource: 'local_preview',
  },
  assets: [],
  recentDrafts: [],
  activity: [],
  walletSessionStatus: 'unknown',
  walletSessionProviderConnected: false,
  frozen: false,
  canSelectAsset: false,
  canCreateQuote: false,
  canCreateDraft: false,
  destinationAddressType: 'internal_travel_pocket_intent',
  liveFeeProviderConnected: false,
  executableFxProviderConnected: false,
  signingProvider: 'wallet_adapter',
  dataSource: 'nomad_travel_top_up_adapter',
  persistence: 'in_memory_stub',
  checkedAt: new Date(0).toISOString(),
};

async function loadWalletSnapshot(wallet: ReturnType<typeof useNomadAdapters>['wallet']) {
  if (!wallet) throw new Error('Nomad wallet adapter is not connected.');
  const [assets, session] = await Promise.all([
    wallet.getAssets(),
    wallet.getSessionState
      ? wallet.getSessionState().catch(() => undefined)
      : Promise.resolve(undefined),
  ]);
  return { assets, session } as { assets: NomadAsset[]; session?: NomadWalletSessionState };
}

export function useNomadTravelTopUp(
  mode: NomadTravelTopUpMode = 'top_up',
  preferredAssetSymbol?: string,
) {
  const adapters = useNomadAdapters();
  const wallet = adapters.wallet;
  const [topUp, setTopUp] = useState<NomadTravelTopUpState>({ ...fallbackState, mode });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState(Date.now());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const snapshot = await loadWalletSnapshot(wallet);
      const next = await nomadTravelTopUpAdapter.getTopUpState({
        walletAssets: snapshot.assets,
        walletSession: snapshot.session,
        mode,
        preferredAssetSymbol,
      });
      setTopUp(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to load Travel Pocket funding state.';
      setError(message);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [mode, preferredAssetSymbol, wallet]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const createQuote = useCallback(async (assetSymbol: string, amount: string) => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await loadWalletSnapshot(wallet);
      const next = await nomadTravelTopUpAdapter.createQuote({
        walletAssets: snapshot.assets,
        walletSession: snapshot.session,
        mode,
        assetSymbol,
        amount,
      });
      setTopUp(next);
      return next.activeQuote;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to create the Travel Pocket funding preview.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [mode, wallet]);

  const createWalletDraft = useCallback(async () => {
    if (!wallet) throw new Error('Nomad wallet adapter is not connected.');
    const quote = topUp.activeQuote;
    if (!quote) throw new Error('Create a Travel Pocket funding preview before requesting a wallet draft.');

    setLoading(true);
    setError(null);
    try {
      const draft = await nomadTravelTopUpAdapter.buildWalletDraft(quote);
      const result = await wallet.createTransaction(draft);
      await nomadTravelTopUpAdapter.recordWalletDraft(quote, result);
      const refreshed = await loadWalletSnapshot(wallet);
      const next = await nomadTravelTopUpAdapter.getTopUpState({
        walletAssets: refreshed.assets,
        walletSession: refreshed.session,
        mode,
        preferredAssetSymbol: quote.sourceAsset.symbol,
      });
      setTopUp(next);
      return { result, receipt: next.recentDrafts[0] };
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to create the wallet-owned Travel Pocket draft.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [mode, topUp.activeQuote, wallet]);

  const quoteSecondsRemaining = useMemo(() => {
    if (!topUp.activeQuote) return 0;
    return Math.max(0, Math.ceil((Date.parse(topUp.activeQuote.expiresAt) - clock) / 1000));
  }, [clock, topUp.activeQuote]);

  return useMemo(
    () => ({
      topUp,
      loading,
      error,
      refresh,
      createQuote,
      createWalletDraft,
      quoteSecondsRemaining,
    }),
    [topUp, loading, error, refresh, createQuote, createWalletDraft, quoteSecondsRemaining],
  );
}
