import React from 'react';
import { Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export function CapacityCard({ dailyCapacity, isSaving, onCapacityChange, onSaveCapacity, usedCapacity }) {
  const { darkMode, themeColors } = useTheme();

  const safeCapacity = Math.max(1, Number(dailyCapacity || 0));
  const percentage = Math.min(100, Math.round((usedCapacity / safeCapacity) * 100));
  const isFull = usedCapacity >= safeCapacity;

  const cardBg = darkMode ? '#1e1c1b' : colors.white;
  const cardBorder = isFull ? '#e85d3a' : (darkMode ? '#2e2724' : colors.line);
  const chipBg = darkMode ? '#2a1a10' : '#f8eee6';
  const chipActiveBg = darkMode ? '#3a2010' : colors.orangeSoft;
  const inputBg = darkMode ? '#141210' : '#fffaf5';
  const progressTrackBg = darkMode ? '#2e2210' : '#f3e4d7';

  return (
    <View style={[styles.capacityCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={[styles.cardTitle, { color: themeColors.ink }]}>Daily Capacity Limit</Text>
          <Text style={[styles.cardMeta, { color: themeColors.muted }]}>{usedCapacity} of {safeCapacity} tiffins accepted today</Text>
        </View>
        <Text style={styles.capacityValue}>{percentage}%</Text>
      </View>
      {isFull ? <Text style={styles.capacityAlert}>Capacity reached. New orders are automatically stopped.</Text> : null}
      <View style={[styles.progressTrack, { backgroundColor: progressTrackBg }]}>
        <View style={[styles.progressFill, { width: percentage + '%' }]} />
      </View>
      <View style={styles.capacityActions}>
        {[100, 150, 200].map(value => (
          <Pressable
            key={value}
            onPress={() => onCapacityChange(value)}
            style={[
              styles.capacityChip,
              { backgroundColor: chipBg },
              Number(dailyCapacity) === value ? { backgroundColor: chipActiveBg, borderColor: colors.orange, borderWidth: 1 } : null,
            ]}
          >
            <Text style={[styles.capacityChipText, { color: themeColors.ink }]}>{value}/day</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.manualRow}>
        <TextInput
          keyboardType="number-pad"
          onChangeText={value => onCapacityChange(value.replace(/[^\d]/g, ''))}
          placeholder="Custom limit"
          placeholderTextColor={themeColors.muted}
          style={[styles.manualInput, { backgroundColor: inputBg, borderColor: themeColors.line, color: themeColors.ink }]}
          value={String(dailyCapacity || '')}
        />
        <Pressable
          disabled={isSaving}
          onPress={onSaveCapacity}
          style={[styles.saveButton, isSaving ? styles.saveButtonDisabled : null]}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  capacityActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  capacityCard: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
    elevation: 2,
  },
  capacityAlert: {
    color: '#c0392b',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 8,
  },
  capacityChip: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  capacityChipText: {
    fontSize: 10,
    fontWeight: '900',
  },
  capacityValue: {
    color: colors.orange,
    fontSize: 18,
    fontWeight: '900',
  },
  cardMeta: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  progressFill: {
    backgroundColor: colors.orange,
    height: 8,
  },
  progressTrack: {
    borderRadius: 8,
    height: 8,
    marginTop: 10,
    overflow: 'hidden',
  },
  manualInput: {
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    minHeight: 38,
    paddingHorizontal: 10,
  },
  manualRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.orange,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 14,
  },
  saveButtonDisabled: {
    backgroundColor: colors.orangeSoft,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
});
