import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { ReqriumBadge } from '../components/ReqriumBadge';
import { useNomadURLSafetyScanner } from '../nomad';
import type { ReqriumURLCheck, ReqriumURLScanSession } from '../nomad';
import { C, NomadGlyph, NomadPage, Panel, useNomadLayout } from '../ui/NomadShell';

type ScannerMode = 'scan' | 'paste';
type ThreatKind = 'drainer' | 'malware' | 'contract' | 'phishing' | 'community';

function formatDate(value?: string) {
  if (!value) return 'Not recorded';
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Time unavailable';
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function riskInfo(risk?: ReqriumURLScanSession['risk']) {
  if (risk === 'high') return { color: C.red, label: 'High Local Risk', title: 'High-risk URL characteristics detected', summary: 'Do not connect a wallet, enter credentials, download files, or sign transactions.' };
  if (risk === 'medium') return { color: C.yellow, label: 'Review Required', title: 'Local indicators require review', summary: 'Pause and verify the destination independently before opening it.' };
  if (risk === 'low') return { color: C.green, label: 'Low Local Risk', title: 'No configured local flags detected', summary: 'Local checks found no configured URL flags. Remote reputation and page content remain unverified.' };
  return { color: C.green, label: 'Scan Required', title: 'Check a website before you click', summary: 'Enter an HTTP or HTTPS website. Reqrium inspects the URL locally without opening the destination.' };
}

function ReqriumShield({ size = 70, result = false, color = C.green }: { size?: number; result?: boolean; color?: string }) {
  return (
    <Svg accessibilityLabel={result ? 'Reqrium scan result shield' : 'Reqrium shield'} width={size} height={size * 1.1} viewBox="0 0 90 100" fill="none">
      <Path d="M45 5 80 20v29c0 24-13 39-35 51C23 88 10 73 10 49V20Z" fill={`${color}10`} stroke={color} strokeWidth="4" />
      {result ? (
        <Path d="m27 51 12 12 25-30" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <Path d="M29 30h32M29 70h32M45 23c-10 10-10 45 0 54M45 23c10 10 10 45 0 54" stroke={color} strokeWidth="2.7" strokeLinecap="round" />
          <Circle cx="45" cy="50" r="27" stroke={color} strokeWidth="2.7" />
        </>
      )}
    </Svg>
  );
}

function ResultArtwork({ color }: { color: string }) {
  return (
    <View style={styles.resultArtwork}>
      <Svg width="100%" height="100%" viewBox="0 0 180 180" fill="none">
        <Circle cx="90" cy="90" r="78" stroke={color} strokeOpacity=".12" />
        <Circle cx="90" cy="90" r="64" stroke={color} strokeOpacity=".22" strokeDasharray="2 7" />
        <Circle cx="90" cy="90" r="49" stroke={color} strokeOpacity=".15" />
        <Path d="M12 90h34M134 90h34M90 12v34M90 134v34M34 34l25 25M121 121l25 25M146 34l-25 25M59 121l-25 25" stroke={color} strokeOpacity=".15" />
      </Svg>
      <View style={styles.resultShield}><ReqriumShield size={112} result color={color} /></View>
    </View>
  );
}

function ScoreGauge({ score, color }: { score?: number; color: string }) {
  const value = score ?? 0;
  const circumference = 2 * Math.PI * 62;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circumference;
  return (
    <View style={styles.gauge}>
      <Svg width={160} height={160} viewBox="0 0 160 160" fill="none">
        <Circle cx="80" cy="80" r="66" stroke={color} strokeOpacity=".2" strokeWidth="2" />
        <Circle cx="80" cy="80" r="62" stroke="#123c29" strokeWidth="10" />
        <Circle cx="80" cy="80" r="62" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`} transform="rotate(-90 80 80)" />
      </Svg>
      <View style={styles.gaugeCopy}>
        <Text style={[styles.gaugeValue, { color }]}>{score ?? '--'}</Text>
        <Text style={styles.gaugeOut}>/100</Text>
      </View>
    </View>
  );
}

function ThreatIcon({ kind, color }: { kind: ThreatKind; color: string }) {
  const stroke = { stroke: color, strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <View style={[styles.threatIcon, { borderColor: `${color}88`, backgroundColor: `${color}10` }]}>
      <Svg width={32} height={32} viewBox="0 0 48 48" fill="none">
        {kind === 'drainer' ? <><Path d="M24 5 39 11v12c0 11-5 17-15 22C14 40 9 34 9 23V11Z" {...stroke} /><Path d="m17 24 5 5 10-12" {...stroke} /></> : null}
        {kind === 'malware' ? <><Circle cx="24" cy="25" r="10" {...stroke} /><Path d="M24 5v7M24 38v6M5 25h7M36 25h7M10 11l6 6M32 33l6 6M38 11l-6 6M16 33l-6 6M20 22h.1M28 22h.1M20 29h8" {...stroke} /></> : null}
        {kind === 'contract' ? <><Path d="M11 5h20l7 7v31H11Z" {...stroke} /><Path d="M30 5v9h8M17 23h15M17 30h15M17 37h9" {...stroke} /></> : null}
        {kind === 'phishing' ? <><Path d="M7 8h34L28 24v15l-8 4V24Z" {...stroke} /></> : null}
        {kind === 'community' ? <><Circle cx="18" cy="17" r="7" {...stroke} /><Circle cx="34" cy="20" r="6" {...stroke} /><Path d="M4 42c1-12 5-18 14-18s13 6 14 18M28 29c2-2 4-3 7-3 6 0 9 5 9 16" {...stroke} /></> : null}
      </Svg>
    </View>
  );
}

function aggregateStatus(checks: ReqriumURLCheck[], ids: ReqriumURLCheck['id'][]) {
  const matches = ids.map((id) => checks.find((check) => check.id === id)).filter(Boolean) as ReqriumURLCheck[];
  if (matches.some((check) => check.status === 'fail')) return 'fail' as const;
  if (matches.some((check) => check.status === 'warning')) return 'warning' as const;
  if (matches.length && matches.every((check) => check.status === 'unavailable')) return 'unavailable' as const;
  if (matches.some((check) => check.status === 'pass')) return 'pass' as const;
  return 'unavailable' as const;
}

function ThreatRow({ kind, title, detail, status, last }: { kind: ThreatKind; title: string; detail: string; status: 'pass' | 'warning' | 'fail' | 'unavailable'; last?: boolean }) {
  const color = status === 'fail' ? C.red : status === 'warning' ? C.yellow : status === 'pass' ? C.green : C.muted;
  const label = status === 'fail' ? 'Flagged' : status === 'warning' ? 'Review required' : status === 'pass' ? 'No local flags' : 'Provider unavailable';
  return (
    <View style={[styles.threatRow, !last && styles.rowDivider]}>
      <ThreatIcon kind={kind} color={color} />
      <View style={styles.threatCopy}><Text style={styles.threatTitle}>{title}</Text><Text style={styles.threatDetail}>{detail}</Text></View>
      <Text style={[styles.threatStatus, { color }]}>{label}</Text>
      <View style={[styles.statusCircle, { borderColor: color }]}><Text style={[styles.statusMark, { color }]}>{status === 'pass' ? '✓' : status === 'unavailable' ? '—' : '!'}</Text></View>
    </View>
  );
}

function Header({ historyOpen, onHistory }: { historyOpen: boolean; onHistory(): void }) {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
      <View style={styles.headerLogo}><ReqriumBadge size={58} /></View>
      <View style={styles.headerCopy}>
        <Text style={styles.headerTitle}>Reqrium URL Scanner</Text>
        <Text style={styles.headerSubtitle}>Check any website before you click</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Show URL scan history" onPress={onHistory} style={styles.historyButton}><Text style={[styles.historyButtonText, historyOpen && { color: '#fff' }]}>History</Text></Pressable>
      <View style={styles.helpCircle}><Text style={styles.helpText}>?</Text></View>
    </View>
  );
}

function BottomNavigation() {
  const navigation = useNavigation<any>();
  const items = [
    { label: 'Home', route: 'Portfolio', kind: 'home' as const },
    { label: 'Wallets', route: 'Wallets', kind: 'wallet' as const },
    { label: 'Travel', route: 'TravelMode', kind: 'travel' as const },
    { label: 'Security', route: 'SecurityCenter', kind: 'security' as const },
  ];
  return (
    <View style={styles.bottomNav}>
      {items.map((item) => (
        <Pressable key={item.label} onPress={() => navigation.navigate(item.route)} style={styles.navItem}>
          <NomadGlyph kind={item.kind} color={C.muted} size={32} /><Text style={styles.navLabel}>{item.label}</Text>
        </Pressable>
      ))}
      <Pressable onPress={() => navigation.navigate('BlockPagesSafety')} style={styles.navItem}>
        <ReqriumBadge size={34} /><Text style={[styles.navLabel, styles.navActive]}>Reqrium</Text>
      </Pressable>
    </View>
  );
}

export default function BlockPagesURLScannerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { compact } = useNomadLayout();
  const routeUrl = typeof route.params?.url === 'string' ? route.params.url : undefined;
  const { scanner, loading, error, refresh, scanUrl, selectScan, createReportDraft } = useNomadURLSafetyScanner(routeUrl);

  const [mode, setMode] = useState<ScannerMode>('scan');
  const [urlInput, setUrlInput] = useState(routeUrl || '');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportNotes, setReportNotes] = useState('');
  const [feedback, setFeedback] = useState('');

  const selected = scanner.selectedScan;
  const info = riskInfo(selected?.risk);
  const checks = selected?.checks ?? [];
  const threats = [
    { kind: 'drainer' as const, title: 'Drainer Detection', detail: 'Checks URL language for wallet-drainer and recovery-secret prompts', status: aggregateStatus(checks, ['wallet_language', 'embedded_credentials']) },
    { kind: 'malware' as const, title: 'Malicious Activity', detail: 'Remote malware and page-behavior inspection', status: aggregateStatus(checks, ['malware_content']) },
    { kind: 'contract' as const, title: 'Smart Contract Risks', detail: 'Page code and smart-contract inspection', status: aggregateStatus(checks, ['malware_content']) },
    { kind: 'phishing' as const, title: 'Phishing / Fake', detail: 'Checks local lookalike, shortener, redirect, and URL-language signals', status: aggregateStatus(checks, ['punycode_hostname', 'shortened_link', 'nested_destination', 'wallet_language']) },
    { kind: 'community' as const, title: 'Community Reports', detail: 'Remote verified incident and community-report feed', status: aggregateStatus(checks, ['community_reports']) },
  ];

  const runScan = async () => {
    try {
      setFeedback('Running Reqrium local URL checks without opening the website…');
      const next = await scanUrl(urlInput);
      setReportNotes('');
      setReportOpen(false);
      setFeedback(next ? `${next.displayHost} was checked locally. Remote reputation and website content remain unverified.` : 'The local URL scan completed.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to scan this website URL.');
    }
  };

  const openHistory = async (scanId: string) => {
    try {
      await selectScan(scanId);
      setHistoryOpen(false);
      setReportOpen(false);
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
      setFeedback('The issue was saved as a local draft. No remote report was submitted.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to save the local report draft.');
    }
  };

  return (
    <NomadPage maxWidth={900}>
      <Header historyOpen={historyOpen} onHistory={() => setHistoryOpen((value) => !value)} />

      {error ? (
        <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void refresh(selected?.id)} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable></View>
      ) : null}

      <Panel style={styles.scannerPanel}>
        <View style={styles.tabs}>
          <Pressable onPress={() => setMode('scan')} style={[styles.tab, mode === 'scan' && styles.tabActive]}><Text style={styles.tabIcon}>◎</Text><Text style={[styles.tabText, mode === 'scan' && styles.tabTextActive]}>Scan URL</Text></Pressable>
          <Pressable onPress={() => setMode('paste')} style={[styles.tab, mode === 'paste' && styles.tabActive]}><Text style={styles.linkIcon}>↗</Text><Text style={[styles.tabText, mode === 'paste' && styles.tabTextActive]}>Paste URL</Text></Pressable>
        </View>
        <View style={[styles.inputRow, compact && styles.inputCompact]}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="Website URL to scan"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onChangeText={(value) => { setUrlInput(value); setFeedback(''); }}
            onSubmitEditing={() => void runScan()}
            placeholder={mode === 'paste' ? 'Paste a URL here' : 'Enter or paste a URL to scan'}
            placeholderTextColor="#807a7d"
            style={styles.input}
            value={urlInput}
          />
          <View style={styles.scanFrame}><Text style={styles.scanFrameText}>⌗</Text></View>
          <Pressable disabled={loading || urlInput.trim().length < 3} onPress={() => void runScan()} style={({ pressed }) => [styles.scanButton, (loading || urlInput.trim().length < 3) && styles.disabled, pressed && styles.pressed]}><Text style={styles.scanButtonText}>{loading ? 'Checking…' : 'Scan'}</Text></Pressable>
        </View>
      </Panel>

      {historyOpen ? (
        <Panel style={styles.historyPanel}>
          <View style={styles.panelHeading}><Text style={styles.sectionTitle}>LOCAL SCAN HISTORY</Text><Text style={styles.historyCount}>{scanner.history.length}</Text></View>
          {scanner.history.length ? scanner.history.slice(0, 10).map((item, index) => {
            const itemInfo = riskInfo(item.risk);
            return (
              <Pressable key={item.id} onPress={() => void openHistory(item.id)} style={[styles.historyRow, index < Math.min(10, scanner.history.length) - 1 && styles.rowDivider]}>
                <View style={[styles.historyDot, { backgroundColor: itemInfo.color }]} /><View style={styles.historyCopy}><Text style={styles.historyHost}>{item.displayHost}</Text><Text style={styles.historyMeta}>{formatDate(item.checkedAt)} · {item.score}/100 local score</Text></View><Text style={[styles.historyRisk, { color: itemInfo.color }]}>{itemInfo.label}</Text><Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          }) : <Text style={styles.emptyHistory}>No local URL scans recorded yet.</Text>}
        </Panel>
      ) : null}

      <Panel tone={selected?.risk === 'high' ? 'red' : selected?.risk === 'medium' ? 'yellow' : 'green'} style={[styles.resultPanel, compact && styles.resultCompact]}>
        <ResultArtwork color={info.color} />
        <View style={styles.resultCopy}>
          <View style={styles.resultTitleRow}><Text numberOfLines={1} style={styles.resultHost}>{selected?.displayHost || 'Ready to scan'}</Text><View style={[styles.resultPill, { borderColor: info.color }]}><Text style={[styles.resultPillText, { color: info.color }]}>{selected ? info.label : 'Local analysis'}</Text></View></View>
          <Text style={styles.resultSummary}>{selected?.summary || info.summary}</Text>
          <View style={styles.resultTags}><Text style={[styles.resultTag, { color: info.color, borderColor: `${info.color}77` }]}>{selected ? 'Website' : 'HTTP / HTTPS'}</Text><Text style={[styles.resultTag, { color: info.color, borderColor: `${info.color}77` }]}>{selected ? 'Local result' : 'No destination opened'}</Text></View>
          <View style={styles.resultMeta}>
            <View style={styles.metaItem}><Text style={styles.metaLabel}>Scanned</Text><Text style={styles.metaValue}>{selected ? formatDate(selected.checkedAt) : 'Not yet scanned'}</Text></View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}><Text style={styles.metaLabel}>Source</Text><Text style={styles.metaValue}>Reqrium local heuristics</Text></View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}><Text style={styles.metaLabel}>Remote Reports</Text><Text style={[styles.metaValue, { color: C.muted }]}>{selected ? 'Not connected' : 'Unavailable'}</Text></View>
          </View>
        </View>
      </Panel>

      <Panel style={[styles.riskPanel, compact && styles.riskCompact]}>
        <View style={styles.riskGaugeWrap}><Text style={styles.sectionTitle}>RISK RATING  ⓘ</Text><ScoreGauge score={selected?.score} color={info.color} /></View>
        <View style={styles.riskCopy}>
          <Text style={[styles.riskTitle, { color: info.color }]}>{selected ? info.label : 'Awaiting Scan'}</Text>
          <Text style={styles.riskText}>{info.summary}</Text>
          <View style={styles.riskScale}><View style={styles.riskScaleGreen} /><View style={styles.riskScaleYellow} /><View style={styles.riskScaleRed} /><View style={[styles.riskNeedle, { left: selected ? `${Math.max(2, Math.min(98, 100 - selected.score))}%` : '2%' }]} /></View>
          <View style={styles.riskLabels}><Text style={styles.riskLabel}>0</Text><Text style={styles.riskLabel}>50</Text><Text style={styles.riskLabel}>100</Text></View>
          <Text style={styles.coverageText}>{selected ? `${selected.localCoveragePercent}% of configured checks ran locally. This score is not a safety certification.` : 'The destination is never opened during local URL analysis.'}</Text>
        </View>
      </Panel>

      <Panel style={styles.threatPanel}>
        <Text style={styles.sectionTitle}>THREAT ANALYSIS</Text>
        <View style={styles.threatList}>
          {threats.map((item, index) => <ThreatRow key={item.kind} {...item} last={index === threats.length - 1} />)}
        </View>
      </Panel>

      <Panel style={[styles.communityPanel, compact && styles.communityCompact]}>
        <View style={styles.communityIcon}><ReqriumBadge size={42} /></View>
        <View style={styles.communityCopy}><Text style={styles.communityTitle}>Reqrium protects you and the Web3 community.</Text><Text style={styles.communityText}>Report a false positive or save suspicious-site notes for review.</Text></View>
        <Pressable disabled={!selected} onPress={() => setReportOpen((value) => !value)} style={[styles.reportButton, !selected && styles.disabled]}><Text style={styles.reportButtonText}>{reportOpen ? 'Close Report' : 'Report Issue'}</Text></Pressable>
      </Panel>

      {reportOpen && selected ? (
        <Panel style={styles.reportPanel}>
          <View style={styles.panelHeading}><View><Text style={styles.sectionTitle}>REPORT THIS RESULT</Text><Text style={styles.reportSubtitle}>Saved locally only · no remote submission</Text></View><Text style={[styles.draftStatus, { color: selected.reportDraftId ? C.green : C.yellow }]}>{selected.reportDraftId ? 'DRAFT SAVED' : 'NOT SUBMITTED'}</Text></View>
          <TextInput accessibilityLabel="URL report notes" multiline onChangeText={setReportNotes} placeholder="Describe suspicious behavior or a false positive. Never include passwords, private keys, seed phrases, or Time Sets." placeholderTextColor="#718096" style={styles.reportInput} value={reportNotes} />
          <Pressable disabled={loading || reportNotes.trim().length < 10} onPress={() => void saveReport()} style={[styles.saveButton, (loading || reportNotes.trim().length < 10) && styles.disabled]}><Text style={styles.saveButtonText}>{loading ? 'Saving…' : 'Save Local Report Draft'}</Text></Pressable>
        </Panel>
      ) : null}

      {feedback ? <View style={styles.feedback}><Text style={styles.feedbackText}>{feedback}</Text></View> : null}

      {selected?.risk === 'high' ? <Pressable onPress={() => navigation.navigate('EmergencyFreeze')} style={styles.freezeButton}><Text style={styles.freezeButtonText}>Review Emergency Freeze</Text></Pressable> : null}

      <BottomNavigation />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 108, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginBottom: 14 },
  backButton: { width: 48, height: 52, justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 49, fontWeight: '200', lineHeight: 49 },
  headerLogo: { width: 72, alignItems: 'center' },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: '#fff', fontSize: 25, fontWeight: '800' },
  headerSubtitle: { color: '#d7d2d3', fontSize: 14, marginTop: 5 },
  historyButton: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 10 },
  historyButtonText: { color: C.green, fontSize: 17 },
  helpCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: C.green, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  helpText: { color: C.green, fontSize: 19, fontWeight: '700' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.red, borderRadius: 11, backgroundColor: 'rgba(80,8,18,.42)', padding: 13, marginBottom: 14 },
  errorText: { flex: 1, color: '#ff9ca4', fontSize: 11, lineHeight: 17 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 13, paddingVertical: 8 },
  retryText: { color: C.red, fontWeight: '800' },
  scannerPanel: { padding: 0, overflow: 'hidden' },
  tabs: { height: 78, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(130,160,180,.18)' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: C.green, backgroundColor: 'rgba(40,233,120,.025)' },
  tabIcon: { color: C.green, fontSize: 29, marginRight: 12 },
  linkIcon: { color: '#c4b8b8', fontSize: 25, marginRight: 12, transform: [{ rotate: '135deg' }] },
  tabText: { color: '#d2cacc', fontSize: 18, fontWeight: '600' },
  tabTextActive: { color: C.green },
  inputRow: { minHeight: 94, margin: 18, borderWidth: 1, borderColor: '#335166', borderRadius: 10, backgroundColor: 'rgba(0,7,14,.72)', flexDirection: 'row', alignItems: 'center', paddingLeft: 17 },
  inputCompact: { minHeight: 82, margin: 10, paddingLeft: 10 },
  searchIcon: { color: C.green, fontSize: 30, marginRight: 14 },
  input: { flex: 1, minWidth: 100, color: '#fff', fontSize: 16, outlineStyle: 'none' } as any,
  scanFrame: { width: 56, height: 48, borderRightWidth: 1, borderRightColor: '#53616c', alignItems: 'center', justifyContent: 'center' },
  scanFrameText: { color: C.green, fontSize: 30 },
  scanButton: { minWidth: 132, height: 70, borderRadius: 8, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  scanButtonText: { color: '#001108', fontSize: 18, fontWeight: '800' },
  disabled: { opacity: .42 },
  pressed: { opacity: .76 },
  historyPanel: { marginTop: 16, padding: 20 },
  panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyCount: { color: C.green, fontSize: 18, fontWeight: '800' },
  historyRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  historyDot: { width: 13, height: 13, borderRadius: 7, marginRight: 13 },
  historyCopy: { flex: 1 },
  historyHost: { color: '#fff', fontSize: 14, fontWeight: '700' },
  historyMeta: { color: C.muted, fontSize: 10, marginTop: 4 },
  historyRisk: { fontSize: 10, fontWeight: '800', marginLeft: 8 },
  chevron: { color: C.green, fontSize: 30, marginLeft: 10 },
  emptyHistory: { color: C.muted, fontSize: 12, marginTop: 18 },
  resultPanel: { minHeight: 340, marginTop: 18, padding: 24, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  resultCompact: { flexDirection: 'column', minHeight: 560 },
  resultArtwork: { width: 210, height: 210, alignItems: 'center', justifyContent: 'center' },
  resultShield: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  resultCopy: { flex: 1, minWidth: 0, marginLeft: 18 },
  resultTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  resultHost: { flex: 1, color: '#fff', fontSize: 27, fontWeight: '800' },
  resultPill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 8 },
  resultPillText: { fontSize: 12, fontWeight: '800' },
  resultSummary: { color: '#f0eef0', fontSize: 16, lineHeight: 27, marginTop: 14 },
  resultTags: { flexDirection: 'row', gap: 10, marginTop: 16 },
  resultTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 6, fontSize: 12 },
  resultMeta: { minHeight: 80, flexDirection: 'row', alignItems: 'center', marginTop: 22, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(130,160,180,.2)' },
  metaItem: { flex: 1 },
  metaLabel: { color: '#ddd6d8', fontSize: 12 },
  metaValue: { color: '#fff', fontSize: 12, lineHeight: 18, marginTop: 5 },
  metaDivider: { width: 1, height: 50, backgroundColor: 'rgba(130,160,180,.24)', marginHorizontal: 14 },
  riskPanel: { minHeight: 280, marginTop: 18, padding: 22, flexDirection: 'row', alignItems: 'center' },
  riskCompact: { flexDirection: 'column', alignItems: 'stretch' },
  riskGaugeWrap: { width: 220, alignItems: 'flex-start' },
  gauge: { width: 160, height: 160, marginTop: 12, alignItems: 'center', justifyContent: 'center' },
  gaugeCopy: { position: 'absolute', alignItems: 'center' },
  gaugeValue: { fontSize: 44, lineHeight: 48, fontWeight: '800' },
  gaugeOut: { color: '#ddd6d8', fontSize: 14 },
  riskCopy: { flex: 1, minWidth: 0 },
  riskTitle: { fontSize: 24, fontWeight: '500' },
  riskText: { color: '#eee9eb', fontSize: 15, lineHeight: 23, marginTop: 10 },
  riskScale: { height: 10, borderRadius: 5, flexDirection: 'row', marginTop: 24, position: 'relative', overflow: 'visible' },
  riskScaleGreen: { flex: 1, backgroundColor: C.green, borderTopLeftRadius: 5, borderBottomLeftRadius: 5 },
  riskScaleYellow: { flex: 1, backgroundColor: C.yellow },
  riskScaleRed: { flex: 1, backgroundColor: '#ff304a', borderTopRightRadius: 5, borderBottomRightRadius: 5 },
  riskNeedle: { position: 'absolute', top: -5, width: 4, height: 20, borderRadius: 2, backgroundColor: '#fff' },
  riskLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 },
  riskLabel: { color: '#c5bec1', fontSize: 12 },
  coverageText: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 12 },
  threatPanel: { marginTop: 18, padding: 24 },
  sectionTitle: { color: C.green, fontSize: 18, fontWeight: '700' },
  threatList: { marginTop: 13 },
  threatRow: { minHeight: 94, flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(130,160,180,.16)' },
  threatIcon: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' },
  threatCopy: { flex: 1, minWidth: 0, marginLeft: 16 },
  threatTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  threatDetail: { color: '#c8c0c4', fontSize: 11, lineHeight: 17, marginTop: 4 },
  threatStatus: { width: 130, fontSize: 12, textAlign: 'right', marginLeft: 8 },
  statusCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginLeft: 14 },
  statusMark: { fontSize: 13, fontWeight: '900' },
  communityPanel: { minHeight: 112, marginTop: 18, padding: 20, flexDirection: 'row', alignItems: 'center' },
  communityCompact: { flexWrap: 'wrap' },
  communityIcon: { width: 62, height: 62, borderRadius: 31, borderWidth: 1, borderColor: C.purple, backgroundColor: 'rgba(146,112,255,.1)', alignItems: 'center', justifyContent: 'center' },
  communityCopy: { flex: 1, minWidth: 180, marginLeft: 16 },
  communityTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  communityText: { color: '#cfc6cb', fontSize: 12, lineHeight: 18, marginTop: 5 },
  reportButton: { minWidth: 150, height: 58, borderRadius: 8, borderWidth: 1, borderColor: C.purple, alignItems: 'center', justifyContent: 'center', marginLeft: 15 },
  reportButtonText: { color: C.purple, fontSize: 15, fontWeight: '700' },
  reportPanel: { marginTop: 18, padding: 22 },
  reportSubtitle: { color: C.muted, fontSize: 10, marginTop: 5 },
  draftStatus: { fontSize: 10, fontWeight: '800' },
  reportInput: { minHeight: 120, marginTop: 16, borderWidth: 1, borderColor: '#29445a', borderRadius: 10, backgroundColor: 'rgba(0,7,14,.72)', color: '#fff', padding: 14, fontSize: 13, lineHeight: 20, textAlignVertical: 'top', outlineStyle: 'none' } as any,
  saveButton: { minHeight: 58, marginTop: 14, borderRadius: 9, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#001108', fontSize: 16, fontWeight: '800' },
  feedback: { minHeight: 56, marginTop: 16, borderWidth: 1, borderColor: '#765817', borderRadius: 9, backgroundColor: 'rgba(67,47,5,.25)', padding: 13, justifyContent: 'center' },
  feedbackText: { color: '#f0dda5', fontSize: 11, lineHeight: 17, textAlign: 'center' },
  freezeButton: { minHeight: 62, marginTop: 16, borderWidth: 1, borderColor: C.red, borderRadius: 10, backgroundColor: 'rgba(70,8,16,.45)', alignItems: 'center', justifyContent: 'center' },
  freezeButtonText: { color: C.red, fontSize: 15, fontWeight: '800' },
  bottomNav: { minHeight: 108, marginTop: 22, marginBottom: 6, borderWidth: 1, borderColor: '#183146', borderRadius: 15, backgroundColor: 'rgba(3,13,23,.95)', flexDirection: 'row' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { color: '#c9c2c5', fontSize: 12, marginTop: 6 },
  navActive: { color: C.green },
});
