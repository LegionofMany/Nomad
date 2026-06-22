import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

const blue = "#1684ff";
const green = "#35f883";
const purple = "#9b4dff";
const orange = "#ff9f1a";
const red = "#ff4058";
const border = "#0a3862";
const bg = "#020812";
const muted = "#b8c3d6";

type NavItem = { label: string; icon: string; route?: string; active?: boolean };
type Threat = { title: string; status: string; subtitle: string; icon: string; color: string };
type Exposure = { label: string; count: string; status: string; icon: string; color: string };
type Activity = { title: string; subtitle: string; time: string; status: string; icon: string; color: string };
type Tool = { title: string; subtitle: string; icon: string; color: string };

const threats: Threat[] = [
  { title: "Phishing Protection", status: "ACTIVE", subtitle: "Blocking phishing sites & scams", icon: "⌁", color: blue },
  { title: "Identity Monitoring", status: "ACTIVE", subtitle: "Monitoring your personal data", icon: "♙", color: purple },
  { title: "Data Leak Scanner", status: "ACTIVE", subtitle: "Scanning the dark web 24/7", icon: "◎", color: green },
  { title: "Malware Protection", status: "ACTIVE", subtitle: "Blocking harmful downloads", icon: "☀", color: orange },
  { title: "Social Engineering", status: "ACTIVE", subtitle: "Detecting scams & impersonation", icon: "◭", color: blue },
];

const exposures: Exposure[] = [
  { label: "Email Exposures", count: "0", status: "Resolved", icon: "✉", color: blue },
  { label: "Password Exposures", count: "0", status: "Resolved", icon: "♧", color: green },
  { label: "Phone Exposures", count: "0", status: "Resolved", icon: "▯", color: purple },
  { label: "Address Exposures", count: "0", status: "Resolved", icon: "◇", color: purple },
  { label: "Financial Exposures", count: "0", status: "Resolved", icon: "▭", color: purple },
];

const activity: Activity[] = [
  { title: "Phishing site blocked", subtitle: "nomad-fake-login.com", time: "Today, 9:41 AM", status: "Blocked", icon: "♢", color: green },
  { title: "Identity scan completed", subtitle: "No new exposures found", time: "Today, 6:30 AM", status: "All Clear", icon: "♙", color: purple },
  { title: "Suspicious email blocked", subtitle: "\"verify your account now\"", time: "Yesterday, 8:12 PM", status: "Blocked", icon: "✉", color: blue },
  { title: "Dark web scan completed", subtitle: "No leaked data found", time: "Yesterday, 3:45 PM", status: "All Clear", icon: "▤", color: orange },
];

const tools: Tool[] = [
  { title: "Secure Browser", subtitle: "Browse the web safely", icon: "◎", color: blue },
  { title: "Email Guard", subtitle: "Protect your inbox", icon: "✉", color: blue },
  { title: "Password Vault", subtitle: "Store & protect passwords", icon: "▣", color: green },
  { title: "Phone Lookup", subtitle: "Check numbers & identity", icon: "⌕", color: blue },
  { title: "Report a Scam", subtitle: "Report suspicious activity", icon: "⚑", color: red },
];

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[{ borderWidth: 1, borderColor: border, borderRadius: 14, backgroundColor: "rgba(3,16,30,0.94)", overflow: "hidden" }, style]}>{children}</View>;
}

function BPLogo({ size = 62 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.16, borderWidth: 3, borderColor: blue, backgroundColor: "rgba(22,132,255,0.14)", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "white", fontSize: size * 0.35, fontWeight: "900" }}>BP</Text>
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

function Header() {
  const navigation = useNavigation<any>();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
      <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12 }}><Text style={{ color: "white", fontSize: 38 }}>‹</Text></Pressable>
      <BPLogo />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: "white", fontSize: 27, fontWeight: "900" }}>BlockPages Safety</Text>
          <View style={{ marginLeft: 8, borderRadius: 7, backgroundColor: "rgba(22,132,255,0.22)", paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color: blue, fontSize: 12, fontWeight: "900" }}>PROTECTED</Text>
          </View>
        </View>
        <Text style={{ color: muted, fontSize: 14, marginTop: 4 }}>Your identity. Your data. Your safety online.</Text>
      </View>
      <SecurePill />
      <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor, alignItems: "center", justifyContent: "center", marginLeft: 10 }}>
        <Text style={{ color: "#d7e8ff", fontSize: 20, fontWeight: "900" }}>?</Text>
      </View>
    </View>
  );
}

