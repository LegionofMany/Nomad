/**
 * Mobile (Expo) UI component
 *
 * This file is written to be Expo-compatible. When moving into an Expo
 * `mobile/` app, keep the file at `mobile/components/ClockDial.tsx` and
 * preserve relative imports (e.g. `../theme`). No runtime logic changes
 * have been made here — only this note to clarify intent.
 */

import React, { useRef, useState } from "react";
import { View, StyleSheet, PanResponder, Vibration, Platform } from "react-native";
import { useTheme } from "../theme";

import type { ClockTime } from "../types";
export type { ClockTime };

const SNAP_MINUTES = 5;
const FULL_ROTATION = 360;

function angleToTime(angle: number): ClockTime {
  const normalized = (angle + 360) % 360;
  const totalMinutes =
    Math.round((normalized / 360) * 720 / SNAP_MINUTES) * SNAP_MINUTES;
  const hour = Math.floor(totalMinutes / 60) % 12 || 12;
  const minute = totalMinutes % 60;
  return { hour, minute, second: 0 };
}

export const ClockDial: React.FC<{
  value: ClockTime;
  onChange: (t: ClockTime) => void;
}> = ({ onChange }) => {
  const colors = useTheme();
  const angleRef = useRef(0);
  const dragBaseAngleRef = useRef(0);
  const [angle, setAngle] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragBaseAngleRef.current = angleRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        const rotation = gesture.dx; // horizontal bezel drag
        const newAngle = dragBaseAngleRef.current + rotation;
        const step = FULL_ROTATION / (720 / SNAP_MINUTES);
        const snapped = Math.round(newAngle / step) * step;
        angleRef.current = snapped;
        setAngle(snapped);
        onChange(angleToTime(snapped));
        if (Platform.OS !== "web") Vibration.vibrate(5);
      },
      onPanResponderRelease: () => {},
      onPanResponderTerminate: () => {},
    })
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Clock dial"
      style={styles.container}
    >
      <View
        style={[styles.bezel, { borderColor: colors.border, transform: [{ rotate: `${angle}deg` }] }]}
      />
      <View
        style={[
          styles.centerPin,
          { backgroundColor: colors.text },
          Platform.OS === "web" ? ({ pointerEvents: "none" } as any) : null,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 280,
    borderRadius: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  bezel: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 6,
  },
  centerPin: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default ClockDial;
