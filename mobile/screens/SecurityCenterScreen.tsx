import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useNomadSecurity } from '../nomad';
import type {
  NomadSecurityBackupResult,
  NomadSecurityEvent,
  NomadSecurityModuleResult,
  NomadSecurityModuleStatus,
} from '../nomad';
import {
  BottomNav,
  C,
  NomadBrandMark,
  NomadPage,
  Panel,
  useNomadLayout,
} from '../ui/NomadShell';

type SecurityArtworkKind =
  | 'shield'
  | 'storage'
  | 'authority'
  | 'device'
  | 'recovery'
  | 'network'
  | 'key'
  | 'multisig'
  | 'cloud'
  | 'scan'
  | 'freeze';

const worldDots: Array<[number, number]> = [
  [24, 58], [32, 49], [40, 43], [48, 47], [55, 56], [63, 63], [72, 59], [80, 49], [88, 43],
  [99, 51], [106, 62], [112, 73], [120, 84], [131, 91], [139, 104], [147, 119], [154, 132],
  [171, 58], [179, 50], [188, 47], [198, 51], [207, 62], [218, 68], [229, 63], [240, 56],
  [250, 61], [260, 72], [270, 80], [281, 90], [292, 102], [304, 114], [314, 125], [325, 136],
  [208, 91], [218, 103], [226, 116], [234, 129], [241, 143], [250, 151], [263, 147], [274, 139],
  [289, 68], [300, 62], [311, 68], [321, 78], [329, 91], [338, 103], [347, 111], [355, 102],
];

const backupTitles: Record<NomadSecurityBackupResult['id'], { title: string; subtitle: string; kind: SecurityArtworkKind }> = {
  recovery_sequence: { title: 'Time Set Recovery', subtitle: '24 Time Sets + password', kind: 'key' },
  multi_sig: { title: 'Multi-Sig Wallet', subtitle: 'Approval quorum', kind: 'multisig' },
  encrypted_backup: { title: 'Encrypted Backup', subtitle: 'Provider not connected', kind: 'cloud' },
};

const moduleKinds: Record<NomadSecurityModuleResult['id'], SecurityArtworkKind> = {
  secure_storage: 'storage',
  owner_authority: 'authority',
  device_integrity: 'device',
  recovery_status: 'recovery',
  network_protection: 'network',
};