function Stat({ icon, label, value, note }: { icon: string; label: string; value: string; note: string }) {
  return (
    <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: "#143556", paddingHorizontal: 8 }}>
      <Text style={{ color: muted, fontSize: 12 }}>{icon}  {label}</Text>
      <Text style={{ color: "white", fontSize: 19, fontWeight: "900", marginTop: 7 }}>{value}</Text>
      <Text style={{ color: green, fontSize: 12, marginTop: 7 }}>{note}</Text>
    </View>
  );
}

function ProtectionHero() {
  return (
    <Card style={{ borderColor: "rgba(22,132,255,0.72)", padding: 20, marginBottom: 14 }}>
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: blue, fontSize: 15, fontWeight: "900" }}>YOUR IDENTITY IS PROTECTED</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 18 }}>
            <Text style={{ color: "white", fontSize: 56, fontWeight: "900" }}>100%</Text>
            <Text style={{ color: blue, fontSize: 38, marginLeft: 12 }}>✓</Text>
          </View>
          <Text style={{ color: "white", fontSize: 16, lineHeight: 23, marginTop: 6 }}>BlockPages is actively protecting you{`\n`}across the web.</Text>
        </View>
        <View style={{ width: 250, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 188, height: 160, alignItems: "center", justifyContent: "center" }}>
            <View style={{ position: "absolute", top: 0 }}><Orb icon="◎" color={blue} /></View>
            <View style={{ position: "absolute", left: 10, top: 58 }}><Orb icon="♙" color={blue} /></View>
            <View style={{ position: "absolute", right: 10, top: 38 }}><Orb icon="✉" color={blue} /></View>
            <View style={{ position: "absolute", right: 0, bottom: 22 }}><Orb icon="⌕" color={blue} /></View>
            <BPLogo size={118} />
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", marginTop: 22 }}>
        <Stat icon="⌁" label="Threats Blocked" value="2,458" note="This Month" />
        <Stat icon="♙" label="Data Leaks Prevented" value="56" note="This Month" />
        <Stat icon="◎" label="Websites Scanned" value="1,248" note="This Month" />
        <Stat icon="▣" label="Sensitive Items Found" value="0" note="All Clear" />
      </View>
    </Card>
  );
}

function Orb({ icon, color }: { icon: string; color: string }) {
  return <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: color, backgroundColor: `${color}22`, alignItems: "center", justifyContent: "center" }}><Text style={{ color, fontSize: 21 }}>{icon}</Text></View>;
}

function ThreatCard({ item }: { item: Threat }) {
  return (
    <View style={{ flex: 1, minHeight: 150, borderWidth: 1, borderColor, borderRadius: 9, padding: 10, marginHorizontal: 4, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: `${item.color}22`, alignItems: "center", justifyContent: "center", marginBottom: 13 }}>
        <Text style={{ color: item.color, fontSize: 29 }}>{item.icon}</Text>
      </View>
      <Text style={{ color: "white", fontSize: 12, fontWeight: "800", textAlign: "center" }}>{item.title}</Text>
      <Text style={{ color: item.color, fontSize: 12, fontWeight: "900", marginTop: 7 }}>{item.status}</Text>
      <Text style={{ color: muted, fontSize: 11, textAlign: "center", marginTop: 6, lineHeight: 15 }}>{item.subtitle}</Text>
    </View>
  );
}

function ThreatProtection() {
  return (
    <Card style={{ padding: 16, marginBottom: 14 }}>
      <Text style={{ color: "white", fontSize: 18, fontWeight: "900", marginBottom: 14 }}>THREAT PROTECTION</Text>
      <View style={{ flexDirection: "row", marginHorizontal: -4 }}>{threats.map((item) => <ThreatCard key={item.title} item={item} />)}</View>
    </Card>
  );
}

