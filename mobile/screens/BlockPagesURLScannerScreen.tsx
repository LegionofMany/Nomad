import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useNomadURLSafetyScanner } from '../nomad';
import type {
  ReqriumURLCheck,
  ReqriumURLScanSession,
  ReqriumURLScannerEvent,
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

function formatDate(value?: string) {
  if (!value) return 'Not recorded';
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Time unavailable';
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function riskInfo(risk?: ReqriumURLScanSession['risk']) {
  if (risk === 'high') {
    return {
      color: C.red,
      tone: 'red' as const,
      label: 'HIGH LOCAL RISK',
      title: 'Do Not Connect a Wallet',
      action: 'Avoid credentials, downloads and transaction prompts. Review every finding before continuing.',
    };
  }
  if (risk === 'medium') {
    return {
      color: C.yellow,
      tone: 'yellow' as const,
      label: 'LOCAL REVIEW REQUIRED',
      title: 'Pause Before Opening',
      action: 'The URL contains structural or language signals that require manual verification.',
    };
  }
  if (risk === 'low') {
    return {
      color: C.green,
      tone: 'green' as const,
      label: 'NO LOCAL FLAGS FOUND',
      title: 'Not a Safety Certification',
      action: 'Local checks found no configured flags. Remote reputation, redirects, certificates and page content remain unverified.',
    };
  }
  return {
    color: C.blue,
    tone: 'blue' as const,
    label: 'SCAN REQUIRED',
    title: 'Check a Website Before You Open It',
    action: 'Enter an HTTP or HTTPS website URL. Reqrium will inspect local structure without opening the destination.',
  };
}

function checkInfo(status: ReqriumURLCheck['status']) {
  if (status === 'pass') return { color: C.green, mark: '✓', label: 'LOCAL PASS' };
  if (status === 'warning') return { color: C.yellow, mark: '!', label: 'REVIEW' };
  if (status === 'fail') return { color: C.red, mark: '×', label: 'FLAGGED' };
  return { color: C.muted, mark: '—', label: 'UNAVAILABLE' };
}

function CheckRow({ item, last }: { item: ReqriumURLCheck; last?: boolean }) {
  const info = checkInfo(item.status);
  return (
    <View style={[styles.checkRow, !last && styles.rowBorder]}>
      <View style={[styles.checkMark, { borderColor: info.color, backgroundColor: `${info.color}12` }]}>
        <Text style={[styles.checkMarkText, { color: info.color }]}>{info.mark}</Text>
      </View>
      <View style={styles.checkCopy}>
        <Text style={styles.checkTitle}>{item.label}</Text>
        <Text style={styles.checkDetail}>{item.detail}</Text>
        <Text style={styles.checkProvider}>Provider: {item.provider}</Text>
      </View>
      <Text style={[styles.checkStatus, { color: info.color }]}>{info.label}</Text>
    </View>
  );
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
      <Text selectable style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
  );
}

function HistoryRow({
  item,
  selected,
  last,
  onPress,
}: {
  item: ReqriumURLScanSession;
  selected: boolean;
  last?: boolean;
  onPress(): void;
}) {
  const info = riskInfo(item.risk);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.historyRow,
        !last && styles.rowBorder,
        selected && styles.historySelected,
        pressed && styles.pressed,
      ]}
    >
      <RoundIcon symbol={item.risk === 'high' ? '!' : item.risk === 'medium' ? '?' : 'R'} color={info.color} size={43} filled />
      <View style={styles.historyCopy}>
        <Text numberOfLines={1} style={styles.historyHost}>{item.displayHost}</Text>
        <Text style={styles.historyMeta}>{formatDate(item.checkedAt)} • {item.score}/100 local score</Text>
      </View>
      <Text style={[styles.historyRisk, { color: info.color }]}>{item.risk.toUpperCase()}</Text>
      <Text style={[styles.historyArrow, selected && { color: C.green }]}>{selected ? '✓' : '›'}</Text>
    </Pressable>
  );
}

function ActivityRow({ item, last }: { item: ReqriumURLScannerEvent; last?: boolean }) {
  const color = item.severity === 'critical' ? C.red : item.severity === 'warning' ? C.yellow : C.blue;
  return (
    <View style={[styles.activityRow, !last && styles.rowBorder]}>
      <RoundIcon symbol={item.type === 'report' ? '!' : item.type === 'scan' ? '⌕' : 'i'} color={color} size={40} filled />
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityDetail}>{item.detail}</Text>
        <Text style={styles.activityTime}>{formatDate(item.timestamp)}</Text>
      </View>
    </View>
  );
}

