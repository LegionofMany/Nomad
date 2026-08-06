import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadWalletRestoration } from '../nomad';
import type {
  NomadWalletRestorationCheck,
  NomadWalletRestorationStatus,
} from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  PrimaryButton,
  ProgressBar,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

function statusInfo(status: NomadWalletRestorationStatus) {
  switch (status) {
    case 'restored':
      return {
        color: C.green,
        tone: 'green' as const,
        title: 'WALLET RESTORED',
        headline: 'Recovery Successful',
        detail: 'A connected provider supplied a verified restoration receipt and confirmed that wallet key material was restored.',
      };
    case 'verified_waiting_provider':
      return {
        color: C.yellow,
        tone: 'yellow' as const,
        title: 'RESTORATION PENDING',
        headline: 'Sequence Verified—Wallet Not Restored',
        detail: 'All enrolled Time Set digests matched, but no production provider or signed receipt confirms that private keys were restored.',
      };
    case 'verification_in_progress':
      return {
        color: C.blue,
        tone: 'blue' as const,
        title: 'VERIFICATION IN PROGRESS',
        headline: 'Recovery Is Not Complete',
        detail: 'The protected Time Set sequence is still being verified. Wallet restoration cannot begin until all 24 entries match.',
      };
    case 'setup_required':
    default:
      return {
        color: C.purple,
        tone: 'yellow' as const,
        title: 'RECOVERY SETUP REQUIRED',
        headline: 'No Completed Recovery Evidence',
        detail: 'Start or resume the protected lost-wallet recovery flow before this page can evaluate restoration evidence.',
      };
  }
}

function CompletionSteps({
  status,
  hasSession,
  sequenceVerified,
}: {
  status: NomadWalletRestorationStatus;
  hasSession: boolean;
  sequenceVerified: boolean;
}) {
  const restored = status === 'restored';
  const steps = [
    { number: 1, label: 'Prepare Recovery', done: hasSession, active: !hasSession },
    { number: 2, label: 'Verify Sequence', done: sequenceVerified, active: hasSession && !sequenceVerified },
    { number: 3, label: 'Restore Wallet', done: restored, active: sequenceVerified && !restored },
    { number: 4, label: 'Complete', done: restored, active: false },
  ];

  return (
    <Panel style={styles.stepper}>
      {steps.map((step, index) => {
        const color = step.done ? C.green : step.active ? C.yellow : C.muted;
        return (
          <React.Fragment key={step.label}>
            <View style={styles.step}>
              <View
                style={[
                  styles.stepCircle,
                  { borderColor: color },
                  step.done && styles.stepDone,
                  step.active && styles.stepActive,
                ]}
              >
                <Text style={[styles.stepMark, { color: step.done ? C.bg : color }]}>{step.done ? '✓' : step.number}</Text>
              </View>
              <Text style={[styles.stepText, { color }]}>{step.label}</Text>
              <Text style={styles.stepSub}>{step.done ? 'Complete' : step.active ? 'Current' : 'Pending'}</Text>
            </View>
            {index < steps.length - 1 ? <Text style={styles.stepArrow}>→</Text> : null}
          </React.Fragment>
        );
      })}
    </Panel>
  );
}

function SummaryRow({
  label,
  value,
  color = '#eef3f7',
  last,
}: {
  label: string;
  value: string;
  color?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, !last && styles.rowBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

function CheckRow({ item, last }: { item: NomadWalletRestorationCheck; last?: boolean }) {
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
      <Text style={[styles.checkStatus, { color }]}>{item.status.replace('_', ' ').toUpperCase()}</Text>
    </View>
  );
}

function ActivityRow({
  title,
  detail,
  timestamp,
  severity,
  last,
}: {
  title: string;
  detail: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  last?: boolean;
}) {
  const color = severity === 'critical' ? C.red : severity === 'warning' ? C.yellow : C.green;
  return (
    <View style={[styles.activityRow, !last && styles.rowBorder]}>
      <View style={[styles.activityMark, { borderColor: color, backgroundColor: `${color}12` }]}>
        <Text style={[styles.activityMarkText, { color }]}>{severity === 'info' ? '✓' : '!'}</Text>
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityDetail}>{detail}</Text>
        <Text style={styles.activityTime}>{new Date(timestamp).toLocaleString()}</Text>
      </View>
    </View>
  );
}

