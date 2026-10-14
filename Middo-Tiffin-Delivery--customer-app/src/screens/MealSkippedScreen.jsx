import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
export function MealSkippedScreen({ onViewCalendar, onHome }) {
  const { themeColors } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🗓️×</Text>
        </View>
        <Text style={[styles.title, { color: themeColors.surfaceText }]}>
          Meal Skipped!
        </Text>
        <Text style={styles.body}>
          Your meal for Fri, 18 Jan has been skipped. No delivery will be made.
        </Text>
        <View style={styles.successNote}>
          <Text style={styles.successText}>
            ⊙ Your subscription is still active — we'll see you next time!
          </Text>
        </View>
        <Pressable onPress={onViewCalendar} style={styles.primaryButton}>
          <Text style={styles.primaryText}>View Calendar</Text>
        </Pressable>
        <Pressable onPress={onHome} style={styles.homeButton}>
          <Text style={styles.homeText}>Back to Home</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  iconCircle: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 48,
    backgroundColor: '#ffe6bf',
  },
  icon: {
    fontSize: 40,
  },
  title: {
    marginTop: 28,
    color: colors.ink,
    fontSize: 23,
    fontWeight: '900',
  },
  body: {
    marginTop: 16,
    color: '#666',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  successNote: {
    width: '100%',
    marginTop: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: '#8ff0b3',
    borderRadius: 14,
    backgroundColor: '#ebfff2',
  },
  successText: {
    color: '#07833c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  primaryButton: {
    width: '100%',
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    borderRadius: 14,
    backgroundColor: colors.orange,
  },
  primaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
  homeButton: {
    marginTop: 20,
    padding: 10,
  },
  homeText: {
    color: '#777',
    fontSize: 15,
    fontWeight: '900',
  },
});
