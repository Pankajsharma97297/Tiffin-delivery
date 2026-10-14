import React from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { Icons } from '../../theme/images';
import { getAvatarImageUri } from '../../utils/avatar';
import { styles } from './homeStyles';

export function HomeHero({
  customer,
  hasUnreadNotifications,
  onNotifications,
  onProfilePress,
  onSearchChange,
  searchQuery,
}) {
  const location =
    customer?.liveAddress || customer?.address || customer?.location || '';
  const avatarUri = getAvatarImageUri(customer?.avatar);
  return (
    <View style={styles.hero}>
      <View style={styles.profileRow}>
        <Pressable onPress={onProfilePress} style={styles.profilePressArea}>
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>{customer?.avatar || ''}</Text>
            )}
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.greeting}>Good afternoon 👋</Text>
            <Text style={styles.userName}>{customer?.name || ''}</Text>
          </View>
        </Pressable>
        <Pressable onPress={onNotifications} style={styles.bell}>
          <Image source={Icons.Bell} style={styles.bellIcon} />
          {hasUnreadNotifications ? <View style={styles.bellDot} /> : null}
        </Pressable>
      </View>
      {location ? (
        <View style={styles.locationRow}>

<View style={styles.locationIcon}>
  <Image
    source={Icons.Location}
    style={styles.locationPin}
  />

          <Text style={styles.location}> {location}</Text>

</View>


          <Text style={styles.locationArrow}>›</Text>
        </View>
      ) : null}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Search HomeChefs, tiffins..."
          placeholderTextColor="#777"
          returnKeyType="search"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery ? (
          <Pressable
            accessibilityLabel="Clear search"
            hitSlop={10}
            onPress={() => onSearchChange('')}
            style={styles.clearSearchButton}
          >
            <Text style={styles.clearSearchText}>×</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
