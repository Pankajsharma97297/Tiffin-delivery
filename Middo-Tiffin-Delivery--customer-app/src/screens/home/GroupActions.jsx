import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { styles } from './homeStyles';
import { Icons } from '../../theme/images';

export function GroupActions({ onCreate, onJoin }) {
  return (
    <>
      <View style={styles.groupRow}>
        <Pressable onPress={onCreate} style={styles.groupPrimary}>
          <View style={styles.groupPrimarycontent}>
            <Image source={Icons.GroupJoin} style={styles.PrimarygroupIcon} />
            <Text style={styles.groupPrimaryText}> Create Group</Text>
          </View>
        </Pressable>
        <Pressable onPress={onJoin} style={styles.groupSecondary}>
          <View style={styles.groupSecondarycontent}>
            <Image
              source={Icons.GroupShare}
              style={styles.SecondarygroupIcon}
            />
            <Text style={styles.groupSecondaryText}> Join Group</Text>
          </View>
        </Pressable>
      </View>
      <Text style={styles.groupHint}>
        💡 Min. 5 members within 500m · Group discount unlocked together
      </Text>
    </>
  );
}
