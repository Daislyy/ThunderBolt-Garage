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
  async getVehiclesByUser(userId: number, email?: string): Promise<Vehicle[]> {
    const endpoint = email
      ? `/vehicles/user/${userId}?email=${encodeURIComponent(email.trim())}`
      : `/vehicles/user/${userId}`;
    const res = await apiRequest<Vehicle[]>(endpoint);
    return res.data || [];
  },

  async getVehicleById(id: number | string): Promise<Vehicle | null> {
    const res = await apiRequest<Vehicle>(`/vehicles/${id}`);
    return res.data || null;
  },

  async createVehicle(data: CreateVehicleData): Promise<Vehicle> {
    // Sanitize transmission to meet Postgres CHECK constraint ('manual' | 'automatic')
    let cleanTransmission = 'automatic';
    if (data.transmission) {
      const t = data.transmission.toLowerCase();
      cleanTransmission = t.includes('man') || t.includes('kopling') ? 'manual' : 'automatic';
    }

    const payload = {
      ...data,
      license_plate: data.license_plate.trim().toUpperCase(),
      transmission: cleanTransmission,
    };

    const res = await apiRequest<Vehicle>('/vehicles', {
      method: 'POST',
      body: payload,
    });
    return res.data!;
  },

  async updateVehicle(id: number | string, data: Partial<CreateVehicleData>): Promise<boolean> {
    const payload = { ...data };
    if (payload.license_plate) {
      payload.license_plate = payload.license_plate.trim().toUpperCase();
    }
    if (payload.transmission) {
      const t = payload.transmission.toLowerCase();
      payload.transmission = t.includes('man') || t.includes('kopling') ? 'manual' : 'automatic';
    }

    const res = await apiRequest(`/vehicles/${id}`, {
      method: 'PUT',
      body: payload,
    });
    return res.success;
  },

  async deleteVehicle(idOrPlate: number | string): Promise<boolean> {
    const res = await apiRequest(`/vehicles/${idOrPlate}`, { method: 'DELETE' });
    return res.success;
  },
};
