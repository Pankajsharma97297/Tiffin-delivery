import React from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { Icons } from '../../theme/images';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export function AppTopBar({ Righticon, compact, delivery, onRightPress, title, onBack, topInset }) {
  const { darkMode } = useTheme();

  // Delivery tab bar keeps its blue; everything else darkens in dark mode
  const barBg = delivery ? '#279fda' : darkMode ? '#1a1816' : colors.orange;
  const borderBottom = darkMode && !delivery ? { borderBottomColor: '#2e2724', borderBottomWidth: 1 } : {};

  return (
    <View style={[
      styles.appTopBar,
      delivery ? styles.appTopBarDelivery : null,
      compact ? styles.appTopBarCompact : null,
      { backgroundColor: barBg, paddingTop: Math.max(36, topInset + 8) },
      borderBottom,
    ]}>
      <Pressable onPress={onBack} style={styles.appBackButton}>
        <Image source={Icons.Back} style={styles.appBackIcon} />
      </Pressable>
      <Text style={styles.appTopTitle}>{title}</Text>
      {Righticon ? (
        <Pressable onPress={onRightPress} style={styles.appRightButton}>
          <Image source={Righticon} style={styles.appRightIcon} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  appBackButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  appBackIcon: {
    height: 20,
    tintColor: colors.white,
    width: 20,
  },
  appRightButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    marginLeft: 'auto',
    width: 34,
  },
  appRightIcon: {
    height: 17,
    tintColor: colors.white,
    width: 17,
  },
  appTopBar: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 21,
    paddingHorizontal: 20,
  },
  appTopBarCompact: {
    paddingBottom: 10,
  },
  appTopBarDelivery: {
    paddingBottom: 15,
  },
  appTopTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
});
