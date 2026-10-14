import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  fetchHomeChefMenu,
  fetchHomeChefPhotos,
  updateHomeChefMenu,
  updateHomeChefPhotos,
  updatePartnerKycDocuments,
  updatePartnerProfile,
  uploadPartnerProfileImage,
} from '../../services/partnerProfileApi';
import { getCurrentCoordinates, reverseGeocode } from '../../services/locationApi';
import { getNativeModule } from '../../services/nativeModules';
import { getAvatarPreviewUri } from '../../utils/avatar';
import { Icons } from '../../theme/images';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

const chefTabs = ['Personal', 'Kitchen', 'Menu', 'Photos'];
const deliveryTabs = ['Personal', 'Vehicle', 'Documents', 'Photos'];
const profileImagePicker = getNativeModule('ProfileImagePicker');
const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const foodCategories = [
  'North Indian',
  'South Indian',
  'Gujarati',
  'Maharashtrian',
  'Bengali',
  'Rajasthani',
  'Punjabi',
  'Street Food',
];
const kitchenMealSlots = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
const vendorKycDocuments = [
  ['profilePhoto', 'Profile Photo'],
  ['idProof', 'Aadhaar / PAN / ID Proof'],
  ['fssaiLicense', 'FSSAI License Photo'],
  ['kitchenPhoto', 'Kitchen Photo'],
  ['bankProof', 'Bank / UPI Proof'],
];
const riderKycDocuments = [
  ['profilePhoto', 'Profile Photo'],
  ['idProof', 'Aadhaar / PAN / ID Proof'],
  ['drivingLicense', 'Driving License'],
  ['vehiclePhoto', 'Vehicle Photo'],
  ['bankProof', 'Bank / UPI Proof'],
];

function Field({ editable = true, keyboardType, label, onChangeText, value }) {
  const { darkMode, themeColors } = useTheme();
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: themeColors.ink }]}>{label}</Text>
      <TextInput
        editable={editable}
        keyboardType={keyboardType}
        placeholderTextColor={themeColors.placeholder}
        value={value || ''}
        onChangeText={onChangeText}
        style={[
          styles.fieldInput,
          {
            backgroundColor: darkMode ? '#1e1c1b' : colors.white,
            borderColor: darkMode ? '#2e2724' : '#eadfd7',
            color: themeColors.ink,
          },
          !editable ? [styles.fieldInputReadonly, { backgroundColor: darkMode ? '#161413' : '#fffaf5', color: darkMode ? '#d0c8c0' : colors.muted }] : null,
        ]}
      />
    </View>
  );
}

function EmptyState({ icon, title, copy }) {
  const { darkMode, themeColors } = useTheme();
  return (
    <View style={[styles.emptyCard, { backgroundColor: darkMode ? '#1e1c1b' : colors.white, borderColor: darkMode ? '#2e2724' : '#eadfd7' }]}>
      <Image source={icon} style={styles.emptyIcon} />
      <Text style={[styles.emptyTitle, { color: themeColors.ink }]}>{title}</Text>
      <Text style={[styles.emptyCopy, { color: themeColors.muted }]}>{copy}</Text>
    </View>
  );
}

