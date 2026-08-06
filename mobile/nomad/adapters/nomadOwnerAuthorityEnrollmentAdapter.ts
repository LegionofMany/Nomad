import { getWalletMeta, getWalletStatus } from '../../services/walletService';
import { secureGetItem, secureSetItem } from '../../services/nativeStubs';

import { localNomadSecurityAdapter } from './localNomadAdapters';
import { nomadRecoveryAdapter } from './nomadRecoveryAdapter';
import type { NomadOwnerAuthorityRequest } from './walletAdapter';

export type NomadOwnerAuthorityType =
  | 'family'
  | 'business_partner'
  | 'legal_advisor'
  | 'multi_sign'
  | 'secondary_device';

export type NomadOwnerAuthorityContactChannel =
  | 'email'
  | 'secure_handle'
  | 'directory_identity'
  | 'device_pairing';

export type NomadOwnerAuthorityEnrollmentStatus =
  | 'not_configured'
  | 'local_profile_draft'
  | 'local_request_pending'
  | 'approval_unverified'
  | 'cancelled'
  | 'active';

export type NomadOwnerAuthorityEnrollmentInput = {
  type: NomadOwnerAuthorityType;
  displayName: string;
  contactChannel: NomadOwnerAuthorityContactChannel;
  contact: string;
  requestedQuorum: number;
  identityCheckedByOwner: boolean;
  noWalletSecretsIncluded: boolean;
  noCustodyGranted: boolean;
};

export type NomadOwnerAuthorityProfile = {
  id: string;
  type: NomadOwnerAuthorityType;
  typeLabel: string;
  displayName: string;
  contactChannel: NomadOwnerAuthorityContactChannel;
  maskedContact: string;
  contactFingerprint?: string;
  contactRetained: false;
  independentAuthority: boolean;
  requestedQuorum: number;
  identityCheckedByOwner: boolean;
  identityProviderVerified: false;
  deliveryConfirmed: false;
  signedEnrollmentReceiptVerified: false;
  custodyGranted: false;
  spendingRightsGranted: false;
  status: Exclude<NomadOwnerAuthorityEnrollmentStatus, 'not_configured' | 'approval_unverified'>;
  createdAt: string;
  updatedAt: string;
};

export type NomadOwnerAuthorityEnrollmentCheck = {
  id:
    | 'wallet_identity'
    | 'wallet_session'
    | 'freeze_state'
    | 'authority_independence'
    | 'contact_locator'
    | 'identity_provider'
    | 'delivery_provider'
    | 'signed_receipt'
    | 'quorum_policy';
  label: string;
  status: 'pass' | 'warning' | 'fail' | 'unavailable';
  detail: string;
};

export type NomadOwnerAuthorityEnrollmentEvent = {
  id: string;
  type: 'profile' | 'request' | 'cancelled' | 'system';
  title: string;
  detail: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
};

export type NomadOwnerAuthorityEnrollmentState = {
  status: NomadOwnerAuthorityEnrollmentStatus;
  profiles: NomadOwnerAuthorityProfile[];
  currentProfile?: NomadOwnerAuthorityProfile;
  recoveryRequest: NomadOwnerAuthorityRequest;
  checks: NomadOwnerAuthorityEnrollmentCheck[];
  activity: NomadOwnerAuthorityEnrollmentEvent[];
  walletStatus: 'no_wallet' | 'locked' | 'unlocked' | 'recovery';
  walletIdentityAvailable: boolean;
  frozen: boolean;
  canCreateProfile: boolean;
  canOpenApproval: boolean;
  canCancelProfile: boolean;
  authorityDirectoryConnected: false;
  identityProviderConnected: false;
  deliveryProviderConnected: false;
  signedReceiptProviderConnected: false;
  multiAuthorityPolicyConnected: false;
  contactStorage: 'masked_and_optional_digest_only';
  dataSource: 'nomad_owner_authority_enrollment_adapter';
  persistence: 'in_memory_stub';
  checkedAt: string;
};

export type NomadOwnerAuthorityEnrollmentAdapter = {
  getEnrollmentState(): Promise<NomadOwnerAuthorityEnrollmentState>;
  createEnrollment(input: NomadOwnerAuthorityEnrollmentInput): Promise<NomadOwnerAuthorityEnrollmentState>;
  cancelEnrollment(profileId: string): Promise<NomadOwnerAuthorityEnrollmentState>;
  exportLocalProfileSummary(profileId: string): Promise<string>;
};