export default function BlockPagesURLScannerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { compact } = useNomadLayout();
  const routeUrl = typeof route.params?.url === 'string' ? route.params.url : undefined;
  const {
    scanner,
    loading,
    error,
    refresh,
    scanUrl,
    selectScan,
    createReportDraft,
  } = useNomadURLSafetyScanner(routeUrl);

  const [urlInput, setUrlInput] = useState(routeUrl || '');
  const [reportNotes, setReportNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showAllChecks, setShowAllChecks] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const selected = scanner.selectedScan;
  const info = riskInfo(selected?.risk);
  const visibleChecks = selected
    ? selected.checks.slice(0, showAllChecks ? selected.checks.length : 8)
    : [];
  const visibleHistory = scanner.history.slice(0, showAllHistory ? 20 : 5);
  const localFindings = selected?.checks.filter((check) => check.status === 'warning' || check.status === 'fail') ?? [];
  const unavailableChecks = selected?.checks.filter((check) => check.status === 'unavailable').length ?? 0;
  const evidence = useMemo(() => selected?.evidence ?? [], [selected]);

  const runScan = async () => {
    try {
      setFeedback('Running Reqrium local URL checks without opening the website…');
      const next = await scanUrl(urlInput);
      setReportNotes('');
      setFeedback(next
        ? `${next.displayHost} was checked locally. Remote reputation and website content remain unverified.`
        : 'The URL scan completed without a selected result.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to scan this website URL.');
    }
  };

  const openHistory = async (scanId: string) => {
    try {
      await selectScan(scanId);
      setReportNotes('');
      setFeedback('Recorded local URL evidence loaded. No website was opened.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to open the selected scan.');
    }
  };

  const saveReport = async () => {
    if (!selected) return;
    try {
      await createReportDraft(selected.id, reportNotes);
      setReportNotes('');
      setFeedback('The URL report was saved as a local draft. No remote report was submitted.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to save the URL report draft.');
    }
  };

  const newScan = () => {
    setUrlInput('');
    setReportNotes('');
    setFeedback('Enter another HTTP or HTTPS website URL.');
  };

  return (
    <NomadPage maxWidth={960}>
      <PageHeader
        title="Reqrium URL Scanner"
        subtitle="Inspect local website signals without opening the destination"
        icon="◎"
        color={info.color}
        help
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh(selected?.id)} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <Panel style={styles.inputPanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>WEBSITE URL</Text>
            <Text style={styles.sectionSub}>HTTP and HTTPS only • the destination is not opened</Text>
          </View>
          <Text style={styles.inputBadge}>LOCAL ANALYSIS</Text>
        </View>
        <View style={[styles.inputRow, compact && styles.inputRowCompact]}>
          <Text style={styles.inputIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="Website URL to scan"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onChangeText={(value) => {
              setUrlInput(value);
              setFeedback('');
            }}
            onSubmitEditing={() => void runScan()}
            placeholder="example.com or https://example.com/path"
            placeholderTextColor="#718096"
            style={styles.input}
            value={urlInput}
          />
          <Pressable
            disabled={loading || urlInput.trim().length < 3}
            onPress={() => void runScan()}
            style={({ pressed }) => [styles.scanButton, pressed && styles.pressed, (loading || urlInput.trim().length < 3) && styles.disabled]}
          >
            <Text style={styles.scanButtonText}>{loading ? 'Checking…' : 'Scan URL'}</Text>
          </Pressable>
        </View>
        <Text style={styles.inputPrivacy}>Query strings, fragments and embedded credentials are not retained in the Page 24 scan session. Never paste a seed phrase, private key, password or Time Set.</Text>
      </Panel>

      <Panel tone={info.tone} style={[styles.hero, compact && styles.heroCompact]}>
        <View style={[styles.heroShield, { borderColor: info.color }]}>
          <Text style={[styles.heroShieldMark, { color: info.color }]}>R</Text>
          <Text style={[styles.heroShieldBadge, { backgroundColor: info.color }]}>{selected ? (selected.risk === 'low' ? 'i' : '!') : '?'}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroEyebrow, { color: info.color }]}>{info.label}</Text>
          <Text style={[styles.heroTitle, { color: info.color }]}>{selected?.displayHost || info.title}</Text>
          <Text style={styles.heroText}>{selected?.summary || info.action}</Text>
          {selected ? (
            <View style={styles.heroTags}>
              <Text style={[styles.heroTag, { color: info.color, borderColor: info.color }]}>{selected.scheme.toUpperCase()}</Text>
              <Text style={[styles.heroTag, { color: C.red, borderColor: C.red }]}>NOT VERIFIED SAFE</Text>
              <Text style={[styles.heroTag, { color: C.muted, borderColor: C.muted }]}>REMOTE FEEDS OFFLINE</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.heroScore}>
          <Text style={styles.heroScoreLabel}>LOCAL SCORE</Text>
          <Text style={[styles.heroScoreValue, { color: info.color }]}>{selected ? selected.score : '--'}</Text>
          <Text style={styles.heroScoreOut}>{selected ? '/100' : 'SCAN REQUIRED'}</Text>
        </View>
      </Panel>

      <View style={[styles.metricRow, compact && styles.metricRowCompact]}>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>URL SCANS</Text>
          <Text style={[styles.metricValue, { color: C.blue }]}>{scanner.totalUrlScans}</Text>
          <Text style={styles.metricSub}>Shared Reqrium scan history</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>LOCAL FLAGS</Text>
          <Text style={[styles.metricValue, { color: scanner.flaggedUrlScans ? C.yellow : C.green }]}>{scanner.flaggedUrlScans}</Text>
          <Text style={styles.metricSub}>Medium or high local results</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>REPORT DRAFTS</Text>
          <Text style={[styles.metricValue, { color: scanner.localReportDrafts ? C.yellow : C.muted }]}>{scanner.localReportDrafts}</Text>
          <Text style={styles.metricSub}>Local only • not submitted</Text>
        </Panel>
      </View>

      {selected ? (
        <>
          <Panel style={styles.scorePanel}>
            <View style={[styles.scoreBody, compact && styles.scoreBodyCompact]}>
              <View style={[styles.scoreRing, { borderColor: info.color }]}>
                <Text style={[styles.scoreValue, { color: info.color }]}>{selected.score}</Text>
                <Text style={styles.scoreOut}>LOCAL / 100</Text>
              </View>
              <View style={styles.scoreCopy}>
                <Text style={[styles.scoreTitle, { color: info.color }]}>{info.title}</Text>
                <Text style={styles.scoreText}>{info.action}</Text>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Local check coverage</Text>
                  <Text style={[styles.progressValue, { color: C.blue }]}>{selected.localCoveragePercent}%</Text>
                </View>
                <ProgressBar value={selected.localCoveragePercent} color={C.blue} height={9} />
                <Text style={styles.coverageNote}>{unavailableChecks} provider-dependent checks remain unavailable. Coverage is not a safety probability.</Text>
              </View>
            </View>
            <DetailRow label="Scan ID" value={selected.coreScanId} />
            <DetailRow label="Sanitized Target" value={selected.persistedUrl} />
            <DetailRow label="Checked" value={formatDate(selected.checkedAt)} />
            <DetailRow label="Query Retained" value="NO" color={C.green} />
            <DetailRow label="Credentials Retained" value="NO" color={C.green} />
            <DetailRow label="Provider" value="Reqrium local heuristics" last />
          </Panel>

          <Panel style={styles.checkPanel}>
            <Pressable onPress={() => setShowAllChecks((value) => !value)} style={styles.sectionHeading}>
              <View style={styles.sectionCopy}>
                <Text style={styles.sectionTitle}>URL EVIDENCE</Text>
                <Text style={styles.sectionSub}>Local passes mean only that one configured pattern was not detected</Text>
              </View>
              <Text style={styles.sectionToggle}>{showAllChecks ? 'Show less −' : `Show all ${selected.checks.length} +`}</Text>
            </Pressable>
            {visibleChecks.map((item, index) => (
              <CheckRow key={item.id} item={item} last={index === visibleChecks.length - 1} />
            ))}
          </Panel>

          <Panel style={styles.findingPanel}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionCopy}>
                <Text style={styles.sectionTitle}>RECORDED LOCAL FINDINGS</Text>
                <Text style={styles.sectionSub}>Evidence preserved in the shared Reqrium scan record</Text>
              </View>
              <Text style={[styles.sectionCount, { color: localFindings.length ? C.yellow : C.green }]}>{localFindings.length}</Text>
            </View>
            {evidence.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.evidenceRow}>
                <Text style={[styles.evidenceMark, { color: selected.risk === 'high' ? C.red : selected.risk === 'medium' ? C.yellow : C.green }]}>•</Text>
                <Text style={styles.evidenceText}>{item}</Text>
              </View>
            ))}
          </Panel>

          {selected.risk === 'high' ? (
            <Panel tone="red" style={[styles.highRiskPanel, compact && styles.highRiskPanelCompact]}>
              <RoundIcon symbol="!" color={C.red} size={52} filled />
              <View style={styles.highRiskCopy}>
                <Text style={styles.highRiskTitle}>High-Risk URL Characteristics Detected</Text>
                <Text style={styles.highRiskText}>Do not connect a wallet, enter credentials, download files or sign transactions. Emergency Freeze remains owner-controlled and is not activated automatically.</Text>
              </View>
              <Pressable onPress={() => navigation.navigate('EmergencyFreeze')} style={styles.highRiskButton}>
                <Text style={styles.highRiskButtonText}>Review Freeze</Text>
              </Pressable>
            </Panel>
          ) : null}

          <Panel style={styles.reportPanel}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionCopy}>
                <Text style={styles.sectionTitle}>REPORT THIS RESULT</Text>
                <Text style={styles.sectionSub}>Save a local false-positive or suspicious-site report draft</Text>
              </View>
              <Text style={[styles.reportStatus, { color: selected.reportDraftId ? C.green : C.yellow, borderColor: selected.reportDraftId ? C.green : C.yellow }]}>
                {selected.reportDraftId ? 'LOCAL DRAFT SAVED' : 'NOT SUBMITTED'}
              </Text>
            </View>
            <TextInput
              accessibilityLabel="URL report notes"
              multiline
              onChangeText={setReportNotes}
              placeholder="Describe the suspicious behavior or why this result may be incorrect. Do not include passwords, private keys, seed phrases or Time Sets."
              placeholderTextColor="#718096"
              style={styles.reportInput}
              value={reportNotes}
            />
            <PrimaryButton
              label={loading ? 'Saving Draft…' : selected.reportDraftId ? 'Save Another Local Draft' : 'Save Local Report Draft'}
              subtitle="No remote Reqrium, exchange, browser or law-enforcement submission occurs"
              icon="!"
              tone="green"
              disabled={loading || reportNotes.trim().length < 10}
              onPress={() => void saveReport()}
            />
          </Panel>
        </>
      ) : null}

      {visibleHistory.length ? (
        <Panel style={styles.historyPanel}>
          <Pressable onPress={() => setShowAllHistory((value) => !value)} style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>LOCAL URL SCAN HISTORY</Text>
              <Text style={styles.sectionSub}>Sanitized Page 24 sessions • current in-memory persistence boundary</Text>
            </View>
            <Text style={styles.sectionToggle}>{showAllHistory ? 'Show less −' : `Show ${Math.min(20, scanner.history.length)} +`}</Text>
          </Pressable>
          {visibleHistory.map((item, index) => (
            <HistoryRow
              key={item.id}
              item={item}
              selected={item.id === selected?.id}
              last={index === visibleHistory.length - 1}
              onPress={() => void openHistory(item.id)}
            />
          ))}
        </Panel>
      ) : null}

      {scanner.activity.length ? (
        <Panel style={styles.activityPanel}>
          <Pressable onPress={() => setShowActivity((value) => !value)} style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>URL SCANNER ACTIVITY</Text>
              <Text style={styles.sectionSub}>Local scans and report-draft events</Text>
            </View>
            <Text style={styles.sectionToggle}>{showActivity ? 'Hide −' : 'Show +'}</Text>
          </Pressable>
          {showActivity ? scanner.activity.slice(0, 8).map((item, index) => (
            <ActivityRow key={item.id} item={item} last={index === Math.min(8, scanner.activity.length) - 1} />
          )) : null}
        </Panel>
      ) : null}

      {feedback ? (
        <Panel tone={/unable|invalid|not a valid|supports|high-risk|unverified|not submitted/i.test(feedback) ? 'yellow' : 'green'} style={styles.feedbackPanel}>
          <Text style={styles.feedbackIcon}>i</Text>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </Panel>
      ) : null}

      <View style={[styles.actionRow, compact && styles.actionRowCompact]}>
        <Pressable onPress={newScan} style={styles.actionButton}><Text style={styles.actionButtonText}>New URL Scan</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('BlockPagesSafety')} style={styles.actionButton}><Text style={styles.actionButtonText}>Reqrium Safety Hub</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('SecurityCenter')} style={styles.actionButton}><Text style={styles.actionButtonText}>Security Center</Text></Pressable>
      </View>

      <Panel style={styles.boundaryPanel}>
        <RoundIcon symbol="i" color={C.blue} size={44} />
        <Text style={styles.boundaryText}>Page 24 checks URL structure and configured local patterns. It does not open the site, follow redirects, validate TLS certificates, inspect page code, verify domain ownership, consult remote reputation feeds or certify a website as safe.</Text>
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
  errorBanner: { minHeight: 60, marginBottom: 14, borderWidth: 1, borderColor: C.red, borderRadius: 11, backgroundColor: 'rgba(80,8,18,.42)', padding: 12, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 16 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 10 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  inputPanel: { padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900', letterSpacing: .3 },
  sectionSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  sectionToggle: { color: C.blue, fontSize: 9, fontWeight: '900' },
  sectionCount: { fontSize: 24, fontWeight: '900' },
  inputBadge: { color: C.blue, borderWidth: 1, borderColor: C.blue, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, fontSize: 8, fontWeight: '900' },
  inputRow: { minHeight: 65, marginTop: 15, borderWidth: 1, borderColor: C.border, borderRadius: 11, flexDirection: 'row', alignItems: 'center', paddingLeft: 13, backgroundColor: C.panel2 },
  inputRowCompact: { flexWrap: 'wrap', padding: 8 },
  inputIcon: { color: C.green, fontSize: 25, marginRight: 10 },
  input: { flex: 1, minWidth: 180, color: '#fff', fontSize: 13, outlineStyle: 'none' } as any,
  scanButton: { minHeight: 51, minWidth: 105, margin: 5, borderRadius: 8, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13 },
  scanButtonText: { color: C.bg, fontSize: 10, fontWeight: '900' },
  inputPrivacy: { color: C.yellow, fontSize: 8, lineHeight: 14, marginTop: 10 },
  hero: { minHeight: 210, marginTop: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  heroShield: { width: 130, height: 130, borderRadius: 32, borderWidth: 5, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  heroShieldMark: { fontSize: 58, fontWeight: '900' },
  heroShieldBadge: { position: 'absolute', right: -10, bottom: -10, width: 42, height: 42, borderRadius: 21, color: C.bg, fontSize: 21, fontWeight: '900', textAlign: 'center', textAlignVertical: 'center' },
  heroCopy: { flex: 1, minWidth: 0 },
  heroEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  heroTitle: { fontSize: 24, fontWeight: '900', marginTop: 8 },
  heroText: { color: '#eef3f7', fontSize: 11, lineHeight: 18, marginTop: 9 },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 },
  heroTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, fontSize: 7, fontWeight: '900' },
  heroScore: { minWidth: 125, alignItems: 'flex-end' },
  heroScoreLabel: { color: C.muted, fontSize: 8 },
  heroScoreValue: { fontSize: 45, fontWeight: '900', marginTop: 4 },
  heroScoreOut: { color: C.muted, fontSize: 8, marginTop: 2 },
  metricRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  metricRowCompact: { flexDirection: 'column' },
  metricCard: { flex: 1, minHeight: 100, padding: 14 },
  metricLabel: { color: C.muted, fontSize: 8, fontWeight: '900' },
  metricValue: { fontSize: 27, fontWeight: '900', marginTop: 7 },
  metricSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 6 },
  scorePanel: { marginTop: 16, padding: 17 },
  scoreBody: { flexDirection: 'row', alignItems: 'center', gap: 22, marginBottom: 8 },
  scoreBodyCompact: { flexDirection: 'column', alignItems: 'stretch' },
  scoreRing: { width: 132, height: 132, borderRadius: 66, borderWidth: 9, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  scoreValue: { fontSize: 40, fontWeight: '900' },
  scoreOut: { color: C.muted, fontSize: 8, marginTop: 2 },
  scoreCopy: { flex: 1, minWidth: 0 },
  scoreTitle: { fontSize: 20, fontWeight: '900' },
  scoreText: { color: '#eef3f7', fontSize: 10, lineHeight: 17, marginTop: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, marginBottom: 6 },
  progressLabel: { color: C.muted, fontSize: 9 },
  progressValue: { fontSize: 10, fontWeight: '900' },
  coverageNote: { color: C.yellow, fontSize: 8, lineHeight: 13, marginTop: 7 },
  detailRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 9 },
  detailLabel: { color: C.muted, fontSize: 10, flex: .8 },
  detailValue: { flex: 1.2, color: '#fff', fontSize: 9, fontWeight: '700', textAlign: 'right' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  checkPanel: { marginTop: 16, padding: 17 },
  checkRow: { minHeight: 86, flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  checkMark: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkMarkText: { fontSize: 15, fontWeight: '900' },
  checkCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  checkTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  checkDetail: { color: '#dce4ed', fontSize: 9, lineHeight: 14, marginTop: 4 },
  checkProvider: { color: C.muted, fontSize: 8, marginTop: 4 },
  checkStatus: { width: 68, fontSize: 7, fontWeight: '900', textAlign: 'right', marginLeft: 8 },
  findingPanel: { marginTop: 16, padding: 17 },
  evidenceRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  evidenceMark: { fontSize: 17, fontWeight: '900', marginRight: 9, lineHeight: 17 },
  evidenceText: { flex: 1, color: '#eef3f7', fontSize: 9, lineHeight: 15 },
  highRiskPanel: { minHeight: 105, marginTop: 16, padding: 15, flexDirection: 'row', alignItems: 'center' },
  highRiskPanelCompact: { flexDirection: 'column', alignItems: 'stretch' },
  highRiskCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  highRiskTitle: { color: C.red, fontSize: 13, fontWeight: '900' },
  highRiskText: { color: '#ffe8eb', fontSize: 9, lineHeight: 15, marginTop: 5 },
  highRiskButton: { borderWidth: 1, borderColor: C.red, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, marginLeft: 10 },
  highRiskButtonText: { color: C.red, fontSize: 9, fontWeight: '900' },
  reportPanel: { marginTop: 16, padding: 17 },
  reportStatus: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, fontSize: 7, fontWeight: '900' },
  reportInput: { minHeight: 110, marginTop: 14, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.panel2, color: '#fff', padding: 13, fontSize: 10, lineHeight: 17, textAlignVertical: 'top', outlineStyle: 'none' } as any,
  historyPanel: { marginTop: 16, padding: 17 },
  historyRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  historySelected: { backgroundColor: 'rgba(32,239,112,.04)' },
  historyCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  historyHost: { color: '#fff', fontSize: 11, fontWeight: '900' },
  historyMeta: { color: C.muted, fontSize: 8, marginTop: 4 },
  historyRisk: { width: 60, fontSize: 8, fontWeight: '900', textAlign: 'right' },
  historyArrow: { color: C.muted, fontSize: 24, marginLeft: 8 },
  activityPanel: { marginTop: 16, padding: 17 },
  activityRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  activityCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  activityTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  activityDetail: { color: '#dce4ed', fontSize: 8, lineHeight: 13, marginTop: 4 },
  activityTime: { color: C.muted, fontSize: 7, marginTop: 4 },
  feedbackPanel: { minHeight: 70, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  feedbackIcon: { color: C.yellow, fontSize: 24, fontWeight: '900', marginRight: 12 },
  feedbackText: { flex: 1, color: '#fff0d9', fontSize: 9, lineHeight: 15 },
  actionRow: { flexDirection: 'row', gap: 11, marginTop: 16 },
  actionRowCompact: { flexDirection: 'column' },
  actionButton: { flex: 1, minHeight: 52, borderWidth: 1, borderColor: C.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: C.blue, fontSize: 9, fontWeight: '900' },
  boundaryPanel: { minHeight: 88, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  boundaryText: { flex: 1, minWidth: 0, color: '#edf2f7', fontSize: 9, lineHeight: 15, marginLeft: 12 },
  pressed: { opacity: .78 },
  disabled: { opacity: .42 },
});
