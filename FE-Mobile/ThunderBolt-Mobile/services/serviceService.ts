// services/serviceService.ts
import { apiRequest } from './api';

export interface Service {
  id: number;
  name: string;
  description: string | null;
  duration?: string;
  price?: number;
  created_at?: string;
  updated_at?: string;
}

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
  async getAllServices(): Promise<Service[]> {
    try {
      const res = await apiRequest<Service[]>('/services', { requiresAuth: false });
      const apiData = res.data || [];

      if (apiData.length > 0) {
        return apiData.map((item, idx) => {
          const match = DEFAULT_GARAGE_SERVICES.find(
            (d) => d.name.toLowerCase() === item.name.toLowerCase() || d.id === item.id
          );
          return {
            ...item,
            duration: match?.duration || '45 - 60 Menit',
            price: match?.price || (idx % 2 === 0 ? 120000 : 95000),
            description: item.description || match?.description || 'Pemeriksaan standar teknisi bengkel ThunderBolt.',
          };
        });
      }
    } catch {
      // Offline fallback
    }
    return DEFAULT_GARAGE_SERVICES;
  },

  async getServiceById(id: number): Promise<Service | null> {
    try {
      const res = await apiRequest<Service>(`/services/${id}`, { requiresAuth: false });
      if (res.data) {
        const match = DEFAULT_GARAGE_SERVICES.find(
          (d) => d.name.toLowerCase() === res.data!.name.toLowerCase() || d.id === res.data!.id
        );
        return {
          ...res.data,
          duration: match?.duration || '45 - 60 Menit',
          price: match?.price || 100000,
        };
      }
    } catch {
      // Offline fallback
    }

    const local = DEFAULT_GARAGE_SERVICES.find((s) => s.id === id);
    return local || null;
  },
};
