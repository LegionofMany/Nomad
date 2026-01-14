/**
 * Mobile (Expo) screen
 *
 * Expo-ready. Keep this file at `mobile/screens/TravelModeScreen.tsx` when
 * moving the UI into an Expo app. Do not change UI logic — only update
 * relative imports if you move the file inside a different folder.
 */

import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import ClockDial, { ClockTime } from "../components/ClockDial";
import { useTheme } from "../theme";

export const TravelModeScreen = ({ onEnabled }: { onEnabled: () => void }) => {
  const colors = useTheme();
  const [time, setTime] = useState<ClockTime>({ hour: 12, minute: 0 });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text, marginBottom: 12 }}>Travel Mode</Text>
      <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16, textAlign: "center" }}>
        Rotate the clock to confirm enabling Travel Mode.
      </Text>
      <ClockDial value={time} onChange={setTime} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enable Travel Mode"
        onPress={onEnabled}
        style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 14 }}
      >
        <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>Enable</Text>
      </Pressable>
    </View>
  );
};

export default TravelModeScreen;
