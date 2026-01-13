/**
 * travel/regions.ts
 *
 * Lightweight resolver to map input strings to `Region` keys. Stateless,
 * pure function; safe defaults to `GLOBAL` when unknown.
 */

import { Region } from "./types";

export function resolveRegion(input?: string): Region {
  if (!input || typeof input !== "string") return "GLOBAL";
  switch (input.trim().toUpperCase()) {
    case "EU":
    case "EUROPE":
      return "EU";
    case "UK":
    case "GB":
      return "UK";
    case "UAE":
      return "UAE";
    case "AU":
    case "AUS":
      return "AU";
    case "JP":
    case "JPN":
      return "JP";
    case "US":
    case "USA":
    case "UNITED STATES":
      return "USA";
    default:
      return "GLOBAL";
  }
}

export default resolveRegion;
