import React from 'react';
import { Pressable, Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { nomadColors } from '../theme/tokens';
import SecureStatusPill from './SecureStatusPill';

type NomadHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  showBack?: boolean;
  rightLabel?: string;
  onRightPress?: () => void;
  showSecurePill?: boolean;
  showHelp?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function NomadHeader({
  title,
  subtitle,
  icon,
  badge,
  showBack = true,
  rightLabel,
  onRightPress,
  showSecurePill = false,
  showHelp = false,
  style,
}: NomadHeaderProps) {
  const navigation = useNavigation<any>();

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {showBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={{ marginRight: 14 }}>
            <Text style={{ color: nomadColors.white, fontSize: 42, lineHeight: 46 }}>‹</Text>
          </Pressable>
        ) : null}

        {icon ? <Text style={{ color: nomadColors.green, fontSize: 38, marginRight: 12 }}>{icon}</Text> : null}

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={{ color: nomadColors.white, fontSize: 28, fontWeight: '900' }}>{title}</Text>
            {badge ? (
              <View style={{ marginLeft: 8, borderRadius: 8, backgroundColor: 'rgba(34, 243, 109, 0.16)', paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: nomadColors.green, fontSize: 12, fontWeight: '900' }}>{badge}</Text>
              </View>
            ) : null}
          </View>
          {subtitle ? <Text style={{ color: nomadColors.muted, fontSize: 16, marginTop: 3 }}>{subtitle}</Text> : null}
        </View>
      </View>

      {showSecurePill ? <SecureStatusPill /> : null}

      {showHelp ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Help" onPress={onRightPress} style={{ marginLeft: 12 }}>
          <Text style={{ color: nomadColors.green, fontSize: 22, fontWeight: '700' }}>?</Text>
        </Pressable>
      ) : rightLabel ? (
        <Pressable accessibilityRole="button" onPress={onRightPress} style={{ marginLeft: 12 }}>
          <Text style={{ color: nomadColors.green, fontSize: 18 }}>{rightLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default NomadHeader;
