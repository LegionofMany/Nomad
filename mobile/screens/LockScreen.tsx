/**
 * Mobile (Expo) screen
 *
 * Expo-ready. Keep this file at `mobile/screens/LockScreen.tsx` when
 * moving the UI into an Expo app. Do not change UI logic — only update
 * relative imports if you move the file inside a different folder.
 */

import React, { useState } from "react";
import { View, Text } from "react-native";
import ClockDial, { ClockTime } from "../components/ClockDial";
import { useTheme } from "../theme";

export const LockScreen = ({ onUnlocked }: { onUnlocked: () => void }) => {
  const colors = useTheme();
  const [time, setTime] = useState<ClockTime>({ hour: 12, minute: 0 });

  // UI-only stub: actual unlock wiring depends on the chosen mobile runtime (Expo/Native).
  // This keeps the screen shape and behavior expectations without touching core security logic.
  return (
    <View
      accessible
      accessibilityLabel="Lock screen"
      accessibilityHint="Unlock the app"
      style={{ flex: 1, backgroundColor: colors.background, padding: 20, justifyContent: "center", alignItems: "center" }}
    >
      <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 12 }}>Unlock</Text>
      <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16, textAlign: "center" }}>
        Rotate to your unlock time.
      </Text>
      <ClockDial value={time} onChange={setTime} />
    </View>
  );
};

export default LockScreen;
