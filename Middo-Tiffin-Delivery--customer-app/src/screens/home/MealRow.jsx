import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './homeStyles';

export function MealRow({
  icon,
  title,
  meta,
  action,
  actionVariant,
  iconBg = '#fff2dc',
  onAction,
}) {
  const { themeColors } = useTheme();
  return (
    <View
      style={[
        styles.mealCard,
        { backgroundColor: themeColors.card, borderColor: themeColors.line },
      ]}
    >
      <View style={styles.mealTopRow}>
        <View
          style={[
            styles.mealIcon,
            {
              backgroundColor: iconBg,
            },
          ]}
        >
          <Text style={styles.mealEmoji}>{icon}</Text>
        </View>
        <View style={styles.mealCopy}>
          <Text style={[styles.mealTitle, { color: themeColors.text }]}>
            {title}
          </Text>
          {meta ? (
            <Text style={[styles.mealMeta, { color: themeColors.muted }]}>
              {meta}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onAction}
          style={[
            styles.trackButton,
            actionVariant === 'yellow' ? styles.yellowButton : undefined,
          ]}
        >
          <Text
            style={[
              styles.trackText,
              actionVariant === 'yellow' ? styles.yellowText : undefined,
            ]}
          >
            {action}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