export default function WalletRecoveredScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { restoration, loading, error, refresh } = useNomadWalletRestoration();
  const status = statusInfo(restoration.status);
  const lostWallet = restoration.lostWallet;
  const sequence = lostWallet.sequence;
  const verifiedSets = Math.min(sequence.verifiedSets, Math.max(1, sequence.totalSets));
  const sequencePercent = Math.round((verifiedSets / Math.max(1, sequence.totalSets)) * 100);
  const recentActivity = lostWallet.activity.slice(0, 4);
  const session = lostWallet.activeSession;

  const primaryRoute = restoration.canOpenRecoveredWallet
    ? 'Portfolio'
    : restoration.status === 'verification_in_progress'
      ? 'VerifyRecoverySequence'
      : restoration.status === 'verified_waiting_provider'
        ? 'RecoveryCenter'
        : 'RecoverLostWallet';

  const primaryLabel = restoration.canOpenRecoveredWallet
    ? 'Open Recovered Wallet'
    : restoration.status === 'verification_in_progress'
      ? 'Continue Sequence Verification'
      : restoration.status === 'verified_waiting_provider'
        ? 'Review Restoration Requirements'
        : 'Start Lost-Wallet Recovery';

  const primarySubtitle = restoration.canOpenRecoveredWallet
    ? 'A verified restoration receipt permits wallet access'
    : restoration.status === 'verified_waiting_provider'
      ? 'Connect a production provider and verify a signed receipt'
      : 'Complete the owner-controlled recovery sequence';

  return (
    <NomadPage maxWidth={880}>
      <PageHeader
        title={restoration.status === 'restored' ? 'Wallet Recovered' : 'Wallet Recovery Status'}
        subtitle={restoration.status === 'restored' ? 'Step 4 of 4' : 'Evidence-based restoration gate'}
        icon="◇"
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

      <CompletionSteps
        status={restoration.status}
        hasSession={restoration.activeRecoverySession}
        sequenceVerified={restoration.sequenceVerified}
      />

      <Panel tone={status.tone} style={styles.statusPanel}>
        <View style={[styles.statusBadge, { borderColor: status.color }]}>
          <Text style={[styles.statusMark, { color: status.color }]}>{restoration.status === 'restored' ? '✓' : '!'}</Text>
        </View>
        <Text style={[styles.statusEyebrow, { color: status.color }]}>{status.title}</Text>
        <Text style={styles.statusHeadline}>{status.headline}</Text>
        <Text style={styles.statusText}>{status.detail}</Text>
        <View style={styles.statusBoundary}>
          <Text style={styles.statusBoundaryLabel}>PRIVATE KEYS RESTORED</Text>
          <Text style={[styles.statusBoundaryValue, { color: restoration.privateKeysRestored ? C.green : C.red }]}>
            {restoration.privateKeysRestored ? 'CONFIRMED' : 'NO'}
          </Text>
        </View>
      </Panel>

      <View style={[styles.metricRow, compact && styles.metricRowCompact]}>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>TIME SETS</Text>
          <Text style={[styles.metricValue, { color: restoration.sequenceVerified ? C.green : C.blue }]}>{verifiedSets}/{sequence.totalSets}</Text>
          <Text style={styles.metricSub}>{restoration.sequenceVerified ? 'Verified' : 'Verification progress'}</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>RESTORATION PROVIDER</Text>
          <Text style={[styles.metricStatus, { color: restoration.restorationProviderConnected ? C.green : C.red }]}>
            {restoration.restorationProviderConnected ? 'CONNECTED' : 'NOT CONNECTED'}
          </Text>
          <Text style={styles.metricSub}>Key-restoration boundary</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>SIGNED RECEIPT</Text>
          <Text style={[styles.metricStatus, { color: restoration.receiptSignatureVerified ? C.green : C.red }]}>
            {restoration.receiptSignatureVerified ? 'VERIFIED' : 'UNAVAILABLE'}
          </Text>
          <Text style={styles.metricSub}>Required for completion</Text>
        </Panel>
      </View>

      <Panel style={styles.progressPanel}>
        <View style={styles.progressHeading}>
          <View>
            <Text style={styles.sectionTitle}>SEQUENCE VERIFICATION</Text>
            <Text style={styles.sectionSub}>Digest matching is separate from wallet-key restoration</Text>
          </View>
          <Text style={styles.progressValue}>{verifiedSets} of {sequence.totalSets}</Text>
        </View>
        <ProgressBar value={sequencePercent} color={C.green} height={9} />
        <View style={styles.milestones}>
          {[6, 12, 18, 24].map((value) => (
            <View key={value} style={styles.milestone}>
              <Text style={[styles.milestoneMark, verifiedSets >= value && { color: C.green }]}>{verifiedSets >= value ? '✓' : '•'}</Text>
              <Text style={styles.milestoneLabel}>{value} Sets</Text>
            </View>
          ))}
        </View>
      </Panel>

      <Panel style={styles.checkPanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>RESTORATION EVIDENCE</Text>
            <Text style={styles.sectionSub}>Every requirement must pass before Wallet Recovered is valid</Text>
          </View>
          <Pressable onPress={() => void refresh()} disabled={loading} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed, loading && styles.disabled]}>
            <Text style={styles.refreshText}>{loading ? 'Checking…' : 'Recheck'}</Text>
          </Pressable>
        </View>
        {restoration.checks.map((item, index) => (
          <CheckRow key={item.id} item={item} last={index === restoration.checks.length - 1} />
        ))}
      </Panel>

      <View style={[styles.infoColumns, compact && styles.infoColumnsCompact]}>
        <Panel style={styles.summaryPanel}>
          <Text style={styles.sectionTitle}>RECOVERY SUMMARY</Text>
          <SummaryRow label="Recovery Session" value={session?.id ?? 'Not started'} />
          <SummaryRow label="Reason" value={session?.reason.replace(/_/g, ' ') ?? 'Not selected'} />
          <SummaryRow label="Verification Provider" value={restoration.lostWallet.verificationProvider.replace(/_/g, ' ')} />
          <SummaryRow label="Digest Algorithm" value={restoration.lostWallet.digestAlgorithm} />
          <SummaryRow label="Session Contains Secrets" value={session?.containsSecrets === false ? 'No' : 'No session'} color={C.green} />
          <SummaryRow label="Wallet State Changed" value={restoration.walletStateChangedByRecovery ? 'Yes' : 'No'} color={restoration.walletStateChangedByRecovery ? C.green : C.red} />
          <SummaryRow label="Checked" value={new Date(restoration.checkedAt).toLocaleString()} last />
        </Panel>

        <Panel tone="yellow" style={styles.boundaryPanel}>
          <RoundIcon symbol="▣" color={C.yellow} size={55} filled />
          <Text style={styles.boundaryTitle}>Verification Is Not Restoration</Text>
          <Text style={styles.boundaryText}>
            Matching all 24 salted digests proves that the entered sequence matches the enrolled recovery evidence. It does not reconstruct a seed, restore private keys or authorize a new device.
          </Text>
          <View style={styles.boundaryList}>
            <Text style={styles.boundaryItem}>× Cross-device recovery package</Text>
            <Text style={styles.boundaryItem}>× Hardware-backed identity proof</Text>
            <Text style={styles.boundaryItem}>× Provider-signed restoration receipt</Text>
            <Text style={styles.boundaryItem}>× Restored key material</Text>
          </View>
        </Panel>
      </View>

      <Panel style={styles.activityPanel}>
        <View style={styles.activityHeading}>
          <View>
            <Text style={styles.sectionTitle}>RECOVERY ACTIVITY</Text>
            <Text style={styles.sectionSub}>Metadata records only—no Time Set values or private keys</Text>
          </View>
          <Text style={styles.activityCount}>{lostWallet.activity.length}</Text>
        </View>
        {recentActivity.length ? recentActivity.map((item, index) => (
          <ActivityRow
            key={item.id}
            title={item.title}
            detail={item.detail}
            timestamp={item.timestamp}
            severity={item.severity}
            last={index === recentActivity.length - 1}
          />
        )) : <Text style={styles.emptyActivity}>No lost-wallet recovery activity is recorded.</Text>}
      </Panel>

      <PrimaryButton
        label={primaryLabel}
        subtitle={primarySubtitle}
        icon={restoration.canOpenRecoveredWallet ? '▣' : '◇'}
        tone={restoration.status === 'restored' ? 'green' : restoration.status === 'verified_waiting_provider' ? 'green' : 'blue'}
        disabled={loading}
        onPress={() => navigation.navigate(primaryRoute)}
      />

      <Pressable
        onPress={() => navigation.navigate(lostWallet.ownerAuthorityStatus === 'pending' ? 'OwnerAuthorityApproval' : 'CreateOwnerAuthority')}
        style={styles.secondaryAction}
      >
        <Text style={styles.secondaryText}>
          {lostWallet.ownerAuthorityStatus === 'pending' ? 'Review Owner Authority' : 'Configure Owner Authority'}
        </Text>
      </Pressable>

      <Panel tone="red" style={styles.warningPanel}>
        <Text style={styles.warningIcon}>⚠</Text>
        <Text style={styles.warningText}>
          Do not treat a verified Time Set sequence as proof that funds or private keys were restored. Only a cryptographically verified provider receipt and confirmed wallet-state change may unlock the recovered-wallet action.
        </Text>
      </Panel>

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
  errorBanner: { minHeight: 48, marginBottom: 10, borderWidth: 1, borderColor: C.red, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  stepper: { minHeight: 96, padding: 12, flexDirection: 'row', alignItems: 'center' },
  step: { flex: 1, alignItems: 'center' },
  stepCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, backgroundColor: 'rgba(255,255,255,.02)', alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: C.green },
  stepActive: { backgroundColor: 'rgba(255,194,41,.08)' },
  stepMark: { fontWeight: '900' },
  stepText: { fontSize: 8, textAlign: 'center', marginTop: 6 },
  stepSub: { color: C.muted, fontSize: 7, marginTop: 2 },
  stepArrow: { color: C.muted, fontSize: 17 },
  statusPanel: { minHeight: 350, marginTop: 17, padding: 23, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { width: 126, height: 126, borderRadius: 63, borderWidth: 7, backgroundColor: 'rgba(2,18,12,.72)', alignItems: 'center', justifyContent: 'center' },
  statusMark: { fontSize: 62, fontWeight: '900' },
  statusEyebrow: { fontSize: 10, fontWeight: '900', marginTop: 18 },
  statusHeadline: { color: '#fff', fontSize: 27, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  statusText: { color: '#edf3f8', fontSize: 11, lineHeight: 18, textAlign: 'center', maxWidth: 560, marginTop: 10 },
  statusBoundary: { minWidth: 230, marginTop: 20, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBoundaryLabel: { color: C.muted, fontSize: 8, fontWeight: '900' },
  statusBoundaryValue: { fontSize: 10, fontWeight: '900' },
  metricRow: { flexDirection: 'row', gap: 10, marginTop: 17 },
  metricRowCompact: { flexDirection: 'column' },
  metricCard: { flex: 1, minHeight: 111, padding: 14 },
  metricLabel: { color: C.muted, fontSize: 8, fontWeight: '900' },
  metricValue: { fontSize: 27, fontWeight: '900', marginTop: 9 },
  metricStatus: { fontSize: 12, fontWeight: '900', marginTop: 12 },
  metricSub: { color: C.muted, fontSize: 8, marginTop: 5 },
  progressPanel: { marginTop: 17, padding: 17 },
  progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  progressValue: { color: C.green, fontSize: 13, fontWeight: '900' },
  milestones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  milestone: { alignItems: 'center' },
  milestoneMark: { color: C.muted, fontSize: 16 },
  milestoneLabel: { color: C.muted, fontSize: 7, marginTop: 3 },
  checkPanel: { marginTop: 17, padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 7 },
  sectionTitle: { color: C.green, fontSize: 13, fontWeight: '900', letterSpacing: .3 },
  sectionSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 3 },
  refreshButton: { borderWidth: 1, borderColor: C.green, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 8 },
  refreshText: { color: C.green, fontSize: 8, fontWeight: '900' },
  checkRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkMark: { width: 39, height: 39, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkMarkText: { fontSize: 16, fontWeight: '900' },
  checkCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  checkTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  checkDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  checkStatus: { marginLeft: 8, fontSize: 7, fontWeight: '900' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  infoColumns: { flexDirection: 'row', gap: 12, marginTop: 17 },
  infoColumnsCompact: { flexDirection: 'column' },
  summaryPanel: { flex: 1, padding: 17 },
  summaryRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 15 },
  summaryLabel: { color: '#eef3f7', fontSize: 9 },
  summaryValue: { flex: 1, color: '#eef3f7', fontSize: 9, fontWeight: '700', textAlign: 'right', textTransform: 'capitalize' },
  boundaryPanel: { flex: 1, padding: 17, alignItems: 'flex-start' },
  boundaryTitle: { color: C.yellow, fontSize: 14, fontWeight: '900', marginTop: 12 },
  boundaryText: { color: '#f0e8d6', fontSize: 9, lineHeight: 15, marginTop: 7 },
  boundaryList: { marginTop: 12 },
  boundaryItem: { color: C.muted, fontSize: 8, lineHeight: 15 },
  activityPanel: { marginTop: 17, padding: 17 },
  activityHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  activityCount: { color: C.green, fontSize: 15, fontWeight: '900' },
  activityRow: { minHeight: 76, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  activityMark: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  activityMarkText: { fontSize: 15, fontWeight: '900' },
  activityCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  activityTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  activityDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  activityTime: { color: '#738397', fontSize: 7, marginTop: 4 },
  emptyActivity: { color: C.muted, fontSize: 9, paddingVertical: 18 },
  secondaryAction: { alignSelf: 'center', padding: 13 },
  secondaryText: { color: C.green, fontSize: 11, fontWeight: '800' },
  warningPanel: { minHeight: 82, marginTop: 5, padding: 14, flexDirection: 'row', alignItems: 'center' },
  warningIcon: { color: C.red, fontSize: 25, marginRight: 12 },
  warningText: { flex: 1, color: '#e7edf5', fontSize: 9, lineHeight: 15 },
  pressed: { opacity: .72 },
  disabled: { opacity: .5 },
});
