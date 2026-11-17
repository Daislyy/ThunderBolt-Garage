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
  status: 'Menunggu' | 'Diproses' | 'Menunggu Pembayaran' | 'Selesai' | 'Dibatalkan' | string
  total_price: number
  notes?: string
  created_at?: string
  demoParts?: BookingSparepartItem[]
  parts?: BookingSparepartItem[]
}

export interface SharedVehicleRecord {
  id: number | string
  user_id: number | string
  brand: string
  model: string
  year: number | string
  license_plate: string
  transmission?: string | null
  owner_name?: string
  owner_email?: string
  created_at?: string
}

export interface BookingSparepartItem {
  sparepart_id: number
  name: string
  price: number
  quantity: number
  notes?: string
}

export const SHARED_ADMIN_BOOKINGS_KEY = 'tb_admin_shared_bookings'
export const SHARED_ADMIN_VEHICLES_KEY = 'tb_admin_shared_vehicles'

// --- Storage Helper Utilities ---
function getStorageJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function updateMatchingStorage(predicate: (k: string) => boolean, updateFn: (items: any[]) => any[]) {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && predicate(key)) {
      try {
        const list = getStorageJSON<any[]>(key, [])
        if (Array.isArray(list) && list.length > 0) {
          localStorage.setItem(key, JSON.stringify(updateFn(list)))
        }
      } catch {}
    }
  }
}

export function getUserStorageKey(user: CustomerUser, key: string): string {
  const emailSafe = (user.email || 'guest').toLowerCase().replace(/[^a-z0-9]/g, '_')
  return `tb_cust_${emailSafe}_${key}`
}

// --- Vehicles Management ---
export function syncVehicleToShared(vehicle: SharedVehicleRecord) {
  try {
    const existing = getStorageJSON<SharedVehicleRecord[]>(SHARED_ADMIN_VEHICLES_KEY, [])
    const cleanPlate = vehicle.license_plate.trim().toUpperCase()
    const updated = [
      { ...vehicle, license_plate: cleanPlate },
      ...existing.filter((v) => v.license_plate.trim().toUpperCase() !== cleanPlate),
    ]
    localStorage.setItem(SHARED_ADMIN_VEHICLES_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('tb_vehicles_updated', { detail: vehicle }))
  } catch {}
}

export function getMergedAdminVehicles(apiVehicles: any[] = []): any[] {
  try {
    const map = new Map<string, any>()
    apiVehicles.forEach((v) => v.license_plate && map.set(v.license_plate.trim().toUpperCase(), v))

    // Merge from shared admin vehicle records
    getStorageJSON<any[]>(SHARED_ADMIN_VEHICLES_KEY, []).forEach((v) => {
      if (v.license_plate) map.set(v.license_plate.trim().toUpperCase(), v)
    })

    // Merge from customer storages
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('tb_cust_') && key.endsWith('_vehicles')) {
        const email = key.replace('tb_cust_', '').replace('_vehicles', '')
        getStorageJSON<any[]>(key, []).forEach((v) => {
          const plate = v.license_plate?.trim().toUpperCase()
          if (plate && !map.has(plate)) {
            map.set(plate, {
              id: v.id || Date.now(),
              user_id: v.userId || 1,
              brand: v.brand,
              model: v.model,
              year: v.year,
              license_plate: plate,
              transmission: v.transmission,
              owner_name: email.replace(/_/g, ' '),
              owner_email: email,
              created_at: new Date().toISOString(),
            })
          }
        })
      }
    }
    return Array.from(map.values())
  } catch {
    return apiVehicles
  }
}

