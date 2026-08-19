import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icons } from '../../theme/images';
import { colors, darkColors } from '../../theme/colors';
import { getAvatarPreviewUri } from '../../utils/avatar';
import { useTheme } from '../../context/ThemeContext';
import { getPushPrefs, savePushPrefs } from '../../services/partnerNotifications';

const notificationRows = [
  ['push', 'Push Notifications', Icons.Bell],
  ['orders', 'Order Alerts', Icons.Phone],
  ['payments', 'Payment Alerts', Icons.Star],
];

const supportRows = [
  ['Help & Support', Icons.Warning],
  ['Contact Us', Icons.Search],
  ['Privacy Policy', Icons.Shield],
  ['Terms of Service', Icons.Document],
  ['Language', Icons.Language],
];

function Toggle({ enabled, onPress, tint, styles }) {
  return (
    <Pressable onPress={onPress}>
      <View style={[styles.toggle, enabled ? [styles.toggleOn, { backgroundColor: tint }] : styles.toggleOff]}>
        <View style={[styles.toggleKnob, enabled ? styles.toggleKnobOn : styles.toggleKnobOff]} />
      </View>
    </Pressable>
  );
}

function SettingIcon({ icon, dark, styles }) {
  return (
    <View style={[styles.iconBox, dark && styles.iconBoxDark]}>
      <Image source={icon} style={styles.icon} />
    </View>
  );
}

