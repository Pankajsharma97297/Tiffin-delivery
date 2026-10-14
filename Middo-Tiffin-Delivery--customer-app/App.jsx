import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { AiChatbotScreen } from './src/screens/AiChatbotScreen';
import { CompleteProfileScreen } from './src/screens/CompleteProfileScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { HelpCenterScreen } from './src/screens/HelpCenterScreen';
import { HomeChefScreen } from './src/screens/HomeChefScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { MealSkippedScreen } from './src/screens/MealSkippedScreen';
import { MyOrdersScreen } from './src/screens/MyOrdersScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { PlansScreen } from './src/screens/PlansScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ReviewsScreen } from './src/screens/ReviewsScreen';
import { SavedAddressesScreen } from './src/screens/SavedAddressesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SkipMealScreen } from './src/screens/SkipMealScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { SubscriptionCalendarScreen } from './src/screens/SubscriptionCalendarScreen';
import { TrackingScreen } from './src/screens/TrackingScreen';
import { VerifyOtpScreen } from './src/screens/VerifyOtpScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { WhatsAppSupportScreen } from './src/screens/WhatsAppSupportScreen';
import {
  CustomerProfileProvider,
  useCustomerProfile,
} from './src/context/CustomerProfileContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { BottomNav } from './src/components/BottomNav';
import { clearAuthSession, getAuthSession } from './src/services/authSession';
import { fetchCustomerAppContent } from './src/services/appContentApi';
import { colors } from './src/theme/colors';
import { Icons, Images } from './src/theme/images';
import { logDebugData } from './src/utils/debugLog';

const iconAliases = {
  calender: 'Calendar',
  calendar: 'Calendar',
  credit_card: 'CreditCard',
  pickup: 'Pickup',
  rotate: 'Refresh',
  Rotate: 'Refresh',
};

