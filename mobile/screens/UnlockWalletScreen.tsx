import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

const bg = "#020812";
const border = "#0a3862";
const green = "#35f883";
const muted = "#b8c3d6";
const blue = "#1684ff";

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ borderWidth: 1, borderColor: border, borderRadius: 14, backgroundColor: "rgba(3,16,30,0.94)", overflow: "hidden" }, style]}>
      {children}
    </View>
  );
}

function CircleIcon({ icon, color = green, size = 48 }: { icon: string; color?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}20`, borderWidth: 1, borderColor: `${color}85`, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color, fontSize: size * 0.46, fontWeight: "900" }}>{icon}</Text>
    </View>
  );
}

function Header() {
  const navigation = useNavigation<any>();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
      <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 18 }}>
        <Text style={{ color: "white", fontSize: 40 }}>‹</Text>
      </Pressable>
      <CircleIcon icon="▣" size={56} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ color: "white", fontSize: 30, fontWeight: "900" }}>Unlock Wallet</Text>
        <Text style={{ color: muted, fontSize: 16, marginTop: 4 }}>Time Set in progress...</Text>
      </View>
      <Pressable onPress={() => navigation.navigate("RecoveryCenter")}>
        <Text style={{ color: green, fontSize: 20, fontWeight: "800" }}>Cancel</Text>
      </Pressable>
    </View>
  );
}

function TopStat({ icon, title, value }: { icon: string; title: string; value: string }) {
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", padding: 16 }}>
      <Text style={{ color: green, fontSize: 30, marginRight: 14 }}>{icon}</Text>
      <View>
        <Text style={{ color: "white", fontSize: 17, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: muted, fontSize: 15, marginTop: 5 }}>{value}</Text>
      </View>
    </View>
  );
}

function ProgressStep({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: done ? green : "transparent", borderWidth: 3, borderColor: green, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <Text style={{ color: done ? bg : active ? "white" : green, fontSize: 16, fontWeight: "900" }}>{done ? "✓" : "●"}</Text>
      </View>
      <Text style={{ color: active ? green : "white", fontSize: 13, textAlign: "center" }}>{label}</Text>
    </View>
  );
}

function DetailRow({ icon, label, value, status }: { icon: string; label: string; value: string; status?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "rgba(10,56,98,0.55)" }}>
      <Text style={{ color: green, fontSize: 24, width: 38 }}>{icon}</Text>
      <Text style={{ color: "white", fontSize: 17, flex: 1 }}>{label}</Text>
      <Text style={{ color: status ? green : muted, fontSize: 16, textAlign: "right" }}>{value}</Text>
    </View>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items = [
    { label: "Home", icon: "⌂", route: "Portfolio" },
    { label: "Wallets", icon: "▣", route: "Wallets" },
    { label: "Travel", icon: "✈", route: "TravelMode" },
    { label: "Security", icon: "♢", route: "SecurityCenter" },
    { label: "Recovery", icon: "↻", route: "RecoveryCenter" },
  ];

  return (
    <View style={{ position: "absolute", left: 18, right: 18, bottom: 18, height: 78, borderRadius: 18, borderWidth: 1, borderColor, backgroundColor: "rgba(3,16,30,0.98)", flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
      {items.map((item) => (
        <Pressable key={item.label} onPress={() => navigation.navigate(item.route)} style={{ alignItems: "center", flex: 1 }}>
          <Text style={{ color: "#c9d2e3", fontSize: 28 }}>{item.icon}</Text>
          <Text style={{ color: "#c9d2e3", fontSize: 14, marginTop: 4 }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function UnlockWalletScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Header />

        <Card style={{ marginBottom: 22, backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.18)" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TopStat icon="▦" title="Time Set" value="24 Hour Cycle" />
            <View style={{ width: 1, height: 70, backgroundColor: "rgba(255,255,255,0.1)" }} />
            <TopStat icon="" title="Started" value="May 19, 2025 • 10:24 AM" />
            <Text style={{ color: green, fontSize: 42, paddingRight: 18 }}>♢</Text>
          </View>
        </Card>

        <View style={{ alignItems: "center" }}>
          <View style={{ width: 330, height: 330, borderRadius: 165, borderWidth: 14, borderColor: green, backgroundColor: "rgba(4,29,26,0.86)", alignItems: "center", justifyContent: "center", shadowColor: green, shadowOpacity: 0.55, shadowRadius: 30 }}>
            <Text style={{ color: green, fontSize: 16, fontWeight: "900", marginBottom: 18 }}>TIME REMAINING</Text>
            <Text style={{ color: "white", fontSize: 55, fontWeight: "900", letterSpacing: -1 }}>00:00:07</Text>
            <View style={{ flexDirection: "row", marginTop: 14 }}>
              <Text style={{ color: green, fontSize: 13, marginHorizontal: 12 }}>HOURS</Text>
              <Text style={{ color: green, fontSize: 13, marginHorizontal: 12 }}>MINUTES</Text>
              <Text style={{ color: green, fontSize: 13, marginHorizontal: 12 }}>SECONDS</Text>
            </View>
          </View>

          <Text style={{ color: "white", fontSize: 34, fontWeight: "900", marginTop: 24 }}>Unlocking Wallet...</Text>
          <Text style={{ color: muted, fontSize: 18, textAlign: "center", marginTop: 10 }}>Please wait while we verify your Time Set.</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 34, marginBottom: 26 }}>
          <ProgressStep label="Time Set Verified" done />
          <ProgressStep label="Cycle Complete" done />
          <ProgressStep label="Security Check" done />
          <ProgressStep label="Unlocking Wallet" active />
        </View>

        <Card style={{ padding: 22, alignItems: "center", marginBottom: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
            <CircleIcon icon="✓" size={72} />
            <View style={{ flex: 1, marginLeft: 20 }}>
              <Text style={{ color: "white", fontSize: 30, fontWeight: "900" }}>Wallet Unlocked!</Text>
              <Text style={{ color: muted, fontSize: 17, marginTop: 8 }}>Access granted. Welcome back!</Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.12)", width: "100%", marginVertical: 18 }} />
          <Pressable onPress={() => navigation.navigate("Portfolio")} style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: green, fontSize: 20, fontWeight: "900", marginRight: 12 }}>View Wallet</Text>
            <Text style={{ color: green, fontSize: 30 }}>›</Text>
          </Pressable>
        </Card>

        <Card style={{ paddingHorizontal: 20, paddingVertical: 12, marginBottom: 18 }}>
          <Text style={{ color: "white", fontSize: 17, fontWeight: "900", marginBottom: 8 }}>DETAILS</Text>
          <DetailRow icon="▦" label="Time Set" value="24 Hour Cycle" />
          <DetailRow icon="▦" label="Started" value="May 19, 2025 • 10:24 AM" />
          <DetailRow icon="▣" label="Unlocked" value="May 20, 2025 • 10:24 AM" />
          <DetailRow icon="♢" label="Security Status" value="All Clear" status />
        </Card>

        <Card style={{ padding: 20, flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: green, fontSize: 48, marginRight: 18 }}>♢</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 16, lineHeight: 23 }}>Your wallet is protected by Nomad Time Sets.</Text>
            <Text style={{ color: muted, fontSize: 15, lineHeight: 22 }}>You're in control. Your time. Your freedom.</Text>
          </View>
          <Pressable style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: green, fontSize: 16, fontWeight: "900", marginRight: 8 }}>Learn More</Text>
            <Text style={{ color: green, fontSize: 26 }}>›</Text>
          </Pressable>
        </Card>
      </ScrollView>

      <BottomNav />
    </View>
  );
}
