import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadWatch } from '../nomad';
import type { NomadWatchEmergencyAction, NomadWatchState } from '../nomad';

type NavItem = { label: string; icon: string; active?: boolean; route?: string };
type EmergencyAction = { label: string; detail: string; icon: string; color: string; action: NomadWatchEmergencyAction };

const bg = '#020812';
const panel = 'rgba(4,18,28,0.94)';
const border = '#183242';
const green = '#20f36b';
const muted = '#b9c0cd';

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[{ borderWidth: 1, borderColor: border, backgroundColor: panel, borderRadius: 16, padding: 18, marginBottom: 16 }, style]}>{children}</View>;
}

function Header({ connected }: { connected: boolean }) {
  const navigation = useNavigation<any>();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back"><Text style={{ color: 'white', fontSize: 40 }}>‹</Text></Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 10 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: green, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: green, fontSize: 26, fontWeight: '900' }}>⌚</Text></View>
        <View style={{ marginLeft: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '900' }}>Nomad Watch</Text>
            <View style={{ marginLeft: 12, borderWidth: 1, borderColor: connected ? '#147b2e' : '#754a18', backgroundColor: connected ? 'rgba(18,90,37,0.35)' : 'rgba(117,74,24,0.35)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 18 }}>
              <Text style={{ color: connected ? green : '#ffcc33', fontSize: 14, fontWeight: '800' }}>{connected ? '● Connected' : '● Ready'}</Text>
            </View>
          </View>
          <Text style={{ color: muted, fontSize: 16, marginTop: 4 }}>Your travel. Your wallet. Your watch.</Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Watch settings"><Text style={{ color: green, fontSize: 32 }}>⚙</Text></Pressable>
    </View>
  );
}

function WatchHero({ watch, onSync }: { watch: NomadWatchState; onSync: () => void }) {
  const secure = watch.securityStatus === 'secure';
  return (
    <Card style={{ padding: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 170, alignItems: 'center' }}>
          <View style={{ width: 126, height: 190, borderRadius: 40, backgroundColor: '#111', borderWidth: 1, borderColor: '#2a2d32', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 116, height: 116, borderRadius: 58, borderWidth: 3, borderColor: green, backgroundColor: '#020812', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: green, fontSize: 36, fontWeight: '900' }}>N</Text>
              <Text style={{ color: 'white', fontSize: 32, fontWeight: '800', marginTop: 8 }}>{watch.lastSyncedLabel}</Text>
              <Text style={{ color: 'white', fontSize: 12 }}>SYNC</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, marginLeft: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ color: 'white', fontSize: 26, fontWeight: '900' }}>{watch.deviceName}</Text><Text style={{ color: muted, fontSize: 22, marginLeft: 8 }}>✎</Text></View>
          <Text style={{ color: muted, fontSize: 16, marginTop: 18 }}>Firmware {watch.firmware}</Text>
          <Text style={{ color: 'white', fontSize: 16, marginTop: 12 }}>Battery {watch.batteryPercent}% <Text style={{ color: green }}>▰</Text></Text>
          <Text style={{ color: muted, fontSize: 16, marginTop: 12 }}>Last synced: {watch.lastSyncedLabel}</Text>
          <View style={{ flexDirection: 'row', marginTop: 28 }}>
            {[
              ['⌚', 'Find Watch', green, undefined],
              ['⟳', 'Sync Now', green, onSync],
              ['∞', 'Unpair Watch', '#ff5757', undefined],
            ].map(([icon, label, color, handler]) => (
              <Pressable key={String(label)} onPress={typeof handler === 'function' ? handler : undefined} style={{ flex: 1, borderWidth: 1, borderColor: border, borderRadius: 13, paddingVertical: 15, alignItems: 'center', marginRight: label === 'Unpair Watch' ? 0 : 10 }}>
                <Text style={{ color: String(color), fontSize: 24 }}>{String(icon)}</Text><Text style={{ color: 'white', fontSize: 14, marginTop: 8 }}>{String(label)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ width: 142, alignItems: 'center', marginLeft: 14 }}>
          <View style={{ width: 132, height: 132, borderRadius: 66, borderWidth: 4, borderColor: secure ? '#6ce143' : '#ffcc33', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: secure ? green : '#ffcc33', fontSize: 34 }}>♢</Text>
            <Text style={{ color: secure ? '#8cff6b' : '#ffcc33', textAlign: 'center', fontSize: 18, marginTop: 6 }}>All Systems</Text>
            <Text style={{ color: secure ? green : '#ffcc33', textAlign: 'center', fontSize: 18, marginTop: 2 }}>{secure ? 'Secure' : 'Review'}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function SectionHeader({ title }: { title: string }) { return <Text style={{ color: green, fontSize: 20, fontWeight: '900', marginBottom: 14 }}>{title}</Text>; }

function TravelStatus({ watch }: { watch: NomadWatchState }) {
  const items = [
    { icon: '◎', title: 'Current Region', main: watch.travelRegion, sub: watch.travelSubregion },
    { icon: '✈', title: 'Travel Mode', main: watch.travelModeLabel, sub: 'Nomad Travel Pocket' },
    { icon: '◷', title: 'Time Set', main: 'Local Time Set', sub: watch.timeSetLabel },
  ];
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><SectionHeader title="TRAVEL STATUS" /><Text style={{ color: '#c6b5bd', fontSize: 28 }}>›</Text></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>{items.map((item) => <View key={item.title} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 12 }}><View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(32,243,107,0.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#72e34b', fontSize: 30 }}>{item.icon}</Text></View><View style={{ marginLeft: 14 }}><Text style={{ color: muted, fontSize: 14 }}>{item.title}</Text><Text style={{ color: 'white', fontSize: 18, fontWeight: '800', marginTop: 4 }}>{item.main}</Text><Text style={{ color: muted, fontSize: 13, marginTop: 4 }}>{item.sub}</Text></View></View>)}</View>
    </Card>
  );
}

function SecurityStatus({ status }: { status: NomadWatchState['securityStatus'] }) {
  const items = [['♢', 'Device Integrity', status === 'secure' ? 'Secure' : 'Review'], ['♜', 'Connection', 'Secure'], ['🔑', 'Time Set Lock', 'Active'], ['♢', 'Watch Lock', status === 'locked' ? 'Locked' : 'Enabled']];
  return <Card><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><SectionHeader title="SECURITY STATUS" /><Text style={{ color: '#c6b5bd', fontSize: 28 }}>›</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>{items.map(([icon, label, value]) => <View key={label} style={{ alignItems: 'center', width: '24%' }}><View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(32,243,107,0.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#8cff6b', fontSize: 26 }}>{icon}</Text></View><Text style={{ color: 'white', textAlign: 'center', fontSize: 13, marginTop: 10 }}>{label}</Text><Text style={{ color: green, textAlign: 'center', fontSize: 14, fontWeight: '800', marginTop: 6 }}>{value}</Text></View>)}</View></Card>;
}

function TravelPocketOverview({ watch }: { watch: NomadWatchState }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: 'rgba(160,59,229,0.18)', borderWidth: 1, borderColor: '#7833a7', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#bf58ff', fontSize: 34 }}>▣</Text></View>
        <View style={{ flex: 1, marginLeft: 20 }}><SectionHeader title="TRAVEL POCKET OVERVIEW" /><Text style={{ color: muted, fontSize: 16 }}>Travel Pocket Balance</Text><Text style={{ color: 'white', fontSize: 28, fontWeight: '900', marginTop: 6 }}>{watch.travelPocketBalance} <Text style={{ fontSize: 16 }}>USD</Text></Text><Text style={{ color: muted, fontSize: 15, marginTop: 4 }}>≈ Nomad stable-value pocket</Text></View>
        <View style={{ width: 260, borderLeftWidth: 1, borderLeftColor: border, paddingLeft: 28 }}><Text style={{ color: muted, fontSize: 16 }}>Today's Spending</Text><Text style={{ color: 'white', fontSize: 26, fontWeight: '900', marginTop: 6 }}>{watch.todaySpending} <Text style={{ fontSize: 14 }}>USD</Text></Text><View style={{ height: 7, borderRadius: 7, backgroundColor: '#30353d', marginTop: 16, overflow: 'hidden' }}><View style={{ width: '37%', height: 7, borderRadius: 7, backgroundColor: '#c04dff' }} /></View><Text style={{ color: muted, fontSize: 14, marginTop: 8 }}>Daily Limit: {watch.dailyLimit}</Text></View>
        <Text style={{ color: '#c6b5bd', fontSize: 28, marginLeft: 10 }}>›</Text>
      </View>
    </Card>
  );
}

function EmergencyActions({ onAction }: { onAction: (action: NomadWatchEmergencyAction) => void }) {
  const actions: EmergencyAction[] = [
    { label: 'Emergency Lock', detail: 'Lock wallet now', icon: '🔒', color: '#ff5757', action: 'emergency_lock' },
    { label: 'Pause Spending', detail: 'Pause Travel Pocket', icon: 'Ⅱ', color: '#ffcc33', action: 'pause_spending' },
    { label: 'Alert Authority', detail: 'Notify now', icon: '🔔', color: '#31a0ff', action: 'alert_authority' },
    { label: 'Panic Mode', detail: 'Lock & hide wallet', icon: '♢', color: '#b454ff', action: 'panic_mode' },
  ];
  return <Card><Text style={{ color: '#ff5757', fontSize: 20, fontWeight: '900', marginBottom: 18 }}>EMERGENCY ACTIONS</Text><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>{actions.map((action) => <Pressable key={action.label} onPress={() => onAction(action.action)} style={{ width: '23%', borderWidth: 1, borderColor: border, borderRadius: 12, padding: 15, alignItems: 'center' }}><View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: `${action.color}22`, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: action.color, fontSize: 28 }}>{action.icon}</Text></View><Text style={{ color: action.color, fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 12 }}>{action.label}</Text><Text style={{ color: muted, fontSize: 12, textAlign: 'center', marginTop: 6 }}>{action.detail}</Text></Pressable>)}</View></Card>;
}

function OwnerAuthorityAlerts({ label }: { label: string }) {
  const pending = label !== 'No new alerts';
  return <Card><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}><SectionHeader title="OWNER AUTHORITY ALERTS" /><Text style={{ color: green, fontSize: 18, fontWeight: '800' }}>View All</Text></View><View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: pending ? 'rgba(255,204,51,0.14)' : 'rgba(32,243,107,0.14)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: pending ? '#ffcc33' : green, fontSize: 36 }}>♙</Text></View><View style={{ flex: 1, marginLeft: 20 }}><Text style={{ color: 'white', fontSize: 21, fontWeight: '800' }}>{label}</Text><Text style={{ color: muted, fontSize: 16, marginTop: 5 }}>{pending ? 'Review the pending owner authority workflow.' : 'All clear. You have no pending approvals or alerts.'}</Text></View><Text style={{ color: '#c6b5bd', fontSize: 32 }}>›</Text></View></Card>;
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items: NavItem[] = [{ label: 'Home', icon: '⌂', route: 'Portfolio' }, { label: 'Wallets', icon: '▣', route: 'Wallets' }, { label: 'Travel', icon: '✈', route: 'TravelMode' }, { label: 'Security', icon: '♢', route: 'SecurityCenter' }, { label: 'Nomad Watch', icon: '⌚', active: true }];
  return <View style={{ position: 'absolute', left: 14, right: 14, bottom: 14, height: 82, borderRadius: 18, borderWidth: 1, borderColor: border, backgroundColor: 'rgba(3,16,24,0.98)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>{items.map((item) => <Pressable key={item.label} onPress={() => item.route && navigation.navigate(item.route)} style={{ alignItems: 'center', width: '20%' }}><Text style={{ color: item.active ? green : '#d7d3df', fontSize: 28 }}>{item.icon}</Text><Text style={{ color: item.active ? green : '#d7d3df', fontSize: 14, marginTop: 6 }}>{item.label}</Text></Pressable>)}</View>;
}

export default function NomadWatchScreen() {
  const { watch, error, syncNow, triggerEmergencyAction } = useNomadWatch();
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Header connected={watch.connected} />
        {error ? <Text style={{ color: '#ff5757', marginBottom: 10 }}>{error}</Text> : null}
        <WatchHero watch={watch} onSync={() => { void syncNow(); }} />
        <TravelStatus watch={watch} />
        <SecurityStatus status={watch.securityStatus} />
        <TravelPocketOverview watch={watch} />
        <EmergencyActions onAction={(action) => { void triggerEmergencyAction(action); }} />
        <OwnerAuthorityAlerts label={watch.ownerAuthorityAlertLabel} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}
