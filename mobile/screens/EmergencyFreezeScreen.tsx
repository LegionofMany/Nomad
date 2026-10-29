import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  useNomadEmergencyFreeze,
  type NomadEmergencyFreezeAsset,
  type NomadEmergencyFreezeEvent,
  type NomadEmergencyFreezeReleaseMethod,
  type NomadFreezeScope,
} from '../nomad';
import { C, NomadGlyph, NomadPage, Panel, useNomadLayout } from '../ui/NomadShell';

type FreezeIcon = 'wallet' | 'travel' | 'assets' | 'authority';
type FreezeOptionItem = {
  scope: NomadFreezeScope;
  title: string;
  subtitle: string;
  icon: FreezeIcon;
  color: string;
  badge: string;
};

const freezeOptions: FreezeOptionItem[] = [
  { scope: 'entire_wallet', title: 'Freeze Entire Wallet', subtitle: 'Lock all outgoing assets and transactions across your Nomad wallet.', icon: 'wallet', color: C.red, badge: 'High Protection' },
  { scope: 'travel_pocket', title: 'Freeze Travel Pocket', subtitle: 'Stop Travel Pocket spending, top-ups, and payment drafts.', icon: 'travel', color: C.blue, badge: 'Medium Protection' },
  { scope: 'specific_assets', title: 'Freeze Specific Assets', subtitle: 'Choose assets to protect while keeping broader wallet access available.', icon: 'assets', color: C.purple, badge: 'Custom' },
  { scope: 'owner_authority_alert', title: 'Notify Owner Authority', subtitle: 'Record an emergency approval request for your Owner Authority.', icon: 'authority', color: C.green, badge: 'Recommended' },
];

