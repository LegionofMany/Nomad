import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { encodeNomadQRMatrix } from './NomadQRMatrix';

const QUIET_ZONE = 4;

export function NomadQRCode({ payload, size }: { payload: string; size: number }) {
  const matrix = useMemo(() => encodeNomadQRMatrix(payload), [payload]);
  const totalModules = matrix.length + QUIET_ZONE * 2;
  const moduleSize = size / totalModules;

  return (
    <View style={[styles.code, { width: size, height: size, padding: moduleSize * QUIET_ZONE }]}>
      {matrix.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((active, columnIndex) => (
            <View
              key={`${rowIndex}-${columnIndex}`}
              style={{ width: moduleSize, height: moduleSize, backgroundColor: active ? '#020202' : '#ffffff' }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  code: { backgroundColor: '#fff', alignSelf: 'center' },
  row: { flexDirection: 'row', height: 'auto' },
});
