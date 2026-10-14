import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { fetchCustomerAppContent } from '../services/appContentApi';
import { fetchHomeData } from '../services/homeApi';
import { createOrder } from '../services/orderApi';
import { startRazorpayPayment } from '../services/paymentService';
import { colors } from '../theme/colors';
import { Icons } from '../theme/images';

const fallbackTrialRows = [
  {
    badge: 'Trial',
    chef: 'MIDDO Kitchen',
    desc: 'Fresh homestyle dal, sabzi, rice, roti and salad.',
    discount: '35%',
    image: '🍱',
    oldPrice: '₹149',
    price: '₹99',
    rating: '4.8',
    save: 'Try before subscription',
    time: '35 min',
    title: 'Trial Tiffin Meal',
  },
  {
    badge: 'Popular',
    chef: 'HomeChef Special',
    desc: 'Balanced vegetarian meal prepared for first-time customers.',
    discount: '30%',
    image: '🥗',
    oldPrice: '₹129',
    price: '₹89',
    rating: '4.7',
    save: 'Single meal only',
    time: '40 min',
    title: 'Lite Trial Meal',
  },
];

export function ExploreScreen({
  topInset,
  bottomInset,
  onNavigate,
  onBackHome,
  onOrderPlaced,
}) {
  const { themeColors } = useTheme();
  const [homeData, setHomeData] = useState(null);
  const [orderingKey, setOrderingKey] = useState(null);
  const [selectedPaymentTrial, setSelectedPaymentTrial] = useState(null);
  const [trialPaymentMethods, setTrialPaymentMethods] = useState([]);
  const dynamicTrials = useMemo(() => {
    const chefs = homeData?.nearbyChefs?.length ? homeData.nearbyChefs : [];
    if (!chefs.length) {
      return fallbackTrialRows;
    }

    return chefs.slice(0, 6).map((chef, index) => {
      const sample = chef.sampleMenu?.[0] || chef.weeklyMenu?.[0];
      const chefPrice = Number(String(chef.price || '').replace(/[^\d.]/g, ''));
      const trialPrice = chefPrice ? Math.round(chefPrice * 0.55) : null;
      return {
        badge: chef.badge || (index === 0 ? 'Available' : 'Trial'),
        chef: chef.name,
        chefId: chef._id,
        desc: sample?.items || chef.cuisine || '',
        discount: chefPrice && trialPrice ? `${Math.round(((chefPrice - trialPrice) / chefPrice) * 100)}%` : '',
        image: sample?.icon || chef.image || '',
        oldPrice: chefPrice ? `₹${chefPrice}` : '',
        owner: chef.owner,
        price: trialPrice ? `₹${trialPrice}` : chef.price,
        rating: chef.rating || '',
        save: chefPrice && trialPrice ? `You save ₹${chefPrice - trialPrice}` : '',
        time: chef.time || '',
        title: sample?.title || chef.cuisine || chef.name,
      };
    });
  }, [homeData]);
  const trialRows = dynamicTrials;
  useEffect(() => {
    Promise.all([fetchHomeData(), fetchCustomerAppContent(['paymentMethods'])])
      .then(([data, content]) => {
        setHomeData(data);
        setTrialPaymentMethods(content.paymentMethods || []);
      })
      .catch(() => undefined);
  }, []);
  const orderTrial = async (trial, paymentMethod) => {
    const key = `${trial.chef}-${trial.title}`;
    const customer = homeData?.customer;
    setSelectedPaymentTrial(null);
    setOrderingKey(key);
    try {
      const payment =
        paymentMethod === 'Wallet'
          ? {
              razorpay_payment_id: `wallet_${Date.now()}`,
            }
          : await startRazorpayPayment({
              amount: trial.price,
              contact: customer?.phone,
              customerName: customer?.name || '',
              description: `${trial.title} trial meal`,
              email: customer?.email,
              paymentMethod,
            });
      const order = await createOrder({
        address:
          customer?.liveAddress ||
          customer?.address ||
          customer?.location ||
          '',
        amount: trial.price,
        chef: trial.chef,
        customer: customer?.name || '',
        customerEmail: customer?.email,
        customerPhone: customer?.phone,
        eta: trial.time,
        homeChefId: 'chefId' in trial ? trial.chefId : undefined,
        homeChefName: trial.chef,
        homeChefOwner: 'owner' in trial ? trial.owner : undefined,
        items: [trial.desc],
        latitude: customer?.latitude,
        longitude: customer?.longitude,
        meal: trial.title,
        notes: 'Single trial meal order',
        orderType: 'single',
        paymentId: payment.razorpay_payment_id,
        paymentMethod,
        paymentProvider: paymentMethod === 'Wallet' ? 'Wallet' : 'Razorpay',
        paymentStatus: 'Paid',
        source: 'trial',
        status: 'Order Confirmed',
      });
      Alert.alert(
        'Trial ordered',
        `${trial.title} order confirmed via ${paymentMethod}.`,
      );
      onOrderPlaced(order);
    } catch (error) {
      Alert.alert(
        'Order failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setOrderingKey(null);
    }
  };
  const chooseTrialPayment = trial => {
    setSelectedPaymentTrial(trial);
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
        <ExploreHero
          topInset={topInset}
          onBack={onBackHome}
          trialCount={trialRows.length}
        />

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>Available Trials</Text>
        <View style={styles.trialList}>
          {trialRows.length ? trialRows.map(trial => (
            <TrialCard
              key={`${trial.chef}-${trial.title}`}
              {...trial}
              isOrdering={orderingKey === `${trial.chef}-${trial.title}`}
              onOrder={() => chooseTrialPayment(trial)}
            />
          )) : (
            <Text style={styles.noticeText}>No trial meals available right now.</Text>
          )}
        </View>
      </ScrollView>
      <BottomNav
        activeTab="explore"
        bottomInset={bottomInset}
        onNavigate={onNavigate}
      />
      <Modal
        visible={Boolean(selectedPaymentTrial)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPaymentTrial(null)}
      >
        <View style={styles.paymentOverlay}>
          <View style={[styles.paymentSheet, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
            <View style={styles.paymentHead}>
              <View>
                <Text style={styles.paymentEyebrow}>Payment Option</Text>
                <Text style={styles.paymentTitle}>
                  {selectedPaymentTrial?.title || 'Trial Meal'}
                </Text>
                <Text style={styles.paymentSubtitle}>
                  Pay {selectedPaymentTrial?.price || '₹0'}
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedPaymentTrial(null)}
                style={styles.paymentClose}
              >
                <Text style={styles.paymentCloseText}>×</Text>
              </Pressable>
            </View>
            {trialPaymentMethods.map(method => (
              <Pressable
                key={method}
                onPress={() =>
                  selectedPaymentTrial &&
                  orderTrial(selectedPaymentTrial, method)
                }
                style={styles.paymentRow}
              >
                <Text style={[styles.paymentRowTitle, { color: themeColors.text }]}>
                  {method === 'Wallet' ? 'MIDDO Wallet' : method}
                </Text>
                <Text style={styles.paymentRowSub}>
                  {method === 'Wallet'
                    ? 'Pay from wallet balance'
                    : 'Pay securely with Razorpay'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}
function ExploreHero({ topInset, onBack, trialCount }) {
  return (
    <View
      style={[
        styles.hero,
        {
          paddingTop: Math.max(46, topInset + 14),
        },
      ]}
    >
      <View style={styles.heroCircleLarge} />
      <View style={styles.heroCircleSmall} />
      <View style={styles.heroTopRow}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.heroIconButton}>
          <ArrowLeftIcon />
        </Pressable>
      </View>
      <View style={styles.heroEyebrow}>
        <Image source={Icons.StartPlus} style={styles.heroEyebrowIcon} />
        <Text style={styles.heroEyebrowText}>PREMIUM TRIAL</Text>
      </View>
      <Text style={styles.heroTitle}>Try Before{'\n'}You Subscribe</Text>
      <Text style={styles.heroSubtitle}>
        Order a single trial meal at a special discounted price. No strings
        attached.
      </Text>
      <View style={styles.statsRow}>
        <TrialStat value={String(trialCount)} label="Trials" />
      </View>
    </View>
  );
}
function TrialStat({ value, label }) {
  return (
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function TrialCard({
  badge,
  discount,
  title,
  chef,
  image,
  desc,
  time,
  price,
  oldPrice,
  rating,
  save,
  isOrdering,
  onOrder,
}) {
  const { themeColors } = useTheme();
  return (
    <View
      style={[
        styles.trialCard,
        { backgroundColor: themeColors.card, borderColor: themeColors.line },
      ]}
    >
      <View style={styles.trialImage}>
        <Text style={styles.trialFood}>{image}</Text>
        <Text style={styles.trialBadge}>{badge}</Text>
        <Text style={styles.discountBadge}>
          {discount}
          {'\n'}OFF
        </Text>
        <View style={styles.ratingPill}>
          <Text style={styles.ratingText}>★ {rating}</Text>
        </View>
        <View style={styles.trialImageText}>
          <Text style={styles.trialTitle}>{title}</Text>
          <Text style={styles.trialChef}>{chef}</Text>
        </View>
      </View>
      <View style={styles.trialBody}>
        <Text style={styles.trialDesc}>{desc}</Text>
        <View style={styles.trialMeta}>
          {time ? (
            <View style={styles.trialMetaItem}>
              <Image
                source={Icons.Clock}
                style={[styles.trialMetaIcon, styles.mutedMetaIcon]}
              />
              <Text style={[styles.trialMetaText, styles.mutedMetaText]}>
                {time}
              </Text>
            </View>
          ) : null}
          <View style={styles.trialMetaItem}>
            <Image
              source={Icons.PureVeg}
              style={[styles.trialMetaIcon, styles.vegMetaIcon]}
            />
            <Text style={styles.trialMetaText}>100% Veg</Text>
          </View>
          <View style={styles.trialMetaItem}>
            <Image
              source={Icons.TrialOnly}
              style={[styles.trialMetaIcon, styles.trialOnlyMetaIcon]}
            />
            <Text style={[styles.trialMetaText, styles.trialOnlyMetaText]}>
              Trial Only
            </Text>
          </View>
        </View>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>
              {price} <Text style={styles.oldPrice}>{oldPrice}</Text>
            </Text>
            <Text style={styles.save}>{save}</Text>
          </View>
          <Pressable
            disabled={isOrdering}
            onPress={onOrder}
            style={styles.orderButton}
          >
            <Text style={styles.orderButtonText}>
              {isOrdering ? 'Ordering...' : 'Order Trial ›'}
            </Text>
          </Pressable>
        </View>
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
    position: 'relative',
    minHeight: 278,
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingBottom: 26,
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: colors.orange,
  },
  heroCircleLarge: {
    position: 'absolute',
    right: -36,
    top: 0,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroCircleSmall: {
    position: 'absolute',
    right: -2,
    top: 44,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroTopRow: {
    flexDirection: 'row',
  },
  heroIconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 26,
  },
  heroEyebrowIcon: {
    width: 13,
    height: 13,
    resizeMode: 'contain',
    tintColor: '#ffe0d0',
  },
  heroEyebrowText: {
    color: '#ffe0d0',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  heroTitle: {
    marginTop: 8,
    color: '#fff',
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
  },
  heroSubtitle: {
    maxWidth: 265,
    marginTop: 10,
    color: '#fff',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 18,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  infoBox: {
    marginTop: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#baf2cb',
    borderRadius: 14,
    backgroundColor: '#effff4',
  },
  infoTitle: {
    color: '#20733a',
    fontSize: 13,
    fontWeight: '900',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  infoText: {
    width: '48%',
    color: '#287543',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 12,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  trialList: {
    gap: 16,
  },
  trialCard: {
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },
  trialImage: {
    height: 154,
    overflow: 'hidden',
    padding: 14,
    backgroundColor: '#182434',
  },
  trialFood: {
    position: 'absolute',
    right: 12,
    top: 24,
    fontSize: 100,
    opacity: 0.9,
  },
  trialBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#fff',
    backgroundColor: colors.orange,
    fontSize: 11,
    fontWeight: '900',
  },
  discountBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    color: '#8a5d00',
    backgroundColor: colors.yellow,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '900',
    textAlign: 'center',
    paddingTop: 10,
    overflow: 'hidden',
  },
  ratingPill: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  ratingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  trialImageText: {
    position: 'absolute',
    left: 14,
    bottom: 16,
  },
  trialTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  trialChef: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  trialBody: {
    padding: 14,
  },
  trialDesc: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  trialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  trialMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trialMetaIcon: {
    width: 13,
    height: 13,
    resizeMode: 'contain',
  },
  mutedMetaIcon: {
    tintColor: '#777',
  },
  vegMetaIcon: {
    tintColor: '#39a65a',
  },
  trialOnlyMetaIcon: {
    tintColor: colors.orange,
  },
  trialMetaText: {
    color: '#39a65a',
    fontSize: 10,
    fontWeight: '900',
  },
  trialOnlyMetaText: {
    color: colors.orange,
  },
  mutedMetaText: {
    color: '#777',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  price: {
    color: colors.orange,
    fontSize: 25,
    fontWeight: '900',
  },
  oldPrice: {
    color: '#888',
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  save: {
    color: '#04a24b',
    fontSize: 10,
    fontWeight: '900',
  },
  orderButton: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.orange,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  notice: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.yellow,
  },
  noticeText: {
    color: '#796000',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  paymentOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  paymentSheet: {
    padding: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#fff',
  },
  paymentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  paymentEyebrow: {
    color: '#777',
    fontSize: 11,
    fontWeight: '900',
  },
  paymentTitle: {
    marginTop: 4,
    color: '#202433',
    fontSize: 19,
    fontWeight: '900',
  },
  paymentSubtitle: {
    marginTop: 4,
    color: colors.orange,
    fontSize: 13,
    fontWeight: '900',
  },
  paymentClose: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#fff0e8',
  },
  paymentCloseText: {
    color: colors.orange,
    fontSize: 24,
    fontWeight: '900',
  },
  paymentRow: {
    minHeight: 58,
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#eadfd6',
    borderRadius: 14,
    backgroundColor: '#fffaf5',
  },
  paymentRowTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  paymentRowSub: {
    marginTop: 4,
    color: '#777',
    fontSize: 11,
    fontWeight: '700',
  },
});
