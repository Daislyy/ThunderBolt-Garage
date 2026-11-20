import { useState, useEffect } from 'react'
import { Calendar, Car, ChevronRight, Wrench, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import type { CustomerUser } from '../../hooks/useCustomerAuth'
import BookingDetailModal from './BookingDetailModal'
import BookingStatusBadge from '../../components/BookingStatusBadge'
import type { UserBookingRecord, UserVehicle } from './userStorage'
import {
  getUserStorageKey,
  getInitialBookingsForUser,
  getInitialVehiclesForUser,
} from './userStorage'
import { fetchAllServices, getLocalServices } from './serviceStorage'
import type { GarageService } from './serviceStorage'

interface UserBookingsTabProps {
  user: CustomerUser
  onNewBookingClick: () => void
  filterVehiclePlate?: string
}

export default function UserBookingsTab({
  user,
  onNewBookingClick,
  filterVehiclePlate,
}: UserBookingsTabProps) {
  const [bookings, setBookings] = useState<UserBookingRecord[]>([])
  const [vehicles, setVehicles] = useState<UserVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [selectedPlate, setSelectedPlate] = useState<string>(filterVehiclePlate || 'all')
  const [selectedBooking, setSelectedBooking] = useState<UserBookingRecord | null>(null)
  const [serviceCatalog, setServiceCatalog] = useState<GarageService[]>(() => getLocalServices())

  const storageKeyBookings = getUserStorageKey(user, 'bookings')
  const storageKeyVehicles = getUserStorageKey(user, 'vehicles')

  const fetchBookings = () => {
    setLoading(true)

    const savedVehicles = localStorage.getItem(storageKeyVehicles)
    setVehicles(savedVehicles ? JSON.parse(savedVehicles) : getInitialVehiclesForUser(user))

    if (user.id) {
      api
        .get(`/bookings/user/${user.id}`)
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            const apiBookings = res.data.data
            const localSaved = JSON.parse(localStorage.getItem(storageKeyBookings) || '[]')
            const apiCodes = new Set(apiBookings.map((b: any) => b.booking_code))
            const unsynced = localSaved.filter((b: any) => !apiCodes.has(b.booking_code))
            const merged = [...apiBookings, ...unsynced]
            setBookings(merged)
            localStorage.setItem(storageKeyBookings, JSON.stringify(merged))
          } else {
            loadLocalBookings()
          }
        })
        .catch(() => loadLocalBookings())
        .finally(() => setLoading(false))
    } else {
      loadLocalBookings()
      setLoading(false)
    }
  }

  const loadLocalBookings = () => {
    const saved = localStorage.getItem(storageKeyBookings)
    if (saved) {
      try {
        setBookings(JSON.parse(saved))
        return
      } catch {}
    }
    const initial = getInitialBookingsForUser(user)
    setBookings(initial)
    localStorage.setItem(storageKeyBookings, JSON.stringify(initial))
  }

  useEffect(() => {
    fetchBookings()
    fetchAllServices().then((list) => {
      if (list && list.length > 0) setServiceCatalog(list)
    })
    const handleRefresh = () => fetchBookings()
    window.addEventListener('tb_rating_created', handleRefresh)
    window.addEventListener('tb_booking_status_updated', handleRefresh)
    window.addEventListener('tb_payment_completed', handleRefresh)
    return () => {
      window.removeEventListener('tb_rating_created', handleRefresh)
      window.removeEventListener('tb_booking_status_updated', handleRefresh)
      window.removeEventListener('tb_payment_completed', handleRefresh)
    }
  }, [user.email, user.id])

  useEffect(() => {
    if (filterVehiclePlate) setSelectedPlate(filterVehiclePlate)
  }, [filterVehiclePlate])

  const filteredBookings = bookings.filter((b) => {
    const isCompleted = b.status === 'Selesai'
    const isCancelled = b.status === 'Dibatalkan'
    if (statusFilter === 'active' && (isCompleted || isCancelled)) return false
    if (statusFilter === 'completed' && !isCompleted) return false
    if (selectedPlate !== 'all' && (b.license_plate || '').trim().toUpperCase() !== selectedPlate.trim().toUpperCase()) return false
    return true
  })

  const activeCount = bookings.filter((b) => b.status !== 'Selesai' && b.status !== 'Dibatalkan').length
  const completedCount = bookings.filter((b) => b.status === 'Selesai').length

  const stats = [
    { label: 'Total Riwayat Servis', count: bookings.length, color: '#0f172a' },
    { label: 'Servis Aktif / Berjalan', count: activeCount, color: '#ea580c', border: activeCount > 0 ? '#fed7aa' : undefined },
    { label: 'Servis Selesai', count: completedCount, color: '#16a34a' },
  ]

  const resolveBookingPrices = (b: UserBookingRecord) => {
    const matchedSvc = serviceCatalog.find(
      (s) => (b.service_id && Number(s.id) === Number(b.service_id)) || (s.name && s.name.trim().toLowerCase() === String(b.service_name || '').trim().toLowerCase())
    )
    const svcPrice = Number(
      b.service_price !== undefined && b.service_price !== null && Number(b.service_price) > 0
        ? b.service_price
        : (matchedSvc?.price !== undefined && matchedSvc?.price !== null && Number(matchedSvc.price) > 0 ? matchedSvc.price : 100000)
    )
    const total = Number(b.total_price && Number(b.total_price) > svcPrice ? b.total_price : svcPrice)
    return { svcPrice, total }
  }

  return (
    <div>
      {/* Top Welcome & Summary */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Pesanan & Riwayat Servis
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Lihat status pengerjaan dan estimasi biaya per kendaraan milik Anda.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={fetchBookings} className="tb-btn-secondary" style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }} title="Perbarui Data">
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
            <button onClick={onNewBookingClick} className="tb-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              <Wrench size={14} />
              <span>Booking Servis Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {stats.map((st, i) => (
            <div key={i} className="tb-card" style={{ padding: '1.25rem', borderColor: st.border }}>
              <span style={{ fontSize: '0.75rem', color: st.color === '#0f172a' ? '#64748b' : st.color, fontWeight: 600 }}>{st.label}</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: st.color, marginTop: '0.25rem' }}>
                {st.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter by Vehicle & Filter by Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {vehicles.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Car size={13} />
              <span>Filter Kendaraan:</span>
            </span>

            {[{ plate: 'all', label: 'Semua Kendaraan' }, ...vehicles.map(v => ({ plate: v.license_plate, label: `${v.model} (${v.license_plate})` }))].map(item => (
              <button
                key={item.plate}
                onClick={() => setSelectedPlate(item.plate)}
                style={{
                  padding: '0.3rem 0.625rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid',
                  cursor: 'pointer',
                  borderColor: selectedPlate === item.plate ? '#f97316' : '#e2e8f0',
                  backgroundColor: selectedPlate === item.plate ? '#fff7ed' : '#ffffff',
                  color: selectedPlate === item.plate ? '#ea580c' : '#475569',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'all', label: `Semua (${bookings.length})` },
            { id: 'active', label: `Aktif (${activeCount})` },
            { id: 'completed', label: `Selesai (${completedCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid',
                cursor: 'pointer',
                borderColor: statusFilter === tab.id ? '#ea580c' : '#cbd5e1',
                backgroundColor: statusFilter === tab.id ? '#ea580c' : '#f8fafc',
                color: statusFilter === tab.id ? '#ffffff' : '#64748b',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b', fontSize: '0.875rem' }}>
          Memuat riwayat servis...
        </div>
      ) : filteredBookings.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredBookings.map((b) => {
            const { svcPrice, total } = resolveBookingPrices(b)
            return (
              <div
                key={b.booking_code || b.id}
                className="tb-card"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderLeft: `4px solid ${b.status === 'Selesai' ? '#16a34a' : b.status === 'Dibatalkan' ? '#dc2626' : '#f97316'}`,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#ea580c', letterSpacing: '0.02em' }}>
                      {b.booking_code}
                    </span>
                    <BookingStatusBadge status={b.status} />
                  </div>

                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {b.service_name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: '#64748b', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, color: '#0f172a' }}>
                      <Car size={14} color="#f97316" />
                      {b.vehicle_brand} {b.vehicle_model} ({b.license_plate})
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Calendar size={14} />
                      {b.booking_date} • {b.booking_time} WIB
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block' }}>Estimasi Biaya</span>
                    <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0f172a' }}>
                      Rp {total.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedBooking({ ...b, service_price: svcPrice, total_price: total })}
                    className="tb-btn-secondary"
                    style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
                  >
                    <span>Lihat Rincian</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="tb-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#64748b' }}>
          <Wrench size={36} color="#cbd5e1" style={{ margin: '0 auto 0.75rem auto' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
            {selectedPlate !== 'all' ? `Belum Ada Riwayat untuk Plat ${selectedPlate}` : 'Tidak Ada Pesanan Servis'}
          </h4>
          <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
            {selectedPlate !== 'all'
              ? 'Kendaraan ini belum memiliki jadwal servis. Jadwalkan servis pertama sekarang.'
              : 'Anda belum memiliki jadwal pengerjaan servis kendaraan.'}
          </p>
          <button onClick={onNewBookingClick} className="tb-btn-primary" style={{ padding: '0.5rem 1rem' }}>
            <span>Booking Servis Sekarang</span>
          </button>
        </div>
      )}

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onPaymentSuccess={() => {
            fetchBookings()
            setSelectedBooking(null)
          }}
        />
      )}
    </div>
  )
}
