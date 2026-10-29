import React from 'react';
import { Pressable, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { nomadColors, nomadRadii } from '../theme/tokens';

type NomadButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  icon?: string;
  style?: StyleProp<ViewStyle>;
};

export function NomadButton({ label, variant = 'primary', icon, style, ...props }: NomadButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';

  return (
    <Pressable
      accessibilityRole="button"
      style={[
        {
          minHeight: 58,
          borderRadius: nomadRadii.md,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          borderWidth: isPrimary ? 0 : 1,
          borderColor: isDanger ? nomadColors.red : isGhost ? 'transparent' : nomadColors.green,
          backgroundColor: isPrimary ? nomadColors.green : isDanger ? 'rgba(255, 75, 75, 0.12)' : 'transparent',
        },
        style,
      ]}
      {...props}
    >
      {icon ? <Text style={{ color: isPrimary ? '#00160a' : isDanger ? nomadColors.red : nomadColors.green, fontSize: 24, marginRight: 10 }}>{icon}</Text> : null}
      <Text style={{ color: isPrimary ? '#00160a' : isDanger ? nomadColors.red : nomadColors.green, fontSize: 20, fontWeight: '900' }}>{label}</Text>
    </Pressable>
  );
}

export default NomadButton;
