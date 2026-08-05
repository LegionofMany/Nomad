import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadRecovery } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  PrimaryButton,
  RoundIcon,
} from '../ui/NomadShell';

function formatRequestTime(value?: string) {
  if (!value) return 'Not requested';
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function DetailRow({ label, value, color = '#fff', last }: { label: string; value: string; color?: string; last?: boolean }) {
  return <View style={[styles.detailRow, !last && styles.rowBorder]}><Text style={styles.detailLabel}>{label}</Text><Text style={[styles.detailValue, { color }]}>{value}</Text></View>;
}

export default function OwnerAuthorityApprovalScreen() {
  const navigation = useNavigation<any>();
  const { ownerAuthorityRequest, requestOwnerAuthority, cancelOwnerAuthority, error } = useNomadRecovery();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const requestStatus = ownerAuthorityRequest.status;
  const pending = requestStatus === 'pending';
  const approved = requestStatus === 'approved';
  const statusColor = approved ? C.green : pending ? C.yellow : requestStatus === 'declined' ? C.red : C.muted;

  const requestApproval = async () => {
    try {
      setBusy(true);
      setFeedback('');
      const next = await requestOwnerAuthority('Recover Wallet Access');
      setFeedback(`Owner Authority request ${next.status}.`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to request Owner Authority approval.');
    } finally {
      setBusy(false);
    }
  };

  const cancelRequest = async () => {
    try {
      setBusy(true);
      const next = await cancelOwnerAuthority();
      setFeedback(`Request ${next.status}.`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to cancel the request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <NomadPage maxWidth={860}>
      <PageHeader title="Owner Authority Approval" subtitle="Approval required for protected actions" icon="♙" color={C.green} help />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Panel tone="green" style={styles.hero}>
        <RoundIcon symbol="♙" color={C.green} size={92} filled />
        <View style={styles.heroCopy}><Text style={styles.heroTitle}>Owner Authority Protection</Text><Text style={styles.heroText}>Sensitive recovery actions require approval from the authority designated by the wallet owner. Nomad cannot approve the request on the owner’s behalf.</Text></View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <Text style={styles.sectionTitle}>ACTION REQUIRING APPROVAL</Text>
        <DetailRow label="Action" value="Recover Wallet Access" />
        <DetailRow label="Requested By" value={ownerAuthorityRequest.requestedBy || 'Wallet Owner'} />
        <DetailRow label="Date & Time" value={formatRequestTime(ownerAuthorityRequest.requestedAt)} />
        <DetailRow label="Device" value={ownerAuthorityRequest.device || 'Current Nomad device'} />
        <DetailRow label="Reason" value={ownerAuthorityRequest.reason || 'Protected recovery action'} last />
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={styles.authorityHeader}>
          <View style={styles.authorityIdentity}><RoundIcon symbol="OA" color={C.green} size={62} /><View style={styles.authorityCopy}><Text style={styles.authorityTitle}>Owner Authority</Text><Text style={styles.authoritySub}>Primary recovery authority</Text></View></View>
          <Pressable onPress={() => navigation.navigate('CreateOwnerAuthority')} style={styles.changeButton}><Text style={styles.changeText}>Change</Text></Pressable>
        </View>
        <DetailRow label="Approval Method" value="Secure in-app authority request" />
        <DetailRow label="Request Status" value={requestStatus === 'none' ? 'NOT REQUESTED' : requestStatus.toUpperCase()} color={statusColor} />
        <DetailRow label="Owner Control" value="Required before recovery continues" color={C.green} last />
      </Panel>

      <Panel tone={approved ? 'green' : pending ? 'yellow' : 'blue'} style={styles.statusPanel}>
        <RoundIcon symbol={approved ? '✓' : pending ? '◷' : '♙'} color={statusColor} size={54} />
        <View style={styles.statusCopy}>
          <Text style={[styles.statusTitle, { color: statusColor }]}>{approved ? 'Approval Received' : pending ? 'Waiting for Approval' : 'Approval Not Requested'}</Text>
          <Text style={styles.statusText}>{approved ? 'The protected recovery flow can continue.' : pending ? 'The designated authority must approve or decline the request.' : 'Start an approval request only when you are ready to continue recovery.'}</Text>
        </View>
      </Panel>

      {feedback ? <Text style={[styles.feedback, feedback.toLowerCase().includes('unable') && { color: C.red }]}>{feedback}</Text> : null}

      {approved ? (
        <PrimaryButton label="Continue Recovery" subtitle="Proceed to the protected recovery sequence" icon="✓" tone="green" onPress={() => navigation.navigate('RecoverLostWallet')} />
      ) : pending ? (
        <Pressable disabled={busy} onPress={() => void cancelRequest()} style={styles.cancelRequest}><Text style={styles.cancelRequestText}>{busy ? 'Cancelling…' : 'Cancel Request'}</Text></Pressable>
      ) : (
        <PrimaryButton label={busy ? 'Requesting Approval…' : 'Request Owner Approval'} subtitle="Send a secure request to the designated authority" icon="♙" disabled={busy} tone="green" onPress={() => void requestApproval()} />
      )}

      <BottomNav
        active="Recovery"
        items={[
          ['⌂', 'Home', 'Portfolio'],
          ['▣', 'Wallets', 'Wallets'],
          ['✈', 'Travel', 'TravelMode'],
          ['◇', 'Security', 'SecurityCenter'],
          ['↻', 'Recovery', 'RecoveryCenter'],
        ]}
      />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  error: { color: C.red, fontSize: 11, marginBottom: 12 },
  hero: { minHeight: 165, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 18 },
  heroCopy: { flex: 1, minWidth: 0 },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  heroText: { color: '#eef4f8', fontSize: 12, lineHeight: 20, marginTop: 8 },
  sectionPanel: { marginTop: 17, padding: 18 },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900', marginBottom: 4 },
  detailRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  detailLabel: { color: C.muted, fontSize: 11 },
  detailValue: { flex: 1, color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'right' },
  authorityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  authorityIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  authorityCopy: { marginLeft: 12 },
  authorityTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  authoritySub: { color: C.muted, fontSize: 10, marginTop: 4 },
  changeButton: { borderWidth: 1, borderColor: C.green, borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9 },
  changeText: { color: C.green, fontSize: 10, fontWeight: '900' },
  statusPanel: { minHeight: 100, marginTop: 17, padding: 16, flexDirection: 'row', alignItems: 'center' },
  statusCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  statusTitle: { fontSize: 16, fontWeight: '900' },
  statusText: { color: '#eff4f8', fontSize: 10, lineHeight: 17, marginTop: 5 },
  feedback: { color: C.green, fontSize: 11, marginTop: 12 },
  cancelRequest: { minHeight: 66, marginTop: 18, borderWidth: 1, borderColor: C.red, borderRadius: 12, backgroundColor: 'rgba(55,8,16,.38)', alignItems: 'center', justifyContent: 'center' },
  cancelRequestText: { color: C.red, fontSize: 15, fontWeight: '900' },
});
