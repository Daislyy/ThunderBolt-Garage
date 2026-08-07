// services/serviceService.ts
import { apiRequest } from './api';

export interface Service {
  id: number;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export const serviceService = {
  async getAllServices(): Promise<Service[]> {
    const res = await apiRequest<Service[]>('/services', { requiresAuth: false });
    return res.data || [];
  },

  async getServiceById(id: number): Promise<Service | null> {
    const res = await apiRequest<Service>(`/services/${id}`, { requiresAuth: false });
    return res.data || null;
  },
};
