import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, Line, LinearGradient, Stop } from 'react-native-svg';

import { useNomadLostWallet } from '../nomad';
import type {
  NomadLostWalletPrerequisite,
  NomadLostWalletReason,
  NomadLostWalletStatus,
} from '../nomad';
import {
  C,
  NomadPage,
  PageHeader,
  Panel,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

const CLOCK_CENTER = 180;
const CLOCK_RADIUS = 124;
const CLOCK_CIRCUMFERENCE = 2 * Math.PI * CLOCK_RADIUS;
const CLOCK_TICKS = Array.from({ length: 60 }, (_, index) => {
  const angle = ((index * 6) - 90) * (Math.PI / 180);
  const major = index % 5 === 0;
  const inner = major ? 103 : 110;
  const outer = 118;
  return {
    id: `recovery-clock-tick-${index}`,
    major,
    x1: CLOCK_CENTER + Math.cos(angle) * inner,
    y1: CLOCK_CENTER + Math.sin(angle) * inner,
    x2: CLOCK_CENTER + Math.cos(angle) * outer,
    y2: CLOCK_CENTER + Math.sin(angle) * outer,
  };
});
const CLOCK_POSITIONS = Array.from({ length: 24 }, (_, index) => {
  const angle = ((index * 15) - 75) * (Math.PI / 180);
  const radius = 156;
  return {
    number: index + 1,
    x: CLOCK_CENTER + Math.cos(angle) * radius,
    y: CLOCK_CENTER + Math.sin(angle) * radius,
  };
});
const ENROLLMENT_CELLS = Array.from({ length: 24 }, (_, index) => index + 1);

const reasonOptions: Array<{
  value: NomadLostWalletReason;
  label: string;
  icon: string;
}> = [
  { value: 'lost_device', label: 'Lost Device', icon: '▯' },
  { value: 'replaced_device', label: 'New Device', icon: '⇄' },
  { value: 'locked_out', label: 'Locked Out', icon: '▣' },
  { value: 'security_incident', label: 'Security Event', icon: '◇' },
  { value: 'recovery_test', label: 'Recovery Test', icon: '✓' },
];

function statusInfo(status: NomadLostWalletStatus) {
  switch (status) {
    case 'ready':
      return { color: C.green, title: 'READY FOR VERIFICATION', subtitle: 'All required local recovery evidence is available.', tone: 'green' as const };
    case 'verification_in_progress':
      return { color: C.green, title: 'SEQUENCE IN PROGRESS', subtitle: 'Continue the protected one-at-a-time Time Set sequence.', tone: 'green' as const };
    case 'verification_locked':
      return { color: C.red, title: 'VERIFICATION LOCKED', subtitle: 'The failed-attempt policy is protecting this recovery flow.', tone: 'red' as const };
    case 'verified_waiting_provider':
      return { color: C.yellow, title: 'TIME SETS VERIFIED', subtitle: 'Wallet restoration still requires a connected production provider.', tone: 'yellow' as const };
    case 'setup_required':
      return { color: C.purple, title: 'RECOVERY SETUP REQUIRED', subtitle: 'Resolve the missing recovery checks before verification.', tone: 'yellow' as const };
  }
}

function RecoveryStepper({ status }: { status: NomadLostWalletStatus }) {
  const currentStep = status === 'verified_waiting_provider'
    ? 3
    : status === 'verification_in_progress' || status === 'verification_locked'
      ? 2
      : 1;
  const steps = [
    ['Enter 24 Time Sets', 'In Progress'],
    ['Verify Sequence', 'Pending'],
    ['Recover Wallet', 'Pending'],
    ['Complete', 'Pending'],
  ];

  return (
    <Panel style={styles.stepper}>
      {steps.map(([label, fallback], index) => {
        const number = index + 1;
        const done = number < currentStep;
        const active = number === currentStep;
        return (
          <React.Fragment key={label}>
            <View style={styles.step}>
              <View style={[styles.stepCircle, (active || done) && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, (active || done) && styles.stepNumberActive]}>{done ? '✓' : number}</Text>
              </View>
              <Text style={[styles.stepLabel, (active || done) && { color: C.green }]}>{label}</Text>
              <Text style={[styles.stepSub, active && { color: C.green }]}>{done ? 'Complete' : active ? 'In Progress' : fallback}</Text>
            </View>
            {index < steps.length - 1 ? <Text style={styles.stepArrow}>→</Text> : null}
          </React.Fragment>
        );
      })}
    </Panel>
  );
}

function RecoveryClock({ enrolled, size, status }: { enrolled: number; size: number; status: NomadLostWalletStatus }) {
  const progress = Math.max(0, Math.min(24, enrolled)) / 24;
  const color = status === 'verification_locked' ? C.red : status === 'verified_waiting_provider' ? C.yellow : C.green;
  const centerLabel = status === 'verification_in_progress'
    ? 'VERIFYING'
    : status === 'verified_waiting_provider'
      ? 'VERIFIED'
      : status === 'verification_locked'
        ? 'LOCKED'
        : `${enrolled}/24`;

  return (
    <View accessibilityLabel={`${enrolled} of 24 Time Set digests enrolled. ${centerLabel}.`} style={[styles.clockWrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 360 360" fill="none">
        <Defs>
          <LinearGradient id="recoveryClockArc" x1="52" y1="42" x2="309" y2="318">
            <Stop stopColor="#24f57a" />
            <Stop offset="0.52" stopColor={color} />
            <Stop offset="1" stopColor="#087944" />
          </LinearGradient>
        </Defs>
        <Circle cx={CLOCK_CENTER} cy={CLOCK_CENTER} r="137" fill="#031612" stroke="#09513b" strokeWidth="2" />
        <Circle cx={CLOCK_CENTER} cy={CLOCK_CENTER} r={CLOCK_RADIUS} stroke="#143d35" strokeWidth="5" />
        <Circle
          cx={CLOCK_CENTER}
          cy={CLOCK_CENTER}
          r={CLOCK_RADIUS}
          stroke="url(#recoveryClockArc)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${CLOCK_CIRCUMFERENCE} ${CLOCK_CIRCUMFERENCE}`}
          strokeDashoffset={CLOCK_CIRCUMFERENCE * (1 - progress)}
          rotation="-90"
          origin={`${CLOCK_CENTER}, ${CLOCK_CENTER}`}
        />
        {CLOCK_TICKS.map((tick) => (
          <Line
            key={tick.id}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.major ? '#dfe8de' : '#4a685d'}
            strokeWidth={tick.major ? 2 : 1}
            strokeLinecap="round"
          />
        ))}
        {CLOCK_POSITIONS.map((position) => {
          const complete = position.number <= enrolled;
          return <Circle key={position.number} cx={position.x} cy={position.y} r="9" fill={complete ? color : '#06131b'} stroke={complete ? color : '#2b4652'} strokeWidth="1.5" />;
        })}
      </Svg>
      {CLOCK_POSITIONS.map((position) => (
        <Text
          key={`number-${position.number}`}
          style={[
            styles.clockPositionNumber,
            {
              left: (position.x / 360) * size - 10,
              top: (position.y / 360) * size - 25,
              color: position.number <= enrolled ? color : '#cdd8e4',
            },
          ]}
        >{position.number}</Text>
      ))}
      <View style={styles.clockCenter}>
        <Text style={[styles.clockShield, { color }]}>◇</Text>
        <Text style={[styles.clockBrand, { color }]}>NOMAD</Text>
        <Text style={styles.clockSub}>TIME RECOVERY</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.clockValue}>{centerLabel}</Text>
        <Text style={[styles.clockFoot, { color }]}>ENROLLMENT EVIDENCE</Text>
      </View>
    </View>
  );
}

function PrerequisiteRow({ item, last }: { item: NomadLostWalletPrerequisite; last?: boolean }) {
  const navigation = useNavigation<any>();
  const color = item.status === 'pass' ? C.green : item.status === 'warning' ? C.yellow : C.red;
  const mark = item.status === 'pass' ? '✓' : item.status === 'warning' ? '!' : '×';
  return (
    <View style={[styles.checkRow, !last && styles.rowBorder]}>
      <View style={[styles.checkMark, { borderColor: color }]}><Text style={[styles.checkMarkText, { color }]}>{mark}</Text></View>
      <View style={styles.checkCopy}><Text style={styles.checkTitle}>{item.label}</Text><Text style={styles.checkDetail}>{item.detail}</Text></View>
      {item.route ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Review ${item.label}`} onPress={() => navigation.navigate(item.route)} style={({ pressed }) => [styles.reviewButton, pressed && styles.pressed]}>
          <Text style={[styles.reviewText, { color }]}>Review ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function EnrollmentGrid({ enrolled }: { enrolled: number }) {
  return (
    <View style={styles.timeGrid}>
      {ENROLLMENT_CELLS.map((number) => {
        const active = number <= enrolled;
        return (
          <View key={number} style={[styles.timeCell, active && styles.timeCellActive]}>
            <Text style={[styles.cellNumber, active && { color: C.green }]}>{number}</Text>
            <Text style={[styles.cellStatus, active && { color: C.green }]}>{active ? 'ENROLLED' : '--:--:--'}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function RecoverLostWalletScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { lostWallet, loading, error, refresh, beginRecovery } = useNomadLostWallet();
  const [reason, setReason] = useState<NomadLostWalletReason | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [feedback, setFeedback] = useState('');

  const status = statusInfo(lostWallet.status);
  const selectedReason = reason ?? lostWallet.activeSession?.reason ?? null;
  const selectedReasonLabel = useMemo(
    () => reasonOptions.find((item) => item.value === selectedReason)?.label ?? 'Select a recovery reason',
    [selectedReason],
  );
  const requiredPrerequisites = lostWallet.prerequisites.filter((item) => item.id !== 'restoration_provider');
  const requiredPasses = requiredPrerequisites.filter((item) => item.status === 'pass').length;
  const recoveryStrength = Math.min(100, Math.max(0, lostWallet.recovery.recoveryScore));
  const needsSessionAction = lostWallet.status === 'ready' || lostWallet.status === 'verification_in_progress';
  const canStart = needsSessionAction && Boolean(selectedReason) && acknowledged && !loading;

  const handlePrimary = async () => {
    if (lostWallet.status === 'setup_required' || lostWallet.status === 'verification_locked') {
      navigation.navigate('RecoveryCenter');
      return;
    }
    if (lostWallet.status === 'verified_waiting_provider') {
      navigation.navigate('VerifyRecoverySequence');
      return;
    }
    if (!selectedReason) {
      setFeedback('Choose why you are starting protected wallet recovery.');
      return;
    }
    if (!acknowledged) {
      setFeedback('Confirm that you are using a private, trusted device.');
      return;
    }

    try {
      setFeedback('Creating a protected local verification session…');
      await beginRecovery(selectedReason);
      setFeedback('Protected session created. No password or raw Time Set value was stored.');
      navigation.navigate('VerifyRecoverySequence');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to begin protected recovery verification.');
    }
  };

  const primaryLabel = lostWallet.status === 'ready'
    ? 'Begin Sequence Verification'
    : lostWallet.status === 'verification_in_progress'
      ? 'Continue Sequence Verification'
      : lostWallet.status === 'verified_waiting_provider'
        ? 'View Verification Status'
        : lostWallet.status === 'verification_locked'
          ? 'Open Recovery Center'
          : 'Review Recovery Setup';
  const primarySubtitle = needsSessionAction
    ? 'Verify one Time Set at a time on the protected next page'
    : lostWallet.status === 'verified_waiting_provider'
      ? 'Review the verified sequence and provider boundary'
      : 'Resolve incomplete recovery checks before continuing';

  return (
    <NomadPage maxWidth={940}>
      <PageHeader
        title="Recover Lost Wallet"
        subtitle="Prepare your 24 Time Sets for protected wallet recovery"
        icon="◷"
        color={status.color}
        help
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retry recovery status" onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <RecoveryStepper status={lostWallet.status} />

      <Panel style={[styles.hero, compact && styles.heroCompact]}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>STEP 1 OF 4</Text>
          <Text style={styles.heroTitle}>Enter Your 24 Time Sets</Text>
          <Text style={styles.heroText}>Prepare the exact time positions in their original order. For safety, Page 16 never collects or displays the complete sequence.</Text>
          <View style={styles.privacyBox}>
            <Text style={styles.privacyIcon}>◇</Text>
            <Text style={styles.privacyText}>Only you know your time sequence. Nomad stores salted digests and verifies one value at a time on Page 17.</Text>
          </View>
          <View style={[styles.stateBox, { borderColor: status.color }]}>
            <Text style={[styles.stateTitle, { color: status.color }]}>{status.title}</Text>
            <Text style={styles.stateSub}>{status.subtitle}</Text>
          </View>
        </View>
        <RecoveryClock enrolled={lostWallet.enrolledTimeSets} size={compact ? 300 : 374} status={lostWallet.status} />
      </Panel>

      <Panel style={styles.passwordPanel}>
        <Text style={styles.sectionTitle}>WALLET PASSWORD</Text>
        <View style={styles.passwordField}>
          <Text style={styles.passwordLock}>▣</Text>
          <View style={styles.passwordCopy}>
            <Text style={styles.passwordPlaceholder}>Password verification unavailable</Text>
            <Text style={styles.passwordDetail}>The production password provider is not connected.</Text>
          </View>
          <Text style={styles.passwordEye}>◉</Text>
        </View>
        <Text style={styles.providerBoundary}>Nomad will not imitate password validation or store an unverified password in this frontend.</Text>
      </Panel>

      <Panel style={styles.reasonPanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.headingCopy}><Text style={styles.sectionTitle}>RECOVERY REASON</Text><Text style={styles.sectionSub}>Session metadata only—this never changes wallet keys</Text></View>
          <Text style={styles.reasonSelection}>{selectedReasonLabel}</Text>
        </View>
        <View style={styles.reasonGrid}>
          {reasonOptions.map((item) => {
            const selected = selectedReason === item.value;
            return (
              <Pressable
                key={item.value}
                testID={`recovery-reason-${item.value}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setReason(item.value)}
                style={({ pressed }) => [styles.reasonCard, selected && styles.reasonCardSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.reasonIcon, selected && { color: C.green }]}>{item.icon}</Text>
                <Text style={[styles.reasonLabel, selected && { color: C.green }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Panel>

      <Panel style={styles.sequencePanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.headingCopy}><Text style={styles.sectionTitle}>YOUR 24 TIME SETS</Text><Text style={styles.sectionSub}>Enrollment evidence only—raw times remain hidden</Text></View>
          <Pressable testID="recovery-review-enrollment" accessibilityRole="button" accessibilityLabel="Review Time Set enrollment" onPress={() => navigation.navigate('RecoveryCenter')} style={({ pressed }) => [styles.clearAction, pressed && styles.pressed]}><Text style={styles.clearActionText}>Review Enrollment</Text></Pressable>
        </View>
        <EnrollmentGrid enrolled={lostWallet.enrolledTimeSets} />
        <View style={styles.sequenceSummary}>
          <Text style={styles.sequenceHint}>◷  24 unique positions verified in their original order</Text>
          <Text style={styles.sequenceCount}>{lostWallet.enrolledTimeSets} of {lostWallet.totalTimeSets} enrolled</Text>
        </View>
      </Panel>

      <View style={[styles.infoColumns, compact && styles.infoColumnsCompact]}>
        <Panel style={styles.infoPanel}>
          <Text style={styles.sectionTitle}>INSTRUCTIONS</Text>
          <Text style={styles.infoText}>1. Confirm that all 24 Time Set digests are enrolled.</Text>
          <Text style={styles.infoText}>2. Select the reason for this protected recovery session.</Text>
          <Text style={styles.infoText}>3. Continue to Page 17 and enter only the requested Time Set.</Text>
          <Text style={styles.infoText}>4. Each value is cleared before the next position is requested.</Text>
        </Panel>
        <Panel style={styles.infoPanel}>
          <Text style={styles.sectionTitle}>RECOVERY TIPS</Text>
          <View style={styles.tipRow}><RoundIcon symbol="☼" color={C.green} size={35} /><Text style={styles.tipText}>Use a private, secure location.</Text></View>
          <View style={styles.tipRow}><RoundIcon symbol="▣" color={C.green} size={35} /><Text style={styles.tipText}>Raw values never leave this device.</Text></View>
          <View style={styles.tipRow}><RoundIcon symbol="◇" color={C.green} size={35} /><Text style={styles.tipText}>Incorrect attempts trigger a temporary lock.</Text></View>
        </Panel>
      </View>

      <Panel style={styles.readinessPanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.headingCopy}><Text style={styles.sectionTitle}>RECOVERY READINESS</Text><Text style={styles.sectionSub}>Evidence from the connected local recovery adapter</Text></View>
          <Text style={[styles.readinessCount, { color: requiredPasses === requiredPrerequisites.length ? C.green : C.yellow }]}>{requiredPasses}/{requiredPrerequisites.length}</Text>
        </View>
        {lostWallet.prerequisites.map((item, index) => <PrerequisiteRow key={item.id} item={item} last={index === lostWallet.prerequisites.length - 1} />)}
      </Panel>

      <Panel tone={status.tone} style={styles.strengthPanel}>
        <View style={styles.strengthCopy}>
          <Text style={styles.sectionTitle}>RECOVERY STRENGTH</Text>
          <Text style={styles.strengthValue}>{recoveryStrength} <Text style={styles.strengthMax}>/ 100</Text></Text>
          <Text style={styles.strengthText}>{lostWallet.enrolledTimeSets === lostWallet.totalTimeSets ? 'All Time Set digests are enrolled.' : 'Complete all 24 Time Set enrollments to improve readiness.'}</Text>
        </View>
        <View style={styles.strengthChecks}>
          <Text style={styles.strengthCheck}>{lostWallet.enrolledTimeSets === 24 ? '●' : '○'}  24 Enrolled Digests</Text>
          <Text style={styles.strengthCheck}>{lostWallet.activeSession ? '●' : '○'}  Protected Session</Text>
          <Text style={styles.strengthCheck}>{lostWallet.status === 'verified_waiting_provider' ? '●' : '○'}  Correct Sequence</Text>
        </View>
        <View style={[styles.scoreRing, { borderColor: recoveryStrength >= 80 ? C.green : C.muted }]}><Text style={styles.scoreNumber}>{recoveryStrength}</Text><Text style={styles.scoreLabel}>SCORE</Text></View>
      </Panel>

      <Pressable
        testID="recovery-private-device"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acknowledged }}
        onPress={() => setAcknowledged((value) => !value)}
        style={styles.ackRow}
      >
        <View style={[styles.checkbox, acknowledged && styles.checkboxActive]}><Text style={[styles.checkmark, acknowledged && { color: C.bg }]}>{acknowledged ? '✓' : ''}</Text></View>
        <Text style={styles.ackText}>I am using a private, trusted device and understand that Time Set verification does not claim wallet-key restoration.</Text>
      </Pressable>

      {feedback ? <Text style={[styles.feedback, /unable|cannot|locked|required|unavailable/i.test(feedback) && { color: C.red }]}>{feedback}</Text> : null}

      <Pressable
        testID="recovery-primary"
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
        disabled={needsSessionAction ? !canStart : loading}
        onPress={() => void handlePrimary()}
        style={({ pressed }) => [styles.primaryButton, lostWallet.status === 'verification_locked' && styles.primaryButtonRed, needsSessionAction && !canStart && styles.primaryButtonDisabled, pressed && styles.pressed]}
      >
        <Text style={styles.primaryIcon}>◇</Text>
        <View style={styles.primaryCopy}><Text style={styles.primaryTitle}>{loading ? 'Checking Recovery…' : primaryLabel}</Text><Text style={styles.primarySub}>{primarySubtitle}</Text></View>
        <Text style={styles.primaryArrow}>›</Text>
      </Pressable>

      <Panel tone="red" style={styles.warningPanel}>
        <Text style={styles.warningIcon}>⚠</Text>
        <Text style={styles.warningText}>Too many incorrect attempts trigger lockout. Never enter a seed phrase, private key, wallet password, or complete Time Set sequence into a support message or third-party form.</Text>
      </Panel>
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  errorBanner: { minHeight: 48, marginBottom: 10, borderWidth: 1, borderColor: C.red, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  stepper: { minHeight: 94, padding: 12, flexDirection: 'row', alignItems: 'center' },
  step: { flex: 1, alignItems: 'center' },
  stepCircle: { width: 31, height: 31, borderRadius: 16, borderWidth: 1, borderColor: '#718097', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { borderColor: C.green, backgroundColor: C.green },
  stepNumber: { color: '#dce6f4', fontSize: 10, fontWeight: '900' },
  stepNumberActive: { color: C.bg },
  stepLabel: { color: C.muted, fontSize: 8, lineHeight: 11, textAlign: 'center', marginTop: 6 },
  stepSub: { color: C.muted, fontSize: 7, textAlign: 'center', marginTop: 2 },
  stepArrow: { color: C.muted, fontSize: 18 },
  hero: { marginTop: 17, padding: 19, flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: C.green, fontSize: 11, fontWeight: '900' },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 12 },
  heroText: { color: '#d8e1ec', fontSize: 11, lineHeight: 18, marginTop: 9 },
  privacyBox: { minHeight: 76, borderWidth: 1, borderColor: C.green, borderRadius: 9, marginTop: 18, padding: 12, flexDirection: 'row', alignItems: 'center' },
  privacyIcon: { color: C.green, fontSize: 23, marginRight: 11 },
  privacyText: { flex: 1, color: '#dce5ee', fontSize: 9, lineHeight: 15 },
  stateBox: { minHeight: 58, borderWidth: 1, borderRadius: 9, marginTop: 12, padding: 11 },
  stateTitle: { fontSize: 10, fontWeight: '900' },
  stateSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  clockWrap: { alignSelf: 'center', position: 'relative' },
  clockPositionNumber: { position: 'absolute', width: 20, textAlign: 'center', fontSize: 7, fontWeight: '900' },
  clockCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: '25%' },
  clockShield: { fontSize: 33 },
  clockBrand: { fontSize: 13, fontWeight: '900', marginTop: 2 },
  clockSub: { color: C.muted, fontSize: 7, fontWeight: '800', marginTop: 2 },
  clockValue: { width: '100%', color: '#fff', fontSize: 23, fontWeight: '900', textAlign: 'center', marginTop: 9 },
  clockFoot: { fontSize: 6.5, fontWeight: '900', marginTop: 4 },
  passwordPanel: { marginTop: 17, padding: 17 },
  passwordField: { minHeight: 62, borderWidth: 1, borderColor: '#405368', borderRadius: 9, marginTop: 12, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  passwordLock: { color: C.muted, fontSize: 22, marginRight: 11 },
  passwordCopy: { flex: 1, minWidth: 0 },
  passwordPlaceholder: { color: '#dce4ef', fontSize: 11 },
  passwordDetail: { color: C.yellow, fontSize: 8, lineHeight: 12, marginTop: 3 },
  passwordEye: { color: C.muted, fontSize: 22 },
  providerBoundary: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 10 },
  reasonPanel: { marginTop: 17, padding: 17 },
  sequencePanel: { marginTop: 17, padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  headingCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: C.green, fontSize: 12, fontWeight: '900', letterSpacing: 0.3 },
  sectionSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 3 },
  reasonSelection: { maxWidth: '42%', color: C.green, fontSize: 8, lineHeight: 12, textAlign: 'right' },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonCard: { flexGrow: 1, flexBasis: 128, minHeight: 68, borderWidth: 1, borderColor: C.border, borderRadius: 9, padding: 10, flexDirection: 'row', alignItems: 'center' },
  reasonCardSelected: { borderColor: C.green, backgroundColor: 'rgba(31,239,112,.07)' },
  reasonIcon: { color: C.muted, fontSize: 19, marginRight: 8 },
  reasonLabel: { color: '#fff', fontSize: 9, fontWeight: '900' },
  clearAction: { minHeight: 36, borderWidth: 1, borderColor: C.green, borderRadius: 8, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  clearActionText: { color: C.green, fontSize: 8, fontWeight: '900' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  timeCell: { width: '15%', minWidth: 74, flexGrow: 1, minHeight: 60, borderWidth: 1, borderColor: '#314252', borderRadius: 8, padding: 9 },
  timeCellActive: { borderColor: C.green, backgroundColor: 'rgba(0,255,100,.06)' },
  cellNumber: { color: '#d4d8e1', fontSize: 10, fontWeight: '700' },
  cellStatus: { color: C.muted, fontSize: 7.5, fontWeight: '900', marginTop: 10 },
  sequenceSummary: { minHeight: 45, marginTop: 12, borderTopWidth: 1, borderTopColor: C.borderSoft, paddingTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sequenceHint: { flex: 1, color: C.muted, fontSize: 8 },
  sequenceCount: { color: C.green, fontSize: 9, fontWeight: '900' },
  infoColumns: { flexDirection: 'row', gap: 12, marginTop: 17 },
  infoColumnsCompact: { flexDirection: 'column' },
  infoPanel: { flex: 1, padding: 16 },
  infoText: { color: '#d9e1ec', fontSize: 8.5, lineHeight: 14, marginTop: 7 },
  tipRow: { minHeight: 45, flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  tipText: { flex: 1, color: '#d9e1ec', fontSize: 8.5, lineHeight: 13, marginLeft: 9 },
  readinessPanel: { marginTop: 17, padding: 17 },
  readinessCount: { fontSize: 16, fontWeight: '900' },
  checkRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  checkMark: { width: 35, height: 35, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkMarkText: { fontSize: 14, fontWeight: '900' },
  checkCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  checkTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  checkDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  reviewButton: { minHeight: 38, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 7 },
  reviewText: { fontSize: 8, fontWeight: '900' },
  strengthPanel: { minHeight: 134, marginTop: 17, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 18 },
  strengthCopy: { flex: 1, minWidth: 0 },
  strengthValue: { color: '#fff', fontSize: 27, fontWeight: '900', marginTop: 9 },
  strengthMax: { color: C.muted, fontSize: 15 },
  strengthText: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 5 },
  strengthChecks: { flex: 1, minWidth: 0, gap: 10 },
  strengthCheck: { color: '#d9e1ec', fontSize: 9 },
  scoreRing: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  scoreNumber: { color: '#fff', fontSize: 20, fontWeight: '900' },
  scoreLabel: { color: C.muted, fontSize: 6, marginTop: 2 },
  ackRow: { minHeight: 70, marginTop: 16, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 13, flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 25, height: 25, borderRadius: 6, borderWidth: 1, borderColor: C.green, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  checkboxActive: { backgroundColor: C.green },
  checkmark: { color: C.green, fontSize: 14, fontWeight: '900' },
  ackText: { flex: 1, color: '#d9e1ec', fontSize: 8.5, lineHeight: 14 },
  feedback: { color: C.green, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 12 },
  primaryButton: { minHeight: 72, marginTop: 14, borderRadius: 10, backgroundColor: C.green, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' },
  primaryButtonRed: { backgroundColor: C.red },
  primaryButtonDisabled: { backgroundColor: '#183448', opacity: 0.75 },
  primaryIcon: { color: C.bg, fontSize: 29, marginRight: 13 },
  primaryCopy: { flex: 1, minWidth: 0 },
  primaryTitle: { color: C.bg, fontSize: 15, fontWeight: '900' },
  primarySub: { color: '#062b20', fontSize: 8.5, lineHeight: 13, marginTop: 3 },
  primaryArrow: { color: C.bg, fontSize: 34 },
  warningPanel: { minHeight: 58, marginTop: 14, padding: 13, flexDirection: 'row', alignItems: 'center' },
  warningIcon: { color: C.red, fontSize: 21, marginRight: 11 },
  warningText: { flex: 1, color: '#e8dfe3', fontSize: 8.5, lineHeight: 14 },
});
