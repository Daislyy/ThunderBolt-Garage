import { useState, useEffect } from 'react'
import { Search, Calendar, Car, Wrench } from 'lucide-react'
import { getLocalServices } from './dashboard/serviceStorage'

interface UserQuickFilterProps {
  onSearch: (serviceName: string, vehicleType: string) => void
}

export default function UserQuickFilter({ onSearch }: UserQuickFilterProps) {
  const [vehicleType, setVehicleType] = useState('Semua Kendaraan')
  const [serviceName, setServiceName] = useState('Servis Berkala & Ganti Oli')
  const [visitTime, setVisitTime] = useState('Pagi (08:00 - 12:00)')
  const [serviceOptions, setServiceOptions] = useState<string[]>(() =>
    getLocalServices().map((s) => s.name)
  )

  useEffect(() => {
    const handleUpdate = () => {
      const list = getLocalServices().map((s) => s.name)
      if (list.length > 0) setServiceOptions(list)
    }
    window.addEventListener('tb_services_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('tb_services_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(serviceName, vehicleType)
  }

  return (
    <section className="tb-filter-strip">
      <div className="tb-container">
        <div className="tb-filter-header">
          <h3 className="tb-filter-title">Cari Layanan & Estimasi Kendaraan</h3>
          <p className="tb-filter-subtitle">
            Pilih kategori kendaraan dan jenis perawatan untuk langsung jadwalkan antrean servis
          </p>
        </div>

        <form onSubmit={handleSubmit} className="tb-filter-form">
          {/* Vehicle Type */}
          <div className="tb-filter-field">
            <label className="tb-filter-label">
              <Car size={14} color="#f97316" />
              <span>Tipe Kendaraan</span>
            </label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="tb-filter-select"
            >
              <option value="Semua Kendaraan">Semua Kendaraan</option>
              <option value="Mobil SUV / MPV">Mobil SUV / MPV</option>
              <option value="Mobil Sedan / Hatchback">Mobil Sedan / Hatchback</option>
              <option value="Motor Matic / Skuter">Motor Matic / Skuter</option>
              <option value="Motor Sport / Bebek">Motor Sport / Bebek</option>
            </select>
          </div>

          {/* Service Type */}
          <div className="tb-filter-field">
            <label className="tb-filter-label">
              <Wrench size={14} color="#f97316" />
              <span>Pilihan Servis</span>
            </label>
            <select
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="tb-filter-select"
            >
              {serviceOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Visit Slot */}
          <div className="tb-filter-field">
            <label className="tb-filter-label">
              <Calendar size={14} color="#f97316" />
              <span>Jadwal Kedatangan</span>
            </label>
            <select
              value={visitTime}
              onChange={(e) => setVisitTime(e.target.value)}
              className="tb-filter-select"
            >
              <option value="Pagi (08:00 - 12:00)">Pagi (08:00 - 12:00)</option>
              <option value="Siang (12:00 - 15:00)">Siang (12:00 - 15:00)</option>
              <option value="Sore (15:00 - 17:00)">Sore (15:00 - 17:00)</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="tb-filter-submit">
            <button type="submit" className="tb-btn-primary tb-filter-btn">
              <Search size={16} />
              <span>Cari & Booking</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
