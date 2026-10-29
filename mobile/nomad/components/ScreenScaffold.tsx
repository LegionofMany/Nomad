import React from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';

import { nomadColors } from '../theme/tokens';

type ScreenScaffoldProps = {
  children: React.ReactNode;
  withBottomNav?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenScaffold({ children, withBottomNav = true, style, contentStyle }: ScreenScaffoldProps) {
  return (
    <View style={[{ flex: 1, backgroundColor: nomadColors.background }, style]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: withBottomNav ? 116 : 28 }, contentStyle]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export default ScreenScaffold;
