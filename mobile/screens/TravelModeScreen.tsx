/**
 * Mobile (Expo) screen
 *
 * Expo-ready. Keep this file at `mobile/screens/TravelModeScreen.tsx` when
 * moving the UI into an Expo app. Do not change UI logic — only update
 * relative imports if you move the file inside a different folder.
 */

import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme";
import { useAppState } from "../state/appState";

export const TravelModeScreen = () => {
  const colors = useTheme();
  const navigation = useNavigation<any>();
  const { travelModeEnabled, travelRegionInput, preferredStablecoin, enableTravelMode, disableTravelMode } = useAppState();
  const [regionInput, setRegionInput] = useState(travelRegionInput);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setRegionInput(travelRegionInput);
  }, [travelRegionInput]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text, marginBottom: 12 }}>Travel Mode</Text>
      <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16, textAlign: "center" }}>
        Enable regional safety behavior and stablecoin preference.
      </Text>

      <View style={{ width: "100%", maxWidth: 420 }}>
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Region</Text>
        <TextInput
          accessibilityLabel="Region input"
          placeholder="e.g. US, EU, UK, AU, UAE, GLOBAL"
          placeholderTextColor={colors.muted}
          value={regionInput}
          onChangeText={setRegionInput}
          autoCapitalize="characters"
          autoCorrect={false}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 10,
            color: colors.text,
          }}
        />

        <Text style={{ marginTop: 10, fontSize: 12, color: colors.muted }}>
          Status: {travelModeEnabled ? "Enabled" : "Disabled"} · Preferred stablecoin: {preferredStablecoin ?? "—"}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={travelModeEnabled ? "Disable Travel Mode" : "Enable Travel Mode"}
        onPress={async () => {
          setMessage(null);
          try {
            if (travelModeEnabled) {
              await disableTravelMode();
              setMessage("Travel Mode disabled.");
            } else {
              const res = await enableTravelMode(regionInput.trim());
              setMessage(`Travel Mode enabled. Preferred stablecoin: ${res.preferredStablecoin}`);
            }
          } catch (e: any) {
            setMessage(e?.message ?? "Failed to update Travel Mode");
          }
        }}
        style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 14 }}
      >
        <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>
          {travelModeEnabled ? "Disable" : "Enable"}
        </Text>
      </Pressable>

      {message ? <Text style={{ marginTop: 12, color: colors.muted, fontSize: 13, textAlign: "center" }}>{message}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to portfolio"
        onPress={() => navigation.navigate("Portfolio")}
        style={{ marginTop: 10, paddingVertical: 8, paddingHorizontal: 14 }}
      >
        <Text style={{ color: colors.muted, fontSize: 13 }}>Back</Text>
      </Pressable>
    </View>
  );
};

export default TravelModeScreen;
