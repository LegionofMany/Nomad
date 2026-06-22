import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

type AssetRow = {
  name: string;
  symbol: string;
  amount: string;
  subValue: string;
  value: string;
  change: string;
  changeColor: string;
  badge: string;
  tint: string;
};

const assets: AssetRow[] = [
  { name: "Bitcoin", symbol: "BTC", amount: "0.3567", subValue: "$22,123.10", value: "$22,123.10", change: "+1.82%", changeColor: "#20f878", badge: "₿", tint: "#ff9f1c" },
  { name: "Hedera", symbol: "HBAR", amount: "3,250.00", subValue: "$1,250.25", value: "$1,250.25", change: "+2.35%", changeColor: "#20f878", badge: "H", tint: "#6c4dff" },
  { name: "XRP", symbol: "XRP", amount: "1,250.00", subValue: "$750.00", value: "$750.00", change: "+0.95%", changeColor: "#20f878", badge: "X", tint: "#151a20" },
  { name: "Stellar", symbol: "XLM", amount: "5,200.00", subValue: "$310.40", value: "$310.40", change: "+1.25%", changeColor: "#20f878", badge: "S", tint: "#1684ff" },
  { name: "XDC Network", symbol: "XDC", amount: "1,090.00", subValue: "$620.00", value: "$620.00", change: "+0.48%", changeColor: "#20f878", badge: "X", tint: "#0a5c9e" },
  { name: "Cardano", symbol: "ADA", amount: "7,200.00", subValue: "$412.70", value: "$412.70", change: "-0.32%", changeColor: "#ff4b42", badge: "✣", tint: "#2368d8" },
  { name: "Algorand", symbol: "ALGO", amount: "1,700.00", subValue: "$267.90", value: "$267.90", change: "+1.15%", changeColor: "#20f878", badge: "A", tint: "#2859b8" },
  { name: "Ethereum", symbol: "ETH", amount: "1.2500", subValue: "$2,286.35", value: "$2,286.35", change: "+1.05%", changeColor: "#20f878", badge: "♦", tint: "#5a6174" },
  { name: "USD Coin", symbol: "USDC", amount: "250.00", subValue: "$250.00", value: "$250.00", change: "0.00%", changeColor: "#d6dce8", badge: "$", tint: "#1684ff" },
  { name: "My Custom Token", symbol: "CUSTOM", amount: "12,500.00", subValue: "$52.75", value: "$52.75", change: "+3.45%", changeColor: "#20f878", badge: "◇", tint: "#079b52" },
];

function ShieldLogo() {
  return (
    <View style={{ width: 58, height: 58, borderRadius: 20, borderWidth: 5, borderColor: "#1684ff", alignItems: "center", justifyContent: "center", shadowColor: "#1684ff", shadowOpacity: 0.7, shadowRadius: 16 }}>
      <Text style={{ color: "#1684ff", fontSize: 23, fontWeight: "900" }}>⌁</Text>
    </View>
  );
}

function CircleButton({ icon, label }: { icon: string; label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: "#0a3862", backgroundColor: "rgba(4,17,31,0.95)", alignItems: "center", justifyContent: "center", marginLeft: 12 }}>
      <Text style={{ color: "#1684ff", fontSize: 31, fontWeight: "700" }}>{icon}</Text>
    </Pressable>
  );
}

function Card({ children, style = {} as object }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ borderWidth: 1, borderColor: "#0a3862", backgroundColor: "rgba(3,16,30,0.96)", borderRadius: 18, overflow: "hidden" }, style]}>
      {children}
    </View>
  );
}

