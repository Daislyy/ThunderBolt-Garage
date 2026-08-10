// services/vehicleService.ts
import { apiRequest } from './api';

export interface Vehicle {
  id: number;
  user_id: number;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  transmission: string | null;
  image: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  owner_name?: string;
  owner_email?: string;
}

export interface CreateVehicleData {
  user_id: number;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  transmission?: string;
  image?: string;
}

export const vehicleService = {
  async getVehiclesByUser(userId: number): Promise<Vehicle[]> {
    const res = await apiRequest<Vehicle[]>(`/vehicles/user/${userId}`);
    return res.data || [];
  },

  async getVehicleById(id: number): Promise<Vehicle | null> {
    const res = await apiRequest<Vehicle>(`/vehicles/${id}`);
    return res.data || null;
  },

  async createVehicle(data: CreateVehicleData): Promise<Vehicle> {
    const res = await apiRequest<Vehicle>('/vehicles', {
      method: 'POST',
      body: data,
    });
    return res.data!;
  },

  async updateVehicle(id: number, data: Partial<CreateVehicleData>): Promise<boolean> {
    const res = await apiRequest(`/vehicles/${id}`, {
      method: 'PUT',
      body: data,
    });
    return res.success;
  },

  async deleteVehicle(id: number): Promise<boolean> {
    const res = await apiRequest(`/vehicles/${id}`, { method: 'DELETE' });
    return res.success;
  },
};
