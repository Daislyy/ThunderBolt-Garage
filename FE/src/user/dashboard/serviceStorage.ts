import api from '../../api/axios'

export interface GarageService {
  id: number
  name: string
  description: string | null
  created_at: string
  price?: number
  duration?: string
}

const STORAGE_KEY = 'tb_shared_services'

export const defaultGarageServices: GarageService[] = [
  {
    id: 1,
    name: 'Servis Berkala & Ganti Oli',
    description: 'Pembersihan saringan udara, pengecekan busi, ganti oli mesin & filter, serta pelumasan kabel.',
    duration: '45 - 60 Menit',
    price: 85000,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Tune Up & Sistem Injeksi',
    description: 'Pembersihan throttle body, kalibrasi sensor ECU/OBD, reset error, dan optimalisasi konsumsi BBM.',
    duration: '60 - 90 Menit',
    price: 150000,
    created_at: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'Servis Rem & Kaki-kaki',
    description: 'Pengecekan ketebalan kampas rem, kuras & ganti minyak rem, pembersihan kaliper, dan suspensi.',
    duration: '40 - 50 Menit',
    price: 75000,
    created_at: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 4,
    name: 'Servis CVT & Transmisi',
    description: 'Pembersihan pulley, pengecekan roller, v-belt, kampas ganda, dan penggantian oli gardan.',
    duration: '50 - 70 Menit',
    price: 95000,
    created_at: '2026-01-04T00:00:00.000Z',
  },
  {
    id: 5,
    name: 'Kelistrikan & Penggantian Aki',
    description: 'Pengecekan voltase alternator/spul, tes kondisi baterai (CCA), dan perbaikan jalur kabel.',
    duration: '30 - 45 Menit',
    price: 50000,
    created_at: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 6,
    name: 'Turun Mesin & Overhaul',
    description: 'Skir klep, ganti ring piston, peremajaan silinder head, dan pembersihan kerak ruang bakar menyeluruh.',
    duration: '1 - 2 Hari',
    price: 450000,
    created_at: '2026-01-06T00:00:00.000Z',
  },
]

export function getLocalServices(): GarageService[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultGarageServices))
      return defaultGarageServices
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultGarageServices
  } catch {
    return defaultGarageServices
  }
}

export function saveLocalServices(services: GarageService[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(services))
    window.dispatchEvent(new Event('tb_services_updated'))
  } catch {
    // Ignore storage quota error
  }
}

export async function fetchAllServices(): Promise<GarageService[]> {
  const localList = getLocalServices()

  try {
    const res = await api.get('/services')
    if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      const apiServices: GarageService[] = res.data.data.map((item: any, idx: number) => {
        const localMatch = localList.find((l) => l.name.toLowerCase() === item.name.toLowerCase() || l.id === item.id)
        return {
          id: item.id,
          name: item.name,
          description: item.description || localMatch?.description || 'Pemeriksaan standar teknisi bengkel ThunderBolt.',
          duration: localMatch?.duration || '45 - 60 Menit',
          price: localMatch?.price || (idx % 2 === 0 ? 120000 : 95000),
          created_at: item.created_at || new Date().toISOString(),
        }
      })

      const uniqueLocal = localList.filter((l) => !apiServices.some((a) => a.name.toLowerCase() === l.name.toLowerCase()))
      const merged = [...apiServices, ...uniqueLocal]
      saveLocalServices(merged)
      return merged
    }
  } catch {
    // Backend offline, fallback to local
  }

  return localList
}

export async function addGarageService(data: { name: string; description: string; price?: number; duration?: string }): Promise<GarageService> {
  const current = getLocalServices()
  const newService: GarageService = {
    id: Date.now(),
    name: data.name.trim(),
    description: data.description.trim() || 'Layanan servis berkala dan perawatan kendaraan.',
    duration: data.duration || '45 - 60 Menit',
    price: data.price || 100000,
    created_at: new Date().toISOString(),
  }

  const updated = [newService, ...current]
  saveLocalServices(updated)

  // Sync to backend if accessible
  try {
    const res = await api.post('/services', {
      name: newService.name,
      description: newService.description,
    })
    if (res.data?.data?.id) {
      newService.id = res.data.data.id
      saveLocalServices(updated)
    }
  } catch {
    // Keep local version
  }

  return newService
}

export async function updateGarageService(id: number, data: { name: string; description: string }): Promise<void> {
  const current = getLocalServices()
  const updated = current.map((item) => (item.id === id ? { ...item, name: data.name.trim(), description: data.description.trim() } : item))
  saveLocalServices(updated)

  try {
    await api.put(`/services/${id}`, data)
  } catch {
    // Keep local version
  }
}

export async function deleteGarageService(id: number): Promise<void> {
  const current = getLocalServices()
  const updated = current.filter((item) => item.id !== id)
  saveLocalServices(updated)

  try {
    await api.delete(`/services/${id}`)
  } catch {
    // Keep local deletion
  }
}
