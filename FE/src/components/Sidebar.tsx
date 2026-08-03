import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  CalendarCheck,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/users',         label: 'Pelanggan',  icon: Users },
  { to: '/vehicles',      label: 'Kendaraan',  icon: Car },
  { to: '/services',      label: 'Layanan',    icon: Wrench },
  { to: '/bookings',      label: 'Booking',    icon: CalendarCheck },
  { to: '/notifications', label: 'Notifikasi', icon: Bell },
]

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 96 : 280 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
        height: '100vh',
      }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem 1.25rem' }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '2.5rem', paddingLeft: '0.25rem' }}>
          <div
            style={{
              padding: '0.625rem',
              backgroundColor: '#fff7ed',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F97316',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.15)',
            }}
          >
            <Zap style={{ width: '1.5rem', height: '1.5rem', fill: '#F97316', stroke: '#F97316' }} />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', fontStyle: 'italic' }}>
                Thunder<span style={{ color: '#F97316', fontWeight: 900 }}>Admin</span>
              </span>
            </motion.div>
          )}
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.875rem 1rem',
                borderRadius: '1rem',
                textDecoration: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                justifyContent: collapsed ? 'center' : 'flex-start',
                backgroundColor: isActive ? '#F97316' : 'transparent',
                color: isActive ? '#FFFFFF' : '#94a3b8',
                boxShadow: isActive ? '0 12px 20px -5px rgba(249, 115, 22, 0.35)' : 'none',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      color: isActive ? '#FFFFFF' : '#94a3b8',
                      flexShrink: 0,
                      transition: 'transform 0.2s ease',
                    }}
                  />
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </motion.span>
                  )}
                  {isActive && collapsed && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        width: '4px',
                        height: '24px',
                        backgroundColor: '#F97316',
                        borderTopRightRadius: '4px',
                        borderBottomRightRadius: '4px',
                      }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout Button */}
        <div style={{ paddingTop: '1.25rem', borderTop: '1px solid #f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {!collapsed && user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0.875rem',
                borderRadius: '1rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #f1f5f9',
              }}
            >
              <div
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: '0.75rem',
                  backgroundColor: '#0f172a',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.8125rem',
                  boxShadow: '0 4px 10px rgba(15, 23, 42, 0.15)',
                  flexShrink: 0,
                }}
              >
                {user.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </p>
                <p style={{ fontSize: '0.625rem', fontWeight: 900, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  Administrator
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.875rem 1rem',
              borderRadius: '1rem',
              color: '#94a3b8',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fff1f2'
              e.currentTarget.style.color = '#e11d48'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#94a3b8'
            }}
          >
            <LogOut style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
            {!collapsed && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  whiteSpace: 'nowrap',
                }}
              >
                Logout
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: '2rem',
          right: '-0.875rem',
          width: '1.75rem',
          height: '1.75rem',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#64748b',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
          zIndex: 60,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#F97316'
          e.currentTarget.style.color = '#F97316'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0'
          e.currentTarget.style.color = '#64748b'
        }}
      >
        {collapsed ? <ChevronRight style={{ width: '1rem', height: '1rem' }} /> : <ChevronLeft style={{ width: '1rem', height: '1rem' }} />}
      </button>
    </motion.aside>
  )
}
