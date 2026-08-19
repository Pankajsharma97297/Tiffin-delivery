import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { Icons } from '../theme/images';

export function ArrowLeftIcon() {
  return <Image source={Icons.Back} style={styles.icon} />;
}

const styles = StyleSheet.create({
  icon: {
    height: 20,
    tintColor: colors.ink,
    width: 20,
  },
});
