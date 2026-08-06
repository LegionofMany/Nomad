import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadProtocols } from '../nomad';
import type {
  ArkriliumHealthItem,
  ArkriliumProtocolRow,
  ArkriliumProtocolStatus,
} from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

function protocolStatus(status: ArkriliumProtocolStatus) {
  switch (status) {
    case 'available': return { color: C.green, label: 'AVAILABLE', mark: '✓' };
    case 'limited': return { color: C.yellow, label: 'LIMITED', mark: '!' };
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
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ProtocolRow({
  item,
  expanded,
  last,
  onToggle,
}: {
  item: ArkriliumProtocolRow;
  expanded: boolean;
  last?: boolean;
  onToggle(): void;
}) {
  const navigation = useNavigation<any>();
  const status = protocolStatus(item.status);
  return (
    <View style={[styles.protocolRow, !last && styles.rowBorder]}>
      <Pressable onPress={onToggle} style={({ pressed }) => [styles.protocolMain, pressed && styles.pressed]}>
        <RoundIcon symbol={item.icon} color={item.color} size={49} filled />
        <View style={styles.protocolCopy}>
          <Text style={styles.protocolTitle}>{item.title}</Text>
          <Text style={styles.protocolSub}>{item.subtitle}</Text>
          <Text style={[styles.protocolStatus, { color: status.color }]}>{status.mark} {status.label}</Text>
        </View>
        <Text style={[styles.expandMark, { color: status.color }]}>{expanded ? '−' : '+'}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.protocolEvidence}>
          <Text style={styles.evidenceText}>{item.detail}</Text>
          <View style={styles.evidenceGrid}>
            <View style={styles.evidenceItem}>
              <Text style={styles.evidenceLabel}>PROVIDER</Text>
              <Text style={styles.evidenceValue}>{item.provider}</Text>
            </View>
            <View style={styles.evidenceItem}>
              <Text style={styles.evidenceLabel}>SOURCE</Text>
              <Text style={styles.evidenceValue}>{item.source.replace(/_/g, ' ')}</Text>
            </View>
            <View style={styles.evidenceItem}>
              <Text style={styles.evidenceLabel}>CHECKED</Text>
              <Text style={styles.evidenceValue}>{formatCheckedAt(item.checkedAt)}</Text>
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate(item.route)} style={({ pressed }) => [styles.openButton, { borderColor: status.color }, pressed && styles.pressed]}>
            <Text style={[styles.openButtonText, { color: status.color }]}>Open Module  ›</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function HealthCard({ item }: { item: ArkriliumHealthItem }) {
  const navigation = useNavigation<any>();
  const status = healthStatus(item.status);
  const content = (
    <>
      <View style={styles.healthHeading}>
        <Text style={styles.healthLabel}>{item.label}</Text>
        <Text style={[styles.healthStatus, { color: status.color }]}>{status.label}</Text>
      </View>
      <View style={styles.healthValueRow}>
        <Text style={[styles.healthIcon, { color: status.color }]}>{item.icon}</Text>
        <Text numberOfLines={2} adjustsFontSizeToFit style={styles.healthValue}>{item.value}</Text>
      </View>
      <Text style={[styles.healthNote, { color: status.color }]}>{item.note}</Text>
    </>
  );

  if (!item.route) return <View style={styles.healthCard}>{content}</View>;
  return (
    <Pressable onPress={() => navigation.navigate(item.route)} style={({ pressed }) => [styles.healthCard, pressed && styles.pressed]}>
      {content}
      <Text style={styles.healthArrow}>›</Text>
    </Pressable>
  );
}

export default function VoltaireProtocolsScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { protocols, loading, error, refresh, runCheck } = useNomadProtocols();
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState('');

  const localLayers = protocols.check.available + protocols.check.limited;
  const heroState = localLayers === 0 ? 'OFFLINE' : protocols.check.status === 'complete' ? 'READY' : 'LIMITED';
  const heroColor = heroState === 'READY' ? C.green : heroState === 'LIMITED' ? C.yellow : C.red;
  const heroTone = heroState === 'READY' ? 'green' : heroState === 'LIMITED' ? 'yellow' : 'red';
  const summaryCards = useMemo(() => [
    { label: 'AVAILABLE', value: protocols.check.available, color: C.green },
    { label: 'LIMITED', value: protocols.check.limited, color: C.yellow },
    { label: 'SETUP', value: protocols.check.notConfigured, color: C.purple },
    { label: 'UNAVAILABLE', value: protocols.check.unavailable, color: C.muted },
  ], [protocols.check]);

  const handleCheck = async () => {
    try {
      setChecking(true);
      setFeedback('Checking registered Arkrilium service boundaries…');
      const next = await runCheck();
      if (next) {
        const connected = next.check.available + next.check.limited;
        setFeedback(`Protocol check complete: ${connected}/${next.totalProtocols} layers have local functionality.`);
      }
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to complete the protocol check.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <NomadPage maxWidth={980}>
      <PageHeader
        title="Arkrilium Protocols"
        subtitle="The protocol layer powering Nomad’s sovereign experience"
        icon="A"
        color={heroColor}
        help
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <Panel tone={heroTone} style={styles.hero}>
        <View style={[styles.heroBody, compact && styles.heroCompact]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: heroColor }]}>PROTOCOL STATUS</Text>
            <Text style={styles.allProtocols}>ARKRILIUM SERVICE LAYERS</Text>
            <View style={styles.statusRow}>
              <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.statusText, { color: heroColor }]}>{heroState}</Text>
              <Text style={[styles.statusMark, { color: heroColor }]}>{heroState === 'READY' ? '✓' : heroState === 'LIMITED' ? '!' : '×'}</Text>
            </View>
            <Text style={styles.heroDescription}>Local protocol evidence is separated from remote network telemetry.</Text>
            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>⌬ Local Functionality</Text>
                <Text style={styles.metricValue}>{localLayers} / {protocols.totalProtocols}</Text>
                <Text style={[styles.metricNote, { color: localLayers ? C.yellow : C.red }]}>Available or limited layers</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>◷ Remote Uptime</Text>
                <Text style={styles.metricValue}>{protocols.networkUptime}</Text>
                <Text style={styles.metricUnavailable}>No telemetry provider</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>◎ Global Nodes</Text>
                <Text style={styles.metricValue}>{protocols.globalNodes}</Text>
                <Text style={styles.metricUnavailable}>No node registry</Text>
              </View>
            </View>
          </View>
          <View style={styles.protocolGraphic}>
            <View style={[styles.orbitOuter, { borderColor: `${heroColor}55` }]}>
              <View style={[styles.orbitInner, { borderColor: `${heroColor}33` }]}>
                <RoundIcon symbol="A" color={heroColor} size={104} filled />
              </View>
              <Text style={[styles.orbitItem, styles.orbitTop, { color: C.green, borderColor: C.green }]}>◇</Text>
              <Text style={[styles.orbitItem, styles.orbitRight, { color: C.blue, borderColor: C.blue }]}>⇄</Text>
              <Text style={[styles.orbitItem, styles.orbitBottom, { color: C.yellow, borderColor: C.yellow }]}>R</Text>
              <Text style={[styles.orbitItem, styles.orbitLeft, { color: C.purple, borderColor: C.purple }]}>↻</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          {summaryCards.map((item) => (
            <View key={item.label} style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.checkRow, compact && styles.checkRowCompact]}>
          <View style={styles.checkCopy}>
            <Text style={styles.checkTitle}>Last evidence check</Text>
            <Text style={styles.checkSub}>{formatCheckedAt(protocols.checkedAt)} • {protocols.dataSource.replace(/_/g, ' ')}</Text>
          </View>
          <Pressable disabled={checking || loading} onPress={() => void handleCheck()} style={({ pressed }) => [styles.checkButton, pressed && styles.pressed]}>
            <Text style={styles.checkButtonText}>{checking ? 'Checking…' : 'Run Protocol Check'}</Text>
          </Pressable>
        </View>
        {feedback ? <Text style={[styles.feedback, feedback.toLowerCase().includes('unable') && { color: C.red }]}>{feedback}</Text> : null}
      </Panel>

      <Panel style={styles.protocolPanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>ARKRILIUM PROTOCOLS</Text>
            <Text style={styles.sectionSub}>Tap a layer to inspect its provider evidence</Text>
          </View>
          <Text style={styles.evidencePill}>● LOCAL EVIDENCE</Text>
        </View>
        <View style={styles.protocolList}>
          {protocols.protocols.length ? protocols.protocols.map((item, index) => (
            <ProtocolRow
              key={item.id}
              item={item}
              expanded={expandedProtocol === item.id}
              last={index === protocols.protocols.length - 1}
              onToggle={() => setExpandedProtocol((current) => current === item.id ? null : item.id)}
            />
          )) : <Text style={styles.emptyText}>No protocol evidence is available.</Text>}
        </View>
      </Panel>

      <Panel style={styles.healthPanel}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>SERVICE HEALTH</Text>
            <Text style={styles.sectionSub}>Current adapter and wallet evidence—not remote uptime</Text>
          </View>
          <Text style={styles.snapshot}>Snapshot</Text>
        </View>
        <View style={styles.healthGrid}>{protocols.health.map((item) => <HealthCard key={item.label} item={item} />)}</View>
        <View style={[styles.messageRow, { borderColor: `${heroColor}65` }]}>
          <RoundIcon symbol={heroState === 'READY' ? '✓' : '!'} color={heroColor} size={46} filled />
          <View style={styles.messageCopy}>
            <Text style={[styles.messageTitle, { color: heroColor }]}>{protocols.message}</Text>
            <Text style={styles.messageSub}>A local adapter status does not prove chain uptime, node availability, transaction finality or external-provider delivery.</Text>
          </View>
        </View>
      </Panel>

      <Panel style={styles.resourcesPanel}>
        <Text style={styles.sectionTitle}>PROTOCOL TOOLS & RESOURCES</Text>
        <View style={styles.resourceGrid}>
          <Pressable onPress={() => setShowArchitecture((current) => !current)} style={({ pressed }) => [styles.resourceCard, pressed && styles.pressed]}>
            <Text style={styles.resourceIcon}>▤</Text>
            <Text style={styles.resourceLabel}>Protocol Architecture</Text>
            <Text style={styles.resourceSub}>Review provider boundaries</Text>
            <Text style={styles.resourceArrow}>{showArchitecture ? '−' : '+'}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('BlockPagesSafety')} style={({ pressed }) => [styles.resourceCard, pressed && styles.pressed]}>
            <Text style={[styles.resourceIcon, { color: C.yellow }]}>R</Text>
            <Text style={styles.resourceLabel}>Reqrium Safety</Text>
            <Text style={styles.resourceSub}>Address and URL protection</Text>
            <Text style={styles.resourceArrow}>›</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('SecurityCenter')} style={({ pressed }) => [styles.resourceCard, pressed && styles.pressed]}>
            <Text style={styles.resourceIcon}>◇</Text>
            <Text style={styles.resourceLabel}>Security Center</Text>
            <Text style={styles.resourceSub}>Wallet protection evidence</Text>
            <Text style={styles.resourceArrow}>›</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('RecoveryCenter')} style={({ pressed }) => [styles.resourceCard, pressed && styles.pressed]}>
            <Text style={[styles.resourceIcon, { color: C.purple }]}>↻</Text>
            <Text style={styles.resourceLabel}>Recovery Center</Text>
            <Text style={styles.resourceSub}>Owner-controlled recovery</Text>
            <Text style={styles.resourceArrow}>›</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Settings')} style={({ pressed }) => [styles.resourceCard, pressed && styles.pressed]}>
            <Text style={[styles.resourceIcon, { color: C.blue }]}>⚙</Text>
            <Text style={styles.resourceLabel}>Connected Services</Text>
            <Text style={styles.resourceSub}>Review integrations</Text>
            <Text style={styles.resourceArrow}>›</Text>
          </Pressable>
        </View>

        {showArchitecture ? (
          <View style={styles.architecturePanel}>
            <Text style={styles.architectureTitle}>NOMAD SERVICE ARCHITECTURE</Text>
            <View style={styles.architectureFlow}>
              <View style={styles.architectureNode}><Text style={styles.architectureNodeTitle}>Nomad UI</Text><Text style={styles.architectureNodeSub}>Owner actions and review</Text></View>
              <Text style={styles.architectureArrow}>›</Text>
              <View style={styles.architectureNode}><Text style={styles.architectureNodeTitle}>Local Adapters</Text><Text style={styles.architectureNodeSub}>Wallet, security, recovery, travel</Text></View>
              <Text style={styles.architectureArrow}>›</Text>
              <View style={[styles.architectureNode, styles.architectureUnavailable]}><Text style={styles.architectureNodeTitle}>Production Providers</Text><Text style={styles.architectureNodeSub}>Telemetry, nodes, messaging and governance not connected</Text></View>
            </View>
          </View>
        ) : null}
      </Panel>

      <Panel tone="yellow" style={styles.footerPanel}>
        <RoundIcon symbol="A" color={C.yellow} size={50} filled />
        <View style={styles.footerCopy}>
          <Text style={styles.footerTitle}>Arkrilium is the protocol boundary—not a custody claim</Text>
          <Text style={styles.footerSub}>Nomad, Reqrium and future ecosystem services remain separately governed modules. Wallet keys, signing and settlement stay with their connected providers.</Text>
        </View>
      </Panel>

      <BottomNav active="Protocols" items={[
        ['⌂', 'Home', 'Portfolio'],
        ['▣', 'Wallets', 'Wallets'],
        ['✈', 'Travel', 'TravelMode'],
        ['A', 'Protocols', 'VoltaireProtocols'],
        ['⚙', 'Settings', 'Settings'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  errorBanner: { minHeight: 48, marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, minWidth: 0, color: C.red, fontSize: 10 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  hero: { padding: 19 },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  allProtocols: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 13 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusText: { maxWidth: '85%', fontSize: 50, fontWeight: '900', letterSpacing: -1 },
  statusMark: { fontSize: 31, marginLeft: 11 },
  heroDescription: { color: '#fff', fontSize: 12, lineHeight: 18, marginTop: 5 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.borderSoft },
  metric: { flex: 1, minWidth: 135 },
  metricLabel: { color: C.muted, fontSize: 8 },
  metricValue: { color: '#fff', fontSize: 14, fontWeight: '900', marginTop: 6 },
  metricNote: { fontSize: 8, marginTop: 5 },
  metricUnavailable: { color: C.muted, fontSize: 8, marginTop: 5 },
  protocolGraphic: { width: 235, alignItems: 'center' },
  orbitOuter: { width: 190, height: 190, borderRadius: 95, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  orbitInner: { width: 135, height: 135, borderRadius: 68, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  orbitItem: { position: 'absolute', width: 42, height: 42, borderRadius: 21, borderWidth: 1, backgroundColor: C.bg, textAlign: 'center', textAlignVertical: 'center', fontSize: 24, fontWeight: '900' },
  orbitTop: { top: -2 },
  orbitRight: { right: -2, top: 72 },
  orbitBottom: { bottom: -2 },
  orbitLeft: { left: -2, top: 72 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  summaryCard: { flexGrow: 1, flexBasis: 110, minHeight: 69, borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: 'rgba(2,13,24,.68)', alignItems: 'center', justifyContent: 'center', padding: 8 },
  summaryValue: { fontSize: 22, fontWeight: '900' },
  summaryLabel: { color: C.muted, fontSize: 7, fontWeight: '900', marginTop: 4 },
  checkRow: { minHeight: 65, marginTop: 15, borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 11, flexDirection: 'row', alignItems: 'center' },
  checkRowCompact: { alignItems: 'stretch', flexDirection: 'column', gap: 10 },
  checkCopy: { flex: 1, minWidth: 0 },
  checkTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  checkSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  checkButton: { minHeight: 39, borderWidth: 1, borderColor: C.yellow, borderRadius: 9, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  checkButtonText: { color: C.yellow, fontSize: 9, fontWeight: '900' },
  feedback: { color: C.yellow, fontSize: 9, marginTop: 9 },
  protocolPanel: { marginTop: 17, padding: 16 },
  healthPanel: { marginTop: 17, padding: 16 },
  resourcesPanel: { marginTop: 17, padding: 16 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  evidencePill: { color: C.yellow, fontSize: 8, fontWeight: '900' },
  protocolList: { marginTop: 13, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, overflow: 'hidden' },
  protocolRow: { paddingHorizontal: 12, paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  protocolMain: { minHeight: 67, flexDirection: 'row', alignItems: 'center' },
  protocolCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  protocolTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  protocolSub: { color: C.muted, fontSize: 9, marginTop: 3 },
  protocolStatus: { fontSize: 8, fontWeight: '900', marginTop: 5 },
  expandMark: { width: 30, textAlign: 'center', fontSize: 23, fontWeight: '700' },
  protocolEvidence: { marginLeft: 61, paddingTop: 10, paddingBottom: 5 },
  evidenceText: { color: '#d7e0ec', fontSize: 9, lineHeight: 15 },
  evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 11 },
  evidenceItem: { flex: 1, minWidth: 120, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 9 },
  evidenceLabel: { color: C.muted, fontSize: 7 },
  evidenceValue: { color: '#fff', fontSize: 8, lineHeight: 12, marginTop: 5, textTransform: 'capitalize' },
  openButton: { minHeight: 37, marginTop: 10, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  openButtonText: { fontSize: 9, fontWeight: '900' },
  emptyText: { color: C.muted, fontSize: 10, padding: 15, textAlign: 'center' },
  snapshot: { color: C.muted, fontSize: 8 },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  healthCard: { flexGrow: 1, flexBasis: 135, minHeight: 115, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 11 },
  healthHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  healthLabel: { flex: 1, color: C.muted, fontSize: 8 },
  healthStatus: { fontSize: 6, fontWeight: '900' },
  healthValueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  healthIcon: { fontSize: 18, marginRight: 8 },
  healthValue: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '900' },
  healthNote: { fontSize: 8, lineHeight: 12, marginTop: 8 },
  healthArrow: { position: 'absolute', right: 8, bottom: 5, color: '#c7cfdf', fontSize: 18 },
  messageRow: { minHeight: 75, marginTop: 13, borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center' },
  messageCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  messageTitle: { fontSize: 11, lineHeight: 16, fontWeight: '900' },
  messageSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  resourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  resourceCard: { flexGrow: 1, flexBasis: 135, minHeight: 105, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 11 },
  resourceIcon: { color: C.green, fontSize: 23 },
  resourceLabel: { color: '#fff', fontSize: 10, fontWeight: '900', marginTop: 10 },
  resourceSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  resourceArrow: { position: 'absolute', right: 9, top: 8, color: '#c7cfdf', fontSize: 21 },
  architecturePanel: { marginTop: 14, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.panel2, padding: 13 },
  architectureTitle: { color: C.yellow, fontSize: 10, fontWeight: '900' },
  architectureFlow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 12 },
  architectureNode: { flex: 1, minWidth: 145, minHeight: 74, borderWidth: 1, borderColor: C.green, borderRadius: 9, padding: 10 },
  architectureUnavailable: { borderColor: C.muted },
  architectureNodeTitle: { color: '#fff', fontSize: 10, fontWeight: '900' },
  architectureNodeSub: { color: C.muted, fontSize: 8, lineHeight: 12, marginTop: 5 },
  architectureArrow: { color: C.yellow, fontSize: 23 },
  footerPanel: { minHeight: 85, marginTop: 17, padding: 14, flexDirection: 'row', alignItems: 'center' },
  footerCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  footerTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  footerSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
});