type StoredEnrollmentState = {
  profiles: NomadOwnerAuthorityProfile[];
  events: NomadOwnerAuthorityEnrollmentEvent[];
};

const STORAGE_KEY = 'nomad.owner-authority.enrollment';
const MAX_PROFILES = 8;
const MAX_EVENTS = 40;

const TYPE_LABELS: Record<NomadOwnerAuthorityType, string> = {
  family: 'Spouse / Family Member',
  business_partner: 'Business Partner',
  legal_advisor: 'Attorney / Legal Advisor',
  multi_sign: 'Multi-Authority Policy',
  secondary_device: 'Secondary Device',
};

function nowIso() {
  return new Date().toISOString();
}

function identifier(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStoredState(): StoredEnrollmentState {
  return { profiles: [], events: [] };
}

async function loadStoredState(): Promise<StoredEnrollmentState> {
  const raw = await secureGetItem(STORAGE_KEY);
  if (!raw) return defaultStoredState();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredEnrollmentState>;
    return {
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return defaultStoredState();
  }
}

async function saveStoredState(state: StoredEnrollmentState) {
  await secureSetItem(STORAGE_KEY, JSON.stringify({
    profiles: state.profiles.slice(0, MAX_PROFILES),
    events: state.events.slice(0, MAX_EVENTS),
  }));
}

function appendEvent(
  stored: StoredEnrollmentState,
  event: Omit<NomadOwnerAuthorityEnrollmentEvent, 'id' | 'timestamp'>,
): StoredEnrollmentState {
  return {
    ...stored,
    events: [{ id: identifier('authority-enrollment'), timestamp: nowIso(), ...event }, ...stored.events].slice(0, MAX_EVENTS),
  };
}

function encodeAscii(value: string) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) bytes[index] = value.charCodeAt(index) & 0xff;
  return bytes;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes).map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function optionalFingerprint(value: string) {
  const runtime = globalThis as unknown as {
    crypto?: { subtle?: { digest(name: string, data: Uint8Array): Promise<ArrayBuffer> } };
  };
  if (!runtime.crypto?.subtle?.digest) return undefined;
  const result = await runtime.crypto.subtle.digest('SHA-256', encodeAscii(value.trim().toLowerCase()));
  return bytesToHex(new Uint8Array(result));
}

function containsSensitiveWalletMaterial(value: string) {
  const normalized = value.toLowerCase();
  const seedLanguage = /seed phrase|recovery phrase|private key|mnemonic|time set|wallet password|secret key/;
  const possibleMnemonic = value.trim().split(/\s+/).length >= 12;
  return seedLanguage.test(normalized) || possibleMnemonic;
}

function cleanText(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizeChannel(
  type: NomadOwnerAuthorityType,
  channel: NomadOwnerAuthorityContactChannel,
): NomadOwnerAuthorityContactChannel {
  return type === 'secondary_device' ? 'device_pairing' : channel === 'device_pairing' ? 'secure_handle' : channel;
}

function validateContact(channel: NomadOwnerAuthorityContactChannel, value: string) {
  const clean = cleanText(value, 160);
  if (channel === 'device_pairing') return clean || 'Owner secondary device';
  if (clean.length < 4) throw new Error('Enter a contact locator with at least four characters.');
  if (containsSensitiveWalletMaterial(clean)) {
    throw new Error('Do not enter a seed phrase, private key, wallet password or Time Set as authority contact data.');
  }
  if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    throw new Error('Enter a valid email address or choose another contact channel.');
  }
  return clean;
}

function maskContact(channel: NomadOwnerAuthorityContactChannel, value: string) {
  if (channel === 'device_pairing') return 'Local device pairing draft';
  if (channel === 'email') {
    const [local = '', domain = ''] = value.split('@');
    const maskedLocal = local.length <= 2 ? `${local.slice(0, 1)}…` : `${local.slice(0, 2)}…${local.slice(-1)}`;
    const domainParts = domain.split('.');
    const host = domainParts[0] || '';
    const suffix = domainParts.slice(1).join('.');
    const maskedHost = host.length <= 2 ? `${host.slice(0, 1)}…` : `${host.slice(0, 2)}…${host.slice(-1)}`;
    return `${maskedLocal}@${maskedHost}${suffix ? `.${suffix}` : ''}`;
  }
  if (value.length <= 6) return `${value.slice(0, 2)}…`;
  return `${value.slice(0, 3)}…${value.slice(-2)}`;
}

