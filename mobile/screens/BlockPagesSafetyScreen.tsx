import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadBlockPagesSafety } from '../nomad';
import type {
  ReqriumExposureItem,
  ReqriumReportDraft,
  ReqriumSafetyEvent,
  ReqriumSafetyModule,
  ReqriumSafetyModuleStatus,
} from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  ProgressBar,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

type ReportCategory = ReqriumReportDraft['category'];

const reportCategories: Array<{ value: ReportCategory; label: string }> = [
  { value: 'phishing', label: 'Phishing' },
  { value: 'scam_address', label: 'Scam Address' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'malware', label: 'Malware' },
  { value: 'other', label: 'Other' },
];

const moduleIcons: Record<ReqriumSafetyModule['id'], string> = {
  phishing_url: '⌁',
  wallet_address: '⌕',
  identity_monitoring: '♙',
  breach_monitoring: '◎',
  malware_runtime: '☀',
  social_engineering: '◭',
};

const moduleColors: Record<ReqriumSafetyModule['id'], string> = {
  phishing_url: C.blue,
  wallet_address: C.blue,
  identity_monitoring: C.purple,
  breach_monitoring: C.green,
  malware_runtime: C.orange,
  social_engineering: C.blue,
};

function statusInfo(status: ReqriumSafetyModuleStatus) {
  switch (status) {
    case 'available': return { color: C.green, label: 'AVAILABLE', mark: '✓' };
    case 'limited': return { color: C.yellow, label: 'LIMITED', mark: '!' };
    case 'not_configured': return { color: C.purple, label: 'SETUP', mark: '+' };
    case 'unavailable': return { color: C.muted, label: 'UNAVAILABLE', mark: '—' };
  }
}

function exposureInfo(status: ReqriumExposureItem['status']) {
  if (status === 'clear') return { color: C.green, label: 'CLEAR', mark: '✓' };
  if (status === 'review') return { color: C.yellow, label: 'REVIEW', mark: '!' };
  return { color: C.muted, label: 'UNAVAILABLE', mark: '—' };
}

