/**
 * travel/travelMode.ts
 *
 * Stateless activation logic for travel mode. Chooses a `Region`, reads the
 * canonical stablecoin mapping, and returns a `TravelSettings` object.
 * No network calls, no UI, TypeScript-only and documented.
 */

import { REGION_STABLECOINS } from "./stablecoins";
import { resolveRegion } from "./regions";
import { TravelSettings, Region } from "./types";

/**
 * Activate travel mode for an optional region input. This is a pure function
 * (no side-effects) and returns recommended `TravelSettings`.
 *
 * - `regionInput` may be any string; `resolveRegion` maps it to a `Region`.
 * - `preferredStablecoin` is the first entry in the region's stablecoin list.
 */
export function activateTravelMode(regionInput?: string): TravelSettings {
  const region: Region = resolveRegion(regionInput);
  const coins = REGION_STABLECOINS[region] || REGION_STABLECOINS['GLOBAL'];
  const preferredStablecoin = coins[0];

  return {
    region,
    nfcEnabled: false,
    preferredStablecoin
  };
}

export default activateTravelMode;
