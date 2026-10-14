import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
export function LoginPill({ icon, label }) {
  return (
    <View style={styles.pillItem}>
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  pillItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  pillIcon: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 24,
  },
  pillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});
