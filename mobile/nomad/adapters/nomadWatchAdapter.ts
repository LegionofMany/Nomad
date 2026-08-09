import {
  getWalletMeta,
  getWalletStatus,
  lockWallet,
} from '../../services/walletService';
import { secureGetItem, secureSetItem } from '../../services/nativeStubs';

import { nomadRecoveryAdapter } from './nomadRecoveryAdapter';
import { nomadSecurityBridgeAdapter } from './nomadSecurityBridgeAdapter';
import { nomadTravelAdapter } from './nomadTravelAdapter';
import type {
  NomadOwnerAuthorityRequest,
  NomadSecurityState,
  NomadTravelPocketState,
  NomadWatchAdapter,
  NomadWatchEmergencyAction,
  NomadWatchState,
} from './walletAdapter';

export type NomadWatchPlatform = 'wear_os' | 'watch_os' | 'other';
export type NomadWatchPairingStatus = 'not_paired' | 'local_pairing_draft' | 'verified_paired' | 'cancelled';
export type NomadWatchPreferenceId = 'security_alerts' | 'travel_summary' | 'time_set_reminders';

export type NomadWatchDeviceProfile = {
  id: string;
  requestId: string;
  label: string;
  platform: NomadWatchPlatform;
  platformLabel: string;
  status: Exclude<NomadWatchPairingStatus, 'not_paired'>;
  createdAt: string;
  updatedAt: string;
  authenticatedPairingReceiptVerified: false;
  hardwareIdentityVerified: false;
  bluetoothTransportAuthenticated: false;
  deviceIdentifierRetained: false;
  containsSecrets: false;
};

export type NomadWatchPreference = {
  id: NomadWatchPreferenceId;
  label: string;
  detail: string;
  enabled: boolean;
  deliveryStatus: 'local_intent_only';
};

export type NomadWatchCheck = {
  id:
    | 'wallet_identity'
    | 'local_device_profile'
    | 'hardware_identity'
    | 'authenticated_pairing'
    | 'bluetooth_transport'
    | 'battery_telemetry'
    | 'firmware_attestation'
    | 'sync_receipt'
    | 'wallet_policy'
    | 'travel_data'
    | 'time_set_data'
    | 'watch_delivery'
    | 'authority_delivery'
    | 'remote_wipe';
  label: string;
  status: 'pass' | 'warning' | 'fail' | 'unavailable';
  detail: string;
  provider: string;
};

export type NomadWatchEvent = {
  id: string;
  type: 'pairing' | 'preference' | 'emergency' | 'system';
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
};

export type NomadWatchEmergencyReceipt = {
  id: string;
  action: NomadWatchEmergencyAction;
  actionLabel: string;
  source: 'nomad_app';
  status: 'completed' | 'partial' | 'failed';
  requestedAt: string;
  completedAt: string;
  centralFreezeStatus: NomadSecurityState['freezeStatus'];
  centralFreezeScope?: NomadSecurityState['freezeScope'];
  walletLockRequested: boolean;
  walletLockConfirmed: boolean;
  walletHidden: false;
  authorityRequestStatus: NomadOwnerAuthorityRequest['status'];
  authorityDeliveryConfirmed: false;
  watchCommandDelivered: false;
  containsSecrets: false;
  failureMessage?: string;
};

