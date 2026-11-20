// services/authService.ts
// Modul layanan autentikasi pengguna (login, registrasi akun baru, ambil data profil, pembaruan foto profil, dan logout).
import { apiRequest, setToken, removeToken, BASE_URL, getToken } from './api';

// Struktur representasi entitas pengguna (User)
export interface User {
  id: number;
  name: string;
  email: string;
  profile_image: string | null;
  role: 'customer' | 'admin';
  created_at?: string;
  updated_at?: string;
}

// Struktur respons data setelah autentikasi sukses (mengandung user dan JWT token)
export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  /**
   * Melakukan login pengguna dengan email dan kata sandi, lalu menyimpan token sesi ke memori perangkat.
   */
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

  /**
   * Melakukan registrasi akun pelanggan baru lalu otomatis menyimpan token ke memori perangkat.
   */
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

  /**
   * Mengambil data profil pengguna yang sedang login saat ini berdasarkan token JWT.
   */
  async getMe(): Promise<User> {
    const res = await apiRequest<User>('/auth/me');
    return res.data!;
  },

  /**
   * Memperbarui profil pengguna (nama, email, atau foto profil).
   */
  async updateProfile(userId: number, data: { name?: string; email?: string; profile_image?: string | null }): Promise<User> {
    await apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: data,
    });
    return await this.getMe();
  },

  /**
   * Menghapus token otentikasi dari memori lokal untuk keluar dari sesi akun.
   */
  async logout(): Promise<void> {
    await removeToken();
  },

  /**
   * Mengunggah file foto profil baru ke server backend via multipart/form-data.
   */
  async uploadProfileImage(userId: number, imageUri: string): Promise<string> {
    const token = await getToken();
    const formData = new FormData();

    // Membentuk objek file dari URI lokal untuk lingkungan React Native
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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Gagal mengunggah foto profil');
    }
    return data.data.profile_image;
  },
};
