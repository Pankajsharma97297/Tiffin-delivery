import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './homeStyles';

const formatDay = day => String(day || '').trim().slice(0, 3).toUpperCase();

export function WeeklySchedule({ schedule, onCalendar }) {
  const { themeColors } = useTheme();
  if (!schedule?.length) {
    return null;
  }
  const normalizedSchedule = schedule
    .map((item, index) => ({
      active: Boolean(item.active),
      day: formatDay(item.day) || `D${index + 1}`,
      icon: item.icon || '🍱',
      key: `${item.day || index}-${item.title || item.meal || index}`,
      meal: item.title || item.meal || 'Meal pending',
      meta: item.meta || item.items || item.mealType || item.status || '',
    }))
    .filter(item => item.meal);

  return (
    <>
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>
          Weekly Schedule
        </Text>
        <Pressable onPress={onCalendar} style={styles.linkPressable}>
          <Text style={styles.sectionLink}>Full View</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        persistentScrollbar={false}
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalClip}
        contentContainerStyle={styles.scheduleRow}
      >
        {normalizedSchedule.map(item => (
          <View
            key={item.key}
            style={[
              styles.dayCard,
              item.active ? styles.dayCardActive : undefined,
            ]}
          >
            <Text
              style={[
                styles.dayName,
                item.active ? styles.orangeText : undefined,
              ]}
            >
              {item.day}
            </Text>
            <View style={styles.dayIconWrap}>
              <Text style={styles.dayIcon}>{item.icon}</Text>
            </View>
            <Text
              numberOfLines={2}
              style={[
                styles.dayMeal,
                item.active ? styles.orangeText : undefined,
              ]}
            >
              {item.meal}
            </Text>
            {item.meta ? (
              <Text numberOfLines={2} style={styles.dayMeta}>
                {item.meta}
              </Text>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </>
  );
}
