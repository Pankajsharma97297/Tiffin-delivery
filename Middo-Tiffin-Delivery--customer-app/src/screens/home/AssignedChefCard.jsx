import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './homeStyles';
import { Icons } from '../../theme/images';

export function AssignedChefCard({ chef, onPress }) {
  const { themeColors } = useTheme();
  if (!chef) {
    return null;
  }
  const address = chef.liveAddress || chef.address || chef.location || '';
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chefCard,
        { backgroundColor: themeColors.card, borderColor: themeColors.line },
      ]}
    >
      <View style={styles.chefPhoto}>
        <Text style={styles.chefPhotoText}>{chef.image}</Text>
      </View>
      <View style={styles.chefCardCopy}>
        {chef.label ? (
          <Text style={styles.assignedLabel}>{chef.label}</Text>
        ) : null}
        <Text style={[styles.assignedName, { color: themeColors.text }]}>
          {chef.name}
        </Text>
        {chef.rating ? <Text style={styles.rating}>{chef.rating}</Text> : null}
        {address ? (
          <Text style={styles.rating}>⌖ {address}</Text>
        ) : null}
      </View>
      <Pressable onPress={onPress} style={styles.changeButton}>
        <View style={styles.changeIconn}>
          <Image source={Icons.RefreshGreen} style={styles.changeIcon} />
        </View>
        <Text style={styles.changeButtonText}>Change</Text>
      </Pressable>
    </Pressable>
  );
}
