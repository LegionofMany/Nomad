import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const green = '#19ef5f';
const blue = '#1684ff';
const red = '#ff4b4b';
const amber = '#ffb31a';
const purple = '#a855f7';
const muted = '#c9d0d8';
const border = '#123345';

const freezeOptions = [
  { title: 'Freeze Entire Wallet', subtitle: 'Lock all assets and transactions across your Nomad wallet.', icon: '▰', tint: red, badge: 'High Protection', badgeTint: red },
  { title: 'Freeze Travel Pocket', subtitle: 'Stop all spending and top-ups for your Travel Pocket.', icon: '▣', tint: blue, badge: 'Medium Protection', badgeTint: blue },
  { title: 'Freeze Specific Assets', subtitle: 'Choose specific assets to freeze while keeping others active.', icon: '◉', tint: purple, badge: 'Custom', badgeTint: purple },
  { title: 'Notify Owner Authority', subtitle: 'Alert your Owner Authority of this emergency action.', icon: '♙', tint: green, badge: 'Recommended', badgeTint: green },
];

const navItems = [
  { label: 'Home', icon: '⌂', route: 'Portfolio' },
  { label: 'Wallets', icon: '▣', route: 'Wallets' },
  { label: 'Travel', icon: '✈', route: 'TravelMode' },
  { label: 'Security', icon: '♢', route: 'SecurityCenter', active: true },
  { label: 'More', icon: '…' },
];

function Card({ children, style }: React.PropsWithChildren<{ style?: object }>) {
  return (
    <View style={[{ borderWidth: 1, borderColor: border, backgroundColor: 'rgba(3,16,26,0.94)', borderRadius: 14, padding: 18 }, style]}>
      {children}
    </View>
  );
}

function Header() {
  const navigation = useNavigation<any>();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()}>
        <Text style={{ color: 'white', fontSize: 40 }}>‹</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 18 }}>
        <View style={{ width: 74, height: 74, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: red, fontSize: 58 }}>♜</Text>
        </View>
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={{ color: 'white', fontSize: 31, fontWeight: '900' }}>Emergency Freeze</Text>
          <Text style={{ color: muted, fontSize: 20, marginTop: 5 }}>Protect your assets instantly</Text>
        </View>
      </View>
      <Text style={{ color: green, fontSize: 24 }}>Help  ?</Text>
    </View>
  );
}

function FreezeOption({ item }: { item: typeof freezeOptions[number] }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={item.title} style={{ minHeight: 138, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(5,18,28,0.88)', padding: 22, flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
      <View style={{ width: 92, height: 92, borderRadius: 46, borderWidth: 1, borderColor: `${item.tint}66`, backgroundColor: `${item.tint}18`, alignItems: 'center', justifyContent: 'center', marginRight: 24 }}>
        <Text style={{ color: item.tint, fontSize: 42, fontWeight: '900' }}>{item.icon}</Text>
        <View style={{ position: 'absolute', right: -2, bottom: 6, width: 30, height: 30, borderRadius: 15, backgroundColor: blue, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontSize: 17 }}>❄</Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: 'white', fontSize: 25, fontWeight: '900' }}>{item.title}</Text>
        <Text style={{ color: '#e5e9ee', fontSize: 19, lineHeight: 27, marginTop: 7 }}>{item.subtitle}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', marginLeft: 14 }}>
        <View style={{ borderRadius: 18, borderWidth: 1, borderColor: `${item.badgeTint}55`, backgroundColor: `${item.badgeTint}18`, paddingHorizontal: 15, paddingVertical: 8, marginBottom: 10 }}>
          <Text style={{ color: item.badgeTint, fontSize: 14, fontWeight: '800' }}>{item.badge}</Text>
        </View>
        <Text style={{ color: item.tint, fontSize: 45 }}>›</Text>
      </View>
    </Pressable>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8, backgroundColor: '#02060d' }}>
      <View style={{ height: 92, borderRadius: 16, borderWidth: 1, borderColor: border, backgroundColor: 'rgba(3,16,26,0.98)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
        {navItems.map((item) => (
          <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => item.route && navigation.navigate(item.route)} style={{ alignItems: 'center', width: 70 }}>
            <Text style={{ color: item.active ? green : '#d8d4df', fontSize: 31, fontWeight: '600' }}>{item.icon}</Text>
            <Text style={{ color: item.active ? green : '#d8d4df', marginTop: 5, fontSize: 16 }}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function EmergencyFreezeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#02060d' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 130 }}>
        <Header />

        <Card style={{ marginTop: 22, minHeight: 205, borderColor: '#7b1c1c', backgroundColor: 'rgba(34,6,9,0.55)', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 195, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: '#6b2022', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,75,75,0.10)' }}>
              <Text style={{ color: red, fontSize: 76 }}>▣</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: red, fontSize: 25, fontWeight: '900', marginBottom: 10 }}>Emergency Protection</Text>
            <Text style={{ color: '#f2f6fa', fontSize: 21, lineHeight: 30 }}>Freeze your wallet or assets if your device is lost, stolen, or compromised. You can unfreeze anytime using your Time Sets or Owner Authority.</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: red, fontSize: 28, marginRight: 12 }}>⚠</Text>
              <Text style={{ color: '#f1d8d8', fontSize: 17 }}>Frozen actions cannot be undone immediately.</Text>
            </View>
          </View>
        </Card>

        <Text style={{ color: 'white', fontSize: 24, fontWeight: '800', marginTop: 26, marginBottom: 10 }}>What would you like to freeze?</Text>
        {freezeOptions.map((item) => <FreezeOption key={item.title} item={item} />)}

        <Card style={{ marginTop: 18, borderColor: '#0d3a66', flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: blue, fontSize: 45, marginRight: 18 }}>ⓘ</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#f0f4f8', fontSize: 18, lineHeight: 27 }}>When frozen, all outgoing transactions, swaps, and top-ups will be blocked. Incoming funds (receive only) will still be allowed unless otherwise specified.</Text>
            <Text style={{ color: blue, fontSize: 18, marginTop: 16 }}>Learn more about Emergency Freeze  ›</Text>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 10 }}>
          <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Recent Freeze Activity</Text>
          <Text style={{ color: green, fontSize: 18 }}>View All</Text>
        </View>
        <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center', marginRight: 18 }}>
            <Text style={{ color: '#b7bcc5', fontSize: 31 }}>❄</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>No freeze actions yet</Text>
            <Text style={{ color: muted, fontSize: 17, marginTop: 5 }}>You’re all set. Stay secure!</Text>
          </View>
          <Text style={{ color: '#8f98a8', fontSize: 44 }}>♢</Text>
        </Card>

        <Card style={{ marginTop: 18, borderColor: '#7a5b00', backgroundColor: 'rgba(46,31,0,0.42)', flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: amber, fontSize: 42, marginRight: 18 }}>☏</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: amber, fontSize: 20, fontWeight: '900' }}>Need help?</Text>
            <Text style={{ color: '#f2e7ce', fontSize: 16, marginTop: 6 }}>Contact Nomad Support or your Owner Authority.</Text>
          </View>
          <View style={{ borderWidth: 1, borderColor: amber, borderRadius: 9, paddingHorizontal: 21, paddingVertical: 14 }}>
            <Text style={{ color: amber, fontSize: 18 }}>Contact Support</Text>
          </View>
        </Card>
      </ScrollView>
      <BottomNav />
    </View>
  );
}
