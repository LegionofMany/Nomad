import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useNomadAddressSafetyDetail } from '../nomad';
import type { ReqriumAddressCheck } from '../nomad';
import { C, NomadGlyph, NomadPage, Panel, useNomadLayout } from '../ui/NomadShell';

type Risk = 'low' | 'medium' | 'high';

function riskColor(risk: Risk, hasScan: boolean) {
  if (!hasScan) return C.blue;
  if (risk === 'high') return C.red;
  if (risk === 'medium') return C.yellow;
  return C.green;
}

function riskTitle(risk: Risk, hasScan: boolean) {
  if (!hasScan) return 'Scan required';
  if (risk === 'high') return 'High local risk indicators';
  if (risk === 'medium') return 'Manual review required';
  return 'Low local risk indicators';
}

function riskSubtitle(risk: Risk, hasScan: boolean) {
  if (!hasScan) return 'Run a local Reqrium address check';
  if (risk === 'high') return 'Local checks recorded serious warning signals';
  if (risk === 'medium') return 'Local checks found items that need review';
  return 'No local format or embedded-text warnings recorded';
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

function chainChip(label: string) {
  return label.replace(/ address$/i, '').replace(/-compatible$/i, '') || 'Unknown network';
}

function ReqriumGlobeMark({ size = 60 }: { size?: number }) {
  return (
    <Svg accessibilityLabel="Reqrium address safety" width={size} height={size * 1.08} viewBox="0 0 64 70" fill="none">
      <Path d="M32 3 57 14v19c0 18-10 29-25 37C17 62 7 51 7 33V14Z" fill="rgba(5,29,24,.95)" stroke={C.green} strokeWidth="3" />
      <Circle cx="32" cy="31" r="13" stroke={C.green} strokeWidth="2.4" />
      <Path d="M19 31h26M32 18c4 4 6 8 6 13s-2 9-6 13c-4-4-6-8-6-13s2-9 6-13Z" stroke={C.green} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function AddressShieldArtwork({ color, mark }: { color: string; mark: string }) {
  return (
    <View style={styles.artworkWrap}>
      <View style={[styles.artworkHalo, { borderColor: `${color}44` }]} />
      <Svg accessibilityLabel="Address safety result" width={144} height={160} viewBox="0 0 144 160" fill="none">
        <Defs>
          <LinearGradient id="addressShield" x1="24" y1="10" x2="120" y2="148">
            <Stop stopColor={color} stopOpacity=".3" />
            <Stop offset="1" stopColor={color} stopOpacity=".03" />
          </LinearGradient>
        </Defs>
        <Path d="M72 8 126 31v42c0 38-21 64-54 80C39 137 18 111 18 73V31Z" fill="url(#addressShield)" stroke={color} strokeWidth="7" strokeLinejoin="round" />
        {mark === '✓' ? (
          <Path d="m44 79 18 18 39-43" stroke={color} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <Circle cx="72" cy="76" r="28" stroke={color} strokeWidth="5" />
            <Path d="M72 54v28" stroke={color} strokeWidth="7" strokeLinecap="round" />
            <Circle cx="72" cy="94" r="4" fill={color} />
          </>
        )}
      </Svg>
    </View>
  );
}

function Header() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text>
      </Pressable>
      <ReqriumGlobeMark size={compact ? 45 : 55} />
      <View style={styles.headerCopy}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.headerTitle, compact && styles.headerTitleCompact]}>Address Safety Detail</Text>
        <Text style={styles.headerSubtitle}>Reqrium</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Open help" onPress={() => navigation.navigate('Settings')} style={styles.helpButton}>
        <Text style={styles.helpLabel}>Help</Text>
        <Text style={styles.helpQuestion}>?</Text>
      </Pressable>
    </View>
  );
}

