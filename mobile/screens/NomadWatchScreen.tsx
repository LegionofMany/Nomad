import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadTravel, useNomadWatch } from '../nomad';
import type { NomadWatchEmergencyAction } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  ProgressBar,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

const emergencyActions: Array<{ label: string; detail: string; icon: string; color: string; action: NomadWatchEmergencyAction }> = [
  { label: 'Emergency Lock', detail: 'Lock wallet now', icon: '▣', color: C.red, action: 'emergency_lock' },
  { label: 'Pause Spending', detail: 'Pause Travel Pocket', icon: 'Ⅱ', color: C.yellow, action: 'pause_spending' },
  { label: 'Alert Authority', detail: 'Notify Owner Authority', icon: '♙', color: C.blue, action: 'alert_authority' },
  { label: 'Panic Mode', detail: 'Lock and hide wallet', icon: '◇', color: C.purple, action: 'panic_mode' },
];

function StatusMetric({ icon, label, value, sub, color = C.green }: { icon: string; label: string; value: string; sub: string; color?: string }) {
  return <View style={styles.metric}><RoundIcon symbol={icon} color={color} size={45} filled /><View style={styles.metricCopy}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricSub}>{sub}</Text></View></View>;
}

export default function NomadWatchScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { watch, loading, error, syncNow, triggerEmergencyAction } = useNomadWatch();
  const { travelPocket } = useNomadTravel();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const region = travelPocket.regionInput || watch.travelRegion;
  const pocketBalance = travelPocket.pocketBalanceLocal || travelPocket.pocketBalanceFiat || watch.travelPocketBalance;
  const securityColor = watch.securityStatus === 'secure' ? C.green : watch.securityStatus === 'locked' ? C.red : C.yellow;

  const handleSync = async () => {
    try {
      setBusy(true);
      setFeedback('Syncing Nomad Watch…');
      await syncNow();
      setFeedback('Nomad Watch synced successfully.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to sync Nomad Watch.');
    } finally {
      setBusy(false);
    }
  };

  const handleEmergency = async (action: NomadWatchEmergencyAction, label: string) => {
    try {
      setBusy(true);
      setFeedback(`Requesting ${label.toLowerCase()}…`);
      await triggerEmergencyAction(action);
      setFeedback(`${label} requested through the connected watch adapter.`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : `Unable to request ${label.toLowerCase()}.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <NomadPage maxWidth={960}>
      <PageHeader
        title="Nomad Watch"
        subtitle="Your travel. Your wallet. Your watch."
        icon="⌚"
        color={C.green}
        right={<Text style={[styles.connectionBadge, { color: watch.connected ? C.green : C.yellow, borderColor: watch.connected ? C.green : C.yellow }]}>{watch.connected ? '● CONNECTED' : '● READY'}</Text>}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Panel style={[styles.hero, compact && styles.heroCompact]}>
        <View style={styles.watchArt}><View style={styles.watchCase}><View style={[styles.watchFace, { borderColor: securityColor }]}><Text style={[styles.watchN, { color: securityColor }]}>N</Text><Text style={styles.watchSync}>{watch.lastSyncedLabel}</Text><Text style={styles.watchSyncLabel}>SYNC</Text></View></View></View>
        <View style={styles.deviceCopy}>
          <View style={styles.deviceTitleRow}><Text style={styles.deviceName}>{watch.deviceName}</Text><Pressable onPress={() => navigation.navigate('Settings')}><Text style={styles.edit}>✎</Text></Pressable></View>
          <Text style={styles.deviceDetail}>Firmware {watch.firmware}</Text>
          <View style={styles.batteryRow}><Text style={styles.deviceDetail}>Battery {watch.batteryPercent}%</Text><View style={styles.batteryTrack}><View style={[styles.batteryFill, { width: `${watch.batteryPercent}%` }]} /></View></View>
          <Text style={styles.deviceDetail}>Last synced: {watch.lastSyncedLabel}</Text>
          <View style={styles.deviceActions}>
            <Pressable onPress={() => setFeedback('Find Watch signal requested. Use the paired device to confirm the alert.')} style={styles.deviceButton}><Text style={styles.deviceButtonIcon}>⌚</Text><Text style={styles.deviceButtonText}>Find Watch</Text></Pressable>
            <Pressable disabled={busy} onPress={() => void handleSync()} style={styles.deviceButton}><Text style={styles.deviceButtonIcon}>⟳</Text><Text style={styles.deviceButtonText}>{busy ? 'Syncing…' : 'Sync Now'}</Text></Pressable>
            <Pressable onPress={() => navigation.navigate('Settings')} style={styles.deviceButton}><Text style={[styles.deviceButtonIcon, { color: C.red }]}>∞</Text><Text style={styles.deviceButtonText}>Unpair</Text></Pressable>
          </View>
        </View>
        <View style={[styles.securityRing, { borderColor: securityColor }]}><Text style={[styles.securityIcon, { color: securityColor }]}>◇</Text><Text style={styles.securityAll}>All Systems</Text><Text style={[styles.securityStatus, { color: securityColor }]}>{watch.securityStatus.toUpperCase()}</Text></View>
      </Panel>
      {feedback ? <Text style={[styles.feedback, /unable/i.test(feedback) && { color: C.red }]}>{feedback}</Text> : null}

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>TRAVEL STATUS</Text><Pressable onPress={() => navigation.navigate('TravelMode')}><Text style={styles.link}>Travel Pocket  ›</Text></Pressable></View>
        <View style={styles.metricGrid}>
          <StatusMetric icon="◎" label="Current Region" value={region} sub={watch.travelSubregion || 'Selected destination'} />
          <StatusMetric icon="✈" label="Travel Mode" value={travelPocket.enabled ? 'Active' : watch.travelModeLabel} sub={travelPocket.localCurrency || 'Nomad Travel Pocket'} />
          <StatusMetric icon="◷" label="Time Set" value="Local Time Set" sub={watch.timeSetLabel} />
        </View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>SECURITY STATUS</Text><Pressable onPress={() => navigation.navigate('SecurityCenter')}><Text style={styles.link}>Security Center  ›</Text></Pressable></View>
        <View style={styles.securityGrid}>{[
          ['◇', 'Device Integrity', watch.securityStatus === 'secure' ? 'Secure' : 'Review'],
          ['♜', 'Connection', watch.connected ? 'Secure' : 'Ready'],
          ['⚿', 'Time Set Lock', 'Active'],
          ['▣', 'Watch Lock', watch.securityStatus === 'locked' ? 'Locked' : 'Enabled'],
        ].map(([icon, label, value]) => <View key={label} style={styles.securityItem}><RoundIcon symbol={icon} color={securityColor} size={49} filled /><Text style={styles.securityItemLabel}>{label}</Text><Text style={[styles.securityItemValue, { color: securityColor }]}>{value}</Text></View>)}</View>
      </Panel>

      <Panel style={styles.pocketPanel}>
        <RoundIcon symbol="▰" color={C.purple} size={64} filled />
        <View style={styles.pocketCopy}><Text style={styles.sectionTitle}>TRAVEL POCKET OVERVIEW</Text><Text style={styles.pocketLabel}>Travel Pocket Balance</Text><Text style={styles.pocketBalance}>{pocketBalance}</Text><Text style={styles.pocketSub}>{travelPocket.localCurrency || 'Nomad stable-value pocket'}</Text></View>
        <View style={styles.spendingCopy}><Text style={styles.pocketLabel}>Today's Spending</Text><Text style={styles.todaySpending}>{watch.todaySpending}</Text><ProgressBar value={37} color={C.purple} height={7} /><Text style={styles.pocketSub}>Daily Limit: {watch.dailyLimit}</Text></View>
        <Pressable onPress={() => navigation.navigate('TravelMode')}><Text style={styles.chevron}>›</Text></Pressable>
      </Panel>

      <Panel style={styles.emergencyPanel}>
        <Text style={[styles.sectionTitle, { color: C.red }]}>EMERGENCY ACTIONS</Text>
        <View style={styles.emergencyGrid}>{emergencyActions.map((action) => <Pressable key={action.label} disabled={busy} onPress={() => void handleEmergency(action.action, action.label)} style={styles.emergencyCard}><RoundIcon symbol={action.icon} color={action.color} size={52} filled /><Text style={[styles.emergencyTitle, { color: action.color }]}>{action.label}</Text><Text style={styles.emergencySub}>{action.detail}</Text></Pressable>)}</View>
      </Panel>

      <Pressable onPress={() => navigation.navigate('OwnerAuthorityApproval')}>
        <Panel tone={watch.ownerAuthorityAlertLabel === 'No new alerts' ? 'green' : 'yellow'} style={styles.alertPanel}>
          <RoundIcon symbol="♙" color={watch.ownerAuthorityAlertLabel === 'No new alerts' ? C.green : C.yellow} size={58} filled />
          <View style={styles.alertCopy}><Text style={styles.alertTitle}>OWNER AUTHORITY ALERTS</Text><Text style={styles.alertValue}>{watch.ownerAuthorityAlertLabel}</Text><Text style={styles.alertSub}>{watch.ownerAuthorityAlertLabel === 'No new alerts' ? 'No pending approvals or watch alerts.' : 'Review the pending Owner Authority workflow.'}</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Panel>
      </Pressable>

      <BottomNav active="Watch" items={[
        ['⌂', 'Home', 'Portfolio'], ['▣', 'Wallets', 'Wallets'], ['✈', 'Travel', 'TravelMode'], ['◇', 'Security', 'SecurityCenter'], ['⌚', 'Watch', 'NomadWatch'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  connectionBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 8, fontWeight: '900' },
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  hero: { minHeight: 235, padding: 19, flexDirection: 'row', alignItems: 'center', gap: 19 },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  watchArt: { width: 155, alignItems: 'center' },
  watchCase: { width: 116, height: 188, borderRadius: 37, backgroundColor: '#111', borderWidth: 1, borderColor: '#2a2d32', alignItems: 'center', justifyContent: 'center' },
  watchFace: { width: 101, height: 101, borderRadius: 51, borderWidth: 3, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  watchN: { fontSize: 31, fontWeight: '900' },
  watchSync: { color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 5 },
  watchSyncLabel: { color: '#fff', fontSize: 7 },
  deviceCopy: { flex: 1, minWidth: 0 },
  deviceTitleRow: { flexDirection: 'row', alignItems: 'center' },
  deviceName: { color: '#fff', fontSize: 21, fontWeight: '900' },
  edit: { color: C.muted, fontSize: 19, marginLeft: 8 },
  deviceDetail: { color: C.muted, fontSize: 10, marginTop: 10 },
  batteryRow: { flexDirection: 'row', alignItems: 'center' },
  batteryTrack: { width: 70, height: 7, borderRadius: 7, backgroundColor: '#30353d', overflow: 'hidden', marginLeft: 10, marginTop: 10 },
  batteryFill: { height: '100%', backgroundColor: C.green },
  deviceActions: { flexDirection: 'row', gap: 8, marginTop: 18 },
  deviceButton: { flex: 1, minHeight: 67, borderWidth: 1, borderColor: C.border, borderRadius: 11, alignItems: 'center', justifyContent: 'center', padding: 6 },
  deviceButtonIcon: { color: C.green, fontSize: 20 },
  deviceButtonText: { color: '#fff', fontSize: 8, marginTop: 5, textAlign: 'center' },
  securityRing: { width: 126, height: 126, borderRadius: 63, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  securityIcon: { fontSize: 27 },
  securityAll: { color: '#fff', fontSize: 10, marginTop: 4 },
  securityStatus: { fontSize: 10, fontWeight: '900', marginTop: 3 },
  feedback: { color: C.green, fontSize: 10, marginTop: 10 },
  sectionPanel: { marginTop: 16, padding: 16 },
  emergencyPanel: { marginTop: 16, padding: 16 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900' },
  link: { color: C.green, fontSize: 9, fontWeight: '900' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginTop: 14 },
  metric: { flexGrow: 1, flexBasis: 190, minHeight: 75, flexDirection: 'row', alignItems: 'center' },
  metricCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  metricLabel: { color: C.muted, fontSize: 8 },
  metricValue: { color: '#fff', fontSize: 12, fontWeight: '800', marginTop: 4 },
  metricSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  securityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  securityItem: { flexGrow: 1, flexBasis: 130, minHeight: 110, borderWidth: 1, borderColor: C.border, borderRadius: 11, alignItems: 'center', justifyContent: 'center', padding: 9 },
  securityItemLabel: { color: '#fff', fontSize: 9, textAlign: 'center', marginTop: 7 },
  securityItemValue: { fontSize: 9, fontWeight: '900', marginTop: 5 },
  pocketPanel: { minHeight: 112, marginTop: 16, padding: 15, flexDirection: 'row', alignItems: 'center' },
  pocketCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  pocketLabel: { color: C.muted, fontSize: 9, marginTop: 7 },
  pocketBalance: { color: '#fff', fontSize: 19, fontWeight: '900', marginTop: 4 },
  pocketSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  spendingCopy: { width: 180, borderLeftWidth: 1, borderLeftColor: C.borderSoft, paddingLeft: 17, marginLeft: 12 },
  todaySpending: { color: '#fff', fontSize: 17, fontWeight: '900', marginVertical: 6 },
  chevron: { color: '#c6b5bd', fontSize: 28, marginLeft: 8 },
  emergencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  emergencyCard: { flexGrow: 1, flexBasis: 145, minHeight: 124, borderWidth: 1, borderColor: C.border, borderRadius: 11, alignItems: 'center', justifyContent: 'center', padding: 10 },
  emergencyTitle: { fontSize: 10, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  emergencySub: { color: C.muted, fontSize: 8, textAlign: 'center', marginTop: 4 },
  alertPanel: { minHeight: 91, marginTop: 16, padding: 15, flexDirection: 'row', alignItems: 'center' },
  alertCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  alertTitle: { color: C.green, fontSize: 11, fontWeight: '900' },
  alertValue: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 5 },
  alertSub: { color: C.muted, fontSize: 8, marginTop: 4 },
});
