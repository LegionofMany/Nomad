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
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ClockUnlockScreen from './screens/ClockUnlockScreen';

type RootStackParamList = {
  ClockUnlock: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack.Navigator initialRouteName="ClockUnlock">
          <Stack.Screen
            name="ClockUnlock"
            component={ClockUnlockScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </SafeAreaView>
    </NavigationContainer>
  );
}
