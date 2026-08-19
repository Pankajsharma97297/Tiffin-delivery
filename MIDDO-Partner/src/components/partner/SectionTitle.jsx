import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export function SectionTitle({ action, onAction, title }) {
  const { themeColors } = useTheme();

  if (!action) {
    return <Text style={[styles.sectionTitle, { color: themeColors.ink }]}>{title}</Text>;
  }

  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: themeColors.ink }]}>{title}</Text>
      <Pressable onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionAction: {
    color: colors.orange,
    fontSize: 13,
    fontWeight: '900',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 9,
    marginTop: 16,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
