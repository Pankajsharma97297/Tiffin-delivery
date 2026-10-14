import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Appearance } from 'react-native';

const THEME_STORAGE_KEY = 'middo:darkMode';
const noop = () => undefined;

const ThemeContext = createContext({
  applyProfileDarkMode: noop,
  darkMode: false,
  hasSavedThemePreference: false,
  setDarkMode: noop,
  themePreferenceLoaded: false,
  themeColors: {
    surface: '#fbf7f1',
    card: '#fff',
    cardHighlight: '#fff0e9',
    input: '#fffaf5',
    text: '#303033',
    surfaceText: '#303033',
    cardText: '#303033',
    muted: '#777',
    placeholder: '#9b8d86',
    line: '#eadfd2',
    successCard: '#eafff0',
    successLine: '#52d17b',
    successText: '#1d2e24',
    nav: '#fff',
    loaderOverlay: 'rgba(251,247,241,0.82)',
  },
});

const lightColors = {
  surface: '#fbf7f1',
  card: '#fff',
  cardHighlight: '#fff0e9',
  input: '#fffaf5',
  text: '#303033',
  surfaceText: '#303033',
  cardText: '#303033',
  muted: '#777',
  placeholder: '#9b8d86',
  line: '#eadfd2',
  successCard: '#eafff0',
  successLine: '#52d17b',
  successText: '#1d2e24',
  nav: '#fff',
  loaderOverlay: 'rgba(251,247,241,0.82)',
};

const darkColors = {
  surface: '#181412',
  card: '#241c18',
  cardHighlight: '#2d211b',
  input: '#1f1815',
  text: '#fff8f2',
  surfaceText: '#fff8f2',
  cardText: '#fff8f2',
  muted: '#c8b7aa',
  placeholder: '#9f8c7e',
  line: '#3a2c26',
  successCard: '#16261b',
  successLine: '#2f8d4d',
  successText: '#eafff0',
  nav: '#211915',
  loaderOverlay: 'rgba(24,20,18,0.78)',
};

export function ThemeProvider({ children }) {
  const savedPreferenceRef = useRef(null);
  const pendingProfileThemeRef = useRef(null);
  const [darkMode, setDarkModeState] = useState(
    () => Appearance.getColorScheme() === 'dark',
  );
  const [themePreferenceLoaded, setThemePreferenceLoaded] = useState(false);
  const [hasSavedThemePreference, setHasSavedThemePreference] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(value => {
        if (!mounted) {
          return;
        }

        if (value != null) {
          savedPreferenceRef.current = true;
          setHasSavedThemePreference(true);
          setDarkModeState(value === 'true');
          return;
        }

        savedPreferenceRef.current = false;
        setHasSavedThemePreference(false);
        if (pendingProfileThemeRef.current != null) {
          setDarkModeState(pendingProfileThemeRef.current);
        }
      })
      .catch(() => {
        savedPreferenceRef.current = false;
        setHasSavedThemePreference(false);
      })
      .finally(() => {
        if (mounted) {
          setThemePreferenceLoaded(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setDarkMode = useCallback(nextValue => {
    const normalized = Boolean(nextValue);
    savedPreferenceRef.current = true;
    setDarkModeState(normalized);
    setHasSavedThemePreference(true);
    AsyncStorage.setItem(THEME_STORAGE_KEY, String(normalized)).catch(
      () => undefined,
    );
  }, []);

  const applyProfileDarkMode = useCallback(nextValue => {
    const normalized = Boolean(nextValue);
    if (savedPreferenceRef.current === null) {
      pendingProfileThemeRef.current = normalized;
      return;
    }
    if (savedPreferenceRef.current) {
      return;
    }
    setDarkModeState(normalized);
  }, []);

  const value = useMemo(
    () => ({
      applyProfileDarkMode,
      darkMode,
      hasSavedThemePreference,
      setDarkMode,
      themePreferenceLoaded,
      themeColors: darkMode ? darkColors : lightColors,
    }),
    [
      applyProfileDarkMode,
      darkMode,
      hasSavedThemePreference,
      setDarkMode,
      themePreferenceLoaded,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
