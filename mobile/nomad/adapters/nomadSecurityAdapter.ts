import { getTravelState, getWalletMeta, getWalletStatus } from '../../services/walletService';
import { secureGetItem, secureSetItem } from '../../services/nativeStubs';

import { localNomadRecoveryAdapter } from './localNomadAdapters';
import type {
  NomadFreezeActivity,
  NomadFreezeScope,
  NomadSecurityAdapter,
  NomadSecurityState,
} from './walletAdapter';

export type NomadSecurityModuleStatus = 'secure' | 'warning' | 'failed' | 'not_configured' | 'unavailable';

export type NomadSecurityModuleResult = {
  id: 'secure_storage' | 'owner_authority' | 'device_integrity' | 'recovery_status' | 'network_protection';
  title: string;
  subtitle: string;
  status: NomadSecurityModuleStatus;
  detail: string;
  route: string;
  checkedAt: string;
};

export type NomadSecurityBackupResult = {
  id: 'recovery_sequence' | 'multi_sig' | 'encrypted_backup';
  title: string;
  subtitle: string;
  status: NomadSecurityModuleStatus;
  detail: string;
  route: string;
};

export type NomadSecurityEvent = {
  id: string;
  type: 'scan' | 'freeze' | 'authority' | 'recovery' | 'wallet';
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  source: 'nomad_local_adapter' | 'wallet_service' | 'owner_authority';
};

export type NomadSecurityScanRecord = {
  id: string;
  startedAt: string;
  completedAt: string;
  score: number;
  status: 'complete' | 'attention_required';
  moduleResults: NomadSecurityModuleResult[];
};

export type NomadExtendedSecurityState = NomadSecurityState & {
  modules: NomadSecurityModuleResult[];
  backupMethods: NomadSecurityBackupResult[];
  activity: NomadSecurityEvent[];
  scanHistory: NomadSecurityScanRecord[];
  latestScanId?: string;
  scanProvider: 'nomad_local_adapter';
  dataSource: 'local_preview';
  persistence: 'in_memory_stub';
};

type StoredSecurityState = {
  protectedSince: string;
  freezeActivity: NomadFreezeActivity[];
  events: NomadSecurityEvent[];
  scanHistory: NomadSecurityScanRecord[];
};

const STORAGE_KEY = 'nomad.security.extended';
const MAX_EVENTS = 40;
const MAX_SCANS = 15;

function nowIso() {
  return new Date().toISOString();
}

function identifier(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStoredState(): StoredSecurityState {
  return {
    protectedSince: nowIso(),
    freezeActivity: [],
    events: [],
    scanHistory: [],
  };
}

async function loadStoredState(): Promise<StoredSecurityState> {
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return defaultStoredState();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredSecurityState>;
    return {
      protectedSince: parsed.protectedSince || nowIso(),
      freezeActivity: Array.isArray(parsed.freezeActivity) ? parsed.freezeActivity : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      scanHistory: Array.isArray(parsed.scanHistory) ? parsed.scanHistory : [],
    };
  } catch {
    return defaultStoredState();
  }
}

async function saveStoredState(state: StoredSecurityState) {
  await secureSetItem(STORAGE_KEY, JSON.stringify({
    ...state,
    events: state.events.slice(0, MAX_EVENTS),
    scanHistory: state.scanHistory.slice(0, MAX_SCANS),
  }));
}

function daysProtected(value: string) {
  const started = Date.parse(value);
  if (!Number.isFinite(started)) return 'Protection date unavailable';
  const days = Math.max(0, Math.floor((Date.now() - started) / (24 * 60 * 60 * 1000)));
  return days === 0 ? 'Protected today' : `${days} day${days === 1 ? '' : 's'}`;
}

function statusPoints(status: NomadSecurityModuleStatus) {
  switch (status) {
    case 'secure': return 20;
    case 'warning': return 15;
    case 'unavailable': return 12;
    case 'not_configured': return 8;
    case 'failed': return 0;
  }
}

