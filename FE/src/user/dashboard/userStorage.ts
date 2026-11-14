import type { CustomerUser } from '../../hooks/useCustomerAuth'
import api from '../../api/axios'

export interface UserVehicle {
  id: number | string
  userId: number | string
  brand: string
  model: string
  year: string | number
  license_plate: string
  transmission: string
  status?: 'normal' | 'waiting' | 'in_progress' | 'completed'
  activeService?: string
  lastServiceDate?: string
}

export interface UserBookingRecord {
  id: number | string
  booking_code: string
  user_id?: number | string
  customer_name?: string
  customer_email?: string
  vehicle_id?: number | string
  vehicle_brand: string
  vehicle_model: string
  vehicle_year?: string | number
  license_plate: string
  transmission?: string
  service_name: string
  service_description?: string
  booking_date: string
  booking_time: string
  status: 'Menunggu' | 'Menunggu Konfirmasi' | 'Diproses' | 'Sedang Dikerjakan' | 'Selesai' | 'Dibatalkan' | string
  total_price: number
  notes?: string
  created_at?: string
  demoParts?: Array<{
    sparepart_id: number
    name: string
    price: number
    quantity: number
  }>
}

export const SHARED_ADMIN_BOOKINGS_KEY = 'tb_admin_shared_bookings'

export function getUserStorageKey(user: CustomerUser, key: string): string {
  const emailSafe = (user.email || 'guest').toLowerCase().replace(/[^a-z0-9]/g, '_')
  return `tb_cust_${emailSafe}_${key}`
}

/**
 * Register a booking globally so Admin Dashboard & Admin Bookings Page see it immediately,
 * and attempt to persist in Backend DB as well.
 */
