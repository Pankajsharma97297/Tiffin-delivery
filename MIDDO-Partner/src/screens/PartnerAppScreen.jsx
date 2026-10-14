import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import {
  homeChefStatusFlow,
  riderStatusFlow,
} from '../data/partnerData';
import { DashboardHero, DeliveryDashboardHero, PartnerShell } from '../components/partner';
import { fetchPartnerDashboard, fetchPartnerOrders, updatePartnerOrderStatus, updatePartnerRole } from '../services/partnerApi';
import {
  confirmPartnerPhoneOtp,
  getPartnerAuthErrorMessage,
  startPartnerPhoneOtp,
} from '../services/partnerFirebaseAuth';
import { signInPartnerWithGoogle, signOutPartnerFromGoogle } from '../services/partnerGoogleAuth';
import {
  fetchPartnerProfile,
  updatePartnerAvailability,
  updatePartnerProfile,
  uploadPartnerProfileImage,
} from '../services/partnerProfileApi';
import {
  listenForPartnerNotificationOpen,
  listenForPartnerOrderAlerts,
  listenForPartnerPushTokenRefresh,
  registerPartnerPushNotifications,
} from '../services/partnerNotifications';
import { clearPartnerSession, loadPartnerSession } from '../services/partnerSession';
import { getNativeModule } from '../services/nativeModules';
import {
  AlertsPanel,
  EarningsPanel,
  HomeChefDashboard,
  HomeChefOrders,
  LoginStage,
  OnboardingStage,
  OtpStage,
  PartnerProfile,
  RiderDashboard,
  RiderDeliveries,
  SettingsPanel,
  SetupStage,
  WelcomeStage,
} from './partner';

const profileImagePicker = getNativeModule('ProfileImagePicker');
const RIDER_HISTORY_KEY = '@middo_partner_rider_delivery_history';
const getPartnerRoleFromSession = sessionRole =>
  /rider|delivery/i.test(String(sessionRole || '')) ? 'rider' : 'homechef';

const shouldShowPartnerSetup = session => {
  const profile = session?.profile || session?.data?.profile || {};
  const user = session?.user || session?.data?.user || {};
  const needsSetup = session?.needsSetup ?? session?.data?.needsSetup;

  if (typeof needsSetup === 'boolean') {
    return needsSetup;
  }

  if (session?.isNewUser || session?.data?.isNewUser) {
    return true;
  }

  if (session?.profileComplete === false || session?.data?.profileComplete === false) {
    return true;
  }

  return !(
    profile.role &&
    (profile.name || user.name) &&
    (profile.email || user.email || profile.phone || user.phone)
  );
};

