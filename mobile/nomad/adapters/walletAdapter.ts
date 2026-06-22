export type NomadChain = {
  id: string;
  name: string;
  family: 'bitcoin' | 'evm' | 'hedera' | 'xrpl' | 'stellar' | 'solana' | 'other';
  nativeAsset: string;
  testnet?: boolean;
};

export type NomadWalletAccount = {
  id: string;
  label: string;
  address: string;
  assetSymbol?: string;
  chainId: string;
  derivationPath?: string;
  isPrimary?: boolean;
};

export type NomadWalletSessionState = {
  status: 'no_wallet' | 'locked' | 'unlocked' | 'expired' | 'recovery';
  activeAccountId?: string;
  activeChainId?: string;
  expiresAt?: string;
};

export type NomadAdapterFailureCode =
  | 'unsupported_chain'
  | 'wallet_locked'
  | 'expired_session'
  | 'missing_provider'
  | 'rejected_signing'
  | 'broadcast_failed'
  | 'not_implemented'
  | 'invalid_request';

export type NomadAdapterFailure = {
  code: NomadAdapterFailureCode;
  message: string;
  recoverable: boolean;
};

export type NomadAsset = {
  symbol: string;
  name: string;
  balance: string;
  fiatValueUsd: string;
  change24h?: string;
  network?: string;
  chainId?: string;
  accountId?: string;
  contractAddress?: string;
};

export type NomadTransactionDraft = {
  fromAsset: string;
  toAddress: string;
  amount: string;
  networkFee?: string;
  memo?: string;
  chainId?: string;
  fromAccountId?: string;
  intent?: 'send' | 'swap' | 'pos_approval' | 'travel_pocket_top_up';
  requiresUserApproval?: boolean;
  createdBy?: 'nomad_overlay' | 'cloned_wallet_engine';
};

export type NomadTransactionHistoryItem = {
  id: string;
  assetSymbol: string;
  amount: string;
  fiatValueUsd?: string;
  direction: 'sent' | 'received' | 'swap' | 'pos' | 'fee';
  status: 'pending' | 'confirmed' | 'failed';
  counterparty?: string;
  txHash?: string;
  chainId?: string;
  timestamp: string;
};

export type NomadSignedTransaction = {
  txHash?: string;
  rawTransaction?: string;
  status: 'created' | 'signed' | 'submitted' | 'broadcasted' | 'failed';
  failure?: NomadAdapterFailure;
};

export type NomadBroadcastResult = {
  txHash: string;
  status: 'submitted' | 'broadcasted' | 'failed';
  chainId?: string;
  failure?: NomadAdapterFailure;
};

/**
 * Phase 2 wallet boundary.
 *
 * Nomad may request wallet facts, receive addresses, reviewable drafts, and lock state.
 * The cloned/base wallet must own account derivation, private keys, signing, broadcasting,
 * provider selection, balances, and canonical transaction history.
 */
