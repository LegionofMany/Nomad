import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters';
import type { NomadOverlayAdapters, NomadSignedTransaction, NomadSwapQuote } from '../adapters/walletAdapter';

const fallbackQuote: NomadSwapQuote = {
  fromAsset: 'BTC',
  toAsset: 'HBAR',
  fromAmount: '0.01',
  toAmount: '1,245.78',
  fromValueUsd: '$614.10',
  toValueUsd: '$608.92',
  fromBalance: 'Balance: 0.3567 BTC',
  toBalance: 'Balance: 3,250.00 HBAR',
  rateLabel: '1 BTC ≈ 124,578 HBAR',
  priceImpact: '0.30%',
  network: 'Hedera Mainnet',
  networkFee: '0.00012 BTC (≈ $0.73)',
  estimatedTime: '~ 15 seconds',
  slippageTolerance: '0.50%',
  status: 'quote',
};

export type NomadSwapHookState = {
  quote: NomadSwapQuote;
  loading: boolean;
  error: string | null;
  lastDraft: NomadSignedTransaction | null;
  refreshQuote(fromAsset?: string, toAsset?: string, amount?: string): Promise<NomadSwapQuote>;
  createDraft(): Promise<NomadSignedTransaction>;
};

export function useNomadSwap(adapters?: NomadOverlayAdapters): NomadSwapHookState {
  const contextAdapters = useNomadAdapters();
  const swap = (adapters ?? contextAdapters).swap;
  const [quote, setQuote] = useState<NomadSwapQuote>(fallbackQuote);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDraft, setLastDraft] = useState<NomadSignedTransaction | null>(null);

  const refreshQuote = useCallback(
    async (fromAsset = quote.fromAsset, toAsset = quote.toAsset, amount = quote.fromAmount) => {
      if (!swap) throw new Error('Nomad swap adapter is not connected.');
      try {
        setLoading(true);
        setError(null);
        const next = await swap.getSwapQuote(fromAsset, toAsset, amount);
        setQuote(next);
        return next;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load swap quote.';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [quote.fromAmount, quote.fromAsset, quote.toAsset, swap],
  );

  useEffect(() => {
    void refreshQuote().catch(() => setLoading(false));
  }, []);

  const createDraft = useCallback(async () => {
    if (!swap) throw new Error('Nomad swap adapter is not connected.');
    const draft = await swap.createSwapDraft(quote);
    setLastDraft(draft);
    setQuote({ ...quote, status: draft.status === 'created' ? 'draft_created' : 'failed' });
    return draft;
  }, [quote, swap]);

  return useMemo(() => ({ quote, loading, error, lastDraft, refreshQuote, createDraft }), [quote, loading, error, lastDraft, refreshQuote, createDraft]);
}
