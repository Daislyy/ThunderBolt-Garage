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
  status: string; // 'Menunggu' | 'Diproses' | 'Selesai'
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
}

export interface CreateBookingData {
  user_id: number;
  vehicle_id: number;
  service_id: number;
  booking_date: string;
  booking_time: string;
  notes?: string;
}

export const bookingService = {
  async getBookingsByUser(userId: number): Promise<Booking[]> {
    const res = await apiRequest<Booking[]>(`/bookings/user/${userId}`);
    return res.data || [];
  },

  async getBookingById(id: number): Promise<Booking | null> {
    const res = await apiRequest<Booking>(`/bookings/${id}`);
    return res.data || null;
  },

  async createBooking(data: CreateBookingData): Promise<Booking> {
    const res = await apiRequest<Booking>('/bookings', {
      method: 'POST',
      body: data,
    });
    return res.data!;
  },

  async updateBookingStatus(id: number, status: string): Promise<boolean> {
    const res = await apiRequest(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
    return res.success;
  },

  async deleteBooking(id: number): Promise<boolean> {
    const res = await apiRequest(`/bookings/${id}`, { method: 'DELETE' });
    return res.success;
  },
};
