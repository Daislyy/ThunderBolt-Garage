import { Zap, MapPin, Phone, Mail, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function UserFooter() {
  const scrollTo = (id: string) => {
    const el = document.querySelector(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer style={{ backgroundColor: '#0b0f19', color: '#9ca3af', padding: '4rem 0 2rem', borderTop: '1px solid #1f2937' }}>
      <div className="tb-container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            paddingBottom: '2.5rem',
            borderBottom: '1px solid #1f2937',
          }}
        >
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
              <div
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  backgroundColor: '#f97316',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Zap size={18} fill="#ffffff" />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Thunder<span style={{ color: '#f97316' }}>Bolt</span> Garage
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: 1.6 }}>
              Bengkel modern untuk perawatan mobil dan motor. Standar pengerjaan profesional, suku cadang original, dan estimasi biaya transparan.
            </p>
          </div>

          {/* Navigasi Layanan */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Menu Layanan
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
              <a href="#penawaran" onClick={(e) => { e.preventDefault(); scrollTo('#penawaran') }} style={{ color: '#9ca3af', textDecoration: 'none' }}>
                Paket Servis Kendaraan
              </a>
              <a href="#layanan" onClick={(e) => { e.preventDefault(); scrollTo('#layanan') }} style={{ color: '#9ca3af', textDecoration: 'none' }}>
                Daftar Servis Lengkap
              </a>
              <a href="#sparepart" onClick={(e) => { e.preventDefault(); scrollTo('#sparepart') }} style={{ color: '#9ca3af', textDecoration: 'none' }}>
                Katalog Suku Cadang Asli
              </a>
              <a href="#booking" onClick={(e) => { e.preventDefault(); scrollTo('#booking') }} style={{ color: '#9ca3af', textDecoration: 'none' }}>
                Jadwalkan Servis Online
              </a>
              <a href="#tracking" onClick={(e) => { e.preventDefault(); scrollTo('#tracking') }} style={{ color: '#9ca3af', textDecoration: 'none' }}>
                Pantau Status Kendaraan
              </a>
            </div>
          </div>

          {/* Jam Operasional */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Jam Buka Bengkel
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <Clock size={16} color="#f97316" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <div>
                  <span style={{ color: '#ffffff', fontWeight: 600, display: 'block' }}>Senin - Jumat</span>
                  <span style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>08:00 - 17:00 WIB</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <Clock size={16} color="#f97316" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <div>
                  <span style={{ color: '#ffffff', fontWeight: 600, display: 'block' }}>Sabtu</span>
                  <span style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>08:00 - 15:00 WIB</span>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 600, marginTop: '0.25rem' }}>
                Minggu & Hari Libur Nasional Tutup
              </span>
            </div>
          </div>

          {/* Kontak & Alamat */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hubungi Kami
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} color="#f97316" flex-shrink={0} />
                <span>Jl. Lapangan Banteng No. 12, Jakarta Pusat</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} color="#f97316" flex-shrink={0} />
                <span>+62 813-1923-3748</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} color="#f97316" flex-shrink={0} />
                <span>info@thunderboltgarage.com</span>
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <Link to="/user/login" style={{ color: '#f97316', fontSize: '0.8125rem', textDecoration: 'none' }}>
                  Portal Pelanggan →
                </Link>
                <span style={{ color: '#374151' }}>|</span>
                <Link to="/login" style={{ color: '#9ca3af', fontSize: '0.8125rem', textDecoration: 'none' }}>
                  Panel Admin
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '1.5rem',
            fontSize: '0.8125rem',
            color: '#64748b',
          }}
        >
          <span>&copy; {new Date().getFullYear()} ThunderBolt Garage. Seluruh hak cipta dilindungi.</span>
          <span>Sistem Manajemen Servis Kendaraan</span>
        </div>
      </div>
    </footer>
  )
}
