import type {
  NomadAsset,
  NomadBroadcastResult,
  NomadChain,
  NomadOverlayAdapters,
  NomadRecoveryAuthorization,
  NomadSignedTransaction,
  NomadTransactionDraft,
  NomadTransactionHistoryItem,
  NomadWalletAccount,
  NomadWalletSessionState,
  NomadWalletProviderRestorationReceipt,
} from './walletAdapter';
import { createMissingAdapterError } from './walletAdapter';

/**
 * Phase 2B cloned-wallet bridge template.
 *
 * This file intentionally does not implement custody, signing, broadcasting,
 * seed storage, provider selection, or balance indexing. Those responsibilities
 * must be supplied by the selected cloned/base wallet engine.
 *
 * Developer rule:
 * - Never pass raw seed phrases or private keys into this adapter.
 * - Never store secrets inside Nomad overlay state.
 * - Keep signing and broadcasting inside the cloned wallet engine.
 * - Return safe, display-ready data to Nomad screens through this adapter boundary.
 */

const notConnected = (methodName: string) => createMissingAdapterError(`clonedWallet.${methodName}`);

const REQUIRED_ENGINE_METHODS = [
  'getSessionState',
  'getSupportedChains',
  'getAccounts',
  'getWalletBalance',
  'getAssets',
  'getReceiveAddress',
  'createTransaction',
  'signTransaction',
  'broadcastTransaction',
  'getTransactionHistory',
  'lockWallet',
  'unlockWallet',
  'restoreFromNomadAuthorization',
] as const;

export type ClonedWalletEngineBridge = {
  getSessionState(): Promise<NomadWalletSessionState>;
  getSupportedChains(): Promise<NomadChain[]>;
  getAccounts(): Promise<NomadWalletAccount[]>;
  getWalletBalance(): Promise<string>;
  getAssets(): Promise<NomadAsset[]>;
  getReceiveAddress(assetSymbol: string, chainId?: string, accountId?: string): Promise<string>;
  createTransaction(draft: NomadTransactionDraft): Promise<NomadSignedTransaction>;
  signTransaction(draft: NomadTransactionDraft): Promise<NomadSignedTransaction>;
  broadcastTransaction(signedTransaction: NomadSignedTransaction): Promise<NomadBroadcastResult>;
  getTransactionHistory(accountId?: string): Promise<NomadTransactionHistoryItem[]>;
  lockWallet(): Promise<void>;
  unlockWallet(): Promise<void>;
  restoreFromNomadAuthorization(authorization: NomadRecoveryAuthorization): Promise<NomadWalletProviderRestorationReceipt>;
};

export function assertClonedWalletEngineBridge(
  engine: Partial<ClonedWalletEngineBridge>,
): asserts engine is ClonedWalletEngineBridge {
  const missing = REQUIRED_ENGINE_METHODS.filter((method) => typeof engine[method] !== 'function');
  if (missing.length > 0) {
    throw new Error(`The base-wallet bridge is incomplete. Missing: ${missing.join(', ')}`);
  }
}

export const createClonedWalletAdapterTemplate = (engine?: Partial<ClonedWalletEngineBridge>): NomadOverlayAdapters => ({
  wallet: {
    getWalletBalance: () => engine?.getWalletBalance?.() ?? Promise.reject(notConnected('getWalletBalance')),
    getAssets: () => engine?.getAssets?.() ?? Promise.reject(notConnected('getAssets')),
    getReceiveAddress: (assetSymbol, chainId, accountId) => engine?.getReceiveAddress?.(assetSymbol, chainId, accountId) ?? Promise.reject(notConnected('getReceiveAddress')),
    createTransaction: (draft) => engine?.createTransaction?.({ ...draft, createdBy: 'nomad_overlay', requiresUserApproval: true }) ?? Promise.reject(notConnected('createTransaction')),
    lockWallet: () => engine?.lockWallet?.() ?? Promise.reject(notConnected('lockWallet')),
    unlockWallet: () => engine?.unlockWallet?.() ?? Promise.reject(notConnected('unlockWallet')),
    getSessionState: () => engine?.getSessionState?.() ?? Promise.reject(notConnected('getSessionState')),
    getSupportedChains: () => engine?.getSupportedChains?.() ?? Promise.reject(notConnected('getSupportedChains')),
    getAccounts: () => engine?.getAccounts?.() ?? Promise.reject(notConnected('getAccounts')),
    getTransactionHistory: (accountId) => engine?.getTransactionHistory?.(accountId) ?? Promise.reject(notConnected('getTransactionHistory')),
    signTransaction: (draft) => engine?.signTransaction?.(draft) ?? Promise.reject(notConnected('signTransaction')),
    broadcastTransaction: (signedTransaction) => engine?.broadcastTransaction?.(signedTransaction) ?? Promise.reject(notConnected('broadcastTransaction')),
    restoreFromNomadAuthorization: (authorization) => engine?.restoreFromNomadAuthorization?.(authorization) ?? Promise.reject(notConnected('restoreFromNomadAuthorization')),
  },
});

/** Strict production entry point. It fails before rendering if the future wallet bridge is incomplete. */
export function createClonedWalletAdapter(engine: ClonedWalletEngineBridge): NomadOverlayAdapters {
  assertClonedWalletEngineBridge(engine);
  return createClonedWalletAdapterTemplate(engine);
}
