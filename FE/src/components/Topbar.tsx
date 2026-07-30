import { useLocation } from 'react-router-dom'
import { Bell, Menu, ShieldCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface TopbarProps {
  onMenuClick: () => void
}

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':     { title: 'Ringkasan Sistem',  subtitle: 'Pantau status booking & data bengkel secara real-time' },
  '/users':         { title: 'Kelola Pelanggan',  subtitle: 'Daftar pengguna dan manajemen data akun pelanggan' },
  '/vehicles':      { title: 'Kelola Kendaraan',  subtitle: 'Data armada dan spesifikasi kendaraan milik pelanggan' },
  '/services':      { title: 'Kelola Layanan',    subtitle: 'Daftar paket servis dan estimasi harga perbaikan' },
  '/bookings':      { title: 'Kelola Booking',    subtitle: 'Reservasi servis, penjadwalan, dan status pengerjaan' },
  '/notifications': { title: 'Notifikasi Sistem', subtitle: 'Riwayat pemberitahuan dan log aktivitas sistem' },
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const page = routeTitles[pathname] ?? { title: 'ThunderBolt Garage', subtitle: 'Panel Admin Utama' }

  return (
    <header
      style={{
        height: '5rem', // 80px
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Title & Menu Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button
          onClick={onMenuClick}
          style={{
            padding: '0.625rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc'
            e.currentTarget.style.color = '#0f172a'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#94a3b8'
          }}
        >
          <Menu style={{ width: '1.25rem', height: '1.25rem' }} />
        </button>

        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
            {page.title}
          </h1>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0.125rem 0 0 0' }}>
            {page.subtitle}
          </p>
        </div>
      </div>

      {/* Right Side Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Role Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.875rem',
            borderRadius: '9999px',
            backgroundColor: '#fff7ed',
            border: '1px solid #ffedd5',
            color: '#ea580c',
          }}
        >
          <ShieldCheck style={{ width: '1rem', height: '1rem' }} />
          <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Administrator
          </span>
        </div>

        {/* Bell Button */}
        <button
          style={{
            padding: '0.625rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            color: '#94a3b8',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc'
            e.currentTarget.style.color = '#F97316'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#94a3b8'
          }}
        >
          <Bell style={{ width: '1.25rem', height: '1.25rem' }} />
          <span
            style={{
              position: 'absolute',
              top: '0.625rem',
              right: '0.625rem',
              width: '0.5rem',
              height: '0.5rem',
              backgroundColor: '#f43f5e',
              borderRadius: '50%',
              border: '2px solid #FFFFFF',
            }}
          />
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '2rem', backgroundColor: '#f1f5f9', margin: '0 0.25rem' }} />

        {/* User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              {user?.name || 'Admin'}
            </p>
            <p style={{ fontSize: '0.5625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
              Garage Master
            </p>
          </div>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              backgroundColor: '#0f172a',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '0.875rem',
              boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.15)',
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
        </div>
      </div>
    </header>
  )
}
