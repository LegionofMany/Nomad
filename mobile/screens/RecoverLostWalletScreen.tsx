import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const blueBlack = '#020812';
const cardBg = 'rgba(3,16,30,0.96)';
const border = '#12314a';
const green = '#19f86a';
const muted = '#aeb8c8';
const danger = '#ff3b4f';

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ borderRadius: 14, borderWidth: 1, borderColor: border, backgroundColor: cardBg, padding: 16 }, style]}>
      {children}
    </View>
  );
}

function IconBubble({ icon, tint = green }: { icon: string; tint?: string }) {
  return (
    <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: tint, backgroundColor: `${tint}22`, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: tint, fontSize: 25, fontWeight: '900' }}>{icon}</Text>
    </View>
  );
}

function StepHeader() {
  const steps = [
    ['1', 'Enter 24 Time Sets', 'In Progress'],
    ['2', 'Verify Sequence', 'Pending'],
    ['3', 'Recover Wallet', 'Pending'],
    ['4', 'Complete', 'Pending'],
  ];
  return (
    <Card style={{ marginTop: 18, paddingVertical: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {steps.map((step, index) => (
          <React.Fragment key={step[0]}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: index === 0 ? green : '#718097', backgroundColor: index === 0 ? green : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: index === 0 ? '#011607' : '#dce6f4', fontWeight: '900' }}>{step[0]}</Text>
              </View>
              <Text style={{ color: index === 0 ? green : muted, textAlign: 'center', fontSize: 12, fontWeight: index === 0 ? '900' : '500', marginTop: 8 }}>{step[1]}</Text>
              <Text style={{ color: index === 0 ? green : muted, textAlign: 'center', fontSize: 12, marginTop: 2 }}>{step[2]}</Text>
            </View>
            {index < steps.length - 1 && <Text style={{ color: muted, fontSize: 28, marginHorizontal: 3 }}>→</Text>}
          </React.Fragment>
        ))}
      </View>
    </Card>
  );
}

function RecoveryClock() {
  const dots = Array.from({ length: 24 }, (_, i) => i + 1);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 300, height: 300 }}>
      <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: green, backgroundColor: 'rgba(0, 30, 20, 0.45)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '900' }}>12</Text>
        <Text style={{ color: green, fontSize: 42, marginTop: 28 }}>◷</Text>
        <Text style={{ color: green, fontWeight: '900', fontSize: 18 }}>NOMAD</Text>
        <Text style={{ color: muted, fontSize: 10, fontWeight: '800' }}>TIME RECOVERY</Text>
        <Text style={{ color: 'white', fontSize: 30, fontWeight: '800', marginTop: 8 }}>03:15:27</Text>
        <Text style={{ color: green, fontSize: 10, fontWeight: '800' }}>HOUR     MIN     SEC</Text>
      </View>
      {dots.map((dot, i) => {
        const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
        const radius = 132;
        const x = Math.cos(angle) * radius + 150 - 13;
        const y = Math.sin(angle) * radius + 150 - 13;
        return (
          <View key={dot} style={{ position: 'absolute', left: x, top: y, alignItems: 'center' }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderStyle: 'dotted', borderColor: green }} />
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '700', marginTop: 2 }}>{dot}</Text>
          </View>
        );
      })}
    </View>
  );
}

