import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useNomadProtocols, useNomadSecurity } from '../nomad';
import type {
  ArkriliumHealthItem,
  ArkriliumProtocolId,
  ArkriliumProtocolRow,
  ArkriliumProtocolStatus,
} from '../nomad';
import {
  C,
  NomadGlyph,
  NomadPage,
  Panel,
  useNomadLayout,
} from '../ui/NomadShell';

type ProtocolArtworkKind =
  | 'shield'
  | 'interoperability'
  | 'key'
  | 'notary'
  | 'transmission'
  | 'governance'
  | 'cube'
  | 'clock'
  | 'globe'
  | 'wallet'
  | 'recovery'
  | 'safety'
  | 'telemetry'
  | 'docs'
  | 'developer'
  | 'contract'
  | 'audit'
  | 'forum'
  | 'architecture';

type ResourceId = 'docs' | 'developer' | 'contracts' | 'audits' | 'community';

const protocolPresentation: Record<ArkriliumProtocolId, { title: string; subtitle: string; artwork: ProtocolArtworkKind }> = {
  security_layer: {
    title: 'Voltaire Security Layer',
    subtitle: 'Multi-layered wallet security and recovery protection',
    artwork: 'shield',
  },
  interoperability: {
    title: 'Voltaire Interoperability Protocol (VIP)',
    subtitle: 'Swap, travel and cross-service routing boundaries',
    artwork: 'interoperability',
  },
  key_management: {
    title: 'Voltaire Key Management Protocol (VKP)',
    subtitle: 'Sovereign key control and recovery evidence',
    artwork: 'key',
  },
  notary_verification: {
    title: 'Voltaire Notary Protocol (VNP)',
    subtitle: 'Reqrium verification and digital safety evidence',
    artwork: 'notary',
  },
  data_transmission: {
    title: 'Voltaire Data Transmission Protocol (VDTP)',
    subtitle: 'Encrypted messaging and delivery-provider boundary',
    artwork: 'transmission',
  },
  governance: {
    title: 'Voltaire Governance Protocol (VGP)',
    subtitle: 'Protocol proposals, voting and upgrade controls',
    artwork: 'governance',
  },
};

const healthArtwork: Record<string, ProtocolArtworkKind> = {
  'Wallet Session': 'wallet',
  'Security Score': 'shield',
  'Recovery Score': 'recovery',
  'Reqrium Safety': 'safety',
  'Remote Telemetry': 'telemetry',
};

const resources: Array<{ id: ResourceId; title: string; subtitle: string; artwork: ProtocolArtworkKind }> = [
  { id: 'docs', title: 'Protocol Docs', subtitle: 'Learn & Explore', artwork: 'docs' },
  { id: 'developer', title: 'Developer Hub', subtitle: 'Build on Voltaire', artwork: 'developer' },
  { id: 'contracts', title: 'Smart Contracts', subtitle: 'Registry & Evidence', artwork: 'contract' },
  { id: 'audits', title: 'Audit Reports', subtitle: 'Transparency', artwork: 'audit' },
  { id: 'community', title: 'Community Forum', subtitle: 'Join the Discussion', artwork: 'forum' },
];

const resourceDetails: Record<ResourceId, { title: string; body: string; route?: string; action?: string }> = {
  docs: {
    title: 'Protocol Documentation',
    body: 'The connected local adapters expose architecture and provider boundaries. A public documentation provider is not connected yet.',
    action: 'View Architecture',
  },
  developer: {
    title: 'Developer Hub',
    body: 'The developer portal is not connected in this build. Adapter routes and evidence remain available for local review.',
    route: 'Settings',
    action: 'Review Connections',
  },
  contracts: {
    title: 'Smart Contract Registry',
    body: 'No verified Voltaire contract registry or deployment manifest is connected. Nomad will not label contracts as audited without signed evidence.',
  },
  audits: {
    title: 'Audit Reports',
    body: 'Open the Security Center to review the checks that are available locally. Independent signed audit reports are not connected.',
    route: 'SecurityCenter',
    action: 'Open Security Center',
  },
  community: {
    title: 'Community Forum',
    body: 'No authenticated community or governance forum provider is connected to Nomad yet.',
  },
};

const orbitDots: Array<[number, number]> = [
  [46, 38], [72, 25], [104, 22], [137, 33], [168, 24], [203, 27], [235, 40], [263, 62],
  [280, 92], [286, 126], [275, 158], [249, 181], [219, 195], [183, 202], [148, 198],
  [112, 202], [80, 188], [55, 166], [40, 136], [36, 101], [38, 68],
];

function VoltaireBadge({ size = 52, color = C.green }: { size?: number; color?: string }) {
  return (
    <Svg accessibilityLabel="Voltaire Protocols badge" width={size} height={size} viewBox="0 0 56 64" fill="none">
      <Defs><LinearGradient id="voltaireBadge" x1="8" y1="5" x2="48" y2="58"><Stop stopColor={color} stopOpacity={0.22} /><Stop offset="1" stopColor={color} stopOpacity={0.04} /></LinearGradient></Defs>
      <Path d="M28 3 51 15v34L28 61 5 49V15Z" fill="url(#voltaireBadge)" stroke={color} strokeWidth="2.6" />
      <Path d="M28 8 46 18v28L28 56 10 46V18Z" stroke={color} strokeOpacity={0.5} />
      <Path d="m17 21 11 25 11-25h-7l-4 12-4-12Z" fill={color} />
    </Svg>
  );
}

