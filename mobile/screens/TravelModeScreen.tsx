import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAppState } from "../state/appState";

type NavItem = {
  label: string;
  icon: string;
  route?: string;
  active?: boolean;
};

type FundingSource = {
  symbol: string;
  icon: string;
  balance: string;
  share: string;
  tint: string;
};

type Transaction = {
  merchant: string;
  meta: string;
  amount: string;
  usd: string;
  icon: string;
};

const blue = "#1684ff";
const green = "#35f883";
const border = "#0a3862";
const muted = "#b8c3d6";
const bg = "#020812";

const fundingSources: FundingSource[] = [
  { symbol: "BTC", icon: "₿", balance: "0.00421", share: "35%", tint: "#ff9900" },
  { symbol: "HBAR", icon: "H", balance: "1,250.00", share: "20%", tint: "#6b42ff" },
  { symbol: "XRP", icon: "×", balance: "950.00", share: "15%", tint: "#2c2f35" },
  { symbol: "XLM", icon: "≋", balance: "1,800.00", share: "10%", tint: "#187bff" },
  { symbol: "XDC", icon: "X", balance: "600.00", share: "10%", tint: "#005ba8" },
  { symbol: "ADA", icon: "✣", balance: "350.00", share: "5%", tint: "#246bff" },
  { symbol: "ALGO", icon: "A", balance: "250.00", share: "5%", tint: "#2e72d8" },
];

const transactions: Transaction[] = [
  { merchant: "Don Quijote Shibuya", meta: "Today • 11:23 AM", amount: "- ¥3,250", usd: "≈ $21.19 USD", icon: "▣" },
  { merchant: "JR Tokyo Station", meta: "Today • 09:45 AM", amount: "- ¥950", usd: "≈ $6.18 USD", icon: "▤" },
  { merchant: "Sushi Zanmai Ginza", meta: "Yesterday • 07:12 PM", amount: "- ¥8,600", usd: "≈ $55.92 USD", icon: "♨" },
];

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: border,
          borderRadius: 14,
          backgroundColor: "rgba(3,16,30,0.94)",
          shadowColor: blue,
          shadowOpacity: 0.2,
          shadowRadius: 12,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function ShieldLogo({ size = 68 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        borderWidth: 4,
        borderColor: blue,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(22,132,255,0.12)",
      }}
    >
      <Text style={{ color: blue, fontSize: size * 0.42, fontWeight: "900" }}>⌁</Text>
    </View>
  );
}

function SecurePill() {
  return (
    <View style={{ borderWidth: 1, borderColor, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 9, flexDirection: "row", alignItems: "center" }}>
      <Text style={{ color: green, fontSize: 22, marginRight: 9 }}>♢</Text>
      <View>
        <Text style={{ color: "#d7e8ff", fontSize: 13 }}>All Systems</Text>
        <Text style={{ color: green, fontSize: 13, fontWeight: "900" }}>SECURE</Text>
      </View>
    </View>
  );
}

function StatBox({ icon, title, value, note, progress }: { icon: string; title: string; value: string; note: string; progress?: number }) {
  return (
    <View style={{ flex: 1, minHeight: 104, borderRightWidth: 1, borderColor: "#092b49", padding: 13 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: green, fontSize: 18, marginRight: 8 }}>{icon}</Text>
        <Text style={{ color: "white", fontSize: 13 }}>{title}</Text>
      </View>
      <Text style={{ color: "white", fontSize: 26, fontWeight: "800", marginTop: 9 }}>{value}</Text>
      {progress !== undefined ? (
        <View style={{ height: 7, borderRadius: 8, backgroundColor: "rgba(53,248,131,0.18)", marginTop: 10, overflow: "hidden" }}>
          <View style={{ width: `${progress}%`, height: 7, borderRadius: 8, backgroundColor: green }} />
        </View>
      ) : null}
      <Text style={{ color: muted, marginTop: 7, fontSize: 12 }}>{note}</Text>
    </View>
  );
}

function ActionButton({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <Pressable style={{ flex: 1, minHeight: 104, marginRight: 10, borderWidth: 1, borderColor, borderRadius: 10, backgroundColor: "rgba(2,15,29,0.92)", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: blue, fontSize: 34 }}>{icon}</Text>
      <Text style={{ color: "white", fontSize: 16, fontWeight: "800", marginTop: 8, textAlign: "center" }}>{title}</Text>
      <Text style={{ color: muted, fontSize: 13, marginTop: 3, textAlign: "center" }}>{subtitle}</Text>
    </Pressable>
  );
}

