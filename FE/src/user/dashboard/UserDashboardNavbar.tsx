import { Link, useNavigate } from 'react-router-dom'
import { Zap, LogOut, Home, CalendarCheck, Car, PlusCircle } from 'lucide-react'
import type { CustomerUser } from '../../hooks/useCustomerAuth'

interface UserDashboardNavbarProps {
  user: CustomerUser
  activeTab: 'bookings' | 'vehicles' | 'new-booking'
  onTabChange: (tab: 'bookings' | 'vehicles' | 'new-booking') => void
  onLogout: () => void
  activeBookingsCount?: number
}

export default function UserDashboardNavbar({
  user,
  activeTab,
  onTabChange,
  onLogout,
  activeBookingsCount = 0,
}: UserDashboardNavbarProps) {
  const navigate = useNavigate()

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="tb-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.25rem' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', color: '#0f172a' }}>
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                backgroundColor: '#fff7ed',
                color: '#f97316',
                borderRadius: '0.625rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #ffedd5',
              }}
            >
              <Zap size={18} fill="#f97316" stroke="#f97316" />
            </div>
            <span style={{ fontSize: '1.125rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
              Thunder<span style={{ color: '#f97316' }}>Bolt</span> <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', marginLeft: '0.375rem' }}>Pelanggan</span>
            </span>
          </Link>

          {/* Desktop Nav Tabs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
            <button
              onClick={() => onTabChange('bookings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: activeTab === 'bookings' ? '#fff7ed' : 'transparent',
                color: activeTab === 'bookings' ? '#ea580c' : '#475569',
                transition: 'all 0.15s ease',
              }}
            >
              <CalendarCheck size={16} />
              <span>Pesanan Servis</span>
              {activeBookingsCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#f97316',
                    color: '#ffffff',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                  }}
                >
                  {activeBookingsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('vehicles')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: activeTab === 'vehicles' ? '#fff7ed' : 'transparent',
                color: activeTab === 'vehicles' ? '#ea580c' : '#475569',
                transition: 'all 0.15s ease',
              }}
            >
              <Car size={16} />
              <span>Kendaraan Saya</span>
            </button>

            <button
              onClick={() => onTabChange('new-booking')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: activeTab === 'new-booking' ? '#fff7ed' : 'transparent',
                color: activeTab === 'new-booking' ? '#ea580c' : '#475569',
                transition: 'all 0.15s ease',
              }}
            >
              <PlusCircle size={16} />
              <span>Booking Baru</span>
            </button>
          </nav>
        </div>

        {/* User Info & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ textAlign: 'right', display: 'none' /* visible on md up */ }} className="tb-user-profile-meta">
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{user.name}</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{user.email}</div>
          </div>

          <Link
            to="/"
            title="Kunjungi Beranda"
            className="tb-btn-secondary"
            style={{ padding: '0.4375rem 0.75rem', fontSize: '0.75rem' }}
          >
            <Home size={14} />
            <span>Beranda</span>
          </Link>

          <button
            onClick={() => {
              onLogout()
              navigate('/')
            }}
            title="Keluar dari Akun"
            className="tb-btn-secondary"
            style={{ padding: '0.4375rem 0.75rem', fontSize: '0.75rem', color: '#b91c1c' }}
          >
            <LogOut size={14} />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </header>
  )
}
