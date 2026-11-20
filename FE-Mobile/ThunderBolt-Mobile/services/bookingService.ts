// services/bookingService.ts
// Modul layanan untuk menangani seluruh alur data booking servis kendaraan (ambil data, buat booking, update status, dan pembatalan).
import { apiRequest } from './api';

// Struktur representasi entitas data booking servis lengkap dengan informasi relasi (user, kendaraan, layanan)
export interface Booking {
  id: number;
  booking_code: string;
  user_id: number;
  vehicle_id: number;
  service_id: number;
  booking_date: string;
  booking_time: string;
  notes: string | null;
  status: string; // 'Menunggu' | 'Diproses' | 'Menunggu Pembayaran' | 'Selesai' | 'Dibatalkan'
  total_price?: number;
  created_at?: string;
  updated_at?: string;
  // Field gabungan (joined) dari relasi tabel pengguna, kendaraan, dan layanan
  customer_name?: string;
  customer_email?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  license_plate?: string;
  transmission?: string;
  service_name?: string;
  service_description?: string;
  service_price?: number;
}

// Struktur data masukan (payload) untuk membuat reservasi servis baru
export interface CreateBookingData {
  user_id: number;
  customer_email?: string;
  vehicle_id: number;
  license_plate?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  transmission?: string;
  service_id: number;
  service_name?: string;
  booking_date: string;
  booking_time: string;
  notes?: string;
  booking_code?: string;
}

export const bookingService = {
  /**
   * Mengambil riwayat dan daftar booking aktif milik pengguna berdasarkan ID user dan email.
   */
  async getBookingsByUser(userId: number, email?: string): Promise<Booking[]> {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const res = await apiRequest<Booking[]>(`/bookings/user/${userId}${query}`);
    return res.data || [];
  },

  /**
   * Mengambil detail satu data booking berdasarkan ID numerik atau kode booking unik (contoh: TBG-20261118-1234).
   */
  async getBookingById(idOrCode: number | string): Promise<Booking | null> {
    const res = await apiRequest<Booking>(`/bookings/${idOrCode}`);
    return res.data || null;
  },

  /**
   * Mengirimkan permohonan reservasi servis baru ke server.
   */
  async createBooking(data: CreateBookingData): Promise<Booking> {
    const res = await apiRequest<Booking>('/bookings', {
      method: 'POST',
      body: data,
    });
    return res.data!;
  },

  /**
   * Memperbarui status booking (misal: 'Diproses', 'Menunggu Pembayaran', 'Selesai', atau 'Dibatalkan').
   */
  async updateBookingStatus(idOrCode: number | string, status: string): Promise<boolean> {
    const res = await apiRequest(`/bookings/${idOrCode}/status`, {
      method: 'PATCH',
      body: { status },
    });
    return res.success;
  },

  /**
   * Membatalkan jadwal booking yang masih berstatus 'Menunggu'.
   */
  async cancelBooking(idOrCode: number | string): Promise<boolean> {
    return this.updateBookingStatus(idOrCode, 'Dibatalkan');
  },

  /**
   * Menghapus catatan booking secara permanen (biasanya untuk pengujian atau pembersihan data).
   */
  async deleteBooking(idOrCode: number | string): Promise<boolean> {
    const res = await apiRequest(`/bookings/${idOrCode}`, { method: 'DELETE' });
    return res.success;
  },
};