function SecurityArtwork({ kind, color = C.green, size = 42 }: { kind: SecurityArtworkKind; color?: string; size?: number }) {
  const stroke = { stroke: color, strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let artwork: React.ReactNode;

  switch (kind) {
    case 'storage':
      artwork = <><Rect x="7" y="12" width="34" height="27" rx="5" {...stroke} /><Path d="M12 18h24M18 26h12v9H18Z" {...stroke} /><Circle cx="24" cy="30" r="1.7" fill={color} /></>;
      break;
    case 'authority':
      artwork = <><Circle cx="24" cy="15" r="7" {...stroke} /><Path d="M11 39c1-9 6-14 13-14s12 5 13 14M34 20l8 4-2 9-6 3" {...stroke} /></>;
      break;
    case 'device':
      artwork = <><Rect x="12" y="5" width="24" height="38" rx="5" {...stroke} /><Path d="m17 25 5 5 10-12M20 38h8" {...stroke} /></>;
      break;
    case 'recovery':
      artwork = <><Path d="M10 18a16 16 0 1 1-2 15M10 8v10H1" {...stroke} /><Path d="m17 25 5 5 10-11" {...stroke} /></>;
      break;
    case 'network':
      artwork = <><Path d="M24 5 40 12v12c0 11-6 18-16 23C14 42 8 35 8 24V12Z" {...stroke} /><Circle cx="18" cy="24" r="2" fill={color} /><Circle cx="30" cy="18" r="2" fill={color} /><Circle cx="31" cy="31" r="2" fill={color} /><Path d="m20 23 8-4M20 26l9 4M30 20l1 9" {...stroke} /></>;
      break;
    case 'key':
      artwork = <><Circle cx="31" cy="16" r="9" {...stroke} /><Path d="M25 22 7 40M13 34l5 5M18 29l5 5M31 12v8M27 16h8" {...stroke} /></>;
      break;
    case 'multisig':
      artwork = <><Path d="M24 4 41 14v20L24 44 7 34V14Z" {...stroke} /><Circle cx="24" cy="18" r="5" {...stroke} /><Path d="M15 34c1-7 4-10 9-10s8 3 9 10" {...stroke} /></>;
      break;
    case 'cloud':
      artwork = <><Path d="M12 36h25a8 8 0 0 0 1-16 14 14 0 0 0-27-2A9 9 0 0 0 12 36Z" {...stroke} /><Path d="M24 22v17m-6-6 6 6 6-6" {...stroke} /></>;
      break;
    case 'scan':
      artwork = <><Path d="M16 7H7v9M32 7h9v9M16 41H7v-9M32 41h9v-9" {...stroke} /><Path d="M12 24h24" {...stroke} /><Circle cx="24" cy="24" r="7" {...stroke} /></>;
      break;
    case 'freeze':
      artwork = <><Path d="M24 6v36M8 15l32 18M40 15 8 33M18 10l6 6 6-6M18 38l6-6 6 6M8 22l8 2-2-8M40 26l-8-2 2 8" {...stroke} /></>;
      break;
    default:
      artwork = <><Path d="M24 4 41 12v13c0 11-6 18-17 23C13 43 7 36 7 25V12Z" {...stroke} /><Path d="m15 25 6 6 12-14" {...stroke} /></>;
  }

  return <Svg accessibilityLabel={`${kind} security icon`} width={size} height={size} viewBox="0 0 48 48" fill="none">{artwork}</Svg>;
}

function statusInfo(status: NomadSecurityModuleStatus) {
  switch (status) {
    case 'secure': return { color: C.green, label: 'SECURE', symbol: '✓' };
    case 'available': return { color: C.green, label: 'AVAILABLE', symbol: '✓' };
    case 'warning': return { color: C.yellow, label: 'REVIEW', symbol: '!' };
    case 'failed': return { color: C.red, label: 'FAILED', symbol: '×' };
    case 'not_configured': return { color: C.purple, label: 'SETUP', symbol: '+' };
    case 'unavailable': return { color: C.muted, label: 'UNAVAILABLE', symbol: '—' };
  }
}

function StatusMark({ color, symbol, size = 20 }: { color: string; symbol: string; size?: number }) {
  return (
    <View style={[styles.statusMark, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
      <Text style={[styles.statusMarkText, { color, fontSize: size * .58 }]}>{symbol}</Text>
    </View>
  );
}

function SystemStatusPill({ compact, label, color }: { compact: boolean; label: string; color: string }) {
  return (
    <View accessibilityLabel={`All Systems ${label}`} style={[styles.systemPill, compact && styles.systemPillCompact, { borderColor: `${color}66` }]}>
      <SecurityArtwork kind="shield" color={color} size={compact ? 29 : 36} />
      <View>
        <Text style={[styles.systemTop, compact && styles.systemTopCompact]}>All Systems</Text>
        <Text style={[styles.systemBottom, compact && styles.systemBottomCompact, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

function SecurityHeader({ compact, label, color }: { compact: boolean; label: string; color: string }) {
  const navigation = useNavigation<any>();
  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <View style={styles.headerBrand}>
        <NomadBrandMark size={compact ? 43 : 54} />
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.headerTitle, compact && styles.headerTitleCompact]}>Security Center</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.headerSubtitle, compact && styles.headerSubtitleCompact]}>Your assets. Your keys. Your sovereignty.</Text>
        </View>
      </View>
      <View style={[styles.headerActions, compact && styles.headerActionsCompact]}>
        <SystemStatusPill compact={compact} label={label} color={color} />
        <Pressable accessibilityRole="button" accessibilityLabel="Open Security Center help" onPress={() => navigation.navigate('Settings')} style={({ pressed }) => [styles.helpButton, compact && styles.helpButtonCompact, pressed && styles.pressed]}>
          <Text style={[styles.helpText, compact && styles.helpTextCompact]}>?</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SecurityHeroGraphic({ compact, color }: { compact: boolean; color: string }) {
  return (
    <View pointerEvents="none" style={[styles.heroGraphic, compact && styles.heroGraphicCompact]}>
      <Svg width="100%" height="100%" viewBox="0 0 370 220" fill="none">
        <Defs>
          <RadialGradient id="securityGlow"><Stop stopColor={color} stopOpacity={0.34} /><Stop offset="1" stopColor={color} stopOpacity={0} /></RadialGradient>
          <LinearGradient id="shieldFace" x1="155" y1="30" x2="255" y2="145"><Stop stopColor="#70ffc2" stopOpacity={0.92} /><Stop offset=".5" stopColor={color} stopOpacity={0.68} /><Stop offset="1" stopColor="#057e6d" stopOpacity={0.36} /></LinearGradient>
        </Defs>
        <Rect width="370" height="220" fill="url(#securityGlow)" />
        <G fill={color} opacity={0.32}>{worldDots.map(([cx, cy], index) => <Circle key={`${cx}-${cy}-${index}`} cx={cx} cy={cy} r={index % 5 === 0 ? 2 : 1.25} />)}</G>
        <G stroke={color} strokeOpacity={0.18} strokeWidth="1"><Path d="M18 76c68-52 132-40 182-4 45 32 93 29 153-10" /><Path d="M25 123c59-23 112-14 161 15 48 27 101 29 165 1" /></G>
        <Ellipse cx="237" cy="177" rx="99" ry="29" fill="#031b19" stroke="#278cff" strokeOpacity={0.75} strokeWidth="3" />
        <Ellipse cx="237" cy="168" rx="78" ry="27" fill="#05281e" stroke={color} strokeOpacity={0.72} strokeWidth="2" />
        <Ellipse cx="237" cy="165" rx="48" ry="17" stroke={color} strokeOpacity={0.7} strokeWidth="2" />
        <Path d="M237 30 289 50v43c0 37-20 62-52 79-32-17-52-42-52-79V50Z" fill="url(#shieldFace)" stroke="#8affca" strokeWidth="3" />
        <Path d="M237 46 276 61v32c0 28-15 47-39 61-24-14-39-33-39-61V61Z" fill="#063d2d" fillOpacity={0.42} stroke={color} strokeOpacity={0.72} />
        <Path d="m216 96 14 14 29-35" stroke="#b7ffdb" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <G stroke="#d1ffe8" strokeOpacity={0.28}><Path d="M204 63h20l7 7h18l7-7h18M202 125h18l7-7h20l8 7h18" /><Circle cx="224" cy="63" r="2" fill="#d1ffe8" /><Circle cx="255" cy="125" r="2" fill="#d1ffe8" /></G>
      </Svg>
    </View>
  );
}

function ScoreRing({ value, color, compact }: { value: number; color: string; compact: boolean }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <View style={[styles.scoreMetric, compact && styles.scoreMetricCompact]}>
      <Svg width={compact ? 38 : 47} height={compact ? 38 : 47} viewBox="0 0 40 40">
        <Circle cx="20" cy="20" r={radius} stroke="rgba(255,255,255,.14)" strokeWidth="4" fill="none" />
        <Circle cx="20" cy="20" r={radius} stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset} transform="rotate(-90 20 20)" />
      </Svg>
      <View>
        <Text style={[styles.metricLabel, compact && styles.metricLabelCompact]}>Security Score</Text>
        <Text style={[styles.scoreValue, compact && styles.scoreValueCompact]}>{value}/100</Text>
        <Text style={[styles.metricAccent, { color }]}>{value === 100 ? 'Excellent' : 'Evidence based'}</Text>
      </View>
    </View>
  );
}

function ModuleRow({ item, last, compact }: { item: NomadSecurityModuleResult; last?: boolean; compact: boolean }) {
  const navigation = useNavigation<any>();
  const status = statusInfo(item.status);
  return (
    <Pressable
      testID={`security-module-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}. ${status.label}`}
      onPress={() => navigation.navigate(item.route)}
      style={({ pressed }) => [styles.moduleRow, compact && styles.moduleRowCompact, !last && styles.rowBorder, pressed && styles.pressed]}
    >
      <View style={[styles.moduleIcon, compact && styles.moduleIconCompact, { borderColor: `${status.color}80`, backgroundColor: `${status.color}12` }]}>
        <SecurityArtwork kind={moduleKinds[item.id]} color={status.color} size={compact ? 31 : 39} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, compact && styles.rowTitleCompact]}>{item.title}</Text>
        <Text numberOfLines={compact ? 2 : 1} style={[styles.rowDetail, compact && styles.rowDetailCompact]}>{item.detail}</Text>
      </View>
      <View style={styles.rowStatus}>
        <StatusMark color={status.color} symbol={status.symbol} size={compact ? 17 : 20} />
        <Text style={[styles.rowStatusText, compact && styles.rowStatusTextCompact, { color: status.color }]}>{status.label}</Text>
      </View>
      <Text style={[styles.chevron, compact && styles.chevronCompact]}>›</Text>
    </Pressable>
  );
}

