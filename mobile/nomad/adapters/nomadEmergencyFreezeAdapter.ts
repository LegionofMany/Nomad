import { secureGetItem, secureSetItem } from '../../services/nativeStubs';

import { nomadRecoveryAdapter } from './nomadRecoveryAdapter';
import type {
  NomadAsset,
  NomadFreezeScope,
  NomadOwnerAuthorityRequest,
  NomadSecurityState,
  NomadWalletSessionState,
} from './walletAdapter';

export type NomadEmergencyFreezeIncidentStatus =
  | 'active'
  | 'alert_recorded'
  | 'release_requested'
  | 'superseded';

export type NomadEmergencyFreezeReleaseMethod = 'time_sets' | 'owner_authority';

export type NomadEmergencyFreezeAsset = {
  key: string;
  symbol: string;
  name: string;
  balance: string;
  network?: string;
  chainId?: string;
  accountId?: string;
};

export type NomadEmergencyFreezeIncident = {
  id: string;
  scope: NomadFreezeScope;
  scopeLabel: string;
  reason: string;
  selectedAssets: NomadEmergencyFreezeAsset[];
  status: NomadEmergencyFreezeIncidentStatus;
  activatedAt: string;
  updatedAt: string;
  centralPolicyRecorded: boolean;
  walletLockRequested: boolean;
  walletLockConfirmed: boolean;
  authorityRequestStatus: NomadOwnerAuthorityRequest['status'];
  authorityDeliveryConfirmed: false;
  directReleaseAllowed: false;
  releaseMethod?: NomadEmergencyFreezeReleaseMethod;
  releaseRequestedAt?: string;
  containsSecrets: false;
};

export type NomadEmergencyFreezeCheck = {
  id:
    | 'wallet_identity'
    | 'central_policy'
    | 'wallet_session_lock'
    | 'asset_selection'
    | 'asset_enforcement'
    | 'authority_request'
    | 'authority_delivery'
    | 'release_authorization'
    | 'persistent_storage';
  label: string;
  status: 'pass' | 'warning' | 'fail' | 'unavailable';
  detail: string;
};

export type NomadEmergencyFreezeEvent = {
  id: string;
  type: 'activation' | 'alert' | 'release_request' | 'system';
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
};

export type NomadEmergencyFreezeState = {
  status: 'clear' | 'active' | 'alert_recorded' | 'release_requested' | 'legacy_freeze';
  centralSecurity: NomadSecurityState;
  currentIncident?: NomadEmergencyFreezeIncident;
  incidents: NomadEmergencyFreezeIncident[];
  activity: NomadEmergencyFreezeEvent[];
  walletAssets: NomadEmergencyFreezeAsset[];
  walletSessionStatus: NomadWalletSessionState['status'] | 'unknown';
  checks: NomadEmergencyFreezeCheck[];
  blockedActions: string[];
  activeScope?: NomadFreezeScope;
  canActivateFreeze: boolean;
  canRequestRelease: boolean;
  directReleaseAllowed: false;
  specificAssetPolicyEnforced: false;
  walletPolicyProviderConnected: true;
  remoteAuthorityDeliveryConnected: false;
  signedReleaseReceiptProviderConnected: false;
  hardwareAttestationConnected: false;
  persistence: 'in_memory_stub';
  dataSource: 'nomad_emergency_freeze_adapter';
  checkedAt: string;
};

export type NomadEmergencyFreezeActivationInput = {
  scope: NomadFreezeScope;
  selectedAssetKeys: string[];
  reason: string;
  walletAssets: NomadAsset[];
  walletSession?: NomadWalletSessionState;
  securityState: NomadSecurityState;
  walletLockRequested: boolean;
  walletLockConfirmed: boolean;
};

export type NomadEmergencyFreezeSnapshotInput = {
  walletAssets: NomadAsset[];
  walletSession?: NomadWalletSessionState;
  securityState: NomadSecurityState;
};

export type NomadEmergencyFreezeAdapter = {
  getFreezeState(input: NomadEmergencyFreezeSnapshotInput): Promise<NomadEmergencyFreezeState>;
  validateActivation(input: Omit<NomadEmergencyFreezeActivationInput, 'securityState' | 'walletLockRequested' | 'walletLockConfirmed'> & { securityState: NomadSecurityState }): Promise<void>;
  recordActivation(input: NomadEmergencyFreezeActivationInput): Promise<NomadEmergencyFreezeState>;
  requestRelease(input: NomadEmergencyFreezeSnapshotInput & {
    incidentId: string;
    method: NomadEmergencyFreezeReleaseMethod;
    reason: string;
  }): Promise<NomadEmergencyFreezeState>;
};

