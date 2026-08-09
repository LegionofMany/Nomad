import React, { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
  useNomadWatch,
  type NomadWatchCheck,
  type NomadWatchEmergencyAction,
  type NomadWatchEmergencyReceipt,
  type NomadWatchEvent,
  type NomadWatchPlatform,
  type NomadWatchPreference,
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

type EmergencyOption = {
  action: NomadWatchEmergencyAction;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
};

const emergencyOptions: EmergencyOption[] = [
  { action: 'emergency_lock', title: 'Emergency Lock', subtitle: 'Activate Entire Wallet protection and request a wallet-session lock.', icon: '▣', color: C.red },
  { action: 'pause_spending', title: 'Pause Spending', subtitle: 'Activate the Travel Pocket freeze used by top-up and POS workflows.', icon: 'Ⅱ', color: C.yellow },
  { action: 'alert_authority', title: 'Alert Authority', subtitle: 'Create a local Owner Authority request without claiming remote delivery.', icon: '♙', color: C.blue },
  { action: 'panic_mode', title: 'Panic Mode', subtitle: 'Activate Entire Wallet protection. Wallet hiding remains unavailable.', icon: '◇', color: C.purple },
];

const platforms: Array<{ id: NomadWatchPlatform; label: string; detail: string }> = [
  { id: 'wear_os', label: 'Wear OS', detail: 'Android wearable profile draft' },
  { id: 'watch_os', label: 'watchOS', detail: 'Apple wearable profile draft' },
  { id: 'other', label: 'Other', detail: 'Generic wearable profile draft' },
];

function formatDate(value?: string) {
  if (!value) return 'Unavailable';
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Time unavailable';
  return new Date(parsed).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function connectionInfo(status: string) {
  if (status === 'verified_paired') return { color: C.green, tone: 'green' as const, label: 'VERIFIED PAIRED', title: 'Authenticated Watch Connected' };
  if (status === 'local_pairing_draft') return { color: C.yellow, tone: 'yellow' as const, label: 'LOCAL DRAFT', title: 'Watch Pairing Not Verified' };
  return { color: C.blue, tone: 'blue' as const, label: 'NO VERIFIED WATCH', title: 'Wearable Provider Required' };
}

function checkInfo(status: NomadWatchCheck['status']) {
  if (status === 'pass') return { color: C.green, mark: '✓', label: 'PASS' };
  if (status === 'warning') return { color: C.yellow, mark: '!', label: 'REVIEW' };
  if (status === 'fail') return { color: C.red, mark: '×', label: 'FAIL' };
  return { color: C.muted, mark: '—', label: 'UNAVAILABLE' };
}

function receiptInfo(status: NomadWatchEmergencyReceipt['status']) {
  if (status === 'completed') return { color: C.green, label: 'COMPLETED' };
  if (status === 'partial') return { color: C.yellow, label: 'PARTIAL' };
  return { color: C.red, label: 'FAILED' };
}

function DetailRow({ label, value, color = '#fff', last }: { label: string; value: string; color?: string; last?: boolean }) {
  return <View style={[styles.detailRow, !last && styles.rowBorder]}><Text style={styles.detailLabel}>{label}</Text><Text selectable style={[styles.detailValue, { color }]}>{value}</Text></View>;
}

function CheckRow({ item, last }: { item: NomadWatchCheck; last?: boolean }) {
  const info = checkInfo(item.status);
  return <View style={[styles.checkRow, !last && styles.rowBorder]}><View style={[styles.checkMark, { borderColor: info.color, backgroundColor: `${info.color}12` }]}><Text style={[styles.checkMarkText, { color: info.color }]}>{info.mark}</Text></View><View style={styles.checkCopy}><Text style={styles.checkTitle}>{item.label}</Text><Text style={styles.checkDetail}>{item.detail}</Text><Text style={styles.checkProvider}>Provider: {item.provider}</Text></View><Text style={[styles.checkStatus, { color: info.color }]}>{info.label}</Text></View>;
}

function PreferenceRow({ item, loading, onToggle, last }: { item: NomadWatchPreference; loading: boolean; onToggle(): void; last?: boolean }) {
  return <Pressable disabled={loading} onPress={onToggle} style={({ pressed }) => [styles.preferenceRow, !last && styles.rowBorder, pressed && styles.pressed]}><View style={[styles.preferenceToggle, item.enabled && styles.preferenceToggleActive]}><View style={[styles.preferenceKnob, item.enabled && styles.preferenceKnobActive]} /></View><View style={styles.preferenceCopy}><Text style={styles.preferenceTitle}>{item.label}</Text><Text style={styles.preferenceDetail}>{item.detail}</Text></View><Text style={[styles.preferenceState, { color: item.enabled ? C.green : C.muted }]}>{item.enabled ? 'LOCAL ON' : 'LOCAL OFF'}</Text></Pressable>;
}

function ActivityRow({ item, last }: { item: NomadWatchEvent; last?: boolean }) {
  const color = item.severity === 'critical' ? C.red : item.severity === 'warning' ? C.yellow : C.blue;
  return <View style={[styles.activityRow, !last && styles.rowBorder]}><RoundIcon symbol={item.type === 'pairing' ? '⌚' : item.type === 'emergency' ? '!' : item.type === 'preference' ? '≛' : 'i'} color={color} size={42} filled /><View style={styles.activityCopy}><Text style={styles.activityTitle}>{item.title}</Text><Text style={styles.activityDetail}>{item.detail}</Text><Text style={styles.activityTime}>{formatDate(item.timestamp)}</Text></View></View>;
}

function ReceiptRow({ item, last }: { item: NomadWatchEmergencyReceipt; last?: boolean }) {
  const info = receiptInfo(item.status);
  return <View style={[styles.receiptRow, !last && styles.rowBorder]}><RoundIcon symbol={item.action === 'alert_authority' ? '♙' : item.action === 'pause_spending' ? 'Ⅱ' : '❄'} color={info.color} size={44} filled /><View style={styles.receiptCopy}><Text style={styles.receiptTitle}>{item.actionLabel}</Text><Text style={styles.receiptDetail}>Phone-side action • watch delivered: no • central freeze: {item.centralFreezeStatus}</Text><Text style={styles.receiptDetail}>Wallet lock: {item.walletLockRequested ? (item.walletLockConfirmed ? 'confirmed' : 'not confirmed') : 'not requested'} • authority delivery: no</Text>{item.failureMessage ? <Text style={styles.receiptFailure}>{item.failureMessage}</Text> : null}<Text style={styles.receiptTime}>{formatDate(item.completedAt)}</Text></View><Text style={[styles.receiptStatus, { color: info.color }]}>{info.label}</Text></View>;
}

export default function NomadWatchScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { watch, loading, error, refresh, createPairingDraft, cancelPairingDraft, setPreference, syncNow, findWatch, requestRemoteWipe, triggerEmergencyAction, exportPairingSummary } = useNomadWatch();
  const [deviceLabel, setDeviceLabel] = useState('');
  const [platform, setPlatform] = useState<NomadWatchPlatform>('wear_os');
  const [confirmNoSecrets, setConfirmNoSecrets] = useState(false);
  const [confirmDraftOnly, setConfirmDraftOnly] = useState(false);
  const [selectedAction, setSelectedAction] = useState<NomadWatchEmergencyAction>('emergency_lock');
  const [confirmAppSource, setConfirmAppSource] = useState(false);
  const [confirmReleaseBoundary, setConfirmReleaseBoundary] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showAllChecks, setShowAllChecks] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showAllReceipts, setShowAllReceipts] = useState(false);

  const connection = connectionInfo(watch.pairingStatus);
  const currentDevice = watch.currentDevice;
  const visibleChecks = watch.checks.slice(0, showAllChecks ? watch.checks.length : 8);
  const visibleActivity = watch.activity.slice(0, showAllActivity ? 16 : 5);
  const visibleReceipts = watch.emergencyReceipts.slice(0, showAllReceipts ? 12 : 4);
  const selectedEmergency = emergencyOptions.find((item) => item.action === selectedAction) ?? emergencyOptions[0];
  const unavailableChecks = watch.checks.filter((item) => item.status === 'unavailable').length;
  const localPasses = watch.checks.filter((item) => item.status === 'pass').length;
  const canCreateProfile = watch.canCreatePairingDraft && deviceLabel.trim().length >= 2 && confirmNoSecrets && confirmDraftOnly;
  const canExecuteEmergency = watch.canTriggerAppEmergencyActions && confirmAppSource && confirmReleaseBoundary;

  const createProfile = async () => {
    try {
      setFeedback('Creating a local watch pairing draft…');
      await createPairingDraft({ label: deviceLabel, platform, confirmNoWalletSecrets: confirmNoSecrets, confirmLocalDraftOnly: confirmDraftOnly });
      setDeviceLabel(''); setConfirmNoSecrets(false); setConfirmDraftOnly(false);
      setFeedback('Local pairing draft created. No watch, Bluetooth session or hardware identity was verified.');
    } catch (nextError) { setFeedback(nextError instanceof Error ? nextError.message : 'Unable to create the local pairing draft.'); }
  };

  const cancelProfile = async () => {
    if (!currentDevice) return;
    try { await cancelPairingDraft(currentDevice.id); setFeedback('The local pairing draft was cancelled. No remote unpair command was sent.'); }
    catch (nextError) { setFeedback(nextError instanceof Error ? nextError.message : 'Unable to cancel the local watch profile.'); }
  };

  const shareProfile = async () => {
    if (!currentDevice) return;
    try { const summary = await exportPairingSummary(currentDevice.id); await Share.share({ title: 'Nomad Watch Pairing Draft', message: summary }); setFeedback('A secret-free local pairing summary was prepared. It is not a pairing credential or connection receipt.'); }
    catch (nextError) { setFeedback(nextError instanceof Error ? nextError.message : 'Unable to prepare the pairing summary.'); }
  };

  const unsupportedAction = async (kind: 'sync' | 'find' | 'wipe') => {
    try { if (kind === 'sync') await syncNow(); if (kind === 'find') await findWatch(); if (kind === 'wipe') await requestRemoteWipe(); }
    catch (nextError) { setFeedback(nextError instanceof Error ? nextError.message : 'The wearable command provider is unavailable.'); }
  };

  const runEmergencyAction = async () => {
    try {
      setFeedback(`Executing ${selectedEmergency.title.toLowerCase()} from the Nomad app…`);
      const next = await triggerEmergencyAction(selectedAction);
      const receipt = next.emergencyReceipts[0];
      setConfirmAppSource(false); setConfirmReleaseBoundary(false);
      setFeedback(receipt?.status === 'partial' ? receipt.failureMessage || 'The central action completed only partially. Review the emergency receipt.' : `${selectedEmergency.title} completed through phone-side providers. No command was delivered to a watch.`);
    } catch (nextError) { setFeedback(nextError instanceof Error ? nextError.message : `Unable to complete ${selectedEmergency.title.toLowerCase()}.`); }
  };

  return <NomadPage maxWidth={980}>
    <PageHeader title="Nomad Watch" subtitle="Travel, wallet and security evidence for a future authenticated wearable" icon="⌚" color={connection.color} right={<Text style={[styles.connectionBadge, { color: connection.color, borderColor: connection.color }]}>{connection.label}</Text>} />
    {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}

    <Panel tone={connection.tone} style={[styles.hero, compact && styles.heroCompact]}>
      <View style={styles.watchArt}><View style={[styles.watchCase, { borderColor: connection.color }]}><View style={[styles.watchFace, { borderColor: connection.color }]}><Text style={[styles.watchN, { color: connection.color }]}>N</Text><Text style={styles.watchSync}>{watch.connected ? watch.lastSyncedLabel : 'NO RECEIPT'}</Text><Text style={styles.watchSyncLabel}>WATCH SYNC</Text></View></View></View>
      <View style={styles.heroCopy}><Text style={[styles.heroEyebrow, { color: connection.color }]}>WEARABLE CONNECTION</Text><Text style={[styles.heroTitle, { color: connection.color }]}>{connection.title}</Text><Text style={styles.heroText}>{currentDevice ? `${currentDevice.label} is recorded as a ${currentDevice.platformLabel} local draft. Hardware identity, Bluetooth authentication and pairing consent remain unverified.` : 'No authenticated watch is registered. Page 26 can display phone-side wallet evidence and prepare a local profile, but it cannot claim a wearable is connected.'}</Text><View style={styles.heroTags}><Text style={[styles.heroTag, { color: C.red, borderColor: C.red }]}>CONNECTED: NO</Text><Text style={[styles.heroTag, { color: C.muted, borderColor: C.muted }]}>BATTERY: UNAVAILABLE</Text><Text style={[styles.heroTag, { color: C.muted, borderColor: C.muted }]}>FIRMWARE: UNVERIFIED</Text></View></View>
      <View style={[styles.evidenceRing, { borderColor: connection.color }]}><Text style={[styles.evidenceValue, { color: connection.color }]}>{localPasses}</Text><Text style={styles.evidenceLabel}>LOCAL PASSES</Text><Text style={styles.evidenceSub}>{unavailableChecks} unavailable</Text></View>
    </Panel>

    <View style={[styles.metricRow, compact && styles.metricRowCompact]}><Panel style={styles.metricCard}><Text style={styles.metricLabel}>PAIRING RECEIPT</Text><Text style={[styles.metricStatus, { color: C.red }]}>UNAVAILABLE</Text><Text style={styles.metricSub}>No signed wearable enrollment</Text></Panel><Panel style={styles.metricCard}><Text style={styles.metricLabel}>DEVICE TELEMETRY</Text><Text style={[styles.metricStatus, { color: C.muted }]}>NOT CONNECTED</Text><Text style={styles.metricSub}>Battery, firmware and sync unknown</Text></Panel><Panel style={styles.metricCard}><Text style={styles.metricLabel}>WALLET STATE</Text><Text style={[styles.metricStatus, { color: watch.walletStatus === 'unlocked' ? C.green : watch.walletStatus === 'no_wallet' ? C.red : C.yellow }]}>{watch.walletStatus.toUpperCase()}</Text><Text style={styles.metricSub}>Read from the Nomad phone wallet</Text></Panel></View>

    <Panel style={styles.devicePanel}><View style={styles.sectionHeading}><View style={styles.sectionCopy}><Text style={styles.sectionTitle}>WATCH DEVICE REGISTRY</Text><Text style={styles.sectionSub}>Local profile metadata cannot become verified pairing evidence</Text></View><Text style={[styles.sectionBadge, { color: connection.color, borderColor: connection.color }]}>{connection.label}</Text></View>
      {currentDevice ? <><DetailRow label="Profile ID" value={currentDevice.id} /><DetailRow label="Pairing Request" value={currentDevice.requestId} /><DetailRow label="Device Label" value={currentDevice.label} /><DetailRow label="Platform" value={currentDevice.platformLabel} /><DetailRow label="Hardware Identity Verified" value="NO" color={C.red} /><DetailRow label="Authenticated Pairing Receipt" value="NO" color={C.red} /><DetailRow label="Bluetooth Transport" value="NOT CONNECTED" color={C.red} /><DetailRow label="Device Identifier Retained" value="NO" color={C.green} /><DetailRow label="Created" value={formatDate(currentDevice.createdAt)} last /><View style={[styles.actionRow, compact && styles.actionRowCompact]}><Pressable onPress={() => void shareProfile()} style={styles.actionButton}><Text style={styles.actionButtonText}>Share Secret-Free Summary</Text></Pressable><Pressable onPress={() => void unsupportedAction('find')} style={styles.actionButton}><Text style={styles.actionButtonText}>Find Watch • Unavailable</Text></Pressable><Pressable onPress={() => void unsupportedAction('sync')} style={styles.actionButton}><Text style={styles.actionButtonText}>Sync Watch • Unavailable</Text></Pressable><Pressable onPress={() => void unsupportedAction('wipe')} style={[styles.actionButton, { borderColor: C.red }]}><Text style={[styles.actionButtonText, { color: C.red }]}>Remote Wipe • Unavailable</Text></Pressable>{watch.canCancelPairingDraft ? <Pressable onPress={() => void cancelProfile()} style={[styles.actionButton, { borderColor: C.yellow }]}><Text style={[styles.actionButtonText, { color: C.yellow }]}>Cancel Local Draft</Text></Pressable> : null}</View></> : <><Text style={styles.inputLabel}>Watch label</Text><TextInput autoCapitalize="words" onChangeText={(value) => { setDeviceLabel(value); setFeedback(''); }} placeholder="Example: Matthew's travel watch" placeholderTextColor="#708094" style={styles.input} value={deviceLabel} /><Text style={styles.inputLabel}>Wearable platform</Text><View style={[styles.platformRow, compact && styles.platformRowCompact]}>{platforms.map((item) => <Pressable key={item.id} onPress={() => setPlatform(item.id)} style={[styles.platformButton, platform === item.id && styles.platformButtonActive]}><Text style={[styles.platformTitle, platform === item.id && styles.platformTitleActive]}>{item.label}</Text><Text style={styles.platformDetail}>{item.detail}</Text></Pressable>)}</View><Pressable onPress={() => setConfirmNoSecrets((value) => !value)} style={styles.attestationRow}><View style={[styles.checkbox, confirmNoSecrets && styles.checkboxChecked]}><Text style={styles.checkboxMark}>{confirmNoSecrets ? '✓' : ''}</Text></View><Text style={styles.attestationText}>I included no seed phrase, private key, wallet password or Time Set in this profile.</Text></Pressable><Pressable onPress={() => setConfirmDraftOnly((value) => !value)} style={styles.attestationRow}><View style={[styles.checkbox, confirmDraftOnly && styles.checkboxChecked]}><Text style={styles.checkboxMark}>{confirmDraftOnly ? '✓' : ''}</Text></View><Text style={styles.attestationText}>I understand this creates only a local draft—not a connected, authenticated or controllable watch.</Text></Pressable><PrimaryButton label={loading ? 'Checking Watch Registry…' : watch.walletStatus !== 'unlocked' ? 'Unlock Wallet to Create Draft' : watch.centralFreezeStatus !== 'none' ? 'Review Emergency Freeze' : 'Create Local Pairing Draft'} subtitle="No Bluetooth session, hardware identity or signed pairing receipt will be created" icon="⌚" tone="green" disabled={loading || (watch.walletStatus === 'unlocked' && watch.centralFreezeStatus === 'none' && !canCreateProfile)} onPress={() => { if (watch.walletStatus !== 'unlocked') { navigation.navigate(watch.walletStatus === 'no_wallet' ? 'Lock' : 'UnlockWallet'); return; } if (watch.centralFreezeStatus !== 'none') { navigation.navigate('EmergencyFreeze'); return; } void createProfile(); }} /></>}
    </Panel>

    <Panel style={styles.travelPanel}><View style={styles.sectionHeading}><View style={styles.sectionCopy}><Text style={styles.sectionTitle}>TRAVEL & PROTECTED TIME</Text><Text style={styles.sectionSub}>Phone-side source data • watch synchronization unavailable</Text></View><Pressable onPress={() => navigation.navigate('TravelMode')}><Text style={styles.sectionLink}>Travel Pocket ›</Text></Pressable></View><View style={styles.travelGrid}>{[['◎', 'Current Region', watch.travelRegion, watch.travelSubregion], ['✈', 'Travel Mode', watch.travelModeLabel, watch.travelPocket.localCurrency || 'Currency unavailable'], ['◷', 'Protected Time', watch.timeSetLabel, `${watch.timeSetsComplete}/${watch.timeSetsTotal} Time Sets enrolled`], ['⌁', 'Device Timezone', watch.deviceTimezone, 'Phone timezone—not watch telemetry'], ['▤', 'Travel Selected', formatDate(watch.travelActivationAt), `Source: ${(watch.travelDataSource ?? 'unavailable').replace(/_/g, ' ')}`], ['◴', 'Travel Expiry', formatDate(watch.travelExpiryAt), 'Local Travel Pocket configuration']].map(([icon, label, value, detail]) => <View key={label} style={styles.travelMetric}><RoundIcon symbol={icon} color={C.green} size={45} filled /><View style={styles.travelMetricCopy}><Text style={styles.travelMetricLabel}>{label}</Text><Text style={styles.travelMetricValue}>{value}</Text><Text style={styles.travelMetricDetail}>{detail}</Text></View></View>)}</View></Panel>

    <Panel style={styles.pocketPanel}><RoundIcon symbol="▰" color={C.purple} size={66} filled /><View style={styles.pocketCopy}><Text style={styles.sectionTitle}>TRAVEL POCKET OVERVIEW</Text><Text style={styles.pocketLabel}>Phone-side balance</Text><Text style={styles.pocketBalance}>{watch.travelPocketBalance}</Text><Text style={styles.pocketSub}>{watch.travelPocket.localCurrency || 'Currency unavailable'} • {(watch.travelDataSource ?? 'unavailable').replace(/_/g, ' ')}</Text></View><View style={styles.spendingCopy}><Text style={styles.pocketLabel}>Today's spending</Text><Text style={styles.todaySpending}>{watch.todaySpending}</Text><ProgressBar value={watch.travelSpentTodayPercent} color={C.purple} height={7} /><Text style={styles.pocketSub}>{watch.travelSpentTodayPercent}% of {watch.dailyLimit}</Text></View><Pressable onPress={() => navigation.navigate('TravelMode')}><Text style={styles.chevron}>›</Text></Pressable></Panel>

    <Panel style={styles.checkPanel}><Pressable onPress={() => setShowAllChecks((value) => !value)} style={styles.sectionHeading}><View style={styles.sectionCopy}><Text style={styles.sectionTitle}>WATCH SECURITY EVIDENCE</Text><Text style={styles.sectionSub}>Fourteen independent checks • unavailable providers are never marked secure</Text></View><Text style={styles.sectionToggle}>{showAllChecks ? 'Show less −' : `Show all ${watch.checks.length} +`}</Text></Pressable>{visibleChecks.map((item, index) => <CheckRow key={item.id} item={item} last={index === visibleChecks.length - 1} />)}</Panel>

    <Panel style={styles.emergencyPanel}><View style={styles.sectionHeading}><View style={styles.sectionCopy}><Text style={[styles.sectionTitle, { color: C.red }]}>PHONE-SIDE EMERGENCY CONTROLS</Text><Text style={styles.sectionSub}>These controls use Nomad app providers; no watch command is transmitted</Text></View><Pressable onPress={() => navigation.navigate('EmergencyFreeze')}><Text style={[styles.sectionLink, { color: C.red }]}>Page 25 ›</Text></Pressable></View><View style={styles.emergencyGrid}>{emergencyOptions.map((item) => <Pressable key={item.action} onPress={() => { setSelectedAction(item.action); setFeedback(''); }} style={[styles.emergencyCard, selectedAction === item.action && { borderColor: item.color, backgroundColor: `${item.color}10` }]}><RoundIcon symbol={item.icon} color={item.color} size={51} filled /><Text style={[styles.emergencyTitle, { color: item.color }]}>{item.title}</Text><Text style={styles.emergencySub}>{item.subtitle}</Text><Text style={[styles.emergencySelected, { color: item.color }]}>{selectedAction === item.action ? 'SELECTED' : 'SELECT'}</Text></Pressable>)}</View><Panel tone="yellow" style={styles.emergencyReview}><Text style={[styles.reviewTitle, { color: selectedEmergency.color }]}>{selectedEmergency.title}</Text><Text style={styles.reviewText}>{selectedEmergency.subtitle}</Text><Pressable onPress={() => setConfirmAppSource((value) => !value)} style={styles.attestationRow}><View style={[styles.checkbox, confirmAppSource && styles.checkboxChecked]}><Text style={styles.checkboxMark}>{confirmAppSource ? '✓' : ''}</Text></View><Text style={styles.attestationText}>I understand this action originates from the Nomad app, not from a paired watch.</Text></Pressable><Pressable onPress={() => setConfirmReleaseBoundary((value) => !value)} style={styles.attestationRow}><View style={[styles.checkbox, confirmReleaseBoundary && styles.checkboxChecked]}><Text style={styles.checkboxMark}>{confirmReleaseBoundary ? '✓' : ''}</Text></View><Text style={styles.attestationText}>I understand an Emergency Freeze cannot be cleared directly and requires the Page 25 verified-release workflow.</Text></Pressable><PrimaryButton label={loading ? 'Processing Security Action…' : `Execute ${selectedEmergency.title}`} subtitle="A receipt will record central policy, wallet lock and authority-delivery evidence" icon={selectedEmergency.icon} tone="green" disabled={loading || !canExecuteEmergency} onPress={() => void runEmergencyAction()} /></Panel></Panel>

    {visibleReceipts.length ? <Panel style={styles.receiptPanel}><Pressable onPress={() => setShowAllReceipts((value) => !value)} style={styles.sectionHeading}><View style={styles.sectionCopy}><Text style={styles.sectionTitle}>EMERGENCY ACTION RECEIPTS</Text><Text style={styles.sectionSub}>Phone-side outcomes with explicit watch-delivery and wallet-lock evidence</Text></View><Text style={styles.sectionToggle}>{showAllReceipts ? 'Show less −' : 'Show all +'}</Text></Pressable>{visibleReceipts.map((item, index) => <ReceiptRow key={item.id} item={item} last={index === visibleReceipts.length - 1} />)}</Panel> : null}

    <Pressable onPress={() => navigation.navigate(watch.authorityRequestStatus === 'pending' ? 'OwnerAuthorityApproval' : 'CreateOwnerAuthority')}><Panel tone={watch.authorityRequestStatus === 'pending' || watch.authorityRequestStatus === 'approved' ? 'yellow' : 'green'} style={styles.authorityPanel}><RoundIcon symbol="♙" color={watch.authorityRequestStatus === 'pending' || watch.authorityRequestStatus === 'approved' ? C.yellow : C.green} size={57} filled /><View style={styles.authorityCopy}><Text style={styles.authorityTitle}>OWNER AUTHORITY EVIDENCE</Text><Text style={styles.authorityValue}>{watch.ownerAuthorityAlertLabel}</Text><Text style={styles.authoritySub}>No watch-originated delivery, independent identity or signed receipt is verified.</Text></View><Text style={styles.chevron}>›</Text></Panel></Pressable>

    <Panel style={styles.preferencePanel}><View style={styles.sectionHeading}><View style={styles.sectionCopy}><Text style={styles.sectionTitle}>WATCH SETTINGS INTENT</Text><Text style={styles.sectionSub}>Preferences persist locally but cannot reach a wearable</Text></View><Pressable onPress={() => navigation.navigate('Settings')}><Text style={styles.sectionLink}>App Settings ›</Text></Pressable></View>{watch.preferences.map((item, index) => <PreferenceRow key={item.id} item={item} loading={loading} last={index === watch.preferences.length - 1} onToggle={() => void setPreference(item.id, !item.enabled).catch((nextError) => { setFeedback(nextError instanceof Error ? nextError.message : 'Unable to update the local watch preference.'); })} />)}<Panel tone="yellow" style={styles.firmwarePanel}><RoundIcon symbol="⚙" color={C.yellow} size={44} filled /><View style={styles.firmwareCopy}><Text style={styles.firmwareTitle}>Firmware Management Unavailable</Text><Text style={styles.firmwareText}>No wearable manufacturer API, signed firmware manifest, update channel or installed-version attestation is connected.</Text></View></Panel></Panel>

    {visibleActivity.length ? <Panel style={styles.activityPanel}><Pressable onPress={() => setShowAllActivity((value) => !value)} style={styles.sectionHeading}><View style={styles.sectionCopy}><Text style={styles.sectionTitle}>NOMAD WATCH ACTIVITY</Text><Text style={styles.sectionSub}>Pairing drafts, preferences and phone-side emergency records</Text></View><Text style={styles.sectionToggle}>{showAllActivity ? 'Show less −' : 'Show all +'}</Text></Pressable>{visibleActivity.map((item, index) => <ActivityRow key={item.id} item={item} last={index === visibleActivity.length - 1} />)}</Panel> : null}

    {feedback ? <Panel tone={/unable|unavailable|not verified|not connected|failed|partial|cannot|already/i.test(feedback) ? 'yellow' : 'green'} style={styles.feedbackPanel}><Text style={styles.feedbackIcon}>i</Text><Text style={styles.feedbackText}>{feedback}</Text></Panel> : null}
    <View style={[styles.actionRow, compact && styles.actionRowCompact]}><Pressable onPress={() => void refresh().then(() => setFeedback('Phone-side Nomad data refreshed. No watch synchronization occurred.'))} style={styles.actionButton}><Text style={styles.actionButtonText}>Refresh Nomad Data</Text></Pressable><Pressable onPress={() => navigation.navigate('SecurityCenter')} style={styles.actionButton}><Text style={styles.actionButtonText}>Security Center</Text></Pressable><Pressable onPress={() => navigation.navigate('RecoveryCenter')} style={styles.actionButton}><Text style={styles.actionButtonText}>Recovery Center</Text></Pressable></View>
    <Panel style={styles.boundaryPanel}><RoundIcon symbol="i" color={C.blue} size={44} /><Text style={styles.boundaryText}>Production Nomad Watch support requires a verified device registry, authenticated Bluetooth or wearable bridge, hardware identity, signed pairing and sync receipts, genuine battery and firmware telemetry, Find Watch transport, secure unpair and remote wipe, command acknowledgements, encrypted persistent records and independently verified Owner Authority delivery. None of those wearable providers are connected in this build.</Text></Panel>
    <BottomNav active="Watch" items={[["⌂", "Home", "Portfolio"], ["▣", "Wallets", "Wallets"], ["✈", "Travel", "TravelMode"], ["◇", "Security", "SecurityCenter"], ["⌚", "Watch", "NomadWatch"]]} />
  </NomadPage>;
}

