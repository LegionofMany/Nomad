import React, { useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useNomadOwnerAuthorityEnrollment } from '../nomad';
import type {
  NomadOwnerAuthorityContactChannel,
  NomadOwnerAuthorityProfile,
  NomadOwnerAuthorityType,
} from '../nomad';
import { C, NomadGlyph, NomadPage, Panel, useNomadLayout } from '../ui/NomadShell';

type Stage = 'choose' | 'details';
type AuthorityOption = {
  id: NomadOwnerAuthorityType;
  title: string;
  subtitle: string;
  color: string;
  icon: 'person' | 'briefcase' | 'scales' | 'group' | 'phone';
};

const authorityTypes: AuthorityOption[] = [
  { id: 'family', title: 'Spouse / Family Member', subtitle: 'Add a trusted family member', color: C.green, icon: 'person' },
  { id: 'business_partner', title: 'Business Partner', subtitle: 'Add a trusted business partner', color: C.blue, icon: 'briefcase' },
  { id: 'legal_advisor', title: 'Attorney / Legal Advisor', subtitle: 'Add your legal representative', color: C.orange, icon: 'scales' },
  { id: 'multi_sign', title: 'Multi-Sign Authority', subtitle: 'Require multiple authorities to approve', color: C.purple, icon: 'group' },
  { id: 'secondary_device', title: 'Secondary Device (You)', subtitle: 'Use another device you control', color: '#a9b4c2', icon: 'phone' },
];

const contactChannels: Array<{ id: NomadOwnerAuthorityContactChannel; label: string }> = [
  { id: 'email', label: 'Email' },
  { id: 'secure_handle', label: 'Secure Handle' },
  { id: 'directory_identity', label: 'Directory ID' },
];

