import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const GREEN = '#20f36a';
const BLUE = '#1684ff';
const BG = '#020812';
const CARD = 'rgba(4,18,31,0.94)';
const BORDER = '#0b3652';
const MUTED = '#b9c3d1';

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ borderWidth: 1, borderColor: BORDER, borderRadius: 18, backgroundColor: CARD, padding: 18 }, style]}>
      {children}
    </View>
  );
}

function Header() {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={{ paddingRight: 10 }}>
        <Text style={{ color: 'white', fontSize: 42, lineHeight: 44 }}>‹</Text>
      </Pressable>

      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: GREEN, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
          <Text style={{ color: GREEN, fontSize: 30, fontWeight: '900' }}>◷</Text>
        </View>
        <View>
          <Text style={{ color: 'white', fontSize: 29, fontWeight: '900' }}>Verify Recovery Sequence</Text>
          <Text style={{ color: MUTED, fontSize: 18, marginTop: 4 }}>Step 2 of 4</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: GREEN, fontSize: 21, marginRight: 12 }}>Help</Text>
        <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: GREEN, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: GREEN, fontSize: 20, fontWeight: '900' }}>?</Text>
        </View>
      </View>
    </View>
  );
}

function StepTracker() {
  const steps = [
    { number: '✓', label: 'Enter 24\nTime Sets', active: false, done: true },
    { number: '2', label: 'Verify Sequence', active: true },
    { number: '3', label: 'Recover Wallet\nPending', active: false },
    { number: '4', label: 'Complete\nPending', active: false },
  ];

  return (
    <Card style={{ marginBottom: 22, paddingVertical: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {steps.map((step, index) => (
          <React.Fragment key={step.number + step.label}>
            <View style={{ alignItems: 'center', width: 122 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: step.active || step.done ? 0 : 2, borderColor: '#334252', backgroundColor: step.active || step.done ? GREEN : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: step.active || step.done ? '#02100a' : 'white', fontSize: 22, fontWeight: '900' }}>{step.number}</Text>
              </View>
              <Text style={{ color: step.active || step.done ? GREEN : 'white', textAlign: 'center', fontSize: 16, lineHeight: 22, marginTop: 10 }}>{step.label}</Text>
            </View>
            {index < steps.length - 1 && <Text style={{ color: '#7f8895', fontSize: 34 }}>→</Text>}
          </React.Fragment>
        ))}
      </View>
    </Card>
  );
}

function VerifyHero() {
  return (
    <Card style={{ marginBottom: 24, borderColor: '#075f2a', padding: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 176, height: 176, alignItems: 'center', justifyContent: 'center', marginRight: 28 }}>
          <Text style={{ color: GREEN, fontSize: 148, lineHeight: 158 }}>♙</Text>
          <View style={{ position: 'absolute', right: 6, bottom: 22, width: 60, height: 60, borderRadius: 30, borderWidth: 4, borderColor: GREEN, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: GREEN, fontSize: 32, fontWeight: '900' }}>✓</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontSize: 31, fontWeight: '900', marginBottom: 16 }}>Verify Your Sequence</Text>
          <Text style={{ color: '#e7eef7', fontSize: 23, lineHeight: 41 }}>
            You have entered 24 time sets. Now, verify your sequence by re-entering them in the same exact order.
          </Text>
        </View>
      </View>
    </Card>
  );
}

function TimeInputBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: MUTED, fontSize: 18, marginBottom: 12 }}>{label}</Text>
      <View style={{ width: '100%', height: 78, borderWidth: 1, borderColor: '#334252', borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.22)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: 39, fontWeight: '800' }}>{value}</Text>
      </View>
    </View>
  );
}

function VerificationPanel() {
  return (
    <Card style={{ marginBottom: 22 }}>
      <Text style={{ color: GREEN, fontSize: 23, fontWeight: '900', marginBottom: 26 }}>SELECT SET NUMBER TO VERIFY</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 34 }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 1, borderColor: '#334252', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontSize: 46 }}>‹</Text>
        </View>
        <View style={{ flex: 1, height: 78, marginHorizontal: 22, borderWidth: 1, borderColor: '#334252', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontSize: 30, fontWeight: '900' }}>Set 1 of 24</Text>
        </View>
        <View style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 1, borderColor: '#334252', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontSize: 46 }}>›</Text>
        </View>
      </View>

      <Text style={{ color: 'white', fontSize: 22, marginBottom: 24 }}>Enter Time (including seconds)</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 34 }}>
        <TimeInputBox label="HH" value="03" />
        <Text style={{ color: 'white', fontSize: 40, marginHorizontal: 18, marginTop: 34 }}>:</Text>
        <TimeInputBox label="MM" value="15" />
        <Text style={{ color: 'white', fontSize: 40, marginHorizontal: 18, marginTop: 34 }}>:</Text>
        <TimeInputBox label="SS" value="27" />
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Verify Set 1" style={{ height: 84, borderRadius: 10, backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 36 }}>
        <Text style={{ color: '#031208', fontSize: 29, fontWeight: '900' }}>Verify Set 1</Text>
        <Text style={{ position: 'absolute', right: 28, color: '#031208', fontSize: 42 }}>›</Text>
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <Text style={{ color: 'white', fontSize: 22 }}>Progress</Text>
        <Text style={{ color: 'white', fontSize: 22 }}>0 of 24 verified</Text>
      </View>
      <View style={{ height: 12, borderRadius: 10, backgroundColor: '#2b333d', overflow: 'hidden' }}>
        <View style={{ width: '8%', height: '100%', backgroundColor: GREEN }} />
      </View>
    </Card>
  );
}

function WarningCard() {
  return (
    <View style={{ borderWidth: 1, borderColor: '#8e6500', borderRadius: 16, padding: 28, flexDirection: 'row', alignItems: 'center', marginBottom: 100, backgroundColor: 'rgba(25,19,4,0.45)' }}>
      <Text style={{ color: '#ffb21c', fontSize: 58, marginRight: 28 }}>⚠</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#ffb21c', fontSize: 24, fontWeight: '900', marginBottom: 12 }}>Important</Text>
        <Text style={{ color: 'white', fontSize: 24, lineHeight: 38 }}>All 24 time sets must be entered in the exact same order to recover your wallet.</Text>
      </View>
    </View>
  );
}

function BottomNav() {
  const navigation = useNavigation<any>();
  const items = [
    { label: 'Home', icon: '⌂', route: 'Portfolio' },
    { label: 'Wallets', icon: '▣', route: 'Wallets' },
    { label: 'Travel', icon: '✈', route: 'TravelMode' },
    { label: 'Security', icon: '♢', route: 'SecurityCenter' },
    { label: 'Recovery', icon: '↻', route: 'RecoveryCenter', active: true },
  ];

  return (
    <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18, height: 88, borderRadius: 18, borderWidth: 1, borderColor: '#0a3862', backgroundColor: 'rgba(3,16,30,0.98)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
      {items.map((item) => (
        <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => navigation.navigate(item.route)} style={{ alignItems: 'center', width: 92 }}>
          <Text style={{ color: item.active ? GREEN : '#c8c9d7', fontSize: 32, fontWeight: '700' }}>{item.icon}</Text>
          <Text style={{ color: item.active ? GREEN : '#c8c9d7', fontSize: 16, marginTop: 4 }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function VerifyRecoverySequenceScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 126 }} showsVerticalScrollIndicator={false}>
        <Header />
        <StepTracker />
        <VerifyHero />
        <VerificationPanel />
        <WarningCard />
      </ScrollView>
      <BottomNav />
    </View>
  );
}
