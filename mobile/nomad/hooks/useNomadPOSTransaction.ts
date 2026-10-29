import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters/NomadAdaptersProvider';
import {
  nomadPOSTransactionAdapter,
  type NomadPOSSource,
  type NomadPOSState,
} from '../adapters/nomadPOSTransactionAdapter';
import type { NomadAsset, NomadWalletSessionState } from '../adapters/walletAdapter';

const fallbackState: NomadPOSState = {
  source: 'manual',
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
    remainingTodayLocal: '$0.00',
    dataSource: 'local_preview',
  },
  assets: [],
  recentDrafts: [],
  activity: [],
  checks: [],
  walletSessionStatus: 'unknown',
  walletSessionProvider: 'unavailable',
  frozen: false,
  requestValid: false,
  limitsSatisfied: false,
  nonceUsed: false,
  canCreateQuote: false,
  canCreateDraft: false,
  remoteMerchantRegistryConnected: false,
  requestSignatureProviderConnected: false,
  liveFeeProviderConnected: false,
  settlementProviderConnected: false,
  dataSource: 'nomad_pos_transaction_adapter',
  persistence: 'in_memory_stub',
  checkedAt: new Date(0).toISOString(),
};

async function loadWalletSnapshot(wallet: ReturnType<typeof useNomadAdapters>['wallet']) {
  if (!wallet) return { assets: [], session: undefined };
  const [assets, session] = await Promise.all([
    wallet.getAssets().catch(() => []),
    wallet.getSessionState
      ? wallet.getSessionState().catch(() => undefined)
      : Promise.resolve(undefined),
  ]);
  return { assets, session } as { assets: NomadAsset[]; session?: NomadWalletSessionState };
}

export function useNomadPOSTransaction(
  source: NomadPOSSource = 'manual',
  initialPaymentRequest?: string,
  region?: string,
  preferredAssetSymbol?: string,
) {
  const adapters = useNomadAdapters();
  const wallet = adapters.wallet;
  const [pos, setPos] = useState<NomadPOSState>({ ...fallbackState, source });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState(Date.now());

  const refresh = useCallback(async (paymentRequest?: string) => {
    setLoading(true);
    try {
      setError(null);
      const snapshot = await loadWalletSnapshot(wallet);
      const next = await nomadPOSTransactionAdapter.getPOSState({
        walletAssets: snapshot.assets,
        walletSession: snapshot.session,
        source,
        paymentRequest: paymentRequest ?? initialPaymentRequest,
        region,
        preferredAssetSymbol,
      });
      setPos(next);
      return next;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to load the POS transaction state.';
      setError(message);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [initialPaymentRequest, preferredAssetSymbol, region, source, wallet]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => setClock(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, []);

  const parseRequest = useCallback(async (raw: string) => {
    setLoading(true);
    setError(null);
    try {
      await nomadPOSTransactionAdapter.parsePaymentRequest(raw, source);
      const snapshot = await loadWalletSnapshot(wallet);
      const next = await nomadPOSTransactionAdapter.getPOSState({
        walletAssets: snapshot.assets,
        walletSession: snapshot.session,
        source,
        region,
        preferredAssetSymbol,
      });
      setPos(next);
      return next.request;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to parse the merchant POS request.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [preferredAssetSymbol, region, source, wallet]);

  const createQuote = useCallback(async (raw: string, assetSymbol: string) => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await loadWalletSnapshot(wallet);
      const next = await nomadPOSTransactionAdapter.createQuote({
        walletAssets: snapshot.assets,
        walletSession: snapshot.session,
        source,
        paymentRequest: raw,
        region,
        assetSymbol,
      });
      setPos(next);
      return next.activeQuote;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to create the POS payment preview.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [region, source, wallet]);

  const createWalletDraft = useCallback(async () => {
    if (!wallet) throw new Error('Nomad wallet adapter is not connected.');
    const quote = pos.activeQuote;
    if (!quote) throw new Error('Create a valid POS payment preview before requesting a wallet draft.');

    setLoading(true);
    setError(null);
    try {
      const draft = await nomadPOSTransactionAdapter.buildWalletDraft(quote);
      const result = await wallet.createTransaction(draft);
      await nomadPOSTransactionAdapter.recordWalletDraft(quote, result);
      const snapshot = await loadWalletSnapshot(wallet);
      const next = await nomadPOSTransactionAdapter.getPOSState({
        walletAssets: snapshot.assets,
        walletSession: snapshot.session,
        source,
        region,
        preferredAssetSymbol: quote.sourceAsset.symbol,
      });
      setPos(next);
      return { result, receipt: next.recentDrafts[0] };
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Unable to create the wallet-owned POS draft.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [pos.activeQuote, region, source, wallet]);

  const quoteSecondsRemaining = useMemo(() => {
    if (!pos.activeQuote) return 0;
    return Math.max(0, Math.ceil((Date.parse(pos.activeQuote.expiresAt) - clock) / 1_000));
  }, [clock, pos.activeQuote]);

  const requestSecondsRemaining = useMemo(() => {
    if (!pos.request) return 0;
    return Math.max(0, Math.ceil((Date.parse(pos.request.expiresAt) - clock) / 1_000));
  }, [clock, pos.request]);

  return useMemo(
    () => ({
      pos,
      loading,
      error,
      refresh,
      parseRequest,
      createQuote,
      createWalletDraft,
      quoteSecondsRemaining,
      requestSecondsRemaining,
    }),
    [
      pos,
      loading,
      error,
      refresh,
      parseRequest,
      createQuote,
      createWalletDraft,
      quoteSecondsRemaining,
      requestSecondsRemaining,
    ],
  );
}
