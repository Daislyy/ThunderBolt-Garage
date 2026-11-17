// services/bookingService.ts
import { apiRequest } from './api';

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
  // Joined fields
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
  async getBookingsByUser(userId: number, email?: string): Promise<Booking[]> {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const res = await apiRequest<Booking[]>(`/bookings/user/${userId}${query}`);
    return res.data || [];
  },

  async getBookingById(idOrCode: number | string): Promise<Booking | null> {
    const res = await apiRequest<Booking>(`/bookings/${idOrCode}`);
    return res.data || null;
  },

  async createBooking(data: CreateBookingData): Promise<Booking> {
    const res = await apiRequest<Booking>('/bookings', {
      method: 'POST',
      body: data,
    });
    return res.data!;
  },

  async updateBookingStatus(idOrCode: number | string, status: string): Promise<boolean> {
    const res = await apiRequest(`/bookings/${idOrCode}/status`, {
      method: 'PATCH',
      body: { status },
    });
    return res.success;
  },

  async cancelBooking(idOrCode: number | string): Promise<boolean> {
    return this.updateBookingStatus(idOrCode, 'Dibatalkan');
  },

  async deleteBooking(idOrCode: number | string): Promise<boolean> {
    const res = await apiRequest(`/bookings/${idOrCode}`, { method: 'DELETE' });
    return res.success;
  },
};
