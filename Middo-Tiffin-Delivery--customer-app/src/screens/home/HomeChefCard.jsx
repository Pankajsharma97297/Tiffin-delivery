import React from 'react';
import { Image, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Icons } from '../../theme/images';
import { styles } from './homeStyles';

export function HomeChefCard({
  image,
  name,
  owner,
  badge,
  cuisine,
  tags,
  rating,
  distance,
  time,
  price,
}) {
  const { themeColors } = useTheme();
  return (
    <View
      style={[
        styles.homeChefCard,
        { backgroundColor: themeColors.card, borderColor: themeColors.line },
      ]}
    >
      <View style={styles.homeChefImage}>
        <Text style={styles.homeChefImageText}>{image}</Text>
      </View>
      <View style={styles.homeChefCopy}>
        <View style={styles.homeChefTitleRow}>
          <Text style={[styles.homeChefName, { color: themeColors.text }]}>
            {name}
          </Text>
          <Text style={styles.chefBadge}>{badge}</Text>
        </View>
        {owner ? (
          <Text style={styles.homeChefOwner}>Owner: {owner}</Text>
        ) : null}
        <Text style={[styles.cuisine, { color: themeColors.muted }]}>
          {cuisine}
        </Text>
        <View style={styles.tagRow}>
          {(tags || []).map(tag => (
            <Text key={tag} style={styles.tag}>
              🌿 {tag}
            </Text>
          ))}
        </View>
        <View style={styles.chefMeta}>
          {rating ? (
            <View style={styles.chefMetaItem}>
              <Image
                source={Icons.Star}
                style={[styles.chefMetaIcon, { tintColor: themeColors.muted }]}
              />
              <Text style={[styles.chefMetaText, { color: themeColors.muted }]}>
                {rating}
              </Text>
            </View>
          ) : null}
          {distance ? (
            <View style={styles.chefMetaItem}>
              <Image
                source={Icons.Location}
                style={[styles.chefMetaIcon, { tintColor: themeColors.muted }]}
              />
              <Text style={[styles.chefMetaText, { color: themeColors.muted }]}>
                {distance}
              </Text>
            </View>
          ) : null}
          {time ? (
            <View style={styles.chefMetaItem}>
              <Image
                source={Icons.Clock}
                style={[styles.chefMetaIcon, { tintColor: themeColors.muted }]}
              />
              <Text style={[styles.chefMetaText, { color: themeColors.muted }]}>
                {time}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.orderRow}>
          <Text style={styles.price}>{price}</Text>
        </View>
      </View>
    </View>
  );
}
