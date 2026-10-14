import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { AppButton } from '../components/AppButton';
import { AuthHeader } from '../components/AuthHeader';
import {
  getFirebaseAuthErrorMessage,
  startPhoneOtp,
} from '../services/firebaseAuth';
import { signInWithApple } from '../services/appleAuth';
import { signInWithGoogle } from '../services/googleAuth';
import { colors } from '../theme/colors';
import { Icons } from '../theme/images';
const countries = [
  {
    flag: '🇮🇳',
    name: 'India',
    dialCode: '+91',
  },
  {
    flag: '🇺🇸',
    name: 'USA',
    dialCode: '+1',
  },
  {
    flag: '🇬🇧',
    name: 'UK',
    dialCode: '+44',
  },
  {
    flag: '🇦🇪',
    name: 'UAE',
    dialCode: '+971',
  },
];
export function LoginScreen({
  topInset,
  bottomInset,
  onBack,
  onSendOtp,
  onGoogleSignIn,
}) {
  const { themeColors } = useTheme();
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [countryListOpen, setCountryListOpen] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const digits = phone.length;
  const canSubmit = digits === 10;
  const canUseAppleSignIn = Platform.OS === 'ios';
  const formattedPhone =
    phone.length > 5 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : phone;
  const handleSendOtp = async () => {
    if (!canSubmit || otpLoading) {
      return;
    }

    setGoogleError('');
    setOtpLoading(true);
    try {
      const confirmation = await startPhoneOtp({
        dialCode: selectedCountry.dialCode,
        phone,
      });
      onSendOtp(phone, selectedCountry.dialCode, confirmation);
    } catch (error) {
      setGoogleError(
        getFirebaseAuthErrorMessage(
          error,
          'Unable to send OTP. Please try again.',
        ),
      );
    } finally {
      setOtpLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    if (googleLoading) {
      return;
    }

    setGoogleError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.type === 'success') {
        onGoogleSignIn(result.session);
      }
    } catch (error) {
      setGoogleError(
        error instanceof Error
          ? error.message
          : 'Google sign-in failed. Please try again.',
      );
    } finally {
      setGoogleLoading(false);
    }
  };
  const handleAppleSignIn = async () => {
    if (appleLoading) {
      return;
    }

    setGoogleError('');
    setAppleLoading(true);
    try {
      const result = await signInWithApple();
      if (result.type === 'success') {
        onGoogleSignIn(result.session);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Apple sign-in failed. Please try again.';
      setGoogleError(message);
      Alert.alert('Apple sign-in unavailable', message);
    } finally {
      setAppleLoading(false);
    }
  };
  const openTerms = () => {
  Linking.openURL('https://yourdomain.com/terms');
};

const openPrivacy = () => {
  Linking.openURL('https://yourdomain.com/privacy');
};

  return (
    <View
      style={[
        styles.loginScreen,
        {
          paddingBottom: Math.max(18, bottomInset),
        },
      ]}
    >
      <AuthHeader topInset={topInset} onBack={onBack} />

      <View style={[styles.loginCard, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
        <View style={styles.loginCardHead}>
          <Text style={[styles.loginTitle, { color: themeColors.text }]}>Enter Mobile Number</Text>
        </View>
        <Text style={styles.hint}>We'll send you a 6-digit OTP to verify</Text>

        <View style={styles.phoneField}>
          <View style={styles.phoneInput}>
            <Pressable
              onPress={() => setCountryListOpen(open => !open)}
              style={styles.country}
            >
              <Text style={styles.countryText}>
                {selectedCountry.flag} {selectedCountry.dialCode}
              </Text>
              <Image source={Icons.DownArrow} style={styles.countryArrow} />
            </Pressable>
            <TextInput
              value={formattedPhone}
              onChangeText={value =>
                setPhone(value.replace(/\D/g, '').slice(0, 10))
              }
              keyboardType="number-pad"
              maxLength={11}
              placeholder="Mobile number"
              placeholderTextColor="#8a8a8a"
              style={styles.numberInput}
            />
          </View>
          {countryListOpen ? (
            <View style={[styles.countryList, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
              {countries.map(country => (
                <Pressable
                  key={country.dialCode}
                  onPress={() => {
                    setSelectedCountry(country);
                    setCountryListOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.countryOption,
                    pressed ? styles.pressed : undefined,
                  ]}
                >
                  <Text style={styles.countryName}>
                    {country.flag} {country.name}
                  </Text>
                  <Text style={styles.countryCode}>{country.dialCode}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
        <Text style={styles.digits}>{digits}/10 digits</Text>

        <AppButton
          title={otpLoading ? 'Sending OTP...' : 'Send OTP'}
          disabled={!canSubmit || otpLoading}
          onPress={handleSendOtp}
          style={styles.otpButton}
          textStyle={styles.otpText}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socials}>
          <Pressable
            disabled={googleLoading}
            onPress={handleGoogleSignIn}
            style={({ pressed }) => [
              styles.socialButton,
              pressed ? styles.pressed : undefined,
              googleLoading ? styles.disabledSocialButton : undefined,
            ]}
          >
            {googleLoading ? (
              <ActivityIndicator color="#4285f4" size="small" />
            ) : (
              <Text style={styles.googleIcon}>G</Text>
            )}
            <Text style={styles.socialText}>
              {googleLoading ? 'Signing in' : 'Google'}
            </Text>
          </Pressable>
          {canUseAppleSignIn ? (
            <Pressable
              disabled={appleLoading}
              onPress={handleAppleSignIn}
              style={({ pressed }) => [
                styles.socialButton,
                pressed ? styles.pressed : undefined,
                appleLoading ? styles.disabledSocialButton : undefined,
              ]}
            >
              <Text style={styles.socialIcon}>🍎</Text>
              <Text style={styles.socialText}>
                {appleLoading ? 'Signing in' : 'Apple'}
              </Text>
            </Pressable>
          ) : null}
        </View>
        {googleError ? (
          <Text style={styles.errorText}>{googleError}</Text>
        ) : null}
      </View>

    <Text style={styles.legal}>
  By continuing, you agree to MIDDO&apos;s{' '}
  <Text style={styles.legalLink} onPress={openTerms}>
    Terms of Service
  </Text>{' '}
  and{' '}
  <Text style={styles.legalLink} onPress={openPrivacy}>
    Privacy Policy
  </Text>
  .
</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  loginScreen: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
  },
  loginCard: {
    marginTop: -22,
    padding: 24,
    borderRadius: 22,
    backgroundColor: '#fff',
  },
  loginCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  loginTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  hint: {
    marginTop: 14,
    marginBottom: 22,
    color: '#6a6a6a',
    fontSize: 14,
    lineHeight: 20,
  },
  phoneField: {
    zIndex: 10,
  },
  phoneInput: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 15,
    backgroundColor: '#fffaf5',
  },
  country: {
    width: 94,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.line,
    flexDirection: 'row',
  },
  countryText: {
    color: '#252529',
    fontSize: 15,
  },
  countryArrow: {
    width: 12,
    height: 12,
    marginLeft: 4,
  },
  countryList: {
    position: 'absolute',
    left: 0,
    top: 64,
    width: 224,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#1f1f1f',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 10,
  },
  countryOption: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  countryName: {
    color: '#252529',
    fontSize: 15,
    fontWeight: '700',
  },
  countryCode: {
    color: '#696969',
    fontSize: 15,
    fontWeight: '700',
  },
  numberInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingHorizontal: 13,
    color: '#666',
    fontSize: 16,
  },
  digits: {
    marginTop: 8,
    marginBottom: 22,
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
  },
  otpButton: {
    alignSelf: 'stretch',
    marginTop: 2,
  },
  otpText: {
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
    marginBottom: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    color: '#696969',
    fontSize: 12,
  },
  socials: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    height: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  disabledSocialButton: {
    opacity: 0.72,
  },
  googleIcon: {
    color: '#4285f4',
    fontSize: 16,
    fontWeight: '900',
  },
  socialIcon: {
    fontSize: 16,
  },
  socialText: {
    color: '#252529',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 12,
    color: '#d92d20',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  legal: {
    maxWidth: 330,
    alignSelf: 'center',
    marginTop: 24,
    color: '#666',
    fontSize: 12,
    lineHeight: 21,
    textAlign: 'center',
  },
  legalLink: {
    color: colors.orange,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
});
