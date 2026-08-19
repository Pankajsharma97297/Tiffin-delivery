import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { Icons } from '../../theme/images';
import { colors } from '../../theme/colors';
import { fetchPartnerNotifications } from '../../services/partnerApi';
import { useTheme } from '../../context/ThemeContext';

const tabs = ['All', 'Orders', 'Payments', 'Alerts'];

// Format a local FCM push message into a display row
function mapLocalAlert(msg, index) {
  const data = msg?.data || {};
  const notification = msg?.notification || {};
  const category =
    /payment|paid|wallet/i.test(`${data.type || ''}`)
      ? 'payments'
      : data.type === 'order_assigned' ||
        data.type === 'vendor_order_assigned' ||
        data.type === 'rider_order_assigned' ||
        data.type === 'delivery_assigned'
        ? 'orderUpdates'
        : 'general';

  return {
    _id: `local_${data.type || 'msg'}_${index}_${Date.now()}`,
    title: notification.title || data.title || 'New Notification',
    body: notification.body || data.body || 'You have a new update.',
    orderId: data.orderId || data.order_id || '',
    category,
    isLocal: true,
    receivedAt: Date.now(),
  };
}

export function AlertsPanel({ localAlerts = [], onBack, refreshKey = 0, topInset = 0 }) {
  const { darkMode, themeColors } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [backendRows, setBackendRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(() => {
    setLoading(true);
    fetchPartnerNotifications()
      .then(notifications => {
        setBackendRows(Array.isArray(notifications) ? notifications : []);
      })
      .catch(() => {
        setBackendRows([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications, refreshKey]);

  // Merge backend rows + local push alerts (deduplicated by _id)
  const rows = useMemo(() => {
    const localMapped = localAlerts.map((msg, i) => mapLocalAlert(msg, i));
    const backendIds = new Set(backendRows.map(r => r._id));
    const uniqueLocal = localMapped.filter(r => !backendIds.has(r._id));
    // Local (newest) first, then backend
    return [...uniqueLocal.reverse(), ...backendRows];
  }, [backendRows, localAlerts]);

  const visibleRows = useMemo(() => {
    const tab = tabs[activeTab];

    if (tab === 'All') {
      return rows;
    }

    if (tab === 'Orders') {
      return rows.filter(row => row.category === 'orderUpdates' || row.orderId);
    }

    if (tab === 'Payments') {
      return rows.filter(row =>
        row.category === 'payments' ||
        /payment|paid|wallet/i.test(`${row.title || ''} ${row.body || ''}`),
      );
    }

    return rows.filter(row => row.category !== 'orderUpdates' && row.category !== 'payments');
  }, [activeTab, rows]);

  const cardBg = darkMode ? '#1e1c1b' : colors.white;
  const tabsBg = darkMode ? '#1a1816' : colors.white;
  const tabsBorder = darkMode ? '#2e2724' : '#eadfd7';

  return (
    <>
      <View style={[styles.hero, { paddingTop: Math.max(42, topInset + 10) }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Image source={Icons.Back} style={styles.backIcon} />
          </Pressable>
          <Text style={styles.title}>Notifications</Text>
          {rows.length > 0 ? (
            <>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{rows.length}</Text>
              </View>
              <Pressable onPress={loadNotifications} style={styles.markReadButton}>
                <Text style={styles.markReadText}>Refresh</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>

      <View style={[styles.tabs, { backgroundColor: tabsBg, borderBottomColor: tabsBorder }]}>
        {tabs.map((tab, index) => {
          const active = index === activeTab;
          return (
            <Pressable key={tab} onPress={() => setActiveTab(index)} style={[styles.tab, active ? styles.tabActive : null]}>
              <Text style={[styles.tabText, { color: darkMode ? '#8a7a72' : '#8d7b72' }, active ? styles.tabTextActive : null]}>{tab}</Text>
            </Pressable>
          );
        })}
      </View>

      {visibleRows.length > 0 ? null : (
        <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: tabsBorder }]}>
          <Image source={Icons.Bell} style={styles.emptyIcon} />
          <Text style={[styles.emptyTitle, { color: themeColors.ink }]}>{loading ? 'Loading alerts...' : 'No alerts yet.'}</Text>
          <Text style={[styles.emptyCopy, { color: themeColors.muted }]}>
            {loading
              ? 'Fetching your latest order and delivery updates.'
              : 'Order, payment, approval, and delivery updates will appear here.'}
          </Text>
        </View>
      )}

      {visibleRows.map((row, idx) => {
        const isOrder = row.category === 'orderUpdates';
        const isPayment = row.category === 'payments';
        const iconTint = isOrder ? '#279fda' : isPayment ? '#f5a400' : colors.orange;
        const cardBorder = darkMode
          ? (isOrder ? '#0d2a3a' : isPayment ? '#2a1f00' : '#2e2724')
          : (isOrder ? '#cce8ff' : isPayment ? '#ffe3a3' : '#eadfd7');
        const iconBg = darkMode
          ? (isOrder ? '#0d2030' : isPayment ? '#201800' : '#2a1a10')
          : (isOrder ? '#dcf3ff' : isPayment ? '#fff2c8' : '#fff0e8');

        return (
          <View
            key={row._id || row.orderId || `row_${idx}`}
            style={[styles.notificationCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
              <Image source={Icons.Bell} style={[styles.notificationIcon, { tintColor: iconTint }]} />
            </View>
            <View style={styles.notificationCopy}>
              <Text style={[styles.notificationTitle, { color: themeColors.ink }]}>{row.title}</Text>
              <Text style={[styles.notificationBody, { color: themeColors.muted }]}>{row.body}</Text>
              <View style={styles.notificationFooter}>
                {row.orderId ? (
                  <View style={[styles.orderPill, darkMode ? styles.orderPillDark : null]}>
                    <Text style={[styles.orderPillText, darkMode ? styles.orderPillTextDark : null]}>#{row.orderId}</Text>
                  </View>
                ) : null}
                {row.isLocal ? (
                  <View style={[styles.orderPill, styles.livePill, darkMode ? styles.livePillDark : null]}>
                    <Text style={[styles.orderPillText, styles.livePillText]}>● Live</Text>
                  </View>
                ) : null}
                <Text style={[styles.notificationTime, { color: themeColors.muted }]}>
                  {row.isLocal ? 'Just now' : row.createdAt ? new Date(row.createdAt).toLocaleTimeString() : 'Recent'}
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      {rows.length > 0 ? (
        <View style={styles.clearAll}>
          <Image source={Icons.Delete} style={[styles.clearIcon, { tintColor: themeColors.muted }]} />
          <Text style={[styles.clearText, { color: themeColors.muted }]}>Clear all notifications</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backIcon: {
    height: 19,
    tintColor: colors.white,
    width: 19,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#ff72a6',
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    marginLeft: 8,
    width: 18,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  clearAll: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
    marginTop: 20,
  },
  clearIcon: {
    height: 15,
    width: 15,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
    padding: 22,
  },
  emptyCopy: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 5,
    textAlign: 'center',
  },
  emptyIcon: {
    height: 24,
    tintColor: colors.orange,
    width: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  hero: {
    backgroundColor: colors.orange,
    marginHorizontal: -14,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    marginRight: 12,
    width: 42,
  },
  livePill: {
    backgroundColor: '#dcfce7',
  },
  livePillDark: {
    backgroundColor: '#0d2a18',
  },
  livePillText: {
    color: '#15803d',
  },
  markReadButton: {
    marginLeft: 'auto',
  },
  markReadText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  notificationBody: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 3,
  },
  notificationCard: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 13,
    padding: 16,
  },
  notificationCopy: {
    flex: 1,
  },
  notificationFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  notificationIcon: {
    height: 21,
    width: 21,
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '700',
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  orderPill: {
    backgroundColor: '#e8f3ff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orderPillDark: {
    backgroundColor: '#0d2030',
  },
  orderPillText: {
    color: '#1167ff',
    fontSize: 11,
    fontWeight: '900',
  },
  orderPillTextDark: {
    color: '#60a5fa',
  },
  tab: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flex: 1,
    height: 42,
    justifyContent: 'center',
  },
  tabActive: {
    borderBottomColor: colors.orange,
  },
  tabs: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: 18,
    marginHorizontal: -14,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '900',
  },
  tabTextActive: {
    color: colors.orange,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 12,
  },
});
