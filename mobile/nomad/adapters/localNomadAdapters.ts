import {
  getPortfolio,
  getWalletMeta,
  lockWallet as lockLocalWallet,
} from '../../services/walletService';

import type {
  NomadAsset,
  NomadOverlayAdapters,
  NomadSafetyAdapter,
  NomadSignedTransaction,
  NomadTransactionDraft,
  NomadWalletAdapter,
} from './walletAdapter';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentBySymbol: Record<string, string> = {
  USDC: '+0.01%',
  USDT: '+0.00%',
  DAI: '+0.02%',
  ETH: '+1.42%',
  BTC: '+1.82%',
  HBAR: '+2.10%',
  XRP: '+0.64%',
  XLM: '+0.44%',
};

const networkBySymbol: Record<string, string> = {
  USDC: 'Ethereum',
  USDT: 'TRC20',
  DAI: 'Ethereum',
  ETH: 'Ethereum',
  BTC: 'Bitcoin',
  HBAR: 'Hedera',
  XRP: 'XRPL',
  XLM: 'Stellar',
};

function toNomadAsset(balance: { symbol: string; amount: number; fiatApproxUSD: number }): NomadAsset {
  return {
    symbol: balance.symbol,
    name: balance.symbol,
    balance: String(balance.amount),
    fiatValueUsd: currencyFormatter.format(balance.fiatApproxUSD),
    change24h: percentBySymbol[balance.symbol] ?? '+0.00%',
    network: networkBySymbol[balance.symbol] ?? 'Nomad',
  };
}

export const localNomadWalletAdapter: NomadWalletAdapter = {
  async getWalletBalance() {
    const portfolio = await getPortfolio();
    const total = portfolio.balances.reduce((sum, balance) => sum + balance.fiatApproxUSD, 0);
    return currencyFormatter.format(total);
  },

  async getAssets() {
    const portfolio = await getPortfolio();
    return portfolio.balances.map(toNomadAsset);
  },

  async getReceiveAddress(assetSymbol: string) {
    const meta = await getWalletMeta();
    if (!meta) throw new Error('No wallet is available for receive address lookup.');

    // The current local wallet backend exposes the EVM account first.
    // The cloned wallet core will replace this per-chain resolver through the same adapter method.
    return `${assetSymbol.toUpperCase()}:${meta.evmAddress}`;
  },

  async createTransaction(draft: NomadTransactionDraft): Promise<NomadSignedTransaction> {
    // Safe bridge only: the Nomad overlay can create a reviewable transaction draft,
    // but signing/broadcasting stays inside the cloned wallet engine or chain-specific backend.
    if (!draft.fromAsset || !draft.toAddress || !draft.amount) {
      return { status: 'failed' };
    }

    return {
      status: 'created',
      rawTransaction: JSON.stringify({
        ...draft,
        createdAt: new Date().toISOString(),
        source: 'nomad-overlay-draft',
      }),
    };
  },

  async lockWallet() {
    await lockLocalWallet();
  },

  async unlockWallet() {
    // Never bypass Nomad Time Sets. The live unlock flow must continue using the existing clock backend.
    throw new Error('Unlock is handled by the Nomad Time Set flow, not the generic overlay adapter.');
  },
};

export const localNomadSafetyAdapter: NomadSafetyAdapter = {
  async scanAddress(address: string) {
    const normalized = address.trim().toLowerCase();
    if (!normalized) return { score: 0, risk: 'high', summary: 'No address supplied.' };

    const isSuspicious = normalized.includes('drain') || normalized.includes('scam') || normalized.includes('phish');
    return isSuspicious
      ? { score: 32, risk: 'high', summary: 'Potentially suspicious address pattern detected by the local safety bridge.' }
      : { score: 92, risk: 'low', summary: 'No local safety flags detected. Ready for BlockPages live scan integration.' };
  },

  async scanUrl(url: string) {
    const normalized = url.trim().toLowerCase();
    if (!normalized) return { score: 0, risk: 'high', summary: 'No URL supplied.' };

    const isSuspicious = normalized.includes('drain') || normalized.includes('airdrop') || normalized.includes('claim') || normalized.includes('phish');
    return isSuspicious
      ? { score: 41, risk: 'medium', summary: 'Potential phishing or drainer language detected by the local safety bridge.' }
      : { score: 92, risk: 'low', summary: 'No local URL threat flags detected. Ready for BlockPages live scanner integration.' };
  },
};

export const localNomadOverlayAdapters: NomadOverlayAdapters = {
  wallet: localNomadWalletAdapter,
  safety: localNomadSafetyAdapter,
};