function ProtocolArtwork({ kind, color = C.green, size = 42 }: { kind: ProtocolArtworkKind; color?: string; size?: number }) {
  const stroke = { stroke: color, strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let artwork: React.ReactNode;

  switch (kind) {
    case 'shield':
      artwork = <><Path d="M24 4 41 12v13c0 11-6 18-17 23C13 43 7 36 7 25V12Z" {...stroke} /><Path d="m15 25 6 6 12-14" {...stroke} /></>;
      break;
    case 'interoperability':
      artwork = <><Circle cx="24" cy="9" r="4" {...stroke} /><Circle cx="8" cy="29" r="4" {...stroke} /><Circle cx="39" cy="29" r="4" {...stroke} /><Circle cx="24" cy="43" r="4" {...stroke} /><Path d="M21 12 11 26M27 12l9 14M12 31l9 9M36 32l-9 8M12 29h23" {...stroke} /></>;
      break;
    case 'key':
      artwork = <><Circle cx="25" cy="14" r="8" {...stroke} /><Path d="M21 21 10 42M12 38l6 3M15 32l6 3M25 10v8M21 14h8" {...stroke} /></>;
      break;
    case 'notary':
      artwork = <><Rect x="8" y="5" width="27" height="37" rx="4" {...stroke} /><Path d="M15 14h13M15 21h13M15 28h8M32 28l10 5-3 11H28l-3-11Z" {...stroke} /><Circle cx="33.5" cy="35" r="2.5" {...stroke} /></>;
      break;
    case 'transmission':
      artwork = <><Path d="M15 39a19 19 0 0 1 0-30M33 9a19 19 0 0 1 0 30M19 33a12 12 0 0 1 0-18M29 15a12 12 0 0 1 0 18" {...stroke} /><Circle cx="24" cy="24" r="4" {...stroke} /></>;
      break;
    case 'governance':
      artwork = <><Circle cx="17" cy="16" r="6" {...stroke} /><Circle cx="33" cy="17" r="5" {...stroke} /><Path d="M6 40c1-10 5-15 11-15s10 5 11 15M27 27c8-2 13 3 14 12" {...stroke} /></>;
      break;
    case 'cube':
      artwork = <><Path d="m24 4 17 10v20L24 44 7 34V14Z" {...stroke} /><Path d="m7 14 17 10 17-10M24 24v20M15 9l17 10" {...stroke} /></>;
      break;
    case 'clock':
      artwork = <><Circle cx="24" cy="24" r="18" {...stroke} /><Path d="M24 12v13l8 5" {...stroke} /></>;
      break;
    case 'globe':
      artwork = <><Circle cx="24" cy="24" r="18" {...stroke} /><Path d="M6 24h36M24 6c6 5 9 11 9 18s-3 13-9 18c-6-5-9-11-9-18s3-13 9-18Z" {...stroke} /></>;
      break;
    case 'wallet':
      artwork = <><Rect x="5" y="12" width="38" height="28" rx="7" {...stroke} /><Path d="M31 21h12v11H31a5.5 5.5 0 0 1 0-11Z" {...stroke} /><Circle cx="34" cy="26.5" r="1.7" fill={color} /></>;
      break;
    case 'recovery':
      artwork = <><Path d="M11 18a16 16 0 1 1-2 14M11 8v10H2" {...stroke} /><Path d="m17 25 5 5 10-11" {...stroke} /></>;
      break;
    case 'safety':
      artwork = <><Path d="M24 4 41 12v13c0 11-6 18-17 23C13 43 7 36 7 25V12Z" {...stroke} /><Path d="M17 32V17h8a5 5 0 0 1 0 10h-8M25 27l8 7" {...stroke} /></>;
      break;
    case 'telemetry':
      artwork = <><Path d="M14 38a18 18 0 0 1 0-28M34 10a18 18 0 0 1 0 28M19 32a11 11 0 0 1 0-16M29 16a11 11 0 0 1 0 16" {...stroke} /><Circle cx="24" cy="24" r="3" fill={color} /></>;
      break;
    case 'docs':
      artwork = <><Rect x="10" y="5" width="28" height="38" rx="4" {...stroke} /><Path d="M17 14h14M17 21h14M17 28h14M17 35h9" {...stroke} /></>;
      break;
    case 'developer':
      artwork = <><Circle cx="24" cy="14" r="7" {...stroke} /><Path d="M10 39c1-10 6-15 14-15s13 5 14 15M6 39h36M20 14h8M24 10v8" {...stroke} /></>;
      break;
    case 'contract':
      artwork = <><Path d="M10 5h20l8 8v30H10Z" {...stroke} /><Path d="M30 5v9h8M17 23h14M17 30h14M17 37h9" {...stroke} /></>;
      break;
    case 'audit':
      artwork = <><Path d="M10 5h20l8 8v30H10Z" {...stroke} /><Path d="M30 5v9h8M17 23h14M17 30h10M17 37h7" {...stroke} /><Path d="m29 36 3 3 7-8" {...stroke} /></>;
      break;
    case 'forum':
      artwork = <><Path d="M6 11h27v20H16l-8 7v-7H6Z" {...stroke} /><Path d="M20 18h22v18h-7l-6 6v-6h-9" {...stroke} /></>;
      break;
    default:
      artwork = <><Circle cx="11" cy="31" r="4" {...stroke} /><Circle cx="25" cy="11" r="4" {...stroke} /><Circle cx="39" cy="31" r="4" {...stroke} /><Path d="m14 28 8-13M28 14l8 13M15 31h20" {...stroke} /></>;
  }

  return <Svg accessibilityLabel={`${kind} protocol icon`} width={size} height={size} viewBox="0 0 48 48" fill="none">{artwork}</Svg>;
}

function statusInfo(status: ArkriliumProtocolStatus) {
  switch (status) {
    case 'available': return { color: C.green, label: 'ACTIVE', mark: '✓' };
    case 'limited': return { color: C.yellow, label: 'REVIEW', mark: '!' };
    case 'not_configured': return { color: C.purple, label: 'SETUP', mark: '+' };
    case 'unavailable': return { color: C.muted, label: 'UNAVAILABLE', mark: '—' };
  }
}

function healthStatus(status: ArkriliumHealthItem['status']) {
  if (status === 'pass') return { color: C.green, label: 'AVAILABLE' };
  if (status === 'review') return { color: C.yellow, label: 'REVIEW' };
  return { color: C.muted, label: 'UNAVAILABLE' };
}

function formatCheckedAt(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 'Not checked';
  return new Date(parsed).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function StatusMark({ color, symbol, size = 30 }: { color: string; symbol: string; size?: number }) {
  return <View style={[styles.statusMark, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}><Text style={[styles.statusMarkText, { color, fontSize: size * .58 }]}>{symbol}</Text></View>;
}

function SystemStatusPill({ compact, label, color }: { compact: boolean; label: string; color: string }) {
  return (
    <View accessibilityLabel={`All Systems ${label}`} style={[styles.systemPill, compact && styles.systemPillCompact, { borderColor: `${color}66` }]}>
      <ProtocolArtwork kind="shield" color={color} size={compact ? 27 : 34} />
      <View><Text style={[styles.systemTop, compact && styles.systemTopCompact]}>All Systems</Text><Text style={[styles.systemBottom, compact && styles.systemBottomCompact, { color }]}>{label}</Text></View>
    </View>
  );
}

function ProtocolHeader({ compact, systemLabel, systemColor }: { compact: boolean; systemLabel: string; systemColor: string }) {
  const navigation = useNavigation<any>();
  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <View style={styles.headerBrand}>
        <Pressable testID="protocols-back" accessibilityRole="button" accessibilityLabel="Back to Nomad Home" onPress={() => navigation.navigate('Portfolio')} style={({ pressed }) => [styles.backButton, compact && styles.backButtonCompact, pressed && styles.pressed]}><Text style={[styles.backText, compact && styles.backTextCompact]}>‹</Text></Pressable>
        <VoltaireBadge size={compact ? 43 : 55} />
        <View style={styles.headerCopy}>
          <View style={styles.titleLine}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.headerTitle, compact && styles.headerTitleCompact]}>Voltaire Protocols</Text><Text style={[styles.hubBadge, compact && styles.hubBadgeCompact]}>HUB</Text></View>
          <Text numberOfLines={2} style={[styles.headerSubtitle, compact && styles.headerSubtitleCompact]}>The protocols powering Nomad’s freedom layer.</Text>
        </View>
      </View>
      <View style={[styles.headerActions, compact && styles.headerActionsCompact]}>
        <SystemStatusPill compact={compact} label={systemLabel} color={systemColor} />
        <Pressable testID="protocols-help" accessibilityRole="button" accessibilityLabel="Open Voltaire Protocols help" onPress={() => navigation.navigate('Settings')} style={({ pressed }) => [styles.helpButton, compact && styles.helpButtonCompact, pressed && styles.pressed]}><Text style={[styles.helpText, compact && styles.helpTextCompact]}>?</Text></Pressable>
      </View>
    </View>
  );
}