function FundingSourceIcon({ source }: { source: FundingSource }) {
  return (
    <View style={{ width: 78, alignItems: "center" }}>
      <View style={{ width: 46, height: 46, borderRadius: 24, backgroundColor: source.tint, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <Text style={{ color: "white", fontSize: 24, fontWeight: "900" }}>{source.icon}</Text>
      </View>
      <Text style={{ color: "white", fontSize: 14, fontWeight: "900" }}>{source.symbol}</Text>
      <Text style={{ color: "white", fontSize: 13, marginTop: 2 }}>{source.balance}</Text>
      <Text style={{ color: muted, fontSize: 12 }}>({source.share})</Text>
    </View>
  );
}

function TransactionRow({ tx, isLast }: { tx: Transaction; isLast?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: "#092b49" }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(53,248,131,0.16)", borderWidth: 1, borderColor: "rgba(53,248,131,0.32)", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
        <Text style={{ color: green, fontSize: 22 }}>{tx.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>{tx.merchant}</Text>
        <Text style={{ color: muted, fontSize: 13, marginTop: 5 }}>{tx.meta}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: "white", fontSize: 17, fontWeight: "900" }}>{tx.amount}</Text>
        <Text style={{ color: muted, fontSize: 12, marginTop: 5 }}>{tx.usd}</Text>
      </View>
    </View>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items: NavItem[] = [
    { label: "Home", icon: "⌂", route: "Portfolio" },
    { label: "Wallets", icon: "▣", route: "Wallets" },
    { label: "Travel", icon: "✈", active: true },
    { label: "Security", icon: "♢" },
    { label: "Settings", icon: "⚙" },
  ];

  return (
    <View style={{ position: "absolute", left: 18, right: 18, bottom: 18, height: 78, borderRadius: 18, borderWidth: 1, borderColor, backgroundColor: "rgba(3,16,30,0.98)", flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
      {items.map((item) => (
        <Pressable key={item.label} onPress={() => item.route && navigation.navigate(item.route)} style={{ alignItems: "center", flex: 1 }}>
          <Text style={{ color: item.active ? blue : "#c7cfdf", fontSize: 27 }}>{item.icon}</Text>
          <Text style={{ color: item.active ? blue : "#c7cfdf", fontSize: 13, marginTop: 4 }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const TravelModeScreen = () => {
  const navigation = useNavigation<any>();
  const { travelModeEnabled } = useAppState();

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 22 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={{ marginRight: 18 }}>
            <Text style={{ color: "white", fontSize: 40 }}>‹</Text>
          </Pressable>
          <ShieldLogo size={72} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: "white", fontSize: 31, fontWeight: "900" }}>Travel Pocket</Text>
            <Text style={{ color: muted, fontSize: 16, marginTop: 5 }}>Spend stable value anywhere</Text>
          </View>
          <SecurePill />
          <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor, alignItems: "center", justifyContent: "center", marginLeft: 10 }}>
            <Text style={{ color: "#d7e8ff", fontSize: 21, fontWeight: "800" }}>?</Text>
          </View>
        </View>

        <Card style={{ borderColor: "rgba(53,248,131,0.58)", paddingTop: 22 }}>
          <View style={{ flexDirection: "row", paddingHorizontal: 22 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: green, fontSize: 14, fontWeight: "900" }}>CURRENT REGION</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                <Text style={{ color: "white", fontSize: 36, fontWeight: "900" }}>Japan 🇯🇵</Text>
                <Text style={{ color: muted, fontSize: 36, marginLeft: 8 }}>›</Text>
              </View>

              <Text style={{ color: green, fontSize: 14, fontWeight: "900", marginTop: 18 }}>SPENDING CURRENCY</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                <Text style={{ color: "white", fontSize: 35, fontWeight: "900" }}>JPY Stable</Text>
                <Text style={{ color: green, fontSize: 13, fontWeight: "900", backgroundColor: "rgba(53,248,131,0.18)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, marginLeft: 12 }}>{travelModeEnabled ? "ACTIVE" : "READY"}</Text>
              </View>
              <Text style={{ color: muted, fontSize: 16, marginTop: 7 }}>1 JPY ≈ 1 JPY Stable  ⓘ</Text>
            </View>

            <View style={{ width: 310, alignItems: "center", justifyContent: "center" }}>
              <View style={{ position: "absolute", top: 0, right: 0, borderWidth: 1, borderColor: green, backgroundColor: "rgba(53,248,131,0.14)", borderRadius: 24, paddingHorizontal: 18, paddingVertical: 9 }}>
                <Text style={{ color: green, fontSize: 17, fontWeight: "900" }}>✈  Travel Mode</Text>
              </View>
              <Text style={{ color: "rgba(53,248,131,0.36)", fontSize: 94, fontWeight: "100" }}>◌◌◌</Text>
              <Text style={{ color: green, fontSize: 56, marginTop: -70 }}>⌖</Text>
              <Text style={{ color: "rgba(53,248,131,0.48)", fontSize: 40, marginTop: -12 }}>⌁⌁⌁</Text>
            </View>
          </View>

          <View style={{ marginHorizontal: 10, marginTop: 16, borderWidth: 1, borderColor, borderRadius: 9, padding: 16 }}>
            <Text style={{ color: muted, fontSize: 15 }}>AVAILABLE BALANCE  ◎</Text>
            <Text style={{ color: "white", fontSize: 44, fontWeight: "900", marginTop: 6 }}>¥185,420</Text>
            <Text style={{ color: muted, fontSize: 16, marginTop: 3 }}>≈ $1,208.64 USD</Text>
          </View>

          <View style={{ flexDirection: "row", borderTopWidth: 1, borderColor: "#092b49" }}>
            <StatBox icon="▣" title="Daily Limit" value="¥50,000" progress={32} note="32% Used" />
            <StatBox icon="▣" title="Trip Limit" value="¥500,000" progress={37} note="37% Used" />
            <StatBox icon="▱" title="Remaining Today" value="¥33,920" note="≈ $221.25 USD" />
            <StatBox icon="◴" title="Expires" value="May 20, 2025" note="in 8 days" />
          </View>
        </Card>

        <View style={{ flexDirection: "row", marginTop: 18 }}>
          <ActionButton icon="▰" title="Pay / Spend" subtitle="Use JPY Stable" />
          <ActionButton icon="▦" title="Scan to Pay" subtitle="Merchant QR" />
          <ActionButton icon="＋" title="Top Up Pocket" subtitle="Add Funds" />
          <ActionButton icon="⌁" title="Send to Pocket" subtitle="From Wallets" />
        </View>

        <Card style={{ marginTop: 18, padding: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: "white", fontSize: 17, fontWeight: "900" }}>FUNDING SOURCES</Text>
              <Text style={{ color: muted, fontSize: 14, marginTop: 5 }}>Assets used to fund your Travel Pocket</Text>
            </View>
            <Pressable onPress={() => navigation.navigate("Wallets")} style={{ borderWidth: 1, borderColor, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
              <Text style={{ color: blue, fontSize: 15, fontWeight: "800" }}>View All Wallets  ›</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 18 }}>
            {fundingSources.map((source) => <FundingSourceIcon key={source.symbol} source={source} />)}
          </ScrollView>

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, borderWidth: 1, borderColor: border, borderRadius: 10, padding: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(53,248,131,0.16)", alignItems: "center", justifyContent: "center", marginRight: 18 }}>
              <Text style={{ color: green, fontSize: 36 }}>⇄</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>Auto-Convert & Optimize</Text>
                <Text style={{ color: green, fontSize: 12, fontWeight: "900", backgroundColor: "rgba(53,248,131,0.22)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, marginLeft: 10 }}>ON</Text>
              </View>
              <Text style={{ color: muted, fontSize: 13, marginTop: 6 }}>We automatically convert and allocate assets for best rates and lowest fees.</Text>
            </View>
            <Pressable style={{ borderWidth: 1, borderColor, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 12 }}>
              <Text style={{ color: blue, fontSize: 15, fontWeight: "900" }}>Manage  ›</Text>
            </Pressable>
          </View>
        </Card>

        <Card style={{ marginTop: 18, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ color: "white", fontSize: 17, fontWeight: "900" }}>RECENT TRANSACTIONS</Text>
            <Text style={{ color: blue, fontSize: 15, fontWeight: "800" }}>View All  ›</Text>
          </View>
          {transactions.map((tx, index) => <TransactionRow key={tx.merchant} tx={tx} isLast={index === transactions.length - 1} />)}
        </Card>

        <Card style={{ marginTop: 18, borderColor: blue, padding: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ShieldLogo size={58} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ color: "white", fontSize: 19, fontWeight: "900" }}>Nomad works in 190+ countries</Text>
              <Text style={{ color: muted, fontSize: 13, marginTop: 5 }}>Travel Pocket gives you local stability, global freedom.</Text>
            </View>
            <Text style={{ color: "rgba(22,132,255,0.52)", fontSize: 62 }}>⌁⌁</Text>
          </View>
        </Card>
      </ScrollView>
      <BottomNav />
    </View>
  );
};

export default TravelModeScreen;
