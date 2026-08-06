import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
    <linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2cff88"/><stop offset=".55" stop-color="#0dc66b"/><stop offset="1" stop-color="#0872ac"/></linearGradient>
    <radialGradient id="r"><stop stop-color="#20ef70" stop-opacity=".45"/><stop offset="1" stop-color="#20ef70" stop-opacity="0"/></radialGradient>
    <filter id="g"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <circle cx="130" cy="142" r="118" fill="url(#r)"/>
  <circle cx="130" cy="142" r="104" fill="none" stroke="#20ef70" stroke-opacity=".18" stroke-width="2"/>
  <circle cx="130" cy="142" r="84" fill="none" stroke="#20ef70" stroke-opacity=".25" stroke-width="2"/>
  <path d="M130 18 228 62v74c0 73-39 121-98 153-59-32-98-80-98-153V62Z" fill="#021a16" stroke="url(#s)" stroke-width="8" filter="url(#g)"/>
  <path d="M130 48 198 79v56c0 53-27 89-68 116-41-27-68-63-68-116V79Z" fill="#03110f" stroke="#20ef70" stroke-opacity=".48" stroke-width="3"/>
  <path d="m88 145 28 28 58-72" fill="none" stroke="#20ef70" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" filter="url(#g)"/>
  <circle cx="130" cy="143" r="8" fill="#20ef70"/>
  <path d="M30 247h200M47 266h166" stroke="#20ef70" stroke-opacity=".22" stroke-width="2"/>
  <circle cx="48" cy="266" r="4" fill="#20ef70"/><circle cx="212" cy="266" r="4" fill="#20ef70"/>`,
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

function statusInfo(status: NomadSecurityModuleStatus) {
  switch (status) {
    case 'secure': return { color: C.green, label: 'SECURE', symbol: '✓' };
    case 'warning': return { color: C.yellow, label: 'REVIEW', symbol: '!' };
    case 'failed': return { color: C.red, label: 'FAILED', symbol: '×' };
    case 'not_configured': return { color: C.purple, label: 'SETUP', symbol: '+' };
    case 'unavailable': return { color: C.muted, label: 'UNAVAILABLE', symbol: '—' };
  }
}

function ModuleRow({ item, last }: { item: NomadSecurityModuleResult; last?: boolean }) {
  const navigation = useNavigation<any>();
  const status = statusInfo(item.status);
  return (
    <Pressable
      onPress={() => navigation.navigate(item.route)}
      style={({ pressed }) => [styles.moduleRow, !last && styles.rowBorder, pressed && styles.pressed]}
    >
      <View style={[styles.squareIcon, { borderColor: status.color, backgroundColor: `${status.color}12` }]}>
        <Text style={[styles.squareIconText, { color: status.color }]}>{moduleIcons[item.id]}</Text>
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
        <Text numberOfLines={2} style={styles.rowDetail}>{item.detail}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.statusText, { color: status.color }]}>{status.symbol} {status.label}</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

function BackupCard({ item }: { item: NomadSecurityBackupResult }) {
  const navigation = useNavigation<any>();
  const status = statusInfo(item.status);
  return (
    <Pressable
      onPress={() => navigation.navigate(item.route)}
      style={({ pressed }) => [styles.backupCard, { borderColor: `${status.color}70` }, pressed && styles.pressed]}
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

function formatTime(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Unknown time';
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function EventRow({ item, last }: { item: NomadSecurityEvent; last?: boolean }) {
  const color = item.severity === 'critical' ? C.red : item.severity === 'warning' ? C.yellow : C.green;
  const icon = item.type === 'freeze' ? '❄' : item.type === 'authority' ? '♙' : item.type === 'recovery' ? '⟳' : '◇';
  return (
    <View style={[styles.eventRow, !last && styles.rowBorder]}>
      <View style={[styles.eventIcon, { borderColor: color, backgroundColor: `${color}12` }]}>
        <Text style={[styles.eventIconText, { color }]}>{icon}</Text>
      </View>
      <View style={styles.eventCopy}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDetail}>{item.detail}</Text>
        <Text style={styles.eventSource}>{item.source.replace(/_/g, ' ')}</Text>
      </View>
      <Text style={styles.eventTime}>{formatTime(item.timestamp)}</Text>
    </View>
  );
}

export default function SecurityCenterScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { security, loading, error, refresh, runScan } = useNomadSecurity();
  const [scanFeedback, setScanFeedback] = useState('');
  const [evidenceId, setEvidenceId] = useState<string | null>(null);

  const frozen = security.status === 'frozen';
  const warning = security.status === 'warning';
  const statusColor = frozen ? C.red : warning ? C.yellow : C.green;
  const statusLabel = frozen ? 'FROZEN' : warning ? 'REVIEW' : 'SECURE';
  const summary = useMemo(() => {
    const secure = security.modules.filter((item) => item.status === 'secure').length;
    return { secure, attention: security.modules.length - secure };
  }, [security.modules]);

  const handleScan = async () => {
    try {
      setScanFeedback('Running independent wallet, authority, device, recovery and network checks…');
      const next = await runScan();
      setScanFeedback(`Scan complete: ${next.score}/100${next.latestScanId ? ` • ${next.latestScanId}` : ''}`);
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
              <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.statusWord, { color: statusColor }]}>{statusLabel}</Text>
              <Text style={[styles.scorePill, { color: statusColor, borderColor: statusColor }]}>{security.score}/100</Text>
            </View>
            <Text style={styles.heroDescription}>
              {frozen
                ? 'Emergency protection is active. Restricted actions must remain blocked.'
                : warning
                  ? `${summary.attention} security module${summary.attention === 1 ? '' : 's'} require review.`
                  : 'All connected security modules passed their latest checks.'}
            </Text>
            <View style={styles.metricGrid}>
              <View style={styles.metricCard}><Text style={styles.metricLabel}>PROTECTED SINCE</Text><Text style={styles.metricValue}>{security.protectedSince}</Text><Text style={styles.metricNote}>{security.protectedDays}</Text></View>
              <View style={styles.metricCard}><Text style={styles.metricLabel}>LAST SCAN</Text><Text style={styles.metricValue}>{security.lastScanLabel}</Text><Text style={styles.metricNote}>{security.lastScanDetail}</Text></View>
              <View style={styles.metricCard}><Text style={styles.metricLabel}>MODULES</Text><Text style={styles.metricValue}>{summary.secure}/{security.modules.length} secure</Text><Text style={styles.metricNote}>{security.scanProvider.replace(/_/g, ' ')}</Text></View>
            </View>
          </View>
          <View style={styles.heroArtWrap}>
            <Image source={{ uri: securityShieldUri }} style={styles.heroArt} />
            <ProgressBar value={security.score} color={statusColor} height={8} />
            <Text style={styles.adapterLabel}>LOCAL SECURITY ADAPTER</Text>
          </View>
        </View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={[styles.sectionHeader, compact && styles.sectionHeaderCompact]}>
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionTitle}>SECURITY MODULES</Text>
            <Text style={styles.sectionSubtitle}>Each protection layer is checked independently</Text>
          </View>
          <Pressable disabled={loading} onPress={() => void handleScan()} style={({ pressed }) => [styles.scanButton, loading && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.scanButtonText}>{loading ? 'Checking…' : '◇  Run Security Scan'}</Text>
          </Pressable>
        </View>
        {scanFeedback ? <Text style={styles.scanFeedback}>{scanFeedback}</Text> : null}
        <View style={styles.moduleList}>
          {security.modules.map((item, index) => (
            <View key={item.id}>
              <ModuleRow item={item} last={index === security.modules.length - 1 && evidenceId !== item.id} />
              <Pressable onPress={() => setEvidenceId((current) => current === item.id ? null : item.id)} style={styles.evidenceToggle}>
                <Text style={styles.evidenceToggleText}>{evidenceId === item.id ? 'Hide evidence' : 'View evidence'}  ›</Text>
              </Pressable>
              {evidenceId === item.id ? (
                <View style={styles.evidenceBox}>
                  <Text style={styles.evidenceLabel}>LATEST CHECK</Text>
                  <Text style={styles.evidenceText}>{item.detail}</Text>
                  <Text style={styles.evidenceTime}>{formatTime(item.checkedAt)}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>RECOVERY & BACKUP</Text><Text style={styles.sectionSubtitle}>Owner-controlled recovery readiness</Text></View>
          <Pressable onPress={() => navigation.navigate('RecoveryCenter')}><Text style={styles.link}>Manage  ›</Text></Pressable>
        </View>
        {security.backupMethods.length ? (
          <View style={styles.backupGrid}>{security.backupMethods.map((item) => <BackupCard key={item.id} item={item} />)}</View>
        ) : <Text style={styles.emptyText}>Recovery information is unavailable until the adapter completes its first check.</Text>}
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>SECURITY ACTIVITY</Text><Text style={styles.sectionSubtitle}>Recorded scans, freezes and authority events</Text></View>
          <Text style={styles.eventCount}>{security.activity.length} events</Text>
        </View>
        {security.activity.length ? (
          <View style={styles.eventList}>
            {security.activity.slice(0, 8).map((item, index) => <EventRow key={item.id} item={item} last={index === Math.min(8, security.activity.length) - 1} />)}
          </View>
        ) : (
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyActivityIcon}>◇</Text>
            <View style={styles.emptyActivityCopy}><Text style={styles.emptyActivityTitle}>No recorded security events</Text><Text style={styles.emptyText}>Run Security Scan to create the first timestamped audit record.</Text></View>
          </View>
        )}
      </Panel>

      <Pressable onPress={() => navigation.navigate('EmergencyFreeze')} style={({ pressed }) => [styles.freezeCard, frozen && styles.freezeActive, pressed && styles.pressed]}>
        <View style={[styles.freezeIcon, frozen && { borderColor: C.red }]}><Text style={[styles.freezeIconText, frozen && { color: C.red }]}>▣</Text></View>
        <View style={styles.freezeCopy}><Text style={styles.freezeTitle}>{frozen ? 'Emergency Freeze Active' : 'Emergency Freeze'}</Text><Text style={styles.freezeSubtitle}>{frozen ? 'Review active scope and recovery requirements' : 'Restrict wallet or Travel Pocket actions immediately'}</Text></View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Panel style={styles.arkriliumPanel}>
        <View style={styles.arkriliumBadge}><Text style={styles.arkriliumBadgeText}>A</Text></View>
        <View style={styles.arkriliumCopy}>
          <Text style={styles.arkriliumTitle}>Arkrilium Security Layer</Text>
          <Text style={styles.arkriliumSubtitle}>Owner Authority, recovery policy, Reqrium safety and transaction controls remain non-custodial.</Text>
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
  pressed: { opacity: .72 },
  disabled: { opacity: .55 },
  errorBanner: { minHeight: 48, marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 11, backgroundColor: 'rgba(255,70,70,.08)', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: { flex: 1, color: C.red, fontSize: 11 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { padding: 20, overflow: 'hidden' },
  heroLayout: { minHeight: 300, flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroLayoutCompact: { flexDirection: 'column', alignItems: 'stretch' },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 5 },
  statusWord: { fontSize: 52, fontWeight: '900', letterSpacing: -2, maxWidth: '74%' },
  scorePill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, fontSize: 12, fontWeight: '900' },
  heroDescription: { color: '#edf5ff', fontSize: 13, lineHeight: 20, marginTop: 5 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 23 },
  metricCard: { flexGrow: 1, flexBasis: 130, minHeight: 86, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, backgroundColor: 'rgba(2,13,22,.62)', padding: 11 },
  metricLabel: { color: C.muted, fontSize: 8, fontWeight: '900', letterSpacing: .6 },
  metricValue: { color: '#fff', fontSize: 13, fontWeight: '900', marginTop: 8 },
  metricNote: { color: C.muted, fontSize: 9, lineHeight: 13, marginTop: 5 },
  heroArtWrap: { width: 250, alignItems: 'center' },
  heroArt: { width: 228, height: 263 },
  adapterLabel: { color: C.muted, fontSize: 8, fontWeight: '900', letterSpacing: .8, marginTop: 9 },
  sectionPanel: { marginTop: 17, padding: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionHeaderCompact: { alignItems: 'flex-start', flexWrap: 'wrap' },
  sectionHeaderCopy: { flex: 1, minWidth: 180 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: .4 },
  sectionSubtitle: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  link: { color: C.blue, fontSize: 11, fontWeight: '900' },
  scanButton: { minHeight: 43, borderWidth: 1, borderColor: C.blue, borderRadius: 10, backgroundColor: 'rgba(22,140,255,.08)', paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  scanButtonText: { color: C.blue, fontSize: 10, fontWeight: '900' },
  scanFeedback: { color: C.green, fontSize: 10, lineHeight: 15, marginTop: 10 },
  moduleList: { marginTop: 13, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 12, overflow: 'hidden' },
  moduleRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  squareIcon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  squareIconText: { fontSize: 24, fontWeight: '900' },
  rowCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  rowTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  rowSubtitle: { color: '#c8d3e2', fontSize: 10, marginTop: 3 },
  rowDetail: { color: C.muted, fontSize: 9, lineHeight: 13, marginTop: 5 },
  rowRight: { alignItems: 'flex-end', marginLeft: 8 },
  statusText: { fontSize: 8, fontWeight: '900' },
  chevron: { color: '#b7c4d6', fontSize: 28, marginLeft: 6 },
  evidenceToggle: { minHeight: 30, borderTopWidth: 1, borderTopColor: C.borderSoft, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 12 },
  evidenceToggleText: { color: C.blue, fontSize: 9, fontWeight: '800' },
  evidenceBox: { borderTopWidth: 1, borderTopColor: C.borderSoft, backgroundColor: 'rgba(2,15,26,.72)', padding: 12 },
  evidenceLabel: { color: C.blue, fontSize: 8, fontWeight: '900', letterSpacing: .6 },
  evidenceText: { color: '#d7e1ed', fontSize: 10, lineHeight: 16, marginTop: 6 },
  evidenceTime: { color: C.muted, fontSize: 8, marginTop: 7 },
  backupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  backupCard: { flexGrow: 1, flexBasis: 180, minHeight: 174, borderWidth: 1, borderRadius: 12, alignItems: 'center', padding: 14 },
  backupIcon: { width: 50, height: 50, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backupIconText: { fontSize: 25 },
  backupTitle: { color: '#fff', fontSize: 12, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  backupSubtitle: { color: C.muted, fontSize: 9, textAlign: 'center', marginTop: 4 },
  backupStatus: { fontSize: 9, fontWeight: '900', marginTop: 10 },
  backupDetail: { color: '#c8d3df', fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 7 },
  eventCount: { color: C.muted, fontSize: 9 },
  eventList: { marginTop: 13, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 12, overflow: 'hidden' },
  eventRow: { minHeight: 84, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11 },
  eventIcon: { width: 43, height: 43, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eventIconText: { fontSize: 20, fontWeight: '900' },
  eventCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  eventTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  eventDetail: { color: C.muted, fontSize: 9, lineHeight: 13, marginTop: 4 },
  eventSource: { color: C.blue, fontSize: 8, marginTop: 5, textTransform: 'uppercase' },
  eventTime: { color: C.muted, fontSize: 8, lineHeight: 12, maxWidth: 82, textAlign: 'right', marginLeft: 8 },
  emptyText: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 7 },
  emptyActivity: { minHeight: 82, marginTop: 13, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center' },
  emptyActivityIcon: { color: C.blue, fontSize: 30 },
  emptyActivityCopy: { flex: 1, marginLeft: 12 },
  emptyActivityTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  freezeCard: { minHeight: 82, marginTop: 17, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.panel, padding: 14, flexDirection: 'row', alignItems: 'center' },
  freezeActive: { borderColor: C.red, backgroundColor: 'rgba(255,70,70,.07)' },
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
