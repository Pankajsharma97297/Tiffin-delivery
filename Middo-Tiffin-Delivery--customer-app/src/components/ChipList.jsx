import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
export function ChipList({ chips }) {
  return (
    <View style={styles.chips}>
      {chips.map(chip => (
        <View key={chip.label} style={styles.chip}>
          <Text style={styles.chipEmoji}>{chip.icon}</Text>
          <Text style={styles.chipText}>{chip.label}</Text>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 17,
  },
  chip: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: colors.yellow,
  },
  chipEmoji: {
    fontSize: 12,
  },
  chipText: {
    color: '#171717',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '500',
  },
});