function deriveStatus(
  currentProfile: NomadOwnerAuthorityProfile | undefined,
  request: NomadOwnerAuthorityRequest,
): NomadOwnerAuthorityEnrollmentStatus {
  if (!currentProfile) return 'not_configured';
  if (currentProfile.status === 'cancelled' || request.status === 'cancelled') return 'cancelled';
  if (currentProfile.status === 'active' && currentProfile.signedEnrollmentReceiptVerified) return 'active';
  if (request.status === 'approved') return 'approval_unverified';
  if (request.status === 'pending' && currentProfile.independentAuthority) return 'local_request_pending';
  return 'local_profile_draft';
}

function currentProfileFor(
  profiles: NomadOwnerAuthorityProfile[],
  request: NomadOwnerAuthorityRequest,
) {
  const requestProfileId = request.reason?.match(/profile\s+(oa-profile-[a-z0-9-]+)/i)?.[1];
  if (requestProfileId) {
    const matched = profiles.find((profile) => profile.id === requestProfileId);
    if (matched) return matched;
  }
  return profiles.find((profile) => profile.status !== 'cancelled');
}

function buildChecks(params: {
  walletIdentityAvailable: boolean;
  walletStatus: NomadOwnerAuthorityEnrollmentState['walletStatus'];
  frozen: boolean;
  profile?: NomadOwnerAuthorityProfile;
  request: NomadOwnerAuthorityRequest;
}): NomadOwnerAuthorityEnrollmentCheck[] {
  const { walletIdentityAvailable, walletStatus, frozen, profile, request } = params;
  const independent = profile?.independentAuthority ?? false;
  const contactReady = Boolean(profile?.maskedContact);
  const quorum = profile?.requestedQuorum ?? 1;

  return [
    {
      id: 'wallet_identity',
      label: 'Wallet identity',
      status: walletIdentityAvailable ? 'pass' : 'fail',
      detail: walletIdentityAvailable ? 'A local wallet identity is available.' : 'Create or restore a wallet before adding an authority profile.',
    },
    {
      id: 'wallet_session',
      label: 'Unlocked wallet session',
      status: walletStatus === 'unlocked' ? 'pass' : walletStatus === 'no_wallet' ? 'fail' : 'warning',
      detail: walletStatus === 'unlocked'
        ? 'The wallet session permits a local security-configuration draft.'
        : 'Unlock the wallet before creating or replacing an authority profile.',
    },
    {
      id: 'freeze_state',
      label: 'Emergency Freeze',
      status: frozen ? 'fail' : 'pass',
      detail: frozen ? 'Emergency Freeze blocks authority configuration changes.' : 'No full-wallet or Travel Pocket freeze blocks this local configuration.',
    },
    {
      id: 'authority_independence',
      label: 'Independent authority',
      status: !profile ? 'warning' : independent ? 'pass' : 'warning',
      detail: !profile
        ? 'Choose an authority type.'
        : independent
          ? 'The profile is designated as an independent Owner Authority candidate.'
          : 'A secondary device remains owner-controlled and does not satisfy independent authority approval.',
    },
    {
      id: 'contact_locator',
      label: 'Contact locator',
      status: !profile ? 'warning' : contactReady ? 'pass' : 'fail',
      detail: !profile
        ? 'No local profile is recorded.'
        : `${profile.maskedContact} is stored as masked metadata. Raw contact data was discarded after validation.`,
    },
    {
      id: 'identity_provider',
      label: 'Authority identity verification',
      status: 'unavailable',
      detail: 'No authority directory, KYC provider, hardware credential or public-key identity service is connected.',
    },
    {
      id: 'delivery_provider',
      label: 'Encrypted invitation delivery',
      status: 'unavailable',
      detail: request.status === 'pending'
        ? 'A local request exists, but no encrypted delivery provider confirms that the authority received it.'
        : 'No encrypted authority-delivery provider is connected.',
    },
    {
      id: 'signed_receipt',
      label: 'Signed enrollment receipt',
      status: 'unavailable',
      detail: 'No independently signed enrollment receipt is available or verified.',
    },
    {
      id: 'quorum_policy',
      label: 'Authority quorum policy',
      status: quorum > 1 ? 'warning' : independent ? 'pass' : 'warning',
      detail: quorum > 1
        ? `${quorum}-authority approval is requested as local policy metadata, but multi-authority enforcement is not connected.`
        : independent
          ? 'One independent authority is requested. Signed enrollment is still required.'
          : 'Secondary-device pairing does not count toward Owner Authority quorum.',
    },
  ];
}

