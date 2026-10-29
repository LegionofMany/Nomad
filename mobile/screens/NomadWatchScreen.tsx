import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import {
  useNomadWatch,
  type NomadWatchEmergencyAction,
  type NomadWatchPlatform,
} from '../nomad';
import {
  C,
  BottomNav,
  NomadGlyph,
  NomadPage,
  Panel,
  PrimaryButton,
  ProgressBar,
  useNomadLayout,
} from '../ui/NomadShell';

type EmergencyOption = {
  action: NomadWatchEmergencyAction;
  title: string;
  subtitle: string;
  icon: 'security' | 'recovery';
  color: string;
};

const emergencyOptions: EmergencyOption[] = [
  { action: 'emergency_lock', title: 'Emergency Lock', subtitle: 'Lock wallet now', icon: 'security', color: C.red },
  { action: 'pause_spending', title: 'Pause Spending', subtitle: 'Pause Travel Pocket', icon: 'recovery', color: C.yellow },
  { action: 'alert_authority', title: 'Alert Authority', subtitle: 'Create local request', icon: 'recovery', color: C.blue },
  { action: 'panic_mode', title: 'Panic Mode', subtitle: 'Full wallet protection', icon: 'security', color: C.purple },
];

const platforms: Array<{ id: NomadWatchPlatform; label: string }> = [
  { id: 'wear_os', label: 'Wear OS' },
  { id: 'watch_os', label: 'watchOS' },
  { id: 'other', label: 'Other' },
];

function WatchLogo({ size = 54 }: { size?: number }) {
  return (
    <Svg accessibilityLabel="Nomad Watch logo" width={size} height={size * 1.2} viewBox="0 0 56 68" fill="none">
      <Path d="M19 2h18l3 13H16L19 2Z" stroke={C.green} strokeWidth="3" />
      <Rect x="10" y="13" width="36" height="42" rx="15" fill="#03120d" stroke={C.green} strokeWidth="3" />
      <Path d="M16 53h24l-3 13H19l-3-13Z" stroke={C.green} strokeWidth="3" />
      <Path d="m20 37 8-13v18l8-13" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WatchArtwork({ size = 196, color = C.green }: { size?: number; color?: string }) {
  const marks = Array.from({ length: 12 }, (_, index) => {
    const angle = (index * Math.PI) / 6;
    const x1 = 70 + Math.sin(angle) * 42;
    const y1 = 92 - Math.cos(angle) * 42;
    const x2 = 70 + Math.sin(angle) * 47;
    const y2 = 92 - Math.cos(angle) * 47;
    return <Path key={index} d={`M${x1} ${y1}L${x2} ${y2}`} stroke={color} strokeWidth="1.4" opacity=".75" />;
  });
  return (
    <Svg accessibilityLabel="Nomad Watch illustration" width={size} height={size * 1.38} viewBox="0 0 140 194" fill="none">
      <Defs>
        <LinearGradient id="strap" x1="38" y1="0" x2="102" y2="194"><Stop stopColor="#26292e" /><Stop offset=".46" stopColor="#050607" /><Stop offset="1" stopColor="#26292e" /></LinearGradient>
        <LinearGradient id="case" x1="14" y1="41" x2="124" y2="148"><Stop stopColor="#62666d" /><Stop offset=".2" stopColor="#111317" /><Stop offset=".78" stopColor="#050607" /><Stop offset="1" stopColor="#4c5057" /></LinearGradient>
      </Defs>
      <Path d="M43 2h54l7 54H36L43 2Z" fill="url(#strap)" stroke="#3c4047" strokeWidth="2" />
      <Path d="M36 137h68l-7 55H43l-7-55Z" fill="url(#strap)" stroke="#3c4047" strokeWidth="2" />
      <Rect x="12" y="38" width="116" height="112" rx="48" fill="url(#case)" stroke="#747982" strokeWidth="2.5" />
      <Rect x="126" y="65" width="8" height="24" rx="3" fill="#30343a" stroke="#646871" />
      <Rect x="126" y="101" width="7" height="17" rx="3" fill="#30343a" stroke="#646871" />
      <Circle cx="70" cy="92" r="52" fill="#020605" stroke="#171b1d" strokeWidth="5" />
      <Circle cx="70" cy="92" r="48" stroke={color} strokeWidth="2" opacity=".8" />
      {marks}
      <SvgText x="70" y="79" fill={color} fontSize="31" fontWeight="800" textAnchor="middle">N</SvgText>
      <SvgText x="70" y="107" fill="#fff" fontSize="22" fontWeight="700" textAnchor="middle">10:24</SvgText>
      <SvgText x="70" y="120" fill="#d9e1e8" fontSize="8" textAnchor="middle">AM</SvgText>
      <Path d="M51 31h38M49 155h42" stroke="#050607" strokeWidth="3" opacity=".55" />
    </Svg>
  );
}

function StatusCircle({ label, value, color, compact }: { label: string; value: string; color: string; compact: boolean }) {
  return (
    <View style={[styles.statusCircle, compact && styles.statusCircleCompact, { borderColor: color }]}>
      <NomadGlyph kind="security" color={color} size={34} />
      <Text style={styles.statusCircleLabel}>{label}</Text>
      <Text style={[styles.statusCircleValue, { color }]}>{value}</Text>
    </View>
  );
}

function ActionButton({ label, kind, color, onPress, disabled = false }: { label: string; kind: 'watch' | 'recovery'; color: string; onPress(): void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.deviceAction, disabled && styles.disabledAction, pressed && styles.pressed]}>
      <NomadGlyph kind={kind} color={disabled ? C.muted2 : color} size={31} />
      <Text style={styles.deviceActionText}>{label}</Text>
    </Pressable>
  );
}