function scoreModules(modules: NomadSecurityModuleResult[]) {
  return Math.max(0, Math.min(100, modules.reduce((sum, module) => sum + statusPoints(module.status), 0)));
}

function overallStatus(modules: NomadSecurityModuleResult[], freezeActivity: NomadFreezeActivity[]): NomadSecurityState['status'] {
  if (freezeActivity.some((item) => item.status === 'active')) return 'frozen';
  if (modules.every((module) => module.status === 'secure')) return 'secure';
  return 'warning';
}

async function moduleChecks(checkedAt: string): Promise<NomadSecurityModuleResult[]> {
  const [walletMeta, walletStatus, recovery, authority, travel] = await Promise.all([
    getWalletMeta(),
    getWalletStatus(),
    localNomadRecoveryAdapter.getRecoveryState(),
    localNomadRecoveryAdapter.getOwnerAuthorityRequest(),
    getTravelState(),
  ]);

  const hasWallet = Boolean(walletMeta);
  const recoveryReady = recovery.recoveryStatus === 'protected' && recovery.timeSetsComplete >= recovery.timeSetsTotal;
  const authorityConfigured = authority.status === 'approved';
  const authorityPending = authority.status === 'pending';

  return [
    {
      id: 'secure_storage',
      title: 'Secure Storage',
      subtitle: 'Seed and wallet-state protection',
      status: hasWallet ? 'warning' : 'not_configured',
      detail: hasWallet
        ? 'Wallet data is routed through the secure-storage interface, but this build still uses an in-memory storage stub. Production encrypted device storage is required.'
        : 'Create or restore a wallet before storage protection can be evaluated.',
      route: 'Settings',
      checkedAt,
    },
    {
      id: 'owner_authority',
      title: 'Owner Authority',
      subtitle: 'Approval authority and signer controls',
      status: authorityConfigured ? 'secure' : authorityPending ? 'warning' : 'not_configured',
      detail: authorityConfigured
        ? 'An Owner Authority approval is recorded.'
        : authorityPending
          ? 'An Owner Authority request is pending approval.'
          : 'No approved Owner Authority is available.',
      route: authorityPending ? 'OwnerAuthorityApproval' : 'CreateOwnerAuthority',
      checkedAt,
    },
    {
      id: 'device_integrity',
      title: 'Device Integrity',
      subtitle: 'Runtime and trusted-device verification',
      status: 'unavailable',
      detail: 'Hardware attestation, root or jailbreak detection, application-signature validation and secure-enclave checks are not connected in this build.',
      route: 'NomadWatch',
      checkedAt,
    },
    {
      id: 'recovery_status',
      title: 'Recovery Status',
      subtitle: 'Recovery sequence and Time Set readiness',
      status: recoveryReady ? 'secure' : hasWallet ? 'warning' : 'not_configured',
      detail: recoveryReady
        ? `${recovery.timeSetsComplete}/${recovery.timeSetsTotal} Time Sets are recorded as complete.`
        : hasWallet
          ? `${recovery.timeSetsComplete}/${recovery.timeSetsTotal} Time Sets are currently recorded. Recovery review is required.`
          : 'Recovery protection cannot be evaluated until a wallet exists.',
      route: 'RecoveryCenter',
      checkedAt,
    },
    {
      id: 'network_protection',
      title: 'Network Protection',
      subtitle: 'Arkrilium policy and network controls',
      status: walletStatus === 'recovery' ? 'failed' : hasWallet ? 'warning' : 'not_configured',
      detail: walletStatus === 'recovery'
        ? 'The wallet is in recovery and network actions must remain blocked.'
        : hasWallet
          ? `Local Arkrilium policy checks are available. Remote node telemetry and provider health are not connected. Travel Mode is ${travel.enabled ? 'active' : 'inactive'}.`
          : 'A wallet is required before network policy can be evaluated.',
      route: 'VoltaireProtocols',
      checkedAt,
    },
  ];
}