function BackupCard({ item, compact }: { item: NomadSecurityBackupResult; compact: boolean }) {
  const navigation = useNavigation<any>();
  const status = statusInfo(item.status);
  const display = backupTitles[item.id];
  return (
    <Pressable
      testID={`security-backup-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Open ${display.title}. ${status.label}`}
      onPress={() => navigation.navigate(item.route)}
      style={({ pressed }) => [styles.backupCard, compact && styles.backupCardCompact, pressed && styles.pressed]}
    >
      <View style={[styles.backupIcon, compact && styles.backupIconCompact, { borderColor: `${status.color}70`, backgroundColor: `${status.color}0e` }]}>
        <SecurityArtwork kind={display.kind} color={C.blue} size={compact ? 38 : 48} />
      </View>
      <Text numberOfLines={2} style={[styles.backupTitle, compact && styles.backupTitleCompact]}>{display.title}</Text>
      <Text numberOfLines={1} style={[styles.backupSubtitle, compact && styles.backupSubtitleCompact]}>{display.subtitle}</Text>
      <View style={styles.backupStatusRow}><StatusMark color={status.color} symbol={status.symbol} size={compact ? 14 : 17} /><Text style={[styles.backupStatus, compact && styles.backupStatusCompact, { color: status.color }]}>{status.label}</Text></View>
      <Text numberOfLines={2} style={[styles.backupDetail, compact && styles.backupDetailCompact]}>{item.detail}</Text>
    </Pressable>
  );
}

