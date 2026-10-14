import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useCustomerProfile } from '../context/CustomerProfileContext';
import { useTheme } from '../context/ThemeContext';
import { fetchCustomerNotifications } from '../services/customerApi';
import { colors } from '../theme/colors';

const defaultNotificationPrefs = {
  orderUpdates: true,
  promotions: true,
  mealReminders: false,
};

export function NotificationsScreen({
  topInset,
  bottomInset,
  hasUnreadNotifications,
  onMarkAllRead,
  onBack,
}) {
  const { themeColors } = useTheme();
  const { customerProfile } = useCustomerProfile();
  const [notifications, setNotifications] = useState([]);
  const notificationPrefs = {
    ...defaultNotificationPrefs,
    ...(customerProfile?.settings?.notifications || {}),
  };
  const visibleNotifications = notifications.filter(item => {
    const category = getNotificationCategory(item);
    return notificationPrefs[category] !== false;
  });
  useEffect(() => {
    let mounted = true;
    fetchCustomerNotifications()
      .then(data => {
        if (mounted) {
          setNotifications(data.notifications || []);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);
  const unreadCount = hasUnreadNotifications ? visibleNotifications.length : 0;
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
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Notifications</Text>
            <Text style={styles.heroSubtitle}>{unreadCount} unread</Text>
          </View>
          <Pressable onPress={onMarkAllRead} style={styles.readButton}>
            <Text style={styles.readText}>Mark all read</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>
          NEW
        </Text>
        <View style={styles.list}>
          {visibleNotifications.length ? visibleNotifications.map(item => (
            <NotificationCard
              key={item._id || item.title}
              item={item}
              unread={hasUnreadNotifications}
            />
          )) : (
            <Text style={[styles.emptyText, { color: themeColors.muted }]}>
              No notifications enabled yet.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function getNotificationCategory(item = {}) {
  if (item.category && defaultNotificationPrefs[item.category] != null) {
    return item.category;
  }
  const searchableText = [
    item.type,
    item.title,
    item.body,
    item.message,
    item.tone,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/\b(promo|promotion|offer|deal|discount|coupon|menu live)\b/.test(searchableText)) {
    return 'promotions';
  }
  if (/\b(reminder|remind|meal reminder|before delivery)\b/.test(searchableText)) {
    return 'mealReminders';
  }
  return 'orderUpdates';
}

function NotificationCard({ item, unread }) {
  const { themeColors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: themeColors.card, borderColor: themeColors.line },
        unread ? styles.cardUnread : undefined,
      ]}
    >
      <View style={[styles.iconBox, getIconStyle(item.tone)]}>
        <Text style={styles.iconText}>{item.icon || 'ⓘ'}</Text>
      </View>
      <View style={styles.cardCopy}>
        <Text
          style={[
            styles.cardTitle,
            { color: themeColors.cardText },
            unread ? styles.unreadTitle : undefined,
          ]}
        >
          {item.title}
        </Text>
        {item.body || item.message ? (
          <Text style={[styles.cardBody, { color: themeColors.muted }]}>
            {item.body || item.message}
          </Text>
        ) : null}
        <Text
          style={[
            styles.time,
            { color: themeColors.placeholder },
            unread ? styles.timeUnread : undefined,
          ]}
        >
          {formatNotificationDate(item.createdAt)}
        </Text>
      </View>
      {unread ? <View style={styles.unreadDot} /> : null}
    </View>
  );
}
function formatNotificationDate(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
function getIconStyle(tone) {
  if (tone === 'green') {
    return styles.greenIcon;
  }
  if (tone === 'peach') {
    return styles.peachIcon;
  }
  if (tone === 'blue') {
    return styles.blueIcon;
  }
  if (tone === 'purple') {
    return styles.purpleIcon;
  }
  return styles.yellowIcon;
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
    minHeight: 136,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: colors.orange,
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
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 5,
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  readButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.22)',
    cursor: 'pointer',
  },
  readText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: '#777',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  list: {
    gap: 12,
  },
  emptyText: {
    paddingVertical: 18,
    color: '#777',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  card: {
    minHeight: 112,
    flexDirection: 'row',
    gap: 13,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  cardUnread: {
    borderColor: '#ffc9b9',
  },
  iconBox: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  greenIcon: {
    backgroundColor: '#e8fbef',
  },
  peachIcon: {
    backgroundColor: '#fff0e7',
  },
  blueIcon: {
    backgroundColor: '#eaf3ff',
  },
  yellowIcon: {
    backgroundColor: '#fff8dc',
  },
  purpleIcon: {
    backgroundColor: '#f5e9ff',
  },
  iconText: {
    fontSize: 19,
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    color: '#6d6d70',
    fontSize: 16,
    fontWeight: '900',
  },
  unreadTitle: {
    fontWeight: '900',
  },
  cardBody: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  time: {
    marginTop: 12,
    color: '#999',
    fontSize: 12,
    fontWeight: '800',
  },
  timeUnread: {
    color: colors.orange,
  },
  unreadDot: {
    width: 8,
    height: 8,
    marginTop: 4,
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
});
