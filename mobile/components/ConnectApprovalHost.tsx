import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { subscribeConnect, type ConnectUiState } from "../services/connectBroker";

/** Mount once near the app root. Shows who is asking and what for, before anything is signed. */
export function ConnectApprovalHost() {
  const [state, setState] = React.useState<ConnectUiState | null>(null);

  React.useEffect(() => subscribeConnect(setState), []);

  if (!state) return null;

  if (state.type === "notice") {
    return (
      <Modal transparent animationType="fade" visible onRequestClose={state.close}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>{state.title}</Text>
            <Text style={styles.message}>{state.message}</Text>
            <Pressable accessibilityRole="button" style={[styles.button, styles.approve]} onPress={state.close}>
              <Text style={styles.approveText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  const r = state.review;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => state.resolve(false)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.banner}>
            <Text style={styles.bannerText}>TEST NETWORK. Nothing here uses real money.</Text>
          </View>
          <Text style={styles.title}>{r.title}</Text>
          <Text style={styles.origin} selectable>
            {r.origin}
          </Text>
          <ScrollView style={styles.body}>
            {r.lines.map((line, i) => (
              <Text key={i} style={styles.line} selectable>
                {line}
              </Text>
            ))}
          </ScrollView>
          <Text style={styles.hint}>Only approve if you started this from {r.appName} yourself.</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" style={[styles.button, styles.decline]} onPress={() => state.resolve(false)}>
              <Text style={styles.declineText}>Decline</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={[styles.button, styles.approve]} onPress={() => state.resolve(true)}>
              <Text style={styles.approveText}>Approve</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(1,6,13,0.85)", justifyContent: "center", padding: 16 },
  card: { backgroundColor: "#0b1624", borderRadius: 16, padding: 16, maxHeight: "90%", borderWidth: 1, borderColor: "#1d3550" },
  banner: { backgroundColor: "#3a2f0b", borderRadius: 8, padding: 8, marginBottom: 12 },
  bannerText: { color: "#ffd866", fontWeight: "700", textAlign: "center" },
  title: { color: "#ffffff", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  origin: { color: "#8aa4c0", fontSize: 13, marginBottom: 12 },
  message: { color: "#ffffff", fontSize: 15, marginVertical: 12 },
  body: { flexGrow: 0 },
  line: { color: "#ffffff", fontSize: 15, marginBottom: 8 },
  hint: { color: "#8aa4c0", fontSize: 12, marginTop: 4, marginBottom: 12 },
  actions: { flexDirection: "row", gap: 12 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  decline: { backgroundColor: "#16283d" },
  approve: { backgroundColor: "#2f7dff" },
  declineText: { color: "#ffffff", fontWeight: "600" },
  approveText: { color: "#ffffff", fontWeight: "700" },
});