function PasswordCard() {
  return (
    <Card style={{ marginTop: 18 }}>
      <Text style={{ color: green, fontWeight: '900', marginBottom: 10 }}>WALLET PASSWORD</Text>
      <View style={{ borderRadius: 10, borderWidth: 1, borderColor: '#33465a', height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
        <Text style={{ color: green, fontSize: 25, marginRight: 12 }}>▣</Text>
        <Text style={{ color: muted, flex: 1, fontSize: 17 }}>Enter your wallet password</Text>
        <Text style={{ color: '#dbe5f5', fontSize: 23 }}>◎</Text>
      </View>
      <Text style={{ color: muted, marginTop: 10, fontSize: 12 }}>This password is required to decrypt and recover your wallet.</Text>
    </Card>
  );
}

function TimeGrid() {
  const cells = Array.from({ length: 24 }, (_, i) => i + 1);
  return (
    <View style={{ marginTop: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: green, fontSize: 17, fontWeight: '900' }}>ENTER YOUR 24 TIME SETS</Text>
        <Text style={{ color: danger, fontSize: 16 }}>▥  Clear All</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {cells.map((cell) => (
          <View key={cell} style={{ width: '15.2%', height: 70, borderRadius: 8, borderWidth: 1, borderColor: cell === 1 ? green : '#2a3b4b', backgroundColor: cell === 1 ? 'rgba(0,255,100,0.08)' : 'rgba(0,0,0,0.18)', marginBottom: 10, padding: 10 }}>
            <Text style={{ color: cell === 1 ? green : '#d4d8e1', fontWeight: '700' }}>{cell}</Text>
            <Text style={{ color: cell === 1 ? green : muted, fontWeight: '900', marginTop: 14, fontSize: 12 }}>{cell === 1 ? '03:15:27' : '--:--:--'}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={{ color: muted }}>◷  Use 24 unique time positions (HH:MM:SS)</Text>
        <Text style={{ color: green, fontWeight: '900' }}>0 of 24 time sets entered</Text>
      </View>
    </View>
  );
}

function InfoPanels() {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
      <Card style={{ flex: 1 }}>
        <Text style={{ color: green, fontWeight: '900', marginBottom: 10 }}>INSTRUCTIONS</Text>
        {['Enter the exact 24 time positions in the exact order you created them.', 'Each time must match one of the 24 hour positions on the clock.', 'Example times: 01:00:45, 13:30:22, 22:15:07, etc.', 'After all 24 are entered, tap “Verify Sequence”.'].map((line, i) => (
          <Text key={line} style={{ color: '#d7dfec', fontSize: 12, lineHeight: 18 }}>{i + 1}.  {line}</Text>
        ))}
      </Card>
      <Card style={{ flex: 1 }}>
        <Text style={{ color: green, fontWeight: '900', marginBottom: 10 }}>RECOVERY TIPS</Text>
        {[['☼', 'Make sure you are in a private, secure location.'], ['▣', 'Your data never leaves your device.'], ['♢', 'Too many incorrect attempts may result in permanent loss of access.']].map(([icon, text]) => (
          <View key={text} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: green, fontSize: 22, width: 30 }}>{icon}</Text>
            <Text style={{ color: '#d7dfec', flex: 1, fontSize: 12, lineHeight: 16 }}>{text}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

function StrengthCard() {
  return (
    <Card style={{ marginTop: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconBubble icon="♢" />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={{ color: green, fontWeight: '900' }}>RECOVERY STRENGTH</Text>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', marginTop: 8 }}>--- /100</Text>
          <Text style={{ color: muted, marginTop: 5 }}>Enter all 24 time sets to calculate strength.</Text>
        </View>
        <View style={{ width: 220 }}>
          {['24 Unique Times', 'Correct Sequence', 'Complete Recovery'].map((item) => (
            <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#6d7888', marginRight: 10 }} />
              <Text style={{ color: muted }}>{item}</Text>
            </View>
          ))}
        </View>
        <View style={{ width: 74, height: 74, borderRadius: 37, borderWidth: 1, borderStyle: 'dashed', borderColor: muted, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: muted }}>♢ --</Text>
        </View>
      </View>
    </Card>
  );
}

export default function RecoverLostWalletScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: blueBlack }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()}><Text style={{ color: 'white', fontSize: 42 }}>‹</Text></Pressable>
          <View style={{ marginLeft: 14 }}><IconBubble icon="◷" /></View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 29, fontWeight: '900' }}>Recover Lost Wallet</Text>
            <Text style={{ color: '#d8deea', marginTop: 4 }}>Enter your 24 Time Sets and password to recover your wallet.</Text>
          </View>
          <Text style={{ color: green, fontSize: 20, marginRight: 10 }}>Help</Text>
          <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: green, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: green, fontWeight: '900' }}>?</Text></View>
        </View>

        <StepHeader />

        <Card style={{ marginTop: 18, borderColor: '#244052' }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: green, fontWeight: '900', fontSize: 18 }}>STEP 1 OF 4</Text>
              <Text style={{ color: 'white', fontSize: 26, fontWeight: '900', marginTop: 18 }}>Enter Your 24 Time Sets</Text>
              <Text style={{ color: '#d8deea', fontSize: 17, lineHeight: 25, marginTop: 14 }}>Enter the exact time positions including seconds in the order you created them.</Text>
              <View style={{ marginTop: 28, borderWidth: 1, borderColor: green, borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: green, fontSize: 26, marginRight: 12 }}>♢</Text>
                <Text style={{ color: '#e6edf7', flex: 1, lineHeight: 20 }}>Only you know your time sequence. Nomad never stores or sees your Time Sets.</Text>
              </View>
            </View>
            <RecoveryClock />
          </View>

          <PasswordCard />
          <TimeGrid />
          <InfoPanels />
          <StrengthCard />

          <Pressable accessibilityRole="button" accessibilityLabel="Verify Sequence" style={{ marginTop: 14, borderRadius: 9, backgroundColor: green, paddingVertical: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#001706', fontSize: 28, marginRight: 16 }}>♢</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#001706', fontSize: 20, fontWeight: '900' }}>Verify Sequence</Text>
              <Text style={{ color: '#001706' }}>Verify your 24 time sets to recover wallet</Text>
            </View>
            <Text style={{ color: '#001706', fontSize: 36 }}>›</Text>
          </Pressable>

          <View style={{ marginTop: 14, borderRadius: 8, borderWidth: 1, borderColor: danger, padding: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,0,40,0.08)' }}>
            <Text style={{ color: danger, fontSize: 22, marginRight: 14 }}>⚠</Text>
            <Text style={{ color: '#e7d6d8' }}>Too many incorrect attempts may result in permanent loss of access.</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
