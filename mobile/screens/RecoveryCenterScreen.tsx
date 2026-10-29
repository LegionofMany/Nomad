import React, { useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useNomadRecovery, useNomadSecurity } from '../nomad';
import type {
  NomadRecoveryMethodResult,
  NomadRecoveryMethodStatus,
  NomadRecoverySigner,
} from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  Panel,
  useNomadLayout,
} from '../ui/NomadShell';

type RecoveryArtworkKind =
  | 'recovery'
  | 'shield'
  | 'calendar'
  | 'verified'
  | 'clock'
  | 'guide'
  | 'time_sets'
  | 'daily_clock'
  | 'owner_authority'
  | 'encrypted_backup'
  | 'device'
  | 'export'
  | 'test'
  | 'warning'
  | 'signer'
  | 'lock';

const worldDots: Array<[number, number]> = [
  [21, 61], [30, 52], [39, 48], [49, 52], [57, 62], [66, 70], [77, 65], [86, 54], [96, 49],
  [107, 57], [115, 69], [122, 80], [131, 92], [140, 104], [149, 119], [157, 132],
  [172, 60], [182, 53], [192, 49], [203, 54], [214, 65], [225, 71], [236, 66], [247, 59],
  [258, 64], [269, 75], [281, 84], [292, 94], [304, 106], [316, 118], [328, 130], [339, 139],
  [213, 94], [221, 106], [229, 119], [237, 132], [246, 145], [257, 151], [269, 147], [280, 139],
  [293, 71], [304, 65], [315, 71], [326, 81], [337, 94], [347, 106], [357, 114],
];

const methodKinds: Record<NomadRecoveryMethodResult['id'], RecoveryArtworkKind> = {
  time_sets: 'time_sets',
  daily_clock: 'daily_clock',
  owner_authority: 'owner_authority',
  encrypted_backup: 'encrypted_backup',
};

