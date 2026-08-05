/**
 * Expo App entry wired with React Navigation.
 *
 * The web deployment is a visual preview of the complete Nomad dApp, so it
 * opens directly on the Portfolio. Native Android and iOS builds continue to
 * enforce the wallet-status lock and unlock flow.
 */

import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppStateProvider, useAppState } from './state/appState';
import { NomadAdaptersProvider } from './nomad';
import { desiredRouteForStatus, nomadOverlayRoutes, type RootStackParamList } from './nomad/routes/nomadRoutes';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();
const isWebPreview = Platform.OS === 'web';

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
          options={{ headerShown: false }}
        />
      ))}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <NomadAdaptersProvider>
        <SafeAreaProvider>
          <NavigationContainer ref={navigationRef}>
            <SafeAreaView style={{ flex: 1 }}>
              <NavigationGate />
              <AppNavigator />
              <StatusBar style="light" />
            </SafeAreaView>
          </NavigationContainer>
        </SafeAreaProvider>
      </NomadAdaptersProvider>
    </AppStateProvider>
  );
}
