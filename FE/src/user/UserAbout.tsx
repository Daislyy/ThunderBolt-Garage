import { useState } from 'react'
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react'

interface UserAboutProps {
  onLearnMoreClick: () => void
}

export default function UserAbout({ onLearnMoreClick }: UserAboutProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <section id="tentang" className="tb-about-section">
      <div className="tb-container">
        <div className="tb-about-grid">
          {/* Left: Vehicle Image */}
          <div className="tb-about-visual">
            <img
              src={imgError ? '/vehicles/about-car.png' : '/vehicles/about-jeep-cutout.png'}
              onError={() => setImgError(true)}
              alt="Perawatan Kendaraan ThunderBolt Garage"
              className="tb-about-car-img"
            />
          </div>

          {/* Right: Content */}
          <div className="tb-about-content">
            <div className="tb-badge">
              <ShieldCheck size={14} />
              Tentang Bengkel
            </div>

            <h2 className="tb-about-title">
              Standar Pengerjaan Rapi & <br />
              <span className="tb-text-orange">Transparansi Penuh</span>
            </h2>

            <p className="tb-about-desc">
              ThunderBolt Garage berfokus pada kualitas pengerjaan dan kejujuran diagnosis.
              Setiap komponen yang diganti selalu dikonfirmasi kepada pemilik kendaraan dengan rincian biaya yang pasti.
            </p>

            <div className="tb-about-points">
              <div className="tb-about-point">
                <CheckCircle2 size={18} color="#f97316" />
                <span>Pemeriksaan menyeluruh sebelum mulai servis</span>
              </div>
              <div className="tb-about-point">
                <CheckCircle2 size={18} color="#f97316" />
                <span>Suku cadang dan oli original 100% bergaransi</span>
              </div>
              <div className="tb-about-point">
                <CheckCircle2 size={18} color="#f97316" />
                <span>Pantau progres servis secara online lewat nomor plat</span>
              </div>
            </div>

            <div style={{ marginTop: '1.75rem' }}>
              <button onClick={onLearnMoreClick} className="tb-btn-primary">
                <span>Pilih Layanan Servis</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
