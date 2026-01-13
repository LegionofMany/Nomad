/**
 * travel/stablecoins.ts
 *
 * Canonical mapping of regions to preferred stablecoins. Pure data map,
 * no network calls, no conversion logic, no custody.
 */

import { Region } from "./types";

export const REGION_STABLECOINS: Record<Region, string[]> = {
  USA: ["USDC", "USDT"],
  EU: ["EURC", "EUROe"],
  UK: ["GBPT"],
  UAE: ["AEDE"],
  AU: ["AUDC"],
  JP: ["JPYC"],
  GLOBAL: ["USDC"]
};

export default REGION_STABLECOINS;
