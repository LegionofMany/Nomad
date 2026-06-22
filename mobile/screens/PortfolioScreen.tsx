import React, { useMemo } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useNomadWallet } from "../nomad/hooks";
import { useAppState } from "../state/appState";

type Asset = {
  symbol: string;
  amount: string;
  value: string;
  badge: string;
  tint: string;
};

type Action = {
  label: string;
  icon: string;
  onPress?: () => void;
};

type SecurityItem = {
  label: string;
  value: string;
  icon: string;
};

type EcosystemItem = {
  label: string;
  icon: string;
  tint: string;
};

const previewAssets: Asset[] = [
  { symbol: "BTC", amount: "0.3567", value: "$22,123.10", badge: "₿", tint: "#ff9f1c" },
  { symbol: "HBAR", amount: "3,250.00", value: "$1,250.25", badge: "H", tint: "#6c4dff" },
  { symbol: "XRP", amount: "1,250.00", value: "$750.00", badge: "X", tint: "#151a20" },
  { symbol: "XLM", amount: "5,200.00", value: "$310.40", badge: "S", tint: "#1684ff" },
  { symbol: "More", amount: "", value: "", badge: "•••", tint: "#081f3d" },
];

const assetBadgeBySymbol: Record<string, { badge: string; tint: string }> = {
  BTC: { badge: "₿", tint: "#ff9f1c" },
  HBAR: { badge: "H", tint: "#6c4dff" },
  XRP: { badge: "X", tint: "#151a20" },
  XLM: { badge: "S", tint: "#1684ff" },
  ETH: { badge: "Ξ", tint: "#627eea" },
  USDC: { badge: "$", tint: "#2775ca" },
  USDT: { badge: "₮", tint: "#26a17b" },
  DAI: { badge: "D", tint: "#f5ac37" },
};

const securityItems: SecurityItem[] = [
  { label: "Secure Storage", value: "Secure", icon: "▣" },
  { label: "Owner Authority", value: "Active", icon: "✓" },
  { label: "Device Integrity", value: "Verified", icon: "▤" },
  { label: "Recovery Status", value: "Ready", icon: "↻" },
];

const ecosystem: EcosystemItem[] = [
  { label: "Nomad", icon: "ϟ", tint: "#0b84ff" },
  { label: "AutoDeFi", icon: "∞", tint: "#0b84ff" },
  { label: "BlockPages411", icon: "411", tint: "#7c4dff" },
  { label: "Sovereign\nPayroll", icon: "$", tint: "#20e86b" },
  { label: "Guardian\nTrader", icon: "♜", tint: "#20e86b" },
  { label: "Quantum\nLottery", icon: "◉", tint: "#8b5cff" },
  { label: "Decentralized\nRetirement", icon: "☼", tint: "#f5a20b" },
];

function ShieldLogo() {
  return (
    <View style={{ width: 72, height: 72, borderRadius: 22, borderWidth: 5, borderColor: "#1684ff", alignItems: "center", justifyContent: "center", shadowColor: "#1684ff", shadowOpacity: 0.7, shadowRadius: 18 }}>
      <Text style={{ color: "#1684ff", fontSize: 26, fontWeight: "900" }}>⌁</Text>
    </View>
  );
}

function Capsule({ children, borderColor = "#07375f", backgroundColor = "#031321" }: { children: React.ReactNode; borderColor?: string; backgroundColor?: string }) {
  return (
    <View style={{ borderWidth: 1, borderColor, backgroundColor, borderRadius: 28, paddingVertical: 10, paddingHorizontal: 14 }}>
      {children}
    </View>
  );
}

function Card({ children, borderColor = "#0a3862", backgroundColor = "rgba(3,16,30,0.94)", style = {} as object }: { children: React.ReactNode; borderColor?: string; backgroundColor?: string; style?: object }) {
  return (
    <View style={[{ borderWidth: 1, borderColor, backgroundColor, borderRadius: 18, padding: 18, overflow: "hidden" }, style]}>
      {children}
    </View>
  );
}

