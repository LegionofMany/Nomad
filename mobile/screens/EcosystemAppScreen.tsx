/**
 * One screen for each Arkrilium app (Reqrium, Guardian Trader, Syaxio). The bottom bar opens it
 * with { appId }. It says what the app does with Nomad and opens the app's website when linked.
 */
import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';

import { AppTabBar, type TabId } from '../components/AppTabBar';
import { findEcosystemApp, openableUrl } from '../config/ecosystem';
import { C } from '../ui/NomadShell';

export default function EcosystemAppScreen() {
  const route = useRoute<any>();
  const app = findEcosystemApp(route.params?.appId);
  const url = openableUrl(app?.url);

  const open = async () => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open', 'This phone could not open the link.');
    }
  };

  if (!app) {
    return (
      <View style={s.root}>
        <View style={s.scroll}><Text style={s.title}>App not found</Text></View>
        <AppTabBar active="more" />
      </View>
    );
  }

  const active: TabId = app.id === 'zonycs' ? 'more' : (app.id as TabId);

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.logo}><Text style={s.logoText}>{app.name.slice(0, 1)}</Text></View>
        <Text style={s.title}>{app.name}</Text>
        <Text style={s.role}>{app.role}</Text>
        <Text style={s.summary}>{app.summary}</Text>

        <View style={s.card}>
          <Text style={s.cardTitle}>With Nomad</Text>
          {app.withNomad.map((line) => (
            <View key={line} style={s.line}>
              <Text style={s.bullet}>•</Text>
              <Text style={s.lineText}>{line}</Text>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!url}
          onPress={() => void open()}
          style={[s.openBtn, !url && { opacity: 0.45 }]}
        >
          <Text style={s.openText}>{url ? `Open ${app.name}` : 'Not linked yet'}</Text>
        </Pressable>
        <Text style={s.note}>
          {url
            ? 'Opens in your browser. When the site asks, choose "Sign in with Nomad" and approve it here. Nomad never gives the app your keys.'
            : 'This app has not been linked to Nomad in this build yet.'}
        </Text>
      </ScrollView>
      <AppTabBar active={active} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 24, paddingBottom: 32, alignItems: 'center' },
  logo: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  logoText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 14 },
  role: { color: C.green, fontSize: 14, fontWeight: '800', marginTop: 4 },
  summary: { color: C.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 14 },
  card: { alignSelf: 'stretch', marginTop: 24, backgroundColor: C.panel, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 16, padding: 16 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 8 },
  line: { flexDirection: 'row', gap: 8, marginTop: 6 },
  bullet: { color: C.blue, fontSize: 15 },
  lineText: { color: C.muted, fontSize: 14, lineHeight: 20, flex: 1 },
  openBtn: { alignSelf: 'stretch', marginTop: 24, backgroundColor: C.blue, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  openText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  note: { color: C.muted2, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 12 },
});
