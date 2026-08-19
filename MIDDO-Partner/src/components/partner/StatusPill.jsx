import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export function StatusPill({ status }) {
  const accepted = /accepted/i.test(status);
  const packed = /preparing/i.test(status);
  const ready = /ready|completed|delivered|paid|open/i.test(status);
  return (
    <Text
      style={[
        styles.statusPill,
        accepted ? styles.statusPillAccepted : null,
        packed ? styles.statusPillPacked : null,
        ready ? styles.statusPillDone : null,
      ]}
    >
      {status}
    </Text>
  );
}

const styles = StyleSheet.create({
  statusPill: {
    backgroundColor: colors.amberSoft,
    borderRadius: 6,
    color: '#9a6a00',
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillAccepted: {
    backgroundColor: '#e6f7ff',
    color: '#16a6ed',
  },
  statusPillDone: {
    backgroundColor: colors.greenSoft,
    color: colors.green,
  },
  statusPillPacked: {
    backgroundColor: '#eee5ff',
    color: '#8658ff',
  },
});
