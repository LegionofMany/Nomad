import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type NavItem = {
  label: string;
  icon: string;
  active?: boolean;
  route?: string;
};

type EmergencyAction = {
  label: string;
  detail: string;
  icon: string;
  color: string;
};

const bg = '#020812';
const panel = 'rgba(4,18,28,0.94)';
const border = '#183242';
const green = '#20f36b';
const muted = '#b9c0cd';

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: border,
          backgroundColor: panel,
          borderRadius: 16,
          padding: 18,
          marginBottom: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function Header() {
  const navigation = useNavigation<any>();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
        <Text style={{ color: 'white', fontSize: 40 }}>‹</Text>
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 10 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: green, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: green, fontSize: 26, fontWeight: '900' }}>⌚</Text>
        </View>
        <View style={{ marginLeft: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '900' }}>Nomad Watch</Text>
            <View style={{ marginLeft: 12, borderWidth: 1, borderColor: '#147b2e', backgroundColor: 'rgba(18,90,37,0.35)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 18 }}>
              <Text style={{ color: green, fontSize: 14, fontWeight: '800' }}>● Connected</Text>
            </View>
          </View>
          <Text style={{ color: muted, fontSize: 16, marginTop: 4 }}>Your travel. Your wallet. Your watch.</Text>
        </View>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Watch settings">
        <Text style={{ color: green, fontSize: 32 }}>⚙</Text>
      </Pressable>
    </View>
  );
}