function formatDate(value?: string) {
  if (!value) return 'Not recorded';
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Time unavailable';
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function LockShield({ size = 68, color = C.red }: { size?: number; color?: string }) {
  return (
    <Svg accessibilityLabel="Emergency Freeze shield" width={size} height={size * 1.12} viewBox="0 0 90 102" fill="none">
      <Path d="M45 5 80 20v30c0 25-13 40-35 52C23 90 10 75 10 50V20Z" fill={`${color}0c`} stroke={color} strokeWidth="4" />
      <Rect x="29" y="47" width="32" height="27" rx="4" fill={`${color}18`} stroke={color} strokeWidth="3" />
      <Path d="M35 47V36a10 10 0 0 1 20 0v11M45 57v8" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

function EmergencyArtwork() {
  return (
    <View style={styles.emergencyArt}>
      <Svg width="100%" height="100%" viewBox="0 0 220 220" fill="none">
        <Circle cx="110" cy="110" r="96" stroke={C.red} strokeOpacity=".12" />
        <Circle cx="110" cy="110" r="78" stroke={C.red} strokeOpacity=".25" strokeDasharray="2 8" />
        <Circle cx="110" cy="110" r="62" fill="rgba(255,62,69,.08)" stroke={C.red} strokeOpacity=".35" />
        <Path d="M14 110h47M159 110h47M110 14v45M110 161v45M42 42l35 35M143 143l35 35M178 42l-35 35M77 143l-35 35" stroke={C.red} strokeOpacity=".14" />
      </Svg>
      <View style={styles.emergencyLock}>
        <Svg width={92} height={102} viewBox="0 0 92 102" fill="none">
          <Rect x="15" y="42" width="62" height="52" rx="7" fill={C.red} />
          <Path d="M27 42V28a19 19 0 0 1 38 0v14" stroke="#ff6a70" strokeWidth="8" strokeLinecap="round" />
          <Circle cx="46" cy="65" r="7" fill="#651016" /><Path d="M46 71v11" stroke="#651016" strokeWidth="6" strokeLinecap="round" />
        </Svg>
      </View>
    </View>
  );
}

function FreezeGraphic({ kind, color }: { kind: FreezeIcon; color: string }) {
  const stroke = { stroke: color, strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <View style={[styles.optionIcon, { borderColor: `${color}66`, backgroundColor: `${color}0d` }]}>
      <Svg width={62} height={62} viewBox="0 0 72 72" fill="none">
        {kind === 'wallet' ? <><Path d="M10 22h42a9 9 0 0 1 9 9v26H10a8 8 0 0 1-8-8V20a8 8 0 0 1 8-8h37v10" {...stroke} /><Path d="M46 34h19v14H46a7 7 0 0 1 0-14Z" {...stroke} /><Circle cx="50" cy="41" r="2" fill={color} /></> : null}
        {kind === 'travel' ? <><Path d="M12 25h48v32H12Z" {...stroke} /><Path d="M18 25v-7h36v7M28 18v-6h16v6M12 39c9 6 15 4 24 0 9 4 15 6 24 0" {...stroke} /></> : null}
        {kind === 'assets' ? <><Circle cx="20" cy="22" r="13" {...stroke} /><Circle cx="51" cy="26" r="13" {...stroke} /><Circle cx="22" cy="52" r="13" {...stroke} /><Path d="M17 22h6M20 16v12M48 19l6 14M45 31h12M16 52h12M22 46v12" {...stroke} /></> : null}
        {kind === 'authority' ? <><Circle cx="35" cy="20" r="10" {...stroke} /><Path d="M15 58c1-18 8-27 20-27s19 9 20 27Z" {...stroke} /><Path d="M55 8h9v9M64 8l-9 9" {...stroke} /></> : null}
      </Svg>
      <View style={styles.snowBadge}><Text style={styles.snowText}>{kind === 'authority' ? '♧' : '❄'}</Text></View>
    </View>
  );
}

function Header() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
      <View style={styles.headerShield}><LockShield size={62} /></View>
      <View style={styles.headerCopy}><Text style={styles.headerTitle}>Emergency Freeze</Text><Text style={styles.headerSubtitle}>Protect your assets instantly</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Emergency Freeze help" onPress={() => navigation.navigate('SecurityCenter')} style={styles.helpButton}><Text style={styles.helpLabel}>Help</Text><Text style={styles.helpCircle}>?</Text></Pressable>
    </View>
  );
}

function FreezeOption({ item, selected, active, disabled, onPress }: { item: FreezeOptionItem; selected: boolean; active: boolean; disabled: boolean; onPress(): void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={item.title} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.option, selected && { borderColor: item.color, backgroundColor: `${item.color}08` }, disabled && styles.disabled, pressed && styles.pressed]}>
      <FreezeGraphic kind={item.icon} color={item.color} />
      <View style={styles.optionCopy}><Text style={styles.optionTitle}>{item.title}</Text><Text style={styles.optionSubtitle}>{item.subtitle}</Text></View>
      <View style={styles.optionRight}><Text style={[styles.optionBadge, { color: item.color, borderColor: `${item.color}55`, backgroundColor: `${item.color}0c` }]}>{active ? 'Active' : item.badge}</Text><Text style={[styles.chevron, { color: item.color }]}>{selected ? '✓' : '›'}</Text></View>
    </Pressable>
  );
}

function AssetRow({ asset, selected, last, onPress }: { asset: NomadEmergencyFreezeAsset; selected: boolean; last: boolean; onPress(): void }) {
  return (
    <Pressable onPress={onPress} style={[styles.assetRow, !last && styles.rowDivider]}>
      <View style={[styles.checkbox, selected && styles.checkboxActive]}><Text style={styles.checkboxText}>{selected ? '✓' : ''}</Text></View>
      <View style={styles.assetCopy}><Text style={styles.assetTitle}>{asset.symbol} · {asset.name}</Text><Text style={styles.assetSubtitle}>{asset.balance} · {asset.network || asset.chainId || 'Network unavailable'}</Text></View>
      <Text style={[styles.assetState, selected && { color: C.purple }]}>{selected ? 'INCLUDED' : 'SELECT'}</Text>
    </Pressable>
  );
}

