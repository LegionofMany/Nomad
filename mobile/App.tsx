/**
 * Expo App entry wired with React Navigation.
 *
 * The web deployment is a visual preview of the complete Nomad dApp, so it
 * opens directly on the Portfolio. Native Android and iOS builds continue to
 * enforce the wallet-status lock and unlock flow.
 */

import React from 'react';
import { Linking, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppStateProvider, useAppState } from './state/appState';
import { TransactionApprovalHost } from './components/TransactionApprovalHost';
import { ConnectApprovalHost } from './components/ConnectApprovalHost';
import { engineAdapters } from './services/engineService';
import { runIncomingConnectLink } from './services/connectService';
import { isConnectLink } from '../src/connect';
import { NomadAdaptersProvider } from './nomad';
import { desiredRouteForStatus, nomadOverlayRoutes, type RootStackParamList } from './nomad/routes/nomadRoutes';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();
const isWebPreview = Platform.OS === 'web';
const routeTitles: Partial<Record<keyof RootStackParamList, string>> = {
  Portfolio: 'Nomad Wallet',
  VoltaireProtocols: 'Arkrilium Protocols',
  BlockPagesSafety: 'Reqrium Safety',
  BlockPagesURLScanner: 'Reqrium URL Scanner',
  DeviceIntegrity: 'Device Integrity',
};
const webLinking = {
  prefixes: [],
  config: {
    screens: {
      Portfolio: '',
      Wallets: 'wallets',
      SendBitcoin: 'wallets/send',
      ReceiveBitcoin: 'wallets/receive',
      Swap: 'wallets/swap',
      TravelMode: 'travel',
      TopUpTravelPocket: 'travel/top-up',
      ApprovePOSTransaction: 'travel/approve',
      SecurityCenter: 'security',
      DeviceIntegrity: 'security/device-integrity',
      EmergencyFreeze: 'security/emergency-freeze',
      RecoveryCenter: 'recovery',
      TimeClockAccess: 'recovery/time-clock',
      UnlockWallet: 'recovery/unlock',
      RecoverLostWallet: 'recovery/lost-wallet',
      VerifyRecoverySequence: 'recovery/verify',
      WalletRecovered: 'recovery/complete',
      OwnerAuthorityApproval: 'recovery/owner-authority',
      CreateOwnerAuthority: 'recovery/owner-authority/create',
      Settings: 'settings',
      NomadInsights: 'insights',
      NomadInsightsSpending: 'insights/spending',
      VoltaireProtocols: 'ecosystem',
      BlockPagesSafety: 'reqrium',
      BlockPagesURLScanner: 'reqrium/url-scanner',
      AddressSafetyDetail: 'reqrium/address-safety',
      NomadWatch: 'watch',
      ClockUnlock: 'clock-unlock',
      Lock: 'lock',
    },
  },
};

function NavigationGate() {
  const { walletStatus } = useAppState();

  React.useEffect(() => {
    if (isWebPreview || !navigationRef.isReady()) return;

    const desired = desiredRouteForStatus(walletStatus);
    const current = navigationRef.getCurrentRoute()?.name as keyof RootStackParamList | undefined;
    if (current === desired) return;

    navigationRef.reset({
      index: 0,
      routes: [{ name: desired }],
    });
  }, [walletStatus]);

  return null;
}

/**
 * Listens for nomad://connect links from Zonycs, Reqrium and the other apps.
 * A link that arrives while the wallet is locked is held until the owner unlocks,
 * then handled. It is never handled while locked, and it expires on its own.
 */
function ConnectLinkListener() {
  const { walletStatus } = useAppState();
  const statusRef = React.useRef(walletStatus);
  const heldLink = React.useRef<string | null>(null);
  const busy = React.useRef(false);

  const flush = React.useCallback(() => {
    const link = heldLink.current;
    if (!link || busy.current || statusRef.current !== 'unlocked') return;
    heldLink.current = null;
    busy.current = true;
    runIncomingConnectLink(link)
      .catch(() => undefined)
      .finally(() => {
        busy.current = false;
        flush();
      });
  }, []);

  React.useEffect(() => {
    statusRef.current = walletStatus;
    flush();
  }, [walletStatus, flush]);

  React.useEffect(() => {
    if (isWebPreview) return;
    const accept = (url: string | null) => {
      if (!isConnectLink(url)) return;
      heldLink.current = url;
      flush();
    };
    Linking.getInitialURL().then(accept).catch(() => undefined);
    const subscription = Linking.addEventListener('url', (event) => accept(event.url));
    return () => subscription.remove();
  }, [flush]);

  return null;
}

function AppNavigator() {
  const { walletStatus } = useAppState();
  const initialRoute = isWebPreview ? 'Portfolio' : desiredRouteForStatus(walletStatus);

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      {nomadOverlayRoutes.map((route) => (
        <Stack.Screen
          key={route.name}
          name={route.name}
          component={route.component}
          options={{ headerShown: false, title: routeTitles[route.name] ?? route.name }}
        />
      ))}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <NomadAdaptersProvider adapters={engineAdapters}>
        <SafeAreaProvider>
          <NavigationContainer ref={navigationRef} linking={isWebPreview ? webLinking : undefined}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#01060d' }}>
              <NavigationGate />
              <AppNavigator />
              <ConnectLinkListener />
              <TransactionApprovalHost />
              <ConnectApprovalHost />
              <StatusBar style="light" />
            </SafeAreaView>
          </NavigationContainer>
        </SafeAreaProvider>
      </NomadAdaptersProvider>
    </AppStateProvider>
  );
}