const styles = StyleSheet.create({
  connectionBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 8, fontWeight: '900' },
  errorBanner: { minHeight: 60, marginBottom: 14, borderWidth: 1, borderColor: C.red, borderRadius: 11, backgroundColor: 'rgba(80,8,18,.42)', padding: 12, flexDirection: 'row', alignItems: 'center' }, errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 16 }, retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 10 }, retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { minHeight: 235, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 20 }, heroCompact: { flexDirection: 'column', alignItems: 'stretch' }, watchArt: { width: 158, alignItems: 'center' }, watchCase: { width: 118, height: 190, borderRadius: 38, backgroundColor: '#101216', borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, watchFace: { width: 101, height: 101, borderRadius: 51, borderWidth: 3, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }, watchN: { fontSize: 33, fontWeight: '900' }, watchSync: { color: '#fff', fontSize: 9, fontWeight: '800', textAlign: 'center', marginTop: 5 }, watchSyncLabel: { color: C.muted, fontSize: 7, marginTop: 2 }, heroCopy: { flex: 1, minWidth: 0 }, heroEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: .8 }, heroTitle: { fontSize: 23, fontWeight: '900', marginTop: 5 }, heroText: { color: '#eef3f8', fontSize: 11, lineHeight: 18, marginTop: 10 }, heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 }, heroTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 7, fontWeight: '900' }, evidenceRing: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, alignItems: 'center', justifyContent: 'center' }, evidenceValue: { fontSize: 35, fontWeight: '900' }, evidenceLabel: { color: '#fff', fontSize: 8, fontWeight: '900', marginTop: 3 }, evidenceSub: { color: C.muted, fontSize: 7, marginTop: 3 },
  metricRow: { flexDirection: 'row', gap: 12, marginTop: 16 }, metricRowCompact: { flexDirection: 'column' }, metricCard: { flex: 1, minHeight: 104, padding: 15 }, metricLabel: { color: C.muted, fontSize: 8, fontWeight: '800' }, metricStatus: { fontSize: 15, fontWeight: '900', marginTop: 10 }, metricSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 7 },
  devicePanel: { marginTop: 16, padding: 17 }, travelPanel: { marginTop: 16, padding: 17 }, checkPanel: { marginTop: 16, padding: 17 }, emergencyPanel: { marginTop: 16, padding: 17 }, receiptPanel: { marginTop: 16, padding: 17 }, preferencePanel: { marginTop: 16, padding: 17 }, activityPanel: { marginTop: 16, padding: 17 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, sectionCopy: { flex: 1, minWidth: 0 }, sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900', letterSpacing: .3 }, sectionSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 }, sectionLink: { color: C.green, fontSize: 9, fontWeight: '900' }, sectionToggle: { color: C.blue, fontSize: 9, fontWeight: '900' }, sectionBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, fontSize: 8, fontWeight: '900' },
  detailRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }, detailLabel: { flex: 1, color: C.muted, fontSize: 9 }, detailValue: { flex: 1.2, color: '#fff', fontSize: 9, fontWeight: '800', textAlign: 'right' }, rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft }, inputLabel: { color: '#fff', fontSize: 10, fontWeight: '800', marginTop: 17, marginBottom: 7 }, input: { minHeight: 52, borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.panel2, color: '#fff', fontSize: 12, paddingHorizontal: 13, outlineStyle: 'none' } as any,
  platformRow: { flexDirection: 'row', gap: 10 }, platformRowCompact: { flexDirection: 'column' }, platformButton: { flex: 1, minHeight: 76, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12 }, platformButtonActive: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.07)' }, platformTitle: { color: '#fff', fontSize: 11, fontWeight: '900' }, platformTitleActive: { color: C.green }, platformDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 5 }, attestationRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', marginTop: 10 }, checkbox: { width: 23, height: 23, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, checkboxChecked: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.16)' }, checkboxMark: { color: C.green, fontSize: 13, fontWeight: '900' }, attestationText: { flex: 1, color: '#dde5ee', fontSize: 9, lineHeight: 15 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 15 }, actionRowCompact: { flexDirection: 'column' }, actionButton: { flexGrow: 1, minHeight: 43, borderWidth: 1, borderColor: C.border, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, actionButtonText: { color: '#fff', fontSize: 9, fontWeight: '800', textAlign: 'center' },
  travelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 15 }, travelMetric: { flexGrow: 1, flexBasis: 260, minHeight: 82, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.borderSoft, borderRadius: 10, padding: 12 }, travelMetricCopy: { flex: 1, minWidth: 0, marginLeft: 11 }, travelMetricLabel: { color: C.muted, fontSize: 8 }, travelMetricValue: { color: '#fff', fontSize: 12, fontWeight: '800', marginTop: 4 }, travelMetricDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  pocketPanel: { minHeight: 116, marginTop: 16, padding: 15, flexDirection: 'row', alignItems: 'center' }, pocketCopy: { flex: 1, minWidth: 0, marginLeft: 13 }, pocketLabel: { color: C.muted, fontSize: 9, marginTop: 7 }, pocketBalance: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 4 }, pocketSub: { color: C.muted, fontSize: 8, marginTop: 5 }, spendingCopy: { width: 190, borderLeftWidth: 1, borderLeftColor: C.borderSoft, paddingLeft: 17, marginLeft: 12 }, todaySpending: { color: '#fff', fontSize: 17, fontWeight: '900', marginVertical: 7 }, chevron: { color: '#c6b5bd', fontSize: 28, marginLeft: 8 },
  checkRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }, checkMark: { width: 37, height: 37, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, checkMarkText: { fontSize: 16, fontWeight: '900' }, checkCopy: { flex: 1, minWidth: 0, marginLeft: 12 }, checkTitle: { color: '#fff', fontSize: 11, fontWeight: '800' }, checkDetail: { color: '#c9d3df', fontSize: 8, lineHeight: 14, marginTop: 4 }, checkProvider: { color: C.muted, fontSize: 7, marginTop: 4 }, checkStatus: { fontSize: 8, fontWeight: '900', marginLeft: 9, textAlign: 'right' },
  emergencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 15 }, emergencyCard: { flexGrow: 1, flexBasis: 205, minHeight: 145, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13 }, emergencyTitle: { fontSize: 12, fontWeight: '900', marginTop: 9 }, emergencySub: { color: C.muted, fontSize: 8, lineHeight: 14, marginTop: 5 }, emergencySelected: { fontSize: 8, fontWeight: '900', marginTop: 10 }, emergencyReview: { marginTop: 14, padding: 15 }, reviewTitle: { fontSize: 14, fontWeight: '900' }, reviewText: { color: '#e8dfcf', fontSize: 9, lineHeight: 15, marginTop: 6 },
  receiptRow: { minHeight: 112, flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }, receiptCopy: { flex: 1, minWidth: 0, marginLeft: 12 }, receiptTitle: { color: '#fff', fontSize: 11, fontWeight: '900' }, receiptDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 }, receiptFailure: { color: C.yellow, fontSize: 8, lineHeight: 13, marginTop: 4 }, receiptTime: { color: C.muted, fontSize: 7, marginTop: 5 }, receiptStatus: { fontSize: 8, fontWeight: '900', marginLeft: 8 },
  authorityPanel: { minHeight: 100, marginTop: 16, padding: 15, flexDirection: 'row', alignItems: 'center' }, authorityCopy: { flex: 1, minWidth: 0, marginLeft: 13 }, authorityTitle: { color: '#fff', fontSize: 12, fontWeight: '900' }, authorityValue: { color: C.yellow, fontSize: 12, fontWeight: '800', marginTop: 5 }, authoritySub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  preferenceRow: { minHeight: 84, flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }, preferenceToggle: { width: 43, height: 24, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.panel2, padding: 2 }, preferenceToggleActive: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.18)' }, preferenceKnob: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.muted }, preferenceKnobActive: { marginLeft: 17, backgroundColor: C.green }, preferenceCopy: { flex: 1, minWidth: 0, marginLeft: 12 }, preferenceTitle: { color: '#fff', fontSize: 11, fontWeight: '800' }, preferenceDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 }, preferenceState: { fontSize: 8, fontWeight: '900', marginLeft: 8 }, firmwarePanel: { minHeight: 82, marginTop: 13, padding: 13, flexDirection: 'row', alignItems: 'center' }, firmwareCopy: { flex: 1, minWidth: 0, marginLeft: 12 }, firmwareTitle: { color: C.yellow, fontSize: 11, fontWeight: '900' }, firmwareText: { color: '#e6dcc8', fontSize: 8, lineHeight: 14, marginTop: 4 },
  activityRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', paddingVertical: 11 }, activityCopy: { flex: 1, minWidth: 0, marginLeft: 12 }, activityTitle: { color: '#fff', fontSize: 11, fontWeight: '800' }, activityDetail: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 }, activityTime: { color: C.muted, fontSize: 7, marginTop: 5 }, feedbackPanel: { minHeight: 62, marginTop: 16, padding: 13, flexDirection: 'row', alignItems: 'center' }, feedbackIcon: { color: C.blue, fontSize: 18, fontWeight: '900', marginRight: 11 }, feedbackText: { flex: 1, color: '#e8eef5', fontSize: 9, lineHeight: 15 }, boundaryPanel: { minHeight: 92, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' }, boundaryText: { flex: 1, color: '#cbd7e4', fontSize: 8, lineHeight: 14, marginLeft: 12 }, pressed: { opacity: .72 },
});
