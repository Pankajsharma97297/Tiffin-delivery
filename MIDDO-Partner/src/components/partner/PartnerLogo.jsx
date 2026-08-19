import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export function PartnerLogo({ compact }) {
  return (
    <View style={[styles.logoCircle, compact ? styles.logoCircleCompact : null]}>
      <Text style={[styles.logoText, compact ? styles.logoTextCompact : null]}>M</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoCircle: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.orange,
    borderRadius: 42,
    elevation: 6,
    height: 84,
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 22,
    shadowColor: colors.orange,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    width: 84,
  },
  logoCircleCompact: {
    borderRadius: 34,
    height: 68,
    marginBottom: 24,
    width: 68,
  },
  logoText: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '900',
  },
  logoTextCompact: {
    fontSize: 30,
    fontWeight: '900',
  },
});