export function getCustomerVehicles(user: CustomerUser): UserVehicle[] {
  const storageKey = getUserStorageKey(user, 'vehicles')
  const list = getStorageJSON<UserVehicle[]>(storageKey, [])

  // Auto-sync customer vehicles into shared admin storage
  list.forEach((v) => {
    syncVehicleToShared({
      id: v.id,
      user_id: user.id,
      brand: v.brand,
      model: v.model,
      year: v.year,
      license_plate: v.license_plate,
      transmission: v.transmission,
      owner_name: user.name,
      owner_email: user.email,
    })
  })

  // Also include any vehicle added for this user in shared storage
  const shared = getStorageJSON<SharedVehicleRecord[]>(SHARED_ADMIN_VEHICLES_KEY, [])
  let hasChanges = false
  shared.forEach((s) => {
    const isOwner = String(s.user_id) === String(user.id) || s.owner_email?.toLowerCase() === user.email?.toLowerCase()
    if (isOwner) {
      const plate = s.license_plate.trim().toUpperCase()
      if (!list.some((l) => l.license_plate.trim().toUpperCase() === plate)) {
        list.push({
          id: s.id,
          userId: user.id,
          brand: s.brand,
          model: s.model,
          year: s.year,
          license_plate: plate,
          transmission: s.transmission || 'automatic',
        })
        hasChanges = true
      }
    }
  })

  if (hasChanges) localStorage.setItem(storageKey, JSON.stringify(list))
  return list
}

export function getInitialVehiclesForUser(user: CustomerUser): UserVehicle[] {
  return getCustomerVehicles(user)
}

// --- Bookings Management ---
export async function syncBookingToAdmin(booking: UserBookingRecord) {
  try {
    const existing = getStorageJSON<UserBookingRecord[]>(SHARED_ADMIN_BOOKINGS_KEY, [])
    const updated = [
      booking,
      ...existing.filter((b) => b.booking_code !== booking.booking_code && String(b.id) !== String(booking.id)),
    ]
    localStorage.setItem(SHARED_ADMIN_BOOKINGS_KEY, JSON.stringify(updated))
  } catch {}

  // Sync to backend DB if possible
  try {
    await api.post('/bookings', {
      user_id: Number(booking.user_id) || 1,
      vehicle_id: Number(booking.vehicle_id) || 1,
      service_id: 1,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time,
      notes: booking.notes,
    })
  } catch {}
}

export function getMergedAdminBookings(apiBookings: any[] = []): any[] {
  try {
    const shared = getStorageJSON<any[]>(SHARED_ADMIN_BOOKINGS_KEY, [])
    if (!shared.length) return apiBookings

    const map = new Map<string, any>()
    shared.forEach((b) => map.set(b.booking_code || String(b.id), b))
    apiBookings.forEach((b) => {
      const key = b.booking_code || String(b.id)
      if (!map.has(key)) map.set(key, b)
    })
    return Array.from(map.values())
  } catch {
    return apiBookings
  }
}

export function updateSharedBookingStatus(idOrCode: string | number, newStatus: string) {
  const match = (b: any) => String(b.id) === String(idOrCode) || b.booking_code === String(idOrCode) || b.code === String(idOrCode)
  const updater = (items: any[]) => items.map((b) => (match(b) ? { ...b, status: newStatus } : b))

  // Update shared admin bookings
  const shared = getStorageJSON<any[]>(SHARED_ADMIN_BOOKINGS_KEY, [])
  if (shared.length) {
    localStorage.setItem(SHARED_ADMIN_BOOKINGS_KEY, JSON.stringify(updater(shared)))
  }

  // Update in all customer bookings storages
  updateMatchingStorage(
    (k) => k.includes('_bookings') || k === 'tb_user_bookings',
    updater
  )

  window.dispatchEvent(new CustomEvent('tb_booking_status_updated', { detail: { idOrCode, newStatus } }))
}

export function getInitialBookingsForUser(_user: CustomerUser): UserBookingRecord[] {
  return []
}

// --- Spareparts Management ---
export function saveBookingSpareparts(
  bookingIdOrCode: string | number,
  spareparts: BookingSparepartItem[],
  servicePrice: number = 100000
) {
  try {
    localStorage.setItem(`tb_parts_${bookingIdOrCode}`, JSON.stringify(spareparts))
    const partsTotal = spareparts.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.quantity) || 1), 0)
    const newTotal = servicePrice + partsTotal

    const match = (b: any) => String(b.id) === String(bookingIdOrCode) || b.booking_code === String(bookingIdOrCode)
    const updater = (items: any[]) => items.map((b) => (match(b) ? { ...b, parts: spareparts, total_price: newTotal } : b))

    const shared = getStorageJSON<any[]>(SHARED_ADMIN_BOOKINGS_KEY, [])
    if (shared.length) localStorage.setItem(SHARED_ADMIN_BOOKINGS_KEY, JSON.stringify(updater(shared)))

    updateMatchingStorage((k) => k.includes('_bookings') || k === 'tb_user_bookings', updater)

    api.post(`/bookings/${bookingIdOrCode}/spareparts`, {
      spareparts: spareparts.map((p) => ({ sparepart_id: p.sparepart_id, quantity: p.quantity, notes: p.notes })),
    }).catch(() => {})

    window.dispatchEvent(new CustomEvent('tb_booking_parts_updated', { detail: { bookingIdOrCode, spareparts, newTotal } }))
  } catch (err) {
    console.error('Error saving booking spareparts:', err)
  }
}

