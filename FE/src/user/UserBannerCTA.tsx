import { MessageCircle, PhoneCall, CheckCircle2 } from 'lucide-react'

interface UserBannerCTAProps {
  onBookClick: () => void
}

export default function UserBannerCTA({ onBookClick }: UserBannerCTAProps) {
  const testimonials = [
    {
      name: 'Budi Santoso',
      vehicle: 'Toyota Fortuner',
      comment: 'Servis berkala dan ganti oli selesai tepat 1 jam. Biaya sesuai estimasi awal.',
    },
    {
      name: 'Rian Pratama',
      vehicle: 'Honda Vario 160',
      comment: 'Servis CVT tarikan jadi halus kembali. Mekanik informatif jelasin part yang aus.',
    },
    {
      name: 'Hendrik Wijaya',
      vehicle: 'Honda Civic Sedan',
      comment: 'Bagus bisa booking online dan ada riwayat servisnya di web. Sangat praktis.',
    },
  ]

  return (
    <section className="tb-cta-section">
      <div className="tb-container">
        {/* Testimonials */}
        <div className="tb-section-header" style={{ marginBottom: '2.5rem' }}>
          <div className="tb-badge">Ulasan Pelanggan</div>
          <h2 className="tb-section-title">Apa Kata Pemilik Kendaraan</h2>
        </div>

        <div className="tb-testi-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="tb-testi-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem', color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>
                <CheckCircle2 size={15} />
                <span>Servis Selesai & Terverifikasi</span>
              </div>
              <p className="tb-testi-comment">"{t.comment}"</p>
              <div className="tb-testi-author">
                <span className="tb-testi-name">{t.name}</span>
                <span className="tb-testi-vehicle">{t.vehicle}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Banner */}
        <div className="tb-action-banner">
          <div className="tb-action-banner-content">
            <h3 className="tb-action-banner-title">
              Kendaraan Butuh Perawatan Hari Ini?
            </h3>
            <p className="tb-action-banner-desc">
              Pesan antrean sekarang agar tidak perlu menunggu lama di bengkel.
            </p>
            <div className="tb-action-banner-btns">
              <button onClick={onBookClick} className="tb-btn-primary tb-btn-lg">
                <PhoneCall size={18} />
                <span>Jadwalkan Servis Sekarang</span>
              </button>
              <a
                href="https://wa.me/6281319233748?text=Halo%20ThunderBolt%20Garage,%20saya%20ingin%20konsultasi%20servis"
                target="_blank"
                rel="noreferrer"
                className="tb-btn-dark tb-btn-lg"
              >
                <MessageCircle size={18} color="#22c55e" />
                <span>Konsultasi WhatsApp</span>
              </a>
            </div>
          </div>
          <div className="tb-action-banner-arch" />
        </div>
      </div>
    </section>
  )
}