export function SettingsPanel({ onSignOut, profile = {}, role }) {
  const { darkMode, themeColors, toggleDarkMode } = useTheme();
  const C = darkMode ? darkColors : colors;

  const [notifPrefs, setNotifPrefs] = useState({
    push: true,
    orders: true,
    payments: true,
  });

  const displayName = profile.name || profile.email || profile.phone || role || 'Partner';
  const initial = displayName.trim().charAt(0).toUpperCase();
  const avatarUri = getAvatarPreviewUri(profile.avatar);

  // Load saved push prefs on mount
  useEffect(() => {
    getPushPrefs().then(prefs => {
      setNotifPrefs(prefs);
    }).catch(() => undefined);
  }, []);

  const toggleNotif = useCallback(async key => {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(next);
    await savePushPrefs(next);
  }, [notifPrefs]);

  const openSetting = title => {
    Alert.alert(title, 'Live content for this section is not available yet.');
  };

  const s = buildStyles(C);

  return (
    <View style={s.screen}>
      <View style={s.profileCard}>
        <View style={s.avatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={s.avatarImage} />
          ) : (
            <Text style={s.avatarText}>{initial}</Text>
          )}
        </View>
        <View style={s.profileCopy}>
          <Text style={s.profileName}>{displayName}</Text>
          <Text style={s.profileMeta}>{profile.phone || profile.email || 'Logged in partner'}</Text>
          <Text style={s.profileMeta}>{role || 'Partner'}</Text>
        </View>
        <View style={s.profileAction}>
          <Image source={Icons.Customer} style={s.profileActionIcon} />
        </View>
      </View>

      <Text style={s.sectionLabel}>NOTIFICATIONS</Text>
      <View style={s.card}>
        {notificationRows.map(([key, title, icon], index) => (
          <View key={title} style={[s.row, index === notificationRows.length - 1 ? s.lastRow : null]}>
            <SettingIcon icon={icon} dark={darkMode} styles={s} />
            <Text style={s.rowTitle}>{title}</Text>
            <Toggle
              enabled={notifPrefs[key]}
              onPress={() => toggleNotif(key)}
              tint={C.orange}
              styles={s}
            />
          </View>
        ))}
      </View>

      <Text style={s.sectionLabel}>APPEARANCE</Text>
      <View style={s.card}>
        <View style={[s.row, s.lastRow]}>
          <SettingIcon icon={Icons.DarkMode} dark={darkMode} styles={s} />
          <Text style={s.rowTitle}>Dark Mode</Text>
          <Toggle
            enabled={darkMode}
            onPress={toggleDarkMode}
            tint={C.orange}
            styles={s}
          />
        </View>
      </View>

      <Text style={s.sectionLabel}>SUPPORT & LEGAL</Text>
      <View style={s.card}>
        {supportRows.map(([title, icon], index) => (
          <Pressable key={title} onPress={() => openSetting(title)} style={[s.row, index === supportRows.length - 1 ? s.lastRow : null]}>
            <SettingIcon icon={icon} dark={darkMode} styles={s} />
            <Text style={s.rowTitle}>{title}</Text>
            <Image source={Icons.RightArrow} style={s.chevronIcon} />
          </Pressable>
        ))}
      </View>

      <View style={s.versionCard}>
        <Text style={s.versionText}>MIDDO Partner App</Text>
        <Text style={s.versionText}>Version 1.0.0</Text>
      </View>

      <Pressable onPress={onSignOut} style={s.signOutButton}>
        <Image source={Icons.Logout} style={s.signOutIcon} />
        <Text style={s.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

function buildStyles(C) {
  return StyleSheet.create({
    avatar: {
      alignItems: 'center',
      backgroundColor: C.orangeSoft,
      borderRadius: 27,
      height: 54,
      justifyContent: 'center',
      width: 54,
    },
    avatarImage: {
      borderRadius: 27,
      height: 54,
      width: 54,
    },
    avatarText: {
      color: C.orange,
      fontSize: 20,
      fontWeight: '900',
    },
    card: {
      backgroundColor: C.white,
      borderColor: C.line,
      borderRadius: 13,
      borderWidth: 1,
      overflow: 'hidden',
    },
    chevronIcon: {
      height: 12,
      tintColor: C.muted,
      transform: [{ rotate: '180deg' }],
      width: 12,
    },
    icon: {
      height: 17,
      tintColor: C.orange,
      width: 17,
    },
    iconBox: {
      alignItems: 'center',
      backgroundColor: C.orangeSoft,
      borderRadius: 9,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    iconBoxDark: {
      backgroundColor: '#2e1f16',
    },
    lastRow: {
      borderBottomWidth: 0,
    },
    profileAction: {
      alignItems: 'center',
      borderColor: C.line,
      borderRadius: 12,
      borderWidth: 1,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    profileActionIcon: {
      height: 18,
      tintColor: C.orange,
      width: 18,
    },
    profileCard: {
      alignItems: 'center',
      backgroundColor: C.white,
      borderColor: C.line,
      borderRadius: 13,
      borderWidth: 1,
      flexDirection: 'row',
      marginTop: 18,
      padding: 14,
    },
    profileCopy: {
      flex: 1,
      marginLeft: 12,
    },
    profileMeta: {
      color: C.muted,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 16,
    },
    profileName: {
      color: C.ink,
      fontSize: 15,
      fontWeight: '900',
      marginBottom: 2,
    },
    row: {
      alignItems: 'center',
      borderBottomColor: C.line,
      borderBottomWidth: 1,
      flexDirection: 'row',
      minHeight: 68,
      paddingHorizontal: 16,
    },
    rowTitle: {
      color: C.ink,
      flex: 1,
      fontSize: 14,
      fontWeight: '800',
      marginLeft: 12,
    },
    screen: {
      paddingTop: 0,
    },
    sectionLabel: {
      color: C.muted,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.4,
      marginBottom: 9,
      marginTop: 20,
    },
    signOutButton: {
      alignItems: 'center',
      borderColor: '#ffb9a4',
      borderRadius: 10,
      borderWidth: 1,
      flexDirection: 'row',
      height: 50,
      justifyContent: 'center',
      marginBottom: 24,
      marginTop: 20,
    },
    signOutIcon: {
      height: 17,
      marginRight: 8,
      tintColor: C.orange,
      width: 17,
    },
    signOutText: {
      color: C.orange,
      fontSize: 15,
      fontWeight: '900',
    },
    toggle: {
      borderRadius: 999,
      height: 27,
      justifyContent: 'center',
      paddingHorizontal: 3,
      width: 48,
    },
    toggleKnob: {
      backgroundColor: colors.white,
      borderRadius: 11,
      height: 21,
      width: 21,
    },
    toggleKnobOff: {
      alignSelf: 'flex-start',
    },
    toggleKnobOn: {
      alignSelf: 'flex-end',
    },
    toggleOff: {
      backgroundColor: '#d9d1cc',
    },
    toggleOn: {
      backgroundColor: C.orange,
    },
    versionCard: {
      alignItems: 'center',
      marginTop: 18,
    },
    versionText: {
      color: C.muted,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 18,
    },
  });
}
