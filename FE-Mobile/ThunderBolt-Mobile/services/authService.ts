// services/authService.ts
import { apiRequest, setToken, removeToken, BASE_URL, getToken } from './api';

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

  async updateProfile(userId: number, data: { name?: string; email?: string }): Promise<User> {
    await apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: data,
    });
    return await this.getMe();
  },

  async uploadProfileImage(userId: number, imageUri: string): Promise<string> {
    const token = await getToken();
    const formData = new FormData();

    // Create file object from URI for React Native
    const filename = imageUri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('profile_image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await fetch(`${BASE_URL}/users/${userId}/profile-image`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to upload profile image');
    }
    return result.data.profile_image;
  },
};

