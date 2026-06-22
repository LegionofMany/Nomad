import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type DetailRow = {
  label: string;
  value: string;
  subValue?: string;
  accent?: boolean;
  leading?: string;
};

type SecurityRow = {
  icon: string;
  title: string;
  subtitle: string;
  status: string;
};

const transactionDetails: DetailRow[] = [
  { label: 'Pay With', value: 'Bitcoin (BTC)', leading: '₿' },
  { label: 'Amount', value: '0.000245 BTC', subValue: '≈ $15.75 USD' },
  { label: 'To', value: 'POS Merchant', subValue: 'NOMAD POS ID: 7F3A...9C2B' },
  { label: 'Network Fee ⓘ', value: '0.000005 BTC', subValue: '≈ $0.32 USD' },
  { label: 'Total', value: '0.000250 BTC', subValue: '≈ $16.07 USD', accent: true },
];

const securityRows: SecurityRow[] = [
  { icon: '♢', title: 'Merchant Verified', subtitle: 'Verified on BlockPages', status: 'Verified' },
  { icon: '▣', title: 'Connection Secure', subtitle: 'NFC connection encrypted', status: 'Secure' },
  { icon: '◷', title: 'Transaction Time', subtitle: 'May 20, 2025 • 10:24:31 AM', status: 'Verified' },
  { icon: '▰', title: 'Balance After Payment', subtitle: '0.045321 BTC (≈ $2,913.45 USD)', status: 'Sufficient' },
];

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{
      borderWidth: 1,
      borderColor: '#23313a',
      borderRadius: 16,
      backgroundColor: 'rgba(3,17,23,0.95)',
      padding: 20,
    }, style]}>
      {children}
    </View>
  );
}

function Header() {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()}>
        <Text style={{ color: 'white', fontSize: 45 }}>‹</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 28 }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#19e45f', alignItems: 'center', justifyContent: 'center', marginRight: 18 }}>
          <Text style={{ color: '#19e45f', fontSize: 34 }}>)))</Text>
        </View>
        <View>
          <Text style={{ color: 'white', fontSize: 31, fontWeight: '900' }}>Approve POS Transaction</Text>
          <Text style={{ color: '#d7d9de', fontSize: 24, marginTop: 4 }}>Tap to Pay</Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Cancel transaction">
        <Text style={{ color: '#19e45f', fontSize: 27 }}>Cancel</Text>
      </Pressable>
    </View>
  );
}

function MerchantCard() {
  return (
    <Card style={{ minHeight: 220, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 156, height: 156, borderRadius: 78, borderWidth: 1, borderColor: '#2e3b43', alignItems: 'center', justifyContent: 'center', marginRight: 34 }}>
        <Text style={{ color: '#19e45f', fontSize: 58 }}>▤)))</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#19e45f', fontSize: 23, marginBottom: 18 }}>♢  Secure NFC Connection</Text>
        <Text style={{ color: 'white', fontSize: 38, fontWeight: '900' }}>Coffee Corner</Text>
        <Text style={{ color: '#d7d9de', fontSize: 29, marginTop: 12 }}>POS Terminal</Text>
        <Text style={{ color: '#c8ccd4', fontSize: 20, marginTop: 18 }}>⌖  Austin, Texas, USA</Text>
      </View>
    </Card>
  );
}

function TransactionDetailRow({ row, isLast }: { row: DetailRow; isLast?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 22, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#27343b' }}>
      <Text style={{ color: '#e6e6e8', fontSize: 25 }}>{row.label}</Text>
      <View style={{ alignItems: 'flex-end', flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
          {row.leading && (
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#ff9900', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Text style={{ color: 'white', fontSize: 28, fontWeight: '900' }}>{row.leading}</Text>
            </View>
          )}
          <Text style={{ color: row.accent ? '#19e45f' : 'white', fontSize: row.accent ? 31 : 28, fontWeight: row.accent ? '900' : '500' }}>{row.value}</Text>
          {row.leading && <Text style={{ color: '#19e45f', fontSize: 40, marginLeft: 18 }}>›</Text>}
        </View>
        {row.subValue && <Text style={{ color: '#d0c9ce', fontSize: 22, marginTop: 8 }}>{row.subValue}</Text>}
      </View>
    </View>
  );
}

function TransactionDetailsCard() {
  return (
    <Card style={{ marginTop: 22 }}>
      <Text style={{ color: '#19e45f', fontSize: 24, fontWeight: '900', marginBottom: 16 }}>TRANSACTION DETAILS</Text>
      <View style={{ height: 1, backgroundColor: '#2a373e' }} />
      {transactionDetails.map((row, index) => <TransactionDetailRow key={row.label} row={row} isLast={index === transactionDetails.length - 1} />)}
    </Card>
  );
}

function SecurityConfirmationCard() {
  return (
    <Card style={{ marginTop: 22 }}>
      <Text style={{ color: '#19e45f', fontSize: 24, fontWeight: '900', marginBottom: 16 }}>SECURITY CONFIRMATION</Text>
      <View style={{ height: 1, backgroundColor: '#2a373e' }} />
      {securityRows.map((row, index) => (
        <View key={row.title} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: index === securityRows.length - 1 ? 0 : 1, borderBottomColor: '#26343b' }}>
          <Text style={{ color: '#19e45f', fontSize: 38, width: 58 }}>{row.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 23, fontWeight: '700' }}>{row.title}</Text>
            <Text style={{ color: '#cdd2d9', fontSize: 20, marginTop: 5 }}>{row.subtitle}</Text>
          </View>
          <Text style={{ color: '#19e45f', fontSize: 22, marginRight: 18 }}>{row.status}</Text>
          <Text style={{ color: '#19e45f', fontSize: 32 }}>✓</Text>
        </View>
      ))}
    </Card>
  );
}

function WarningCard() {
  return (
    <Card style={{ marginTop: 22, borderColor: '#9c6f00', flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ color: '#ffb300', fontSize: 44, marginRight: 22 }}>⚠</Text>
      <Text style={{ color: '#f2e7d0', fontSize: 22, lineHeight: 31, flex: 1 }}>
        Review the details above carefully. This transaction cannot be reversed.
      </Text>
    </Card>
  );
}

function SlideApproval() {
  return (
    <View style={{ marginTop: 26, alignItems: 'center' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Slide to approve payment" style={{ height: 112, borderRadius: 56, backgroundColor: 'rgba(13,118,43,0.72)', flexDirection: 'row', alignItems: 'center', paddingLeft: 10, width: '100%' }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#26dc52', alignItems: 'center', justifyContent: 'center', marginRight: 76 }}>
          <Text style={{ color: '#00220a', fontSize: 48 }}>→</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 30, fontWeight: '800' }}>Slide to Approve Payment</Text>
          <Text style={{ color: '#d8e7db', fontSize: 23, marginTop: 8 }}>Hold and slide right to confirm</Text>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Tap to confirm payment" style={{ marginTop: 22 }}>
        <Text style={{ color: '#19e45f', fontSize: 23 }}>Or tap to confirm</Text>
      </Pressable>
    </View>
  );
}

export default function ApprovePOSTransactionScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#02070c' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 30, paddingBottom: 44 }} showsVerticalScrollIndicator={false}>
        <Header />
        <MerchantCard />
        <TransactionDetailsCard />
        <SecurityConfirmationCard />
        <WarningCard />
        <SlideApproval />
      </ScrollView>
    </View>
  );
}
