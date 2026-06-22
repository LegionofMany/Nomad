import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

const blue = "#1684ff";
const green = "#35f883";
const border = "#0a3862";
const bg = "#020812";
const muted = "#b8c3d6";
const red = "#ff455c";

type NavItem = { label: string; icon: string; route?: string; active?: boolean };
type RecoveryMethod = { title: string; subtitle: string; status: string; icon: string };
type Signer = { name: string; role: string; tag?: string; icon: string };
type RecoveryAction = { title: string; subtitle: string; icon: string };

const methods: RecoveryMethod[] = [
  { title: "Multi-Sig Recovery", subtitle: "3 of 3 required", status: "ACTIVE", icon: "♙" },
  { title: "24 Time Sets", subtitle: "Every 30 days", status: "ACTIVE", icon: "◷" },
  { title: "Owner Authority", subtitle: "You are the owner", status: "VERIFIED", icon: "♢" },
  { title: "Emergency Contacts", subtitle: "3 contacts set", status: "ACTIVE", icon: "♙♙" },
];

const deviceActions: RecoveryAction[] = [
  { title: "Device Migration", subtitle: "Move wallet to a new device", icon: "▯" },
  { title: "Export Recovery Data", subtitle: "Securely export your recovery file", icon: "⇩" },
  { title: "Recovery Test", subtitle: "Simulate recovery process", icon: "♢" },
];

const signers: Signer[] = [
  { name: "Nomad User (You)", role: "Primary signer • Verified", tag: "OWNER", icon: "♙" },
  { name: "Security Key #1", role: "Hardware signer • Verified", icon: "▣" },
  { name: "Security Key #2", role: "Hardware signer • Verified", icon: "▣" },
];

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ borderWidth: 1, borderColor: border, borderRadius: 14, backgroundColor: "rgba(3,16,30,0.94)", overflow: "hidden" }, style]}>
      {children}
    </View>
  );
}

function ShieldLogo({ size = 68, color = green, symbol = "⌁" }: { size?: number; color?: string; symbol?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.22, borderWidth: 4, borderColor: color, backgroundColor: `${color}1f`, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color, fontSize: size * 0.4, fontWeight: "900" }}>{symbol}</Text>
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
      <ShieldLogo size={66} symbol="♧" />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ color: "white", fontSize: 30, fontWeight: "900" }}>Recovery Center</Text>
        <Text style={{ color: muted, fontSize: 14, marginTop: 4 }}>Your recovery. Your control. Your peace of mind.</Text>
      </View>
      <SecurePill />
      <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor, alignItems: "center", justifyContent: "center", marginLeft: 10 }}>
        <Text style={{ color: "#d7e8ff", fontSize: 20, fontWeight: "900" }}>?</Text>
      </View>
    </View>
  );
}

function StatBlock({ icon, title, value, note }: { icon: string; title: string; value: string; note: string }) {
  return (
    <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: "#143556", paddingHorizontal: 8 }}>
      <Text style={{ color: muted, fontSize: 12 }}>{icon}  {title}</Text>
      <Text style={{ color: "white", fontSize: 16, fontWeight: "800", marginTop: 8 }}>{value}</Text>
      <Text style={{ color: note.includes("Verified") || note.includes("active") || note.includes("ago") ? muted : green, fontSize: 12, marginTop: 8 }}>{note}</Text>
    </View>
  );
}

function StatusHero() {
  return (
    <Card style={{ borderColor: "rgba(53,248,131,0.72)", padding: 20, marginBottom: 14 }}>
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: green, fontSize: 15, fontWeight: "900" }}>RECOVERY STATUS</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
            <Text style={{ color: green, fontSize: 36, fontWeight: "900" }}>FULLY PROTECTED</Text>
            <Text style={{ color: green, fontSize: 32, marginLeft: 12 }}>✓</Text>
          </View>
          <Text style={{ color: "white", fontSize: 15, marginTop: 8 }}>Your assets and keys are secure and recoverable.</Text>
          <View style={{ flexDirection: "row", marginTop: 22 }}>
            <StatBlock icon="▣" title="Recovery Setup" value="Mar 17, 2025" note="42 days ago" />
            <StatBlock icon="♙" title="Verification Status" value="Verified" note="All signers active" />
            <StatBlock icon="◷" title="Last Check" value="2 min ago" note="May 12, 9:39 AM" />
          </View>
          <Pressable style={{ borderWidth: 1, borderColor: "#1d466a", borderRadius: 8, padding: 11, marginTop: 18, flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: green, fontSize: 20, marginRight: 10 }}>▭</Text>
            <Text style={{ color: green, fontWeight: "900", marginRight: 14 }}>Recovery Guide</Text>
            <Text style={{ color: muted, flex: 1 }}>Learn how recovery works in Nomad</Text>
            <Text style={{ color: "#c7cfdf", fontSize: 28 }}>›</Text>
          </Pressable>
        </View>
        <View style={{ width: 220, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "rgba(53,248,131,0.22)", fontSize: 72 }}>◌◌◌</Text>
          <ShieldLogo size={122} symbol="✓" />
          <Text style={{ color: "rgba(53,248,131,0.4)", fontSize: 32 }}>⌁⌁⌁</Text>
        </View>
      </View>
    </Card>
  );
}

