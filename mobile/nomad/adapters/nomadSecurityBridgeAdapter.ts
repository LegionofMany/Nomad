import { localNomadSecurityAdapter } from './localNomadAdapters';
import { nomadSecurityAdapter } from './nomadSecurityAdapter';
import type { NomadSecurityAdapter, NomadSecurityState } from './walletAdapter';

/**
 * Transitional security bridge.
 *
 * The stateful Nomad security adapter is the source of truth for the UI and
 * audit log. Swap and Travel still read the legacy local security adapter, so
 * actual freeze activation is mirrored there until those transaction bridges
 * are fully migrated. Owner Authority alerts are not freezes and are never
 * mirrored into transaction-blocking state.
 */
function normalizeAlertOnlyState(state: NomadSecurityState): NomadSecurityState {
  if (state.freezeScope !== 'owner_authority_alert') return state;
  return {
    ...state,
    freezeStatus: 'none',
  };
}

export const nomadSecurityBridgeAdapter: NomadSecurityAdapter = {
  async getSecurityState() {
    return normalizeAlertOnlyState(await nomadSecurityAdapter.getSecurityState());
  },
  async runSecurityScan() {
    return normalizeAlertOnlyState(await nomadSecurityAdapter.runSecurityScan());
  },
  async activateFreeze(scope) {
    if (scope !== 'owner_authority_alert') {
      await localNomadSecurityAdapter.activateFreeze(scope);
    }
    return normalizeAlertOnlyState(await nomadSecurityAdapter.activateFreeze(scope));
  },
  clearFreeze: () => nomadSecurityAdapter.clearFreeze(),
};
