/**
 * Mobile (Expo) UI component
 *
 * Expo-ready. Keep this file at `mobile/components/NFCIndicator.tsx` when
 * moving the UI into an Expo app. No logic changes applied.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme";

export const NFCIndicator = ({
  nfcEnabled,
}: {
  nfcEnabled: boolean;
}) => {
  const colors = useTheme();
  const label = nfcEnabled ? "NFC: On" : "NFC: Off";

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[styles.pill, { borderColor: colors.border }]}
    >
      <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
});

export default NFCIndicator;
