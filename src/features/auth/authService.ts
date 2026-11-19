import { api, setAuthToken } from '../../core/api/client';
import { appStorage } from '../../core/storage/storage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: string | { id?: number; title?: string; name?: string };
  status?: string;
  avatar?: string;
  created_at?: string;
}

export interface UpdateProfilePayload {
  email: string;
  phone: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
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
    try {
      const response = await api.get('/auth/profile');
      const user = response.data?.data || response.data;
      if (user) {
        await appStorage.saveUserProfile(user);
      }
      return response.data;
    } catch (err) {
      // Fallback to legacy endpoint if /auth/profile 404s
      try {
        const response = await api.get('/auth/user');
        if (response.data?.data) {
          await appStorage.saveUserProfile(response.data.data);
        }
        return response.data;
      } catch (e) {
        throw err;
      }
    }
  },

  updateProfile: async (data: UpdateProfilePayload) => {
    const response = await api.put('/auth/profile', {
      email: data.email.trim(),
      phone: data.phone.trim(),
    });

    const updatedUser = response.data?.data || response.data?.user;
    if (updatedUser) {
      // Preserve existing fields like name and role if backend only returns partial
      const currentUser = await appStorage.getUserProfile();
      const merged = { ...currentUser, ...updatedUser };
      await appStorage.saveUserProfile(merged);
    }
    return response.data;
  },

  changePassword: async (data: ChangePasswordPayload) => {
    const response = await api.post('/auth/change-password', {
      current_password: data.current_password,
      new_password: data.new_password,
      new_password_confirmation: data.new_password_confirmation,
    });
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