function ProtocolHeroGraphic({ compact, color }: { compact: boolean; color: string }) {
  return (
    <View pointerEvents="none" style={[styles.heroGraphic, compact && styles.heroGraphicCompact]}>
      <Svg width="100%" height="100%" viewBox="0 0 330 230" fill="none">
        <Defs>
          <RadialGradient id="protocolGlow"><Stop stopColor={color} stopOpacity={0.38} /><Stop offset="1" stopColor={color} stopOpacity={0} /></RadialGradient>
          <LinearGradient id="protocolShield" x1="116" y1="56" x2="220" y2="180"><Stop stopColor="#77ffbd" stopOpacity={0.92} /><Stop offset=".55" stopColor={color} stopOpacity={0.62} /><Stop offset="1" stopColor="#015d44" stopOpacity={0.28} /></LinearGradient>
        </Defs>
        <Rect width="330" height="230" fill="url(#protocolGlow)" />
        <G stroke={color} strokeOpacity={0.55} strokeDasharray="3 5"><Circle cx="165" cy="110" r="89" /><Path d="M165 110 74 34M165 110l85-67M165 110l111 8M165 110l77 82M165 110 82 190M165 110 45 121" /></G>
        <G fill={color} opacity={0.45}>{orbitDots.map(([cx, cy], index) => <Circle key={`${cx}-${cy}-${index}`} cx={cx} cy={cy} r={index % 4 === 0 ? 2 : 1.2} />)}</G>
        <Ellipse cx="165" cy="190" rx="91" ry="25" fill="#03211a" stroke="#278cff" strokeOpacity={0.72} strokeWidth="3" />
        <Ellipse cx="165" cy="181" rx="69" ry="21" fill="#052c20" stroke={color} strokeWidth="2" strokeOpacity={0.72} />
        <Ellipse cx="165" cy="178" rx="41" ry="12" stroke={color} strokeWidth="2" strokeOpacity={0.75} />
        <Path d="M165 51 212 70v39c0 34-18 57-47 73-29-16-47-39-47-73V70Z" fill="url(#protocolShield)" stroke="#a5ffd4" strokeWidth="3" />
        <Path d="M165 64 201 79v30c0 26-14 44-36 57-22-13-36-31-36-57V79Z" fill="#063d2d" fillOpacity={0.38} stroke={color} />
        <Path d="m147 87 18 47 18-47h-11l-7 22-7-22Z" fill="#b9ffdc" />
        <G>
          <Circle cx="74" cy="34" r="18" fill="#06201a" stroke={C.green} /><Path d="M74 23 83 27v7c0 6-3 10-9 13-6-3-9-7-9-13v-7Z" stroke={C.green} strokeWidth="2" />
          <Circle cx="250" cy="43" r="18" fill="#041c24" stroke="#00e5ff" /><Path d="M245 50a11 11 0 0 1 0-14M255 36a11 11 0 0 1 0 14M250 43h.01" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" />
          <Circle cx="276" cy="118" r="18" fill="#041724" stroke={C.blue} /><Path d="m268 126 14-16M269 111l4-4 5 5-4 4M277 121l5 5-4 4-5-5" stroke={C.blue} strokeWidth="2" />
          <Circle cx="242" cy="192" r="18" fill="#061e1b" stroke="#20d7b0" /><Path d="M233 188h18v12h-18Z M237 188v-5h10v5" stroke="#20d7b0" strokeWidth="2" />
          <Circle cx="82" cy="190" r="18" fill="#211b08" stroke={C.yellow} /><Path d="M74 180h15v20H74Z M78 186h7M78 191h7" stroke={C.yellow} strokeWidth="2" />
          <Circle cx="45" cy="121" r="18" fill="#1e0e27" stroke={C.purple} /><Circle cx="41" cy="116" r="4" stroke={C.purple} strokeWidth="2" /><Circle cx="51" cy="117" r="3" stroke={C.purple} strokeWidth="2" /><Path d="M34 132c1-7 3-10 7-10s7 3 8 10M48 123c6-1 9 3 10 8" stroke={C.purple} strokeWidth="2" />
        </G>
      </Svg>
    </View>
  );
}

