import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadRecovery } from '../nomad';
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

type AuthorityType = {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
};

const authorityTypes: AuthorityType[] = [
  { title: 'Spouse / Family Member', subtitle: 'Invite a trusted family member', icon: '●', color: C.green },
  { title: 'Business Partner', subtitle: 'Add a trusted business partner', icon: '▣', color: C.blue },
  { title: 'Attorney / Legal Advisor', subtitle: 'Invite a legal representative', icon: '⚖', color: C.orange },
  { title: 'Multi-Sign Authority', subtitle: 'Require more than one authority', icon: '♚', color: C.purple },
  { title: 'Secondary Device', subtitle: 'Use another device you control', icon: '▯', color: C.muted },
];

const requirements = [
  'The authority must accept the encrypted invitation.',
  'The authority cannot access funds or private keys.',
  'The wallet owner can remove or replace the authority.',
  'Critical approvals remain visible in the recovery log.',
];

function AuthorityRow({ item, selected, onPress, last }: { item: AuthorityType; selected: boolean; onPress: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.authorityRow, !last && styles.rowBorder, selected && styles.authoritySelected]}>
      <RoundIcon symbol={item.icon} color={item.color} size={48} filled />
      <View style={styles.authorityCopy}><Text style={styles.authorityTitle}>{item.title}</Text><Text style={styles.authoritySub}>{item.subtitle}</Text></View>
      <Text style={[styles.authorityArrow, selected && { color: C.green }]}>{selected ? '✓' : '›'}</Text>
    </Pressable>
  );
}

export default function CreateOwnerAuthorityScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { ownerAuthorityRequest, requestOwnerAuthority, error } = useNomadRecovery();
  const [selectedAuthority, setSelectedAuthority] = useState(authorityTypes[0]);
  const [authorityName, setAuthorityName] = useState('');
  const [authorityContact, setAuthorityContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const pending = ownerAuthorityRequest.status === 'pending';
  const canSubmit = selectedAuthority.title === 'Secondary Device' || (authorityName.trim().length >= 2 && authorityContact.trim().length >= 4);

  const handleAddAuthority = async () => {
    if (pending) {
      navigation.navigate('OwnerAuthorityApproval');
      return;
    }
    if (!canSubmit) {
      setFeedback('Add the authority name and a secure contact method.');
      return;
    }
    try {
      setBusy(true);
      setFeedback('');
      const identity = selectedAuthority.title === 'Secondary Device'
        ? 'Owner secondary device'
        : `${authorityName.trim()} • ${authorityContact.trim()}`;
      await requestOwnerAuthority(`Create Owner Authority: ${selectedAuthority.title} • ${identity}`);
      navigation.navigate('OwnerAuthorityApproval');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to create the authority invitation.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <NomadPage maxWidth={900}>
      <PageHeader title="Create Owner Authority" subtitle="Add a trusted authority to protect your wallet" icon="♙" color={C.green} help />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {pending ? <Text style={styles.pending}>An Owner Authority request is already pending.</Text> : null}

      <Panel tone="green" style={[styles.hero, compact && styles.heroCompact]}>
        <RoundIcon symbol="♙" color={C.green} size={compact ? 82 : 112} filled />
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Add an Owner Authority</Text>
          <Text style={styles.heroText}>An Owner Authority can approve protected recovery and security changes. It does not receive wallet custody, private keys or independent spending rights.</Text>
          <View style={styles.benefitRow}>
            {[
              ['▣', 'Extra Security'], ['♙', 'Owner Control'], ['◷', 'Recovery Help'],
            ].map(([icon, label]) => <View key={label} style={styles.benefit}><Text style={styles.benefitIcon}>{icon}</Text><Text style={styles.benefitText}>{label}</Text></View>)}
          </View>
        </View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <Text style={styles.sectionTitle}>CHOOSE AUTHORITY TYPE</Text>
        <View style={styles.list}>{authorityTypes.map((item, index) => <AuthorityRow key={item.title} item={item} selected={selectedAuthority.title === item.title} onPress={() => { setSelectedAuthority(item); setFeedback(''); }} last={index === authorityTypes.length - 1} />)}</View>
      </Panel>

      <Panel style={styles.sectionPanel}>
        <Text style={styles.sectionTitle}>AUTHORITY DETAILS</Text>
        {selectedAuthority.title === 'Secondary Device' ? (
          <View style={styles.secondaryDeviceBox}><RoundIcon symbol="▯" color={C.blue} size={48} /><View style={styles.secondaryCopy}><Text style={styles.secondaryTitle}>Owner-controlled secondary device</Text><Text style={styles.secondaryText}>The invitation will be paired through the secure device setup flow.</Text></View></View>
        ) : (
          <>
            <Text style={styles.inputLabel}>Authority name</Text>
            <TextInput value={authorityName} onChangeText={setAuthorityName} placeholder="Trusted person or organization" placeholderTextColor="#6f8197" style={styles.input} />
            <Text style={styles.inputLabel}>Secure contact</Text>
            <TextInput value={authorityContact} onChangeText={setAuthorityContact} placeholder="Email, directory identity or secure handle" placeholderTextColor="#6f8197" autoCapitalize="none" style={styles.input} />
          </>
        )}
      </Panel>

      <Panel style={styles.requirementsPanel}>
        <View style={styles.requirementsCopy}>
          <Text style={styles.sectionTitle}>AUTHORITY REQUIREMENTS</Text>
          {requirements.map((requirement) => <View key={requirement} style={styles.requirement}><Text style={styles.requirementCheck}>✓</Text><Text style={styles.requirementText}>{requirement}</Text></View>)}
        </View>
        <View style={styles.authorityGraphic}><Text style={[styles.graphicAuthority, { color: C.green }]}>♙</Text><Text style={[styles.graphicAuthority, styles.graphicBlue]}>♙</Text><Text style={[styles.graphicAuthority, styles.graphicPurple]}>♙</Text></View>
      </Panel>

      <Panel style={styles.infoPanel}><RoundIcon symbol="i" color={C.blue} size={43} /><Text style={styles.infoText}>Nomad supports multiple Owner Authorities, but every authority should be independently trusted and verified by the wallet owner.</Text></Panel>

      {feedback ? <Text style={[styles.feedback, feedback.toLowerCase().includes('unable') && { color: C.red }]}>{feedback}</Text> : null}
      <PrimaryButton
        label={pending ? 'View Pending Authority' : busy ? 'Creating Invitation…' : 'Add Owner Authority'}
        subtitle={pending ? 'Review or cancel the existing request' : 'Create an encrypted approval invitation'}
        icon="♙"
        tone="green"
        disabled={busy || (!pending && !canSubmit)}
        onPress={() => void handleAddAuthority()}
      />

      <BottomNav active="More" fifth={['•••', 'More', 'Settings']} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  error: { color: C.red, fontSize: 11, marginBottom: 10 },
  pending: { color: C.green, fontSize: 11, fontWeight: '800', marginBottom: 10 },
  hero: { minHeight: 220, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 21 },
  heroCompact: { flexDirection: 'column', alignItems: 'flex-start' },
  heroCopy: { flex: 1, minWidth: 0 },
  heroTitle: { color: C.green, fontSize: 22, fontWeight: '900' },
  heroText: { color: '#eff4f8', fontSize: 12, lineHeight: 20, marginTop: 8 },
  benefitRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 18 },
  benefit: { flex: 1, alignItems: 'center' },
  benefitIcon: { color: C.green, fontSize: 25 },
  benefitText: { color: C.muted, fontSize: 9, textAlign: 'center', marginTop: 5 },
  sectionPanel: { marginTop: 17, padding: 17 },
  sectionTitle: { color: C.green, fontSize: 14, fontWeight: '900', letterSpacing: .3 },
  list: { marginTop: 12, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 11, overflow: 'hidden' },
  authorityRow: { minHeight: 73, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  authoritySelected: { backgroundColor: 'rgba(32,239,112,.05)' },
  authorityCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  authorityTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  authoritySub: { color: C.muted, fontSize: 10, marginTop: 4 },
  authorityArrow: { color: '#8aa1b3', fontSize: 28 },
  inputLabel: { color: C.muted, fontSize: 10, marginTop: 15, marginBottom: 6 },
  input: { minHeight: 52, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.panel2, color: '#fff', paddingHorizontal: 14, fontSize: 13, outlineStyle: 'none' } as any,
  secondaryDeviceBox: { minHeight: 84, marginTop: 14, borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 13, flexDirection: 'row', alignItems: 'center' },
  secondaryCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  secondaryTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  secondaryText: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  requirementsPanel: { minHeight: 180, marginTop: 17, padding: 17, flexDirection: 'row', alignItems: 'center' },
  requirementsCopy: { flex: 1, minWidth: 0 },
  requirement: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  requirementCheck: { color: C.green, fontSize: 13, fontWeight: '900', marginRight: 9 },
  requirementText: { flex: 1, color: '#eef3f7', fontSize: 10, lineHeight: 15 },
  authorityGraphic: { width: 135, height: 125, marginLeft: 15 },
  graphicAuthority: { position: 'absolute', fontSize: 48, top: 0, left: 6 },
  graphicBlue: { color: C.blue, top: 31, left: 72 },
  graphicPurple: { color: C.purple, top: 70, left: 25 },
  infoPanel: { minHeight: 78, marginTop: 17, padding: 14, flexDirection: 'row', alignItems: 'center' },
  infoText: { flex: 1, minWidth: 0, color: '#eef3f7', fontSize: 10, lineHeight: 16, marginLeft: 12 },
  feedback: { color: C.green, fontSize: 11, marginTop: 12 },
});
