/**
 * Mobile (Expo) screen
 *
 * Expo-ready. Keep this file at `mobile/screens/LockScreen.tsx` when
 * moving the UI into an Expo app. Do not change UI logic — only update
 * relative imports if you move the file inside a different folder.
 */

import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme";
import { useAppState } from "../state/appState";

export const LockScreen = () => {
  const colors = useTheme();
  const navigation = useNavigation<any>();
  const { walletStatus, walletMeta, createWallet, restoreWallet, resetDemo } = useAppState();

  const [restorePhrase, setRestorePhrase] = useState("");
  const [createdMnemonic, setCreatedMnemonic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusLabel = useMemo(() => {
    switch (walletStatus) {
      case "no_wallet":
        return "No wallet yet";
      case "locked":
        return "Wallet locked";
      case "unlocked":
        return "Wallet unlocked";
      case "recovery":
        return "Recovery required";
      default:
        return "";
    }
  }, [walletStatus]);

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.background, padding: 20, justifyContent: "center" }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 6 }}>Nomad Wallet</Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>{statusLabel}</Text>

      {walletMeta?.evmAddress ? (
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 16 }}>EVM Address: {walletMeta.evmAddress}</Text>
      ) : null}

      {walletStatus === "no_wallet" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create wallet"
          onPress={async () => {
            setError(null);
            try {
              const res = await createWallet();
              setCreatedMnemonic(res.mnemonic);
              navigation.navigate("ClockUnlock");
            } catch (e: any) {
              setError(e?.message ?? "Failed to create wallet");
            }
          }}
          style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ color: colors.text, fontWeight: "700" }}>Create Wallet</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to unlock"
          onPress={() => navigation.navigate("ClockUnlock")}
          style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ color: colors.text, fontWeight: "700" }}>Unlock Wallet</Text>
        </Pressable>
      )}

      <View style={{ height: 14 }} />

      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>Restore from seed phrase</Text>
      <TextInput
        accessibilityLabel="Seed phrase"
        placeholder="Enter 12/24-word mnemonic"
        placeholderTextColor={colors.muted}
        value={restorePhrase}
        onChangeText={setRestorePhrase}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        style={{
          minHeight: 90,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          padding: 10,
          color: colors.text,
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Restore wallet"
        onPress={async () => {
          setError(null);
          try {
            await restoreWallet(restorePhrase.trim());
            setRestorePhrase("");
            setCreatedMnemonic(null);
            navigation.navigate("ClockUnlock");
          } catch (e: any) {
            setError(e?.message ?? "Failed to restore wallet");
          }
        }}
        style={{ marginTop: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
      >
        <Text style={{ color: colors.text, fontWeight: "700" }}>Restore Wallet</Text>
      </Pressable>

      {createdMnemonic ? (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 6 }}>Backup phrase (demo)</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Save this somewhere safe. In this demo build it is shown once after creation.
          </Text>
          <Text style={{ marginTop: 8, color: colors.text }}>{createdMnemonic}</Text>
        </View>
      ) : null}

      {error ? (
        <Text style={{ marginTop: 14, color: "#d64545", fontSize: 13 }}>{error}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reset demo"
        onPress={async () => {
          await resetDemo();
          setRestorePhrase("");
          setCreatedMnemonic(null);
          setError(null);
        }}
        style={{ marginTop: 18, paddingVertical: 8, paddingHorizontal: 14 }}
      >
        <Text style={{ color: colors.muted, fontSize: 13 }}>Reset demo</Text>
      </Pressable>
    </ScrollView>
  );
};

export default LockScreen;
