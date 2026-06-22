import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { nomadColors } from '../theme/tokens';

type StatRowProps = {
  label: string;
  value: string;
  subvalue?: string;
  icon?: string;
  valueTone?: 'default' | 'green' | 'red' | 'amber' | 'blue';
  style?: StyleProp<ViewStyle>;
};

const toneColor = {
  default: nomadColors.white,
  green: nomadColors.green,
  red: nomadColors.red,
  amber: nomadColors.amber,
  blue: nomadColors.blue,
} as const;

export function StatRow({ label, value, subvalue, icon, valueTone = 'default', style }: StatRowProps) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(139,168,202,0.12)' }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {icon ? <Text style={{ color: nomadColors.green, fontSize: 22, marginRight: 12 }}>{icon}</Text> : null}
        <Text style={{ color: nomadColors.muted, fontSize: 16 }}>{label}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', flex: 1 }}>
        <Text style={{ color: toneColor[valueTone], fontSize: 16, fontWeight: '700' }}>{value}</Text>
        {subvalue ? <Text style={{ color: nomadColors.muted, fontSize: 12, marginTop: 3 }}>{subvalue}</Text> : null}
      </View>
    </View>
  );
}

export default StatRow;
