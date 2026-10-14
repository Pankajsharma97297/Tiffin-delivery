import React, { useEffect, useMemo, useState } from 'react';
import {
  AppState,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useTheme } from '../context/ThemeContext';
import {
  fetchHomeData,
  submitHomeChefChangeRequest,
} from '../services/homeApi';
import { colors } from '../theme/colors';
import { Icons } from '../theme/images';
const defaultChangeSettings = {
  title: '',
  subtitle: '',
  description: '',
  sheetDescription: '',
  successMessage: '',
  expectedResolution: '',
  reasons: [],
  isEnabled: false,
};
const detailBottomNavOffset = bottomInset => Math.max(76, bottomInset + 52);

export function HomeChefScreen({
  topInset,
  bottomInset,
  onBack,
  onReviews,
  onSubscribe,
}) {
  const { themeColors } = useTheme();
  const [showChangeSheet, setShowChangeSheet] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [assignedChef, setAssignedChef] = useState(null);
  const [changeSettings, setChangeSettings] = useState(defaultChangeSettings);
  const [latestRequest, setLatestRequest] = useState(null);
  const [homeChefChoices, setHomeChefChoices] = useState([]);
  const [requestedChefId, setRequestedChefId] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [loadingChef, setLoadingChef] = useState(true);
  const ctaBottomOffset = detailBottomNavOffset(bottomInset);
  useEffect(() => {
    let mounted = true;
    const loadChefData = () => {
      fetchHomeData()
        .then(data => {
          if (mounted && data.assignedChef) {
            setAssignedChef(data.assignedChef);
          }
          if (mounted && data.homeChefChange?.settings) {
            setChangeSettings({
              ...defaultChangeSettings,
              ...data.homeChefChange.settings,
              reasons: data.homeChefChange.settings.reasons || [],
            });
            setLatestRequest(data.homeChefChange.latestRequest || null);
          }
          if (mounted) {
            setHomeChefChoices(data.nearbyChefs || []);
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (mounted) {
            setLoadingChef(false);
          }
        });
    };
    loadChefData();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        loadChefData();
      }
    });
    const interval = setInterval(loadChefData, 10000);
    return () => {
      mounted = false;
      subscription.remove();
      clearInterval(interval);
    };
  }, []);
  const weeklyMenu = useMemo(
    () => assignedChef?.weeklyMenu || [],
    [assignedChef?.weeklyMenu],
  );
  const previewMenu = useMemo(
    () =>
      (assignedChef?.sampleMenu || [])
        .filter(item => item.isAvailable !== false)
        .map(item => ({
          icon: item.icon || '',
          title: item.title,
          items: item.items || '',
          price: item.price || assignedChef?.price?.replace('/meal', '') || '',
        })),
    [assignedChef?.price, assignedChef?.sampleMenu],
  );
  const [ownerName, kitchenName] = String(assignedChef?.name || '')
    .split('·')
    .map(part => part.trim());
  const displayOwner = assignedChef?.owner || ownerName || '';
  const displayKitchen =
    assignedChef?.kitchenName ||
    kitchenName ||
    assignedChef?.name ||
    '';
  const displayRating =
    assignedChef?.ratingValue ||
    String(assignedChef?.rating || '').match(/\d+(\.\d+)?/)?.[0] ||
    '';
  const reviewCount = assignedChef?.reviewCount ?? 0;
  const displayDistance = assignedChef?.distance || '';
  const displayLocation =
    assignedChef?.liveAddress ||
    assignedChef?.address ||
    assignedChef?.location ||
    '';
  const displayTime = assignedChef?.time || '';
  const displayAbout =
    assignedChef?.about || '';
  const availableChefChoices = useMemo(
    () =>
      homeChefChoices.filter(chef => chef._id && chef._id !== assignedChef?._id),
    [assignedChef?._id, homeChefChoices],
  );
  const closeSheet = () => {
    setShowChangeSheet(false);
    setSubmitted(false);
    setSelectedReason(null);
    setRequestedChefId('');
    setRequestError('');
    setSubmittingRequest(false);
  };
  const handleSubmitChangeRequest = async () => {
    if (!selectedReason || submittingRequest) {
      return;
    }
    setSubmittingRequest(true);
    setRequestError('');
    try {
      const requestedChef = availableChefChoices.find(
        chef => chef._id === requestedChefId,
      );
      const result = await submitHomeChefChangeRequest({
        chefId: assignedChef?._id,
        chefName: displayKitchen,
        requestedChefId: requestedChef?._id,
        requestedChefName: requestedChef?.name,
        reason: selectedReason,
      });
      setLatestRequest(result.request);
      setSubmitted(true);
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : 'Unable to submit request',
      );
    } finally {
      setSubmittingRequest(false);
    }
  };
  return (
    <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: ctaBottomOffset + 104,
          },
        ]}
        showsVerticalScrollIndicator
      >
        <View
          style={[
            styles.heroImage,
            {
              paddingTop: Math.max(52, topInset + 18),
            },
          ]}
        >
          <Pressable onPress={onBack} style={styles.backCircle}>
            <ArrowLeftIcon />
          </Pressable>
          <View style={styles.foodStrip}>
            {weeklyMenu.slice(0, 3).map((meal, index) => (
              <Text key={`${meal.day}-${index}`} style={styles.foodBig}>
                {meal.icon || '🍱'}
              </Text>
            ))}
          </View>
          {assignedChef?.badge || assignedChef?.status ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                ★ {assignedChef.badge || assignedChef.status}
              </Text>
            </View>
          ) : null}
        </View>

        {assignedChef ? (
          <View
            style={[
              styles.chefCard,
              { backgroundColor: themeColors.card, borderColor: themeColors.line },
            ]}
          >
            <View style={styles.avatarWrap}>
              <Text style={styles.avatar}>{assignedChef.image || '👤'}</Text>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.chefCopy}>
              <Text style={[styles.chefName, { color: themeColors.text }]}>{displayOwner}</Text>
              <Text style={[styles.chefMeta, { color: themeColors.muted }]}>
                HomeChef · {displayKitchen}
              </Text>
              <Text style={styles.stars}>
                {displayRating ? '★★★★★ ' : ''}
                {displayRating ? (
                  <Text style={[styles.reviewMeta, { color: themeColors.muted }]}>
                    {displayRating} ({reviewCount} reviews)
                  </Text>
                ) : null}
              </Text>
              {displayLocation || displayDistance ? (
                <Text style={[styles.location, { color: themeColors.muted }]}>
                  ⌖{' '}
                  {[displayLocation, displayDistance]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              ) : null}
            </View>
            <View style={[styles.statsLine, { backgroundColor: themeColors.line }]} />
            <View style={styles.statRow}>
              <Stat value={assignedChef.experience || '-'} label="Experience" />
              <Stat
                value={assignedChef.subscribers || '-'}
                label="Subscribers"
              />
              <Stat value={displayTime || '-'} label="Delivery" />
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>No assigned HomeChef available.</Text>
        )}

        {displayAbout ? (
          <>
            <SectionTitle title="About" />
            <View
              style={[
                styles.aboutCard,
                { backgroundColor: themeColors.card, borderColor: themeColors.line },
              ]}
            >
              <Text style={[styles.aboutText, { color: themeColors.muted }]}>
                {displayAbout}
              </Text>
            </View>
          </>
        ) : null}

        {assignedChef?.fssaiStatus ||
        assignedChef?.foodType ||
        assignedChef?.achievement ||
        assignedChef?.hygieneRating ? (
          <>
            <SectionTitle title="Certifications & Hygiene" />
            <View style={styles.certGrid}>
              {assignedChef?.fssaiStatus ? (
                <Cert
                  icon={Icons.Shield}
                  title="FSSAI"
                  subtitle={assignedChef.fssaiStatus}
                  green
                />
              ) : null}
              {assignedChef?.foodType ? (
                <Cert icon="🌿" title={assignedChef.foodType} subtitle="" green />
              ) : null}
              {assignedChef?.achievement ? (
                <Cert icon="🏅" title={assignedChef.achievement} subtitle="" />
              ) : null}
              {assignedChef?.hygieneRating ? (
                <Cert
                  icon="♡"
                  title="Hygiene Rating"
                  subtitle={assignedChef.hygieneRating}
                  peach
                />
              ) : null}
            </View>
          </>
        ) : null}

        <SectionTitle title="Weekly Meal Calendar" />
        <View
          style={[
            styles.calendarCard,
            { backgroundColor: themeColors.card, borderColor: themeColors.line },
          ]}
        >
          {weeklyMenu.length ? (
            weeklyMenu.map(meal => (
              <View
                key={meal.day}
                style={[styles.mealRow, { borderBottomColor: themeColors.line }]}
              >
                <View style={styles.mealIcon}>
                  <Text>{meal.icon || '🍱'}</Text>
                </View>
                <View style={styles.mealCopy}>
                  <Text style={[styles.dayText, { color: themeColors.muted }]}>
                    {meal.day}
                    {meal.mealType ? ` · ${meal.mealType}` : ''}
                  </Text>
                  <Text style={[styles.mealTitle, { color: themeColors.text }]}>{meal.title}</Text>
                  {meal.items ? (
                    <Text style={[styles.mealSub, { color: themeColors.muted }]}>
                      {meal.items}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No weekly menu available.</Text>
          )}
        </View>

        {previewMenu.length ? (
          <>
            <SectionTitle title="Sample Menu" />
            {previewMenu.map(item => (
              <View
                key={item.title}
                style={[
                  styles.menuCard,
                  { backgroundColor: themeColors.card, borderColor: themeColors.line },
                ]}
              >
                <View style={styles.menuPhoto}>
                  <Text style={styles.menuEmoji}>{item.icon}</Text>
                </View>
                <View style={styles.menuCopy}>
                  <Text style={[styles.menuTitle, { color: themeColors.text }]}>{item.title}</Text>
                  {item.items ? (
                    <Text style={[styles.menuSub, { color: themeColors.muted }]}>
                      {item.items}
                    </Text>
                  ) : null}
                  {item.price ? (
                    <Text style={styles.price}>{item.price}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </>
        ) : null}

        <SectionTitle title="Ratings & Reviews" />
        <View
          style={[
            styles.reviewCard,
            { backgroundColor: themeColors.card, borderColor: themeColors.line },
          ]}
        >
          <View style={[styles.ratingSummary, { borderBottomColor: themeColors.line }]}>
            <View style={styles.ratingScoreWrap}>
              <Text style={styles.ratingScore}>{displayRating}</Text>
              <Text style={styles.stars}>★★★★★</Text>
              <Text style={[styles.reviewMeta, { color: themeColors.muted }]}>
                {reviewCount} reviews
              </Text>
            </View>
            <View style={styles.bars}>
              {displayRating ? null : (
                <Text style={styles.emptyText}>No rating breakdown yet.</Text>
              )}
            </View>
          </View>

          <Pressable
            onPress={onReviews}
            style={[
              styles.outlineButton,
              {
                backgroundColor: themeColors.input,
                borderColor: colors.orange,
              },
            ]}
          >
            <Text style={styles.outlineText}>See All Reviews ›</Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.changeCard,
            { backgroundColor: themeColors.card, borderColor: themeColors.line },
          ]}
        >
          <View style={styles.changeIcon}>
            <Text style={styles.changeIconText}>↻</Text>
          </View>
          <View style={styles.changeCopy}>
            <Text style={[styles.changeTitle, { color: themeColors.text }]}>{changeSettings.title}</Text>
            <Text style={[styles.changeSub, { color: themeColors.muted }]}>
              {changeSettings.subtitle}
            </Text>
          </View>
          <Text style={[styles.changeBody, { color: themeColors.muted }]}>
            {changeSettings.description}
          </Text>
          {latestRequest ? (
            <View style={styles.inlineStatusBox}>
              <Text style={styles.statusTitle}>Latest Request</Text>
              <Text style={styles.statusLine}>● {latestRequest.status}</Text>
              <Text style={styles.statusReason}>
                Reason: {latestRequest.reason}
              </Text>
              <Text style={styles.statusReason}>
                Preferred: {latestRequest.requestedChefName || 'No preference'}
              </Text>
            </View>
          ) : null}
          <Pressable
            disabled={!changeSettings.isEnabled}
            onPress={() => setShowChangeSheet(true)}
            style={[
              styles.requestButton,
              {
                backgroundColor: themeColors.input,
                borderColor: colors.orange,
              },
              !changeSettings.isEnabled ? styles.disabledButton : undefined,
            ]}
          >
            <Text
              style={[
                styles.requestText,
                !changeSettings.isEnabled ? styles.disabledText : undefined,
              ]}
            >
              {changeSettings.isEnabled
                ? 'Request Change'
                : 'Requests Disabled'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View
        style={[
          styles.stickyCta,
          {
            bottom: ctaBottomOffset,
            backgroundColor: themeColors.surface,
            borderTopColor: themeColors.line,
          },
        ]}
      >
        <Pressable
          disabled={!assignedChef}
          onPress={onSubscribe}
          style={[
            styles.subscribeButton,
            !assignedChef ? styles.disabledButton : undefined,
          ]}
        >
          <Text style={styles.subscribeText}>
            {loadingChef
              ? 'Loading HomeChef...'
              : assignedChef
              ? 'Subscribe to This HomeChef'
              : 'No HomeChef Available'}
          </Text>
        </Pressable>
      </View>

      {showChangeSheet ? (
        <View style={styles.overlay}>
          <Pressable style={styles.overlayBackdrop} onPress={closeSheet} />
          <View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(22, bottomInset + 14),
                backgroundColor: themeColors.card,
              },
            ]}
          >
            {!submitted ? (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: themeColors.text }]}>Change HomeChef</Text>
                  <Pressable onPress={closeSheet} style={styles.closeButton}>
                    <Text style={[styles.closeText, { color: themeColors.text }]}>×</Text>
                  </Pressable>
                </View>
                <ScrollView
                  style={styles.sheetScroll}
                  contentContainerStyle={styles.sheetScrollContent}
                  showsVerticalScrollIndicator
                >
                  <Text style={[styles.sheetBody, { color: themeColors.muted }]}>
                    {changeSettings.sheetDescription}
                  </Text>
                  <Text style={[styles.sheetLabel, { color: themeColors.text }]}>Preferred HomeChef</Text>
                  <View style={styles.choiceList}>
                    <Pressable
                      onPress={() => setRequestedChefId('')}
                      style={[
                        styles.choiceRow,
                        !requestedChefId ? styles.choiceSelected : undefined,
                        {
                          backgroundColor: !requestedChefId
                            ? themeColors.cardHighlight
                            : themeColors.input,
                          borderColor: !requestedChefId
                            ? colors.orange
                            : themeColors.line,
                        },
                      ]}
                    >
                      <View>
                        <Text style={[styles.choiceTitle, { color: themeColors.text }]}>No preference</Text>
                        <Text style={[styles.choiceMeta, { color: themeColors.muted }]}>
                          Admin can assign the best available kitchen
                        </Text>
                      </View>
                      <Text style={styles.choiceCheck}>
                        {!requestedChefId ? '✓' : ''}
                      </Text>
                    </Pressable>
                    {availableChefChoices.map(chef => {
                      const selected = requestedChefId === chef._id;
                      return (
                        <Pressable
                          key={chef._id || chef.name}
                          onPress={() => setRequestedChefId(chef._id || '')}
                          style={[
                            styles.choiceRow,
                            selected ? styles.choiceSelected : undefined,
                            {
                              backgroundColor: selected
                                ? themeColors.cardHighlight
                                : themeColors.input,
                              borderColor: selected
                                ? colors.orange
                                : themeColors.line,
                            },
                          ]}
                        >
                          <Text style={styles.choiceIcon}>
                            {chef.image || '🍱'}
                          </Text>
                          <View style={styles.choiceCopy}>
                            <Text style={[styles.choiceTitle, { color: themeColors.text }]}>
                              {chef.name || 'HomeChef Kitchen'}
                            </Text>
                            <Text style={[styles.choiceMeta, { color: themeColors.muted }]}>
                              {chef.owner ? `${chef.owner} · ` : ''}
                              {chef.cuisine || 'Home Style'} ·{' '}
                              {chef.price || '₹89/meal'}
                            </Text>
                          </View>
                          <Text style={styles.choiceCheck}>
                            {selected ? '✓' : ''}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {!availableChefChoices.length ? (
                      <Text style={[styles.choiceEmpty, { color: themeColors.muted }]}>
                        No other HomeChefs are available right now.
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.sheetLabel, { color: themeColors.text }]}>Select Reason</Text>
                  {changeSettings.reasons.map(reason => {
                    const selected = selectedReason === reason;
                    return (
                      <Pressable
                        key={reason}
                        onPress={() => setSelectedReason(reason)}
                        style={[
                          styles.reasonRow,
                          selected ? styles.reasonSelected : undefined,
                          {
                            backgroundColor: selected
                              ? themeColors.cardHighlight
                              : themeColors.input,
                            borderColor: selected ? colors.orange : themeColors.line,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.reasonRadio,
                            selected ? styles.reasonRadioOn : undefined,
                          ]}
                        />
                        <Text
                          style={[
                            styles.reasonText,
                            { color: themeColors.text },
                            selected ? styles.reasonTextOn : undefined,
                          ]}
                        >
                          {reason}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Pressable
                  disabled={!selectedReason || submittingRequest}
                  onPress={handleSubmitChangeRequest}
                  style={[
                    styles.sheetSubmit,
                    !selectedReason || submittingRequest
                      ? styles.disabledButton
                      : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.sheetSubmitText,
                      !selectedReason || submittingRequest
                        ? styles.disabledText
                        : undefined,
                    ]}
                  >
                    {submittingRequest ? 'Submitting...' : 'Submit Request'}
                  </Text>
                </Pressable>
                {requestError ? (
                  <Text style={styles.errorText}>{requestError}</Text>
                ) : null}
              </>
            ) : (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: themeColors.text }]}>Request Submitted</Text>
                  <Pressable onPress={closeSheet} style={styles.closeButton}>
                    <Text style={[styles.closeText, { color: themeColors.text }]}>×</Text>
                  </Pressable>
                </View>
                <View style={styles.successCircle}>
                  <Text style={styles.successCheck}>✓</Text>
                </View>
                <Text style={[styles.successTitle, { color: themeColors.text }]}>Request Submitted!</Text>
                <Text style={[styles.successBody, { color: themeColors.muted }]}>
                  {changeSettings.successMessage}
                </Text>
                <View style={styles.statusBox}>
                  <Text style={styles.statusTitle}>Request Status</Text>
                  <Text style={styles.statusLine}>
                    ● {latestRequest?.status || 'Pending Admin Approval'}
                  </Text>
                  <Text style={styles.statusReason}>
                    Reason: {latestRequest?.reason || selectedReason}
                  </Text>
                  <Text style={styles.statusReason}>
                    Preferred:{' '}
                    {latestRequest?.requestedChefName || 'No preference'}
                  </Text>
                </View>
                <Pressable onPress={closeSheet} style={styles.doneButton}>
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}
function SectionTitle({ title }) {
  const { themeColors } = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>
      {title}
    </Text>
  );
}
function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function Cert({ icon, title, subtitle, green, peach }) {
  const { themeColors } = useTheme();
  const isImageIcon = typeof icon === 'number' || Boolean(icon?.uri);
  return (
    <View
      style={[
        styles.certCard,
        green ? styles.certGreen : undefined,
        peach ? styles.certPeach : undefined,
      ]}
    >
      <View style={styles.certIcon}>
        {isImageIcon ? (
          <Image source={icon} style={styles.certIconImage} />
        ) : (
          <Text>{icon}</Text>
        )}
      </View>
      <View>
        <Text style={[styles.certTitle, { color: themeColors.text }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.certSub, { color: themeColors.text }]}>
            {subtitle}
          </Text>
        ) : null}
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
  heroImage: {
    minHeight: 210,
    marginHorizontal: -18,
    paddingHorizontal: 18,
    overflow: 'hidden',
    backgroundColor: '#d4a46e',
  },
  backCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  foodStrip: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    flexDirection: 'row',
    gap: 8,
    opacity: 0.92,
  },
  foodBig: {
    fontSize: 54,
  },
  badge: {
    position: 'absolute',
    right: 18,
    top: 58,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: colors.yellow,
  },
  badgeText: {
    color: '#7a4b00',
    fontSize: 12,
    fontWeight: '900',
  },
  chefCard: {
    marginTop: -50,
    marginHorizontal: 18,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 5,
  },
  avatarWrap: {
    position: 'absolute',
    left: 18,
    top: 18,
  },
  avatar: {
    width: 82,
    height: 82,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#e0f5ff',
    fontSize: 48,
    lineHeight: 82,
    textAlign: 'center',
  },
  onlineDot: {
    position: 'absolute',
    right: -5,
    bottom: 5,
    width: 24,
    height: 24,
    borderWidth: 4,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: colors.green,
  },
  chefCopy: {
    minHeight: 92,
    paddingLeft: 100,
  },
  chefName: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  chefMeta: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  stars: {
    marginTop: 6,
    color: colors.yellow,
    fontSize: 13,
    fontWeight: '900',
  },
  smallStars: {
    marginTop: 3,
    color: colors.yellow,
    fontSize: 12,
    fontWeight: '900',
  },
  reviewMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  location: {
    marginTop: 7,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  statsLine: {
    height: 1,
    marginTop: 16,
    backgroundColor: colors.line,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 18,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.orange,
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 9,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    paddingVertical: 16,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  aboutCard: {
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  aboutText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 25,
  },
  certGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  certCard: {
    width: '48%',
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f5d693',
    borderRadius: 14,
    backgroundColor: '#fff8df',
  },
  certGreen: {
    borderColor: '#b8e3ad',
    backgroundColor: '#ebfae5',
  },
  certPeach: {
    borderColor: '#ffc4b0',
    backgroundColor: '#fff0e8',
  },
  certIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  certIconImage: {
    width: 19,
    height: 19,
    resizeMode: 'contain',
    tintColor: '#11833a',
  },
  certTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  certSub: {
    marginTop: 2,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  calendarCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  mealRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  mealIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#fff0e8',
  },
  mealCopy: {
    flex: 1,
  },
  dayText: {
    color: '#777',
    fontSize: 13,
    fontWeight: '900',
  },
  mealTitle: {
    marginTop: 3,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  mealSub: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 90,
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  menuPhoto: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#e9f6ff',
  },
  menuEmoji: {
    fontSize: 38,
  },
  menuCopy: {
    flex: 1,
  },
  menuTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  menuSub: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  price: {
    marginTop: 6,
    color: colors.orange,
    fontSize: 17,
    fontWeight: '900',
  },
  reviewCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  ratingSummary: {
    flexDirection: 'row',
    gap: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  ratingScoreWrap: {
    width: 94,
    alignItems: 'center',
  },
  ratingScore: {
    color: colors.orange,
    fontSize: 40,
    fontWeight: '900',
  },
  bars: {
    flex: 1,
    gap: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  barLabel: {
    width: 24,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
  },
  barTrack: {
    flex: 1,
    height: 6,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: '#f2ebe3',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.yellow,
  },
  barPercent: {
    width: 30,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  customerReview: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 15,
  },
  customerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    fontSize: 25,
    lineHeight: 38,
    textAlign: 'center',
  },
  customerCopy: {
    flex: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  customerName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  reviewText: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  helpful: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  outlineButton: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ffb9a5',
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  outlineText: {
    color: colors.orange,
    fontSize: 14,
    fontWeight: '900',
  },
  changeCard: {
    marginTop: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  changeIcon: {
    position: 'absolute',
    left: 18,
    top: 18,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#fff0d9',
  },
  changeIconText: {
    color: colors.orange,
    fontSize: 24,
    fontWeight: '900',
  },
  changeCopy: {
    paddingLeft: 58,
  },
  changeTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  changeSub: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  changeBody: {
    marginTop: 18,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  inlineStatusBox: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffd36d',
    borderRadius: 12,
    backgroundColor: '#fff9df',
  },
  requestButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#ffb9a5',
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  requestText: {
    color: colors.orange,
    fontSize: 15,
    fontWeight: '900',
  },
  stickyCta: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: 'rgba(251,247,241,0.96)',
  },
  subscribeButton: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.orange,
  },
  subscribeText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    maxHeight: '86%',
    padding: 22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#fff',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.yellow,
  },
  closeText: {
    color: colors.ink,
    fontSize: 26,
    lineHeight: 30,
  },
  sheetScroll: {
    flexShrink: 1,
    marginTop: 18,
  },
  sheetScrollContent: {
    paddingBottom: 8,
  },
  sheetBody: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 23,
  },
  sheetLabel: {
    marginTop: 20,
    marginBottom: 10,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  choiceList: {
    gap: 9,
  },
  choiceRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  choiceSelected: {
    borderColor: colors.orange,
    backgroundColor: '#fff5ef',
  },
  choiceIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff0e8',
    fontSize: 22,
    lineHeight: 38,
    textAlign: 'center',
  },
  choiceCopy: {
    flex: 1,
  },
  choiceTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  choiceMeta: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  choiceCheck: {
    marginLeft: 'auto',
    color: colors.orange,
    fontSize: 18,
    fontWeight: '900',
  },
  choiceEmpty: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  reasonRow: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    paddingHorizontal: 17,
    borderWidth: 1,
    borderColor: colors.yellow,
    borderRadius: 12,
    backgroundColor: colors.yellow,
  },
  reasonSelected: {
    borderColor: colors.orange,
    backgroundColor: '#fff5ef',
  },
  reasonRadio: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 9,
  },
  reasonRadioOn: {
    borderWidth: 5,
    borderColor: colors.orange,
  },
  reasonText: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  reasonTextOn: {
    color: colors.orange,
  },
  sheetSubmit: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: colors.orange,
  },
  sheetSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  disabledButton: {
    backgroundColor: '#f3ece4',
  },
  disabledText: {
    color: '#777',
  },
  errorText: {
    marginTop: 10,
    color: '#d24b22',
    fontSize: 13,
    fontWeight: '800',
  },
  successCircle: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 36,
    borderRadius: 40,
    backgroundColor: '#d9fae5',
  },
  successCheck: {
    color: '#0aa84f',
    fontSize: 36,
    fontWeight: '900',
  },
  successTitle: {
    marginTop: 20,
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  successBody: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 25,
    textAlign: 'center',
  },
  statusBox: {
    marginTop: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.yellow,
    borderRadius: 14,
    backgroundColor: '#fff9df',
  },
  statusTitle: {
    color: '#bf4c00',
    fontSize: 14,
    fontWeight: '900',
  },
  statusLine: {
    marginTop: 8,
    color: '#bf4c00',
    fontSize: 14,
    fontWeight: '800',
  },
  statusReason: {
    marginTop: 8,
    color: '#bf4c00',
    fontSize: 12,
    fontWeight: '700',
  },
  doneButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: colors.orange,
  },
  doneText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
});
