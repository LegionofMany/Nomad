import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

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
  NomadPage,
  PageHeader,
  Panel,
  ProgressBar,
  useNomadLayout,
} from '../ui/NomadShell';

const svgUri = (viewBox: string, body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`)}`;

const securityShieldUri = svgUri(
  '0 0 260 300',
  `<defs>
    <linearGradient id="shield" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#24f181"/><stop offset=".52" stop-color="#08bc67"/><stop offset="1" stop-color="#0673a5"/></linearGradient>
    <radialGradient id="core"><stop stop-color="#24f181" stop-opacity=".44"/><stop offset="1" stop-color="#24f181" stop-opacity="0"/></radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <circle cx="130" cy="143" r="114" fill="url(#core)"/>
  <circle cx="130" cy="143" r="102" fill="none" stroke="#20ef70" stroke-opacity=".18" stroke-width="2"/>
  <circle cx="130" cy="143" r="82" fill="none" stroke="#20ef70" stroke-opacity=".24" stroke-width="2"/>
  <path d="M130 20 226 62v72c0 72-38 120-96 151-58-31-96-79-96-151V62Z" fill="#021a16" stroke="url(#shield)" stroke-width="8" filter="url(#glow)"/>
  <path d="M130 48 198 78v55c0 53-27 89-68 115-41-26-68-62-68-115V78Z" fill="#03100f" stroke="#20ef70" stroke-opacity=".45" stroke-width="3"/>
  <path d="m89 145 27 27 57-70" fill="none" stroke="#20ef70" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
  <circle cx="130" cy="143" r="9" fill="#20ef70"/>
  <path d="M30 244h200M46 263h168" stroke="#20ef70" stroke-opacity=".2" stroke-width="2"/>
  <circle cx="48" cy="263" r="4" fill="#20ef70"/><circle cx="212" cy="263" r="4" fill="#20ef70"/>
  </svg>`,
);

const moduleIcons: Record<NomadSecurityModuleResult['id'], string> = {
  secure_storage: '▣',
  owner_authority: '♙',
  device_integrity: '▤',
  recovery_status: '⟳',
  network_protection: '◇',
};

const backupIcons: Record<NomadSecurityBackupResult['id'], string> = {
  recovery_sequence: '⚿',
  multi_sig: '⬡',
  encrypted_backup: '☁',
};

function statusPresentation(status: NomadSecurityModuleStatus) {
  switch (status) {
    case 'secure': return { color: C.green, label: 'SECURE', symbol: '✓' };
    case 'warning': return { color: C.yellow, label: 'REVIEW', symbol: '!' };
    case 'failed': return { color: C.red, label: 'FAILED', symbol: '×' };
    case 'not_configured': return { color: C.purple, label: 'SETUP', symbol: '+' };
    case 'unavailable': return { color: C.muted, label: 'UNAVAILABLE', symbol: '—' };
  }
}

function SecurityModuleRow({ item, last }: { item: NomadSecurityModuleResult; last?: boolean }) {
  const navigation = useNavigation<any>();
  const status = statusPresentation(item.status);
  return (
    <Pressable
      onPress={() => navigation.navigate(item.route)}
      style={({ pressed }) => [styles.moduleRow, !last && styles.rowBorder, pressed && styles.pressed]}
    >
      <View style={[styles.moduleIcon, { borderColor: status.color, backgroundColor: `${status.color}12` }]}>
        <Text style={[styles.moduleIconText, { color: status.color }]}>{moduleIcons[item.id]}</Text>
      </View>
      <View style={styles.moduleCopy}>
        <Text style={styles.moduleTitle}>{item.title}</Text>
        <Text style={styles.moduleSubtitle}>{item.subtitle}</Text>
        <Text numberOfLines={2} style={styles.moduleDetail}>{item.detail}</Text>
      </View>
      <View style={styles.moduleStatusWrap}>
        <Text style={[styles.moduleStatus, { color: status.color }]}>{status.symbol} {status.label}</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

function BackupCard({ item }: { item: NomadSecurityBackupResult }) {
  const navigation = useNavigation<any>();
  const status = statusPresentation(item.status);
  return (
    <Pressable
      onPress={() => navigation.navigate(item.route)}
      style={({ pressed }) => [styles.backupCard, { borderColor: `${status.color}66` }, pressed && styles.pressed]}
    >
      <View style={[styles.backupIcon, { borderColor: status.color, backgroundColor: `${status.color}12` }]}>
        <Text style={[styles.backupIconText, { color: status.color }]}>{backupIcons[item.id]}</Text>
      </View>
      <Text style={styles.backupTitle}>{item.title}</Text>
      <Text style={styles.backupSubtitle}>{item.subtitle}</Text>
      <Text style={[styles.backupStatus, { color: status.color }]}>● {status.label}</Text>
      <Text numberOfLines={3} style={styles.backupDetail}>{item.detail}</Text>
    </Pressable>
  );
}

function activityPresentation(event: NomadSecurityEvent) {
  if (event.severity === 'critical') return { color: C.red, icon: '!' };
  if (event.severity === 'warning') return { color: C.yellow, icon: event.type === 'scan' ? '◇' : '!' };
  if (event.type === 'freeze') return { color: C.blue, icon: '❄' };
  if (event.type === 'authority') return { color: C.purple, icon: '♙' };
  if (event.type === 'recovery') return { color: C.blue, icon: '⟳' };
  return { color: C.green, icon: '✓' };
}

function formatTimestamp(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Unknown time';
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ActivityRow({ item, last }: { item: NomadSecurityEvent; last?: boolean }) {
  const display = activityPresentation(item);
  return (
    <View style={[styles.activityRow, !last && styles.rowBorder]}>
      <View style={[styles.activityIcon, { borderColor: display.color, backgroundColor: `${display.color}12` }]}>
        <Text style={[styles.activityIconText, { color: display.color }]}>{display.icon}</Text>
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityDetail}>{item.detail}</Text>
        <Text style={styles.activitySource}>{item.source.replace(/_/g, ' ')}</Text>
      </View>
      <Text style={styles.activityTime}>{formatTimestamp(item.timestamp)}</Text>
    </View>
  );
}

export default function SecurityCenterScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { security, loading, error, runScan, refresh } = useNomadSecurity();
  const [scanFeedback, setScanFeedback] = useState('');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const frozen = security.status === 'frozen';
  const warning = security.status === 'warning';
  const statusColor = frozen ? C.red : warning ? C.yellow : C.green;
  const statusLabel = frozen ? 'FROZEN' : warning ? 'REVIEW' : 'SECURE';
  const moduleSummary = useMemo(() => {
    const secure = security.modules.filter((module) => module.status === 'secure').length;
    const attention = security.modules.length - secure;
    return { secure, attention };
  }, [security.modules]);

  const handleScan = async () => {
    try {
      setScanFeedback('Running independent wallet, authority, device, recovery and network checks…');
      const next = await runScan();
      const scanId = next.latestScanId ? ` • ${next.latestScanId}` : '';
      setScanFeedback(`Scan complete: ${next.score}/100${scanId}`);
    } catch (nextError) {
      setScanFeedback(nextError instanceof Error ? nextError.message : 'Unable to complete the security scan.');
    }
  };

  return (
    <NomadPage maxWidth={940}>
      <PageHeader
        title="Security Center"
        subtitle="Your assets. Your keys. Your sovereignty."
        icon="◇"
        color={statusColor}
        help
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel tone={frozen ? 'red' : warning ? 'yellow' : 'green'} style={styles.hero}>
        <View style={[styles.heroLayout, compact && styles.heroLayoutCompact]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: statusColor }]}>SECURITY STATUS</Text>
            <View style={styles.statusRow}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.statusWord, { color: statusColor }]}>{statusLabel}</Text>
              <View style={[styles.statusPill, { borderColor: statusColor, backgroundColor: `${statusColor}12` }]}>
                <Text style={[styles.statusPillText, { color: statusColor }]}>{security.score}/100</Text>
              </View>
            </View>
            <Text style={styles.statusDescription}>
              {frozen
                ? 'Emergency protection is active. Restricted transaction paths must remain blocked.'
                : warning
                  ? `${moduleSummary.attention} security module${moduleSummary.attention === 1 ? '' : 's'} require review.`
                  : 'All connected security modules passed their latest checks.'}
            </Text>

            <View style={styles.heroMetrics}>
              <View style={styles.heroMetric}>
                <Text style={styles.metricLabel}>PROTECTED SINCE</Text>
                <Text style={styles.metricValue}>{security.protectedSince}</Text>
                <Text style={styles.metricNote}>{security.protectedDays}</Text>
              </View>
              <View style={styles.heroMetric}>
                <Text style={styles.metricLabel}>LAST SCAN</Text>
                <Text style={styles.metricValue}>{security.lastScanLabel}</Text>
                <Text style={styles.metricNote}>{security.lastScanDetail}</Text>
              </View>
              <View style={styles.heroMetric}>
                <Text style={styles.metricLabel}>MODULES</Text>
                <Text style={styles.metricValue}>{moduleSummary.secure}/{security.modules.length} secure</Text>
                <Text style={styles.metricNote}>{security.scanProvider.replace(/_/g, ' ')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroGraphicWrap}>
            <Image source={{ uri: securityShieldUri }} style={styles.heroGraphic} />
            <View style={styles.scoreProgress}><ProgressBar value={security.score} color={statusColor} height={8} /></View>
            <Text style={styles.previewLabel}>LOCAL SECURITY ADAPTER</Text>
          </View>
        </View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={[styles.sectionHeading, compact && styles.sectionHeadingCompact]}>
          <View style={styles.sectionHeadingCopy}>
            <Text style={styles.sectionTitle}>SECURITY MODULES</Text>
            <Text style={styles.sectionSubtitle}>Each protection layer is checked independently</Text>
          </View>
          <Pressable
            disabled={loading}
            onPress={() => void handleScan()}
            style={({ pressed }) => [styles.scanButton, loading && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.scanIcon}>◇</Text>
            <Text style={styles.scanButtonText}>{loading ? 'Checking…' : 'Run Security Scan'}</Text>
          </Pressable>
        </View>
        {scanFeedback ? <Text style={[styles.scanFeedback, scanFeedback.toLowerCase().includes('unable') && { color: C.red }]}>{scanFeedback}</Text> : null}

        <View style={styles.moduleList}>
          {security.modules.map((item, index) => (
            <View key={item.id}>
              <SecurityModuleRow item={item} last={index === security.modules.length - 1 && expandedModule !== item.id} />
              <Pressable onPress={() => setExpandedModule((current) => current === item.id ? null : item.id)} style={styles.moduleEvidenceToggle}>
                <Text style={styles.moduleEvidenceText}>{expandedModule === item.id ? 'Hide evidence' : 'View evidence'}  ›</Text>
              </Pressable>
              {expandedModule === item.id ? (
                <View style={styles.evidenceBox}>
                  <Text style={styles.evidenceTitle}>LATEST CHECK</Text>
                  <Text style={styles.evidenceDetail}>{item.detail}</Text>
                  <Text style={styles.evidenceTime}>{formatTimestamp(item.checkedAt)}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>RECOVERY & BACKUP</Text>
            <Text style={styles.sectionSubtitle}>Owner-controlled recovery readiness</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('RecoveryCenter')}><Text style={styles.link}>Manage  ›</Text></Pressable>
        </View>
        {security.backupMethods.length ? (
          <View style={styles.backupGrid}>
            {security.backupMethods.map((item) => <BackupCard key={item.id} item={item} />)}
          </View>
        ) : (
          <Text style={styles.emptyText}>Recovery information is unavailable until the security adapter completes its first check.</Text>
        )}
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>SECURITY ACTIVITY</Text>
            <Text style={styles.sectionSubtitle}>Recorded scans, freezes and authority events</Text>
          </View>
          <Text style={styles.activityCount}>{security.activity.length} events</Text>
        </View>
        {security.activity.length ? (
          <View style={styles.activityList}>
            {security.activity.slice(0, 8).map((item, index) => (
              <ActivityRow key={item.id} item={item} last={index === Math.min(8, security.activity.length) - 1} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyActivityIcon}>◇</Text>
            <View style={styles.emptyActivityCopy}>
              <Text style={styles.emptyActivityTitle}>No recorded security events</Text>
              <Text style={styles.emptyText}>Run Security Scan to create the first timestamped audit record.</Text>
            </View>
          </View>
        )}
      </Panel>

      <Pressable
        onPress={() => navigation.navigate('EmergencyFreeze')}
        style={({ pressed }) => [styles.freezeCard, frozen && styles.freezeCardActive, pressed && styles.pressed]}
      >
        <View style={[styles.freezeIcon, frozen && { borderColor: C.red }]}><Text style={[styles.freezeIconText, frozen && { color: C.red }]}>▣</Text></View>
        <View style={styles.freezeCopy}>
          <Text style={styles.freezeTitle}>{frozen ? 'Emergency Freeze Active' : 'Emergency Freeze'}</Text>
          <Text style={styles.freezeSubtitle}>{frozen ? 'Review active freeze scope and recovery requirements' : 'Immediately restrict wallet or Travel Pocket actions'}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Panel style={styles.arkriliumPanel}>
        <View style={styles.arkriliumBadge}><Text style={styles.arkriliumBadgeText}>A</Text></View>
        <View style={styles.arkriliumCopy}>
          <Text style={styles.arkriliumTitle}>Arkrilium Security Layer</Text>
          <Text style={styles.arkriliumSubtitle}>Owner authority, recovery policy, Reqrium safety and transaction controls remain non-custodial.</Text>
          <Text style={styles.arkriliumBoundary}>Remote telemetry and hardware attestation are not yet connected.</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('VoltaireProtocols')}><Text style={styles.chevron}>›</Text></Pressable>
      </Panel>

      <BottomNav
        active="Security"
        items={[
          ['⌂', 'Home', 'Portfolio'],
          ['▣', 'Wallets', 'Wallets'],
          ['✈', 'Travel', 'TravelMode'],
          ['◇', 'Security', 'SecurityCenter'],
          ['•••', 'More', 'Settings'],
        ]}
      />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.55 },
  errorBanner: { minHeight: 48, marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 11, backgroundColor: 'rgba(255,70,70,.08)', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: { flex: 1, minWidth: 0, color: C.red, fontSize: 11, lineHeight: 16 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { padding: 20, overflow: 'hidden' },
  heroLayout: { minHeight: 300, flexDirection: 'row', alignItems: 'center', gap: 18 },
  heroLayoutCompact: { flexDirection: 'column', alignItems: 'stretch' },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  statusWord: { color: '#fff', fontSize: 53, fontWeight: '900', letterSpacing: -2, maxWidth: '75%' },
  statusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  statusPillText: { fontSize: 12, fontWeight: '900' },
  statusDescription: { color: '#ecf4ff', fontSize: 13, lineHeight: 20, marginTop: 5, maxWidth: 490 },
  heroMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
  heroMetric: { flexGrow: 1, flexBasis: 130, minHeight: 86, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, backgroundColor: 'rgba(2,13,22,.62)', padding: 11 },
  metricLabel: { color: C.muted, fontSize: 8, fontWeight: '900', letterSpacing: .6 },
  metricValue: { color: '#fff', fontSize: 13, fontWeight: '900', marginTop: 8 },
  metricNote: { color: C.muted, fontSize: 9, lineHeight: 13, marginTop: 5 },
  heroGraphicWrap: { width: 260, alignItems: 'center', justifyContent: 'center' },
  heroGraphic: { width: 230, height: 265 },
  scoreProgress: { width: 180, marginTop: -18 },
  previewLabel: { color: C.muted, fontSize: 8, fontWeight: '900', letterSpacing: .8, marginTop: 10 },
  sectionPanel: { marginTop: 17, padding: 15 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionHeadingCompact: { alignItems: 'flex-start', flexWrap: 'wrap' },
  sectionHeadingCopy: { flex: 1, minWidth: 180 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: .4 },
  sectionSubtitle: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  link: { color: C.blue, fontSize: 11, fontWeight: '900' },
  scanButton: { minHeight: 43, borderWidth: 1, borderColor: C.blue, borderRadius: 10, backgroundColor: 'rgba(22,140,255,.08)', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  scanIcon: { color: C.blue, fontSize: 18 },
  scanButtonText: { color: C.blue, fontSize: 10, fontWeight: '900' },
  scanFeedback: { color: C.green, fontSize: 10, lineHeight: 15, marginTop: 10 },
  moduleList: { marginTop: 13, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 12, overflow: 'hidden' },
  moduleRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  moduleIcon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  moduleIconText: { fontSize: 24, fontWeight: '900' },
  moduleCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  moduleTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  moduleSubtitle: { color: '#c8d3e2', fontSize: 10, marginTop: 3 },
  moduleDetail: { color: C.muted, fontSize: 9, lineHeight: 13, marginTop: 5 },
  moduleStatusWrap: { alignItems: 'flex-end', marginLeft: 8 },
  moduleStatus: { fontSize: 8, fontWeight: '900' },
  chevron: { color: '#b7c4d6', fontSize: 28, marginTop: 3 },
  moduleEvidenceToggle: { minHeight: 30, borderTopWidth: 1, borderTopColor: C.borderSoft, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 12 },
  moduleEvidenceText: { color: C.blue, fontSize: 9, fontWeight: '800' },
  evidenceBox: { borderTopWidth: 1, borderTopColor: C.borderSoft, backgroundColor: 'rgba(2,15,26,.72)', padding: 12 },
  evidenceTitle: { color: C.blue, fontSize: 8, fontWeight: '900', letterSpacing: .6 },
  evidenceDetail: { color: '#d7e1ed', fontSize: 10, lineHeight: 16, marginTop: 6 },
  evidenceTime: { color: C.muted, fontSize: 8, marginTop: 7 },
  backupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  backupCard: { flexGrow: 1, flexBasis: 180, minHeight: 174, borderWidth: 1, borderRadius: 12, alignItems: 'center', padding: 14 },
  backupIcon: { width: 50, height: 50, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backupIconText: { fontSize: 25 },
  backupTitle: { color: '#fff', fontSize: 12, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  backupSubtitle: { color: C.muted, fontSize: 9, textAlign: 'center', marginTop: 4 },
  backupStatus: { fontSize: 9, fontWeight: '900', marginTop: 10 },
  backupDetail: { color: '#c8d3df', fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 7 },
  activityCount: { color: C.muted, fontSize: 9 },
  activityList: { marginTop: 13, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 12, overflow: 'hidden' },
  activityRow: { minHeight: 84, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11 },
  activityIcon: { width: 43, height: 43, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  activityIconText: { fontSize: 20, fontWeight: '900' },
  activityCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  activityTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  activityDetail: { color: C.muted, fontSize: 9, lineHeight: 13, marginTop: 4 },
  activitySource: { color: C.blue, fontSize: 8, marginTop: 5, textTransform: 'uppercase' },
  activityTime: { color: C.muted, fontSize: 8, lineHeight: 12, maxWidth: 82, textAlign: 'right', marginLeft: 8 },
  emptyText: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 12 },
  emptyActivity: { minHeight: 82, marginTop: 13, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center' },
  emptyActivityIcon: { color: C.blue, fontSize: 30 },
  emptyActivityCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  emptyActivityTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  freezeCard: { minHeight: 82, marginTop: 17, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.panel, padding: 14, flexDirection: 'row', alignItems: 'center' },
  freezeCardActive: { borderColor: C.red, backgroundColor: 'rgba(255,70,70,.07)' },
  freezeIcon: { width: 50, height: 50, borderRadius: 14, borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(22,140,255,.08)', alignItems: 'center', justifyContent: 'center' },
  freezeIconText: { color: C.blue, fontSize: 25 },
  freezeCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  freezeTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  freezeSubtitle: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  arkriliumPanel: { marginTop: 17, padding: 15, flexDirection: 'row', alignItems: 'center' },
  arkriliumBadge: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, borderColor: C.blue, backgroundColor: 'rgba(22,140,255,.1)', alignItems: 'center', justifyContent: 'center' },
  arkriliumBadgeText: { color: C.blue, fontSize: 25, fontWeight: '900' },
  arkriliumCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  arkriliumTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  arkriliumSubtitle: { color: '#c7d2df', fontSize: 10, lineHeight: 15, marginTop: 4 },
  arkriliumBoundary: { color: C.yellow, fontSize: 8, lineHeight: 12, marginTop: 6 },
});
