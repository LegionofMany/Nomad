import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

const reqriumBadge = require('../assets/reqrium-badge.png');

export function ReqriumBadge({
  size = 64,
  fill = false,
  style,
}: {
  size?: number;
  fill?: boolean;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      accessibilityLabel="Reqrium eye and R badge"
      accessibilityIgnoresInvertColors
      resizeMode="contain"
      source={reqriumBadge}
      style={[fill ? { width: '100%', height: '100%' } : { width: size, height: size }, style]}
    />
  );
}
