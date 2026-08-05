import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadSecurity, type NomadFreezeScope } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

type FreezeOptionItem = {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  badge: string;
  scope: NomadFreezeScope;
};

const freezeOptions: FreezeOptionItem[] = [
  { title: 'Freeze Entire Wallet', subtitle: 'Block outgoing transactions, swaps and top-ups across Nomad.', icon: '▰', color: C.red, badge: 'High Protection', scope: 'entire_wallet' },
  { title: 'Freeze Travel Pocket', subtitle: 'Stop Travel Pocket spending and regional top-ups.', icon: '✈', color: C.blue, badge: 'Medium Protection', scope: 'travel_pocket' },
  { title: 'Freeze Specific Assets', subtitle: 'Protect selected assets while leaving other wallets active.', icon: '◉', color: C.purple, badge: 'Custom', scope: 'specific_assets' },
  { title: 'Notify Owner Authority', subtitle: 'Send an emergency alert without freezing the full wallet.', icon: '♙', color: C.green, badge: 'Recommended', scope: 'owner_authority_alert' },
];

function FreezeOption({ item, active, busy, onPress }: { item: FreezeOptionItem; active: boolean; busy: boolean; onPress: () => void }) {
  return (
    <Pressable disabled={busy} onPress={onPress} style={[styles.option, active && { borderColor: item.color, backgroundColor: `${item.color}12` }]}>
      <View style={[styles.optionIcon, { borderColor: `${item.color}66`, backgroundColor: `${item.color}16` }]}>
        <Text style={[styles.optionMark, { color: item.color }]}>{item.icon}</Text>
        <View style={[styles.optionBadgeIcon, { backgroundColor: active ? item.color : C.blue }]}><Text style={styles.optionBadgeIconText}>{active ? '✓' : '❄'}</Text></View>
      </View>
      <View style={styles.optionCopy}><Text style={styles.optionTitle}>{item.title}</Text><Text style={styles.optionSub}>{item.subtitle}</Text></View>
      <View style={styles.optionRight}><Text style={[styles.protectionBadge, { color: item.color, borderColor: `${item.color}55`, backgroundColor: `${item.color}12` }]}>{active ? 'Active' : item.badge}</Text><Text style={[styles.optionArrow, { color: item.color }]}>›</Text></View>
    </Pressable>
  );
}

