import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

const bg = "#020812";
const border = "#0a3862";
const green = "#35f883";
const muted = "#b8c3d6";
const blue = "#1684ff";
const purple = "#8b5cff";

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ borderWidth: 1, borderColor: border, borderRadius: 14, backgroundColor: "rgba(3,16,30,0.94)", overflow: "hidden" }, style]}>
      {children}
    </View>
  );
}

function CircleIcon({ icon, color = green, size = 46 }: { icon: string; color?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}20`, borderWidth: 1, borderColor: `${color}80`, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color, fontSize: size * 0.46, fontWeight: "900" }}>{icon}</Text>
    </View>
  );
}

function Header() {
  const navigation = useNavigation<any>();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
      <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
        <Text style={{ color: "white", fontSize: 40 }}>‹</Text>
      </Pressable>
      <CircleIcon icon="◷" size={56} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ color: "white", fontSize: 30, fontWeight: "900" }}>Time Clock Access</Text>
        <Text style={{ color: muted, fontSize: 14, marginTop: 4 }}>Your wallet. Your time. Your control.</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: green, fontSize: 18, fontWeight: "800", marginRight: 8 }}>Help</Text>
        <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: green, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: green, fontSize: 18, fontWeight: "900" }}>?</Text>
        </View>
      </View>
    </View>
  );
}

function ProgressStep({ label, sub, done }: { label: string; sub: string; done?: boolean }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: done ? green : "transparent", borderWidth: 2, borderColor: green, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <Text style={{ color: done ? bg : green, fontSize: 15, fontWeight: "900" }}>{done ? "✓" : "•"}</Text>
      </View>
      <Text style={{ color: "white", fontSize: 14, fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: green, fontSize: 12, marginTop: 4 }}>{sub}</Text>
    </View>
  );
}

function InfoStat({ icon, title, value }: { icon: string; title: string; value: string }) {
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 }}>
      <Text style={{ color: green, fontSize: 25, marginRight: 12 }}>{icon}</Text>
      <View>
        <Text style={{ color: "white", fontSize: 15, fontWeight: "800" }}>{title}</Text>
        <Text style={{ color: muted, fontSize: 13, marginTop: 4 }}>{value}</Text>
      </View>
    </View>
  );
}

function AccessMethod({ icon, color, title, subtitle }: { icon: string; color: string; title: string; subtitle: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(10,56,98,0.55)" }}>
      <CircleIcon icon={icon} color={color} size={48} />
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>{title}</Text>
        <Text style={{ color: muted, fontSize: 14, marginTop: 4 }}>{subtitle}</Text>
      </View>
      <Text style={{ color: "#d7e8ff", fontSize: 30 }}>›</Text>
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
    { label: "Recovery", icon: "↻", route: "RecoveryCenter", active: true },
  ];

  return (
    <View style={{ position: "absolute", left: 18, right: 18, bottom: 18, height: 78, borderRadius: 18, borderWidth: 1, borderColor, backgroundColor: "rgba(3,16,30,0.98)", flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
      {items.map((item) => (
        <Pressable key={item.label} onPress={() => item.route && navigation.navigate(item.route)} style={{ alignItems: "center", flex: 1 }}>
          <Text style={{ color: item.active ? green : "#c9d2e3", fontSize: 28 }}>{item.icon}</Text>
          <Text style={{ color: item.active ? green : "#c9d2e3", fontSize: 14, marginTop: 4 }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function TimeClockAccessScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Header />

        <Card style={{ borderColor: "#0b8f3c", backgroundColor: "rgba(2,34,24,0.65)" }}>
          <View style={{ alignItems: "center", padding: 24 }}>
            <CircleIcon icon="▣" size={56} />
            <Text style={{ color: "white", fontSize: 32, fontWeight: "900", marginTop: 16 }}>Wallet is Time Locked</Text>
            <Text style={{ color: muted, fontSize: 16, lineHeight: 22, textAlign: "center", marginTop: 10 }}>
              Your wallet is protected by the Nomad Time Set. It will unlock when the clock completes its cycle.
            </Text>

            <View style={{ width: 300, height: 300, borderRadius: 150, borderWidth: 14, borderColor: green, backgroundColor: "rgba(4,29,26,0.86)", alignItems: "center", justifyContent: "center", marginTop: 28, shadowColor: green, shadowOpacity: 0.5, shadowRadius: 24 }}>
              <Text style={{ color: green, fontSize: 14, fontWeight: "900", marginBottom: 14 }}>TIME REMAINING</Text>
              <Text style={{ color: "white", fontSize: 46, fontWeight: "900", letterSpacing: -1 }}>23:47:32</Text>
              <View style={{ flexDirection: "row", marginTop: 12 }}>
                <Text style={{ color: green, fontSize: 12, marginHorizontal: 10 }}>HOURS</Text>
                <Text style={{ color: green, fontSize: 12, marginHorizontal: 10 }}>MINUTES</Text>
                <Text style={{ color: green, fontSize: 12, marginHorizontal: 10 }}>SECONDS</Text>
              </View>
            </View>

            <Card style={{ marginTop: 22, width: "100%", backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.25)" }}>
              <View style={{ flexDirection: "row", paddingVertical: 16 }}>
                <InfoStat icon="◷" title="Time Set" value="24 Hour Cycle" />
                <InfoStat icon="▦" title="Started" value="May 19, 2025 • 10:24 AM" />
                <InfoStat icon="♢" title="Purpose" value="Wallet Access" />
              </View>
            </Card>
          </View>

          <View style={{ padding: 22, borderTopWidth: 1, borderTopColor: "rgba(53,248,131,0.22)" }}>
            <Text style={{ color: green, fontSize: 16, fontWeight: "900", marginBottom: 20 }}>TIME SET PROGRESS</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <ProgressStep label="6 Hours" sub="Completed" done />
              <ProgressStep label="12 Hours" sub="Completed" done />
              <ProgressStep label="18 Hours" sub="Completed" done />
              <ProgressStep label="24 Hours" sub="Unlock" />
            </View>
          </View>

          <Card style={{ margin: 16, marginTop: 0, padding: 18, borderColor: "rgba(10,56,98,0.8)", backgroundColor: "rgba(3,16,30,0.75)", flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "white", fontSize: 20, fontWeight: "900" }}>Need Access Now?</Text>
              <Text style={{ color: muted, fontSize: 15, lineHeight: 22, marginTop: 8 }}>You can request early access using your Owner Authority.</Text>
            </View>
            <Pressable style={{ borderWidth: 1, borderColor: green, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 14, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: green, fontSize: 15, fontWeight: "900", marginRight: 8 }}>Request Early Access</Text>
              <Text style={{ color: green, fontSize: 25 }}>›</Text>
            </Pressable>
          </Card>
        </Card>

        <Card style={{ marginTop: 18, padding: 18 }}>
          <Text style={{ color: "white", fontSize: 17, fontWeight: "900", marginBottom: 10 }}>ALTERNATE ACCESS METHODS</Text>
          <AccessMethod icon="♙" color={green} title="Owner Authority Approval" subtitle="Request approval from your Owner Authority" />
          <AccessMethod icon="⌕" color={blue} title="Emergency Access" subtitle="Use your emergency recovery method" />
          <AccessMethod icon="◷" color={purple} title="Restore from Backup" subtitle="Restore wallet using recovery backup" />
        </Card>

        <Card style={{ marginTop: 18, padding: 18, borderColor: "#0b8f3c", backgroundColor: "rgba(2,34,24,0.7)", flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: green, fontSize: 42, marginRight: 16 }}>♧</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: green, fontSize: 18, fontWeight: "900" }}>Why Time Sets?</Text>
            <Text style={{ color: muted, fontSize: 14, lineHeight: 21, marginTop: 6 }}>Time Sets protect you by preventing impulsive actions, reducing risk, and giving you full control.</Text>
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
