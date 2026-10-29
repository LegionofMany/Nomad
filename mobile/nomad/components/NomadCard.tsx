import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';

import { nomadColors, nomadRadii, nomadSpacing } from '../theme/tokens';

type NomadCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'blue' | 'green' | 'red' | 'amber' | 'purple';
};

const toneBorder: Record<NonNullable<NomadCardProps['tone']>, string> = {
  default: nomadColors.borderBlue,
  blue: nomadColors.blue,
  green: nomadColors.green,
  red: nomadColors.red,
  amber: nomadColors.amber,
  purple: nomadColors.purple,
};

export function NomadCard({ children, style, tone = 'default' }: NomadCardProps) {
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: toneBorder[tone],
          borderRadius: nomadRadii.lg,
          backgroundColor: nomadColors.surface,
          padding: nomadSpacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default NomadCard;
