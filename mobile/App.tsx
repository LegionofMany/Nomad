/**
 * Expo App entry wired with React Navigation.
 *
 * Requirements satisfied:
 * - Uses React Navigation
 * - Starts at `ClockUnlockScreen`
 * - No business logic or wallet-core imports here
 * - Minimal navigation stack
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ClockUnlockScreen from './screens/ClockUnlockScreen';
import LockScreen from './screens/LockScreen';
import PortfolioScreen from './screens/PortfolioScreen';
import WalletsScreen from './screens/WalletsScreen';
import SendBitcoinScreen from './screens/SendBitcoinScreen';
import ReceiveBitcoinScreen from './screens/ReceiveBitcoinScreen';
import SwapScreen from './screens/SwapScreen';
import TravelModeScreen from './screens/TravelModeScreen';
import SecurityCenterScreen from './screens/SecurityCenterScreen';
import SettingsScreen from './screens/SettingsScreen';
import NomadInsightsScreen from './screens/NomadInsightsScreen';

import { AppStateProvider, useAppState } from './state/appState';

type RootStackParamList = {
  ClockUnlock: undefined;
  Lock: undefined;
  Portfolio: undefined;
  Wallets: undefined;
  SendBitcoin: undefined;
  ReceiveBitcoin: undefined;
  Swap: undefined;
  TravelMode: undefined;
  SecurityCenter: undefined;
  Settings: undefined;
  NomadInsights: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationRef = createNavigationContainerRef<RootStackParamList>();

function desiredRouteForStatus(status: string): keyof RootStackParamList {
  if (status === "unlocked") return "Portfolio";
  if (status === "locked") return "ClockUnlock";
  // no_wallet / recovery
  return "Lock";
}

function NavigationGate() {
  const { walletStatus } = useAppState();

  React.useEffect(() => {
    if (!navigationRef.isReady()) return;
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

function AppNavigator() {
  const { walletStatus } = useAppState();

  return (
    <Stack.Navigator initialRouteName={desiredRouteForStatus(walletStatus)}>
      <Stack.Screen name="Lock" component={LockScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ClockUnlock" component={ClockUnlockScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Portfolio" component={PortfolioScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Wallets" component={WalletsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SendBitcoin" component={SendBitcoinScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReceiveBitcoin" component={ReceiveBitcoinScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Swap" component={SwapScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TravelMode" component={TravelModeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SecurityCenter" component={SecurityCenterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NomadInsights" component={NomadInsightsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <SafeAreaView style={{ flex: 1 }}>
            <NavigationGate />
            <AppNavigator />
            <StatusBar style="auto" />
          </SafeAreaView>
        </NavigationContainer>
      </SafeAreaProvider>
    </AppStateProvider>
  );
}
