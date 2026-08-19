import React from 'react';
import { Image, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { ArrowLeftIcon } from '../../components/ArrowLeftIcon';
import { roleOptions } from '../../data/partnerData';
import { InputBlock, PrimaryButton } from '../../components/partner';
import { colors } from '../../theme/colors';
import { Icons } from '../../theme/images';
import { getAvatarPreviewUri } from '../../utils/avatar';

export function SetupStage({
  bottomInset = 0,
  form,
  isUploadingImage = false,
  onAvatarPress,
  onBack,
  onChange,
  onEnter,
  selectedRole,
  setSelectedRole,
  topInset,
}) {
  const displayName = form.name || form.email || form.phone || 'P';
  const initial = displayName.trim().charAt(0).toUpperCase();
  const avatarUri = getAvatarPreviewUri(form.avatar);

  return (
    <ScrollView
      alwaysBounceVertical
      bounces
      contentContainerStyle={[
        styles.stageContent,
        {
          paddingBottom: Math.max(54, bottomInset + 40),
          paddingTop: Math.max(37, topInset + 8),
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
      style={styles.stageScroll}
    >
      <Pressable onPress={onBack} style={styles.backButton}>
        <ArrowLeftIcon />
      </Pressable>
      <Text style={styles.title}>Set Up Your Profile</Text>
      <Text style={styles.subtitle}>Tell us about yourself to get started</Text>
      <Pressable disabled={isUploadingImage} onPress={onAvatarPress} style={styles.avatarWrap}>
        <View style={styles.avatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
        </View>
        <View style={styles.cameraBadge}>
          <Image source={Icons.Camera} style={styles.cameraIcon} />
        </View>
      </Pressable>
      {Object.entries({ name: 'Full Name', email: 'Email', city: 'City', pincode: 'Pincode' }).map(([key, label]) => (
        <InputBlock key={key} label={label} onChangeText={value => onChange(current => ({ ...current, [key]: value }))} value={form[key]} />
      ))}
      <Text style={styles.sectionLabel}>Select Your Role</Text>
      <View style={styles.roleGrid}>
        {roleOptions.map(role => {
          const selected = selectedRole === role.key;
          return (
            <Pressable key={role.key} onPress={() => setSelectedRole(role.key)} style={[styles.roleCard, selected ? styles.roleCardActive : null]}>
              <View style={styles.roleIconBox}>
                <Image source={role.icon} style={styles.roleIcon} />
              </View>
              <Text style={styles.roleTitle}>{role.label}</Text>
              <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
              {selected ? <Image source={Icons.CheckCircle} style={styles.roleCheck} /> : null}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.helperText}>You can only have one active role. Contact support to change.</Text>
      <PrimaryButton
        Righticon={Icons.RightArrow}
        RighticonStyle={{ tintColor: colors.white }}
        onPress={onEnter}
        style={styles.enterButton}
        title="Enter the App"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.orangeSoft,
    borderColor: colors.white,
    borderRadius: 35,
    borderWidth: 3,
    height: 70,
    justifyContent: 'center',
    width: 70,
  },
  avatarImage: {
    borderRadius: 32,
    height: 64,
    width: 64,
  },
  avatarText: {
    color: colors.orange,
    fontSize: 24,
    fontWeight: '900',
  },
  avatarWrap: {
    alignSelf: 'center',
    borderRadius: 41,
    elevation: 4,
    marginBottom: 17,
    marginTop: 29,
    shadowColor: '#000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  backButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  cameraBadge: {
    alignItems: 'center',
    backgroundColor: colors.orange,
    borderColor: colors.white,
    borderRadius: 14,
    borderWidth: 2,
    bottom: -1,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: -3,
    width: 28,
  },
  cameraIcon: {
    height: 14,
    tintColor: colors.white,
    width: 14,
  },
  enterButton: {
    borderRadius: 12,
    height: 48,
    marginTop: 23,
  },
  helperText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 9,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  roleCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#e7ded8',
    borderRadius: 13,
    borderWidth: 2,
    flex: 1,
    minHeight: 165,
    paddingBottom: 15,
    paddingHorizontal: 14,
    paddingTop: 17,
  },
  roleCardActive: {
    backgroundColor: '#fff0e8',
    borderColor: colors.orange,
  },
  roleCheck: {
    height: 17,
    marginTop: 9,
    tintColor: colors.orange,
    width: 17,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  roleIcon: {
    height: 24,
    tintColor: colors.orange,
    width: 24,
  },
  roleIconBox: {
    alignItems: 'center',
    backgroundColor: colors.orangeSoft,
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    marginBottom: 13,
    width: 40,
  },
  roleSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 9,
    textAlign: 'center',
  },
  roleTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  sectionLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 24,
  },
  stageContent: {
    backgroundColor: colors.white,
    flexGrow: 1,
    paddingHorizontal: 26,
  },
  stageScroll: {
    backgroundColor: colors.white,
    flex: 1,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 7,
    textAlign: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 18,
    textAlign: 'center',
  },
});
