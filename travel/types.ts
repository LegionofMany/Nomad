/**
 * travel/types.ts
 *
 * Core types used by travel mode.
 * No runtime logic — TypeScript-only definitions.
 */

export type Region =
  | "USA"
  | "EU"
  | "UK"
  | "UAE"
  | "AU"
  | "JP"
  | "GLOBAL";

export interface TravelSettings {
  region: Region;
  nfcEnabled: boolean;
  preferredStablecoin: string;
}

export default TravelSettings;