function AssetBadge({ asset }: { asset: Asset }) {
  return (
    <View style={{ alignItems: "center", width: 72 }}>
      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: asset.tint, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <Text style={{ color: "white", fontSize: asset.badge.length > 2 ? 15 : 22, fontWeight: "900" }}>{asset.badge}</Text>
      </View>
      <Text style={{ color: "#f7fbff", fontWeight: "800", fontSize: 14 }}>{asset.symbol}</Text>
      {asset.amount ? <Text style={{ color: "#f7fbff", fontSize: 13, marginTop: 4 }}>{asset.amount}</Text> : null}
      {asset.value ? <Text style={{ color: "#b9c5d6", fontSize: 12, marginTop: 4 }}>{asset.value}</Text> : null}
    </View>
  );
}

function ActionButton({ action }: { action: Action }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={action.label} onPress={action.onPress} style={{ flex: 1, minWidth: 86, height: 98, borderWidth: 1, borderColor: "#0a3862", borderRadius: 16, backgroundColor: "rgba(3,17,31,0.96)", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
      <Text style={{ color: "#1684ff", fontSize: 36, fontWeight: "900", lineHeight: 40 }}>{action.icon}</Text>
      <Text style={{ color: "#f7fbff", fontSize: 18, fontWeight: "800", marginTop: 8 }}>{action.label}</Text>
    </Pressable>
  );
}

function TravelPocketCard({ onPress }: { onPress: () => void }) {
  return (
    <Card borderColor="#0ba861" backgroundColor="rgba(0,43,27,0.9)" style={{ marginTop: 18 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 28, marginRight: 12 }}>✈</Text>
          <Text style={{ color: "#35f883", fontSize: 20, fontWeight: "900" }}>Travel Pocket</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Capsule borderColor="#0ba861" backgroundColor="rgba(0,80,45,0.45)"><Text style={{ color: "#35f883", fontWeight: "900" }}>ACTIVE</Text></Capsule>
          <Text style={{ color: "#35f883", fontSize: 24, marginLeft: 12 }}>•••</Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: "rgba(53,248,131,0.16)", marginHorizontal: -18, marginBottom: 18 }} />

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <View style={{ width: "50%", marginBottom: 16 }}>
          <Text style={{ color: "#c8d4dd", fontSize: 14 }}>Balance</Text>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "800", marginTop: 4 }}>0.021 <Text style={{ fontSize: 18 }}>BTC</Text></Text>
          <Text style={{ color: "#c8d4dd", fontSize: 14, marginTop: 6 }}>$1,312.21 USD</Text>
        </View>
        <View style={{ width: "50%", marginBottom: 16 }}>
          <Text style={{ color: "#c8d4dd", fontSize: 14 }}>Daily Limit</Text>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "800", marginTop: 4 }}>0.050 <Text style={{ fontSize: 16 }}>BTC</Text></Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
            <View style={{ height: 9, width: 68, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.13)", overflow: "hidden", marginRight: 10 }}><View style={{ width: "42%", height: "100%", backgroundColor: "#35f883" }} /></View>
            <Text style={{ color: "white" }}>42%</Text>
          </View>
        </View>
        <View style={{ width: "50%" }}>
          <Text style={{ color: "#c8d4dd", fontSize: 14 }}>Trip Limit</Text>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "800", marginTop: 4 }}>0.500 <Text style={{ fontSize: 16 }}>BTC</Text></Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
            <View style={{ height: 9, width: 68, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.13)", overflow: "hidden", marginRight: 10 }}><View style={{ width: "30%", height: "100%", backgroundColor: "#35f883" }} /></View>
            <Text style={{ color: "white" }}>30%</Text>
          </View>
        </View>
        <View style={{ width: "50%" }}>
          <Text style={{ color: "#c8d4dd", fontSize: 14 }}>Expires</Text>
          <Text style={{ color: "white", fontSize: 19, marginTop: 6 }}>May 20, 2025</Text>
        </View>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Manage Travel Pocket" onPress={onPress} style={{ marginTop: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "#35f883", fontSize: 18, fontWeight: "700" }}>Manage Travel Pocket</Text>
        <Text style={{ color: "#35f883", fontSize: 32 }}>›</Text>
      </Pressable>
    </Card>
  );
}

