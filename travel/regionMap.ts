/**
 * travel/regionMap.ts
 *
 * Region-to-stablecoin mapping engine.
 * - Map regions (ISO codes or region keys) to preferred stablecoins
 * - Allow manual overrides per-region
 * - No automatic conversion or custody logic
 * - TypeScript only, lightweight and pure logic
 */

export type Stablecoin = "USDC" | "USDT" | "DAI" | "EURT" | "BUSD" | "USN" | "TUSD";

export interface RegionPreferences {
  // primary preference first, followed by fallbacks in order of preference
  preferred: Stablecoin[];
}

export interface RegionMapState {
  mapping: Record<string, Stablecoin[]>;
  overrides: Record<string, Stablecoin[]>;
}

/**
 * RegionMap: simple in-memory mapping with override support and JSON persistence helpers.
 *
 * Usage:
 * const rm = new RegionMap();
 * rm.setMapping('US', ['USDC','USDT']);
 * rm.setOverride('CA-ON', ['USDC']);
 * rm.getPreferred('CA-ON') -> ['USDC']
 */
export class RegionMap {
  private mapping: Record<string, Stablecoin[]> = {};
  private overrides: Record<string, Stablecoin[]> = {};

  constructor(initial?: Partial<RegionMapState>) {
    if (initial?.mapping) this.mapping = { ...initial.mapping };
    if (initial?.overrides) this.overrides = { ...initial.overrides };
    // sensible defaults
    if (!this.mapping['US']) this.mapping['US'] = ['USDC', 'USDT', 'DAI'];
    if (!this.mapping['EU']) this.mapping['EU'] = ['EURT', 'USDC'];
    if (!this.mapping['GLOBAL']) this.mapping['GLOBAL'] = ['USDC', 'USDT'];
  }

  /** Set or replace canonical mapping for a region key. */
  public setMapping(region: string, coins: Stablecoin[]){
    this.mapping[region.toUpperCase()] = coins.slice();
  }

  /** Set or replace an override for a specific region key (higher priority). */
  public setOverride(region: string, coins: Stablecoin[]){
    this.overrides[region.toUpperCase()] = coins.slice();
  }

  /** Remove an override for a region. */
  public clearOverride(region: string){
    delete this.overrides[region.toUpperCase()];
  }

  /** Return preferred stablecoins for a region.
   * Lookup order: exact override -> exact mapping -> parent region (split on '-') -> GLOBAL
   */
  public getPreferred(region: string): Stablecoin[] {
    const key = region.toUpperCase();
    // exact override
    if (this.overrides[key]) return this.overrides[key].slice();

    // exact mapping
    if (this.mapping[key]) return this.mapping[key].slice();

    // parent lookup (e.g., CA-ON -> CA)
    const parts = key.split('-');
    if (parts.length > 1) {
      const parent = parts[0];
      if (this.overrides[parent]) return this.overrides[parent].slice();
      if (this.mapping[parent]) return this.mapping[parent].slice();
    }

    // continent heuristics: accept broad two-letter continent codes like EU
    if (this.mapping[key.substring(0,2)]) return this.mapping[key.substring(0,2)].slice();

    // fallback to GLOBAL
    return (this.mapping['GLOBAL'] || []) .slice();
  }

  /** List all regions with configured mappings (includes overrides). */
  public listRegions(): string[] {
    const keys = new Set<string>([...Object.keys(this.mapping), ...Object.keys(this.overrides)]);
    return Array.from(keys).sort();
  }

  /** Export serializable state for persistence. */
  public toState(): RegionMapState {
    return { mapping: { ...this.mapping }, overrides: { ...this.overrides } };
  }

  /** Restore from persisted state. */
  public static fromState(s: RegionMapState): RegionMap {
    return new RegionMap({ mapping: s.mapping, overrides: s.overrides });
  }
}

export default RegionMap;
