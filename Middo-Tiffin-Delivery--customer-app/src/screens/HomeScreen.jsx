import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { useCustomerProfile } from '../context/CustomerProfileContext';
import { fetchCustomerAppContent } from '../services/appContentApi';
import { fetchHomeData } from '../services/homeApi';
import { startRazorpayPayment } from '../services/paymentService';
import { createOrder } from '../services/orderApi';
import { logDebugData } from '../utils/debugLog';
import { ActiveSubscriptionCard } from './home/ActiveSubscriptionCard';
import { AssignedChefCard } from './home/AssignedChefCard';
import { Categories } from './home/Categories';
import { CheckoutSheet } from './home/CheckoutSheet';
import { GroupActions } from './home/GroupActions';
import { GroupOrderSheet } from './home/GroupOrderSheet';
import { HomeHero } from './home/HomeHero';
import { MealRow } from './home/MealRow';
import { NearbyHomeChefs } from './home/NearbyHomeChefs';
import { QuickActions } from './home/QuickActions';
import { SearchResults } from './home/SearchResults';
import { TodayMealCard } from './home/TodayMealCard';
import { WeeklySchedule } from './home/WeeklySchedule';
import {
  getHomeSearchResults,
  getTrackingOrder,
  normalizeSearchText,
} from './home/homeHelpers';
import { styles } from './home/homeStyles';
const emptyHomeData = {
  customer: null,
  meals: {
    today: null,
    next: null,
    tomorrow: null,
  },
  assignedChef: null,
  schedule: [],
  categories: [],
  products: [],
  activeOrder: null,
  activeSubscription: null,
  nearbyChefs: [],
  paymentMethods: [],
};
export function HomeScreen({
  bottomInset,
  hasUnreadNotifications,
  onNavigate,
  onNotifications,
  onTrack,
  onHomeChef,
  onSkipMeal,
  onCalendar,
  onReviews,
  onOrderPlaced,
}) {
  const { themeColors } = useTheme();
  const { customerProfile } = useCustomerProfile();
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [groupSheet, setGroupSheet] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [homeData, setHomeData] = useState(emptyHomeData);
  const [homeLoading, setHomeLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState('Loading live home data...');
  const [orderStatus, setOrderStatus] = useState('');
  const [orderingChef, setOrderingChef] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutChef, setCheckoutChef] = useState(null);
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const normalizedSearchQuery = normalizeSearchText(searchQuery);
  const hasActiveSubscription =
    homeData.activeSubscription?.status === 'Active';
  const searchResults = normalizedSearchQuery
    ? getHomeSearchResults(homeData, normalizedSearchQuery, {
        onCalendar,
        onHomeChef,
        onTrack: () => onTrack(getTrackingOrder(homeData)),
      })
    : [];
  const scrollableHeight = Math.max(1, contentHeight - viewportHeight);
  const canScroll = contentHeight > viewportHeight;
  const scrollThumbHeight =
    viewportHeight > 0 && contentHeight > 0
      ? Math.max(72, (viewportHeight / contentHeight) * viewportHeight)
      : 72;
  const scrollThumbTop =
    (viewportHeight - scrollThumbHeight) *
      Math.min(1, scrollY / scrollableHeight) || 0;
  const scrollTrackBottom = Math.max(58, bottomInset + 52);
  const handleScroll = event => {
    setScrollY(event.nativeEvent.contentOffset.y);
  };
  const handleLayout = event => {
    setViewportHeight(event.nativeEvent.layout.height);
  };
  const applyCurrentProfile = useCallback(
    data =>
      customerProfile
        ? {
            ...data,
            customer: {
              ...(data.customer || {}),
              ...customerProfile,
            },
          }
        : data,
    [customerProfile],
  );
  useEffect(() => {
    let mounted = true;
    const loadHomeData = () => {
      Promise.all([
        fetchHomeData(),
        fetchCustomerAppContent(['paymentMethods']),
      ])
        .then(([data, content]) => {
          if (!mounted) {
            return;
          }
          const methods = content.paymentMethods || [];
          const nextHomeData = applyCurrentProfile({
            ...data,
            paymentMethods: methods,
          });
          logDebugData('Home screen data from backend', nextHomeData);
          setHomeData(nextHomeData);
          if (
            nextHomeData.customer?.liveAddress ||
            nextHomeData.customer?.address
          ) {
            setCheckoutAddress(
              nextHomeData.customer.liveAddress ||
                nextHomeData.customer.address,
            );
          }
          setSelectedCategory(nextHomeData.categories[0]?.label || 'All');
          setPaymentMethod(methods.includes('UPI') ? 'UPI' : methods[0] || '');
          setApiStatus('');
        })
        .catch(error => {
          if (!mounted) {
            return;
          }
          setApiStatus(
            error instanceof Error ? error.message : 'Unable to load home data',
          );
        })
        .finally(() => {
          if (mounted) {
            setHomeLoading(false);
          }
        });
    };
    loadHomeData();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        loadHomeData();
      }
    });
    const interval = setInterval(loadHomeData, 10000);
    return () => {
      mounted = false;
      subscription.remove();
      clearInterval(interval);
    };
  }, [applyCurrentProfile]);
  useEffect(() => {
    if (!customerProfile) {
      return;
    }
    setHomeData(current => applyCurrentProfile(current));
    if (customerProfile.liveAddress || customerProfile.address) {
      setCheckoutAddress(
        customerProfile.liveAddress || customerProfile.address,
      );
    }
  }, [applyCurrentProfile, customerProfile]);
  const handleCreateChefOrder = async () => {
    if (!checkoutChef) {
      return;
    }
    const chef = checkoutChef;
    setOrderingChef(chef.name);
    setOrderStatus('Processing secure test payment...');
    try {
      const payment = await startRazorpayPayment({
        amount: chef.price,
        customerName: homeData.customer.name,
        description: `${chef.cuisine} Tiffin from ${chef.name}`,
        paymentMethod,
      });
      setOrderStatus('Payment successful. Creating your order...');
      const order = await createOrder({
        address: checkoutAddress,
        amount: chef.price.replace('/meal', ''),
        chef: chef.name,
        customer: homeData.customer.name,
        eta: chef.time,
        items: chef.tags,
        meal: `${chef.cuisine} Tiffin`,
        orderType: 'single',
        paymentMethod,
        paymentProvider: 'Razorpay',
        paymentId: payment.razorpay_payment_id,
        paymentStatus: 'Paid',
        source: 'middo-app-home',
        status: 'Order Confirmed',
      });
      const message = `Order ${order.orderId} confirmed · Razorpay`;
      setOrderStatus(message);
      setCheckoutChef(null);
      onOrderPlaced(order);
      Alert.alert('Order Confirmed', message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Payment or order failed';
      setOrderStatus(message);
      Alert.alert('Order Failed', message);
    } finally {
      setOrderingChef(null);
    }
  };
  if (homeLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
        <View style={styles.simpleLoader}>
          <ActivityIndicator color="#ff6418" size="large" />
        </View>
        <BottomNav
          activeTab="home"
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
            paddingBottom: Math.max(96, bottomInset + 84),
          },
        ]}
        onContentSizeChange={(_, height) => setContentHeight(height)}
        onLayout={handleLayout}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <HomeHero
          customer={homeData.customer}
          hasUnreadNotifications={hasUnreadNotifications}
          onNotifications={onNotifications}
          onProfilePress={() => onNavigate('profile')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        {apiStatus ? (
          <Text style={[styles.apiStatus, { color: themeColors.surfaceText }]}>
            {apiStatus}
          </Text>
        ) : null}
        {normalizedSearchQuery ? (
          <SearchResults query={searchQuery} results={searchResults} />
        ) : null}
        {orderStatus ? (
          <Text
            style={[styles.orderStatus, { color: themeColors.surfaceText }]}
          >
            {orderStatus}
          </Text>
        ) : null}

        {homeData.activeOrder ? (
          <Pressable
            onPress={() => onTrack(getTrackingOrder(homeData))}
            style={[
              styles.activeOrderCard,
              {
                backgroundColor: themeColors.successCard,
                borderColor: themeColors.successLine,
              },
            ]}
          >
            <View style={styles.activeOrderTop}>
              <View>
                <Text style={styles.activeOrderLabel}>Live Order</Text>
                <Text
                  style={[
                    styles.activeOrderTitle,
                    { color: themeColors.successText },
                  ]}
                >
                  {homeData.activeOrder.meal || 'Your meal'}
                </Text>
              </View>
              <Text style={styles.activeOrderStatus}>
                {homeData.activeOrder.status || 'Order Confirmed'}
              </Text>
            </View>
            <Text
              style={[styles.activeOrderMeta, { color: themeColors.muted }]}
            >
              {[homeData.activeOrder.orderId, homeData.activeOrder.eta]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <View style={styles.activeOrderBottom}>
              <Text
                style={[styles.activeOrderChef, { color: themeColors.muted }]}
              >
                {homeData.activeOrder.chef ||
                  homeData.activeOrder.homeChefName ||
                  ''}
              </Text>
              <Text style={styles.activeOrderTrack}>Track Order ›</Text>
            </View>
          </Pressable>
        ) : null}

        {!hasActiveSubscription ? (
          <View style={styles.newUserHomeCard}>
            <Text style={styles.newUserHomeTitle}>
              No active subscription yet
            </Text>
            <Text style={styles.newUserHomeText}>
              View meal plans or purchase a Trial Meal to experience MIDDO
              before subscribing.
            </Text>
            <View style={styles.newUserHomeActions}>
              <Pressable
                onPress={() => onNavigate('explore')}
                style={styles.newUserHomePrimary}
              >
                <Text style={styles.newUserHomePrimaryText}>
                  Purchase Trial Meal
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onNavigate('plans')}
                style={styles.newUserHomeSecondary}
              >
                <Text style={styles.newUserHomeSecondaryText}>View Plans</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {hasActiveSubscription && homeData.meals.today ? (
          <>
            <Text
              style={[styles.sectionTitle, { color: themeColors.surfaceText }]}
            >
              Today's Meal
            </Text>
            <TodayMealCard
              meal={homeData.meals.today}
              onHomeChef={onHomeChef}
              onTrack={() => {
                const trackingOrder = getTrackingOrder(homeData);
                if (trackingOrder) {
                  onTrack(trackingOrder);
                }
              }}
            />
          </>
        ) : null}

        {hasActiveSubscription && homeData.meals.next ? (
          <>
            <Text
              style={[styles.sectionTitle, { color: themeColors.surfaceText }]}
            >
              Next Meal
            </Text>
            <MealRow
              icon={homeData.meals.next.icon}
              title={homeData.meals.next.title}
              meta={homeData.meals.next.meta}
              action="Skip"
              actionVariant="yellow"
              iconBg="#fff4c7"
              onAction={onSkipMeal}
            />
          </>
        ) : null}

        {hasActiveSubscription && homeData.meals.tomorrow ? (
          <>
            <Text
              style={[styles.sectionTitle, { color: themeColors.surfaceText }]}
            >
              Tomorrow's Meal
            </Text>
            <MealRow
              icon={homeData.meals.tomorrow.icon}
              title={homeData.meals.tomorrow.title}
              meta={homeData.meals.tomorrow.meta}
              action="View"
              iconBg="#dff8e9"
              onAction={onCalendar}
            />
          </>
        ) : null}

        {hasActiveSubscription ? (
          <>
            <AssignedChefCard
              chef={homeData.assignedChef}
              onPress={onHomeChef}
            />
            <ActiveSubscriptionCard
              subscription={homeData.activeSubscription}
            />
            <WeeklySchedule
              schedule={homeData.schedule}
              onCalendar={onCalendar}
            />
            <QuickActions
              onCalendar={onCalendar}
              onReviews={onReviews}
              onSkipMeal={onSkipMeal}
            />
          </>
        ) : null}
        <GroupActions
          onCreate={() => setGroupSheet('create')}
          onJoin={() => setGroupSheet('join')}
        />
        <Categories
          categories={homeData.categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <NearbyHomeChefs
          chefs={homeData.nearbyChefs}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
        />
      </ScrollView>

      {canScroll ? (
        <View
          pointerEvents="none"
          style={[
            styles.scrollTrack,
            {
              bottom: scrollTrackBottom,
            },
          ]}
        >
          <View
            style={[
              styles.scrollThumb,
              {
                height: scrollThumbHeight,
                transform: [
                  {
                    translateY: scrollThumbTop,
                  },
                ],
              },
            ]}
          />
        </View>
      ) : null}

      <BottomNav
        activeTab="home"
        bottomInset={bottomInset}
        onNavigate={onNavigate}
      />
      {groupSheet ? (
        <GroupOrderSheet
          bottomInset={bottomInset}
          joinCode={joinCode}
          mode={groupSheet}
          onClose={() => {
            setInviteCopied(false);
            setGroupSheet(null);
          }}
          onDone={() => {
            setJoinCode('');
            setInviteCopied(false);
            setGroupSheet(null);
          }}
          onGenerate={() => setGroupSheet('invite')}
          onCopyInvite={() => setInviteCopied(true)}
          inviteCopied={inviteCopied}
          onJoinCodeChange={setJoinCode}
        />
      ) : null}
      {checkoutChef ? (
        <CheckoutSheet
          address={checkoutAddress}
          bottomInset={bottomInset}
          chef={checkoutChef}
          ordering={orderingChef === checkoutChef.name}
          paymentMethod={paymentMethod}
          onAddressChange={setCheckoutAddress}
          onClose={() => setCheckoutChef(null)}
          onPaymentMethodChange={setPaymentMethod}
          onPlaceOrder={handleCreateChefOrder}
          paymentMethods={homeData.paymentMethods}
        />
      ) : null}
    </View>
  );
}
