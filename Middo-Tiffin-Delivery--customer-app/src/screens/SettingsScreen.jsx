import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useCustomerProfile } from '../context/CustomerProfileContext';
import { useTheme } from '../context/ThemeContext';
import { fetchHomeData } from '../services/homeApi';
import {
  deactivateCustomerAccount,
  deleteCustomerAccount,
  updateCustomerSettings,
} from '../services/settingsApi';
import { colors } from '../theme/colors';
import { Icons } from '../theme/images';
const notificationRows = [
  ['orderUpdates', Icons.Bell],
  ['promotions', Icons.Bell],
  ['mealReminders', Icons.Bell],
];
const generalRows = [
  [Icons.Location, 'savedAddresses', 'saved'],
  [Icons.Shield, 'privacy', 'none'],
  [Icons.Language, 'language', 'language'],
];
const defaultSettings = {
  notifications: {
    orderUpdates: true,
    promotions: true,
    mealReminders: false,
  },
  appearance: {
    darkMode: false,
  },
  language: 'English (India)',
};
const languageOptions = ['English (India)', 'Hindi', 'Punjabi', 'Gujarati'];
const copy = {
  'English (India)': {
    settings: 'Settings',
    notifications: 'Notifications',
    orderUpdates: 'Order Updates',
    orderUpdatesSub: 'Delivery, confirmation alerts',
    promotions: 'Promotions',
    promotionsSub: 'Offers, deals, and discounts',
    mealReminders: 'Meal Reminders',
    mealRemindersSub: 'Remind me before delivery',
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    darkModeOn: 'Dark theme enabled',
    darkModeOff: 'Switch to dark theme',
    general: 'General',
    savedAddresses: 'Saved Addresses',
    savedAddressesSub: 'Manage delivery locations',
    privacy: 'Privacy & Security',
    privacySub: 'Password, data settings',
    language: 'Language',
    account: 'Account',
    deactivate: 'Deactivate Account',
    deactivateSub: 'Temporarily disable your account',
    delete: 'Delete Account',
    deleteSub: 'Permanently remove your data',
    chooseLanguage: 'Choose app language',
    cancel: 'Cancel',
  },
  Hindi: {
    settings: 'सेटिंग्स',
    notifications: 'नोटिफिकेशन',
    orderUpdates: 'ऑर्डर अपडेट',
    orderUpdatesSub: 'डिलीवरी और कन्फर्मेशन अलर्ट',
    promotions: 'प्रमोशन',
    promotionsSub: 'ऑफर, डील और डिस्काउंट',
    mealReminders: 'मील रिमाइंडर',
    mealRemindersSub: 'डिलीवरी से पहले याद दिलाएं',
    appearance: 'दिखावट',
    darkMode: 'डार्क मोड',
    darkModeOn: 'डार्क थीम चालू है',
    darkModeOff: 'डार्क थीम पर स्विच करें',
    general: 'सामान्य',
    savedAddresses: 'सेव्ड एड्रेस',
    savedAddressesSub: 'डिलीवरी लोकेशन मैनेज करें',
    privacy: 'प्राइवेसी और सुरक्षा',
    privacySub: 'पासवर्ड और डेटा सेटिंग्स',
    language: 'भाषा',
    account: 'अकाउंट',
    deactivate: 'अकाउंट निष्क्रिय करें',
    deactivateSub: 'अकाउंट को अस्थायी रूप से बंद करें',
    delete: 'अकाउंट डिलीट करें',
    deleteSub: 'अपना डेटा हमेशा के लिए हटाएं',
    chooseLanguage: 'ऐप की भाषा चुनें',
    cancel: 'कैंसल',
  },
  Punjabi: {
    settings: 'ਸੈਟਿੰਗਾਂ',
    notifications: 'ਨੋਟੀਫਿਕੇਸ਼ਨ',
    orderUpdates: 'ਆਰਡਰ ਅਪਡੇਟ',
    orderUpdatesSub: 'ਡਿਲਿਵਰੀ ਅਤੇ ਪੁਸ਼ਟੀ ਅਲਰਟ',
    promotions: 'ਪ੍ਰਮੋਸ਼ਨ',
    promotionsSub: 'ਆਫਰ, ਡੀਲ ਅਤੇ ਛੂਟ',
    mealReminders: 'ਮੀਲ ਰਿਮਾਈਂਡਰ',
    mealRemindersSub: 'ਡਿਲਿਵਰੀ ਤੋਂ ਪਹਿਲਾਂ ਯਾਦ ਦਿਵਾਓ',
    appearance: 'ਦਿੱਖ',
    darkMode: 'ਡਾਰਕ ਮੋਡ',
    darkModeOn: 'ਡਾਰਕ ਥੀਮ ਚਾਲੂ ਹੈ',
    darkModeOff: 'ਡਾਰਕ ਥੀਮ ਤੇ ਜਾਓ',
    general: 'ਜਨਰਲ',
    savedAddresses: 'ਸੇਵ ਕੀਤੇ ਪਤੇ',
    savedAddressesSub: 'ਡਿਲਿਵਰੀ ਲੋਕੇਸ਼ਨ ਮੈਨੇਜ ਕਰੋ',
    privacy: 'ਪਰਦੇਦਾਰੀ ਅਤੇ ਸੁਰੱਖਿਆ',
    privacySub: 'ਪਾਸਵਰਡ ਅਤੇ ਡਾਟਾ ਸੈਟਿੰਗਾਂ',
    language: 'ਭਾਸ਼ਾ',
    account: 'ਅਕਾਊਂਟ',
    deactivate: 'ਅਕਾਊਂਟ ਬੰਦ ਕਰੋ',
    deactivateSub: 'ਅਕਾਊਂਟ ਅਸਥਾਈ ਤੌਰ ਤੇ ਬੰਦ ਕਰੋ',
    delete: 'ਅਕਾਊਂਟ ਮਿਟਾਓ',
    deleteSub: 'ਆਪਣਾ ਡਾਟਾ ਪੱਕੇ ਤੌਰ ਤੇ ਹਟਾਓ',
    chooseLanguage: 'ਐਪ ਭਾਸ਼ਾ ਚੁਣੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
  },
  Gujarati: {
    settings: 'સેટિંગ્સ',
    notifications: 'નોટિફિકેશન',
    orderUpdates: 'ઓર્ડર અપડેટ',
    orderUpdatesSub: 'ડિલિવરી અને કન્ફર્મેશન અલર્ટ',
    promotions: 'પ્રમોશન',
    promotionsSub: 'ઓફર, ડીલ અને ડિસ્કાઉન્ટ',
    mealReminders: 'મીલ રિમાઇન્ડર',
    mealRemindersSub: 'ડિલિવરી પહેલા યાદ અપાવો',
    appearance: 'દેખાવ',
    darkMode: 'ડાર્ક મોડ',
    darkModeOn: 'ડાર્ક થીમ ચાલુ છે',
    darkModeOff: 'ડાર્ક થીમ પર સ્વિચ કરો',
    general: 'સામાન્ય',
    savedAddresses: 'સેવ કરેલા સરનામાં',
    savedAddressesSub: 'ડિલિવરી લોકેશન મેનેજ કરો',
    privacy: 'પ્રાઇવસી અને સુરક્ષા',
    privacySub: 'પાસવર્ડ અને ડેટા સેટિંગ્સ',
    language: 'ભાષા',
    account: 'એકાઉન્ટ',
    deactivate: 'એકાઉન્ટ નિષ્ક્રિય કરો',
    deactivateSub: 'એકાઉન્ટ થોડા સમય માટે બંધ કરો',
    delete: 'એકાઉન્ટ ડિલીટ કરો',
    deleteSub: 'તમારો ડેટા કાયમ માટે દૂર કરો',
    chooseLanguage: 'એપ ભાષા પસંદ કરો',
    cancel: 'કૅન્સલ',
  },
};
export function SettingsScreen({
  topInset,
  bottomInset,
  darkMode,
  onBack,
  onDarkModeChange,
  onLogout,
  onSavedAddresses,
}) {
  const { themeColors } = useTheme();
  const { customerProfile, mergeCustomerProfile } = useCustomerProfile();
  const [customer, setCustomer] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const identity = useMemo(
    () => ({
      email: customer?.email || customerProfile?.email,
      phone: customer?.phone || customerProfile?.phone,
    }),
    [customer?.email, customer?.phone, customerProfile?.email, customerProfile?.phone],
  );
  const labels =
    copy[settings.language || defaultSettings.language] ||
    copy['English (India)'];
  const isDarkMode = Boolean(darkMode);
  useEffect(() => {
    let mounted = true;
    fetchHomeData()
      .then(data => {
        if (!mounted) {
          return;
        }
        setCustomer(data.customer);
        mergeCustomerProfile(data.customer);
        const nextSettings = {
          notifications: {
            ...defaultSettings.notifications,
            ...(data.customer.settings?.notifications || {}),
          },
          appearance: {
            ...defaultSettings.appearance,
            ...(data.customer.settings?.appearance || {}),
          },
          language:
            data.customer.settings?.language || defaultSettings.language,
        };
        setSettings(nextSettings);
        onDarkModeChange?.(Boolean(nextSettings.appearance.darkMode));
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [mergeCustomerProfile, onDarkModeChange]);
  const persistSettings = nextSettings => {
    const previousSettings = settings;
    setSettings(nextSettings);
    mergeCustomerProfile({ settings: nextSettings });
    onDarkModeChange?.(Boolean(nextSettings.appearance?.darkMode));
    if (!identity.email && !identity.phone) {
      return;
    }
    updateCustomerSettings(identity, nextSettings)
      .then(data => {
        if (data.customer) {
          setCustomer(data.customer);
          mergeCustomerProfile(data.customer);
        }
      })
      .catch(error => {
        setSettings(previousSettings);
        mergeCustomerProfile({ settings: previousSettings });
        onDarkModeChange?.(Boolean(previousSettings.appearance?.darkMode));
        Alert.alert('Settings not saved', error.message);
      });
  };
  const toggleNotification = key => {
    persistSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications?.[key],
      },
    });
  };
  const toggleDarkMode = () => {
    const nextDarkMode = !isDarkMode;
    persistSettings({
      ...settings,
      appearance: {
        ...settings.appearance,
        darkMode: nextDarkMode,
      },
    });
  };
  const chooseLanguage = () => {
    const buttons = languageOptions.map(label => ({
      text: label,
      onPress: () =>
        persistSettings({
          ...settings,
          language: label,
        }),
    }));
    buttons.push({
      text: labels.cancel,
      style: 'cancel',
    });
    Alert.alert(labels.language, labels.chooseLanguage, buttons);
  };
  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate account?',
      'Your account will be disabled until admin activates it again.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            deactivateCustomerAccount(identity)
              .then(() => {
                Alert.alert(
                  'Account deactivated',
                  'Your account has been disabled.',
                );
                onLogout?.();
              })
              .catch(error =>
                Alert.alert('Unable to deactivate', error.message),
              );
          },
        },
      ],
    );
  };
  const handleDelete = () => {
    Alert.alert(
      'Delete account?',
      'This will permanently remove your customer account data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCustomerAccount(identity)
              .then(() => {
                Alert.alert(
                  'Account deleted',
                  'Your account data has been removed.',
                );
                onLogout?.();
              })
              .catch(error => Alert.alert('Unable to delete', error.message));
          },
        },
      ],
    );
  };
  const defaultAddress =
    customer?.savedAddresses?.find(item => item.isDefault)?.liveAddress ||
    customer?.liveAddress ||
    customer?.address ||
    labels.savedAddressesSub;
  return (
    <View
      style={[
        styles.screen,
        isDarkMode ? styles.screenDark : undefined,
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(28, bottomInset + 18),
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
          <Text style={styles.heroTitle}>{labels.settings}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>
          {labels.notifications}
        </Text>
        <View style={[styles.card, isDarkMode ? styles.cardDark : null]}>
          {notificationRows.map(([key, icon]) => (
            <SettingsRow
              key={key}
              icon={icon}
              darkMode={isDarkMode}
              title={labels[key]}
              subtitle={labels[`${key}Sub`]}
              enabled={Boolean(settings.notifications?.[key])}
              onPress={() => toggleNotification(key)}
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>
          {labels.appearance}
        </Text>
        <View style={[styles.card, isDarkMode ? styles.cardDark : null]}>
          <SettingsRow
            darkMode={isDarkMode}
            icon={isDarkMode ? Icons.Dark : Icons.Sun}
            title={labels.darkMode}
            subtitle={
              isDarkMode
                ? labels.darkModeOn
                : labels.darkModeOff
            }
            enabled={isDarkMode}
            onPress={toggleDarkMode}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>
          {labels.general}
        </Text>
        <View style={[styles.card, isDarkMode ? styles.cardDark : null]}>
          {generalRows.map(([icon, key, action]) => (
            <SettingsNavRow
              key={key}
              icon={icon}
              darkMode={isDarkMode}
              title={labels[key]}
              subtitle={
                action === 'saved'
                  ? defaultAddress
                  : action === 'language'
                  ? settings.language || defaultSettings.language
                  : labels[`${key}Sub`]
              }
              onPress={
                action === 'saved'
                  ? onSavedAddresses
                  : action === 'language'
                  ? chooseLanguage
                  : undefined
              }
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>
          {labels.account}
        </Text>
        <View style={[styles.card, isDarkMode ? styles.cardDark : null]}>
          <SettingsNavRow
            icon={Icons.Shield}
            darkMode={isDarkMode}
            title={labels.deactivate}
            subtitle={labels.deactivateSub}
            danger
            onPress={handleDeactivate}
          />
          <SettingsNavRow
            icon={Icons.Delete}
            darkMode={isDarkMode}
            title={labels.delete}
            subtitle={labels.deleteSub}
            danger
            strong
            onPress={handleDelete}
          />
        </View>
        <Text style={styles.version}>Middo v1.0</Text>
      </ScrollView>
    </View>
  );
}
function SettingsRow({ icon, title, subtitle, enabled, onPress, darkMode }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, darkMode ? styles.rowDark : null]}
    >
      <RowIcon source={icon} />
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, darkMode ? styles.textDark : null]}>
          {title}
        </Text>
        <Text style={[styles.rowSubtitle, darkMode ? styles.mutedDark : null]}>
          {subtitle}
        </Text>
      </View>
      <View
        style={[styles.switchTrack, enabled ? styles.switchTrackOn : undefined]}
      >
        <View
          style={[styles.switchKnob, enabled ? styles.switchKnobOn : undefined]}
        />
      </View>
    </Pressable>
  );
}
function SettingsNavRow({
  icon,
  title,
  subtitle,
  onPress,
  danger,
  strong,
  darkMode,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, darkMode ? styles.rowDark : null]}
    >
      <RowIcon danger={danger} source={icon} />
      <View style={styles.rowCopy}>
        <Text
          style={[
            styles.rowTitle,
            darkMode ? styles.textDark : null,
            danger && strong ? styles.dangerText : undefined,
          ]}
        >
          {title}
        </Text>
        <Text style={[styles.rowSubtitle, darkMode ? styles.mutedDark : null]}>
          {subtitle}
        </Text>
      </View>
      <Text style={[styles.chevron, darkMode ? styles.mutedDark : null]}>›</Text>
    </Pressable>
  );
}
function RowIcon({ source, danger }) {
  const isImageIcon = typeof source === 'number' || Boolean(source?.uri);
  return (
    <View style={[styles.rowIcon, danger ? styles.dangerIcon : undefined]}>
      {isImageIcon ? (
        <Image
          source={source}
          style={[styles.rowIconImage, danger ? styles.dangerIconImage : null]}
        />
      ) : (
        <Text>{source}</Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  screenDark: {
    backgroundColor: '#181412',
  },
  content: {
    paddingHorizontal: 18,
  },
  hero: {
    minHeight: 118,
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
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 9,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  cardDark: {
    borderColor: '#3a2c26',
    backgroundColor: '#241c18',
  },
  row: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowDark: {
    borderBottomColor: '#3a2c26',
  },
  rowIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff0e8',
  },
  rowIconImage: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: colors.orange,
  },
  dangerIcon: {
    backgroundColor: '#fff0f0',
  },
  dangerIconImage: {
    tintColor: '#ff3b3b',
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  textDark: {
    color: '#fff8f2',
  },
  dangerText: {
    color: '#ff3b3b',
  },
  rowSubtitle: {
    marginTop: 3,
    color: '#777',
    fontSize: 11,
  },
  mutedDark: {
    color: '#c8b7aa',
  },
  switchTrack: {
    width: 42,
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderRadius: 12,
    backgroundColor: '#f1ede8',
  },
  switchTrackOn: {
    backgroundColor: colors.orange,
  },
  switchKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  switchKnobOn: {
    alignSelf: 'flex-end',
  },
  chevron: {
    color: '#777',
    fontSize: 20,
  },
  version: {
    marginTop: 16,
    color: '#777',
    fontSize: 12,
    textAlign: 'center',
  },
});