function InfoMetric({ kind, label, value, detail, color = C.green, compact }: { kind: 'travel' | 'recovery' | 'security' | 'watch'; label: string; value: string; detail: string; color?: string; compact: boolean }) {
  return (
    <View style={[styles.infoMetric, compact && styles.infoMetricCompact]}>
      <View style={[styles.infoMetricIcon, { backgroundColor: `${color}13` }]}><NomadGlyph kind={kind} color={color} size={34} /></View>
      <View style={styles.infoMetricCopy}>
        <Text style={styles.infoMetricLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.infoMetricValue}>{value}</Text>
        <Text numberOfLines={1} style={styles.infoMetricDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function SecurityMetric({ kind, label, value, color, compact }: { kind: 'security' | 'watch' | 'recovery'; label: string; value: string; color: string; compact: boolean }) {
  return (
    <View style={[styles.securityMetric, compact && styles.securityMetricCompact]}>
      <View style={[styles.securityIcon, { backgroundColor: `${color}12` }]}><NomadGlyph kind={kind} color={color} size={34} /></View>
      <Text style={styles.securityMetricLabel}>{label}</Text>
      <Text style={[styles.securityMetricValue, { color }]}>{value}</Text>
    </View>
  );
}

function EmergencyTile({ item, onPress, compact }: { item: EmergencyOption; onPress(): void; compact: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.emergencyTile, compact && styles.emergencyTileCompact, pressed && styles.pressed]}>
      <View style={[styles.emergencyIcon, { backgroundColor: `${item.color}12` }]}><NomadGlyph kind={item.icon} color={item.color} size={35} /></View>
      <Text style={[styles.emergencyTitle, { color: item.color }]}>{item.title}</Text>
      <Text style={styles.emergencySubtitle}>{item.subtitle}</Text>
    </Pressable>
  );
}

function CheckBox({ checked, text, onPress }: { checked: boolean; text: string; onPress(): void }) {
  return (
    <Pressable onPress={onPress} style={styles.checkRow}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}><Text style={styles.checkboxMark}>{checked ? '✓' : ''}</Text></View>
      <Text style={styles.checkText}>{text}</Text>
    </Pressable>
  );
}

function AppBottomNav() {
  return <BottomNav active="Nomad Watch" fifth={['', 'Nomad Watch', 'NomadWatch']} />;
}

