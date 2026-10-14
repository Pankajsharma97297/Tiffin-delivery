import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  Image,
  Modal,
  NativeModules,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { useCustomerProfile } from '../context/CustomerProfileContext';
import { fetchHomeData } from '../services/homeApi';
import { getCurrentCoordinates, reverseGeocode } from '../services/locationApi';
import {
  updateCustomerProfile,
  uploadProfileImage,
} from '../services/profileApi';
import { colors } from '../theme/colors';
import { logDebugData } from '../utils/debugLog';
import { getAvatarImageUri, getAvatarPreviewUri } from '../utils/avatar';
import { Icons } from '../theme/images';
const profileImagePicker = NativeModules.ProfileImagePicker;
const supportRows = [
  [Icons.QuestionMark, 'Help Center', 'FAQs, guides & support articles', 11],
  [Icons.Chat, 'WhatsApp Chat with Admin', 'Chat directly with our team', 12],
  [Icons.Robo, 'AI Chatbot Support', 'Instant answers 24/7', 13],
];
export function ProfileScreen({
  topInset,
  bottomInset,
  onNavigate,
  onBackHome,
  onLogout,
  onSupportSelect,
  onSavedAddresses,
  onReviews,
  onWallet,
  onPlans,
  onSubscription,
  onHomeChef,
  onOrders,
  latestOrder,
}) {
  const { themeColors } = useTheme();
  const { customerProfile, setCustomerProfile } = useCustomerProfile();
  const [customer, setCustomer] = useState(customerProfile);
  const [assignedChef, setAssignedChef] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileForm, setProfileForm] = useState({
    address: '',
    avatar: '',
    email: '',
    latitude: undefined,
    liveAddress: '',
    longitude: undefined,
    name: '',
    phone: '',
  });
  const displayCustomer = customer || {
    name: 'MIDDO User',
    avatar: '',
    location: 'Location not added',
    walletBalance: 0,
    rating: '4.8',
    orders: 0,
  };
  const deliveryAddress =
    displayCustomer.liveAddress ||
    displayCustomer.address ||
    displayCustomer.location ||
    'Delivery address not added';
  const memberSince = displayCustomer.createdAt
    ? new Date(displayCustomer.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : 'Jan 2024';
  const walletBalance = Number(displayCustomer.walletBalance || 0);
  const profileAvatarUri = getAvatarImageUri(displayCustomer.avatar);
  const contactRows = [
    [
      Icons.Phone,
      displayCustomer.phone || 'Mobile number not added',
      'Mobile number',
      'phone',
    ],
    [
      Icons.Message,
      displayCustomer.email || 'Email address not added',
      'Email address',
      'email',
    ],
    [Icons.Location, deliveryAddress, 'Delivery address', 'address'],
  ];
  const subscriptionSubtitle = activeSubscription
    ? `${
        activeSubscription.plan || activeSubscription.planType || 'Active plan'
      } · ${
        activeSubscription.homeChefName ||
        assignedChef?.kitchenName ||
        'HomeChef'
      }${
        activeSubscription.renewal
          ? ` · Until ${activeSubscription.renewal}`
          : ''
      }`
    : 'No active subscription · choose a plan';
  const ordersSubtitle = latestOrder
    ? `#${latestOrder.orderId} · ${latestOrder.status}`
    : 'Full order details & live tracking';
  const quickAccessRows = [
    [Icons.TiffinSubscription, 'My Tiffin Subscription', subscriptionSubtitle, 'subscription'],
    [Icons.TiffinSubscription, 'My Orders', ordersSubtitle, 'orders'],
    [
      Icons.CalendarAlt,
      'Subscription Plans',
      activeSubscription
        ? `Active: ${activeSubscription.durationDays || '-'} days`
        : 'Manage your active plans',
      'plans',
    ],
    [
      Icons.ChefCap,
      'My HomeChef',
      assignedChef?.name || 'HomeChef not assigned',
      'homechef',
    ],
    [Icons.Refresh, 'Change HomeChef', 'Request a different HomeChef', 'homechef'],
    [Icons.Wallet, 'Wallet', `Balance: ₹${walletBalance}`, 'wallet'],
    [
      Icons.Star,
      'Reviews',
      `Your rating: ${displayCustomer.rating || '4.8'}★`,
      'reviews',
    ],
    [Icons.Location, 'Saved Addresses', deliveryAddress, 'saved'],
  ];
  const applyHomeData = useCallback(data => {
    logDebugData('Profile screen data from backend', data);
    setCustomer(
      customerProfile
        ? {
            ...(data.customer || {}),
            ...customerProfile,
          }
        : data.customer,
    );
    setAssignedChef(data.assignedChef);
    setActiveSubscription(data.activeSubscription || null);
  }, [customerProfile]);
  const refreshProfileData = () =>
    fetchHomeData()
      .then(applyHomeData)
      .catch(() => undefined);
  const openEditProfile = () => {
    setIsEditOpen(true);
    refreshProfileData();
  };
  useEffect(() => {
    let mounted = true;
    const loadProfileHomeChef = () => {
      fetchHomeData()
        .then(data => {
          if (mounted) {
            applyHomeData(data);
          }
        })
        .catch(() => undefined);
    };
    loadProfileHomeChef();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        loadProfileHomeChef();
      }
    });
    const interval = setInterval(loadProfileHomeChef, 10000);
    return () => {
      mounted = false;
      subscription.remove();
      clearInterval(interval);
    };
  }, [applyHomeData]);
  useEffect(() => {
    if (customerProfile) {
      setCustomer(current => ({
        ...(current || {}),
        ...customerProfile,
      }));
    }
  }, [customerProfile]);
  useEffect(() => {
    setProfileForm({
      address: displayCustomer.address || deliveryAddress,
      avatar: displayCustomer.avatar || '',
      email: displayCustomer.email || '',
      latitude: displayCustomer.latitude,
      liveAddress: displayCustomer.liveAddress || deliveryAddress,
      longitude: displayCustomer.longitude,
      name: displayCustomer.name || '',
      phone: displayCustomer.phone || '',
    });
  }, [
    deliveryAddress,
    displayCustomer.address,
    displayCustomer.avatar,
    displayCustomer.email,
    displayCustomer.liveAddress,
    displayCustomer.name,
    displayCustomer.phone,
  ]);
  const saveProfile = async () => {
    if (!profileForm.email && !profileForm.phone) {
      Alert.alert('Profile', 'Email or phone is required to update profile.');
      return;
    }
    setIsSaving(true);
    try {
      const updatedCustomer = await updateCustomerProfile(profileForm);
      logDebugData('Profile updated customer data', updatedCustomer);
      setCustomer(updatedCustomer);
      setCustomerProfile(updatedCustomer);
      setIsEditOpen(false);
      Alert.alert('Profile updated', 'Your profile details were saved.');
    } catch (error) {
      Alert.alert(
        'Profile update failed',
        error instanceof Error ? error.message : 'Try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };
  const useCurrentLocationForProfile = async () => {
    setIsLocating(true);
    try {
      const coords = await getCurrentCoordinates();
      if (coords.permissionDenied) {
        Alert.alert(
          'Location permission',
          'Please allow location permission to use your current address.',
        );
        return;
      }
      if (coords.latitude == null || coords.longitude == null) {
        Alert.alert('Location', 'Unable to get current location. Try again.');
        return;
      }
      const nextAddress = await reverseGeocode(
        coords.latitude,
        coords.longitude,
      );
      setProfileForm(current => ({
        ...current,
        address: nextAddress,
        latitude: coords.latitude,
        liveAddress: nextAddress,
        longitude: coords.longitude,
      }));
    } catch (error) {
      Alert.alert(
        'Location failed',
        error instanceof Error ? error.message : 'Unable to use location.',
      );
    } finally {
      setIsLocating(false);
    }
  };
  const chooseProfileImage = async () => {
    setIsUploadingImage(true);
    const previousAvatar = profileForm.avatar;
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
      setProfileForm(current => ({
        ...current,
        avatar: asset.uri,
      }));
      const uploadedUrl = await uploadProfileImage({
        fileName: asset.fileName || 'profile',
        mimeType: asset.mimeType || 'image/jpeg',
        uri: asset.uri,
      });
      const nextProfile = {
        ...profileForm,
        avatar: uploadedUrl,
      };
      const updatedCustomer = await updateCustomerProfile(nextProfile);
      logDebugData('Profile image uploaded', {
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        savedAvatarPath: uploadedUrl,
        updatedCustomer,
      });
      setProfileForm(nextProfile);
      setCustomer(updatedCustomer);
      setCustomerProfile(updatedCustomer);
      Alert.alert(
        'Image updated',
        'Your profile photo has been updated.',
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Please try again.';
      Alert.alert(
        'Image upload failed',
        message.includes('cancelled') || message.includes('PICKER_CANCELLED')
          ? 'Image selection cancelled.'
          : message,
      );
      setProfileForm(current => ({
        ...current,
        avatar: previousAvatar,
      }));
    } finally {
      setIsUploadingImage(false);
    }
  };
  return (
    <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(96, bottomInset + 84),
          },
        ]}
        showsVerticalScrollIndicator
      >
        <View
          style={[
            styles.profileHero,
            {
              paddingTop: Math.max(48, topInset + 16),
            },
          ]}
        >
          <View style={styles.heroTop}>
            <Pressable onPress={onBackHome} style={styles.headerCircle}>
              <ArrowLeftIcon />
            </Pressable>
            <Text style={styles.heroTitle}>My Profile</Text>
            <Pressable onPress={openEditProfile} style={styles.headerCircle}>
              <Image source={Icons.Edit} style={styles.headerIconImage} />
            </Pressable>
          </View>
          <View style={styles.profileAvatar}>
            <Pressable
              disabled={isUploadingImage}
              onPress={chooseProfileImage}
              style={styles.profileAvatarPress}
            >
              {profileAvatarUri ? (
                <Image
                  source={{
                    uri: profileAvatarUri,
                  }}
                  style={styles.profileAvatarImage}
                />
              ) : (
                <Text style={styles.profileAvatarText}>👤</Text>
              )}
            </Pressable>
            <Pressable
              disabled={isUploadingImage}
              hitSlop={10}
              onPress={chooseProfileImage}
              style={styles.cameraBadge}
            >
              <Image source={Icons.Camera} style={styles.cameraBadgeIcon} />
            </Pressable>
          </View>
          <Text style={styles.profileName}>
            {displayCustomer.name || 'MIDDO User'}
          </Text>
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        </View>

        <View
          style={[
            styles.statsCard,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.line,
            },
          ]}
        >
          <ProfileStat
            value={String(displayCustomer.orders || 0)}
            label="Orders"
          />
          <ProfileStat
            value={`${displayCustomer.rating || '4.8'}★`}
            label="My Rating"
          />
          <ProfileStat value={`₹${walletBalance}`} label="Wallet" />
        </View>

        {latestOrder ? (
          <Pressable
            onPress={onOrders}
            style={[
              styles.activityCard,
              {
                backgroundColor: themeColors.cardHighlight,
                borderColor: themeColors.line,
              },
            ]}
          >
            <View>
              <Text style={styles.activityLabel}>Latest Order</Text>
              <Text style={[styles.activityTitle, { color: themeColors.text }]}>{latestOrder.meal}</Text>
              <Text style={[styles.activityMeta, { color: themeColors.muted }]}>
                #{latestOrder.orderId} · {latestOrder.status} ·{' '}
                {latestOrder.paymentProvider || 'Razorpay'}
              </Text>
            </View>
            <Text style={styles.activityAmount}>{latestOrder.amount}</Text>
          </Pressable>
        ) : null}

        <Section title="Contact Info">
          {contactRows.map(row => (
            <ListRow
              key={row[1]}
              icon={row[0]}
              title={row[1]}
              subtitle={row[2]}
              soft
            />
          ))}
        </Section>

        <Section title="Quick Access">
          {quickAccessRows.map(row => (
            <ListRow
              key={row[1]}
              icon={row[0]}
              title={row[1]}
              subtitle={row[2]}
              onPress={
                row[3] === 'saved'
                  ? onSavedAddresses
                  : row[3] === 'orders'
                  ? onOrders
                  : row[3] === 'reviews'
                  ? onReviews
                  : row[3] === 'wallet'
                  ? onWallet
                  : row[3] === 'plans'
                  ? onPlans
                  : row[3] === 'subscription'
                  ? onSubscription
                  : row[3] === 'homechef'
                  ? onHomeChef
                  : undefined
              }
            />
          ))}
        </Section>

        <Section title="Support & Help">
          {supportRows.map(row => (
            <ListRow
              key={row[1]}
              icon={row[0]}
              title={row[1]}
              subtitle={row[2]}
              green
              onPress={() => onSupportSelect(row[3])}
            />
          ))}
        </Section>

        <Pressable onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
      <Modal
        visible={isEditOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.editSheet,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.line,
              },
            ]}
          >
            <View style={styles.editHeader}>
              <View>
                <Text style={[styles.editEyebrow, { color: themeColors.muted }]}>
                  Profile
                </Text>
                <Text style={[styles.editTitle, { color: themeColors.cardText }]}>
                  Update your details
                </Text>
              </View>
              <Pressable
                onPress={() => setIsEditOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <ProfileInput
              label="Name"
              value={profileForm.name}
              onChangeText={name =>
                setProfileForm(current => ({
                  ...current,
                  name,
                }))
              }
            />
            <ProfileInput
              label="Phone"
              value={profileForm.phone}
              onChangeText={phone =>
                setProfileForm(current => ({
                  ...current,
                  phone,
                }))
              }
            />
            <ProfileInput
              label="Email"
              value={profileForm.email}
              onChangeText={email =>
                setProfileForm(current => ({
                  ...current,
                  email,
                }))
              }
            />
            <View
              style={[
                styles.photoPreviewRow,
                {
                  backgroundColor: themeColors.input,
                  borderColor: themeColors.line,
                },
              ]}
            >
              <View style={styles.photoPreview}>
                {getAvatarPreviewUri(profileForm.avatar) ? (
                  <Image
                    source={{
                      uri: getAvatarPreviewUri(profileForm.avatar),
                    }}
                    style={styles.photoPreviewImage}
                  />
                ) : (
                  <Text style={styles.photoPreviewText}>R</Text>
                )}
              </View>
              <View style={styles.photoCopy}>
                <Text style={[styles.photoTitle, { color: themeColors.cardText }]}>
                  Profile photo
                </Text>
                <Text style={[styles.photoSub, { color: themeColors.muted }]}>
                  Tap below to upload from your phone
                </Text>
              </View>
            </View>
            <Pressable
              disabled={isUploadingImage}
              onPress={chooseProfileImage}
              style={[
                styles.uploadButton,
                isUploadingImage ? styles.disabledButton : undefined,
              ]}
            >
              <Text style={styles.uploadText}>
                {isUploadingImage
                  ? 'Uploading photo...'
                  : 'Choose Photo From Phone'}
              </Text>
            </Pressable>
            <ProfileInput
              label="Delivery address"
              multiline
              value={profileForm.address}
              onChangeText={address =>
                setProfileForm(current => ({
                  ...current,
                  address,
                  latitude: undefined,
                  liveAddress: address,
                  longitude: undefined,
                }))
              }
            />
            <Pressable
              disabled={isLocating || isSaving || isUploadingImage}
              onPress={useCurrentLocationForProfile}
              style={[
                styles.locationButton,
                isLocating || isSaving || isUploadingImage
                  ? styles.disabledButton
                  : undefined,
              ]}
            >
              <Text style={styles.locationButtonText}>
                {isLocating
                  ? 'Fetching current location...'
                  : 'Choose Current Location'}
              </Text>
            </Pressable>
            <Pressable
              disabled={isSaving || isUploadingImage}
              onPress={saveProfile}
              style={[
                styles.saveButton,
                isSaving || isUploadingImage ? styles.disabledButton : undefined,
              ]}
            >
              <Text style={styles.saveText}>
                {isSaving
                  ? 'Saving...'
                  : isUploadingImage
                  ? 'Uploading photo...'
                  : 'Save Profile'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <BottomNav
        activeTab="profile"
        bottomInset={bottomInset}
        onNavigate={onNavigate}
      />
    </View>
  );
}
function ProfileInput({ label, multiline, onChangeText, value }) {
  const { themeColors } = useTheme();
  return (
    <View style={styles.inputBlock}>
      <Text style={[styles.inputLabel, { color: themeColors.cardText }]}>
        {label}
      </Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholderTextColor={themeColors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: themeColors.input,
            borderColor: themeColors.line,
            color: themeColors.text,
          },
          multiline ? styles.textArea : undefined,
        ]}
        value={value}
      />
    </View>
  );
}
function ProfileStat({ value, label }) {
  const { themeColors } = useTheme();
  return (
    <View style={styles.profileStat}>
      <Text style={styles.profileStatValue}>{value}</Text>
      <Text style={[styles.profileStatLabel, { color: themeColors.muted }]}>
        {label}
      </Text>
    </View>
  );
}
function Section({ title, children }) {
  const { themeColors } = useTheme();
  return (
    <>
      <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>
        {title}
      </Text>
      <View
        style={[
          styles.listCard,
          { backgroundColor: themeColors.card, borderColor: themeColors.line },
        ]}
      >
        {children}
      </View>
    </>
  );
}
function ListRow({ icon, title, subtitle, soft, green, onPress }) {
  const { themeColors } = useTheme();
  const isImageIcon = typeof icon === 'number' || Boolean(icon?.uri);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.listRow, { borderBottomColor: themeColors.line }]}
    >
      <View
        style={[
          styles.listIcon,
          soft ? styles.softIcon : undefined,
          green ? styles.greenIcon : undefined,
        ]}
      >
        {isImageIcon ? (
          <Image
            source={icon}
            style={[
              styles.listIconImage,
              green ? styles.greenIconImage : styles.orangeIconImage,
            ]}
          />
        ) : (
          <Text style={styles.listIconText}>{icon}</Text>
        )}
      </View>
      <View style={styles.listCopy}>
        <Text style={[styles.listTitle, { color: themeColors.text }]}>
          {title}
        </Text>
        <Text style={[styles.listSubtitle, { color: themeColors.muted }]}>
          {subtitle}
        </Text>
      </View>
      <Text style={[styles.chevron, { color: themeColors.muted }]}>›</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: 18,
  },
  profileHero: {
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingBottom: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: colors.orange,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCircle: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  editIcon: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
  headerIconImage: {
    width: 17,
    height: 17,
    resizeMode: 'contain',
    tintColor: '#fff',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  profileAvatar: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 28,
    borderWidth: 4,
    borderColor: '#ffb58f',
    borderRadius: 44,
    backgroundColor: '#fff',
  },
  profileAvatarPress: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 44,
  },
  profileAvatarText: {
    fontSize: 50,
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: 4,
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  cameraBadgeIcon: {
    width: 13,
    height: 13,
    resizeMode: 'contain',
    tintColor: colors.orange,
  },
  profileName: {
    marginTop: 14,
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  memberSince: {
    marginTop: 5,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    marginTop: -28,
    marginHorizontal: 18,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  profileStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  profileStatValue: {
    color: colors.orange,
    fontSize: 18,
    fontWeight: '900',
  },
  profileStatLabel: {
    marginTop: 5,
    color: '#666',
    fontSize: 11,
  },
  activityCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#ffc7b0',
    borderRadius: 16,
    backgroundColor: '#fff4ee',
  },
  activityLabel: {
    color: colors.orange,
    fontSize: 11,
    fontWeight: '900',
  },
  activityTitle: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  activityMeta: {
    marginTop: 4,
    color: '#777',
    fontSize: 11,
    fontWeight: '700',
  },
  activityAmount: {
    color: colors.orange,
    fontSize: 16,
    fontWeight: '900',
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  listCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  listRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  listIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#fff2c3',
  },
  softIcon: {
    backgroundColor: '#fff0e8',
  },
  greenIcon: {
    backgroundColor: '#e9fbef',
  },
  listIconText: {
    fontSize: 16,
  },
  listIconImage: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  orangeIconImage: {
    tintColor: colors.orange,
  },
  greenIconImage: {
    tintColor: '#19a35b',
  },
  listCopy: {
    flex: 1,
  },
  listTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  listSubtitle: {
    marginTop: 3,
    color: '#777',
    fontSize: 11,
  },
  chevron: {
    color: '#777',
    fontSize: 20,
  },
  logoutButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffc3b5',
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  logoutText: {
    color: '#e91919',
    fontSize: 13,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.46)',
  },
  editSheet: {
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 26,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#fff',
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  editEyebrow: {
    color: '#777',
    fontSize: 11,
    fontWeight: '900',
  },
  editTitle: {
    marginTop: 3,
    color: '#202332',
    fontSize: 20,
    fontWeight: '900',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#fff3ed',
  },
  closeText: {
    color: colors.orange,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  inputBlock: {
    gap: 6,
  },
  inputLabel: {
    color: '#4d5568',
    fontSize: 12,
    fontWeight: '900',
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    color: '#202332',
    backgroundColor: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  textArea: {
    minHeight: 78,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  photoPreviewRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  photoPreview: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: '#edf1f4',
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  photoPreviewText: {
    color: '#50606d',
    fontSize: 20,
    fontWeight: '900',
  },
  photoCopy: {
    flex: 1,
  },
  photoTitle: {
    color: '#202332',
    fontSize: 13,
    fontWeight: '900',
  },
  photoSub: {
    marginTop: 3,
    color: '#777',
    fontSize: 11,
    fontWeight: '700',
  },
  saveButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: colors.orange,
  },
  uploadButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffc3b5',
    borderRadius: 12,
    backgroundColor: '#fff6f1',
  },
  uploadText: {
    color: colors.orange,
    fontSize: 13,
    fontWeight: '900',
  },
  locationButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffc3b5',
    borderRadius: 12,
    backgroundColor: '#fff6f1',
  },
  locationButtonText: {
    color: colors.orange,
    fontSize: 13,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.62,
  },
  saveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
});