function formatDate(value?: string) {
  if (!value) return 'Not checked';
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Time unavailable';
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ModuleCard({
  item,
  expanded,
  onToggle,
}: {
  item: ReqriumSafetyModule;
  expanded: boolean;
  onToggle(): void;
}) {
  const navigation = useNavigation<any>();
  const status = statusInfo(item.status);
  const color = moduleColors[item.id];

  return (
    <View style={[styles.moduleCard, { borderColor: `${status.color}65` }]}>
      <Pressable onPress={onToggle} style={({ pressed }) => [styles.moduleMain, pressed && styles.pressed]}>
        <RoundIcon symbol={moduleIcons[item.id]} color={color} size={48} filled />
        <Text style={styles.moduleTitle}>{item.title}</Text>
        <Text style={[styles.moduleStatus, { color: status.color }]}>{status.mark} {status.label}</Text>
        <Text style={styles.moduleSub}>{item.subtitle}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.moduleEvidence}>
          <Text style={styles.moduleDetail}>{item.detail}</Text>
          <Text style={styles.providerLabel}>PROVIDER</Text>
          <Text style={styles.providerValue}>{item.provider}</Text>
          <Pressable
            onPress={() => navigation.navigate(item.route)}
            style={({ pressed }) => [styles.moduleButton, { borderColor: status.color }, pressed && styles.pressed]}
          >
            <Text style={[styles.moduleButtonText, { color: status.color }]}>Open Module  ›</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ExposureRow({
  item,
  expanded,
  last,
  onToggle,
}: {
  item: ReqriumExposureItem;
  expanded: boolean;
  last?: boolean;
  onToggle(): void;
}) {
  const navigation = useNavigation<any>();
  const status = exposureInfo(item.status);
  const icons: Record<ReqriumExposureItem['id'], string> = {
    email: '✉',
    password: '♧',
    phone: '▯',
    address: '◇',
    url: '⌁',
  };

  return (
    <View style={[styles.exposureRow, !last && styles.rowBorder]}>
      <Pressable onPress={onToggle} style={({ pressed }) => [styles.exposureMain, pressed && styles.pressed]}>
        <Text style={[styles.exposureIcon, { color: status.color }]}>{icons[item.id]}</Text>
        <View style={styles.exposureCopy}>
          <Text style={styles.exposureLabel}>{item.label}</Text>
          <Text style={styles.exposureCount}>{item.count} recorded finding{item.count === 1 ? '' : 's'}</Text>
        </View>
        <Text style={[styles.exposureStatus, { color: status.color }]}>{status.mark} {status.label}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.exposureDetailWrap}>
          <Text style={styles.exposureDetail}>{item.detail}</Text>
          {item.route ? (
            <Pressable onPress={() => navigation.navigate(item.route)}>
              <Text style={[styles.link, { color: status.color }]}>Open related scanner  ›</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ActivityRow({ item, last }: { item: ReqriumSafetyEvent; last?: boolean }) {
  const color = item.severity === 'critical' ? C.red : item.severity === 'warning' ? C.yellow : C.blue;
  const icon = item.type === 'scan' ? '⌕' : item.type === 'report' ? '⚑' : item.type === 'security' ? '◇' : 'R';
  return (
    <View style={[styles.activityRow, !last && styles.rowBorder]}>
      <RoundIcon symbol={icon} color={color} size={43} filled />
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activitySub}>{item.detail}</Text>
      </View>
      <Text style={[styles.activityTime, { color }]}>{formatDate(item.timestamp)}</Text>
    </View>
  );
}

export default function BlockPagesSafetyScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const safety = useNomadBlockPagesSafety();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedExposure, setExpandedExposure] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportCategory, setReportCategory] = useState<ReportCategory>('phishing');
  const [reportTarget, setReportTarget] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  const statusColor = safety.status === 'frozen'
    ? C.red
    : safety.status === 'attention_required'
      ? C.yellow
      : safety.status === 'limited'
        ? C.blue
        : C.purple;
  const heroTitle = safety.status === 'frozen'
    ? 'SAFETY RESTRICTED'
    : safety.status === 'attention_required'
      ? 'REVIEW FINDINGS'
      : safety.status === 'limited'
        ? 'LOCAL PROTECTION'
        : 'SETUP REQUIRED';
  const visibleActivity = useMemo(
    () => safety.activity.slice(0, showAllActivity ? 12 : 4),
    [safety.activity, showAllActivity],
  );

  const runFullCheck = async () => {
    try {
      setChecking(true);
      setFeedback('Checking Reqrium modules and registered providers…');
      const next = await safety.runScan();
      if (next) {
        setFeedback(`Reqrium check complete: ${next.readinessScore}/100 local readiness. Remote threat intelligence remains unavailable.`);
      }
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to complete the Reqrium check.');
    } finally {
      setChecking(false);
    }
  };

  const saveReport = async () => {
    try {
      setSavingReport(true);
      setFeedback('Saving scam report as a local draft…');
      const report = await safety.createReportDraft(reportCategory, reportTarget, reportNotes);
      setReportTarget('');
      setReportNotes('');
      setShowReport(false);
      setFeedback(`Report ${report.id} saved locally. It has not been submitted to a remote authority.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to save the report draft.');
    } finally {
      setSavingReport(false);
    }
  };

  return (
    <NomadPage maxWidth={980}>
      <PageHeader
        title="Reqrium Safety"
        subtitle="Verify before you connect, send or sign."
        icon="R"
        color={statusColor}
        right={<Text style={[styles.hubBadge, { color: statusColor, borderColor: statusColor }]}>SAFETY HUB</Text>}
      />

      {safety.error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{safety.error}</Text>
          <Pressable onPress={() => void safety.refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel tone={safety.status === 'frozen' ? 'red' : 'yellow'} style={styles.hero}>
        <View style={[styles.heroBody, compact && styles.heroCompact]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: statusColor }]}>REQRIUM SAFETY READINESS</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.heroTitle, { color: statusColor }]}>{heroTitle}</Text>
            <View style={styles.scoreLine}>
              <Text style={styles.readinessScore}>{safety.readinessScore}</Text>
              <Text style={styles.scoreOut}>/100</Text>
              <Text style={[styles.protectionLabel, { color: statusColor }]}>{safety.protectionLabel}</Text>
            </View>
            <Text style={styles.heroText}>
              This score reflects local Reqrium heuristics and connected Nomad controls. It is not a guarantee that a URL, wallet or identity is safe.
            </Text>
            <Text style={styles.lastScan}>Last recorded check: {safety.lastScanLabel}</Text>
          </View>
          <View style={styles.logoGraphic}>
            <View style={[styles.logoOrbit, { borderColor: `${statusColor}55` }]}>
              <RoundIcon symbol="R" color={statusColor} size={112} filled />
              <Text style={[styles.orbitIcon, styles.orbitTop, { color: C.blue, borderColor: C.blue }]}>⌁</Text>
              <Text style={[styles.orbitIcon, styles.orbitRight, { color: C.purple, borderColor: C.purple }]}>♙</Text>
              <Text style={[styles.orbitIcon, styles.orbitBottom, { color: C.green, borderColor: C.green }]}>⌕</Text>
              <Text style={[styles.orbitIcon, styles.orbitLeft, { color: C.yellow, borderColor: C.yellow }]}>!</Text>
            </View>
          </View>
        </View>

        <View style={styles.heroStats}>
          {[
            ['⚑', 'Local Flags', String(safety.localFlags), safety.localFlags ? 'Review required' : 'No recorded flags', safety.localFlags ? C.yellow : C.green],
            ['⌕', 'Scans Recorded', String(safety.scansRecorded), 'Local history', C.blue],
            ['▣', 'Open Findings', String(safety.openFindings), safety.openFindings ? 'Needs review' : 'None recorded', safety.openFindings ? C.yellow : C.green],
            ['◎', 'Remote Intel', 'OFFLINE', 'Provider not connected', C.muted],
          ].map(([icon, label, value, note, color]) => (
            <View key={label} style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>{icon} {label}</Text>
              <Text style={styles.heroStatValue}>{value}</Text>
              <Text style={[styles.heroStatNote, { color }]}>{note}</Text>
            </View>
          ))}
        </View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={[styles.sectionHeading, compact && styles.sectionHeadingCompact]}>
          <View>
            <Text style={styles.sectionTitle}>THREAT PROTECTION</Text>
            <Text style={styles.sectionSub}>Tap a module to inspect its provider and limitations</Text>
          </View>
          <Pressable
            disabled={checking || safety.loading}
            onPress={() => void runFullCheck()}
            style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
          >
            <Text style={styles.scanButtonText}>{checking ? 'Checking…' : 'Run Full Check'}</Text>
          </Pressable>
        </View>
        <View style={styles.moduleGrid}>
          {safety.modules.map((item) => (
            <ModuleCard
              key={item.id}
              item={item}
              expanded={expandedModule === item.id}
              onToggle={() => setExpandedModule((current) => current === item.id ? null : item.id)}
            />
          ))}
        </View>
        {feedback ? <Text style={[styles.feedback, feedback.toLowerCase().includes('unable') && { color: C.red }]}>{feedback}</Text> : null}
      </Panel>

      <View style={[styles.twoColumn, compact && styles.twoColumnCompact]}>
        <Panel style={styles.privacyPanel}>
          <Text style={styles.sectionTitle}>PRIVACY READINESS</Text>
          <View style={[styles.privacyBody, compact && styles.privacyBodyCompact]}>
            <View style={[styles.scoreRing, { borderColor: statusColor }]}>
              <Text style={styles.scoreValue}>{safety.privacyScore}</Text>
              <Text style={styles.scoreRingOut}>/100</Text>
            </View>
            <View style={styles.privacyCopy}>
              <Text style={[styles.privacyStatus, { color: statusColor }]}>{safety.protectionLabel}</Text>
              <Text style={styles.privacyText}>The score includes local module availability and Nomad security evidence. Email, breach and malware providers are unavailable.</Text>
              <ProgressBar value={safety.privacyScore} color={statusColor} height={7} />
            </View>
          </View>
        </Panel>

        <Panel style={styles.exposurePanel}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>EXPOSURE SUMMARY</Text>
              <Text style={styles.sectionSub}>Unavailable sources are never treated as clear</Text>
            </View>
          </View>
          <View style={styles.exposureList}>
            {safety.exposures.map((item, index) => (
              <ExposureRow
                key={item.id}
                item={item}
                expanded={expandedExposure === item.id}
                last={index === safety.exposures.length - 1}
                onToggle={() => setExpandedExposure((current) => current === item.id ? null : item.id)}
              />
            ))}
          </View>
        </Panel>
      </View>

      <Panel style={styles.activityPanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
            <Text style={styles.sectionSub}>Recorded Reqrium checks and local report drafts</Text>
          </View>
          {safety.activity.length > 4 ? (
            <Pressable onPress={() => setShowAllActivity((current) => !current)}>
              <Text style={styles.link}>{showAllActivity ? 'Show Less' : 'View Log'}  ›</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.activityList}>
          {visibleActivity.length ? visibleActivity.map((item, index) => (
            <ActivityRow key={item.id} item={item} last={index === visibleActivity.length - 1} />
          )) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Reqrium activity yet</Text>
              <Text style={styles.emptyText}>Run a full check, scan a URL or scan a wallet address to create an audit record.</Text>
            </View>
          )}
        </View>
      </Panel>

      <Panel style={styles.toolsPanel}>
        <Text style={styles.sectionTitle}>SAFETY TOOLS</Text>
        <View style={styles.toolGrid}>
          {[
            ['◎', 'URL Scanner', 'Check a link before opening it', 'BlockPagesURLScanner', C.blue],
            ['⌕', 'Address Scanner', 'Validate a wallet value before sending', 'AddressSafetyDetail', C.blue],
            ['▣', 'Security Center', 'Review wallet and device controls', 'SecurityCenter', C.green],
            ['A', 'Arkrilium Protocols', 'Inspect connected service evidence', 'VoltaireProtocols', C.purple],
          ].map(([icon, title, subtitle, route, color]) => (
            <Pressable key={title} onPress={() => navigation.navigate(route)} style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}>
              <RoundIcon symbol={icon} color={color} size={47} filled />
              <Text style={styles.toolTitle}>{title}</Text>
              <Text style={styles.toolSub}>{subtitle}</Text>
              <Text style={styles.toolArrow}>›</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setShowReport((current) => !current)} style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}>
            <RoundIcon symbol="⚑" color={C.red} size={47} filled />
            <Text style={styles.toolTitle}>Report a Scam</Text>
            <Text style={styles.toolSub}>Save suspicious activity as a local draft</Text>
            <Text style={styles.toolArrow}>{showReport ? '−' : '+'}</Text>
          </Pressable>
        </View>

        {showReport ? (
          <View style={styles.reportPanel}>
            <View style={styles.reportHeading}>
              <View>
                <Text style={styles.reportTitle}>SCAM REPORT DRAFT</Text>
                <Text style={styles.reportSub}>Local storage only • no remote submission provider</Text>
              </View>
              <Text style={styles.reportCount}>{safety.reportDrafts} saved</Text>
            </View>
            <View style={styles.categoryRow}>
              {reportCategories.map((item) => {
                const active = reportCategory === item.value;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setReportCategory(item.value)}
                    style={[styles.categoryButton, active && styles.categoryButtonActive]}
                  >
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={reportTarget}
              onChangeText={setReportTarget}
              autoCapitalize="none"
              placeholder="Suspicious URL, wallet address, account or contact"
              placeholderTextColor={C.muted}
              style={styles.reportInput}
            />
            <TextInput
              value={reportNotes}
              onChangeText={setReportNotes}
              multiline
              numberOfLines={4}
              placeholder="Describe what happened and why it appears suspicious"
              placeholderTextColor={C.muted}
              style={[styles.reportInput, styles.reportNotes]}
            />
            <View style={styles.reportActions}>
              <Pressable onPress={() => setShowReport(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              <Pressable disabled={savingReport} onPress={() => void saveReport()} style={styles.saveReportButton}><Text style={styles.saveReportText}>{savingReport ? 'Saving…' : 'Save Local Draft'}</Text></Pressable>
            </View>
          </View>
        ) : null}
      </Panel>

      <Panel style={styles.integrityPanel}>
        <RoundIcon symbol="i" color={C.blue} size={46} filled />
        <View style={styles.integrityCopy}>
          <Text style={styles.integrityTitle}>Reqrium Data Integrity</Text>
          <Text style={styles.integrityText}>Source: {safety.dataSource.replace(/_/g, ' ')} • Last check: {formatDate(safety.lastCheckedAt)} • Persistence: {safety.persistence.replace(/_/g, ' ')}.</Text>
          <Text style={styles.integrityWarning}>Remote reputation, sanctions, breach, identity and malware intelligence are not connected. Verify every destination independently before signing.</Text>
        </View>
      </Panel>

      <BottomNav active="Safety" items={[
        ['⌂', 'Home', 'Portfolio'],
        ['▣', 'Wallets', 'Wallets'],
        ['✈', 'Travel', 'TravelMode'],
        ['R', 'Safety', 'BlockPagesSafety'],
        ['⚙', 'Settings', 'Settings'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  hubBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 8, fontWeight: '900' },
  errorBanner: { minHeight: 48, marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { padding: 19 },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: .4 },
  heroTitle: { fontSize: 46, fontWeight: '900', letterSpacing: -1.2, marginTop: 6 },
  scoreLine: { flexDirection: 'row', alignItems: 'baseline', marginTop: 5 },
  readinessScore: { color: '#fff', fontSize: 31, fontWeight: '900' },
  scoreOut: { color: C.muted, fontSize: 11, marginLeft: 3 },
  protectionLabel: { fontSize: 11, fontWeight: '900', marginLeft: 12 },
  heroText: { color: '#fff', fontSize: 12, lineHeight: 19, marginTop: 9 },
  lastScan: { color: C.muted, fontSize: 9, marginTop: 8 },
  logoGraphic: { width: 240, alignItems: 'center' },
  logoOrbit: { width: 182, height: 182, borderRadius: 91, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  orbitIcon: { position: 'absolute', width: 41, height: 41, borderRadius: 21, borderWidth: 1, backgroundColor: C.bg, fontSize: 20, textAlign: 'center', textAlignVertical: 'center' },
  orbitTop: { top: -2 },
  orbitRight: { right: -2, top: 70 },
  orbitBottom: { bottom: -2 },
  orbitLeft: { left: -2, top: 70 },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.borderSoft },
  heroStat: { flex: 1, minWidth: 135 },
  heroStatLabel: { color: C.muted, fontSize: 8 },
  heroStatValue: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 6 },
  heroStatNote: { fontSize: 8, marginTop: 5 },
  sectionPanel: { marginTop: 17, padding: 16 },
  activityPanel: { marginTop: 17, padding: 16 },
  toolsPanel: { marginTop: 17, padding: 16 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionHeadingCompact: { alignItems: 'flex-start' },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  scanButton: { borderWidth: 1, borderColor: C.blue, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8 },
  scanButtonText: { color: C.blue, fontSize: 9, fontWeight: '900' },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  moduleCard: { flexGrow: 1, flexBasis: 210, borderWidth: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: C.panel2 },
  moduleMain: { minHeight: 168, alignItems: 'center', justifyContent: 'center', padding: 13 },
  moduleTitle: { color: '#fff', fontSize: 11, fontWeight: '900', textAlign: 'center', marginTop: 9 },
  moduleStatus: { fontSize: 8, fontWeight: '900', marginTop: 6 },
  moduleSub: { color: C.muted, fontSize: 8, lineHeight: 13, textAlign: 'center', marginTop: 6 },
  moduleEvidence: { borderTopWidth: 1, borderTopColor: C.borderSoft, padding: 12 },
  moduleDetail: { color: '#d5dfed', fontSize: 9, lineHeight: 15 },
  providerLabel: { color: C.muted, fontSize: 7, marginTop: 11 },
  providerValue: { color: '#fff', fontSize: 9, marginTop: 4 },
  moduleButton: { minHeight: 38, marginTop: 11, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  moduleButtonText: { fontSize: 9, fontWeight: '900' },
  feedback: { color: C.blue, fontSize: 9, lineHeight: 15, marginTop: 11 },
  twoColumn: { flexDirection: 'row', gap: 12, marginTop: 17 },
  twoColumnCompact: { flexDirection: 'column' },
  privacyPanel: { flex: .85, padding: 16 },
  exposurePanel: { flex: 1.15, padding: 16 },
  privacyBody: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 17 },
  privacyBodyCompact: { flexDirection: 'column' },
  scoreRing: { width: 112, height: 112, borderRadius: 56, borderWidth: 10, alignItems: 'center', justifyContent: 'center' },
  scoreValue: { color: '#fff', fontSize: 30, fontWeight: '900' },
  scoreRingOut: { color: C.muted, fontSize: 8 },
  privacyCopy: { flex: 1, minWidth: 0 },
  privacyStatus: { fontSize: 14, fontWeight: '900' },
  privacyText: { color: C.muted, fontSize: 9, lineHeight: 15, marginVertical: 9 },
  exposureList: { marginTop: 12, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, overflow: 'hidden' },
  exposureRow: { backgroundColor: C.panel2 },
  exposureMain: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  exposureIcon: { width: 28, fontSize: 19 },
  exposureCopy: { flex: 1, minWidth: 0 },
  exposureLabel: { color: '#fff', fontSize: 9, fontWeight: '800' },
  exposureCount: { color: C.muted, fontSize: 8, marginTop: 3 },
  exposureStatus: { fontSize: 8, fontWeight: '900', marginLeft: 8 },
  exposureDetailWrap: { borderTopWidth: 1, borderTopColor: C.borderSoft, padding: 11 },
  exposureDetail: { color: C.muted, fontSize: 8, lineHeight: 13 },
  link: { color: C.blue, fontSize: 9, fontWeight: '900', marginTop: 8 },
  activityList: { marginTop: 12, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, overflow: 'hidden' },
  activityRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', padding: 11 },
  activityCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  activityTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  activitySub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  activityTime: { width: 90, marginLeft: 8, fontSize: 8, textAlign: 'right' },
  emptyState: { minHeight: 105, padding: 18, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  emptyText: { color: C.muted, fontSize: 9, lineHeight: 15, textAlign: 'center', marginTop: 6 },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  toolCard: { flexGrow: 1, flexBasis: 145, minHeight: 132, borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 12 },
  toolTitle: { color: '#fff', fontSize: 10, fontWeight: '900', marginTop: 9 },
  toolSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 5 },
  toolArrow: { position: 'absolute', right: 10, top: 8, color: '#c9d4e3', fontSize: 22 },
  reportPanel: { marginTop: 15, borderWidth: 1, borderColor: 'rgba(255,70,85,.55)', borderRadius: 12, backgroundColor: C.panel2, padding: 14 },
  reportHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  reportTitle: { color: C.red, fontSize: 12, fontWeight: '900' },
  reportSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  reportCount: { color: C.red, fontSize: 9, fontWeight: '900' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 },
  categoryButton: { borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  categoryButtonActive: { borderColor: C.red, backgroundColor: 'rgba(255,70,85,.12)' },
  categoryText: { color: C.muted, fontSize: 8 },
  categoryTextActive: { color: C.red, fontWeight: '900' },
  reportInput: { minHeight: 46, marginTop: 11, borderWidth: 1, borderColor: C.border, borderRadius: 9, backgroundColor: C.bg, color: '#fff', fontSize: 10, paddingHorizontal: 11, paddingVertical: 9 },
  reportNotes: { minHeight: 92, textAlignVertical: 'top' },
  reportActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 11 },
  cancelButton: { minHeight: 40, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: C.muted, fontSize: 9, fontWeight: '900' },
  saveReportButton: { minHeight: 40, borderWidth: 1, borderColor: C.red, borderRadius: 8, backgroundColor: 'rgba(255,70,85,.1)', paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  saveReportText: { color: C.red, fontSize: 9, fontWeight: '900' },
  integrityPanel: { minHeight: 92, marginTop: 17, padding: 14, flexDirection: 'row', alignItems: 'center' },
  integrityCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  integrityTitle: { color: C.blue, fontSize: 11, fontWeight: '900' },
  integrityText: { color: '#d6e1ef', fontSize: 8, lineHeight: 13, marginTop: 5 },
  integrityWarning: { color: C.yellow, fontSize: 8, lineHeight: 13, marginTop: 5 },
});
