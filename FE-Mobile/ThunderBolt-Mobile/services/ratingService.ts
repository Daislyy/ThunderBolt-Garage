// services/ratingService.ts
// Modul layanan untuk pengelolaan ulasan dan rating pelanggan terhadap layanan servis bengkel.
import { apiRequest } from './api';

// Struktur representasi entitas data ulasan dan rating
export interface Rating {
  id?: number;
  booking_id: number;
  user_id: number;
  service_id: number;
  rating: number;
  review?: string | null;
  created_at?: string;
  customer_name?: string;
  customer_email?: string;
  service_name?: string;
  booking_code?: string;
}

// Struktur data masukan untuk mengirim ulasan dan rating baru
export interface CreateRatingData {
  booking_id: number;
  booking_code?: string;
  user_id: number;
  customer_email?: string;
  service_id: number;
  service_name?: string;
  rating: number;
  review?: string;
}

export const ratingService = {
  /**
   * Mengambil semua rating dan ulasan pelanggan untuk ditampilkan pada halaman beranda atau landing page.
   */
  async getAllRatings(): Promise<Rating[]> {
    const res = await apiRequest<Rating[]>('/ratings', { requiresAuth: false });
    return res.data || [];
  },

  /**
   * Mengambil kumpulan ulasan berdasarkan ID layanan tertentu.
   */
  async getRatingsByService(serviceId: number): Promise<Rating[]> {
    const res = await apiRequest<Rating[]>(`/ratings/service/${serviceId}`, { requiresAuth: false });
    return res.data || [];
  },

  /**
   * Mengambil ulasan yang pernah dikirim oleh pengguna tertentu berdasarkan ID user.
   */
  async getRatingsByUser(userId: number): Promise<Rating[]> {
    try {
      const res = await apiRequest<Rating[]>(`/ratings/user/${userId}`);
      return res.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Mengambil detail satu data ulasan berdasarkan ID rating.
   */
  async getRatingById(id: number): Promise<Rating | null> {
    const res = await apiRequest<Rating>(`/ratings/${id}`);
    return res.data || null;
  },

  /**
   * Mengambil rating untuk booking tertentu berdasarkan booking_id atau booking_code.
   */
  async getRatingByBooking(bookingIdOrCode: number | string, userId?: number): Promise<Rating | null> {
    try {
      if (userId) {
        const userRatings = await this.getRatingsByUser(userId);
        const match = userRatings.find(
          (r) =>
            String(r.booking_id) === String(bookingIdOrCode) ||
            (r.booking_code && String(r.booking_code) === String(bookingIdOrCode))
        );
        if (match) return match;
      }
      const allRatings = await this.getAllRatings();
      const match = allRatings.find(
        (r) =>
          String(r.booking_id) === String(bookingIdOrCode) ||
          (r.booking_code && String(r.booking_code) === String(bookingIdOrCode))
      );
      return match || null;
    } catch {
      return null;
    }
  },

  /**
   * Mengirimkan penilaian bintang dan ulasan baru terhadap servis yang telah selesai.
   */
  async createRating(data: CreateRatingData): Promise<Rating> {
    const res = await apiRequest<Rating>('/ratings', {
      method: 'POST',
      body: data,
    });
    return res.data!;
  },
};
