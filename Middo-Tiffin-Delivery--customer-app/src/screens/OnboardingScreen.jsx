import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppButton } from '../components/AppButton';
import { ChipList } from '../components/ChipList';
import { FeatureList } from '../components/FeatureList';
import { OnboardingVisual } from '../components/OnboardingVisual';
import { ProgressDots } from '../components/ProgressDots';
import { colors } from '../theme/colors';
import { Icons } from '../theme/images';
export function OnboardingScreen({
  step,
  topInset,
  bottomInset,
  onBack,
  onNext,
  onSkip,
}) {
  const { height } = useWindowDimensions();
  const isFirst = step.screen === 1;
  const isLast = step.screen === 3;
  const isCompact = height < 720;
  return (
    <View
      style={[
        styles.screen,
        isCompact && styles.screenCompact,
        {
          paddingTop: Math.max(isCompact ? 24 : 48, topInset + 8),
          paddingBottom: Math.max(12, bottomInset + 8),
        },
      ]}
    >
      <View style={styles.topbar}>
        <ProgressDots activeStep={step.screen} />
        <Pressable onPress={onSkip} hitSlop={12} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingVisual compact={isCompact} step={step} />

        <View style={[styles.content, isCompact && styles.contentCompact]}>
          <Text
            style={[styles.stepLabel, isCompact && styles.stepLabelCompact]}
          >
            {step.eyebrow}
          </Text>
          <Text style={[styles.title, isCompact && styles.titleCompact]}>
            {step.title}
          </Text>
          <Text style={[styles.copy, isCompact && styles.copyCompact]}>
            {step.body}
          </Text>

          {step.chips ? <ChipList chips={step.chips} /> : null}
          {step.features ? (
            <FeatureList
              features={step.features}
              iconContainerStyle={isCompact && styles.featureIconCompact}
              iconStyle={{ tintColor: colors.orengeicon }}
              style={isCompact && styles.featuresCompact}
              textStyle={isCompact && styles.featureTextCompact}
            />
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.actions, isCompact && styles.actionsCompact]}>
        {!isFirst ? (
          <AppButton
            Lefticon={Icons.Back}
            LefticonStyle={{ tintColor: colors.ink }}
            title="Back"
            variant="secondary"
            onPress={onBack}
            style={styles.actionButton}
          />
        ) : null}
        <AppButton
          Righticon={isLast ? null : Icons.RightArrow}
          RighticonStyle={isLast ? undefined : { tintColor: colors.white }}
          title={isLast ? 'Get Started 🎉' : 'Next'}
          onPress={isLast ? onSkip : onNext}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 28,
    backgroundColor: colors.surface,
  },
  screenCompact: {
    paddingHorizontal: 22,
  },
  topbar: {
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 18,
  },
  skipButton: {
    position: 'absolute',
    right: 0,
    paddingLeft: 12,
    paddingVertical: 6,
  },
  skipText: {
    color: '#757575',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '700',
  },
  content: {
    marginTop: 14,
  },
  contentCompact: {
    marginTop: 10,
  },
  stepLabel: {
    marginBottom: 12,
    color: '#777',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
  },
  stepLabelCompact: {
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 15,
  },
  title: {
    maxWidth: 320,
    color: '#2f2f32',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  titleCompact: {
    fontSize: 22,
    lineHeight: 27,
  },
  copy: {
    maxWidth: 360,
    marginTop: 11,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
  },
  copyCompact: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 17,
  },
  featuresCompact: {
    gap: 7,
    marginTop: 8,
  },
  featureIconCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  featureTextCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 14,
  },
  actionsCompact: {
    paddingTop: 8,
  },
  actionButton: {
    flex: 1,
  },
});
