import React from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { ArrowLeftIcon } from '../../components/ArrowLeftIcon';
import { onboardingScreens } from '../../data/partnerData';
import { DeliveryMockup, KitchenMockup, PrimaryButton, RolePreview } from '../../components/partner';
import { Icons } from '../../theme/images';
import { colors } from '../../theme/colors';

export function OnboardingStage({ onBack, onNext, onSkip, step, topInset }) {
  const data = onboardingScreens[step];
  return (
    <ScrollView contentContainerStyle={styles.onboardingContent}>
      <View style={[styles.onboardingTopBar, { paddingTop: Math.max(42, topInset + 12) }]}>
        <Pressable onPress={onBack} style={styles.onboardingBackButton}><ArrowLeftIcon /></Pressable>
        <Pressable onPress={onSkip} style={styles.skipButton}><Text style={styles.skipText}>Skip</Text></Pressable>
      </View>
      <View style={styles.onboardingMockupArea}>
        {step === 0 ? <RolePreview compact /> : null}
        {step === 1 ? <KitchenMockup /> : null}
        {step === 2 ? <DeliveryMockup /> : null}
      </View>
      <View style={styles.dotsRow}>{[0, 1, 2].map(dot => <View key={dot} style={[styles.dot, dot === step ? styles.dotActive : null]} />)}</View>
      <View style={styles.onboardingSheet}>
        <Text style={styles.onboardingTitle}>{data.title}</Text>
        <Text style={styles.onboardingCopy}>{data.copy}</Text>
        <Text style={styles.onboardingStepText}>Step {step + 1} of 3</Text>
        <PrimaryButton
          Righticon={Icons.RightArrow}
          RighticonStyle={styles.whiteIcon}
          onPress={onNext}
          title={step === 2 ? "Let's Get Started" : 'Next'}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: '#ddd4cd',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: colors.orange,
    width: 24,
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    marginTop: 32,
  },
  onboardingBackButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  onboardingContent: {
    backgroundColor: colors.white,
    flexGrow: 1,
  },
  onboardingCopy: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 10,
  },
  onboardingMockupArea: {
    alignItems: 'center',
    backgroundColor: '#f1ebe4',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 548,
    marginHorizontal: 26,
    padding: 24,
  },
  onboardingSheet: {
    paddingHorizontal: 26,
    paddingTop: 22,
    paddingBottom: 24,
  },
  onboardingStepText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },
  onboardingTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  onboardingTopBar: {
    alignItems: 'center',
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingBottom: 16,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: colors.muted,
    fontWeight: '800',
  },
  whiteIcon: {
    tintColor: colors.white,
  },
});