function ProtocolRow({ item, expanded, compact, last, onToggle }: { item: ArkriliumProtocolRow; expanded: boolean; compact: boolean; last?: boolean; onToggle(): void }) {
  const navigation = useNavigation<any>();
  const status = statusInfo(item.status);
  const presentation = protocolPresentation[item.id];
  const sourceLabel = item.source === 'not_connected' ? 'Provider absent' : 'Local evidence';
  return (
    <View style={[styles.protocolRow, compact && styles.protocolRowCompact, !last && styles.rowBorder]}>
      <Pressable testID={`protocol-row-${item.id}`} accessibilityRole="button" accessibilityLabel={`${presentation.title}. ${status.label}. ${item.detail}`} onPress={onToggle} style={({ pressed }) => [styles.protocolMain, pressed && styles.pressed]}>
        <View style={[styles.protocolIcon, compact && styles.protocolIconCompact, { borderColor: `${item.color}70`, backgroundColor: `${item.color}12` }]}><ProtocolArtwork kind={presentation.artwork} color={item.color} size={compact ? 31 : 40} /></View>
        <View style={styles.protocolCopy}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.protocolTitle, compact && styles.protocolTitleCompact]}>{presentation.title}</Text><Text numberOfLines={1} style={[styles.protocolSubtitle, compact && styles.protocolSubtitleCompact]}>{presentation.subtitle}</Text><Text style={[styles.protocolStatus, { color: status.color }]}>{status.mark} {status.label}  <Text style={styles.protocolEvidenceSummary}>• {sourceLabel}</Text></Text></View>
        <View style={styles.protocolRight}><Text style={[styles.protocolRightValue, compact && styles.protocolRightValueCompact, { color: status.color }]}>{item.statusLabel}</Text><Text style={styles.protocolRightLabel}>{sourceLabel}</Text></View>
        <Text style={styles.chevron}>{expanded ? '⌃' : '›'}</Text>
      </Pressable>
      {expanded ? (
        <View style={[styles.protocolDetails, compact && styles.protocolDetailsCompact]}>
          <Text style={styles.protocolDetailText}>{item.detail}</Text>
          <View style={styles.evidenceRow}><Text style={styles.evidenceLabel}>Provider</Text><Text style={styles.evidenceValue}>{item.provider}</Text><Text style={styles.evidenceLabel}>Checked</Text><Text style={styles.evidenceValue}>{formatCheckedAt(item.checkedAt)}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Open ${presentation.title} module`} onPress={() => navigation.navigate(item.route)} style={({ pressed }) => [styles.openModule, { borderColor: status.color }, pressed && styles.pressed]}><Text style={[styles.openModuleText, { color: status.color }]}>Open Connected Module  ›</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

function HealthCard({ item, compact }: { item: ArkriliumHealthItem; compact: boolean }) {
  const navigation = useNavigation<any>();
  const status = healthStatus(item.status);
  const content = <><Text numberOfLines={1} style={[styles.healthLabel, compact && styles.healthLabelCompact]}>{item.label}</Text><View style={styles.healthValueRow}><ProtocolArtwork kind={healthArtwork[item.label] ?? 'telemetry'} color={status.color} size={compact ? 19 : 25} /><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.healthValue, compact && styles.healthValueCompact]}>{item.value}</Text></View><Text numberOfLines={2} style={[styles.healthNote, compact && styles.healthNoteCompact, { color: status.color }]}>{item.note}</Text></>;
  if (!item.route) return <View style={[styles.healthCard, compact && styles.healthCardCompact]}>{content}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.label}`} onPress={() => navigation.navigate(item.route)} style={({ pressed }) => [styles.healthCard, compact && styles.healthCardCompact, pressed && styles.pressed]}>{content}</Pressable>;
}

function ResourceCard({ item, compact, active, onPress }: { item: typeof resources[number]; compact: boolean; active: boolean; onPress(): void }) {
  return (
    <Pressable testID={`protocol-resource-${item.id}`} accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={onPress} style={({ pressed }) => [styles.resourceCard, compact && styles.resourceCardCompact, active && styles.resourceCardActive, pressed && styles.pressed]}>
      <ProtocolArtwork kind={item.artwork} color={C.green} size={compact ? 24 : 31} />
      <Text numberOfLines={2} style={[styles.resourceTitle, compact && styles.resourceTitleCompact]}>{item.title}</Text>
      <Text numberOfLines={1} style={[styles.resourceSubtitle, compact && styles.resourceSubtitleCompact]}>{item.subtitle}</Text>
      <Text style={styles.resourceArrow}>›</Text>
    </Pressable>
  );
}

