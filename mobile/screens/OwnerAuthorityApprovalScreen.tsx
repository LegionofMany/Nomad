import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const green = '#19ef5f';
const muted = '#c9d0d8';
const border = '#123345';

const navItems = [
  { label: 'Home', icon: '⌂', route: 'Portfolio' },
  { label: 'Wallets', icon: '▣', route: 'Wallets' },
  { label: 'Travel', icon: '✈', route: 'TravelMode' },
  { label: 'Security', icon: '♢', route: 'SecurityCenter' },
  { label: 'Recovery', icon: '↻', active: true },
];

function Card({ children, style }: React.PropsWithChildren<{ style?: object }>) {
  return (
    <View style={[{ borderWidth: 1, borderColor: border, backgroundColor: 'rgba(3,16,26,0.94)', borderRadius: 14, padding: 18 }, style]}>
      {children}
    </View>
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

function DetailRow({ label, value, valueColor = '#f4f7fa' }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }}>
      <Text style={{ color: muted, fontSize: 23 }}>{label}</Text>
      <Text style={{ color: valueColor, fontSize: 23, flex: 1, textAlign: 'right', marginLeft: 18 }}>{value}</Text>
    </View>
  );
}

export default function OwnerAuthorityApprovalScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: '#02060d' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 130 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()}><Text style={{ color: 'white', fontSize: 40 }}>‹</Text></Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 18 }}>
            <View style={{ width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: green, fontSize: 48 }}>♙</Text></View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 30, fontWeight: '900' }}>Owner Authority Approval</Text>
              <Text style={{ color: muted, fontSize: 20, marginTop: 5 }}>Approval Required</Text>
            </View>
          </View>
          <Text style={{ color: green, fontSize: 24 }}>Help  ?</Text>
        </View>

        <Card style={{ marginTop: 24, borderColor: '#12602b', minHeight: 210, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: green, fontSize: 118, marginRight: 24 }}>♙</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 29, fontWeight: '900', marginBottom: 16 }}>Owner Authority Protection</Text>
            <Text style={{ color: '#f3f7fb', fontSize: 24, lineHeight: 36 }}>This action requires approval from your designated Owner Authority. This adds an extra layer of security to your wallet.</Text>
          </View>
        </Card>

        <Card style={{ marginTop: 18 }}>
          <Text style={{ color: green, fontSize: 23, fontWeight: '900', marginBottom: 10 }}>ACTION REQUIRING APPROVAL</Text>
          <DetailRow label="Action" value="Recover Wallet Access" />
          <DetailRow label="Requested By" value="You (Owner)" />
          <DetailRow label="Date & Time" value="May 20, 2025 • 10:24 AM" />
          <DetailRow label="Device" value="Android Device" />
          <DetailRow label="Reason" value="Wallet Recovery" />
        </Card>

        <Card style={{ marginTop: 18 }}>
          <Text style={{ color: green, fontSize: 23, fontWeight: '900', marginBottom: 22 }}>OWNER AUTHORITY CONTACT</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ width: 78, height: 78, borderRadius: 39, borderWidth: 1, borderColor: '#697080', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(60,43,65,0.35)', marginRight: 18 }}>
                <Text style={{ color: 'white', fontSize: 30, fontWeight: '900' }}>OA</Text>
              </View>
              <View>
                <Text style={{ color: 'white', fontSize: 27, fontWeight: '900' }}>Owner Authority</Text>
                <Text style={{ color: muted, fontSize: 22, marginTop: 5 }}>Primary Authority</Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Change Owner Authority" style={{ borderWidth: 1, borderColor: green, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 16 }}>
              <Text style={{ color: green, fontSize: 23 }}>Change</Text>
            </Pressable>
          </View>
          <DetailRow label="Email" value="owner@nomadauthority.com" />
          <DetailRow label="Method" value="Secure In-App Approval" />
          <DetailRow label="Status" value="Pending Approval ◷" valueColor="#ffb800" />
        </Card>

        <Card style={{ marginTop: 18, borderColor: '#8f6500', flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#ffb800', fontSize: 58, marginRight: 20 }}>◷</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#ffb800', fontSize: 27, fontWeight: '900', marginBottom: 12 }}>Waiting for Approval</Text>
            <Text style={{ color: '#f2f5f7', fontSize: 23, lineHeight: 34 }}>Your Owner Authority will be notified and must approve this request to continue. You will be notified once approved.</Text>
          </View>
        </Card>

        <Pressable accessibilityRole="button" accessibilityLabel="Cancel Request" style={{ marginTop: 18, minHeight: 86, borderWidth: 1, borderColor: '#ff3347', borderRadius: 12, backgroundColor: 'rgba(55,8,16,0.38)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#ff4b5f', fontSize: 29, fontWeight: '800' }}>Cancel Request</Text>
        </Pressable>
      </ScrollView>
      <BottomNav />
    </View>
  );
}