function MenuPhotoControl({ disabled, isUploading, item, onRemove, onUpload }) {
  const { darkMode } = useTheme();
  const photoUri = getAvatarPreviewUri(item?.photo);

  return (
    <View style={styles.menuPhotoBlock}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.menuPhotoPreview} />
      ) : (
        <View style={[styles.menuPhotoPlaceholder, darkMode ? { backgroundColor: '#2a1a10', borderColor: '#3a2010' } : null]}>
          <Image source={Icons.Camera} style={styles.menuPhotoPlaceholderIcon} />
        </View>
      )}
      <View style={styles.menuPhotoActions}>
        <Pressable disabled={disabled || isUploading} onPress={onUpload} style={[styles.menuPhotoButton, darkMode ? { backgroundColor: '#2a1a10', borderColor: '#3a2010' } : null, disabled ? styles.disabledButton : null]}>
          <Text style={styles.menuPhotoButtonText}>
            {isUploading ? 'Uploading...' : photoUri ? 'Change Food Photo' : 'Add Food Photo'}
          </Text>
        </Pressable>
        {photoUri ? (
          <Pressable disabled={disabled || isUploading} onPress={onRemove} style={[styles.menuPhotoRemoveButton, disabled ? styles.disabledButton : null]}>
            <Text style={styles.menuPhotoRemoveText}>Remove Photo</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function MealTypeSelector({ disabled, onSelect, options, value }) {
  const { darkMode, themeColors } = useTheme();
  if (!options.length) {
    return (
      <Text style={styles.menuSlotHelp}>Select active meal slots in Kitchen tab first.</Text>
    );
  }

  return (
    <View style={styles.menuSlotWrap}>
      {options.map(slot => {
        const isSelected = value === slot;
        return (
          <Pressable
            key={slot}
            disabled={disabled}
            onPress={() => onSelect(slot)}
            style={[
              styles.menuSlotChip,
              darkMode ? { backgroundColor: '#1e1c1b', borderColor: '#2e2724' } : null,
              isSelected ? (darkMode ? { backgroundColor: '#2a1a10', borderColor: colors.orange } : styles.menuSlotChipActive) : null,
            ]}
          >
            <Text style={[styles.menuSlotChipText, { color: isSelected ? colors.orange : themeColors.muted }]}>
              {slot}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createWeeklyMenuItem = index => ({
  day: weekDays[index % weekDays.length],
  icon: 'Meal',
  isAvailable: true,
  items: '',
  mealType: 'Lunch',
  price: '',
  title: '',
});

const createWeeklyMenuItemForSlot = (index, mealType) => ({
  ...createWeeklyMenuItem(index),
  mealType: mealType || '',
});

const createSampleMenuItem = () => ({
  icon: 'Meal',
  isAvailable: true,
  items: '',
  price: '',
  title: '',
});

export const PartnerProfile = forwardRef(function PartnerProfile(
  { bottomInset = 0, initialTab, onDataChange, onProfileChange, profile = {}, role },
  ref,
) {
  const { darkMode, themeColors } = useTheme();
  const [activeTab, setActiveTab] = useState('Personal');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [form, setForm] = useState(profile || {});
  const [isLocating, setIsLocating] = useState(false);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [isMenuSaving, setIsMenuSaving] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [kycUploadingKey, setKycUploadingKey] = useState('');
  const [isKycSaving, setIsKycSaving] = useState(false);
  const [menuEditorTarget, setMenuEditorTarget] = useState(null);
  const [uploadingMenuPhotoKey, setUploadingMenuPhotoKey] = useState('');
  const [menuForm, setMenuForm] = useState({ sampleMenu: [], weeklyMenu: [] });
  const [photos, setPhotos] = useState([]);
  const isDeliveryPartner = /delivery/i.test(role);
  const visibleTabs = isDeliveryPartner ? deliveryTabs : chefTabs;
  const displayName = form.name || form.email || form.phone || (isDeliveryPartner ? 'Delivery Partner' : 'HomeChef');
  const initial = displayName.trim().charAt(0).toUpperCase();
  const avatarUri = getAvatarPreviewUri(form.avatar);
  const kycDocumentTypes = isDeliveryPartner ? riderKycDocuments : vendorKycDocuments;
  const kycDocuments = Array.isArray(form.kycDocuments) ? form.kycDocuments : [];
  const kycStatus = form.kycStatus || 'Not Submitted';
  const activeMealSlotOptions = useMemo(
    () => (Array.isArray(form.mealSlots) ? form.mealSlots : [])
      .filter(slot => kitchenMealSlots.includes(slot)),
    [form.mealSlots],
  );

  useImperativeHandle(ref, () => ({
    enableProfileEdit() {
      setActiveTab('Personal');
      setIsEditingDetails(true);
      Alert.alert('Edit profile', 'You can now update details and save them.');
    },
    openMenuManagement() {
      if (!isDeliveryPartner) {
        setActiveTab('Menu');
      }
    },
  }));

  useEffect(() => {
    setForm(profile || {});
  }, [profile]);

  useEffect(() => {
    if (initialTab && visibleTabs.includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab, visibleTabs]);

  useEffect(() => {
    if (isDeliveryPartner) {
      return;
    }

    let mounted = true;
    setIsMenuLoading(true);
    Promise.all([fetchHomeChefMenu(), fetchHomeChefPhotos()])
      .then(([menu, nextPhotos]) => {
        if (!mounted) return;
        setMenuForm({
          sampleMenu: menu.sampleMenu || [],
          weeklyMenu: menu.weeklyMenu || [],
        });
        setPhotos(nextPhotos || []);
      })
      .catch(error => {
        Alert.alert(
          'HomeChef profile',
          error instanceof Error ? error.message : 'Unable to load menu and photos.',
        );
      })
      .finally(() => {
        if (mounted) {
          setIsMenuLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isDeliveryPartner]);

  useEffect(() => {
    if (activeTab !== 'Menu') {
      setMenuEditorTarget(null);
    }
  }, [activeTab]);

  const personalFields = useMemo(() => [
    ['name', 'Full Name'],
    ['phone', 'Mobile Number'],
    ['email', 'Email'],
    ['city', 'City'],
    ['address', 'Address'],
    ['liveAddress', 'Live Address'],
    ['pincode', 'Pincode'],
  ], []);
  const updateField = (key, value) => {
    if (!isEditingDetails) {
      return;
    }
    setForm(current => ({ ...current, [key]: value }));
  };

  const toggleListField = (key, value) => {
    if (!isEditingDetails) {
      return;
    }
    setForm(current => {
      const currentItems = Array.isArray(current[key]) ? current[key] : [];
      const exists = currentItems.includes(value);
      return {
        ...current,
        [key]: exists
          ? currentItems.filter(item => item !== value)
          : [...currentItems, value],
      };
    });
  };

  const updateVehicleField = (key, value) => {
    if (!isEditingDetails) {
      return;
    }
    setForm(current => ({
      ...current,
      vehicleProfile: {
        ...(current.vehicleProfile || {}),
        [key]: value,
      },
    }));
  };

  const updateWeeklyMenuField = (index, key, value) => {
    if (!isEditingDetails) {
      return;
    }
    setMenuForm(current => ({
      ...current,
      weeklyMenu: (current.weeklyMenu || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const updateSampleMenuField = (index, key, value) => {
    if (!isEditingDetails) {
      return;
    }
    setMenuForm(current => ({
      ...current,
      sampleMenu: (current.sampleMenu || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const addWeeklyMenuItem = () => {
    if (!isEditingDetails) {
      return;
    }
    if (!activeMealSlotOptions.length) {
      Alert.alert('Active Meal Slots', 'Please select active meal slots in Kitchen tab first.');
      return;
    }

    setMenuForm(current => {
      const nextIndex = (current.weeklyMenu || []).length;
      setMenuEditorTarget({ index: nextIndex, type: 'weeklyMenu' });
      return {
        ...current,
        weeklyMenu: [
          ...(current.weeklyMenu || []),
          createWeeklyMenuItemForSlot(nextIndex, activeMealSlotOptions[0]),
        ],
      };
    });
  };

  const addSampleMenuItem = () => {
    if (!isEditingDetails) {
      return;
    }
    setMenuForm(current => {
      const nextIndex = (current.sampleMenu || []).length;
      setMenuEditorTarget({ index: nextIndex, type: 'sampleMenu' });
      return {
        ...current,
        sampleMenu: [...(current.sampleMenu || []), createSampleMenuItem()],
      };
    });
  };

  const removeMenuItem = (menuType, index) => {
    if (!isEditingDetails) {
      return;
    }
    setMenuForm(current => ({
      ...current,
      [menuType]: (current[menuType] || []).filter((_, itemIndex) => itemIndex !== index),
    }));
    setMenuEditorTarget(null);
  };

  const saveMenu = async () => {
    if (!isEditingDetails || isMenuSaving) {
      return;
    }

    setIsMenuSaving(true);
    try {
      const normalizedMenuForm = {
        ...menuForm,
        weeklyMenu: (menuForm.weeklyMenu || []).map(item => ({
          ...item,
          mealType: activeMealSlotOptions.includes(item.mealType)
            ? item.mealType
            : activeMealSlotOptions[0] || item.mealType,
        })),
      };
      const savedMenu = await updateHomeChefMenu(normalizedMenuForm);
      setMenuForm({
        sampleMenu: savedMenu.sampleMenu || [],
        weeklyMenu: savedMenu.weeklyMenu || [],
      });
      if (Array.isArray(savedMenu.photos)) {
        setPhotos(savedMenu.photos);
      }
      onDataChange?.();
      setIsEditingDetails(false);
      Alert.alert('Menu updated', 'Your HomeChef menu was saved.');
    } catch (error) {
      Alert.alert(
        'Menu update failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsMenuSaving(false);
    }
  };

  const chooseMenuItemPhoto = async (menuType, index) => {
    const uploadKey = `${menuType}-${index}`;
    if (!isEditingDetails || uploadingMenuPhotoKey || isMenuSaving) {
      return;
    }

    setUploadingMenuPhotoKey(uploadKey);
    try {
      if (!profileImagePicker?.pickImage) {
        Alert.alert('Food photo', 'Photo picker is not available in this build.');
        return;
      }

      const asset = await profileImagePicker.pickImage();
      if (!asset?.uri) {
        Alert.alert('Food photo', 'Selected image path was not received.');
        return;
      }

      const uploadedUrl = await uploadPartnerProfileImage({
        fileName: asset.fileName || 'food-photo',
        mimeType: asset.mimeType || 'image/jpeg',
        uri: asset.uri,
      });
      const photoPath = uploadedUrl;
      const nextMenuForm = {
        ...menuForm,
        [menuType]: (menuForm[menuType] || []).map((item, itemIndex) =>
          itemIndex === index ? { ...item, photo: photoPath } : item,
        ),
      };
      const savedMenu = await updateHomeChefMenu(nextMenuForm);
      setMenuForm({
        sampleMenu: savedMenu.sampleMenu || [],
        weeklyMenu: savedMenu.weeklyMenu || [],
      });
      if (Array.isArray(savedMenu.photos)) {
        setPhotos(savedMenu.photos);
      }
      onDataChange?.();
      setIsEditingDetails(false);
      Alert.alert('Food photo updated', 'Photo was linked with this food item.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert(
        'Food photo failed',
        message.includes('cancelled') || message.includes('PICKER_CANCELLED')
          ? 'Image selection cancelled.'
          : message,
      );
    } finally {
      setUploadingMenuPhotoKey('');
    }
  };

  const removeMenuItemPhoto = async (menuType, index) => {
    if (!isEditingDetails || uploadingMenuPhotoKey || isMenuSaving) {
      return;
    }

    const nextMenuForm = {
      ...menuForm,
      [menuType]: (menuForm[menuType] || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, photo: '' } : item,
      ),
    };
    setMenuForm(nextMenuForm);
    try {
      const savedMenu = await updateHomeChefMenu(nextMenuForm);
      setMenuForm({
        sampleMenu: savedMenu.sampleMenu || [],
        weeklyMenu: savedMenu.weeklyMenu || [],
      });
      if (Array.isArray(savedMenu.photos)) {
        setPhotos(savedMenu.photos);
      }
      onDataChange?.();
      setIsEditingDetails(false);
    } catch (error) {
      Alert.alert(
        'Food photo remove failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const chooseHomeChefPhoto = async () => {
    if (!isEditingDetails || isPhotoUploading) {
      return;
    }

    setIsPhotoUploading(true);
    try {
      if (!profileImagePicker?.pickImage) {
        Alert.alert('Photo upload', 'Photo picker is not available in this build.');
        return;
      }

      const asset = await profileImagePicker.pickImage();
      if (!asset?.uri) {
        Alert.alert('Photo upload', 'Selected image path was not received.');
        return;
      }

      const uploadedUrl = await uploadPartnerProfileImage({
        fileName: asset.fileName || 'homechef-photo',
        mimeType: asset.mimeType || 'image/jpeg',
        uri: asset.uri,
      });
      const savedPhotos = await updateHomeChefPhotos([...(photos || []), uploadedUrl]);
      setPhotos(savedPhotos);
      setIsEditingDetails(false);
      Alert.alert('Photo updated', 'Your HomeChef photo was saved.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert(
        'Photo upload failed',
        message.includes('cancelled') || message.includes('PICKER_CANCELLED')
          ? 'Image selection cancelled.'
          : message,
      );
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const removeHomeChefPhoto = async indexToRemove => {
    if (!isEditingDetails) {
      return;
    }

    try {
      const nextPhotos = photos.filter((_, index) => index !== indexToRemove);
      const savedPhotos = await updateHomeChefPhotos(nextPhotos);
      setPhotos(savedPhotos);
      setIsEditingDetails(false);
    } catch (error) {
      Alert.alert(
        'Photo remove failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const saveProfile = async (nextForm, options = {}) => {
    if (isSaving) {
      return null;
    }

    setIsSaving(true);
    try {
      const updatedProfile = await updatePartnerProfile(nextForm || form);
      setForm(updatedProfile);
      onProfileChange?.(updatedProfile);
      onDataChange?.();
      setIsEditingDetails(false);
      if (options.showAlert !== false) {
        Alert.alert('Profile updated', options.successMessage || 'Your profile details were saved.');
      }
      return updatedProfile;
    } catch (error) {
      Alert.alert(
        'Profile update failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCurrentLocation = async ({ updateHub = isDeliveryPartner } = {}) => {
    if (!isEditingDetails || isLocating || isSaving) {
      return;
    }

    setIsLocating(true);
    try {
      const coords = await getCurrentCoordinates();
      if (coords.permissionDenied) {
        Alert.alert(
          'Location permission required',
          'Please allow location permission to save your current location.',
        );
        return;
      }
      if (coords.latitude == null || coords.longitude == null) {
        Alert.alert(
          'Location unavailable',
          coords.error || 'Please turn on GPS and try again.',
        );
        return;
      }

      const liveAddress =
        await reverseGeocode(coords.latitude, coords.longitude) ||
        `Live location: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      const nextVehicleProfile = {
        ...(form.vehicleProfile || {}),
        ...(updateHub ? { currentHub: liveAddress } : {}),
      };
      const nextProfile = {
        ...form,
        address: liveAddress,
        liveAddress,
        latitude: coords.latitude,
        longitude: coords.longitude,
        location: liveAddress,
        ...(updateHub ? { vehicleProfile: nextVehicleProfile } : {}),
      };

      setForm(nextProfile);
      await saveProfile(nextProfile, {
        showAlert: false,
      });
      Alert.alert('Location saved', 'Your current live location was saved.');
    } catch (error) {
      Alert.alert(
        'Location failed',
        error instanceof Error ? error.message : 'Unable to save current location.',
      );
    } finally {
      setIsLocating(false);
    }
  };

  const saveKitchenProfile = () => saveProfile({
    ...form,
    kitchenName: form.kitchenName || (form.name ? `${form.name}'s Kitchen` : ''),
  });

  const chooseProfileImage = async () => {
    if (!isEditingDetails || isUploadingImage) {
      return;
    }

    setIsUploadingImage(true);
    const previousAvatar = form.avatar;
    try {
      if (!profileImagePicker?.pickImage) {
        Alert.alert('Image upload', 'Photo picker is not available in this build.');
        return;
      }

      const asset = await profileImagePicker.pickImage();
      if (!asset?.uri) {
        Alert.alert('Image upload', 'Selected image path was not received.');
        return;
      }

      setForm(current => ({ ...current, avatar: asset.uri }));
      const uploadedUrl = await uploadPartnerProfileImage({
        fileName: asset.fileName || 'profile',
        mimeType: asset.mimeType || 'image/jpeg',
        uri: asset.uri,
      });
      const nextProfile = {
        ...form,
        avatar: uploadedUrl,
      };
      const updatedProfile = await updatePartnerProfile(nextProfile);
      setForm(updatedProfile);
      onProfileChange?.(updatedProfile);
      onDataChange?.();
      setIsEditingDetails(false);
      Alert.alert('Image updated', 'Your profile photo has been updated.');
    } catch (error) {
      setForm(current => ({ ...current, avatar: previousAvatar }));
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert(
        'Image upload failed',
        message.includes('cancelled') || message.includes('PICKER_CANCELLED')
          ? 'Image selection cancelled.'
          : message,
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const chooseKycDocument = async (key, label) => {
    if (!isEditingDetails || kycUploadingKey || isKycSaving) {
      return;
    }

    setKycUploadingKey(key);
    try {
      if (!profileImagePicker?.pickImage) {
        Alert.alert('KYC upload', 'Photo picker is not available in this build.');
        return;
      }

      const asset = await profileImagePicker.pickImage();
      if (!asset?.uri) {
        Alert.alert('KYC upload', 'Selected image path was not received.');
        return;
      }

      const uploadedUrl = await uploadPartnerProfileImage({
        fileName: asset.fileName || `${key}-document`,
        mimeType: asset.mimeType || 'image/jpeg',
        uri: asset.uri,
      });
      setForm(current => {
        const currentDocuments = Array.isArray(current.kycDocuments) ? current.kycDocuments : [];
        const nextDocument = {
          key,
          label,
          url: uploadedUrl,
          uploadedAt: new Date().toISOString(),
        };
        return {
          ...current,
          kycDocuments: [
            ...currentDocuments.filter(document => document.key !== key),
            nextDocument,
          ],
          kycStatus: 'Draft',
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert(
        'KYC upload failed',
        message.includes('cancelled') || message.includes('PICKER_CANCELLED')
          ? 'Image selection cancelled.'
          : message,
      );
    } finally {
      setKycUploadingKey('');
    }
  };

  const submitKycDocuments = async () => {
    if (!isEditingDetails || isKycSaving) {
      return;
    }

    const requiredKeys = kycDocumentTypes.map(([key]) => key);
    const uploadedKeys = new Set(kycDocuments.map(document => document.key));
    const missingLabels = kycDocumentTypes
      .filter(([key]) => !uploadedKeys.has(key))
      .map(([, label]) => label);

    if (missingLabels.length) {
      Alert.alert('KYC incomplete', `Please upload: ${missingLabels.join(', ')}`);
      return;
    }

    setIsKycSaving(true);
    try {
      const submittedDocuments = kycDocuments.filter(document => requiredKeys.includes(document.key));
      const updatedProfile = await updatePartnerKycDocuments(submittedDocuments);
      setForm(updatedProfile);
      onProfileChange?.(updatedProfile);
      onDataChange?.();
      setIsEditingDetails(false);
      Alert.alert('KYC submitted', 'Your documents were sent for admin verification.');
    } catch (error) {
      Alert.alert(
        'KYC submit failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsKycSaving(false);
    }
  };

  const renderPersonal = () => (
    <>
      {personalFields.map(([key, label]) => (
        <Field
          key={key}
          editable={isEditingDetails}
          label={label}
          onChangeText={value => updateField(key, value)}
          value={form[key]}
        />
      ))}
      <Pressable
        disabled={!isEditingDetails || isLocating || isSaving}
        onPress={() => handleCurrentLocation({ updateHub: false })}
        style={[styles.locationButton, !isEditingDetails || isLocating || isSaving ? styles.disabledButton : null]}
      >
        <Image source={Icons.Location} style={styles.locationButtonIcon} />
        <Text style={styles.locationButtonText}>
          {isLocating ? 'Fetching Location...' : 'Use Current Location'}
        </Text>
      </Pressable>
      <Pressable disabled={!isEditingDetails || isSaving} onPress={() => saveProfile()} style={[styles.saveButton, !isEditingDetails || isSaving ? styles.disabledButton : null]}>
        <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Profile'}</Text>
      </Pressable>
    </>
  );

  const renderKitchen = () => {
    const selectedCategories = Array.isArray(form.tags) ? form.tags : [];
    const selectedMealSlots = Array.isArray(form.mealSlots) ? form.mealSlots : [];
    const visibleFoodCategories = [...new Set([...foodCategories, ...selectedCategories])];

    return (
      <>
        <Field
          editable={isEditingDetails}
          label="Kitchen Name"
          onChangeText={value => updateField('kitchenName', value)}
          value={form.kitchenName || (form.name ? `${form.name}'s Kitchen` : '')}
        />
        <Field
          editable={isEditingDetails}
          keyboardType="number-pad"
          label="FSSAI License"
          onChangeText={value => updateField('fssaiLicense', value)}
          value={form.fssaiLicense}
        />

        <View style={styles.kitchenSection}>
          <Text style={[styles.fieldLabel, { color: themeColors.ink }]}>Veg Food Categories</Text>
          <View style={styles.chipWrap}>
            {visibleFoodCategories.map(category => {
              const isSelected = selectedCategories.includes(category);
              return (
                <Pressable
                  key={category}
                  disabled={!isEditingDetails}
                  onPress={() => toggleListField('tags', category)}
                  style={[
                    styles.choiceChip,
                    darkMode ? { backgroundColor: '#1e1c1b', borderColor: '#2e2724' } : null,
                    isSelected ? (darkMode ? { backgroundColor: '#2a1a10', borderColor: colors.orange } : styles.choiceChipActive) : null,
                  ]}
                >
                  <Text style={[styles.choiceChipText, { color: isSelected ? colors.orange : themeColors.ink }]}>
                    🌿 {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.kitchenSection}>
          <Text style={[styles.fieldLabel, { color: themeColors.ink }]}>Active Meal Slots</Text>
          <View style={styles.slotChoiceGrid}>
            {kitchenMealSlots.map(slot => {
              const isSelected = selectedMealSlots.includes(slot);
              return (
                <Pressable
                  key={slot}
                  disabled={!isEditingDetails}
                  onPress={() => toggleListField('mealSlots', slot)}
                  style={[
                    styles.slotChoice,
                    darkMode ? { backgroundColor: '#1e1c1b', borderColor: '#2e2724' } : null,
                    isSelected ? (darkMode ? { backgroundColor: '#2a1a10', borderColor: colors.orange } : styles.slotChoiceActive) : null,
                  ]}
                >
                  <Text style={[styles.slotChoiceText, { color: isSelected ? colors.orange : themeColors.muted }]}>
                    🍴 {slot}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Field
          editable={isEditingDetails}
          keyboardType="number-pad"
          label="Daily Capacity (meals)"
          onChangeText={value => updateField('dailyCapacity', value.replace(/[^\d]/g, ''))}
          value={String(form.dailyCapacity || '')}
        />
        <Field
          editable={isEditingDetails}
          label="Price Per Meal"
          onChangeText={value => updateField('price', value)}
          value={form.price}
        />
        <Field
          editable={isEditingDetails}
          label="Preparation / Delivery Time"
          onChangeText={value => updateField('time', value)}
          value={form.time}
        />
        <Field
          editable={isEditingDetails}
          label="Experience"
          onChangeText={value => updateField('experience', value)}
          value={form.experience}
        />
        <Field
          editable={isEditingDetails}
          label="About Kitchen"
          onChangeText={value => updateField('about', value)}
          value={form.about}
        />
        <Pressable disabled={!isEditingDetails || isSaving} onPress={saveKitchenProfile} style={[styles.saveButton, !isEditingDetails || isSaving ? styles.disabledButton : null]}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Kitchen Profile'}</Text>
        </Pressable>
      </>
    );
  };

  const renderVehicle = () => (
    <>
      <Field
        label="Vehicle Type"
        editable={isEditingDetails}
        onChangeText={value => updateVehicleField('vehicleType', value)}
        value={form.vehicleProfile?.vehicleType}
      />
      <Field
        label="Vehicle Number"
        editable={isEditingDetails}
        onChangeText={value => updateVehicleField('vehicleNumber', value)}
        value={form.vehicleProfile?.vehicleNumber}
      />
      <Field
        label="Driving License"
        editable={isEditingDetails}
        onChangeText={value => updateVehicleField('drivingLicense', value)}
        value={form.vehicleProfile?.drivingLicense}
      />
      <Field
        label="Service Area"
        editable={isEditingDetails}
        onChangeText={value => updateVehicleField('serviceArea', value)}
        value={form.vehicleProfile?.serviceArea}
      />
      <Field
        label="Current Hub"
        editable={isEditingDetails}
        onChangeText={value => updateVehicleField('currentHub', value)}
        value={form.vehicleProfile?.currentHub}
      />
      <Pressable
        disabled={!isEditingDetails || isLocating || isSaving}
        onPress={() => handleCurrentLocation({ updateHub: true })}
        style={[styles.locationButton, darkMode ? { backgroundColor: '#1e1c1b' } : null, !isEditingDetails || isLocating || isSaving ? styles.disabledButton : null]}
      >
        <Image source={Icons.Location} style={styles.locationButtonIcon} />
        <Text style={styles.locationButtonText}>
          {isLocating ? 'Fetching Location...' : 'Use Current Hub Location'}
        </Text>
      </Pressable>
      <Field
        label="Availability"
        editable={isEditingDetails}
        onChangeText={value => updateVehicleField('availability', value)}
        value={Array.isArray(form.vehicleProfile?.availability)
          ? form.vehicleProfile.availability.join(', ')
          : form.vehicleProfile?.availability}
      />
      <Pressable disabled={!isEditingDetails || isSaving} onPress={() => saveProfile()} style={[styles.saveButton, !isEditingDetails || isSaving ? styles.disabledButton : null]}>
        <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Vehicle Profile'}</Text>
      </Pressable>
    </>
  );

  const renderDocuments = () => (
    <View style={[styles.documentPanel, darkMode ? { backgroundColor: '#1e1c1b', borderColor: '#2e2724' } : null]}>
      <View style={styles.documentHeader}>
        <View style={styles.documentHeaderCopy}>
          <Text style={[styles.groupTitle, { color: themeColors.ink }]}>KYC Verification</Text>
          <Text style={[styles.documentHelp, { color: themeColors.muted }]}>
            Upload clear photos. Admin will approve or reject after review.
          </Text>
        </View>
        <Text style={[
          styles.kycStatus,
          kycStatus === 'Approved'
            ? styles.kycStatusApproved
            : kycStatus === 'Rejected'
              ? styles.kycStatusRejected
              : styles.kycStatusPending,
        ]}>
          {kycStatus}
        </Text>
      </View>

      {form.kycReviewNote ? (
        <Text style={styles.kycNote}>Admin note: {form.kycReviewNote}</Text>
      ) : null}

      {kycDocumentTypes.map(([key, label]) => {
        const document = kycDocuments.find(item => item.key === key);
        const previewUri = getAvatarPreviewUri(document?.url);
        const isUploading = kycUploadingKey === key;

        return (
          <View key={key} style={[styles.documentRow, darkMode ? { borderColor: '#2e2724' } : null]}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.documentPreview} />
            ) : (
              <View style={[styles.documentPlaceholder, darkMode ? { backgroundColor: '#2a1a10', borderColor: '#3a2010' } : null]}>
                <Image source={Icons.Document} style={styles.documentIcon} />
              </View>
            )}
            <View style={styles.documentCopy}>
              <Text style={[styles.documentTitle, { color: themeColors.ink }]}>{label}</Text>
              <Text style={[styles.documentMeta, { color: themeColors.muted }]}>
                {document?.url ? 'Uploaded' : 'Required'}
              </Text>
            </View>
            <Pressable
              disabled={!isEditingDetails || isUploading || isKycSaving}
              onPress={() => chooseKycDocument(key, label)}
              style={[styles.documentButton, !isEditingDetails || isUploading || isKycSaving ? styles.disabledButton : null]}
            >
              <Text style={styles.documentButtonText}>
                {isUploading ? 'Uploading...' : document?.url ? 'Change' : 'Upload'}
              </Text>
            </Pressable>
          </View>
        );
      })}

      <Pressable disabled={!isEditingDetails || isKycSaving} onPress={submitKycDocuments} style={[styles.saveButton, !isEditingDetails || isKycSaving ? styles.disabledButton : null]}>
        <Text style={styles.saveButtonText}>{isKycSaving ? 'Submitting...' : 'Submit KYC for Review'}</Text>
      </Pressable>
    </View>
  );

  const renderMenuRows = (menuType, rows) => (
    <View style={[styles.menuTable, darkMode ? { backgroundColor: '#1e1c1b', borderColor: '#2e2724' } : null]}>
      <View style={[styles.menuTableHeader, darkMode ? { backgroundColor: '#221812', borderBottomColor: '#2e2724' } : null]}>
        <Text style={[styles.menuTableHeadText, styles.menuTitleCell, darkMode ? { color: themeColors.muted } : null]}>Item</Text>
        {menuType === 'weeklyMenu' ? <Text style={[styles.menuTableHeadText, darkMode ? { color: themeColors.muted } : null]}>Slot</Text> : null}
        <Text style={[styles.menuTableHeadText, darkMode ? { color: themeColors.muted } : null]}>Price</Text>
        <Text style={[styles.menuTableHeadText, darkMode ? { color: themeColors.muted } : null]}>Status</Text>
      </View>
      {rows.length ? rows.map((item, index) => (
        <Pressable
          key={`${menuType}-${index}`}
          onPress={() => setMenuEditorTarget({ index, type: menuType })}
          style={[styles.menuTableRow, darkMode ? { borderBottomColor: '#2e2724' } : null]}
        >
          <Text numberOfLines={1} style={[styles.menuTableText, styles.menuTitleCell, { color: themeColors.ink }]}>
            {item.title || 'Untitled meal'}
          </Text>
          {menuType === 'weeklyMenu' ? (
            <Text numberOfLines={1} style={[styles.menuTableText, { color: themeColors.ink }]}>{item.mealType || '-'}</Text>
          ) : null}
          <Text numberOfLines={1} style={[styles.menuTableText, { color: themeColors.ink }]}>{item.price || '-'}</Text>
          <Text style={[styles.menuStatusText, item.isAvailable === false ? styles.menuStatusTextOff : null]}>
            {item.isAvailable === false ? 'Off' : 'On'}
          </Text>
        </Pressable>
      )) : (
        <Text style={[styles.menuTableEmpty, { color: themeColors.muted }]}>No menu items yet.</Text>
      )}
    </View>
  );

  const renderMenuDetail = () => {
    const { index, type } = menuEditorTarget || {};
    const isWeekly = type === 'weeklyMenu';
    const item = menuForm[type]?.[index];

    if (!item) {
      return (
        <Pressable onPress={() => setMenuEditorTarget(null)} style={[styles.detailBackButton, darkMode ? { backgroundColor: '#1e1c1b', borderColor: '#2e2724' } : null]}>
          <Text style={styles.detailBackText}>Back to Menu List</Text>
        </Pressable>
      );
    }

    return (
      <>
        <Pressable onPress={() => setMenuEditorTarget(null)} style={[styles.detailBackButton, darkMode ? { backgroundColor: '#1e1c1b', borderColor: '#2e2724' } : null]}>
          <Text style={styles.detailBackText}>Back to Menu List</Text>
        </Pressable>
        <View style={[styles.editorCard, darkMode ? { backgroundColor: '#1e1c1b', borderColor: '#2e2724' } : null]}>
          <Text style={[styles.groupTitle, { color: themeColors.ink }]}>{isWeekly ? 'Weekly Menu Detail' : 'Sample Meal Detail'}</Text>
          {isWeekly ? (
            <>
              <View style={styles.editorRow}>
                <TextInput
                  editable={isEditingDetails}
                  onChangeText={value => updateWeeklyMenuField(index, 'day', value.toUpperCase().slice(0, 3))}
                  style={[styles.smallInput, styles.dayInput, darkMode ? { backgroundColor: '#141416', borderColor: '#2e2724', color: themeColors.ink } : null, !isEditingDetails ? styles.fieldInputReadonly : null]}
                  value={item.day}
                />
                <Pressable
                  disabled={!isEditingDetails}
                  onPress={() => updateWeeklyMenuField(index, 'isAvailable', item.isAvailable === false)}
                  style={[styles.statusToggle, item.isAvailable === false ? styles.statusToggleOff : null]}
                >
                  <Text style={styles.statusToggleText}>{item.isAvailable === false ? 'Off' : 'On'}</Text>
                </Pressable>
              </View>
              <Text style={[styles.fieldLabel, { color: themeColors.ink }]}>Meal Slot</Text>
              <MealTypeSelector
                disabled={!isEditingDetails}
                options={activeMealSlotOptions}
                value={item.mealType}
                onSelect={value => updateWeeklyMenuField(index, 'mealType', value)}
              />
            </>
          ) : null}
          <Field
            editable={isEditingDetails}
            label={isWeekly ? 'Menu Title' : 'Meal Title'}
            onChangeText={value => isWeekly
              ? updateWeeklyMenuField(index, 'title', value)
              : updateSampleMenuField(index, 'title', value)}
            value={item.title}
          />
          <Field
            editable={isEditingDetails}
            label="Items"
            onChangeText={value => isWeekly
              ? updateWeeklyMenuField(index, 'items', value)
              : updateSampleMenuField(index, 'items', value)}
            value={item.items}
          />
          <Field
            editable={isEditingDetails}
            label="Price"
            onChangeText={value => isWeekly
              ? updateWeeklyMenuField(index, 'price', value)
              : updateSampleMenuField(index, 'price', value)}
            value={item.price}
          />
          <MenuPhotoControl
            disabled={!isEditingDetails}
            item={item}
            isUploading={uploadingMenuPhotoKey === `${type}-${index}`}
            onRemove={() => removeMenuItemPhoto(type, index)}
            onUpload={() => chooseMenuItemPhoto(type, index)}
          />
          <Pressable disabled={!isEditingDetails} onPress={() => removeMenuItem(type, index)} style={[styles.removeButton, !isEditingDetails ? styles.disabledButton : null]}>
            <Text style={styles.removeButtonText}>Remove</Text>
          </Pressable>
        </View>
        <Pressable disabled={!isEditingDetails || isMenuSaving} onPress={saveMenu} style={[styles.saveButton, !isEditingDetails || isMenuSaving ? styles.disabledButton : null]}>
          <Text style={styles.saveButtonText}>{isMenuSaving ? 'Saving...' : 'Save Menu'}</Text>
        </Pressable>
      </>
    );
  };

  const renderMenuEditor = () => {
    if (menuEditorTarget) {
      return renderMenuDetail();
    }

    return (
      <>
        {isMenuLoading ? <Text style={[styles.loadingText, { color: themeColors.muted }]}>Loading menu...</Text> : null}
        <View style={styles.menuSectionHeader}>
          <Text style={[styles.groupTitle, { color: themeColors.ink }]}>Weekly Menu</Text>
          <Pressable disabled={!isEditingDetails} onPress={addWeeklyMenuItem} style={[styles.inlineAddButton, darkMode ? { backgroundColor: '#2a1a10' } : null, !isEditingDetails ? styles.disabledButton : null]}>
            <Text style={styles.inlineAddText}>Add</Text>
          </Pressable>
        </View>
        {renderMenuRows('weeklyMenu', menuForm.weeklyMenu || [])}

        <View style={styles.menuSectionHeader}>
          <Text style={[styles.groupTitle, { color: themeColors.ink }]}>Sample Meals</Text>
          <Pressable disabled={!isEditingDetails} onPress={addSampleMenuItem} style={[styles.inlineAddButton, darkMode ? { backgroundColor: '#2a1a10' } : null, !isEditingDetails ? styles.disabledButton : null]}>
            <Text style={styles.inlineAddText}>Add</Text>
          </Pressable>
        </View>
        {renderMenuRows('sampleMenu', menuForm.sampleMenu || [])}

        <Pressable disabled={!isEditingDetails || isMenuSaving} onPress={saveMenu} style={[styles.saveButton, !isEditingDetails || isMenuSaving ? styles.disabledButton : null]}>
          <Text style={styles.saveButtonText}>{isMenuSaving ? 'Saving...' : 'Save Menu'}</Text>
        </Pressable>
      </>
    );
  };

  const renderPhotos = () => {
    if (isDeliveryPartner) {
      return (
        <EmptyState
          copy="Delivery partner document and vehicle photo upload will be connected from KYC APIs."
          icon={Icons.Camera}
          title="No delivery photos yet."
        />
      );
    }

    return (
      <>
        <Pressable
          disabled={!isEditingDetails || isPhotoUploading}
          onPress={chooseHomeChefPhoto}
          style={[styles.locationButton, darkMode ? { backgroundColor: '#1e1c1b' } : null, !isEditingDetails || isPhotoUploading ? styles.disabledButton : null]}
        >
          <Image source={Icons.Camera} style={styles.locationButtonIcon} />
          <Text style={styles.locationButtonText}>
            {isPhotoUploading ? 'Uploading Photo...' : 'Add Kitchen / Meal Photo'}
          </Text>
        </Pressable>
        {photos.length ? (
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => {
              const uri = getAvatarPreviewUri(photo);
              return (
                <View key={`${photo}-${index}`} style={[styles.photoTile, darkMode ? { backgroundColor: '#1e1c1b', borderColor: '#2e2724' } : null]}>
                  {uri ? <Image source={{ uri }} style={styles.photoImage} /> : null}
                  <Pressable disabled={!isEditingDetails} onPress={() => removeHomeChefPhoto(index)} style={[styles.photoRemove, !isEditingDetails ? styles.disabledButton : null]}>
                    <Text style={styles.photoRemoveText}>Remove</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : (
          <EmptyState
            copy="Add real kitchen, tiffin, or menu photos. Saved photos will come from backend."
            icon={Icons.Camera}
            title="No live photos yet."
          />
        )}
      </>
    );
  };

  const renderTabContent = () => {
    if (isDeliveryPartner && activeTab === 'Vehicle') {
      return renderVehicle();
    }
    if (isDeliveryPartner && activeTab === 'Documents') {
      return renderDocuments();
    }
    if (activeTab === 'Kitchen') {
      return renderKitchen();
    }
    if (activeTab === 'Menu') {
      return renderMenuEditor();
    }
    if (activeTab === 'Photos') {
      return renderPhotos();
    }
    return renderPersonal();
  };

  const screenBg = darkMode ? '#141416' : '#fffaf6';
  const heroBg = darkMode ? '#1e1c1b' : colors.white;
  const heroBorder = darkMode ? '#2e2724' : '#eadfd7';
  const tabsBg = darkMode ? '#1a1816' : colors.white;

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <View style={[styles.profileHero, { backgroundColor: heroBg, borderBottomColor: heroBorder }]}>
        <View style={styles.avatarWrap}>
          <Pressable disabled={!isEditingDetails || isUploadingImage} onPress={chooseProfileImage} style={[styles.avatar, { backgroundColor: darkMode ? '#2a1a10' : colors.orangeSoft, borderColor: darkMode ? '#3a2010' : colors.white }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </Pressable>
          <Pressable disabled={!isEditingDetails || isUploadingImage} onPress={chooseProfileImage} style={[styles.cameraBadge, !isEditingDetails ? styles.disabledButton : null]}>
            <Image source={Icons.Camera} style={styles.cameraIcon} />
          </Pressable>
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.profileName, { color: themeColors.ink }]}>{displayName}</Text>
          <Text style={[styles.ratingText, { color: themeColors.muted }]}>{isUploadingImage ? 'Uploading image...' : 'Live partner account'}</Text>
          <Text style={styles.verifiedText}>{role}</Text>
        </View>
      </View>

      <View style={[styles.tabs, { backgroundColor: tabsBg, borderBottomColor: heroBorder }]}>
        {visibleTabs.map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
            <Text style={[styles.tabText, { color: themeColors.muted }, tab === activeTab ? styles.tabTextActive : null]}>{tab}</Text>
            {tab === activeTab ? <View style={styles.tabUnderline} /> : null}
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.formContent, { paddingBottom: Math.max(96, bottomInset + 78) }]} showsVerticalScrollIndicator>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 3,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarImage: {
    borderRadius: 25,
    height: 50,
    width: 50,
  },
  avatarInitial: {
    color: colors.orange,
    fontSize: 20,
    fontWeight: '900',
  },
  avatarWrap: {
    marginRight: 16,
  },
  cameraBadge: {
    alignItems: 'center',
    backgroundColor: colors.orange,
    borderColor: colors.white,
    borderRadius: 10,
    borderWidth: 2,
    bottom: -1,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 22,
  },
  cameraIcon: {
    height: 12,
    tintColor: colors.white,
    width: 12,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceChip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#eadfd7',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  choiceChipActive: {
    backgroundColor: '#fff7f1',
    borderColor: colors.orange,
  },
  choiceChipReadonly: {
    opacity: 0.72,
  },
  choiceChipText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },
  choiceChipTextActive: {
    color: colors.orange,
  },
  emptyCard: {
    alignItems: 'center',
    borderColor: '#eadfd7',
    borderRadius: 14,
    borderWidth: 1,
    padding: 22,
  },
  disabledButton: {
    opacity: 0.65,
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 7,
    textAlign: 'center',
  },
  emptyIcon: {
    height: 25,
    tintColor: colors.orange,
    width: 25,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 12,
  },
  dayInput: {
    flex: 0.55,
  },
  detailBackButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderColor: '#eadfd7',
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  detailBackText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '900',
  },
  documentButton: {
    alignItems: 'center',
    backgroundColor: '#fff7f1',
    borderColor: colors.orange,
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  documentButtonText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '900',
  },
  documentCopy: {
    flex: 1,
  },
  documentHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  documentHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  documentHelp: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  documentIcon: {
    height: 20,
    tintColor: colors.orange,
    width: 20,
  },
  documentMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  documentPanel: {
    backgroundColor: colors.white,
    borderColor: '#eadfd7',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  documentPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#fff4ee',
    borderColor: '#ffd0bd',
    borderRadius: 10,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  documentPreview: {
    backgroundColor: '#fff4ee',
    borderRadius: 10,
    height: 48,
    width: 48,
  },
  documentRow: {
    alignItems: 'center',
    borderColor: '#f0e5dd',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    padding: 10,
  },
  documentTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  editorCard: {
    backgroundColor: colors.white,
    borderColor: '#eadfd7',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    padding: 12,
  },
  editorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  fieldBlock: {
    marginBottom: 16,
  },
  fieldInput: {
    borderColor: '#eadfd7',
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    fontWeight: '800',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  fieldInputReadonly: {
    opacity: 0.7,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },
  formContent: {
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  groupTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 12,
    marginTop: 4,
  },
  heroCopy: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#fff7f1',
    borderColor: '#ffd8c4',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  infoCopy: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 5,
  },
  infoTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  inlineAddButton: {
    alignItems: 'center',
    backgroundColor: '#fff7f1',
    borderColor: colors.orange,
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  inlineAddText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '900',
  },
  kitchenSection: {
    marginBottom: 18,
  },
  kycNote: {
    backgroundColor: '#fff7f1',
    borderRadius: 10,
    color: '#9a3412',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    marginBottom: 12,
    padding: 10,
  },
  kycStatus: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '900',
    maxWidth: 112,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
    textAlign: 'center',
  },
  kycStatusApproved: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  kycStatusPending: {
    backgroundColor: '#ffedd5',
    color: '#9a3412',
  },
  kycStatusRejected: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  locationButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.orange,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'center',
    marginBottom: 12,
  },
  locationButtonIcon: {
    height: 18,
    marginRight: 8,
    tintColor: colors.orange,
    width: 18,
  },
  locationButtonText: {
    color: colors.orange,
    fontSize: 15,
    fontWeight: '900',
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  menuPhotoActions: {
    flex: 1,
    gap: 8,
  },
  menuPhotoBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  menuPhotoButton: {
    alignItems: 'center',
    backgroundColor: '#fff4ee',
    borderColor: '#ffd0bd',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 12,
  },
  menuPhotoButtonText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '900',
  },
  menuPhotoPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#fff4ee',
    borderColor: '#ffd0bd',
    borderRadius: 12,
    borderWidth: 1,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  menuPhotoPlaceholderIcon: {
    height: 20,
    tintColor: colors.orange,
    width: 20,
  },
  menuPhotoPreview: {
    backgroundColor: '#fff4ee',
    borderRadius: 12,
    height: 62,
    width: 62,
  },
  menuPhotoRemoveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  menuPhotoRemoveText: {
    color: '#c2410c',
    fontSize: 12,
    fontWeight: '900',
  },
  menuSlotChip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#eadfd7',
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  menuSlotChipActive: {
    backgroundColor: '#fff7f1',
    borderColor: colors.orange,
  },
  menuSlotChipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  menuSlotChipTextActive: {
    color: colors.orange,
  },
  menuSlotHelp: {
    color: '#c2410c',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
  },
  menuSlotWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  menuSectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  menuStatusText: {
    color: '#12805c',
    flex: 0.8,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
  },
  menuStatusTextOff: {
    color: '#c2410c',
  },
  menuTable: {
    backgroundColor: colors.white,
    borderColor: '#eadfd7',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
    overflow: 'hidden',
  },
  menuTableEmpty: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    padding: 14,
    textAlign: 'center',
  },
  menuTableHeader: {
    backgroundColor: '#fff7f1',
    borderBottomColor: '#eadfd7',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  menuTableHeadText: {
    color: colors.muted,
    flex: 0.9,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right',
  },
  menuTableRow: {
    alignItems: 'center',
    borderBottomColor: '#f0e5dd',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuTableText: {
    color: colors.ink,
    flex: 0.9,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  menuTitleCell: {
    flex: 1.7,
    textAlign: 'left',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoImage: {
    borderRadius: 10,
    height: 118,
    width: '100%',
  },
  photoRemove: {
    alignItems: 'center',
    backgroundColor: colors.orange,
    borderRadius: 9,
    height: 34,
    justifyContent: 'center',
    marginTop: 8,
  },
  photoRemoveText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  photoTile: {
    backgroundColor: colors.white,
    borderColor: '#eadfd7',
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    width: '48%',
  },
  profileHero: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: 18,
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  profileName: {
    fontSize: 19,
    fontWeight: '900',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.orange,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.orange,
    borderRadius: 12,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    marginBottom: 18,
  },
  secondaryButtonText: {
    color: colors.orange,
    fontSize: 14,
    fontWeight: '900',
  },
  screen: {
    flex: 1,
    marginHorizontal: -14,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  tabText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  tabTextActive: {
    color: colors.orange,
  },
  tabUnderline: {
    backgroundColor: colors.orange,
    borderRadius: 2,
    bottom: 0,
    height: 3,
    position: 'absolute',
    width: 34,
  },
  tabs: {
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  verifiedText: {
    color: colors.orange,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
  },
  removeButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  removeButtonText: {
    color: '#c0392b',
    fontSize: 12,
    fontWeight: '900',
  },
  smallInput: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadfd7',
    borderRadius: 10,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    height: 42,
    paddingHorizontal: 10,
  },
  slotChoice: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#eadfd7',
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    height: 48,
    justifyContent: 'center',
  },
  slotChoiceActive: {
    backgroundColor: '#fff7f1',
    borderColor: colors.orange,
  },
  slotChoiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotChoiceText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  slotChoiceTextActive: {
    color: colors.orange,
  },
  statusToggle: {
    alignItems: 'center',
    backgroundColor: colors.orange,
    borderRadius: 10,
    height: 42,
    justifyContent: 'center',
    width: 52,
  },
  statusToggleOff: {
    backgroundColor: colors.muted,
  },
  statusToggleText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
});
