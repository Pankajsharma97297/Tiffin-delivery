import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useTheme } from '../context/ThemeContext';
import { fetchCustomerOrders } from '../services/customerApi';
import { colors } from '../theme/colors';
function formatOrderDate(value) {
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
export function MyOrdersScreen({
  topInset,
  bottomInset,
  latestOrder,
  onBack,
  onOrderPress,
}) {
  const { themeColors } = useTheme();
  const [orders, setOrders] = useState(latestOrder ? [latestOrder] : []);
  const [status, setStatus] = useState('Loading orders...');
  useEffect(() => {
    let mounted = true;
    fetchCustomerOrders()
      .then(data => {
        if (!mounted) {
          return;
        }
        const backendOrders = data.orders || [];
        const merged = latestOrder
          ? [
              latestOrder,
              ...backendOrders.filter(
                order => order.orderId !== latestOrder.orderId,
              ),
            ]
          : backendOrders;
        setOrders(merged);
        setStatus(
          merged.length > 0
            ? 'Live orders loaded from backend'
            : 'No backend orders yet',
        );
      })
      .catch(error => {
        if (!mounted) {
          return;
        }
        setStatus(
          error instanceof Error ? error.message : 'Unable to load orders',
        );
      });
    return () => {
      mounted = false;
    };
  }, [latestOrder]);
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
              paddingTop: Math.max(50, topInset + 16),
            },
          ]}
        >
          <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
            <ArrowLeftIcon />
          </Pressable>
          <View>
            <Text style={styles.heroTitle}>My Orders</Text>
            <Text style={styles.heroSubtitle}>
              Tap an order for full tracking
            </Text>
          </View>
        </View>

        <Text style={[styles.apiStatus, { color: themeColors.surfaceText }]}>
          {status}
        </Text>

        <View style={styles.orderList}>
          {orders.length ? orders.map(order => (
            <Pressable
              key={order._id || order.orderId}
              onPress={() => onOrderPress(order)}
              style={({ pressed }) => [
                styles.orderCard,
                pressed ? styles.pressed : undefined,
              ]}
            >
              <View style={styles.orderTopRow}>
                <View>
                  <Text style={[styles.orderId, { color: themeColors.text }]}>#{order.orderId}</Text>
                  <Text style={styles.orderDate}>
                    {formatOrderDate(order.createdAt)}
                  </Text>
                </View>
                <Text style={styles.statusPill}>{order.status}</Text>
              </View>

              <View style={styles.orderBody}>
                <Text style={[styles.orderMeal, { color: themeColors.text }]}>{order.meal}</Text>
                <Text style={styles.orderMeta}>
                  {[order.chef, order.orderType, order.eta]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                {order.address ? (
                  <Text style={styles.orderAddress}>{order.address}</Text>
                ) : null}
              </View>

              <View style={styles.orderBottomRow}>
                <Text style={styles.paymentText}>
                  {[
                    order.paymentProvider,
                    order.paymentMethod,
                    order.paymentStatus,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                <Text style={styles.amount}>{order.amount}</Text>
              </View>
            </Pressable>
          )) : (
            <Text style={styles.emptyText}>No orders found.</Text>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: colors.orange,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroTitle: {
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
  apiStatus: {
    marginTop: 12,
    color: colors.orange,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  orderList: {
    gap: 14,
    marginTop: 14,
  },
  emptyText: {
    paddingVertical: 18,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  orderCard: {
    padding: 15,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderId: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  orderDate: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#11833a',
    backgroundColor: '#e1f9e9',
    fontSize: 10,
    fontWeight: '900',
  },
  orderBody: {
    marginTop: 14,
  },
  orderMeal: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  orderMeta: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  orderAddress: {
    marginTop: 7,
    color: '#777',
    fontSize: 12,
    lineHeight: 17,
  },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  paymentText: {
    color: '#11833a',
    fontSize: 12,
    fontWeight: '900',
  },
  amount: {
    color: colors.orange,
    fontSize: 16,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.78,
  },
});
