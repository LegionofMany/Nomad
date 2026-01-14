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
