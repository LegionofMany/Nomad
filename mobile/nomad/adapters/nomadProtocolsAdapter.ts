import { getWalletMeta, getWalletStatus } from '../../services/walletService';

import { localNomadOverlayAdapters } from './localNomadAdapters';
import { nomadRecoveryAdapter } from './nomadRecoveryAdapter';
import { nomadSecurityAdapter } from './nomadSecurityAdapter';
import { nomadTravelAdapter } from './nomadTravelAdapter';
import type {
  NomadProtocolHealthItem,
  NomadProtocolRow,
  NomadProtocolsAdapter,
  NomadProtocolsState,
} from './walletAdapter';

export type ArkriliumProtocolStatus = 'available' | 'limited' | 'not_configured' | 'unavailable';

export type ArkriliumProtocolId =
  | 'security_layer'
  | 'interoperability'
  | 'key_management'
  | 'notary_verification'
  | 'data_transmission'
  | 'governance';

export type ArkriliumProtocolRow = NomadProtocolRow & {
  id: ArkriliumProtocolId;
  status: ArkriliumProtocolStatus;
  statusLabel: string;
  route: string;
  source: 'wallet_service' | 'nomad_adapter' | 'reqrium_local_adapter' | 'not_connected';
  provider: string;
  checkedAt: string;
};

export type ArkriliumHealthItem = NomadProtocolHealthItem & {
  status: 'pass' | 'review' | 'unavailable';
  route?: string;
};

export type ArkriliumProtocolCheck = {
  id: string;
  checkedAt: string;
  status: 'complete' | 'attention_required';
  available: number;
  limited: number;
  notConfigured: number;
  unavailable: number;
};

export type ArkriliumProtocolsState = Omit<NomadProtocolsState, 'protocols' | 'health'> & {
  protocols: ArkriliumProtocolRow[];
  health: ArkriliumHealthItem[];
  checkedAt: string;
  remoteTelemetryConnected: false;
  dataSource: 'local_adapter_evidence';
  check: ArkriliumProtocolCheck;
};

export type ArkriliumProtocolsAdapter = NomadProtocolsAdapter & {
  getArkriliumProtocolsState(): Promise<ArkriliumProtocolsState>;
  runProtocolCheck(): Promise<ArkriliumProtocolsState>;
};

function nowIso() {
  return new Date().toISOString();
}

function statusLabel(status: ArkriliumProtocolStatus) {
  switch (status) {
    case 'available': return 'AVAILABLE';
    case 'limited': return 'LIMITED';
    case 'not_configured': return 'SETUP REQUIRED';
    case 'unavailable': return 'UNAVAILABLE';
  }
}

function row(input: Omit<ArkriliumProtocolRow, 'statusLabel' | 'uptime'>): ArkriliumProtocolRow {
  return {
    ...input,
    statusLabel: statusLabel(input.status),
    uptime: statusLabel(input.status),
  };
}

function checkSummary(protocols: ArkriliumProtocolRow[], checkedAt: string): ArkriliumProtocolCheck {
  const count = (status: ArkriliumProtocolStatus) => protocols.filter((protocol) => protocol.status === status).length;
  const available = count('available');
  const limited = count('limited');
  const notConfigured = count('not_configured');
  const unavailable = count('unavailable');
  return {
    id: `protocol-check-${Date.now()}`,
    checkedAt,
    status: limited + notConfigured + unavailable > 0 ? 'attention_required' : 'complete',
    available,
    limited,
    notConfigured,
    unavailable,
  };
}

