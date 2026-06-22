import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

type NavItem = {
  label: string;
  icon: string;
  route?: string;
  active?: boolean;
};

type SecurityModule = {
  title: string;
  subtitle: string;
  icon: string;
};

type BackupItem = {
  title: string;
  subtitle: string;
  status: string;
  note: string;
  icon: string;
};

type ActivityItem = {
  title: string;
  subtitle: string;
  time: string;
  icon: string;
  tint: string;
};

const blue = "#1684ff";
const green = "#35f883";
const border = "#0a3862";
const muted = "#b8c3d6";
const bg = "#020812";

const modules: SecurityModule[] = [
  { title: "Secure Storage", subtitle: "Your assets are encrypted and offline", icon: "▣" },
  { title: "Owner Authority", subtitle: "You have full control of your keys", icon: "♙" },
  { title: "Device Integrity", subtitle: "This device is trusted and secure", icon: "▤" },
  { title: "Recovery Status", subtitle: "Recovery methods are set and verified", icon: "⟳" },
  { title: "Network Protection", subtitle: "Protected by Voltaire Security Layer", icon: "♢" },
];

const backups: BackupItem[] = [
  { title: "Recovery Phrase", subtitle: "12-word phrase", status: "Backed Up", note: "May 10, 2025", icon: "⚿" },
  { title: "Multi-Sig Wallet", subtitle: "2 of 3 required", status: "Active", note: "3 Signers Set", icon: "⬡" },
  { title: "Cloud Backup", subtitle: "Encrypted & Private", status: "Active", note: "Last backup: May 12, 9:20 AM", icon: "☁" },
];

