/**
 * Expo App entry wired with React Navigation.
 *
 * Nomad is now mounted as an overlay route layer. The cloned wallet core can
 * replace wallet services later while these screens remain mounted through the
 * shared Nomad route registry and adapter provider.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppStateProvider, useAppState } from './state/appState';
import { NomadAdaptersProvider } from './nomad';
import { desiredRouteForStatus, nomadOverlayRoutes, type RootStackParamList } from './nomad/routes/nomadRoutes';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationRef = createNavigationContainerRef<RootStackParamList>();

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
              <StatusBar style="auto" />
            </SafeAreaView>
          </NavigationContainer>
        </SafeAreaProvider>
      </NomadAdaptersProvider>
    </AppStateProvider>
  );
}
