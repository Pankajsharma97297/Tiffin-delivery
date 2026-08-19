import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { Icons } from '../../theme/images';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export function SearchPill({ delivery, placeholder }) {
  const { darkMode, themeColors } = useTheme();

  const pillBg = delivery
    ? 'rgba(255,255,255,0.16)'
    : darkMode ? '#1e1c1b' : colors.white;
  const pillBorder = delivery
    ? 'rgba(255,255,255,0.56)'
    : darkMode ? '#2e2724' : colors.line;

  return (
    <View style={[
      styles.searchPill,
      delivery ? styles.searchPillDelivery : null,
      { backgroundColor: pillBg, borderColor: pillBorder },
    ]}>
      <Image
        source={Icons.Search}
        style={[styles.searchIcon, delivery ? styles.searchIconDelivery : { tintColor: themeColors.muted }]}
      />
      <Text style={[
        styles.searchText,
        delivery ? styles.searchTextDelivery : { color: themeColors.muted },
      ]}>
        {placeholder}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  searchIcon: {
    height: 15,
    width: 15,
  },
  searchIconDelivery: {
    height: 17,
    tintColor: '#d6ecfb',
    width: 17,
  },
  searchPill: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    padding: 9,
  },
  searchText: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchPillDelivery: {
    borderRadius: 10,
    marginBottom: 0,
    minHeight: 45,
    paddingHorizontal: 13,
  },
  searchTextDelivery: {
    color: '#d6ecfb',
    fontSize: 14,
  },
});
