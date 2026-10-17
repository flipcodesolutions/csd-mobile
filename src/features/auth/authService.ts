import { api, setAuthToken } from '../../core/api/client';
import { appStorage } from '../../core/storage/storage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data && response.data.status) {
      const token =
        response.data.data?.token ||
        response.data.token ||
        response.data.data?.access_token ||
        response.data.access_token;
      if (token) {
        setAuthToken(token);
        await appStorage.saveToken(token);
      }
      const user = response.data.data?.user || response.data.user;
      if (user) {
        await appStorage.saveUserProfile(user);
      }
    }
    return response.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.log('Logout API error (ignored):', e);
    } finally {
      setAuthToken(null);
      await appStorage.clearAll();
    }
  },
  getProfile: async () => {
    const response = await api.get('/auth/user');
    if (response.data?.data) {
      await appStorage.saveUserProfile(response.data.data);
    }
    return response.data;
  },
  restoreSession: async () => {
    const token = await appStorage.getToken();
    if (token) {
      setAuthToken(token);
      const user = await appStorage.getUserProfile();
      return { token, user };
    }
    return null;
  },
};

export const authApi = authService;
export default authService;