function TimeSetCard() {
  const milestones = ["6 Sets", "12 Sets", "18 Sets", "24 Sets"];
  return (
    <Card style={{ padding: 18, marginBottom: 14 }}>
      <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>24 TIME SET RECOVERY  ⓘ</Text>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
        <View style={{ width: 150, height: 150, borderRadius: 75, borderWidth: 14, borderColor: green, alignItems: "center", justifyContent: "center", marginRight: 34 }}>
          <Text style={{ color: "white", fontSize: 30, fontWeight: "900" }}>24/24</Text>
          <Text style={{ color: "white", fontSize: 14 }}>Time Sets</Text>
          <Text style={{ color: green, fontSize: 14, fontWeight: "900" }}>Complete</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            {milestones.map((item) => (
              <View key={item} style={{ alignItems: "center", flex: 1 }}>
                <Text style={{ color: green, fontSize: 28 }}>✓</Text>
                <Text style={{ color: "white", fontSize: 12, marginTop: 7 }}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={{ borderWidth: 1, borderColor: "rgba(53,248,131,0.48)", borderRadius: 10, padding: 13, marginTop: 20, flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "white", fontSize: 13 }}>Next Recommended Check</Text>
              <Text style={{ color: green, fontSize: 18, fontWeight: "900", marginTop: 5 }}>Jun 17, 2025</Text>
            </View>
            <Text style={{ color: green, fontWeight: "900" }}>Run Check Now  ›</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function MethodCard({ item }: { item: RecoveryMethod }) {
  return (
    <View style={{ flex: 1, minHeight: 130, borderWidth: 1, borderColor, borderRadius: 10, marginHorizontal: 6, padding: 12, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: green, fontSize: 34, fontWeight: "900" }}>{item.icon}</Text>
      <Text style={{ color: "white", fontSize: 14, fontWeight: "900", textAlign: "center", marginTop: 8 }}>{item.title}</Text>
      <Text style={{ color: muted, fontSize: 12, textAlign: "center", marginTop: 5 }}>{item.subtitle}</Text>
      <Text style={{ color: green, fontSize: 12, fontWeight: "900", marginTop: 8 }}>{item.status}</Text>
    </View>
  );
}

function RecoveryMethods() {
  return (
    <Card style={{ padding: 18, marginBottom: 14 }}>
      <Text style={{ color: "white", fontSize: 18, fontWeight: "900", marginBottom: 14 }}>RECOVERY METHODS</Text>
      <View style={{ flexDirection: "row", marginHorizontal: -6 }}>{methods.map((item) => <MethodCard key={item.title} item={item} />)}</View>
      <View style={{ marginTop: 14, borderWidth: 1, borderColor: "rgba(53,248,131,0.48)", borderRadius: 10, padding: 14, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(53,248,131,0.09)" }}>
        <Text style={{ color: green, fontSize: 38, marginRight: 16 }}>♢</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "white", fontSize: 17, fontWeight: "900" }}>Recovery Security Score</Text>
          <Text style={{ color: muted, fontSize: 13, marginTop: 4 }}>Excellent protection across all recovery layers</Text>
        </View>
        <Text style={{ color: "white", fontSize: 34, fontWeight: "900", marginRight: 12 }}>94</Text>
        <Text style={{ color: muted, fontSize: 12, marginRight: 18 }}>/100</Text>
        <Text style={{ color: green, fontWeight: "900", marginRight: 16 }}>Excellent</Text>
        <Text style={{ color: "#c7cfdf", fontSize: 28 }}>›</Text>
      </View>
    </Card>
  );
}

function DeviceAndEmergency() {
  return (
    <View style={{ flexDirection: "row", marginBottom: 14 }}>
      <Card style={{ flex: 1, padding: 16, marginRight: 8 }}>
        <Text style={{ color: "white", fontSize: 16, fontWeight: "900", marginBottom: 12 }}>DEVICE & RECOVERY</Text>
        {deviceActions.map((item) => (
          <Pressable key={item.title} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(53,248,131,0.13)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Text style={{ color: green, fontSize: 22 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}><Text style={{ color: "white", fontSize: 15, fontWeight: "800" }}>{item.title}</Text><Text style={{ color: muted, fontSize: 12, marginTop: 3 }}>{item.subtitle}</Text></View>
            <Text style={{ color: "#c7cfdf", fontSize: 27 }}>›</Text>
          </Pressable>
        ))}
      </Card>
      <Card style={{ flex: 1, padding: 16, marginLeft: 8 }}>
        <Text style={{ color: "white", fontSize: 16, fontWeight: "900", marginBottom: 16 }}>EMERGENCY RECOVERY</Text>
        <Pressable style={{ flexDirection: "row", alignItems: "center", marginBottom: 22 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,69,92,0.15)", borderWidth: 1, borderColor: "rgba(255,69,92,0.45)", alignItems: "center", justifyContent: "center", marginRight: 12 }}><Text style={{ color: red, fontSize: 24 }}>⚠</Text></View>
          <View style={{ flex: 1 }}><Text style={{ color: "white", fontWeight: "900", fontSize: 15 }}>Start Emergency Recovery</Text><Text style={{ color: muted, marginTop: 4, fontSize: 12 }}>Recover access to your wallet</Text></View>
          <Text style={{ color: "#c7cfdf", fontSize: 27 }}>›</Text>
        </Pressable>
        <View style={{ borderWidth: 1, borderColor: "rgba(255,69,92,0.58)", borderRadius: 8, padding: 14 }}>
          <Text style={{ color: red, fontWeight: "900", marginBottom: 8 }}>Important</Text>
          <Text style={{ color: muted, lineHeight: 20 }}>Emergency recovery requires all signers or 24 Time Set verification.</Text>
        </View>
      </Card>
    </View>
  );
}

function SignerRow({ item, isLast }: { item: Signer; isLast?: boolean }) {
  return (
    <Pressable style={{ flexDirection: "row", alignItems: "center", paddingVertical: 11, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: "#092b49" }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(53,248,131,0.13)", alignItems: "center", justifyContent: "center", marginRight: 14 }}><Text style={{ color: green, fontSize: 22 }}>{item.icon}</Text></View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}><Text style={{ color: "white", fontSize: 15, fontWeight: "800" }}>{item.name}</Text>{item.tag ? <Text style={{ color: green, fontSize: 10, fontWeight: "900", marginLeft: 10, backgroundColor: "rgba(53,248,131,0.18)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>{item.tag}</Text> : null}</View>
        <Text style={{ color: muted, fontSize: 12, marginTop: 4 }}>{item.role}</Text>
      </View>
      <Text style={{ color: green, fontSize: 13, fontWeight: "900", marginRight: 12 }}>Verified</Text><Text style={{ color: green, fontSize: 18, marginRight: 12 }}>✓</Text><Text style={{ color: "#c7cfdf", fontSize: 26 }}>›</Text>
    </Pressable>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items: NavItem[] = [
    { label: "Home", icon: "⌂", route: "Portfolio" },
    { label: "Wallets", icon: "▣", route: "Wallets" },
    { label: "Travel", icon: "✈", route: "TravelMode" },
    { label: "Security", icon: "♢", route: "SecurityCenter" },
    { label: "Recovery", icon: "⟳", active: true },
  ];
  return (
    <View style={{ position: "absolute", left: 18, right: 18, bottom: 18, height: 78, borderRadius: 18, borderWidth: 1, borderColor, backgroundColor: "rgba(3,16,30,0.98)", flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
      {items.map((item) => <Pressable key={item.label} onPress={() => item.route && navigation.navigate(item.route)} style={{ alignItems: "center", flex: 1 }}><Text style={{ color: item.active ? green : "#c7cfdf", fontSize: 27 }}>{item.icon}</Text><Text style={{ color: item.active ? green : "#c7cfdf", fontSize: 13, marginTop: 4 }}>{item.label}</Text></Pressable>)}
    </View>
  );
}

export const RecoveryCenterScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Header />
        <StatusHero />
        <TimeSetCard />
        <RecoveryMethods />
        <DeviceAndEmergency />
        <Card style={{ paddingHorizontal: 18, paddingVertical: 12, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>RECOVERY SIGNERS (3 OF 3 REQUIRED)</Text>
            <Text style={{ color: green, fontSize: 15, fontWeight: "800" }}>Manage Signers  ›</Text>
          </View>
          {signers.map((item, index) => <SignerRow key={item.name} item={item} isLast={index === signers.length - 1} />)}
        </Card>
        <Card style={{ borderColor: "rgba(53,248,131,0.66)", padding: 18, flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <ShieldLogo size={58} color={green} symbol="▣" />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>Your recovery is in your control.</Text>
            <Text style={{ color: muted, fontSize: 13, marginTop: 6 }}>Nomad is non-custodial. No one can recover your wallet except you.</Text>
          </View>
          <Text style={{ color: green, fontSize: 15, fontWeight: "900" }}>Learn More  ›</Text>
        </Card>
      </ScrollView>
      <BottomNav />
    </View>
  );
};

export default RecoveryCenterScreen;