async function backupChecks(): Promise<NomadSecurityBackupResult[]> {
  const [recovery, authority] = await Promise.all([
    localNomadRecoveryAdapter.getRecoveryState(),
    localNomadRecoveryAdapter.getOwnerAuthorityRequest(),
  ]);
  const recoveryReady = recovery.recoveryStatus === 'protected' && recovery.timeSetsComplete >= recovery.timeSetsTotal;
  const quorumReady = recovery.signerQuorum > 0 && recovery.signerQuorum <= recovery.signerTotal;

  return [
    {
      id: 'recovery_sequence',
      title: 'Recovery Sequence',
      subtitle: 'Time Set recovery',
      status: recoveryReady ? 'secure' : recovery.timeSetsComplete > 0 ? 'warning' : 'not_configured',
      detail: `${recovery.timeSetsComplete}/${recovery.timeSetsTotal} Time Sets recorded`,
      route: 'RecoveryCenter',
    },
    {
      id: 'multi_sig',
      title: 'Multi-Sig Authority',
      subtitle: 'Owner-controlled approval quorum',
      status: authority.status === 'approved' && quorumReady ? 'secure' : authority.status === 'pending' ? 'warning' : 'not_configured',
      detail: authority.status === 'approved'
        ? `${recovery.signerQuorum} of ${recovery.signerTotal} signer quorum recorded`
        : authority.status === 'pending'
          ? 'Authority approval is pending'
          : 'No approved multi-signature authority is recorded',
      route: authority.status === 'pending' ? 'OwnerAuthorityApproval' : 'CreateOwnerAuthority',
    },
    {
      id: 'encrypted_backup',
      title: 'Encrypted Backup',
      subtitle: 'Portable recovery-data protection',
      status: 'warning',
      detail: 'Wallet seed encryption exists, but no independently verified encrypted backup export is connected.',
      route: 'RecoveryCenter',
    },
  ];
}

function activityFromFreeze(freezeActivity: NomadFreezeActivity[]): NomadSecurityEvent[] {
  return freezeActivity.map((item, index) => ({
    id: `freeze-${item.requestedAt}-${index}`,
    type: item.scope === 'owner_authority_alert' ? 'authority' : 'freeze',
    title: item.label,
    detail: `${item.scope.replace(/_/g, ' ')} • ${item.status.replace(/_/g, ' ')}`,
    severity: item.status === 'active' ? 'critical' : item.status === 'alert_sent' ? 'warning' : 'info',
    timestamp: item.requestedAt,
    source: item.scope === 'owner_authority_alert' ? 'owner_authority' : 'nomad_local_adapter',
  }));
}

