import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useNomadProtocols } from "../nomad";
import type { NomadProtocolHealthItem, NomadProtocolRow } from "../nomad";

const blue = "#1684ff";
const green = "#35f883";
const border = "#0a3862";
const bg = "#020812";
const muted = "#b8c3d6";

type NavItem = { label: string; icon: string; route?: string; active?: boolean };
type ResourceItem = { label: string; subtitle: string; icon: string; route?: string };

const resources: ResourceItem[] = [
  { label: "Protocol Docs", subtitle: "Learn & Explore", icon: "▤" },
  { label: "Developer Hub", subtitle: "Build on Voltaire", icon: "♙" },
  { label: "Smart Contracts", subtitle: "Audited & Verified", icon: "▧" },
  { label: "Audit Reports", subtitle: "Transparency", icon: "▥" },
  { label: "Community Forum", subtitle: "Join the Discussion", icon: "♧" },
];

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[{ borderWidth: 1, borderColor: border, borderRadius: 14, backgroundColor: "rgba(3,16,30,0.94)", overflow: "hidden" }, style]}>{children}</View>;
}

function VoltaireLogo({ size = 66 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.22, borderWidth: 3, borderColor: green, backgroundColor: "rgba(53,248,131,0.12)", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: green, fontSize: size * 0.52, fontWeight: "900" }}>V</Text>
    </View>
  );
}

function SecurePill({ status }: { status: string }) {
  const secure = status === "active";
  return (
    <View style={{ borderWidth: 1, borderColor, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 9, flexDirection: "row", alignItems: "center" }}>
      <Text style={{ color: secure ? green : "#ffcc33", fontSize: 22, marginRight: 9 }}>♢</Text>
      <View>
        <Text style={{ color: "#d7e8ff", fontSize: 13 }}>{secure ? "All Systems" : "Review"}</Text>
        <Text style={{ color: secure ? green : "#ffcc33", fontSize: 13, fontWeight: "900" }}>{secure ? "SECURE" : "DEGRADED"}</Text>
      </View>
    </View>
  );
}

function Header({ status }: { status: string }) {
  const navigation = useNavigation<any>();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
      <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12 }}><Text style={{ color: "white", fontSize: 38 }}>‹</Text></Pressable>
      <VoltaireLogo />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: "white", fontSize: 30, fontWeight: "900" }}>Voltaire Protocols</Text>
          <View style={{ marginLeft: 10, borderRadius: 7, backgroundColor: "rgba(53,248,131,0.20)", paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color: green, fontSize: 13, fontWeight: "900" }}>HUB</Text>
          </View>
        </View>
        <Text style={{ color: muted, fontSize: 14, marginTop: 4 }}>The protocols powering Nomad’s freedom layer.</Text>
      </View>
      <SecurePill status={status} />
      <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor, alignItems: "center", justifyContent: "center", marginLeft: 10 }}>
        <Text style={{ color: "#d7e8ff", fontSize: 20, fontWeight: "900" }}>?</Text>
      </View>
    </View>
  );
}

function HeroStat({ icon, label, value, note }: { icon: string; label: string; value: string; note: string }) {
  return (
    <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: "#143556", paddingHorizontal: 8 }}>
      <Text style={{ color: muted, fontSize: 12 }}>{icon}  {label}</Text>
      <Text style={{ color: "white", fontSize: 17, fontWeight: "900", marginTop: 7 }}>{value}</Text>
      <Text style={{ color: green, fontSize: 12, marginTop: 7 }}>{note}</Text>
    </View>
  );
}

function Orb({ icon, color }: { icon: string; color: string }) {
  return <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: color, backgroundColor: `${color}22`, alignItems: "center", justifyContent: "center" }}><Text style={{ color, fontSize: 21 }}>{icon}</Text></View>;
}

