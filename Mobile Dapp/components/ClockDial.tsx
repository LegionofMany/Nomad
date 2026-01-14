import React, { useRef, useState } from "react";
import { View, StyleSheet, PanResponder, Vibration } from "react-native";
import { useTheme } from "../theme";

export type ClockTime = {
  hour: number;   // 1–12
  minute: number; // multiples of 5
};

const SNAP_MINUTES = 5;
const FULL_ROTATION = 360;

function angleToTime(angle: number): ClockTime {
  const normalized = (angle + 360) % 360;
  const totalMinutes =
    Math.round((normalized / 360) * 720 / SNAP_MINUTES) * SNAP_MINUTES;
  const hour = Math.floor(totalMinutes / 60) % 12 || 12;
  const minute = totalMinutes % 60;
  return { hour, minute };
}

export const ClockDial: React.FC<{
  value: ClockTime;
  onChange: (t: ClockTime) => void;
}> = ({ onChange }) => {
  const colors = useTheme();
  const angleRef = useRef(0);
  const [angle, setAngle] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const rotation = gesture.dx; // horizontal bezel drag
        const newAngle = angleRef.current + rotation;
        const step = FULL_ROTATION / (720 / SNAP_MINUTES);
        const snapped = Math.round(newAngle / step) * step;
        angleRef.current = snapped;
        setAngle(snapped);
        onChange(angleToTime(snapped));
        Vibration.vibrate(5);
      },
      onPanResponderRelease: () => {
        angleRef.current = angle;
      },
    })
  ).current;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Clock dial"
      style={styles.container}
    >
      <View
        {...panResponder.panHandlers}
        style={[styles.bezel, { borderColor: colors.border, transform: [{ rotate: `${angle}deg` }] }]}
      />
      <View style={[styles.centerPin, { backgroundColor: colors.text }]} />
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
