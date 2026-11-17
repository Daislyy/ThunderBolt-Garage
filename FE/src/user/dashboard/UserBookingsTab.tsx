import { useState, useEffect } from 'react'
import { Calendar, Car, ChevronRight, Wrench, RefreshCw, Star } from 'lucide-react'
import api from '../../api/axios'
import type { CustomerUser } from '../../hooks/useCustomerAuth'
import BookingDetailModal from './BookingDetailModal'
import type {
  UserBookingRecord,
  UserVehicle,
} from './userStorage'
import {
  getUserStorageKey,
  getInitialBookingsForUser,
  getInitialVehiclesForUser,
  getBookingRating,
} from './userStorage'

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

  const storageKeyBookings = getUserStorageKey(user, 'bookings')
  const storageKeyVehicles = getUserStorageKey(user, 'vehicles')

  const fetchBookings = () => {
    setLoading(true)

    // Load vehicles for vehicle filter pills
    const savedVehicles = localStorage.getItem(storageKeyVehicles)
    if (savedVehicles) {
      try {
        setVehicles(JSON.parse(savedVehicles))
      } catch {}
    } else {
      const initialV = getInitialVehiclesForUser(user)
      setVehicles(initialV)
    }

    // Try backend if real user
    if (user.id && user.id !== 9999) {
      api
        .get(`/bookings/user/${user.id}`)
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
            setBookings(res.data.data)
            localStorage.setItem(storageKeyBookings, JSON.stringify(res.data.data))
          } else {
            loadLocalBookings()
          }
        })
        .catch(() => {
          loadLocalBookings()
        })
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
    const handleRatingUpdate = () => fetchBookings()
    window.addEventListener('tb_rating_created', handleRatingUpdate)
    return () => window.removeEventListener('tb_rating_created', handleRatingUpdate)
  }, [user.email, user.id])

  useEffect(() => {
    if (filterVehiclePlate) {
      setSelectedPlate(filterVehiclePlate)
    }
  }, [filterVehiclePlate])

  // Filter bookings by status and vehicle
  const filteredBookings = bookings.filter((b) => {
    // Status filter
    const isCompleted = b.status === 'Selesai'
    const isCancelled = b.status === 'Dibatalkan'
    if (statusFilter === 'active' && (isCompleted || isCancelled)) return false
    if (statusFilter === 'completed' && !isCompleted) return false

    // Vehicle plate filter
    if (selectedPlate !== 'all') {
      const bPlate = (b.license_plate || '').trim().toUpperCase()
      const sPlate = selectedPlate.trim().toUpperCase()
      if (bPlate !== sPlate) return false
    }

    return true
  })

  const activeCount = bookings.filter((b) => b.status !== 'Selesai' && b.status !== 'Dibatalkan').length
  const completedCount = bookings.filter((b) => b.status === 'Selesai').length

  const getStatusBadge = (status: string) => {
    if (status === 'Dibatalkan') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.25rem 0.625rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
          Dibatalkan
        </span>
      )
    }
    const isDone = status === 'Selesai'
    const isProgress = status === 'Diproses' || status === 'Sedang Dikerjakan'
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.25rem 0.625rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          backgroundColor: isDone ? '#dcfce7' : isProgress ? '#eff6ff' : '#fff7ed',
          color: isDone ? '#15803d' : isProgress ? '#1d4ed8' : '#ea580c',
          border: `1px solid ${isDone ? '#bbf7d0' : isProgress ? '#bfdbfe' : '#ffedd5'}`,
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
        {status === 'Menunggu Pembayaran' ? 'Menunggu Pembayaran Cash' : status}
      </span>
    )
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
            <button
              onClick={fetchBookings}
              className="tb-btn-secondary"
              style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
              title="Perbarui Data"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onNewBookingClick}
              className="tb-btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
            >
              <Wrench size={14} />
              <span>Booking Servis Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="tb-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Riwayat Servis</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
              {bookings.length}
            </div>
          </div>

          <div className="tb-card" style={{ padding: '1.25rem', borderColor: activeCount > 0 ? '#fed7aa' : '#e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 600 }}>Servis Aktif / Berjalan</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ea580c', marginTop: '0.25rem' }}>
              {activeCount}
            </div>
          </div>

          <div className="tb-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Servis Selesai</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
              {completedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter by Vehicle & Filter by Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {/* Vehicle Selector Pills */}
        {vehicles.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Car size={13} />
              <span>Filter Kendaraan:</span>
            </span>

            <button
              onClick={() => setSelectedPlate('all')}
              style={{
                padding: '0.3rem 0.625rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid',
                cursor: 'pointer',
                borderColor: selectedPlate === 'all' ? '#f97316' : '#e2e8f0',
                backgroundColor: selectedPlate === 'all' ? '#fff7ed' : '#ffffff',
                color: selectedPlate === 'all' ? '#ea580c' : '#475569',
              }}
            >
              Semua Kendaraan
            </button>

            {vehicles.map((v) => (
              <button
                key={v.license_plate}
                onClick={() => setSelectedPlate(v.license_plate)}
                style={{
                  padding: '0.3rem 0.625rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid',
                  cursor: 'pointer',
                  borderColor: selectedPlate === v.license_plate ? '#f97316' : '#e2e8f0',
                  backgroundColor: selectedPlate === v.license_plate ? '#fff7ed' : '#ffffff',
                  color: selectedPlate === v.license_plate ? '#ea580c' : '#475569',
                }}
              >
                {v.model} ({v.license_plate})
              </button>
            ))}
          </div>
        )}

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderColor: statusFilter === 'all' ? '#f97316' : '#e2e8f0',
              backgroundColor: statusFilter === 'all' ? '#fff7ed' : '#ffffff',
              color: statusFilter === 'all' ? '#ea580c' : '#64748b',
            }}
          >
            Semua Status
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderColor: statusFilter === 'active' ? '#f97316' : '#e2e8f0',
              backgroundColor: statusFilter === 'active' ? '#fff7ed' : '#ffffff',
              color: statusFilter === 'active' ? '#ea580c' : '#64748b',
            }}
          >
            Sedang Berjalan ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderColor: statusFilter === 'completed' ? '#f97316' : '#e2e8f0',
              backgroundColor: statusFilter === 'completed' ? '#fff7ed' : '#ffffff',
              color: statusFilter === 'completed' ? '#ea580c' : '#64748b',
            }}
          >
            Selesai ({completedCount})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '0.875rem' }}>
          Memuat data pesanan servis...
        </div>
      ) : filteredBookings.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredBookings.map((b) => (
            <div
              key={b.id || b.booking_code}
              className="tb-card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f97316' }}>
                    {b.booking_code}
                  </span>
                  {getStatusBadge(b.status)}
                  {b.status === 'Selesai' && (() => {
                    const r = getBookingRating(b.booking_code || b.id)
                    return r ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: '#fef3c7',
                          color: '#d97706',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          border: '1px solid #fde68a',
                        }}
                      >
                        <Star size={11} fill="#d97706" color="#d97706" />
                        <span>{r.rating}/5</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBooking(b)
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: '#fff7ed',
                          color: '#ea580c',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          border: '1px solid #fed7aa',
                          cursor: 'pointer',
                        }}
                      >
                        <Star size={11} color="#ea580c" />
                        <span>Beri Rating</span>
                      </button>
                    )
                  })()}
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
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
                    Rp {Number(b.total_price || 150000).toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedBooking(b)}
                  className="tb-btn-secondary"
                  style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
                >
                  <span>Lihat Rincian</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
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
            <span>Jadwalkan Servis Sekarang</span>
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onPaymentSuccess={() => {
            fetchBookings()
          }}
        />
      )}
    </div>
  )
}