function RecoveryArtwork({ kind, color = C.green, size = 42 }: { kind: RecoveryArtworkKind; color?: string; size?: number }) {
  const stroke = { stroke: color, strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let artwork: React.ReactNode;

  switch (kind) {
    case 'recovery':
      artwork = <><Path d="M24 4 41 12v13c0 11-6 18-17 23C13 43 7 36 7 25V12Z" {...stroke} /><Circle cx="24" cy="19" r="5" {...stroke} /><Path d="M15 35c1-7 4-10 9-10s8 3 9 10" {...stroke} /></>;
      break;
    case 'calendar':
      artwork = <><Rect x="7" y="10" width="34" height="31" rx="5" {...stroke} /><Path d="M7 19h34M16 6v9M32 6v9M16 26h6v6h-6Z" {...stroke} /></>;
      break;
    case 'verified':
      artwork = <><Path d="M24 4 41 12v13c0 11-6 18-17 23C13 43 7 36 7 25V12Z" {...stroke} /><Path d="m15 25 6 6 12-14" {...stroke} /></>;
      break;
    case 'clock':
      artwork = <><Circle cx="24" cy="24" r="18" {...stroke} /><Path d="M24 13v12l8 5" {...stroke} /></>;
      break;
    case 'guide':
      artwork = <><Path d="M7 10c7-2 12 0 17 4v27c-5-4-10-6-17-4ZM41 10c-7-2-12 0-17 4v27c5-4 10-6 17-4Z" {...stroke} /></>;
      break;
    case 'time_sets':
      artwork = <><Circle cx="24" cy="24" r="17" {...stroke} /><Path d="M24 13v12l8 5M11 7l4 5M37 7l-4 5" {...stroke} /></>;
      break;
    case 'daily_clock':
      artwork = <><Circle cx="24" cy="24" r="17" {...stroke} /><Path d="M24 12v13h10M13 37l-4 5M35 37l4 5" {...stroke} /></>;
      break;
    case 'owner_authority':
      artwork = <><Circle cx="20" cy="16" r="7" {...stroke} /><Path d="M7 39c1-10 6-15 13-15 4 0 7 2 9 5M33 22l9 4v7c0 6-3 10-9 13-6-3-9-7-9-13v-7Z" {...stroke} /></>;
      break;
    case 'encrypted_backup':
      artwork = <><Path d="M12 36h25a8 8 0 0 0 1-16 14 14 0 0 0-27-2A9 9 0 0 0 12 36Z" {...stroke} /><Rect x="19" y="25" width="12" height="12" rx="3" fill="#04101e" {...stroke} /><Path d="M22 25v-3a3 3 0 0 1 6 0v3" {...stroke} /></>;
      break;
    case 'device':
      artwork = <><Rect x="12" y="5" width="24" height="38" rx="5" {...stroke} /><Path d="m17 25 5 5 10-12M20 38h8" {...stroke} /></>;
      break;
    case 'export':
      artwork = <><Path d="M24 5v25M15 21l9 9 9-9M8 32v9h32v-9" {...stroke} /></>;
      break;
    case 'test':
      artwork = <><Path d="M24 5 40 12v12c0 11-6 18-16 23C14 42 8 35 8 24V12Z" {...stroke} /><Path d="m16 25 6 6 11-13" {...stroke} /></>;
      break;
    case 'warning':
      artwork = <><Path d="M24 6 44 42H4Z" {...stroke} /><Path d="M24 18v11M24 35h.01" {...stroke} /></>;
      break;
    case 'signer':
      artwork = <><Circle cx="20" cy="15" r="6" {...stroke} /><Path d="M8 37c1-9 5-14 12-14s11 5 12 14M33 21l9 4v7c0 6-3 10-9 13" {...stroke} /></>;
      break;
    case 'lock':
      artwork = <><Rect x="9" y="21" width="30" height="23" rx="5" {...stroke} /><Path d="M16 21v-7a8 8 0 0 1 16 0v7M24 29v7" {...stroke} /></>;
      break;
    default:
      artwork = <><Path d="M24 4 41 12v13c0 11-6 18-17 23C13 43 7 36 7 25V12Z" {...stroke} /><Path d="m15 25 6 6 12-14" {...stroke} /></>;
  }

  return <Svg accessibilityLabel={`${kind.replace(/_/g, ' ')} icon`} width={size} height={size} viewBox="0 0 48 48" fill="none">{artwork}</Svg>;
}

function methodStatus(status: NomadRecoveryMethodStatus) {
  switch (status) {
    case 'ready': return { color: C.green, label: 'ACTIVE', symbol: '✓' };
    case 'warning': return { color: C.yellow, label: 'REVIEW', symbol: '!' };
    case 'not_configured': return { color: C.purple, label: 'SETUP', symbol: '+' };
    case 'unavailable': return { color: C.muted, label: 'UNAVAILABLE', symbol: '—' };
  }
}

function StatusMark({ color, symbol, size = 26 }: { color: string; symbol: string; size?: number }) {
  return (
    <View style={[styles.statusMark, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
      <Text style={[styles.statusMarkText, { color, fontSize: size * .55 }]}>{symbol}</Text>
    </View>
  );
}

function SystemStatusPill({ compact, label, color }: { compact: boolean; label: string; color: string }) {
  return (
    <View accessibilityLabel={`All Systems ${label}`} style={[styles.systemPill, compact && styles.systemPillCompact, { borderColor: `${color}66` }]}>
      <RecoveryArtwork kind="shield" color={color} size={compact ? 28 : 34} />
      <View>
        <Text style={[styles.systemTop, compact && styles.systemTopCompact]}>All Systems</Text>
        <Text style={[styles.systemBottom, compact && styles.systemBottomCompact, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

function RecoveryHeader({ compact, statusLabel, statusColor }: { compact: boolean; statusLabel: string; statusColor: string }) {
  const navigation = useNavigation<any>();
  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <View style={styles.headerBrand}>
        <Pressable testID="recovery-back" accessibilityRole="button" accessibilityLabel="Back to Security Center" onPress={() => navigation.navigate('SecurityCenter')} style={({ pressed }) => [styles.backButton, compact && styles.backButtonCompact, pressed && styles.pressed]}>
          <Text style={[styles.backText, compact && styles.backTextCompact]}>‹</Text>
        </Pressable>
        <View style={[styles.headerIcon, compact && styles.headerIconCompact]}><RecoveryArtwork kind="recovery" color={C.green} size={compact ? 42 : 51} /></View>
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.headerTitle, compact && styles.headerTitleCompact]}>Recovery Center</Text>
          <Text numberOfLines={2} style={[styles.headerSubtitle, compact && styles.headerSubtitleCompact]}>Your recovery. Your control. Your peace of mind.</Text>
        </View>
      </View>
      <View style={[styles.headerActions, compact && styles.headerActionsCompact]}>
        <SystemStatusPill compact={compact} label={statusLabel} color={statusColor} />
        <Pressable testID="recovery-help" accessibilityRole="button" accessibilityLabel="Open Recovery Center help" onPress={() => navigation.navigate('Settings')} style={({ pressed }) => [styles.helpButton, compact && styles.helpButtonCompact, pressed && styles.pressed]}>
          <Text style={[styles.helpText, compact && styles.helpTextCompact]}>?</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RecoveryHeroGraphic({ compact, color }: { compact: boolean; color: string }) {
  return (
    <View pointerEvents="none" style={[styles.heroGraphic, compact && styles.heroGraphicCompact]}>
      <Svg width="100%" height="100%" viewBox="0 0 370 220" fill="none">
        <Defs>
          <RadialGradient id="recoveryGlow"><Stop stopColor={color} stopOpacity={0.35} /><Stop offset="1" stopColor={color} stopOpacity={0} /></RadialGradient>
          <LinearGradient id="recoveryShield" x1="185" y1="32" x2="286" y2="163"><Stop stopColor="#7affbd" stopOpacity={0.9} /><Stop offset=".55" stopColor={color} stopOpacity={0.66} /><Stop offset="1" stopColor="#036048" stopOpacity={0.32} /></LinearGradient>
        </Defs>
        <Rect width="370" height="220" fill="url(#recoveryGlow)" />
        <G fill={color} opacity={0.3}>{worldDots.map(([cx, cy], index) => <Circle key={`${cx}-${cy}-${index}`} cx={cx} cy={cy} r={index % 5 === 0 ? 2 : 1.2} />)}</G>
        <G stroke={color} strokeOpacity={0.18} strokeWidth="1"><Path d="M16 77c68-51 130-39 183-4 46 31 95 28 155-11" /><Path d="M24 125c60-24 114-15 163 14 49 28 102 30 168 1" /></G>
        <Ellipse cx="251" cy="180" rx="100" ry="28" fill="#031b19" stroke="#278cff" strokeOpacity={0.7} strokeWidth="3" />
        <Ellipse cx="251" cy="170" rx="78" ry="25" fill="#05271e" stroke={color} strokeOpacity={0.72} strokeWidth="2" />
        <Ellipse cx="251" cy="166" rx="48" ry="15" stroke={color} strokeOpacity={0.72} strokeWidth="2" />
        <Path d="M251 29 302 49v43c0 36-20 61-51 78-32-17-52-42-52-78V49Z" fill="url(#recoveryShield)" stroke="#a0ffd1" strokeWidth="3" />
        <Path d="M251 45 289 60v32c0 27-15 46-38 60-24-14-39-33-39-60V60Z" fill="#063d2d" fillOpacity={0.42} stroke={color} strokeOpacity={0.72} />
        <Path d="m230 95 14 14 29-35" stroke="#c2ffe0" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

function ProgressRing({ value, total, color, compact }: { value: number; total: number; color: string; compact: boolean }) {
  const size = compact ? 116 : 152;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.max(0, Math.min(1, value / Math.max(1, total)));
  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <Svg width="100%" height="100%" viewBox="0 0 120 120">
        <Circle cx="60" cy="60" r={radius} stroke="rgba(255,255,255,.12)" strokeWidth="10" fill="rgba(1,12,22,.8)" />
        <Circle cx="60" cy="60" r={radius} stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - percent)} transform="rotate(-90 60 60)" />
      </Svg>
      <View style={styles.progressRingCopy}>
        <Text style={[styles.progressRingValue, compact && styles.progressRingValueCompact]}>{value}/{total}</Text>
        <Text style={[styles.progressRingLabel, { color }]}>{value === total ? 'Complete' : 'Enrolled'}</Text>
      </View>
    </View>
  );
}

function ScoreRing({ value, color, compact }: { value: number; color: string; compact: boolean }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <View style={[styles.scoreRing, compact && styles.scoreRingCompact]}>
      <Svg width={compact ? 64 : 78} height={compact ? 64 : 78} viewBox="0 0 54 54">
        <Circle cx="27" cy="27" r={radius} stroke="rgba(255,255,255,.14)" strokeWidth="6" fill="none" />
        <Circle cx="27" cy="27" r={radius} stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset} transform="rotate(-90 27 27)" />
      </Svg>
      <View style={styles.scoreRingCopy}><Text style={[styles.scoreValue, compact && styles.scoreValueCompact]}>{value}</Text><Text style={styles.scoreMax}>/100</Text></View>
    </View>
  );
}

function MethodCard({ item, compact }: { item: NomadRecoveryMethodResult; compact: boolean }) {
  const navigation = useNavigation<any>();
  const status = methodStatus(item.status);
  return (
    <Pressable
      testID={`recovery-method-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${status.label}. ${item.detail}`}
      onPress={() => navigation.navigate(item.route)}
      style={({ pressed }) => [styles.methodCard, compact && styles.methodCardCompact, pressed && styles.pressed]}
    >
      <View style={[styles.methodIcon, compact && styles.methodIconCompact, { borderColor: `${status.color}88`, backgroundColor: `${status.color}12` }]}>
        <RecoveryArtwork kind={methodKinds[item.id]} color={status.color} size={compact ? 34 : 43} />
      </View>
      <Text numberOfLines={2} style={[styles.methodTitle, compact && styles.methodTitleCompact]}>{item.title}</Text>
      <Text numberOfLines={2} style={[styles.methodSubtitle, compact && styles.methodSubtitleCompact]}>{item.subtitle}</Text>
      <Text style={[styles.methodState, { color: status.color }]}>{status.symbol} {status.label}</Text>
    </Pressable>
  );
}

function ActionRow({
  title,
  subtitle,
  kind,
  color = C.green,
  onPress,
  disabled,
  testID,
  last,
}: {
  title: string;
  subtitle: string;
  kind: RecoveryArtworkKind;
  color?: string;
  onPress(): void;
  disabled?: boolean;
  testID: string;
  last?: boolean;
}) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.actionRow, !last && styles.rowBorder, disabled && styles.disabled, pressed && styles.pressed]}>
      <View style={[styles.actionIcon, { borderColor: `${color}70`, backgroundColor: `${color}12` }]}><RecoveryArtwork kind={kind} color={color} size={33} /></View>
      <View style={styles.actionCopy}><Text style={styles.actionTitle}>{title}</Text><Text numberOfLines={2} style={styles.actionSubtitle}>{subtitle}</Text></View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function SignerRow({ signer, last }: { signer: NomadRecoverySigner; last?: boolean }) {
  const color = signer.status === 'verified' ? C.green : signer.status === 'pending' ? C.yellow : C.muted;
  return (
    <View style={[styles.signerRow, !last && styles.rowBorder]}>
      <View style={[styles.signerIcon, { borderColor: `${color}65`, backgroundColor: `${color}12` }]}><RecoveryArtwork kind="signer" color={color} size={31} /></View>
      <View style={styles.signerCopy}><Text style={styles.signerName}>{signer.name}</Text><Text style={styles.signerRole}>{signer.role}</Text></View>
      <View style={styles.signerStatusWrap}><Text style={[styles.signerStatus, { color }]}>{signer.status.replace(/_/g, ' ').toUpperCase()}</Text><StatusMark color={color} symbol={signer.status === 'verified' ? '✓' : signer.status === 'pending' ? '!' : '—'} size={19} /></View>
      <Text style={styles.chevron}>›</Text>
    </View>
  );
}

export default function RecoveryCenterScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { recovery, sequence, loading, error, refresh, runCheck, exportSummary } = useNomadRecovery();
  const { security, loading: securityLoading } = useNomadSecurity();
  const [checking, setChecking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const allTimeSets = recovery.timeSetsTotal > 0 && recovery.enrolledTimeSets >= recovery.timeSetsTotal;
  const hasEvidence = recovery.walletStatus !== 'no_wallet' && (recovery.enrolledTimeSets > 0 || recovery.ownerAuthorityStatus !== 'none');
  const providerConnected = sequence.recoveryProviderConnected;
  const statusColor = allTimeSets ? C.green : hasEvidence ? C.yellow : C.red;
  const statusTitle = allTimeSets ? (providerConnected ? 'RECOVERY READY' : 'EVIDENCE READY') : hasEvidence ? 'RECOVERY REVIEW' : 'SETUP REQUIRED';
  const statusSymbol = allTimeSets ? '✓' : hasEvidence ? '!' : '×';
  const systemColor = securityLoading ? C.blue : security.status === 'frozen' ? C.red : security.status === 'warning' ? C.yellow : C.green;
  const systemLabel = securityLoading ? 'CHECKING' : security.status === 'frozen' ? 'FROZEN' : security.status === 'warning' ? 'REVIEW' : 'SECURE';
  const scoreLabel = recovery.recoveryScore >= 85 ? 'Excellent evidence' : recovery.recoveryScore >= 60 ? 'Needs review' : 'Setup needed';
  const milestones = [6, 12, 18, recovery.timeSetsTotal];

  const handleCheck = async () => {
    try {
      setChecking(true);
      setFeedback('Running wallet, Time Set, clock, authority and persistence checks…');
      const next = await runCheck();
      setFeedback(`Recovery check complete • ${next.recoveryScore}/100 evidence score.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to complete the recovery check.');
    } finally {
      setChecking(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setFeedback('Generating a metadata-only recovery summary…');
      const summary = await exportSummary();
      const runtime = globalThis as unknown as { navigator?: { clipboard?: { writeText(value: string): Promise<void> } } };
      if (Platform.OS === 'web' && runtime.navigator?.clipboard) {
        await runtime.navigator.clipboard.writeText(summary);
        setFeedback('Recovery summary copied. It contains metadata only—no seed, private keys or raw Time Sets.');
      } else {
        await Share.share({ title: 'Nomad Recovery Summary', message: summary });
        setFeedback('Recovery summary opened in the share sheet. No recovery secrets were included.');
      }
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to export the recovery summary.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <NomadPage maxWidth={960}>
      <RecoveryHeader compact={compact} statusLabel={systemLabel} statusColor={systemColor} />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retry Recovery Center" onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel tone={allTimeSets ? 'green' : hasEvidence ? 'yellow' : 'red'} style={styles.hero}>
        <View style={[styles.heroTop, compact && styles.heroTopCompact]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, compact && styles.eyebrowCompact, { color: statusColor }]}>RECOVERY STATUS</Text>
            <View style={styles.heroTitleRow}>
              <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.heroTitle, compact && styles.heroTitleCompact, { color: statusColor }]}>{statusTitle}</Text>
              <StatusMark color={statusColor} symbol={statusSymbol} size={compact ? 28 : 36} />
            </View>
            <Text numberOfLines={3} style={[styles.heroDescription, compact && styles.heroDescriptionCompact]}>
              {allTimeSets
                ? providerConnected
                  ? 'All 24 Time Set digests are enrolled and the restoration provider is connected.'
                  : 'All 24 Time Set digests are enrolled. Restoration remains unavailable until a provider returns a signed receipt.'
                : hasEvidence
                  ? 'Some recovery evidence exists, but required checks or enrollment still need review.'
                  : 'Recovery is not configured. Nomad will not claim protection without verifiable evidence.'}
            </Text>
          </View>
          <RecoveryHeroGraphic compact={compact} color={statusColor} />
        </View>

        <View style={[styles.metricGrid, compact && styles.metricGridCompact]}>
          <View style={[styles.metric, compact && styles.metricCompact]}>
            <RecoveryArtwork kind="calendar" color={statusColor} size={compact ? 22 : 28} />
            <View style={styles.metricCopy}><Text style={styles.metricLabel}>Recovery Setup</Text><Text numberOfLines={1} style={[styles.metricValue, compact && styles.metricValueCompact]}>{recovery.recoverySetupDate}</Text><Text style={[styles.metricAccent, { color: statusColor }]}>{recovery.persistence.replace(/_/g, ' ')}</Text></View>
          </View>
          <View style={[styles.metric, compact && styles.metricCompact]}>
            <RecoveryArtwork kind="verified" color={statusColor} size={compact ? 22 : 28} />
            <View style={styles.metricCopy}><Text style={styles.metricLabel}>Verification Status</Text><Text numberOfLines={1} style={[styles.metricValue, compact && styles.metricValueCompact]}>{recovery.verificationStatus}</Text><Text style={[styles.metricAccent, { color: statusColor }]}>{recovery.signerQuorum}/{recovery.signerTotal} signer quorum</Text></View>
          </View>
          <View style={[styles.metric, compact && styles.metricCompact]}>
            <RecoveryArtwork kind="clock" color={C.blue} size={compact ? 22 : 28} />
            <View style={styles.metricCopy}><Text style={styles.metricLabel}>Last Check</Text><Text numberOfLines={1} style={[styles.metricValue, compact && styles.metricValueCompact]}>{loading ? 'Checking…' : recovery.lastCheckLabel}</Text><Text style={styles.metricNote}>{recovery.dataSource.replace(/_/g, ' ')}</Text></View>
          </View>
        </View>

        <Pressable testID="recovery-guide" accessibilityRole="button" accessibilityLabel="Open Recovery Guide" onPress={() => navigation.navigate('RecoverLostWallet')} style={({ pressed }) => [styles.guideButton, compact && styles.guideButtonCompact, pressed && styles.pressed]}>
          <RecoveryArtwork kind="guide" color={C.green} size={compact ? 23 : 28} />
          <Text style={styles.guideTitle}>Recovery Guide</Text>
          <Text numberOfLines={1} style={styles.guideSubtitle}>Learn how evidence verification and provider restoration work</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </Panel>

      <Panel style={[styles.sectionPanel, compact && styles.sectionPanelCompact]}>
        <View style={styles.sectionHeader}>
          <View><Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>24 TIME SET RECOVERY</Text><Text style={styles.sectionSubtitle}>Salted digests are verified in order; raw values are never displayed.</Text></View>
          <Text style={styles.infoSymbol}>ⓘ</Text>
        </View>
        <View style={[styles.timeSetBody, compact && styles.timeSetBodyCompact]}>
          <ProgressRing value={recovery.enrolledTimeSets} total={recovery.timeSetsTotal} color={allTimeSets ? C.green : hasEvidence ? C.yellow : C.muted} compact={compact} />
          <View style={styles.milestoneArea}>
            <View style={styles.milestoneRow}>
              {milestones.map((value, index) => {
                const done = recovery.enrolledTimeSets >= value;
                return (
                  <React.Fragment key={value}>
                    {index > 0 ? <View style={[styles.milestoneLine, done && styles.milestoneLineDone]} /> : null}
                    <View style={styles.milestoneItem}><View style={[styles.milestoneCircle, done && styles.milestoneCircleDone]}><Text style={[styles.milestoneSymbol, done && styles.milestoneSymbolDone]}>{done ? '✓' : '•'}</Text></View><Text style={styles.milestoneLabel}>{value} Sets</Text></View>
                  </React.Fragment>
                );
              })}
            </View>
            <View style={[styles.nextCheck, compact && styles.nextCheckCompact]}>
              <View style={styles.nextCheckCopy}><Text style={styles.nextCheckLabel}>Next Recommended Check</Text><Text style={styles.nextCheckValue}>{recovery.nextRecommendedCheck}</Text></View>
              <Pressable testID="recovery-run-check" accessibilityRole="button" accessibilityLabel="Run recovery check now" disabled={checking || loading} onPress={() => void handleCheck()} style={({ pressed }) => [styles.runCheckButton, (checking || loading) && styles.disabled, pressed && styles.pressed]}><Text style={styles.runCheckText}>{checking ? 'Checking…' : 'Run Check Now'}  ›</Text></Pressable>
            </View>
            <Text style={styles.cryptoNote}>Cryptographic enrollment: {recovery.cryptographicEnrollment.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
        </View>
      </Panel>

      <Panel style={[styles.sectionPanel, compact && styles.sectionPanelCompact]}>
        <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>RECOVERY METHODS</Text>
        <View style={[styles.methodGrid, compact && styles.methodGridCompact]}>{recovery.methods.map((item) => <MethodCard key={item.id} item={item} compact={compact} />)}</View>
        {!recovery.methods.length ? <Text style={styles.emptyText}>Recovery method evidence is not available yet.</Text> : null}
        <View style={styles.scoreCard}>
          <View style={styles.scoreIcon}><RecoveryArtwork kind="recovery" color={statusColor} size={compact ? 34 : 42} /></View>
          <View style={styles.scoreCopy}><Text style={styles.scoreTitle}>Recovery Evidence Score</Text><Text style={styles.scoreSubtitle}>Calculated from wallet, Time Set, clock, authority and persistence checks</Text></View>
          <ScoreRing value={recovery.recoveryScore} color={statusColor} compact={compact} />
          <Text style={[styles.scoreLabel, { color: statusColor }]}>{scoreLabel}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Panel>

      <View style={[styles.twoColumn, compact && styles.twoColumnCompact]}>
        <Panel style={styles.actionPanel}>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>DEVICE & RECOVERY</Text>
          <ActionRow testID="recovery-device-migration" title="Device Migration" subtitle="Request owner-controlled approval for a new device" kind="device" onPress={() => navigation.navigate('OwnerAuthorityApproval')} />
          <ActionRow testID="recovery-export" title="Export Recovery Data" subtitle={recovery.exportAvailable ? (exporting ? 'Preparing metadata-only summary…' : 'Export metadata only—never seeds or raw Time Sets') : 'A wallet is required before metadata can be exported'} kind="export" color={C.blue} disabled={!recovery.exportAvailable || exporting} onPress={() => void handleExport()} />
          <ActionRow testID="recovery-test" title="Recovery Test" subtitle="Verify enrolled Time Sets without restoring keys" kind="test" color={C.green} last onPress={() => navigation.navigate('VerifyRecoverySequence')} />
        </Panel>
        <Panel style={styles.actionPanel}>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>EMERGENCY RECOVERY</Text>
          <ActionRow testID="recovery-emergency" title="Start Emergency Recovery" subtitle={providerConnected ? 'Begin verification with the connected restoration provider' : 'Begin local evidence verification; restoration provider not connected'} kind="warning" color={C.red} last onPress={() => navigation.navigate('RecoverLostWallet')} />
          <View style={styles.warningBox}><Text style={styles.warningTitle}>Important</Text><Text style={styles.warningText}>Completion requires all 24 Time Sets and a provider-signed restoration receipt. This screen cannot restore keys or change wallet state.</Text></View>
        </Panel>
      </View>

      <Panel style={[styles.signerPanel, compact && styles.sectionPanelCompact]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>RECOVERY SIGNERS <Text style={styles.sectionMeta}>({recovery.signerQuorum} OF {recovery.signerTotal} REQUIRED)</Text></Text>
          <Pressable testID="recovery-manage-signers" accessibilityRole="button" accessibilityLabel="Manage Recovery Signers" onPress={() => navigation.navigate('CreateOwnerAuthority')} style={({ pressed }) => pressed && styles.pressed}><Text style={styles.link}>Manage Signers  ›</Text></Pressable>
        </View>
        <View style={styles.signerList}>{recovery.signers.length ? recovery.signers.map((signer, index) => <SignerRow key={signer.id} signer={signer} last={index === recovery.signers.length - 1} />) : <Text style={styles.emptyText}>No recovery signers are configured.</Text>}</View>
      </Panel>

      {feedback ? <Text accessibilityLiveRegion="polite" style={[styles.feedback, /unable|failed|error/i.test(feedback) && { color: C.red }]}>{feedback}</Text> : null}

      <Pressable testID="recovery-learn-more" accessibilityRole="button" accessibilityLabel="Learn more about non-custodial recovery" onPress={() => navigation.navigate('RecoverLostWallet')} style={({ pressed }) => [styles.controlCard, pressed && styles.pressed]}>
        <View style={styles.controlIcon}><RecoveryArtwork kind="lock" color={C.green} size={compact ? 36 : 43} /></View>
        <View style={styles.controlCopy}><Text style={styles.controlTitle}>Your recovery is in your control.</Text><Text style={styles.controlText}>Nomad does not custody your keys. Local verification can prepare evidence, but restoration requires a connected provider and signed receipt.</Text></View>
        <Text style={styles.link}>Learn More  ›</Text>
      </Pressable>

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
  pressed: { opacity: .72 },
  disabled: { opacity: .42 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  header: { minHeight: 82, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  headerCompact: { minHeight: 58, marginBottom: 10, gap: 6 },
  headerBrand: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 11 },
  backButton: { width: 39, height: 48, alignItems: 'flex-start', justifyContent: 'center' },
  backButtonCompact: { width: 23, height: 39 },
  backText: { color: '#fff', fontSize: 47, fontWeight: '300', lineHeight: 48 },
  backTextCompact: { fontSize: 37, lineHeight: 39 },
  headerIcon: { width: 58, height: 58, borderWidth: 1, borderColor: `${C.green}80`, borderRadius: 16, backgroundColor: 'rgba(40,233,120,.08)', alignItems: 'center', justifyContent: 'center' },
  headerIconCompact: { width: 44, height: 44, borderRadius: 13 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: C.text, fontSize: 31, fontWeight: '900', letterSpacing: -.7 },
  headerTitleCompact: { fontSize: 19 },
  headerSubtitle: { color: '#c8d2df', fontSize: 12, marginTop: 3 },
  headerSubtitleCompact: { fontSize: 7.5, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActionsCompact: { gap: 4 },
  systemPill: { minHeight: 54, borderWidth: 1, borderRadius: 999, backgroundColor: 'rgba(2,15,27,.94)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  systemPillCompact: { minHeight: 39, paddingHorizontal: 7, gap: 3 },
  systemTop: { color: '#d8e3ef', fontSize: 11 },
  systemTopCompact: { fontSize: 7 },
  systemBottom: { fontSize: 13, fontWeight: '900', marginTop: 1 },
  systemBottomCompact: { fontSize: 8 },
  helpButton: { width: 45, height: 45, borderRadius: 23, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  helpButtonCompact: { width: 34, height: 34, borderRadius: 17 },
  helpText: { color: '#cbd7e6', fontSize: 23, fontWeight: '800' },
  helpTextCompact: { fontSize: 17 },
  errorBanner: { minHeight: 46, marginBottom: 11, borderWidth: 1, borderColor: C.red, borderRadius: 11, backgroundColor: 'rgba(255,70,70,.08)', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  errorText: { flex: 1, color: C.red, fontSize: 10 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { overflow: 'hidden' },
  heroTop: { minHeight: 220, paddingHorizontal: 22, paddingTop: 22, flexDirection: 'row', alignItems: 'center' },
  heroTopCompact: { minHeight: 154, paddingHorizontal: 12, paddingTop: 11, alignItems: 'flex-start' },
  heroCopy: { flex: 1, minWidth: 0, zIndex: 2 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  eyebrowCompact: { fontSize: 8.5 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 7, maxWidth: '72%' },
  heroTitle: { flexShrink: 1, color: C.green, fontSize: 45, lineHeight: 48, fontWeight: '900', letterSpacing: -1.5 },
  heroTitleCompact: { fontSize: 27, lineHeight: 29, letterSpacing: -.7 },
  heroDescription: { maxWidth: 450, color: '#eef5fb', fontSize: 13, lineHeight: 19, marginTop: 8 },
  heroDescriptionCompact: { maxWidth: '61%', fontSize: 8.5, lineHeight: 12, marginTop: 5 },
  statusMark: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  statusMarkText: { fontWeight: '900', lineHeight: 17 },
  heroGraphic: { width: 390, height: 220, marginRight: -22 },
  heroGraphicCompact: { position: 'absolute', width: 232, height: 147, right: -19, top: 4, opacity: .92 },
  metricGrid: { minHeight: 88, borderTopWidth: 1, borderTopColor: 'rgba(40,233,120,.22)', paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center' },
  metricGridCompact: { minHeight: 74, paddingHorizontal: 10 },
  metric: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, borderRightWidth: 1, borderRightColor: C.borderSoft },
  metricCompact: { gap: 4, paddingHorizontal: 4 },
  metricCopy: { flex: 1, minWidth: 0 },
  metricLabel: { color: C.muted, fontSize: 9 },
  metricValue: { color: '#fff', fontSize: 12, fontWeight: '800', marginTop: 5 },
  metricValueCompact: { fontSize: 8 },
  metricAccent: { fontSize: 8, fontWeight: '800', marginTop: 4 },
  metricNote: { color: C.muted2, fontSize: 7, marginTop: 4 },
  guideButton: { minHeight: 52, margin: 15, marginTop: 8, borderWidth: 1, borderColor: `${C.green}55`, borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  guideButtonCompact: { minHeight: 43, margin: 9, marginTop: 3, gap: 6 },
  guideTitle: { color: C.green, fontSize: 11, fontWeight: '900' },
  guideSubtitle: { flex: 1, minWidth: 0, color: C.muted, fontSize: 9 },
  chevron: { color: '#b9c7d8', fontSize: 23, marginLeft: 4 },
  sectionPanel: { marginTop: 16, padding: 17 },
  sectionPanelCompact: { marginTop: 11, padding: 11 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: .25 },
  sectionTitleCompact: { fontSize: 11 },
  sectionSubtitle: { color: C.muted, fontSize: 9, lineHeight: 13, marginTop: 4 },
  sectionMeta: { color: C.muted, fontSize: 9, fontWeight: '500' },
  infoSymbol: { color: C.muted, fontSize: 14 },
  timeSetBody: { flexDirection: 'row', alignItems: 'center', gap: 28, marginTop: 18 },
  timeSetBodyCompact: { gap: 13, marginTop: 13 },
  progressRing: { alignItems: 'center', justifyContent: 'center' },
  progressRingCopy: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  progressRingValue: { color: '#fff', fontSize: 29, fontWeight: '900' },
  progressRingValueCompact: { fontSize: 21 },
  progressRingLabel: { fontSize: 10, fontWeight: '800', marginTop: 3 },
  milestoneArea: { flex: 1, minWidth: 0 },
  milestoneRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  milestoneItem: { alignItems: 'center' },
  milestoneLine: { flex: 1, height: 2, marginTop: 14, backgroundColor: 'rgba(255,255,255,.15)' },
  milestoneLineDone: { backgroundColor: C.green },
  milestoneCircle: { width: 29, height: 29, borderRadius: 15, borderWidth: 2, borderColor: C.muted2, backgroundColor: C.panel2, alignItems: 'center', justifyContent: 'center' },
  milestoneCircleDone: { borderColor: C.green, backgroundColor: 'rgba(40,233,120,.12)' },
  milestoneSymbol: { color: C.muted2, fontSize: 13, fontWeight: '900' },
  milestoneSymbolDone: { color: C.green },
  milestoneLabel: { color: C.muted, fontSize: 8, marginTop: 5 },
  nextCheck: { minHeight: 62, marginTop: 14, borderWidth: 1, borderColor: `${C.green}55`, borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  nextCheckCompact: { minHeight: 54, paddingHorizontal: 8, gap: 6 },
  nextCheckCopy: { flex: 1, minWidth: 0 },
  nextCheckLabel: { color: C.muted, fontSize: 8 },
  nextCheckValue: { color: C.green, fontSize: 11, fontWeight: '900', marginTop: 4 },
  runCheckButton: { minHeight: 38, borderWidth: 1, borderColor: C.green, borderRadius: 8, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  runCheckText: { color: C.green, fontSize: 9, fontWeight: '900' },
  cryptoNote: { color: C.muted2, fontSize: 7, marginTop: 8 },
  methodGrid: { flexDirection: 'row', gap: 11, marginTop: 14 },
  methodGridCompact: { gap: 6, marginTop: 10 },
  methodCard: { flex: 1, minWidth: 0, minHeight: 157, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, backgroundColor: C.panel2, padding: 12, alignItems: 'center' },
  methodCardCompact: { minHeight: 122, padding: 7 },
  methodIcon: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  methodIconCompact: { width: 43, height: 43, borderRadius: 22 },
  methodTitle: { color: '#fff', fontSize: 11, lineHeight: 14, fontWeight: '800', textAlign: 'center', marginTop: 9 },
  methodTitleCompact: { fontSize: 8, lineHeight: 11, marginTop: 6 },
  methodSubtitle: { color: C.muted, fontSize: 8, lineHeight: 11, textAlign: 'center', marginTop: 4 },
  methodSubtitleCompact: { fontSize: 6.5, lineHeight: 9 },
  methodState: { fontSize: 8, fontWeight: '900', marginTop: 'auto', paddingTop: 7 },
  scoreCard: { minHeight: 92, marginTop: 13, borderWidth: 1, borderColor: `${C.green}55`, borderRadius: 10, backgroundColor: 'rgba(0,43,28,.56)', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  scoreIcon: { width: 52, height: 52, borderRadius: 15, borderWidth: 1, borderColor: `${C.green}55`, backgroundColor: 'rgba(40,233,120,.08)', alignItems: 'center', justifyContent: 'center' },
  scoreCopy: { flex: 1, minWidth: 0 },
  scoreTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  scoreSubtitle: { color: C.muted, fontSize: 8, lineHeight: 12, marginTop: 4 },
  scoreRing: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center' },
  scoreRingCompact: { width: 64, height: 64 },
  scoreRingCopy: { position: 'absolute', alignItems: 'center' },
  scoreValue: { color: '#fff', fontSize: 26, fontWeight: '900' },
  scoreValueCompact: { fontSize: 20 },
  scoreMax: { color: C.muted, fontSize: 7 },
  scoreLabel: { fontSize: 9, fontWeight: '900', maxWidth: 75 },
  twoColumn: { flexDirection: 'row', gap: 12, marginTop: 16 },
  twoColumnCompact: { gap: 8, marginTop: 11 },
  actionPanel: { flex: 1, minWidth: 0, padding: 15 },
  actionRow: { minHeight: 69, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  actionIcon: { width: 43, height: 43, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  actionTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  actionSubtitle: { color: C.muted, fontSize: 8, lineHeight: 12, marginTop: 3 },
  warningBox: { marginTop: 8, borderWidth: 1, borderColor: `${C.red}80`, borderRadius: 9, backgroundColor: 'rgba(91,9,19,.18)', padding: 10 },
  warningTitle: { color: C.red, fontSize: 9, fontWeight: '900' },
  warningText: { color: '#d6dbe4', fontSize: 8, lineHeight: 12, marginTop: 5 },
  signerPanel: { marginTop: 16, paddingHorizontal: 16, paddingTop: 16 },
  signerList: { marginTop: 8 },
  signerRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  signerIcon: { width: 41, height: 41, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  signerCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  signerName: { color: '#fff', fontSize: 10, fontWeight: '900' },
  signerRole: { color: C.muted, fontSize: 8, marginTop: 4 },
  signerStatusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  signerStatus: { fontSize: 8, fontWeight: '900' },
  link: { color: C.green, fontSize: 9, fontWeight: '900' },
  emptyText: { color: C.muted, fontSize: 9, lineHeight: 14, paddingVertical: 18, textAlign: 'center' },
  feedback: { color: C.green, fontSize: 9, lineHeight: 14, marginTop: 11, textAlign: 'center' },
  controlCard: { minHeight: 88, marginTop: 16, borderWidth: 1, borderColor: `${C.green}66`, borderRadius: 12, backgroundColor: 'rgba(0,42,25,.78)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlIcon: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: C.green, backgroundColor: 'rgba(40,233,120,.08)', alignItems: 'center', justifyContent: 'center' },
  controlCopy: { flex: 1, minWidth: 0 },
  controlTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  controlText: { color: C.muted, fontSize: 8, lineHeight: 12, marginTop: 4 },
});
