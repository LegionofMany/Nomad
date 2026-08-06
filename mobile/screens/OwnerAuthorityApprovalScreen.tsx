import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadOwnerAuthorityApproval } from '../nomad';
import type {
  NomadOwnerAuthorityApprovalCheck,
  NomadOwnerAuthorityApprovalEvent,
  NomadOwnerAuthorityApprovalStatus,
} from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  PrimaryButton,
  RoundIcon,
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
      return {
        color: C.green,
        tone: 'green' as const,
        eyebrow: 'SIGNED APPROVAL VERIFIED',
        title: 'Owner Authority Approval Confirmed',
        detail: 'A verified authority receipt is available and the protected recovery flow may continue.',
      };
    case 'approval_unverified':
      return {
        color: C.red,
        tone: 'red' as const,
        eyebrow: 'APPROVAL EVIDENCE INCOMPLETE',
        title: 'Approval Status Cannot Be Trusted Yet',
        detail: 'A legacy approval flag exists, but no signed receipt or verified authority signature confirms it.',
      };
    case 'awaiting_signed_receipt':
      return {
        color: C.yellow,
        tone: 'yellow' as const,
        eyebrow: 'LOCAL PACKAGE PREPARED',
        title: 'Waiting for Signed Authority Evidence',
        detail: 'The secret-free request package exists locally. Delivery, authority identity and signature remain unverified.',
      };
    case 'local_request_pending':
      return {
        color: C.blue,
        tone: 'blue' as const,
        eyebrow: 'LOCAL REQUEST PENDING',
        title: 'Prepare the Approval Request Package',
        detail: 'A request is recorded on this device, but no remote authority service has received or approved it.',
      };
    case 'declined':
      return {
        color: C.red,
        tone: 'red' as const,
        eyebrow: 'REQUEST DECLINED',
        title: 'Owner Authority Did Not Approve',
        detail: 'The protected action must remain blocked until a new verified approval is obtained.',
      };
    case 'cancelled':
      return {
        color: C.muted,
        tone: 'blue' as const,
        eyebrow: 'REQUEST CANCELLED',
        title: 'No Active Approval Request',
        detail: 'The local request was cancelled. No remote cancellation confirmation is available.',
      };
    case 'not_requested':
    default:
      return {
        color: C.purple,
        tone: 'yellow' as const,
        eyebrow: 'AUTHORITY SETUP REQUIRED',
        title: 'No Owner Authority Request Exists',
        detail: 'Create an Owner Authority and protected-action request before approval evidence can be evaluated.',
      };
  }
}

function DetailRow({
  label,
  value,
  color = '#fff',
  last,
}: {
  label: string;
  value: string;
  color?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.rowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
  );
}

function CheckRow({ item, last }: { item: NomadOwnerAuthorityApprovalCheck; last?: boolean }) {
  const color = item.status === 'pass' ? C.green : item.status === 'warning' ? C.yellow : C.red;
  const mark = item.status === 'pass' ? '✓' : item.status === 'warning' ? '!' : '×';
  return (
    <View style={[styles.checkRow, !last && styles.rowBorder]}>
      <View style={[styles.checkMark, { borderColor: color, backgroundColor: `${color}12` }]}>
        <Text style={[styles.checkMarkText, { color }]}>{mark}</Text>
      </View>
      <View style={styles.checkCopy}>
        <Text style={styles.checkTitle}>{item.label}</Text>
        <Text style={styles.checkDetail}>{item.detail}</Text>
      </View>
      <Text style={[styles.checkStatus, { color }]}>{item.status.toUpperCase()}</Text>
    </View>
  );
}

