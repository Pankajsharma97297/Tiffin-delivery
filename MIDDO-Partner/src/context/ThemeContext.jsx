import React, { createContext, useCallback, useContext, useState } from 'react';
import { colors, darkColors } from '../theme/colors';

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

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
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
