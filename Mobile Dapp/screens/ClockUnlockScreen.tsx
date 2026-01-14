import React, { useState } from "react";
import { View, Text } from "react-native";
import ClockDial, { ClockTime } from "../components/ClockDial";
import { useTheme } from "../theme";

export const ClockUnlockScreen = ({
  onSubmit,
}: {
  onSubmit: (time: ClockTime) => void;
}) => {
  const colors = useTheme();
  const [time, setTime] = useState<ClockTime>({ hour: 12, minute: 0 });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 12 }}>Clock Unlock</Text>
      <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16, textAlign: "center" }}>
        Set the hour and minute using the dial, then submit.
      </Text>
      <ClockDial value={time} onChange={setTime} />
      <Text
        accessibilityRole="button"
        accessibilityLabel="Submit unlock time"
        onPress={() => onSubmit(time)}
        style={{ marginTop: 16, color: colors.primary, fontSize: 16, fontWeight: "600" }}
      >
        Submit
      </Text>
    </View>
  );
};

export default ClockUnlockScreen;
