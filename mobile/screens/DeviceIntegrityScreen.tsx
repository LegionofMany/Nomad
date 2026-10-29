import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
  BottomNav,
  C,
  NomadGlyph,
  NomadPage,
  PageHeader,
  Panel,
  useNomadLayout,
} from '../ui/NomadShell';

type EvidenceState = 'available' | 'provider_required';

type EvidenceItem = {
  title: string;
  detail: string;
  state: EvidenceState;
};

function runtimeEvidence(): EvidenceItem[] {
  const runtime = globalThis as typeof globalThis & {
    isSecureContext?: boolean;
    location?: { protocol?: string };
    crypto?: { getRandomValues?: (array: Uint8Array) => Uint8Array };
  };
  const secureContext = Platform.OS !== 'web'
    || runtime.isSecureContext === true
    || runtime.location?.protocol === 'https:';
  const cryptographyAvailable = typeof runtime.crypto?.getRandomValues === 'function';

  return [
    {
      title: 'Secure App Session',
      detail: secureContext ? 'This session is running in a secure application context.' : 'Open the app over HTTPS to enable secure-context checks.',
      state: secureContext ? 'available' : 'provider_required',
    },
    {
      title: 'Cryptographic Randomness',
      detail: cryptographyAvailable ? 'The runtime exposes a cryptographically secure random source.' : 'A secure random provider was not detected in this runtime.',
      state: cryptographyAvailable ? 'available' : 'provider_required',
    },
    {
      title: 'Trusted Phone State',
      detail: 'Phone-side wallet and security state can be evaluated without a watch connection.',
      state: 'available',
    },
    {
      title: 'Hardware Attestation',
      detail: 'Requires a signed Android or iOS attestation provider; the web preview does not claim this proof.',
      state: 'provider_required',
    },
    {
      title: 'Root or Jailbreak Detection',
      detail: 'Requires a native mobile integrity provider and is reported separately from browser protection.',
      state: 'provider_required',
    },
    {
      title: 'Application Signature & Secure Enclave',
      detail: 'Requires native application-signature and hardware-keystore evidence.',
      state: 'provider_required',
    },
  ];
}

function EvidenceRow({ item, compact, last }: { item: EvidenceItem; compact: boolean; last: boolean }) {
  const available = item.state === 'available';
  const color = available ? C.green : C.yellow;
  return (
    <View style={[styles.evidenceRow, compact && styles.evidenceRowCompact, !last && styles.evidenceBorder]}>
      <View style={[styles.evidenceIcon, compact && styles.evidenceIconCompact, { borderColor: `${color}66`, backgroundColor: `${color}10` }]}>
        <Text style={[styles.evidenceSymbol, { color }]}>{available ? '✓' : 'i'}</Text>
      </View>
      <View style={styles.evidenceCopy}>
        <Text style={[styles.evidenceTitle, compact && styles.evidenceTitleCompact]}>{item.title}</Text>
        <Text style={[styles.evidenceDetail, compact && styles.evidenceDetailCompact]}>{item.detail}</Text>
      </View>
      <Text style={[styles.evidenceState, compact && styles.evidenceStateCompact, { color }]}>{available ? 'AVAILABLE' : 'NATIVE PROVIDER'}</Text>
    </View>
  );
}

