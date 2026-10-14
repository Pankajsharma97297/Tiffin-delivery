import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useTheme } from '../context/ThemeContext';
import {
  fetchSubscriptionCalendar,
  skipSubscriptionMeal,
} from '../services/customerApi';
import { fetchCustomerAppContent } from '../services/appContentApi';
import { submitSubscriptionRequest } from '../services/homeApi';
import { getCurrentCoordinates, reverseGeocode } from '../services/locationApi';
import { colors } from '../theme/colors';
import { Icons } from '../theme/images';
export function SkipMealScreen({ topInset, bottomInset, onBack, onConfirm }) {
  const { themeColors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [changeLocation, setChangeLocation] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCoords, setDeliveryCoords] = useState({});
  const [locatingAddress, setLocatingAddress] = useState(false);
  const [locationSubmitted, setLocationSubmitted] = useState(false);
  const [calendarData, setCalendarData] = useState({
    subscription: null,
    calendar: [],
  });
  const [reasons, setReasons] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const subscription = calendarData.subscription;
  const canConfirm = Boolean(subscription && selectedDate && selectedReason);
  const canSubmitLocation = changeLocation && deliveryAddress.trim().length > 0;
  const mealDates = useMemo(() => {
    const today = new Date();
    return (calendarData.calendar || [])
      .filter(item => item.status !== 'Skipped')
      .map(item => {
        const date = new Date(item.date);
        const isDinner = /dinner/i.test(item.mealType || '');
        const deliveryHour = isDinner ? 19 : 12;
        const cutoff = new Date(date);
        cutoff.setHours(deliveryHour - 4, 0, 0, 0);
        const disabled = new Date() > cutoff || !subscription;
        const title =
          date.toDateString() === today.toDateString()
            ? `Today, ${date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
              })}`
            : date.getDate() === today.getDate() + 1
            ? `Tomorrow, ${date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
              })}`
            : date.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
              });
        return {
          id: item.date,
          title,
          meal: [item.mealTitle, item.mealType].filter(Boolean).join(' · '),
          skip: disabled
            ? 'Past cut-off or outside active plan'
            : `Skip by: ${cutoff.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}`,
          disabled,
        };
      });
  }, [calendarData.calendar, subscription]);
  useEffect(() => {
    Promise.all([
      fetchSubscriptionCalendar(),
      fetchCustomerAppContent(['skipReasons']),
    ])
      .then(([data, content]) => {
        setCalendarData({
          subscription: data.subscription || null,
          calendar: data.calendar || [],
        });
        setReasons(content.skipReasons || []);
      })
      .catch(() => undefined);
  }, []);
  const selectedMeal = mealDates.find(item => item.id === selectedDate);
  const submitLocationChange = async () => {
    if (!canSubmitLocation) {
      return;
    }
    setSubmitting(true);
    try {
      await submitSubscriptionRequest({
        currentAddress:
          subscription?.address ||
          subscription?.location ||
          '',
        mealDate: selectedMeal?.id,
        mealTitle: selectedMeal?.meal,
        newAddress: deliveryAddress.trim(),
        newLatitude: deliveryCoords.latitude,
        newLongitude: deliveryCoords.longitude,
        requestType: 'location_change',
        subscriptionId: subscription?._id,
      });
      setLocationSubmitted(true);
    } catch (error) {
      Alert.alert(
        'Request failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };
  const useCurrentLocationForRequest = async () => {
    setLocatingAddress(true);
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
      setDeliveryAddress(nextAddress);
      setDeliveryCoords({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch (error) {
      Alert.alert(
        'Location failed',
        error instanceof Error ? error.message : 'Unable to use location.',
      );
    } finally {
      setLocatingAddress(false);
    }
  };
  const confirmSkip = async () => {
    if (!canConfirm || !selectedMeal) {
      return;
    }
    setSubmitting(true);
    try {
      await skipSubscriptionMeal({
        mealDate: selectedMeal.id,
        mealTitle: selectedMeal.meal,
        reason: selectedReason || '',
        subscriptionId: subscription?._id,
      });
      onConfirm();
    } catch (error) {
      Alert.alert(
        'Skip failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(116, bottomInset + 96),
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
          <Text style={styles.heroTitle}>Skip a Meal</Text>
          <Text style={styles.heroSubtitle}>
            Choose the meal date you want to skip
          </Text>
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>◷ 4-Hour Cut-off Policy</Text>
          <Text style={styles.warningText}>
            Meals must be skipped at least 4 hours before delivery time.
            Greyed-out slots are past the cut-off and cannot be skipped.
          </Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            ⓘ You can skip up to 4 meals per month. Skipped meals extend your
            plan by 1 day each.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>Select Meal Date</Text>
        <View style={styles.dateList}>
          {mealDates.length ? mealDates.map(date => {
            const selected = selectedDate === date.id;
            return (
              <Pressable
                key={date.id}
                disabled={date.disabled}
                onPress={() => setSelectedDate(date.id)}
                style={[
                  styles.dateCard,
                  selected ? styles.dateCardSelected : undefined,
                  date.disabled ? styles.dateCardDisabled : undefined,
                ]}
              >
                <Text
                  style={[
                    styles.dateIcon,
                    date.disabled ? styles.dateIconDisabled : undefined,
                  ]}
                >
                  🗓️
                </Text>
                <View style={styles.dateCopy}>
                  <View style={styles.dateTitleRow}>
                    <Text
                      style={[
                        styles.dateTitle,
                        date.disabled ? styles.disabledText : undefined,
                      ]}
                    >
                      {date.title}
                    </Text>
                    {date.disabled ? (
                      <Text style={styles.pastBadge}>Past cut-off</Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.dateMeal,
                      date.disabled ? styles.disabledText : undefined,
                    ]}
                  >
                    {date.meal}
                  </Text>
                  <Text
                    style={[
                      styles.dateSkip,
                      date.disabled ? styles.dateSkipDisabled : undefined,
                    ]}
                  >
                    {date.skip}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.radio,
                    selected ? styles.radioSelected : undefined,
                  ]}
                >
                  {selected ? '●' : '○'}
                </Text>
              </Pressable>
            );
          }) : (
            <Text style={styles.emptyText}>No skippable meals available.</Text>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>Reason for skipping</Text>
        <View style={styles.reasonWrap}>
          {reasons.map(reason => (
            <Pressable
              key={reason}
              onPress={() => setSelectedReason(reason)}
              style={[
                styles.reasonChip,
                selectedReason === reason ? styles.reasonSelected : undefined,
              ]}
            >
              <Text
                style={[
                  styles.reasonText,
                  selectedReason === reason
                    ? styles.reasonTextSelected
                    : undefined,
                ]}
              >
                {reason}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>Change Delivery Location</Text>
        <View
          style={[
            styles.locationCard,
            { backgroundColor: themeColors.card, borderColor: themeColors.line },
          ]}
        >
          <Pressable
            onPress={() => setChangeLocation(current => !current)}
            style={styles.locationTop}
          >
            <View style={styles.locationIcon}>
              <Image source={Icons.Location} style={styles.locationIconImage} />
            </View>
            <View style={styles.locationCopy}>
              <Text style={[styles.locationTitle, { color: themeColors.text }]}>Change Delivery Location</Text>
              <Text style={styles.locationSubtitle}>
                For this day only · Admin approval required
              </Text>
            </View>
            <Text
              style={[
                styles.checkbox,
                changeLocation ? styles.checkboxOn : undefined,
              ]}
            >
              {changeLocation ? '✓' : ''}
            </Text>
          </Pressable>

          {changeLocation && locationSubmitted ? (
            <View style={styles.locationSubmitted}>
              <Text style={styles.successCircle}>✓</Text>
              <Text style={[styles.successTitle, { color: themeColors.text }]}>Request Submitted!</Text>
              <Text style={styles.successBody}>
                Your location change request is pending admin approval. You'll
                be notified once approved.
              </Text>
              <View style={styles.pendingCard}>
                <Text style={styles.pendingTitle}>
                  ● Pending Admin Approval
                </Text>
                <Text style={styles.pendingText}>
                  New address: {deliveryAddress}
                </Text>
              </View>
            </View>
          ) : changeLocation ? (
            <View style={styles.locationDetails}>
              <View style={styles.notesCard}>
                <Text style={styles.notesTitle}>ⓘ Important Notes</Text>
                <Text style={styles.notesText}>
                  • Request must be placed 4 hours before delivery
                </Text>
                <Text style={styles.notesText}>
                  • Extra delivery charges may apply
                </Text>
                <Text style={styles.notesText}>
                  • Subject to admin approval
                </Text>
                <Text style={styles.notesText}>
                  • Depends on rider availability
                </Text>
              </View>
              <TextInput
                value={deliveryAddress}
                onChangeText={value => {
                  setDeliveryAddress(value);
                  setDeliveryCoords({});
                }}
                placeholder="Enter new delivery address..."
                placeholderTextColor={themeColors.placeholder}
                style={[
                  styles.addressInput,
                  {
                    backgroundColor: themeColors.input,
                    borderColor: themeColors.line,
                    color: themeColors.text,
                  },
                ]}
              />
              <Pressable
                disabled={locatingAddress || submitting}
                onPress={useCurrentLocationForRequest}
                style={[
                  styles.locationButton,
                  locatingAddress || submitting ? styles.disabledButton : undefined,
                ]}
              >
                <Text
                  style={[
                    styles.locationButtonText,
                    locatingAddress || submitting
                      ? styles.disabledButtonText
                      : undefined,
                  ]}
                >
                  {locatingAddress
                    ? 'Fetching current location...'
                    : 'Choose Current Location'}
                </Text>
              </Pressable>
              <Text style={styles.locationNote}>
                ◷ Must request at least 4 hours before delivery
              </Text>
              <Pressable
                disabled={!canSubmitLocation}
                onPress={submitLocationChange}
                style={[
                  styles.submitRequest,
                  !canSubmitLocation || submitting
                    ? styles.disabledButton
                    : undefined,
                ]}
              >
                <Text
                  style={[
                    styles.submitRequestText,
                    !canSubmitLocation || submitting
                      ? styles.disabledButtonText
                      : undefined,
                  ]}
                >
                  {submitting ? 'Submitting...' : '✈ Submit Request'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={[
          styles.stickyCta,
          {
            backgroundColor: themeColors.surface,
            borderTopColor: themeColors.line,
          },
          {
            bottom: Math.max(0, bottomInset),
          },
        ]}
      >
        <Pressable
          disabled={!canConfirm || submitting}
          onPress={confirmSkip}
          style={[
            styles.confirmButton,
            !canConfirm || submitting ? styles.disabledButton : undefined,
          ]}
        >
          <Text
            style={[
              styles.confirmText,
              !canConfirm || submitting ? styles.disabledButtonText : undefined,
            ]}
          >
            {submitting
              ? 'Submitting...'
              : canConfirm
              ? 'Confirm Skip'
              : 'Select a Reason'}
          </Text>
        </Pressable>
      </View>
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
  heroTitle: {
    marginTop: 28,
    color: '#fff',
    fontSize: 23,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 5,
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  warningCard: {
    marginTop: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ffd15a',
    borderRadius: 14,
    backgroundColor: '#fff9dd',
  },
  warningTitle: {
    color: '#b84a00',
    fontSize: 13,
    fontWeight: '900',
  },
  warningText: {
    marginTop: 7,
    color: '#b84a00',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  infoCard: {
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#9dccff',
    borderRadius: 14,
    backgroundColor: '#eaf4ff',
  },
  infoText: {
    color: '#0059d6',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  dateList: {
    gap: 10,
  },
  emptyText: {
    paddingVertical: 16,
    color: '#777',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  dateCard: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  dateCardSelected: {
    borderColor: colors.orange,
    backgroundColor: '#fff1e9',
  },
  dateCardDisabled: {
    opacity: 0.46,
  },
  dateIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: colors.yellow,
    lineHeight: 42,
    textAlign: 'center',
    fontSize: 18,
  },
  dateIconDisabled: {
    backgroundColor: '#ffd88b',
  },
  dateCopy: {
    flex: 1,
  },
  dateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  disabledText: {
    color: '#777',
  },
  pastBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#ff7a7a',
    backgroundColor: '#ffe9e9',
    fontSize: 9,
    fontWeight: '900',
  },
  dateMeal: {
    marginTop: 4,
    color: '#666',
    fontSize: 12,
  },
  dateSkip: {
    marginTop: 4,
    color: '#666',
    fontSize: 11,
    fontWeight: '700',
  },
  dateSkipDisabled: {
    color: '#ff7575',
  },
  radio: {
    color: '#decfc4',
    fontSize: 20,
  },
  radioSelected: {
    color: colors.orange,
  },
  reasonWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reasonChip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  reasonSelected: {
    borderColor: colors.orange,
    backgroundColor: '#fff5ef',
  },
  reasonText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '700',
  },
  reasonTextSelected: {
    color: colors.orange,
  },
  locationCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  locationTop: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  locationIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#fff0e8',
  },
  locationIconImage: {
    width: 21,
    height: 21,
    resizeMode: 'contain',
    tintColor: colors.orange,
  },
  locationCopy: {
    flex: 1,
  },
  locationTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  locationSubtitle: {
    marginTop: 4,
    color: '#666',
    fontSize: 12,
    lineHeight: 17,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 4,
    overflow: 'hidden',
    color: '#fff',
    backgroundColor: '#fff',
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '900',
  },
  checkboxOn: {
    borderColor: colors.orange,
    backgroundColor: colors.orange,
  },
  locationDetails: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  locationSubmitted: {
    alignItems: 'center',
    padding: 22,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  successCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    color: '#0aa64f',
    backgroundColor: '#ccf7dc',
    lineHeight: 50,
    textAlign: 'center',
    fontSize: 25,
    fontWeight: '900',
  },
  successTitle: {
    marginTop: 14,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  successBody: {
    marginTop: 14,
    color: '#666',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  pendingCard: {
    alignSelf: 'stretch',
    marginTop: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.yellow,
    borderRadius: 12,
    backgroundColor: '#fff9dd',
  },
  pendingTitle: {
    color: '#c65100',
    fontSize: 13,
    fontWeight: '900',
  },
  pendingText: {
    marginTop: 7,
    color: '#c65100',
    fontSize: 12,
  },
  notesCard: {
    padding: 13,
    borderWidth: 1,
    borderColor: colors.yellow,
    borderRadius: 12,
    backgroundColor: '#fff9dd',
  },
  notesTitle: {
    color: '#c65100',
    fontSize: 12,
    fontWeight: '900',
  },
  notesText: {
    marginTop: 6,
    color: '#c65100',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  addressInput: {
    height: 54,
    marginTop: 14,
    paddingHorizontal: 14,
    color: colors.ink,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    fontSize: 14,
    fontWeight: '700',
  },
  locationNote: {
    marginTop: 10,
    color: '#666',
    fontSize: 11,
  },
  locationButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
  submitRequest: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: colors.orange,
  },
  submitRequestText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  stickyCta: {
    position: 'absolute',
    left: 0,
    right: 0,
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  confirmButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.orange,
  },
  confirmText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
  disabledButton: {
    backgroundColor: '#f1ebe4',
  },
  disabledButtonText: {
    color: '#777',
  },
});