function WalletHero() {
  return (
    <Card style={{ padding: 20, marginTop: 24 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#f7fbff", fontSize: 19 }}>Total Wallet Balance  ◎</Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 18 }}>
            <Text style={{ color: "white", fontSize: 48, lineHeight: 52, fontWeight: "900", letterSpacing: -1 }}>$24,832.45</Text>
            <Text style={{ color: "white", fontSize: 18, marginLeft: 9, marginBottom: 6 }}>USD</Text>
          </View>
          <Text style={{ color: "#20f878", marginTop: 14, fontSize: 18, fontWeight: "800" }}>+1.82% (24h)</Text>
        </View>
        <View style={{ width: 148, height: 120, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 110, height: 82, borderRadius: 20, borderWidth: 4, borderColor: "#0b6cff", backgroundColor: "rgba(11,108,255,0.18)", shadowColor: "#1684ff", shadowOpacity: 0.9, shadowRadius: 24, transform: [{ rotate: "2deg" }] }}>
            <View style={{ position: "absolute", left: 10, top: -14, width: 96, height: 34, borderTopLeftRadius: 17, borderTopRightRadius: 17, borderWidth: 4, borderBottomWidth: 0, borderColor: "#0b6cff", opacity: 0.7 }} />
            <View style={{ position: "absolute", right: -12, top: 30, width: 44, height: 36, borderRadius: 12, borderWidth: 4, borderColor: "#0b6cff", backgroundColor: "#041326" }} />
            <View style={{ position: "absolute", left: 37, top: 22, width: 40, height: 40, borderRadius: 12, borderWidth: 3, borderColor: "#1684ff", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#1684ff", fontWeight: "900" }}>⌁</Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

function FilterTabs() {
  const tabs = ["All Assets", "Crypto", "Stablecoins", "Tokens", "Custom"];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 20 }}>
      {tabs.map((tab, index) => (
        <Pressable key={tab} accessibilityRole="button" accessibilityLabel={tab} style={{ borderWidth: 1, borderColor: index === 0 ? "#1684ff" : "#1a2b40", backgroundColor: index === 0 ? "rgba(22,132,255,0.24)" : "rgba(8,14,24,0.9)", borderRadius: 13, paddingVertical: 14, paddingHorizontal: 25, marginRight: 14, shadowColor: index === 0 ? "#1684ff" : "transparent", shadowOpacity: 0.7, shadowRadius: 16 }}>
          <Text style={{ color: "white", fontSize: 16, fontWeight: index === 0 ? "900" : "700" }}>{tab}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function AssetBadge({ asset }: { asset: AssetRow }) {
  return (
    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: asset.tint, alignItems: "center", justifyContent: "center", marginRight: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }}>
      <Text style={{ color: "white", fontSize: asset.badge.length > 1 ? 22 : 27, fontWeight: "900" }}>{asset.badge}</Text>
    </View>
  );
}

function AssetRowView({ asset }: { asset: AssetRow }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${asset.name} wallet details`} style={{ minHeight: 82, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "rgba(22,132,255,0.14)", flexDirection: "row", alignItems: "center" }}>
      <View style={{ flex: 1.65, flexDirection: "row", alignItems: "center" }}>
        <AssetBadge asset={asset} />
        <View>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>{asset.name}</Text>
          <Text style={{ color: "#c8d4e3", fontSize: 16, marginTop: 5 }}>{asset.symbol}</Text>
        </View>
      </View>
      <View style={{ flex: 1.25 }}>
        <Text style={{ color: "white", fontSize: 19, fontWeight: "800" }}>{asset.amount}</Text>
        <Text style={{ color: "#c8d4e3", fontSize: 14, marginTop: 5 }}>{asset.subValue}</Text>
      </View>
      <View style={{ flex: 1.15, alignItems: "flex-end" }}>
        <Text style={{ color: "white", fontSize: 17 }}>{asset.value}</Text>
      </View>
      <View style={{ width: 86, alignItems: "flex-end" }}>
        <Text style={{ color: asset.changeColor, fontSize: 17 }}>{asset.change}</Text>
      </View>
      <Text style={{ color: "#1684ff", fontSize: 32, marginLeft: 12 }}>›</Text>
    </Pressable>
  );
}

function AssetsTable() {
  return (
    <Card>
      <View style={{ flexDirection: "row", paddingHorizontal: 20, paddingVertical: 15 }}>
        <Text style={{ flex: 1.65, color: "#e6eefc", fontSize: 14, fontWeight: "700" }}>Asset</Text>
        <Text style={{ flex: 1.25, color: "#b7c7dc", fontSize: 14, fontWeight: "700" }}>Balance  ↓</Text>
        <Text style={{ flex: 1.15, color: "#e6eefc", fontSize: 14, fontWeight: "700", textAlign: "right" }}>Value (USD)</Text>
        <Text style={{ width: 120, color: "#e6eefc", fontSize: 14, fontWeight: "700", textAlign: "right" }}>24h Change</Text>
      </View>
      {assets.map((asset) => <AssetRowView key={asset.symbol} asset={asset} />)}
    </Card>
  );
}

function AddCustomAsset() {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Add Custom Asset" style={{ marginTop: 20, borderWidth: 1, borderColor: "#0a3862", backgroundColor: "rgba(3,16,30,0.96)", borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 52, height: 52, borderRadius: 8, borderWidth: 1, borderStyle: "dashed", borderColor: "#1684ff", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
        <Text style={{ color: "#1684ff", fontSize: 34 }}>+</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>Add Custom Asset</Text>
        <Text style={{ color: "#c8d4e3", fontSize: 14, marginTop: 7 }}>Add tokens or assets to your wallet</Text>
      </View>
      <Text style={{ color: "#1684ff", fontSize: 32 }}>›</Text>
    </Pressable>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items = [
    { icon: "⌂", label: "Home", color: "#b9c5d6", onPress: () => navigation.navigate("Portfolio") },
    { icon: "▣", label: "Wallets", color: "#1684ff" },
    { icon: "✈", label: "Travel", color: "#b9c5d6", onPress: () => navigation.navigate("TravelMode") },
    { icon: "♢", label: "Security", color: "#b9c5d6" },
    { icon: "⚙", label: "Settings", color: "#b9c5d6" },
  ];

  return (
    <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 98, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, borderColor: "#0a3862", backgroundColor: "rgba(3,16,30,0.99)", flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
      {items.map((item) => (
        <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={item.onPress} style={{ alignItems: "center", minWidth: 58 }}>
          <Text style={{ color: item.color, fontSize: 28, fontWeight: "900" }}>{item.icon}</Text>
          <Text style={{ color: item.color, fontSize: 13, marginTop: 4 }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const WalletsScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "#020812" }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 126 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <ShieldLogo />
            <View style={{ marginLeft: 16 }}>
              <Text style={{ color: "white", fontSize: 28, fontWeight: "900" }}>Wallets</Text>
              <Text style={{ color: "#c8d4e3", fontSize: 16, marginTop: 5 }}>Manage all your digital assets</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row" }}>
            <CircleButton icon="⌕" label="Search wallets" />
            <CircleButton icon="▽" label="Filter assets" />
            <CircleButton icon="+" label="Add asset" />
          </View>
        </View>

        <WalletHero />
        <FilterTabs />
        <AssetsTable />
        <AddCustomAsset />
      </ScrollView>
      <BottomNav />
    </View>
  );
};

export default WalletsScreen;