function SummaryRow({ label, value, color, last = false }: { label: string; value: string; color?: string; last?: boolean }) {
  return (
    <View style={[styles.summaryRow, !last && styles.rowBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text selectable style={[styles.summaryValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function checkPresentation(status: ReqriumAddressCheck['status']) {
  if (status === 'pass') return { color: C.green, mark: '✓', value: 'Local check passed' };
  if (status === 'warning') return { color: C.yellow, mark: '!', value: 'Review locally' };
  if (status === 'fail') return { color: C.red, mark: '×', value: 'Local warning found' };
  return { color: C.muted, mark: '—', value: 'Not connected' };
}

function RiskCheckRow({ item, last = false }: { item: ReqriumAddressCheck; last?: boolean }) {
  const status = checkPresentation(item.status);
  return (
    <View style={[styles.checkRow, !last && styles.rowBorder]}>
      <View style={[styles.checkIcon, { borderColor: status.color }]}>
        <Text style={[styles.checkMark, { color: status.color }]}>{status.mark}</Text>
      </View>
      <View style={styles.checkCopy}>
        <Text style={styles.checkLabel}>{item.label}</Text>
        <Text style={styles.checkDetail}>{item.detail}</Text>
      </View>
      <View style={styles.checkResult}>
        <Text style={[styles.checkValue, { color: status.color }]}>{status.value}</Text>
        <Text style={styles.checkProvider}>{item.provider}</Text>
      </View>
    </View>
  );
}

const bottomItems = [
  { label: 'Home', route: 'Portfolio', kind: 'home' as const },
  { label: 'Wallets', route: 'Wallets', kind: 'wallet' as const },
  { label: 'Travel', route: 'TravelMode', kind: 'travel' as const },
  { label: 'Security', route: 'SecurityCenter', kind: 'security' as const },
  { label: 'Reqrium', route: 'BlockPagesSafety', kind: 'scan' as const },
];

function PageBottomNav() {
  const navigation = useNavigation<any>();
  const { compact, desktop } = useNomadLayout();
  if (desktop) return null;
  return (
    <View style={[styles.bottomNav, compact && styles.bottomNavCompact]}>
      {bottomItems.map((item) => {
        const active = item.label === 'Reqrium';
        return (
          <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={`Open ${item.label}`} onPress={() => navigation.navigate(item.route)} style={[styles.navItem, compact && styles.navItemCompact, active && styles.navItemActive]}>
            <NomadGlyph kind={item.kind} color={active ? C.green : C.muted} size={compact ? 20 : 25} />
            <Text style={[styles.navLabel, compact && styles.navLabelCompact, active && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AddressSafetyDetailScreen() {
  const route = useRoute<any>();
  const { compact } = useNomadLayout();
  const routeAddress = typeof route.params?.address === 'string' ? route.params.address : undefined;
  const { detail, loading, error, refresh, scanAddress, saveContact, removeContact } = useNomadAddressSafetyDetail(routeAddress);

  const [address, setAddress] = useState(routeAddress ?? '');
  const [showScanner, setShowScanner] = useState(!routeAddress);
  const [showContactEditor, setShowContactEditor] = useState(false);
  const [contactLabel, setContactLabel] = useState('');
  const [contactNote, setContactNote] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!address && detail.target) setAddress(detail.target);
    if (!loading && detail.target) setShowScanner(false);
  }, [address, detail.target, loading]);

  useEffect(() => {
    if (!detail.contact) return;
    setContactLabel(detail.contact.label);
    setContactNote(detail.contact.note);
  }, [detail.contact]);

  const tint = riskColor(detail.risk, detail.hasRecordedScan);
  const currentAddress = detail.target ?? address.trim();
  const displayScore = Math.max(0, Math.min(85, detail.score));
  const hasTarget = Boolean(detail.target);
  const canScan = Boolean(address.trim()) && !loading;
  const localRisk = useMemo(() => {
    if (!detail.hasRecordedScan) return 'SCAN REQUIRED';
    if (detail.risk === 'high') return 'HIGH LOCAL RISK';
    if (detail.risk === 'medium') return 'REVIEW REQUIRED';
    return 'LOW LOCAL RISK';
  }, [detail.hasRecordedScan, detail.risk]);

  const runScan = async () => {
    try {
      setFeedback('Running Reqrium local checks…');
      const next = await scanAddress(address);
      setAddress(next.target ?? address.trim());
      setShowScanner(false);
      setFeedback('Local scan recorded. Remote reputation and compliance providers remain unavailable.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to scan this address.');
    }
  };

  const saveAddressContact = async () => {
    try {
      await saveContact(currentAddress, contactLabel, contactNote);
      setShowContactEditor(false);
      setFeedback('Phonebook entry saved locally. It is a label, not a safety endorsement.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to save this phonebook entry.');
    }
  };

  const deleteAddressContact = async () => {
    try {
      await removeContact(currentAddress);
      setContactLabel('');
      setContactNote('');
      setShowContactEditor(false);
      setFeedback('Local phonebook entry removed.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to remove this phonebook entry.');
    }
  };

  const shareAddress = async () => {
    if (!currentAddress) return;
    try {
      await Share.share({ message: currentAddress });
    } catch {
      setFeedback('The address is selectable if you want to copy it manually.');
    }
  };

  return (
    <NomadPage maxWidth={840}>
      <Header />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh(currentAddress)} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      {showScanner || !hasTarget ? (
        <Panel style={styles.scannerPanel}>
          <View style={styles.scannerHeading}>
            <View>
              <Text style={styles.scannerTitle}>ADDRESS TO INSPECT</Text>
              <Text style={styles.scannerSubtitle}>Local format and embedded-text checks only</Text>
            </View>
            {hasTarget ? <Pressable onPress={() => setShowScanner(false)}><Text style={styles.closeScanner}>Close</Text></Pressable> : null}
          </View>
          <View style={[styles.inputRow, compact && styles.inputRowCompact]}>
            <NomadGlyph kind="scan" color={C.green} size={25} />
            <TextInput
              accessibilityLabel="Wallet address to scan"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(value) => { setAddress(value); setFeedback(''); }}
              placeholder="Enter a wallet address"
              placeholderTextColor="#78889c"
              style={styles.addressInput}
              value={address}
            />
            <Pressable disabled={!canScan} onPress={() => void runScan()} style={[styles.scanButton, !canScan && styles.disabled]}>
              <Text style={styles.scanButtonText}>{loading ? 'Checking…' : 'Run Local Scan'}</Text>
            </Pressable>
          </View>
        </Panel>
      ) : null}

      <Panel tone={detail.hasRecordedScan && detail.risk !== 'low' ? detail.risk === 'high' ? 'red' : 'yellow' : 'green'} style={[styles.heroPanel, compact && styles.heroPanelCompact]}>
        <AddressShieldArtwork color={tint} mark={detail.hasRecordedScan && detail.risk === 'low' ? '✓' : '!'} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>{riskTitle(detail.risk, detail.hasRecordedScan)}</Text>
          <Text style={[styles.heroSubtitle, { color: tint }]}>{riskSubtitle(detail.risk, detail.hasRecordedScan)}</Text>
          <View style={styles.addressRule} />
          <View style={styles.addressRow}>
            <Text selectable numberOfLines={compact ? 3 : 2} style={styles.addressText}>{detail.target ?? 'No address selected'}</Text>
            {hasTarget ? (
              <View style={styles.addressActions}>
                <Pressable accessibilityRole="button" accessibilityLabel="Share address" onPress={() => void shareAddress()} style={styles.miniIconButton}><Text style={styles.miniIcon}>▣</Text></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Scan another address" onPress={() => setShowScanner(true)} style={styles.miniIconButton}><Text style={styles.miniIcon}>⌕</Text></Pressable>
              </View>
            ) : null}
          </View>
          <View style={styles.chips}>
            <View style={styles.coinChip}><Text style={styles.coinSymbol}>R</Text><Text style={styles.chipText}>{chainChip(detail.chainLabel)}</Text></View>
            <View style={styles.plainChip}><Text style={styles.chipText}>Address</Text></View>
            {detail.contact ? <View style={styles.contactChip}><Text style={styles.contactChipText}>{detail.contact.label}</Text></View> : null}
          </View>
        </View>
      </Panel>

      <Panel tone="green" style={styles.summaryPanel}>
        <Text style={styles.sectionTitle}>SAFETY SUMMARY</Text>
        <View style={styles.sectionRule} />
        <SummaryRow label="Overall Risk" value={localRisk} color={tint} />
        <SummaryRow label="Reqrium Local Score" value={detail.hasRecordedScan ? `${displayScore} / 85 local cap` : 'Not scored'} color={detail.hasRecordedScan ? tint : C.muted} />
        <SummaryRow label="Last Scanned" value={formatDate(detail.checkedAt)} />
        <SummaryRow label="Source" value="Reqrium local heuristics" />
        <SummaryRow label="Community Reports" value={detail.localReportDrafts ? `${detail.localReportDrafts} local draft${detail.localReportDrafts === 1 ? '' : 's'} · unsubmitted` : 'Remote provider unavailable'} color={detail.localReportDrafts ? C.yellow : C.muted} last />
      </Panel>

      <Panel tone="green" style={styles.checksPanel}>
        <View style={styles.checksHeading}>
          <Text style={styles.sectionTitle}>RISK CHECKS</Text>
          <Text style={styles.checksBoundary}>LOCAL EVIDENCE</Text>
        </View>
        <View style={styles.sectionRule} />
        {detail.checks.length ? detail.checks.map((item, index) => (
          <RiskCheckRow key={item.id} item={item} last={index === detail.checks.length - 1} />
        )) : <Text style={styles.emptyText}>{loading ? 'Loading address checks…' : 'No address checks are available.'}</Text>}
      </Panel>

      <View style={styles.primaryActions}>
        <View style={styles.remoteButton}>
          <Text style={styles.remoteButtonText}>Remote Reqrium Network</Text>
          <Text style={styles.remoteBadge}>NOT CONNECTED</Text>
        </View>
        <Pressable
          disabled={!detail.hasRecordedScan || loading}
          onPress={() => setShowContactEditor((value) => !value)}
          style={[styles.phonebookButton, (!detail.hasRecordedScan || loading) && styles.disabled]}
        >
          <Text style={styles.phonebookButtonText}>{detail.contact ? 'Edit Phonebook Entry' : 'Add to Phonebook'}</Text>
        </Pressable>
      </View>

      {showContactEditor ? (
        <Panel style={styles.contactPanel}>
          <View style={styles.contactHeading}>
            <View>
              <Text style={styles.contactTitle}>{detail.contact ? 'EDIT LOCAL PHONEBOOK ENTRY' : 'NEW LOCAL PHONEBOOK ENTRY'}</Text>
              <Text style={styles.contactSubtitle}>A local label is not proof of ownership or safety.</Text>
            </View>
            <Pressable onPress={() => setShowContactEditor(false)}><Text style={styles.closeScanner}>Close</Text></Pressable>
          </View>
          <Text style={styles.fieldLabel}>Contact label</Text>
          <TextInput value={contactLabel} onChangeText={setContactLabel} placeholder="Exchange, vendor or personal label" placeholderTextColor="#78889c" style={styles.fieldInput} />
          <Text style={styles.fieldLabel}>Private verification note</Text>
          <TextInput value={contactNote} onChangeText={setContactNote} multiline placeholder="How did you verify this address?" placeholderTextColor="#78889c" style={[styles.fieldInput, styles.noteInput]} />
          <Pressable disabled={loading} onPress={() => void saveAddressContact()} style={[styles.saveContactButton, loading && styles.disabled]}>
            <Text style={styles.saveContactText}>{loading ? 'Saving…' : 'Save Local Contact'}</Text>
          </Pressable>
          {detail.contact ? <Pressable disabled={loading} onPress={() => void deleteAddressContact()} style={styles.removeContactButton}><Text style={styles.removeContactText}>Remove Local Contact</Text></Pressable> : null}
        </Panel>
      ) : null}

      {feedback ? <Text style={[styles.feedback, /unavailable|not connected|warning|unable/i.test(feedback) && { color: C.yellow }]}>{feedback}</Text> : null}

      <Panel style={styles.infoPanel}>
        <View style={styles.infoIcon}><Text style={styles.infoIconText}>i</Text></View>
        <Text style={styles.infoText}>
          Reqrium currently checks address structure and suspicious embedded text on this device. It does not yet use remote reputation, transaction graphs, sanctions lists, community reports or contract analysis. Always verify the full address through a second trusted channel before sending funds.
        </Text>
      </Panel>

      <PageBottomNav />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 76, marginBottom: 17, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 39, minHeight: 55, alignItems: 'flex-start', justifyContent: 'center' },
  backArrow: { color: '#fff', fontSize: 48, lineHeight: 48, fontWeight: '200' },
  headerCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  headerTitle: { color: '#fff', fontSize: 31, fontWeight: '800' },
  headerTitleCompact: { fontSize: 24 },
  headerSubtitle: { color: '#c6d0dd', fontSize: 14, marginTop: 3 },
  helpButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
  helpLabel: { color: C.green, fontSize: 14 },
  helpQuestion: { width: 33, height: 33, borderRadius: 17, borderWidth: 1.5, borderColor: C.green, color: C.green, textAlign: 'center', lineHeight: 30, fontSize: 20, fontWeight: '700' },
  errorBanner: { minHeight: 48, marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 15 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  scannerPanel: { marginBottom: 14, padding: 16 },
  scannerHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 11 },
  scannerTitle: { color: C.green, fontSize: 13, fontWeight: '900' },
  scannerSubtitle: { color: C.muted, fontSize: 9, marginTop: 3 },
  closeScanner: { color: C.blue, fontSize: 10, fontWeight: '800' },
  inputRow: { minHeight: 59, borderWidth: 1, borderColor: C.border, borderRadius: 11, paddingLeft: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputRowCompact: { flexWrap: 'wrap', paddingTop: 8, paddingBottom: 5 },
  addressInput: { flex: 1, minWidth: 210, minHeight: 47, color: '#fff', fontSize: 12, outlineStyle: 'none' } as any,
  scanButton: { minHeight: 47, minWidth: 120, margin: 5, borderRadius: 8, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13 },
  scanButtonText: { color: '#001108', fontSize: 10, fontWeight: '900' },
  disabled: { opacity: .42 },
  heroPanel: { minHeight: 278, padding: 25, flexDirection: 'row', alignItems: 'center', gap: 30 },
  heroPanelCompact: { minHeight: 235, padding: 18, gap: 15 },
  artworkWrap: { width: 155, height: 172, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  artworkHalo: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 1, backgroundColor: 'rgba(0,50,28,.15)' },
  heroCopy: { flex: 1, minWidth: 0 },
  heroTitle: { color: '#fff', fontSize: 25, lineHeight: 31, fontWeight: '800' },
  heroSubtitle: { fontSize: 16, lineHeight: 22, marginTop: 6 },
  addressRule: { height: 1, backgroundColor: 'rgba(255,255,255,.08)', marginTop: 15, marginBottom: 12 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addressText: { flex: 1, color: '#fff', fontSize: 14, lineHeight: 20 },
  addressActions: { flexDirection: 'row', gap: 6 },
  miniIconButton: { width: 35, height: 35, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  miniIcon: { color: '#fff', fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  coinChip: { minHeight: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderRadius: 999, paddingRight: 11, flexDirection: 'row', alignItems: 'center' },
  coinSymbol: { width: 31, height: 31, borderRadius: 16, backgroundColor: C.green, color: '#002610', textAlign: 'center', lineHeight: 31, fontSize: 14, fontWeight: '900', marginRight: 7 },
  plainChip: { minHeight: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderRadius: 999, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  chipText: { color: '#fff', fontSize: 10 },
  contactChip: { minHeight: 32, borderWidth: 1, borderColor: C.blue, borderRadius: 999, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  contactChipText: { color: C.blue, fontSize: 10, fontWeight: '800' },
  summaryPanel: { marginTop: 16, padding: 20, backgroundColor: 'rgba(3,20,22,.96)' },
  sectionTitle: { color: C.green, fontSize: 16, fontWeight: '900', letterSpacing: .2 },
  sectionRule: { height: 1, backgroundColor: 'rgba(255,255,255,.08)', marginTop: 12 },
  summaryRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.075)' },
  summaryLabel: { color: '#d5dee9', fontSize: 13 },
  summaryValue: { flex: 1, color: '#fff', fontSize: 13, textAlign: 'right' },
  checksPanel: { marginTop: 16, padding: 20, backgroundColor: 'rgba(3,20,22,.96)' },
  checksHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  checksBoundary: { color: C.yellow, fontSize: 9, fontWeight: '900' },
  checkRow: { minHeight: 86, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkIcon: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 15, fontWeight: '900' },
  checkCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  checkLabel: { color: '#fff', fontSize: 13, fontWeight: '700' },
  checkDetail: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  checkResult: { width: 123, alignItems: 'flex-end', marginLeft: 10 },
  checkValue: { fontSize: 9, fontWeight: '900', textAlign: 'right' },
  checkProvider: { color: C.muted2, fontSize: 8, textAlign: 'right', marginTop: 4 },
  emptyText: { color: C.muted, fontSize: 10, marginTop: 14 },
  primaryActions: { gap: 12, marginTop: 16 },
  remoteButton: { minHeight: 61, borderWidth: 1, borderColor: C.green, borderRadius: 13, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  remoteButtonText: { color: C.green, fontSize: 17, fontWeight: '700' },
  remoteBadge: { color: C.muted, fontSize: 8, fontWeight: '900', borderWidth: 1, borderColor: C.muted2, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  phonebookButton: { minHeight: 64, borderRadius: 13, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  phonebookButtonText: { color: '#001108', fontSize: 18, fontWeight: '800' },
  contactPanel: { marginTop: 14, padding: 18 },
  contactHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  contactTitle: { color: C.blue, fontSize: 13, fontWeight: '900' },
  contactSubtitle: { color: C.muted, fontSize: 9, marginTop: 4 },
  fieldLabel: { color: C.muted, fontSize: 9, marginTop: 13, marginBottom: 6 },
  fieldInput: { minHeight: 49, borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.panel2, color: '#fff', paddingHorizontal: 12, fontSize: 11, outlineStyle: 'none' } as any,
  noteInput: { minHeight: 76, paddingTop: 11, textAlignVertical: 'top' },
  saveContactButton: { minHeight: 51, marginTop: 13, borderRadius: 10, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  saveContactText: { color: '#001108', fontSize: 11, fontWeight: '900' },
  removeContactButton: { minHeight: 45, marginTop: 9, borderWidth: 1, borderColor: C.red, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  removeContactText: { color: C.red, fontSize: 10, fontWeight: '800' },
  feedback: { color: C.green, fontSize: 10, lineHeight: 15, marginTop: 11, paddingHorizontal: 3 },
  infoPanel: { minHeight: 106, marginTop: 16, padding: 20, flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 43, height: 43, borderRadius: 22, borderWidth: 2, borderColor: C.blue, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  infoIconText: { color: C.blue, fontSize: 23, fontWeight: '800' },
  infoText: { flex: 1, color: '#d4dde8', fontSize: 11, lineHeight: 18 },
  bottomNav: { minHeight: 78, marginTop: 20, borderWidth: 1, borderColor: C.border, borderRadius: 19, backgroundColor: 'rgba(3,13,25,.98)', padding: 6, flexDirection: 'row', alignItems: 'center' },
  bottomNavCompact: { minHeight: 58, borderRadius: 14, padding: 4 },
  navItem: { flex: 1, minHeight: 64, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  navItemCompact: { minHeight: 49, borderRadius: 10 },
  navItemActive: { backgroundColor: 'rgba(40,233,120,.08)' },
  navLabel: { color: C.muted, fontSize: 10, marginTop: 4 },
  navLabelCompact: { fontSize: 8, marginTop: 2 },
  navLabelActive: { color: C.green },
});
