import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN: '@csd_auth_token',
  USER_PROFILE: '@csd_user_profile',
  THEME_MODE: '@csd_theme_mode',
  SAVED_FILTERS: '@csd_saved_filters',
} as const;

export const appStorage = {
  // Auth Token
  saveToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
    } catch (e) {
      console.warn('Failed to save auth token:', e);
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
    } catch (e) {
      return null;
    }
  },

  removeToken: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
    } catch (e) {
      console.warn('Failed to remove auth token:', e);
    }
  },

  // User Profile
  saveUserProfile: async (user: any): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save user profile:', e);
    }
  },

  getUserProfile: async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  removeUserProfile: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.USER_PROFILE);
    } catch (e) {
      console.warn('Failed to remove user profile:', e);
    }
  },

  // Theme Mode
  saveTheme: async (theme: 'light' | 'dark'): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.THEME_MODE, theme);
    } catch (e) {
      console.warn('Failed to save theme mode:', e);
    }
  },

  getTheme: async (): Promise<'light' | 'dark' | null> => {
    try {
      const theme = await AsyncStorage.getItem(KEYS.THEME_MODE);
      return theme === 'dark' || theme === 'light' ? theme : null;
    } catch (e) {
      return null;
    }
  },

  // Full Logout Cleanup
  clearAll: async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(KEYS.USER_PROFILE),
      ]);
    } catch (e) {
      console.warn('Failed to clear session data:', e);
    }
  },
};

export default appStorage;
