import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './homeStyles';

export function SearchResults({ query, results }) {
  const { themeColors } = useTheme();
  return (
    <View style={styles.searchResultsBox}>
      <Text style={styles.searchResultsTitle}>
        Search results for <Text style={styles.orangeText}>{query.trim()}</Text>
      </Text>
      {results.length > 0 ? (
        results.map(result => (
          <Pressable
            key={result.key}
            onPress={result.onPress}
            style={({ pressed }) => [
              styles.searchResultRow,
              pressed ? styles.pressed : undefined,
            ]}
          >
            <View style={styles.searchResultIcon}>
              <Text style={styles.searchResultEmoji}>{result.icon}</Text>
            </View>
            <View style={styles.searchResultCopy}>
              <Text style={styles.searchResultType}>{result.type}</Text>
              <Text style={styles.searchResultName}>{result.title}</Text>
              <Text style={styles.searchResultMeta}>{result.meta}</Text>
            </View>
            {result.onPress ? (
              <Text style={styles.searchResultArrow}>›</Text>
            ) : null}
          </Pressable>
        ))
      ) : (
        <View style={styles.emptySearchCard}>
          <Text style={[styles.emptySearchTitle, { color: themeColors.text }]}>
            No meals or HomeChefs found
          </Text>
          <Text style={styles.emptySearchText}>
            Try dal, paneer, chole, Jain, Gujarati, or HomeChef.
          </Text>
        </View>
      )}
    </View>
  );
}
