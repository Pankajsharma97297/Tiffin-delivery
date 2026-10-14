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
import { colors } from '../theme/colors';
import { Images } from '../theme/images';

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

export function SplashScreen({ bottomInset, onComplete }) {
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

      <View
        style={[
          styles.statusArea,
          {
            bottom: Math.max(28, bottomInset + 12),
          },
        ]}
      >
        {status === 'loading' ? (
          <>
            <View style={styles.loadingTrack}>
              <Animated.View
                style={[styles.loadingFill, { width: progressWidth }]}
              />
            </View>
            <Text style={styles.loadingText}>Loading...</Text>
          </>
        ) : null}

        {status === 'offline' ? (
          <View style={styles.offlineBox}>
            <Text style={styles.offlineText}>
              Currently no internet connection
            </Text>
            <Pressable
              onPress={handleRetry}
              style={({ pressed }) => [
                styles.retryButton,
                pressed ? styles.retryButtonPressed : undefined,
              ]}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.orange,
  },

  splashMarkIcon: {
    width: '100%',
    height: '70%',
    borderRadius: 22,
  },

  statusArea: {
    position: 'absolute',
    left: 32,
    right: 32,
    minHeight: 86,
    justifyContent: 'center',
  },
  loadingTrack: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  loadingFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 13,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.84,
    textAlign: 'center',
  },
  offlineBox: {
    alignItems: 'center',
    gap: 14,
  },
  offlineText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 132,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  retryButtonPressed: {
    opacity: 0.78,
  },
  retryText: {
    color: colors.orange,
    fontSize: 15,
    fontWeight: '900',
  },
});
