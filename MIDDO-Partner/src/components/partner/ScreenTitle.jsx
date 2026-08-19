import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function ScreenTitle({ title }) {
  const { themeColors } = useTheme();
  return <Text style={[styles.screenTitle, { color: themeColors.ink }]}>{title}</Text>;
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
    marginTop: 12,
  },
});