function ProtocolHero({ active, total, uptime, nodes, countries, status }: { active: number; total: number; uptime: string; nodes: string; countries: string; status: string }) {
  const secure = status === "active";
  return (
    <Card style={{ borderColor: secure ? "rgba(53,248,131,0.72)" : "rgba(255,204,51,0.72)", padding: 20, marginBottom: 14 }}>
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: secure ? green : "#ffcc33", fontSize: 15, fontWeight: "900" }}>PROTOCOL STATUS</Text>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "900", marginTop: 18 }}>ALL PROTOCOLS</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
            <Text style={{ color: secure ? green : "#ffcc33", fontSize: 54, fontWeight: "900" }}>{secure ? "ACTIVE" : "REVIEW"}</Text>
            <Text style={{ color: secure ? green : "#ffcc33", fontSize: 38, marginLeft: 12 }}>{secure ? "✓" : "!"}</Text>
          </View>
          <Text style={{ color: "white", fontSize: 15, marginTop: 8 }}>Decentralized. Sovereign. Interoperable.</Text>
          <View style={{ height: 1, backgroundColor: "#143556", marginVertical: 18 }} />
          <View style={{ flexDirection: "row" }}>
            <HeroStat icon="⌬" label="Protocols Active" value={`${active} / ${total}`} note={`${Math.round((active / total) * 100)}%`} />
            <HeroStat icon="◷" label="Network Uptime" value={uptime} note="30 days" />
            <HeroStat icon="◎" label="Global Nodes" value={nodes} note={`${countries} countries`} />
          </View>
        </View>
        <View style={{ width: 260, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: "rgba(53,248,131,0.35)", alignItems: "center", justifyContent: "center" }}>
            <View style={{ position: "absolute", top: 8 }}><Orb icon="♢" color={green} /></View>
            <View style={{ position: "absolute", right: 8, top: 48 }}><Orb icon="⌁" color="#00e5ff" /></View>
            <View style={{ position: "absolute", right: 26, bottom: 26 }}><Orb icon="▣" color="#00e5ff" /></View>
            <View style={{ position: "absolute", left: 18, bottom: 36 }}><Orb icon="▤" color="#ffcc33" /></View>
            <View style={{ position: "absolute", left: 12, top: 52 }}><Orb icon="♙" color="#9b4dff" /></View>
            <VoltaireLogo size={116} />
          </View>
        </View>
      </View>
    </Card>
  );
}

