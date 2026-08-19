import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  DevSettings,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { Images } from '../../theme/images';

const INTERNET_CHECK_URL = 'https://www.google.com/generate_204';
const INTERNET_CHECK_TIMEOUT = 5000;
const PROGRESS_DURATION = 2200;

function checkInternetConnection() {
  return new Promise(resolve => {
    let finished = false;
    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve(false);
      }
    }, INTERNET_CHECK_TIMEOUT);

    fetch(INTERNET_CHECK_URL, { method: 'GET' })
      .then(response => {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          resolve(response.status >= 200 && response.status < 400);
        }
      })
      .catch(() => {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          resolve(false);
        }
      });
  });
}

export function SplashStage({ bottomInset, onComplete }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [status, setStatus] = useState('checking');

  const startProgress = useCallback(() => {
    progress.setValue(0);
    setStatus('loading');

    Animated.timing(progress, {
      toValue: 1,
      duration: PROGRESS_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });
  }, [onComplete, progress]);

  const verifyConnection = useCallback(async () => {
    setStatus('checking');
    const isConnected = await checkInternetConnection();
    if (isConnected) {
      startProgress();
    } else {
      setStatus('offline');
    }
  }, [startProgress]);

  const handleRetry = () => {
    if (DevSettings?.reload) {
      DevSettings.reload();
      return;
    }

    verifyConnection();
  };

  useEffect(() => {
    verifyConnection();
  }, [verifyConnection]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.splashScreen}>
      <Image source={Images.Splash} style={styles.splashMarkIcon} />

      <View style={[styles.statusArea, { bottom: Math.max(28, bottomInset + 12) }]}>
        {status === 'loading' ? (
          <>
            <View style={styles.loadingTrack}>
              <Animated.View style={[styles.loadingFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.loadingText}>Loading...</Text>
          </>
        ) : null}

        {status === 'offline' ? (
          <View style={styles.offlineBox}>
            <Text style={styles.offlineText}>Currently no internet connection</Text>
            <Pressable onPress={handleRetry} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingFill: {
    backgroundColor: colors.white,
    borderRadius: 999,
    height: '100%',
  },
  loadingText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 13,
    opacity: 0.84,
    textAlign: 'center',
  },
  loadingTrack: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: 999,
    height: 5,
    overflow: 'hidden',
  },
  offlineBox: {
    alignItems: 'center',
    gap: 14,
  },
  offlineText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    minWidth: 132,
  },
  retryText: {
    color: colors.orange,
    fontSize: 15,
    fontWeight: '900',
  },
  splashMarkIcon: {
    borderRadius: 22,
    height: '70%',
    width: '100%',
  },
  splashScreen: {
    alignItems: 'center',
    backgroundColor: colors.orange,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  statusArea: {
    justifyContent: 'center',
    left: 32,
    minHeight: 86,
    position: 'absolute',
    right: 32,
  },
});