export default function EmergencyFreezeScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { security, error, activateFreeze, clearFreeze } = useNomadSecurity();
  const [busyScope, setBusyScope] = useState<NomadFreezeScope | 'clear' | null>(null);
  const [feedback, setFeedback] = useState('');

  const currentScope = security.freezeScope;
  const hasFreeze = security.freezeStatus !== 'none';
  const latestActivity = security.freezeActivity[0];

  const statusCopy = useMemo(() => {
    if (!hasFreeze) return 'Choose a protection scope if a device is lost, stolen or compromised.';
    return currentScope === 'owner_authority_alert'
      ? 'Owner Authority has been alerted. Wallet access remains under owner control.'
      : `Emergency protection is active for ${(currentScope || security.freezeStatus).replace(/_/g, ' ')}.`;
  }, [currentScope, hasFreeze, security.freezeStatus]);

  const handleFreeze = async (scope: NomadFreezeScope) => {
    try {
      setBusyScope(scope);
      setFeedback('');
      const next = await activateFreeze(scope);
      setFeedback(`${next.freezeStatus === 'none' ? 'Alert sent' : 'Freeze activated'}: ${scope.replace(/_/g, ' ')}.`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to activate emergency protection.');
    } finally {
      setBusyScope(null);
    }
  };

  const handleClear = async () => {
    try {
      setBusyScope('clear');
      setFeedback('');
      await clearFreeze();
      setFeedback('Emergency freeze cleared after owner-controlled verification.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to clear the emergency freeze.');
    } finally {
      setBusyScope(null);
    }
  };

  return (
    <NomadPage maxWidth={900}>
      <PageHeader title="Emergency Freeze" subtitle="Protect your assets instantly" icon="❄" color={C.red} status={false} help />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Panel tone="red" style={[styles.hero, compact && styles.heroCompact]}>
        <View style={styles.heroIcon}><Text style={styles.heroMark}>{hasFreeze ? '❄' : '▣'}</Text></View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>{hasFreeze ? 'Emergency Protection Active' : 'Emergency Protection'}</Text>
          <Text style={styles.heroText}>{statusCopy}</Text>
          <Text style={styles.heroWarning}>⚠ Incoming funds can remain available while outgoing actions are restricted by the selected scope.</Text>
        </View>
        {hasFreeze ? <Pressable disabled={busyScope === 'clear'} onPress={() => void handleClear()} style={styles.clearButton}><Text style={styles.clearText}>{busyScope === 'clear' ? 'Clearing…' : 'Clear Freeze'}</Text></Pressable> : null}
      </Panel>

      <View style={styles.headingRow}><Text style={styles.heading}>What would you like to protect?</Text><Text style={styles.headingNote}>Owner verification required</Text></View>
      {freezeOptions.map((item) => <FreezeOption key={item.scope} item={item} active={hasFreeze && currentScope === item.scope} busy={busyScope !== null} onPress={() => void handleFreeze(item.scope)} />)}

      {feedback ? <Text style={[styles.feedback, feedback.toLowerCase().includes('unable') && { color: C.red }]}>{feedback}</Text> : null}

      <Panel style={styles.infoPanel}>
        <RoundIcon symbol="i" color={C.blue} size={43} />
        <View style={styles.infoCopy}><Text style={styles.infoText}>Freeze controls block reviewable outgoing actions before signing. Final enforcement remains inside the connected wallet and owner-authority layer.</Text><Pressable onPress={() => navigation.navigate('SecurityCenter')}><Text style={styles.infoLink}>Return to Security Center  ›</Text></Pressable></View>
      </Panel>

      <Text style={styles.activityHeading}>Recent Freeze Activity</Text>
      <Panel style={styles.activityPanel}>
        <RoundIcon symbol={latestActivity ? '❄' : '◇'} color={latestActivity ? C.red : C.muted} size={48} filled />
        <View style={styles.activityCopy}>
          <Text style={styles.activityTitle}>{latestActivity?.label || 'No freeze actions yet'}</Text>
          <Text style={styles.activitySub}>{latestActivity ? `${latestActivity.scope.replace(/_/g, ' ')} • ${new Date(latestActivity.requestedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : 'Your wallet has no recorded emergency actions.'}</Text>
        </View>
        <Text style={[styles.activityStatus, { color: latestActivity ? C.red : C.green }]}>{latestActivity?.status.replace(/_/g, ' ') || 'Secure'}</Text>
      </Panel>

      <Panel tone="yellow" style={styles.supportPanel}>
        <RoundIcon symbol="☏" color={C.yellow} size={45} />
        <View style={styles.supportCopy}><Text style={styles.supportTitle}>Need help?</Text><Text style={styles.supportSub}>Use recovery or contact your Owner Authority before clearing a freeze you did not initiate.</Text></View>
        <Pressable onPress={() => navigation.navigate('RecoveryCenter')} style={styles.supportButton}><Text style={styles.supportButtonText}>Recovery  ›</Text></Pressable>
      </Panel>

      <BottomNav active="Security" fifth={['•••', 'More', 'Settings']} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  error: { color: C.red, fontSize: 11, marginBottom: 12 },
  hero: { minHeight: 180, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 18 },
  heroCompact: { flexWrap: 'wrap', alignItems: 'flex-start' },
  heroIcon: { width: 118, height: 118, borderRadius: 59, borderWidth: 1, borderColor: '#6b2022', backgroundColor: 'rgba(255,75,75,.1)', alignItems: 'center', justifyContent: 'center' },
  heroMark: { color: C.red, fontSize: 61 },
  heroCopy: { flex: 1, minWidth: 210 },
  heroTitle: { color: C.red, fontSize: 20, fontWeight: '900' },
  heroText: { color: '#f1f5f9', fontSize: 13, lineHeight: 20, marginTop: 8 },
  heroWarning: { color: '#f1d8d8', fontSize: 10, lineHeight: 16, marginTop: 11 },
  clearButton: { borderWidth: 1, borderColor: C.green, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 },
  clearText: { color: C.green, fontSize: 11, fontWeight: '900' },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 22, marginBottom: 2 },
  heading: { color: '#fff', fontSize: 16, fontWeight: '900' },
  headingNote: { color: C.muted, fontSize: 9 },
  option: { minHeight: 111, marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', borderRadius: 14, backgroundColor: C.panel, padding: 15, flexDirection: 'row', alignItems: 'center' },
  optionIcon: { width: 70, height: 70, borderRadius: 35, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  optionMark: { fontSize: 31, fontWeight: '900' },
  optionBadgeIcon: { position: 'absolute', right: -2, bottom: 3, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionBadgeIconText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  optionCopy: { flex: 1, minWidth: 0 },
  optionTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  optionSub: { color: '#d6dee8', fontSize: 10, lineHeight: 16, marginTop: 5 },
  optionRight: { alignItems: 'flex-end', marginLeft: 9 },
  protectionBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 8, fontWeight: '900' },
  optionArrow: { fontSize: 28, marginTop: 5 },
  feedback: { color: C.green, fontSize: 11, marginTop: 13 },
  infoPanel: { minHeight: 91, marginTop: 18, padding: 15, flexDirection: 'row', alignItems: 'center' },
  infoCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  infoText: { color: '#d8e1ec', fontSize: 10, lineHeight: 16 },
  infoLink: { color: C.blue, fontSize: 10, fontWeight: '800', marginTop: 7 },
  activityHeading: { color: '#fff', fontSize: 15, fontWeight: '900', marginTop: 21, marginBottom: 9 },
  activityPanel: { minHeight: 78, padding: 14, flexDirection: 'row', alignItems: 'center' },
  activityCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  activityTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  activitySub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  activityStatus: { fontSize: 9, fontWeight: '900', textTransform: 'capitalize', marginLeft: 8 },
  supportPanel: { minHeight: 84, marginTop: 17, padding: 14, flexDirection: 'row', alignItems: 'center' },
  supportCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  supportTitle: { color: C.yellow, fontSize: 13, fontWeight: '900' },
  supportSub: { color: '#efe5ce', fontSize: 9, lineHeight: 14, marginTop: 4 },
  supportButton: { borderWidth: 1, borderColor: C.yellow, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, marginLeft: 8 },
  supportButtonText: { color: C.yellow, fontSize: 9, fontWeight: '900' },
});
