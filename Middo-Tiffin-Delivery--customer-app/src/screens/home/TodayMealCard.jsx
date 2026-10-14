import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './homeStyles';

export function TodayMealCard({ meal, onHomeChef, onTrack }) {
  const { themeColors } = useTheme();
  return (
    <View
      style={[
        styles.mealCard,
        styles.todayCard,
        {
          backgroundColor: themeColors.cardHighlight,
          borderColor: themeColors.line,
        },
      ]}
    >
      <View style={styles.mealTopRow}>
        <View style={styles.mealIcon}>
          <Text style={styles.mealEmoji}>{meal.icon}</Text>
        </View>
        <View style={styles.mealCopy}>
          {meal.status ? (
            <Text style={styles.statusPill}>{meal.status}</Text>
          ) : null}
          <Text style={[styles.mealTitle, { color: themeColors.text }]}>
            {meal.title}
          </Text>
          {meal.meta ? (
            <Text style={[styles.mealMeta, { color: themeColors.muted }]}>
              {meal.meta}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={onTrack} style={styles.trackButton}>
          <Text style={styles.trackText}>Track</Text>
        </Pressable>
      </View>
      {meal.chef ? (
        <Pressable onPress={onHomeChef} style={styles.chefRow}>
          <Text style={styles.chefAvatar}>👨‍🍳</Text>
          <Text style={[styles.chefText, { color: themeColors.muted }]}>
            HomeChef:{' '}
            <Text style={[styles.chefBold, { color: themeColors.text }]}>
              {meal.chef}
            </Text>
          </Text>
          <Text style={styles.chefArrow}>›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
