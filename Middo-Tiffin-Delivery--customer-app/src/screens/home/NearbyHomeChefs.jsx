import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { doesMatchSearch, normalizeSearchText } from './homeHelpers';
import { HomeChefCard } from './HomeChefCard';
import { styles } from './homeStyles';

export function NearbyHomeChefs({ chefs, searchQuery, selectedCategory }) {
  const { themeColors } = useTheme();
  if (!chefs?.length) {
    return null;
  }
  const normalizedQuery = normalizeSearchText(searchQuery);
  const filteredChefs = chefs
    .filter(chef => {
      if (selectedCategory === 'All') {
        return true;
      }
      const selected = normalizeSearchText(selectedCategory);
      return doesMatchSearch(selected, [
        chef.name,
        chef.badge,
        chef.cuisine,
        chef.price,
        chef.tags,
      ]);
    })
    .filter(chef => {
      if (!normalizedQuery) {
        return true;
      }
      return doesMatchSearch(normalizedQuery, [
        chef.name,
        chef.badge,
        chef.cuisine,
        chef.distance,
        chef.price,
        chef.time,
        ...(chef.tags || []),
      ]);
    });
  return (
    <>
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>
          Nearby HomeChefs
        </Text>
        <Text style={styles.sectionLink}>See All</Text>
      </View>
      <Text style={[styles.showingText, { color: themeColors.muted }]}>
        Showing HomeChefs for{' '}
        <Text style={styles.orangeText}>{selectedCategory}</Text>
        {normalizedQuery ? (
          <Text>
            {' '}
            matching <Text style={styles.orangeText}>{searchQuery.trim()}</Text>
          </Text>
        ) : null}
      </Text>
      <View style={styles.chefList}>
        {filteredChefs.length > 0 ? (
          filteredChefs.map(chef => <HomeChefCard key={chef.name} {...chef} />)
        ) : (
          <View style={styles.emptySearchCard}>
            <Text style={[styles.emptySearchTitle, { color: themeColors.text }]}>
              No HomeChefs found
            </Text>
            <Text style={styles.emptySearchText}>
              Try another chef, cuisine, tag, or tiffin name.
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