function formatTime(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Unknown';
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - parsed) / 60_000));
  if (elapsedMinutes < 60) return elapsedMinutes <= 1 ? 'Now' : `${elapsedMinutes} min ago`;
  return new Date(parsed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function EventRow({ item, last, compact }: { item: NomadSecurityEvent; last?: boolean; compact: boolean }) {
  const color = item.severity === 'critical' ? C.red : item.severity === 'warning' ? C.yellow : C.green;
  const kind: SecurityArtworkKind = item.type === 'freeze' ? 'freeze' : item.type === 'recovery' ? 'recovery' : item.type === 'wallet' ? 'device' : item.type === 'scan' ? 'scan' : 'authority';
  return (
    <View style={[styles.eventRow, compact && styles.eventRowCompact, !last && styles.rowBorder]}>
      <View style={[styles.eventIcon, compact && styles.eventIconCompact, { borderColor: `${color}70`, backgroundColor: `${color}12` }]}><SecurityArtwork kind={kind} color={color} size={compact ? 27 : 34} /></View>
      <View style={styles.eventCopy}>
        <Text numberOfLines={1} style={[styles.eventTitle, compact && styles.eventTitleCompact]}>{item.title}</Text>
        <Text numberOfLines={2} style={[styles.eventDetail, compact && styles.eventDetailCompact]}>{item.detail}</Text>
      </View>
      <View style={styles.eventRight}><Text style={[styles.eventTime, compact && styles.eventTimeCompact]}>{formatTime(item.timestamp)}</Text><View style={[styles.eventDot, { backgroundColor: color }]} /></View>
    </View>
  );
}

export default function SecurityCenterScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { security, loading, error, refresh, runScan } = useNomadSecurity();
  const [scanFeedback, setScanFeedback] = useState('');

  const frozen = security.status === 'frozen';
  const warning = security.status === 'warning';
  const statusColor = frozen ? C.red : warning ? C.yellow : C.green;
  const statusLabel = frozen ? 'FROZEN' : warning ? 'REVIEW' : 'SECURE';
  const statusSymbol = frozen ? '×' : warning ? '!' : '✓';
  const secureModules = security.modules.filter((item) => item.status === 'secure' || item.status === 'available').length;
  const modulesNeedingAttention = security.modules.length - secureModules;

  const handleScan = async () => {
    try {
      setScanFeedback('Running independent security checks…');
      const next = await runScan();
      setScanFeedback(`Scan complete • ${next.score}/100`);
    } catch (nextError) {
      setScanFeedback(nextError instanceof Error ? nextError.message : 'Unable to complete the security scan.');
    }
  };

  return (
    <NomadPage maxWidth={960}>
      <SecurityHeader compact={compact} label={statusLabel} color={statusColor} />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retry Security Center" onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel tone={frozen ? 'red' : warning ? 'yellow' : 'green'} style={styles.hero}>
        <View style={[styles.heroTop, compact && styles.heroTopCompact]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, compact && styles.eyebrowCompact, { color: statusColor }]}>SECURITY STATUS</Text>
            <View style={styles.heroStatusRow}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.heroStatus, compact && styles.heroStatusCompact, { color: statusColor }]}>{statusLabel}</Text>
              <StatusMark color={statusColor} symbol={statusSymbol} size={compact ? 29 : 38} />
            </View>
            <Text numberOfLines={2} style={[styles.heroDescription, compact && styles.heroDescriptionCompact]}>
              {frozen
                ? 'Emergency protection is active. Restricted actions remain blocked.'
                : warning
                  ? `${modulesNeedingAttention} of ${security.modules.length} protection layers need review.`
                  : 'All connected security modules passed their latest checks.'}
            </Text>
          </View>
          <SecurityHeroGraphic compact={compact} color={statusColor} />
        </View>

        <View style={[styles.metricGrid, compact && styles.metricGridCompact]}>
          <View style={[styles.metric, compact && styles.metricCompact]}>
            <SecurityArtwork kind="shield" color={statusColor} size={compact ? 23 : 29} />
            <View><Text style={[styles.metricLabel, compact && styles.metricLabelCompact]}>Protected Since</Text><Text numberOfLines={1} style={[styles.metricValue, compact && styles.metricValueCompact]}>{security.protectedSince}</Text><Text style={[styles.metricAccent, { color: statusColor }]}>{security.protectedDays}</Text></View>
          </View>
          <Pressable testID="security-run-scan" accessibilityRole="button" accessibilityLabel="Run Security Scan" disabled={loading} onPress={() => void handleScan()} style={({ pressed }) => [styles.metric, compact && styles.metricCompact, loading && styles.disabled, pressed && styles.pressed]}>
            <SecurityArtwork kind="scan" color={C.blue} size={compact ? 23 : 29} />
            <View style={styles.metricText}><Text style={[styles.metricLabel, compact && styles.metricLabelCompact]}>Last Scan</Text><Text numberOfLines={1} style={[styles.metricValue, compact && styles.metricValueCompact]}>{loading ? 'Checking…' : security.lastScanLabel}</Text><Text numberOfLines={1} style={styles.metricNote}>{loading ? 'Independent local evidence' : security.lastScanDetail}</Text></View>
          </Pressable>
          <ScoreRing value={security.score} color={statusColor} compact={compact} />
        </View>
        {scanFeedback ? <Text accessibilityLiveRegion="polite" style={[styles.scanFeedback, { color: statusColor }]}>{scanFeedback}</Text> : null}
      </Panel>

      <Panel style={[styles.sectionPanel, compact && styles.sectionPanelCompact]}>
        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>SECURITY MODULES</Text><Text style={styles.sectionMeta}>ARKRILIUM SECURITY LAYER</Text></View>
        <View style={styles.moduleList}>
          {security.modules.map((item, index) => <ModuleRow key={item.id} item={item} compact={compact} last={index === security.modules.length - 1} />)}
        </View>
      </Panel>

      <Panel style={[styles.sectionPanel, compact && styles.sectionPanelCompact]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>RECOVERY & BACKUP</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Manage recovery and backup" onPress={() => navigation.navigate('RecoveryCenter')} style={({ pressed }) => pressed && styles.pressed}><Text style={[styles.link, compact && styles.linkCompact]}>Manage  ›</Text></Pressable>
        </View>
        {security.backupMethods.length ? (
          <View style={[styles.backupGrid, compact && styles.backupGridCompact]}>{security.backupMethods.map((item) => <BackupCard key={item.id} item={item} compact={compact} />)}</View>
        ) : <Text style={styles.emptyText}>Recovery evidence is unavailable until the security adapter completes its first check.</Text>}
      </Panel>

      <Panel style={[styles.sectionPanel, compact && styles.sectionPanelCompact]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>SECURITY ACTIVITY</Text>
          <Pressable testID="security-activity-view-all" accessibilityRole="button" accessibilityLabel="View all Security Activity" onPress={() => navigation.navigate('NomadInsights')} style={({ pressed }) => pressed && styles.pressed}><Text style={[styles.link, compact && styles.linkCompact]}>View All  ›</Text></Pressable>
        </View>
        {security.activity.length ? (
          <View style={styles.eventList}>{security.activity.slice(0, 3).map((item, index) => <EventRow key={item.id} item={item} compact={compact} last={index === Math.min(3, security.activity.length) - 1} />)}</View>
        ) : (
          <View style={[styles.emptyActivity, compact && styles.emptyActivityCompact]}>
            <View style={styles.emptyActivityIcon}><SecurityArtwork kind="scan" color={C.blue} size={compact ? 29 : 36} /></View>
            <View style={styles.emptyActivityCopy}><Text style={styles.emptyActivityTitle}>No recorded security events</Text><Text style={styles.emptyText}>Run Security Scan to create the first timestamped local audit record.</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Run Security Scan" disabled={loading} onPress={() => void handleScan()} style={({ pressed }) => [styles.emptyScanButton, loading && styles.disabled, pressed && styles.pressed]}><Text style={styles.emptyScanText}>Run Scan</Text></Pressable>
          </View>
        )}
      </Panel>

      <Panel style={[styles.controlPanel, compact && styles.controlPanelCompact]}>
        <NomadBrandMark size={compact ? 42 : 54} />
        <View style={styles.controlCopy}>
          <Text style={[styles.controlTitle, compact && styles.controlTitleCompact]}>You are in full control.</Text>
          <Text numberOfLines={2} style={[styles.controlSubtitle, compact && styles.controlSubtitleCompact]}>Nomad is non-custodial. Protected by Arkrilium Security Layer.</Text>
        </View>
        <Pressable testID="security-learn-more" accessibilityRole="button" accessibilityLabel="Learn more about Arkrilium Security Layer" onPress={() => navigation.navigate('VoltaireProtocols')} style={({ pressed }) => [styles.learnButton, compact && styles.learnButtonCompact, pressed && styles.pressed]}><Text style={[styles.learnText, compact && styles.learnTextCompact]}>Learn More</Text></Pressable>
      </Panel>

      <BottomNav
        active="Security"
        items={[
          ['⌂', 'Home', 'Portfolio'],
          ['▣', 'Wallets', 'Wallets'],
          ['✈', 'Travel', 'TravelMode'],
          ['◇', 'Security', 'SecurityCenter'],
          ['⚙', 'Settings', 'Settings'],
        ]}
      />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: .7 },
  disabled: { opacity: .5 },
  header: { minHeight: 82, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  headerCompact: { minHeight: 58, marginBottom: 10, gap: 7 },
  headerBrand: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 13 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: C.text, fontSize: 32, fontWeight: '900', letterSpacing: -.7 },
  headerTitleCompact: { fontSize: 20 },
  headerSubtitle: { color: '#c8d2df', fontSize: 13, marginTop: 3 },
  headerSubtitleCompact: { fontSize: 8.5, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerActionsCompact: { gap: 5 },
  systemPill: { minHeight: 54, borderWidth: 1, borderRadius: 999, backgroundColor: 'rgba(2,15,27,.94)', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 9 },
  systemPillCompact: { minHeight: 39, paddingHorizontal: 8, gap: 4 },
  systemTop: { color: '#d8e3ef', fontSize: 11 },
  systemTopCompact: { fontSize: 7.5 },
  systemBottom: { fontSize: 13, fontWeight: '900', marginTop: 1 },
  systemBottomCompact: { fontSize: 8.5 },
  helpButton: { width: 45, height: 45, borderRadius: 23, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  helpButtonCompact: { width: 36, height: 36, borderRadius: 18 },
  helpText: { color: '#cbd7e6', fontSize: 23, fontWeight: '800' },
  helpTextCompact: { fontSize: 18 },
  statusMark: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  statusMarkText: { fontWeight: '900', lineHeight: 18 },
  errorBanner: { minHeight: 46, marginBottom: 11, borderWidth: 1, borderColor: C.red, borderRadius: 11, backgroundColor: 'rgba(255,70,70,.08)', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  errorText: { flex: 1, color: C.red, fontSize: 10 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { overflow: 'hidden' },
  heroTop: { minHeight: 238, paddingHorizontal: 26, paddingTop: 25, flexDirection: 'row', alignItems: 'center' },
  heroTopCompact: { minHeight: 151, paddingHorizontal: 13, paddingTop: 12 },
  heroCopy: { flex: 1, minWidth: 0, zIndex: 2 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  eyebrowCompact: { fontSize: 8.5 },
  heroStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 8 },
  heroStatus: { maxWidth: '72%', fontSize: 53, fontWeight: '900', letterSpacing: -2 },
  heroStatusCompact: { fontSize: 30, letterSpacing: -1 },
  heroDescription: { maxWidth: 390, color: '#eef5fb', fontSize: 14, lineHeight: 20, marginTop: 8 },
  heroDescriptionCompact: { maxWidth: 205, fontSize: 9, lineHeight: 13, marginTop: 5 },
  heroGraphic: { width: 390, height: 230, marginRight: -22 },
  heroGraphicCompact: { width: 183, height: 135, marginRight: -22, marginLeft: -20 },
  metricGrid: { minHeight: 105, borderTopWidth: 1, borderTopColor: 'rgba(40,233,120,.25)', backgroundColor: 'rgba(2,18,21,.52)', paddingHorizontal: 20, paddingVertical: 13, flexDirection: 'row', alignItems: 'stretch' },
  metricGridCompact: { minHeight: 72, paddingHorizontal: 8, paddingVertical: 8 },
  metric: { flex: 1, minWidth: 0, borderRightWidth: 1, borderRightColor: C.borderSoft, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricCompact: { paddingHorizontal: 5, gap: 5 },
  metricText: { flex: 1, minWidth: 0 },
  metricLabel: { color: '#aebaca', fontSize: 10 },
  metricLabelCompact: { fontSize: 6.5 },
  metricValue: { color: C.text, fontSize: 15, fontWeight: '900', marginTop: 5 },
  metricValueCompact: { fontSize: 9, marginTop: 3 },
  metricAccent: { fontSize: 8, fontWeight: '800', marginTop: 5 },
  metricNote: { color: C.muted, fontSize: 7, marginTop: 4 },
  scoreMetric: { flex: 1, minWidth: 0, paddingLeft: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreMetricCompact: { paddingLeft: 6, gap: 4 },
  scoreValue: { color: C.text, fontSize: 17, fontWeight: '900', marginTop: 3 },
  scoreValueCompact: { fontSize: 10 },
  scanFeedback: { paddingHorizontal: 20, paddingVertical: 7, fontSize: 9, fontWeight: '800', backgroundColor: 'rgba(0,0,0,.14)' },
  sectionPanel: { marginTop: 15, padding: 14 },
  sectionPanelCompact: { marginTop: 10, padding: 9, borderRadius: 13 },
  sectionHeader: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '900', letterSpacing: .3 },
  sectionTitleCompact: { fontSize: 10.5 },
  sectionMeta: { color: C.yellow, fontSize: 7, fontWeight: '900', letterSpacing: .7 },
  link: { color: C.blue, fontSize: 12, fontWeight: '900' },
  linkCompact: { fontSize: 9 },
  moduleList: { marginTop: 10, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 12, overflow: 'hidden' },
  moduleRow: { minHeight: 83, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  moduleRowCompact: { minHeight: 61, paddingHorizontal: 8, paddingVertical: 7 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  moduleIcon: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  moduleIconCompact: { width: 39, height: 39, borderRadius: 12 },
  rowCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  rowTitle: { color: C.text, fontSize: 14, fontWeight: '900' },
  rowTitleCompact: { fontSize: 10 },
  rowDetail: { color: C.muted, fontSize: 9, lineHeight: 13, marginTop: 4 },
  rowDetailCompact: { fontSize: 7, lineHeight: 9.5, marginTop: 2 },
  rowStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 7 },
  rowStatusText: { fontSize: 9, fontWeight: '900' },
  rowStatusTextCompact: { fontSize: 6.8 },
  chevron: { color: '#b8c4d5', fontSize: 28, marginLeft: 8 },
  chevronCompact: { fontSize: 20, marginLeft: 4 },
  backupGrid: { marginTop: 12, flexDirection: 'row', gap: 10 },
  backupGridCompact: { marginTop: 8, gap: 6 },
  backupCard: { flex: 1, minWidth: 0, minHeight: 178, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 12, alignItems: 'center', padding: 13 },
  backupCardCompact: { minHeight: 121, borderRadius: 9, paddingHorizontal: 4, paddingVertical: 7 },
  backupIcon: { width: 59, height: 59, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backupIconCompact: { width: 44, height: 44, borderRadius: 13 },
  backupTitle: { color: C.text, fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 9 },
  backupTitleCompact: { fontSize: 8.5, marginTop: 5 },
  backupSubtitle: { color: '#c7d1df', fontSize: 9, textAlign: 'center', marginTop: 3 },
  backupSubtitleCompact: { fontSize: 6.3, marginTop: 2 },
  backupStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  backupStatus: { fontSize: 9, fontWeight: '900' },
  backupStatusCompact: { fontSize: 6.5 },
  backupDetail: { color: C.muted, fontSize: 8, lineHeight: 12, textAlign: 'center', marginTop: 6 },
  backupDetailCompact: { fontSize: 6.1, lineHeight: 8, marginTop: 4 },
  eventList: { marginTop: 9, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, overflow: 'hidden' },
  eventRow: { minHeight: 70, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  eventRowCompact: { minHeight: 51, paddingHorizontal: 7, paddingVertical: 6 },
  eventIcon: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eventIconCompact: { width: 34, height: 34, borderRadius: 11 },
  eventCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  eventTitle: { color: C.text, fontSize: 12, fontWeight: '900' },
  eventTitleCompact: { fontSize: 8.5 },
  eventDetail: { color: C.muted, fontSize: 8.5, lineHeight: 12, marginTop: 3 },
  eventDetailCompact: { fontSize: 6.3, lineHeight: 8.5, marginTop: 2 },
  eventRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 7 },
  eventTime: { color: C.muted, fontSize: 8 },
  eventTimeCompact: { fontSize: 6.2 },
  eventDot: { width: 6, height: 6, borderRadius: 3 },
  emptyActivity: { minHeight: 82, marginTop: 9, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, padding: 11, flexDirection: 'row', alignItems: 'center' },
  emptyActivityCompact: { minHeight: 59, padding: 7 },
  emptyActivityIcon: { width: 44, alignItems: 'center' },
  emptyActivityCopy: { flex: 1, minWidth: 0, marginLeft: 7 },
  emptyActivityTitle: { color: C.text, fontSize: 10, fontWeight: '900' },
  emptyText: { color: C.muted, fontSize: 8, lineHeight: 12, marginTop: 3 },
  emptyScanButton: { minHeight: 31, borderWidth: 1, borderColor: C.blue, borderRadius: 8, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  emptyScanText: { color: C.blue, fontSize: 8, fontWeight: '900' },
  controlPanel: { marginTop: 15, minHeight: 90, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  controlPanelCompact: { marginTop: 10, minHeight: 65, paddingHorizontal: 9, borderRadius: 13 },
  controlCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  controlTitle: { color: C.text, fontSize: 16, fontWeight: '900' },
  controlTitleCompact: { fontSize: 10.5 },
  controlSubtitle: { color: '#cbd5e1', fontSize: 10, lineHeight: 15, marginTop: 4 },
  controlSubtitleCompact: { fontSize: 6.7, lineHeight: 9.5, marginTop: 2 },
  learnButton: { minHeight: 43, borderWidth: 1, borderColor: C.blue, borderRadius: 10, paddingHorizontal: 17, alignItems: 'center', justifyContent: 'center' },
  learnButtonCompact: { minHeight: 31, borderRadius: 8, paddingHorizontal: 10 },
  learnText: { color: C.blue, fontSize: 10, fontWeight: '900' },
  learnTextCompact: { fontSize: 7.5 },
});
