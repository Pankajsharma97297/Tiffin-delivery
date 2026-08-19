import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { PartnerAppScreen } from './src/screens/PartnerAppScreen';
import { SplashStage } from './src/screens/partner/SplashStage';
import { colors } from './src/theme/colors';

function PartnerAppContent() {
  const insets = useSafeAreaInsets();
  const { darkMode, themeColors } = useTheme();
  const [splashDone, setSplashDone] = useState(false);

  return (
    <View style={[styles.shell, { backgroundColor: themeColors.surface }]}>
      <StatusBar
        backgroundColor={themeColors.surface}
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        translucent={false}
      />
      {splashDone ? (
        <PartnerAppScreen
          topInset={insets.top}
          bottomInset={insets.bottom}
          onBack={() => undefined}
        />
      ) : (
        <SplashStage
          bottomInset={insets.bottom}
          onComplete={() => setSplashDone(true)}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PartnerAppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.surface,
    flex: 1,
  },
});
