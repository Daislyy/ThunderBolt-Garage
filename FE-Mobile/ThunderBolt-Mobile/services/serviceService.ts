// services/serviceService.ts
// Modul layanan katalog jenis jasa dan paket servis kendaraan di ThunderBolt Garage.
import { apiRequest } from './api';

// Struktur representasi entitas data layanan servis bengkel
export interface Service {
  id: number;
  name: string;
  description: string | null;
  duration?: string;
  price?: number;
  created_at?: string;
  updated_at?: string;
}

// Data katalog layanan default (fallback) yang diselaraskan dengan Web Frontend jika koneksi backend offline
export const DEFAULT_GARAGE_SERVICES: Service[] = [
  {
    id: 1,
    name: 'Servis Berkala & Ganti Oli',
    description: 'Pembersihan saringan udara, pengecekan busi, ganti oli mesin & filter, serta pelumasan kabel.',
    duration: '45 - 60 Menit',
    price: 85000,
  },
  {
    id: 2,
    name: 'Tune Up & Sistem Injeksi',
    description: 'Pembersihan throttle body, kalibrasi sensor ECU/OBD, reset error, dan optimalisasi konsumsi BBM.',
    duration: '60 - 90 Menit',
    price: 150000,
  },
  {
    id: 3,
    name: 'Servis Rem & Kaki-kaki',
    description: 'Pengecekan ketebalan kampas rem, kuras & ganti minyak rem, pembersihan kaliper, dan suspensi.',
    duration: '40 - 50 Menit',
    price: 75000,
  },
  {
    id: 4,
    name: 'Servis CVT & Transmisi',
    description: 'Pembersihan pulley, pengecekan roller, v-belt, kampas ganda, dan penggantian oli gardan.',
    duration: '50 - 70 Menit',
    price: 95000,
  },
  {
    id: 5,
    name: 'Kelistrikan & Penggantian Aki',
    description: 'Pengecekan voltase alternator/spul, tes kondisi baterai (CCA), dan perbaikan jalur kabel.',
    duration: '30 - 45 Menit',
    price: 50000,
  },
  {
    id: 6,
    name: 'Turun Mesin & Overhaul',
    description: 'Skir klep, ganti ring piston, peremajaan silinder head, dan pembersihan kerak ruang bakar menyeluruh.',
    duration: '1 - 2 Hari',
    price: 450000,
  },
];

export const serviceService = {
  /**
   * Mengambil seluruh daftar layanan servis dari backend dengan fallback ke data katalog standar.
   */
  async getAllServices(): Promise<Service[]> {
    try {
      const res = await apiRequest<Service[]>('/services', { requiresAuth: false });
      const apiData = res.data || [];

      if (apiData.length > 0) {
        return apiData.map((item, idx) => {
          const match = DEFAULT_GARAGE_SERVICES.find(
            (d) => d.name.toLowerCase() === item.name.toLowerCase() || d.id === item.id
          );
          const rawPrice = item.price !== undefined && item.price !== null ? Number(item.price) : undefined;
          return {
            ...item,
            duration: match?.duration || '45 - 60 Menit',
            price: rawPrice || match?.price || (idx % 2 === 0 ? 120000 : 95000),
            description: item.description || match?.description || 'Pemeriksaan standar teknisi bengkel ThunderBolt.',
          };
        });
      }
    } catch {
      // Menggunakan fallback data offline jika pemanggilan API gagal
    }
    return DEFAULT_GARAGE_SERVICES;
  },

  /**
   * Mengambil detail satu paket layanan servis berdasarkan ID.
   */
  async getServiceById(id: number): Promise<Service | null> {
    try {
      const res = await apiRequest<Service>(`/services/${id}`, { requiresAuth: false });
      if (res.data) {
        const match = DEFAULT_GARAGE_SERVICES.find(
          (d) => d.name.toLowerCase() === res.data!.name.toLowerCase() || d.id === res.data!.id
        );
        const rawPrice = res.data.price !== undefined && res.data.price !== null ? Number(res.data.price) : undefined;
        return {
          ...res.data,
          duration: match?.duration || '45 - 60 Menit',
          price: rawPrice || match?.price || 100000,
        };
      }
    } catch {
      // Menggunakan fallback data offline jika pemanggilan API gagal
    }

    const local = DEFAULT_GARAGE_SERVICES.find((s) => s.id === id);
    return local || null;
  },
};