export type NomadExtendedWatchState = NomadWatchState & {
  pairingStatus: NomadWatchPairingStatus;
  currentDevice?: NomadWatchDeviceProfile;
  deviceProfiles: NomadWatchDeviceProfile[];
  preferences: NomadWatchPreference[];
  checks: NomadWatchCheck[];
  activity: NomadWatchEvent[];
  emergencyReceipts: NomadWatchEmergencyReceipt[];
  walletStatus: 'no_wallet' | 'locked' | 'unlocked' | 'recovery';
  centralSecurityStatus: NomadSecurityState['status'];
  centralFreezeStatus: NomadSecurityState['freezeStatus'];
  centralFreezeScope?: NomadSecurityState['freezeScope'];
  travelPocket: NomadTravelPocketState;
  travelActivationAt?: string;
  travelExpiryAt?: string;
  travelSpentTodayPercent: number;
  travelDataSource: NomadTravelPocketState['dataSource'] | 'unavailable';
  timeSetsComplete: number;
  timeSetsTotal: number;
  timeSetConfigured: boolean;
  deviceTimezone: string;
  authorityRequestStatus: NomadOwnerAuthorityRequest['status'];
  canCreatePairingDraft: boolean;
  canCancelPairingDraft: boolean;
  canSyncWatch: false;
  canFindWatch: false;
  canRemoteWipe: false;
  canTriggerAppEmergencyActions: boolean;
  wearableBridgeConnected: false;
  authenticatedBluetoothConnected: false;
  hardwareIdentityProviderConnected: false;
  telemetryProviderConnected: false;
  firmwareProviderConnected: false;
  findWatchProviderConnected: false;
  remoteWipeProviderConnected: false;
  authorityDeliveryProviderConnected: false;
  dataSource: 'nomad_watch_adapter';
  persistence: 'in_memory_stub';
  checkedAt: string;
};

export type NomadWatchAdapterInput = {
  label: string;
  platform: NomadWatchPlatform;
  confirmNoWalletSecrets: boolean;
  confirmLocalDraftOnly: boolean;
};

export type NomadExtendedWatchAdapter = Omit<NomadWatchAdapter, 'getWatchState' | 'syncNow' | 'triggerEmergencyAction'> & {
  getWatchState(): Promise<NomadExtendedWatchState>;
  createPairingDraft(input: NomadWatchAdapterInput): Promise<NomadExtendedWatchState>;
  cancelPairingDraft(profileId: string): Promise<NomadExtendedWatchState>;
  setPreference(id: NomadWatchPreferenceId, enabled: boolean): Promise<NomadExtendedWatchState>;
  findWatch(): Promise<NomadExtendedWatchState>;
  requestRemoteWipe(): Promise<NomadExtendedWatchState>;
  exportPairingSummary(profileId: string): Promise<string>;
  syncNow(): Promise<NomadExtendedWatchState>;
  triggerEmergencyAction(action: NomadWatchEmergencyAction): Promise<NomadExtendedWatchState>;
};

type StoredNomadWatch = {
  profiles: NomadWatchDeviceProfile[];
  preferences: Record<NomadWatchPreferenceId, boolean>;
  events: NomadWatchEvent[];
  emergencyReceipts: NomadWatchEmergencyReceipt[];
};

const STORAGE_KEY = 'nomad.watch.extended';
const MAX_PROFILES = 10;
const MAX_EVENTS = 60;
const MAX_RECEIPTS = 30;

const PLATFORM_LABELS: Record<NomadWatchPlatform, string> = {
  wear_os: 'Wear OS',
  watch_os: 'watchOS',
  other: 'Other Wearable',
};

const ACTION_LABELS: Record<NomadWatchEmergencyAction, string> = {
  emergency_lock: 'Emergency Lock',
  pause_spending: 'Pause Travel Spending',
  alert_authority: 'Alert Owner Authority',
  panic_mode: 'Panic Mode',
};

function nowIso() {
  return new Date().toISOString();
}

function identifier(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStoredState(): StoredNomadWatch {
  return {
    profiles: [],
    preferences: {
      security_alerts: false,
      travel_summary: false,
      time_set_reminders: false,
    },
    events: [],
    emergencyReceipts: [],
  };
}

async function loadStoredState(): Promise<StoredNomadWatch> {
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return defaultStoredState();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredNomadWatch>;
    const defaults = defaultStoredState();
    return {
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      preferences: {
        ...defaults.preferences,
        ...(parsed.preferences ?? {}),
      },
      events: Array.isArray(parsed.events) ? parsed.events : [],
      emergencyReceipts: Array.isArray(parsed.emergencyReceipts) ? parsed.emergencyReceipts : [],
    };
  } catch {
    return defaultStoredState();
  }
}

async function saveStoredState(state: StoredNomadWatch) {
  await secureSetItem(STORAGE_KEY, JSON.stringify({
    profiles: state.profiles.slice(0, MAX_PROFILES),
    preferences: state.preferences,
    events: state.events.slice(0, MAX_EVENTS),
    emergencyReceipts: state.emergencyReceipts.slice(0, MAX_RECEIPTS),
  }));
}

