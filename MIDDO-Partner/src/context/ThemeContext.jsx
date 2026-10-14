import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, darkColors } from '../theme/colors';

const THEME_KEY = '@middo_partner_dark_mode';

function buildThemeColors(dark) {
  const src = dark ? darkColors : colors;
  return {
    surface: src.surface,
    card: src.white,
    line: src.line,
    text: src.ink,
    muted: src.muted,
    placeholder: dark ? '#7a6e6a' : '#b59a8c',
    orange: src.orange,
    orangeDark: src.orangeDark,
    orangeSoft: src.orangeSoft,
    white: src.white,
    whitecard: src.whitecard,
    ink: src.ink,
    green: src.green,
    greenSoft: src.greenSoft,
    amber: src.amber,
    amberSoft: src.amberSoft,
  };
}

const ThemeContext = createContext({
  darkMode: false,
  themeColors: buildThemeColors(false),
  toggleDarkMode: () => undefined,
});

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then(value => {
        if (value === 'true') {
          setDarkMode(true);
        }
      })
      .catch(() => undefined);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, String(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const themeColors = buildThemeColors(darkMode);

  return (
    <ThemeContext.Provider value={{ darkMode, themeColors, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
