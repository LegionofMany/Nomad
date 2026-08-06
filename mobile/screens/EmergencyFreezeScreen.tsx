import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
  useNomadEmergencyFreeze,
  type NomadEmergencyFreezeAsset,
  type NomadEmergencyFreezeCheck,
  type NomadEmergencyFreezeEvent,
  type NomadEmergencyFreezeReleaseMethod,
  type NomadFreezeScope,
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

type FreezeOptionItem = {
  scope: NomadFreezeScope;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  badge: string;
};

const freezeOptions: FreezeOptionItem[] = [
  {
    scope: 'entire_wallet',
    title: 'Freeze Entire Wallet',
    subtitle: 'Record the broadest outgoing-action policy and request an immediate wallet-session lock.',
    icon: '▰',
    color: C.red,
    badge: 'MAXIMUM',
  },
  {
    scope: 'travel_pocket',
    title: 'Freeze Travel Pocket',
    subtitle: 'Block Travel Pocket top-up, regional spending and POS review flows that consume the freeze policy.',
    icon: '✈',
    color: C.blue,
    badge: 'TRAVEL',
  },
  {
    scope: 'specific_assets',
    title: 'Record Selected Assets',
    subtitle: 'Attach chosen wallet assets to an incident while broader fallback protection remains in effect.',
    icon: '◉',
    color: C.purple,
    badge: 'POLICY',
  },
  {
    scope: 'owner_authority_alert',
    title: 'Escalate to Owner Authority',
    subtitle: 'Create a local authority request and alert record without claiming remote delivery.',
    icon: '♙',
    color: C.green,
    badge: 'ALERT',
  },
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

function scopeLabel(scope?: NomadFreezeScope) {
  if (scope === 'entire_wallet') return 'Entire Wallet';
  if (scope === 'travel_pocket') return 'Travel Pocket';
  if (scope === 'specific_assets') return 'Selected Assets';
  if (scope === 'owner_authority_alert') return 'Owner Authority Alert';
  return 'No Active Scope';
}

function statusInfo(status: string) {
  if (status === 'active') return { color: C.red, tone: 'red' as const, title: 'EMERGENCY FREEZE ACTIVE', detail: 'The central security adapter reports an active protection scope.' };
  if (status === 'release_requested') return { color: C.yellow, tone: 'yellow' as const, title: 'RELEASE REVIEW PENDING', detail: 'A release path was selected, but the freeze remains active until verified evidence is consumed.' };
  if (status === 'legacy_freeze') return { color: C.red, tone: 'red' as const, title: 'ACTIVE FREEZE • RECEIPT MISSING', detail: 'The central adapter reports protection, but no matching Page 25 incident receipt is available.' };
  if (status === 'alert_recorded') return { color: C.yellow, tone: 'yellow' as const, title: 'AUTHORITY ALERT RECORDED', detail: 'A local alert exists. It does not prove remote delivery or freeze wallet actions.' };
  return { color: C.green, tone: 'green' as const, title: 'NO ACTIVE FREEZE', detail: 'Emergency protection can be activated without an unlocked wallet session.' };
}

function checkInfo(status: NomadEmergencyFreezeCheck['status']) {
  if (status === 'pass') return { color: C.green, mark: '✓', label: 'PASS' };
  if (status === 'warning') return { color: C.yellow, mark: '!', label: 'REVIEW' };
  if (status === 'fail') return { color: C.red, mark: '×', label: 'FAIL' };
  return { color: C.muted, mark: '—', label: 'UNAVAILABLE' };
}

function FreezeOption({
  item,
  selected,
  active,
  disabled,
  onPress,
}: {
  item: FreezeOptionItem;
  selected: boolean;
  active: boolean;
  disabled: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && { borderColor: item.color, backgroundColor: `${item.color}12` },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.optionIcon, { borderColor: `${item.color}66`, backgroundColor: `${item.color}16` }]}>
        <Text style={[styles.optionMark, { color: item.color }]}>{item.icon}</Text>
        <View style={[styles.optionBadgeIcon, { backgroundColor: active ? C.red : selected ? item.color : C.blue }]}>
          <Text style={styles.optionBadgeIconText}>{active ? '❄' : selected ? '✓' : '•'}</Text>
        </View>
      </View>
      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>{item.title}</Text>
        <Text style={styles.optionSub}>{item.subtitle}</Text>
      </View>
      <View style={styles.optionRight}>
        <Text style={[styles.protectionBadge, { color: item.color, borderColor: `${item.color}66` }]}>
          {active ? 'ACTIVE' : item.badge}
        </Text>
        <Text style={[styles.optionArrow, { color: item.color }]}>{selected ? '✓' : '›'}</Text>
      </View>
    </Pressable>
  );
}

