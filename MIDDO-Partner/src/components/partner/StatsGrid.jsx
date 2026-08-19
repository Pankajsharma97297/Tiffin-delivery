import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// Dark mode tone palettes (muted versions for dark backgrounds)
const LIGHT_TONES = [
  { card: '#fff6e8', icon: '#fff0d8', color: '#ff6418' },
  { card: '#f3edff', icon: '#eadfff', color: '#8b5cf6' },
  { card: '#eefdff', icon: '#dcf3ff', color: '#0ea5e9' },
  { card: '#ebfff5', icon: '#dff8ea', color: '#20b96b' },
  { card: '#fffbe8', icon: '#fff2d6', color: '#f59e0b' },
  { card: '#ebfff1', icon: '#dff8ea', color: '#22c55e' },
];

const DARK_TONES = [
  { card: '#2a1a0a', icon: '#3a2010', color: '#ff6418' },
  { card: '#1e1530', icon: '#2a1d40', color: '#a78bfa' },
  { card: '#0a1f2a', icon: '#102a38', color: '#38bdf8' },
  { card: '#0a2018', icon: '#102818', color: '#34d399' },
  { card: '#201800', icon: '#2a2000', color: '#fbbf24' },
  { card: '#0a2018', icon: '#102818', color: '#4ade80' },
];

export function StatsGrid({ columns = 2, compact, items, useTone }) {
  const { darkMode, themeColors } = useTheme();
  const tones = darkMode ? DARK_TONES : LIGHT_TONES;
  const cardWidth = columns === 3 ? styles.statCardThreeColumn : styles.statCardTwoColumn;

  return (
    <View style={[styles.statsGrid, compact ? styles.statsGridCompact : null]}>
      {items.map(([label, value, icon], index) => {
        const tone = tones[index % 6];
        return (
          <View
            key={label}
            style={[
              styles.statCard,
              cardWidth,
              { borderColor: darkMode ? '#2e2724' : '#f0dfd1' },
              useTone ? { backgroundColor: tone.card } : { backgroundColor: themeColors.card },
            ]}
          >
            {icon ? (
              <View style={[styles.statIconBox, useTone ? { backgroundColor: tone.icon } : null]}>
                <Image source={icon} style={[styles.statIcon, useTone ? { tintColor: tone.color } : { tintColor: themeColors.orange }]} />
              </View>
            ) : null}
            <Text style={[styles.statValue, { color: themeColors.ink }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: themeColors.muted }]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    borderRadius: 13,
    borderWidth: 1,
    elevation: 2,
    flexGrow: 0,
    minHeight: 118,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statCardThreeColumn: {
    flexBasis: '31.7%',
  },
  statCardTwoColumn: {
    flexBasis: '48%',
  },
  statIcon: {
    height: 19,
    width: 19,
  },
  statIconBox: {
    alignItems: 'center',
    borderRadius: 10,
    height: 35,
    justifyContent: 'center',
    marginBottom: 8,
    width: 35,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statsGridCompact: {
    marginTop: 0,
  },
});
