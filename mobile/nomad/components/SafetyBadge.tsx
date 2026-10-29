import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { nomadColors, nomadRadii } from '../theme/tokens';

type SafetyBadgeProps = {
  label: string;
  tone?: 'green' | 'blue' | 'amber' | 'red' | 'purple';
  icon?: string;
  style?: StyleProp<ViewStyle>;
};

const toneColor = {
  green: nomadColors.green,
  blue: nomadColors.blue,
  amber: nomadColors.amber,
  red: nomadColors.red,
  purple: nomadColors.purple,
} as const;

export function SafetyBadge({ label, tone = 'green', icon = '✓', style }: SafetyBadgeProps) {
  const color = toneColor[tone];

  return (
    <View
      style={[
        {
          borderRadius: nomadRadii.pill,
          borderWidth: 1,
          borderColor: color,
          backgroundColor: `${color}22`,
          paddingHorizontal: 10,
          paddingVertical: 5,
          flexDirection: 'row',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color, fontWeight: '900', marginRight: 5 }}>{icon}</Text>
      <Text style={{ color, fontSize: 12, fontWeight: '900' }}>{label}</Text>
    </View>
  );
}

export default SafetyBadge;