function AssetRow({
  asset,
  selected,
  onPress,
  last,
}: {
  asset: NomadEmergencyFreezeAsset;
  selected: boolean;
  onPress(): void;
  last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.assetRow, !last && styles.rowBorder, pressed && styles.pressed]}>
      <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
        <Text style={styles.checkboxMark}>{selected ? '✓' : ''}</Text>
      </View>
      <View style={styles.assetCopy}>
        <Text style={styles.assetTitle}>{asset.symbol} • {asset.name}</Text>
        <Text style={styles.assetSub}>{asset.network || asset.chainId || 'Network unavailable'} • {asset.balance}</Text>
      </View>
      <Text style={[styles.assetState, { color: selected ? C.purple : C.muted }]}>{selected ? 'INCLUDED' : 'SELECT'}</Text>
    </Pressable>
  );
}

function CheckRow({ item, last }: { item: NomadEmergencyFreezeCheck; last?: boolean }) {
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

function DetailRow({ label, value, color = '#fff', last }: { label: string; value: string; color?: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, !last && styles.rowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
  );
}

function ActivityRow({ item, last }: { item: NomadEmergencyFreezeEvent; last?: boolean }) {
  const color = item.severity === 'critical' ? C.red : item.severity === 'warning' ? C.yellow : C.blue;
  return (
    <View style={[styles.activityRow, !last && styles.rowBorder]}>
      <RoundIcon symbol={item.type === 'activation' ? '❄' : item.type === 'alert' ? '♙' : item.type === 'release_request' ? '↺' : 'i'} color={color} size={42} filled />
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityDetail}>{item.detail}</Text>
        <Text style={styles.activityTime}>{formatDate(item.timestamp)}</Text>
      </View>
    </View>
  );
}

