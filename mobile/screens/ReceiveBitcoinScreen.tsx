import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

type NavItem = {
  icon: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
};

const BTC_ADDRESS = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

function Card({ children, style = {} as object }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ borderWidth: 1, borderColor: "#0a3862", backgroundColor: "rgba(3,16,30,0.96)", borderRadius: 18, padding: 18, overflow: "hidden" }, style]}>
      {children}
    </View>
  );
}

function StatusPill() {
  return (
    <View style={{ borderWidth: 1, borderColor: "#0a3862", backgroundColor: "rgba(3,16,30,0.96)", borderRadius: 30, paddingVertical: 10, paddingHorizontal: 18, flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: "#20f878", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        <Text style={{ color: "#20f878", fontSize: 18, fontWeight: "900" }}>✓</Text>
      </View>
      <View>
        <Text style={{ color: "#d7e8ff", fontSize: 13 }}>All Systems</Text>
        <Text style={{ color: "#20f878", fontSize: 15, fontWeight: "900" }}>SECURE</Text>
      </View>
    </View>
  );
}

function SegmentedTabs() {
  return (
    <View style={{ marginTop: 26, borderWidth: 1, borderColor: "#0a3862", borderRadius: 12, overflow: "hidden", flexDirection: "row", backgroundColor: "rgba(2,10,20,0.9)" }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Address tab" style={{ flex: 1, minHeight: 72, backgroundColor: "#0648ad", borderColor: "#1684ff", borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row" }}>
        <Text style={{ color: "#1684ff", fontSize: 26, fontWeight: "900", marginRight: 14 }}>▣</Text>
        <Text style={{ color: "white", fontSize: 21, fontWeight: "900" }}>Address</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="QR Code tab" style={{ flex: 1, minHeight: 72, alignItems: "center", justifyContent: "center", flexDirection: "row" }}>
        <Text style={{ color: "#b9c5d6", fontSize: 26, fontWeight: "900", marginRight: 14 }}>▦</Text>
        <Text style={{ color: "white", fontSize: 21 }}>QR Code</Text>
      </Pressable>
    </View>
  );
}

function FakeQrCode() {
  const cells = Array.from({ length: 17 * 17 }, (_, index) => {
    const row = Math.floor(index / 17);
    const col = index % 17;
    const finder =
      (row < 5 && col < 5) ||
      (row < 5 && col > 11) ||
      (row > 11 && col < 5);
    const innerFinder =
      (row > 0 && row < 4 && col > 0 && col < 4) ||
      (row > 0 && row < 4 && col > 12 && col < 16) ||
      (row > 12 && row < 16 && col > 0 && col < 4);
    const active = finder ? !innerFinder || (row % 4 === 0 || col % 4 === 0) : (row * 7 + col * 5 + row * col) % 3 !== 0;
    return <View key={index} style={{ width: 12, height: 12, backgroundColor: active ? "#020202" : "white" }} />;
  });

  return (
    <View style={{ alignSelf: "center", marginTop: 12, width: 380, height: 380, borderRadius: 15, borderWidth: 12, borderColor: "white", backgroundColor: "white", shadowColor: "#1684ff", shadowOpacity: 0.95, shadowRadius: 20, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 204, flexDirection: "row", flexWrap: "wrap" }}>{cells}</View>
      <View style={{ position: "absolute", width: 96, height: 96, borderRadius: 20, backgroundColor: "white", alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 70, height: 70, borderRadius: 18, borderWidth: 5, borderColor: "#1684ff", alignItems: "center", justifyContent: "center", backgroundColor: "#021222" }}>
          <Text style={{ color: "#1684ff", fontSize: 24, fontWeight: "900" }}>⌁</Text>
        </View>
      </View>
    </View>
  );
}

function AddressPanel() {
  return (
    <Card style={{ marginTop: 18, padding: 24 }}>
      <FakeQrCode />

      <View style={{ alignItems: "center", marginTop: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#20f878", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <Text style={{ color: "#20f878", fontWeight: "900" }}>✓</Text>
          </View>
          <Text style={{ color: "white", fontSize: 19, fontWeight: "800" }}>This is your BTC address</Text>
        </View>
        <Text style={{ color: "#b9c5d6", fontSize: 16, marginTop: 12 }}>Share this address to receive payments</Text>
      </View>

      <View style={{ marginTop: 26, borderWidth: 1, borderColor: "#0a3862", borderRadius: 13, padding: 16, backgroundColor: "rgba(1,12,25,0.7)" }}>
        <Text style={{ color: "#b9c5d6", fontSize: 15, marginBottom: 14 }}>Your Bitcoin Address</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: "white", fontSize: 20, flex: 1 }} numberOfLines={1}>{BTC_ADDRESS}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Copy bitcoin address" style={{ width: 48, height: 48, borderRadius: 9, borderWidth: 1, borderColor: "#1684ff", alignItems: "center", justifyContent: "center", marginLeft: 10 }}>
            <Text style={{ color: "#1684ff", fontSize: 28 }}>▣</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: "row", marginTop: 22, gap: 16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Share address" style={{ flex: 1, minHeight: 66, borderWidth: 1, borderColor: "#1684ff", borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row" }}>
          <Text style={{ color: "#1684ff", fontSize: 27, marginRight: 14 }}>⌯</Text>
          <Text style={{ color: "#1684ff", fontSize: 20, fontWeight: "800" }}>Share</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Copy Address" style={{ flex: 1, minHeight: 66, borderWidth: 1, borderColor: "#1684ff", borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row" }}>
          <Text style={{ color: "#1684ff", fontSize: 27, marginRight: 14 }}>▣</Text>
          <Text style={{ color: "#1684ff", fontSize: 20, fontWeight: "800" }}>Copy Address</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 24, borderWidth: 1, borderColor: "#0a3862", borderRadius: 13, padding: 18, backgroundColor: "rgba(1,12,25,0.7)", flexDirection: "row" }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: "#1684ff", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
          <Text style={{ color: "#1684ff", fontSize: 24 }}>i</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#1684ff", fontSize: 20, fontWeight: "900" }}>Important</Text>
          <Text style={{ color: "#d6dce8", fontSize: 16, lineHeight: 24, marginTop: 8 }}>Only send BTC to this address. Sending other assets may result in permanent loss.</Text>
        </View>
      </View>
    </Card>
  );
}

function TransactionHistoryCard() {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Transaction History" style={{ marginTop: 20, borderWidth: 1, borderColor: "#0a3862", backgroundColor: "rgba(3,16,30,0.96)", borderRadius: 18, padding: 22, flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 66, height: 66, borderRadius: 12, backgroundColor: "rgba(22,132,255,0.08)", borderWidth: 1, borderColor: "#0a3862", alignItems: "center", justifyContent: "center", marginRight: 18 }}>
        <Text style={{ color: "#1684ff", fontSize: 30 }}>↺</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontSize: 21, fontWeight: "900" }}>Transaction History</Text>
        <Text style={{ color: "#b9c5d6", fontSize: 16, marginTop: 6 }}>View all incoming transactions</Text>
      </View>
      <Text style={{ color: "#b9c5d6", fontSize: 38 }}>›</Text>
    </Pressable>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items: NavItem[] = [
    { icon: "⌂", label: "Home", onPress: () => navigation.navigate("Portfolio") },
    { icon: "▣", label: "Wallets", onPress: () => navigation.navigate("Wallets") },
    { icon: "✈", label: "Send", onPress: () => navigation.navigate("SendBitcoin") },
    { icon: "▦", label: "Receive", active: true },
    { icon: "⊞", label: "Travel", onPress: () => navigation.navigate("TravelMode") },
    { icon: "◇", label: "Security" },
  ];

  return (
    <View style={{ position: "absolute", left: 18, right: 18, bottom: 18, height: 82, borderRadius: 18, borderWidth: 1, borderColor: "#0a3862", backgroundColor: "rgba(3,16,30,0.99)", flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
      {items.map((item) => (
        <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={item.onPress} style={{ alignItems: "center", minWidth: 48 }}>
          <Text style={{ color: item.active ? "#1684ff" : "#b9c5d6", fontSize: 26, fontWeight: "900" }}>{item.icon}</Text>
          <Text style={{ color: item.active ? "#1684ff" : "#b9c5d6", fontSize: 12, marginTop: 4 }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const ReceiveBitcoinScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: "#020812" }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: 126 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Text style={{ color: "white", fontSize: 40, lineHeight: 44 }}>‹</Text>
            </Pressable>
            <View>
              <Text style={{ color: "white", fontSize: 29, fontWeight: "900" }}>Receive Bitcoin</Text>
              <Text style={{ color: "#d6dce8", fontSize: 16, marginTop: 4 }}>Receive BTC to your wallet</Text>
            </View>
          </View>
          <StatusPill />
          <Pressable accessibilityRole="button" accessibilityLabel="Help" style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: "#395a7d", alignItems: "center", justifyContent: "center", marginLeft: 12 }}>
            <Text style={{ color: "#d6dce8", fontSize: 23, fontWeight: "900" }}>?</Text>
          </Pressable>
        </View>

        <SegmentedTabs />
        <AddressPanel />
        <TransactionHistoryCard />
      </ScrollView>
      <BottomNav />
    </View>
  );
};

export default ReceiveBitcoinScreen;