function ActivityRow({ item, last }: { item: NomadOwnerAuthorityApprovalEvent; last?: boolean }) {
  const color = item.severity === 'critical' ? C.red : item.severity === 'warning' ? C.yellow : C.green;
  return (
    <View style={[styles.activityRow, !last && styles.rowBorder]}>
      <View style={[styles.activityMark, { borderColor: color, backgroundColor: `${color}12` }]}>
        <Text style={[styles.activityMarkText, { color }]}>{item.severity === 'info' ? '✓' : '!'}</Text>
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityDetail}>{item.detail}</Text>
        <Text style={styles.activityTime}>{formatDate(item.timestamp)}</Text>
      </View>
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
  const recentActivity = approval.activity.slice(0, 5);

  const handlePreparePackage = async () => {
    try {
      setFeedback('Preparing a secret-free authority request package…');
      const result = await preparePackage();
      await Share.share({
        title: 'Nomad Owner Authority Request',
        message: result.packageJson,
      });
      setFeedback('Approval package prepared. Sharing does not prove delivery, identity or approval.');
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

  const primaryAction = () => {
    if (approval.canContinueRecovery) {
      navigation.navigate('RecoverLostWallet');
      return;
    }
    if (approval.status === 'local_request_pending' || approval.status === 'awaiting_signed_receipt') {
      void handlePreparePackage();
      return;
    }
    if (approval.status === 'approval_unverified') {
      void handleDeliveryCheck();
      return;
    }
    navigation.navigate('CreateOwnerAuthority');
  };

  const primaryLabel = approval.canContinueRecovery
    ? 'Continue Protected Recovery'
    : approval.status === 'local_request_pending'
      ? 'Prepare & Share Approval Package'
      : approval.status === 'awaiting_signed_receipt'
        ? 'Share Approval Package Again'
        : approval.status === 'approval_unverified'
          ? 'Recheck Approval Evidence'
          : 'Create Owner Authority';

  const primarySubtitle = approval.canContinueRecovery
    ? 'A verified signed receipt permits the protected action'
    : requestActive
      ? 'Generate metadata only—no keys, seed phrase or Time Sets'
      : 'Configure an authority and create a protected-action request';

  return (
    <NomadPage maxWidth={900}>
      <PageHeader
        title="Owner Authority Approval"
        subtitle="Evidence-gated approval for protected wallet actions"
        icon="♙"
        color={status.color}
        help
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <Panel tone={status.tone} style={[styles.hero, compact && styles.heroCompact]}>
        <RoundIcon
          symbol={approval.canContinueRecovery ? '✓' : approval.status === 'declined' ? '×' : '♙'}
          color={status.color}
          size={compact ? 82 : 104}
          filled
        />
        <View style={styles.heroCopy}>
          <Text style={[styles.heroEyebrow, { color: status.color }]}>{status.eyebrow}</Text>
          <Text style={styles.heroTitle}>{status.title}</Text>
          <Text style={styles.heroText}>{status.detail}</Text>
          <View style={[styles.heroBoundary, { borderColor: status.color }]}>
            <Text style={styles.heroBoundaryLabel}>RECOVERY CONTINUATION</Text>
            <Text style={[styles.heroBoundaryValue, { color: approval.canContinueRecovery ? C.green : C.red }]}>
              {approval.canContinueRecovery ? 'AUTHORIZED' : 'BLOCKED'}
            </Text>
          </View>
        </View>
      </Panel>

      <View style={[styles.metricRow, compact && styles.metricRowCompact]}>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>LOCAL REQUEST</Text>
          <Text style={[styles.metricStatus, { color: requestActive ? C.green : C.muted }]}>{requestActive ? 'PENDING' : approval.request.status.toUpperCase()}</Text>
          <Text style={styles.metricSub}>{approval.requestId || 'No request ID'}</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>REMOTE DELIVERY</Text>
          <Text style={[styles.metricStatus, { color: approval.deliveryConfirmed ? C.green : C.red }]}>{approval.deliveryConfirmed ? 'CONFIRMED' : 'NOT CONFIRMED'}</Text>
          <Text style={styles.metricSub}>Provider not connected</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>SIGNED RECEIPT</Text>
          <Text style={[styles.metricStatus, { color: approval.receiptSignatureVerified ? C.green : C.red }]}>{approval.receiptSignatureVerified ? 'VERIFIED' : 'UNAVAILABLE'}</Text>
          <Text style={styles.metricSub}>Authority signature required</Text>
        </Panel>
      </View>

      <Panel style={styles.sectionPanel}>
        <Text style={styles.sectionTitle}>ACTION REQUIRING APPROVAL</Text>
        <DetailRow label="Action" value={approval.action} />
        <DetailRow label="Request ID" value={approval.requestId || 'Not created'} />
        <DetailRow label="Requested By" value={approval.request.requestedBy || 'Wallet Owner'} />
        <DetailRow label="Date & Time" value={formatDate(approval.request.requestedAt)} />
        <DetailRow label="Device" value={approval.request.device || 'Current Nomad device'} />
        <DetailRow label="Reason" value={approval.reason} last />
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>APPROVAL EVIDENCE</Text>
            <Text style={styles.sectionSub}>Every required authority boundary is evaluated independently</Text>
          </View>
          <Text style={[styles.evidenceCount, { color: approval.checks.every((item) => item.status === 'pass') ? C.green : C.yellow }]}>
            {approval.checks.filter((item) => item.status === 'pass').length}/{approval.checks.length}
          </Text>
        </View>
        {approval.checks.map((item, index) => (
          <CheckRow key={item.id} item={item} last={index === approval.checks.length - 1} />
        ))}
      </Panel>

      <View style={[styles.infoColumns, compact && styles.infoColumnsCompact]}>
        <Panel style={styles.infoPanel}>
          <Text style={styles.sectionTitle}>APPROVAL PACKAGE</Text>
          <DetailRow label="Format" value="nomad-owner-authority-request-v1" />
          <DetailRow label="Contains Secrets" value="NO" color={C.green} />
          <DetailRow label="Contains Private Keys" value="NO" color={C.green} />
          <DetailRow label="Contains Time Sets" value="NO" color={C.green} />
          <DetailRow label="Signature Required" value="YES" color={C.yellow} />
          <DetailRow label="Prepared" value={formatDate(approval.packagePreparedAt)} last />
          {approval.canPreparePackage ? (
            <Pressable
              disabled={loading}
              onPress={() => void handlePreparePackage()}
              style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed, loading && styles.disabled]}
            >
              <Text style={styles.outlineButtonText}>{approval.packageAvailable ? 'Share Package Again' : 'Prepare Approval Package'}  ›</Text>
            </Pressable>
          ) : null}
        </Panel>

        <Panel style={styles.infoPanel}>
          <Text style={styles.sectionTitle}>AUTHORITY PROVIDER</Text>
          <Text style={styles.providerText}>
            The current build has no authority directory, encrypted delivery service, hardware identity check or signed-receipt verifier. A local package cannot approve recovery by itself.
          </Text>
          <View style={styles.providerStatus}>
            <Text style={styles.providerStatusLabel}>Remote provider</Text>
            <Text style={styles.providerStatusValue}>NOT CONNECTED</Text>
          </View>
          <Pressable
            disabled={loading}
            onPress={() => void handleDeliveryCheck()}
            style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed, loading && styles.disabled]}
          >
            <Text style={styles.outlineButtonText}>Check Delivery Evidence  ›</Text>
          </Pressable>
        </Panel>
      </View>

      <Panel style={styles.activityPanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>OWNER AUTHORITY ACTIVITY</Text>
            <Text style={styles.sectionSub}>Local metadata events—no authority secrets or signatures</Text>
          </View>
          <Text style={styles.activityCount}>{approval.activity.length}</Text>
        </View>
        {recentActivity.length ? recentActivity.map((item, index) => (
          <ActivityRow key={item.id} item={item} last={index === recentActivity.length - 1} />
        )) : <Text style={styles.emptyActivity}>No Owner Authority package or delivery checks are recorded yet.</Text>}
      </Panel>

      {feedback ? (
        <Text style={[styles.feedback, /unable|blocked|not connected|cannot/i.test(feedback) && { color: C.yellow }]}>{feedback}</Text>
      ) : null}

      <PrimaryButton
        label={loading ? 'Checking Authority…' : primaryLabel}
        subtitle={primarySubtitle}
        icon="♙"
        tone={approval.canContinueRecovery ? 'green' : 'blue'}
        disabled={loading}
        onPress={primaryAction}
      />

      {approval.canCancelRequest ? (
        <Pressable
          disabled={loading}
          onPress={() => void handleCancel()}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed, loading && styles.disabled]}
        >
          <Text style={styles.cancelButtonText}>Cancel Local Request</Text>
        </Pressable>
      ) : null}

      <Panel tone="red" style={styles.warningPanel}>
        <Text style={styles.warningIcon}>⚠</Text>
        <Text style={styles.warningText}>
          A wallet owner cannot approve their own Owner Authority request. Do not continue recovery unless an independently verified authority signature and signed receipt are available.
        </Text>
      </Panel>

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
  errorBanner: { minHeight: 48, marginBottom: 10, borderWidth: 1, borderColor: C.red, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { minHeight: 200, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroCompact: { flexDirection: 'column', alignItems: 'flex-start' },
  heroCopy: { flex: 1, minWidth: 0 },
  heroEyebrow: { fontSize: 10, fontWeight: '900' },
  heroTitle: { color: '#fff', fontSize: 23, fontWeight: '900', marginTop: 7 },
  heroText: { color: '#edf3f8', fontSize: 11, lineHeight: 18, marginTop: 8 },
  heroBoundary: { minHeight: 50, marginTop: 15, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBoundaryLabel: { color: C.muted, fontSize: 8, fontWeight: '900' },
  heroBoundaryValue: { fontSize: 10, fontWeight: '900' },
  metricRow: { flexDirection: 'row', gap: 10, marginTop: 17 },
  metricRowCompact: { flexDirection: 'column' },
  metricCard: { flex: 1, minHeight: 104, padding: 14 },
  metricLabel: { color: C.muted, fontSize: 8, fontWeight: '900' },
  metricStatus: { fontSize: 14, fontWeight: '900', marginTop: 10 },
  metricSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 5 },
  sectionPanel: { marginTop: 17, padding: 18 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 5 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900', letterSpacing: .3 },
  sectionSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  evidenceCount: { fontSize: 16, fontWeight: '900' },
  detailRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  detailLabel: { color: C.muted, fontSize: 10 },
  detailValue: { flex: 1, color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'right' },
  checkRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkMark: { width: 39, height: 39, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkMarkText: { fontSize: 15, fontWeight: '900' },
  checkCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  checkTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  checkDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  checkStatus: { fontSize: 7, fontWeight: '900', marginLeft: 8 },
  infoColumns: { flexDirection: 'row', gap: 12, marginTop: 17 },
  infoColumnsCompact: { flexDirection: 'column' },
  infoPanel: { flex: 1, padding: 17 },
  providerText: { color: '#e7edf5', fontSize: 9, lineHeight: 15, marginTop: 12 },
  providerStatus: { minHeight: 48, marginTop: 13, borderWidth: 1, borderColor: C.red, borderRadius: 9, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  providerStatusLabel: { color: C.muted, fontSize: 8 },
  providerStatusValue: { color: C.red, fontSize: 9, fontWeight: '900' },
  outlineButton: { minHeight: 44, marginTop: 13, borderWidth: 1, borderColor: C.green, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  outlineButtonText: { color: C.green, fontSize: 9, fontWeight: '900' },
  activityPanel: { marginTop: 17, padding: 17 },
  activityCount: { color: C.green, fontSize: 16, fontWeight: '900' },
  activityRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  activityMark: { width: 37, height: 37, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  activityMarkText: { fontSize: 14, fontWeight: '900' },
  activityCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  activityTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  activityDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  activityTime: { color: '#68798d', fontSize: 7, marginTop: 4 },
  emptyActivity: { color: C.muted, fontSize: 9, lineHeight: 15, paddingVertical: 18 },
  feedback: { color: C.green, fontSize: 10, lineHeight: 15, marginTop: 12 },
  cancelButton: { minHeight: 58, marginTop: 12, borderWidth: 1, borderColor: C.red, borderRadius: 12, backgroundColor: 'rgba(55,8,16,.38)', alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: C.red, fontSize: 13, fontWeight: '900' },
  warningPanel: { minHeight: 82, marginTop: 17, padding: 14, flexDirection: 'row', alignItems: 'center' },
  warningIcon: { color: C.red, fontSize: 26, marginRight: 12 },
  warningText: { flex: 1, color: '#e7edf5', fontSize: 9, lineHeight: 15 },
  pressed: { opacity: .72 },
  disabled: { opacity: .5 },
});
