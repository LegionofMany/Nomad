import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useNomadOwnerAuthorityApproval } from '../nomad';
import type { NomadOwnerAuthorityApprovalStatus } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  useNomadLayout,
} from '../ui/NomadShell';

function formatDate(value?: string) {
  if (!value) return 'Not available';
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Not available';
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusInfo(status: NomadOwnerAuthorityApprovalStatus) {
  switch (status) {
    case 'approved':
      return { color: C.green, label: 'Approval Verified', headline: 'Approval Confirmed', detail: 'A verified signed authority receipt permits the protected action to continue.' };
    case 'approval_unverified':
      return { color: C.red, label: 'Approval Unverified', headline: 'Approval Evidence Incomplete', detail: 'A legacy approval flag exists, but no verified authority signature or signed receipt confirms it.' };
    case 'awaiting_signed_receipt':
      return { color: C.yellow, label: 'Awaiting Signed Receipt', headline: 'Waiting for Signed Evidence', detail: 'The secret-free request package is prepared locally. Delivery, identity and signature remain unverified.' };
    case 'local_request_pending':
      return { color: C.yellow, label: 'Local Request Pending', headline: 'Approval Delivery Not Connected', detail: 'The request exists on this device, but no remote authority service has received or approved it.' };
    case 'declined':
      return { color: C.red, label: 'Request Declined', headline: 'Approval Declined', detail: 'The protected action remains blocked until a new independently verified approval is obtained.' };
    case 'cancelled':
      return { color: C.muted, label: 'Request Cancelled', headline: 'No Active Approval Request', detail: 'The local request was cancelled. No remote cancellation confirmation is available.' };
    case 'not_requested':
    default:
      return { color: C.purple, label: 'Authority Setup Required', headline: 'No Approval Request Exists', detail: 'Create an Owner Authority and protected-action request before approval evidence can be evaluated.' };
  }
}

function OwnerProtectionGraphic({ color, size = 155 }: { color: string; size?: number }) {
  return (
    <View accessibilityLabel="Owner Authority protection shield" style={[styles.graphic, { width: size, height: size * 1.18, shadowColor: color }]}>
      <Svg width={size} height={size * 1.18} viewBox="0 0 170 200" fill="none">
        <Path d="M85 9c-23 17-45 25-69 30v55c0 45 27 77 69 98 42-21 69-53 69-98V39c-24-5-46-13-69-30Z" fill="#03170f" stroke={color} strokeWidth="9" strokeLinejoin="round" />
        <Circle cx="85" cy="79" r="23" stroke={color} strokeWidth="6" />
        <Path d="M50 145v-16c0-19 16-33 35-33s35 14 35 33v16c-21 10-49 10-70 0Z" stroke={color} strokeWidth="6" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

function DetailRow({ label, value, color, last }: { label: string; value: string; color?: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, !last && styles.rowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

export default function OwnerAuthorityApprovalScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const {
    approval,
    loading,
    error,
    refresh,
    preparePackage,
    checkDelivery,
    cancelRequest,
  } = useNomadOwnerAuthorityApproval();
  const [feedback, setFeedback] = useState('');
  const status = statusInfo(approval.status);
  const requestActive = approval.request.status === 'pending';
  const protectionColor = approval.status === 'declined' || approval.status === 'approval_unverified' ? C.red : C.green;
  const requestedBy = /wallet owner/i.test(approval.request.requestedBy || '')
    ? 'You (Owner)'
    : approval.request.requestedBy || 'You (Owner)';

  const handlePreparePackage = async () => {
    try {
      setFeedback('Preparing a secret-free authority request package…');
      const result = await preparePackage();
      await Share.share({ title: 'Nomad Owner Authority Request', message: result.packageJson });
      setFeedback('Package prepared. Sharing does not prove delivery, identity or approval.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to prepare the authority request package.');
    }
  };

  const handleDeliveryCheck = async () => {
    try {
      setFeedback('Checking connected authority-delivery evidence…');
      await checkDelivery();
      setFeedback('No remote authority directory, delivery provider or signed receipt is connected.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to check authority delivery evidence.');
    }
  };

  const handleCancel = async () => {
    try {
      setFeedback('Cancelling the local Owner Authority request…');
      await cancelRequest();
      setFeedback('The local request was cancelled. No remote cancellation was delivered.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to cancel the authority request.');
    }
  };

  const handleStatusAction = () => {
    if (approval.canContinueRecovery) {
      navigation.navigate('RecoverLostWallet');
      return;
    }
    if (approval.canPreparePackage) {
      void handlePreparePackage();
      return;
    }
    if (approval.status === 'approval_unverified') {
      void handleDeliveryCheck();
      return;
    }
    navigation.navigate('CreateOwnerAuthority');
  };

  const statusActionLabel = approval.canContinueRecovery
    ? 'Continue Protected Recovery'
    : approval.canPreparePackage
      ? approval.packageAvailable ? 'Share Approval Package Again' : 'Prepare Approval Package'
      : approval.status === 'approval_unverified'
        ? 'Recheck Approval Evidence'
        : 'Create Owner Authority';

  return (
    <NomadPage maxWidth={880}>
      <PageHeader title="Owner Authority Approval" subtitle="Approval Required" icon="♙" color={C.green} status={false} help />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable testID="authority-approval-retry" accessibilityRole="button" accessibilityLabel="Retry Owner Authority state" onPress={() => void refresh()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <Panel tone={protectionColor === C.red ? 'red' : 'green'} style={[styles.hero, compact && styles.heroCompact]}>
        <OwnerProtectionGraphic color={protectionColor} size={compact ? 116 : 155} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Owner Authority Protection</Text>
          <Text style={styles.heroText}>This action requires independently verified approval from your designated Owner Authority. This adds an extra layer of security to your wallet.</Text>
        </View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <Text style={styles.sectionTitle}>ACTION REQUIRING APPROVAL</Text>
        <DetailRow label="Action" value={approval.action} />
        <DetailRow label="Requested By" value={requestedBy} />
        <DetailRow label="Date & Time" value={formatDate(approval.request.requestedAt)} />
        <DetailRow label="Device" value={approval.request.device || 'Current Nomad device'} />
        <DetailRow label="Reason" value={approval.reason} last />
      </Panel>

      <Panel style={styles.sectionPanel}>
        <Text style={styles.sectionTitle}>OWNER AUTHORITY CONTACT</Text>
        <View style={styles.contactHeader}>
          <View style={styles.avatar}><Text style={styles.avatarText}>OA</Text></View>
          <View style={styles.contactCopy}>
            <Text style={styles.contactName}>Owner Authority</Text>
            <Text style={styles.contactRole}>Primary Authority</Text>
          </View>
          <Pressable testID="authority-change" accessibilityRole="button" accessibilityLabel="Change Owner Authority" onPress={() => navigation.navigate('CreateOwnerAuthority')} style={({ pressed }) => [styles.changeButton, pressed && styles.pressed]}>
            <Text style={styles.changeText}>Change</Text>
          </Pressable>
        </View>
        <DetailRow label="Contact" value="Not available — directory not connected" color={C.yellow} />
        <DetailRow label="Method" value={approval.deliveryProviderConnected ? 'Secure In-App Approval' : 'Local package only'} />
        <DetailRow label="Status" value={status.label} color={status.color} last />
      </Panel>

      <Panel tone="yellow" style={styles.waitingPanel}>
        <View style={styles.clockIcon}><Text style={styles.clockText}>◷</Text></View>
        <View style={styles.waitingCopy}>
          <Text style={[styles.waitingTitle, { color: status.color }]}>{status.headline}</Text>
          <Text style={styles.waitingText}>{status.detail}</Text>
          {requestActive || approval.status === 'approval_unverified' || approval.canContinueRecovery ? (
            <Pressable
              testID="authority-status-action"
              accessibilityRole="button"
              accessibilityLabel={statusActionLabel}
              disabled={loading}
              onPress={handleStatusAction}
              style={({ pressed }) => [styles.statusButton, { borderColor: status.color }, pressed && styles.pressed, loading && styles.disabled]}
            >
              <Text style={[styles.statusButtonText, { color: status.color }]}>{loading ? 'Checking…' : statusActionLabel}  ›</Text>
            </Pressable>
          ) : null}
        </View>
      </Panel>

      {feedback ? <Text style={[styles.feedback, /unable|not connected|cannot|cancelled/i.test(feedback) && { color: C.yellow }]}>{feedback}</Text> : null}

      {approval.canCancelRequest ? (
        <Pressable
          testID="authority-cancel-request"
          accessibilityRole="button"
          accessibilityLabel="Cancel local Owner Authority request"
          disabled={loading}
          onPress={() => void handleCancel()}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed, loading && styles.disabled]}
        >
          <Text style={styles.cancelText}>Cancel Request</Text>
        </Pressable>
      ) : (
        <Pressable testID="authority-create" accessibilityRole="button" accessibilityLabel="Create Owner Authority" onPress={() => navigation.navigate('CreateOwnerAuthority')} style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}>
          <Text style={styles.createText}>Create Owner Authority</Text>
        </Pressable>
      )}

      <BottomNav active="Recovery" items={[
        ['⌂', 'Home', 'Portfolio'],
        ['▣', 'Wallets', 'Wallets'],
        ['✈', 'Travel', 'TravelMode'],
        ['◇', 'Security', 'SecurityCenter'],
        ['↻', 'Recovery', 'RecoveryCenter'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
  errorBanner: { minHeight: 48, marginBottom: 10, borderWidth: 1, borderColor: C.red, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { minHeight: 292, padding: 28, flexDirection: 'row', alignItems: 'center', gap: 34 },
  heroCompact: { flexDirection: 'column', gap: 14 },
  graphic: { alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.42, shadowRadius: 24 },
  heroCopy: { flex: 1, minWidth: 0 },
  heroTitle: { color: '#fff', fontSize: 25, fontWeight: '900' },
  heroText: { color: '#edf1f4', fontSize: 16, lineHeight: 27, marginTop: 13 },
  sectionPanel: { marginTop: 20, paddingHorizontal: 25, paddingTop: 24, paddingBottom: 9 },
  sectionTitle: { color: C.green, fontSize: 15, fontWeight: '900', marginBottom: 11 },
  detailRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 18 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  detailLabel: { width: '37%', color: '#dce1e6', fontSize: 14 },
  detailValue: { flex: 1, color: '#f1f3f5', fontSize: 14 },
  contactHeader: { minHeight: 100, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: '#5d596b', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 23 },
  contactCopy: { flex: 1, minWidth: 0, marginLeft: 18 },
  contactName: { color: '#fff', fontSize: 19, fontWeight: '900' },
  contactRole: { color: '#c5c9cf', fontSize: 14, marginTop: 5 },
  changeButton: { minHeight: 56, borderWidth: 1, borderColor: C.green, borderRadius: 10, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  changeText: { color: C.green, fontSize: 16 },
  waitingPanel: { minHeight: 190, marginTop: 20, padding: 25, flexDirection: 'row', alignItems: 'flex-start' },
  clockIcon: { width: 74, alignItems: 'center', justifyContent: 'center' },
  clockText: { color: C.yellow, fontSize: 58, lineHeight: 64 },
  waitingCopy: { flex: 1, minWidth: 0, marginLeft: 19 },
  waitingTitle: { fontSize: 20, fontWeight: '900' },
  waitingText: { color: '#e9ecef', fontSize: 14, lineHeight: 23, marginTop: 10 },
  statusButton: { alignSelf: 'flex-start', minHeight: 46, marginTop: 15, borderWidth: 1, borderRadius: 9, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  statusButtonText: { fontSize: 11, fontWeight: '900' },
  feedback: { color: C.green, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 14 },
  cancelButton: { minHeight: 96, marginTop: 20, borderWidth: 1, borderColor: C.red, borderRadius: 12, backgroundColor: 'rgba(65,8,15,.35)', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: C.red, fontSize: 21, fontWeight: '800' },
  createButton: { minHeight: 78, marginTop: 20, borderRadius: 12, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  createText: { color: C.bg, fontSize: 20, fontWeight: '900' },
});
