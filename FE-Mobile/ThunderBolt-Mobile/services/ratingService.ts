// services/ratingService.ts
import { apiRequest } from './api';

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
  async getAllRatings(): Promise<Rating[]> {
    const res = await apiRequest<Rating[]>('/ratings', { requiresAuth: false });
    return res.data || [];
  },

  async getRatingsByService(serviceId: number): Promise<Rating[]> {
    const res = await apiRequest<Rating[]>(`/ratings/service/${serviceId}`, { requiresAuth: false });
    return res.data || [];
  },

  async getRatingsByUser(userId: number): Promise<Rating[]> {
    const res = await apiRequest<Rating[]>(`/ratings/user/${userId}`);
    return res.data || [];
  },

  async getRatingById(id: number): Promise<Rating | null> {
    const res = await apiRequest<Rating>(`/ratings/${id}`);
    return res.data || null;
  },

  async createRating(data: CreateRatingData): Promise<Rating> {
    const res = await apiRequest<Rating>('/ratings', {
      method: 'POST',
      body: data,
    });
    return res.data!;
  },
};