function ActivityItem({ item, last }: { item: NomadEmergencyFreezeEvent; last: boolean }) {
  const color = item.severity === 'critical' ? C.red : item.severity === 'warning' ? C.yellow : C.blue;
  return (
    <View style={[styles.activityItem, !last && styles.rowDivider]}>
      <View style={[styles.activityIcon, { backgroundColor: `${color}15` }]}><Text style={[styles.activityIconText, { color }]}>{item.type === 'release_request' ? '↺' : item.type === 'alert' ? '♙' : '❄'}</Text></View>
      <View style={styles.activityCopy}><Text style={styles.activityTitle}>{item.title}</Text><Text style={styles.activityDetail}>{item.detail}</Text><Text style={styles.activityTime}>{formatDate(item.timestamp)}</Text></View>
      <LockShield size={37} color={color} />
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
      {items.map((item) => {
        const active = item.label === 'Security';
        return <Pressable key={item.label} onPress={() => navigation.navigate(item.route)} style={styles.navItem}><NomadGlyph kind={item.kind} color={active ? C.green : '#d4cdd0'} size={34} /><Text style={[styles.navLabel, active && styles.navActive]}>{item.label}</Text></Pressable>;
      })}
      <Pressable onPress={() => navigation.navigate('Settings')} style={styles.navItem}><Text style={styles.moreDots}>•••</Text><Text style={styles.navLabel}>More</Text></Pressable>
    </View>
  );
}

