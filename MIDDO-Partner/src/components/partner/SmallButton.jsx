import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export function SmallButton({ disabled, full, label, onPress }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.smallButton,
        full ? styles.smallButtonFull : null,
        disabled ? styles.smallButtonDisabled : null,
      ]}
    >
      <Text style={[styles.smallButtonText, disabled ? styles.smallButtonTextDisabled : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  smallButton: {
    alignItems: 'center',
    backgroundColor: colors.orange,
    borderRadius: 8,
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  smallButtonFull: {
    minHeight: 36,
    width: '100%',
  },
  smallButtonDisabled: {
    backgroundColor: '#f1ddd2',
  },
  smallButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  smallButtonTextDisabled: {
    color: colors.muted,
  },
});
