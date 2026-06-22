import type { ComponentType } from 'react';

import ClockUnlockScreen from '../../screens/ClockUnlockScreen';
import LockScreen from '../../screens/LockScreen';
import PortfolioScreen from '../../screens/PortfolioScreen';
import WalletsScreen from '../../screens/WalletsScreen';
import SendBitcoinScreen from '../../screens/SendBitcoinScreen';
import ReceiveBitcoinScreen from '../../screens/ReceiveBitcoinScreen';
import SwapScreen from '../../screens/SwapScreen';
import TravelModeScreen from '../../screens/TravelModeScreen';
import TopUpTravelPocketScreen from '../../screens/TopUpTravelPocketScreen';
import ApprovePOSTransactionScreen from '../../screens/ApprovePOSTransactionScreen';
import SecurityCenterScreen from '../../screens/SecurityCenterScreen';
import EmergencyFreezeScreen from '../../screens/EmergencyFreezeScreen';
import RecoveryCenterScreen from '../../screens/RecoveryCenterScreen';
import TimeClockAccessScreen from '../../screens/TimeClockAccessScreen';
import UnlockWalletScreen from '../../screens/UnlockWalletScreen';
import RecoverLostWalletScreen from '../../screens/RecoverLostWalletScreen';
import VerifyRecoverySequenceScreen from '../../screens/VerifyRecoverySequenceScreen';
import WalletRecoveredScreen from '../../screens/WalletRecoveredScreen';
import OwnerAuthorityApprovalScreen from '../../screens/OwnerAuthorityApprovalScreen';
import CreateOwnerAuthorityScreen from '../../screens/CreateOwnerAuthorityScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import NomadInsightsScreen from '../../screens/NomadInsightsScreen';
import NomadInsightsSpendingScreen from '../../screens/NomadInsightsSpendingScreen';
import VoltaireProtocolsScreen from '../../screens/VoltaireProtocolsScreen';
import BlockPagesSafetyScreen from '../../screens/BlockPagesSafetyScreen';
import BlockPagesURLScannerScreen from '../../screens/BlockPagesURLScannerScreen';
import AddressSafetyDetailScreen from '../../screens/AddressSafetyDetailScreen';
import NomadWatchScreen from '../../screens/NomadWatchScreen';

export type NomadOverlayRouteName =
  | 'ClockUnlock'
  | 'Lock'
  | 'Portfolio'
  | 'Wallets'
  | 'SendBitcoin'
  | 'ReceiveBitcoin'
  | 'Swap'
  | 'TravelMode'
  | 'TopUpTravelPocket'
  | 'ApprovePOSTransaction'
  | 'SecurityCenter'
  | 'EmergencyFreeze'
  | 'RecoveryCenter'
  | 'TimeClockAccess'
  | 'UnlockWallet'
  | 'RecoverLostWallet'
  | 'VerifyRecoverySequence'
  | 'WalletRecovered'
  | 'OwnerAuthorityApproval'
  | 'CreateOwnerAuthority'
  | 'Settings'
  | 'NomadInsights'
  | 'NomadInsightsSpending'
  | 'VoltaireProtocols'
  | 'BlockPagesSafety'
  | 'BlockPagesURLScanner'
  | 'AddressSafetyDetail'
  | 'NomadWatch';

export type RootStackParamList = Record<NomadOverlayRouteName, undefined>;

export type NomadOverlayArea =
  | 'foundation'
  | 'wallet'
  | 'travel'
  | 'security'
  | 'recovery'
  | 'blockpages'
  | 'voltaire'
  | 'insights'
  | 'watch'
  | 'settings';

export type NomadOverlayRoute = {
  name: NomadOverlayRouteName;
  component: ComponentType<any>;
  area: NomadOverlayArea;
};

export const nomadOverlayRoutes: NomadOverlayRoute[] = [
  { name: 'Lock', component: LockScreen, area: 'foundation' },
  { name: 'ClockUnlock', component: ClockUnlockScreen, area: 'foundation' },
  { name: 'Portfolio', component: PortfolioScreen, area: 'wallet' },
  { name: 'Wallets', component: WalletsScreen, area: 'wallet' },
  { name: 'SendBitcoin', component: SendBitcoinScreen, area: 'wallet' },
  { name: 'ReceiveBitcoin', component: ReceiveBitcoinScreen, area: 'wallet' },
  { name: 'Swap', component: SwapScreen, area: 'wallet' },
  { name: 'TravelMode', component: TravelModeScreen, area: 'travel' },
  { name: 'TopUpTravelPocket', component: TopUpTravelPocketScreen, area: 'travel' },
  { name: 'ApprovePOSTransaction', component: ApprovePOSTransactionScreen, area: 'travel' },
  { name: 'SecurityCenter', component: SecurityCenterScreen, area: 'security' },
  { name: 'EmergencyFreeze', component: EmergencyFreezeScreen, area: 'security' },
  { name: 'RecoveryCenter', component: RecoveryCenterScreen, area: 'recovery' },
  { name: 'TimeClockAccess', component: TimeClockAccessScreen, area: 'recovery' },
  { name: 'UnlockWallet', component: UnlockWalletScreen, area: 'recovery' },
  { name: 'RecoverLostWallet', component: RecoverLostWalletScreen, area: 'recovery' },
  { name: 'VerifyRecoverySequence', component: VerifyRecoverySequenceScreen, area: 'recovery' },
  { name: 'WalletRecovered', component: WalletRecoveredScreen, area: 'recovery' },
  { name: 'OwnerAuthorityApproval', component: OwnerAuthorityApprovalScreen, area: 'recovery' },
  { name: 'CreateOwnerAuthority', component: CreateOwnerAuthorityScreen, area: 'recovery' },
  { name: 'Settings', component: SettingsScreen, area: 'settings' },
  { name: 'NomadInsights', component: NomadInsightsScreen, area: 'insights' },
  { name: 'NomadInsightsSpending', component: NomadInsightsSpendingScreen, area: 'insights' },
  { name: 'VoltaireProtocols', component: VoltaireProtocolsScreen, area: 'voltaire' },
  { name: 'BlockPagesSafety', component: BlockPagesSafetyScreen, area: 'blockpages' },
  { name: 'BlockPagesURLScanner', component: BlockPagesURLScannerScreen, area: 'blockpages' },
  { name: 'AddressSafetyDetail', component: AddressSafetyDetailScreen, area: 'blockpages' },
  { name: 'NomadWatch', component: NomadWatchScreen, area: 'watch' },
];

export function desiredRouteForStatus(status: string): NomadOverlayRouteName {
  if (status === 'unlocked') return 'Portfolio';
  if (status === 'locked') return 'ClockUnlock';
  return 'Lock';
}
