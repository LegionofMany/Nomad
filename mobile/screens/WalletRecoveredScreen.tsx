import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { useNomadWalletRestoration } from '../nomad';
import type { NomadWalletRestorationStatus } from '../nomad';
import {
  BottomNav,
  C,
  NomadGlyph,
  NomadPage,
  PageHeader,
  Panel,
} from '../ui/NomadShell';

function statusInfo(status: NomadWalletRestorationStatus) {
  switch (status) {
    case 'restored':
      return {
        color: C.green,
        tone: 'green' as const,
        title: 'Wallet Recovered',
        subtitle: 'Step 4 of 4',
        headline: 'Recovery Successful!',
        detail: 'Your wallet has been successfully recovered and is now secure.',
      };
    case 'verified_waiting_provider':
      return {
        color: C.yellow,
        tone: 'yellow' as const,
        title: 'Wallet Recovery Status',
        subtitle: 'Step 3 of 4',
        headline: 'Sequence Verified—Wallet Not Restored',
        detail: 'All 24 Time Sets matched, but no connected provider or verified receipt confirms restoration.',
      };
    case 'verification_in_progress':
      return {
        color: C.blue,
        tone: 'blue' as const,
        title: 'Wallet Recovery Status',
        subtitle: 'Step 2 of 4',
        headline: 'Recovery Is Not Complete',
        detail: 'Finish verifying all 24 Time Sets before wallet restoration can be evaluated.',
      };
    case 'setup_required':
    default:
      return {
        color: C.purple,
        tone: 'purple' as const,
        title: 'Wallet Recovery Status',
        subtitle: 'Step 1 of 4',
        headline: 'No Completed Recovery Evidence',
        detail: 'Start the protected lost-wallet recovery flow before restoration can be evaluated.',
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
    { number: 1, label: 'Enter 24\nTime Sets', done: hasSession, active: !hasSession },
    { number: 2, label: 'Verify\nSequence', done: sequenceVerified, active: hasSession && !sequenceVerified },
    { number: 3, label: 'Recover\nWallet', done: restored, active: sequenceVerified && !restored },
    { number: 4, label: 'Complete', done: false, active: restored },
  ];

  return (
    <Panel style={styles.stepper}>
      {steps.map((step, index) => {
        const highlighted = step.done || step.active;
        return (
          <React.Fragment key={step.number}>
            <View style={styles.step}>
              <View style={[styles.stepCircle, highlighted && styles.stepCircleActive]}>
                <Text style={[styles.stepMark, highlighted && styles.stepMarkActive]}>{step.done ? '✓' : step.number}</Text>
              </View>
              <Text style={[styles.stepLabel, highlighted && { color: C.green }]}>{step.label}</Text>
            </View>
            {index < steps.length - 1 ? <Text style={styles.stepArrow}>→</Text> : null}
          </React.Fragment>
        );
      })}
    </Panel>
  );
}

function RecoveryCompletionGraphic({ color, restored }: { color: string; restored: boolean }) {
  const rings = [112, 92, 72];
  const spokes = Array.from({ length: 12 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 12;
    return {
      x1: 140 + Math.cos(angle) * 76,
      y1: 128 + Math.sin(angle) * 76,
      x2: 140 + Math.cos(angle) * 116,
      y2: 128 + Math.sin(angle) * 116,
    };
  });

  return (
    <View accessibilityLabel={restored ? 'Recovered wallet shield' : 'Wallet restoration pending shield'} style={[styles.graphic, { shadowColor: color }]}>
      <Svg width={280} height={260} viewBox="0 0 280 260" fill="none">
        {spokes.map((spoke, index) => <Line key={index} {...spoke} stroke={color} strokeOpacity={0.21} strokeWidth="1" />)}
        {rings.map((radius) => <Circle key={radius} cx="140" cy="128" r={radius} stroke={color} strokeOpacity={0.3} strokeWidth="1" />)}
        <Circle cx="140" cy="128" r="104" stroke={color} strokeOpacity={0.22} strokeWidth="1" strokeDasharray="3 8" />
        <Path d="M140 39c-28 21-52 28-73 33v51c0 45 27 77 73 99 46-22 73-54 73-99V72c-21-5-45-12-73-33Z" fill="#03150f" stroke={color} strokeWidth="9" strokeLinejoin="round" />
        <Path d={restored ? 'm104 128 24 25 49-55' : 'M140 91v55M140 176v2'} stroke={color} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

function SummaryRow({ label, value, color, last }: { label: string; value: string; color?: string; last?: boolean }) {
  return (
    <View style={[styles.summaryRow, !last && styles.summaryBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

export default function WalletRecoveredScreen() {
  const navigation = useNavigation<any>();
  const { restoration, loading, error, refresh } = useNomadWalletRestoration();
  const status = statusInfo(restoration.status);
  const sequence = restoration.lostWallet.sequence;
  const totalSets = Math.max(1, sequence.totalSets);
  const verifiedSets = Math.min(sequence.verifiedSets, totalSets);
  const restored = restoration.status === 'restored' && restoration.canOpenRecoveredWallet;
  const receiptDate = restoration.receipt?.restoredAt
    ? new Date(restoration.receipt.restoredAt).toLocaleString()
    : 'Pending provider receipt';
  const strengthLabel = restoration.sequenceVerified
    ? `Strong (${sequence.strengthScore} / 100)`
    : `In progress (${sequence.strengthScore} / 100)`;

  const continueRoute = restoration.status === 'verification_in_progress'
    ? 'VerifyRecoverySequence'
    : restoration.status === 'setup_required'
      ? 'RecoverLostWallet'
      : 'RecoveryCenter';

  return (
    <NomadPage maxWidth={880}>
      <PageHeader title={status.title} subtitle={status.subtitle} icon="◇" color={status.color} status={false} help />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable testID="wallet-recovery-retry" accessibilityRole="button" accessibilityLabel="Retry wallet restoration evidence" onPress={() => void refresh()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <CompletionSteps status={restoration.status} hasSession={restoration.activeRecoverySession} sequenceVerified={restoration.sequenceVerified} />

      <Panel tone={status.tone} style={styles.hero}>
        <RecoveryCompletionGraphic color={status.color} restored={restored} />
        <Text style={[styles.heroTitle, { color: status.color }]}>{status.headline}</Text>
        <Text style={styles.heroText}>{status.detail}</Text>
        {!restored ? (
          <View style={[styles.pendingPill, { borderColor: status.color }]}>
            <Text style={[styles.pendingPillText, { color: status.color }]}>PRIVATE KEYS RESTORED: NO</Text>
          </View>
        ) : null}
      </Panel>

      <Panel style={styles.summaryPanel}>
        <Text style={[styles.sectionTitle, { color: status.color }]}>WALLET SUMMARY</Text>
        <SummaryRow label="Wallet Name" value="My Nomad Wallet" />
        <SummaryRow label="Recovery Date" value={receiptDate} />
        <SummaryRow label="Recovery Method" value="24 Time Sets" />
        <SummaryRow label="Time Sets Verified" value={`${verifiedSets} of ${totalSets}`} color={restoration.sequenceVerified ? C.green : C.blue} />
        <SummaryRow label="Security Strength" value={strengthLabel} color={restoration.sequenceVerified ? C.green : C.yellow} last />
      </Panel>

      <Panel tone={restored ? 'green' : 'yellow'} style={styles.restoreNotice}>
        <View style={styles.noticeIcon}>
          <NomadGlyph kind={restored ? 'security' : 'recovery'} color={restored ? C.green : C.yellow} size={47} />
        </View>
        <Text style={styles.noticeText}>
          {restored
            ? 'Your wallet, keys, and settings have been fully restored. You can now access and manage your funds securely.'
            : 'Your Time Set sequence is verified, but wallet keys and settings remain unchanged until a connected provider supplies a valid signed restoration receipt.'}
        </Text>
      </Panel>

      {!restored && restoration.status === 'verified_waiting_provider' ? (
        <Panel tone="yellow" style={styles.evidencePanel}>
          <View style={styles.evidenceHeading}>
            <Text style={styles.evidenceTitle}>RESTORATION REQUIREMENTS</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Recheck restoration requirements" disabled={loading} onPress={() => void refresh()} style={styles.recheckButton}>
              <Text style={styles.recheckText}>{loading ? 'Checking…' : 'Recheck'}</Text>
            </Pressable>
          </View>
          {restoration.checks.map((check, index) => {
            const passed = check.status === 'pass';
            return (
              <View key={check.id} style={[styles.evidenceRow, index < restoration.checks.length - 1 && styles.summaryBorder]}>
                <Text style={[styles.evidenceMark, { color: passed ? C.green : C.red }]}>{passed ? '✓' : '×'}</Text>
                <View style={styles.evidenceCopy}>
                  <Text style={styles.evidenceLabel}>{check.label}</Text>
                  <Text style={styles.evidenceDetail}>{check.detail}</Text>
                </View>
              </View>
            );
          })}
        </Panel>
      ) : null}

      <Pressable
        testID="open-recovered-wallet"
        accessibilityRole="button"
        accessibilityLabel={restored ? 'Open recovered wallet' : 'Open wallet blocked until restoration evidence is verified'}
        disabled={!restored || loading}
        onPress={() => navigation.navigate('Portfolio')}
        style={({ pressed }) => [styles.openButton, (!restored || loading) && styles.openButtonDisabled, pressed && restored && styles.pressed]}
      >
        <NomadGlyph kind="wallet" color={restored ? C.bg : C.muted2} size={36} />
        <Text style={[styles.openButtonText, !restored && styles.openButtonTextDisabled]}>{restored ? 'Open Wallet' : 'Open Wallet — Blocked'}</Text>
      </Pressable>

      <Pressable
        testID="wallet-recovery-secondary"
        accessibilityRole="button"
        accessibilityLabel={restored ? 'Go to Home' : 'Return to Recovery Center'}
        onPress={() => navigation.navigate(restored ? 'Portfolio' : continueRoute)}
        style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
      >
        <Text style={[styles.secondaryText, { color: restored ? C.green : status.color }]}>{restored ? 'Go to Home' : restoration.status === 'verification_in_progress' ? 'Continue Verification' : restoration.status === 'setup_required' ? 'Start Recovery' : 'Return to Recovery Center'}</Text>
      </Pressable>

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
  errorBanner: { minHeight: 48, marginBottom: 10, borderWidth: 1, borderColor: C.red, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  stepper: { minHeight: 120, paddingHorizontal: 17, paddingVertical: 17, flexDirection: 'row', alignItems: 'center' },
  step: { flex: 1, alignItems: 'center' },
  stepCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#56606c', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { borderColor: C.green, backgroundColor: C.green },
  stepMark: { color: '#d4d9df', fontSize: 16, fontWeight: '800' },
  stepMarkActive: { color: C.bg },
  stepLabel: { color: '#d4d9df', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 8 },
  stepArrow: { color: '#767d86', fontSize: 27, marginHorizontal: 4, marginBottom: 31 },
  hero: { minHeight: 555, marginTop: 20, paddingHorizontal: 22, paddingTop: 13, paddingBottom: 28, alignItems: 'center', justifyContent: 'center' },
  graphic: { width: 280, height: 260, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.45, shadowRadius: 25 },
  heroTitle: { fontSize: 31, fontWeight: '900', textAlign: 'center', marginTop: 5 },
  heroText: { color: '#e8edf1', maxWidth: 600, fontSize: 17, lineHeight: 25, textAlign: 'center', marginTop: 14 },
  pendingPill: { marginTop: 20, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  pendingPillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  summaryPanel: { marginTop: 20, paddingHorizontal: 25, paddingTop: 23, paddingBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '900', marginBottom: 10 },
  summaryRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18 },
  summaryBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  summaryLabel: { color: '#f0f2f4', fontSize: 13 },
  summaryValue: { flex: 1, color: '#f0f2f4', fontSize: 13, textAlign: 'right' },
  restoreNotice: { minHeight: 108, marginTop: 17, paddingHorizontal: 25, paddingVertical: 17, flexDirection: 'row', alignItems: 'center' },
  noticeIcon: { width: 62, alignItems: 'center' },
  noticeText: { flex: 1, minWidth: 0, color: '#eef1f4', fontSize: 13, lineHeight: 20, marginLeft: 16 },
  evidencePanel: { marginTop: 17, padding: 19 },
  evidenceHeading: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  evidenceTitle: { color: C.yellow, fontSize: 13, fontWeight: '900' },
  recheckButton: { borderWidth: 1, borderColor: C.yellow, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  recheckText: { color: C.yellow, fontSize: 8, fontWeight: '900' },
  evidenceRow: { minHeight: 73, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  evidenceMark: { width: 32, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  evidenceCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  evidenceLabel: { color: '#fff', fontSize: 11, fontWeight: '900' },
  evidenceDetail: { color: C.muted, fontSize: 8.5, lineHeight: 14, marginTop: 4 },
  openButton: { minHeight: 84, marginTop: 18, borderRadius: 12, backgroundColor: C.green, paddingHorizontal: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
  openButtonDisabled: { backgroundColor: '#15293a', borderWidth: 1, borderColor: '#33485a' },
  openButtonText: { color: C.bg, fontSize: 25, fontWeight: '900' },
  openButtonTextDisabled: { color: C.muted2 },
  secondaryAction: { minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 14, fontWeight: '800' },
});
