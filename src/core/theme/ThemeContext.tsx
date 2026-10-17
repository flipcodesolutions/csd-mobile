import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { lightColors, darkColors, ThemeColors } from './colors';
import { appStorage } from '../storage/storage';
import { triggerHaptic } from '../utils/haptics';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'light',
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);

  // Load saved theme on mount
  useEffect(() => {
    appStorage.getTheme().then((savedTheme) => {
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    });
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    appStorage.saveTheme(mode);
  };

  const toggleTheme = () => {
    triggerHaptic('impactLight');
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      appStorage.saveTheme(next);
      return next;
    });
  };

  const isDark = theme === 'dark';
  const currentColors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const contextValue = useMemo(
    () => ({
      theme,
      isDark,
      colors: currentColors,
      toggleTheme,
      setTheme,
    }),
    [theme, isDark, currentColors]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  return useContext(ThemeContext);
};

export default ThemeContext;
