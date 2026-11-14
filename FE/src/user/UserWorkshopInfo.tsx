import { MapPin, Clock, Phone, MessageSquare, Coffee, Wifi, Shield, ArrowUpRight } from 'lucide-react'

export default function UserWorkshopInfo() {
  return (
    <section id="kontak" className="tb-section">
      <div className="tb-container">
        <div className="tb-section-header">
          <div className="tb-badge">Informasi Bengkel</div>
          <h2 className="tb-section-title">Lokasi & Jam Operasional</h2>
          <p className="tb-section-desc">
            Kunjungi bengkel kami atau hubungi tim customer service untuk konsultasi kondisi kendaraan.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Jam & Lokasi Card */}
          <div className="tb-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
              <div
                style={{
                  padding: '0.625rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#fff7ed',
                  color: '#f97316',
                  flexShrink: 0,
                }}
              >
                <Clock size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                  Jam Buka Operasional
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#475569' }}>
                  <strong>Senin – Sabtu:</strong> 08.00 – 17.00 WIB <br />
                  <strong>Minggu:</strong> 09.00 – 15.00 WIB <br />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>*Hari libur nasional tetap buka kecuali diumumkan khusus.</span>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
              <div
                style={{
                  padding: '0.625rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#fff7ed',
                  color: '#f97316',
                  flexShrink: 0,
                }}
              >
                <MapPin size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                  Alamat Bengkel
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                  Jl. Raya Utama No. 88, Blok B-2 <br />
                  Kawasan Otomotif Terpadu <br />
                  Akses mudah & parkir luas untuk motor dan mobil.
                </p>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tb-btn-secondary"
                  style={{ marginTop: '0.75rem', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                >
                  <span>Buka di Google Maps</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </div>
          </div>

          {/* Fasilitas & Layanan Kontak */}
          <div className="tb-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                Fasilitas Ruang Tunggu
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#334155' }}>
                  <Coffee size={15} color="#f97316" />
                  <span>Kopi & Teh Gratis</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#334155' }}>
                  <Wifi size={15} color="#f97316" />
                  <span>Free High-Speed Wi-Fi</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#334155' }}>
                  <Shield size={15} color="#f97316" />
                  <span>Ruang Tunggu Ber-AC</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#334155' }}>
                  <Clock size={15} color="#f97316" />
                  <span>Area Pantau Servis</span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: 'auto' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                Hubungi Kami Langsung
              </h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a
                  href="https://wa.me/6281319233748"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tb-btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                >
                  <MessageSquare size={15} />
                  <span>WhatsApp CS</span>
                </a>

                <a
                  href="tel:081319233748"
                  className="tb-btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                >
                  <Phone size={15} />
                  <span>0813-1923-3748</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

