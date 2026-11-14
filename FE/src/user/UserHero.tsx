import { useState } from 'react'
import { Calendar, Search, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface UserHeroProps {
  onBookClick: () => void
  onTrackClick: () => void
}

export default function UserHero({ onBookClick, onTrackClick }: UserHeroProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <section id="beranda" className="tb-hero-section">
      <div className="tb-container">
        <div className="tb-hero-grid">
          {/* Left Column: Headline & Action */}
          <div className="tb-hero-content">
            <motion.h1
              className="tb-hero-title"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              Servis Kendaraan <br />
              <span className="tb-text-orange">Untuk Anda</span>
            </motion.h1>

            <motion.p
              className="tb-hero-desc"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            >
              Perawatan berkala, perbaikan mesin, ganti oli, dan kelistrikan untuk mobil dan motor.
              Estimasi biaya transparan di awal, dikerjakan langsung oleh teknisi berpengalaman.
            </motion.p>

            <motion.div
              className="tb-hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            >
              <button onClick={onBookClick} className="tb-btn-primary tb-btn-lg">
                <Calendar size={18} />
                <span>Booking Servis</span>
                <ArrowRight size={16} />
              </button>

              <button onClick={onTrackClick} className="tb-btn-secondary tb-btn-lg">
                <Search size={18} color="#f97316" />
                <span>Cek Status</span>
              </button>
            </motion.div>

            {/* Quick stats / Highlights */}
            <motion.div
              className="tb-hero-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
            >
              <div className="tb-stat-item">
                <span className="tb-stat-num">100%</span>
                <span className="tb-stat-lbl">Sparepart Asli</span>
              </div>
              <div className="tb-stat-divider" />
              <div className="tb-stat-item">
                <span className="tb-stat-num">14 Hari</span>
                <span className="tb-stat-lbl">Garansi Servis</span>
              </div>
              <div className="tb-stat-divider" />
              <div className="tb-stat-item">
                <span className="tb-stat-num">4.9/5</span>
                <span className="tb-stat-lbl">Rating Kepuasan</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Orange Shape + Vehicle Cutout */}
          <div className="tb-hero-visual">
            {/* Pure CSS circle - keep exactly in place without any transform override */}
            <div className="tb-hero-circle-shape" />
            <motion.img
              initial={{ opacity: 0, x: 50, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              src={imgError ? '/vehicles/hero-jeep.png' : '/vehicles/hero-jeep-cutout.png'}
              onError={() => setImgError(true)}
              alt="Jeep Offroad ThunderBolt"
              className="tb-hero-car-img"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
