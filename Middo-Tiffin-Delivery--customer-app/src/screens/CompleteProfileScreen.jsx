import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  NativeModules,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppButton } from '../components/AppButton';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import {
  updateCustomerProfile,
  uploadProfileImage,
} from '../services/profileApi';
import { fetchHomeData } from '../services/homeApi';
import { getCurrentCoordinates, reverseGeocode } from '../services/locationApi';
import { colors } from '../theme/colors';
import { logDebugData } from '../utils/debugLog';
import { getAvatarPreviewUri } from '../utils/avatar';

const profileImagePicker = NativeModules.ProfileImagePicker;

const getEditableName = (value, phoneValue) => {
  const nameValue = String(value || '').trim();
  const cleanNameDigits = nameValue.replace(/\D/g, '');
  const cleanPhoneDigits = String(phoneValue || '').replace(/\D/g, '');

  if (!nameValue || nameValue === 'MIDDO Customer') {
    return '';
  }

  if (cleanPhoneDigits && cleanNameDigits === cleanPhoneDigits) {
    return '';
  }

  return nameValue;
};

export function CompleteProfileScreen({
  bottomInset,
  initialProfile,
  onBack,
  onSaved,
  phone,
  topInset,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [locationCoords, setLocationCoords] = useState({});
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const nextPhone = initialProfile?.phone || phone || '';
    setName(getEditableName(initialProfile?.name, nextPhone));
    setEmail(initialProfile?.email || '');
    setMobileNumber(nextPhone);
    setAddress(
      initialProfile?.liveAddress ||
        initialProfile?.address ||
        initialProfile?.location ||
        '',
    );
    setLocationCoords({
      latitude: initialProfile?.latitude,
      longitude: initialProfile?.longitude,
    });
    setAvatar(initialProfile?.avatar || '');
  }, [initialProfile, phone]);
  useEffect(() => {
    let mounted = true;

    fetchHomeData()
      .then(data => {
        if (!mounted || !data.customer) {
          return;
        }
        logDebugData('Complete Profile prefill data from backend', data);
        const nextPhone = data.customer.phone || phone || '';
        setName(getEditableName(data.customer.name, nextPhone));
        setEmail(data.customer.email || '');
        setMobileNumber(nextPhone);
        setAddress(
          data.customer.liveAddress ||
            data.customer.address ||
            data.customer.location ||
            '',
        );
        setLocationCoords({
          latitude: data.customer.latitude,
          longitude: data.customer.longitude,
        });
        setAvatar(data.customer.avatar || '');
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [phone]);

  const cleanMobileNumber = mobileNumber.replace(/[^\d+ ]/g, '').trim();
  const canSave =
    name.trim() &&
    email.trim() &&
    cleanMobileNumber &&
    address.trim() &&
    !saving &&
    !uploadingImage;

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      const customer = await updateCustomerProfile({
        address: address.trim(),
        email: email.trim(),
        avatar,
        latitude: locationCoords.latitude,
        liveAddress: address.trim(),
        longitude: locationCoords.longitude,
        name: name.trim(),
        phone: cleanMobileNumber,
      });
      logDebugData('Complete Profile saved customer data', customer);
      onSaved(customer);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save profile. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    setError('');
    try {
      const coords = await getCurrentCoordinates();
      if (coords.permissionDenied) {
        setError('Location permission denied. Please allow location access.');
        return;
      }
      if (coords.latitude == null || coords.longitude == null) {
        setError('Unable to get current location. Please try again.');
        return;
      }
      const nextAddress = await reverseGeocode(
        coords.latitude,
        coords.longitude,
      );
      setAddress(nextAddress);
      setLocationCoords({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch (locationError) {
      setError(
        locationError instanceof Error
          ? locationError.message
          : 'Unable to use current location.',
      );
    } finally {
      setLocating(false);
    }
  };

  const handleChooseImage = async () => {
    setError('');
    setUploadingImage(true);
    const previousAvatar = avatar;
    try {
      if (!profileImagePicker?.pickImage) {
        Alert.alert(
          'Image upload',
          'Photo picker is not available in this build.',
        );
        return;
      }

      const asset = await profileImagePicker.pickImage();
      if (!asset?.uri) {
        Alert.alert(
          'Image upload',
          'Selected image path was not received. Please rebuild the app once, then try again.',
        );
        return;
      }

      setAvatar(asset.uri);

      const uploadedUrl = await uploadProfileImage({
        fileName: asset.fileName || 'profile',
        mimeType: asset.mimeType || 'image/jpeg',
        uri: asset.uri,
      });
      logDebugData('Complete Profile image uploaded', {
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        savedAvatarPath: uploadedUrl,
      });
      setAvatar(uploadedUrl);
    } catch (imageError) {
      const message =
        imageError instanceof Error ? imageError.message : 'Please try again.';

      setError(
        message.includes('cancelled') || message.includes('PICKER_CANCELLED')
          ? 'Image selection cancelled.'
          : message,
      );
      setAvatar(previousAvatar);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.screen,
        {
          paddingTop: Math.max(40, topInset + 12),
          paddingBottom: Math.max(20, bottomInset + 14),
        },
      ]}
    >
      <Pressable onPress={onBack} hitSlop={14} style={styles.backButton}>
        <ArrowLeftIcon color="#222" size={18} />
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

        <Pressable
          onPress={handleChooseImage}
          disabled={uploadingImage}
          style={({ pressed }) => [
            styles.avatarWrap,
            pressed ? styles.pressed : undefined,
          ]}
        >
          <View style={styles.avatarCircle}>
            {getAvatarPreviewUri(avatar) ? (
              <Image
                source={{ uri: getAvatarPreviewUri(avatar) }}
                style={styles.avatarImage}
              />
            ) : (
              <>
                <View style={styles.avatarHead} />
                <View style={styles.avatarBody} />
              </>
            )}
          </View>
          <View style={styles.cameraBadge}>
            {uploadingImage ? (
              <ActivityIndicator color="#666" size="small" />
            ) : (
              <Text style={styles.cameraText}>⌾</Text>
            )}
          </View>
        </Pressable>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter full name"
              placeholderTextColor="#9b9b9b"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Enter email"
              placeholderTextColor="#9b9b9b"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              value={mobileNumber}
              onChangeText={value =>
                setMobileNumber(value.replace(/[^\d+ ]/g, '').slice(0, 18))
              }
              keyboardType="phone-pad"
              placeholder="Enter mobile number"
              placeholderTextColor="#9b9b9b"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.addressBox}>
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>Home</Text>
                <TextInput
                  value={address}
                  onChangeText={value => {
                    setAddress(value);
                    setLocationCoords({});
                  }}
                  multiline
                  placeholder="Enter delivery address"
                  placeholderTextColor="#9b9b9b"
                  style={styles.addressInput}
                />
              </View>
              <Text style={styles.chevron}>⌄</Text>
            </View>
            <Pressable
              disabled={locating}
              onPress={useCurrentLocation}
              style={[
                styles.locationButton,
                locating ? styles.locationButtonDisabled : undefined,
              ]}
            >
              <Text style={styles.locationButtonText}>
                {locating ? 'Fetching current location...' : 'Choose Current Location'}
              </Text>
            </Pressable>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <AppButton
        title={saving ? 'Saving...' : 'Save & Continue'}
        disabled={!canSave}
        onPress={handleSave}
        style={styles.saveButton}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  title: {
    color: '#2d2f33',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: '#6f7175',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  avatarWrap: {
    alignSelf: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  pressed: {
    opacity: 0.75,
  },
  avatarCircle: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 46,
    overflow: 'hidden',
    backgroundColor: '#eef0f1',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#465057',
  },
  avatarBody: {
    width: 45,
    height: 26,
    marginTop: 7,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#465057',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#f7f7f7',
  },
  cameraText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '900',
  },
  form: {
    gap: 18,
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#777a7d',
    fontSize: 12,
    fontWeight: '800',
  },
  input: {
    minHeight: 34,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    color: '#24262a',
    fontSize: 14,
    fontWeight: '800',
  },
  addressBox: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    color: '#74777a',
    fontSize: 11,
    fontWeight: '800',
  },
  addressInput: {
    minHeight: 32,
    paddingVertical: 0,
    color: '#24262a',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  chevron: {
    marginLeft: 12,
    color: '#3b3d40',
    fontSize: 18,
    fontWeight: '900',
  },
  locationButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffc3b5',
    borderRadius: 10,
    backgroundColor: '#fff6f1',
  },
  locationButtonDisabled: {
    opacity: 0.62,
  },
  locationButtonText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '900',
  },
  errorText: {
    marginTop: 14,
    color: '#c0392b',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  saveButton: {
    alignSelf: 'stretch',
    borderRadius: 9,
    backgroundColor: colors.orange,
  },
});
