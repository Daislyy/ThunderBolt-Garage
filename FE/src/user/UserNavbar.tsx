import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Menu, X, ArrowRight, ShieldCheck, User } from 'lucide-react'
import { useCustomerAuth } from '../hooks/useCustomerAuth'

interface UserNavbarProps {
  onBookClick: () => void
}

export default function UserNavbar({ onBookClick }: UserNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user: customerUser, isAuthenticated } = useCustomerAuth()

  const navLinks = [
    { label: 'Layanan', href: '#layanan' },
    { label: 'Paket Kendaraan', href: '#penawaran' },
    { label: 'Suku Cadang', href: '#sparepart' },
    { label: 'Cek Status', href: '#tracking' },
    { label: 'Lokasi', href: '#kontak' },
  ]

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false)
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav className="tb-navbar">
      <div className="tb-container tb-navbar-inner">
        {/* Brand */}
        <a
          href="#"
          className="tb-brand"
          onClick={(e) => {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          <div className="tb-brand-icon">
            <Zap size={18} fill="#f97316" stroke="#f97316" />
          </div>
          <span>
            Thunder<span style={{ color: '#f97316' }}>Bolt</span> Garage
          </span>
        </a>

        {/* Desktop Links */}
        <ul className="tb-nav-links">
          {navLinks.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={(e) => {
                  e.preventDefault()
                  handleLinkClick(item.href)
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Action Buttons */}
        <div className="tb-nav-actions">
          {isAuthenticated && customerUser ? (
            <Link
              to="/user/dashboard"
              className="tb-btn-user-badge"
              title="Dashboard Akun Anda"
            >
              <User size={15} color="#ea580c" />
              <span>{customerUser.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link
              to="/user/login"
              className="tb-btn-ghost"
              title="Masuk ke Akun Pelanggan"
            >
              <User size={15} />
              <span>Masuk</span>
            </Link>
          )}

          <Link
            to="/login"
            className="tb-btn-ghost"
            title="Masuk ke Panel Bengkel"
          >
            <ShieldCheck size={15} />
            <span>Admin</span>
          </Link>

          <button
            onClick={onBookClick}
            className="tb-btn-primary"
            style={{ fontSize: '0.8125rem', padding: '0.5rem 0.9375rem' }}
          >
            <span>Booking</span>
            <ArrowRight size={14} />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="tb-mobile-toggle"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="tb-mobile-menu">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="tb-mobile-link"
              onClick={(e) => {
                e.preventDefault()
                handleLinkClick(item.href)
              }}
            >
              {item.label}
            </a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {isAuthenticated ? (
              <Link to="/user/dashboard" className="tb-btn-primary" style={{ justifyContent: 'center' }}>
                <User size={15} />
                <span>Dashboard Pelanggan</span>
              </Link>
            ) : (
              <Link to="/user/login" className="tb-btn-secondary" style={{ justifyContent: 'center' }}>
                <User size={15} />
                <span>Masuk Pelanggan</span>
              </Link>
            )}
            <Link to="/login" className="tb-btn-secondary" style={{ justifyContent: 'center' }}>
              <ShieldCheck size={15} />
              <span>Panel Admin</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
