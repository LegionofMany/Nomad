import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadRecovery } from '../nomad';

const green = '#19ef5f';
const blue = '#1684ff';
const muted = '#c9d0d8';
const border = '#123345';
const red = '#ff455c';

const authorityTypes = [
  { title: 'Spouse / Family Member', subtitle: 'Add a trusted family member', icon: '●', tint: green },
  { title: 'Business Partner', subtitle: 'Add a trusted business partner', icon: '▣', tint: blue },
  { title: 'Attorney / Legal Advisor', subtitle: 'Add your legal representative', icon: '⚖', tint: '#ffad12' },
  { title: 'Multi-Sign Authority', subtitle: 'Require multiple authorities to approve', icon: '♚', tint: '#814cff' },
  { title: 'Secondary Device (You)', subtitle: 'Use another device you control', icon: '▯', tint: '#7d8b94' },
];

const requirements = [
  'They will be notified and must accept the invitation',
  'They cannot access your funds without your approval',
  'You can update or remove authority at any time',
  'All communications are encrypted end-to-end',
];

const navItems = [
  { label: 'Home', icon: '⌂', route: 'Portfolio' },
  { label: 'Wallets', icon: '▣', route: 'Wallets' },
  { label: 'Travel', icon: '✈', route: 'TravelMode' },
  { label: 'Security', icon: '♢', route: 'SecurityCenter' },
  { label: 'More', icon: '…', active: true },
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
          <Text style={{ color: green, fontSize: 58 }}>♙</Text>
        </View>
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={{ color: 'white', fontSize: 30, fontWeight: '900' }}>Create Owner Authority</Text>
          <Text style={{ color: muted, fontSize: 20, marginTop: 5 }}>Add a trusted authority to protect your wallet</Text>
        </View>
      </View>
      <Text style={{ color: green, fontSize: 24 }}>Help  ?</Text>
    </View>
  );
}

function AuthorityTypeRow({ item, selected, onPress }: { item: typeof authorityTypes[number]; selected: boolean; onPress(): void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 19, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
      <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: `${item.tint}cc`, alignItems: 'center', justifyContent: 'center', marginRight: 22 }}>
        <Text style={{ color: 'white', fontSize: 32, fontWeight: '900' }}>{item.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: 'white', fontSize: 26, fontWeight: '900' }}>{item.title}</Text>
        <Text style={{ color: muted, fontSize: 20, marginTop: 7 }}>{item.subtitle}</Text>
      </View>
      <Text style={{ color: selected ? green : '#8aa1b3', fontSize: selected ? 30 : 44 }}>{selected ? '✓' : '›'}</Text>
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

export default function CreateOwnerAuthorityScreen() {
  const navigation = useNavigation<any>();
  const { ownerAuthorityRequest, requestOwnerAuthority, error } = useNomadRecovery();
  const [selectedAuthority, setSelectedAuthority] = React.useState(authorityTypes[0].title);
  const pending = ownerAuthorityRequest.status === 'pending';

  const handleAddAuthority = async () => {
    await requestOwnerAuthority(`Create Owner Authority: ${selectedAuthority}`);
    navigation.navigate('OwnerAuthorityApproval');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#02060d' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 130 }}>
        <Header />

        {error ? <Text style={{ color: red, marginTop: 16 }}>{error}</Text> : null}
        {pending ? <Text style={{ color: green, marginTop: 16, fontSize: 17, fontWeight: '800' }}>Owner Authority request pending approval.</Text> : null}

        <Card style={{ marginTop: 24, minHeight: 275, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 225, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: green, fontSize: 142 }}>♙</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: green, fontSize: 31, fontWeight: '900', marginBottom: 15 }}>Add an Owner Authority</Text>
            <Text style={{ color: '#f2f6fa', fontSize: 22, lineHeight: 32 }}>Your Owner Authority can approve critical actions like wallet recovery, large transactions, or security changes. You remain in full control.</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 }}>
              {[["▣", 'Extra Security'], ['♙', 'Your Control'], ['◷', 'Recovery Help']].map(([icon, label]) => (
                <View key={label} style={{ alignItems: 'center', width: '31%' }}>
                  <Text style={{ color: green, fontSize: 34 }}>{icon}</Text>
                  <Text style={{ color: muted, fontSize: 14, marginTop: 7, textAlign: 'center' }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        <Card style={{ marginTop: 18 }}>
          <Text style={{ color: green, fontSize: 23, fontWeight: '900', marginBottom: 14 }}>CHOOSE AUTHORITY TYPE</Text>
          {authorityTypes.map((item) => <AuthorityTypeRow key={item.title} item={item} selected={selectedAuthority === item.title} onPress={() => setSelectedAuthority(item.title)} />)}
        </Card>

        <Card style={{ marginTop: 18, minHeight: 210, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: green, fontSize: 23, fontWeight: '900', marginBottom: 18 }}>AUTHORITY REQUIREMENTS</Text>
            {requirements.map((text) => (
              <View key={text} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <Text style={{ color: green, fontSize: 20, marginRight: 12 }}>✓</Text>
                <Text style={{ color: '#eef3f7', fontSize: 16, flex: 1 }}>{text}</Text>
              </View>
            ))}
          </View>
          <View style={{ width: 210, height: 155, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#263948', fontSize: 130 }}>◉</Text>
            <Text style={{ position: 'absolute', color: green, fontSize: 48, top: 10, left: 28 }}>♙</Text>
            <Text style={{ position: 'absolute', color: blue, fontSize: 44, top: 40, right: 16 }}>♙</Text>
            <Text style={{ position: 'absolute', color: '#814cff', fontSize: 44, bottom: 4, left: 42 }}>♙</Text>
          </View>
        </Card>

        <Card style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: blue, fontSize: 44, marginRight: 18 }}>ⓘ</Text>
          <Text style={{ color: '#f2f5f7', fontSize: 20, lineHeight: 30, flex: 1 }}>You can add up to 5 Owner Authorities. We recommend at least 1 for optimal protection.</Text>
        </Card>

        <Pressable accessibilityRole="button" accessibilityLabel="Add Owner Authority" onPress={() => { void handleAddAuthority(); }} style={{ marginTop: 18, minHeight: 82, borderRadius: 12, backgroundColor: '#14d84f', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#03110a', fontSize: 31, marginRight: 18 }}>♙</Text>
          <Text style={{ color: '#03110a', fontSize: 28, fontWeight: '900' }}>{pending ? 'View Pending Authority' : 'Add Owner Authority'}</Text>
        </Pressable>
      </ScrollView>
      <BottomNav />
    </View>
  );
}
