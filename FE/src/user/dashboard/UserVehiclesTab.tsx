import { useState, useEffect } from 'react'
import { Car, Plus, AlertCircle, Calendar, Wrench, CheckCircle2, Clock, Trash2 } from 'lucide-react'
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
  syncVehicleToShared,
} from './userStorage'

interface UserVehiclesTabProps {
  user: CustomerUser
  onBookForVehicle: (vehicle: UserVehicle) => void
  onViewVehicleBookings: (licensePlate: string) => void
}

export default function UserVehiclesTab({
  user,
  onBookForVehicle,
  onViewVehicleBookings,
}: UserVehiclesTabProps) {
  const [vehicles, setVehicles] = useState<UserVehicle[]>([])
  const [bookings, setBookings] = useState<UserBookingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    brand: 'Honda',
    model: '',
    year: new Date().getFullYear().toString(),
    license_plate: '',
    transmission: 'automatic',
  })

  const storageKeyVehicles = getUserStorageKey(user, 'vehicles')
  const storageKeyBookings = getUserStorageKey(user, 'bookings')

  const loadData = () => {
    setLoading(true)

    // Load user's bookings first (to calculate individual vehicle statuses)
    let userBookings: UserBookingRecord[] = []
    const savedBookings = localStorage.getItem(storageKeyBookings)
    if (savedBookings) {
      try {
        userBookings = JSON.parse(savedBookings)
      } catch {}
    } else {
      userBookings = getInitialBookingsForUser(user)
      localStorage.setItem(storageKeyBookings, JSON.stringify(userBookings))
    }
    setBookings(userBookings)

    // Load user's vehicles (merged with admin shared vehicles)
    const localList = getCustomerVehicles(user)
    setVehicles(localList)

    // Fetch latest vehicles from backend Supabase (support matching by user_id and email)
    const userEmailClean = (user.email || '').toLowerCase().trim()
    api
      .get(`/vehicles/user/${user.id || 0}?email=${encodeURIComponent(userEmailClean)}`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const apiVehs: UserVehicle[] = res.data.data.map((v: any) => ({
            id: v.id,
            userId: v.user_id,
            brand: v.brand,
            model: v.model,
            year: v.year,
            license_plate: v.license_plate,
            transmission: v.transmission === 'manual' ? 'Manual' : 'Matic (CVT)',
          }))

          // Also check all vehicles as backup if list is empty
          if (apiVehs.length === 0) {
            api.get('/vehicles').then((allRes) => {
              if (allRes.data?.success && Array.isArray(allRes.data.data)) {
                const matched = allRes.data.data.filter(
                  (v: any) =>
                    String(v.user_id) === String(user.id) ||
                    (v.owner_email && v.owner_email.toLowerCase().trim() === userEmailClean)
                )
                if (matched.length > 0) {
                  const fallbackList = matched.map((v: any) => ({
                    id: v.id,
                    userId: v.user_id,
                    brand: v.brand,
                    model: v.model,
                    year: v.year,
                    license_plate: v.license_plate,
                    transmission: v.transmission === 'manual' ? 'Manual' : 'Matic (CVT)',
                  }))
                  setVehicles(fallbackList)
                  localStorage.setItem(storageKeyVehicles, JSON.stringify(fallbackList))
                }
              }
            }).catch(() => {})
          } else {
            // Merge by license plate
            const map = new Map<string, UserVehicle>()
            localList.forEach((v) => map.set(v.license_plate.trim().toUpperCase(), v))
            apiVehs.forEach((v: UserVehicle) => map.set(v.license_plate.trim().toUpperCase(), v))
            const merged = Array.from(map.values())
            setVehicles(merged)
            localStorage.setItem(storageKeyVehicles, JSON.stringify(merged))
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
    // Debounce the event listener to prevent rapid re-renders
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const handleUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => loadData(), 300)
    }
    window.addEventListener('tb_vehicles_updated', handleUpdate)
    return () => {
      window.removeEventListener('tb_vehicles_updated', handleUpdate)
      if (debounceTimer) clearTimeout(debounceTimer)
    }
  }, [user.email, user.id])

  // Get active status specifically for this vehicle
  const getVehicleStatusInfo = (licensePlate: string) => {
    const cleanPlate = (licensePlate || '').trim().toUpperCase()
    const vehicleBookings = bookings.filter(
      (b) => (b.license_plate || '').trim().toUpperCase() === cleanPlate
    )

    if (vehicleBookings.length === 0) {
      return {
        label: 'Kondisi Normal',
        color: '#64748b',
        bg: '#f8fafc',
        border: '#e2e8f0',
        dot: '#94a3b8',
        icon: CheckCircle2,
        desc: 'Belum ada jadwal servis aktif.',
      }
    }

    // Check for pending payment
    const pendingPayment = vehicleBookings.find((b) => b.status === 'Menunggu Pembayaran')
    if (pendingPayment) {
      return {
        label: 'Menunggu Pembayaran',
        color: '#c2410c',
        bg: '#fff7ed',
        border: '#fed7aa',
        dot: '#ea580c',
        icon: Clock,
        desc: `${pendingPayment.service_name} (Silakan selesaikan pembayaran)`,
        activeBooking: pendingPayment,
      }
    }

    // Check for in-progress / ongoing booking
    const inProgress = vehicleBookings.find(
      (b) => b.status === 'Diproses' || b.status === 'Sedang Dikerjakan'
    )
    if (inProgress) {
      return {
        label: 'Sedang Diservis di Bengkel',
        color: '#1d4ed8',
        bg: '#eff6ff',
        border: '#bfdbfe',
        dot: '#3b82f6',
        icon: Wrench,
        desc: inProgress.service_name,
        activeBooking: inProgress,
      }
    }

    // Check for waiting schedule
    const waiting = vehicleBookings.find((b) => b.status === 'Menunggu')
    if (waiting) {
      return {
        label: 'Menunggu Jadwal Servis',
        color: '#ea580c',
        bg: '#fff7ed',
        border: '#ffedd5',
        dot: '#f97316',
        icon: Clock,
        desc: `${waiting.service_name} (${waiting.booking_date})`,
        activeBooking: waiting,
      }
    }

    // Check latest completed
    const latest = vehicleBookings[0]
    if (latest && latest.status === 'Selesai') {
      return {
        label: 'Siap Digunakan',
        color: '#15803d',
        bg: '#dcfce7',
        border: '#bbf7d0',
        dot: '#22c55e',
        icon: CheckCircle2,
        desc: `Servis terakhir: ${latest.booking_date} (${latest.service_name})`,
      }
    }

    return {
      label: 'Kondisi Normal',
      color: '#64748b',
      bg: '#f8fafc',
      border: '#e2e8f0',
      dot: '#94a3b8',
      icon: CheckCircle2,
      desc: 'Tidak ada servis aktif.',
    }
  }

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanModel = formData.model.trim()
    const cleanPlate = formData.license_plate.trim().toUpperCase()

    if (!cleanModel || !cleanPlate) {
      setError('Model kendaraan dan plat nomor wajib diisi.')
      return
    }

    setSubmitting(true)
    try {
      let vehicleId: number | string = Date.now()

      // Try backend Supabase DB with 4-second timeout to avoid UI freeze
      if (user.id) {
        try {
          const res = await api.post(
            '/vehicles',
            {
              user_id: user.id,
              user_email: user.email,
              brand: formData.brand,
              model: cleanModel,
              year: formData.year,
              license_plate: cleanPlate,
              transmission: formData.transmission,
            },
            { timeout: 4000 }
          )
          if (res.data?.data?.id) {
            vehicleId = res.data.data.id
          }
        } catch (err) {
          console.warn('Backend vehicle insert warning:', err)
        }
      }

      const newVehicle: UserVehicle = {
        id: vehicleId,
        userId: user.id,
        brand: formData.brand,
        model: cleanModel,
        year: formData.year,
        license_plate: cleanPlate,
        transmission: formData.transmission,
      }

      // Save locally for this user (deduplicate by plate)
      const currentList = vehicles.filter(
        (v) => v.license_plate.trim().toUpperCase() !== cleanPlate
      )
      const updated = [newVehicle, ...currentList]
      setVehicles(updated)
      localStorage.setItem(storageKeyVehicles, JSON.stringify(updated))

      // Sync to shared admin vehicles
      syncVehicleToShared({
        id: newVehicle.id,
        user_id: user.id,
        brand: newVehicle.brand,
        model: newVehicle.model,
        year: newVehicle.year,
        license_plate: newVehicle.license_plate,
        transmission: newVehicle.transmission,
        owner_name: user.name,
        owner_email: user.email,
        created_at: new Date().toISOString(),
      })

      setShowAddModal(false)
      setFormData({
        brand: 'Honda',
        model: '',
        year: new Date().getFullYear().toString(),
        license_plate: '',
        transmission: 'automatic',
      })
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan kendaraan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteVehicle = async (plate: string) => {
    if (window.confirm(`Hapus kendaraan dengan plat ${plate}?`)) {
      const targetVeh = vehicles.find((v) => v.license_plate === plate)
      const updated = vehicles.filter((v) => v.license_plate !== plate)
      setVehicles(updated)
      localStorage.setItem(storageKeyVehicles, JSON.stringify(updated))

      // Delete from backend Supabase
      if (targetVeh?.id) {
        api.delete(`/vehicles/${targetVeh.id}`).catch(() => {})
      } else {
        api.delete(`/vehicles/${plate}`).catch(() => {})
      }

      // Also remove from shared admin vehicles
      try {
        const sharedRaw = localStorage.getItem('tb_admin_shared_vehicles')
        if (sharedRaw) {
          const sharedArr = JSON.parse(sharedRaw)
          localStorage.setItem(
            'tb_admin_shared_vehicles',
            JSON.stringify(sharedArr.filter((v: any) => v.license_plate?.trim().toUpperCase() !== plate.trim().toUpperCase()))
          )
        }
      } catch {}
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Garasi & Kendaraan Saya
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Setiap kendaraan memiliki catatan dan status servis masing-masing secara terpisah.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="tb-btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
        >
          <Plus size={15} />
          <span>Tambah Kendaraan Baru</span>
        </button>
      </div>

      {/* Grid Kendaraan */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '0.875rem' }}>
          Memuat data kendaraan Anda...
        </div>
      ) : vehicles.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {vehicles.map((v) => {
            const statusInfo = getVehicleStatusInfo(v.license_plate)
            const StatusIcon = statusInfo.icon

            return (
              <div
                key={v.license_plate}
                className="tb-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: `4px solid ${statusInfo.dot}`,
                }}
              >
                {/* Header Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#64748b',
                        backgroundColor: '#f1f5f9',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.375rem',
                        marginRight: '0.5rem',
                      }}
                    >
                      {v.brand}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Tahun {v.year}</span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', marginTop: '0.375rem' }}>
                      {v.model}
                    </h3>
                  </div>

                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      padding: '0.25rem 0.625rem',
                      borderRadius: '0.375rem',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {v.license_plate}
                  </span>
                </div>

                {/* Individual Vehicle Status Banner */}
                <div
                  style={{
                    backgroundColor: statusInfo.bg,
                    border: `1px solid ${statusInfo.border}`,
                    borderRadius: '0.625rem',
                    padding: '0.75rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <StatusIcon size={15} color={statusInfo.color} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: statusInfo.color }}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0 }}>
                    {statusInfo.desc}
                  </p>
                </div>

                {/* Transmission Meta */}
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.25rem' }}>
                  Tipe Transmisi: <strong>{v.transmission || 'Standar'}</strong>
                </div>

                {/* Action Buttons for this vehicle */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '1rem',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <button
                    onClick={() => onBookForVehicle(v)}
                    className="tb-btn-primary"
                    style={{ padding: '0.4375rem 0.75rem', fontSize: '0.75rem', flex: 1, justifyContent: 'center' }}
                  >
                    <Wrench size={13} />
                    <span>Servis Kendaraan Ini</span>
                  </button>

                  <button
                    onClick={() => onViewVehicleBookings(v.license_plate)}
                    className="tb-btn-secondary"
                    style={{ padding: '0.4375rem 0.75rem', fontSize: '0.75rem' }}
                    title="Lihat Riwayat Servis Kendaraan Ini"
                  >
                    <Calendar size={13} />
                    <span>Riwayat</span>
                  </button>

                  <button
                    onClick={() => handleDeleteVehicle(v.license_plate)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      padding: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Hapus Kendaraan"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="tb-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#64748b' }}>
          <Car size={36} color="#cbd5e1" style={{ margin: '0 auto 0.75rem auto' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Garasi Anda Masih Kosong</h4>
          <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
            Tambahkan kendaraan Anda agar dapat memantau status servis secara terpisah.
          </p>
          <button onClick={() => setShowAddModal(true)} className="tb-btn-primary" style={{ padding: '0.5rem 1rem' }}>
            <span>Tambah Kendaraan Sekarang</span>
          </button>
        </div>
      )}

      {/* Modal Tambah Kendaraan */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              maxWidth: '480px',
              width: '100%',
              padding: '1.75rem',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
              Tambah Kendaraan ke Garasi Anda
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Data kendaraan ini hanya dapat diakses oleh akun Anda.
            </p>

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
                  marginBottom: '1rem',
                }}
              >
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="tb-label">Merk</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="tb-select"
                  >
                    <option value="Honda">Honda</option>
                    <option value="Yamaha">Yamaha</option>
                    <option value="Suzuki">Suzuki</option>
                    <option value="Kawasaki">Kawasaki</option>
                    <option value="Vespa">Vespa</option>
                    <option value="Toyota">Toyota</option>
                    <option value="Daihatsu">Daihatsu</option>
                    <option value="Mitsubishi">Mitsubishi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="tb-label">Tahun Pembuatan</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="tb-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="tb-label">Model / Tipe Kendaraan</label>
                <input
                  type="text"
                  placeholder="Contoh: Vario 160 / NMAX 155 / Avanza"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="tb-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="tb-label">Nomor Polisi (Plat)</label>
                  <input
                    type="text"
                    placeholder="Contoh: B 1234 ABC"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    className="tb-input"
                    required
                  />
                </div>

                <div>
                  <label className="tb-label">Transmisi</label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    className="tb-select"
                  >
                    <option value="automatic">Matic (CVT / Otomatis)</option>
                    <option value="manual">Manual / Kopling</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="tb-btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="tb-btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan ke Garasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