type StoredEmergencyFreezeState = {
  incidents: NomadEmergencyFreezeIncident[];
  events: NomadEmergencyFreezeEvent[];
};

const STORAGE_KEY = 'nomad.security.emergency-freeze';
const MAX_INCIDENTS = 30;
const MAX_EVENTS = 60;

function nowIso() {
  return new Date().toISOString();
}

function identifier(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStoredState(): StoredEmergencyFreezeState {
  return { incidents: [], events: [] };
}

async function loadStoredState(): Promise<StoredEmergencyFreezeState> {
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return defaultStoredState();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredEmergencyFreezeState>;
    return {
      incidents: Array.isArray(parsed.incidents) ? parsed.incidents : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return defaultStoredState();
  }
}

async function saveStoredState(state: StoredEmergencyFreezeState) {
  await secureSetItem(STORAGE_KEY, JSON.stringify({
    incidents: state.incidents.slice(0, MAX_INCIDENTS),
    events: state.events.slice(0, MAX_EVENTS),
  }));
}

function appendEvent(
  stored: StoredEmergencyFreezeState,
  event: Omit<NomadEmergencyFreezeEvent, 'id' | 'timestamp'>,
): StoredEmergencyFreezeState {
  return {
    ...stored,
    events: [{ id: identifier('freeze-event'), timestamp: nowIso(), ...event }, ...stored.events].slice(0, MAX_EVENTS),
  };
}

function cleanReason(value: string) {
  const clean = value.trim().replace(/\s+/g, ' ').slice(0, 300);
  if (clean.length < 8) throw new Error('Describe the emergency or protection reason using at least eight characters.');
  if (/seed phrase|private key|mnemonic|time set|wallet password|secret key/i.test(clean)) {
    throw new Error('Do not include a seed phrase, private key, wallet password or Time Set in an emergency reason.');
  }
  return clean;
}

function scopeLabel(scope: NomadFreezeScope) {
  switch (scope) {
    case 'entire_wallet': return 'Entire Wallet';
    case 'travel_pocket': return 'Travel Pocket';
    case 'specific_assets': return 'Selected Assets';
    case 'owner_authority_alert': return 'Owner Authority Alert';
  }
}

function assetKey(asset: NomadAsset, index: number) {
  return [
    asset.chainId || asset.network || 'unknown-chain',
    asset.accountId || `account-${index}`,
    asset.contractAddress || asset.symbol,
  ].join(':');
}

function mapAssets(assets: NomadAsset[]): NomadEmergencyFreezeAsset[] {
  return assets.map((asset, index) => ({
    key: assetKey(asset, index),
    symbol: asset.symbol,
    name: asset.name,
    balance: asset.balance,
    network: asset.network,
    chainId: asset.chainId,
    accountId: asset.accountId,
  }));
}

function activeIncidentFor(
  incidents: NomadEmergencyFreezeIncident[],
  security: NomadSecurityState,
) {
  const candidates = incidents.filter((incident) => incident.status === 'active' || incident.status === 'release_requested');
  if (security.freezeScope) {
    const matched = candidates.find((incident) => incident.scope === security.freezeScope);
    if (matched) return matched;
  }
  return candidates[0] ?? incidents.find((incident) => incident.status === 'alert_recorded');
}

function blockedActions(scope?: NomadFreezeScope) {
  switch (scope) {
    case 'entire_wallet':
      return ['Outgoing transfers', 'Swaps', 'Travel Pocket top-ups', 'POS payment drafts', 'Protected configuration changes'];
    case 'travel_pocket':
      return ['Travel Pocket top-ups', 'Travel Pocket POS payments', 'Regional spending drafts'];
    case 'specific_assets':
      return ['Selected-asset outgoing actions', 'Connected adapters using the generic specific-assets freeze fallback'];
    case 'owner_authority_alert':
      return ['No action is automatically blocked by an alert-only record'];
    default:
      return [];
  }
}

function buildChecks(params: {
  sessionStatus: NomadEmergencyFreezeState['walletSessionStatus'];
  security: NomadSecurityState;
  incident?: NomadEmergencyFreezeIncident;
  authority: NomadOwnerAuthorityRequest;
}): NomadEmergencyFreezeCheck[] {
  const { sessionStatus, security, incident, authority } = params;
  const centralActive = security.freezeStatus !== 'none' && security.freezeScope !== 'owner_authority_alert';
  const fullFreeze = security.freezeStatus === 'full' || security.freezeScope === 'entire_wallet';
  const specificAssets = incident?.scope === 'specific_assets';

  return [
    {
      id: 'wallet_identity',
      label: 'Wallet identity',
      status: sessionStatus === 'no_wallet' ? 'fail' : sessionStatus === 'unknown' ? 'warning' : 'pass',
      detail: sessionStatus === 'no_wallet'
        ? 'No wallet identity is available for emergency protection.'
        : sessionStatus === 'unknown'
          ? 'The connected wallet did not expose session evidence.'
          : `Wallet session status: ${sessionStatus}. Emergency activation does not require an unlocked session.`,
    },
    {
      id: 'central_policy',
      label: 'Central freeze policy',
      status: centralActive ? 'pass' : incident?.scope === 'owner_authority_alert' ? 'warning' : 'fail',
      detail: centralActive
        ? `${scopeLabel(security.freezeScope || 'travel_pocket')} is recorded by the central Nomad security adapter.`
        : incident?.scope === 'owner_authority_alert'
          ? 'An alert-only record exists; it does not freeze wallet actions.'
          : 'No active central freeze policy is recorded.',
    },
    {
      id: 'wallet_session_lock',
      label: 'Wallet session lock',
      status: fullFreeze
        ? sessionStatus === 'locked' || sessionStatus === 'expired' || sessionStatus === 'recovery' ? 'pass' : 'fail'
        : 'warning',
      detail: fullFreeze
        ? sessionStatus === 'locked' || sessionStatus === 'expired' || sessionStatus === 'recovery'
          ? `The wallet session reports ${sessionStatus}.`
          : 'A full freeze is recorded, but the connected wallet session is not confirmed locked.'
        : 'Session locking is required for a full-wallet freeze and optional for narrower policy scopes.',
    },
    {
      id: 'asset_selection',
      label: 'Selected-asset record',
      status: specificAssets
        ? incident.selectedAssets.length ? 'pass' : 'fail'
        : 'warning',
      detail: specificAssets
        ? incident.selectedAssets.length
          ? `${incident.selectedAssets.length} wallet asset record(s) are attached to the incident.`
          : 'No wallet assets are attached to the selected-assets incident.'
        : 'This incident does not use a selected-assets scope.',
    },
    {
      id: 'asset_enforcement',
      label: 'Per-asset enforcement provider',
      status: 'unavailable',
      detail: 'The central adapter records the selected-assets scope, but chain-specific per-asset signing enforcement is not connected. Transaction adapters may apply a broader protective block.',
    },
    {
      id: 'authority_request',
      label: 'Owner Authority request',
      status: authority.status === 'pending' || authority.status === 'approved' ? 'warning' : 'fail',
      detail: authority.status === 'approved'
        ? 'An approved flag exists, but no signed authority receipt is verified.'
        : authority.status === 'pending'
          ? 'A local authority request is pending. Independent review remains unverified.'
          : 'No active Owner Authority request is recorded.',
    },
    {
      id: 'authority_delivery',
      label: 'Remote authority delivery',
      status: 'unavailable',
      detail: 'No encrypted authority directory, remote delivery provider or signed acknowledgement is connected.',
    },
    {
      id: 'release_authorization',
      label: 'Verified freeze release',
      status: centralActive ? 'warning' : 'fail',
      detail: centralActive
        ? 'Direct clearing is disabled. A verified Time Set or independently signed Owner Authority release is required.'
        : 'No active freeze is available for a release workflow.',
    },
    {
      id: 'persistent_storage',
      label: 'Encrypted persistent audit log',
      status: 'warning',
      detail: 'Freeze incident metadata currently uses the in-memory secure-storage stub rather than encrypted durable storage.',
    },
  ];
}

function stateStatus(
  security: NomadSecurityState,
  incident?: NomadEmergencyFreezeIncident,
): NomadEmergencyFreezeState['status'] {
  if (security.freezeStatus !== 'none') {
    if (!incident) return 'legacy_freeze';
    return incident.status === 'release_requested' ? 'release_requested' : 'active';
  }
  if (incident?.status === 'alert_recorded') return 'alert_recorded';
  return 'clear';
}

async function buildState(input: NomadEmergencyFreezeSnapshotInput): Promise<NomadEmergencyFreezeState> {
  const [stored, authority] = await Promise.all([
    loadStoredState(),
    nomadRecoveryAdapter.getOwnerAuthorityRequest(),
  ]);
  const walletAssets = mapAssets(input.walletAssets);
  const walletSessionStatus = input.walletSession?.status ?? 'unknown';
  const currentIncident = activeIncidentFor(stored.incidents, input.securityState);
  const centralActive = input.securityState.freezeStatus !== 'none'
    && input.securityState.freezeScope !== 'owner_authority_alert';

  return {
    status: stateStatus(input.securityState, currentIncident),
    centralSecurity: input.securityState,
    currentIncident,
    incidents: stored.incidents,
    activity: stored.events,
    walletAssets,
    walletSessionStatus,
    checks: buildChecks({
      sessionStatus: walletSessionStatus,
      security: input.securityState,
      incident: currentIncident,
      authority,
    }),
    blockedActions: blockedActions(input.securityState.freezeScope ?? currentIncident?.scope),
    activeScope: input.securityState.freezeScope ?? currentIncident?.scope,
    canActivateFreeze: walletSessionStatus !== 'no_wallet',
    canRequestRelease: centralActive,
    directReleaseAllowed: false,
    specificAssetPolicyEnforced: false,
    walletPolicyProviderConnected: true,
    remoteAuthorityDeliveryConnected: false,
    signedReleaseReceiptProviderConnected: false,
    hardwareAttestationConnected: false,
    persistence: 'in_memory_stub',
    dataSource: 'nomad_emergency_freeze_adapter',
    checkedAt: nowIso(),
  };
}

async function validateActivation(
  input: Omit<NomadEmergencyFreezeActivationInput, 'walletLockRequested' | 'walletLockConfirmed'>,
) {
  if (input.walletSession?.status === 'no_wallet') {
    throw new Error('Create or restore a wallet before activating emergency protection.');
  }
  cleanReason(input.reason);
  const assets = mapAssets(input.walletAssets);
  if (input.scope === 'specific_assets') {
    const available = new Set(assets.map((asset) => asset.key));
    const selected = [...new Set(input.selectedAssetKeys)].filter((key) => available.has(key));
    if (!selected.length) throw new Error('Select at least one connected wallet asset before activating the selected-assets scope.');
  }

  const activeScope = input.securityState.freezeStatus !== 'none'
    ? input.securityState.freezeScope
    : undefined;
  if (activeScope && input.scope !== 'owner_authority_alert') {
    if (activeScope === input.scope) throw new Error(`${scopeLabel(input.scope)} protection is already active.`);
    if (input.scope !== 'entire_wallet') {
      throw new Error('An active freeze cannot be reduced or changed on Page 25. Request verified release, or escalate the current scope to Entire Wallet.');
    }
  }
}

async function recordActivation(input: NomadEmergencyFreezeActivationInput) {
  const reason = cleanReason(input.reason);
  const assets = mapAssets(input.walletAssets);
  const selectedKeys = new Set(input.selectedAssetKeys);
  const selectedAssets = input.scope === 'specific_assets'
    ? assets.filter((asset) => selectedKeys.has(asset.key))
    : [];

  if (input.scope !== 'owner_authority_alert' && input.securityState.freezeStatus === 'none') {
    throw new Error('The central security adapter did not confirm an active freeze. No Page 25 activation receipt was created.');
  }

  const timestamp = nowIso();
  const incidentId = identifier('freeze-incident');
  let authorityRequest = await nomadRecoveryAdapter.getOwnerAuthorityRequest();
  if (input.scope === 'owner_authority_alert' && authorityRequest.status !== 'pending') {
    authorityRequest = await nomadRecoveryAdapter.requestOwnerAuthorityApproval(
      `Emergency Freeze alert ${incidentId}: ${reason}`,
    );
  }

  const incident: NomadEmergencyFreezeIncident = {
    id: incidentId,
    scope: input.scope,
    scopeLabel: scopeLabel(input.scope),
    reason,
    selectedAssets,
    status: input.scope === 'owner_authority_alert' ? 'alert_recorded' : 'active',
    activatedAt: timestamp,
    updatedAt: timestamp,
    centralPolicyRecorded: input.scope === 'owner_authority_alert'
      ? input.securityState.freezeScope === 'owner_authority_alert' || input.securityState.freezeActivity.some((item) => item.scope === 'owner_authority_alert')
      : input.securityState.freezeStatus !== 'none',
    walletLockRequested: input.walletLockRequested,
    walletLockConfirmed: input.walletLockConfirmed,
    authorityRequestStatus: authorityRequest.status,
    authorityDeliveryConfirmed: false,
    directReleaseAllowed: false,
    containsSecrets: false,
  };

  let stored = await loadStoredState();
  const superseded = stored.incidents.map((item) => {
    if ((item.status === 'active' || item.status === 'release_requested') && input.scope === 'entire_wallet') {
      return { ...item, status: 'superseded' as const, updatedAt: timestamp };
    }
    return item;
  });
  stored = appendEvent({
    ...stored,
    incidents: [incident, ...superseded].slice(0, MAX_INCIDENTS),
  }, {
    type: input.scope === 'owner_authority_alert' ? 'alert' : 'activation',
    title: input.scope === 'owner_authority_alert' ? 'Owner Authority alert recorded' : `${incident.scopeLabel} freeze recorded`,
    detail: input.scope === 'specific_assets'
      ? `${selectedAssets.map((asset) => asset.symbol).join(', ')} • central fallback policy active • per-asset signing enforcement unavailable`
      : input.scope === 'entire_wallet'
        ? `Central policy active • wallet lock ${input.walletLockConfirmed ? 'confirmed' : 'not confirmed'}`
        : input.scope === 'owner_authority_alert'
          ? 'Local authority request created or reused • remote delivery unconfirmed'
          : 'Central Travel Pocket freeze policy active',
    severity: input.scope === 'owner_authority_alert' ? 'warning' : 'critical',
  });
  await saveStoredState(stored);
  return buildState({
    walletAssets: input.walletAssets,
    walletSession: input.walletSession,
    securityState: input.securityState,
  });
}

async function requestRelease(input: NomadEmergencyFreezeSnapshotInput & {
  incidentId: string;
  method: NomadEmergencyFreezeReleaseMethod;
  reason: string;
}) {
  if (input.securityState.freezeStatus === 'none') throw new Error('No active central freeze is available for release review.');
  const reason = cleanReason(input.reason);
  let stored = await loadStoredState();
  const incident = stored.incidents.find((item) => item.id === input.incidentId);
  if (!incident) throw new Error('The selected emergency-freeze incident was not found.');
  if (incident.status === 'superseded') throw new Error('A superseded incident cannot start a new release request.');

  let authorityRequest = await nomadRecoveryAdapter.getOwnerAuthorityRequest();
  if (input.method === 'owner_authority' && authorityRequest.status !== 'pending') {
    authorityRequest = await nomadRecoveryAdapter.requestOwnerAuthorityApproval(
      `Release Emergency Freeze incident ${incident.id}: ${reason}`,
    );
  }

  const timestamp = nowIso();
  const updated: NomadEmergencyFreezeIncident = {
    ...incident,
    status: 'release_requested',
    updatedAt: timestamp,
    releaseMethod: input.method,
    releaseRequestedAt: timestamp,
    authorityRequestStatus: authorityRequest.status,
  };
  stored = appendEvent({
    ...stored,
    incidents: [updated, ...stored.incidents.filter((item) => item.id !== incident.id)].slice(0, MAX_INCIDENTS),
  }, {
    type: 'release_request',
    title: 'Verified freeze release requested',
    detail: input.method === 'owner_authority'
      ? 'A local Owner Authority request is pending. Remote delivery and signed release remain unverified; the freeze stays active.'
      : 'Time Set verification was selected. Completing recovery verification does not clear the freeze until a release provider consumes verified evidence.',
    severity: 'warning',
  });
  await saveStoredState(stored);
  return buildState(input);
}

export const nomadEmergencyFreezeAdapter: NomadEmergencyFreezeAdapter = {
  getFreezeState: buildState,
  validateActivation,
  recordActivation,
  requestRelease,
};
