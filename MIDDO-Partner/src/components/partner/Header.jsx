import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { ArrowLeftIcon } from '../ArrowLeftIcon';
import { useTheme } from '../../context/ThemeContext';

export function Header({ title, subtitle, onBack, topInset }) {
  const { themeColors } = useTheme();
  return (
    <View style={[styles.header, { paddingTop: Math.max(48, topInset + 16) }]}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.onboardingBackButton}>
          <ArrowLeftIcon />
        </Pressable>
      ) : (
        <View style={styles.headerSpacer} />
      )}
      <View style={styles.headerCopy}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.headerSubtitle, { color: themeColors.muted }]}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 22,
    paddingBottom: 10,
  },
  headerCopy: {
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  onboardingBackButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
});
