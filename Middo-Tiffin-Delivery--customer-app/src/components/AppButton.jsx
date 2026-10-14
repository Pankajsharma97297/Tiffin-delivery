import React from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
export function AppButton({
  title,
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
      {Lefticon && (
        <Image
          source={Lefticon}
          style={[styles.buttonIcon, styles.leftIcon, LefticonStyle]}
        />
      )}
      <Text
        style={[
          styles.buttonText,
          isPrimary ? styles.primaryText : styles.secondaryText,
          disabled && isPrimary ? styles.disabledText : undefined,
          textStyle,
        ]}
      >
        {title}
      </Text>
      {Righticon && (
        <Image
          source={Righticon}
          style={[styles.buttonIcon, styles.rightIcon, RighticonStyle]}
        />
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  primaryButton: {
    borderColor: colors.orange,
    backgroundColor: colors.orange,
  },
  secondaryButton: {
    borderColor: colors.line,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  buttonIcon: {
    width: 15,
    height: 15,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#252529',
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    borderColor: colors.orangeSoft,
    backgroundColor: colors.orangeSoft,
  },
  disabledText: {
    color: '#fff',
  },
});