function WatchHero() {
  return (
    <Card style={{ padding: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 170, alignItems: 'center' }}>
          <View style={{ width: 126, height: 190, borderRadius: 40, backgroundColor: '#111', borderWidth: 1, borderColor: '#2a2d32', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 116, height: 116, borderRadius: 58, borderWidth: 3, borderColor: green, backgroundColor: '#020812', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: green, fontSize: 36, fontWeight: '900' }}>N</Text>
              <Text style={{ color: 'white', fontSize: 32, fontWeight: '800', marginTop: 8 }}>10:24</Text>
              <Text style={{ color: 'white', fontSize: 12 }}>AM</Text>
            </View>
          </View>
        </View>

        <View style={{ flex: 1, marginLeft: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 26, fontWeight: '900' }}>Nomad Watch 1</Text>
            <Text style={{ color: muted, fontSize: 22, marginLeft: 8 }}>✎</Text>
          </View>
          <Text style={{ color: muted, fontSize: 16, marginTop: 18 }}>Firmware v1.2.0</Text>
          <Text style={{ color: 'white', fontSize: 16, marginTop: 12 }}>Battery 87% <Text style={{ color: green }}>▰</Text></Text>
          <Text style={{ color: muted, fontSize: 16, marginTop: 12 }}>Last synced: Today, 10:24 AM</Text>

          <View style={{ flexDirection: 'row', marginTop: 28 }}>
            {[
              ['⌚', 'Find Watch', green],
              ['⟳', 'Sync Now', green],
              ['∞', 'Unpair Watch', '#ff5757'],
            ].map(([icon, label, color]) => (
              <View key={label} style={{ flex: 1, borderWidth: 1, borderColor: border, borderRadius: 13, paddingVertical: 15, alignItems: 'center', marginRight: label === 'Unpair Watch' ? 0 : 10 }}>
                <Text style={{ color, fontSize: 24 }}>{icon}</Text>
                <Text style={{ color: 'white', fontSize: 14, marginTop: 8 }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ width: 142, alignItems: 'center', marginLeft: 14 }}>
          <View style={{ width: 132, height: 132, borderRadius: 66, borderWidth: 4, borderColor: '#6ce143', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: green, fontSize: 34 }}>♢</Text>
            <Text style={{ color: '#8cff6b', textAlign: 'center', fontSize: 18, marginTop: 6 }}>All Systems</Text>
            <Text style={{ color: green, textAlign: 'center', fontSize: 18, marginTop: 2 }}>Secure</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={{ color: green, fontSize: 20, fontWeight: '900', marginBottom: 14 }}>{title}</Text>;
}

function TravelStatus() {
  const items = [
    { icon: '◎', title: 'Current Region', main: 'Europe', sub: 'France' },
    { icon: '✈', title: 'Travel Mode', main: 'Active', sub: 'Since May 18, 2025' },
    { icon: '◷', title: 'Time Set', main: 'Paris Time 3', sub: '10:24 AM Local' },
  ];
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionHeader title="TRAVEL STATUS" />
        <Text style={{ color: '#c6b5bd', fontSize: 28 }}>›</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {items.map((item) => (
          <View key={item.title} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 12 }}>
            <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(32,243,107,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#72e34b', fontSize: 30 }}>{item.icon}</Text>
            </View>
            <View style={{ marginLeft: 14 }}>
              <Text style={{ color: muted, fontSize: 14 }}>{item.title}</Text>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '800', marginTop: 4 }}>{item.main}</Text>
              <Text style={{ color: muted, fontSize: 13, marginTop: 4 }}>{item.sub}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function SecurityStatus() {
  const items = [
    ['♢', 'Device Integrity', 'Secure'],
    ['♜', 'Connection', 'Secure'],
    ['🔑', 'Time Set Lock', 'Active'],
    ['♢', 'Watch Lock', 'Enabled'],
  ];
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionHeader title="SECURITY STATUS" />
        <Text style={{ color: '#c6b5bd', fontSize: 28 }}>›</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {items.map(([icon, label, value]) => (
          <View key={label} style={{ alignItems: 'center', width: '24%' }}>
            <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(32,243,107,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#8cff6b', fontSize: 26 }}>{icon}</Text>
            </View>
            <Text style={{ color: 'white', textAlign: 'center', fontSize: 13, marginTop: 10 }}>{label}</Text>
            <Text style={{ color: green, textAlign: 'center', fontSize: 14, fontWeight: '800', marginTop: 6 }}>{value}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function TravelPocketOverview() {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: 'rgba(160,59,229,0.18)', borderWidth: 1, borderColor: '#7833a7', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#bf58ff', fontSize: 34 }}>▣</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 20 }}>
          <SectionHeader title="TRAVEL POCKET OVERVIEW" />
          <Text style={{ color: muted, fontSize: 16 }}>Travel Pocket Balance</Text>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', marginTop: 6 }}>$1,240.75 <Text style={{ fontSize: 16 }}>USD</Text></Text>
          <Text style={{ color: muted, fontSize: 15, marginTop: 4 }}>≈ 1,240.75 USDC</Text>
        </View>
        <View style={{ width: 260, borderLeftWidth: 1, borderLeftColor: border, paddingLeft: 28 }}>
          <Text style={{ color: muted, fontSize: 16 }}>Today's Spending</Text>
          <Text style={{ color: 'white', fontSize: 26, fontWeight: '900', marginTop: 6 }}>$142.30 <Text style={{ fontSize: 14 }}>USD</Text></Text>
          <View style={{ height: 7, borderRadius: 7, backgroundColor: '#30353d', marginTop: 16, overflow: 'hidden' }}>
            <View style={{ width: '37%', height: 7, borderRadius: 7, backgroundColor: '#c04dff' }} />
          </View>
          <Text style={{ color: muted, fontSize: 14, marginTop: 8 }}>Daily Limit: $500.00</Text>
        </View>
        <Text style={{ color: '#c6b5bd', fontSize: 28, marginLeft: 10 }}>›</Text>
      </View>
    </Card>
  );
}

function EmergencyActions() {
  const actions: EmergencyAction[] = [
    { label: 'Emergency Lock', detail: 'Lock wallet now', icon: '🔒', color: '#ff5757' },
    { label: 'Pause Spending', detail: 'Pause Travel Pocket', icon: 'Ⅱ', color: '#ffcc33' },
    { label: 'Alert Authority', detail: 'Notify now', icon: '🔔', color: '#31a0ff' },
    { label: 'Panic Mode', detail: 'Lock & hide wallet', icon: '♢', color: '#b454ff' },
  ];
  return (
    <Card>
      <Text style={{ color: '#ff5757', fontSize: 20, fontWeight: '900', marginBottom: 18 }}>EMERGENCY ACTIONS</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {actions.map((action) => (
          <View key={action.label} style={{ width: '23%', borderWidth: 1, borderColor: border, borderRadius: 12, padding: 15, alignItems: 'center' }}>
            <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: `${action.color}22`, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: action.color, fontSize: 28 }}>{action.icon}</Text>
            </View>
            <Text style={{ color: action.color, fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 12 }}>{action.label}</Text>
            <Text style={{ color: muted, fontSize: 12, textAlign: 'center', marginTop: 6 }}>{action.detail}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function OwnerAuthorityAlerts() {
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <SectionHeader title="OWNER AUTHORITY ALERTS" />
        <Text style={{ color: green, fontSize: 18, fontWeight: '800' }}>View All</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(32,243,107,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: green, fontSize: 36 }}>♙</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 20 }}>
          <Text style={{ color: 'white', fontSize: 21, fontWeight: '800' }}>No new alerts</Text>
          <Text style={{ color: muted, fontSize: 16, marginTop: 5 }}>All clear. You have no pending approvals or alerts.</Text>
        </View>
        <Text style={{ color: '#c6b5bd', fontSize: 32 }}>›</Text>
      </View>
    </Card>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items: NavItem[] = [
    { label: 'Home', icon: '⌂', route: 'Portfolio' },
    { label: 'Wallets', icon: '▣', route: 'Wallets' },
    { label: 'Travel', icon: '✈', route: 'TravelMode' },
    { label: 'Security', icon: '♢', route: 'SecurityCenter' },
    { label: 'Nomad Watch', icon: '⌚', active: true },
  ];
  return (
    <View style={{ position: 'absolute', left: 14, right: 14, bottom: 14, height: 82, borderRadius: 18, borderWidth: 1, borderColor: border, backgroundColor: 'rgba(3,16,24,0.98)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
      {items.map((item) => (
        <Pressable key={item.label} onPress={() => item.route && navigation.navigate(item.route)} style={{ alignItems: 'center', width: '20%' }}>
          <Text style={{ color: item.active ? green : '#d7d3df', fontSize: 28 }}>{item.icon}</Text>
          <Text style={{ color: item.active ? green : '#d7d3df', fontSize: 14, marginTop: 6 }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function NomadWatchScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Header />
        <WatchHero />
        <TravelStatus />
        <SecurityStatus />
        <TravelPocketOverview />
        <EmergencyActions />
        <OwnerAuthorityAlerts />
      </ScrollView>
      <BottomNav />
    </View>
  );
}
