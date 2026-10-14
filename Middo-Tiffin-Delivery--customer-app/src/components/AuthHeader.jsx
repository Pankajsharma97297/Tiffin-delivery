import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon } from './ArrowLeftIcon';
import { LoginPill } from './LoginPill';
import { colors } from '../theme/colors';
export function AuthHeader({ topInset, onBack }) {
  return (
    <View
      style={[
        styles.brandHero,
        {
          paddingTop: Math.max(60, topInset + 22),
        },
      ]}
    >
      <Pressable
        onPress={onBack}
        hitSlop={14}
        accessibilityLabel="Go back"
        style={[
          styles.backIcon,
          {
            top: Math.max(58, topInset + 20),
          },
        ]}
      >
        <ArrowLeftIcon />
      </Pressable>
      <Text style={styles.loginLogo}>MIDDO</Text>
      <Text style={styles.signInSubtitle}>Sign in to continue</Text>

      <View style={styles.pillRow}>
        <LoginPill icon="🍛" label="Tiffin" />
        <LoginPill icon="📅" label="Subscription" />
        <LoginPill icon="🚚" label="Delivery" />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  brandHero: {
    minHeight: 310,
    marginHorizontal: -24,
    paddingHorizontal: 24,
    paddingBottom: 44,
    alignItems: 'center',
    backgroundColor: colors.orange,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  backIcon: {
    position: 'absolute',
    left: 32,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLogo: {
    marginTop: 8,
    color: '#fff',
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '900',
    letterSpacing: 3,
  },
  signInSubtitle: {
    marginTop: 10,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  pillRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
    paddingHorizontal: 26,
    paddingTop: 18,
    paddingBottom: 15,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