function resolveIcon(iconKey, fallbackIcon) {
  return (
    Icons[iconKey] ||
    Icons[iconAliases[iconKey]] ||
    fallbackIcon ||
    Icons.CircleCheck
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
function AppContent() {
  const insets = useSafeAreaInsets();
  const { darkMode, themeColors, themePreferenceLoaded } = useTheme();
  if (!themePreferenceLoaded) {
    return (
      <CustomerProfileProvider>
        <StatusBar
          backgroundColor={themeColors.surface}
          barStyle={darkMode ? 'light-content' : 'dark-content'}
          translucent={false}
        />
        <View style={styles.simpleLoader}>
          <ActivityIndicator color={colors.orange} size="large" />
        </View>
      </CustomerProfileProvider>
    );
  }
  return (
    <CustomerProfileProvider>
      <AppNavigator insets={insets} />
    </CustomerProfileProvider>
  );
}

function getStatusBarConfig(activeScreen, darkMode, themeColors) {
  const surfaceScreens = new Set([1, 2, 3]);
  const backgroundColor = surfaceScreens.has(activeScreen)
    ? themeColors.surface
    : colors.orange;
  return {
    backgroundColor,
    barStyle:
      backgroundColor === colors.orange
        ? 'dark-content'
        : darkMode
        ? 'light-content'
        : 'dark-content',
  };
}

function AppNavigator({ insets }) {
  const { setCustomerProfile } = useCustomerProfile();
  const { applyProfileDarkMode, darkMode, setDarkMode, themeColors } =
    useTheme();
  const [activeScreen, setActiveScreen] = useState(0);
  const [splashComplete, setSplashComplete] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);
  const [loadingScreen, setLoadingScreen] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [onboardingSteps, setOnboardingSteps] = useState([]);
  const [savedAddressesBackScreen, setSavedAddressesBackScreen] = useState(10);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginDialCode, setLoginDialCode] = useState('+91');
  const [otpConfirmation, setOtpConfirmation] = useState(null);
  const [authProfile, setAuthProfile] = useState(null);
  const [latestOrder, setLatestOrder] = useState(null);
  const [trackingBackScreen, setTrackingBackScreen] = useState(6);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const isAuthenticated = Boolean(authProfile);
  const protectedScreens = new Set([
    6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 27,
  ]);
  const mainTabScreens = new Set([6, 7, 8, 9, 10]);

  useEffect(() => {
    let mounted = true;
    getAuthSession()
      .then(session => {
        if (!mounted) {
          return;
        }
        const profile = session?.customer || session?.user || null;
        if (session?.token && profile) {
          setAuthProfile(profile);
          setCustomerProfile(profile);
          if (profile.settings?.appearance?.darkMode != null) {
            applyProfileDarkMode(Boolean(profile.settings.appearance.darkMode));
          }
          setActiveScreen(6);
        }
      })
      .finally(() => {
        if (mounted) {
          setRestoringSession(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [applyProfileDarkMode, setCustomerProfile]);

  useEffect(() => {
    fetchCustomerAppContent(['onboarding'])
      .then(content => {
        const steps = (content.onboarding || []).map((step, index) => ({
          ...step,
          screen: index + 1,
          image: Images[step.imageKey],
          features: (step.features || []).map(feature => ({
            ...feature,
            icon: resolveIcon(feature.iconKey, feature.icon),
          })),
        }));
        setOnboardingSteps(steps);
      })
      .catch(() => setOnboardingSteps([]))
      .finally(() => setOnboardingLoading(false));
  }, []);

  useEffect(() => {
    if (!splashComplete || onboardingLoading || activeScreen !== 0) {
      return;
    }
    setActiveScreen(onboardingSteps.length ? 1 : 4);
  }, [activeScreen, onboardingLoading, onboardingSteps.length, splashComplete]);

  useEffect(() => {
    if (activeScreen === 0 || restoringSession) {
      return undefined;
    }
    setLoadingScreen(true);
    const timeout = setTimeout(() => setLoadingScreen(false), 180);
    return () => clearTimeout(timeout);
  }, [activeScreen, restoringSession]);

  const isProfileComplete = profile => {
    const address =
      profile?.liveAddress || profile?.address || profile?.location || '';
    const name = String(profile?.name || '').trim();
    const cleanNameDigits = name.replace(/\D/g, '');
    const cleanPhoneDigits = String(profile?.phone || '').replace(/\D/g, '');
    const hasRealName =
      name &&
      name !== 'MIDDO Customer' &&
      (!cleanPhoneDigits || cleanNameDigits !== cleanPhoneDigits);

    return Boolean(
      hasRealName && profile?.email && profile?.phone && String(address).trim(),
    );
  };

  // OTP verify ke baad backend phone se existing customer ko match karta hai.
  // Fresh/incomplete profile ho to details save karne ke liye profile screen khulti hai.
  const handleAuthSession = session => {
    const profile = session?.customer || session?.user || null;
    logDebugData('Login successful: session data from backend', {
      customer: session?.customer,
      user: session?.user,
      token: session?.token,
      selectedProfileForApp: profile,
    });
    setAuthProfile(profile);
    setCustomerProfile(profile);
    if (profile?.settings?.appearance?.darkMode != null) {
      applyProfileDarkMode(Boolean(profile.settings.appearance.darkMode));
    }
    setActiveScreen(isProfileComplete(profile) ? 6 : 27);
  };

  const handleLogout = () => {
    clearAuthSession().catch(() => undefined);
    setAuthProfile(null);
    setCustomerProfile(null);
    setActiveScreen(4);
  };
  const navigateMainTab = tab => {
    if (!isAuthenticated) {
      setActiveScreen(4);
      return;
    }
    const tabScreens = {
      home: 6,
      explore: 7,
      plans: 8,
      wallet: 9,
      profile: 10,
    };
    setActiveScreen(tabScreens[tab]);
  };
  const setProtectedScreen = screen => {
    setActiveScreen(isAuthenticated ? screen : 4);
  };
  const getActiveTabForScreen = screen => {
    if (screen === 22) {
      return trackingBackScreen === 23 ? 'profile' : 'home';
    }
    if (screen === 21 || screen === 19) {
      return 'home';
    }
    if (screen === 8 || screen === 17 || screen === 18 || screen === 20) {
      return 'plans';
    }
    if (screen === 9) {
      return 'wallet';
    }
    if (screen === 7) {
      return 'explore';
    }
    if (screen >= 10 && screen <= 23) {
      return 'profile';
    }
    return 'home';
  };
  const blockedScreen =
    !restoringSession &&
    !isAuthenticated &&
    protectedScreens.has(activeScreen) &&
    activeScreen !== 27;
  const shouldShowDetailBottomNav =
    isAuthenticated &&
    protectedScreens.has(activeScreen) &&
    !mainTabScreens.has(activeScreen) &&
    activeScreen !== 27;

  if (restoringSession) {
    return (
      <View style={[styles.appShell, { backgroundColor: themeColors.surface }]}>
        <StatusBar
          backgroundColor={themeColors.surface}
          barStyle={darkMode ? 'light-content' : 'dark-content'}
          translucent={false}
        />
        <View style={styles.simpleLoader}>
          <ActivityIndicator color={colors.orange} size="large" />
        </View>
      </View>
    );
  }

  const statusBarConfig = getStatusBarConfig(
    activeScreen,
    darkMode,
    themeColors,
  );

  return (
    <View style={[styles.appShell, { backgroundColor: themeColors.surface }]}>
      <StatusBar
        backgroundColor={statusBarConfig.backgroundColor}
        barStyle={statusBarConfig.barStyle}
        translucent={false}
      />
      {blockedScreen ? (
        <LoginScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onBack={() => setActiveScreen(3)}
          onSendOtp={(phone, dialCode, confirmation) => {
            setLoginPhone(phone);
            setLoginDialCode(dialCode);
            setOtpConfirmation(confirmation);
            setActiveScreen(5);
          }}
          onGoogleSignIn={handleAuthSession}
        />
      ) : activeScreen === 0 ? (
        <SplashScreen
          bottomInset={insets.bottom}
          onComplete={() => setSplashComplete(true)}
        />
      ) : activeScreen === 4 ? (
        <LoginScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onBack={() => setActiveScreen(3)}
          onSendOtp={(phone, dialCode, confirmation) => {
            setLoginPhone(phone);
            setLoginDialCode(dialCode);
            setOtpConfirmation(confirmation);
            setActiveScreen(5);
          }}
          onGoogleSignIn={handleAuthSession}
        />
      ) : activeScreen === 5 ? (
        <VerifyOtpScreen
          phone={loginPhone}
          dialCode={loginDialCode}
          confirmation={otpConfirmation}
          topInset={insets.top}
          bottomInset={insets.bottom}
          onChangeNumber={() => setActiveScreen(4)}
          onVerified={handleAuthSession}
        />
      ) : activeScreen === 6 ? (
        <HomeScreen
          bottomInset={insets.bottom}
          hasUnreadNotifications={hasUnreadNotifications}
          onNavigate={navigateMainTab}
          onCalendar={() => setProtectedScreen(17)}
          onHomeChef={() => setProtectedScreen(20)}
          onNotifications={() => {
            setHasUnreadNotifications(false);
            setProtectedScreen(21);
          }}
          onReviews={() => setProtectedScreen(16)}
          onSkipMeal={() => setProtectedScreen(18)}
          onTrack={order => {
            if (order) {
              setLatestOrder(order);
            }
            setTrackingBackScreen(6);
            setProtectedScreen(22);
          }}
          onOrderPlaced={order => {
            setLatestOrder(order);
            setHasUnreadNotifications(true);
            setTrackingBackScreen(6);
            setProtectedScreen(22);
          }}
        />
      ) : activeScreen === 7 ? (
        <ExploreScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onNavigate={navigateMainTab}
          onBackHome={() => setActiveScreen(6)}
          onOrderPlaced={order => {
            setLatestOrder(order);
            setHasUnreadNotifications(true);
            setTrackingBackScreen(6);
            setActiveScreen(22);
          }}
        />
      ) : activeScreen === 8 ? (
        <PlansScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onNavigate={navigateMainTab}
          onBackHome={() => setActiveScreen(6)}
        />
      ) : activeScreen === 9 ? (
        <WalletScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onNavigate={navigateMainTab}
          onBackHome={() => setActiveScreen(6)}
        />
      ) : activeScreen === 10 ? (
        <ProfileScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onNavigate={navigateMainTab}
          onBackHome={() => setActiveScreen(6)}
          onForward={() => setProtectedScreen(14)}
          onLogout={handleLogout}
          onSupportSelect={screen => setActiveScreen(screen)}
          onSavedAddresses={() => {
            setSavedAddressesBackScreen(10);
            setProtectedScreen(14);
          }}
          onReviews={() => setProtectedScreen(16)}
          onWallet={() => setProtectedScreen(9)}
          onPlans={() => setProtectedScreen(8)}
          onSubscription={() => setProtectedScreen(17)}
          onHomeChef={() => setProtectedScreen(20)}
          onOrders={() => setProtectedScreen(23)}
          latestOrder={latestOrder}
        />
      ) : activeScreen === 11 ? (
        <HelpCenterScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onBack={() => setActiveScreen(10)}
        />
      ) : activeScreen === 12 ? (
        <WhatsAppSupportScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onBack={() => setActiveScreen(10)}
        />
      ) : activeScreen === 13 ? (
        <AiChatbotScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onBack={() => setActiveScreen(10)}
        />
      ) : activeScreen === 14 ? (
        <SettingsScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          darkMode={darkMode}
          onBack={() => setActiveScreen(10)}
          onDarkModeChange={setDarkMode}
          onLogout={handleLogout}
          onSavedAddresses={() => {
            setSavedAddressesBackScreen(14);
            setProtectedScreen(15);
          }}
        />
      ) : activeScreen === 15 ? (
        <SavedAddressesScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onBack={() => setActiveScreen(savedAddressesBackScreen)}
        />
      ) : activeScreen === 16 ? (
        <ReviewsScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onBack={() => setActiveScreen(10)}
        />
      ) : activeScreen === 17 ? (
        <SubscriptionCalendarScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onBack={() => setActiveScreen(10)}
          onSkipMeal={() => setActiveScreen(18)}
        />
      ) : activeScreen === 18 ? (
        <SkipMealScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onBack={() => setActiveScreen(17)}
          onConfirm={() => setActiveScreen(19)}
        />
      ) : activeScreen === 19 ? (
        <MealSkippedScreen
          onViewCalendar={() => setActiveScreen(17)}
          onHome={() => setActiveScreen(6)}
        />
      ) : activeScreen === 20 ? (
        <HomeChefScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onBack={() => setActiveScreen(10)}
          onReviews={() => setActiveScreen(16)}
          onSubscribe={() => setActiveScreen(8)}
        />
      ) : activeScreen === 21 ? (
        <NotificationsScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          hasUnreadNotifications={hasUnreadNotifications}
          onMarkAllRead={() => setHasUnreadNotifications(false)}
          onBack={() => setActiveScreen(6)}
        />
      ) : activeScreen === 22 ? (
        <TrackingScreen
          order={latestOrder}
          topInset={insets.top}
          bottomInset={insets.bottom}
          onBack={() => setActiveScreen(trackingBackScreen)}
        />
      ) : activeScreen === 23 ? (
        <MyOrdersScreen
          latestOrder={latestOrder}
          topInset={insets.top}
          bottomInset={insets.bottom}
          onBack={() => setActiveScreen(10)}
          onOrderPress={order => {
            setLatestOrder(order);
            setTrackingBackScreen(23);
            setActiveScreen(22);
          }}
        />
      ) : activeScreen === 27 ? (
        <CompleteProfileScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          initialProfile={authProfile}
          phone={authProfile?.phone || `${loginDialCode} ${loginPhone}`.trim()}
          onBack={() => setActiveScreen(4)}
          onSaved={customer => {
            setAuthProfile(customer);
            setCustomerProfile(customer);
            setActiveScreen(6);
          }}
        />
      ) : (
        <OnboardingScreen
          step={onboardingSteps[activeScreen - 1]}
          bottomInset={insets.bottom}
          topInset={insets.top}
          onBack={() => setActiveScreen(activeScreen - 1)}
          onNext={() => setActiveScreen(activeScreen + 1)}
          onSkip={() => setActiveScreen(4)}
        />
      )}
      {shouldShowDetailBottomNav ? (
        <BottomNav
          activeTab={getActiveTabForScreen(activeScreen)}
          bottomInset={insets.bottom}
          darkMode={darkMode}
          onNavigate={navigateMainTab}
        />
      ) : null}
      {activeScreen === 0 && splashComplete && onboardingLoading ? (
        <View
          style={[
            styles.simpleLoaderOverlay,
            { backgroundColor: themeColors.loaderOverlay },
          ]}
        >
          <ActivityIndicator color={colors.orange} size="large" />
        </View>
      ) : null}
      {loadingScreen ? (
        <View
          style={[
            styles.simpleLoaderOverlay,
            { backgroundColor: themeColors.loaderOverlay },
          ]}
        >
          <ActivityIndicator color={colors.orange} size="large" />
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.surface,
  },
  simpleLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleLoaderOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
export default App;