export const PortfolioScreen = () => {
  const navigation = useNavigation<any>();
  const { walletStatus, travelModeEnabled, lockWallet } = useAppState();
  const { totalBalance, assets: liveAssets, loading, error } = useNomadWallet();

  const displayAssets = useMemo<Asset[]>(() => {
    const mapped = liveAssets.slice(0, 4).map((asset) => {
      const visual = assetBadgeBySymbol[asset.symbol] ?? { badge: asset.symbol.slice(0, 1), tint: "#081f3d" };
      return {
        symbol: asset.symbol,
        amount: asset.balance,
        value: asset.fiatValueUsd,
        badge: visual.badge,
        tint: visual.tint,
      };
    });

    return mapped.length ? [...mapped, previewAssets[4]] : previewAssets;
  }, [liveAssets]);

  const displayBalance = liveAssets.length ? totalBalance : "$24,832.45";

  const actions: Action[] = [
    { label: "Send", icon: "↑", onPress: () => navigation.navigate("SendBitcoin") },
    { label: "Receive", icon: "↓", onPress: () => navigation.navigate("ReceiveBitcoin") },
    { label: "Swap", icon: "⇄", onPress: () => navigation.navigate("Swap") },
    { label: "Travel", icon: "▣", onPress: () => navigation.navigate("TravelMode") },
  ];

  const bottomNav = [
    ["⌂", "Home", "#1684ff", "Portfolio"],
    ["▣", "Wallets", "#b9c5d6", "Wallets"],
    ["✈", "Travel", "#b9c5d6", "TravelMode"],
    ["♢", "Security", "#b9c5d6", "SecurityCenter"],
    ["⚙", "Settings", "#b9c5d6", "Settings"],
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: "#020812" }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 116 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <ShieldLogo />
            <View style={{ marginLeft: 16 }}>
              <Text style={{ color: "white", fontSize: 31, fontWeight: "900", letterSpacing: 1 }}>NOMAD</Text>
              <Text style={{ color: "white", fontSize: 14, marginTop: 3 }}>Built on <Text style={{ color: "#1684ff" }}>Voltaire Protocols</Text></Text>
            </View>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Capsule>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: "#35f883", fontSize: 21, marginRight: 8 }}>▾</Text>
                <View>
                  <Text style={{ color: "#d7e8ff", fontSize: 13 }}>All Systems</Text>
                  <Text style={{ color: "#35f883", fontWeight: "900", fontSize: 13 }}>{walletStatus === "unlocked" ? "SECURE" : "LOCKED"}</Text>
                </View>
              </View>
            </Capsule>
          </View>
        </View>

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: "#f7fbff", fontSize: 18 }}>Total Portfolio Value  ◎</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Lock wallet" onPress={async () => { await lockWallet(); navigation.navigate("ClockUnlock"); }}>
              <Text style={{ color: "#8ba8ca", fontSize: 24 }}>⌁</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 16 }}>
            <Text style={{ color: "white", fontSize: 54, lineHeight: 58, fontWeight: "900", letterSpacing: -1 }}>{displayBalance}</Text>
            <Text style={{ color: "white", fontSize: 20, marginLeft: 10, marginBottom: 7 }}>USD</Text>
          </View>
          <Text style={{ color: loading ? "#8ba8ca" : "#35f883", marginTop: 12, fontSize: 18, fontWeight: "800" }}>{loading ? "Syncing wallet data..." : "▲ 1.82% (24h)"}</Text>
          {error ? <Text style={{ color: "#ffcf5a", marginTop: 8, fontSize: 12 }}>Preview mode: {error}</Text> : null}
          <View style={{ height: 86, marginTop: 8, alignItems: "flex-end", justifyContent: "center" }}>
            <Text style={{ color: "#1684ff", fontSize: 54, fontWeight: "200" }}>⌁⌁⌁⌁⌁</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
            {displayAssets.map((asset) => <AssetBadge key={asset.symbol} asset={asset} />)}
          </View>
        </Card>

        <Text style={{ color: "white", fontSize: 21, fontWeight: "900", marginTop: 22, marginBottom: 14 }}>Quick Actions</Text>
        <View style={{ flexDirection: "row" }}>{actions.map((action) => <ActionButton key={action.label} action={action} />)}</View>

        <TravelPocketCard onPress={() => navigation.navigate("TravelMode")} />

        <Card style={{ marginTop: 18 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open Security Center" onPress={() => navigation.navigate("SecurityCenter")} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "#1684ff", fontSize: 28, marginRight: 12 }}>♢</Text>
              <Text style={{ color: "white", fontSize: 21, fontWeight: "900" }}>Security Center</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Capsule><Text style={{ color: "#1684ff", fontWeight: "900" }}>{travelModeEnabled ? "TRAVEL" : "SECURE"}</Text></Capsule>
              <Text style={{ color: "#1684ff", fontSize: 30, marginLeft: 12 }}>›</Text>
            </View>
          </Pressable>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {securityItems.map((item) => (
              <View key={item.label} style={{ alignItems: "center", width: "24%" }}>
                <Text style={{ color: "#35f883", fontSize: 28, fontWeight: "900" }}>{item.icon}</Text>
                <Text style={{ color: "white", textAlign: "center", marginTop: 10, fontSize: 12 }}>{item.label}</Text>
                <Text style={{ color: "#35f883", textAlign: "center", marginTop: 7, fontWeight: "900", fontSize: 12 }}>{item.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={{ marginTop: 18 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open Voltaire Protocols" onPress={() => navigation.navigate("VoltaireProtocols")} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "#8b5cff", fontSize: 28, marginRight: 12 }}>♛</Text>
              <Text style={{ color: "#8b5cff", fontSize: 20, fontWeight: "900" }}>Voltaire Ecosystem</Text>
            </View>
            <Text style={{ color: "#1684ff", fontSize: 16, fontWeight: "800" }}>Explore All  ›</Text>
          </Pressable>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {ecosystem.map((item) => (
              <View key={item.label} style={{ width: 86, alignItems: "center", marginRight: 12 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: item.tint, backgroundColor: `${item.tint}33`, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <Text style={{ color: "white", fontWeight: "900", fontSize: item.icon.length > 2 ? 19 : 28 }}>{item.icon}</Text>
                </View>
                <Text style={{ color: "white", textAlign: "center", fontSize: 12, lineHeight: 16 }}>{item.label}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={{ marginTop: 16, alignSelf: "center", flexDirection: "row" }}><View style={{ width: 38, height: 4, borderRadius: 4, backgroundColor: "#1684ff" }} /><View style={{ width: 80, height: 4, borderRadius: 4, backgroundColor: "#1d2a3c", marginLeft: 6 }} /></View>
        </Card>
      </ScrollView>

      <View style={{ position: "absolute", left: 18, right: 18, bottom: 18, height: 78, borderRadius: 18, borderWidth: 1, borderColor: "#0a3862", backgroundColor: "rgba(3,16,30,0.98)", flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
        {bottomNav.map(([icon, label, color, route]) => (
          <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} onPress={() => navigation.navigate(route)} style={{ alignItems: "center", minWidth: 58 }}>
            <Text style={{ color, fontSize: 27, fontWeight: "900" }}>{icon}</Text>
            <Text style={{ color, fontSize: 12, marginTop: 4 }}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default PortfolioScreen;
