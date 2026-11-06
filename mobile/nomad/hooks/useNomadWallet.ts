import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters/NomadAdaptersProvider';
import type {
  NomadAsset,
  NomadBroadcastResult,
  NomadOverlayAdapters,
  NomadSignedTransaction,
  NomadTransactionDraft,
} from '../adapters/walletAdapter';

export type NomadWalletState = {
  totalBalance: string;
  assets: NomadAsset[];
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  getReceiveAddress(assetSymbol: string): Promise<string>;
  createTransaction(draft: NomadTransactionDraft): Promise<NomadSignedTransaction>;
  /** True only when the connected wallet engine can really sign and broadcast. */
  canSend: boolean;
  /** Signs (after the owner approves a review) and broadcasts. Never called without approval. */
  sendTransaction(draft: NomadTransactionDraft): Promise<NomadBroadcastResult>;
};

export function useNomadWallet(adapterOverride?: NomadOverlayAdapters): NomadWalletState {
  const providerAdapters = useNomadAdapters();
  const adapters = adapterOverride ?? providerAdapters;
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

  const createTransaction = useCallback(
    async (draft: NomadTransactionDraft) => {
      if (!wallet) throw new Error('Nomad wallet adapter is not connected.');
      return wallet.createTransaction(draft);
    },
    [wallet],
  );

  const canSend = typeof wallet?.signTransaction === 'function' && typeof wallet?.broadcastTransaction === 'function';

  const sendTransaction = useCallback(
    async (draft: NomadTransactionDraft) => {
      if (!wallet?.signTransaction || !wallet.broadcastTransaction) {
        throw new Error('This build cannot sign transactions yet.');
      }
      const signed = await wallet.signTransaction({ ...draft, createdBy: 'nomad_overlay', requiresUserApproval: true });
      if (signed.status !== 'signed') {
        throw new Error(signed.failure?.message || 'The transaction was not signed.');
      }
      return wallet.broadcastTransaction(signed);
    },
    [wallet],
  );

  return useMemo(
    () => ({ totalBalance, assets, loading, error, refresh, getReceiveAddress, createTransaction, canSend, sendTransaction }),
    [totalBalance, assets, loading, error, refresh, getReceiveAddress, createTransaction, canSend, sendTransaction],
  );
}