function ProtocolRow({ item }: { item: NomadProtocolRow }) {
  return (
    <Pressable style={{ flexDirection: "row", alignItems: "center", minHeight: 88, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: "rgba(10,56,98,0.72)", backgroundColor: "rgba(2,15,27,0.65)" }}>
      <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: `${item.color}22`, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
        <Text style={{ color: item.color, fontSize: 28, fontWeight: "900" }}>{item.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>{item.title}</Text>
        <Text style={{ color: muted, fontSize: 13, marginTop: 4 }}>{item.subtitle}</Text>
        <Text style={{ color: item.color, fontSize: 12, marginTop: 6 }}>{item.detail}</Text>
      </View>
      <View style={{ alignItems: "flex-start", width: 88 }}>
        <Text style={{ color: green, fontSize: 17, fontWeight: "900" }}>{item.uptime}</Text>
        <Text style={{ color: muted, fontSize: 12, marginTop: 4 }}>Uptime</Text>
      </View>
      <Text style={{ color: "#c7cfdf", fontSize: 28 }}>›</Text>
    </Pressable>
  );
}

function ProtocolList({ protocols }: { protocols: NomadProtocolRow[] }) {
  return (
    <Card style={{ padding: 16, marginBottom: 14 }}>
      <Text style={{ color: "white", fontSize: 18, fontWeight: "900", marginBottom: 12 }}>VOLTAIRE PROTOCOLS</Text>
      <View style={{ borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "rgba(10,56,98,0.72)" }}>
        {protocols.map((item) => <ProtocolRow key={item.title} item={item} />)}
        <Pressable style={{ height: 58, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,15,27,0.76)" }}>
          <Text style={{ color: green, fontSize: 24, marginRight: 10 }}>⌘</Text>
          <Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>View Protocol Architecture</Text>
          <Text style={{ color: "#c7cfdf", fontSize: 28, position: "absolute", right: 18 }}>›</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function HealthCard({ item }: { item: NomadProtocolHealthItem }) {
  return (
    <View style={{ flex: 1, minHeight: 104, borderWidth: 1, borderColor, borderRadius: 9, padding: 12, marginHorizontal: 5 }}>
      <Text style={{ color: muted, fontSize: 12 }}>{item.label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
        <Text style={{ color: green, fontSize: 22, marginRight: 9 }}>{item.icon}</Text>
        <Text style={{ color: "white", fontSize: item.value.length > 8 ? 15 : 20, fontWeight: "900" }}>{item.value}</Text>
      </View>
      <Text style={{ color: item.note.includes("Excellent") || item.note.includes("95") || item.note.includes("Clear") ? green : muted, fontSize: 12, marginTop: 10 }}>{item.note}</Text>
    </View>
  );
}

function NetworkHealth({ health, message }: { health: NomadProtocolHealthItem[]; message: string }) {
  return (
    <Card style={{ padding: 16, marginBottom: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>NETWORK HEALTH</Text>
        <Text style={{ color: muted, fontSize: 12 }}>Real-time</Text>
      </View>
      <View style={{ flexDirection: "row", marginHorizontal: -5 }}>{health.map((item) => <HealthCard key={item.label} item={item} />)}</View>
      <View style={{ marginTop: 14, borderWidth: 1, borderColor, borderRadius: 10, padding: 14, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: green, fontSize: 34, marginRight: 14 }}>♢</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: green, fontSize: 16, fontWeight: "900" }}>{message}</Text>
          <Text style={{ color: muted, fontSize: 12, marginTop: 5 }}>Your freedom layer is secure, decentralized, and unstoppable.</Text>
        </View>
        <Text style={{ color: green, fontSize: 16, fontWeight: "900" }}>Learn More</Text>
        <Text style={{ color: green, fontSize: 26, marginLeft: 12 }}>›</Text>
      </View>
    </Card>
  );
}

function ResourceTile({ item }: { item: ResourceItem }) {
  return (
    <Pressable style={{ flex: 1, minHeight: 100, borderWidth: 1, borderColor: "rgba(10,56,98,0.75)", padding: 12, justifyContent: "center" }}>
      <Text style={{ color: green, fontSize: 26, marginBottom: 10 }}>{item.icon}</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: "white", fontSize: 12, fontWeight: "800", flex: 1 }}>{item.label}</Text>
        <Text style={{ color: "#c7cfdf", fontSize: 22 }}>›</Text>
      </View>
      <Text style={{ color: muted, fontSize: 11, marginTop: 5 }}>{item.subtitle}</Text>
    </Pressable>
  );
}

function ToolsResources() {
  return (
    <Card style={{ padding: 16, marginBottom: 14 }}>
      <Text style={{ color: "white", fontSize: 18, fontWeight: "900", marginBottom: 14 }}>PROTOCOL TOOLS & RESOURCES</Text>
      <View style={{ flexDirection: "row", borderRadius: 10, overflow: "hidden" }}>{resources.map((item) => <ResourceTile key={item.label} item={item} />)}</View>
    </Card>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items: NavItem[] = [
    { label: "Home", icon: "⌂", route: "Portfolio" }, { label: "Wallets", icon: "▣", route: "Wallets" }, { label: "Travel", icon: "✈", route: "TravelMode" }, { label: "Protocols", icon: "V", active: true }, { label: "Settings", icon: "⚙", route: "Settings" },
  ];
  return (
    <View style={{ position: "absolute", left: 18, right: 18, bottom: 18, height: 78, borderRadius: 18, borderWidth: 1, borderColor, backgroundColor: "rgba(3,16,30,0.98)", flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
      {items.map((item) => <Pressable key={item.label} onPress={() => item.route && navigation.navigate(item.route)} style={{ alignItems: "center", flex: 1 }}><Text style={{ color: item.active ? green : "#c7cfdf", fontSize: 29, fontWeight: item.active ? "900" : "600" }}>{item.icon}</Text><Text style={{ color: item.active ? green : "#c7cfdf", marginTop: 5, fontSize: 13 }}>{item.label}</Text></Pressable>)}
    </View>
  );
}

export default function VoltaireProtocolsScreen() {
  const { protocols, error } = useNomadProtocols();
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 116 }} showsVerticalScrollIndicator={false}>
        <Header status={protocols.status} />
        {error ? <Text style={{ color: "#ff455c", marginBottom: 10 }}>{error}</Text> : null}
        <ProtocolHero active={protocols.activeProtocols} total={protocols.totalProtocols} uptime={protocols.networkUptime} nodes={protocols.globalNodes} countries={protocols.countries} status={protocols.status} />
        <ProtocolList protocols={protocols.protocols} />
        <NetworkHealth health={protocols.health} message={protocols.message} />
        <ToolsResources />
      </ScrollView>
      <BottomNav />
    </View>
  );
}
