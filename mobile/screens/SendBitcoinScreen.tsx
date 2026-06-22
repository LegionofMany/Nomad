import React from "react";
import { ScrollView, View, Text, Pressable, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";

type NavItem = {
  icon: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
};

function Card({ children, style = {} as object }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ borderWidth: 1, borderColor: "#0a3862", backgroundColor: "rgba(3,16,30,0.96)", borderRadius: 18, padding: 18, overflow: "hidden" }, style]}>
      {children}
    </View>
  );
}

function StepTitle({ number, title }: { number: string; title: string }) {
  return <Text style={{ color: "#009dff", fontSize: 18, fontWeight: "900", marginBottom: 16 }}>{number}. {title}</Text>;
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

function CoinBadge() {
  return (
    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#ff9f1c", alignItems: "center", justifyContent: "center", marginRight: 12, shadowColor: "#ff9f1c", shadowOpacity: 0.7, shadowRadius: 12 }}>
      <Text style={{ color: "white", fontSize: 24, fontWeight: "900" }}>₿</Text>
    </View>
  );
}

function RecipientSection() {
  return (
    <Card style={{ marginTop: 24 }}>
      <StepTitle number="1" title="Recipient" />
      <View style={{ minHeight: 66, borderWidth: 1, borderColor: "#1f5f9e", borderRadius: 13, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(1,12,25,0.65)" }}>
        <TextInput
          placeholder="Bitcoin address or BlockPages name"
          placeholderTextColor="#8fa4bd"
          style={{ flex: 1, color: "white", fontSize: 18 }}
        />
        <Text style={{ color: "#1684ff", fontSize: 30, marginHorizontal: 12 }}>▣</Text>
        <Text style={{ color: "#1684ff", fontSize: 30 }}>⌗</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="My Addresses" style={{ marginTop: 16, minHeight: 68, borderWidth: 1, borderColor: "#0a3862", borderRadius: 13, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(2,13,25,0.7)" }}>
        <Text style={{ color: "#1684ff", fontSize: 30, marginRight: 16 }}>▣</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>My Addresses</Text>
          <Text style={{ color: "#b9c5d6", fontSize: 14, marginTop: 5 }}>Choose from saved addresses</Text>
        </View>
        <Text style={{ color: "#b9c5d6", fontSize: 34 }}>›</Text>
      </Pressable>
    </Card>
  );
}

function AmountSection() {
  return (
    <Card style={{ marginTop: 6 }}>
      <StepTitle number="2" title="Amount" />
      <View style={{ borderWidth: 1, borderColor: "#1f5f9e", borderRadius: 13, backgroundColor: "rgba(1,12,25,0.65)", overflow: "hidden" }}>
        <View style={{ minHeight: 92, flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <Text style={{ color: "white", fontSize: 38, fontWeight: "400" }}>0.001000</Text>
            <Text style={{ color: "#b9c5d6", fontSize: 16, marginTop: 8 }}>≈ $61.41 USD</Text>
          </View>
          <View style={{ width: 1, height: "100%", backgroundColor: "rgba(22,132,255,0.22)" }} />
          <View style={{ width: 180, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }}>
            <CoinBadge />
            <Text style={{ color: "white", fontSize: 24, fontWeight: "900" }}>BTC⌄</Text>
            <Pressable style={{ marginLeft: "auto", borderWidth: 1, borderColor: "#1684ff", borderRadius: 8, paddingVertical: 11, paddingHorizontal: 13 }}>
              <Text style={{ color: "#1684ff", fontSize: 16, fontWeight: "900" }}>MAX</Text>
            </Pressable>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: "rgba(22,132,255,0.2)" }} />
        <View style={{ minHeight: 58, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: "#b9c5d6", fontSize: 16 }}>Available Balance</Text>
          <Text style={{ color: "white", fontSize: 16 }}>0.3567 BTC ($22,123.10)</Text>
        </View>
      </View>
    </Card>
  );
}

function NetworkSection() {
  return (
    <Card style={{ marginTop: 6 }}>
      <StepTitle number="3" title="Network" />
      <Pressable accessibilityRole="button" accessibilityLabel="Bitcoin network" style={{ minHeight: 76, borderWidth: 1, borderColor: "#0a3862", borderRadius: 13, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(1,12,25,0.7)" }}>
        <CoinBadge />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "900", marginRight: 10 }}>Bitcoin</Text>
            <View style={{ borderRadius: 12, backgroundColor: "rgba(32,248,120,0.12)", paddingVertical: 4, paddingHorizontal: 8 }}>
              <Text style={{ color: "#20f878", fontSize: 12, fontWeight: "900" }}>Recommended</Text>
            </View>
          </View>
          <Text style={{ color: "#b9c5d6", fontSize: 14, marginTop: 6 }}>Secure • Fast • Low Fee</Text>
        </View>
        <Text style={{ color: "#9bb2cb", fontSize: 28 }}>⌄</Text>
      </Pressable>
    </Card>
  );
}

function FeeSection() {
  return (
    <Card style={{ marginTop: 6 }}>
      <StepTitle number="4" title="Network Fee" />
      <Pressable accessibilityRole="button" accessibilityLabel="Economy network fee" style={{ minHeight: 76, borderWidth: 1, borderColor: "#0a3862", borderRadius: 13, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(1,12,25,0.7)" }}>
        <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: "#1684ff", alignItems: "center", justifyContent: "center", marginRight: 18 }}>
          <Text style={{ color: "#1684ff", fontSize: 24, fontWeight: "900" }}>ϟ</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>Economy (Slow)</Text>
          <Text style={{ color: "#b9c5d6", fontSize: 14, marginTop: 6 }}>~1 sat/vB</Text>
        </View>
        <View style={{ alignItems: "flex-end", marginRight: 14 }}>
          <Text style={{ color: "white", fontSize: 18 }}>0.000012 BTC</Text>
          <Text style={{ color: "#b9c5d6", fontSize: 14, marginTop: 6 }}>≈ $0.73 USD</Text>
        </View>
        <Text style={{ color: "#9bb2cb", fontSize: 28 }}>⌄</Text>
      </Pressable>
    </Card>
  );
}

function SummarySection() {
  return (
    <Card style={{ marginTop: 6 }}>
      <StepTitle number="5" title="Summary" />
      <View style={{ borderWidth: 1, borderColor: "#0a3862", borderRadius: 13, padding: 18, backgroundColor: "rgba(1,12,25,0.7)" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 26 }}>
          <Text style={{ color: "#b9c5d6", fontSize: 16 }}>You are sending</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: "white", fontSize: 21 }}>0.001000 BTC</Text>
            <Text style={{ color: "#b9c5d6", marginTop: 6 }}>≈ $61.41 USD</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 18 }}>
          <Text style={{ color: "#b9c5d6", fontSize: 16 }}>Network Fee</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: "white", fontSize: 21 }}>0.000012 BTC</Text>
            <Text style={{ color: "#b9c5d6", marginTop: 6 }}>≈ $0.73 USD</Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: "rgba(22,132,255,0.18)", marginBottom: 20 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>Total</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: "white", fontSize: 28, fontWeight: "900" }}>0.001012 BTC</Text>
            <Text style={{ color: "#b9c5d6", marginTop: 6 }}>≈ $62.14 USD</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function ReviewButton() {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Review Transaction" style={{ marginTop: 18, minHeight: 94, borderRadius: 18, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", backgroundColor: "#0b65ff", shadowColor: "#1684ff", shadowOpacity: 0.8, shadowRadius: 18 }}>
      <Text style={{ color: "white", fontSize: 34, marginRight: 20 }}>✈</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }}>Review Transaction</Text>
        <Text style={{ color: "#dbe9ff", fontSize: 15, marginTop: 6 }}>Review and confirm before sending</Text>
      </View>
      <Text style={{ color: "white", fontSize: 36 }}>›</Text>
    </Pressable>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items: NavItem[] = [
    { icon: "⌂", label: "Home", onPress: () => navigation.navigate("Portfolio") },
    { icon: "▣", label: "Wallets", onPress: () => navigation.navigate("Wallets") },
    { icon: "✈", label: "Send", active: true },
    { icon: "⊞", label: "Travel", onPress: () => navigation.navigate("TravelMode") },
    { icon: "⚙", label: "Settings" },
  ];

  return (
    <View style={{ position: "absolute", left: 18, right: 18, bottom: 18, height: 82, borderRadius: 18, borderWidth: 1, borderColor: "#0a3862", backgroundColor: "rgba(3,16,30,0.99)", flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
      {items.map((item) => (
        <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={item.onPress} style={{ alignItems: "center", minWidth: 58 }}>
          <Text style={{ color: item.active ? "#1684ff" : "#b9c5d6", fontSize: 28, fontWeight: "900" }}>{item.icon}</Text>
          <Text style={{ color: item.active ? "#1684ff" : "#b9c5d6", fontSize: 12, marginTop: 4 }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const SendBitcoinScreen = () => {
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
              <Text style={{ color: "white", fontSize: 29, fontWeight: "900" }}>Send Bitcoin</Text>
              <Text style={{ color: "#d6dce8", fontSize: 16, marginTop: 4 }}>Send BTC securely to any address</Text>
            </View>
          </View>
          <StatusPill />
        </View>

        <RecipientSection />
        <AmountSection />
        <NetworkSection />
        <FeeSection />
        <SummarySection />
        <ReviewButton />
      </ScrollView>
      <BottomNav />
    </View>
  );
};

export default SendBitcoinScreen;
