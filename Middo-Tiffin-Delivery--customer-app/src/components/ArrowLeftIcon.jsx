import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Icons } from '../theme/images';

export function ArrowLeftIcon({ color = '#fff', size = 18 }) {
  return (
    <Image
      source={Icons.Back}
      style={[
        styles.icon,
        {
          width: size,
          height: size,
          tintColor: color,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    resizeMode: 'contain',
  },
});
