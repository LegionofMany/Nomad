import { localNomadSecurityAdapter } from './localNomadAdapters';
import { nomadSecurityAdapter } from './nomadSecurityAdapter';
import type { NomadSecurityAdapter } from './walletAdapter';

/**
 * Transitional security bridge.
 *
 * The stateful Nomad security adapter is the source of truth for the UI and
 * audit log. Swap and Travel still read the legacy local security adapter, so
 * freeze activation is mirrored there until those transaction bridges are
 * fully migrated to the stateful adapter.
 */
export const nomadSecurityBridgeAdapter: NomadSecurityAdapter = {
  getSecurityState: () => nomadSecurityAdapter.getSecurityState(),
  runSecurityScan: () => nomadSecurityAdapter.runSecurityScan(),
  async activateFreeze(scope) {
    await localNomadSecurityAdapter.activateFreeze(scope);
    return nomadSecurityAdapter.activateFreeze(scope);
  },
  clearFreeze: () => nomadSecurityAdapter.clearFreeze(),
};
