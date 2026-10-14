import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from './homeStyles';

export function QuickActions({ onCalendar, onReviews, onSkipMeal }) {
  return (
    <View style={styles.quickGrid}>
      <Pressable onPress={onSkipMeal} style={styles.quickCard}>
        <Text style={styles.quickIcon}>⏭️</Text>
        <Text style={styles.quickText}>Skip Meal</Text>
      </Pressable>
      <Pressable onPress={onCalendar} style={styles.quickCard}>
        <Text style={styles.quickIcon}>📅</Text>
        <Text style={styles.quickText}>Calendar</Text>
      </Pressable>
      <Pressable onPress={onReviews} style={styles.quickCard}>
        <Text style={styles.quickIcon}>💬</Text>
        <Text style={styles.quickText}>Reviews</Text>
      </Pressable>
    </View>
  );
}
