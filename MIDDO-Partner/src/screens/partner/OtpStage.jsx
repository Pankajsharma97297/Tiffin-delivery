import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { ArrowLeftIcon } from '../../components/ArrowLeftIcon';
import { PrimaryButton } from '../../components/partner';
import { colors } from '../../theme/colors';

export function OtpStage({ authError, dialCode, onBack, onVerify, phone, topInset, verifying }) {
  const [otp, setOtp] = useState('');
  const otpRefs = useRef([]);
  const otpLength = 6;
  const canVerify = otp.length === otpLength && !verifying;

  const focusOtpBox = index => {
    otpRefs.current[index]?.focus();
  };

  const handleOtpChange = (value, index) => {
    const digits = value.replace(/\D/g, '');

    if (!digits) {
      const next = otp.split('');
      next[index] = '';
      setOtp(next.join(''));
      return;
    }

    const next = otp.padEnd(otpLength, ' ').split('');
    digits
      .slice(0, otpLength - index)
      .split('')
      .forEach((digit, offset) => {
        next[index + offset] = digit;
      });

    const nextOtp = next.join('').replace(/\s/g, '').slice(0, otpLength);
    setOtp(nextOtp);
    focusOtpBox(Math.min(index + digits.length, otpLength - 1));
  };

  const handleOtpKeyPress = (event, index) => {
    if (event.nativeEvent.key !== 'Backspace') {
      return;
    }

    if (otp[index]) {
      const next = otp.split('');
      next[index] = '';
      setOtp(next.join(''));
      if (index > 0) {
        focusOtpBox(index - 1);
      }
      return;
    }

    if (index > 0) {
      const next = otp.split('');
      next[index - 1] = '';
      setOtp(next.join(''));
      focusOtpBox(index - 1);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.stageContent, { paddingTop: Math.max(42, topInset + 12) }]}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <ArrowLeftIcon />
      </Pressable>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.phoneText}>
        {dialCode} {phone} · <Text style={styles.changeText}>Change</Text>
      </Text>
      <View style={styles.otpRow}>
        {Array.from({ length: otpLength }, (_, index) => (
          <TextInput
            key={index}
            ref={input => {
              otpRefs.current[index] = input;
            }}
            keyboardType="number-pad"
            maxLength={otpLength}
            onChangeText={value => handleOtpChange(value, index)}
            onKeyPress={event => handleOtpKeyPress(event, index)}
            style={styles.otpBox}
            textContentType="oneTimeCode"
            value={otp[index] ?? ''}
          />
        ))}
      </View>
      <Text style={styles.helperText}>Enter the 6-digit verification code</Text>
      <Text style={styles.resendText}>Resend in 0:28</Text>
      {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
      <PrimaryButton
        disabled={!canVerify}
        onPress={() => onVerify(otp)}
        style={styles.verifyButton}
        title={verifying ? 'Verifying...' : 'Verify OTP'}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  changeText: {
    color: colors.orange,
    fontWeight: '900',
  },
  errorText: {
    color: '#c0392b',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center',
  },
  helperText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  otpBox: {
    backgroundColor: colors.white,
    borderColor: colors.orange,
    borderRadius: 10,
    borderWidth: 2,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    height: 52,
    textAlign: 'center',
    width: 43,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 32,
  },
  phoneText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  resendText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 7,
    textAlign: 'center',
  },
  stageContent: {
    backgroundColor: colors.white,
    flexGrow: 1,
    paddingBottom: 34,
    paddingHorizontal: 26,
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 41,
    textAlign: 'center',
  },
  verifyButton: {
    borderRadius: 12,
    height: 48,
    marginTop: 25,
  },
});
