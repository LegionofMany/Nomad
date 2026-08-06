import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useNomadAddressSafetyDetail } from '../nomad';
import type {
  ReqriumAddressCheck,
  ReqriumAddressDetailEvent,
  ReqriumScanRecord,
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

function riskColor(risk: 'low' | 'medium' | 'high', hasScan: boolean) {
  if (!hasScan) return C.blue;
  if (risk === 'high') return C.red;
  if (risk === 'medium') return C.yellow;
  return C.green;
}

function riskLabel(risk: 'low' | 'medium' | 'high', hasScan: boolean) {
  if (!hasScan) return 'Scan Required';
  if (risk === 'high') return 'High Local Risk';
  if (risk === 'medium') return 'Manual Review Required';
  return 'Low Local Risk';
}

function toneFor(risk: 'low' | 'medium' | 'high', hasScan: boolean): 'blue' | 'green' | 'yellow' | 'red' {
  if (!hasScan) return 'blue';
  if (risk === 'high') return 'red';
  if (risk === 'medium') return 'yellow';
  return 'green';
}

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

function checkInfo(status: ReqriumAddressCheck['status']) {
  if (status === 'pass') return { color: C.green, mark: '✓', label: 'PASS' };
  if (status === 'warning') return { color: C.yellow, mark: '!', label: 'REVIEW' };
  if (status === 'fail') return { color: C.red, mark: '×', label: 'FAIL' };
  return { color: C.muted, mark: '—', label: 'UNAVAILABLE' };
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

function CheckRow({ item, last }: { item: ReqriumAddressCheck; last?: boolean }) {
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

function HistoryRow({ item, last }: { item: ReqriumScanRecord; last?: boolean }) {
  const color = item.risk === 'high' ? C.red : item.risk === 'medium' ? C.yellow : C.green;
  return (
    <View style={[styles.historyRow, !last && styles.rowBorder]}>
      <RoundIcon symbol="⌕" color={color} size={42} filled />
      <View style={styles.historyCopy}>
        <Text style={styles.historyTitle}>{item.targetLabel}</Text>
        <Text style={styles.historyDetail}>{item.summary}</Text>
        <Text style={styles.historyTime}>{formatDate(item.checkedAt)} • {item.provider.replace(/_/g, ' ')}</Text>
      </View>
      <View style={styles.historyScoreWrap}>
        <Text style={[styles.historyScore, { color }]}>{item.score}</Text>
        <Text style={styles.historyRisk}>{item.risk.toUpperCase()}</Text>
      </View>
    </View>
  );
}

function ActivityRow({ item, last }: { item: ReqriumAddressDetailEvent; last?: boolean }) {
  const color = item.severity === 'critical' ? C.red : item.severity === 'warning' ? C.yellow : C.blue;
  return (
    <View style={[styles.activityRow, !last && styles.rowBorder]}>
      <View style={[styles.activityMark, { borderColor: color, backgroundColor: `${color}12` }]}>
        <Text style={[styles.activityMarkText, { color }]}>{item.type === 'scan' ? '⌕' : item.type === 'report' ? '⚑' : '▣'}</Text>
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityDetail}>{item.detail}</Text>
        <Text style={styles.activityTime}>{formatDate(item.timestamp)}</Text>
      </View>
    </View>
  );
}

export default function AddressSafetyDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { compact } = useNomadLayout();
  const routeAddress = typeof route.params?.address === 'string' ? route.params.address : undefined;
  const {
    detail,
    loading,
    error,
    refresh,
    scanAddress,
    saveContact,
    removeContact,
    createReportDraft,
  } = useNomadAddressSafetyDetail(routeAddress);

  const [address, setAddress] = useState(routeAddress ?? '');
  const [contactLabel, setContactLabel] = useState('');
  const [contactNote, setContactNote] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [showContactEditor, setShowContactEditor] = useState(false);
  const [showReportEditor, setShowReportEditor] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [expandedEvidence, setExpandedEvidence] = useState(true);

  useEffect(() => {
    if (!address && detail.target) setAddress(detail.target);
  }, [address, detail.target]);

  useEffect(() => {
    if (detail.contact) {
      setContactLabel(detail.contact.label);
      setContactNote(detail.contact.note);
    }
  }, [detail.contact]);

  const tint = riskColor(detail.risk, detail.hasRecordedScan);
  const displayScore = Math.max(0, Math.min(100, detail.score));
  const recentActivity = detail.activity.slice(0, 5);
  const currentAddress = detail.target ?? address.trim();
  const canRescan = Boolean(address.trim()) && !loading;
  const summaryCounts = useMemo(() => ({
    pass: detail.checks.filter((item) => item.status === 'pass').length,
    review: detail.checks.filter((item) => item.status === 'warning' || item.status === 'fail').length,
    unavailable: detail.checks.filter((item) => item.status === 'unavailable').length,
  }), [detail.checks]);

  const runScan = async () => {
    try {
      setFeedback('Running Reqrium local address checks…');
      const next = await scanAddress(address);
      setAddress(next.target ?? address.trim());
      setFeedback(`Address scan ${next.scanId ?? 'record'} saved. Remote reputation, sanctions and transaction-graph providers remain unavailable.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to scan this address.');
    }
  };

  const saveAddressContact = async () => {
    try {
      setFeedback('Saving the address label locally…');
      await saveContact(currentAddress, contactLabel, contactNote);
      setShowContactEditor(false);
      setFeedback('Address contact saved locally. The label is not a Reqrium safety endorsement.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to save this address contact.');
    }
  };

  const deleteAddressContact = async () => {
    try {
      setFeedback('Removing the local address label…');
      await removeContact(currentAddress);
      setContactLabel('');
      setContactNote('');
      setShowContactEditor(false);
      setFeedback('The local address label was removed.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to remove this address contact.');
    }
  };

  const saveReportDraft = async () => {
    try {
      setFeedback('Saving a scam-address report draft locally…');
      const result = await createReportDraft(currentAddress, reportNotes);
      setReportNotes('');
      setShowReportEditor(false);
      setFeedback(`Report ${result.draft.id} saved locally. It has not been submitted to a remote authority or reputation provider.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to save the report draft.');
    }
  };

  return (
    <NomadPage maxWidth={960}>
      <PageHeader
        title="Reqrium Address Safety"
        subtitle="Inspect local address evidence before you send"
        icon="R"
        color={tint}
        help
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh(currentAddress)} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <Panel style={styles.inputPanel}>
        <Text style={styles.inputLabel}>WALLET ADDRESS</Text>
        <View style={[styles.inputRow, compact && styles.inputRowCompact]}>
          <Text style={styles.inputIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="Wallet address to scan"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(value) => {
              setAddress(value);
              setFeedback('');
            }}
            placeholder="Enter a Bitcoin, EVM, Hedera, XRPL, Stellar or Base58-compatible address"
            placeholderTextColor="#75859a"
            style={styles.input}
            value={address}
          />
          <Pressable
            disabled={!canRescan}
            onPress={() => void runScan()}
            style={({ pressed }) => [styles.scanButton, pressed && styles.pressed, !canRescan && styles.disabled]}
          >
            <Text style={styles.scanText}>{loading ? 'Checking…' : 'Scan Address'}</Text>
          </Pressable>
        </View>
      </Panel>

      <Panel tone={toneFor(detail.risk, detail.hasRecordedScan)} style={[styles.hero, compact && styles.heroCompact]}>
        <View style={[styles.addressShield, { borderColor: tint }]}>
          <Text style={[styles.shieldMark, { color: tint }]}>{!detail.hasRecordedScan ? '?' : detail.risk === 'low' ? '✓' : '!'}</Text>
          <Text style={styles.shieldBrand}>REQRIUM</Text>
        </View>
        <View style={styles.heroCopy}>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle}>{riskLabel(detail.risk, detail.hasRecordedScan)}</Text>
            <Text style={[styles.scanBadge, { color: tint, borderColor: tint }]}>
              {detail.hasRecordedScan ? 'RECORDED LOCAL SCAN' : 'NO SCAN'}
            </Text>
          </View>
          <Text style={[styles.heroSummary, { color: tint }]}>{detail.summary}</Text>
          <Text selectable style={styles.addressText}>{detail.target ?? 'Enter an address above to begin.'}</Text>
          <View style={styles.assetTags}>
            <Text style={styles.assetTag}>{detail.chainLabel}</Text>
            <Text style={styles.assetTag}>Provider: local heuristics</Text>
            {detail.contact ? <Text style={[styles.assetTag, { borderColor: C.blue, color: C.blue }]}>Contact: {detail.contact.label}</Text> : null}
          </View>
        </View>
      </Panel>

      <View style={[styles.metricRow, compact && styles.metricRowCompact]}>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>LOCAL SCORE</Text>
          <Text style={[styles.metricValue, { color: tint }]}>{detail.hasRecordedScan ? displayScore : '--'}</Text>
          <Text style={styles.metricSub}>Local address checks cap at 85</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>RECORDED CHECKS</Text>
          <Text style={[styles.metricValue, { color: summaryCounts.review ? C.yellow : C.green }]}>{summaryCounts.pass}/{detail.checks.length || 6}</Text>
          <Text style={styles.metricSub}>{summaryCounts.review} review • {summaryCounts.unavailable} unavailable</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>REPORT DRAFTS</Text>
          <Text style={[styles.metricValue, { color: detail.localReportDrafts ? C.yellow : C.muted }]}>{detail.localReportDrafts}</Text>
          <Text style={styles.metricSub}>Local only • not submitted</Text>
        </Panel>
      </View>

      <Panel style={styles.scorePanel}>
        <View style={[styles.scoreRing, { borderColor: tint }]}>
          <Text style={[styles.scoreValue, { color: tint }]}>{detail.hasRecordedScan ? displayScore : '--'}</Text>
          <Text style={styles.scoreOut}>/100</Text>
        </View>
        <View style={styles.scoreCopy}>
          <Text style={[styles.scoreName, { color: tint }]}>{riskLabel(detail.risk, detail.hasRecordedScan)}</Text>
          <Text style={styles.scoreText}>
            Reqrium’s current score measures address structure and local text heuristics only. It does not verify ownership, transaction history, sanctions status or community reputation.
          </Text>
          <ProgressBar value={detail.hasRecordedScan ? displayScore : 0} color={tint} height={9} />
          <View style={styles.scoreScale}><Text style={styles.scaleText}>0</Text><Text style={styles.scaleText}>50</Text><Text style={styles.scaleText}>85 local cap</Text></View>
        </View>
      </Panel>

      <Panel style={styles.checksPanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>ADDRESS SAFETY CHECKS</Text>
            <Text style={styles.sectionSub}>Unavailable providers are never shown as clear or not flagged</Text>
          </View>
          <Text style={[styles.sectionCount, { color: tint }]}>{detail.checks.length || 6}</Text>
        </View>
        {detail.checks.map((item, index) => (
          <CheckRow key={item.id} item={item} last={index === detail.checks.length - 1} />
        ))}
      </Panel>

      <Panel style={styles.evidencePanel}>
        <Pressable onPress={() => setExpandedEvidence((value) => !value)} style={styles.evidenceHeading}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>RECORDED SCAN EVIDENCE</Text>
            <Text style={styles.sectionSub}>Evidence returned by the shared Reqrium scan record</Text>
          </View>
          <Text style={styles.evidenceToggle}>{expandedEvidence ? 'Hide −' : 'Show +'}</Text>
        </Pressable>
        {expandedEvidence ? (
          <>
            {detail.evidence.length ? detail.evidence.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.evidenceRow}>
                <Text style={styles.evidenceBullet}>•</Text>
                <Text style={styles.evidenceText}>{item}</Text>
              </View>
            )) : <Text style={styles.emptyText}>No scan evidence is recorded for the selected address.</Text>}
            <View style={styles.evidenceMeta}>
              <DetailRow label="Scan ID" value={detail.scanId ?? 'Not recorded'} />
              <DetailRow label="Checked" value={formatDate(detail.checkedAt)} />
              <DetailRow label="Provider" value="Reqrium local heuristics" />
              <DetailRow label="Remote Threat Intelligence" value="NOT CONNECTED" color={C.red} last />
            </View>
          </>
        ) : null}
      </Panel>

      <View style={[styles.twoColumn, compact && styles.twoColumnCompact]}>
        <Panel style={styles.actionPanel}>
          <Text style={styles.sectionTitle}>LOCAL ADDRESS CONTACT</Text>
          <Text style={styles.actionText}>
            A phonebook label helps identify an address on this device. It does not certify ownership or safety, and it is stored only in the current in-memory persistence layer.
          </Text>
          {detail.contact && !showContactEditor ? (
            <View style={styles.contactCard}>
              <Text style={styles.contactLabel}>{detail.contact.label}</Text>
              <Text style={styles.contactAddress}>{detail.maskedTarget}</Text>
              <Text style={styles.contactNote}>{detail.contact.note || 'No note added'}</Text>
              <Text style={styles.contactWarning}>Safety endorsement: No</Text>
            </View>
          ) : null}
          {showContactEditor ? (
            <View style={styles.editor}>
              <Text style={styles.fieldLabel}>Contact label</Text>
              <TextInput value={contactLabel} onChangeText={setContactLabel} placeholder="Exchange, customer, vendor or personal label" placeholderTextColor="#718196" style={styles.fieldInput} />
              <Text style={styles.fieldLabel}>Private note</Text>
              <TextInput value={contactNote} onChangeText={setContactNote} multiline placeholder="How did you verify this address?" placeholderTextColor="#718196" style={[styles.fieldInput, styles.noteInput]} />
              <Pressable disabled={loading} onPress={() => void saveAddressContact()} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>{loading ? 'Saving…' : 'Save Local Contact'}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              disabled={!detail.hasRecordedScan || loading}
              onPress={() => setShowContactEditor(true)}
              style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed, (!detail.hasRecordedScan || loading) && styles.disabled]}
            >
              <Text style={styles.outlineButtonText}>{detail.contact ? 'Edit Address Contact' : 'Add to Phonebook'}  ›</Text>
            </Pressable>
          )}
          {detail.contact ? (
            <Pressable disabled={loading} onPress={() => void deleteAddressContact()} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>Remove Local Contact</Text>
            </Pressable>
          ) : null}
        </Panel>

        <Panel style={styles.actionPanel}>
          <Text style={styles.sectionTitle}>REPORT SUSPICIOUS ADDRESS</Text>
          <Text style={styles.actionText}>
            Save observations as a local Reqrium draft. The current build does not submit reports to exchanges, law enforcement, sanctions providers or a community reputation network.
          </Text>
          {showReportEditor ? (
            <View style={styles.editor}>
              <Text style={styles.fieldLabel}>What happened?</Text>
              <TextInput
                value={reportNotes}
                onChangeText={setReportNotes}
                multiline
                placeholder="Describe the suspicious request, transaction or impersonation. Never include private keys or Time Sets."
                placeholderTextColor="#718196"
                style={[styles.fieldInput, styles.reportInput]}
              />
              <Pressable disabled={loading} onPress={() => void saveReportDraft()} style={styles.reportSaveButton}>
                <Text style={styles.reportSaveText}>{loading ? 'Saving…' : 'Save Local Report Draft'}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              disabled={!detail.hasRecordedScan || loading}
              onPress={() => setShowReportEditor(true)}
              style={({ pressed }) => [styles.reportButton, pressed && styles.pressed, (!detail.hasRecordedScan || loading) && styles.disabled]}
            >
              <Text style={styles.reportButtonText}>Create Scam-Address Draft  ›</Text>
            </Pressable>
          )}
          <View style={styles.providerBoundary}>
            <Text style={styles.providerBoundaryLabel}>Remote report submission</Text>
            <Text style={styles.providerBoundaryValue}>NOT CONNECTED</Text>
          </View>
        </Panel>
      </View>

      <Panel style={styles.historyPanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>ADDRESS SCAN HISTORY</Text>
            <Text style={styles.sectionSub}>Matching records from the shared Reqrium safety history</Text>
          </View>
          <Text style={styles.sectionCount}>{detail.scanHistory.length}</Text>
        </View>
        {detail.scanHistory.length ? detail.scanHistory.map((item, index) => (
          <HistoryRow key={item.id} item={item} last={index === detail.scanHistory.length - 1} />
        )) : <Text style={styles.emptyText}>No matching address scans are recorded.</Text>}
      </Panel>

      <Panel style={styles.activityPanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>DETAIL ACTIVITY</Text>
            <Text style={styles.sectionSub}>Local scan, contact and report-draft events</Text>
          </View>
          <Text style={styles.sectionCount}>{detail.activity.length}</Text>
        </View>
        {recentActivity.length ? recentActivity.map((item, index) => (
          <ActivityRow key={item.id} item={item} last={index === recentActivity.length - 1} />
        )) : <Text style={styles.emptyText}>No address-detail activity is recorded.</Text>}
      </Panel>

      {feedback ? (
        <Text style={[styles.feedback, /unable|failed|not connected|not submitted/i.test(feedback) && { color: C.yellow }]}>{feedback}</Text>
      ) : null}

      <PrimaryButton
        label={loading ? 'Checking Address…' : detail.hasRecordedScan ? 'Run Another Address Scan' : 'Run Reqrium Address Scan'}
        subtitle="Refresh local format and text evidence"
        icon="⌕"
        tone="green"
        disabled={!canRescan}
        onPress={() => void runScan()}
      />

      <Panel tone="red" style={styles.warningPanel}>
        <Text style={styles.warningIcon}>⚠</Text>
        <Text style={styles.warningText}>
          A low local score is not proof that an address is safe or belongs to the intended recipient. Verify the full address through a second trusted channel before sending funds.
        </Text>
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
  errorBanner: { minHeight: 48, marginBottom: 10, borderWidth: 1, borderColor: C.red, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  inputPanel: { padding: 15 },
  inputLabel: { color: C.green, fontSize: 11, fontWeight: '900', marginBottom: 8 },
  inputRow: { minHeight: 62, borderWidth: 1, borderColor: C.border, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  inputRowCompact: { flexWrap: 'wrap', paddingVertical: 5 },
  inputIcon: { color: C.green, fontSize: 23, marginRight: 9 },
  input: { flex: 1, minWidth: 230, color: '#fff', fontSize: 13, outlineStyle: 'none' } as any,
  scanButton: { minHeight: 50, minWidth: 112, margin: 4, borderRadius: 7, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 11 },
  scanText: { color: C.bg, fontSize: 10, fontWeight: '900' },
  hero: { minHeight: 190, marginTop: 16, padding: 19, flexDirection: 'row', alignItems: 'center', gap: 19 },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  addressShield: { width: 128, height: 148, borderRadius: 28, borderWidth: 7, backgroundColor: 'rgba(3,22,20,.75)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  shieldMark: { fontSize: 58, fontWeight: '900' },
  shieldBrand: { color: C.muted, fontSize: 7, fontWeight: '900', marginTop: 5 },
  heroCopy: { flex: 1, minWidth: 0 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9 },
  heroTitle: { flex: 1, minWidth: 220, color: '#fff', fontSize: 20, fontWeight: '900' },
  scanBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, fontSize: 8, fontWeight: '900' },
  heroSummary: { fontSize: 11, lineHeight: 18, marginTop: 9 },
  addressText: { color: '#fff', fontSize: 11, lineHeight: 18, marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: C.borderSoft },
  assetTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  assetTag: { color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 8 },
  metricRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  metricRowCompact: { flexDirection: 'column' },
  metricCard: { flex: 1, minHeight: 102, padding: 14 },
  metricLabel: { color: C.muted, fontSize: 8, fontWeight: '900' },
  metricValue: { fontSize: 27, fontWeight: '900', marginTop: 7 },
  metricSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  scorePanel: { minHeight: 156, marginTop: 16, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 18 },
  scoreRing: { width: 115, height: 115, borderRadius: 58, borderWidth: 9, alignItems: 'center', justifyContent: 'center' },
  scoreValue: { fontSize: 34, fontWeight: '900' },
  scoreOut: { color: C.muted, fontSize: 8 },
  scoreCopy: { flex: 1, minWidth: 0 },
  scoreName: { fontSize: 18, fontWeight: '900' },
  scoreText: { color: '#fff', fontSize: 9, lineHeight: 15, marginVertical: 10 },
  scoreScale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  scaleText: { color: C.muted, fontSize: 7 },
  checksPanel: { marginTop: 16, padding: 17 },
  evidencePanel: { marginTop: 16, padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  evidenceHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  sectionCount: { color: C.green, fontSize: 16, fontWeight: '900' },
  evidenceToggle: { color: C.blue, fontSize: 9, fontWeight: '900' },
  checkRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  checkMark: { width: 39, height: 39, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkMarkText: { fontSize: 16, fontWeight: '900' },
  checkCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  checkTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  checkDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  checkProvider: { color: '#7f94aa', fontSize: 7, marginTop: 4 },
  checkStatus: { maxWidth: 88, fontSize: 7, fontWeight: '900', textAlign: 'right', marginLeft: 8 },
  evidenceRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 11 },
  evidenceBullet: { color: C.blue, fontSize: 15, marginRight: 9 },
  evidenceText: { flex: 1, color: '#e3eaf2', fontSize: 9, lineHeight: 15 },
  evidenceMeta: { marginTop: 15, borderTopWidth: 1, borderTopColor: C.borderSoft },
  detailRow: { minHeight: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  detailLabel: { color: C.muted, fontSize: 9 },
  detailValue: { flex: 1, fontSize: 9, fontWeight: '700', textAlign: 'right' },
  twoColumn: { flexDirection: 'row', gap: 12, marginTop: 16 },
  twoColumnCompact: { flexDirection: 'column' },
  actionPanel: { flex: 1, padding: 17 },
  actionText: { color: '#dfe7ef', fontSize: 9, lineHeight: 15, marginTop: 9 },
  contactCard: { marginTop: 13, borderWidth: 1, borderColor: C.blue, borderRadius: 10, padding: 12 },
  contactLabel: { color: '#fff', fontSize: 13, fontWeight: '900' },
  contactAddress: { color: C.blue, fontSize: 8, marginTop: 5 },
  contactNote: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 7 },
  contactWarning: { color: C.yellow, fontSize: 7, fontWeight: '900', marginTop: 7 },
  editor: { marginTop: 12 },
  fieldLabel: { color: C.muted, fontSize: 8, marginTop: 9, marginBottom: 5 },
  fieldInput: { minHeight: 48, borderWidth: 1, borderColor: C.border, borderRadius: 9, backgroundColor: C.panel2, color: '#fff', paddingHorizontal: 12, fontSize: 10, outlineStyle: 'none' } as any,
  noteInput: { minHeight: 76, paddingTop: 11, textAlignVertical: 'top' },
  reportInput: { minHeight: 112, paddingTop: 11, textAlignVertical: 'top' },
  outlineButton: { minHeight: 47, marginTop: 13, borderWidth: 1, borderColor: C.blue, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  outlineButtonText: { color: C.blue, fontSize: 9, fontWeight: '900' },
  saveButton: { minHeight: 46, marginTop: 12, borderRadius: 9, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: C.bg, fontSize: 9, fontWeight: '900' },
  removeButton: { minHeight: 42, marginTop: 10, borderWidth: 1, borderColor: C.red, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  removeButtonText: { color: C.red, fontSize: 8, fontWeight: '900' },
  reportButton: { minHeight: 47, marginTop: 13, borderWidth: 1, borderColor: C.yellow, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  reportButtonText: { color: C.yellow, fontSize: 9, fontWeight: '900' },
  reportSaveButton: { minHeight: 46, marginTop: 12, borderRadius: 9, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' },
  reportSaveText: { color: C.bg, fontSize: 9, fontWeight: '900' },
  providerBoundary: { marginTop: 13, borderWidth: 1, borderColor: C.red, borderRadius: 9, padding: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  providerBoundaryLabel: { color: C.muted, fontSize: 8 },
  providerBoundaryValue: { color: C.red, fontSize: 8, fontWeight: '900' },
  historyPanel: { marginTop: 16, padding: 17 },
  activityPanel: { marginTop: 16, padding: 17 },
  historyRow: { minHeight: 80, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  historyCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  historyTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  historyDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  historyTime: { color: '#75889d', fontSize: 7, marginTop: 4 },
  historyScoreWrap: { alignItems: 'flex-end', marginLeft: 8 },
  historyScore: { fontSize: 20, fontWeight: '900' },
  historyRisk: { color: C.muted, fontSize: 7, marginTop: 2 },
  activityRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  activityMark: { width: 39, height: 39, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  activityMarkText: { fontSize: 15, fontWeight: '900' },
  activityCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  activityTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  activityDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  activityTime: { color: '#75889d', fontSize: 7, marginTop: 4 },
  emptyText: { color: C.muted, fontSize: 9, lineHeight: 15, marginTop: 12 },
  feedback: { color: C.green, fontSize: 10, lineHeight: 15, marginTop: 12 },
  warningPanel: { minHeight: 78, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  warningIcon: { color: C.red, fontSize: 25, marginRight: 12 },
  warningText: { flex: 1, color: '#e7edf5', fontSize: 9, lineHeight: 15 },
  pressed: { opacity: .72 },
  disabled: { opacity: .45 },
});
