import { secureGetItem, secureSetItem } from '../../services/nativeStubs';

import { nomadRecoveryAdapter } from './nomadRecoveryAdapter';
import type { NomadOwnerAuthorityRequest } from './walletAdapter';

export type NomadOwnerAuthorityApprovalStatus =
  | 'not_requested'
  | 'local_request_pending'
  | 'awaiting_signed_receipt'
  | 'approval_unverified'
  | 'approved'
  | 'declined'
  | 'cancelled';

export type NomadOwnerAuthorityApprovalCheck = {
  id: 'request_record' | 'action_binding' | 'authority_identity' | 'delivery_provider' | 'signed_receipt';
  label: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
};

export type NomadOwnerAuthorityApprovalEvent = {
  id: string;
  type: 'package' | 'delivery_check' | 'cancelled';
  title: string;
  detail: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
};

export type NomadOwnerAuthorityApprovalPackage = {
  format: 'nomad-owner-authority-request-v1';
  generatedAt: string;
  requestId: string;
  action: string;
  requestedAt?: string;
  requestedBy: string;
  device: string;
  reason: string;
  containsSecrets: false;
  containsPrivateKeys: false;
  containsTimeSets: false;
  deliveryConfirmed: false;
  signatureRequired: true;
  warning: string;
};

export type NomadOwnerAuthorityApprovalState = {
  status: NomadOwnerAuthorityApprovalStatus;
  request: NomadOwnerAuthorityRequest;
  requestId?: string;
  action: string;
  reason: string;
  checks: NomadOwnerAuthorityApprovalCheck[];
  activity: NomadOwnerAuthorityApprovalEvent[];
  packagePreparedAt?: string;
  packageAvailable: boolean;
  authorityIdentityVerified: false;
  authorityDirectoryConnected: false;
  deliveryProviderConnected: false;
  deliveryConfirmed: false;
  signedReceiptAvailable: false;
  receiptSignatureVerified: false;
  canContinueRecovery: false;
  canCancelRequest: boolean;
  canPreparePackage: boolean;
  provider: 'not_connected';
  dataSource: 'nomad_owner_authority_approval_adapter';
  persistence: 'in_memory_stub';
  checkedAt: string;
};

export type NomadOwnerAuthorityApprovalAdapter = {
  getApprovalState(): Promise<NomadOwnerAuthorityApprovalState>;
  prepareApprovalPackage(): Promise<{ state: NomadOwnerAuthorityApprovalState; packageJson: string }>;
  checkDelivery(): Promise<NomadOwnerAuthorityApprovalState>;
  cancelRequest(): Promise<NomadOwnerAuthorityApprovalState>;
};

type StoredApprovalState = {
  packagePreparedAt?: string;
  packageRequestId?: string;
  events: NomadOwnerAuthorityApprovalEvent[];
};

const STORAGE_KEY = 'nomad.owner-authority.approval';
const MAX_EVENTS = 30;

function nowIso() {
  return new Date().toISOString();
}

