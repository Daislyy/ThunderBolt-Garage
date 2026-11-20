// contexts/AuthContext.tsx
// Context React global untuk mengelola status autentikasi pengguna di seluruh aplikasi (data user, token JWT, status login, dan fungsi otentikasi).
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, User } from '../services/authService';
import { getToken } from '../services/api';

// Struktur tipe data dan method yang disediakan oleh AuthContext
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Inisialisasi Context dengan nilai awal default
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoggedIn: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

// Komponen Provider yang membungkus aplikasi agar state user dapat diakses di semua halaman
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memeriksa keberadaan token tersimpan di memori perangkat saat aplikasi pertama kali dibuka (auto-login)
  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          if (isMounted) setTokenState(storedToken);
          // Ambil data profil terbaru dari server menggunakan token yang ada
          const userData = await authService.getMe();
          if (isMounted) setUser(userData);
        }
      } catch (error) {
        // Jika token tidak valid atau database di-reset, hapus sesi login lokal
        console.log('Token kedaluwarsa atau tidak valid, mereset sesi login:', error);
        try {
          await authService.logout();
        } catch {}
        if (isMounted) {
          setUser(null);
          setTokenState(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handler proses masuk akun (login)
  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    setTokenState(result.token);
  }, []);

  // Handler proses pendaftaran akun baru (register)
  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await authService.register(name, email, password);
    setUser(result.user);
    setTokenState(result.token);
  }, []);

  // Handler proses keluar akun (logout)
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setTokenState(null);
  }, []);

  // Handler untuk memuat ulang data profil pengguna dari database (misal setelah ubah nama/foto)
  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch {
      // Abaikan jika pembaruan latar belakang gagal
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook kustom untuk mempermudah pemanggilan AuthContext pada komponen anak
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam komponen AuthProvider');
  }
  return context;
}