export async function syncBookingToAdmin(booking: UserBookingRecord) {
  // 1. Save to shared admin localStorage
  try {
    const raw = localStorage.getItem(SHARED_ADMIN_BOOKINGS_KEY)
    const existing: UserBookingRecord[] = raw ? JSON.parse(raw) : []
    const updated = [
      booking,
      ...existing.filter(
        (b) => b.booking_code !== booking.booking_code && String(b.id) !== String(booking.id)
      ),
    ]
    localStorage.setItem(SHARED_ADMIN_BOOKINGS_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Error saving shared admin booking:', err)
  }

  // 2. Attempt backend DB persistence if possible
  try {
    await api.post('/bookings', {
      user_id: Number(booking.user_id) || 1,
      vehicle_id: Number(booking.vehicle_id) || 1,
      service_id: 1,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time,
      notes: booking.notes,
    })
  } catch {
    // If backend or foreign keys fail, local shared admin sync is already preserved
  }
}

/**
 * Merge API bookings with shared local bookings for Admin Dashboard & Bookings Page
 */
export function getMergedAdminBookings(apiBookings: any[] = []): any[] {
  try {
    const raw = localStorage.getItem(SHARED_ADMIN_BOOKINGS_KEY)
    const shared: any[] = raw ? JSON.parse(raw) : []
    if (!shared.length) return apiBookings

    // Map of codes to avoid duplicates, prioritizing newer local shared items
    const map = new Map<string, any>()

    // Add shared bookings
    for (const b of shared) {
      const code = b.booking_code || String(b.id)
      map.set(code, b)
    }

    // Add API bookings
    for (const b of apiBookings) {
      const code = b.booking_code || String(b.id)
      if (!map.has(code)) {
        map.set(code, b)
      }
    }

    return Array.from(map.values())
  } catch {
    return apiBookings
  }
}

/**
 * Update a booking status in the shared storage and all user storages
 */
export function updateSharedBookingStatus(idOrCode: string | number, newStatus: string) {
  try {
    const raw = localStorage.getItem(SHARED_ADMIN_BOOKINGS_KEY)
    if (raw) {
      const shared: any[] = JSON.parse(raw)
      const updated = shared.map((b) => {
        if (String(b.id) === String(idOrCode) || b.booking_code === String(idOrCode)) {
          return { ...b, status: newStatus }
        }
        return b
      })
      localStorage.setItem(SHARED_ADMIN_BOOKINGS_KEY, JSON.stringify(updated))
    }

    // Also update in all local storage keys matching tb_cust_
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('_bookings') || key === 'tb_user_bookings')) {
        try {
          const itemRaw = localStorage.getItem(key)
          if (itemRaw) {
            const arr = JSON.parse(itemRaw)
            if (Array.isArray(arr)) {
              let changed = false
              const mapped = arr.map((item: any) => {
                if (
                  String(item.id) === String(idOrCode) ||
                  item.code === String(idOrCode) ||
                  item.booking_code === String(idOrCode)
                ) {
                  changed = true
                  return { ...item, status: newStatus }
                }
                return item
              })
              if (changed) {
                localStorage.setItem(key, JSON.stringify(mapped))
              }
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error('Error updating shared booking status:', err)
  }
}

export interface BookingSparepartItem {
  sparepart_id: number
  name: string
  price: number
  quantity: number
  notes?: string
}

export function saveBookingSpareparts(
  bookingIdOrCode: string | number,
  spareparts: BookingSparepartItem[],
  servicePrice: number = 100000
) {
  try {
    const key = `tb_parts_${bookingIdOrCode}`
    localStorage.setItem(key, JSON.stringify(spareparts))

    const partsTotal = spareparts.reduce(
      (sum, p) => sum + (Number(p.price) || 0) * (Number(p.quantity) || 1),
      0
    )
    const newTotal = servicePrice + partsTotal

    // Update shared admin bookings
    const rawShared = localStorage.getItem(SHARED_ADMIN_BOOKINGS_KEY)
    if (rawShared) {
      const arr = JSON.parse(rawShared)
      const updated = arr.map((b: any) => {
        if (String(b.id) === String(bookingIdOrCode) || b.booking_code === String(bookingIdOrCode)) {
          return { ...b, parts: spareparts, total_price: newTotal }
        }
        return b
      })
      localStorage.setItem(SHARED_ADMIN_BOOKINGS_KEY, JSON.stringify(updated))
    }

    // Update in all customer storages
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i)
      if (storageKey && (storageKey.includes('_bookings') || storageKey === 'tb_user_bookings')) {
        try {
          const itemRaw = localStorage.getItem(storageKey)
          if (itemRaw) {
            const arr = JSON.parse(itemRaw)
            if (Array.isArray(arr)) {
              let changed = false
              const mapped = arr.map((item: any) => {
                if (
                  String(item.id) === String(bookingIdOrCode) ||
                  item.booking_code === String(bookingIdOrCode)
                ) {
                  changed = true
                  return { ...item, parts: spareparts, total_price: newTotal }
                }
                return item
              })
              if (changed) {
                localStorage.setItem(storageKey, JSON.stringify(mapped))
              }
            }
          }
        } catch {}
      }
    }

    // Also attempt backend API if online
    api
      .post(`/bookings/${bookingIdOrCode}/spareparts`, {
        spareparts: spareparts.map((p) => ({
          sparepart_id: p.sparepart_id,
          quantity: p.quantity,
          notes: p.notes,
        })),
      })
      .catch(() => {})

    window.dispatchEvent(
      new CustomEvent('tb_booking_parts_updated', {
        detail: { bookingIdOrCode, spareparts, newTotal },
      })
    )
  } catch (err) {
    console.error('Error saving booking spareparts:', err)
  }
}

export async function getBookingSpareparts(bookingIdOrCode: string | number): Promise<BookingSparepartItem[]> {
  // 1. Check local key
  const localKey = `tb_parts_${bookingIdOrCode}`
  const localSaved = localStorage.getItem(localKey)
  let result: BookingSparepartItem[] = []

  if (localSaved) {
    try {
      result = JSON.parse(localSaved)
      if (Array.isArray(result) && result.length > 0) {
        return result
      }
    } catch {}
  }

  // 2. Check if booking has .parts or .demoParts in shared storage
  try {
    const rawShared = localStorage.getItem(SHARED_ADMIN_BOOKINGS_KEY)
    if (rawShared) {
      const arr = JSON.parse(rawShared)
      const found = arr.find(
        (b: any) => String(b.id) === String(bookingIdOrCode) || b.booking_code === String(bookingIdOrCode)
      )
      if (found?.parts && Array.isArray(found.parts) && found.parts.length > 0) {
        return found.parts
      }
      if (found?.demoParts && Array.isArray(found.demoParts) && found.demoParts.length > 0) {
        return found.demoParts
      }
    }
  } catch {}

  // 3. Try backend API
  try {
    const res = await api.get(`/bookings/${bookingIdOrCode}/spareparts`)
    if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      const apiParts = res.data.data.map((sp: any) => ({
        sparepart_id: sp.sparepart_id,
        name: sp.name,
        price: Number(sp.price),
        quantity: Number(sp.quantity),
        notes: sp.notes || '',
      }))
      localStorage.setItem(localKey, JSON.stringify(apiParts))
      return apiParts
    }
  } catch {}

  return result
}

