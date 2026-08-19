import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { PartnerLogo, PrimaryButton } from '../../components/partner';
import { colors } from '../../theme/colors';
import { Icons } from '../../theme/images';

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

export function LoginStage({
  authError,
  googleLoading,
  onDialCodeChange,
  onGoogleSignIn,
  onPhoneChange,
  onRoleChange,
  onSendOtp,
  otpLoading,
  phone,
  selectedRole,
  topInset,
}) {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [countryListOpen, setCountryListOpen] = useState(false);
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(0, 10);
  const digits = cleanPhone.length;
  const formattedPhone =
    cleanPhone.length > 5
      ? `${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`
      : cleanPhone;
  const canSubmit = digits === 10 && !otpLoading;

  return (
    <ScrollView contentContainerStyle={[styles.stageContent, { paddingTop: Math.max(47, topInset + 24) }]}>
      <PartnerLogo compact />
      <Text style={styles.title}>MIDDO Partner</Text>
      <Text style={styles.subtitle}>Sign in to your partner account</Text>
      <View style={styles.formCard}>
        <Text style={styles.inputLabel}>Select Role</Text>
        <View style={styles.roleSelector}>
          {[
            { key: 'homechef', label: 'HomeChef', icon: Icons.ChefCap },
            { key: 'rider', label: 'Delivery', icon: Icons.DeliveryTruck },
          ].map(role => {
            const selected = selectedRole === role.key;
            return (
              <Pressable
                key={role.key}
                onPress={() => onRoleChange?.(role.key)}
                style={[styles.roleButton, selected ? styles.roleButtonActive : null]}
              >
                <Image source={role.icon} style={[styles.roleIcon, selected ? styles.roleIconActive : null]} />
                <Text style={[styles.roleButtonText, selected ? styles.roleButtonTextActive : null]}>
                  {role.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.inputLabel}>Mobile Number</Text>
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
              keyboardType="number-pad"
              maxLength={11}
              onChangeText={value => onPhoneChange(value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Mobile number"
              placeholderTextColor="#8a8a8a"
              style={styles.numberInput}
              value={formattedPhone}
            />
          </View>
          {countryListOpen ? (
            <View style={styles.countryList}>
              {countries.map(country => (
                <Pressable
                  key={country.dialCode}
                  onPress={() => {
                    setSelectedCountry(country);
                    setCountryListOpen(false);
                    onDialCodeChange?.(country.dialCode);
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
        <Text style={styles.demoText}>We'll send you a 6-digit OTP to verify</Text>
        <PrimaryButton
          disabled={!canSubmit}
          onPress={onSendOtp}
          style={styles.continueButton}
          title={otpLoading ? 'Sending OTP...' : 'Send OTP'}
        />
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>
        <Pressable
          disabled={googleLoading}
          onPress={onGoogleSignIn}
          style={({ pressed }) => [
            styles.googleButton,
            pressed ? styles.pressed : null,
            googleLoading ? styles.disabledButton : null,
          ]}
        >
          {googleLoading ? (
            <ActivityIndicator color="#4285f4" size="small" />
          ) : (
            <Text style={styles.googleIcon}>G</Text>
          )}
          <Text style={styles.googleText}>{googleLoading ? 'Signing in' : 'Google'}</Text>
        </Pressable>
        {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
      </View>
      <Text style={styles.supportText}>
        New partner? <Text style={styles.supportLink}>Contact support</Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  continueButton: {
    borderRadius: 12,
    height: 48,
    marginTop: 18,
  },
  country: {
    alignItems: 'center',
    borderRightColor: colors.line,
    borderRightWidth: 1,
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'center',
    width: 94,
  },
  countryArrow: {
    height: 12,
    marginLeft: 4,
    width: 12,
  },
  countryCode: {
    color: '#696969',
    fontSize: 15,
    fontWeight: '700',
  },
  countryList: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 10,
    left: 0,
    paddingVertical: 8,
    position: 'absolute',
    shadowColor: '#1f1f1f',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    top: 64,
    width: 224,
    zIndex: 20,
  },
  countryName: {
    color: '#252529',
    fontSize: 15,
    fontWeight: '700',
  },
  countryOption: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  countryText: {
    color: '#252529',
    fontSize: 15,
  },
  demoText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 9,
  },
  disabledButton: {
    opacity: 0.65,
  },
  digits: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
    marginTop: 8,
    textAlign: 'right',
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  dividerLine: {
    backgroundColor: colors.line,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  errorText: {
    color: '#c0392b',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.white,
    borderColor: '#eadfd7',
    borderRadius: 13,
    borderWidth: 1,
    elevation: 3,
    marginTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 14,
    shadowColor: '#000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    width: '100%',
  },
  googleButton: {
    alignItems: 'center',
    borderColor: '#d9d9d9',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    height: 46,
    justifyContent: 'center',
    marginTop: 18,
  },
  googleIcon: {
    color: '#4285f4',
    fontSize: 18,
    fontWeight: '900',
  },
  googleText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  inputLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },
  numberInput: {
    color: '#666',
    flex: 1,
    fontSize: 16,
    height: '100%',
    minWidth: 0,
    paddingHorizontal: 13,
  },
  phoneField: {
    zIndex: 10,
  },
  phoneInput: {
    alignItems: 'center',
    backgroundColor: '#fffaf5',
    borderColor: colors.line,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    height: 56,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.75,
  },
  roleButton: {
    alignItems: 'center',
    backgroundColor: '#fffaf5',
    borderColor: colors.line,
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#fff0e8',
    borderColor: colors.orange,
  },
  roleButtonText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  roleButtonTextActive: {
    color: colors.orange,
  },
  roleIcon: {
    height: 18,
    tintColor: colors.muted,
    width: 18,
  },
  roleIconActive: {
    tintColor: colors.orange,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  stageContent: {
    backgroundColor: colors.white,
    flexGrow: 1,
    paddingBottom: 34,
    paddingHorizontal: 26,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 7,
    textAlign: 'center',
  },
  supportLink: {
    color: colors.orange,
    fontWeight: '900',
  },
  supportText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 25,
    textAlign: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    marginTop: -6,
    textAlign: 'center',
  },
});