export default function EmergencyFreezeScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { freeze, loading, error, refresh, activateFreeze, requestRelease } = useNomadEmergencyFreeze();

  const [selectedScope, setSelectedScope] = useState<NomadFreezeScope | undefined>();
  const [selectedAssetKeys, setSelectedAssetKeys] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [confirmNoSecrets, setConfirmNoSecrets] = useState(false);
  const [confirmReleaseBoundary, setConfirmReleaseBoundary] = useState(false);
  const [releaseMethod, setReleaseMethod] = useState<NomadEmergencyFreezeReleaseMethod>('time_sets');
  const [releaseReason, setReleaseReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showAllActivity, setShowAllActivity] = useState(false);

  const currentIncident = freeze.currentIncident;
  const centralActive = freeze.centralSecurity.freezeStatus !== 'none';
  const activeScope = freeze.activeScope;
  const selectedOption = freezeOptions.find((item) => item.scope === selectedScope);
  const visibleActivity = freeze.activity.slice(0, showAllActivity ? 14 : 4);

  useEffect(() => {
    if (activeScope && activeScope !== 'owner_authority_alert') setSelectedScope(activeScope);
  }, [activeScope]);

  const activationAllowed = !centralActive || selectedScope === 'owner_authority_alert' || (selectedScope === 'entire_wallet' && activeScope !== 'entire_wallet');
  const hasAssets = selectedScope !== 'specific_assets' || selectedAssetKeys.length > 0;
  const canActivate = Boolean(selectedScope)
    && freeze.canActivateFreeze
    && activationAllowed
    && reason.trim().length >= 8
    && hasAssets
    && confirmNoSecrets
    && confirmReleaseBoundary;

  const toggleAsset = (key: string) => {
    setSelectedAssetKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
    setFeedback('');
  };

  const handleActivate = async () => {
    if (!selectedScope || !selectedOption) return;
    if (!freeze.canActivateFreeze) {
      navigation.navigate('Lock');
      return;
    }
    try {
      setFeedback(`Activating ${selectedOption.title.toLowerCase()}…`);
      const next = await activateFreeze({ scope: selectedScope, selectedAssetKeys, reason });
      const incident = next.currentIncident;
      setReason('');
      setSelectedAssetKeys([]);
      setConfirmNoSecrets(false);
      setConfirmReleaseBoundary(false);
      setFeedback(selectedScope === 'owner_authority_alert'
        ? 'A local Owner Authority alert and approval request were recorded. Remote delivery is not confirmed.'
        : incident?.scope === 'entire_wallet' && !incident.walletLockConfirmed
          ? 'The central freeze is active, but the connected wallet-session lock was not confirmed.'
          : `${incident?.scopeLabel || 'Emergency'} protection is recorded. Direct release remains disabled.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to activate emergency protection.');
    }
  };

  const handleRelease = async () => {
    try {
      await requestRelease(releaseMethod, releaseReason);
      setReleaseReason('');
      setFeedback(releaseMethod === 'owner_authority'
        ? 'A local Owner Authority release request is pending. Remote delivery and signed approval remain unverified.'
        : 'Time Set verification was selected. The freeze remains active until verified evidence is consumed.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to create the verified release request.');
    }
  };

  return (
    <NomadPage maxWidth={900}>
      <Header />

      {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}

      <Panel tone="red" style={[styles.hero, compact && styles.heroCompact]}>
        <EmergencyArtwork />
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>{centralActive ? 'Emergency Freeze Active' : 'Emergency Protection'}</Text>
          <Text style={styles.heroText}>{centralActive ? `${freezeOptions.find((item) => item.scope === activeScope)?.title || 'Emergency protection'} is active. Release requires verified Time Set or Owner Authority evidence.` : 'Freeze your wallet or assets if your device is lost, stolen, or compromised. Release requires verified Time Sets or Owner Authority evidence.'}</Text>
          <View style={styles.heroWarning}><Text style={styles.warningIcon}>△</Text><Text style={styles.warningText}>{centralActive ? 'The freeze remains active until verified release evidence is consumed.' : 'Frozen actions cannot be undone immediately.'}</Text></View>
        </View>
      </Panel>

      <Text style={styles.promptTitle}>What would you like to freeze?</Text>
      <View style={styles.optionsList}>
        {freezeOptions.map((item) => {
          const disabled = loading || (centralActive && item.scope !== 'owner_authority_alert' && !(item.scope === 'entire_wallet' && activeScope !== 'entire_wallet'));
          return <FreezeOption key={item.scope} item={item} selected={selectedScope === item.scope} active={centralActive && activeScope === item.scope} disabled={disabled} onPress={() => { setSelectedScope(item.scope); setFeedback(''); }} />;
        })}
      </View>

      {selectedOption && (!centralActive || selectedScope === 'owner_authority_alert' || (selectedScope === 'entire_wallet' && activeScope !== 'entire_wallet')) ? (
        <Panel style={styles.reviewPanel}>
          <View style={styles.reviewHeading}><FreezeGraphic kind={selectedOption.icon} color={selectedOption.color} /><View style={styles.reviewCopy}><Text style={[styles.reviewTitle, { color: selectedOption.color }]}>{selectedOption.title}</Text><Text style={styles.reviewSubtitle}>Review and confirm this emergency action.</Text></View><Pressable onPress={() => setSelectedScope(undefined)} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable></View>

          {selectedScope === 'specific_assets' ? (
            <View style={styles.assetsPanel}>
              <Text style={styles.fieldLabel}>SELECT WALLET ASSETS</Text>
              {freeze.walletAssets.length ? freeze.walletAssets.map((asset, index) => <AssetRow key={asset.key} asset={asset} selected={selectedAssetKeys.includes(asset.key)} last={index === freeze.walletAssets.length - 1} onPress={() => toggleAsset(asset.key)} />) : <Text style={styles.emptyAssets}>No wallet assets are available. Choose Entire Wallet protection or restore the wallet connection.</Text>}
              <Text style={styles.assetBoundary}>Specific-asset policy is recorded locally; connected transaction adapters may apply a broader protective block.</Text>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>EMERGENCY REASON</Text>
          <TextInput accessibilityLabel="Emergency freeze reason" multiline onChangeText={(value) => { setReason(value); setFeedback(''); }} placeholder="Example: Device lost during travel; block outgoing actions while ownership is verified." placeholderTextColor="#718096" style={styles.reasonInput} value={reason} />
          <Text style={styles.secretWarning}>Never include a seed phrase, private key, wallet password, or Time Set.</Text>

          <Pressable onPress={() => setConfirmNoSecrets((value) => !value)} style={styles.confirmRow}><View style={[styles.checkbox, confirmNoSecrets && styles.checkboxActive]}><Text style={styles.checkboxText}>{confirmNoSecrets ? '✓' : ''}</Text></View><Text style={styles.confirmText}>I included no wallet secrets in this emergency reason.</Text></Pressable>
          <Pressable onPress={() => setConfirmReleaseBoundary((value) => !value)} style={styles.confirmRow}><View style={[styles.checkbox, confirmReleaseBoundary && styles.checkboxActive]}><Text style={styles.checkboxText}>{confirmReleaseBoundary ? '✓' : ''}</Text></View><Text style={styles.confirmText}>I understand activation is immediate and release requires separate verification.</Text></Pressable>

          <Pressable disabled={loading || !canActivate} onPress={() => void handleActivate()} style={[styles.activateButton, { backgroundColor: selectedOption.color }, (loading || !canActivate) && styles.disabled]}><Text style={styles.activateText}>{loading ? 'Recording Protection…' : selectedScope === 'owner_authority_alert' ? 'Record Authority Alert' : `Activate ${selectedOption.title}`}</Text></Pressable>
        </Panel>
      ) : null}

      <Panel style={styles.infoPanel}>
        <Text style={styles.infoIcon}>i</Text>
        <View style={styles.infoCopy}><Text style={styles.infoText}>Outgoing transactions, swaps, and top-ups that consume the selected policy are blocked. Chain-level and incoming-fund enforcement depend on connected adapters.</Text><Pressable onPress={() => navigation.navigate('SecurityCenter')}><Text style={styles.learnText}>Learn more about Emergency Freeze  ›</Text></Pressable></View>
      </Panel>

      {centralActive && currentIncident ? (
        <Panel tone="yellow" style={styles.releasePanel}>
          <View style={styles.releaseHeading}><View><Text style={styles.releaseTitle}>REQUEST VERIFIED RELEASE</Text><Text style={styles.releaseSubtitle}>{currentIncident.scopeLabel} · activated {formatDate(currentIncident.activatedAt)}</Text></View><Text style={styles.activeBadge}>FREEZE STAYS ACTIVE</Text></View>
          {freeze.blockedActions.length ? <View style={styles.blockedList}>{freeze.blockedActions.map((item) => <View key={item} style={styles.blockedRow}><Text style={styles.blockedMark}>×</Text><Text style={styles.blockedText}>{item}</Text></View>)}</View> : null}
          <View style={[styles.releaseMethods, compact && styles.releaseMethodsCompact]}>
            <Pressable onPress={() => setReleaseMethod('time_sets')} style={[styles.releaseMethod, releaseMethod === 'time_sets' && styles.releaseMethodActive]}><NomadGlyph kind="recovery" color={releaseMethod === 'time_sets' ? C.green : C.muted} size={35} /><Text style={styles.releaseMethodTitle}>Time Set Verification</Text><Text style={styles.releaseMethodText}>Continue through protected recovery verification.</Text></Pressable>
            <Pressable onPress={() => setReleaseMethod('owner_authority')} style={[styles.releaseMethod, releaseMethod === 'owner_authority' && styles.releaseMethodActive]}><FreezeGraphic kind="authority" color={releaseMethod === 'owner_authority' ? C.green : C.muted} /><Text style={styles.releaseMethodTitle}>Owner Authority</Text><Text style={styles.releaseMethodText}>Record an independent approval request.</Text></Pressable>
          </View>
          <TextInput accessibilityLabel="Emergency freeze release reason" multiline onChangeText={(value) => { setReleaseReason(value); setFeedback(''); }} placeholder="Explain why release review is being requested. Do not include recovery secrets." placeholderTextColor="#718096" style={styles.releaseInput} value={releaseReason} />
          <Pressable disabled={loading || releaseReason.trim().length < 8} onPress={() => void handleRelease()} style={[styles.releaseButton, (loading || releaseReason.trim().length < 8) && styles.disabled]}><Text style={styles.releaseButtonText}>{loading ? 'Recording Request…' : 'Request Verified Release Review'}</Text></Pressable>
          <View style={styles.releaseLinks}><Pressable onPress={() => navigation.navigate('RecoveryCenter')}><Text style={styles.releaseLink}>Recovery Center</Text></Pressable><Pressable onPress={() => navigation.navigate('OwnerAuthorityApproval')}><Text style={styles.releaseLink}>Authority Evidence</Text></Pressable></View>
        </Panel>
      ) : null}

      <View style={styles.activityHeading}><Text style={styles.activityHeadingText}>Recent Freeze Activity</Text>{freeze.activity.length > 4 ? <Pressable onPress={() => setShowAllActivity((value) => !value)}><Text style={styles.viewAll}>{showAllActivity ? 'Show Less' : 'View All'}</Text></Pressable> : null}</View>
      <Panel style={styles.activityPanel}>
        {visibleActivity.length ? visibleActivity.map((item, index) => <ActivityItem key={item.id} item={item} last={index === visibleActivity.length - 1} />) : <View style={styles.emptyActivity}><View style={styles.emptyActivityIcon}><Text style={styles.emptySnow}>❄</Text></View><View style={styles.emptyActivityCopy}><Text style={styles.emptyActivityTitle}>No freeze actions yet</Text><Text style={styles.emptyActivityText}>You’re all set. Stay secure!</Text></View><LockShield size={44} color={C.muted} /></View>}
      </Panel>

      {feedback ? <View style={styles.feedback}><Text style={styles.feedbackText}>{feedback}</Text></View> : null}

      <Panel tone="yellow" style={styles.supportPanel}>
        <View style={styles.supportIcon}><Text style={styles.supportIconText}>◖</Text></View><View style={styles.supportCopy}><Text style={styles.supportTitle}>Need help?</Text><Text style={styles.supportText}>Review Nomad support options or contact your Owner Authority.</Text></View><Pressable onPress={() => navigation.navigate('Settings')} style={styles.supportButton}><Text style={styles.supportButtonText}>Contact Support</Text></Pressable>
      </Panel>

      <BottomNavigation />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 112, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginBottom: 14 },
  backButton: { width: 48, height: 52, justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 49, lineHeight: 49, fontWeight: '200' },
  headerShield: { width: 76, alignItems: 'center' },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '800' },
  headerSubtitle: { color: '#ddd6d8', fontSize: 15, marginTop: 5 },
  helpButton: { minWidth: 92, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 13 },
  helpLabel: { color: C.green, fontSize: 18 },
  helpCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: C.green, color: C.green, fontSize: 20, lineHeight: 29, textAlign: 'center', fontWeight: '700' },
  errorBanner: { minHeight: 62, marginBottom: 14, borderWidth: 1, borderColor: C.red, borderRadius: 11, backgroundColor: 'rgba(80,8,18,.42)', padding: 13, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: '#ff9da5', fontSize: 11, lineHeight: 17 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 13, paddingVertical: 8 },
  retryText: { color: C.red, fontWeight: '800' },
  hero: { minHeight: 265, padding: 23, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  heroCompact: { flexDirection: 'column', minHeight: 480 },
  emergencyArt: { width: 235, height: 220, alignItems: 'center', justifyContent: 'center' },
  emergencyLock: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, minWidth: 0, marginLeft: 20 },
  heroTitle: { color: C.red, fontSize: 24, fontWeight: '800' },
  heroText: { color: '#f7f1f2', fontSize: 16, lineHeight: 27, marginTop: 12 },
  heroWarning: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  warningIcon: { color: C.red, fontSize: 30, marginRight: 12 },
  warningText: { flex: 1, color: '#e7dee0', fontSize: 13, lineHeight: 20 },
  promptTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 27, marginBottom: 13, marginLeft: 16 },
  optionsList: { gap: 14 },
  option: { minHeight: 154, borderWidth: 1, borderColor: '#294253', borderRadius: 13, backgroundColor: 'rgba(3,13,23,.93)', padding: 18, flexDirection: 'row', alignItems: 'center' },
  optionIcon: { width: 100, height: 100, borderRadius: 50, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' },
  snowBadge: { position: 'absolute', right: -2, bottom: 2, width: 35, height: 35, borderRadius: 18, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  snowText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  optionCopy: { flex: 1, minWidth: 0, marginLeft: 28 },
  optionTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  optionSubtitle: { color: '#ded7da', fontSize: 15, lineHeight: 23, marginTop: 8, maxWidth: 420 },
  optionRight: { alignItems: 'flex-end', marginLeft: 12 },
  optionBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7, fontSize: 12 },
  chevron: { fontSize: 43, fontWeight: '200', marginTop: 8 },
  pressed: { opacity: .76 },
  disabled: { opacity: .42 },
  reviewPanel: { marginTop: 16, padding: 22 },
  reviewHeading: { flexDirection: 'row', alignItems: 'center' },
  reviewCopy: { flex: 1, marginLeft: 17 },
  reviewTitle: { fontSize: 21, fontWeight: '800' },
  reviewSubtitle: { color: C.muted, fontSize: 12, marginTop: 5 },
  closeButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#536374', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: C.muted, fontSize: 25, lineHeight: 27 },
  assetsPanel: { marginTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(130,160,180,.18)', paddingTop: 15 },
  fieldLabel: { color: '#d8d1d4', fontSize: 12, fontWeight: '700', marginTop: 19, marginBottom: 8 },
  assetRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(130,160,180,.16)' },
  checkbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 1.5, borderColor: '#607080', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { borderColor: C.green, backgroundColor: C.green },
  checkboxText: { color: '#001108', fontSize: 15, fontWeight: '900' },
  assetCopy: { flex: 1, marginLeft: 13 },
  assetTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  assetSubtitle: { color: C.muted, fontSize: 10, marginTop: 4 },
  assetState: { color: C.muted, fontSize: 10, fontWeight: '800' },
  emptyAssets: { color: C.yellow, fontSize: 12, lineHeight: 19, marginTop: 10 },
  assetBoundary: { color: C.yellow, fontSize: 10, lineHeight: 16, marginTop: 11 },
  reasonInput: { minHeight: 106, borderWidth: 1, borderColor: '#29445a', borderRadius: 10, backgroundColor: 'rgba(0,7,14,.72)', color: '#fff', padding: 14, fontSize: 13, lineHeight: 20, textAlignVertical: 'top', outlineStyle: 'none' } as any,
  secretWarning: { color: C.yellow, fontSize: 10, lineHeight: 16, marginTop: 8 },
  confirmRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  confirmText: { flex: 1, color: '#e5e0e2', fontSize: 12, lineHeight: 19, marginLeft: 12 },
  activateButton: { minHeight: 66, borderRadius: 10, marginTop: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  activateText: { color: '#05080a', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  infoPanel: { minHeight: 135, marginTop: 18, padding: 22, flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: C.blue, color: C.blue, fontSize: 24, lineHeight: 41, textAlign: 'center', fontWeight: '700' },
  infoCopy: { flex: 1, marginLeft: 22 },
  infoText: { color: '#eee8eb', fontSize: 14, lineHeight: 22 },
  learnText: { color: C.blue, fontSize: 13, marginTop: 13 },
  releasePanel: { marginTop: 18, padding: 22 },
  releaseHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  releaseTitle: { color: C.yellow, fontSize: 18, fontWeight: '800' },
  releaseSubtitle: { color: '#eadca8', fontSize: 11, marginTop: 5 },
  activeBadge: { color: C.red, borderWidth: 1, borderColor: C.red, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 9, fontWeight: '800' },
  blockedList: { marginTop: 14 },
  blockedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  blockedMark: { color: C.red, fontSize: 16, marginRight: 10 },
  blockedText: { color: '#f1e2e3', fontSize: 11 },
  releaseMethods: { flexDirection: 'row', gap: 12, marginTop: 18 },
  releaseMethodsCompact: { flexDirection: 'column' },
  releaseMethod: { flex: 1, minHeight: 136, borderWidth: 1, borderColor: '#385065', borderRadius: 11, padding: 14 },
  releaseMethodActive: { borderColor: C.green, backgroundColor: 'rgba(40,233,120,.05)' },
  releaseMethodTitle: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 8 },
  releaseMethodText: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 5 },
  releaseInput: { minHeight: 92, marginTop: 15, borderWidth: 1, borderColor: '#385065', borderRadius: 10, backgroundColor: 'rgba(0,7,14,.72)', color: '#fff', padding: 13, fontSize: 12, lineHeight: 19, textAlignVertical: 'top', outlineStyle: 'none' } as any,
  releaseButton: { minHeight: 58, marginTop: 13, borderRadius: 9, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  releaseButtonText: { color: '#001108', fontSize: 15, fontWeight: '900' },
  releaseLinks: { flexDirection: 'row', justifyContent: 'center', gap: 30, marginTop: 15 },
  releaseLink: { color: C.blue, fontSize: 12, fontWeight: '700' },
  activityHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12, paddingHorizontal: 16 },
  activityHeadingText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  viewAll: { color: C.green, fontSize: 15 },
  activityPanel: { padding: 18 },
  activityItem: { minHeight: 82, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  activityIcon: { width: 53, height: 53, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  activityIconText: { fontSize: 24, fontWeight: '800' },
  activityCopy: { flex: 1, marginLeft: 15 },
  activityTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  activityDetail: { color: '#d1c9cd', fontSize: 10, lineHeight: 16, marginTop: 4 },
  activityTime: { color: C.muted, fontSize: 9, marginTop: 4 },
  emptyActivity: { minHeight: 80, flexDirection: 'row', alignItems: 'center' },
  emptyActivityIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(150,160,170,.14)', alignItems: 'center', justifyContent: 'center' },
  emptySnow: { color: '#aeb5bd', fontSize: 28 },
  emptyActivityCopy: { flex: 1, marginLeft: 16 },
  emptyActivityTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  emptyActivityText: { color: '#c9c1c5', fontSize: 12, marginTop: 5 },
  feedback: { minHeight: 58, marginTop: 16, borderWidth: 1, borderColor: '#775817', borderRadius: 9, backgroundColor: 'rgba(67,47,5,.25)', padding: 13, justifyContent: 'center' },
  feedbackText: { color: '#f0dda5', fontSize: 11, lineHeight: 17, textAlign: 'center' },
  supportPanel: { minHeight: 104, marginTop: 20, padding: 18, flexDirection: 'row', alignItems: 'center' },
  supportIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  supportIconText: { color: C.yellow, fontSize: 40, transform: [{ rotate: '-45deg' }] },
  supportCopy: { flex: 1, marginLeft: 12 },
  supportTitle: { color: C.yellow, fontSize: 17, fontWeight: '700' },
  supportText: { color: '#ddd5d8', fontSize: 12, marginTop: 5 },
  supportButton: { minWidth: 180, minHeight: 58, borderWidth: 1, borderColor: C.yellow, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 14 },
  supportButtonText: { color: C.yellow, fontSize: 14, fontWeight: '700' },
  bottomNav: { minHeight: 110, marginTop: 22, marginBottom: 6, borderWidth: 1, borderColor: '#183146', borderRadius: 15, backgroundColor: 'rgba(3,13,23,.95)', flexDirection: 'row' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { color: '#d3cccf', fontSize: 12, marginTop: 7 },
  navActive: { color: C.green },
  moreDots: { color: '#d3cccf', fontSize: 24, lineHeight: 26, letterSpacing: 2 },
});