const activity: ActivityItem[] = [
  { title: "Successful login on this device", subtitle: "May 12, 2025 • 9:38 AM", time: "2 min ago", icon: "♢", tint: green },
  { title: "New device authorized", subtitle: "Pixel 8 Pro • Toronto, Canada", time: "May 11", icon: "▯", tint: blue },
  { title: "Travel Pocket created", subtitle: "Japan (JPY Stable)", time: "May 10", icon: "⚑", tint: "#ffcc00" },
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

function ShieldLogo({ size = 68, color = blue }: { size?: number; color?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        borderWidth: 4,
        borderColor: color,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `${color}1f`,
      }}
    >
      <Text style={{ color, fontSize: size * 0.42, fontWeight: "900" }}>⌁</Text>
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

function ModuleRow({ item, isLast }: { item: SecurityModule; isLast?: boolean }) {
  return (
    <Pressable style={{ flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: "#092b49" }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(53,248,131,0.16)", borderWidth: 1, borderColor: "rgba(53,248,131,0.34)", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
        <Text style={{ color: green, fontSize: 25, fontWeight: "900" }}>{item.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>{item.title}</Text>
        <Text style={{ color: muted, fontSize: 14, marginTop: 4 }}>{item.subtitle}</Text>
      </View>
      <Text style={{ color: green, fontSize: 14, fontWeight: "900", marginRight: 14 }}>⊙ SECURE</Text>
      <Text style={{ color: "#c7cfdf", fontSize: 32 }}>›</Text>
    </Pressable>
  );
}

function BackupCard({ item }: { item: BackupItem }) {
  return (
    <View style={{ flex: 1, minHeight: 148, borderWidth: 1, borderColor, borderRadius: 10, marginHorizontal: 7, alignItems: "center", justifyContent: "center", padding: 12 }}>
      <Text style={{ color: blue, fontSize: 44 }}>{item.icon}</Text>
      <Text style={{ color: "white", fontSize: 16, fontWeight: "900", marginTop: 8, textAlign: "center" }}>{item.title}</Text>
      <Text style={{ color: muted, fontSize: 13, marginTop: 2, textAlign: "center" }}>{item.subtitle}</Text>
      <Text style={{ color: green, fontSize: 13, fontWeight: "900", marginTop: 12 }}>⊙ {item.status}</Text>
      <Text style={{ color: muted, fontSize: 12, marginTop: 6, textAlign: "center" }}>{item.note}</Text>
    </View>
  );
}

function ActivityRow({ item, isLast }: { item: ActivityItem; isLast?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: "#092b49" }}>
      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: `${item.tint}22`, borderWidth: 1, borderColor: `${item.tint}55`, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
        <Text style={{ color: item.tint, fontSize: 23 }}>{item.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>{item.title}</Text>
        <Text style={{ color: muted, fontSize: 13, marginTop: 4 }}>{item.subtitle}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: muted, fontSize: 14 }}>{item.time}</Text>
        <Text style={{ color: green, fontSize: 16, marginTop: 4 }}>•</Text>
      </View>
    </View>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items: NavItem[] = [
    { label: "Home", icon: "⌂", route: "Portfolio" },
    { label: "Wallets", icon: "▣", route: "Wallets" },
    { label: "Travel", icon: "✈", route: "TravelMode" },
    { label: "Security", icon: "♢", active: true },
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

export const SecurityCenterScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 22 }}>
          <ShieldLogo size={72} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: "white", fontSize: 31, fontWeight: "900" }}>Security Center</Text>
            <Text style={{ color: muted, fontSize: 16, marginTop: 5 }}>Your assets. Your keys. Your sovereignty.</Text>
          </View>
          <SecurePill />
          <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor, alignItems: "center", justifyContent: "center", marginLeft: 10 }}>
            <Text style={{ color: "#d7e8ff", fontSize: 21, fontWeight: "800" }}>?</Text>
          </View>
        </View>

        <Card style={{ borderColor: "rgba(53,248,131,0.66)", padding: 22, marginBottom: 14 }}>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: green, fontSize: 16, fontWeight: "900" }}>SECURITY STATUS</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                <Text style={{ color: green, fontSize: 48, fontWeight: "900" }}>SECURE</Text>
                <Text style={{ color: green, fontSize: 42, marginLeft: 14 }}>⊙</Text>
              </View>
              <Text style={{ color: "white", fontSize: 16, marginTop: 8 }}>All systems are operating normally</Text>
              <View style={{ height: 1, backgroundColor: "#143556", marginTop: 20, marginBottom: 16 }} />
              <View style={{ flexDirection: "row" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: muted, fontSize: 12 }}>♢  Protected Since</Text>
                  <Text style={{ color: "white", fontSize: 17, fontWeight: "800", marginTop: 10 }}>Mar 17, 2025</Text>
                  <Text style={{ color: green, fontSize: 13, marginTop: 9 }}>42 days</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: muted, fontSize: 12 }}>▣  Last Scan</Text>
                  <Text style={{ color: "white", fontSize: 17, fontWeight: "800", marginTop: 10 }}>2 min ago</Text>
                  <Text style={{ color: muted, fontSize: 12, marginTop: 9 }}>May 12, 2025 9:39 AM</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: muted, fontSize: 12 }}>Security Score</Text>
                  <Text style={{ color: "white", fontSize: 17, fontWeight: "800", marginTop: 10 }}>◯ 100/100</Text>
                  <Text style={{ color: muted, fontSize: 12, marginTop: 9 }}>Excellent</Text>
                </View>
              </View>
            </View>
            <View style={{ width: 260, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "rgba(53,248,131,0.34)", fontSize: 76 }}>◌◌◌</Text>
              <ShieldLogo size={118} color={green} />
              <Text style={{ color: "rgba(53,248,131,0.45)", fontSize: 34, marginTop: -8 }}>⌁⌁⌁</Text>
            </View>
          </View>
        </Card>

        <Card style={{ padding: 12, marginBottom: 14 }}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "900", marginBottom: 12, marginLeft: 4 }}>SECURITY MODULES</Text>
          <View style={{ borderWidth: 1, borderColor: "#092b49", borderRadius: 10, overflow: "hidden" }}>
            {modules.map((item, index) => <ModuleRow key={item.title} item={item} isLast={index === modules.length - 1} />)}
          </View>
        </Card>

        <Card style={{ padding: 18, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>RECOVERY & BACKUP</Text>
            <Text style={{ color: blue, fontSize: 16, fontWeight: "800" }}>Manage  ›</Text>
          </View>
          <View style={{ flexDirection: "row", marginHorizontal: -7 }}>
            {backups.map((item) => <BackupCard key={item.title} item={item} />)}
          </View>
        </Card>

        <Card style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>SECURITY ACTIVITY</Text>
            <Text style={{ color: blue, fontSize: 16, fontWeight: "800" }}>View All ›</Text>
          </View>
          {activity.map((item, index) => <ActivityRow key={item.title} item={item} isLast={index === activity.length - 1} />)}
        </Card>

        <Card style={{ padding: 22, flexDirection: "row", alignItems: "center" }}>
          <ShieldLogo size={58} />
          <View style={{ flex: 1, marginLeft: 18 }}>
            <Text style={{ color: "white", fontSize: 21, fontWeight: "900" }}>You are in full control.</Text>
            <Text style={{ color: muted, fontSize: 14, marginTop: 6 }}>Nomad is non-custodial. You own your keys. You own your future.</Text>
          </View>
          <Pressable style={{ borderWidth: 1, borderColor: blue, borderRadius: 8, paddingHorizontal: 22, paddingVertical: 13 }}>
            <Text style={{ color: blue, fontSize: 16, fontWeight: "800" }}>Learn More</Text>
          </Pressable>
        </Card>
      </ScrollView>
      <BottomNav />
    </View>
  );
};

export default SecurityCenterScreen;
