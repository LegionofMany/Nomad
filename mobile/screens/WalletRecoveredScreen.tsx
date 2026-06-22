import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const navItems = [
  { label: 'Home', icon: '⌂', route: 'Portfolio' },
  { label: 'Wallets', icon: '▣', route: 'Wallets' },
  { label: 'Travel', icon: '✈', route: 'TravelMode' },
  { label: 'Security', icon: '♢', route: 'SecurityCenter' },
  { label: 'Recovery', icon: '↻', active: true },
];

function Card({ children, style }: React.PropsWithChildren<{ style?: object }>) {
  return <View style={[{ borderWidth: 1, borderColor: '#123345', backgroundColor: 'rgba(3,16,26,0.92)', borderRadius: 14, padding: 18 }, style]}>{children}</View>;
}

function BottomNav() {
  const navigation = useNavigation<any>();
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8, backgroundColor: '#02060d' }}>
      <View style={{ height: 92, borderRadius: 16, borderWidth: 1, borderColor: '#123345', backgroundColor: 'rgba(3,16,26,0.98)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
        {navItems.map((item) => (
          <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => item.route && navigation.navigate(item.route)} style={{ alignItems: 'center', width: 70 }}>
            <Text style={{ color: item.active ? '#19ef5f' : '#d8d4df', fontSize: 31, fontWeight: '600' }}>{item.icon}</Text>
            <Text style={{ color: item.active ? '#19ef5f' : '#d8d4df', marginTop: 5, fontSize: 16 }}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function WalletRecoveredScreen() {
  const navigation = useNavigation<any>();
  const summary = [
    ['Wallet Name', 'My Nomad Wallet'],
    ['Recovery Date', 'May 20, 2025 • 10:24 AM'],
    ['Recovery Method', '24 Time Sets'],
    ['Time Sets Verified', '24 of 24'],
    ['Security Strength', 'Strong (96 / 100)'],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#02060d' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 130 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()}><Text style={{ color: 'white', fontSize: 40 }}>‹</Text></Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 18 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#19ef5f', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#19ef5f', fontSize: 30 }}>♢</Text></View>
            <View style={{ marginLeft: 14 }}><Text style={{ color: 'white', fontSize: 31, fontWeight: '900' }}>Wallet Recovered</Text><Text style={{ color: '#cdd3dc', fontSize: 18, marginTop: 4 }}>Step 4 of 4</Text></View>
          </View>
          <Text style={{ color: '#19ef5f', fontSize: 24 }}>Help  ?</Text>
        </View>

        <Card style={{ marginTop: 22, paddingVertical: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
            {['Enter 24\nTime Sets', 'Verify\nSequence', 'Recover\nWallet', 'Complete'].map((step, index) => (
              <React.Fragment key={step}>
                <View style={{ alignItems: 'center', width: 86 }}><View style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#19ef5f', backgroundColor: index === 3 ? '#19ef5f' : 'rgba(7,30,20,0.7)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: index === 3 ? '#06130a' : '#19ef5f', fontSize: 25, fontWeight: '900' }}>{index === 3 ? '4' : '✓'}</Text></View><Text style={{ color: index === 3 ? '#19ef5f' : '#ffffff', textAlign: 'center', marginTop: 10, fontSize: 16, lineHeight: 23 }}>{step}</Text></View>
                {index < 3 ? <Text style={{ color: '#65717a', fontSize: 34, marginHorizontal: -4 }}>→</Text> : null}
              </React.Fragment>
            ))}
          </View>
        </Card>

        <Card style={{ marginTop: 18, minHeight: 390, borderColor: '#12602b', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#19ef5f', fontSize: 120, textShadowColor: '#19ef5f', textShadowRadius: 18 }}>✅</Text>
          <Text style={{ color: '#19ef5f', fontSize: 39, fontWeight: '900', textAlign: 'center' }}>Recovery Successful!</Text>
          <Text style={{ color: '#f5f7fa', fontSize: 22, lineHeight: 34, textAlign: 'center', marginTop: 18, maxWidth: 350 }}>Your Nomad wallet has been successfully restored and is now secure.</Text>
        </Card>

        <Card style={{ marginTop: 18 }}>
          <Text style={{ color: '#19ef5f', fontSize: 20, fontWeight: '900', marginBottom: 14 }}>WALLET SUMMARY</Text>
          {summary.map(([label, value], index) => (<View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, borderTopWidth: index === 0 ? 1 : 0, borderBottomWidth: 1, borderColor: '#18303b' }}><Text style={{ color: '#f2f5f7', fontSize: 18 }}>{label}</Text><Text style={{ color: index === 4 ? '#19ef5f' : '#f2f5f7', fontSize: 18, fontWeight: index === 4 ? '900' : '500', textAlign: 'right', flex: 1, marginLeft: 14 }}>{value}</Text></View>))}
        </Card>

        <Card style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center' }}><Text style={{ color: '#19ef5f', fontSize: 50, marginRight: 22 }}>▣</Text><Text style={{ color: '#f6f8fb', fontSize: 19, lineHeight: 29, flex: 1 }}>Your wallet, settings, and local protections have been restored. You can now manage your funds securely.</Text></Card>

        <Pressable accessibilityRole="button" accessibilityLabel="Open Wallet" onPress={() => navigation.navigate('Portfolio')} style={{ height: 74, borderRadius: 10, backgroundColor: '#19d946', marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#041108', fontSize: 31, fontWeight: '900', marginRight: 18 }}>▣</Text><Text style={{ color: '#041108', fontSize: 26, fontWeight: '900' }}>Open Wallet</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Go to Home" onPress={() => navigation.navigate('Portfolio')} style={{ alignItems: 'center', paddingVertical: 14 }}><Text style={{ color: '#19ef5f', fontSize: 21 }}>Go to Home</Text></Pressable>
      </ScrollView>
      <BottomNav />
    </View>
  );
}
