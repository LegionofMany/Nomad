import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useNomadSwap } from "../nomad";

type NavItem = { icon: string; label: string; active?: boolean; onPress?: () => void };
type DetailRow = { icon: string; label: string; value: string; helper?: string; showInfo?: boolean; chevron?: boolean };

function Card({ children, style = {} as object, borderColor = "#0a3862" }: { children: React.ReactNode; style?: object; borderColor?: string }) {
  return <View style={[{ borderWidth: 1, borderColor, backgroundColor: "rgba(3,16,30,0.96)", borderRadius: 18, padding: 18, overflow: "hidden" }, style]}>{children}</View>;
}

function StatusPill() {
  return (
    <View style={{ borderWidth: 1, borderColor: "#0a3862", backgroundColor: "rgba(3,16,30,0.96)", borderRadius: 30, paddingVertical: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: "#20f878", alignItems: "center", justifyContent: "center", marginRight: 12 }}><Text style={{ color: "#20f878", fontSize: 18, fontWeight: "900" }}>✓</Text></View>
      <View><Text style={{ color: "#d7e8ff", fontSize: 13 }}>All Systems</Text><Text style={{ color: "#20f878", fontSize: 15, fontWeight: "900" }}>SECURE</Text></View>
    </View>
  );
}

function CoinBadge({ symbol, tint }: { symbol: string; tint: string }) {
  return <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: tint, alignItems: "center", justifyContent: "center", marginRight: 16, shadowColor: tint, shadowOpacity: 0.75, shadowRadius: 16 }}><Text style={{ color: "white", fontSize: symbol === "₿" ? 32 : 31, fontWeight: "900" }}>{symbol}</Text></View>;
}

function PromoBanner() {
  return (
    <Card style={{ marginTop: 26, minHeight: 84, flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 122, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#1684ff", fontSize: 54, fontWeight: "900", textShadowColor: "#1684ff", textShadowRadius: 18 }}>⇄</Text></View>
      <View style={{ flex: 1 }}><Text style={{ color: "white", fontSize: 21, fontWeight: "900" }}>Best Rates. Secure. Low Fees.</Text><Text style={{ color: "#c2d0e2", fontSize: 17, marginTop: 8 }}>Powered by <Text style={{ color: "#009dff" }}>Voltaire Liquidity Protocol</Text></Text></View>
    </Card>
  );
}

function PercentButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ flex: 1, height: 43, borderWidth: 1, borderColor: "#0a3862", borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(1,12,25,0.78)", marginRight: label === "MAX" ? 0 : 10 }}><Text style={{ color: label === "MAX" ? "#1684ff" : "white", fontSize: 17, fontWeight: "900" }}>{label}</Text></Pressable>;
}

function TokenInput({ section, titleColor, balance, symbol, name, amount, usd, change, badge, tint }: { section: string; titleColor: string; balance: string; symbol: string; name: string; amount: string; usd: string; change?: string; badge: string; tint: string }) {
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}><Text style={{ color: titleColor, fontSize: 18, fontWeight: "900" }}>{section}</Text><Text style={{ color: "#b9c5d6", fontSize: 17 }}>{balance}</Text></View>
      <View style={{ minHeight: 112, borderWidth: 1, borderColor: "#0a3862", borderRadius: 14, backgroundColor: "rgba(1,12,25,0.75)", flexDirection: "row", alignItems: "center", paddingHorizontal: 14 }}>
        <CoinBadge symbol={badge} tint={tint} />
        <View style={{ flex: 1 }}><Text style={{ color: "white", fontSize: 24, fontWeight: "900" }}>{symbol} <Text style={{ color: "#9fb5cf" }}>⌄</Text></Text><Text style={{ color: "#b9c5d6", fontSize: 16, marginTop: 8 }}>{name}</Text></View>
        <View style={{ alignItems: "flex-end" }}><Text style={{ color: "white", fontSize: 38, fontWeight: "900", letterSpacing: -1 }}>{amount}</Text><Text style={{ color: "#b9c5d6", fontSize: 16, marginTop: 8 }}>≈ {usd} {change ? <Text style={{ color: "#ff4b4b" }}>{change}</Text> : null}</Text></View>
      </View>
    </View>
  );
}