export default function NomadWatchScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const {
    watch,
    loading,
    error,
    refresh,
    createPairingDraft,
    cancelPairingDraft,
    syncNow,
    findWatch,
    triggerEmergencyAction,
  } = useNomadWatch();
  const [showPairing, setShowPairing] = useState(false);
  const [deviceLabel, setDeviceLabel] = useState('Nomad Watch 1');
  const [platform, setPlatform] = useState<NomadWatchPlatform>('wear_os');
  const [confirmNoSecrets, setConfirmNoSecrets] = useState(false);
  const [confirmDraftOnly, setConfirmDraftOnly] = useState(false);
  const [selectedAction, setSelectedAction] = useState<NomadWatchEmergencyAction | undefined>();
  const [confirmPhoneSide, setConfirmPhoneSide] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [feedback, setFeedback] = useState('');

  const currentDevice = watch.currentDevice;
  const verified = watch.pairingStatus === 'verified_paired' && watch.connected;
  const localDraft = watch.pairingStatus === 'local_pairing_draft';
  const connectionColor = verified ? C.green : localDraft ? C.yellow : C.blue;
  const connectionLabel = verified ? 'Connected' : localDraft ? 'Local Draft' : 'No Verified Watch';
  const selectedEmergency = emergencyOptions.find((item) => item.action === selectedAction);
  const walletReady = watch.walletStatus === 'unlocked';
  const phoneStatus = watch.centralFreezeStatus !== 'none' ? 'Protected' : walletReady ? 'Ready' : watch.walletStatus.replace('_', ' ');
  const authorityPending = watch.authorityRequestStatus === 'pending';
  const lastReceipt = watch.emergencyReceipts[0];

  const unsupported = async (kind: 'find' | 'sync') => {
    try {
      if (kind === 'find') await findWatch();
      else await syncNow();
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'A verified watch provider is required.');
    }
  };

  const beginPairing = () => {
    if (watch.walletStatus === 'no_wallet') {
      navigation.navigate('Lock');
      return;
    }
    if (watch.walletStatus !== 'unlocked') {
      navigation.navigate('UnlockWallet');
      return;
    }
    if (watch.centralFreezeStatus !== 'none') {
      navigation.navigate('EmergencyFreeze');
      return;
    }
    setShowPairing(true);
    setFeedback('');
  };

  const createProfile = async () => {
    try {
      await createPairingDraft({
        label: deviceLabel,
        platform,
        confirmNoWalletSecrets: confirmNoSecrets,
        confirmLocalDraftOnly: confirmDraftOnly,
      });
      setShowPairing(false);
      setConfirmNoSecrets(false);
      setConfirmDraftOnly(false);
      setFeedback('Local pairing profile created. No watch, Bluetooth session, hardware identity, battery, firmware, or sync receipt was verified.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to create the local pairing profile.');
    }
  };

  const removeDraft = async () => {
    if (!currentDevice) return;
    try {
      await cancelPairingDraft(currentDevice.id);
      setFeedback('The local watch draft was removed. No remote unpair command was sent.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to remove the local watch draft.');
    }
  };

  const runEmergencyAction = async () => {
    if (!selectedEmergency) return;
    try {
      const next = await triggerEmergencyAction(selectedEmergency.action);
      const receipt = next.emergencyReceipts[0];
      setSelectedAction(undefined);
      setConfirmPhoneSide(false);
      setConfirmRelease(false);
      setFeedback(receipt?.status === 'partial'
        ? receipt.failureMessage || 'The phone-side protection completed only partially.'
        : `${selectedEmergency.title} completed through phone-side Nomad providers. No command was delivered to a watch.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : `Unable to complete ${selectedEmergency.title.toLowerCase()}.`);
    }
  };

  return (
    <NomadPage maxWidth={940}>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={[styles.backButton, compact && styles.backButtonCompact]}><Text style={[styles.backText, compact && styles.backTextCompact]}>‹</Text></Pressable>
        <WatchLogo size={compact ? 38 : 50} />
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.headerTitle, compact && styles.headerTitleCompact]}>Nomad Watch</Text>
          <Text numberOfLines={2} style={[styles.headerSubtitle, compact && styles.headerSubtitleCompact]}>Your travel. Your wallet. Your watch.</Text>
          {compact ? <View style={[styles.connectionPill, styles.connectionPillCompact, { borderColor: `${connectionColor}66` }]}><View style={[styles.connectionDot, styles.connectionDotCompact, { backgroundColor: connectionColor }]} /><Text numberOfLines={1} style={[styles.connectionPillText, styles.connectionPillTextCompact, { color: connectionColor }]}>{connectionLabel}</Text></View> : null}
        </View>
        {!compact ? <View style={[styles.connectionPill, { borderColor: `${connectionColor}66` }]}><View style={[styles.connectionDot, { backgroundColor: connectionColor }]} /><Text style={[styles.connectionPillText, { color: connectionColor }]}>{connectionLabel}</Text></View> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Open Nomad Watch settings" onPress={() => navigation.navigate('Settings')} style={[styles.settingsButton, compact && styles.settingsButtonCompact]}><NomadGlyph kind="settings" color={C.green} size={compact ? 25 : 32} /></Pressable>
      </View>

      {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void refresh()}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}

      <Panel style={[styles.hero, compact && styles.heroCompact]}>
        <View style={[styles.watchArtworkWrap, compact && styles.watchArtworkCompact]}><WatchArtwork size={compact ? 128 : 186} color={connectionColor} /></View>
        <View style={[styles.heroCopy, compact && styles.heroCopyCompact]}>
          <Text numberOfLines={1} style={styles.deviceName}>{currentDevice?.label || 'No Verified Watch'}</Text>
          <Text style={styles.deviceDetail}>Firmware <Text style={styles.unavailable}>Unavailable</Text></Text>
          <Text style={styles.deviceDetail}>Battery <Text style={styles.unavailable}>Unavailable</Text></Text>
          <Text style={styles.deviceDetail}>Last synced: <Text style={styles.unavailable}>Never</Text></Text>
          <Text style={styles.providerNote}>{localDraft ? 'Local profile only—pairing and hardware identity remain unverified.' : 'Connect an authenticated wearable provider to enable watch telemetry.'}</Text>
        </View>
        <StatusCircle compact={compact} label="Phone Wallet" value={phoneStatus} color={watch.centralFreezeStatus !== 'none' ? C.yellow : walletReady ? C.green : C.blue} />
        <View style={styles.deviceActions}>
          <ActionButton label="Find Watch" kind="watch" color={C.green} disabled={!verified} onPress={() => void unsupported('find')} />
          <ActionButton label="Sync Now" kind="recovery" color={C.green} disabled={!verified} onPress={() => void unsupported('sync')} />
          <ActionButton label={currentDevice ? 'Remove Draft' : 'Pair Watch'} kind="watch" color={currentDevice ? C.red : C.green} onPress={() => currentDevice ? void removeDraft() : beginPairing()} />
        </View>
      </Panel>

      {showPairing && !currentDevice ? (
        <Panel style={styles.pairingPanel}>
          <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>LOCAL PAIRING PROFILE</Text><Text style={styles.sectionHint}>Prepare a secret-free profile without claiming a connected watch.</Text></View><Pressable onPress={() => setShowPairing(false)}><Text style={styles.closeText}>Close</Text></Pressable></View>
          <Text style={styles.fieldLabel}>Watch label</Text>
          <TextInput value={deviceLabel} onChangeText={setDeviceLabel} placeholder="Nomad Watch 1" placeholderTextColor={C.muted2} style={styles.input} />
          <View style={styles.platforms}>{platforms.map((item) => <Pressable key={item.id} onPress={() => setPlatform(item.id)} style={[styles.platform, platform === item.id && styles.platformActive]}><Text style={[styles.platformText, platform === item.id && { color: C.green }]}>{item.label}</Text></Pressable>)}</View>
          <CheckBox checked={confirmNoSecrets} onPress={() => setConfirmNoSecrets((value) => !value)} text="This label contains no wallet password, seed phrase, private key, or Time Set." />
          <CheckBox checked={confirmDraftOnly} onPress={() => setConfirmDraftOnly((value) => !value)} text="I understand this is a local draft—not an authenticated watch connection." />
          <PrimaryButton label={loading ? 'Creating Profile…' : 'Create Local Pairing Profile'} subtitle="No Bluetooth session or signed pairing receipt will be created" icon="⌚" tone="green" disabled={loading || deviceLabel.trim().length < 2 || !confirmNoSecrets || !confirmDraftOnly} onPress={() => void createProfile()} />
        </Panel>
      ) : null}

      <Pressable onPress={() => navigation.navigate('TravelMode')}>
        <Panel style={styles.statusPanel}>
          <View style={styles.panelHeading}><Text style={styles.sectionTitle}>TRAVEL STATUS</Text><Text style={styles.chevron}>›</Text></View>
          <View style={[styles.threeColumn, compact && styles.threeColumnCompact]}>
            <InfoMetric compact={compact} kind="travel" label="Current Region" value={watch.travelRegion} detail={watch.travelSubregion} />
            <InfoMetric compact={compact} kind="travel" label="Travel Mode" value={watch.travelModeLabel} detail="Phone-side status" />
            <InfoMetric compact={compact} kind="recovery" label="Time Set" value={watch.timeSetConfigured ? watch.timeSetLabel : 'Not Set'} detail="Phone-side configuration" />
          </View>
        </Panel>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('SecurityCenter')}>
        <Panel style={styles.statusPanel}>
          <View style={styles.panelHeading}><Text style={styles.sectionTitle}>SECURITY STATUS</Text><Text style={styles.chevron}>›</Text></View>
          <View style={[styles.securityRow, compact && styles.securityRowCompact]}>
            <SecurityMetric compact={compact} kind="security" label="Device Integrity" value="Available" color={C.green} />
            <SecurityMetric compact={compact} kind="watch" label="Connection" value={verified ? 'Verified' : 'Not Paired'} color={verified ? C.green : C.yellow} />
            <SecurityMetric compact={compact} kind="recovery" label="Time Set Lock" value={watch.timeSetConfigured ? 'Configured' : 'Not Set'} color={watch.timeSetConfigured ? C.green : C.yellow} />
            <SecurityMetric compact={compact} kind="watch" label="Watch Lock" value="Unavailable" color={C.muted} />
          </View>
        </Panel>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('TravelMode')}>
        <Panel style={styles.pocketPanel}>
          <View style={styles.panelHeading}><Text style={styles.sectionTitle}>TRAVEL POCKET OVERVIEW</Text><Text style={styles.chevron}>›</Text></View>
          <View style={[styles.pocketContent, compact && styles.pocketContentCompact]}>
            <View style={styles.pocketBalanceWrap}><View style={styles.pocketIcon}><NomadGlyph kind="wallet" color={C.purple} size={42} /></View><View><Text style={styles.pocketLabel}>Travel Pocket Balance</Text><Text style={styles.pocketBalance}>{watch.travelPocketBalance}</Text><Text style={styles.pocketSource}>{(watch.travelDataSource ?? 'unavailable').replace(/_/g, ' ')} • phone-side</Text></View></View>
            <View style={[styles.spendingWrap, compact && styles.spendingWrapCompact]}><Text style={styles.pocketLabel}>Today’s Spending</Text><Text style={styles.spendingValue}>{watch.todaySpending}</Text><ProgressBar value={watch.travelSpentTodayPercent} color={C.purple} height={7} /><Text style={styles.pocketSource}>Daily limit: {watch.dailyLimit}</Text></View>
          </View>
        </Panel>
      </Pressable>

      <Panel style={styles.emergencyPanel}>
        <Text style={[styles.sectionTitle, { color: C.red }]}>EMERGENCY ACTIONS</Text>
        <View style={[styles.emergencyRow, compact && styles.emergencyRowCompact]}>{emergencyOptions.map((item) => <EmergencyTile compact={compact} key={item.action} item={item} onPress={() => { setSelectedAction(item.action); setConfirmPhoneSide(false); setConfirmRelease(false); setFeedback(''); }} />)}</View>
        {selectedEmergency ? (
          <Panel tone="yellow" style={styles.emergencyConfirm}>
            <View style={styles.sectionHeader}><View><Text style={[styles.confirmTitle, { color: selectedEmergency.color }]}>{selectedEmergency.title}</Text><Text style={styles.confirmSubtitle}>This action uses phone-side Nomad providers. No watch command or acknowledgement is available.</Text></View><Pressable onPress={() => setSelectedAction(undefined)}><Text style={styles.closeText}>Close</Text></Pressable></View>
            <CheckBox checked={confirmPhoneSide} onPress={() => setConfirmPhoneSide((value) => !value)} text="I understand this action originates from the Nomad app, not a paired watch." />
            <CheckBox checked={confirmRelease} onPress={() => setConfirmRelease((value) => !value)} text="I understand Emergency Freeze requires the verified release workflow." />
            <PrimaryButton label={loading ? 'Processing…' : `Confirm ${selectedEmergency.title}`} subtitle="A phone-side security receipt will be recorded" icon="!" tone="green" disabled={loading || !watch.canTriggerAppEmergencyActions || !confirmPhoneSide || !confirmRelease} onPress={() => void runEmergencyAction()} />
          </Panel>
        ) : null}
        {lastReceipt ? <Text style={styles.lastReceipt}>Latest receipt: {lastReceipt.actionLabel} • {lastReceipt.status} • watch command delivered: no</Text> : null}
      </Panel>

      <Pressable onPress={() => navigation.navigate(authorityPending ? 'OwnerAuthorityApproval' : 'CreateOwnerAuthority')}>
        <Panel style={styles.authorityPanel}>
          <View style={styles.panelHeading}><Text style={styles.sectionTitle}>OWNER AUTHORITY ALERTS</Text><Text style={styles.viewAll}>View All</Text></View>
          <View style={styles.authorityContent}><View style={styles.authorityIcon}><NomadGlyph kind="recovery" color={authorityPending ? C.yellow : C.green} size={42} /></View><View style={styles.authorityCopy}><Text style={styles.authorityTitle}>{authorityPending ? 'Pending local request' : 'No new alerts'}</Text><Text style={styles.authorityText}>{authorityPending ? 'Review the local Owner Authority approval request. Remote delivery remains unverified.' : 'All clear. You have no pending approvals or alerts.'}</Text></View><Text style={styles.chevron}>›</Text></View>
        </Panel>
      </Pressable>

      {feedback ? <Panel tone={/unavailable|not verified|not connected|failed|partial|cannot|already|no command/i.test(feedback) ? 'yellow' : 'green'} style={styles.feedbackPanel}><Text style={styles.feedbackIcon}>i</Text><Text style={styles.feedbackText}>{feedback}</Text></Panel> : null}
      <Text style={styles.providerBoundary}>Watch pairing, Bluetooth, hardware identity, battery, firmware, sync, Find Watch, remote wipe, and watch-command delivery remain unavailable until authenticated wearable providers are connected.</Text>
      <AppBottomNav />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 17 },
  headerCompact: { minHeight: 74, gap: 6, marginBottom: 10 },
  backButton: { width: 35, height: 50, alignItems: 'center', justifyContent: 'center' },
  backButtonCompact: { width: 27, height: 42 },
  backText: { color: '#fff', fontSize: 43, lineHeight: 46, fontWeight: '200' },
  backTextCompact: { fontSize: 35, lineHeight: 38 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: '#fff', fontSize: 24, lineHeight: 29, fontWeight: '800' },
  headerTitleCompact: { fontSize: 18, lineHeight: 22 },
  headerSubtitle: { color: '#dde3ea', fontSize: 12, marginTop: 3 },
  headerSubtitleCompact: { fontSize: 8, lineHeight: 11, marginTop: 1 },
  connectionPill: { minHeight: 34, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  connectionPillCompact: { alignSelf: 'flex-start', minHeight: 23, marginTop: 4, paddingHorizontal: 7 },
  connectionDot: { width: 9, height: 9, borderRadius: 5, marginRight: 7 },
  connectionDotCompact: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  connectionPillText: { fontSize: 10, fontWeight: '700' },
  connectionPillTextCompact: { fontSize: 7 },
  settingsButton: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center' },
  settingsButtonCompact: { width: 32, height: 38 },
  errorBanner: { minHeight: 55, marginBottom: 14, borderWidth: 1, borderColor: C.red, borderRadius: 12, backgroundColor: 'rgba(90,10,16,.35)', padding: 12, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10 },
  retryText: { color: C.blue, fontSize: 10, fontWeight: '800' },
  hero: { minHeight: 276, padding: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 },
  heroCompact: { minHeight: 0, padding: 12, gap: 10, flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch' },
  watchArtworkWrap: { width: 200, alignItems: 'center', alignSelf: 'stretch', justifyContent: 'center' },
  watchArtworkCompact: { width: '100%', height: 166 },
  heroCopy: { flex: 1, minWidth: 120 },
  heroCopyCompact: { width: '100%', minWidth: 0, paddingHorizontal: 3 },
  deviceName: { color: '#fff', fontSize: 21, fontWeight: '800', marginBottom: 15 },
  deviceDetail: { color: '#eef2f6', fontSize: 11, marginTop: 8 },
  unavailable: { color: C.muted },
  providerNote: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 12 },
  statusCircle: { width: 136, height: 136, borderRadius: 68, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  statusCircleCompact: { alignSelf: 'center', width: 112, height: 112, borderRadius: 56, borderWidth: 2 },
  statusCircleLabel: { color: '#dfe7ee', fontSize: 9, marginTop: 6 },
  statusCircleValue: { fontSize: 12, fontWeight: '900', marginTop: 4, textTransform: 'capitalize' },
  deviceActions: { flexBasis: '100%', flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  deviceAction: { flex: 1, maxWidth: 165, minHeight: 77, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 8 },
  disabledAction: { opacity: .42 },
  deviceActionText: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 7, textAlign: 'center' },
  pairingPanel: { marginTop: 14, padding: 17 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  sectionHint: { color: C.muted, fontSize: 8, marginTop: 4 },
  closeText: { color: C.blue, fontSize: 9, fontWeight: '800' },
  fieldLabel: { color: '#fff', fontSize: 9, fontWeight: '700', marginTop: 15, marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.panel2, color: '#fff', paddingHorizontal: 12, outlineStyle: 'none' } as any,
  platforms: { flexDirection: 'row', gap: 8, marginTop: 10 },
  platform: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: C.border, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  platformActive: { borderColor: C.green, backgroundColor: 'rgba(40,233,120,.07)' },
  platformText: { color: C.muted, fontSize: 9, fontWeight: '800' },
  checkRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', marginTop: 7 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxChecked: { borderColor: C.green, backgroundColor: 'rgba(40,233,120,.15)' },
  checkboxMark: { color: C.green, fontSize: 12, fontWeight: '900' },
  checkText: { flex: 1, color: '#e4eaf0', fontSize: 8, lineHeight: 13 },
  statusPanel: { marginTop: 14, padding: 16 },
  panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900', letterSpacing: .2 },
  chevron: { color: '#d4c9ce', fontSize: 31, fontWeight: '300' },
  threeColumn: { flexDirection: 'row', marginTop: 15 },
  threeColumnCompact: { flexDirection: 'column', marginTop: 10 },
  infoMetric: { flex: 1, minWidth: 0, minHeight: 83, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderRightWidth: 1, borderRightColor: C.borderSoft },
  infoMetricCompact: { width: '100%', minHeight: 74, borderRightWidth: 0, borderBottomWidth: 1, borderBottomColor: C.borderSoft, paddingHorizontal: 4, paddingVertical: 9 },
  infoMetricIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  infoMetricCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  infoMetricLabel: { color: '#d8e0e7', fontSize: 8 },
  infoMetricValue: { color: '#fff', fontSize: 12, fontWeight: '800', marginTop: 4 },
  infoMetricDetail: { color: C.muted, fontSize: 7, marginTop: 4 },
  securityRow: { flexDirection: 'row', marginTop: 13 },
  securityRowCompact: { flexWrap: 'wrap' },
  securityMetric: { flex: 1, minWidth: 0, alignItems: 'center', borderRightWidth: 1, borderRightColor: C.borderSoft, paddingHorizontal: 5 },
  securityMetricCompact: { flexBasis: '50%', minHeight: 116, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  securityIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  securityMetricLabel: { color: '#f1f4f7', fontSize: 8, textAlign: 'center', marginTop: 8 },
  securityMetricValue: { fontSize: 9, fontWeight: '800', textAlign: 'center', marginTop: 5 },
  pocketPanel: { marginTop: 14, padding: 16 },
  pocketContent: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  pocketContentCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 13 },
  pocketBalanceWrap: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  pocketIcon: { width: 65, height: 65, borderRadius: 33, backgroundColor: 'rgba(146,112,255,.13)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  pocketLabel: { color: '#dddfe5', fontSize: 9 },
  pocketBalance: { color: '#fff', fontSize: 19, fontWeight: '800', marginTop: 5 },
  pocketSource: { color: C.muted, fontSize: 7, marginTop: 5, textTransform: 'capitalize' },
  spendingWrap: { flex: 1, minWidth: 0, borderLeftWidth: 1, borderLeftColor: C.borderSoft, paddingLeft: 18 },
  spendingWrapCompact: { borderLeftWidth: 0, borderTopWidth: 1, borderTopColor: C.borderSoft, paddingLeft: 0, paddingTop: 12 },
  spendingValue: { color: '#fff', fontSize: 17, fontWeight: '800', marginVertical: 8 },
  emergencyPanel: { marginTop: 14, padding: 16 },
  emergencyRow: { flexDirection: 'row', gap: 10, marginTop: 13 },
  emergencyRowCompact: { flexWrap: 'wrap' },
  emergencyTile: { flex: 1, minWidth: 0, minHeight: 126, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 12, alignItems: 'center', padding: 9 },
  emergencyTileCompact: { flexBasis: '47%', minWidth: 130 },
  emergencyIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  emergencyTitle: { fontSize: 9, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  emergencySubtitle: { color: '#e0e4e8', fontSize: 7, lineHeight: 11, textAlign: 'center', marginTop: 4 },
  emergencyConfirm: { marginTop: 13, padding: 14 },
  confirmTitle: { fontSize: 13, fontWeight: '900' },
  confirmSubtitle: { color: '#e7dfcf', fontSize: 8, lineHeight: 13, marginTop: 5 },
  lastReceipt: { color: C.muted, fontSize: 7, marginTop: 12 },
  authorityPanel: { marginTop: 14, padding: 16 },
  viewAll: { color: C.green, fontSize: 10, fontWeight: '800' },
  authorityContent: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  authorityIcon: { width: 65, height: 65, borderRadius: 33, backgroundColor: 'rgba(40,233,120,.12)', alignItems: 'center', justifyContent: 'center' },
  authorityCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  authorityTitle: { color: '#fff', fontSize: 12, fontWeight: '800' },
  authorityText: { color: '#e2e7eb', fontSize: 8, lineHeight: 13, marginTop: 4 },
  feedbackPanel: { minHeight: 60, marginTop: 14, padding: 13, flexDirection: 'row', alignItems: 'center' },
  feedbackIcon: { width: 27, height: 27, borderWidth: 2, borderColor: C.blue, color: C.blue, borderRadius: 14, textAlign: 'center', lineHeight: 23, fontSize: 14, fontWeight: '900', marginRight: 11 },
  feedbackText: { flex: 1, color: '#edf2f6', fontSize: 8, lineHeight: 13 },
  providerBoundary: { color: C.muted2, fontSize: 7, lineHeight: 12, textAlign: 'center', marginTop: 14, paddingHorizontal: 12 },
  bottomNav: { minHeight: 92, marginTop: 14, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 15, backgroundColor: 'rgba(2,11,20,.96)', flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden' },
  bottomItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 6 },
  bottomItemActive: { backgroundColor: 'rgba(40,233,120,.035)', borderBottomWidth: 3, borderBottomColor: C.green },
  bottomLabel: { color: C.muted, fontSize: 9, textAlign: 'center' },
  pressed: { opacity: .72 },
});
