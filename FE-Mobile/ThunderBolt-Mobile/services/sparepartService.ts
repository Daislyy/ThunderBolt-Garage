// services/sparepartService.ts
import { apiRequest } from './api';

export interface Sparepart {
  id: number;
  name: string;
  price: number;
  created_at?: string;
  updated_at?: string;
}

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

export interface BookingSparepartsResponse {
  spareparts: BookingSparepart[];
  total_price: number;
}

export const sparepartService = {
  async getAllSpareparts(): Promise<Sparepart[]> {
    const res = await apiRequest<Sparepart[]>('/spareparts', { requiresAuth: false });
    return res.data || [];
  },

  async getSparepartById(id: number): Promise<Sparepart | null> {
    const res = await apiRequest<Sparepart>(`/spareparts/${id}`, { requiresAuth: false });
    return res.data || null;
  },

  async getBookingSpareparts(bookingId: number): Promise<BookingSparepartsResponse> {
    const res = await apiRequest<BookingSparepart[]>(`/bookings/${bookingId}/spareparts`);
    return {
      spareparts: res.data || [],
      total_price: (res as any).total_price || 0,
    };
  },
};

