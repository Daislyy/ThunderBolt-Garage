import { ShieldCheck, Wrench, Clock, Award, Coffee, FileCheck } from 'lucide-react'
import { motion } from 'framer-motion'

export default function UserWhyUs() {
  const reasons = [
    {
      icon: Wrench,
      title: 'Mekanik Berpengalaman',
      desc: 'Dikerjakan langsung oleh teknisi terlatih dengan pemahaman spesifik mesin mobil & motor.',
    },
    {
      icon: ShieldCheck,
      title: 'Suku Cadang Asli',
      desc: 'Jaminan pelumas dan suku cadang original dengan standar pabrikan resmi.',
    },
    {
      icon: FileCheck,
      title: 'Biaya Transparan',
      desc: 'Rincian jasa & penggantian part disetujui pelanggan terlebih dahulu tanpa biaya tak terduga.',
    },
    {
      icon: Clock,
      title: 'Pengerjaan Tepat Waktu',
      desc: 'Estimasi waktu jelas dan progres servis dapat dipantau langsung lewat web.',
    },
    {
      icon: Award,
      title: 'Garansi Servis',
      desc: 'Garansi servis hingga 14 hari kerja untuk memastikan performa kendaraan tetap prima.',
    },
    {
      icon: Coffee,
      title: 'Fasilitas Tunggu Nyaman',
      desc: 'Ruang tunggu ber-AC dengan koneksi Wi-Fi gratis, air mineral, dan area ramah kerja.',
    },
  ]

  return (
    <section className="tb-why-section">
      <div className="tb-container">
        <div className="tb-section-header">
          <div className="tb-badge">Keunggulan Bengkel</div>
          <h2 className="tb-section-title">Mengapa ThunderBolt Garage?</h2>
          <p className="tb-section-desc">
            Komitmen kami memberikan pelayanan bengkel yang jujur, terstandar, dan memudahkan pelanggan
          </p>
        </div>

        <div className="tb-why-grid">
          {reasons.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={idx}
                className="tb-why-card"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="tb-why-icon-box">
                  <Icon size={20} color="#f97316" />
                </div>
                <h3 className="tb-why-card-title">{item.title}</h3>
                <p className="tb-why-card-desc">{item.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
