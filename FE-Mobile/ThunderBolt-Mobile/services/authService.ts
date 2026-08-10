// services/authService.ts
import { apiRequest, setToken, removeToken } from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  profile_image: string | null;
  role: 'customer' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      requiresAuth: false,
    });
    if (res.data) {
      await setToken(res.data.token);
    }
    return res.data!;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
      requiresAuth: false,
    });
    if (res.data) {
      await setToken(res.data.token);
    }
    return res.data!;
  },

  async getMe(): Promise<User> {
    const res = await apiRequest<User>('/auth/me');
    return res.data!;
  },

  async logout(): Promise<void> {
    await removeToken();
  },
};
