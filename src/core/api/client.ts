import axios from 'axios';
import { appStorage } from '../storage/storage';
import { showErrorToast } from '../utils/toast';

// Base API & Asset URLs
export const DEFAULT_API_URL = 'https://api.defenceautolink.com/api';
export const DEFAULT_IMAGE_BASE_URL = 'https://api.defenceautolink.com';

/**
 * Resolves full URL for uploaded assets (e.g. /uploads/brands/1791453814_download1.png).
 * Strips backslash escapes (\/uploads -> /uploads) and prepends image base URL.
 */
export const getImageUrl = (path?: string | null): string | null => {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  // Strip escape backslashes if present (e.g. \/uploads\/brands\/...)
  const normalized = trimmed.replace(/\\/g, '');
  const cleanPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `${DEFAULT_IMAGE_BASE_URL}${cleanPath}`;
};

// In-Memory Token Store for Mobile
let authToken: string | null = null;
let currentBaseUrl: string = DEFAULT_API_URL;
let unauthorizedCallback: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const setApiBaseUrl = (url: string) => {
  currentBaseUrl = url;
  api.defaults.baseURL = url;
};

export const getApiBaseUrl = () => currentBaseUrl;

/**
 * Register global listener for 401 Unauthorized errors (e.g. to navigate to Login)
 */
export const setOnUnauthorizedHandler = (callback: () => void) => {
  unauthorizedCallback = callback;
};

// Create Axios Instance with default settings
export const api = axios.create({
  baseURL: DEFAULT_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach Bearer Token automatically
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error & Unauthenticated Handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        authToken = null;
        try {
          await appStorage.clearAll();
        } catch (storageErr) {
          console.log('Error clearing storage on 401:', storageErr);
        }

        showErrorToast('Session Expired', 'Your session has expired. Please log in again.');

        if (unauthorizedCallback) {
          unauthorizedCallback();
        }
      } else if (status === 403) {
        const msg = data?.message || 'You do not have permission to perform this action.';
        showErrorToast('Access Denied', msg);
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      showErrorToast('Connection Timeout', 'The request timed out. Please check your internet connection.');
    } else if (error.message === 'Network Error' || !error.response) {
      showErrorToast('Network Unavailable', 'Cannot reach Defence Autolink servers. Check your connection.');
    }

    return Promise.reject(error);
  }
);

export default api;
