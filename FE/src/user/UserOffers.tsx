import { ArrowRight, Clock, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

interface OfferItem {
  id: number
  vehicleCategory: string
  serviceName: string
  price: number
  duration: string
  image: string
  tag: string
}

interface UserOffersProps {
  onSelectOffer: (serviceName: string) => void
}

const offersData: OfferItem[] = [
  {
    id: 1,
    vehicleCategory: 'Mobil SUV & Crossover',
    serviceName: 'Servis Berkala & Tune Up',
    price: 175000,
    duration: '60 Menit',
    image: '/vehicles/hero-jeep-cutout.png',
    tag: 'Populer',
  },
  {
    id: 2,
    vehicleCategory: 'Mobil Sedan & City Car',
    serviceName: 'Ganti Oli & Cek Kelistrikan',
    price: 150000,
    duration: '45 Menit',
    image: '/vehicles/car-sedan-cutout.png',
    tag: 'Rekomendasi',
  },
  {
    id: 3,
    vehicleCategory: 'Mobil Eksekutif & Premium',
    serviceName: 'Diagnostik OBD & Injeksi',
    price: 250000,
    duration: '90 Menit',
    image: '/vehicles/car-mercedes-cutout.png',
    tag: 'Spesialis',
  },
  {
    id: 4,
    vehicleCategory: 'Motor Matic & Skuter',
    serviceName: 'Servis CVT & Ganti Oli',
    price: 85000,
    duration: '40 Menit',
    image: '/vehicles/bike-matic-cutout.png',
    tag: 'Paling Laris',
  },
  {
    id: 5,
    vehicleCategory: 'Motor Sport & Kopling',
    serviceName: 'Tune Up Injeksi & Rantai',
    price: 120000,
    duration: '60 Menit',
    image: '/vehicles/bike-sport-cutout.png',
    tag: 'Performa',
  },
  {
    id: 6,
    vehicleCategory: 'Mobil Niaga & Angkutan',
    serviceName: 'Servis Rem & Kaki-kaki',
    price: 140000,
    duration: '50 Menit',
    image: '/vehicles/about-jeep-cutout.png',
    tag: 'Tahan Banting',
  },
]

export default function UserOffers({ onSelectOffer }: UserOffersProps) {
  return (
    <section id="penawaran" className="tb-offers-section">
      <div className="tb-container">
        <div className="tb-section-header">
          <div className="tb-badge">Pilihan Populer</div>
          <h2 className="tb-section-title">Paket Servis Kendaraan</h2>
          <p className="tb-section-desc">
            Estimasi biaya jasa perawatan transparan berdasarkan kategori mobil dan motor Anda
          </p>
        </div>

        <div className="tb-offers-grid">
          {offersData.map((item) => (
            <motion.div
              key={item.id}
              className="tb-offer-card"
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {/* Badge */}
              <div className="tb-offer-tag">{item.tag}</div>

              {/* Vehicle Image Container */}
              <div className="tb-offer-img-box">
                <img
                  src={item.image}
                  alt={item.vehicleCategory}
                  className="tb-offer-img"
                  onError={(e) => {
                    // Fallback if cutout has loading issue
                    e.currentTarget.src = '/vehicles/car-city.png'
                  }}
                />
              </div>

              {/* Offer Info */}
              <div className="tb-offer-body">
                <h3 className="tb-offer-category">{item.vehicleCategory}</h3>
                <h4 className="tb-offer-service">{item.serviceName}</h4>

                <div className="tb-offer-meta">
                  <span className="tb-offer-meta-item">
                    <Clock size={12} color="#64748b" />
                    <span>{item.duration}</span>
                  </span>
                  <span className="tb-offer-meta-item">
                    <ShieldCheck size={12} color="#16a34a" />
                    <span>Garansi 14 Hari</span>
                  </span>
                </div>

                <div className="tb-offer-price-row">
                  <div>
                    <span className="tb-offer-price-lbl">Biaya Jasa Mulai</span>
                    <span className="tb-offer-price-val">
                      Rp {item.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectOffer(item.serviceName)}
                  className="tb-btn-primary tb-offer-btn"
                >
                  <span>Booking Servis</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