export type NomadWalletAdapter = {
  getWalletBalance(): Promise<string>;
  getAssets(): Promise<NomadAsset[]>;
  getReceiveAddress(assetSymbol: string, chainId?: string, accountId?: string): Promise<string>;
  createTransaction(draft: NomadTransactionDraft): Promise<NomadSignedTransaction>;
  lockWallet(): Promise<void>;
  unlockWallet(): Promise<void>;
  getSessionState?(): Promise<NomadWalletSessionState>;
  getSupportedChains?(): Promise<NomadChain[]>;
  getAccounts?(): Promise<NomadWalletAccount[]>;
  getTransactionHistory?(accountId?: string): Promise<NomadTransactionHistoryItem[]>;
  signTransaction?(draft: NomadTransactionDraft): Promise<NomadSignedTransaction>;
  broadcastTransaction?(signedTransaction: NomadSignedTransaction): Promise<NomadBroadcastResult>;
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

export type NomadInsightStat = {
  label: string;
  value: string;
  note: string;
  icon: string;
  color: string;
};

export type NomadSpendingCategory = {
  label: string;
  icon?: string;
  percent: string;
  amount: string;
  color: string;
};

export type NomadSpendingTransaction = {
  name: string;
  meta: string;
  category: string;
  amount: string;
  usd: string;
  icon: string;
  color: string;
};

export type NomadBudgetItem = {
  label: string;
  spent: string;
  total: string;
  percent: string;
  icon: string;
  color: string;
};

export type NomadPerformanceRow = {
  asset: string;
  symbol: string;
  icon: string;
  price: string;
  change: string;
  positive: boolean;
};

export type NomadInsightsState = {
  totalPortfolioValue: string;
  monthlyGrowth: string;
  monthlyGrowthPercent: string;
  statCards: NomadInsightStat[];
  spendingTotal: string;
  spendingDelta: string;
  spendingCategories: NomadSpendingCategory[];
  recentSpending: NomadSpendingTransaction[];
  budgets: NomadBudgetItem[];
  performanceRows: NomadPerformanceRow[];
  topInsight: string;
  topSavings: string;
  travelLocation: string;
  travelDateRange: string;
  travelPocketSpent: string;
  travelPocketSpentUsd: string;
  travelDailyAverage: string;
  travelDailyAverageUsd: string;
  freedomScore: number;
};

export type NomadInsightsAdapter = {
  getInsightsState(): Promise<NomadInsightsState>;
};

export type NomadSwapQuote = {
  fromAsset: string;
  toAsset: string;
  fromAmount: string;
  toAmount: string;
  fromValueUsd: string;
  toValueUsd: string;
  fromBalance: string;
  toBalance: string;
  rateLabel: string;
  priceImpact: string;
  network: string;
  networkFee: string;
  estimatedTime: string;
  slippageTolerance: string;
  status: 'quote' | 'draft_created' | 'failed';
  quoteId?: string;
  expiresAt?: string;
  failure?: NomadAdapterFailure;
};

export type NomadSwapAdapter = {
  getSwapQuote(fromAsset: string, toAsset: string, amount: string): Promise<NomadSwapQuote>;
  createSwapDraft(quote: NomadSwapQuote): Promise<NomadSignedTransaction>;
};

export type NomadProtocolRow = {
  title: string;
  subtitle: string;
  detail: string;
  uptime: string;
  icon: string;
  color: string;
};

export type NomadProtocolHealthItem = {
  label: string;
  value: string;
  note: string;
  icon: string;
};

export type NomadProtocolsState = {
  status: 'active' | 'degraded' | 'offline';
  activeProtocols: number;
  totalProtocols: number;
  networkUptime: string;
  globalNodes: string;
  countries: string;
  protocols: NomadProtocolRow[];
  health: NomadProtocolHealthItem[];
  message: string;
};

export type NomadProtocolsAdapter = {
  getProtocolsState(): Promise<NomadProtocolsState>;
};

export type NomadWatchEmergencyAction = 'emergency_lock' | 'pause_spending' | 'alert_authority' | 'panic_mode';

export type NomadWatchState = {
  connected: boolean;
  deviceName: string;
  firmware: string;
  batteryPercent: number;
  lastSyncedLabel: string;
  securityStatus: 'secure' | 'warning' | 'locked';
  travelRegion: string;
  travelSubregion: string;
  travelModeLabel: string;
  timeSetLabel: string;
  travelPocketBalance: string;
  todaySpending: string;
  dailyLimit: string;
  ownerAuthorityAlertLabel: string;
};

export type NomadWatchAdapter = {
  getWatchState(): Promise<NomadWatchState>;
  syncNow(): Promise<NomadWatchState>;
  triggerEmergencyAction(action: NomadWatchEmergencyAction): Promise<NomadWatchState>;
};

export type NomadSettingsRow = {
  title: string;
  subtitle: string;
  icon: string;
  color?: string;
  value?: string;
  route?: string;
};

export type NomadSettingsShortcut = {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  route?: string;
};

export type NomadSettingsState = {
  displayName: string;
  email: string;
  identityStatus: string;
  securityLevel: string;
  defaultCurrency: string;
  language: string;
  appearance: string;
  defaultNetwork: string;
  notificationsLabel: string;
  travelPocketLabel: string;
  autoConvertEnabled: boolean;
  paySpendLabel: string;
  appVersion: string;
  shortcuts: NomadSettingsShortcut[];
  preferenceRows: NomadSettingsRow[];
  featureRows: NomadSettingsRow[];
  supportRows: NomadSettingsRow[];
};

export type NomadSettingsAdapter = {
  getSettingsState(): Promise<NomadSettingsState>;
  logOut(): Promise<{ status: 'locked' }>;
};

export type NomadSafetyScanResult = {
  score: number;
  risk: 'low' | 'medium' | 'high';
  summary: string;
  provider?: 'local' | 'blockpages' | 'cloned_wallet_engine';
  checkedAt?: string;
  failure?: NomadAdapterFailure;
};

export type NomadSafetyAdapter = {
  scanAddress(address: string): Promise<NomadSafetyScanResult>;
  scanUrl(url: string): Promise<NomadSafetyScanResult>;
};

export type NomadOverlayAdapters = {
  wallet?: NomadWalletAdapter;
  travel?: NomadTravelAdapter;
  recovery?: NomadRecoveryAdapter;
  security?: NomadSecurityAdapter;
  insights?: NomadInsightsAdapter;
  swap?: NomadSwapAdapter;
  protocols?: NomadProtocolsAdapter;
  watch?: NomadWatchAdapter;
  settings?: NomadSettingsAdapter;
  safety?: NomadSafetyAdapter;
};

export const createMissingAdapterError = (adapterName: string) =>
  new Error(`${adapterName} adapter is not connected yet. Connect the cloned wallet core before enabling live actions.`);

export const createAdapterFailure = (code: NomadAdapterFailureCode, message: string, recoverable = true): NomadAdapterFailure => ({ code, message, recoverable });