async function buildState(): Promise<NomadOwnerAuthorityEnrollmentState> {
  const [stored, walletMeta, walletStatus, security, recoveryRequest] = await Promise.all([
    loadStoredState(),
    getWalletMeta(),
    getWalletStatus(),
    localNomadSecurityAdapter.getSecurityState(),
    nomadRecoveryAdapter.getOwnerAuthorityRequest(),
  ]);
  const frozen = security.freezeStatus === 'full' || security.freezeScope === 'travel_pocket';
  const currentProfile = currentProfileFor(stored.profiles, recoveryRequest);
  const status = deriveStatus(currentProfile, recoveryRequest);
  const canCreateProfile = Boolean(walletMeta)
    && walletStatus === 'unlocked'
    && !frozen
    && walletStatus !== 'recovery'
    && recoveryRequest.status !== 'pending';

  return {
    status,
    profiles: stored.profiles,
    currentProfile,
    recoveryRequest,
    checks: buildChecks({
      walletIdentityAvailable: Boolean(walletMeta),
      walletStatus,
      frozen,
      profile: currentProfile,
      request: recoveryRequest,
    }),
    activity: stored.events,
    walletStatus,
    walletIdentityAvailable: Boolean(walletMeta),
    frozen,
    canCreateProfile,
    canOpenApproval: Boolean(currentProfile?.independentAuthority && recoveryRequest.status === 'pending'),
    canCancelProfile: Boolean(currentProfile && currentProfile.status !== 'cancelled'),
    authorityDirectoryConnected: false,
    identityProviderConnected: false,
    deliveryProviderConnected: false,
    signedReceiptProviderConnected: false,
    multiAuthorityPolicyConnected: false,
    contactStorage: 'masked_and_optional_digest_only',
    dataSource: 'nomad_owner_authority_enrollment_adapter',
    persistence: 'in_memory_stub',
    checkedAt: nowIso(),
  };
}

