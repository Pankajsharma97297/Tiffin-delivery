import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
export function FeatureList({
  features,
  style,
  iconContainerStyle,
  iconStyle,
  textStyle,
}) {
  return (
    <View style={[styles.features, style]}>
      {features.map(feature => (
        <View key={feature.label} style={styles.feature}>
          <View style={[styles.featureIcon, iconContainerStyle]}>
            <Image
              source={feature.icon}
              style={[styles.featureImage, iconStyle]}
            />
          </View>
          <Text style={[styles.featureText, textStyle]}>{feature.label}</Text>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  features: {
    gap: 13,
    marginTop: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff0e8',
  },
  featureImage: {
    width: 15,
    height: 15,
  },
  featureText: {
    flex: 1,
    color: '#252529',
    fontSize: 14,
    fontWeight: '600',
  },
});
