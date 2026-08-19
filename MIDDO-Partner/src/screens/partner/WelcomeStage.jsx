import React from 'react';
import { Image, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Icons } from '../../theme/images';
import { PrimaryButton, RolePreview } from '../../components/partner';
import { colors } from '../../theme/colors';

export function WelcomeStage({ onGetStarted, onSignIn, topInset }) {
  return (
    <ScrollView contentContainerStyle={styles.welcomeContent}>
      <View style={[styles.welcomeHero, { paddingTop: Math.max(54, topInset + 18) }]}>
        <View style={styles.logoTile}><Text style={styles.logoTileText}>M</Text></View>
        <Text style={styles.welcomeBrand}>MIDDO</Text>
        <Text style={styles.welcomeBrandSub}>Partner App</Text>
        <RolePreview onOrange />
      </View>
      <View style={styles.welcomeSheet}>
        <Text style={styles.sheetHeroTitle}>Your Kitchen.{'\n'}Your Deliveries.</Text>
        <Text style={styles.sheetHeroCopy}>Manage orders, track earnings, and grow your business — all in one place.</Text>
        <View style={styles.featureList}>
          {[[ 'Accept & manage meal orders', Icons.ChefCap ], [ 'Track deliveries in real time', Icons.Order ], [ 'Earn more, every single day', Icons.Growth ]].map(([item, icon]) => (
            <View key={item} style={styles.featureRow}>
              <View style={styles.featureIconBox}><Image source={icon} style={styles.featureIcon} /></View>
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>
        <PrimaryButton title="Get Started" Righticon={Icons.RightArrow} RighticonStyle={styles.whiteIcon} onPress={onGetStarted} />
        <Pressable onPress={onSignIn} style={styles.secondaryLink}>
          <Text style={styles.secondaryMuted}>Already a partner?</Text>
          <Text style={styles.secondaryLinkText}>Sign In</Text>
        </Pressable>
        <Text style={styles.policyText}>By continuing you agree to our Terms & Privacy Policy</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  featureIcon: {
    height: 20,
    tintColor: colors.orange,
    width: 20,
  },
  featureIconBox: {
    alignItems: 'center',
    backgroundColor: colors.orangeSoft,
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  featureList: {
    gap: 18,
    marginTop: 24,
    marginBottom: 18,
  },
  featureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  featureText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  logoTile: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    height: 80,
    justifyContent: 'center',
    marginTop: 8,
    width: 80,
  },
  logoTileText: {
    color: colors.orange,
    fontSize: 32,
    fontWeight: '900',
  },
  policyText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center',
  },
  secondaryLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    padding: 18,
  },
  secondaryLinkText: {
    color: colors.orange,
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryMuted: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  sheetHeroCopy: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 23,
    marginTop: 12,
  },
  sheetHeroTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  welcomeBrand: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '900',
    marginTop: 18,
  },
  welcomeBrandSub: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 3,
    opacity: 0.94,
  },
  welcomeContent: {
    backgroundColor: colors.white,
    flexGrow: 1,
  },
  welcomeHero: {
    alignItems: 'center',
    backgroundColor: colors.orange,
    minHeight: 390,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  welcomeSheet: {
    // backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -2,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 34,
  },
  whiteIcon: {
    tintColor: colors.white,
  },
});
