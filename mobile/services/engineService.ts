/**
 * engineService.ts
 *
 * Builds the testnet wallet engine for the phone app and exposes it to Nomad as
 * a wallet adapter. Native only: the web preview keeps its demo data.
 *
 * Sepolia needs an RPC address. Set EXPO_PUBLIC_SEPOLIA_RPC_URL (https). If it is
 * missing, Ethereum Sepolia is simply not offered; Bitcoin testnet still works.
 */

import { Platform } from "react-native";

import { NomadWalletEngine, createEsploraProvider, createSepoliaProvider } from "../../src/engine";
import type { SessionAuthority } from "../../src/engine";
import { createClonedWalletAdapter } from "../nomad/adapters/clonedWalletAdapterTemplate";
import type { NomadOverlayAdapters } from "../nomad/adapters/walletAdapter";

import { approvalGate } from "./approvalBroker";
import { getSessionSeedCopy, isSessionUnlocked } from "./sessionVault";
import { getWalletMeta, lockWallet, setNativeBalanceSource } from "./walletService";

const session: SessionAuthority = {
  hasWallet: async () => (await getWalletMeta()) !== null,
  isUnlocked: async () => isSessionUnlocked(),
  getSeed: async () => getSessionSeedCopy(),
  lock: async () => lockWallet(),
};

function buildEngine(): NomadWalletEngine {
  const sepoliaRpc = process.env.EXPO_PUBLIC_SEPOLIA_RPC_URL;
  return new NomadWalletEngine({
    session,
    approval: approvalGate,
    bitcoin: createEsploraProvider(),
    evm: sepoliaRpc ? createSepoliaProvider(sepoliaRpc) : undefined,
  });
}

const engine = Platform.OS === "web" ? null : buildEngine();

if (engine) {
  // Travel, swap and insights read balances through getPortfolio(); give them real testnet balances.
  setNativeBalanceSource(async () =>
    (await engine.getAssets()).map((asset) => ({
      symbol: asset.symbol,
      amount: Number(asset.balance) || 0,
      fiatApproxUSD: 0, // testnet coins have no market value
    }))
  );
}

/** Wallet adapter backed by the testnet engine, or undefined on web (demo data stays). */
export const engineAdapters: NomadOverlayAdapters | undefined = engine ? createClonedWalletAdapter(engine) : undefined;