export default function EmergencyFreezeScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { freeze, loading, error, refresh, activateFreeze, requestRelease } = useNomadEmergencyFreeze();

  const [selectedScope, setSelectedScope] = useState<NomadFreezeScope>('entire_wallet');
  const [selectedAssetKeys, setSelectedAssetKeys] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [confirmNoSecrets, setConfirmNoSecrets] = useState(false);
  const [confirmReleaseBoundary, setConfirmReleaseBoundary] = useState(false);
  const [releaseMethod, setReleaseMethod] = useState<NomadEmergencyFreezeReleaseMethod>('time_sets');
  const [releaseReason, setReleaseReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showAllActivity, setShowAllActivity] = useState(false);

  const info = statusInfo(freeze.status);
  const currentIncident = freeze.currentIncident;
  const centralActive = freeze.centralSecurity.freezeStatus !== 'none';
  const activeScope = freeze.activeScope;
  const visibleActivity = freeze.activity.slice(0, showAllActivity ? 16 : 5);
  const selectedOption = freezeOptions.find((item) => item.scope === selectedScope) ?? freezeOptions[0];

  useEffect(() => {
    if (activeScope && activeScope !== 'owner_authority_alert') setSelectedScope(activeScope);
  }, [activeScope]);

  const activationAllowedByCurrentScope = !centralActive
    || selectedScope === 'owner_authority_alert'
    || (selectedScope === 'entire_wallet' && activeScope !== 'entire_wallet');
  const hasRequiredAssets = selectedScope !== 'specific_assets' || selectedAssetKeys.length > 0;
  const canActivate = freeze.canActivateFreeze
    && activationAllowedByCurrentScope
    && reason.trim().length >= 8
    && hasRequiredAssets
    && confirmNoSecrets
    && confirmReleaseBoundary;

  const toggleAsset = (key: string) => {
    setSelectedAssetKeys((current) => current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key]);
    setFeedback('');
  };

  const handleActivate = async () => {
    try {
      setFeedback(`Activating ${selectedOption.title.toLowerCase()} through the central security adapter…`);
      const next = await activateFreeze({
        scope: selectedScope,
        selectedAssetKeys,
        reason,
      });
      const incident = next.currentIncident;
      setReason('');
      setSelectedAssetKeys([]);
      setConfirmNoSecrets(false);
      setConfirmReleaseBoundary(false);
      setFeedback(selectedScope === 'owner_authority_alert'
        ? 'A local Owner Authority alert and approval request were recorded. Remote delivery is not confirmed.'
        : incident?.scope === 'entire_wallet' && !incident.walletLockConfirmed
          ? 'The central freeze is active, but the connected wallet session lock was not confirmed. Review the evidence below.'
          : `${incident?.scopeLabel || 'Emergency'} protection is recorded. Direct release remains disabled.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to activate emergency protection.');
    }
  };

  const handleReleaseRequest = async () => {
    try {
      setFeedback('Recording a verified release request while keeping the freeze active…');
      await requestRelease(releaseMethod, releaseReason);
      setReleaseReason('');
      setFeedback(releaseMethod === 'owner_authority'
        ? 'A local Owner Authority release request is pending. Remote delivery and signed approval remain unverified.'
        : 'Time Set verification was selected. The freeze remains active until a release provider consumes verified evidence.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to create the release request.');
    }
  };

  return (
    <NomadPage maxWidth={960}>
      <PageHeader
        title="Emergency Freeze"
        subtitle="Record protection first; release only through verified evidence"
        icon="❄"
        color={info.color}
        status={false}
        help
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel tone={info.tone} style={[styles.hero, compact && styles.heroCompact]}>
        <View style={[styles.heroIcon, { borderColor: info.color }]}>
          <Text style={[styles.heroMark, { color: info.color }]}>{freeze.status === 'clear' ? '▣' : '❄'}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroEyebrow, { color: info.color }]}>EMERGENCY SECURITY STATE</Text>
          <Text style={[styles.heroTitle, { color: info.color }]}>{info.title}</Text>
          <Text style={styles.heroText}>{info.detail}</Text>
          <Text style={styles.heroWarning}>Incoming-fund availability, chain-level enforcement and remote authority delivery are not independently confirmed by Page 25.</Text>
        </View>
        <View style={styles.heroStatus}>
          <Text style={styles.heroStatusLabel}>CENTRAL SCOPE</Text>
          <Text style={[styles.heroStatusValue, { color: info.color }]}>{scopeLabel(activeScope)}</Text>
          <Text style={styles.heroStatusSub}>{freeze.centralSecurity.freezeStatus.toUpperCase()} • {freeze.walletSessionStatus.toUpperCase()}</Text>
        </View>
      </Panel>

      <View style={[styles.metricRow, compact && styles.metricRowCompact]}>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>CENTRAL POLICY</Text>
          <Text style={[styles.metricStatus, { color: centralActive ? C.red : C.green }]}>{centralActive ? 'ACTIVE' : 'CLEAR'}</Text>
          <Text style={styles.metricSub}>Connected through the Nomad security bridge</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>DIRECT RELEASE</Text>
          <Text style={[styles.metricStatus, { color: C.red }]}>DISABLED</Text>
          <Text style={styles.metricSub}>No Page 25 clear or unfreeze control</Text>
        </Panel>
        <Panel style={styles.metricCard}>
          <Text style={styles.metricLabel}>AUDIT STORAGE</Text>
          <Text style={[styles.metricStatus, { color: C.yellow }]}>LOCAL STUB</Text>
          <Text style={styles.metricSub}>Encrypted durable storage is not connected</Text>
        </Panel>
      </View>

      {currentIncident ? (
        <Panel style={styles.incidentPanel}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>CURRENT INCIDENT RECEIPT</Text>
              <Text style={styles.sectionSub}>Secret-free local metadata bound to the active or pending scope</Text>
            </View>
            <Text style={[styles.incidentBadge, { color: info.color, borderColor: info.color }]}>{currentIncident.status.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
          <DetailRow label="Incident ID" value={currentIncident.id} />
          <DetailRow label="Scope" value={currentIncident.scopeLabel} />
          <DetailRow label="Reason" value={currentIncident.reason} />
          <DetailRow label="Activated" value={formatDate(currentIncident.activatedAt)} />
          <DetailRow label="Central Policy Recorded" value={currentIncident.centralPolicyRecorded ? 'YES' : 'NO'} color={currentIncident.centralPolicyRecorded ? C.green : C.red} />
          <DetailRow label="Wallet Lock Requested" value={currentIncident.walletLockRequested ? 'YES' : 'NO'} />
          <DetailRow label="Wallet Lock Confirmed" value={currentIncident.walletLockConfirmed ? 'YES' : 'NO'} color={currentIncident.walletLockConfirmed ? C.green : currentIncident.walletLockRequested ? C.red : C.muted} />
          <DetailRow label="Authority Request" value={currentIncident.authorityRequestStatus.toUpperCase()} color={currentIncident.authorityRequestStatus === 'pending' ? C.yellow : C.muted} />
          <DetailRow label="Remote Delivery" value="UNCONFIRMED" color={C.red} />
          <DetailRow label="Contains Secrets" value="NO" color={C.green} last />

          {currentIncident.selectedAssets.length ? (
            <View style={styles.selectedSummary}>
              <Text style={styles.selectedSummaryTitle}>INCIDENT ASSETS</Text>
              <View style={styles.assetTags}>
                {currentIncident.selectedAssets.map((asset) => (
                  <Text key={asset.key} style={styles.assetTag}>{asset.symbol} • {asset.network || asset.chainId || 'Unknown network'}</Text>
                ))}
              </View>
              <Text style={styles.selectedSummaryNote}>These assets are recorded as policy metadata. Chain-specific selective signing enforcement is not connected.</Text>
            </View>
          ) : null}
        </Panel>
      ) : null}

      {freeze.blockedActions.length ? (
        <Panel tone="red" style={styles.blockedPanel}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>PROTECTED ACTIONS</Text>
              <Text style={styles.sectionSub}>Expected local policy effects; chain-level confirmation is separate</Text>
            </View>
            <Text style={[styles.sectionCount, { color: C.red }]}>{freeze.blockedActions.length}</Text>
          </View>
          {freeze.blockedActions.map((item) => (
            <View key={item} style={styles.blockedRow}><Text style={styles.blockedMark}>×</Text><Text style={styles.blockedText}>{item}</Text></View>
          ))}
        </Panel>
      ) : null}

      <Panel style={styles.scopePanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>CHOOSE PROTECTION ACTION</Text>
            <Text style={styles.sectionSub}>An active scope can only be escalated to Entire Wallet or paired with an authority alert</Text>
          </View>
          <Text style={[styles.sectionCount, { color: selectedOption.color }]}>4</Text>
        </View>
        {freezeOptions.map((item) => {
          const scopeDisabled = loading || (centralActive
            && item.scope !== 'owner_authority_alert'
            && !(item.scope === 'entire_wallet' && activeScope !== 'entire_wallet'));
          return (
            <FreezeOption
              key={item.scope}
              item={item}
              selected={selectedScope === item.scope}
              active={centralActive && activeScope === item.scope}
              disabled={scopeDisabled}
              onPress={() => {
                setSelectedScope(item.scope);
                setFeedback('');
              }}
            />
          );
        })}
      </Panel>

      {selectedScope === 'specific_assets' ? (
        <Panel style={styles.assetPanel}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>SELECT WALLET ASSETS</Text>
              <Text style={styles.sectionSub}>Attach one or more current wallet-snapshot assets to the incident</Text>
            </View>
            <Text style={[styles.sectionCount, { color: C.purple }]}>{selectedAssetKeys.length}</Text>
          </View>
          {freeze.walletAssets.length ? freeze.walletAssets.map((asset, index) => (
            <AssetRow
              key={asset.key}
              asset={asset}
              selected={selectedAssetKeys.includes(asset.key)}
              last={index === freeze.walletAssets.length - 1}
              onPress={() => toggleAsset(asset.key)}
            />
          )) : (
            <View style={styles.emptyState}>
              <RoundIcon symbol="◉" color={C.yellow} size={52} filled />
              <Text style={styles.emptyTitle}>No Wallet Assets Available</Text>
              <Text style={styles.emptyText}>Refresh the connected wallet snapshot or choose Entire Wallet protection.</Text>
            </View>
          )}
          <Text style={styles.policyWarning}>Selected-assets mode records the intended scope but cannot prove chain-specific enforcement. Connected transaction adapters may apply a broader fallback block.</Text>
        </Panel>
      ) : null}

      <Panel style={styles.activationPanel}>
        <Text style={styles.sectionTitle}>ACTIVATION REVIEW</Text>
        <Text style={styles.inputLabel}>Emergency reason</Text>
        <TextInput
          accessibilityLabel="Emergency freeze reason"
          multiline
          onChangeText={(value) => {
            setReason(value);
            setFeedback('');
          }}
          placeholder="Example: Device lost during travel; block outgoing actions while ownership is verified."
          placeholderTextColor="#718096"
          style={styles.reasonInput}
          value={reason}
        />
        <Text style={styles.reasonNote}>Do not enter a seed phrase, private key, wallet password or Time Set.</Text>

        <Pressable onPress={() => setConfirmNoSecrets((value) => !value)} style={styles.attestationRow}>
          <View style={[styles.checkbox, confirmNoSecrets && styles.checkboxChecked]}><Text style={styles.checkboxMark}>{confirmNoSecrets ? '✓' : ''}</Text></View>
          <Text style={styles.attestationText}>I included no wallet secrets in this incident reason.</Text>
        </Pressable>
        <Pressable onPress={() => setConfirmReleaseBoundary((value) => !value)} style={styles.attestationRow}>
          <View style={[styles.checkbox, confirmReleaseBoundary && styles.checkboxChecked]}><Text style={styles.checkboxMark}>{confirmReleaseBoundary ? '✓' : ''}</Text></View>
          <Text style={styles.attestationText}>I understand activation is immediate, while release requires a separate verified workflow.</Text>
        </Pressable>

        <PrimaryButton
          label={loading ? 'Recording Protection…' : selectedScope === 'owner_authority_alert' ? 'Record Authority Escalation' : `Activate ${selectedOption.title}`}
          subtitle={selectedScope === 'entire_wallet'
            ? 'Central freeze first, then request wallet-session lock'
            : selectedScope === 'specific_assets'
              ? 'Record selected assets and apply the central fallback policy'
              : selectedScope === 'owner_authority_alert'
                ? 'Create a local request; remote delivery remains unconfirmed'
                : 'Block Travel Pocket flows that consume the central policy'}
          icon={selectedOption.icon}
          tone="green"
          disabled={loading || !canActivate}
          onPress={() => void handleActivate()}
        />
      </Panel>

      {freeze.canRequestRelease && currentIncident ? (
        <Panel tone="yellow" style={styles.releasePanel}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>REQUEST VERIFIED RELEASE</Text>
              <Text style={styles.sectionSub}>This records a release path but does not clear the central freeze</Text>
            </View>
            <Text style={styles.releaseBadge}>FREEZE STAYS ACTIVE</Text>
          </View>

          <View style={[styles.releaseMethodRow, compact && styles.releaseMethodRowCompact]}>
            <Pressable onPress={() => setReleaseMethod('time_sets')} style={[styles.releaseMethod, releaseMethod === 'time_sets' && styles.releaseMethodActive]}>
              <RoundIcon symbol="◷" color={releaseMethod === 'time_sets' ? C.green : C.muted} size={44} filled />
              <Text style={styles.releaseMethodTitle}>Time Set Verification</Text>
              <Text style={styles.releaseMethodText}>Continue through the protected recovery sequence.</Text>
            </Pressable>
            <Pressable onPress={() => setReleaseMethod('owner_authority')} style={[styles.releaseMethod, releaseMethod === 'owner_authority' && styles.releaseMethodActive]}>
              <RoundIcon symbol="♙" color={releaseMethod === 'owner_authority' ? C.green : C.muted} size={44} filled />
              <Text style={styles.releaseMethodTitle}>Owner Authority</Text>
              <Text style={styles.releaseMethodText}>Create or reuse a local independent approval request.</Text>
            </Pressable>
          </View>

          <Text style={styles.inputLabel}>Release-review reason</Text>
          <TextInput
            accessibilityLabel="Emergency freeze release reason"
            multiline
            onChangeText={(value) => {
              setReleaseReason(value);
              setFeedback('');
            }}
            placeholder="Explain why release review is being requested. Do not include recovery secrets."
            placeholderTextColor="#718096"
            style={styles.releaseInput}
            value={releaseReason}
          />
          <PrimaryButton
            label={loading ? 'Recording Release Request…' : 'Request Verified Release Review'}
            subtitle="No direct clear occurs; the central freeze remains active"
            icon="↺"
            tone="green"
            disabled={loading || releaseReason.trim().length < 8}
            onPress={() => void handleReleaseRequest()}
          />

          <View style={[styles.releaseActions, compact && styles.releaseActionsCompact]}>
            <Pressable onPress={() => navigation.navigate('RecoveryCenter')} style={styles.releaseAction}><Text style={styles.releaseActionText}>Recovery Center</Text></Pressable>
            <Pressable onPress={() => navigation.navigate('RecoverLostWallet')} style={styles.releaseAction}><Text style={styles.releaseActionText}>Time Set Intake</Text></Pressable>
            <Pressable onPress={() => navigation.navigate('OwnerAuthorityApproval')} style={styles.releaseAction}><Text style={styles.releaseActionText}>Authority Evidence</Text></Pressable>
          </View>
        </Panel>
      ) : null}

      <Panel style={styles.checkPanel}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>FREEZE EVIDENCE</Text>
            <Text style={styles.sectionSub}>Every enforcement and release boundary is evaluated independently</Text>
          </View>
          <Text style={[styles.sectionCount, { color: info.color }]}>{freeze.checks.length}</Text>
        </View>
        {freeze.checks.map((item, index) => (
          <CheckRow key={item.id} item={item} last={index === freeze.checks.length - 1} />
        ))}
      </Panel>

      {visibleActivity.length ? (
        <Panel style={styles.activityPanel}>
          <Pressable onPress={() => setShowAllActivity((value) => !value)} style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>EMERGENCY ACTIVITY</Text>
              <Text style={styles.sectionSub}>Page 25 activation, alert and release-request events</Text>
            </View>
            <Text style={styles.activityToggle}>{showAllActivity ? 'Show less −' : 'Show all +'}</Text>
          </Pressable>
          {visibleActivity.map((item, index) => (
            <ActivityRow key={item.id} item={item} last={index === visibleActivity.length - 1} />
          ))}
        </Panel>
      ) : null}

      {feedback ? (
        <Panel tone={/unable|not confirmed|unverified|disabled|cannot|already active|remains active/i.test(feedback) ? 'yellow' : 'green'} style={styles.feedbackPanel}>
          <Text style={styles.feedbackIcon}>i</Text>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </Panel>
      ) : null}

      <View style={[styles.navigationRow, compact && styles.navigationRowCompact]}>
        <Pressable onPress={() => navigation.navigate('SecurityCenter')} style={styles.navigationButton}><Text style={styles.navigationText}>Security Center</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('BlockPagesSafety')} style={styles.navigationButton}><Text style={styles.navigationText}>Reqrium Safety</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('Settings')} style={styles.navigationButton}><Text style={styles.navigationText}>Security Settings</Text></Pressable>
      </View>

      <Panel style={styles.boundaryPanel}>
        <RoundIcon symbol="i" color={C.blue} size={44} />
        <Text style={styles.boundaryText}>Production Emergency Freeze still requires chain-specific signing policy, hardware-backed wallet locking, server or device attestation, encrypted durable audit logs, independent authority delivery, signed release receipts and a provider that consumes verified release evidence. Page 25 does not directly clear protection.</Text>
      </Panel>

      <BottomNav active="Security" fifth={['•••', 'More', 'Settings']} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  errorBanner: { minHeight: 60, marginBottom: 14, borderWidth: 1, borderColor: C.red, borderRadius: 11, backgroundColor: 'rgba(80,8,18,.42)', padding: 12, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10, lineHeight: 16 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 10 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { minHeight: 205, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 19 },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  heroIcon: { width: 126, height: 126, borderRadius: 63, borderWidth: 5, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  heroMark: { fontSize: 60, fontWeight: '900' },
  heroCopy: { flex: 1, minWidth: 0 },
  heroEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  heroTitle: { fontSize: 22, fontWeight: '900', marginTop: 8 },
  heroText: { color: '#f1f5f9', fontSize: 11, lineHeight: 18, marginTop: 8 },
  heroWarning: { color: '#f3d9d9', fontSize: 9, lineHeight: 15, marginTop: 10 },
  heroStatus: { minWidth: 150, alignItems: 'flex-end' },
  heroStatusLabel: { color: C.muted, fontSize: 8 },
  heroStatusValue: { fontSize: 16, fontWeight: '900', marginTop: 8, textAlign: 'right' },
  heroStatusSub: { color: C.muted, fontSize: 8, marginTop: 6, textAlign: 'right' },
  metricRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  metricRowCompact: { flexDirection: 'column' },
  metricCard: { flex: 1, minHeight: 102, padding: 14 },
  metricLabel: { color: C.muted, fontSize: 8, fontWeight: '900' },
  metricStatus: { fontSize: 14, fontWeight: '900', marginTop: 10 },
  metricSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 7 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900', letterSpacing: .3 },
  sectionSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  sectionCount: { fontSize: 24, fontWeight: '900' },
  incidentPanel: { marginTop: 16, padding: 17 },
  incidentBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, fontSize: 8, fontWeight: '900' },
  detailRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 9 },
  detailLabel: { color: C.muted, fontSize: 9, flex: .85 },
  detailValue: { flex: 1.15, color: '#fff', fontSize: 9, fontWeight: '700', textAlign: 'right' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  selectedSummary: { marginTop: 15, borderTopWidth: 1, borderTopColor: C.borderSoft, paddingTop: 14 },
  selectedSummaryTitle: { color: C.purple, fontSize: 10, fontWeight: '900' },
  assetTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  assetTag: { borderWidth: 1, borderColor: C.purple, borderRadius: 999, color: C.purple, paddingHorizontal: 9, paddingVertical: 5, fontSize: 8, fontWeight: '800' },
  selectedSummaryNote: { color: C.yellow, fontSize: 8, lineHeight: 14, marginTop: 10 },
  blockedPanel: { marginTop: 16, padding: 17 },
  blockedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 11 },
  blockedMark: { color: C.red, fontSize: 15, fontWeight: '900', marginRight: 10 },
  blockedText: { flex: 1, color: '#f1e1e1', fontSize: 10, lineHeight: 15 },
  scopePanel: { marginTop: 16, padding: 17 },
  option: { minHeight: 105, marginTop: 12, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.panel2, padding: 14, flexDirection: 'row', alignItems: 'center' },
  optionIcon: { width: 67, height: 67, borderRadius: 34, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  optionMark: { fontSize: 29, fontWeight: '900' },
  optionBadgeIcon: { position: 'absolute', right: -2, bottom: 2, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionBadgeIconText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  optionCopy: { flex: 1, minWidth: 0 },
  optionTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  optionSub: { color: '#d6dee8', fontSize: 9, lineHeight: 15, marginTop: 5 },
  optionRight: { alignItems: 'flex-end', marginLeft: 9 },
  protectionBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, fontSize: 7, fontWeight: '900' },
  optionArrow: { fontSize: 24, marginTop: 6 },
  assetPanel: { marginTop: 16, padding: 17 },
  assetRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkbox: { width: 25, height: 25, borderWidth: 1, borderColor: C.border, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: C.green, backgroundColor: C.green },
  checkboxMark: { color: C.bg, fontSize: 13, fontWeight: '900' },
  assetCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  assetTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  assetSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  assetState: { fontSize: 8, fontWeight: '900', marginLeft: 9 },
  emptyState: { minHeight: 135, alignItems: 'center', justifyContent: 'center', padding: 18 },
  emptyTitle: { color: '#fff', fontSize: 13, fontWeight: '900', marginTop: 10 },
  emptyText: { color: C.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 6 },
  policyWarning: { color: C.yellow, fontSize: 8, lineHeight: 14, marginTop: 12 },
  activationPanel: { marginTop: 16, padding: 17 },
  inputLabel: { color: C.muted, fontSize: 9, marginTop: 15, marginBottom: 6 },
  reasonInput: { minHeight: 110, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.panel2, color: '#fff', padding: 13, fontSize: 10, lineHeight: 17, textAlignVertical: 'top', outlineStyle: 'none' } as any,
  reasonNote: { color: C.yellow, fontSize: 8, lineHeight: 14, marginTop: 8 },
  attestationRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  attestationText: { flex: 1, color: '#eef3f7', fontSize: 9, lineHeight: 15, marginLeft: 10 },
  releasePanel: { marginTop: 16, padding: 17 },
  releaseBadge: { color: C.red, borderWidth: 1, borderColor: C.red, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, fontSize: 7, fontWeight: '900' },
  releaseMethodRow: { flexDirection: 'row', gap: 11, marginTop: 15 },
  releaseMethodRowCompact: { flexDirection: 'column' },
  releaseMethod: { flex: 1, minHeight: 132, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14 },
  releaseMethodActive: { borderColor: C.green, backgroundColor: 'rgba(32,239,112,.05)' },
  releaseMethodTitle: { color: '#fff', fontSize: 11, fontWeight: '900', marginTop: 9 },
  releaseMethodText: { color: C.muted, fontSize: 8, lineHeight: 14, marginTop: 5 },
  releaseInput: { minHeight: 92, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.panel2, color: '#fff', padding: 13, fontSize: 10, lineHeight: 17, textAlignVertical: 'top', outlineStyle: 'none' } as any,
  releaseActions: { flexDirection: 'row', gap: 9, marginTop: 13 },
  releaseActionsCompact: { flexDirection: 'column' },
  releaseAction: { flex: 1, minHeight: 47, borderWidth: 1, borderColor: C.border, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  releaseActionText: { color: C.blue, fontSize: 9, fontWeight: '900' },
  checkPanel: { marginTop: 16, padding: 17 },
  checkRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  checkMark: { width: 35, height: 35, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkMarkText: { fontSize: 15, fontWeight: '900' },
  checkCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  checkTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  checkDetail: { color: '#dce4ed', fontSize: 8, lineHeight: 14, marginTop: 4 },
  checkStatus: { fontSize: 8, fontWeight: '900', marginLeft: 8 },
  activityPanel: { marginTop: 16, padding: 17 },
  activityToggle: { color: C.blue, fontSize: 9, fontWeight: '900' },
  activityRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  activityCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  activityTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  activityDetail: { color: C.muted, fontSize: 8, lineHeight: 14, marginTop: 4 },
  activityTime: { color: C.blue, fontSize: 7, marginTop: 5 },
  feedbackPanel: { minHeight: 70, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  feedbackIcon: { color: C.yellow, fontSize: 24, fontWeight: '900', marginRight: 12 },
  feedbackText: { flex: 1, color: '#fff0d9', fontSize: 9, lineHeight: 15 },
  navigationRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  navigationRowCompact: { flexDirection: 'column' },
  navigationButton: { flex: 1, minHeight: 50, borderWidth: 1, borderColor: C.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navigationText: { color: C.blue, fontSize: 9, fontWeight: '900' },
  boundaryPanel: { minHeight: 90, marginTop: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  boundaryText: { flex: 1, minWidth: 0, color: '#edf2f7', fontSize: 9, lineHeight: 15, marginLeft: 12 },
  pressed: { opacity: .78 },
  disabled: { opacity: .42 },
});
