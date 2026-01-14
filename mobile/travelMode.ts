/**
 * Mobile Dapp boundary note
 *
 * `travel/` is the source of truth for Travel Mode business logic.
 * This file exists as a *mobile-facing adapter* to keep the React Native UI
 * self-contained and avoid coupling the RN bundle/build setup to the Node
 * TypeScript project layout.
 *
 * If/when the mobile app becomes a first-class package (e.g. Expo app), this
 * should become a thin re-export/hook layer that delegates to `travel/`.
 * Any duplicated mapping/selection logic here should be removed at that time.
 */

export type Region = "US" | "EU" | "UK" | "AU" | "UAE" | "GLOBAL";

export const REGION_STABLECOINS: Record<Region, string[]> = {
  US: ["USDC", "USDT", "DAI"],
  EU: ["EURC", "EUROe", "USDC"],
  UK: ["GBPT", "USDC"],
  AU: ["USDC"],
  UAE: ["USDC", "USDT"],
  GLOBAL: ["USDC"],
};

export function resolvePreferredStablecoin(region: Region, balances: Record<string, number>): string {
  const options = REGION_STABLECOINS[region];
  for (const token of options) {
    if ((balances[token] || 0) > 0) return token;
  }
  return options[0];
}
