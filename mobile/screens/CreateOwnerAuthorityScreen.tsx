import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadOwnerAuthorityEnrollment } from '../nomad';
import type {
  NomadOwnerAuthorityContactChannel,
  NomadOwnerAuthorityEnrollmentCheck,
  NomadOwnerAuthorityEnrollmentEvent,
  NomadOwnerAuthorityProfile,
  NomadOwnerAuthorityType,
} from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  PrimaryButton,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

type AuthorityOption = {
  id: NomadOwnerAuthorityType;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  independent: boolean;
};

const authorityTypes: AuthorityOption[] = [
  { id: 'family', title: 'Spouse / Family Member', subtitle: 'Independent trusted family authority', icon: '●', color: C.green, independent: true },
  { id: 'business_partner', title: 'Business Partner', subtitle: 'Independent business continuity authority', icon: '▣', color: C.blue, independent: true },
  { id: 'legal_advisor', title: 'Attorney / Legal Advisor', subtitle: 'Independent legal or estate authority', icon: '⚖', color: C.orange, independent: true },
  { id: 'multi_sign', title: 'Multi-Authority Policy', subtitle: 'Record a requested two- or three-authority quorum', icon: '♚', color: C.purple, independent: true },
  { id: 'secondary_device', title: 'Secondary Device', subtitle: 'Owner-controlled backup device • not an independent authority', icon: '▯', color: C.muted, independent: false },
];

const contactChannels: Array<{ id: NomadOwnerAuthorityContactChannel; label: string }> = [
  { id: 'email', label: 'Email' },
  { id: 'secure_handle', label: 'Secure Handle' },
  { id: 'directory_identity', label: 'Directory ID' },
];

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

function checkInfo(status: NomadOwnerAuthorityEnrollmentCheck['status']) {
  if (status === 'pass') return { color: C.green, mark: '✓', label: 'PASS' };
  if (status === 'warning') return { color: C.yellow, mark: '!', label: 'REVIEW' };
  if (status === 'fail') return { color: C.red, mark: '×', label: 'FAIL' };
  return { color: C.muted, mark: '—', label: 'UNAVAILABLE' };
}

function enrollmentStatusInfo(status: string) {
  if (status === 'active') return { color: C.green, title: 'AUTHORITY ACTIVE', detail: 'A verified signed enrollment receipt is recorded.' };
  if (status === 'local_request_pending') return { color: C.yellow, title: 'LOCAL REQUEST PENDING', detail: 'A local request exists. Delivery, consent and signature remain unverified.' };
  if (status === 'approval_unverified') return { color: C.purple, title: 'APPROVAL UNVERIFIED', detail: 'A legacy approved flag exists without a verified signed enrollment receipt.' };
  if (status === 'local_profile_draft') return { color: C.blue, title: 'LOCAL PROFILE DRAFT', detail: 'Profile metadata exists locally, but no independent enrollment is complete.' };
  if (status === 'cancelled') return { color: C.red, title: 'PROFILE CANCELLED', detail: 'The local profile was cancelled. No remote revocation was delivered.' };
  return { color: C.blue, title: 'SETUP REQUIRED', detail: 'Create a local Owner Authority profile to begin enrollment.' };
}

function AuthorityRow({
  item,
  selected,
  last,
  onPress,
}: {
  item: AuthorityOption;
  selected: boolean;
  last?: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.authorityRow,
        !last && styles.rowBorder,
        selected && styles.authoritySelected,
        pressed && styles.pressed,
      ]}
    >
      <RoundIcon symbol={item.icon} color={item.color} size={48} filled />
      <View style={styles.authorityCopy}>
        <Text style={styles.authorityTitle}>{item.title}</Text>
        <Text style={styles.authoritySub}>{item.subtitle}</Text>
      </View>
      <Text style={[styles.authorityBadge, { color: item.independent ? C.green : C.yellow, borderColor: item.independent ? C.green : C.yellow }]}>
        {item.independent ? 'INDEPENDENT' : 'OWNER DEVICE'}
      </Text>
      <Text style={[styles.authorityArrow, selected && { color: C.green }]}>{selected ? '✓' : '›'}</Text>
    </Pressable>
  );
}

