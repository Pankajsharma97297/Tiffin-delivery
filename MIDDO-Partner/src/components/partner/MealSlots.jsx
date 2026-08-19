import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { SectionTitle } from './SectionTitle';
import { colors } from '../../theme/colors';
import { Icons } from '../../theme/images';
import { useTheme } from '../../context/ThemeContext';

const slotToneLight = {
  Breakfast: [colors.orangeSoft, '#ff8a00'],
  Lunch: ['#ffece6', colors.orange],
  Snacks: ['#eee5ff', '#8257ff'],
  Dinner: ['#e6f7ff', '#00a8f3'],
};

const slotToneDark = {
  Breakfast: ['#2a1805', '#ff9f1a'],
  Lunch: ['#2a150d', colors.orange],
  Snacks: ['#1e1435', '#a78bfa'],
  Dinner: ['#0d2030', '#38bdf8'],
};

const defaultSlots = [
  { count: 0, label: 'Breakfast', time: '7-9 AM' },
  { count: 0, label: 'Lunch', time: '12-2 PM' },
  { count: 0, label: 'Snacks', time: '4-6 PM' },
  { count: 0, label: 'Dinner', time: '7-9 PM' },
];

export function MealSlots({ slots = defaultSlots }) {
  const { darkMode, themeColors } = useTheme();
  const slotTone = darkMode ? slotToneDark : slotToneLight;
  const visibleSlots = slots.length ? slots : defaultSlots;

  return (
    <>
      <SectionTitle title="Today's Meal Slots" />
      <View style={styles.slotGrid}>
        {visibleSlots.map(slot => {
          const [iconBg, iconColor] = slotTone[slot.label] || slotTone.Lunch;
          return (
            <View
              key={slot.label}
              style={[
                styles.slotCard,
                {
                  backgroundColor: darkMode ? '#1e1c1b' : colors.white,
                  borderColor: darkMode ? '#2e2724' : '#eadfd7',
                },
              ]}
            >
              <View style={[styles.slotIconBox, { backgroundColor: iconBg }]}>
                <Image source={Icons.TiffinSubscription} style={[styles.slotIcon, { tintColor: iconColor }]} />
              </View>
              <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.slotTitle, { color: themeColors.ink }]}>{slot.label}</Text>
              <Text style={[styles.slotTime, { color: themeColors.muted }]}>{slot.time}</Text>
              <Text style={[styles.slotCount, { color: iconColor }]}>{String(slot.count || 0)}</Text>
            </View>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  slotCard: {
    borderRadius: 13,
    borderWidth: 1,
    flexBasis: 0,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 106,
    padding: 9,
  },
  slotCount: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 7,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
  },
  slotIcon: {
    height: 18,
    width: 18,
  },
  slotIconBox: {
    alignItems: 'center',
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    marginBottom: 9,
    width: 44,
  },
  slotTime: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
  },
  slotTitle: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
});