function SwapPanel({ quote, refreshQuote }: { quote: ReturnType<typeof useNomadSwap>["quote"]; refreshQuote: ReturnType<typeof useNomadSwap>["refreshQuote"] }) {
  return (
    <Card borderColor="#006bd6" style={{ marginTop: 20 }}>
      <TokenInput section="1. You Pay" titleColor="#009dff" balance={quote.fromBalance} symbol={quote.fromAsset} name="Bitcoin" amount={quote.fromAmount} usd={`${quote.fromValueUsd} USD`} badge="₿" tint="#ff9f1c" />
      <View style={{ flexDirection: "row", marginTop: 14 }}>
        <PercentButton label="25%" onPress={() => { void refreshQuote("BTC", "HBAR", "0.0025"); }} />
        <PercentButton label="50%" onPress={() => { void refreshQuote("BTC", "HBAR", "0.005"); }} />
        <PercentButton label="75%" onPress={() => { void refreshQuote("BTC", "HBAR", "0.0075"); }} />
        <PercentButton label="MAX" onPress={() => { void refreshQuote("BTC", "HBAR", "0.01"); }} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 24 }}><View style={{ flex: 1, height: 1, backgroundColor: "#1684ff" }} /><View style={{ width: 58, height: 58, borderRadius: 29, marginHorizontal: 18, borderWidth: 1, borderColor: "#1684ff", backgroundColor: "rgba(0,80,170,0.55)", alignItems: "center", justifyContent: "center", shadowColor: "#1684ff", shadowOpacity: 0.9, shadowRadius: 18 }}><Text style={{ color: "#31a6ff", fontSize: 30, fontWeight: "900" }}>↕</Text></View><View style={{ flex: 1, height: 1, backgroundColor: "#1684ff" }} /></View>
      <TokenInput section="2. You Receive" titleColor="#20f878" balance={quote.toBalance} symbol={quote.toAsset} name="Hedera" amount={quote.toAmount} usd={`${quote.toValueUsd} USD`} change="(-0.84%)" badge="H" tint="#6c4dff" />
      <View style={{ marginTop: 14, minHeight: 72, borderWidth: 1, borderColor: "#0a3862", borderRadius: 13, backgroundColor: "rgba(1,12,25,0.75)", flexDirection: "row", alignItems: "center", paddingHorizontal: 18 }}>
        <View style={{ flex: 1 }}><Text style={{ color: "white", fontSize: 20, fontWeight: "800" }}>{quote.rateLabel} <Text style={{ color: "#20f878" }}>⌁</Text></Text></View>
        <View style={{ alignItems: "flex-end" }}><Text style={{ color: "#20f878", fontSize: 17, fontWeight: "900" }}>▣ Best rate</Text><Text style={{ color: "#b9c5d6", fontSize: 14, marginTop: 7 }}>Est. Price Impact</Text></View>
        <Text style={{ color: "white", fontSize: 19, marginLeft: 18 }}>{quote.priceImpact}</Text>
      </View>
    </Card>
  );
}

function DetailRowView({ row, last }: { row: DetailRow; last?: boolean }) {
  return <View><Pressable accessibilityRole="button" accessibilityLabel={row.label} style={{ minHeight: 70, flexDirection: "row", alignItems: "center", paddingVertical: 8 }}><View style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 16 }}><Text style={{ color: "#1684ff", fontSize: 30, fontWeight: "900" }}>{row.icon}</Text></View><View style={{ flex: 1 }}><Text style={{ color: "white", fontSize: 19, fontWeight: "700" }}>{row.label} {row.showInfo ? <Text style={{ color: "#b9c5d6" }}>ⓘ</Text> : null}</Text>{row.helper ? <Text style={{ color: "#b9c5d6", fontSize: 13, marginTop: 4 }}>{row.helper}</Text> : null}</View><Text style={{ color: "#dce6f2", fontSize: 18 }}>{row.value}</Text>{row.chevron ? <Text style={{ color: "#86a4c8", fontSize: 30, marginLeft: 12 }}>›</Text> : null}</Pressable>{!last ? <View style={{ height: 1, backgroundColor: "rgba(22,132,255,0.15)", marginLeft: 0 }} /> : null}</View>;
}

