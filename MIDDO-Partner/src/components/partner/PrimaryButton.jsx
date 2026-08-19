import React from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';

export function PrimaryButton({
  title,
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  Lefticon,
  Righticon,
  LefticonStyle,
  RighticonStyle,
}) {
  const isPrimary = variant === 'primary';
  const buttonTitle = title ?? label;

  return (
    <Pressable
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        style,
        disabled ? styles.disabled : undefined,
        pressed && !disabled ? styles.pressed : undefined,
      ]}
    >
      {Lefticon ? (
        <Image
          source={Lefticon}
          style={[styles.buttonIcon, styles.leftIcon, LefticonStyle]}
        />
      ) : null}
      <Text
        style={[
          styles.buttonText,
          isPrimary ? styles.primaryText : styles.secondaryText,
          disabled && isPrimary ? styles.disabledText : undefined,
          textStyle,
        ]}
      >
        {buttonTitle}
      </Text>
      {Righticon ? (
        <Image
          source={Righticon}
          style={[styles.buttonIcon, styles.rightIcon, RighticonStyle]}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    marginTop: 18,
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: colors.line,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  buttonIcon: {
    height: 15,
    width: 15,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.ink,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    backgroundColor: colors.orangeSoft,
    borderColor: colors.orangeSoft,
  },
  disabledText: {
    color: colors.white,
  },
});