export function PartnerAppScreen({ topInset, bottomInset, onBack }) {
  const { themeColors } = useTheme();
  const profileEditorRef = useRef(null);
  const signingOutRef = useRef(false);
  const [stage, setStage] = useState('restoring');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState('homechef');
  const [activeTab, setActiveTab] = useState('home');
  const [homeChefOnline, setHomeChefOnline] = useState(true);
  const [riderOnline, setRiderOnline] = useState(true);
  const [alertsRefreshKey, setAlertsRefreshKey] = useState(0);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [dailyCapacity, setDailyCapacity] = useState(150);
  const [savingCapacity, setSavingCapacity] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState('');
  const [authConfirmation, setAuthConfirmation] = useState(null);
  const [authDialCode, setAuthDialCode] = useState('+91');
  const [authError, setAuthError] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [setupImageUploading, setSetupImageUploading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [homeChefOrders, setHomeChefOrders] = useState([]);
  const [homeChefDashboard, setHomeChefDashboard] = useState({
    completedOrders: 0,
    earnings: 0,
    mealSlots: [],
    pendingOrders: 0,
    remainingCapacity: 150,
    subscriptionOrders: 0,
    todayOrders: 0,
    trialOrders: 0,
    pendingPayout: 0,
    settled: 0,
    totalEarned: 0,
    commissionPercent: 0,
    payoutHistory: [],
  });
  const [riderDashboard, setRiderDashboard] = useState({
    completedOrders: 0,
    earnings: 0,
    pendingOrders: 0,
    pendingPayout: 0,
    settled: 0,
    totalEarned: 0,
    commissionPercent: 0,
    payoutHistory: [],
  });
  const [riderDeliveries, setRiderDeliveries] = useState([]);
  // Persisted history of delivered orders — survives refresh and status-advance
  const [riderDeliveryHistory, setRiderDeliveryHistory] = useState([]);
  const [riderHistoryLoaded, setRiderHistoryLoaded] = useState(false);
  // Accumulated in-app FCM push messages for the Alerts tab
  const [localAlerts, setLocalAlerts] = useState([]);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    city: '',
    pincode: '',
    phone: '',
    avatar: '',
  });

  const completedHomeChefOrders = Number(homeChefDashboard.completedOrders || 0);
  const pendingHomeChefOrders = Number(homeChefDashboard.pendingOrders || 0);
  const homeChefEarnings = Number(homeChefDashboard.totalEarned || homeChefDashboard.earnings || 0);
  const homeChefCapacityReached = Boolean(homeChefDashboard.capacityReached);
  const completedDeliveries = riderDeliveries.filter(delivery => delivery.status === 'Delivered').length + riderDeliveryHistory.length;
  const pendingDeliveries = riderDeliveries.filter(delivery => delivery.status !== 'Delivered').length;
  const riderEarnings = Number(riderDashboard.totalEarned || riderDashboard.earnings || 0);
  const tabs = selectedRole === 'homechef'
    ? ['home', 'orders', 'earnings', 'alerts', 'profile']
    : ['home', 'deliveries', 'earnings', 'alerts', 'profile'];

  const backendRole = selectedRole === 'rider' ? 'rider' : 'homechef';

  const refreshPartnerOrders = useCallback(async role => {
    try {
      const [orders, dashboard] = await Promise.all([
        fetchPartnerOrders(role),
        fetchPartnerDashboard(),
      ]);
      if (role === 'rider') {
        setRiderDashboard(current => ({ ...current, ...dashboard }));
        // Merge: keep local delivered history, update active orders from backend
        setRiderDeliveries(orders.filter(o => o.status !== 'Delivered'));
        // If backend returns some delivered orders, merge into history too
        const backendDelivered = orders.filter(o => o.status === 'Delivered');
        if (backendDelivered.length > 0) {
          setRiderDeliveryHistory(prev => {
            const existingIds = new Set(prev.map(d => d.id));
            const newOnes = backendDelivered.filter(d => !existingIds.has(d.id));
            return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
          });
        }
      } else {
        setHomeChefOrders(orders);
        setHomeChefDashboard(current => ({ ...current, ...dashboard }));
        if (dashboard?.dailyCapacity) {
          setDailyCapacity(Number(dashboard.dailyCapacity) || 150);
        }
      }
    } catch (error) {
      if (signingOutRef.current) {
        return;
      }
      Alert.alert('Partner Sync', error.message || 'Unable to sync partner orders');
    }
  }, []);

  const refreshPartnerProfile = useCallback(async () => {
    try {
      const liveProfile = await fetchPartnerProfile();
      setProfileForm(current => ({ ...current, ...liveProfile }));
      if (liveProfile.dailyCapacity) {
        setDailyCapacity(Number(liveProfile.dailyCapacity) || 150);
      }
      if (liveProfile.kitchenOpen !== undefined) {
        setHomeChefOnline(liveProfile.kitchenOpen !== false);
      } else if (liveProfile.isOnline !== undefined && selectedRole === 'homechef') {
        setHomeChefOnline(liveProfile.isOnline !== false);
      }
      if (liveProfile.isOnline !== undefined && selectedRole === 'rider') {
        setRiderOnline(liveProfile.isOnline !== false);
      }
    } catch (_error) {
      // Profile can still be completed from setup if backend has no partner row yet.
    }
  }, [selectedRole]);

  const refreshCurrentPartnerData = useCallback(() => {
    refreshPartnerProfile();
    refreshPartnerOrders(selectedRole);
  }, [refreshPartnerOrders, refreshPartnerProfile, selectedRole]);

  const handlePartnerProfileChange = useCallback(updatedProfile => {
    setProfileForm(updatedProfile);
    if (updatedProfile?.dailyCapacity) {
      setDailyCapacity(Number(updatedProfile.dailyCapacity) || 150);
    }
    refreshPartnerOrders(selectedRole);
  }, [refreshPartnerOrders, selectedRole]);

  const applyPartnerSessionToProfile = useCallback(session => {
    const user = session?.user || session?.data?.user || {};
    const sessionProfile = session?.profile || session?.data?.profile || {};
    setProfileForm(current => ({
      ...current,
      ...sessionProfile,
      avatar: sessionProfile.avatar || user.avatar || current.avatar || '',
      email: sessionProfile.email || user.email || current.email || '',
      name: sessionProfile.name || user.name || current.name || '',
      phone: sessionProfile.phone || user.phone || current.phone || '',
      role: user.role || sessionProfile.role || current.role || '',
    }));
    if (sessionProfile.dailyCapacity) {
      setDailyCapacity(Number(sessionProfile.dailyCapacity) || 150);
    }
    if (sessionProfile.kitchenOpen !== undefined) {
      setHomeChefOnline(sessionProfile.kitchenOpen !== false);
    }
    if (sessionProfile.isOnline !== undefined) {
      const role = getPartnerRoleFromSession(user.role || sessionProfile.role);
      if (role === 'rider') {
        setRiderOnline(sessionProfile.isOnline !== false);
      } else {
        setHomeChefOnline(sessionProfile.isOnline !== false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const session = await loadPartnerSession();

        if (!mounted) {
          return;
        }

        if (!session?.token) {
          setStage('welcome');
          return;
        }

        const restoredRole = getPartnerRoleFromSession(
          session.user?.role || session.profile?.role,
        );
        setSelectedRole(restoredRole);
        applyPartnerSessionToProfile(session);
        setActiveTab('home');
        setStage('app');
        refreshPartnerProfile();
        refreshPartnerOrders(restoredRole);
      } catch (_error) {
        await clearPartnerSession();
        if (mounted) {
          setStage('login');
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, [applyPartnerSessionToProfile, refreshPartnerOrders, refreshPartnerProfile]);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(RIDER_HISTORY_KEY)
      .then(rawHistory => {
        if (!mounted || !rawHistory) {
          return;
        }

        const parsedHistory = JSON.parse(rawHistory);
        if (Array.isArray(parsedHistory)) {
          setRiderDeliveryHistory(prev => {
            const existingIds = new Set(prev.map(delivery => delivery.id));
            const savedOnly = parsedHistory.filter(delivery => !existingIds.has(delivery.id));
            return savedOnly.length > 0 ? [...prev, ...savedOnly] : prev;
          });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) {
          setRiderHistoryLoaded(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!riderHistoryLoaded) {
      return;
    }

    AsyncStorage.setItem(
      RIDER_HISTORY_KEY,
      JSON.stringify(riderDeliveryHistory.slice(-100)),
    ).catch(() => undefined);
  }, [riderDeliveryHistory, riderHistoryLoaded]);

  useEffect(() => {
    if (stage === 'app' && activeTab === 'home') {
      refreshCurrentPartnerData();
    }
  }, [activeTab, refreshCurrentPartnerData, stage]);

  useEffect(() => {
    if (stage !== 'app') {
      return undefined;
    }

    const intervalId = setInterval(() => {
      refreshPartnerOrders(selectedRole);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [refreshPartnerOrders, selectedRole, stage]);

  useEffect(() => {
    if (stage !== 'app') {
      return undefined;
    }

    registerPartnerPushNotifications().catch(error => {
      console.warn(
        '[partner-push] Registration failed',
        error instanceof Error ? error.message : error,
      );
    });

    // onAnyAlert: captures every FCM message into local alerts state for the Alerts tab
    const onAnyAlert = remoteMessage => {
      setLocalAlerts(prev => [remoteMessage, ...prev].slice(0, 100));
      setAlertsRefreshKey(key => key + 1);
    };

    const unsubscribeAlerts = listenForPartnerOrderAlerts(
      () => {
        refreshPartnerOrders(selectedRole);
        setAlertsRefreshKey(key => key + 1);
        setActiveTab(selectedRole === 'rider' ? 'deliveries' : 'orders');
      },
      onAnyAlert,
    );

    const unsubscribeOpened = listenForPartnerNotificationOpen(data => {
      setAlertsRefreshKey(key => key + 1);
      if (data?.screen === 'deliveries' || data?.type === 'rider_order_assigned' || data?.type === 'delivery_assigned') {
        setActiveTab('deliveries');
      } else if (data?.screen === 'orders' || data?.type === 'vendor_order_assigned' || data?.type === 'order_assigned') {
        setActiveTab('orders');
      } else if (data?.screen === 'alerts' || data?.type === 'payment_approved' || data?.type === 'payment_received') {
        setActiveTab('alerts');
      }
      refreshPartnerOrders(selectedRole);
    });
    const unsubscribeTokenRefresh = listenForPartnerPushTokenRefresh();

    return () => {
      unsubscribeAlerts();
      unsubscribeOpened();
      unsubscribeTokenRefresh();
    };
  }, [refreshPartnerOrders, selectedRole, stage]);

  const toggleHomeChefOnline = async () => {
    if (togglingAvailability) {
      return;
    }

    const nextOnline = !homeChefOnline;
    setHomeChefOnline(nextOnline);
    setTogglingAvailability(true);
    try {
      const savedProfile = await updatePartnerAvailability({
        kitchenOpen: nextOnline,
        role: 'homechef',
      });
      setHomeChefOnline(savedProfile.kitchenOpen !== false);
    } catch (error) {
      setHomeChefOnline(!nextOnline);
      Alert.alert('Kitchen Status', error.message || 'Unable to update kitchen status');
    } finally {
      setTogglingAvailability(false);
    }
  };

  const toggleRiderOnline = async () => {
    if (togglingAvailability) {
      return;
    }

    const nextOnline = !riderOnline;
    setRiderOnline(nextOnline);
    setTogglingAvailability(true);
    try {
      const savedProfile = await updatePartnerAvailability({
        isOnline: nextOnline,
        role: 'rider',
      });
      setRiderOnline(savedProfile.isOnline !== false);
    } catch (error) {
      setRiderOnline(!nextOnline);
      Alert.alert('Online Status', error.message || 'Unable to update online status');
    } finally {
      setTogglingAvailability(false);
    }
  };

  const updateHomeChefOrderStatus = async orderId => {
    const order = homeChefOrders.find(item => item.id === orderId);
    const nextStatus = order ? homeChefStatusFlow[order.status] : null;

    if (!nextStatus) {
      return;
    }

    if (order.status === 'New Order' && homeChefCapacityReached) {
      Alert.alert(
        'Daily Capacity Limit',
        'Maximum daily tiffin capacity reached. New orders are stopped until you increase capacity.',
      );
      return;
    }

    setHomeChefOrders(current =>
      current.map(item => {
        const followingStatus = homeChefStatusFlow[item.status];
        return item.id === orderId && followingStatus ? { ...item, status: followingStatus } : item;
      }),
    );

    try {
      await updatePartnerOrderStatus(orderId, nextStatus);
    } catch (error) {
      Alert.alert('Order Update', error.message || 'Unable to update order');
      refreshPartnerOrders('homechef');
    }
  };

  const updateRiderDeliveryStatus = async deliveryId => {
    const delivery = riderDeliveries.find(item => item.id === deliveryId);
    const nextStatus = delivery ? riderStatusFlow[delivery.status] : null;

    if (!nextStatus) {
      return;
    }

    const isBecomingDelivered = nextStatus === 'Delivered';

    // Move to history BEFORE removing from active list
    if (isBecomingDelivered && delivery) {
      setRiderDeliveryHistory(prev => {
        const alreadyInHistory = prev.some(d => d.id === deliveryId);
        if (alreadyInHistory) return prev;
        return [...prev, { ...delivery, status: 'Delivered' }];
      });
    }

    setRiderDeliveries(current => {
      if (isBecomingDelivered) {
        return current.filter(item => item.id !== deliveryId);
      }

      return current.map(item => {
        const followingStatus = riderStatusFlow[item.status];
        return item.id === deliveryId && followingStatus ? { ...item, status: followingStatus } : item;
      });
    });

    try {
      await updatePartnerOrderStatus(deliveryId, nextStatus);
    } catch (error) {
      Alert.alert('Delivery Update', error.message || 'Unable to update delivery');
      refreshPartnerOrders('rider');
    }
  };

  const openMaps = delivery => {
    const query = encodeURIComponent(delivery.address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`)
      .catch(() => Alert.alert('Maps', delivery.address));
  };

  const callCustomer = delivery => {
    Linking.openURL(`tel:${delivery.phone}`)
      .catch(() => Alert.alert('Call customer', delivery.phone));
  };

  const continueOnboarding = () => {
    if (onboardingStep < 2) {
      setOnboardingStep(step => step + 1);
      return;
    }
    setStage('login');
  };

  const handleSendOtp = async () => {
    if (otpLoading) {
      return;
    }

    setAuthError('');
    setOtpLoading(true);
    try {
      const confirmation = await startPartnerPhoneOtp({
        dialCode: authDialCode,
        phone: authPhone,
      });
      setAuthConfirmation(confirmation);
      setAuthDialCode(confirmation.dialCode);
      setAuthPhone(confirmation.phone);
      setStage('otp');
    } catch (error) {
      setAuthError(
        getPartnerAuthErrorMessage(
          error,
          'Unable to send OTP. Please try again.',
        ),
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleLoading) {
      return;
    }

    setAuthError('');
    setGoogleLoading(true);
    try {
      const result = await signInPartnerWithGoogle(backendRole);
      if (result.type === 'success') {
        signingOutRef.current = false;
        applyPartnerSessionToProfile(result.session);
        const restoredRole = getPartnerRoleFromSession(
          result.session?.profile?.role || result.session?.user?.role,
        );
        setSelectedRole(restoredRole);
        setActiveTab('home');
        if (shouldShowPartnerSetup(result.session)) {
          setStage('setup');
        } else {
          setStage('app');
          refreshPartnerProfile();
          refreshPartnerOrders(restoredRole);
        }
      }
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : 'Google sign-in failed. Please try again.',
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const verifyPartnerLogin = async otp => {
    if (verifyingOtp) {
      return;
    }

    setAuthError('');
    setVerifyingOtp(true);
    try {
      const session = await confirmPartnerPhoneOtp(authConfirmation, otp, backendRole);
      signingOutRef.current = false;
      applyPartnerSessionToProfile(session);
      const restoredRole = getPartnerRoleFromSession(
        session?.profile?.role || session?.user?.role,
      );
      setSelectedRole(restoredRole);
      setActiveTab('home');
      if (shouldShowPartnerSetup(session)) {
        setStage('setup');
      } else {
        setStage('app');
        refreshPartnerProfile();
        refreshPartnerOrders(restoredRole);
      }
    } catch (error) {
      setAuthError(
        getPartnerAuthErrorMessage(
          error,
          'Unable to verify OTP. Please try again.',
        ),
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  const chooseSetupProfileImage = async () => {
    if (setupImageUploading) {
      return;
    }

    setSetupImageUploading(true);
    const previousAvatar = profileForm.avatar;
    try {
      if (!profileImagePicker?.pickImage) {
        Alert.alert('Image upload', 'Photo picker is not available in this build.');
        return;
      }

      const asset = await profileImagePicker.pickImage();
      if (!asset?.uri) {
        Alert.alert('Image upload', 'Selected image path was not received.');
        return;
      }

      setProfileForm(current => ({ ...current, avatar: asset.uri }));
      const uploadedUrl = await uploadPartnerProfileImage({
        fileName: asset.fileName || 'profile',
        mimeType: asset.mimeType || 'image/jpeg',
        uri: asset.uri,
      });
      const nextProfile = {
        ...profileForm,
        avatar: uploadedUrl,
      };

      await updatePartnerRole(backendRole);
      const savedProfile = await updatePartnerProfile(nextProfile);
      setProfileForm(current => ({ ...current, ...savedProfile }));
      Alert.alert('Image updated', 'Your profile photo has been saved.');
    } catch (error) {
      setProfileForm(current => ({ ...current, avatar: previousAvatar }));
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert(
        'Image upload failed',
        message.includes('cancelled') || message.includes('PICKER_CANCELLED')
          ? 'Image selection cancelled.'
          : message,
      );
    } finally {
      setSetupImageUploading(false);
    }
  };

  const enterApp = async () => {
    try {
      await updatePartnerRole(backendRole);
      const savedProfile = await updatePartnerProfile(profileForm);
      setProfileForm(current => ({ ...current, ...savedProfile }));
      setActiveTab('home');
      setStage('app');
      refreshPartnerProfile();
      refreshPartnerOrders(selectedRole);
    } catch (error) {
      Alert.alert('Partner Login', error.message || 'Unable to login partner account');
    }
  };

  const leaveAppScreen = () => {
    if (activeTab === 'home') {
      return;
    }
    setActiveTab('home');
  };

  const signOut = async () => {
    signingOutRef.current = true;
    await Promise.allSettled([
      clearPartnerSession(),
      signOutPartnerFromGoogle(),
    ]);
    setActiveTab('home');
    setStage('login');
  };

  const handleProfileEditPress = () => {
    profileEditorRef.current?.enableProfileEdit?.();
  };

  const handleHomeChefTabChange = tab => {
    setProfileInitialTab(tab === 'profile' ? 'Personal' : '');
    setActiveTab(tab);
  };

  const openHomeChefMenu = () => {
    setProfileInitialTab('Menu');
    setActiveTab('profile');
    setTimeout(() => profileEditorRef.current?.openMenuManagement?.(), 0);
  };

  const saveDailyCapacity = async () => {
    if (savingCapacity) {
      return;
    }

    const nextCapacity = Math.max(1, Number(dailyCapacity || 0));
    setSavingCapacity(true);
    try {
      const savedProfile = await updatePartnerProfile({
        ...profileForm,
        dailyCapacity: nextCapacity,
        role: 'homechef',
      });
      setDailyCapacity(Number(savedProfile.dailyCapacity || nextCapacity));
      setProfileForm(current => ({ ...current, ...savedProfile }));
      Alert.alert('Capacity saved', `Daily capacity set to ${nextCapacity} tiffins.`);
      refreshPartnerOrders('homechef');
    } catch (error) {
      Alert.alert('Capacity update failed', error.message || 'Unable to save daily capacity.');
    } finally {
      setSavingCapacity(false);
    }
  };

  const renderBody = () => {
    if (stage === 'restoring') {
      return <View style={styles.restoring} />;
    }

    if (stage === 'welcome') {
      return <WelcomeStage onBack={onBack} onGetStarted={() => setStage('onboarding')} onSignIn={() => setStage('login')} topInset={topInset} />;
    }

    if (stage === 'onboarding') {
      return (
        <OnboardingStage
          onBack={() => onboardingStep === 0 ? setStage('welcome') : setOnboardingStep(step => step - 1)}
          onNext={continueOnboarding}
          onSkip={() => setStage('login')}
          step={onboardingStep}
          topInset={topInset}
        />
      );
    }

    if (stage === 'login') {
      return (
        <LoginStage
          authError={authError}
          googleLoading={googleLoading}
          onDialCodeChange={setAuthDialCode}
          onGoogleSignIn={handleGoogleSignIn}
          onPhoneChange={setAuthPhone}
          onRoleChange={setSelectedRole}
          onSendOtp={handleSendOtp}
          otpLoading={otpLoading}
          phone={authPhone}
          selectedRole={selectedRole}
          topInset={topInset}
        />
      );
    }

    if (stage === 'otp') {
      return (
        <OtpStage
          authError={authError}
          dialCode={authDialCode}
          onBack={() => setStage('login')}
          onVerify={verifyPartnerLogin}
          phone={authPhone}
          topInset={topInset}
          verifying={verifyingOtp}
        />
      );
    }

    if (stage === 'setup') {
      return (
        <SetupStage
          form={profileForm}
          isUploadingImage={setupImageUploading}
          onAvatarPress={chooseSetupProfileImage}
          onBack={() => setStage('otp')}
          onChange={setProfileForm}
          onEnter={enterApp}
          bottomInset={bottomInset}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          topInset={topInset}
        />
      );
    }

    if (selectedRole === 'homechef') {
      const homeChefHeader = activeTab === 'home'
        ? (
          <DashboardHero
            action={homeChefOnline ? 'Request OFF' : 'Open Kitchen'}
            avatar={profileForm.avatar}
            isOnline={homeChefOnline}
            name={profileForm.name || profileForm.email || profileForm.phone || 'HomeChef'}
            onAction={toggleHomeChefOnline}
            onNotificationsPress={() => setActiveTab('alerts')}
            onSettingsPress={() => setActiveTab('settings')}
            role="HomeChef Dashboard"
            status={homeChefOnline ? 'Kitchen is OPEN' : 'Kitchen is OFF'}
          />
        )
        : null;

      return (
      <PartnerShell
        activeTab={activeTab}
        bottomInset={bottomInset}
        deliveryMode={false}
        fixedHeader={homeChefHeader}
          onBack={leaveAppScreen}
          onRightPress={activeTab === 'profile' ? handleProfileEditPress : () => Alert.alert('Filter', 'Filter options will appear here.')}
          onTab={handleHomeChefTabChange}
          tabs={tabs}
          topInset={topInset}
        >
          {activeTab === 'home' ? (
            <HomeChefDashboard
              completedOrders={completedHomeChefOrders}
              dailyCapacity={dailyCapacity}
              earnings={homeChefEarnings}
              mealSlots={homeChefDashboard.mealSlots || []}
              isOnline={homeChefOnline}
              onCapacityChange={setDailyCapacity}
              onOpenMenu={openHomeChefMenu}
              onSaveCapacity={saveDailyCapacity}
              onToggleOnline={toggleHomeChefOnline}
              orders={homeChefOrders}
              pendingOrders={pendingHomeChefOrders}
              savingCapacity={savingCapacity}
              setActiveTab={setActiveTab}
              subscriptionOrders={Number(homeChefDashboard.subscriptionOrders || 0)}
              todayOrders={Number(homeChefDashboard.todayOrders || 0)}
              trialOrders={Number(homeChefDashboard.trialOrders || 0)}
            />
          ) : activeTab === 'orders' ? (
            <HomeChefOrders
              capacityReached={homeChefCapacityReached}
              orders={homeChefOrders}
              onAdvanceStatus={updateHomeChefOrderStatus}
            />
          ) : activeTab === 'earnings' ? (
            <EarningsPanel
              onBack={leaveAppScreen}
              role="HomeChef"
              topInset={topInset}
              total={homeChefEarnings}
              pendingPayout={homeChefDashboard.pendingPayout}
              settled={homeChefDashboard.settled}
              commissionPercent={homeChefDashboard.commissionPercent}
              history={homeChefDashboard.payoutHistory}
            />
          ) : activeTab === 'alerts' ? (
            <AlertsPanel
              localAlerts={localAlerts}
              onBack={leaveAppScreen}
              onClearLocalAlerts={() => setLocalAlerts([])}
              refreshKey={alertsRefreshKey}
              topInset={topInset}
            />
          ) : activeTab === 'settings' ? (
            <SettingsPanel onSignOut={signOut} profile={profileForm} role="HomeChef" />
          ) : (
            <PartnerProfile
              ref={profileEditorRef}
              bottomInset={bottomInset}
              initialTab={profileInitialTab}
              onDataChange={refreshCurrentPartnerData}
              onProfileChange={handlePartnerProfileChange}
              profile={profileForm}
              role="Verified HomeChef"
            />
          )}
        </PartnerShell>
      );
    }

    const riderHeader = activeTab === 'home'
      ? (
        <DeliveryDashboardHero
          avatar={profileForm.avatar}
          isOnline={riderOnline}
          name={profileForm.name || profileForm.email || profileForm.phone || 'Delivery Partner'}
          onNotificationsPress={() => setActiveTab('alerts')}
          onSettingsPress={() => setActiveTab('settings')}
          onToggleOnline={toggleRiderOnline}
        />
      )
      : null;

    return (
      <PartnerShell
        activeTab={activeTab}
        bottomInset={bottomInset}
        deliveryMode
        fixedHeader={riderHeader}
        onBack={leaveAppScreen}
        onRightPress={activeTab === 'profile' ? handleProfileEditPress : () => Alert.alert('Filter', 'Filter options will appear here.')}
        onTab={setActiveTab}
        tabs={tabs}
        topInset={topInset}
      >
        {activeTab === 'home' ? (
          <RiderDashboard
            completedDeliveries={completedDeliveries}
            deliveries={riderDeliveries}
            earnings={riderEarnings}
            isOnline={riderOnline}
            onCall={callCustomer}
            onMaps={openMaps}
            onToggleOnline={toggleRiderOnline}
            pendingDeliveries={pendingDeliveries}
            setActiveTab={setActiveTab}
          />
        ) : activeTab === 'deliveries' ? (
          <RiderDeliveries
            deliveries={riderDeliveries}
            deliveryHistory={riderDeliveryHistory}
            onAdvanceStatus={updateRiderDeliveryStatus}
            onCall={callCustomer}
            onMaps={openMaps}
          />
        ) : activeTab === 'earnings' ? (
          <EarningsPanel onBack={leaveAppScreen} role="Delivery Partner" topInset={topInset} total={riderEarnings} />
        ) : activeTab === 'alerts' ? (
          <AlertsPanel
            localAlerts={localAlerts}
            onBack={leaveAppScreen}
            onClearLocalAlerts={() => setLocalAlerts([])}
            refreshKey={alertsRefreshKey}
            topInset={topInset}
          />
        ) : activeTab === 'settings' ? (
          <SettingsPanel onSignOut={signOut} profile={profileForm} role="Delivery Partner" />
        ) : (
          <PartnerProfile ref={profileEditorRef} bottomInset={bottomInset} onProfileChange={setProfileForm} profile={profileForm} role="Verified Delivery Partner" />
        )}
      </PartnerShell>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
      {renderBody()}
    </View>
  );
}

const styles = StyleSheet.create({
  restoring: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
});