async function buildState(): Promise<ArkriliumProtocolsState> {
  const checkedAt = nowIso();
  const [walletMeta, walletStatus, security, recovery, travel] = await Promise.all([
    getWalletMeta(),
    getWalletStatus(),
    nomadSecurityAdapter.getSecurityState(),
    nomadRecoveryAdapter.getExtendedRecoveryState(),
    nomadTravelAdapter.getTravelPocketState(),
  ]);

  const hasWallet = Boolean(walletMeta);
  const safetyConnected = Boolean(localNomadOverlayAdapters.safety);
  const securityStatus: ArkriliumProtocolStatus = !hasWallet
    ? 'not_configured'
    : security.status === 'frozen' || security.score < 70
      ? 'limited'
      : 'limited';
  const keyStatus: ArkriliumProtocolStatus = !hasWallet
    ? 'not_configured'
    : recovery.cryptographicEnrollment === 'available'
      ? 'limited'
      : 'unavailable';

  const protocols: ArkriliumProtocolRow[] = [
    row({
      id: 'security_layer',
      title: 'Arkrilium Security Layer',
      subtitle: 'Wallet policy, freeze and recovery protection',
      detail: !hasWallet
        ? 'A wallet must be created or restored before security policy can be evaluated.'
        : `${security.score}/100 local security score. Hardware attestation and remote Arkrilium telemetry are not connected.`,
      icon: '◇',
      color: '#35f883',
      status: securityStatus,
      route: 'SecurityCenter',
      source: 'nomad_adapter',
      provider: 'Nomad local security adapter',
      checkedAt,
    }),
    row({
      id: 'interoperability',
      title: 'Arkrilium Interoperability Layer',
      subtitle: 'Swap, Travel Pocket and asset-routing boundaries',
      detail: `Local adapter routing is available. Travel Pocket is ${travel.enabled ? 'active' : 'ready'}, but live liquidity, cross-chain messaging and settlement providers are not connected.`,
      icon: '⇄',
      color: '#00e5ff',
      status: hasWallet ? 'limited' : 'not_configured',
      route: 'Swap',
      source: 'nomad_adapter',
      provider: 'Nomad swap and travel adapters',
      checkedAt,
    }),
    row({
      id: 'key_management',
      title: 'Arkrilium Key Management',
      subtitle: 'Owner-controlled wallet access and recovery evidence',
      detail: !hasWallet
        ? 'No wallet key boundary is configured.'
        : `${recovery.enrolledTimeSets}/${recovery.timeSetsTotal} Time Sets enrolled. Current secure storage is an in-memory development stub.`,
      icon: '⚿',
      color: '#9b4dff',
      status: keyStatus,
      route: 'RecoveryCenter',
      source: hasWallet ? 'wallet_service' : 'not_connected',
      provider: hasWallet ? 'Nomad wallet and recovery services' : 'No wallet provider',
      checkedAt,
    }),
    row({
      id: 'notary_verification',
      title: 'Arkrilium Verification Layer',
      subtitle: 'Reqrium address and URL safety tools',
      detail: safetyConnected
        ? 'Reqrium local scanning tools are connected. Remote threat intelligence, notarization and signed verification providers are not connected.'
        : 'Reqrium safety tools are not registered in this runtime.',
      icon: 'R',
      color: '#ffcc33',
      status: safetyConnected ? 'limited' : 'unavailable',
      route: 'BlockPagesSafety',
      source: safetyConnected ? 'reqrium_local_adapter' : 'not_connected',
      provider: safetyConnected ? 'Reqrium local safety adapter' : 'No verification provider',
      checkedAt,
    }),
    row({
      id: 'data_transmission',
      title: 'Arkrilium Data Transmission',
      subtitle: 'Encrypted messaging and cross-service delivery',
      detail: 'No production messaging, relay, node-to-node transmission or delivery-confirmation provider is connected.',
      icon: '⌁',
      color: '#1684ff',
      status: 'unavailable',
      route: 'Settings',
      source: 'not_connected',
      provider: 'No transmission provider',
      checkedAt,
    }),
    row({
      id: 'governance',
      title: 'Arkrilium Governance',
      subtitle: 'Protocol proposals, voting and upgrade controls',
      detail: 'No governance contract, proposal registry, voting provider or signed upgrade process is connected to Nomad.',
      icon: '♙',
      color: '#9b4dff',
      status: 'unavailable',
      route: 'Settings',
      source: 'not_connected',
      provider: 'No governance provider',
      checkedAt,
    }),
  ];

  const check = checkSummary(protocols, checkedAt);
  const health: ArkriliumHealthItem[] = [
    {
      label: 'Wallet Session',
      value: walletStatus.replace(/_/g, ' ').toUpperCase(),
      note: hasWallet ? 'Wallet service evidence' : 'Wallet setup required',
      icon: '▣',
      status: hasWallet ? 'pass' : 'review',
      route: hasWallet ? 'Wallets' : 'Lock',
    },
    {
      label: 'Security Score',
      value: `${security.score}/100`,
      note: security.status === 'secure' ? 'Local checks complete' : 'Review required',
      icon: '◇',
      status: security.score >= 70 ? 'pass' : 'review',
      route: 'SecurityCenter',
    },
    {
      label: 'Recovery Score',
      value: `${recovery.recoveryScore}/100`,
      note: `${recovery.enrolledTimeSets}/${recovery.timeSetsTotal} Time Sets`,
      icon: '↻',
      status: recovery.recoveryStatus === 'protected' ? 'pass' : 'review',
      route: 'RecoveryCenter',
    },
    {
      label: 'Reqrium Safety',
      value: safetyConnected ? 'LOCAL' : 'OFFLINE',
      note: safetyConnected ? 'Remote intelligence unavailable' : 'Adapter unavailable',
      icon: 'R',
      status: safetyConnected ? 'review' : 'unavailable',
      route: 'BlockPagesSafety',
    },
    {
      label: 'Remote Telemetry',
      value: 'NOT CONNECTED',
      note: 'No uptime or node feed',
      icon: '◎',
      status: 'unavailable',
    },
  ];

  const availableOrLimited = check.available + check.limited;
  const status: NomadProtocolsState['status'] = availableOrLimited === 0
    ? 'offline'
    : check.notConfigured + check.unavailable + check.limited > 0
      ? 'degraded'
      : 'active';

  return {
    status,
    activeProtocols: check.available,
    totalProtocols: protocols.length,
    networkUptime: 'Not verified',
    globalNodes: 'Not connected',
    countries: '—',
    protocols,
    health,
    message: check.status === 'complete'
      ? 'All registered Arkrilium protocol providers are available.'
      : `${availableOrLimited}/${protocols.length} protocol layers have local functionality; production providers remain incomplete.`,
    checkedAt,
    remoteTelemetryConnected: false,
    dataSource: 'local_adapter_evidence',
    check,
  };
}

export const nomadProtocolsAdapter: ArkriliumProtocolsAdapter = {
  getProtocolsState: buildState,
  getArkriliumProtocolsState: buildState,
  runProtocolCheck: buildState,
};
