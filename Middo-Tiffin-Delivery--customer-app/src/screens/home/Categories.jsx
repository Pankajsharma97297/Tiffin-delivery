import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './homeStyles';

export function Categories({ categories, selectedCategory, onSelect }) {
  const { themeColors } = useTheme();
  if (!categories?.length) {
    return null;
  }
  return (
    <>
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>
          Categories
        </Text>
        <Text style={styles.vegBadge}>100% Vegetarian</Text>
      </View>
      <ScrollView
        horizontal
        persistentScrollbar={false}
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalClip}
        contentContainerStyle={styles.categoryRow}
      >
        {categories.map(category => (
          <Pressable
            key={category.label}
            onPress={() => onSelect(category.label)}
            style={[
              styles.categoryCard,
              selectedCategory === category.label
                ? styles.categoryCardActive
                : undefined,
            ]}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === category.label
                  ? styles.orangeText
                  : undefined,
              ]}
            >
              {category.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}
