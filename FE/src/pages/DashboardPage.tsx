import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Users,
  Wrench,
  CalendarCheck,
  Bell,
  Clock,
  CheckCircle2,
  Activity,
  ArrowRight,
  Calendar,
  Loader2,
  Star,
} from 'lucide-react'
import BookingStatusBadge from '../components/BookingStatusBadge'
import BrandLogo from '../components/BrandLogo'
import api from '../api/axios'


interface DonutSegment {
  label: string
  value: number
  color: string
}

function DonutChart({ segments, size = 140, strokeWidth = 14 }: { segments: DonutSegment[]; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const total = segments.reduce((sum, s) => sum + s.value, 0)
  let cumulativeOffset = 0

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {total > 0 &&
          segments.map((segment, i) => {
            const percentage = segment.value / total
            const dashLength = percentage * circumference
            const dashOffset = -cumulativeOffset
            cumulativeOffset += dashLength

            return (
              <motion.circle
                key={segment.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              />
            )
          })}
      </svg>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1 }}>{total}</span>
        <span style={{ fontSize: '0.5625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>Total</span>
      </div>
    </div>
  )
}


interface Stats {
  users: number
  services: number
  bookings: number
  notifications: number
  menunggu: number
  diproses: number
  menungguKonfirmasi: number
  selesai: number
  avgRating: string
  totalRatings: number
}

interface Booking {
  id: number
  booking_code: string
  customer_name: string
  vehicle_brand: string
  vehicle_model: string
  service_name: string
  booking_date: string
  booking_time: string
  status: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ users: 0, services: 0, bookings: 0, notifications: 0, menunggu: 0, diproses: 0, menungguKonfirmasi: 0, selesai: 0, avgRating: '0.0', totalRatings: 0 })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, servicesRes, bookingsRes, notifRes, ratingsRes] = await Promise.all([
          api.get('/users').catch(() => ({ data: { data: [] } })),
          api.get('/services').catch(() => ({ data: { data: [] } })),
          api.get('/bookings').catch(() => ({ data: { data: [] } })),
          api.get('/notifications/user/0').catch(() => ({ data: { data: [] } })),
          api.get('/ratings').catch(() => ({ data: { data: [] } })),
        ])

        const bookings: Booking[] = bookingsRes.data.data || []
        const ratingsData: { rating: number }[] = ratingsRes.data.data || []
        const totalRatings = ratingsData.length
        const avgRating = totalRatings > 0
          ? (ratingsData.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalRatings).toFixed(1)
          : '0.0'
        setStats({
          users: usersRes.data.data?.length ?? 0,
          services: servicesRes.data.data?.length ?? 0,
          bookings: bookings.length,
          notifications: notifRes.data.data?.length ?? 0,
          menunggu: bookings.filter((b) => b.status === 'Menunggu').length,
          diproses: bookings.filter((b) => b.status === 'Diproses').length,
          menungguKonfirmasi: bookings.filter((b) => b.status === 'Menunggu Konfirmasi').length,
          selesai:  bookings.filter((b) => b.status === 'Selesai').length,
          avgRating,
          totalRatings,
        })
        setRecentBookings(bookings.slice(0, 5))
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    { label: 'Total Pelanggan', value: stats.users,         icon: Users,         color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Layanan Servis',  value: stats.services,      icon: Wrench,        color: '#F97316', bg: '#fff7ed' },
    { label: 'Total Booking',   value: stats.bookings,      icon: CalendarCheck, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Notifikasi',      value: stats.notifications, icon: Bell,          color: '#10b981', bg: '#ecfdf5' },
    { label: 'Rating Rata-rata', value: stats.avgRating,     icon: Star,          color: '#f59e0b', bg: '#fffbeb' },
  ]

  const donutSegments: DonutSegment[] = [
    { label: 'Menunggu Review', value: stats.menunggu, color: '#f59e0b' },
    { label: 'Sedang Diproses', value: stats.diproses, color: '#3b82f6' },
    { label: 'Menunggu Konfirmasi', value: stats.menungguKonfirmasi, color: '#8b5cf6' },
    { label: 'Pengerjaan Selesai', value: stats.selesai, color: '#10b981' },
  ]

  const quickStats = [
    { label: 'Sedang Diproses', value: stats.diproses, icon: Loader2,       color: '#2563eb', bg: '#eff6ff' },
    { label: 'Menunggu Konfirmasi', value: stats.menungguKonfirmasi, icon: Clock, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Pengerjaan Selesai', value: stats.selesai, icon: CheckCircle2,  color: '#059669', bg: '#ecfdf5' },
    { label: 'Total Layanan',   value: stats.services, icon: Wrench,        color: '#ea580c', bg: '#fff7ed' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Overview */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>
            Ringkasan Sistem
          </h1>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Pantau status pemesanan kendaraan dan aktivitas bengkel secara real-time
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.875rem',
            backgroundColor: '#FFFFFF',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <div className="animate-pulse-soft" style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#10b981', borderRadius: '50%' }} />
          <span style={{ fontSize: '0.625rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </motion.div>

      {/* 4 Main Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '1.5rem',
                  padding: '1.25rem',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 10px 25px -5px rgba(226, 232, 240, 0.6)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '0.75rem',
                      backgroundColor: card.bg,
                      color: card.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
                  </div>
                  <span style={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {card.label}
                  </span>
                </div>
                <p style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.05em', margin: 0 }}>
                  {loading ? '…' : card.value}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Donut Chart + Recent Bookings Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Donut Chart Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1.5rem',
            padding: '1.5rem',
            border: '1px solid #f1f5f9',
            boxShadow: '0 20px 25px -5px rgba(226, 232, 240, 0.6)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h3
            style={{
              fontSize: '0.75rem',
              fontWeight: 900,
              color: '#0f172a',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Activity style={{ width: '1rem', height: '1rem', color: '#F97316' }} />
            Distribusi Status Booking
          </h3>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <DonutChart segments={donutSegments} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {donutSegments.map((seg) => (
              <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '0.625rem', height: '0.625rem', borderRadius: '50%', backgroundColor: seg.color }} />
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, flex: 1 }}>{seg.label}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a' }}>{seg.value}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: 'auto' }}>
            <h4 style={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              Ringkasan Cepat
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {quickStats.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem',
                      borderRadius: '0.75rem',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '0.5rem',
                        backgroundColor: item.bg,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon style={{ width: '1rem', height: '1rem' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#0f172a' }}>{item.value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent Bookings Table Card */}
        <div
          style={{
            gridColumn: 'span 2',
            backgroundColor: '#FFFFFF',
            borderRadius: '1.5rem',
            border: '1px solid #f1f5f9',
            boxShadow: '0 20px 25px -5px rgba(226, 232, 240, 0.6)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
                Booking Terbaru
              </h3>
              <p style={{ fontSize: '0.6875rem', color: '#94a3b8', margin: '0.25rem 0 0 0', fontWeight: 500 }}>
                Daftar transaksi pemesanan servis masuk
              </p>
            </div>
            <Link
              to="/bookings"
              style={{
                fontSize: '0.625rem',
                fontWeight: 900,
                color: '#F97316',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              Semua Booking
              <ArrowRight style={{ width: '0.875rem', height: '0.875rem' }} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
              Memuat data...
            </div>
          ) : recentBookings.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              <CalendarCheck style={{ width: '2.5rem', height: '2.5rem', opacity: 0.4, margin: '0 auto 0.5rem auto' }} />
              <p style={{ fontWeight: 800, color: '#475569', fontSize: '0.875rem' }}>Belum ada booking masuk</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(248, 250, 252, 0.8)', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'left', fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.75rem 1.5rem' }}>Kode</th>
                    <th style={{ textAlign: 'left', fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.75rem 1rem' }}>Customer</th>
                    <th style={{ textAlign: 'left', fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.75rem 1rem' }}>Layanan</th>
                    <th style={{ textAlign: 'left', fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.75rem 1rem' }}>Tanggal</th>
                    <th style={{ textAlign: 'left', fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.75rem 1.5rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((post, i) => (
                    <motion.tr
                      key={post.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ borderBottom: '1px solid #f8fafc' }}
                    >
                      <td style={{ padding: '0.875rem 1.5rem' }}>
                        <code
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            color: '#F97316',
                            backgroundColor: '#fff7ed',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #ffedd5',
                          }}
                        >
                          {post.booking_code}
                        </code>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <BrandLogo brand={post.vehicle_brand} size="0.875rem" containerSize="1.875rem" />
                          <div>
                            <p style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem', margin: 0 }}>{post.customer_name}</p>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{post.vehicle_brand} {post.vehicle_model}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F97316' }}>{post.service_name}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b' }}>
                          <Calendar style={{ width: '0.75rem', height: '0.75rem' }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            {new Date(post.booking_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1.5rem' }}>
                        <BookingStatusBadge status={post.status} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {recentBookings.length > 0 && (
            <Link to="/bookings" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  padding: '0.875rem 1.5rem',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>
                  {stats.menunggu > 0 ? `${stats.menunggu} booking menunggu ditinjau` : 'Lihat semua riwayat booking'}
                </span>
                <ArrowRight style={{ width: '1rem', height: '1rem', color: '#94a3b8' }} />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