async function buildState(storedInput?: StoredSecurityState, modulesInput?: NomadSecurityModuleResult[]): Promise<NomadExtendedSecurityState> {
  const stored = storedInput ?? await loadStoredState();
  const checkedAt = nowIso();
  const modules = modulesInput ?? await moduleChecks(checkedAt);
  const backupMethods = await backupChecks();
  const score = scoreModules(modules);
  const activeFreeze = stored.freezeActivity.find((item) => item.status === 'active');
  const authorityAlert = stored.freezeActivity.find((item) => item.status === 'alert_sent');
  const freezeStatus: NomadSecurityState['freezeStatus'] = activeFreeze?.scope === 'entire_wallet'
    ? 'full'
    : activeFreeze || authorityAlert
      ? 'partial'
      : 'none';
  const latestScan = stored.scanHistory[0];
  const activity = [...activityFromFreeze(stored.freezeActivity), ...stored.events]
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
    .slice(0, MAX_EVENTS);

  return {
    status: overallStatus(modules, stored.freezeActivity),
    protectedSince: new Date(stored.protectedSince).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    protectedDays: daysProtected(stored.protectedSince),
    lastScanLabel: latestScan ? 'Completed' : 'Not run',
    lastScanDetail: latestScan
      ? new Date(latestScan.completedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
      : 'Run a security scan to create an audit record',
    score,
    freezeStatus,
    freezeScope: activeFreeze?.scope ?? authorityAlert?.scope,
    freezeActivity: stored.freezeActivity,
    modules,
    backupMethods,
    activity,
    scanHistory: stored.scanHistory,
    latestScanId: latestScan?.id,
    scanProvider: 'nomad_local_adapter',
    dataSource: 'local_preview',
    persistence: 'in_memory_stub',
  };
}

async function runSecurityScan(): Promise<NomadExtendedSecurityState> {
  const stored = await loadStoredState();
  const startedAt = nowIso();
  const modules = await moduleChecks(nowIso());
  const score = scoreModules(modules);
  const completedAt = nowIso();
  const scan: NomadSecurityScanRecord = {
    id: identifier('scan'),
    startedAt,
    completedAt,
    score,
    status: modules.every((module) => module.status === 'secure') ? 'complete' : 'attention_required',
    moduleResults: modules,
  };
  const event: NomadSecurityEvent = {
    id: identifier('event'),
    type: 'scan',
    title: 'Security scan completed',
    detail: `${score}/100 • ${modules.filter((module) => module.status !== 'secure').length} module(s) require attention`,
    severity: scan.status === 'complete' ? 'info' : 'warning',
    timestamp: completedAt,
    source: 'nomad_local_adapter',
  };
  const next: StoredSecurityState = {
    ...stored,
    scanHistory: [scan, ...stored.scanHistory].slice(0, MAX_SCANS),
    events: [event, ...stored.events].slice(0, MAX_EVENTS),
  };
  await saveStoredState(next);
  return buildState(next, modules);
}

function freezeLabel(scope: NomadFreezeScope) {
  switch (scope) {
    case 'entire_wallet': return 'Entire wallet freeze activated';
    case 'travel_pocket': return 'Travel Pocket freeze activated';
    case 'specific_assets': return 'Specific asset freeze requested';
    case 'owner_authority_alert': return 'Owner Authority alert requested';
  }
}

async function activateFreeze(scope: NomadFreezeScope): Promise<NomadExtendedSecurityState> {
  const stored = await loadStoredState();
  const requestedAt = nowIso();
  const status: NomadFreezeActivity['status'] = scope === 'owner_authority_alert' ? 'alert_sent' : 'active';
  const activity: NomadFreezeActivity = { scope, label: freezeLabel(scope), requestedAt, status };
  const event: NomadSecurityEvent = {
    id: identifier('event'),
    type: scope === 'owner_authority_alert' ? 'authority' : 'freeze',
    title: activity.label,
    detail: scope === 'owner_authority_alert'
      ? 'A local Owner Authority alert record was created. Delivery is not confirmed until a communication provider is connected.'
      : 'The central Nomad security policy now exposes this freeze scope to connected transaction adapters.',
    severity: scope === 'owner_authority_alert' ? 'warning' : 'critical',
    timestamp: requestedAt,
    source: scope === 'owner_authority_alert' ? 'owner_authority' : 'nomad_local_adapter',
  };
  const next: StoredSecurityState = {
    ...stored,
    freezeActivity: [activity, ...stored.freezeActivity.filter((item) => !(item.scope === scope && item.status === 'active'))].slice(0, 20),
    events: [event, ...stored.events].slice(0, MAX_EVENTS),
  };
  await saveStoredState(next);
  return buildState(next);
}

async function clearFreeze(): Promise<NomadExtendedSecurityState> {
  const stored = await loadStoredState();
  const active = stored.freezeActivity.some((item) => item.status === 'active');
  if (active) {
    throw new Error('Freeze removal requires a verified Time Set or approved Owner Authority flow. Direct clearing is disabled.');
  }
  return buildState(stored);
}

export const nomadSecurityAdapter: NomadSecurityAdapter = {
  getSecurityState: () => buildState(),
  runSecurityScan,
  activateFreeze,
  clearFreeze,
};