export default function DeviceIntegrityScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const evidence = React.useMemo(runtimeEvidence, []);
  const availableCount = evidence.filter((item) => item.state === 'available').length;

  return (
    <NomadPage maxWidth={900}>
      <PageHeader
        title="Device Integrity"
        subtitle="Phone and trusted-device security"
        icon="✓"
        color={C.green}
        status={false}
        help
      />

      <Panel tone="green" style={[styles.hero, compact && styles.heroCompact]}>
        <View style={[styles.heroIcon, compact && styles.heroIconCompact]}>
          <NomadGlyph kind="security" color={C.green} size={compact ? 48 : 66} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.eyebrow, compact && styles.eyebrowCompact]}>DEVICE PROTECTION</Text>
          <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>AVAILABLE</Text>
          <Text style={[styles.heroText, compact && styles.heroTextCompact]}>Secure runtime and phone-side checks are ready. Native hardware proof remains clearly separated until an attestation provider is connected.</Text>
        </View>
        <View style={[styles.summary, compact && styles.summaryCompact]}>
          <Text style={styles.summaryValue}>{availableCount}</Text>
          <Text style={styles.summaryLabel}>LOCAL CHECKS</Text>
        </View>
      </Panel>

      <Panel style={[styles.evidencePanel, compact && styles.evidencePanelCompact]}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>DEVICE EVIDENCE</Text>
            <Text style={styles.sectionSubtitle}>Available protection and native-only proof are reported separately.</Text>
          </View>
          <Text style={styles.checkedLabel}>CURRENT SESSION</Text>
        </View>
        <View style={styles.evidenceList}>
          {evidence.map((item, index) => (
            <EvidenceRow key={item.title} item={item} compact={compact} last={index === evidence.length - 1} />
          ))}
        </View>
      </Panel>

      <Panel tone="green" style={[styles.meaningPanel, compact && styles.meaningPanelCompact]}>
        <NomadGlyph kind="security" color={C.green} size={compact ? 35 : 42} />
        <View style={styles.meaningCopy}>
          <Text style={styles.meaningTitle}>What “Available” means</Text>
          <Text style={styles.meaningText}>Nomad can use secure browser and phone-side protections now. It does not label hardware attestation, jailbreak detection, or a watch connection as verified without signed native evidence.</Text>
        </View>
      </Panel>

      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('SecurityCenter')} style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]}>
        <Text style={styles.returnText}>Return to Security Center</Text>
        <Text style={styles.returnArrow}>›</Text>
      </Pressable>

      <BottomNav active="Security" />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 230, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 22 },
  heroCompact: { minHeight: 0, padding: 16, gap: 13, flexWrap: 'wrap' },
  heroIcon: { width: 112, height: 112, borderRadius: 56, borderWidth: 1, borderColor: 'rgba(40,233,120,.55)', backgroundColor: 'rgba(40,233,120,.1)', alignItems: 'center', justifyContent: 'center' },
  heroIconCompact: { width: 76, height: 76, borderRadius: 38 },
  heroCopy: { flex: 1, minWidth: 160 },
  eyebrow: { color: C.green, fontSize: 13, fontWeight: '900', letterSpacing: .8 },
  eyebrowCompact: { fontSize: 10 },
  heroTitle: { color: C.green, fontSize: 47, lineHeight: 54, fontWeight: '900', marginTop: 5 },
  heroTitleCompact: { fontSize: 31, lineHeight: 37 },
  heroText: { color: '#e3ebe7', fontSize: 13, lineHeight: 20, marginTop: 8, maxWidth: 510 },
  heroTextCompact: { fontSize: 10, lineHeight: 15 },
  summary: { width: 115, height: 115, borderRadius: 58, borderWidth: 3, borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  summaryCompact: { width: '100%', height: 70, borderRadius: 12, borderWidth: 1 },
  summaryValue: { color: '#fff', fontSize: 27, fontWeight: '900' },
  summaryLabel: { color: C.green, fontSize: 8, fontWeight: '900', marginTop: 3 },
  evidencePanel: { marginTop: 16, padding: 20 },
  evidencePanelCompact: { marginTop: 12, padding: 13 },
  panelHeader: { minHeight: 54, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  sectionTitleCompact: { fontSize: 14 },
  sectionSubtitle: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  checkedLabel: { color: C.green, fontSize: 8, fontWeight: '900', marginTop: 4 },
  evidenceList: { borderWidth: 1, borderColor: C.borderSoft, borderRadius: 14, overflow: 'hidden' },
  evidenceRow: { minHeight: 91, paddingHorizontal: 15, paddingVertical: 13, flexDirection: 'row', alignItems: 'center' },
  evidenceRowCompact: { minHeight: 82, paddingHorizontal: 10, paddingVertical: 10 },
  evidenceBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  evidenceIcon: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  evidenceIconCompact: { width: 36, height: 36, borderRadius: 10 },
  evidenceSymbol: { fontSize: 20, fontWeight: '900' },
  evidenceCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  evidenceTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  evidenceTitleCompact: { fontSize: 11 },
  evidenceDetail: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  evidenceDetailCompact: { fontSize: 8, lineHeight: 12 },
  evidenceState: { width: 112, marginLeft: 12, fontSize: 9, fontWeight: '900', textAlign: 'right' },
  evidenceStateCompact: { width: 72, marginLeft: 7, fontSize: 7 },
  meaningPanel: { minHeight: 105, marginTop: 16, padding: 18, flexDirection: 'row', alignItems: 'center' },
  meaningPanelCompact: { minHeight: 0, marginTop: 12, padding: 13 },
  meaningCopy: { flex: 1, minWidth: 0, marginLeft: 14 },
  meaningTitle: { color: C.green, fontSize: 14, fontWeight: '900' },
  meaningText: { color: '#dce8e1', fontSize: 10, lineHeight: 16, marginTop: 5 },
  returnButton: { minHeight: 58, marginTop: 14, borderWidth: 1, borderColor: C.green, borderRadius: 13, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  returnText: { color: C.green, fontSize: 13, fontWeight: '900' },
  returnArrow: { position: 'absolute', right: 18, color: C.green, fontSize: 28 },
  pressed: { opacity: .72 },
});