function SwapDetails({ quote }: { quote: ReturnType<typeof useNomadSwap>["quote"] }) {
  const rows: DetailRow[] = [
    { icon: "⇅", label: "Network", value: quote.network, chevron: true },
    { icon: "▥", label: "Network Fee", value: quote.networkFee, showInfo: true, chevron: true },
    { icon: "◷", label: "Estimated Time", value: quote.estimatedTime },
    { icon: "☷", label: "Slippage Tolerance", value: quote.slippageTolerance, showInfo: true, chevron: true },
  ];
  return <Card style={{ marginTop: 20 }}>{rows.map((row, index) => <DetailRowView key={row.label} row={row} last={index === rows.length - 1} />)}</Card>;
}

function SwapButton({ onPress, status }: { onPress: () => void; status: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Swap Now" style={{ marginTop: 20, minHeight: 96, borderRadius: 18, backgroundColor: "#0b65ff", alignItems: "center", justifyContent: "center", shadowColor: "#1684ff", shadowOpacity: 0.8, shadowRadius: 18 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}><Text style={{ color: "white", fontSize: 34, marginRight: 18 }}>⇄</Text><Text style={{ color: "white", fontSize: 27, fontWeight: "900" }}>{status === "draft_created" ? "Swap Draft Ready" : "Swap Now"}</Text></View>
      <Text style={{ color: "#dbe9ff", fontSize: 17, marginTop: 8 }}>▱ Secure & Encrypted</Text>
    </Pressable>
  );
}

function FooterTrust() {
  return <View style={{ marginTop: 24, marginBottom: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}><Text style={{ color: "#20f878", fontSize: 20, marginRight: 10 }}>▣</Text><Text style={{ color: "#b9c5d6", fontSize: 16 }}>Protected by <Text style={{ color: "#009dff" }}>Voltaire Protocols</Text>  |  Audited  •  Non-Custodial  •  Secure</Text></View>;
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items: NavItem[] = [
    { icon: "⌂", label: "Home", onPress: () => navigation.navigate("Portfolio") },
    { icon: "▣", label: "Wallets", onPress: () => navigation.navigate("Wallets") },
    { icon: "⇄", label: "Swap", active: true },
    { icon: "⊞", label: "Travel", onPress: () => navigation.navigate("TravelMode") },
    { icon: "♢", label: "Security", onPress: () => navigation.navigate("SecurityCenter") },
  ];
  return <View style={{ position: "absolute", left: 18, right: 18, bottom: 18, height: 82, borderRadius: 18, borderWidth: 1, borderColor: "#0a3862", backgroundColor: "rgba(3,16,30,0.99)", flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>{items.map((item) => <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={item.onPress} style={{ alignItems: "center", minWidth: 58 }}><Text style={{ color: item.active ? "#1684ff" : "#b9c5d6", fontSize: 28, fontWeight: "900" }}>{item.icon}</Text><Text style={{ color: item.active ? "#1684ff" : "#b9c5d6", fontSize: 12, marginTop: 4 }}>{item.label}</Text></Pressable>)}</View>;
}

export const SwapScreen = () => {
  const navigation = useNavigation<any>();
  const { quote, loading, error, refreshQuote, createDraft } = useNomadSwap();

  return (
    <View style={{ flex: 1, backgroundColor: "#020812" }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 128 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center", marginRight: 12 }}><Text style={{ color: "white", fontSize: 40, lineHeight: 44 }}>‹</Text></Pressable>
            <View><Text style={{ color: "white", fontSize: 31, fontWeight: "900" }}>Swap</Text><Text style={{ color: "#d6dce8", fontSize: 16, marginTop: 4 }}>Swap tokens instantly across chains</Text></View>
          </View>
          <StatusPill />
          <Pressable accessibilityRole="button" accessibilityLabel="Swap info" style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: "#0a3862", alignItems: "center", justifyContent: "center", marginLeft: 10 }}><Text style={{ color: "#d7e8ff", fontSize: 22, fontWeight: "900" }}>i</Text></Pressable>
        </View>
        {error ? <Text style={{ color: "#ff4b4b", marginTop: 12 }}>{error}</Text> : null}
        {loading ? <Text style={{ color: "#b9c5d6", marginTop: 12 }}>Loading best quote…</Text> : null}
        <PromoBanner />
        <SwapPanel quote={quote} refreshQuote={refreshQuote} />
        <SwapDetails quote={quote} />
        <SwapButton status={quote.status} onPress={() => { void createDraft(); }} />
        <FooterTrust />
      </ScrollView>
      <BottomNav />
    </View>
  );
};

export default SwapScreen;
