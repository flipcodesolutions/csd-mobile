import axios from 'axios';
import { Platform } from 'react-native';

// Base API URL
export const DEFAULT_API_URL = 'https://cds.flipcodesolutions.com/api';

// In-Memory Token Store for Mobile
let authToken: string | null = null;
let currentBaseUrl: string = DEFAULT_API_URL;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const setApiBaseUrl = (url: string) => {
  currentBaseUrl = url;
  api.defaults.baseURL = url;
};

export const getApiBaseUrl = () => currentBaseUrl;

// Create Axios Instance with default settings
const api = axios.create({
  baseURL: DEFAULT_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
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
  (error) => {
    if (error.response?.status === 401) {
      authToken = null;
    }
    return Promise.reject(error);
  }
);

export default api;
