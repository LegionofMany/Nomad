import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { ReqriumBadge } from '../components/ReqriumBadge';
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
  Panel,
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

const approvedModuleOrder: ReqriumSafetyModule['id'][] = [
  'phishing_url',
  'identity_monitoring',
  'breach_monitoring',
  'malware_runtime',
  'social_engineering',
];

const moduleIcons: Record<ReqriumSafetyModule['id'], string> = {
  phishing_url: '⌁',
  wallet_address: '⌕',
  identity_monitoring: '♙',
  breach_monitoring: '◎',
  malware_runtime: '☀',
  social_engineering: '◈',
};

const moduleColors: Record<ReqriumSafetyModule['id'], string> = {
  phishing_url: C.blue,
  wallet_address: C.blue,
  identity_monitoring: C.purple,
  breach_monitoring: C.green,
  malware_runtime: C.orange,
  social_engineering: '#27a7ff',
};

const exposureIcons: Record<ReqriumExposureItem['id'], string> = {
  email: '✉',
  password: '♧',
  phone: '▯',
  address: '◇',
  url: '⌁',
};

function statusInfo(status: ReqriumSafetyModuleStatus) {
  switch (status) {
    case 'available': return { color: C.green, label: 'AVAILABLE', mark: '✓' };
    case 'limited': return { color: C.blue, label: 'LOCAL', mark: '◉' };
    case 'not_configured': return { color: C.purple, label: 'SETUP', mark: '+' };
    case 'unavailable': return { color: C.muted, label: 'UNAVAILABLE', mark: '—' };
  }
}

