import React from 'react';
import { Image, Text, TextInput, View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';

export function InputBlock({ Lefticon, LefticonStyle, label, onChangeText, value }) {
  const { themeColors } = useTheme();
  return (
    <View style={styles.inputBlock}>
      <Text style={[styles.inputLabel, { color: themeColors.text }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
        {Lefticon ? <Image source={Lefticon} style={[styles.inputIcon, LefticonStyle]} /> : null}
        <TextInput
          onChangeText={onChangeText}
          placeholderTextColor={themeColors.placeholder}
          style={[styles.input, { color: themeColors.text }]}
          value={value}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    minHeight: 50,
    padding: 0,
  },
  inputIcon: {
    height: 17,
    marginRight: 10,
    tintColor: colors.muted,
    width: 17,
  },
  inputWrap: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  inputBlock: {
    marginTop: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },
});
