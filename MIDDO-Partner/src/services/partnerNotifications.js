import { Alert, PermissionsAndroid, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { partnerRequest } from './partnerSession';

const PREFS_KEY = '@partner_push_prefs';

// Default preferences
const DEFAULT_PREFS = {
  push: true,
  orders: true,
  payments: true,
};

// All notification types that should trigger navigation / order refresh
const ORDER_ALERT_TYPES = new Set([
  'vendor_order_assigned',
  'rider_order_assigned',
  'partner_test_push',
  'order_assigned',
  'order_accepted',
  'order_status_update',
  'payment_received',
  'payment_approved',
  'payment_alert',
  'delivery_assigned',
  'delivery_completed',
  'delivery_status_update',
  'rider_assign',
]);

// Types that count as "order" category
const ORDER_CATEGORY_TYPES = new Set([
  'vendor_order_assigned',
  'rider_order_assigned',
  'order_assigned',
  'order_accepted',
  'order_status_update',
  'delivery_assigned',
  'delivery_completed',
  'delivery_status_update',
  'rider_assign',
]);

// Types that count as "payment" category
const PAYMENT_CATEGORY_TYPES = new Set([
  'payment_received',
  'payment_approved',
  'payment_alert',
]);

function isOrderAlertMessage(remoteMessage = {}) {
  return ORDER_ALERT_TYPES.has(remoteMessage.data?.type);
}

export function getMessageCategory(remoteMessage = {}) {
  const type = remoteMessage.data?.type || '';
  if (ORDER_CATEGORY_TYPES.has(type)) return 'orderUpdates';
  if (PAYMENT_CATEGORY_TYPES.has(type)) return 'payments';
  return 'general';
}

export async function getPushPrefs() {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function savePushPrefs(prefs) {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // silently ignore storage errors
  }
}

async function shouldShowAlert(remoteMessage = {}) {
  const prefs = await getPushPrefs();
  if (!prefs.push) return false;
  const category = getMessageCategory(remoteMessage);
  if (category === 'payments' && !prefs.payments) return false;
  if (category === 'orderUpdates' && !prefs.orders) return false;
  return true;
}

function showForegroundAlert(remoteMessage = {}) {
  const title = remoteMessage.notification?.title || 'New notification';
  const body = remoteMessage.notification?.body || 'You have a new update.';
  Alert.alert(title, body);
}

async function requestAndroidNotificationPermission() {
  if (Platform.OS !== 'android' || Platform.Version < 33) {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function registerPartnerPushNotifications() {
  // Respect master push setting
  const prefs = await getPushPrefs();
  if (!prefs.push) {
    return null;
  }

  const androidAllowed = await requestAndroidNotificationPermission();
  const authStatus = await messaging().requestPermission();
  const enabled =
    androidAllowed &&
    (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );

  if (!enabled) {
    return null;
  }

  await messaging().registerDeviceForRemoteMessages();
  const pushToken = await messaging().getToken();

  if (!pushToken) {
    return null;
  }

  await partnerRequest('/api/delivery-partner/profile/notifications/register-device', {
    method: 'POST',
    body: { pushToken },
  });

  return pushToken;
}

export function listenForPartnerPushTokenRefresh() {
  return messaging().onTokenRefresh(pushToken => {
    partnerRequest('/api/delivery-partner/profile/notifications/register-device', {
      method: 'POST',
      body: { pushToken },
    }).catch(() => undefined);
  });
}

/**
 * Listen for all foreground messages.
 * onOrderAlert is called with message data for order-related types.
 * onAnyAlert is called for ALL messages (used to populate in-app alerts list).
 */
export function listenForPartnerOrderAlerts(onOrderAlert, onAnyAlert) {
  return messaging().onMessage(async remoteMessage => {
    // Notify the alerts panel for every received message
    if (onAnyAlert) {
      onAnyAlert(remoteMessage);
    }

    // Show foreground system alert only if user preference allows
    const allowed = await shouldShowAlert(remoteMessage);
    if (allowed) {
      showForegroundAlert(remoteMessage);
    }

    // Trigger order refresh for order-related types
    if (isOrderAlertMessage(remoteMessage)) {
      onOrderAlert?.(remoteMessage.data);
    }
  });
}

export function listenForPartnerNotificationOpen(onOpen) {
  const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
    onOpen?.(remoteMessage.data);
  });

  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        onOpen?.(remoteMessage.data);
      }
    })
    .catch(() => undefined);

  return unsubscribeOpened;
}