function CheckRow({ item, last }: { item: NomadOwnerAuthorityEnrollmentCheck; last?: boolean }) {
  const info = checkInfo(item.status);
  return (
    <View style={[styles.checkRow, !last && styles.rowBorder]}>
      <View style={[styles.checkMark, { borderColor: info.color, backgroundColor: `${info.color}12` }]}>
        <Text style={[styles.checkMarkText, { color: info.color }]}>{info.mark}</Text>
      </View>
      <View style={styles.checkCopy}>
        <Text style={styles.checkTitle}>{item.label}</Text>
        <Text style={styles.checkDetail}>{item.detail}</Text>
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

function ActivityRow({ item, last }: { item: NomadOwnerAuthorityEnrollmentEvent; last?: boolean }) {
  const color = item.severity === 'critical' ? C.red : item.severity === 'warning' ? C.yellow : C.blue;
  return (
    <View style={[styles.activityRow, !last && styles.rowBorder]}>
      <RoundIcon symbol={item.type === 'cancelled' ? '×' : item.type === 'request' ? '♙' : '▣'} color={color} size={42} filled />
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityDetail}>{item.detail}</Text>
        <Text style={styles.activityTime}>{formatDate(item.timestamp)}</Text>
      </View>
    </View>
  );
}

function ProfileSummary({ profile }: { profile: NomadOwnerAuthorityProfile }) {
  return (
    <>
      <DetailRow label="Profile ID" value={profile.id} />
      <DetailRow label="Authority Type" value={profile.typeLabel} />
      <DetailRow label="Display Name" value={profile.displayName} />
      <DetailRow label="Contact Locator" value={profile.maskedContact} />
      <DetailRow label="Raw Contact Retained" value="NO" color={C.green} />
      <DetailRow label="Independent Authority" value={profile.independentAuthority ? 'YES • CANDIDATE' : 'NO • OWNER DEVICE'} color={profile.independentAuthority ? C.yellow : C.red} />
      <DetailRow label="Requested Quorum" value={String(profile.requestedQuorum)} />
      <DetailRow label="Identity Provider Verified" value="NO" color={C.red} />
      <DetailRow label="Delivery Confirmed" value="NO" color={C.red} />
      <DetailRow label="Signed Enrollment Receipt" value="NO" color={C.red} />
      <DetailRow label="Custody / Spending Rights" value="NONE" color={C.green} last />
    </>
  );
}

export default function CreateOwnerAuthorityScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const {
    enrollment,
    loading,
    error,
    refresh,
    createEnrollment,
    cancelEnrollment,
    exportProfileSummary,
  } = useNomadOwnerAuthorityEnrollment();

  const [selectedType, setSelectedType] = useState<NomadOwnerAuthorityType>('family');
  const [displayName, setDisplayName] = useState('');
  const [contactChannel, setContactChannel] = useState<NomadOwnerAuthorityContactChannel>('email');
  const [contact, setContact] = useState('');
  const [requestedQuorum, setRequestedQuorum] = useState(2);
  const [identityChecked, setIdentityChecked] = useState(false);
  const [noSecrets, setNoSecrets] = useState(false);
  const [noCustody, setNoCustody] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showAllActivity, setShowAllActivity] = useState(false);

  const type = authorityTypes.find((item) => item.id === selectedType) ?? authorityTypes[0];
  const currentProfile = enrollment.currentProfile;
  const status = enrollmentStatusInfo(enrollment.status);
  const hasCurrentProfile = Boolean(currentProfile && currentProfile.status !== 'cancelled');
  const visibleActivity = enrollment.activity.slice(0, showAllActivity ? 12 : 4);
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
    }
  }, [contactChannel, selectedType]);

  const createProfile = async () => {
    try {
      setFeedback('Creating a local Owner Authority enrollment profile…');
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
      setContact('');
      setFeedback(next.canOpenApproval
        ? 'Local enrollment request created. Remote delivery, authority consent and signature remain unverified.'
        : 'Secondary-device profile saved locally. It does not count as an independent Owner Authority.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to create the Owner Authority profile.');
    }
  };

  const cancelProfile = async () => {
    if (!currentProfile) return;
    try {
      setFeedback('Cancelling the local Owner Authority profile…');
      await cancelEnrollment(currentProfile.id);
      setDisplayName('');
      setContact('');
      setIdentityChecked(false);
      setNoSecrets(false);
      setNoCustody(false);
      setFeedback('The local profile was cancelled. No remote revocation was delivered.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to cancel the Owner Authority profile.');
    }
  };

  const shareSummary = async () => {
    if (!currentProfile) return;
    try {
      const summary = await exportProfileSummary(currentProfile.id);
      await Share.share({
        title: 'Owner Authority Profile Summary',
        message: summary,
      });
      setFeedback('A secret-free local profile summary was prepared. It is not an invitation or signed enrollment receipt.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to prepare the profile summary.');
    }
  };

  const primaryAction = () => {
    if (enrollment.canOpenApproval) {
      navigation.navigate('OwnerAuthorityApproval');
      return;
    }
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

  const primaryLabel = enrollment.canOpenApproval
    ? 'Review Pending Enrollment'
    : !enrollment.walletIdentityAvailable
      ? 'Create or Restore Wallet'
      : enrollment.walletStatus !== 'unlocked'
        ? 'Unlock Wallet to Continue'
        : enrollment.frozen
          ? 'Review Emergency Freeze'
          : selectedType === 'secondary_device'
            ? 'Save Device Pairing Draft'
            : 'Create Local Enrollment Request';

  const primarySubtitle = enrollment.canOpenApproval
    ? 'Inspect delivery and signed-receipt evidence on Page 19'
    : selectedType === 'secondary_device'
      ? 'This local device draft does not satisfy independent authority approval'
      : 'Raw contact is discarded; remote delivery and signed consent are not connected';

  return (
    <NomadPage maxWidth={960}>
      <PageHeader
        title="Create Owner Authority"
        subtitle="Record a trusted authority candidate without granting custody"
        icon="♙"
        color={status.color}
        help
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel tone={enrollment.frozen ? 'red' : enrollment.status === 'local_request_pending' ? 'yellow' : 'green'} style={[styles.hero, compact && styles.heroCompact]}>
        <View style={[styles.heroGraphic, { borderColor: status.color }]}>
          <Text style={[styles.heroMark, { color: status.color }]}>♙</Text>
          <Text style={[styles.heroShield, { color: status.color }]}>◇</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroEyebrow, { color: status.color }]}>OWNER AUTHORITY ENROLLMENT</Text>
          <Text style={[styles.heroTitle, { color: status.color }]}>{status.title}</Text>
          <Text style={styles.heroText}>{status.detail}</Text>
          <Text style={styles.heroBoundary}>
            Page 23 records local profile metadata only. It cannot verify identity, deliver an encrypted invitation or activate authority rights without production providers and a verified signed receipt.
          </Text>
        </View>
        <View style={styles.heroStatus}>
          <Text style={styles.heroStatusLabel}>CURRENT PROFILE</Text>
          <Text style={[styles.heroStatusValue, { color: status.color }]}>{currentProfile?.displayName || 'NONE'}</Text>
          <Text style={styles.heroStatusSub}>{currentProfile?.typeLabel || 'No authority candidate'}</Text>
        </View>
      </Panel>

      <View style={[styles.metricRow, compact && styles.metricRowCompact]}>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>WALLET SESSION</Text>
          <Text style={[styles.metricStatus, { color: enrollment.walletStatus === 'unlocked' ? C.green : C.yellow }]}>{enrollment.walletStatus.toUpperCase()}</Text>
          <Text style={styles.metricSub}>Configuration requires an unlocked wallet</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>IDENTITY PROVIDER</Text>
          <Text style={[styles.metricStatus, { color: C.muted }]}>NOT CONNECTED</Text>
          <Text style={styles.metricSub}>Owner attestation is not provider verification</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>SIGNED RECEIPT</Text>
          <Text style={[styles.metricStatus, { color: C.red }]}>UNAVAILABLE</Text>
          <Text style={styles.metricSub}>Authority cannot become active yet</Text>
        </Panel>
      </View>

      {currentProfile ? (
        <Panel style={styles.profilePanel}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>CURRENT LOCAL PROFILE</Text>
              <Text style={styles.sectionSub}>Masked metadata and enrollment evidence</Text>
            </View>
            <Text style={[styles.profileStatus, { color: status.color, borderColor: status.color }]}>{enrollment.status.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
          <ProfileSummary profile={currentProfile} />
          <View style={[styles.actionRow, compact && styles.actionRowCompact]}>
            {enrollment.canOpenApproval ? (
              <Pressable onPress={() => navigation.navigate('OwnerAuthorityApproval')} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Review Approval Evidence</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => void shareSummary()} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Share Secret-Free Summary</Text>
            </Pressable>
            {enrollment.canCancelProfile ? (
              <Pressable onPress={() => void cancelProfile()} style={[styles.actionButton, { borderColor: C.red }]}>
                <Text style={[styles.actionButtonText, { color: C.red }]}>Cancel Local Profile</Text>
              </Pressable>
            ) : null}
          </View>
        </Panel>
      ) : null}

      {!hasCurrentProfile && enrollment.recoveryRequest.status !== 'pending' ? (
        <>
          <Panel style={styles.sectionPanel}>
            <Text style={styles.sectionTitle}>CHOOSE AUTHORITY TYPE</Text>
            <Text style={styles.sectionSub}>A secondary device is intentionally not counted as independent authority</Text>
            <View style={styles.list}>
              {authorityTypes.map((item, index) => (
                <AuthorityRow
                  key={item.id}
                  item={item}
                  selected={selectedType === item.id}
                  last={index === authorityTypes.length - 1}
                  onPress={() => {
                    setSelectedType(item.id);
                    setFeedback('');
                  }}
                />
              ))}
            </View>
          </Panel>

          <Panel style={styles.sectionPanel}>
            <Text style={styles.sectionTitle}>{selectedType === 'secondary_device' ? 'DEVICE DETAILS' : 'AUTHORITY DETAILS'}</Text>
            <Text style={styles.inputLabel}>{selectedType === 'secondary_device' ? 'Device label' : 'Authority display name'}</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={(value) => {
                setDisplayName(value);
                setFeedback('');
              }}
              placeholder={selectedType === 'secondary_device' ? 'Example: Home backup phone' : 'Trusted person or organization'}
              placeholderTextColor="#6f8197"
              style={styles.input}
              value={displayName}
            />

            {selectedType !== 'secondary_device' ? (
              <>
                <Text style={styles.inputLabel}>Contact channel</Text>
                <View style={styles.channelRow}>
                  {contactChannels.map((channel) => (
                    <Pressable
                      key={channel.id}
                      onPress={() => {
                        setContactChannel(channel.id);
                        setContact('');
                      }}
                      style={[styles.channelButton, contactChannel === channel.id && styles.channelButtonActive]}
                    >
                      <Text style={[styles.channelText, contactChannel === channel.id && styles.channelTextActive]}>{channel.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.inputLabel}>Contact locator</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType={contactChannel === 'email' ? 'email-address' : 'default'}
                  onChangeText={(value) => {
                    setContact(value);
                    setFeedback('');
                  }}
                  placeholder={contactChannel === 'email' ? 'authority@example.com' : 'Secure handle or directory identity'}
                  placeholderTextColor="#6f8197"
                  style={styles.input}
                  value={contact}
                />
                <Text style={styles.privacyNote}>The raw locator is validated, masked and discarded. Page 23 stores only masked metadata and an optional SHA-256 fingerprint.</Text>
              </>
            ) : (
              <Panel tone="yellow" style={styles.deviceNotice}>
                <RoundIcon symbol="▯" color={C.yellow} size={44} filled />
                <Text style={styles.deviceNoticeText}>A device you control cannot independently approve your recovery request. Device pairing is not connected and this selection creates a local draft only.</Text>
              </Panel>
            )}

            {selectedType === 'multi_sign' ? (
              <>
                <Text style={styles.inputLabel}>Requested authority quorum</Text>
                <View style={styles.quorumRow}>
                  {[2, 3].map((value) => (
                    <Pressable key={value} onPress={() => setRequestedQuorum(value)} style={[styles.quorumButton, requestedQuorum === value && styles.quorumButtonActive]}>
                      <Text style={[styles.quorumValue, requestedQuorum === value && styles.quorumValueActive]}>{value}</Text>
                      <Text style={styles.quorumLabel}>{value} approvals</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.privacyNote}>This records desired policy metadata only. Multi-authority enforcement and signer aggregation are not connected.</Text>
              </>
            ) : null}
          </Panel>

          <Panel style={styles.attestationPanel}>
            <Text style={styles.sectionTitle}>OWNER ATTESTATIONS</Text>
            {[
              {
                key: 'identity',
                checked: identityChecked,
                label: selectedType === 'secondary_device'
                  ? 'I personally identified this owner-controlled device.'
                  : 'I personally checked the intended authority identity and contact locator.',
                toggle: () => setIdentityChecked((value) => !value),
              },
              {
                key: 'secrets',
                checked: noSecrets,
                label: 'I included no seed phrase, private key, wallet password or Time Set.',
                toggle: () => setNoSecrets((value) => !value),
              },
              {
                key: 'custody',
                checked: noCustody,
                label: 'I understand this profile grants no custody, spending rights or wallet access.',
                toggle: () => setNoCustody((value) => !value),
              },
            ].map((item) => (
              <Pressable key={item.key} onPress={item.toggle} style={styles.attestationRow}>
                <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}><Text style={styles.checkboxMark}>{item.checked ? '✓' : ''}</Text></View>
                <Text style={styles.attestationText}>{item.label}</Text>
              </Pressable>
            ))}
          </Panel>
        </>
      ) : null}

      {enrollment.recoveryRequest.status === 'pending' && !currentProfile ? (
        <Panel tone="yellow" style={styles.orphanRequestPanel}>
          <RoundIcon symbol="!" color={C.yellow} size={50} filled />
          <View style={styles.orphanRequestCopy}>
            <Text style={styles.orphanRequestTitle}>Existing Authority Request Detected</Text>
            <Text style={styles.orphanRequestText}>A local recovery request exists without a matching Page 23 profile. Review or cancel it before creating a new enrollment.</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('OwnerAuthorityApproval')} style={styles.orphanRequestButton}><Text style={styles.orphanRequestButtonText}>Review Request</Text></Pressable>
        </Panel>
      ) : null}

      <Panel style={styles.checkPanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>ENROLLMENT EVIDENCE</Text>
            <Text style={styles.sectionSub}>Unavailable providers are never treated as completed enrollment</Text>
          </View>
          <Text style={[styles.sectionCount, { color: status.color }]}>{enrollment.checks.length}</Text>
        </View>
        {enrollment.checks.map((item, index) => (
          <CheckRow key={item.id} item={item} last={index === enrollment.checks.length - 1} />
        ))}
      </Panel>

      {visibleActivity.length ? (
        <Panel style={styles.activityPanel}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>LOCAL ENROLLMENT ACTIVITY</Text>
              <Text style={styles.sectionSub}>Stored through the current in-memory security boundary</Text>
            </View>
            {enrollment.activity.length > 4 ? (
              <Pressable onPress={() => setShowAllActivity((value) => !value)}><Text style={styles.activityToggle}>{showAllActivity ? 'Show less' : 'Show all'}</Text></Pressable>
            ) : null}
          </View>
          {visibleActivity.map((item, index) => (
            <ActivityRow key={item.id} item={item} last={index === visibleActivity.length - 1} />
          ))}
        </Panel>
      ) : null}

      {feedback ? (
        <Panel tone={/unable|blocked|cancelled|unverified|not connected|does not count/i.test(feedback) ? 'yellow' : 'green'} style={styles.feedbackPanel}>
          <Text style={styles.feedbackIcon}>i</Text>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </Panel>
      ) : null}

      {!hasCurrentProfile || enrollment.canOpenApproval ? (
        <PrimaryButton
          label={loading ? 'Checking Enrollment…' : primaryLabel}
          subtitle={primarySubtitle}
          icon="♙"
          tone="green"
          disabled={loading || (!enrollment.canOpenApproval && enrollment.walletIdentityAvailable && enrollment.walletStatus === 'unlocked' && !enrollment.frozen && !canSubmit)}
          onPress={primaryAction}
        />
      ) : null}

      <Panel style={styles.boundaryPanel}>
        <RoundIcon symbol="i" color={C.blue} size={44} />
        <Text style={styles.boundaryText}>
          Production Owner Authority enrollment requires verified identity, encrypted delivery, independent consent, signed enrollment receipts, expiry and revocation controls, replay protection, enforceable quorum policy and encrypted persistent records. None of those remote providers are connected in this build.
        </Text>
      </Panel>

      <BottomNav active="More" fifth={['•••', 'More', 'Settings']} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  errorBanner: { minHeight: 60, marginBottom: 14, borderWidth: 1, borderColor: C.red, borderRadius: 11, backgroundColor: 'rgba(80,8,18,.42)', padding: 12, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 16 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 10 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { minHeight: 220, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  heroGraphic: { width: 126, height: 126, borderRadius: 63, borderWidth: 5, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  heroMark: { fontSize: 54, fontWeight: '900' },
  heroShield: { position: 'absolute', right: 4, bottom: 3, fontSize: 30, fontWeight: '900' },
  heroCopy: { flex: 1, minWidth: 0 },
  heroEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  heroTitle: { fontSize: 25, fontWeight: '900', marginTop: 8 },
  heroText: { color: '#eef3f7', fontSize: 11, lineHeight: 18, marginTop: 8 },
  heroBoundary: { color: C.muted, fontSize: 9, lineHeight: 15, marginTop: 10 },
  heroStatus: { minWidth: 150, alignItems: 'flex-end' },
  heroStatusLabel: { color: C.muted, fontSize: 8, fontWeight: '900' },
  heroStatusValue: { maxWidth: 180, fontSize: 16, fontWeight: '900', textAlign: 'right', marginTop: 8 },
  heroStatusSub: { color: C.muted, fontSize: 8, textAlign: 'right', marginTop: 5 },
  metricRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  metricRowCompact: { flexDirection: 'column' },
  metricCard: { flex: 1, minHeight: 105, padding: 14 },
  metricLabel: { color: C.muted, fontSize: 8, fontWeight: '900' },
  metricStatus: { fontSize: 13, fontWeight: '900', marginTop: 10 },
  metricSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 7 },
  sectionPanel: { marginTop: 16, padding: 17 },
  profilePanel: { marginTop: 16, padding: 17 },
  checkPanel: { marginTop: 16, padding: 17 },
  activityPanel: { marginTop: 16, padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900', letterSpacing: .3 },
  sectionSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  sectionCount: { fontSize: 20, fontWeight: '900' },
  profileStatus: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, fontSize: 7, fontWeight: '900' },
  list: { marginTop: 13, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, overflow: 'hidden' },
  authorityRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  authoritySelected: { backgroundColor: 'rgba(32,239,112,.05)' },
  authorityCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  authorityTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  authoritySub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  authorityBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 5, fontSize: 6, fontWeight: '900', marginLeft: 8 },
  authorityArrow: { color: '#8aa1b3', fontSize: 25, marginLeft: 8 },
  inputLabel: { color: C.muted, fontSize: 9, marginTop: 15, marginBottom: 6 },
  input: { minHeight: 52, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.panel2, color: '#fff', paddingHorizontal: 14, fontSize: 12, outlineStyle: 'none' } as any,
  channelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  channelButton: { minHeight: 39, borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  channelButtonActive: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.06)' },
  channelText: { color: C.muted, fontSize: 9, fontWeight: '800' },
  channelTextActive: { color: C.green },
  privacyNote: { color: C.yellow, fontSize: 8, lineHeight: 14, marginTop: 8 },
  deviceNotice: { minHeight: 82, marginTop: 14, padding: 13, flexDirection: 'row', alignItems: 'center' },
  deviceNoticeText: { flex: 1, color: '#fff0d9', fontSize: 9, lineHeight: 15, marginLeft: 12 },
  quorumRow: { flexDirection: 'row', gap: 10 },
  quorumButton: { flex: 1, minHeight: 70, borderWidth: 1, borderColor: C.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quorumButtonActive: { borderColor: C.purple, backgroundColor: 'rgba(155,77,255,.08)' },
  quorumValue: { color: C.muted, fontSize: 22, fontWeight: '900' },
  quorumValueActive: { color: C.purple },
  quorumLabel: { color: C.muted, fontSize: 8, marginTop: 4 },
  attestationPanel: { marginTop: 16, padding: 17 },
  attestationRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  checkbox: { width: 27, height: 27, borderRadius: 7, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: C.green, backgroundColor: C.green },
  checkboxMark: { color: C.bg, fontSize: 14, fontWeight: '900' },
  attestationText: { flex: 1, color: '#eef3f7', fontSize: 10, lineHeight: 16, marginLeft: 11 },
  detailRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 9 },
  detailLabel: { color: C.muted, fontSize: 9, flex: .8 },
  detailValue: { flex: 1.2, color: '#fff', fontSize: 9, fontWeight: '700', textAlign: 'right' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  actionRowCompact: { flexDirection: 'column' },
  actionButton: { flexGrow: 1, minHeight: 46, borderWidth: 1, borderColor: C.blue, borderRadius: 9, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: C.blue, fontSize: 9, fontWeight: '900', textAlign: 'center' },
  orphanRequestPanel: { minHeight: 96, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  orphanRequestCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  orphanRequestTitle: { color: C.yellow, fontSize: 12, fontWeight: '900' },
  orphanRequestText: { color: '#fff0d9', fontSize: 9, lineHeight: 15, marginTop: 5 },
  orphanRequestButton: { borderWidth: 1, borderColor: C.yellow, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, marginLeft: 10 },
  orphanRequestButtonText: { color: C.yellow, fontSize: 8, fontWeight: '900' },
  checkRow: { minHeight: 85, flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  checkMark: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkMarkText: { fontSize: 15, fontWeight: '900' },
  checkCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  checkTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  checkDetail: { color: '#dce4ed', fontSize: 9, lineHeight: 14, marginTop: 4 },
  checkStatus: { fontSize: 8, fontWeight: '900', marginLeft: 8, textAlign: 'right' },
  activityRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  activityCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  activityTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  activityDetail: { color: '#dce4ed', fontSize: 8, lineHeight: 13, marginTop: 4 },
  activityTime: { color: C.muted, fontSize: 7, marginTop: 4 },
  activityToggle: { color: C.blue, fontSize: 9, fontWeight: '900' },
  feedbackPanel: { minHeight: 72, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  feedbackIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: C.yellow, color: C.yellow, textAlign: 'center', textAlignVertical: 'center', fontWeight: '900', marginRight: 11 },
  feedbackText: { flex: 1, color: '#fff0d9', fontSize: 9, lineHeight: 15 },
  boundaryPanel: { minHeight: 94, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  boundaryText: { flex: 1, minWidth: 0, color: '#edf2f7', fontSize: 9, lineHeight: 15, marginLeft: 12 },
  pressed: { opacity: .78 },
});
