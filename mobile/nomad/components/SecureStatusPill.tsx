import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { nomadColors, nomadRadii } from '../theme/tokens';

type SecureStatusPillProps = {
  label?: string;
  status?: string;
  style?: StyleProp<ViewStyle>;
};

export function SecureStatusPill({ label = 'All Systems', status = 'SECURE', style }: SecureStatusPillProps) {
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: nomadColors.borderBlue,
          borderRadius: nomadRadii.pill,
          paddingHorizontal: 14,
          paddingVertical: 8,
          backgroundColor: nomadColors.surfaceStrong,
          flexDirection: 'row',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: nomadColors.green, fontSize: 18, marginRight: 8 }}>♢</Text>
      <View>
        <Text style={{ color: nomadColors.muted, fontSize: 12 }}>{label}</Text>
        <Text style={{ color: nomadColors.green, fontSize: 12, fontWeight: '900' }}>{status}</Text>
      </View>
    </View>
  );
}

export default SecureStatusPill;
