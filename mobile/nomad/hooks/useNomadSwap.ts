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
  network: 'Arkrilium Smart Route • Hedera Mainnet',
  networkFee: '0.000028 BTC (≈ $1.72)',
  estimatedTime: '~ 5 seconds',
  slippageTolerance: '0.50%',
  status: 'quote',
  quoteId: 'preview-swap-quote',
};

export type NomadSwapHookState = {
  quote: NomadSwapQuote;
  loading: boolean;
  error: string | null;
  lastDraft: NomadSignedTransaction | null;
  refreshQuote(fromAsset?: string, toAsset?: string, amount?: string): Promise<NomadSwapQuote>;
  createDraft(quoteOverride?: NomadSwapQuote): Promise<NomadSignedTransaction>;
  clearDraft(): void;
};

export function useNomadSwap(adapters?: NomadOverlayAdapters): NomadSwapHookState {
  const contextAdapters = useNomadAdapters();
  const swap = (adapters ?? contextAdapters).swap;
  const [quote, setQuote] = useState<NomadSwapQuote>(fallbackQuote);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDraft, setLastDraft] = useState<NomadSignedTransaction | null>(null);

  const refreshQuote = useCallback(
    async (fromAsset = 'BTC', toAsset = 'HBAR', amount = '0.01') => {
      if (!swap) throw new Error('Nomad swap adapter is not connected.');
      try {
        setLoading(true);
        setError(null);
        setLastDraft(null);
        const next = await swap.getSwapQuote(fromAsset, toAsset, amount);
        setQuote(next);
        if (next.status === 'failed') setError(next.failure?.message ?? 'Unable to create a swap quote.');
        return next;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load swap quote.';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [swap],
  );

  useEffect(() => {
    void refreshQuote().catch(() => setLoading(false));
  }, [refreshQuote]);

  const createDraft = useCallback(async (quoteOverride?: NomadSwapQuote) => {
    if (!swap) throw new Error('Nomad swap adapter is not connected.');
    const selectedQuote = quoteOverride ?? quote;
    const draft = await swap.createSwapDraft(selectedQuote);
    setLastDraft(draft);
    if (draft.status === 'failed') {
      setError(draft.failure?.message ?? 'Unable to create the swap draft.');
      setQuote({ ...selectedQuote, status: 'failed', failure: draft.failure });
    } else {
      setError(null);
      setQuote({ ...selectedQuote, status: 'draft_created' });
    }
    return draft;
  }, [quote, swap]);

  const clearDraft = useCallback(() => {
    setLastDraft(null);
    setQuote((current) => ({ ...current, status: current.status === 'draft_created' ? 'quote' : current.status }));
  }, []);

  return useMemo(
    () => ({ quote, loading, error, lastDraft, refreshQuote, createDraft, clearDraft }),
    [quote, loading, error, lastDraft, refreshQuote, createDraft, clearDraft],
  );
}
