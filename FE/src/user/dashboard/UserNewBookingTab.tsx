import { useState, useEffect } from 'react'
import { Send, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../../api/axios'
import type { CustomerUser } from '../../hooks/useCustomerAuth'
import type {
  UserVehicle,
  UserBookingRecord,
} from './userStorage'
import {
  getUserStorageKey,
  getInitialBookingsForUser,
  getCustomerVehicles,
  syncBookingToAdmin,
} from './userStorage'
import { fetchAllServices } from './serviceStorage'

interface UserNewBookingTabProps {
  user: CustomerUser
  onSuccess: () => void
  preselectedVehicle?: UserVehicle | null
}

export default function UserNewBookingTab({
  user,
  onSuccess,
  preselectedVehicle,
}: UserNewBookingTabProps) {
  const [vehicles, setVehicles] = useState<UserVehicle[]>([])
  const [services, setServices] = useState<any[]>([])
  const [existingBookings, setExistingBookings] = useState<UserBookingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    vehiclePlate: preselectedVehicle?.license_plate || '',
    serviceName: 'Servis Berkala & Ganti Oli',
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: '09:00',
    notes: '',
  })

  const storageKeyBookings = getUserStorageKey(user, 'bookings')

  useEffect(() => {
    // 1. Load user's vehicles (merged with admin shared and Supabase)
    const userVehicles = getCustomerVehicles(user)
    setVehicles(userVehicles)

    const userEmailClean = (user.email || '').toLowerCase().trim()
    api.get(`/vehicles/user/${user.id || 0}?email=${encodeURIComponent(userEmailClean)}`).then((res) => {
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const apiVehs: UserVehicle[] = res.data.data.map((v: any) => ({
          id: v.id,
          userId: v.user_id,
          brand: v.brand,
          model: v.model,
          year: v.year,
          license_plate: v.license_plate,
          transmission: v.transmission === 'manual' ? 'Manual' : 'Matic (CVT)',
        }))
        const map = new Map<string, UserVehicle>()
        userVehicles.forEach((v) => map.set(v.license_plate.trim().toUpperCase(), v))
        apiVehs.forEach((v) => map.set(v.license_plate.trim().toUpperCase(), v))
        const merged = Array.from(map.values())
        setVehicles(merged)
        if (!form.vehiclePlate && merged.length > 0) {
          setForm((prev) => ({ ...prev, vehiclePlate: prev.vehiclePlate || merged[0].license_plate }))
        }
      }
    }).catch(() => {})

    // 2. Load bookings to detect vehicles in-progress
    const savedBookings = localStorage.getItem(storageKeyBookings)
    let bList: UserBookingRecord[] = []
    if (savedBookings) {
      try {
        bList = JSON.parse(savedBookings)
      } catch {}
    } else {
      bList = getInitialBookingsForUser(user)
      localStorage.setItem(storageKeyBookings, JSON.stringify(bList))
    }
    setExistingBookings(bList)

    // Select first vehicle that is NOT currently in service
    if (preselectedVehicle) {
      setForm((prev) => ({ ...prev, vehiclePlate: preselectedVehicle.license_plate }))
    } else if (userVehicles.length > 0) {
      const available = userVehicles.find(
        (v: UserVehicle) =>
          !bList.some(
            (b) =>
              b.license_plate?.trim().toUpperCase() === v.license_plate.trim().toUpperCase() &&
              b.status !== 'Selesai' &&
              b.status !== 'Dibatalkan'
          )
      )
      setForm((prev) => ({ ...prev, vehiclePlate: available ? available.license_plate : userVehicles[0].license_plate }))
    }

    // 3. Load all services (fetches backend + default catalog, merging all 10 services)
    fetchAllServices().then((list) => {
      setServices(list)
      if (list.length > 0) {
        setForm((prev) => ({ ...prev, serviceName: prev.serviceName || list[0].name }))
      }
    })
  }, [user.email, user.id, preselectedVehicle])

  const timeSlots = [
    '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const chosenVehicle = vehicles.find((v) => v.license_plate === form.vehiclePlate)
    if (!chosenVehicle) {
      setError('Silakan pilih kendaraan yang akan diservis.')
      return
    }

    // Validation: cannot service the same vehicle if already undergoing service
    const ongoing = existingBookings.find(
      (b) =>
        b.license_plate?.trim().toUpperCase() === chosenVehicle.license_plate.trim().toUpperCase() &&
        b.status !== 'Selesai' &&
        b.status !== 'Dibatalkan'
    )
    if (ongoing) {
      setError(
        `Kendaraan ${chosenVehicle.brand} ${chosenVehicle.model} (${chosenVehicle.license_plate}) sedang dalam proses servis (Status: ${ongoing.status}). Anda tidak dapat mendaftarkan servis baru untuk kendaraan yang sama sebelum servis sebelumnya selesai atau dibatalkan.`
      )
      return
    }

    setLoading(true)
    try {
      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      const bookingCode = `TBG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomDigits}`

      const matchedSvc = services.find((s) => s.name === form.serviceName)
      const servicePrice = Number(matchedSvc?.price !== undefined && matchedSvc?.price !== null ? matchedSvc.price : 100000)

      const initialBooking: UserBookingRecord = {
        id: Date.now(),
        booking_code: bookingCode,
        user_id: user.id,
        customer_name: user.name,
        customer_email: user.email,
        vehicle_id: chosenVehicle.id,
        service_id: matchedSvc?.id || 1,
        vehicle_brand: chosenVehicle.brand,
        vehicle_model: chosenVehicle.model,
        vehicle_year: chosenVehicle.year,
        license_plate: chosenVehicle.license_plate,
        transmission: chosenVehicle.transmission,
        service_name: form.serviceName,
        service_price: servicePrice,
        booking_date: form.bookingDate,
        booking_time: form.bookingTime,
        status: 'Menunggu',
        total_price: servicePrice,
        notes: form.notes,
        created_at: new Date().toISOString(),
      }

      // Sync to backend Supabase DB & admin dashboard
      const newBooking = await syncBookingToAdmin(initialBooking)

      // Save in user-isolated storage
      const saved = localStorage.getItem(storageKeyBookings)
      let currentBookings: UserBookingRecord[] = []
      if (saved) {
        try {
          currentBookings = JSON.parse(saved)
        } catch {}
      } else {
        currentBookings = getInitialBookingsForUser(user)
      }

      const updated = [newBooking, ...currentBookings]
      localStorage.setItem(storageKeyBookings, JSON.stringify(updated))

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 800)
    } catch (err: any) {
      setError(err?.message || 'Gagal mendaftarkan servis kendaraan')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Jadwalkan Servis Baru
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Pilih kendaraan dan waktu kedatangan yang Anda inginkan ke bengkel.
        </p>
      </div>

      <div className="tb-card" style={{ padding: '2rem' }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Booking Berhasil Didaftarkan!
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
              Membuka riwayat pesanan servis kendaraan Anda...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#991b1b',
                  borderRadius: '0.5rem',
                  padding: '0.625rem',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="tb-label">Pilih Kendaraan Anda *</label>
              {vehicles.length > 0 ? (
                <select
                  value={form.vehiclePlate}
                  onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
                  className="tb-select"
                  required
                >
                  {vehicles.map((v) => {
                    const isOngoing = existingBookings.some(
                      (b) =>
                        b.license_plate?.trim().toUpperCase() === v.license_plate.trim().toUpperCase() &&
                        b.status !== 'Selesai' &&
                        b.status !== 'Dibatalkan'
                    )
                    return (
                      <option key={v.license_plate} value={v.license_plate} disabled={isOngoing}>
                        {v.brand} {v.model} — {v.license_plate} {isOngoing ? '⚠️ (Sedang Diservis)' : ''}
                      </option>
                    )
                  })}
                </select>
              ) : (
                <div style={{ padding: '0.75rem', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '0.5rem', fontSize: '0.8125rem', color: '#ea580c' }}>
                  Anda belum memiliki kendaraan terdaftar. Silakan tambah kendaraan terlebih dahulu di tab <strong>Kendaraan Saya</strong>.
                </div>
              )}
            </div>

            <div>
              <label className="tb-label">Pilih Paket Layanan *</label>
              <select
                value={form.serviceName}
                onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
                className="tb-select"
                required
              >
                {services.map((s) => (
                  <option key={s.id || s.name} value={s.name}>
                    {s.name} — Rp {Number(s.price !== undefined && s.price !== null ? s.price : 100000).toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
              {form.serviceName && (() => {
                const chosen = services.find((s) => s.name === form.serviceName)
                if (!chosen) return null
                return (
                  <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ea580c', fontWeight: 700 }}>
                    Estimasi Biaya Jasa: Rp {Number(chosen.price !== undefined && chosen.price !== null ? chosen.price : 100000).toLocaleString('id-ID')}
                  </div>
                )
              })()}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="tb-label">Tanggal Servis *</label>
                <input
                  type="date"
                  value={form.bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                  className="tb-input"
                  required
                />
              </div>

              <div>
                <label className="tb-label">Jam Kedatangan *</label>
                <select
                  value={form.bookingTime}
                  onChange={(e) => setForm({ ...form, bookingTime: e.target.value })}
                  className="tb-select"
                  required
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time} WIB
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="tb-label">Keluhan atau Catatan Tambahan (Opsional)</label>
              <textarea
                rows={3}
                placeholder="Contoh: Suara mesin kasar saat rpm tinggi, tolong sekalian cek oli samping."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="tb-textarea"
              />
            </div>

            <button
              type="submit"
              disabled={loading || vehicles.length === 0}
              className="tb-btn-primary"
              style={{ padding: '0.75rem', fontSize: '0.9375rem', justifyContent: 'center', marginTop: '0.5rem' }}
            >
              {loading ? (
                <span>Menyimpan Jadwal...</span>
              ) : (
                <>
                  <Send size={16} />
                  <span>Daftarkan Servis Kendaraan</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
