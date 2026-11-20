// services/vehicleService.ts
// Modul layanan pengelolaan data kendaraan pelanggan (garasi kendaraan, penambahan, pengubahan, dan penghapusan kendaraan).
import { apiRequest } from './api';

// Struktur representasi entitas data kendaraan pengguna
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
  // Field gabungan (joined) dari relasi pemilik kendaraan
  owner_name?: string;
  owner_email?: string;
}

// Struktur data masukan ketika mendaftarkan kendaraan baru ke sistem
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
  /**
   * Mengambil daftar seluruh kendaraan milik pengguna (garasi) berdasarkan ID user dan email.
   */
  async getVehiclesByUser(userId: number, email?: string): Promise<Vehicle[]> {
    const endpoint = email
      ? `/vehicles/user/${userId}?email=${encodeURIComponent(email.trim())}`
      : `/vehicles/user/${userId}`;
    const res = await apiRequest<Vehicle[]>(endpoint);
    return res.data || [];
  },

  /**
   * Mengambil detail satu kendaraan berdasarkan ID.
   */
  async getVehicleById(id: number | string): Promise<Vehicle | null> {
    const res = await apiRequest<Vehicle>(`/vehicles/${id}`);
    return res.data || null;
  },

  /**
   * Mendaftarkan kendaraan baru ke garasi pengguna.
   * Melakukan sanitasi transmisi menjadi 'manual' atau 'automatic' sesuai aturan database Postgres Supabase.
   */
  async createVehicle(data: CreateVehicleData): Promise<Vehicle> {
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

  /**
   * Memperbarui informasi data kendaraan yang sudah terdaftar.
   */
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

  /**
   * Menghapus kendaraan dari daftar garasi pengguna.
   */
  async deleteVehicle(idOrPlate: number | string): Promise<boolean> {
    const res = await apiRequest(`/vehicles/${idOrPlate}`, { method: 'DELETE' });
    return res.success;
  },
};
