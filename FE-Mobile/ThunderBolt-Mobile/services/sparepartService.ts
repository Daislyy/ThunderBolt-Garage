// services/sparepartService.ts
// Modul layanan untuk melihat katalog suku cadang (spareparts) serta rincian sparepart yang dipakai pada suatu booking servis.
import { apiRequest } from './api';

// Struktur representasi master data suku cadang
export interface Sparepart {
  id: number;
  name: string;
  price: number;
  created_at?: string;
  updated_at?: string;
}

// Struktur data rincian suku cadang yang digunakan dalam satu transaksi booking servis
export interface BookingSparepart {
  id: number;
  booking_id: number;
  sparepart_id: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  subtotal: number;
}

// Struktur respons data daftar sparepart servis beserta akumulasi total harganya
export interface BookingSparepartsResponse {
  spareparts: BookingSparepart[];
  total_price: number;
}

export const sparepartService = {
  /**
   * Mengambil semua daftar suku cadang yang tersedia di bengkel.
   */
  async getAllSpareparts(): Promise<Sparepart[]> {
    const res = await apiRequest<Sparepart[]>('/spareparts', { requiresAuth: false });
    return res.data || [];
  },

  /**
   * Mengambil detail satu data suku cadang berdasarkan ID.
   */
  async getSparepartById(id: number): Promise<Sparepart | null> {
    const res = await apiRequest<Sparepart>(`/spareparts/${id}`, { requiresAuth: false });
    return res.data || null;
  },

  /**
   * Mengambil rincian suku cadang apa saja yang dipasang/digunakan pada pengerjaan booking tertentu.
   */
  async getBookingSpareparts(bookingId: number): Promise<BookingSparepartsResponse> {
    const res = await apiRequest<BookingSparepart[]>(`/bookings/${bookingId}/spareparts`);
    return {
      spareparts: res.data || [],
      total_price: (res as any).total_price || 0,
    };
  },
};