function identifier(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStoredState(): StoredApprovalState {
  return { events: [] };
}

async function loadStoredState(): Promise<StoredApprovalState> {
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return defaultStoredState();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredApprovalState>;
    return {
      packagePreparedAt: parsed.packagePreparedAt,
      packageRequestId: parsed.packageRequestId,
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return defaultStoredState();
  }
}

async function saveStoredState(state: StoredApprovalState) {
  await secureSetItem(STORAGE_KEY, JSON.stringify({
    ...state,
    events: state.events.slice(0, MAX_EVENTS),
  }));
}

function appendEvent(
  stored: StoredApprovalState,
  event: Omit<NomadOwnerAuthorityApprovalEvent, 'id' | 'timestamp'>,
): StoredApprovalState {
  return {
    ...stored,
    events: [{ id: identifier('authority-event'), timestamp: nowIso(), ...event }, ...stored.events].slice(0, MAX_EVENTS),
  };
}

function requestIdentifier(request: NomadOwnerAuthorityRequest) {
  if (!request.requestedAt) return undefined;
  const compact = request.requestedAt.replace(/[^0-9]/g, '').slice(0, 14);
  return `oa-${compact || 'request'}`;
}

function sanitizeReason(value?: string) {
  const clean = (value || 'Protected recovery action').trim().slice(0, 300);
  return clean
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[contact redacted]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[contact redacted]');
}

function actionFromReason(reason: string) {
  if (/enroll owner authority profile/i.test(reason)) return 'Enroll Owner Authority';
  if (/recover/i.test(reason)) return 'Recover Wallet Access';
  if (/freeze/i.test(reason)) return 'Change Emergency Freeze State';
  if (/clock|time/i.test(reason)) return 'Change Protected Time Access';
  return 'Protected Wallet Action';
}

function packageMatchesRequest(
  requestId: string | undefined,
  stored: StoredApprovalState,
) {
  return Boolean(
    requestId
    && stored.packagePreparedAt
    && stored.packageRequestId
    && stored.packageRequestId === requestId,
  );
}

function deriveStatus(
  request: NomadOwnerAuthorityRequest,
  packagePreparedForCurrentRequest: boolean,
): NomadOwnerAuthorityApprovalStatus {
  if (request.status === 'declined') return 'declined';
  if (request.status === 'cancelled') return 'cancelled';
  if (request.status === 'approved') return 'approval_unverified';
  if (request.status === 'pending') return packagePreparedForCurrentRequest ? 'awaiting_signed_receipt' : 'local_request_pending';
  return 'not_requested';
}

function buildChecks(
  request: NomadOwnerAuthorityRequest,
  action: string,
  packagePreparedForCurrentRequest: boolean,
): NomadOwnerAuthorityApprovalCheck[] {
  const hasRequest = request.status === 'pending' || request.status === 'approved';
  const actionBound = Boolean(request.reason?.trim());

  return [
    {
      id: 'request_record',
      label: 'Local request record',
      status: hasRequest ? 'pass' : request.status === 'cancelled' || request.status === 'declined' ? 'warning' : 'fail',
      detail: hasRequest
        ? `A local request record is bound to ${action}.`
        : request.status === 'cancelled' || request.status === 'declined'
          ? `The most recent local request is ${request.status}.`
          : 'No Owner Authority request is recorded.',
    },
    {
      id: 'action_binding',
      label: 'Protected-action binding',
      status: actionBound ? 'pass' : 'warning',
      detail: actionBound
        ? 'The request includes a local reason and protected-action description.'
        : 'No protected-action reason is attached to the request.',
    },
    {
      id: 'authority_identity',
      label: 'Authority identity',
      status: 'warning',
      detail: 'No connected authority directory or hardware identity provider verifies the designated authority.',
    },
    {
      id: 'delivery_provider',
      label: 'Remote request delivery',
      status: 'fail',
      detail: packagePreparedForCurrentRequest
        ? 'A local metadata package exists for this request, but no encrypted remote delivery provider confirms receipt.'
        : 'No request-bound package and encrypted remote delivery confirmation are available.',
    },
    {
      id: 'signed_receipt',
      label: 'Signed authority receipt',
      status: 'fail',
      detail: 'No signed approval receipt or verified authority signature is available.',
    },
  ];
}

async function buildState(): Promise<NomadOwnerAuthorityApprovalState> {
  const [request, stored] = await Promise.all([
    nomadRecoveryAdapter.getOwnerAuthorityRequest(),
    loadStoredState(),
  ]);
  const reason = sanitizeReason(request.reason);
  const action = actionFromReason(reason);
  const requestId = requestIdentifier(request);
  const packagePreparedForCurrentRequest = packageMatchesRequest(requestId, stored);
  const status = deriveStatus(request, packagePreparedForCurrentRequest);

  return {
    status,
    request,
    requestId,
    action,
    reason,
    checks: buildChecks(request, action, packagePreparedForCurrentRequest),
    activity: stored.events,
    packagePreparedAt: packagePreparedForCurrentRequest ? stored.packagePreparedAt : undefined,
    packageAvailable: Boolean(packagePreparedForCurrentRequest && request.status === 'pending'),
    authorityIdentityVerified: false,
    authorityDirectoryConnected: false,
    deliveryProviderConnected: false,
    deliveryConfirmed: false,
    signedReceiptAvailable: false,
    receiptSignatureVerified: false,
    canContinueRecovery: false,
    canCancelRequest: request.status === 'pending',
    canPreparePackage: request.status === 'pending',
    provider: 'not_connected',
    dataSource: 'nomad_owner_authority_approval_adapter',
    persistence: 'in_memory_stub',
    checkedAt: nowIso(),
  };
}

async function prepareApprovalPackage() {
  const state = await buildState();
  if (!state.canPreparePackage || !state.requestId) {
    throw new Error('A pending Owner Authority request is required before preparing an approval package.');
  }

  const generatedAt = nowIso();
  const approvalPackage: NomadOwnerAuthorityApprovalPackage = {
    format: 'nomad-owner-authority-request-v1',
    generatedAt,
    requestId: state.requestId,
    action: state.action,
    requestedAt: state.request.requestedAt,
    requestedBy: state.request.requestedBy || 'Wallet Owner',
    device: state.request.device || 'Current Nomad device',
    reason: state.reason,
    containsSecrets: false,
    containsPrivateKeys: false,
    containsTimeSets: false,
    deliveryConfirmed: false,
    signatureRequired: true,
    warning: 'This package contains request metadata only. It is not an approval, authority signature or wallet-restoration receipt.',
  };

  let stored = await loadStoredState();
  stored = appendEvent({
    ...stored,
    packagePreparedAt: generatedAt,
    packageRequestId: state.requestId,
  }, {
    type: 'package',
    title: 'Approval package prepared',
    detail: `A secret-free local metadata package was generated for ${state.requestId}. Remote delivery and authority approval remain unconfirmed.`,
    severity: 'warning',
  });
  await saveStoredState(stored);

  return {
    state: await buildState(),
    packageJson: JSON.stringify(approvalPackage, null, 2),
  };
}

async function checkDelivery() {
  let stored = await loadStoredState();
  const request = await nomadRecoveryAdapter.getOwnerAuthorityRequest();
  const requestId = requestIdentifier(request);
  const bound = packageMatchesRequest(requestId, stored);
  stored = appendEvent(stored, {
    type: 'delivery_check',
    title: 'Authority delivery checked',
    detail: bound
      ? `Package ${requestId} remains local. No authority directory, encrypted delivery provider or signed approval receipt is connected.`
      : 'No package bound to the active request is available for delivery checking.',
    severity: 'warning',
  });
  await saveStoredState(stored);
  return buildState();
}

async function cancelRequest() {
  const state = await buildState();
  if (!state.canCancelRequest) return state;
  await nomadRecoveryAdapter.cancelOwnerAuthorityRequest();
  let stored = await loadStoredState();
  stored = appendEvent({
    ...stored,
    packagePreparedAt: undefined,
    packageRequestId: undefined,
  }, {
    type: 'cancelled',
    title: 'Owner Authority request cancelled',
    detail: 'The local pending request and its request-bound package marker were cancelled. No remote cancellation was delivered.',
    severity: 'critical',
  });
  await saveStoredState(stored);
  return buildState();
}

export const nomadOwnerAuthorityApprovalAdapter: NomadOwnerAuthorityApprovalAdapter = {
  getApprovalState: buildState,
  prepareApprovalPackage,
  checkDelivery,
  cancelRequest,
};
