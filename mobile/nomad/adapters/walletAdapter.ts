export type NomadAsset = {
  symbol: string;
  name: string;
  balance: string;
  fiatValueUsd: string;
  change24h?: string;
  network?: string;
};

export type NomadTransactionDraft = {
  fromAsset: string;
  toAddress: string;
  amount: string;
  networkFee?: string;
  memo?: string;
};

export type NomadSignedTransaction = {
  txHash?: string;
  rawTransaction?: string;
  status: 'created' | 'signed' | 'submitted' | 'failed';
};

export type NomadWalletAdapter = {
  getWalletBalance(): Promise<string>;
  getAssets(): Promise<NomadAsset[]>;
  getReceiveAddress(assetSymbol: string): Promise<string>;
  createTransaction(draft: NomadTransactionDraft): Promise<NomadSignedTransaction>;
  lockWallet(): Promise<void>;
  unlockWallet(): Promise<void>;
};

export type NomadTravelPocketState = {
  enabled: boolean;
  regionInput?: string;
  preferredStablecoin?: string;
  pocketBalanceFiat?: string;
  pocketBalanceLocal?: string;
  localCurrency?: string;
};

export type NomadTravelAdapter = {
  getTravelPocketState(): Promise<NomadTravelPocketState>;
  enableTravelPocket(regionInput: string): Promise<NomadTravelPocketState>;
  disableTravelPocket(): Promise<NomadTravelPocketState>;
};

export type NomadRecoveryClockTime = {
  hour: number;
  minute: number;
  second?: number;
};

export type NomadRecoveryState = {
  walletStatus: 'no_wallet' | 'locked' | 'unlocked' | 'recovery';
  dailyUnlockTime: NomadRecoveryClockTime | null;
  recoveryStatus: 'not_started' | 'protected' | 'locked' | 'recovery_required';
  recoverySetupDate: string;
  verificationStatus: string;
  lastCheckLabel: string;
  timeSetsComplete: number;
  timeSetsTotal: number;
  recoveryScore: number;
  signerQuorum: number;
  signerTotal: number;
  nextRecommendedCheck: string;
  timeRemainingLabel: string;
  cycleLabel: string;
  cycleStartedLabel: string;
  purpose: string;
};

export type NomadOwnerAuthorityRequest = {
  status: 'none' | 'pending' | 'approved' | 'declined' | 'cancelled';
  requestedAt?: string;
  reason?: string;
  requestedBy?: string;
  device?: string;
};

export type NomadRecoverySequenceState = {
  step: 1 | 2 | 3 | 4;
  enteredSets: number;
  verifiedSets: number;
  totalSets: number;
  strengthScore: number;
  currentSet: number;
  sampleTime: NomadRecoveryClockTime;
  status: 'entry' | 'verifying' | 'ready_to_recover' | 'complete';
  recoveredAt?: string;
};

export type NomadRecoveryAdapter = {
  getRecoveryState(): Promise<NomadRecoveryState>;
  runRecoveryCheck(): Promise<NomadRecoveryState>;
  getOwnerAuthorityRequest(): Promise<NomadOwnerAuthorityRequest>;
  requestOwnerAuthorityApproval(reason: string): Promise<NomadOwnerAuthorityRequest>;
  cancelOwnerAuthorityRequest(): Promise<NomadOwnerAuthorityRequest>;
  getRecoverySequenceState(): Promise<NomadRecoverySequenceState>;
  startRecoverySequence(): Promise<NomadRecoverySequenceState>;
  verifyRecoverySet(setNumber: number, time: NomadRecoveryClockTime): Promise<NomadRecoverySequenceState>;
  completeRecoverySequence(): Promise<NomadRecoverySequenceState>;
};

export type NomadFreezeScope = 'entire_wallet' | 'travel_pocket' | 'specific_assets' | 'owner_authority_alert';

export type NomadFreezeActivity = {
  scope: NomadFreezeScope;
  label: string;
  requestedAt: string;
  status: 'active' | 'alert_sent' | 'cleared';
};

export type NomadSecurityState = {
  status: 'secure' | 'warning' | 'frozen';
  protectedSince: string;
  protectedDays: string;
  lastScanLabel: string;
  lastScanDetail: string;
  score: number;
  freezeStatus: 'none' | 'partial' | 'full';
  freezeScope?: NomadFreezeScope;
  freezeActivity: NomadFreezeActivity[];
};

export type NomadSecurityAdapter = {
  getSecurityState(): Promise<NomadSecurityState>;
  runSecurityScan(): Promise<NomadSecurityState>;
  activateFreeze(scope: NomadFreezeScope): Promise<NomadSecurityState>;
  clearFreeze(): Promise<NomadSecurityState>;
};

export type NomadSafetyAdapter = {
  scanAddress(address: string): Promise<{ score: number; risk: 'low' | 'medium' | 'high'; summary: string }>;
  scanUrl(url: string): Promise<{ score: number; risk: 'low' | 'medium' | 'high'; summary: string }>;
};

export type NomadOverlayAdapters = {
  wallet?: NomadWalletAdapter;
  travel?: NomadTravelAdapter;
  recovery?: NomadRecoveryAdapter;
  security?: NomadSecurityAdapter;
  safety?: NomadSafetyAdapter;
};

export const createMissingAdapterError = (adapterName: string) =>
  new Error(`${adapterName} adapter is not connected yet. Connect the cloned wallet core before enabling live actions.`);
