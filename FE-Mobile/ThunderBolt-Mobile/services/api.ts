// services/api.ts
// Modul utilitas HTTP request terpusat untuk komunikasi aplikasi mobile dengan Backend ThunderBolt Garage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Mendeteksi otomatis alamat IP komputer lokal (host) dari Expo Metro Bundler agar HP/emulator bisa terhubung ke server backend lokal
const getDefaultBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000/api`;
    }
  }

  // Jika menggunakan emulator Android resmi (Android Studio), arahkan ke loopback alias 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  // Default untuk iOS Simulator atau environment web
  return 'http://127.0.0.1:5000/api';
};

// URL dasar API backend
export const BASE_URL = getDefaultBaseUrl();
console.log('[Mobile API Base URL]:', BASE_URL);

// Kunci penyimpanan token autentikasi di penyimpanan lokal perangkat (AsyncStorage)
const TOKEN_KEY = 'thunderbolt_auth_token';

// Mengambil token JWT yang tersimpan di memori perangkat
export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Menyimpan token JWT ke memori perangkat setelah login atau register berhasil
export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

// Menghapus token JWT dari memori perangkat ketika pengguna melakukan logout
export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// Struktur standar respons data dari backend API
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Opsi konfigurasi pemanggilan request HTTP
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  requiresAuth?: boolean;
}

// Fungsi utama pemanggil API (HTTP client) dengan penanganan otorisasi Bearer Token dan pembatasan batas waktu (timeout)
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, requiresAuth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Sisipkan header Authorization jika endpoint membutuhkan login/token
  if (requiresAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${BASE_URL}${endpoint}`;

  // Mengatur batas waktu (timeout) request selama 8 detik menggunakan AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    // Lempar error jika status respons HTTP tidak 2xx
    if (!response.ok) {
      throw new Error(data.message || `Permintaan gagal dengan status ${response.status}`);
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    // Penanganan kondisi jika koneksi melewati batas waktu tunggu
    if (error.name === 'AbortError') {
      throw new Error('Koneksi timeout. Server/database mungkin lambat atau sedang di-reset.');
    }
    // Penanganan error jaringan (misalnya backend mati atau IP salah)
    if (error.message === 'Network request failed' || error.message?.includes('Failed to fetch')) {
      throw new Error('Tidak bisa terhubung ke server. Pastikan backend sudah berjalan.');
    }
    throw error;
  }
}
