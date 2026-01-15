/**
 * Mobile (Expo) screen
 *
 * Expo-ready. Keep this file at `mobile/screens/PortfolioScreen.tsx` when
 * moving the UI into an Expo app. Do not change UI logic — only update
 * relative imports if you move the file inside a different folder.
 */

import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme";
import { useAppState } from "../state/appState";
import NFCIndicator from "../components/NFCIndicator";
import type { Balance } from "../types";

export const PortfolioScreen = () => {
  const colors = useTheme();
  const navigation = useNavigation<any>();
  const {
    walletStatus,
    portfolio,
    nfcEnabled,
    toggleNfc,
    travelModeEnabled,
    preferredStablecoin,
    lockWallet,
  } = useAppState();

  const ordered = useMemo(() => {
    const balances = portfolio?.balances ?? [];
    const preferred = preferredStablecoin ?? null;

    return [...balances].sort((a, b) => {
      if (preferred && a.symbol === preferred) return -1;
      if (preferred && b.symbol === preferred) return 1;
      return b.fiatApproxUSD - a.fiatApproxUSD;
    });
  }, [portfolio?.balances, preferredStablecoin]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>Portfolio</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
            Status: {walletStatus} · Travel Mode: {travelModeEnabled ? "On" : "Off"}
          </Text>
          {portfolio?.evmAddress ? (
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>EVM Address: {portfolio.evmAddress}</Text>
          ) : null}
        </View>
        <NFCIndicator nfcEnabled={nfcEnabled} />
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Travel Mode"
          onPress={() => navigation.navigate("TravelMode")}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10 }}
        >
          <Text style={{ color: colors.text, fontWeight: "600" }}>Travel Mode</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle NFC"
          onPress={toggleNfc}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10 }}
        >
          <Text style={{ color: colors.text, fontWeight: "600" }}>Toggle NFC</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lock"
          onPress={async () => {
            await lockWallet();
            navigation.navigate("ClockUnlock");
          }}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10 }}
        >
          <Text style={{ color: colors.text, fontWeight: "600" }}>Lock</Text>
        </Pressable>
      </View>

      <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
        Preferred stablecoin: {preferredStablecoin ?? "—"}
      </Text>

      {!portfolio ? (
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: colors.muted }}>No portfolio loaded. Unlock the wallet first.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to unlock"
            onPress={() => navigation.navigate("ClockUnlock")}
            style={{ marginTop: 10, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10 }}
          >
            <Text style={{ color: colors.text, fontWeight: "700" }}>Go to Unlock</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          accessibilityRole="list"
          data={ordered}
          keyExtractor={(item: Balance) => item.symbol}
          renderItem={({ item }: { item: Balance }) => (
            <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{item.symbol}</Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>{item.amount}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default PortfolioScreen;