function AuthorityShield({ size = 150, network = false, color = C.green }: { size?: number; network?: boolean; color?: string }) {
  return (
    <Svg accessibilityLabel="Owner Authority shield" width={size} height={size} viewBox="0 0 180 180" fill="none">
      {network ? (
        <>
          <Circle cx="90" cy="90" r="78" stroke={color} strokeOpacity=".12" />
          <Circle cx="90" cy="90" r="64" stroke={color} strokeOpacity=".2" strokeDasharray="2 7" />
          <Circle cx="90" cy="90" r="51" stroke={color} strokeOpacity=".16" />
          <Path d="M10 90h28M142 90h28M90 10v26M90 144v26M32 32l19 19M129 129l19 19M148 32l-19 19M51 129l-19 19" stroke={color} strokeOpacity=".14" />
        </>
      ) : null}
      <Path d="M90 24 140 45v38c0 38-20 62-50 78-30-16-50-40-50-78V45Z" fill={`${color}0d`} stroke={color} strokeWidth="6" />
      <Circle cx="90" cy="73" r="17" stroke={color} strokeWidth="5" />
      <Path d="M62 123c2-20 12-30 28-30s26 10 28 30c-17 8-39 8-56 0Z" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FeatureGraphic({ kind }: { kind: 'lock' | 'control' | 'clock' }) {
  const stroke = { stroke: C.green, strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={40} height={40} viewBox="0 0 48 48" fill="none">
      {kind === 'lock' ? <><Rect x="10" y="20" width="28" height="22" rx="4" {...stroke} /><Path d="M16 20v-7a8 8 0 0 1 16 0v7M24 28v7" {...stroke} /></> : null}
      {kind === 'control' ? <><Circle cx="20" cy="15" r="7" {...stroke} /><Path d="M7 37c1-10 5-15 13-15 5 0 9 2 11 7M32 20l9 4v7c0 6-3 10-9 13-5-3-8-7-8-13v-4" {...stroke} /><Path d="m28 32 3 3 6-7" {...stroke} /></> : null}
      {kind === 'clock' ? <><Circle cx="23" cy="25" r="15" {...stroke} /><Path d="M23 15v11l8 4M34 8h7v7M41 8l-7 7" {...stroke} /></> : null}
    </Svg>
  );
}

function AuthorityBadge({ item, size = 58 }: { item: AuthorityOption; size?: number }) {
  const color = item.color;
  const stroke = { stroke: color, strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <View style={[styles.authorityBadge, { width: size, height: size, borderRadius: size / 2, borderColor: `${color}aa`, backgroundColor: `${color}16` }]}>
      <Svg width={size * .62} height={size * .62} viewBox="0 0 48 48" fill="none">
        {item.icon === 'person' ? <><Circle cx="24" cy="14" r="7" fill={color} /><Path d="M10 40c1-12 6-18 14-18s13 6 14 18Z" fill={color} /></> : null}
        {item.icon === 'briefcase' ? <><Rect x="6" y="15" width="36" height="25" rx="3" {...stroke} /><Path d="M17 15v-5h14v5M6 25h36M21 23h6v5h-6Z" {...stroke} /></> : null}
        {item.icon === 'scales' ? <><Path d="M24 7v34M12 12h24M9 36h30M15 12 7 28h16l-8-16ZM33 12l-8 16h16l-8-16Z" {...stroke} /></> : null}
        {item.icon === 'group' ? <><Circle cx="24" cy="14" r="6" fill={color} /><Circle cx="11" cy="20" r="5" fill={color} /><Circle cx="37" cy="20" r="5" fill={color} /><Path d="M13 40c1-10 4-15 11-15s10 5 11 15ZM2 40c0-8 3-12 9-12 3 0 5 1 7 3M46 40c0-8-3-12-9-12-3 0-5 1-7 3" fill={color} /></> : null}
        {item.icon === 'phone' ? <><Rect x="12" y="4" width="24" height="40" rx="4" {...stroke} /><Path d="M20 9h8M21 39h6" {...stroke} /></> : null}
      </Svg>
    </View>
  );
}

function PageHeader({ stage, onBack }: { stage: Stage; onBack(): void }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
      <View style={styles.headerShield}><AuthorityShield size={64} /></View>
      <View style={styles.headerCopy}>
        <Text style={styles.headerTitle}>{stage === 'choose' ? 'Create Owner Authority' : 'Owner Authority Details'}</Text>
        <Text style={styles.headerSubtitle}>{stage === 'choose' ? 'Add a trusted authority to protect your wallet' : 'Record the candidate safely before verification'}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Owner Authority help" style={styles.helpButton}>
        <Text style={styles.helpText}>Help</Text><Text style={styles.helpCircle}>?</Text>
      </Pressable>
    </View>
  );
}

function AuthorityRow({ item, selected, last, onPress }: { item: AuthorityOption; selected: boolean; last: boolean; onPress(): void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Select ${item.title}`} onPress={onPress} style={({ pressed }) => [styles.authorityRow, !last && styles.rowDivider, selected && styles.authoritySelected, pressed && styles.pressed]}>
      <AuthorityBadge item={item} />
      <View style={styles.authorityCopy}>
        <Text style={styles.authorityTitle}>{item.title}</Text>
        <Text style={styles.authoritySubtitle}>{item.subtitle}</Text>
      </View>
      {selected ? <View style={styles.selectedCheck}><Text style={styles.selectedCheckText}>✓</Text></View> : null}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function RequirementArt() {
  return (
    <View style={styles.requirementArt}>
      <Svg width="100%" height="100%" viewBox="0 0 220 160" fill="none">
        <Circle cx="112" cy="84" r="57" fill="#05121c" stroke="#183040" />
        <Path d="M65 107c31-14 66-15 98 0M63 72c34 13 70 13 102 0M112 28c-25 27-25 81 0 113M112 28c25 27 25 81 0 113M55 84h114" stroke="#244352" strokeWidth="1.4" />
        <Path d="M112 28a57 57 0 1 1 0 113 57 57 0 0 1 0-113Z" stroke="#244352" strokeWidth="2" />
        <Path d="M111 16 135 26v18c0 18-9 29-24 37-15-8-24-19-24-37V26Z" fill="#07251b" stroke={C.green} strokeWidth="3" />
        <Circle cx="111" cy="37" r="7" stroke={C.green} strokeWidth="2.5" />
        <Path d="M99 59c1-9 5-14 12-14s11 5 12 14c-7 4-17 4-24 0Z" stroke={C.green} strokeWidth="2.5" />
        <Path d="M58 88 77 96v14c0 14-7 23-19 29-12-6-19-15-19-29V96Z" fill="#071b2d" stroke={C.blue} strokeWidth="3" />
        <Circle cx="58" cy="104" r="6" stroke={C.blue} strokeWidth="2.4" />
        <Path d="M48 124c1-8 4-12 10-12s9 4 10 12" stroke={C.blue} strokeWidth="2.4" />
        <Path d="M169 92 189 100v15c0 14-8 23-20 30-12-7-20-16-20-30v-15Z" fill="#1e1232" stroke={C.purple} strokeWidth="3" />
        <Circle cx="169" cy="109" r="6" stroke={C.purple} strokeWidth="2.4" />
        <Path d="M159 129c1-8 4-12 10-12s9 4 10 12" stroke={C.purple} strokeWidth="2.4" />
      </Svg>
    </View>
  );
}

function ProfileCard({ profile, status, onReview, onShare, onCancel }: { profile: NomadOwnerAuthorityProfile; status: string; onReview(): void; onShare(): void; onCancel(): void }) {
  const option = authorityTypes.find((item) => item.id === profile.type) ?? authorityTypes[0];
  return (
    <Panel tone={status === 'local_request_pending' ? 'yellow' : 'green'} style={styles.profileCard}>
      <AuthorityBadge item={option} size={66} />
      <View style={styles.profileCopy}>
        <Text style={styles.profileEyebrow}>CURRENT LOCAL PROFILE</Text>
        <Text style={styles.profileName}>{profile.displayName}</Text>
        <Text style={styles.profileDetail}>{profile.typeLabel} · {profile.maskedContact}</Text>
        <Text style={styles.profileBoundary}>Identity, delivery, consent, and a signed receipt remain required before activation.</Text>
      </View>
      <View style={styles.profileActions}>
        {status === 'local_request_pending' ? <Pressable onPress={onReview} style={styles.smallAction}><Text style={styles.smallActionText}>Review</Text></Pressable> : null}
        <Pressable onPress={onShare} style={styles.smallAction}><Text style={styles.smallActionText}>Share</Text></Pressable>
        <Pressable onPress={onCancel} style={[styles.smallAction, styles.dangerAction]}><Text style={[styles.smallActionText, { color: C.red }]}>Cancel</Text></Pressable>
      </View>
    </Panel>
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
          <NomadGlyph kind={item.kind} color={C.muted} size={32} />
          <Text style={styles.navLabel}>{item.label}</Text>
        </Pressable>
      ))}
      <Pressable onPress={() => navigation.navigate('Settings')} style={styles.navItem}>
        <Text style={styles.moreDots}>•••</Text>
        <Text style={[styles.navLabel, styles.navActive]}>More</Text>
      </Pressable>
    </View>
  );
}

export default function CreateOwnerAuthorityScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { enrollment, loading, error, refresh, createEnrollment, cancelEnrollment, exportProfileSummary } = useNomadOwnerAuthorityEnrollment();

  const [stage, setStage] = useState<Stage>('choose');
  const [selectedType, setSelectedType] = useState<NomadOwnerAuthorityType>('family');
  const [displayName, setDisplayName] = useState('');
  const [contactChannel, setContactChannel] = useState<NomadOwnerAuthorityContactChannel>('email');
  const [contact, setContact] = useState('');
  const [requestedQuorum, setRequestedQuorum] = useState(2);
  const [identityChecked, setIdentityChecked] = useState(false);
  const [noSecrets, setNoSecrets] = useState(false);
  const [noCustody, setNoCustody] = useState(false);
  const [feedback, setFeedback] = useState('');

  const selectedOption = authorityTypes.find((item) => item.id === selectedType) ?? authorityTypes[0];
  const currentProfile = enrollment.currentProfile && enrollment.currentProfile.status !== 'cancelled' ? enrollment.currentProfile : undefined;
  const hasPendingOrphan = enrollment.recoveryRequest.status === 'pending' && !currentProfile;
  const canSubmit = enrollment.canCreateProfile
    && displayName.trim().length >= 2
    && (selectedType === 'secondary_device' || contact.trim().length >= 4)
    && identityChecked
    && noSecrets
    && noCustody;

  useEffect(() => {
    if (selectedType === 'secondary_device') {
      setContactChannel('device_pairing');
      setContact('Owner secondary device');
      setRequestedQuorum(1);
    } else if (contactChannel === 'device_pairing') {
      setContactChannel('email');
      setContact('');
      setRequestedQuorum(2);
    }
  }, [contactChannel, selectedType]);

  const onBack = () => {
    if (stage === 'details') {
      setStage('choose');
      setFeedback('');
      return;
    }
    navigation.goBack();
  };

  const createProfile = async () => {
    try {
      setFeedback('Recording the local Owner Authority profile…');
      const next = await createEnrollment({
        type: selectedType,
        displayName,
        contactChannel,
        contact,
        requestedQuorum,
        identityCheckedByOwner: identityChecked,
        noWalletSecretsIncluded: noSecrets,
        noCustodyGranted: noCustody,
      });
      setFeedback(next.canOpenApproval
        ? 'Local profile recorded. Verify delivery, consent, and the signed receipt before activation.'
        : 'Secondary-device draft saved. It does not count as an independent authority.');
      setStage('choose');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to record the Owner Authority profile.');
    }
  };

  const submit = () => {
    if (!enrollment.walletIdentityAvailable) {
      navigation.navigate('Lock');
      return;
    }
    if (enrollment.walletStatus !== 'unlocked') {
      navigation.navigate('UnlockWallet');
      return;
    }
    if (enrollment.frozen) {
      navigation.navigate('EmergencyFreeze');
      return;
    }
    void createProfile();
  };

  const cancelProfile = async () => {
    if (!currentProfile) return;
    try {
      await cancelEnrollment(currentProfile.id);
      setFeedback('The local profile was cancelled. No remote revocation was delivered.');
      setDisplayName('');
      setContact('');
      setIdentityChecked(false);
      setNoSecrets(false);
      setNoCustody(false);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to cancel the local profile.');
    }
  };

  const shareSummary = async () => {
    if (!currentProfile) return;
    try {
      const message = await exportProfileSummary(currentProfile.id);
      await Share.share({ title: 'Owner Authority Profile Summary', message });
      setFeedback('Secret-free profile summary prepared. It is not an invitation or signed receipt.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to prepare the profile summary.');
    }
  };

  const actionLabel = !enrollment.walletIdentityAvailable
    ? 'Create or Restore Wallet'
    : enrollment.walletStatus !== 'unlocked'
      ? 'Unlock Wallet to Continue'
      : enrollment.frozen
        ? 'Review Emergency Freeze'
        : selectedType === 'secondary_device'
          ? 'Save Device Draft'
          : 'Record Authority Profile';

  const actionDisabled = loading || (enrollment.walletIdentityAvailable && enrollment.walletStatus === 'unlocked' && !enrollment.frozen && !canSubmit);

  return (
    <NomadPage maxWidth={900}>
      <PageHeader stage={stage} onBack={onBack} />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      {currentProfile ? (
        <ProfileCard
          profile={currentProfile}
          status={enrollment.status}
          onReview={() => navigation.navigate('OwnerAuthorityApproval')}
          onShare={() => void shareSummary()}
          onCancel={() => void cancelProfile()}
        />
      ) : hasPendingOrphan ? (
        <Panel tone="yellow" style={styles.orphanCard}>
          <Text style={styles.orphanIcon}>!</Text>
          <View style={styles.orphanCopy}><Text style={styles.orphanTitle}>Existing Approval Request</Text><Text style={styles.orphanText}>Review the current local request before recording another authority.</Text></View>
          <Pressable onPress={() => navigation.navigate('OwnerAuthorityApproval')} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Review</Text></Pressable>
        </Panel>
      ) : stage === 'choose' ? (
        <>
          <Panel tone="green" style={[styles.hero, compact && styles.heroCompact]}>
            <View style={styles.heroArt}><AuthorityShield size={compact ? 180 : 235} network /></View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Add an Owner Authority</Text>
              <Text style={styles.heroText}>Your Owner Authority can approve critical actions like wallet recovery, large transactions, or security changes. You remain in full control.</Text>
              <View style={styles.featureRow}>
                <View style={styles.feature}><FeatureGraphic kind="lock" /><Text style={styles.featureLabel}>Extra Security</Text></View>
                <View style={styles.feature}><FeatureGraphic kind="control" /><Text style={styles.featureLabel}>Your Control</Text></View>
                <View style={styles.feature}><FeatureGraphic kind="clock" /><Text style={styles.featureLabel}>Recovery Help</Text></View>
              </View>
            </View>
          </Panel>

          <Panel style={styles.typePanel}>
            <Text style={styles.sectionTitle}>CHOOSE AUTHORITY TYPE</Text>
            <View style={styles.authorityList}>
              {authorityTypes.map((item, index) => (
                <AuthorityRow
                  key={item.id}
                  item={item}
                  selected={selectedType === item.id}
                  last={index === authorityTypes.length - 1}
                  onPress={() => { setSelectedType(item.id); setFeedback(''); }}
                />
              ))}
            </View>
          </Panel>

          <Panel style={[styles.requirementsPanel, compact && styles.requirementsCompact]}>
            <View style={styles.requirementCopy}>
              <Text style={styles.sectionTitle}>AUTHORITY REQUIREMENTS</Text>
              {[
                'Invitation delivery must be verified before activation',
                'Authority profiles grant no custody or spending rights',
                'You remain in control and may cancel the local profile',
                'Encrypted delivery requires a connected provider',
              ].map((requirement) => (
                <View key={requirement} style={styles.requirementRow}><Text style={styles.requirementCheck}>✓</Text><Text style={styles.requirementText}>{requirement}</Text></View>
              ))}
            </View>
            <RequirementArt />
          </Panel>

          <Panel style={styles.infoPanel}>
            <Text style={styles.infoIcon}>i</Text>
            <Text style={styles.infoText}>Add a trusted authority candidate for additional protection. Complete verified identity, delivery, consent, and receipt checks before relying on it.</Text>
          </Panel>

          {feedback ? <View style={styles.feedback}><Text style={styles.feedbackText}>{feedback}</Text></View> : null}

          <Pressable accessibilityRole="button" accessibilityLabel="Add Owner Authority" onPress={() => setStage('details')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <AuthorityBadge item={selectedOption} size={46} />
            <Text style={styles.primaryButtonText}>Add Owner Authority</Text>
            <Text style={styles.primaryArrow}>›</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Panel tone="green" style={styles.detailsIntro}>
            <AuthorityBadge item={selectedOption} size={76} />
            <View style={styles.detailsIntroCopy}>
              <Text style={styles.detailsTitle}>{selectedOption.title}</Text>
              <Text style={styles.detailsSubtitle}>{selectedOption.subtitle}</Text>
              {selectedType === 'secondary_device' ? <Text style={styles.deviceWarning}>An owner-controlled device is not an independent authority.</Text> : null}
            </View>
            <Pressable onPress={() => setStage('choose')} style={styles.changeButton}><Text style={styles.changeText}>Change</Text></Pressable>
          </Panel>

          <Panel style={styles.formPanel}>
            <Text style={styles.sectionTitle}>{selectedType === 'secondary_device' ? 'DEVICE DETAILS' : 'AUTHORITY DETAILS'}</Text>
            <Text style={styles.inputLabel}>{selectedType === 'secondary_device' ? 'Device label' : 'Authority display name'}</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={(value) => { setDisplayName(value); setFeedback(''); }}
              placeholder={selectedType === 'secondary_device' ? 'Example: Home backup phone' : 'Trusted person or organization'}
              placeholderTextColor="#718196"
              style={styles.input}
              value={displayName}
            />

            {selectedType !== 'secondary_device' ? (
              <>
                <Text style={styles.inputLabel}>Contact channel</Text>
                <View style={[styles.channelRow, compact && styles.channelRowCompact]}>
                  {contactChannels.map((channel) => (
                    <Pressable key={channel.id} onPress={() => { setContactChannel(channel.id); setContact(''); }} style={[styles.channelButton, contactChannel === channel.id && styles.channelActive]}>
                      <Text style={[styles.channelText, contactChannel === channel.id && styles.channelTextActive]}>{channel.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.inputLabel}>Contact locator</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType={contactChannel === 'email' ? 'email-address' : 'default'}
                  onChangeText={(value) => { setContact(value); setFeedback(''); }}
                  placeholder={contactChannel === 'email' ? 'authority@example.com' : 'Secure handle or directory identity'}
                  placeholderTextColor="#718196"
                  style={styles.input}
                  value={contact}
                />
                <Text style={styles.privacyText}>The raw locator is masked and discarded after local validation. No invitation is sent from this screen.</Text>
              </>
            ) : (
              <View style={styles.warningBox}><Text style={styles.warningMark}>!</Text><Text style={styles.warningText}>Device pairing is not connected. This records a local draft and does not create independent approval.</Text></View>
            )}

            {selectedType === 'multi_sign' ? (
              <>
                <Text style={styles.inputLabel}>Requested authority quorum</Text>
                <View style={styles.quorumRow}>
                  {[2, 3].map((value) => (
                    <Pressable key={value} onPress={() => setRequestedQuorum(value)} style={[styles.quorumButton, requestedQuorum === value && styles.quorumActive]}>
                      <Text style={[styles.quorumValue, requestedQuorum === value && styles.quorumValueActive]}>{value}</Text>
                      <Text style={styles.quorumLabel}>{value} approvals</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.privacyText}>This records requested policy metadata only. Multi-authority enforcement is not connected.</Text>
              </>
            ) : null}
          </Panel>

          <Panel style={styles.attestationPanel}>
            <Text style={styles.sectionTitle}>OWNER CONFIRMATIONS</Text>
            {[
              { checked: identityChecked, label: selectedType === 'secondary_device' ? 'I personally identified this owner-controlled device.' : 'I personally checked the intended authority identity and contact.', toggle: () => setIdentityChecked((value) => !value) },
              { checked: noSecrets, label: 'I included no seed phrase, private key, password, or Time Set.', toggle: () => setNoSecrets((value) => !value) },
              { checked: noCustody, label: 'I understand this profile grants no custody, spending rights, or wallet access.', toggle: () => setNoCustody((value) => !value) },
            ].map((item) => (
              <Pressable key={item.label} onPress={item.toggle} style={styles.attestationRow}>
                <View style={[styles.checkbox, item.checked && styles.checkboxActive]}><Text style={styles.checkboxText}>{item.checked ? '✓' : ''}</Text></View>
                <Text style={styles.attestationText}>{item.label}</Text>
              </Pressable>
            ))}
          </Panel>

          {feedback ? <View style={styles.feedback}><Text style={styles.feedbackText}>{feedback}</Text></View> : null}

          <Pressable accessibilityRole="button" disabled={actionDisabled} onPress={submit} style={({ pressed }) => [styles.primaryButton, actionDisabled && styles.primaryDisabled, pressed && !actionDisabled && styles.pressed]}>
            <AuthorityBadge item={selectedOption} size={46} />
            <Text style={styles.primaryButtonText}>{loading ? 'Checking…' : actionLabel}</Text>
            <Text style={styles.primaryArrow}>›</Text>
          </Pressable>
        </>
      )}

      <BottomNavigation />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 108, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginBottom: 16 },
  backButton: { width: 44, height: 48, justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 48, fontWeight: '200', lineHeight: 48 },
  headerShield: { width: 76, alignItems: 'center' },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: '#fff', fontSize: 25, fontWeight: '800' },
  headerSubtitle: { color: '#d3d8e1', fontSize: 13, lineHeight: 19, marginTop: 5 },
  helpButton: { minWidth: 80, minHeight: 44, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 },
  helpText: { color: C.green, fontSize: 17 },
  helpCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: C.green, color: C.green, textAlign: 'center', lineHeight: 26, fontSize: 18, fontWeight: '700' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.red, borderRadius: 12, padding: 14, marginBottom: 14, backgroundColor: 'rgba(70,8,15,.6)' },
  errorText: { color: '#ff9ba2', fontSize: 12, lineHeight: 18, flex: 1 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  retryText: { color: C.red, fontWeight: '800' },
  hero: { minHeight: 320, padding: 24, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  heroCompact: { flexDirection: 'column', minHeight: 520 },
  heroArt: { flex: .9, alignItems: 'center', justifyContent: 'center', minWidth: 230 },
  heroCopy: { flex: 1.15, paddingHorizontal: 10 },
  heroTitle: { color: C.green, fontSize: 28, lineHeight: 34, fontWeight: '800' },
  heroText: { color: '#f1f4f7', fontSize: 16, lineHeight: 26, marginTop: 12, maxWidth: 430 },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, maxWidth: 430 },
  feature: { flex: 1, alignItems: 'center', minWidth: 88 },
  featureLabel: { color: '#e7ebf0', fontSize: 12, textAlign: 'center', marginTop: 5 },
  typePanel: { marginTop: 16, padding: 20 },
  sectionTitle: { color: C.green, fontSize: 17, fontWeight: '800', letterSpacing: .2 },
  authorityList: { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(150,180,200,.15)' },
  authorityRow: { minHeight: 94, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(150,180,200,.14)' },
  authoritySelected: { backgroundColor: 'rgba(20,233,110,.035)' },
  authorityBadge: { borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' },
  authorityCopy: { flex: 1, marginLeft: 18, minWidth: 0 },
  authorityTitle: { color: '#fff', fontSize: 19, lineHeight: 25, fontWeight: '700' },
  authoritySubtitle: { color: '#c3cbd6', fontSize: 13, lineHeight: 19, marginTop: 4 },
  selectedCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  selectedCheckText: { color: '#001108', fontSize: 14, fontWeight: '900' },
  chevron: { color: C.green, fontSize: 42, fontWeight: '200', marginLeft: 8, marginTop: -4 },
  pressed: { opacity: .76 },
  requirementsPanel: { minHeight: 240, marginTop: 16, padding: 22, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  requirementsCompact: { flexDirection: 'column', alignItems: 'stretch' },
  requirementCopy: { flex: 1.35, zIndex: 2 },
  requirementRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 13 },
  requirementCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: C.green, color: C.green, textAlign: 'center', lineHeight: 20, fontSize: 13, fontWeight: '900', marginRight: 12 },
  requirementText: { flex: 1, color: '#d9dee6', fontSize: 13, lineHeight: 21 },
  requirementArt: { flex: .9, height: 180, minWidth: 220 },
  infoPanel: { marginTop: 16, minHeight: 88, padding: 18, flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: C.blue, color: C.blue, textAlign: 'center', lineHeight: 38, fontSize: 22, fontWeight: '700', marginRight: 18 },
  infoText: { flex: 1, color: '#dbe2ec', fontSize: 13, lineHeight: 21 },
  primaryButton: { minHeight: 76, borderRadius: 12, backgroundColor: C.green, marginTop: 16, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#001108', fontSize: 22, fontWeight: '800', textAlign: 'center', marginHorizontal: 16 },
  primaryArrow: { color: '#001108', fontSize: 42, fontWeight: '300' },
  primaryDisabled: { backgroundColor: '#0b5b33', opacity: .65 },
  detailsIntro: { minHeight: 138, padding: 20, flexDirection: 'row', alignItems: 'center' },
  detailsIntroCopy: { flex: 1, marginLeft: 18 },
  detailsTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  detailsSubtitle: { color: '#cbd3dd', fontSize: 13, marginTop: 6 },
  deviceWarning: { color: C.yellow, fontSize: 11, lineHeight: 17, marginTop: 8 },
  changeButton: { borderWidth: 1, borderColor: C.green, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10 },
  changeText: { color: C.green, fontWeight: '700' },
  formPanel: { marginTop: 16, padding: 22 },
  inputLabel: { color: '#cbd4e0', fontSize: 12, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  input: { height: 58, borderWidth: 1, borderColor: '#2a4257', borderRadius: 9, backgroundColor: 'rgba(0,6,13,.72)', color: '#fff', fontSize: 16, paddingHorizontal: 16 },
  channelRow: { flexDirection: 'row', gap: 10 },
  channelRowCompact: { flexWrap: 'wrap' },
  channelButton: { minHeight: 46, flex: 1, minWidth: 120, borderWidth: 1, borderColor: '#2a4257', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  channelActive: { borderColor: C.green, backgroundColor: 'rgba(40,233,120,.08)' },
  channelText: { color: C.muted, fontWeight: '700' },
  channelTextActive: { color: C.green },
  privacyText: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 9 },
  warningBox: { borderWidth: 1, borderColor: '#715316', backgroundColor: 'rgba(72,49,4,.22)', borderRadius: 10, padding: 14, marginTop: 18, flexDirection: 'row', alignItems: 'center' },
  warningMark: { color: C.yellow, fontSize: 24, fontWeight: '900', marginRight: 14 },
  warningText: { flex: 1, color: '#edd89d', fontSize: 12, lineHeight: 19 },
  quorumRow: { flexDirection: 'row', gap: 12 },
  quorumButton: { flex: 1, minHeight: 72, borderWidth: 1, borderColor: '#2a4257', borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  quorumActive: { borderColor: C.green, backgroundColor: 'rgba(40,233,120,.08)' },
  quorumValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  quorumValueActive: { color: C.green },
  quorumLabel: { color: C.muted, fontSize: 10, marginTop: 4 },
  attestationPanel: { marginTop: 16, padding: 22 },
  attestationRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(150,180,200,.12)' },
  checkbox: { width: 25, height: 25, borderRadius: 6, borderWidth: 1.5, borderColor: '#617184', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  checkboxActive: { borderColor: C.green, backgroundColor: C.green },
  checkboxText: { color: '#001108', fontSize: 16, fontWeight: '900' },
  attestationText: { flex: 1, color: '#dce2e9', fontSize: 13, lineHeight: 21 },
  feedback: { borderWidth: 1, borderColor: '#795711', backgroundColor: 'rgba(72,49,4,.22)', borderRadius: 9, padding: 14, marginTop: 16 },
  feedbackText: { color: '#edd89d', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  profileCard: { minHeight: 170, padding: 20, flexDirection: 'row', alignItems: 'center' },
  profileCopy: { flex: 1, marginHorizontal: 18 },
  profileEyebrow: { color: C.green, fontSize: 10, fontWeight: '900', letterSpacing: .5 },
  profileName: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 7 },
  profileDetail: { color: C.muted, fontSize: 12, marginTop: 5 },
  profileBoundary: { color: '#d2bd75', fontSize: 11, lineHeight: 17, marginTop: 10 },
  profileActions: { gap: 7 },
  smallAction: { minWidth: 72, borderWidth: 1, borderColor: C.green, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
  smallActionText: { color: C.green, fontSize: 10, fontWeight: '800' },
  dangerAction: { borderColor: C.red },
  orphanCard: { minHeight: 120, padding: 20, flexDirection: 'row', alignItems: 'center' },
  orphanIcon: { color: C.yellow, fontSize: 34, fontWeight: '900', marginRight: 18 },
  orphanCopy: { flex: 1 },
  orphanTitle: { color: C.yellow, fontSize: 18, fontWeight: '800' },
  orphanText: { color: '#e4d7ac', fontSize: 12, lineHeight: 18, marginTop: 5 },
  outlineButton: { borderWidth: 1, borderColor: C.yellow, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, marginLeft: 14 },
  outlineButtonText: { color: C.yellow, fontWeight: '800' },
  bottomNav: { minHeight: 104, marginTop: 22, marginBottom: 6, borderWidth: 1, borderColor: '#183146', borderRadius: 14, backgroundColor: 'rgba(3,13,23,.95)', flexDirection: 'row', alignItems: 'stretch' },
  navItem: { flex: 1, minWidth: 56, alignItems: 'center', justifyContent: 'center' },
  navLabel: { color: '#c5c9d2', fontSize: 12, marginTop: 6 },
  navActive: { color: C.green },
  moreDots: { color: C.green, fontSize: 24, letterSpacing: 2, lineHeight: 27 },
});
