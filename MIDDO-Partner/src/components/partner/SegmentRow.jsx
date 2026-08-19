import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export function SegmentRow({ activeIndex = 0, delivery, items, onSelect }) {
  const { darkMode, themeColors } = useTheme();

  const rowBg = darkMode ? '#1a1816' : colors.white;
  const rowBorder = darkMode ? '#2e2724' : '#eadfd7';
  const chipBg = darkMode ? '#2a1a10' : '#f5eee8';

  return (
    <View style={[
      styles.segmentRow,
      delivery ? [styles.segmentRowDelivery, { backgroundColor: rowBg, borderBottomColor: rowBorder }] : null,
    ]}>
      {items.map((item, index) => {
        const active = index === activeIndex;
        return (
          <Pressable key={item} onPress={() => onSelect?.(index)} style={[styles.segmentPressable, delivery ? styles.segmentPressableDelivery : null]}>
            <Text style={[
              styles.segment,
              { backgroundColor: chipBg, color: themeColors.muted },
              delivery ? [styles.segmentDelivery, { backgroundColor: rowBg, color: darkMode ? '#8a776d' : '#8a776d' }] : null,
              active ? [styles.segmentActive, { backgroundColor: darkMode ? '#2a1a10' : colors.orangeSoft, color: colors.orange }] : null,
              delivery && active ? [styles.segmentActiveDelivery, { backgroundColor: rowBg }] : null,
            ]}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  segmentActive: {},
  segmentActiveDelivery: {
    borderBottomColor: '#179ce8',
    borderBottomWidth: 2,
    color: '#179ce8',
  },
  segmentDelivery: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    borderRadius: 0,
    flex: 1,
    fontSize: 12,
    paddingVertical: 13,
    textAlign: 'center',
  },
  segmentPressable: {},
  segmentPressableDelivery: {
    flex: 1,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  segmentRowDelivery: {
    borderBottomWidth: 1,
    gap: 0,
    marginHorizontal: -14,
    marginBottom: 16,
  },
});
