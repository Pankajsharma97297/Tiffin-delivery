import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { PageHeader } from '../components/PageHeader';
import { fetchCustomerAppContent } from '../services/appContentApi';
import { fetchHomeData } from '../services/homeApi';
import { startRazorpayPayment } from '../services/paymentService';
import {
  fetchCustomerPlans,
  purchaseCustomerSubscription,
} from '../services/customerApi';
import { colors } from '../theme/colors';
const getAmountNumber = value =>
  Number(String(value || '').replace(/[^\d.]/g, '')) || 0;
const getPlanDays = plan => {
  const match = `${plan?.name || ''} ${plan?.meals || ''}`.match(
    /(\d+)\s*days?/i,
  );
  return match ? Number(match[1]) : 0;
};
const getActivePlanId = subscription =>
  subscription?.planId || subscription?.plan?._id || subscription?.plan_id || '';
const findPlanForSubscription = (plans = [], subscription) => {
  const activePlanId = String(getActivePlanId(subscription));
  if (activePlanId) {
    const match = plans.find(plan => String(plan._id) === activePlanId);
    if (match) {
      return match;
    }
  }

  const activePlanName = String(subscription?.plan || subscription?.planType || '')
    .trim()
    .toLowerCase();
  return activePlanName
    ? plans.find(
        plan => String(plan.name || '').trim().toLowerCase() === activePlanName,
      )
    : null;
};
export function PlansScreen({
  topInset,
  bottomInset,
  onNavigate,
  onBackHome,
  onOrderPlaced,
}) {
  const { themeColors } = useTheme();
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [homeChefChoices, setHomeChefChoices] = useState([]);
  const [selectedChefId, setSelectedChefId] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const selectedPlan =
    plans.find(plan => String(plan._id) === String(selectedPlanId)) || plans[0];
  const selectedChef =
    homeChefChoices.find(chef => chef._id === selectedChefId) ||
    homeChefChoices[0];
  const selectedDays = getPlanDays(selectedPlan);
  const planTotal = getAmountNumber(selectedPlan?.price);
  const planName = selectedPlan?.name || '';
  const perMealLabel = selectedPlan?.meals || '';
  const hasActiveSubscription = activeSubscription?.status === 'Active';
  const features = useMemo(
    () => [selectedPlan?.meals].filter(Boolean),
    [selectedPlan],
  );
  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchHomeData(),
      fetchCustomerPlans(),
      fetchCustomerAppContent(['paymentMethods']),
    ])
      .then(([data, planData, content]) => {
        if (!mounted) {
          return;
        }
        const backendPlans = planData.plans || [];
        const activePlan = findPlanForSubscription(
          backendPlans,
          data.activeSubscription,
        );
        setPlans(backendPlans);
        setSelectedPlanId(String(activePlan?._id || backendPlans[0]?._id || ''));
        setCustomer(data.customer);
        setActiveSubscription(data.activeSubscription || null);
        const methods = content.paymentMethods || [];
        setPaymentMethods(methods);
        setPaymentMethod(
          data.customer?.walletBalance > 0 && methods.includes('Wallet')
            ? 'Wallet'
            : methods.includes('UPI')
            ? 'UPI'
            : methods[0] || '',
        );
        setDeliveryAddress(
          data.customer?.liveAddress ||
            data.customer?.address ||
            data.customer?.location ||
            '',
        );
        const choices = [
          data.assignedChef
            ? {
                _id: data.assignedChef._id,
                image: data.assignedChef.image,
                name: data.assignedChef.kitchenName || data.assignedChef.name,
                owner: data.assignedChef.owner,
                badge: data.assignedChef.badge || 'Assigned',
                cuisine: data.assignedChef.cuisine,
                tags: data.assignedChef.tags || [],
                rating: data.assignedChef.ratingValue,
                distance: data.assignedChef.distance,
                time: data.assignedChef.time,
                price: data.assignedChef.price,
              }
            : null,
          ...(data.nearbyChefs || []),
        ].filter(Boolean);
        const uniqueChoices = choices.filter(
          (chef, index, list) =>
            list.findIndex(
              item => item._id === chef._id || item.name === chef.name,
            ) === index,
        );
        setHomeChefChoices(uniqueChoices);
        setSelectedChefId(uniqueChoices[0]?._id || '');
      })
      .catch(() => {
        setLocationStatus('Unable to load plans or saved customer data.');
      })
      .finally(() => {
        if (mounted) {
          setPlansLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);
  const getCurrentLocation = () =>
    new Promise(resolve => {
      const geo = global.navigator?.geolocation;
      if (!geo?.getCurrentPosition) {
        setLocationStatus(
          'Current location unavailable. Address will be saved only.',
        );
        resolve({});
        return;
      }
      geo.getCurrentPosition(
        position => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocationStatus(
            `Location captured: ${coords.latitude.toFixed(
              4,
            )}, ${coords.longitude.toFixed(4)}`,
          );
          resolve(coords);
        },
        () => {
          setLocationStatus(
            'Location permission not available. Address will be saved only.',
          );
          resolve({});
        },
        {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 60000,
        },
      );
    });
  const handleSubscribe = async () => {
    if (hasActiveSubscription) {
      setSubscribeStatus(
        `Active subscription already exists until ${
          activeSubscription.renewal || 'expiry'
        }.`,
      );
      return;
    }
    setSubscribing(true);
    setSubscribeStatus('Processing secure test payment...');
    try {
      const payment =
        paymentMethod === 'Wallet'
          ? {
              razorpay_payment_id: `wallet_${Date.now()}`,
            }
          : await startRazorpayPayment({
              amount: selectedPlan?.price || `₹${planTotal}`,
              contact: customer?.phone,
              customerName: customer?.name || '',
              description: planName,
              email: customer?.email,
              paymentMethod,
            });
      setSubscribeStatus(
        `${paymentMethod} payment successful. Creating subscription...`,
      );
      const coords = await getCurrentLocation();
      const result = await purchaseCustomerSubscription({
        address: deliveryAddress,
        latitude: coords.latitude,
        longitude: coords.longitude,
        customer: customer?.name,
        customerEmail: customer?.email,
        customerPhone: customer?.phone,
        homeChefId: selectedChef?._id,
        paymentMethod,
        paymentProvider: paymentMethod === 'Wallet' ? 'Wallet' : 'Razorpay',
        paymentId: payment.razorpay_payment_id,
        planId: selectedPlan?._id,
      });
      setSubscribeStatus(
        `Subscription ${
          result.order?.orderId || ''
        } confirmed · ${paymentMethod}`,
      );
      setActiveSubscription(result.subscription || null);
      setSelectedPlanId(String(result.subscription?.planId || selectedPlan?._id || ''));
      if (result.customer) {
        setCustomer(result.customer);
      }
      const latestHome = await fetchHomeData().catch(() => null);
      if (latestHome?.activeSubscription) {
        setActiveSubscription(latestHome.activeSubscription);
      }
      onOrderPlaced?.(result.order);
    } catch (error) {
      setSubscribeStatus(
        error instanceof Error ? error.message : 'Unable to subscribe',
      );
    } finally {
      setSubscribing(false);
    }
  };
  if (plansLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
        <PageHeader
          title="Choose Your Plan"
          subtitle="Fresh home meals delivered daily by your HomeChef"
          topInset={topInset}
          onBack={onBackHome}
        />
        <View style={styles.simpleLoader}>
          <ActivityIndicator color={colors.orange} size="large" />
        </View>
        <BottomNav
          activeTab="plans"
          bottomInset={bottomInset}
          onNavigate={onNavigate}
        />
      </View>
    );
  }
  return (
    <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(172, bottomInset + 150),
          },
        ]}
        showsVerticalScrollIndicator
      >
        <PageHeader
          title="Choose Your Plan"
          subtitle="Fresh home meals delivered daily by your HomeChef"
          topInset={topInset}
          onBack={onBackHome}
        />

        {!hasActiveSubscription ? (
          <View style={styles.newUserBox}>
            <Text style={styles.newUserTitle}>Start with MIDDO</Text>
            <Text style={styles.newUserText}>
              View meal plans, order a Trial Meal, and experience the service
              before choosing a subscription.
            </Text>
            <View style={styles.newUserActions}>
              <Pressable
                onPress={() => onNavigate('explore')}
                style={styles.trialButton}
              >
                <Text style={styles.trialButtonText}>Purchase Trial Meal</Text>
              </Pressable>
              <Text style={styles.newUserHint}>Meal plans are below</Text>
            </View>
          </View>
        ) : null}

        <StepTitle number="1" title="Choose Subscription Plan" />
        <View style={styles.slotList}>
          {plans.length ? (
            plans.map(plan => {
              const selected = String(selectedPlan?._id) === String(plan._id);
              return (
                <Pressable
                  key={plan._id || plan.name}
                  onPress={() => setSelectedPlanId(String(plan._id))}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected,
                  }}
                  style={[
                    styles.slotCard,
                    selected ? styles.slotActive : undefined,
                    {
                      backgroundColor: selected
                        ? themeColors.cardHighlight
                        : themeColors.card,
                      borderColor: selected ? colors.orange : themeColors.line,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.slotIcon,
                      selected ? styles.slotIconActive : undefined,
                    ]}
                  >
                    <Text>🍱</Text>
                  </View>
                  <View style={styles.slotCopy}>
                    <View style={styles.slotTitleRow}>
                      <Text
                        style={[styles.slotTitle, { color: themeColors.text }]}
                      >
                        {plan.name}
                      </Text>
                    </View>
                    {plan.meals ? (
                      <Text
                        style={[styles.slotMeta, { color: themeColors.muted }]}
                      >
                        {plan.meals}
                      </Text>
                    ) : null}
                    {plan.price ? (
                      <Text
                        style={[styles.slotMeta, { color: themeColors.muted }]}
                      >
                        {plan.price}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.radio,
                      selected ? styles.radioActive : undefined,
                    ]}
                  >
                    {selected ? '⊙' : '○'}
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.locationStatus}>
              No subscription plans available.
            </Text>
          )}
        </View>

        {selectedPlan ? (
          <View
            style={[
              styles.planSummary,
              {
                backgroundColor: themeColors.cardHighlight,
                borderColor: colors.orange,
              },
            ]}
          >
            <View style={styles.planHead}>
              <View>
                <Text style={[styles.planTitle, { color: themeColors.text }]}>
                  {planName}
                </Text>
                {perMealLabel ? (
                  <Text style={[styles.planSub, { color: themeColors.muted }]}>
                    {perMealLabel}
                  </Text>
                ) : null}
              </View>
              <View style={styles.priceWrap}>
                <Text style={styles.planPrice}>
                  {selectedPlan?.price || ''}
                </Text>
              </View>
            </View>
            {features.map(item => (
              <Text
                key={item}
                style={[styles.checkLine, { color: themeColors.text }]}
              >
                ⊙ {item}
              </Text>
            ))}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: themeColors.muted }]}>
                {selectedDays ? `Total for ${selectedDays} days` : 'Total'}
              </Text>
              <Text style={[styles.totalPrice, { color: themeColors.text }]}>
                {selectedPlan?.price || '-'}
              </Text>
            </View>
          </View>
        ) : null}

        <StepTitle number="2" title="Your HomeChef" />
        <View style={styles.chefList}>
          {selectedChef ? (
            <View
              style={[
                styles.chefCard,
                styles.chefCardActive,
                {
                  backgroundColor: themeColors.cardHighlight,
                  borderColor: colors.orange,
                },
              ]}
            >
              <Text style={styles.chefAvatar}>
                {selectedChef.image || '🍱'}
              </Text>
              <View style={styles.chefCopy}>
                <Text style={[styles.chefName, { color: themeColors.text }]}>
                  {selectedChef.name}
                </Text>
                <Text style={[styles.chefMeta, { color: themeColors.muted }]}>
                  {[
                    selectedChef.owner,
                    selectedChef.cuisine,
                    selectedChef.price,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                <Text style={[styles.chefMeta, { color: themeColors.muted }]}>
                  {[
                    selectedChef.rating ? `★ ${selectedChef.rating}` : '',
                    selectedChef.distance,
                    selectedChef.time,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <Text style={[styles.radio, styles.radioActive]}>⊙</Text>
            </View>
          ) : (
            <View
              style={[
                styles.chefCard,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.line,
                },
              ]}
            >
              <Text style={styles.chefAvatar}>🍱</Text>
              <View style={styles.chefCopy}>
                <Text style={[styles.chefName, { color: themeColors.text }]}>
                  No HomeChef available
                </Text>
              </View>
            </View>
          )}
        </View>

        <StepTitle number="3" title="Checkout" />
        {hasActiveSubscription ? (
          <View style={styles.activePlanBox}>
            <Text style={styles.activePlanTitle}>
              Active subscription already running
            </Text>
            <Text style={styles.activePlanText}>
              {activeSubscription.plan || activeSubscription.planType}
            </Text>
            {activeSubscription.homeChefOwner ||
            activeSubscription.homeChefName ? (
              <Text style={styles.activePlanText}>
                {[
                  activeSubscription.homeChefOwner,
                  activeSubscription.homeChefName,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ) : null}
            <Text style={styles.activePlanText}>
              Expires/Renews: {activeSubscription.renewal || 'Active'}
            </Text>
          </View>
        ) : null}
        <View
          style={[
            styles.checkoutBox,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.line,
            },
          ]}
        >
          <Text style={[styles.checkoutLabel, { color: themeColors.text }]}>
            Delivery Address
          </Text>
          <TextInput
            multiline
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            placeholder="Enter complete delivery address"
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
          <Text style={[styles.locationStatus, { color: themeColors.muted }]}>
            {locationStatus}
          </Text>
          <Text style={[styles.checkoutLabel, { color: themeColors.text }]}>
            Online Payment
          </Text>
          <Text
            style={[styles.selectedPaymentText, { color: themeColors.muted }]}
          >
            Selected: {paymentMethod || 'Choose payment method'}
          </Text>
          <View style={styles.paymentGrid}>
            {paymentMethods.map(method => (
              <Pressable
                key={method}
                onPress={() => setPaymentMethod(method)}
                style={[
                  styles.paymentOption,
                  paymentMethod === method
                    ? styles.paymentOptionActive
                    : undefined,
                  {
                    backgroundColor:
                      paymentMethod === method
                        ? themeColors.cardHighlight
                        : themeColors.input,
                    borderColor:
                      paymentMethod === method
                        ? colors.orange
                        : themeColors.line,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.paymentOptionText,
                    paymentMethod === method
                      ? styles.paymentOptionTextActive
                      : undefined,
                  ]}
                >
                  {method}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.noCodText, { color: themeColors.muted }]}>
            COD removed · pay by Wallet or Razorpay
          </Text>
        </View>
        {subscribeStatus ? (
          <Text
            style={[styles.subscribeStatus, { color: themeColors.surfaceText }]}
          >
            {subscribeStatus}
          </Text>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.stickyCta,
          {
            backgroundColor: themeColors.surface,
            borderTopColor: themeColors.line,
          },
          {
            bottom: Math.max(58, bottomInset + 50),
          },
        ]}
      >
        <Pressable
          disabled={
            subscribing ||
            !selectedPlan ||
            deliveryAddress.trim().length < 8 ||
            hasActiveSubscription
          }
          onPress={handleSubscribe}
          style={[
            styles.subscribeButton,
            subscribing ||
            !selectedPlan ||
            deliveryAddress.trim().length < 8 ||
            hasActiveSubscription
              ? styles.subscribeButtonDisabled
              : undefined,
          ]}
        >
          <Text style={styles.subscribeText}>
            {hasActiveSubscription
              ? 'Subscription Active'
              : subscribing
              ? 'Subscribing...'
              : `Pay & Subscribe · ${selectedPlan?.price || '-'}`}
          </Text>
        </Pressable>
        <Text style={styles.cancelText}>Cancel anytime before renewal</Text>
      </View>
      <BottomNav
        activeTab="plans"
        bottomInset={bottomInset}
        onNavigate={onNavigate}
      />
    </View>
  );
}
function StepTitle({ number, title }) {
  const { themeColors } = useTheme();
  return (
    <View style={styles.stepTitle}>
      <Text style={styles.stepDot}>{number}</Text>
      <Text style={[styles.stepText, { color: themeColors.surfaceText }]}>
        {title}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  simpleLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 18,
  },
  newUserBox: {
    gap: 10,
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#cbeed4',
    borderRadius: 16,
    backgroundColor: '#f1fff5',
  },
  newUserTitle: {
    color: '#1f6b37',
    fontSize: 16,
    fontWeight: '900',
  },
  newUserText: {
    color: '#2b7142',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  newUserActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 2,
  },
  trialButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.orange,
  },
  trialButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  newUserHint: {
    flex: 1,
    color: '#337b49',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  stepTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 10,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    color: '#fff',
    backgroundColor: colors.orange,
    fontSize: 11,
    lineHeight: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  stepText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  slotList: {
    gap: 10,
  },
  slotCard: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  slotActive: {
    borderWidth: 2,
    borderColor: colors.orange,
    backgroundColor: '#fff2ea',
  },
  slotIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#fff0e8',
  },
  slotIconActive: {
    backgroundColor: '#ffe2d6',
  },
  slotCopy: {
    flex: 1,
  },
  slotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  slotMeta: {
    marginTop: 3,
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },
  saveBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#12893d',
    backgroundColor: '#dff8e9',
    fontSize: 8,
    fontWeight: '900',
  },
  radio: {
    color: colors.line,
    fontSize: 20,
  },
  radioActive: {
    color: colors.orange,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  durationPill: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: colors.yellow,
  },
  durationActive: {
    backgroundColor: colors.orange,
  },
  durationText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  durationTextActive: {
    color: '#fff',
  },
  popularBadge: {
    position: 'absolute',
    top: -9,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#f06a18',
    backgroundColor: colors.yellow,
    fontSize: 8,
    fontWeight: '900',
  },
  popularBadgeActive: {
    color: '#fff',
    backgroundColor: '#f6b21a',
  },
  planSummary: {
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffbfa7',
    borderRadius: 18,
    backgroundColor: '#fff0e9',
  },
  planHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  planTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  planSub: {
    marginTop: 5,
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  planPrice: {
    color: colors.orange,
    fontSize: 24,
    fontWeight: '900',
  },
  perMeal: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
  },
  greenNotice: {
    marginTop: 16,
    padding: 9,
    borderRadius: 10,
    overflow: 'hidden',
    color: '#138b43',
    backgroundColor: '#c9f5d8',
    fontSize: 12,
    fontWeight: '900',
  },
  orangeNotice: {
    marginTop: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: '#ffc4ad',
    borderRadius: 10,
    overflow: 'hidden',
    color: colors.orange,
    backgroundColor: '#ffe0d4',
    fontSize: 12,
    fontWeight: '900',
  },
  comboNotice: {
    color: '#187334',
    borderColor: '#dfd4b8',
    backgroundColor: '#eee5d1',
  },
  checkLine: {
    marginTop: 14,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ffd1bf',
  },
  totalLabel: {
    color: '#666',
    fontSize: 13,
  },
  totalPrice: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  chefList: {
    gap: 10,
    marginBottom: 18,
  },
  chefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 76,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  chefCardActive: {
    borderWidth: 2,
    borderColor: colors.orange,
    backgroundColor: '#fff5ef',
  },
  chefAvatar: {
    fontSize: 34,
  },
  chefCopy: {
    flex: 1,
  },
  chefName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  chefMeta: {
    marginTop: 3,
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },
  checkoutBox: {
    marginBottom: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  activePlanBox: {
    gap: 5,
    marginBottom: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: '#ffd36d',
    borderRadius: 14,
    backgroundColor: '#fff9df',
  },
  activePlanTitle: {
    color: '#bf4c00',
    fontSize: 13,
    fontWeight: '900',
  },
  activePlanText: {
    color: '#6b4b00',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
  },
  checkoutLabel: {
    marginBottom: 8,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  selectedPaymentText: {
    marginBottom: 8,
    color: colors.orange,
    fontSize: 11,
    fontWeight: '900',
  },
  addressInput: {
    minHeight: 64,
    marginBottom: 8,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    color: colors.ink,
    backgroundColor: '#fffaf5',
    fontSize: 13,
    fontWeight: '700',
    textAlignVertical: 'top',
  },
  locationStatus: {
    marginBottom: 14,
    color: '#11833a',
    fontSize: 11,
    fontWeight: '800',
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentOption: {
    minHeight: 42,
    minWidth: '47%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  paymentOptionActive: {
    borderColor: colors.orange,
    backgroundColor: '#fff0e8',
  },
  paymentOptionText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },
  paymentOptionTextActive: {
    color: colors.orange,
  },
  noCodText: {
    marginTop: 9,
    color: '#11833a',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  stickyCta: {
    position: 'absolute',
    left: 18,
    right: 18,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#f1e4db',
  },
  subscribeButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.orange,
  },
  subscribeButtonDisabled: {
    backgroundColor: '#ffb58f',
  },
  subscribeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  subscribeStatus: {
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ffc7b0',
    borderRadius: 12,
    overflow: 'hidden',
    color: colors.ink,
    backgroundColor: '#fff4ee',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  cancelText: {
    marginTop: 7,
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
});
