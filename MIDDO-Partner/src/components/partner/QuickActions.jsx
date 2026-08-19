import React from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { SectionTitle } from './SectionTitle';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export function QuickActions({ items }) {
  const { darkMode, themeColors } = useTheme();

  const buttonBg = darkMode ? '#1e1c1b' : colors.white;
  const buttonBorder = darkMode ? '#2e2724' : '#eadfd7';
  const iconBg = darkMode ? '#2a1a10' : colors.orangeSoft;

  return (
    <>
      <SectionTitle title="Quick Actions" />
      <View style={styles.quickGrid}>
        {items.map(([label, icon, onPress, offline]) => (
          <Pressable
            key={label}
            onPress={onPress}
            style={[
              styles.quickButton,
              { backgroundColor: offline ? (darkMode ? '#2a1010' : '#fff5f5') : buttonBg, borderColor: offline ? (darkMode ? '#4a1a1a' : '#f5c2c7') : buttonBorder },
            ]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: offline ? (darkMode ? '#3a1010' : '#fde2e4') : iconBg }]}>
              <Image source={icon} style={[styles.quickIcon, { tintColor: offline ? '#f14150' : colors.orange }]} />
            </View>
            <Text style={[styles.quickButtonText, { color: offline ? '#f14150' : themeColors.ink }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  quickButton: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    flexBasis: 0,
    flexGrow: 1,
    minHeight: 106,
    justifyContent: 'center',
    padding: 9,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
    textAlign: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
  },
  quickIcon: {
    height: 21,
    width: 21,
  },
  quickIconBox: {
    alignItems: 'center',
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    marginBottom: 9,
    width: 44,
  },
});
