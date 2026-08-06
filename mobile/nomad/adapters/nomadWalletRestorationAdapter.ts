import { nomadLostWalletAdapter, type NomadLostWalletState } from './nomadLostWalletAdapter';

export type NomadWalletRestorationStatus =
  | 'setup_required'
  | 'verification_in_progress'
  | 'verified_waiting_provider'
  | 'restored';

export type NomadWalletRestorationCheck = {
  id: 'recovery_session' | 'time_set_sequence' | 'restoration_provider' | 'restoration_receipt' | 'wallet_state';
  label: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
};

export type NomadWalletRestorationReceipt = {
  id: string;
  provider: string;
  restoredAt: string;
  recoverySessionId: string;
  walletFingerprint: string;
  signatureVerified: true;
};

export type NomadWalletRestorationState = {
  status: NomadWalletRestorationStatus;
  lostWallet: NomadLostWalletState;
  checks: NomadWalletRestorationCheck[];
  receipt?: NomadWalletRestorationReceipt;
  sequenceVerified: boolean;
  activeRecoverySession: boolean;
  restorationProviderConnected: false;
  restorationReceiptAvailable: false;
  receiptSignatureVerified: false;
  privateKeysRestored: false;
  walletStateChangedByRecovery: false;
  canOpenRecoveredWallet: boolean;
  provider: 'not_connected';
  dataSource: 'nomad_wallet_restoration_adapter';
  persistence: 'in_memory_stub';
  checkedAt: string;
};

export type NomadWalletRestorationAdapter = {
  getRestorationState(): Promise<NomadWalletRestorationState>;
};

function buildChecks(lostWallet: NomadLostWalletState): NomadWalletRestorationCheck[] {
  const hasSession = Boolean(lostWallet.activeSession);
  const sequenceVerified = lostWallet.status === 'verified_waiting_provider'
    || lostWallet.sequence.status === 'ready_to_recover'
    || lostWallet.sequence.verifiedSets >= lostWallet.sequence.totalSets;

  return [
    {
      id: 'recovery_session',
      label: 'Protected recovery session',
      status: hasSession ? 'pass' : 'fail',
      detail: hasSession
        ? `Local metadata session ${lostWallet.activeSession?.id} is available. It contains no recovery secrets.`
        : 'No protected lost-wallet recovery session is active.',
    },
    {
      id: 'time_set_sequence',
      label: '24 Time Set verification',
      status: sequenceVerified ? 'pass' : lostWallet.sequence.verifiedSets > 0 ? 'warning' : 'fail',
      detail: sequenceVerified
        ? `All ${lostWallet.sequence.totalSets} salted Time Set digests matched in their enrolled order.`
        : `${lostWallet.sequence.verifiedSets}/${lostWallet.sequence.totalSets} Time Sets are verified.`,
    },
    {
      id: 'restoration_provider',
      label: 'Wallet restoration provider',
      status: 'fail',
      detail: 'No production key-restoration or cross-device recovery provider is connected.',
    },
    {
      id: 'restoration_receipt',
      label: 'Signed restoration receipt',
      status: 'fail',
      detail: 'No provider-signed receipt confirms that private keys were restored to this device.',
    },
    {
      id: 'wallet_state',
      label: 'Recovered wallet state',
      status: 'fail',
      detail: 'The recovery flow has not changed wallet key material or marked this device as restored.',
    },
  ];
}

async function buildState(): Promise<NomadWalletRestorationState> {
  const lostWallet = await nomadLostWalletAdapter.getLostWalletState();
  const sequenceVerified = lostWallet.status === 'verified_waiting_provider'
    || lostWallet.sequence.status === 'ready_to_recover'
    || lostWallet.sequence.verifiedSets >= lostWallet.sequence.totalSets;
  const activeRecoverySession = Boolean(lostWallet.activeSession);

  const status: NomadWalletRestorationStatus = sequenceVerified
    ? 'verified_waiting_provider'
    : lostWallet.status === 'verification_in_progress' || lostWallet.status === 'verification_locked'
      ? 'verification_in_progress'
      : 'setup_required';

  return {
    status,
    lostWallet,
    checks: buildChecks(lostWallet),
    sequenceVerified,
    activeRecoverySession,
    restorationProviderConnected: false,
    restorationReceiptAvailable: false,
    receiptSignatureVerified: false,
    privateKeysRestored: false,
    walletStateChangedByRecovery: false,
    canOpenRecoveredWallet: false,
    provider: 'not_connected',
    dataSource: 'nomad_wallet_restoration_adapter',
    persistence: 'in_memory_stub',
    checkedAt: new Date().toISOString(),
  };
}

export const nomadWalletRestorationAdapter: NomadWalletRestorationAdapter = {
  getRestorationState: buildState,
};
