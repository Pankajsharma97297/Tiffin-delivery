import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useTheme } from '../context/ThemeContext';
import { AuthHeader } from '../components/AuthHeader';
import {
  confirmPhoneOtp,
  getFirebaseAuthErrorMessage,
} from '../services/firebaseAuth';
import { colors } from '../theme/colors';
export function VerifyOtpScreen({
  phone,
  dialCode,
  confirmation,
  topInset,
  bottomInset,
  onChangeNumber,
  onVerified,
}) {
  const { themeColors } = useTheme();
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const otpLength = 6;
  const otpRefs = useRef([]);
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
  const handleVerify = async () => {
    if (!canVerify) {
      return;
    }

    setVerifyError('');
    setVerifying(true);
    try {
      const session = await confirmPhoneOtp(confirmation, otp);
      onVerified(session);
    } catch (error) {
      setVerifyError(
        getFirebaseAuthErrorMessage(
          error,
          'Unable to verify OTP. Please try again.',
        ),
      );
    } finally {
      setVerifying(false);
    }
  };
  return (
    <View
      style={[
        styles.screen,
        {
          paddingBottom: Math.max(18, bottomInset),
        },
      ]}
    >
      <AuthHeader topInset={topInset} onBack={onChangeNumber} />

      <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
        <Pressable
          onPress={onChangeNumber}
          hitSlop={12}
          style={styles.changeNumberButton}
        >
          <ArrowLeftIcon color="#777" size={16} />
          <Text style={styles.changeNumberText}>Change Number</Text>
        </Pressable>

        <Text style={[styles.title, { color: themeColors.text }]}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to {dialCode}
          {'\n'}
          <Text style={[styles.phoneText, { color: themeColors.text }]}>{phone}</Text>
        </Text>

        <View style={styles.otpRow}>
          {Array.from({ length: otpLength }, (_, index) => (
            <TextInput
              key={index}
              ref={input => {
                otpRefs.current[index] = input;
              }}
              value={otp[index] ?? ''}
              onChangeText={value => handleOtpChange(value, index)}
              onKeyPress={event => handleOtpKeyPress(event, index)}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              maxLength={otpLength}
              style={styles.otpBox}
            />
          ))}
        </View>

        {canVerify ? (
          <Text style={styles.success}>✓ OTP entered successfully</Text>
        ) : null}

        <View style={styles.resendRow}>
          <Text style={styles.resendMuted}>Didn't receive it?</Text>
          <Text style={styles.resendMuted}>Resend in 21s</Text>
        </View>

        <AppButton
          title={verifying ? 'Verifying...' : 'Verify & Continue'}
          disabled={!canVerify}
          onPress={handleVerify}
          style={styles.verifyButton}
        />
        {verifyError ? <Text style={styles.errorText}>{verifyError}</Text> : null}

        <Text style={styles.secureText}>♡ Secured with 256-bit encryption</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
  },
  card: {
    marginTop: -22,
    padding: 24,
    borderRadius: 22,
    backgroundColor: '#fff',
  },
  changeNumberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  changeNumberText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  phoneText: {
    color: colors.ink,
    fontWeight: '900',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  otpBox: {
    height: 54,
    flex: 1,
    borderWidth: 2,
    borderColor: colors.orange,
    borderRadius: 14,
    color: '#252529',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  success: {
    marginTop: 12,
    color: '#0c9b52',
    fontSize: 13,
    fontWeight: '800',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  resendMuted: {
    color: '#777',
    fontSize: 12,
    fontWeight: '500',
  },
  verifyButton: {
    marginTop: 24,
    alignSelf: 'stretch',
  },
  locationMessage: {
    marginTop: 10,
    color: '#0c9b52',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 10,
    color: '#c0392b',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  secureText: {
    marginTop: 14,
    color: '#777',
    fontSize: 11,
    textAlign: 'center',
  },
});