function PrivacyAndExposure() {
  return (
    <View style={{ flexDirection: "row", marginBottom: 14 }}>
      <Card style={{ flex: 1, padding: 16, marginRight: 6 }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>PRIVACY SCORE</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 24 }}>
          <View style={{ width: 132, height: 132, borderRadius: 66, borderWidth: 12, borderColor: blue, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "white", fontSize: 36, fontWeight: "900" }}>96</Text>
            <Text style={{ color: muted, fontSize: 13 }}>/100</Text>
          </View>
          <View style={{ marginLeft: 22, flex: 1 }}>
            <Text style={{ color: blue, fontSize: 18, fontWeight: "900" }}>Excellent</Text>
            <Text style={{ color: muted, fontSize: 13, lineHeight: 19, marginTop: 8 }}>Your privacy posture{`\n`}is strong.</Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: "#143556", marginVertical: 20 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: blue, fontSize: 15, fontWeight: "800" }}>Improve Your Score</Text>
          <Text style={{ color: "#c7cfdf", fontSize: 28 }}>›</Text>
        </View>
      </Card>
      <Card style={{ flex: 1.38, padding: 16, marginLeft: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>EXPOSURE SUMMARY</Text>
          <Text style={{ color: blue, fontSize: 14, fontWeight: "800" }}>View Details  ›</Text>
        </View>
        {exposures.map((item) => (
          <View key={item.label} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#102b49" }}>
            <Text style={{ color: item.color, width: 30, fontSize: 21 }}>{item.icon}</Text>
            <Text style={{ color: "white", flex: 1, fontSize: 14 }}>{item.label}</Text>
            <Text style={{ color: "white", width: 28, fontSize: 14 }}>{item.count}</Text>
            <Text style={{ color: green, fontSize: 13 }}>✓ {item.status}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

function ActivityPanel() {
  return (
    <Card style={{ flex: 1.35, padding: 16, marginRight: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>RECENT ACTIVITY</Text>
        <Text style={{ color: blue, fontSize: 14, fontWeight: "800" }}>View All ›</Text>
      </View>
      {activity.map((item) => (
        <View key={item.title} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#102b49" }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${item.color}22`, alignItems: "center", justifyContent: "center", marginRight: 13 }}>
            <Text style={{ color: item.color, fontSize: 22 }}>{item.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 14, fontWeight: "800" }}>{item.title}</Text>
            <Text style={{ color: muted, fontSize: 12, marginTop: 4 }}>{item.subtitle}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: muted, fontSize: 12 }}>{item.time}</Text>
            <Text style={{ color: green, fontSize: 12, fontWeight: "900", marginTop: 8 }}>{item.status}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

function SafetyTools() {
  return (
    <Card style={{ flex: 1, padding: 16, marginLeft: 6 }}>
      <Text style={{ color: "white", fontSize: 18, fontWeight: "900", marginBottom: 12 }}>SAFETY TOOLS</Text>
      {tools.map((item) => (
        <View key={item.title} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#102b49" }}>
          <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: `${item.color}22`, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <Text style={{ color: item.color, fontSize: 21 }}>{item.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 13, fontWeight: "800" }}>{item.title}</Text>
            <Text style={{ color: muted, fontSize: 11, marginTop: 4 }}>{item.subtitle}</Text>
          </View>
          <Text style={{ color: "#c7cfdf", fontSize: 24 }}>›</Text>
        </View>
      ))}
    </Card>
  );
}

function PremiumBanner() {
  return (
    <Card style={{ padding: 20, marginBottom: 14, borderColor: "rgba(22,132,255,0.58)", flexDirection: "row", alignItems: "center" }}>
      <BPLogo size={70} />
      <View style={{ flex: 1, marginLeft: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "900" }}>BlockPages Premium</Text>
          <View style={{ marginLeft: 8, backgroundColor: "rgba(22,132,255,0.30)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 }}><Text style={{ color: blue, fontWeight: "900", fontSize: 11 }}>PRO</Text></View>
        </View>
        <Text style={{ color: muted, marginTop: 7, lineHeight: 20 }}>Advanced protection. Real-time monitoring.{`\n`}Complete peace of mind.</Text>
      </View>
      <Pressable style={{ backgroundColor: blue, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 15, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>Go Premium</Text>
        <Text style={{ color: "white", fontSize: 24, marginLeft: 12 }}>›</Text>
      </Pressable>
    </Card>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items: NavItem[] = [
    { label: "Home", icon: "⌂", route: "Portfolio" },
    { label: "Wallets", icon: "▣", route: "Wallets" },
    { label: "Travel", icon: "✈", route: "TravelMode" },
    { label: "Security", icon: "♢", route: "SecurityCenter" },
    { label: "Safety", icon: "BP", active: true },
  ];
  return (
    <View style={{ position: "absolute", left: 18, right: 18, bottom: 18, height: 78, borderRadius: 18, borderWidth: 1, borderColor, backgroundColor: "rgba(3,16,30,0.98)", flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
      {items.map((item) => (
        <Pressable key={item.label} onPress={() => item.route && navigation.navigate(item.route)} style={{ alignItems: "center", flex: 1 }}>
          <Text style={{ color: item.active ? blue : "#c7cfdf", fontSize: item.icon === "BP" ? 20 : 29, fontWeight: item.active ? "900" : "600" }}>{item.icon}</Text>
          <Text style={{ color: item.active ? blue : "#c7cfdf", marginTop: 5, fontSize: 13 }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function BlockPagesSafetyScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 116 }} showsVerticalScrollIndicator={false}>
        <Header />
        <ProtectionHero />
        <ThreatProtection />
        <PrivacyAndExposure />
        <View style={{ flexDirection: "row", marginBottom: 14 }}>
          <ActivityPanel />
          <SafetyTools />
        </View>
        <PremiumBanner />
      </ScrollView>
      <BottomNav />
    </View>
  );
}