function appendEvent(
  stored: StoredNomadWatch,
  event: Omit<NomadWatchEvent, 'id' | 'timestamp'>,
): StoredNomadWatch {
  return {
    ...stored,
    events: [{ id: identifier('watch-event'), timestamp: nowIso(), ...event }, ...stored.events].slice(0, MAX_EVENTS),
  };
}

function cleanLabel(value: string) {
  const clean = value.trim().replace(/\s+/g, ' ').slice(0, 80);
  if (clean.length < 2) throw new Error('Enter a watch label using at least two characters.');
  if (/seed phrase|private key|mnemonic|time set|wallet password|secret key/i.test(clean)) {
    throw new Error('Do not include a seed phrase, private key, wallet password or Time Set in a watch label.');
  }
  return clean;
}

function currentProfile(profiles: NomadWatchDeviceProfile[]) {
  return profiles.find((profile) => profile.status !== 'cancelled');
}

function formatClock(time: { hour: number; minute: number; second?: number } | null) {
  if (!time) return 'Not configured';
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}:${String(time.second ?? 0).padStart(2, '0')} device-local`;
}

function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Device local timezone';
  } catch {
    return 'Device local timezone';
  }
}

function preferenceList(preferences: StoredNomadWatch['preferences']): NomadWatchPreference[] {
  return [
    {
      id: 'security_alerts',
      label: 'Security Alerts',
      detail: 'Record the intent to deliver freeze and wallet-security alerts to a future paired watch.',
      enabled: preferences.security_alerts,
      deliveryStatus: 'local_intent_only',
    },
    {
      id: 'travel_summary',
      label: 'Travel Pocket Summary',
      detail: 'Record the intent to display region, balance and spending limits on a future paired watch.',
      enabled: preferences.travel_summary,
      deliveryStatus: 'local_intent_only',
    },
    {
      id: 'time_set_reminders',
      label: 'Time Set Reminders',
      detail: 'Record the intent to show protected-time reminders without exposing enrolled Time Set values.',
      enabled: preferences.time_set_reminders,
      deliveryStatus: 'local_intent_only',
    },
  ];
}

function buildChecks(params: {
  walletStatus: NomadExtendedWatchState['walletStatus'];
  profile?: NomadWatchDeviceProfile;
  security: NomadSecurityState;
  travel: NomadTravelPocketState;
  timeSetConfigured: boolean;
  authority: NomadOwnerAuthorityRequest;
}): NomadWatchCheck[] {
  const { walletStatus, profile, security, travel, timeSetConfigured, authority } = params;
  const hasWallet = walletStatus !== 'no_wallet';
  return [
    {
      id: 'wallet_identity',
      label: 'Wallet identity',
      status: hasWallet ? 'pass' : 'fail',
      detail: hasWallet ? `A local wallet identity is available in ${walletStatus} state.` : 'Create or restore a wallet before preparing a watch profile.',
      provider: 'Nomad wallet service',
    },
    {
      id: 'local_device_profile',
      label: 'Local watch profile',
      status: profile ? 'warning' : 'fail',
      detail: profile
        ? `${profile.label} is stored as a local pairing draft. It is not a paired device.`
        : 'No local watch profile or verified pairing receipt exists.',
      provider: 'Nomad Watch local registry',
    },
    {
      id: 'hardware_identity',
      label: 'Hardware identity',
      status: 'unavailable',
      detail: 'No wearable hardware identifier, secure-element credential or manufacturer attestation is verified.',
      provider: 'Not connected',
    },
    {
      id: 'authenticated_pairing',
      label: 'Authenticated pairing receipt',
      status: 'unavailable',
      detail: 'No signed pairing receipt binds a wearable to this wallet owner and device.',
      provider: 'Not connected',
    },
    {
      id: 'bluetooth_transport',
      label: 'Bluetooth or wearable transport',
      status: 'unavailable',
      detail: 'No authenticated Bluetooth LE, Wear OS, watchOS or wearable communication bridge is connected.',
      provider: 'Not connected',
    },
    {
      id: 'battery_telemetry',
      label: 'Battery telemetry',
      status: 'unavailable',
      detail: 'Battery percentage is unavailable until a verified wearable telemetry receipt exists.',
      provider: 'Not connected',
    },
    {
      id: 'firmware_attestation',
      label: 'Firmware and application integrity',
      status: 'unavailable',
      detail: 'Firmware version, application signature and update status are not attested by a wearable provider.',
      provider: 'Not connected',
    },
    {
      id: 'sync_receipt',
      label: 'Watch synchronization receipt',
      status: 'unavailable',
      detail: 'No watch acknowledged receipt of wallet, Travel Pocket, Time Set or security metadata.',
      provider: 'Not connected',
    },
    {
      id: 'wallet_policy',
      label: 'Wallet security policy',
      status: security.freezeStatus === 'none' ? 'warning' : 'pass',
      detail: security.freezeStatus === 'none'
        ? 'The phone can read the central wallet-security state. No watch has received it.'
        : `${security.freezeStatus.toUpperCase()} protection is active on the phone-side security adapter. Watch delivery is unconfirmed.`,
      provider: 'Nomad security bridge',
    },
    {
      id: 'travel_data',
      label: 'Travel Pocket data',
      status: travel.dataSource === 'connected' ? 'pass' : 'warning',
      detail: travel.dataSource === 'connected'
        ? 'Connected Travel Pocket data is available to the Nomad app.'
        : 'Travel Pocket values are local-preview data and have not been synchronized to a watch.',
      provider: travel.dataSource === 'connected' ? 'Travel Pocket provider' : 'Nomad local preview',
    },
    {
      id: 'time_set_data',
      label: 'Protected Time Set status',
      status: timeSetConfigured ? 'pass' : 'warning',
      detail: timeSetConfigured
        ? 'A daily protected time is configured on the phone. Raw Time Set values are not exposed to Page 26.'
        : 'No daily protected time is configured.',
      provider: 'Nomad recovery adapter',
    },
    {
      id: 'watch_delivery',
      label: 'Watch policy delivery',
      status: 'unavailable',
      detail: 'No watch delivery acknowledgement exists for Travel Pocket, security or protected-time metadata.',
      provider: 'Not connected',
    },
    {
      id: 'authority_delivery',
      label: 'Owner Authority alert delivery',
      status: authority.status === 'pending' || authority.status === 'approved' ? 'warning' : 'fail',
      detail: authority.status === 'approved'
        ? 'An approval flag exists, but no verified signed receipt or watch-originated delivery evidence exists.'
        : authority.status === 'pending'
          ? 'A local Owner Authority request is pending. Remote delivery remains unconfirmed.'
          : 'No active local Owner Authority request is recorded.',
      provider: 'Nomad recovery adapter',
    },
    {
      id: 'remote_wipe',
      label: 'Secure unpair and remote wipe',
      status: 'unavailable',
      detail: 'No authenticated wearable command channel can unpair, erase or verify a device wipe.',
      provider: 'Not connected',
    },
  ];
}

async function buildState(): Promise<NomadExtendedWatchState> {
  const [stored, walletMeta, walletStatus, travel, security, recovery, authority] = await Promise.all([
    loadStoredState(),
    getWalletMeta(),
    getWalletStatus(),
    nomadTravelAdapter.getTravelPocketState(),
    nomadSecurityBridgeAdapter.getSecurityState(),
    nomadRecoveryAdapter.getRecoveryState(),
    nomadRecoveryAdapter.getOwnerAuthorityRequest(),
  ]);
  const profile = currentProfile(stored.profiles);
  const pairingStatus: NomadWatchPairingStatus = profile?.status === 'local_pairing_draft'
    ? 'local_pairing_draft'
    : 'not_paired';
  const timeSetConfigured = Boolean(recovery.dailyUnlockTime);
  const securityStatus: NomadWatchState['securityStatus'] = security.freezeStatus !== 'none'
    || walletStatus === 'locked'
    || walletStatus === 'recovery'
    ? 'locked'
    : 'warning';
  const authorityLabel = authority.status === 'pending'
    ? 'Pending local request'
    : authority.status === 'approved'
      ? 'Approval flag unverified'
      : 'No active request';

  return {
    connected: false,
    deviceName: profile?.label || 'No Verified Watch',
    firmware: 'Unavailable',
    batteryPercent: 0,
    lastSyncedLabel: 'Never',
    securityStatus,
    travelRegion: travel.regionInput || 'Global',
    travelSubregion: 'Destination detail unavailable',
    travelModeLabel: travel.enabled ? 'Active on phone' : 'Inactive on phone',
    timeSetLabel: formatClock(recovery.dailyUnlockTime),
    travelPocketBalance: travel.pocketBalanceLocal || travel.pocketBalanceFiat || 'Unavailable',
    todaySpending: travel.spentTodayLocal || 'Unavailable',
    dailyLimit: travel.dailyLimitLocal || 'Unavailable',
    ownerAuthorityAlertLabel: authorityLabel,
    pairingStatus,
    currentDevice: profile,
    deviceProfiles: stored.profiles,
    preferences: preferenceList(stored.preferences),
    checks: buildChecks({
      walletStatus,
      profile,
      security,
      travel,
      timeSetConfigured,
      authority,
    }),
    activity: stored.events,
    emergencyReceipts: stored.emergencyReceipts,
    walletStatus,
    centralSecurityStatus: security.status,
    centralFreezeStatus: security.freezeStatus,
    centralFreezeScope: security.freezeScope,
    travelPocket: travel,
    travelActivationAt: travel.selectedAt,
    travelExpiryAt: travel.expiresAt,
    travelSpentTodayPercent: Math.max(0, Math.min(100, travel.spentTodayPercent ?? 0)),
    travelDataSource: travel.dataSource ?? 'unavailable',
    timeSetsComplete: recovery.timeSetsComplete,
    timeSetsTotal: recovery.timeSetsTotal,
    timeSetConfigured,
    deviceTimezone: deviceTimezone(),
    authorityRequestStatus: authority.status,
    canCreatePairingDraft: Boolean(walletMeta)
      && walletStatus === 'unlocked'
      && !profile
      && security.freezeStatus === 'none',
    canCancelPairingDraft: Boolean(profile?.status === 'local_pairing_draft'),
    canSyncWatch: false,
    canFindWatch: false,
    canRemoteWipe: false,
    canTriggerAppEmergencyActions: Boolean(walletMeta),
    wearableBridgeConnected: false,
    authenticatedBluetoothConnected: false,
    hardwareIdentityProviderConnected: false,
    telemetryProviderConnected: false,
    firmwareProviderConnected: false,
    findWatchProviderConnected: false,
    remoteWipeProviderConnected: false,
    authorityDeliveryProviderConnected: false,
    dataSource: 'nomad_watch_adapter',
    persistence: 'in_memory_stub',
    checkedAt: nowIso(),
  };
}

async function createPairingDraft(input: NomadWatchAdapterInput) {
  const state = await buildState();
  if (state.walletStatus === 'no_wallet') throw new Error('Create or restore a wallet before preparing a Nomad Watch profile.');
  if (state.walletStatus !== 'unlocked') throw new Error('Unlock the wallet before preparing a watch pairing draft.');
  if (state.centralFreezeStatus !== 'none') throw new Error('Emergency Freeze blocks watch-pairing configuration changes.');
  if (state.currentDevice) throw new Error('Cancel the current local watch profile before preparing another pairing draft.');
  if (!input.confirmNoWalletSecrets) throw new Error('Confirm that the watch label contains no wallet secrets.');
  if (!input.confirmLocalDraftOnly) throw new Error('Confirm that this creates only a local pairing draft.');
  if (!Object.prototype.hasOwnProperty.call(PLATFORM_LABELS, input.platform)) throw new Error('Choose a supported watch platform.');

  const timestamp = nowIso();
  const profile: NomadWatchDeviceProfile = {
    id: identifier('watch-profile'),
    requestId: identifier('watch-pairing'),
    label: cleanLabel(input.label),
    platform: input.platform,
    platformLabel: PLATFORM_LABELS[input.platform],
    status: 'local_pairing_draft',
    createdAt: timestamp,
    updatedAt: timestamp,
    authenticatedPairingReceiptVerified: false,
    hardwareIdentityVerified: false,
    bluetoothTransportAuthenticated: false,
    deviceIdentifierRetained: false,
    containsSecrets: false,
  };

  let stored = await loadStoredState();
  stored = appendEvent({
    ...stored,
    profiles: [profile, ...stored.profiles].slice(0, MAX_PROFILES),
  }, {
    type: 'pairing',
    title: 'Local watch pairing draft created',
    detail: `${profile.label} • ${profile.platformLabel} • no hardware identity or authenticated pairing receipt`,
    severity: 'warning',
  });
  await saveStoredState(stored);
  return buildState();
}

async function cancelPairingDraft(profileId: string) {
  const cleanId = profileId.trim();
  let stored = await loadStoredState();
  const profile = stored.profiles.find((item) => item.id === cleanId);
  if (!profile) throw new Error('The selected local watch profile was not found.');
  if (profile.status !== 'local_pairing_draft') {
    throw new Error('Only an unverified local pairing draft can be cancelled without a wearable provider.');
  }
  const cancelled: NomadWatchDeviceProfile = {
    ...profile,
    status: 'cancelled',
    updatedAt: nowIso(),
  };
  stored = appendEvent({
    ...stored,
    profiles: [cancelled, ...stored.profiles.filter((item) => item.id !== profile.id)].slice(0, MAX_PROFILES),
  }, {
    type: 'pairing',
    title: 'Local watch pairing draft cancelled',
    detail: `${profile.id} was cancelled locally. No remote wearable unpair command was sent.`,
    severity: 'warning',
  });
  await saveStoredState(stored);
  return buildState();
}

async function setPreference(id: NomadWatchPreferenceId, enabled: boolean) {
  const allowed = new Set<NomadWatchPreferenceId>(['security_alerts', 'travel_summary', 'time_set_reminders']);
  if (!allowed.has(id)) throw new Error('Choose a valid Nomad Watch preference.');
  let stored = await loadStoredState();
  stored = appendEvent({
    ...stored,
    preferences: { ...stored.preferences, [id]: enabled },
  }, {
    type: 'preference',
    title: 'Watch preference updated locally',
    detail: `${id.replace(/_/g, ' ')} • ${enabled ? 'enabled' : 'disabled'} • delivery unavailable`,
    severity: 'info',
  });
  await saveStoredState(stored);
  return buildState();
}

async function unavailableAction(label: string): Promise<never> {
  throw new Error(`${label} requires a verified paired watch and authenticated wearable command provider.`);
}

async function syncNow() {
  return unavailableAction('Watch synchronization');
}

async function findWatch() {
  return unavailableAction('Find Watch');
}

async function requestRemoteWipe() {
  return unavailableAction('Remote watch wipe');
}

function emergencyFailureMessage(action: NomadWatchEmergencyAction, security: NomadSecurityState) {
  if ((action === 'emergency_lock' || action === 'panic_mode') && security.freezeStatus === 'full') {
    return 'Entire Wallet protection is already active.';
  }
  if (action === 'pause_spending' && (security.freezeStatus === 'full' || security.freezeScope === 'travel_pocket')) {
    return 'Travel spending is already blocked by Emergency Freeze.';
  }
  return undefined;
}

async function triggerEmergencyAction(action: NomadWatchEmergencyAction) {
  const actionLabel = ACTION_LABELS[action];
  const requestedAt = nowIso();
  const receiptId = identifier('watch-emergency');
  let security = await nomadSecurityBridgeAdapter.getSecurityState();
  let authority = await nomadRecoveryAdapter.getOwnerAuthorityRequest();
  let walletLockRequested = false;
  let walletLockConfirmed = false;
  let status: NomadWatchEmergencyReceipt['status'] = 'completed';
  let failureMessage: string | undefined;

  try {
    const walletMeta = await getWalletMeta();
    if (!walletMeta) throw new Error('Create or restore a wallet before using emergency controls.');
    const existingFailure = emergencyFailureMessage(action, security);
    if (existingFailure) throw new Error(existingFailure);

    if (action === 'emergency_lock' || action === 'panic_mode') {
      security = await nomadSecurityBridgeAdapter.activateFreeze('entire_wallet');
      walletLockRequested = true;
      try {
        await lockWallet();
        const walletStatus = await getWalletStatus();
        walletLockConfirmed = walletStatus === 'locked' || walletStatus === 'recovery';
      } catch {
        walletLockConfirmed = false;
      }
      if (!walletLockConfirmed) {
        status = 'partial';
        failureMessage = 'The central full-wallet freeze is active, but the wallet session lock was not confirmed.';
      }
    } else if (action === 'pause_spending') {
      security = await nomadSecurityBridgeAdapter.activateFreeze('travel_pocket');
    } else if (action === 'alert_authority') {
      if (authority.status === 'pending') {
        throw new Error('Another Owner Authority request is already pending. Review or cancel it before creating a watch-page alert.');
      }
      authority = await nomadRecoveryAdapter.requestOwnerAuthorityApproval(
        `Nomad Watch app alert ${receiptId}. Source: phone-side Page 26 control. No watch delivery receipt.`,
      );
    }
  } catch (error) {
    status = 'failed';
    failureMessage = error instanceof Error ? error.message : `Unable to complete ${actionLabel}.`;
  }

  const completedAt = nowIso();
  const receipt: NomadWatchEmergencyReceipt = {
    id: receiptId,
    action,
    actionLabel,
    source: 'nomad_app',
    status,
    requestedAt,
    completedAt,
    centralFreezeStatus: security.freezeStatus,
    centralFreezeScope: security.freezeScope,
    walletLockRequested,
    walletLockConfirmed,
    walletHidden: false,
    authorityRequestStatus: authority.status,
    authorityDeliveryConfirmed: false,
    watchCommandDelivered: false,
    containsSecrets: false,
    failureMessage,
  };

  let stored = await loadStoredState();
  stored = appendEvent({
    ...stored,
    emergencyReceipts: [receipt, ...stored.emergencyReceipts].slice(0, MAX_RECEIPTS),
  }, {
    type: 'emergency',
    title: `${actionLabel} ${status}`,
    detail: action === 'panic_mode'
      ? `Phone-side full freeze requested • wallet hide unavailable • watch command not delivered${failureMessage ? ` • ${failureMessage}` : ''}`
      : `${actionLabel} originated from the Nomad app • watch command not delivered${failureMessage ? ` • ${failureMessage}` : ''}`,
    severity: status === 'failed' ? 'warning' : 'critical',
  });
  await saveStoredState(stored);

  if (status === 'failed') throw new Error(failureMessage || `Unable to complete ${actionLabel}.`);
  return buildState();
}

async function exportPairingSummary(profileId: string) {
  const state = await buildState();
  const profile = state.deviceProfiles.find((item) => item.id === profileId);
  if (!profile) throw new Error('The selected local watch profile was not found.');
  return JSON.stringify({
    format: 'nomad-watch-pairing-draft-v1',
    generatedAt: nowIso(),
    containsSecrets: false,
    containsPrivateKeys: false,
    containsTimeSets: false,
    containsHardwareIdentifier: false,
    profile: {
      id: profile.id,
      requestId: profile.requestId,
      label: profile.label,
      platform: profile.platform,
      platformLabel: profile.platformLabel,
      status: profile.status,
      authenticatedPairingReceiptVerified: false,
      hardwareIdentityVerified: false,
      bluetoothTransportAuthenticated: false,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    },
    warning: 'This is a local metadata summary. It is not a Bluetooth pairing credential, hardware identity, watch command, signed pairing receipt or proof that a wearable is connected.',
  }, null, 2);
}

export const nomadWatchAdapter: NomadExtendedWatchAdapter = {
  getWatchState: buildState,
  createPairingDraft,
  cancelPairingDraft,
  setPreference,
  findWatch,
  requestRemoteWipe,
  exportPairingSummary,
  syncNow,
  triggerEmergencyAction,
};