export function getInitialVehiclesForUser(user: CustomerUser): UserVehicle[] {
  if (user.email === 'pelanggan@thunderbolt.com' || user.id === 9999) {
    return [
      {
        id: 101,
        userId: user.id,
        brand: 'Honda',
        model: 'Vario 160 ABS',
        year: 2023,
        license_plate: 'B 4129 SZX',
        transmission: 'Matic (CVT)',
        status: 'in_progress',
        activeService: 'Tune Up & Sistem Injeksi',
        lastServiceDate: '12 Nov 2026',
      },
      {
        id: 102,
        userId: user.id,
        brand: 'Yamaha',
        model: 'NMAX 155 Connected',
        year: 2022,
        license_plate: 'B 6832 TYA',
        transmission: 'Matic (CVT)',
        status: 'normal',
        lastServiceDate: '28 Okt 2026',
      },
    ]
  }

  return []
}

export function getInitialBookingsForUser(user: CustomerUser): UserBookingRecord[] {
  if (user.email === 'pelanggan@thunderbolt.com' || user.id === 9999) {
    return [
      {
        id: 9991,
        booking_code: 'TBG-20261112-4821',
        user_id: user.id,
        customer_name: user.name,
        customer_email: user.email,
        vehicle_id: 101,
        vehicle_brand: 'Honda',
        vehicle_model: 'Vario 160 ABS',
        vehicle_year: '2023',
        license_plate: 'B 4129 SZX',
        service_name: 'Tune Up & Sistem Injeksi',
        service_description: 'Pembersihan throttle body, kalibrasi sensor, reset error.',
        booking_date: '2026-11-12',
        booking_time: '09:30',
        status: 'Diproses',
        total_price: 245000,
        notes: 'Tarikan awal gredek, tolong cek kampas ganda & roller.',
        demoParts: [
          { sparepart_id: 1, name: 'Oli Mesin Synthetic 10W-40 (1L)', price: 95000, quantity: 1 },
        ],
      },
      {
        id: 9992,
        booking_code: 'TBG-20261028-1104',
        user_id: user.id,
        customer_name: user.name,
        customer_email: user.email,
        vehicle_id: 102,
        vehicle_brand: 'Yamaha',
        vehicle_model: 'NMAX 155 Connected',
        vehicle_year: '2022',
        license_plate: 'B 6832 TYA',
        service_name: 'Servis Berkala & Ganti Oli',
        service_description: 'Pemeriksaan standar, pelumasan kabel, ganti oli mesin.',
        booking_date: '2026-10-28',
        booking_time: '10:00',
        status: 'Selesai',
        total_price: 180000,
        notes: 'Servis rutin 5.000 KM.',
        demoParts: [
          { sparepart_id: 1, name: 'Oli Mesin Synthetic 10W-40 (1L)', price: 95000, quantity: 1 },
          { sparepart_id: 2, name: 'Oli Gardan Matik (120ml)', price: 25000, quantity: 1 },
        ],
      },
    ]
  }

  return []
}
