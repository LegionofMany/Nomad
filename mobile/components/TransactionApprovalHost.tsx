import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { subscribeApprovals, type PendingApproval } from "../services/approvalBroker";

const NETWORK_LABEL: Record<string, string> = {
  "bitcoin-testnet": "Bitcoin Testnet",
  "evm-sepolia": "Ethereum Sepolia",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} selectable>
        {value}
      </Text>
    </View>
  );
}

/** Mount once near the app root. Shows a full review before anything is signed. */
export function TransactionApprovalHost() {
  const [pending, setPending] = React.useState<PendingApproval | null>(null);

  React.useEffect(() => subscribeApprovals(setPending), []);

  if (!pending) return null;
  const r = pending.review;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => pending.resolve(false)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.banner}>
            <Text style={styles.bannerText}>TEST NETWORK. These coins have no real value.</Text>
          </View>
          <Text style={styles.title}>Review before signing</Text>
          <ScrollView style={styles.body}>
            <Row label="Network" value={NETWORK_LABEL[r.chainId] ?? r.chainId} />
            <Row label="From" value={r.fromAddress} />
            <Row label="To" value={r.toAddress} />
            <Row label="Amount" value={`${r.amount} ${r.assetSymbol}`} />
            <Row label="Network fee (max)" value={`${r.feeEstimate} ${r.feeAssetSymbol}`} />
            {r.memo ? <Row label="Note" value={r.memo} /> : null}
          </ScrollView>
          <Text style={styles.hint}>Check the full "To" address. Signing cannot be undone.</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" style={[styles.button, styles.decline]} onPress={() => pending.resolve(false)}>
              <Text style={styles.declineText}>Decline</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={[styles.button, styles.approve]} onPress={() => pending.resolve(true)}>
              <Text style={styles.approveText}>Approve and sign</Text>
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
  title: { color: "#ffffff", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  body: { flexGrow: 0 },
  row: { marginBottom: 10 },
  label: { color: "#8aa4c0", fontSize: 12, marginBottom: 2 },
  value: { color: "#ffffff", fontSize: 15 },
  hint: { color: "#8aa4c0", fontSize: 12, marginTop: 4, marginBottom: 12 },
  actions: { flexDirection: "row", gap: 12 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  decline: { backgroundColor: "#16283d" },
  approve: { backgroundColor: "#2f7dff" },
  declineText: { color: "#ffffff", fontWeight: "600" },
  approveText: { color: "#ffffff", fontWeight: "700" },
});
