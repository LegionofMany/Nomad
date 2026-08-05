import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadProtocols } from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  PageHeader,
  Panel,
  RoundIcon,
  useNomadLayout,
} from '../ui/NomadShell';

function visible(value: string): string {
  return value.replace(/Voltaire Protocols?/gi, 'Arkrilium').replace(/Voltaire/gi, 'Arkrilium');
}

function ProtocolRow({ item, last }: { item: { title: string; subtitle: string; detail: string; uptime: string; icon: string; color: string }; last?: boolean }) {
  const navigation = useNavigation<any>();
  const route = /security/i.test(item.title) ? 'SecurityCenter' : /key|recovery/i.test(item.title) ? 'RecoveryCenter' : /notary|verification/i.test(item.title) ? 'BlockPagesSafety' : 'NomadInsights';
  return (
    <Pressable onPress={() => navigation.navigate(route)} style={[styles.protocolRow, !last && styles.rowBorder]}>
      <RoundIcon symbol={item.icon} color={item.color} size={49} filled />
      <View style={styles.protocolCopy}><Text style={styles.protocolTitle}>{visible(item.title)}</Text><Text style={styles.protocolSub}>{visible(item.subtitle)}</Text><Text style={[styles.protocolDetail, { color: item.color }]}>{visible(item.detail)}</Text></View>
      <View style={styles.uptimeCopy}><Text style={styles.uptime}>{item.uptime}</Text><Text style={styles.uptimeLabel}>Uptime</Text></View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function HealthCard({ item }: { item: { label: string; value: string; note: string; icon: string } }) {
  const positive = /excellent|clear|95|99|100/i.test(item.note) || item.value === '0';
  return <View style={styles.healthCard}><Text style={styles.healthLabel}>{item.label}</Text><View style={styles.healthValueRow}><Text style={[styles.healthIcon, { color: positive ? C.green : C.yellow }]}>{item.icon}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={styles.healthValue}>{item.value}</Text></View><Text style={[styles.healthNote, { color: positive ? C.green : C.muted }]}>{item.note}</Text></View>;
}

export default function VoltaireProtocolsScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { protocols, loading, error, refresh } = useNomadProtocols();
  const active = protocols.status === 'active';
  const statusColor = active ? C.green : C.yellow;
  const activePercent = Math.round((protocols.activeProtocols / Math.max(1, protocols.totalProtocols)) * 100);

  const resources = [
    ['▤', 'Protocol Architecture', 'Explore the connected layers', 'NomadInsights'],
    ['R', 'Reqrium Safety', 'Verification and threat protection', 'BlockPagesSafety'],
    ['◇', 'Security Center', 'Wallet protection and recovery', 'SecurityCenter'],
    ['⌁', 'Nomad Insights', 'Wallet and spending intelligence', 'NomadInsights'],
    ['⚙', 'Protocol Settings', 'Review app integrations', 'Settings'],
  ] as const;

  return (
    <NomadPage maxWidth={980}>
      <PageHeader
        title="Arkrilium Protocols"
        subtitle="The protocol layer powering Nomad’s sovereign experience"
        icon="A"
        color={C.green}
        right={<Pressable disabled={loading} onPress={() => void refresh()} style={styles.refreshButton}><Text style={styles.refreshText}>{loading ? 'Syncing…' : 'Refresh'}</Text></Pressable>}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Panel tone={active ? 'green' : 'yellow'} style={styles.hero}>
        <View style={[styles.heroBody, compact && styles.heroCompact]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: statusColor }]}>PROTOCOL STATUS</Text>
            <Text style={styles.allProtocols}>ALL PROTOCOLS</Text>
            <View style={styles.statusRow}><Text style={[styles.statusText, { color: statusColor, fontSize: compact ? 40 : 54 }]}>{active ? 'ACTIVE' : 'REVIEW'}</Text><Text style={[styles.statusMark, { color: statusColor }]}>{active ? '✓' : '!'}</Text></View>
            <Text style={styles.heroDescription}>Decentralized. Sovereign. Interoperable.</Text>
            <View style={styles.metrics}>
              <View style={styles.metric}><Text style={styles.metricLabel}>⌬ Protocols Active</Text><Text style={styles.metricValue}>{protocols.activeProtocols} / {protocols.totalProtocols}</Text><Text style={styles.metricNote}>{activePercent}% available</Text></View>
              <View style={styles.metric}><Text style={styles.metricLabel}>◷ Network Uptime</Text><Text style={styles.metricValue}>{protocols.networkUptime}</Text><Text style={styles.metricNote}>Current service state</Text></View>
              <View style={styles.metric}><Text style={styles.metricLabel}>◎ Global Nodes</Text><Text style={styles.metricValue}>{protocols.globalNodes}</Text><Text style={styles.metricNote}>{protocols.countries} countries</Text></View>
            </View>
          </View>
          <View style={styles.protocolGraphic}>
            <View style={styles.orbitOuter}><View style={styles.orbitInner}><RoundIcon symbol="A" color={C.green} size={104} filled /></View><Text style={[styles.orbitItem, styles.orbitTop]}>◇</Text><Text style={[styles.orbitItem, styles.orbitRight]}>⌁</Text><Text style={[styles.orbitItem, styles.orbitBottom]}>▤</Text><Text style={[styles.orbitItem, styles.orbitLeft]}>♙</Text></View>
          </View>
        </View>
      </Panel>

      <Panel style={styles.protocolPanel}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>ARKRILIUM PROTOCOLS</Text><Text style={styles.sectionSub}>Connected protection and interoperability layers</Text></View><Text style={styles.livePill}>● LIVE</Text></View>
        <View style={styles.protocolList}>{protocols.protocols.map((item, index) => <ProtocolRow key={item.title} item={item} last={index === protocols.protocols.length - 1} />)}</View>
      </Panel>

      <Panel style={styles.healthPanel}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>NETWORK HEALTH</Text><Text style={styles.sectionSub}>Adapter-reported service indicators</Text></View><Text style={styles.realtime}>Real-time</Text></View>
        <View style={styles.healthGrid}>{protocols.health.map((item) => <HealthCard key={item.label} item={item} />)}</View>
        <View style={styles.messageRow}><RoundIcon symbol="◇" color={statusColor} size={46} filled /><View style={styles.messageCopy}><Text style={[styles.messageTitle, { color: statusColor }]}>{visible(protocols.message)}</Text><Text style={styles.messageSub}>Protocol health is informational and should be confirmed by each connected network before signing.</Text></View></View>
      </Panel>

      <Panel style={styles.resourcesPanel}>
        <Text style={styles.sectionTitle}>PROTOCOL TOOLS & RESOURCES</Text>
        <View style={styles.resourceGrid}>{resources.map(([icon, label, subtitle, route]) => <Pressable key={label} onPress={() => navigation.navigate(route)} style={styles.resourceCard}><Text style={styles.resourceIcon}>{icon}</Text><Text style={styles.resourceLabel}>{label}</Text><Text style={styles.resourceSub}>{subtitle}</Text><Text style={styles.resourceArrow}>›</Text></Pressable>)}</View>
      </Panel>

      <Panel tone="green" style={styles.footerPanel}><RoundIcon symbol="A" color={C.green} size={50} filled /><View style={styles.footerCopy}><Text style={styles.footerTitle}>Arkrilium powers the connected ecosystem</Text><Text style={styles.footerSub}>Nomad, Reqrium, AutoDeFi and the wider ecosystem remain separately governed applications and services.</Text></View></Panel>

      <BottomNav active="Protocols" items={[
        ['⌂', 'Home', 'Portfolio'], ['▣', 'Wallets', 'Wallets'], ['✈', 'Travel', 'TravelMode'], ['A', 'Protocols', 'VoltaireProtocols'], ['⚙', 'Settings', 'Settings'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  refreshButton: { minHeight: 36, borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  refreshText: { color: C.green, fontSize: 9, fontWeight: '900' },
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  hero: { padding: 19 },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroCompact: { flexDirection: 'column', alignItems: 'stretch' },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: .5 },
  allProtocols: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 13 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontWeight: '900', letterSpacing: -1 },
  statusMark: { fontSize: 31, marginLeft: 11 },
  heroDescription: { color: '#fff', fontSize: 12, marginTop: 5 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.borderSoft },
  metric: { flex: 1, minWidth: 135 },
  metricLabel: { color: C.muted, fontSize: 8 },
  metricValue: { color: '#fff', fontSize: 14, fontWeight: '900', marginTop: 6 },
  metricNote: { color: C.green, fontSize: 8, marginTop: 5 },
  protocolGraphic: { width: 235, alignItems: 'center' },
  orbitOuter: { width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: 'rgba(32,239,112,.3)', alignItems: 'center', justifyContent: 'center' },
  orbitInner: { width: 135, height: 135, borderRadius: 68, borderWidth: 1, borderColor: 'rgba(32,239,112,.18)', alignItems: 'center', justifyContent: 'center' },
  orbitItem: { position: 'absolute', color: C.green, fontSize: 26, width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: C.green, backgroundColor: C.bg, textAlign: 'center', textAlignVertical: 'center' },
  orbitTop: { top: -2 },
  orbitRight: { right: -2, top: 72, color: C.blue, borderColor: C.blue },
  orbitBottom: { bottom: -2, color: C.yellow, borderColor: C.yellow },
  orbitLeft: { left: -2, top: 72, color: C.purple, borderColor: C.purple },
  protocolPanel: { marginTop: 17, padding: 16 },
  healthPanel: { marginTop: 17, padding: 16 },
  resourcesPanel: { marginTop: 17, padding: 16 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  sectionSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  livePill: { color: C.green, fontSize: 8, fontWeight: '900' },
  protocolList: { marginTop: 13, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, overflow: 'hidden' },
  protocolRow: { minHeight: 83, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  protocolCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  protocolTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  protocolSub: { color: C.muted, fontSize: 9, marginTop: 3 },
  protocolDetail: { fontSize: 8, marginTop: 5 },
  uptimeCopy: { width: 62, alignItems: 'flex-end', marginLeft: 7 },
  uptime: { color: C.green, fontSize: 11, fontWeight: '900' },
  uptimeLabel: { color: C.muted, fontSize: 7, marginTop: 3 },
  chevron: { color: '#c7cfdf', fontSize: 26, marginLeft: 6 },
  realtime: { color: C.muted, fontSize: 8 },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  healthCard: { flexGrow: 1, flexBasis: 125, minHeight: 96, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 11 },
  healthLabel: { color: C.muted, fontSize: 8 },
  healthValueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  healthIcon: { fontSize: 18, marginRight: 8 },
  healthValue: { color: '#fff', fontSize: 15, fontWeight: '900', maxWidth: 100 },
  healthNote: { fontSize: 8, marginTop: 8 },
  messageRow: { minHeight: 75, marginTop: 13, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center' },
  messageCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  messageTitle: { fontSize: 11, fontWeight: '900' },
  messageSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  resourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  resourceCard: { flexGrow: 1, flexBasis: 135, minHeight: 105, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 11 },
  resourceIcon: { color: C.green, fontSize: 23 },
  resourceLabel: { color: '#fff', fontSize: 10, fontWeight: '900', marginTop: 10 },
  resourceSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  resourceArrow: { position: 'absolute', right: 9, top: 8, color: '#c7cfdf', fontSize: 21 },
  footerPanel: { minHeight: 85, marginTop: 17, padding: 14, flexDirection: 'row', alignItems: 'center' },
  footerCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  footerTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  footerSub: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
});