export async function getBookingSpareparts(bookingIdOrCode: string | number): Promise<BookingSparepartItem[]> {
  const localSaved = getStorageJSON<BookingSparepartItem[]>(`tb_parts_${bookingIdOrCode}`, [])
  if (localSaved.length > 0) return localSaved

  const shared = getStorageJSON<any[]>(SHARED_ADMIN_BOOKINGS_KEY, [])
  const found = shared.find((b: any) => String(b.id) === String(bookingIdOrCode) || b.booking_code === String(bookingIdOrCode))
  if (found?.parts?.length) return found.parts
  if (found?.demoParts?.length) return found.demoParts

  try {
    const res = await api.get(`/bookings/${bookingIdOrCode}/spareparts`)
    if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      const parts = res.data.data.map((sp: any) => ({
        sparepart_id: sp.sparepart_id,
        name: sp.name,
        price: Number(sp.price),
        quantity: Number(sp.quantity),
        notes: sp.notes || '',
      }))
      localStorage.setItem(`tb_parts_${bookingIdOrCode}`, JSON.stringify(parts))
      return parts
    }
  } catch {}

  return []
}

// --- Ratings Management ---
export interface ServiceRatingRecord {
  id?: number | string
  booking_id: number | string
  booking_code?: string
  user_id: number | string
  customer_name?: string
  customer_email?: string
  service_id: number | string
  service_name?: string
  rating: number
  review?: string
  created_at?: string
}

export const SHARED_ADMIN_RATINGS_KEY = 'tb_admin_shared_ratings'

export async function submitServiceRating(ratingData: ServiceRatingRecord): Promise<ServiceRatingRecord> {
  const fullRecord: ServiceRatingRecord = {
    ...ratingData,
    id: ratingData.id || Date.now(),
    created_at: ratingData.created_at || new Date().toISOString(),
  }

  try {
    // 1. Save locally for this booking
    const code = ratingData.booking_code || String(ratingData.booking_id)
    localStorage.setItem(`tb_rating_${code}`, JSON.stringify(fullRecord))
    localStorage.setItem(`tb_rating_${ratingData.booking_id}`, JSON.stringify(fullRecord))

    // 2. Add to shared admin ratings
    const shared = getStorageJSON<ServiceRatingRecord[]>(SHARED_ADMIN_RATINGS_KEY, [])
    const updated = [
      fullRecord,
      ...shared.filter((r) => String(r.booking_id) !== String(ratingData.booking_id) && r.booking_code !== ratingData.booking_code),
    ]
    localStorage.setItem(SHARED_ADMIN_RATINGS_KEY, JSON.stringify(updated))
  } catch {}

  // 3. Send to backend API
  try {
    const res = await api.post('/ratings', {
      booking_id: Number(ratingData.booking_id) || 1,
      user_id: Number(ratingData.user_id) || 1,
      service_id: Number(ratingData.service_id) || 1,
      rating: Number(ratingData.rating),
      review: ratingData.review || '',
    })
    if (res.data?.data?.id) {
      fullRecord.id = res.data.data.id
    }
  } catch (err) {
    console.warn('Backend rating sync:', err)
  }

  window.dispatchEvent(new CustomEvent('tb_rating_created', { detail: fullRecord }))
  return fullRecord
}

export function getBookingRating(bookingCodeOrId: string | number): ServiceRatingRecord | null {
  try {
    const local = localStorage.getItem(`tb_rating_${bookingCodeOrId}`)
    if (local) return JSON.parse(local)

    const shared = getStorageJSON<ServiceRatingRecord[]>(SHARED_ADMIN_RATINGS_KEY, [])
    const found = shared.find((r) => String(r.booking_id) === String(bookingCodeOrId) || r.booking_code === String(bookingCodeOrId))
    return found || null
  } catch {
    return null
  }
}