async function createEnrollment(input: NomadOwnerAuthorityEnrollmentInput) {
  const before = await buildState();
  if (!before.walletIdentityAvailable) throw new Error('Create or restore a wallet before adding an Owner Authority.');
  if (before.walletStatus !== 'unlocked') throw new Error('Unlock the wallet before changing Owner Authority configuration.');
  if (before.frozen) throw new Error('Emergency Freeze blocks Owner Authority configuration changes.');
  if (before.recoveryRequest.status === 'pending') throw new Error('An Owner Authority request is already pending. Review or cancel it before creating another.');

  const type = input.type;
  const typeLabel = TYPE_LABELS[type];
  const displayName = cleanText(input.displayName, 80);
  if (displayName.length < 2) throw new Error(type === 'secondary_device' ? 'Enter a device label.' : 'Enter the authority name.');
  if (containsSensitiveWalletMaterial(displayName)) throw new Error('Authority names must not contain wallet recovery secrets.');
  if (!input.identityCheckedByOwner) throw new Error('Confirm that you personally checked the authority identity or device label.');
  if (!input.noWalletSecretsIncluded) throw new Error('Confirm that no wallet secrets are included.');
  if (!input.noCustodyGranted) throw new Error('Confirm that this profile grants no custody or spending rights.');

  const contactChannel = normalizeChannel(type, input.contactChannel);
  const contact = validateContact(contactChannel, input.contact);
  const requestedQuorum = type === 'multi_sign'
    ? Math.max(2, Math.min(3, Math.round(input.requestedQuorum || 2)))
    : 1;
  const timestamp = nowIso();
  const profile: NomadOwnerAuthorityProfile = {
    id: identifier('oa-profile'),
    type,
    typeLabel,
    displayName,
    contactChannel,
    maskedContact: maskContact(contactChannel, contact),
    contactFingerprint: await optionalFingerprint(contact),
    contactRetained: false,
    independentAuthority: type !== 'secondary_device',
    requestedQuorum,
    identityCheckedByOwner: true,
    identityProviderVerified: false,
    deliveryConfirmed: false,
    signedEnrollmentReceiptVerified: false,
    custodyGranted: false,
    spendingRightsGranted: false,
    status: 'local_profile_draft',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  let stored = await loadStoredState();
  stored = appendEvent({
    ...stored,
    profiles: [profile, ...stored.profiles.filter((item) => item.status === 'cancelled')].slice(0, MAX_PROFILES),
  }, {
    type: 'profile',
    title: profile.independentAuthority ? 'Owner Authority profile created' : 'Secondary-device profile created',
    detail: `${profile.typeLabel} • ${profile.maskedContact} • raw contact discarded • identity unverified`,
    severity: 'warning',
  });
  await saveStoredState(stored);

  if (profile.independentAuthority) {
    const request = await nomadRecoveryAdapter.requestOwnerAuthorityApproval(
      `Enroll Owner Authority profile ${profile.id} (${profile.typeLabel}) for protected recovery approval; requested quorum ${profile.requestedQuorum}.`,
    );
    stored = await loadStoredState();
    const updated: NomadOwnerAuthorityProfile = {
      ...profile,
      status: request.status === 'pending' ? 'local_request_pending' : 'local_profile_draft',
      updatedAt: nowIso(),
    };
    stored = appendEvent({
      ...stored,
      profiles: [updated, ...stored.profiles.filter((item) => item.id !== profile.id)].slice(0, MAX_PROFILES),
    }, {
      type: 'request',
      title: 'Local Owner Authority request created',
      detail: `Profile ${profile.id} is locally bound to a protected enrollment request. Remote delivery and signed consent remain unconfirmed.`,
      severity: 'warning',
    });
    await saveStoredState(stored);
  } else {
    stored = await loadStoredState();
    stored = appendEvent(stored, {
      type: 'system',
      title: 'Device pairing unavailable',
      detail: 'The secondary-device profile is a local draft only. It does not count as an independent Owner Authority.',
      severity: 'warning',
    });
    await saveStoredState(stored);
  }

  return buildState();
}

async function cancelEnrollment(profileId: string) {
  const cleanId = profileId.trim();
  let stored = await loadStoredState();
  const profile = stored.profiles.find((item) => item.id === cleanId);
  if (!profile) return buildState();

  const request = await nomadRecoveryAdapter.getOwnerAuthorityRequest();
  if (request.status === 'pending' && request.reason?.includes(profile.id)) {
    await nomadRecoveryAdapter.cancelOwnerAuthorityRequest();
  }

  const cancelled: NomadOwnerAuthorityProfile = {
    ...profile,
    status: 'cancelled',
    updatedAt: nowIso(),
  };
  stored = appendEvent({
    ...stored,
    profiles: [cancelled, ...stored.profiles.filter((item) => item.id !== profile.id)].slice(0, MAX_PROFILES),
  }, {
    type: 'cancelled',
    title: 'Owner Authority profile cancelled',
    detail: `${profile.id} was cancelled locally. No remote revocation was delivered.`,
    severity: 'critical',
  });
  await saveStoredState(stored);
  return buildState();
}

async function exportLocalProfileSummary(profileId: string) {
  const state = await buildState();
  const profile = state.profiles.find((item) => item.id === profileId);
  if (!profile) throw new Error('The selected Owner Authority profile was not found.');
  return JSON.stringify({
    format: 'nomad-owner-authority-profile-summary-v1',
    generatedAt: nowIso(),
    containsSecrets: false,
    containsPrivateKeys: false,
    containsTimeSets: false,
    containsRawContact: false,
    profile: {
      id: profile.id,
      type: profile.type,
      typeLabel: profile.typeLabel,
      displayName: profile.displayName,
      contactChannel: profile.contactChannel,
      maskedContact: profile.maskedContact,
      requestedQuorum: profile.requestedQuorum,
      independentAuthority: profile.independentAuthority,
      status: profile.status,
      identityProviderVerified: false,
      deliveryConfirmed: false,
      signedEnrollmentReceiptVerified: false,
      custodyGranted: false,
      spendingRightsGranted: false,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    },
    warning: 'This is a local metadata summary. It is not an invitation, identity verification, authority consent, signed enrollment receipt or recovery approval.',
  }, null, 2);
}

export const nomadOwnerAuthorityEnrollmentAdapter: NomadOwnerAuthorityEnrollmentAdapter = {
  getEnrollmentState: buildState,
  createEnrollment,
  cancelEnrollment,
  exportLocalProfileSummary,
};
