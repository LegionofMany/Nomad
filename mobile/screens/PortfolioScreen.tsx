/**
 * Mobile (Expo) screen
 *
 * Expo-ready. Keep this file at `mobile/screens/PortfolioScreen.tsx` when
 * moving the UI into an Expo app. Do not change UI logic — only update
 * relative imports if you move the file inside a different folder.
 */

import React from "react";
import { View, Text, FlatList } from "react-native";
import { Region, resolvePreferredStablecoin } from "../travelMode";
import { useTheme } from "../theme";

export type Balance = {
  symbol: string;
  amount: number;
  fiatApproxUSD: number;
};

export const PortfolioScreen = ({
  balances,
  region,
}: {
  balances: Balance[];
  region: Region;
}) => {
  const colors = useTheme();
  const balanceMap = Object.fromEntries(balances.map(b => [b.symbol, b.amount]));
  const preferred = resolvePreferredStablecoin(region, balanceMap);

  const ordered = [...balances].sort((a, b) => {
    if (a.symbol === preferred) return -1;
    if (b.symbol === preferred) return 1;
    return b.fiatApproxUSD - a.fiatApproxUSD;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 12 }}>Portfolio</Text>
      <FlatList
        accessibilityRole="list"
        data={ordered}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{item.symbol}</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>{item.amount}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default PortfolioScreen;
