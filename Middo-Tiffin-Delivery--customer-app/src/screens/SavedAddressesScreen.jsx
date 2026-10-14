import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useTheme } from '../context/ThemeContext';
import { fetchHomeData } from '../services/homeApi';
import { getCurrentCoordinates, reverseGeocode } from '../services/locationApi';
import { updateCustomerAddresses } from '../services/settingsApi';
import { colors } from '../theme/colors';
import { Icons } from '../theme/images';
export function SavedAddressesScreen({ topInset, bottomInset, onBack }) {
  const { themeColors } = useTheme();
  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  const [customLabel, setCustomLabel] = useState('Home');
  const [customAddress, setCustomAddress] = useState('');
  const identity = useMemo(
    () => ({
      email: customer?.email,
      phone: customer?.phone,
    }),
    [customer?.email, customer?.phone],
  );
  const buildAddresses = data => {
    const stored =
      data.savedAddresses?.filter(item => item.address || item.liveAddress) ||
      [];
    if (stored.length) {
      return stored.map((item, index) => ({
        ...item,
        isDefault: index === 0 || item.isDefault,
      }));
    }
    const address = data.liveAddress || data.address || data.location;
    return address
      ? [
          {
            label: 'Home',
            address,
            liveAddress: address,
            latitude: data.latitude,
            longitude: data.longitude,
            isDefault: true,
          },
        ]
      : [];
  };
  const getReadableAddress = item => {
    const savedText = (item.liveAddress || item.address || '').trim();
    const isCoordinateOnlyAddress =
      /^live location:\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/i.test(
        savedText,
      );
    const isPlaceholder =
      savedText.toLowerCase() === 'current location' ||
      isCoordinateOnlyAddress;
    if (savedText && !isPlaceholder) {
      return savedText;
    }
    return 'Location name unavailable. Add this live location again.';
  };
  const loadAddresses = () => {
    fetchHomeData()
      .then(data => {
        setCustomer(data.customer);
        setAddresses(buildAddresses(data.customer));
      })
      .catch(error => Alert.alert('Unable to load addresses', error.message));
  };
  useEffect(loadAddresses, []);
  const persistAddresses = async nextAddresses => {
    const normalized = nextAddresses.map((item, index) => ({
      ...item,
      isDefault: index === 0,
    }));
    if (!identity.email && !identity.phone) {
      Alert.alert('Address not saved', 'Please sign in and try again.');
      return false;
    }
    try {
      await updateCustomerAddresses(identity, normalized);
      setAddresses(normalized);
      return true;
    } catch (error) {
      Alert.alert('Address not saved', error.message);
      loadAddresses();
      return false;
    }
  };
  const addCurrentAddress = async () => {
    try {
      const coords = await getCurrentCoordinates();
      if (coords.permissionDenied) {
        Alert.alert(
          'Location permission needed',
          'Please allow location permission to save your live delivery address.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      if (coords.latitude == null || coords.longitude == null) {
        Alert.alert(
          'Location unavailable',
          'Please allow location permission and try again so we can save the real address.',
        );
        return;
      }
      const liveAddress = await reverseGeocode(
        coords.latitude,
        coords.longitude,
      );
      const address =
        liveAddress ||
        `Live location: ${coords.latitude.toFixed(
          4,
        )}, ${coords.longitude.toFixed(4)}`;
      const saved = await persistAddresses([
        ...addresses,
        {
          label: addresses.length ? `Address ${addresses.length + 1}` : 'Home',
          address,
          liveAddress: address,
          latitude: coords.latitude,
          longitude: coords.longitude,
          isDefault: addresses.length === 0,
        },
      ]);
      if (!saved) {
        return;
      }
      Alert.alert('Address added', address);
    } catch (error) {
      Alert.alert(
        'Unable to add address',
        error instanceof Error ? error.message : 'Please try again',
      );
    }
  };
  const openNewAddressModal = () => {
    setEditingAddressIndex(null);
    setCustomLabel('Home');
    setCustomAddress('');
    setCustomModalOpen(true);
  };
  const openEditAddressModal = index => {
    const item = addresses[index];
    if (!item) {
      return;
    }
    setEditingAddressIndex(index);
    setCustomLabel(item.label || `Address ${index + 1}`);
    setCustomAddress(item.address || item.liveAddress || '');
    setCustomModalOpen(true);
  };
  const closeAddressModal = () => {
    setCustomModalOpen(false);
    setEditingAddressIndex(null);
  };
  const saveCustomAddress = async () => {
    const address = customAddress.trim();
    if (!address) {
      Alert.alert('Address required', 'Please enter delivery address.');
      return;
    }
    const fallbackLabel =
      editingAddressIndex === null
        ? `Address ${addresses.length + 1}`
        : `Address ${editingAddressIndex + 1}`;
    const label = customLabel.trim() || fallbackLabel;
    let nextAddresses;
    if (editingAddressIndex !== null) {
      nextAddresses = addresses.map((item, index) => {
        if (index !== editingAddressIndex) {
          return item;
        }
        const addressWithoutCoordinates = { ...item };
        delete addressWithoutCoordinates.latitude;
        delete addressWithoutCoordinates.longitude;
        return {
          ...addressWithoutCoordinates,
          label,
          address,
          liveAddress: address,
        };
      });
    } else {
      nextAddresses = [
        {
          label,
          address,
          liveAddress: address,
          isDefault: true,
        },
        ...addresses,
      ];
    }
    const saved = await persistAddresses(nextAddresses);
    if (!saved) {
      return;
    }
    setCustomLabel('Home');
    setCustomAddress('');
    closeAddressModal();
  };
  const selectDefaultAddress = selectedIndex => {
    const selected = addresses[selectedIndex];
    if (!selected) {
      return;
    }
    persistAddresses([
      selected,
      ...addresses.filter((_, index) => index !== selectedIndex),
    ]);
  };
  const deleteAddress = indexToDelete => {
    Alert.alert(
      'Delete address?',
      'This delivery location will be removed from your account.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            persistAddresses(
              addresses.filter((_, index) => index !== indexToDelete),
            ),
        },
      ],
    );
  };
  return (
    <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(38, bottomInset + 26),
          },
        ]}
        showsVerticalScrollIndicator
      >
        <View
          style={[
            styles.hero,
            {
              paddingTop: Math.max(48, topInset + 16),
            },
          ]}
        >
          <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
            <ArrowLeftIcon />
          </Pressable>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Saved Addresses</Text>
            <Text style={styles.heroSubtitle}>Manage delivery locations</Text>
          </View>
        </View>

        <View style={styles.addActions}>
          <Pressable
            onPress={addCurrentAddress}
            style={[styles.addButton, styles.addButtonHalf]}
          >
            <Text style={styles.addIcon}>＋</Text>
            <Text style={styles.addText}>Live Location</Text>
          </Pressable>
          <Pressable
            onPress={openNewAddressModal}
            style={[
              styles.addButton,
              styles.addButtonHalf,
              styles.customButton,
            ]}
          >
            <Text style={[styles.addIcon, styles.customButtonText]}>＋</Text>
            <Text style={[styles.addText, styles.customButtonText]}>
              Custom Address
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>Your Addresses</Text>
        <View style={styles.addressList}>
          {addresses.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No saved address yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap add current address to save your live delivery location.
              </Text>
            </View>
          ) : null}
          {addresses.map((item, index) => (
            <View
              key={`${item._id || item.label || 'address'}-${index}`}
              style={[
                styles.addressCard,
                index === 0 || item.isDefault
                  ? styles.addressCardActive
                  : undefined,
              ]}
            >
              <Pressable
                onPress={() => selectDefaultAddress(index)}
                style={styles.addressDetails}
              >
                <View style={styles.addressIcon}>
                  <Image source={Icons.Location} style={styles.addressIconImage} />
                </View>
                <View style={styles.addressCopy}>
                  <View style={styles.addressTitleRow}>
                    <Text style={[styles.addressTitle, { color: themeColors.text }]}>
                      {item.label || `Address ${index + 1}`}
                    </Text>
                    {item.isDefault || index === 0 ? (
                      <Text style={styles.defaultBadge}>Default</Text>
                    ) : null}
                  </View>
                  <Text style={styles.addressText}>
                    {getReadableAddress(item)}
                  </Text>
                </View>
              </Pressable>
              <View style={styles.addressActions}>
                <Pressable hitSlop={10} onPress={() => openEditAddressModal(index)}>
                  <Text style={styles.more}>Edit</Text>
                </Pressable>
                <Pressable hitSlop={10} onPress={() => deleteAddress(index)}>
                  <Text style={styles.more}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <Modal
        visible={customModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeAddressModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>Delivery address</Text>
                <Text style={styles.modalTitle}>
                  {editingAddressIndex === null
                    ? 'Add delivery location'
                    : 'Edit delivery location'}
                </Text>
              </View>
              <Pressable
                onPress={closeAddressModal}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Label</Text>
            <TextInput
              value={customLabel}
              onChangeText={setCustomLabel}
              placeholder="Home, Office, Hostel..."
              placeholderTextColor="#999"
              style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}
            />

            <Text style={styles.inputLabel}>Full Address</Text>
            <TextInput
              value={customAddress}
              onChangeText={setCustomAddress}
              placeholder="House no, street, sector, city, pincode"
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
              style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, styles.addressInput]}
            />

            <Pressable onPress={saveCustomAddress} style={styles.saveButton}>
              <Text style={styles.saveText}>
                {editingAddressIndex === null
                  ? 'Save & Set Default'
                  : 'Save Changes'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
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
  hero: {
    minHeight: 150,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: colors.orange,
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroCopy: {
    flex: 1,
    paddingTop: 2,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 4,
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  addActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  addButton: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 13,
    backgroundColor: colors.orange,
  },
  addButtonHalf: {
    flex: 1,
  },
  customButton: {
    borderWidth: 1,
    borderColor: colors.orange,
    backgroundColor: '#fff',
  },
  customButtonText: {
    color: colors.orange,
  },
  addIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  addText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  addressList: {
    gap: 13,
  },
  addressCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#eadfd6',
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  addressCardActive: {
    borderColor: colors.orange,
    backgroundColor: '#fff9f4',
  },
  addressIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#fff5c9',
  },
  addressIconImage: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    tintColor: colors.orange,
  },
  addressCopy: {
    flex: 1,
  },
  addressDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  defaultBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#11833a',
    backgroundColor: '#ddf8e7',
    fontSize: 9,
    fontWeight: '900',
  },
  addressText: {
    marginTop: 6,
    color: '#777',
    fontSize: 12,
    lineHeight: 17,
  },
  more: {
    alignSelf: 'flex-start',
    marginTop: 4,
    color: colors.orange,
    fontSize: 12,
    fontWeight: '900',
  },
  emptyCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#eadfd6',
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  emptySubtitle: {
    marginTop: 6,
    color: '#777',
    fontSize: 12,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCard: {
    padding: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalEyebrow: {
    color: '#777',
    fontSize: 11,
    fontWeight: '900',
  },
  modalTitle: {
    marginTop: 3,
    color: '#202433',
    fontSize: 20,
    fontWeight: '900',
  },
  closeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#fff0e8',
  },
  closeText: {
    color: colors.orange,
    fontSize: 24,
    fontWeight: '900',
  },
  inputLabel: {
    marginTop: 10,
    marginBottom: 7,
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '900',
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#eadfd6',
    borderRadius: 13,
    color: '#202433',
    backgroundColor: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  addressInput: {
    minHeight: 106,
    paddingTop: 12,
    lineHeight: 19,
  },
  saveButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    borderRadius: 13,
    backgroundColor: colors.orange,
  },
  saveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
});
