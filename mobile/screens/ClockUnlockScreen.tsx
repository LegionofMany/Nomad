/**
 * Mobile (Expo) screen
 *
 * Expo-ready. Keep this file at `mobile/screens/ClockUnlockScreen.tsx` when
 * moving the UI into an Expo app. Do not change UI logic — only update
 * relative imports if you move the file inside a different folder.
 */

import React, { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ClockDial, { ClockTime } from "../components/ClockDial";
import { useTheme } from "../theme";
import { useAppState } from "../state/appState";

export const ClockUnlockScreen = () => {
  const colors = useTheme();
  const navigation = useNavigation<any>();
  const { walletStatus, unlockTime, setUnlockTime, unlockWithClock, resetDemo } = useAppState();
  const [time, setTime] = useState<ClockTime>({ hour: 12, minute: 0 });
  const [message, setMessage] = useState<string | null>(null);

  const configuredLabel = useMemo(() => {
    if (!unlockTime) return "Not set yet";
    return `${unlockTime.hour}:${String(unlockTime.minute).padStart(2, "0")}`;
  }, [unlockTime]);

  const inputLabel = `${time.hour}:${String(time.minute).padStart(2, "0")}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 8 }}>Clock Unlock</Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 14, textAlign: "center" }}>
        Configured unlock time: {configuredLabel}
      </Text>

      {walletStatus === "no_wallet" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to wallet setup"
          onPress={() => navigation.navigate("Lock")}
          style={{ paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, marginBottom: 16 }}
        >
          <Text style={{ color: colors.text, fontWeight: "700" }}>Create / Restore Wallet</Text>
        </Pressable>
      ) : null}

      <ClockDial value={time} onChange={setTime} />

      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save unlock time"
          onPress={async () => {
            setMessage(null);
            try {
              await setUnlockTime(time);
              setMessage(`Saved unlock time: ${inputLabel}`);
            } catch (e: any) {
              setMessage(e?.message ?? "Failed to set unlock time");
            }
          }}
          style={{ paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10 }}
        >
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>Save Time</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Unlock"
          onPress={async () => {
            setMessage(null);
            const res = await unlockWithClock(time);
            if (res.ok) {
              navigation.navigate("Portfolio");
              return;
            }

            if (res.reason === "locked_out") {
              if (res.permanentlyLocked) {
                setMessage("Recovery required (permanently locked). Reset the demo wallet to continue.");
              } else {
                setMessage(`Locked out. Try again in ~${res.remainingLockSeconds ?? 0}s.`);
              }
              return;
            }

            if (res.reason === "bad_time") {
              setMessage("Incorrect time.");
              return;
            }

            setMessage("Unlock failed.");
          }}
          style={{ paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10 }}
        >
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "800" }}>Unlock</Text>
        </Pressable>
      </View>

      {message ? <Text style={{ marginTop: 14, color: colors.muted, fontSize: 13, textAlign: "center" }}>{message}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reset demo"
        onPress={async () => {
          await resetDemo();
          setMessage("Demo reset.");
          navigation.navigate("Lock");
        }}
        style={{ marginTop: 18, paddingVertical: 8, paddingHorizontal: 14 }}
      >
        <Text style={{ color: colors.muted, fontSize: 13 }}>Reset demo</Text>
      </Pressable>
    </View>
  );
};

export default ClockUnlockScreen;