function exposureInfo(status: ReqriumExposureItem['status']) {
  if (status === 'clear') return { color: C.green, label: 'NO LOCAL FLAGS', mark: '✓' };
  if (status === 'review') return { color: C.yellow, label: 'REVIEW', mark: '!' };
  return { color: C.muted, label: 'NOT CONNECTED', mark: '—' };
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
    <View style={[styles.moduleCard, expanded && { borderColor: `${color}90` }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${status.label}`}
        onPress={onToggle}
        style={({ pressed }) => [styles.moduleMain, pressed && styles.pressed]}
      >
        <RoundIcon symbol={moduleIcons[item.id]} color={color} size={47} filled />
        <Text numberOfLines={2} style={styles.moduleTitle}>{item.title}</Text>
        <Text style={[styles.moduleStatus, { color: status.color }]}>{status.mark} {status.label}</Text>
        <Text numberOfLines={3} style={styles.moduleSub}>{item.subtitle}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.moduleEvidence}>
          <Text style={styles.moduleDetail}>{item.detail}</Text>
          <Text style={styles.providerValue}>Provider: {item.provider}</Text>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate(item.route)} style={({ pressed }) => [styles.moduleButton, { borderColor: status.color }, pressed && styles.pressed]}>
            <Text style={[styles.moduleButtonText, { color: status.color }]}>Open module  ›</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ExposureRow({ item, last, onPress }: { item: ReqriumExposureItem; last?: boolean; onPress(): void }) {
  const status = exposureInfo(item.status);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.exposureRow, !last && styles.rowBorder, pressed && styles.pressed]}>
      <Text style={[styles.exposureIcon, { color: moduleColors[item.id === 'url' ? 'phishing_url' : item.id === 'address' ? 'wallet_address' : item.id === 'email' ? 'phishing_url' : item.id === 'password' ? 'breach_monitoring' : 'identity_monitoring'] }]}>{exposureIcons[item.id]}</Text>
      <Text style={styles.exposureLabel}>{item.label}</Text>
      <Text style={styles.exposureCount}>{item.count}</Text>
      <Text style={[styles.exposureStatus, { color: status.color }]}>{status.mark} {status.label}</Text>
      <Text style={styles.rowArrow}>›</Text>
    </Pressable>
  );
}

function ActivityRow({ item, last }: { item: ReqriumSafetyEvent; last?: boolean }) {
  const color = item.severity === 'critical' ? C.red : item.severity === 'warning' ? C.yellow : C.blue;
  const icon = item.type === 'scan' ? '⌕' : item.type === 'report' ? '⚑' : item.type === 'security' ? '◇' : 'R';
  return (
    <View style={[styles.activityRow, !last && styles.rowBorder]}>
      <RoundIcon symbol={icon} color={color} size={39} filled />
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text numberOfLines={2} style={styles.activitySub}>{item.detail}</Text>
      </View>
      <Text style={[styles.activityTime, { color }]}>{formatDate(item.timestamp)}</Text>
    </View>
  );
}

function ToolRow({ icon, color, title, subtitle, onPress, last }: { icon: string; color: string; title: string; subtitle: string; onPress(): void; last?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.toolRow, !last && styles.rowBorder, pressed && styles.pressed]}>
      <RoundIcon symbol={icon} color={color} size={39} filled />
      <View style={styles.toolCopy}>
        <Text style={styles.toolTitle}>{title}</Text>
        <Text style={styles.toolSub}>{subtitle}</Text>
      </View>
      <Text style={styles.rowArrow}>›</Text>
    </Pressable>
  );
}

export default function BlockPagesSafetyScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const safety = useNomadBlockPagesSafety();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
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
    ? 'ACCESS RESTRICTED'
    : safety.status === 'attention_required'
      ? 'REVIEW REQUIRED'
      : safety.status === 'limited'
        ? 'LOCAL SAFETY ACTIVE'
        : 'SETUP REQUIRED';
  const visibleModules = useMemo(
    () => approvedModuleOrder.map((id) => safety.modules.find((item) => item.id === id)).filter((item): item is ReqriumSafetyModule => Boolean(item)),
    [safety.modules],
  );
  const visibleActivity = useMemo(
    () => safety.activity.slice(0, showAllActivity ? 12 : 4),
    [safety.activity, showAllActivity],
  );

  const runFullCheck = async () => {
    try {
      setChecking(true);
      setFeedback('Checking registered local modules and provider availability…');
      const next = await safety.runScan();
      if (next) setFeedback(`Check complete: ${next.readinessScore}/100 local readiness. Remote threat intelligence remains unavailable.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to complete the Reqrium check.');
    } finally {
      setChecking(false);
    }
  };

  const saveReport = async () => {
    try {
      setSavingReport(true);
      const report = await safety.createReportDraft(reportCategory, reportTarget, reportNotes);
      setReportTarget('');
      setReportNotes('');
      setShowReport(false);
      setFeedback(`Report ${report.id} saved locally. It has not been sent to a remote authority.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to save the report draft.');
    } finally {
      setSavingReport(false);
    }
  };

  return (
    <NomadPage maxWidth={980}>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to portfolio" onPress={() => navigation.navigate('Portfolio')} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <ReqriumBadge size={58} />
        <View style={[styles.headerCopy, compact && styles.headerCopyCompact]}>
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>Reqrium Safety</Text>
            <Text style={[styles.statusBadge, { color: statusColor, borderColor: `${statusColor}70`, backgroundColor: `${statusColor}15` }]}>{safety.protectionLabel}</Text>
          </View>
          <Text style={styles.pageSubtitle}>Real-Time Trust Intelligence</Text>
        </View>
        <View style={[styles.systemPill, compact && styles.systemPillCompact, { borderColor: `${statusColor}55` }]}>
          <Text style={[styles.systemMark, { color: statusColor }]}>◇</Text>
          <View>
            <Text style={styles.systemLabel}>Local Safety</Text>
            <Text style={[styles.systemValue, { color: statusColor }]}>{safety.protectionLabel}</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open safety help" onPress={() => navigation.navigate('Settings')} style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}>
          <Text style={styles.helpText}>?</Text>
        </Pressable>
      </View>

      {safety.error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{safety.error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void safety.refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel style={[styles.hero, { borderColor: `${statusColor}85` }]}>
        <View style={[styles.heroBody, compact && styles.heroCompact]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: statusColor }]}>YOUR LOCAL SAFETY LAYER</Text>
            <View style={styles.heroStatusRow}>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.heroScore}>{safety.readinessScore}</Text>
              <Text style={styles.heroScoreOut}>/100</Text>
              <Text style={[styles.heroCheck, { color: statusColor, borderColor: statusColor }]}>✓</Text>
            </View>
            <Text style={[styles.heroTitle, { color: statusColor }]}>{heroTitle}</Text>
            <Text style={styles.heroText}>Reqrium combines recorded local checks with connected Nomad controls. This readiness score is not a guarantee that a URL, wallet, identity, or device is safe.</Text>
          </View>
          <View style={[styles.heroArtwork, compact && styles.heroArtworkCompact]}><ReqriumBadge fill /></View>
        </View>

        <View style={styles.heroStats}>
          {[
            ['⌁', 'Local Flags', String(safety.localFlags), safety.localFlags ? 'Needs review' : 'None recorded', safety.localFlags ? C.yellow : C.green],
            ['⚑', 'Local Drafts', String(safety.reportDrafts), 'Not submitted', safety.reportDrafts ? C.yellow : C.muted],
            ['◎', 'Scans Recorded', String(safety.scansRecorded), 'Local history', C.blue],
            ['◇', 'Remote Intel', 'OFFLINE', 'Provider not connected', C.muted],
          ].map(([icon, label, value, note, color]) => (
            <View key={label} style={styles.heroStat}>
              <Text style={[styles.heroStatIcon, { color }]}>{icon}</Text>
              <View>
                <Text style={styles.heroStatLabel}>{label}</Text>
                <Text style={styles.heroStatValue}>{value}</Text>
                <Text style={[styles.heroStatNote, { color }]}>{note}</Text>
              </View>
            </View>
          ))}
        </View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>THREAT PROTECTION</Text>
            <Text style={styles.sectionSub}>Local tools and provider boundaries</Text>
          </View>
          <Pressable testID="reqrium-run-check" accessibilityRole="button" disabled={checking || safety.loading} onPress={() => void runFullCheck()} style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}>
            <Text style={styles.scanButtonText}>{checking ? 'Checking…' : 'Run Safety Check'}</Text>
          </Pressable>
        </View>
        <View style={styles.moduleGrid}>
          {visibleModules.map((item) => (
            <ModuleCard key={item.id} item={item} expanded={expandedModule === item.id} onToggle={() => setExpandedModule((current) => current === item.id ? null : item.id)} />
          ))}
        </View>
        {feedback ? <Text style={[styles.feedback, feedback.toLowerCase().includes('unable') && { color: C.red }]}>{feedback}</Text> : null}
      </Panel>

      <View style={[styles.twoColumn, compact && styles.twoColumnCompact]}>
        <Panel style={styles.privacyPanel}>
          <Text style={styles.sectionTitle}>PRIVACY READINESS</Text>
          <View style={styles.privacyBody}>
            <View style={[styles.scoreRing, { borderColor: statusColor, shadowColor: statusColor }]}>
              <Text style={styles.scoreValue}>{safety.privacyScore}</Text>
              <Text style={styles.scoreRingOut}>/100</Text>
            </View>
            <View style={styles.privacyCopy}>
              <Text style={[styles.privacyStatus, { color: statusColor }]}>{safety.protectionLabel}</Text>
              <Text style={styles.privacyText}>Local module availability and Nomad security evidence. Email, breach, phone, and malware providers remain unconnected.</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('SecurityCenter')} style={({ pressed }) => [styles.panelLink, pressed && styles.pressed]}>
            <Text style={styles.panelLinkText}>Improve local readiness</Text><Text style={styles.rowArrow}>›</Text>
          </Pressable>
        </Panel>

        <Panel style={styles.exposurePanel}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>EXPOSURE SUMMARY</Text>
            <Text style={styles.sectionSub}>Evidence only</Text>
          </View>
          <View style={styles.exposureList}>
            {safety.exposures.map((item, index) => (
              <ExposureRow
                key={item.id}
                item={item}
                last={index === safety.exposures.length - 1}
                onPress={() => item.route ? navigation.navigate(item.route) : navigation.navigate('Settings')}
              />
            ))}
          </View>
        </Panel>
      </View>

      <View style={[styles.twoColumn, compact && styles.twoColumnCompact]}>
        <Panel style={styles.activityPanel}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
              <Text style={styles.sectionSub}>Recorded local evidence only</Text>
            </View>
            {safety.activity.length > 4 ? (
              <Pressable accessibilityRole="button" onPress={() => setShowAllActivity((current) => !current)}><Text style={styles.link}>{showAllActivity ? 'Show Less' : 'View All'}  ›</Text></Pressable>
            ) : null}
          </View>
          <View style={styles.activityList}>
            {visibleActivity.length ? visibleActivity.map((item, index) => <ActivityRow key={item.id} item={item} last={index === visibleActivity.length - 1} />) : (
              <View style={styles.emptyState}>
                <RoundIcon symbol="R" color={C.blue} size={41} filled />
                <View style={styles.emptyCopy}><Text style={styles.emptyTitle}>No Reqrium activity yet</Text><Text style={styles.emptyText}>Run a check or open a scanner to create a local audit record.</Text></View>
              </View>
            )}
          </View>
        </Panel>

        <Panel style={styles.toolsPanel}>
          <Text style={styles.sectionTitle}>SAFETY TOOLS</Text>
          <View style={styles.toolList}>
            <ToolRow icon="◎" color={C.blue} title="URL Scanner" subtitle="Inspect a link locally" onPress={() => navigation.navigate('BlockPagesURLScanner')} />
            <ToolRow icon="⌕" color="#28baff" title="Address Scanner" subtitle="Validate a wallet value" onPress={() => navigation.navigate('AddressSafetyDetail')} />
            <ToolRow icon="◇" color={C.green} title="Security Center" subtitle="Review wallet controls" onPress={() => navigation.navigate('SecurityCenter')} />
            <ToolRow icon="⚙" color={C.purple} title="Provider Settings" subtitle="Review connected services" onPress={() => navigation.navigate('Settings')} />
            <ToolRow icon="⚑" color={C.red} title="Report a Scam" subtitle="Save a local report draft" onPress={() => setShowReport((current) => !current)} last />
          </View>
        </Panel>
      </View>

      {showReport ? (
        <Panel style={styles.reportPanel}>
          <View style={styles.reportHeading}>
            <View><Text style={styles.reportTitle}>SCAM REPORT DRAFT</Text><Text style={styles.reportSub}>Stored locally • no remote submission provider</Text></View>
            <Text style={styles.reportCount}>{safety.reportDrafts} saved</Text>
          </View>
          <View style={styles.categoryRow}>
            {reportCategories.map((item) => {
              const active = reportCategory === item.value;
              return <Pressable accessibilityRole="button" key={item.value} onPress={() => setReportCategory(item.value)} style={[styles.categoryButton, active && styles.categoryButtonActive]}><Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item.label}</Text></Pressable>;
            })}
          </View>
          <TextInput testID="reqrium-report-target" value={reportTarget} onChangeText={setReportTarget} autoCapitalize="none" placeholder="Suspicious URL, wallet address, account or contact" placeholderTextColor={C.muted} style={styles.reportInput} />
          <TextInput testID="reqrium-report-notes" value={reportNotes} onChangeText={setReportNotes} multiline numberOfLines={4} placeholder="Describe what happened and why it appears suspicious" placeholderTextColor={C.muted} style={[styles.reportInput, styles.reportNotes]} />
          <View style={styles.reportActions}>
            <Pressable accessibilityRole="button" onPress={() => setShowReport(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
            <Pressable testID="reqrium-save-report" accessibilityRole="button" disabled={savingReport} onPress={() => void saveReport()} style={styles.saveReportButton}><Text style={styles.saveReportText}>{savingReport ? 'Saving…' : 'Save Local Draft'}</Text></Pressable>
          </View>
        </Panel>
      ) : null}

      <Panel style={styles.protectionBanner}>
        <ReqriumBadge size={54} />
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerTitle}>Reqrium Protection</Text>
          <Text style={styles.bannerText}>Secure. Verify. Protect. Local checks stay distinct from remote provider verification.</Text>
          <Text style={styles.bannerMeta}>Source: {safety.dataSource.replace(/_/g, ' ')} • Last check: {formatDate(safety.lastCheckedAt)}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Settings')} style={({ pressed }) => [styles.bannerButton, pressed && styles.pressed]}><Text style={styles.bannerButtonText}>Review Connections  ›</Text></Pressable>
      </Panel>

      <BottomNav active="Safety" items={[
        ['⌂', 'Home', 'Portfolio'],
        ['▣', 'Wallets', 'Wallets'],
        ['✈', 'Travel', 'TravelMode'],
        ['◇', 'Security', 'SecurityCenter'],
        ['R', 'Safety', 'BlockPagesSafety'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  header: { minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 5, marginBottom: 15 },
  headerCompact: { minHeight: 138, flexWrap: 'wrap', alignContent: 'center', gap: 8 },
  backButton: { width: 41, height: 52, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 51, lineHeight: 51, fontWeight: '200' },
  headerCopy: { flex: 1, minWidth: 0 },
  headerCopyCompact: { flexBasis: 175 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  pageTitle: { color: '#fff', fontSize: 24, lineHeight: 30, fontWeight: '900', letterSpacing: -0.5 },
  pageSubtitle: { color: '#c8d1df', fontSize: 12, marginTop: 3 },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, fontSize: 8, fontWeight: '900' },
  systemPill: { minWidth: 155, minHeight: 58, borderWidth: 1, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 15 },
  systemPillCompact: { flex: 1, minWidth: 175, minHeight: 48, marginLeft: 49 },
  systemMark: { fontSize: 26, fontWeight: '900' },
  systemLabel: { color: '#dce4ef', fontSize: 10 },
  systemValue: { fontSize: 11, fontWeight: '900', marginTop: 2 },
  helpButton: { width: 48, height: 48, borderWidth: 1, borderColor: C.border, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  helpText: { color: '#dce4ef', fontSize: 24, fontWeight: '600' },
  errorBanner: { minHeight: 48, marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { padding: 22, borderWidth: 1 },
  heroBody: { minHeight: 270, flexDirection: 'row', alignItems: 'center' },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  heroCopy: { flex: 0.9, minWidth: 0 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 0.4 },
  heroStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  heroScore: { color: '#fff', fontSize: 54, lineHeight: 65, fontWeight: '900', letterSpacing: -1.5 },
  heroScoreOut: { color: C.muted, fontSize: 15, fontWeight: '700', marginLeft: 3, marginTop: 22 },
  heroCheck: { width: 37, height: 37, borderWidth: 2, borderRadius: 19, marginLeft: 14, fontSize: 22, lineHeight: 33, textAlign: 'center', fontWeight: '900' },
  heroTitle: { fontSize: 19, lineHeight: 27, fontWeight: '900', marginTop: 3 },
  heroText: { color: '#eef3fa', fontSize: 11, lineHeight: 18, marginTop: 9, maxWidth: 390 },
  heroArtwork: { flex: 1.1, minWidth: 360, height: 270 },
  heroArtworkCompact: { minWidth: 0, width: '100%', marginTop: 10 },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: C.borderSoft, marginTop: 8, paddingTop: 17 },
  heroStat: { flexGrow: 1, flexBasis: 175, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, borderRightWidth: 1, borderRightColor: C.borderSoft },
  heroStatIcon: { width: 26, fontSize: 22, textAlign: 'center' },
  heroStatLabel: { color: C.muted, fontSize: 9 },
  heroStatValue: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 2 },
  heroStatNote: { fontSize: 8, marginTop: 3 },
  sectionPanel: { marginTop: 16, padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 8, marginTop: 3 },
  scanButton: { borderWidth: 1, borderColor: C.blue, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8 },
  scanButtonText: { color: C.blue, fontSize: 8, fontWeight: '900' },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  moduleCard: { flex: 1, minWidth: 150, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 10, overflow: 'hidden', backgroundColor: C.panel2 },
  moduleMain: { minHeight: 154, alignItems: 'center', justifyContent: 'center', padding: 11 },
  moduleTitle: { minHeight: 29, color: '#fff', fontSize: 10, lineHeight: 14, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  moduleStatus: { fontSize: 8, fontWeight: '900', marginTop: 4 },
  moduleSub: { color: C.muted, fontSize: 7.5, lineHeight: 12, textAlign: 'center', marginTop: 5 },
  moduleEvidence: { borderTopWidth: 1, borderTopColor: C.borderSoft, padding: 10 },
  moduleDetail: { color: '#d5dfed', fontSize: 8, lineHeight: 13 },
  providerValue: { color: C.muted, fontSize: 7, marginTop: 8 },
  moduleButton: { minHeight: 34, marginTop: 9, borderWidth: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  moduleButtonText: { fontSize: 8, fontWeight: '900' },
  feedback: { color: C.blue, fontSize: 9, lineHeight: 15, marginTop: 11 },
  twoColumn: { flexDirection: 'row', gap: 12, marginTop: 16 },
  twoColumnCompact: { flexDirection: 'column' },
  privacyPanel: { flex: 0.78, padding: 16 },
  exposurePanel: { flex: 1.22, padding: 16 },
  privacyBody: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 17 },
  scoreRing: { width: 112, height: 112, borderRadius: 56, borderWidth: 10, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.36, shadowRadius: 13 },
  scoreValue: { color: '#fff', fontSize: 29, fontWeight: '900' },
  scoreRingOut: { color: C.muted, fontSize: 8 },
  privacyCopy: { flex: 1, minWidth: 0 },
  privacyStatus: { fontSize: 13, fontWeight: '900' },
  privacyText: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 7 },
  panelLink: { minHeight: 42, marginTop: 14, borderTopWidth: 1, borderTopColor: C.borderSoft, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  panelLinkText: { color: C.blue, fontSize: 9, fontWeight: '800' },
  exposureList: { marginTop: 11, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 9, overflow: 'hidden' },
  exposureRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  exposureIcon: { width: 27, fontSize: 17 },
  exposureLabel: { flex: 1, color: '#fff', fontSize: 8.5 },
  exposureCount: { width: 28, color: '#fff', fontSize: 9, textAlign: 'right' },
  exposureStatus: { width: 104, fontSize: 7.5, fontWeight: '900', textAlign: 'right', marginLeft: 6 },
  rowArrow: { color: '#b7c4d7', fontSize: 22, marginLeft: 8 },
  activityPanel: { flex: 1.15, padding: 16 },
  toolsPanel: { flex: 0.85, padding: 16 },
  activityList: { marginTop: 10, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 9, overflow: 'hidden' },
  activityRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', padding: 9 },
  activityCopy: { flex: 1, minWidth: 0, marginLeft: 9 },
  activityTitle: { color: '#fff', fontSize: 9, fontWeight: '900' },
  activitySub: { color: C.muted, fontSize: 7.5, lineHeight: 12, marginTop: 3 },
  activityTime: { width: 88, marginLeft: 7, fontSize: 7, textAlign: 'right' },
  link: { color: C.blue, fontSize: 8, fontWeight: '900' },
  emptyState: { minHeight: 100, padding: 14, flexDirection: 'row', alignItems: 'center' },
  emptyCopy: { flex: 1, marginLeft: 11 },
  emptyTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  emptyText: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  toolList: { marginTop: 10, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 9, overflow: 'hidden' },
  toolRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9 },
  toolCopy: { flex: 1, minWidth: 0, marginLeft: 9 },
  toolTitle: { color: '#fff', fontSize: 9, fontWeight: '800' },
  toolSub: { color: C.muted, fontSize: 7, marginTop: 3 },
  reportPanel: { marginTop: 16, padding: 16, borderColor: 'rgba(255,70,85,.55)' },
  reportHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  reportTitle: { color: C.red, fontSize: 12, fontWeight: '900' },
  reportSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  reportCount: { color: C.red, fontSize: 9, fontWeight: '900' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 },
  categoryButton: { borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  categoryButtonActive: { borderColor: C.red, backgroundColor: 'rgba(255,70,85,.12)' },
  categoryText: { color: C.muted, fontSize: 8 },
  categoryTextActive: { color: C.red, fontWeight: '900' },
  reportInput: { minHeight: 46, marginTop: 11, borderWidth: 1, borderColor: C.border, borderRadius: 9, backgroundColor: C.bg, color: '#fff', fontSize: 10, paddingHorizontal: 12, paddingVertical: 9 },
  reportNotes: { minHeight: 96, textAlignVertical: 'top' },
  reportActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 11 },
  cancelButton: { minHeight: 40, minWidth: 90, borderWidth: 1, borderColor: C.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: C.muted, fontSize: 9, fontWeight: '900' },
  saveReportButton: { minHeight: 40, minWidth: 150, borderRadius: 8, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  saveReportText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  protectionBanner: { minHeight: 112, marginTop: 16, padding: 15, borderColor: C.blue, flexDirection: 'row', alignItems: 'center', gap: 13 },
  bannerCopy: { flex: 1, minWidth: 0 },
  bannerTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  bannerText: { color: '#dce6f3', fontSize: 9, lineHeight: 14, marginTop: 4 },
  bannerMeta: { color: C.muted, fontSize: 7, marginTop: 5 },
  bannerButton: { minHeight: 45, borderRadius: 9, backgroundColor: '#0f6ff1', paddingHorizontal: 17, alignItems: 'center', justifyContent: 'center' },
  bannerButtonText: { color: '#fff', fontSize: 9, fontWeight: '900' },
});