function ProtocolBottomNav({ compact, desktop }: { compact: boolean; desktop: boolean }) {
  const navigation = useNavigation<any>();
  if (desktop) return null;
  const items = [
    { label: 'Home', route: 'Portfolio', kind: 'home' as const },
    { label: 'Wallets', route: 'Wallets', kind: 'wallet' as const },
    { label: 'Travel', route: 'TravelMode', kind: 'travel' as const },
    { label: 'Protocols', route: 'VoltaireProtocols', kind: null },
    { label: 'Settings', route: 'Settings', kind: 'settings' as const },
  ];
  return (
    <View style={[styles.bottomNav, compact && styles.bottomNavCompact]}>{items.map((item) => {
      const selected = item.label === 'Protocols';
      return <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={`Open ${item.label}`} onPress={() => navigation.navigate(item.route)} style={[styles.navItem, selected && styles.navItemActive]}>{item.kind ? <NomadGlyph kind={item.kind} color={selected ? C.green : C.muted} size={compact ? 20 : 25} /> : <VoltaireBadge size={compact ? 25 : 31} />}<Text style={[styles.navLabel, compact && styles.navLabelCompact, selected && styles.navLabelSelected]}>{item.label}</Text></Pressable>;
    })}</View>
  );
}

export default function VoltaireProtocolsScreen() {
  const navigation = useNavigation<any>();
  const { compact, desktop } = useNomadLayout();
  const { protocols, loading, error, refresh, runCheck } = useNomadProtocols();
  const { security, loading: securityLoading } = useNomadSecurity();
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [activeResource, setActiveResource] = useState<ResourceId | null>(null);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState('');

  const localLayers = protocols.check.available + protocols.check.limited;
  const heroState = localLayers === 0 ? 'OFFLINE' : protocols.check.status === 'complete' ? 'ACTIVE' : 'LIMITED';
  const heroColor = heroState === 'ACTIVE' ? C.green : heroState === 'LIMITED' ? C.yellow : C.red;
  const heroTone = heroState === 'ACTIVE' ? 'green' : heroState === 'LIMITED' ? 'yellow' : 'red';
  const heroSymbol = heroState === 'ACTIVE' ? '✓' : heroState === 'LIMITED' ? '!' : '×';
  const systemColor = securityLoading ? C.blue : security.status === 'frozen' ? C.red : security.status === 'warning' ? C.yellow : C.green;
  const systemLabel = securityLoading ? 'CHECKING' : security.status === 'frozen' ? 'FROZEN' : security.status === 'warning' ? 'REVIEW' : 'SECURE';

  const handleCheck = async () => {
    try {
      setChecking(true);
      setFeedback('Checking registered Voltaire service boundaries…');
      const next = await runCheck();
      if (next) setFeedback(`Protocol check complete • ${next.check.available + next.check.limited}/${next.totalProtocols} layers have local functionality.`);
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to complete the protocol check.');
    } finally {
      setChecking(false);
    }
  };

  const selectResource = (id: ResourceId) => {
    setActiveResource((current) => current === id ? null : id);
    if (id === 'docs') setShowArchitecture(true);
  };

  const openResourceAction = () => {
    if (!activeResource) return;
    const detail = resourceDetails[activeResource];
    if (activeResource === 'docs') {
      setShowArchitecture(true);
      return;
    }
    if (detail.route) navigation.navigate(detail.route);
  };

  return (
    <NomadPage maxWidth={960}>
      <ProtocolHeader compact={compact} systemLabel={systemLabel} systemColor={systemColor} />

      {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text><Pressable accessibilityRole="button" accessibilityLabel="Retry Voltaire Protocols" onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}

      <Panel tone={heroTone} style={styles.hero}>
        <View style={[styles.heroTop, compact && styles.heroTopCompact]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, compact && styles.eyebrowCompact, { color: heroColor }]}>PROTOCOL STATUS</Text>
            <Text style={[styles.allProtocols, compact && styles.allProtocolsCompact]}>ALL PROTOCOLS</Text>
            <View style={styles.heroStateRow}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.heroState, compact && styles.heroStateCompact, { color: heroColor }]}>{heroState}</Text><StatusMark color={heroColor} symbol={heroSymbol} size={compact ? 29 : 38} /></View>
            <Text style={[styles.heroDescription, compact && styles.heroDescriptionCompact]}>{heroState === 'ACTIVE' ? 'Connected. Evidence-backed. Interoperable.' : heroState === 'LIMITED' ? 'Local protocol evidence is available; production providers remain incomplete.' : 'No Voltaire protocol provider is currently available.'}</Text>
          </View>
          <ProtocolHeroGraphic compact={compact} color={heroColor} />
        </View>
        <View style={[styles.heroMetrics, compact && styles.heroMetricsCompact]}>
          <View style={styles.heroMetric}><ProtocolArtwork kind="cube" color={heroColor} size={compact ? 22 : 29} /><View><Text style={styles.metricLabel}>Local Layers</Text><Text style={[styles.metricValue, compact && styles.metricValueCompact]}>{localLayers} / {protocols.totalProtocols}</Text><Text style={[styles.metricNote, { color: heroColor }]}>{protocols.check.available} fully available</Text></View></View>
          <View style={styles.heroMetric}><ProtocolArtwork kind="clock" color={heroColor} size={compact ? 22 : 29} /><View><Text style={styles.metricLabel}>Network Uptime</Text><Text numberOfLines={1} style={[styles.metricValue, compact && styles.metricValueCompact]}>{protocols.networkUptime}</Text><Text style={styles.metricUnavailable}>No telemetry provider</Text></View></View>
          <View style={styles.heroMetric}><ProtocolArtwork kind="globe" color={heroColor} size={compact ? 22 : 29} /><View><Text style={styles.metricLabel}>Global Nodes</Text><Text numberOfLines={1} style={[styles.metricValue, compact && styles.metricValueCompact]}>{protocols.globalNodes}</Text><Text style={styles.metricUnavailable}>No verified registry</Text></View></View>
        </View>
      </Panel>

      <Panel style={[styles.sectionPanel, compact && styles.sectionPanelCompact]}>
        <View style={styles.sectionHeader}><View><Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>VOLTAIRE PROTOCOLS</Text><Text style={styles.sectionSubtitle}>Tap a protocol to inspect provider evidence</Text></View><Text style={styles.evidencePill}>● LOCAL EVIDENCE</Text></View>
        <View style={styles.protocolList}>{protocols.protocols.length ? protocols.protocols.map((item, index) => <ProtocolRow key={item.id} item={item} compact={compact} expanded={expandedProtocol === item.id} last={index === protocols.protocols.length - 1} onToggle={() => setExpandedProtocol((current) => current === item.id ? null : item.id)} />) : <Text style={styles.emptyText}>No protocol evidence is available.</Text>}</View>
        <Pressable testID="protocols-architecture" accessibilityRole="button" accessibilityLabel="View Protocol Architecture" onPress={() => setShowArchitecture((current) => !current)} style={({ pressed }) => [styles.architectureButton, pressed && styles.pressed]}><ProtocolArtwork kind="architecture" color={C.green} size={25} /><Text style={styles.architectureButtonText}>View Protocol Architecture</Text><Text style={styles.chevron}>{showArchitecture ? '⌃' : '›'}</Text></Pressable>
        {showArchitecture ? <View style={styles.architecturePanel}><Text style={styles.architectureTitle}>NOMAD SERVICE ARCHITECTURE</Text><View style={[styles.architectureFlow, compact && styles.architectureFlowCompact]}><View style={styles.architectureNode}><Text style={styles.architectureNodeTitle}>Nomad UI</Text><Text style={styles.architectureNodeText}>Owner actions and evidence review</Text></View><Text style={styles.architectureArrow}>›</Text><View style={styles.architectureNode}><Text style={styles.architectureNodeTitle}>Voltaire Adapters</Text><Text style={styles.architectureNodeText}>Wallet, security, recovery and travel</Text></View><Text style={styles.architectureArrow}>›</Text><View style={[styles.architectureNode, styles.architectureNodeUnavailable]}><Text style={styles.architectureNodeTitle}>Production Providers</Text><Text style={styles.architectureNodeText}>Telemetry, nodes, messaging and governance not connected</Text></View></View></View> : null}
      </Panel>

      <Panel style={[styles.sectionPanel, compact && styles.sectionPanelCompact]}>
        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>NETWORK HEALTH</Text><Pressable testID="protocols-run-check" accessibilityRole="button" accessibilityLabel="Run Voltaire Protocol Check" disabled={checking || loading} onPress={() => void handleCheck()} style={({ pressed }) => [styles.checkButton, (checking || loading) && styles.disabled, pressed && styles.pressed]}><Text style={styles.checkButtonText}>{checking ? 'Checking…' : 'Run Check'}</Text></Pressable></View>
        <Text style={styles.snapshot}>Local snapshot • {formatCheckedAt(protocols.checkedAt)}</Text>
        <View style={styles.healthGrid}>{protocols.health.map((item) => <HealthCard key={item.label} item={item} compact={compact} />)}</View>
        <View style={[styles.healthMessage, { borderColor: `${heroColor}66` }]}><View style={styles.healthMessageIcon}><ProtocolArtwork kind="shield" color={heroColor} size={compact ? 30 : 38} /></View><View style={styles.healthMessageCopy}><Text style={[styles.healthMessageTitle, { color: heroColor }]}>{protocols.message.replace(/Arkrilium/gi, 'Voltaire')}</Text><Text style={styles.healthMessageText}>Local adapter status does not prove chain uptime, node availability, transaction finality or external delivery.</Text></View><Pressable testID="protocols-learn-more" accessibilityRole="button" accessibilityLabel="Learn more about Voltaire protocol architecture" onPress={() => setShowArchitecture(true)} style={({ pressed }) => pressed && styles.pressed}><Text style={styles.learnMore}>Learn More  ›</Text></Pressable></View>
        {feedback ? <Text accessibilityLiveRegion="polite" style={[styles.feedback, /unable|error|failed/i.test(feedback) && { color: C.red }]}>{feedback}</Text> : null}
      </Panel>

      <Panel style={[styles.resourcesPanel, compact && styles.sectionPanelCompact]}>
        <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>PROTOCOL TOOLS & RESOURCES</Text>
        <View style={styles.resourceGrid}>{resources.map((item) => <ResourceCard key={item.id} item={item} compact={compact} active={activeResource === item.id} onPress={() => selectResource(item.id)} />)}</View>
        {activeResource ? <View style={styles.resourceDetail}><View style={styles.resourceDetailCopy}><Text style={styles.resourceDetailTitle}>{resourceDetails[activeResource].title}</Text><Text style={styles.resourceDetailText}>{resourceDetails[activeResource].body}</Text></View>{resourceDetails[activeResource].action ? <Pressable accessibilityRole="button" accessibilityLabel={resourceDetails[activeResource].action} onPress={openResourceAction} style={({ pressed }) => [styles.resourceAction, pressed && styles.pressed]}><Text style={styles.resourceActionText}>{resourceDetails[activeResource].action}  ›</Text></Pressable> : <Text style={styles.resourceUnavailable}>NOT CONNECTED</Text>}</View> : null}
      </Panel>

      <ProtocolBottomNav compact={compact} desktop={desktop} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: .72 },
  disabled: { opacity: .42 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  header: { minHeight: 82, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 13 },
  headerCompact: { minHeight: 58, marginBottom: 10, gap: 5 },
  headerBrand: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { width: 38, height: 48, alignItems: 'flex-start', justifyContent: 'center' },
  backButtonCompact: { width: 22, height: 38 },
  backText: { color: '#fff', fontSize: 47, fontWeight: '300', lineHeight: 48 },
  backTextCompact: { fontSize: 37, lineHeight: 38 },
  headerCopy: { flex: 1, minWidth: 0 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { flexShrink: 1, color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -.7 },
  headerTitleCompact: { fontSize: 18 },
  hubBadge: { color: C.green, fontSize: 10, fontWeight: '900', borderRadius: 6, backgroundColor: 'rgba(40,233,120,.15)', paddingHorizontal: 8, paddingVertical: 6 },
  hubBadgeCompact: { fontSize: 7, paddingHorizontal: 5, paddingVertical: 4 },
  headerSubtitle: { color: '#c8d2df', fontSize: 12, marginTop: 4 },
  headerSubtitleCompact: { fontSize: 7.5, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActionsCompact: { gap: 4 },
  systemPill: { minHeight: 54, borderWidth: 1, borderRadius: 999, backgroundColor: 'rgba(2,15,27,.94)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  systemPillCompact: { minHeight: 39, paddingHorizontal: 7, gap: 3 },
  systemTop: { color: '#d8e3ef', fontSize: 11 },
  systemTopCompact: { fontSize: 7 },
  systemBottom: { fontSize: 13, fontWeight: '900', marginTop: 1 },
  systemBottomCompact: { fontSize: 8 },
  helpButton: { width: 45, height: 45, borderRadius: 23, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  helpButtonCompact: { width: 34, height: 34, borderRadius: 17 },
  helpText: { color: '#cbd7e6', fontSize: 23, fontWeight: '800' },
  helpTextCompact: { fontSize: 17 },
  errorBanner: { minHeight: 46, marginBottom: 11, borderWidth: 1, borderColor: C.red, borderRadius: 11, backgroundColor: 'rgba(255,70,70,.08)', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  errorText: { flex: 1, color: C.red, fontSize: 10 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { overflow: 'hidden' },
  heroTop: { minHeight: 238, paddingHorizontal: 25, paddingTop: 22, flexDirection: 'row', alignItems: 'center' },
  heroTopCompact: { minHeight: 162, paddingHorizontal: 13, paddingTop: 12, alignItems: 'flex-start' },
  heroCopy: { flex: 1, minWidth: 0, zIndex: 2 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  eyebrowCompact: { fontSize: 8.5 },
  allProtocols: { color: '#fff', fontSize: 21, fontWeight: '800', marginTop: 14 },
  allProtocolsCompact: { fontSize: 12, marginTop: 8 },
  heroStateRow: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 3, maxWidth: '72%' },
  heroState: { flexShrink: 1, fontSize: 58, lineHeight: 62, fontWeight: '900', letterSpacing: -2 },
  heroStateCompact: { fontSize: 31, lineHeight: 34, letterSpacing: -1 },
  statusMark: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  statusMarkText: { fontWeight: '900', lineHeight: 18 },
  heroDescription: { maxWidth: 430, color: '#eef5fb', fontSize: 13, lineHeight: 19, marginTop: 5 },
  heroDescriptionCompact: { maxWidth: '59%', fontSize: 8, lineHeight: 12, marginTop: 4 },
  heroGraphic: { width: 390, height: 238, marginRight: -17 },
  heroGraphicCompact: { position: 'absolute', width: 240, height: 168, right: -23, top: -1, opacity: .94 },
  heroMetrics: { minHeight: 94, borderTopWidth: 1, borderTopColor: 'rgba(40,233,120,.2)', paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center' },
  heroMetricsCompact: { minHeight: 78, paddingHorizontal: 9 },
  heroMetric: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, borderRightWidth: 1, borderRightColor: C.borderSoft },
  metricLabel: { color: C.muted, fontSize: 9 },
  metricValue: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 5 },
  metricValueCompact: { fontSize: 9 },
  metricNote: { fontSize: 8, marginTop: 4 },
  metricUnavailable: { color: C.muted2, fontSize: 7, marginTop: 4 },
  sectionPanel: { marginTop: 16, padding: 17 },
  sectionPanelCompact: { marginTop: 11, padding: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: .25 },
  sectionTitleCompact: { fontSize: 11 },
  sectionSubtitle: { color: C.muted, fontSize: 8, marginTop: 4 },
  evidencePill: { color: C.yellow, fontSize: 8, fontWeight: '900' },
  protocolList: { marginTop: 13, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, overflow: 'hidden' },
  protocolRow: { paddingHorizontal: 12, paddingVertical: 7 },
  protocolRowCompact: { paddingHorizontal: 7, paddingVertical: 4 },
  protocolMain: { minHeight: 72, flexDirection: 'row', alignItems: 'center' },
  protocolIcon: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  protocolIconCompact: { width: 41, height: 41, borderRadius: 21 },
  protocolCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  protocolTitle: { color: '#fff', fontSize: 12, fontWeight: '800' },
  protocolTitleCompact: { fontSize: 8.5 },
  protocolSubtitle: { color: C.muted, fontSize: 9, marginTop: 3 },
  protocolSubtitleCompact: { fontSize: 6.8 },
  protocolStatus: { fontSize: 8, fontWeight: '900', marginTop: 5 },
  protocolEvidenceSummary: { color: C.muted, fontWeight: '500' },
  protocolRight: { width: 112, alignItems: 'flex-start', marginLeft: 8 },
  protocolRightValue: { fontSize: 10, fontWeight: '900' },
  protocolRightValueCompact: { fontSize: 7 },
  protocolRightLabel: { color: C.muted, fontSize: 8, marginTop: 4 },
  chevron: { color: '#bcc9db', fontSize: 24, marginLeft: 5 },
  protocolDetails: { marginLeft: 65, paddingHorizontal: 10, paddingBottom: 11 },
  protocolDetailsCompact: { marginLeft: 47, paddingHorizontal: 5 },
  protocolDetailText: { color: '#d5dfe9', fontSize: 8, lineHeight: 13 },
  evidenceRow: { marginTop: 9, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 8, padding: 8 },
  evidenceLabel: { color: C.muted, fontSize: 7, textTransform: 'uppercase' },
  evidenceValue: { color: '#fff', fontSize: 8, marginTop: 3, marginBottom: 6 },
  openModule: { minHeight: 35, marginTop: 8, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  openModuleText: { fontSize: 8, fontWeight: '900' },
  architectureButton: { minHeight: 52, borderWidth: 1, borderTopWidth: 0, borderColor: C.borderSoft, borderBottomLeftRadius: 11, borderBottomRightRadius: 11, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  architectureButtonText: { flex: 1, color: '#fff', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  architecturePanel: { marginTop: 11, borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.panel2, padding: 11 },
  architectureTitle: { color: C.green, fontSize: 9, fontWeight: '900' },
  architectureFlow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  architectureFlowCompact: { gap: 4 },
  architectureNode: { flex: 1, minWidth: 0, minHeight: 68, borderWidth: 1, borderColor: C.green, borderRadius: 8, padding: 8 },
  architectureNodeUnavailable: { borderColor: C.muted },
  architectureNodeTitle: { color: '#fff', fontSize: 9, fontWeight: '900' },
  architectureNodeText: { color: C.muted, fontSize: 7, lineHeight: 10, marginTop: 4 },
  architectureArrow: { color: C.green, fontSize: 20 },
  emptyText: { color: C.muted, fontSize: 9, padding: 16, textAlign: 'center' },
  checkButton: { minHeight: 36, borderWidth: 1, borderColor: C.green, borderRadius: 8, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  checkButtonText: { color: C.green, fontSize: 8, fontWeight: '900' },
  snapshot: { color: C.muted, fontSize: 7, textAlign: 'right', marginTop: 3 },
  healthGrid: { flexDirection: 'row', gap: 8, marginTop: 12 },
  healthCard: { flex: 1, minWidth: 0, minHeight: 113, borderWidth: 1, borderColor: C.border, borderRadius: 9, backgroundColor: C.panel2, padding: 10 },
  healthCardCompact: { minHeight: 89, padding: 6 },
  healthLabel: { color: C.muted, fontSize: 9 },
  healthLabelCompact: { fontSize: 6.5 },
  healthValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 11 },
  healthValue: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '800' },
  healthValueCompact: { fontSize: 8 },
  healthNote: { fontSize: 8, lineHeight: 11, marginTop: 10 },
  healthNoteCompact: { fontSize: 6, lineHeight: 8, marginTop: 7 },
  healthMessage: { minHeight: 82, marginTop: 13, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  healthMessageIcon: { width: 47, height: 47, borderRadius: 24, borderWidth: 1, borderColor: `${C.green}55`, alignItems: 'center', justifyContent: 'center' },
  healthMessageCopy: { flex: 1, minWidth: 0 },
  healthMessageTitle: { fontSize: 10, fontWeight: '900' },
  healthMessageText: { color: C.muted, fontSize: 7.5, lineHeight: 11, marginTop: 4 },
  learnMore: { color: C.green, fontSize: 9, fontWeight: '900' },
  feedback: { color: C.green, fontSize: 8, marginTop: 9, textAlign: 'center' },
  resourcesPanel: { marginTop: 16, padding: 17 },
  resourceGrid: { flexDirection: 'row', marginTop: 12, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 10, overflow: 'hidden' },
  resourceCard: { flex: 1, minWidth: 0, minHeight: 110, borderRightWidth: 1, borderRightColor: C.borderSoft, padding: 11, alignItems: 'center', justifyContent: 'center' },
  resourceCardCompact: { minHeight: 88, padding: 5 },
  resourceCardActive: { backgroundColor: 'rgba(40,233,120,.08)' },
  resourceTitle: { color: '#fff', fontSize: 9, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  resourceTitleCompact: { fontSize: 6.7, lineHeight: 9 },
  resourceSubtitle: { color: C.muted, fontSize: 7, marginTop: 4 },
  resourceSubtitleCompact: { fontSize: 5.5 },
  resourceArrow: { position: 'absolute', right: 5, top: '42%', color: '#bec9d7', fontSize: 18 },
  resourceDetail: { minHeight: 72, marginTop: 10, borderWidth: 1, borderColor: `${C.green}50`, borderRadius: 9, backgroundColor: 'rgba(0,37,24,.5)', padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resourceDetailCopy: { flex: 1, minWidth: 0 },
  resourceDetailTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  resourceDetailText: { color: C.muted, fontSize: 8, lineHeight: 12, marginTop: 4 },
  resourceAction: { minHeight: 37, borderWidth: 1, borderColor: C.green, borderRadius: 8, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  resourceActionText: { color: C.green, fontSize: 8, fontWeight: '900' },
  resourceUnavailable: { color: C.muted, fontSize: 7, fontWeight: '900' },
  bottomNav: { minHeight: 94, marginTop: 16, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: 'rgba(2,13,24,.96)', padding: 8, flexDirection: 'row', alignItems: 'center' },
  bottomNavCompact: { minHeight: 72, marginTop: 11, padding: 4 },
  navItem: { flex: 1, height: '100%', borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6 },
  navItemActive: { backgroundColor: 'rgba(40,233,120,.06)' },
  navLabel: { color: C.muted, fontSize: 10 },
  navLabelCompact: { fontSize: 7.5 },
  navLabelSelected: { color: C.green },
});
