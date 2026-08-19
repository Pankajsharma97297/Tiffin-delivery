import React from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { Icons } from '../../theme/images';
import { colors } from '../../theme/colors';
import { getAvatarPreviewUri } from '../../utils/avatar';
import { useTheme } from '../../context/ThemeContext';

export function DeliveryDashboardHero({ avatar, isOnline, name, onNotificationsPress, onSettingsPress, onToggleOnline }) {
  const { darkMode } = useTheme();
  const initial = (name || 'D').trim().charAt(0).toUpperCase();
  const avatarUri = getAvatarPreviewUri(avatar);

  const heroBg = darkMode ? '#121e28' : '#279fda';
  const statusRowBg = darkMode ? '#1a2b38' : 'rgba(255,255,255,0.18)';
  const statusRowBorder = darkMode ? '#223c50' : 'rgba(255,255,255,0.36)';
  const borderBottom = darkMode ? { borderBottomColor: '#223c50', borderBottomWidth: 1 } : {};

  return (
    <View style={[styles.hero, { backgroundColor: heroBg }, borderBottom]}>
      <View style={styles.topRow}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, darkMode ? { backgroundColor: '#1a2b38', borderColor: '#279fda' } : null]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>
          <View>
            <Text style={styles.greeting}>Delivery Partner</Text>
            <Text style={styles.name}>{name}</Text>
          </View>
        </View>
        <View style={styles.iconRow}>
          <Pressable onPress={onNotificationsPress} style={[styles.iconButton, darkMode ? { backgroundColor: '#1a2b38' } : null]}>
            <Image source={Icons.Bell} style={styles.icon} />
            <View style={styles.bellDot} />
          </Pressable>
          <Pressable onPress={onSettingsPress} style={[styles.iconButton, darkMode ? { backgroundColor: '#1a2b38' } : null]}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.statusCard, { backgroundColor: statusRowBg, borderColor: statusRowBorder }]}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
          <View>
            <Text style={styles.statusTitle}>{isOnline ? "You're Online" : "You're Offline"}</Text>
          </View>
        </View>
        <Pressable onPress={onToggleOnline} style={styles.statusButton}>
          <Image source={Icons.Power} style={styles.powerIcon} />
          <Text style={styles.statusButtonText}>{isOnline ? 'Go Offline' : 'Go Online'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.86)',
    borderRadius: 21,
    borderWidth: 2,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarInitial: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  avatarImage: {
    borderRadius: 19,
    height: 38,
    width: 38,
  },
  bellDot: {
    backgroundColor: '#ff78a9',
    borderRadius: 4,
    height: 8,
    position: 'absolute',
    right: 7,
    top: 6,
    width: 8,
  },
  greeting: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    opacity: 0.92,
  },
  hero: {
    marginBottom: 21,
    marginHorizontal: -14,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 42,
  },
  icon: {
    height: 19,
    tintColor: colors.white,
    width: 19,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 10,
  },
  name: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  powerIcon: {
    height: 13,
    tintColor: colors.white,
    width: 13,
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  settingsIcon: {
    color: colors.white,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 24,
  },
  statusButton: {
    alignItems: 'center',
    backgroundColor: '#f14150',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 5,
    height: 38,
    paddingHorizontal: 15,
  },
  statusButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  statusCard: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  statusDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  statusDotOffline: {
    backgroundColor: '#ffd2c5',
  },
  statusDotOnline: {
    backgroundColor: '#53e6a1',
  },
  statusLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  statusTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
