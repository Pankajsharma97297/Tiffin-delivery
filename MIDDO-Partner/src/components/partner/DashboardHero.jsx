import React from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { Icons } from '../../theme/images';
import { colors } from '../../theme/colors';
import { getAvatarPreviewUri } from '../../utils/avatar';
import { useTheme } from '../../context/ThemeContext';

export function DashboardHero({ action, avatar, isOnline = true, name, onAction, onNotificationsPress, onSettingsPress, status }) {
  const { darkMode } = useTheme();
  const initial = (name || 'H').trim().charAt(0).toUpperCase();
  const avatarUri = getAvatarPreviewUri(avatar);

  const heroBg = darkMode ? '#1a1816' : colors.orange;
  const statusRowBg = darkMode ? '#221c18' : 'transparent';
  const statusRowBorder = darkMode ? '#3a2e28' : 'rgba(255,255,255,0.46)';
  const borderBottom = darkMode ? { borderBottomColor: '#2e2724', borderBottomWidth: 1 } : {};

  return (
    <View style={[styles.dashboardHero, { backgroundColor: heroBg }, borderBottom]}>
      <View style={styles.dashboardTopRow}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, darkMode ? { backgroundColor: '#2a1a10', borderColor: colors.orange } : null]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>
          <View>
            <Text style={styles.dashboardGreeting}>Good morning</Text>
            <Text style={styles.dashboardName}>{name}</Text>
          </View>
        </View>
        <View style={styles.actionIcons}>
          <Pressable onPress={onNotificationsPress} style={[styles.dashboardBell, darkMode ? { backgroundColor: '#2a1a10' } : null]}>
            <Image source={Icons.Bell} style={styles.dashboardBellIcon} />
            <View style={styles.bellDot} />
          </Pressable>
          <Pressable onPress={onSettingsPress} style={[styles.dashboardBell, darkMode ? { backgroundColor: '#2a1a10' } : null]}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>
      </View>
      <View style={[styles.dashboardStatusRow, { backgroundColor: statusRowBg, borderColor: statusRowBorder }]}>
        <View style={styles.dashboardStatus}>
          <View style={[styles.statusDot, !isOnline ? styles.statusDotOffline : null]} />
          <Text style={styles.dashboardStatusText}>{status}</Text>
        </View>
        <Pressable
          onPress={onAction}
          style={[styles.dashboardAction, darkMode ? { backgroundColor: isOnline ? '#2a1a10' : 'rgba(241,65,80,0.25)', borderColor: isOnline ? colors.orange : '#f14150' } : (!isOnline ? styles.dashboardActionOffline : null)]}
        >
          <Image source={Icons.Power} style={styles.powerIcon} />
          <Text style={styles.dashboardActionText}>{action}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.8)',
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
  dashboardAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.42)',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dashboardActionOffline: {
    backgroundColor: 'rgba(241,65,80,0.35)',
    borderColor: 'rgba(255,180,180,0.65)',
  },
  dashboardActionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  dashboardBell: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  dashboardBellIcon: {
    height: 19,
    tintColor: colors.white,
    width: 19,
  },
  dashboardGreeting: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    opacity: 0.9,
  },
  dashboardHero: {
    elevation: 4,
    marginHorizontal: -14,
    marginTop: 0,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
  },
  dashboardName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  dashboardStatus: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  dashboardStatusRow: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  dashboardStatusText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  dashboardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  statusDot: {
    backgroundColor: '#53e6a1',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  statusDotOffline: {
    backgroundColor: '#f14150',
  },
});
