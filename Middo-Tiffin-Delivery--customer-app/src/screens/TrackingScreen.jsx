import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useTheme } from '../context/ThemeContext';
import { fetchCustomerAppContent } from '../services/appContentApi';
import { fetchOrderById } from '../services/orderApi';
import { colors } from '../theme/colors';
function formatOrderDateTime(value) {
  if (!value) {
    return 'Just now';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
export function TrackingScreen({ topInset, bottomInset, onBack, order }) {
  const { themeColors } = useTheme();
  const [liveOrder, setLiveOrder] = useState(order);
  const [statusSteps, setStatusSteps] = useState([]);
  const displayOrder = liveOrder || order;
  const activeStatus = displayOrder?.status || 'Order Confirmed';
  const activeIndex = Math.max(
    0,
    statusSteps.findIndex(step => step.label === activeStatus),
  );
  const eta = displayOrder?.eta || '';
  const amount = displayOrder?.amount || '';
  const placedAt = formatOrderDateTime(displayOrder?.createdAt);
  const updatedAt = formatOrderDateTime(
    displayOrder?.updatedAt || displayOrder?.createdAt,
  );
  useEffect(() => {
    setLiveOrder(order);
  }, [order]);
  useEffect(() => {
    fetchCustomerAppContent(['trackingStatuses'])
      .then(content => setStatusSteps(content.trackingStatuses || []))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!order?.orderId) {
      return undefined;
    }
    let mounted = true;
    const refreshOrder = () => {
      fetchOrderById(order.orderId)
        .then(nextOrder => {
          if (mounted) {
            setLiveOrder(nextOrder);
          }
        })
        .catch(() => {
          // Keep the last known order on transient network/API errors.
        });
    };
    refreshOrder();
    const interval = setInterval(refreshOrder, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [order?.orderId]);
  return (
    <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(34, bottomInset + 22),
          },
        ]}
        showsVerticalScrollIndicator
      >
        <View
          style={[
            styles.hero,
            {
              paddingTop: Math.max(54, topInset + 18),
            },
          ]}
        >
          <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
            <ArrowLeftIcon />
          </Pressable>
          <View style={styles.heroBottom}>
            <View>
              <Text style={styles.heroTitle}>Live Tracking</Text>
              <Text style={styles.heroSubtitle}>
                {displayOrder?.orderId ? `Order #${displayOrder.orderId}` : 'No order selected'}
              </Text>
            </View>
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>● LIVE</Text>
            </View>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.riderBubble}>
            <Text style={styles.riderIcon}>🛵</Text>
            <View style={styles.pinDot} />
          </View>
          <Text style={styles.mapTitle}>{activeStatus}</Text>
          <Text style={styles.mapSub}>
            {eta ? `Live map view · ETA ${eta}` : 'Live map view'}
          </Text>
        </View>

        <View style={styles.etaCard}>
          <View>
            <Text style={styles.etaLabel}>◷ Estimated Arrival</Text>
            <Text style={styles.etaTime}>{eta || '-'}</Text>
          </View>
          <View style={styles.etaRight}>
            <Text style={styles.etaNumber}>
              {activeIndex >= 4 ? '0' : '18'}
            </Text>
            <Text style={styles.etaMin}>min away</Text>
          </View>
        </View>

        <View style={[styles.partnerCard, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
          <Text style={styles.partnerAvatar}>👨🏽</Text>
          <View style={styles.partnerCopy}>
            <Text style={[styles.partnerName, { color: themeColors.text }]}>
              {displayOrder?.chef || displayOrder?.homeChefName || '-'}
            </Text>
            <Text style={styles.partnerMeta}>
              {[displayOrder?.meal, amount].filter(Boolean).join(' · ')}
            </Text>
            <Text style={styles.partnerRating}>
              {[displayOrder?.paymentMethod, displayOrder?.paymentStatus]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
          <Pressable style={styles.contactCircle}>
            <Text style={styles.contactText}>☎</Text>
          </Pressable>
          <Pressable style={[styles.contactCircle, styles.chatCircle]}>
            <Text style={styles.chatText}>♡</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>
          Order Details
        </Text>
        <View style={[styles.detailsCard, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
          <DetailRow label="Placed On" value={placedAt} />
          <DetailRow label="Last Updated" value={updatedAt} />
          <DetailRow
            label="Delivery Address"
            value={displayOrder?.address || '-'}
          />
          <DetailRow
            label="Payment"
            value={[
              displayOrder?.paymentProvider,
              displayOrder?.paymentMethod,
              displayOrder?.paymentStatus,
            ]
              .filter(Boolean)
              .join(' · ')}
          />
          <DetailRow
            label="Payment ID"
            value={displayOrder?.paymentId || '-'}
          />
          <DetailRow
            label="Items"
            value={(displayOrder?.items || []).join(', ') || '-'}
          />
          <DetailRow
            label="Source"
            value={displayOrder?.source || 'middo-app'}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>
          Order Status
        </Text>
        <View style={styles.timeline}>
          {statusSteps.map((item, index) => {
            const done = index <= activeIndex;
            const current =
              index === activeIndex && activeIndex < statusSteps.length - 1;
            return (
              <View key={item.label} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View
                    style={[
                      styles.timelineDot,
                      done ? styles.timelineDotDone : styles.timelineDotPending,
                      current ? styles.timelineDotCurrent : undefined,
                    ]}
                  >
                    <Text style={styles.timelineIcon}>{item.icon}</Text>
                  </View>
                  {index < statusSteps.length - 1 ? (
                    <View style={styles.timelineLine} />
                  ) : null}
                </View>
                <View style={styles.timelineCopy}>
                  <View style={styles.timelineTitleRow}>
                    <Text
                      style={[
                        styles.timelineTitle,
                        !done ? styles.pendingText : undefined,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.timelineTime}>
                      {done ? 'Done' : 'Pending'}
                    </Text>
                  </View>
                  {current ? (
                    <Text style={styles.progressText}>Current status</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
function DetailRow({ label, value }) {
  const { themeColors } = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color: themeColors.text }]}>
        {value}
      </Text>
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
    minHeight: 180,
    justifyContent: 'space-between',
    marginHorizontal: -18,
    paddingHorizontal: 22,
    paddingBottom: 26,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: '#20b957',
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.22)',
    cursor: 'pointer',
  },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 5,
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  liveBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  mapCard: {
    minHeight: 202,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    borderRadius: 22,
    backgroundColor: '#d9fae5',
  },
  riderBubble: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 38,
    backgroundColor: '#cbf8dc',
  },
  riderIcon: {
    fontSize: 29,
  },
  pinDot: {
    position: 'absolute',
    top: 4,
    right: 10,
    width: 18,
    height: 18,
    borderWidth: 5,
    borderColor: colors.orange,
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  mapTitle: {
    marginTop: 18,
    color: '#0b8a42',
    fontSize: 16,
    fontWeight: '900',
  },
  mapSub: {
    marginTop: 16,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  etaCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#84e8a9',
    borderRadius: 17,
    backgroundColor: '#dffbea',
  },
  etaLabel: {
    color: '#087b38',
    fontSize: 13,
    fontWeight: '800',
  },
  etaTime: {
    marginTop: 4,
    color: '#087b38',
    fontSize: 17,
    fontWeight: '900',
  },
  etaRight: {
    alignItems: 'center',
  },
  etaNumber: {
    color: '#089944',
    fontSize: 28,
    fontWeight: '900',
  },
  etaMin: {
    color: '#089944',
    fontSize: 12,
    fontWeight: '800',
  },
  partnerCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  partnerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    fontSize: 38,
    lineHeight: 52,
    textAlign: 'center',
  },
  partnerCopy: {
    flex: 1,
  },
  partnerName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  partnerMeta: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  partnerRating: {
    marginTop: 1,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  contactCircle: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8ee6ad',
    borderRadius: 21,
    backgroundColor: '#e8fbef',
  },
  chatCircle: {
    borderColor: '#ffccb8',
    backgroundColor: '#fff1e9',
  },
  contactText: {
    color: '#0fb45a',
    fontSize: 20,
    fontWeight: '900',
  },
  chatText: {
    color: colors.orange,
    fontSize: 20,
    fontWeight: '900',
  },
  detailsCard: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  detailRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  detailValue: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900',
    textAlign: 'right',
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 14,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  timeline: {
    paddingBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 78,
  },
  timelineRail: {
    width: 52,
    alignItems: 'center',
  },
  timelineDot: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  timelineDotDone: {
    backgroundColor: '#22c75a',
  },
  timelineDotCurrent: {
    backgroundColor: colors.orange,
  },
  timelineDotPending: {
    backgroundColor: colors.yellow,
  },
  timelineIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#22c75a',
  },
  timelineCopy: {
    flex: 1,
    paddingTop: 8,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  pendingText: {
    color: '#777',
  },
  timelineTime: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  progressText: {
    marginTop: 8,
    color: colors.orange,
    fontSize: 12,
    fontWeight: '800',
  },
});
