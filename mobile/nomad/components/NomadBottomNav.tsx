import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { nomadColors, nomadRadii } from '../theme/tokens';
import type { NomadOverlayRouteName } from '../routes/nomadRoutes';

export type NomadBottomNavItem = {
  label: string;
  route?: NomadOverlayRouteName;
  icon: string;
};

type NomadBottomNavProps = {
  active: string;
  items?: NomadBottomNavItem[];
  style?: StyleProp<ViewStyle>;
};

export const defaultNomadBottomNavItems: NomadBottomNavItem[] = [
  { label: 'Home', route: 'Portfolio', icon: '⌂' },
  { label: 'Wallets', route: 'Wallets', icon: '▣' },
  { label: 'Travel', route: 'TravelMode', icon: '✈' },
  { label: 'Security', route: 'SecurityCenter', icon: '♢' },
  { label: 'Settings', route: 'Settings', icon: '⚙' },
];

export function NomadBottomNav({ active, items = defaultNomadBottomNavItems, style }: NomadBottomNavProps) {
  const navigation = useNavigation<any>();

  return (
    <View
      style={[
        {
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: 18,
          minHeight: 78,
          borderRadius: nomadRadii.lg,
          borderWidth: 1,
          borderColor: nomadColors.borderBlue,
          backgroundColor: nomadColors.surfaceStrong,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingVertical: 8,
        },
        style,
      ]}
    >
      {items.map((item) => {
        const selected = active === item.label;
        return (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => item.route && navigation.navigate(item.route)}
            style={{ alignItems: 'center', minWidth: 58 }}
          >
            <Text style={{ color: selected ? nomadColors.green : nomadColors.muted, fontSize: 28 }}>{item.icon}</Text>
            <Text style={{ color: selected ? nomadColors.green : nomadColors.muted, fontSize: 13, marginTop: 4 }}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default NomadBottomNav;
