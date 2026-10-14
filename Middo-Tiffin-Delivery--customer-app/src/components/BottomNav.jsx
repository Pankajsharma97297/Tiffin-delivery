import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
import { NavIcon } from '../theme/images';
const tabs = [
  {
    key: 'home',
    icon: NavIcon.Home,
    label: 'Home',
  },
  {
    key: 'explore',
    icon: NavIcon.Explore,
    label: 'Explore',
  },
  {
    key: 'plans',
    icon: NavIcon.Plans,
    label: 'Plans',
  },
  {
    key: 'wallet',
    icon: NavIcon.Wallet,
    label: 'Wallet',
  },
  {
    key: 'profile',
    icon: NavIcon.Profile,
    label: 'Profile',
  },
];
export function BottomNav({ activeTab, bottomInset, darkMode, onNavigate }) {
  const theme = useTheme();
  const isDarkMode = darkMode ?? theme.darkMode;
  return (
    <View
      style={[
        styles.bottomNav,
        isDarkMode ? styles.bottomNavDark : null,
        {
          paddingBottom: Math.max(8, bottomInset),
        },
      ]}
    >
      {tabs.map(tab => {
        const active = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onNavigate(tab.key)}
            style={styles.navItem}
          >
            <Image
              source={tab.icon}
              style={[
                styles.navIcon,
                isDarkMode ? styles.navIconDark : null,
                active ? styles.navActive : undefined,
              ]}
            />
            <Text
              style={[
                styles.navLabel,
                isDarkMode ? styles.navLabelDark : null,
                active ? styles.navActive : undefined,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: '#fff',
  },
  bottomNavDark: {
    borderTopColor: '#3a2c26',
    backgroundColor: '#211915',
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
  },
  navIcon: {
    width: 24,
    height: 24,
    tintColor: '#888',
  },
  navIconDark: {
    tintColor: '#c8b7aa',
  },
  navLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '800',
  },
  navLabelDark: {
    color: '#c8b7aa',
  },
  navActive: {
    color: colors.orange,
    tintColor: colors.orange,
  },
});
