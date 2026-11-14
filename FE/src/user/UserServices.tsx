import { useState, useEffect } from 'react'
import { Wrench, Gauge, Disc, Cog, Zap, ShieldCheck, ArrowRight, Clock } from 'lucide-react'
import { fetchAllServices, getLocalServices } from './dashboard/serviceStorage'
import type { GarageService } from './dashboard/serviceStorage'

interface UserServicesProps {
  onSelectService: (serviceName: string) => void
}

export default function UserServices({ onSelectService }: UserServicesProps) {
  const [services, setServices] = useState<GarageService[]>(getLocalServices)

  const loadServices = async () => {
    const data = await fetchAllServices()
    setServices(data)
  }

  useEffect(() => {
    loadServices()

    const handleUpdate = () => {
      setServices(getLocalServices())
    }

    window.addEventListener('tb_services_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)

    return () => {
      window.removeEventListener('tb_services_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const getServiceIcon = (name: string, index: number) => {
    const lower = name.toLowerCase()
    if (lower.includes('rem') || lower.includes('kaki')) return <Disc size={20} />
    if (lower.includes('tune') || lower.includes('injeksi') || lower.includes('oli')) return <Gauge size={20} />
    if (lower.includes('cvt') || lower.includes('transmisi') || lower.includes('mesin') || lower.includes('overhaul')) return <Cog size={20} />
    if (lower.includes('listrik') || lower.includes('aki') || lower.includes('baterai')) return <Zap size={20} />
    if (lower.includes('berkala') || lower.includes('cek')) return <ShieldCheck size={20} />
    const pool = [Wrench, Gauge, Disc, Cog, Zap, ShieldCheck]
    const FallbackIcon = pool[index % pool.length]
    return <FallbackIcon size={20} />
  }

  return (
    <section id="layanan" className="tb-section">
      <div className="tb-container">
        <div className="tb-section-header">
          <div className="tb-badge">Daftar Layanan</div>
          <h2 className="tb-section-title">Pilihan Servis Kendaraan</h2>
          <p className="tb-section-desc">
            Pilih paket perawatan yang sesuai dengan kondisi kendaraan Anda. Seluruh pengerjaan melalui pengecekan standar teknisi.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {services.map((item, index) => (
            <div key={item.id} className="tb-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#fff7ed',
                    color: '#f97316',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getServiceIcon(item.name, index)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a' }}>{item.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', fontSize: '0.75rem' }}>
                    <Clock size={12} />
                    <span>{item.duration || '45 - 60 Menit'}</span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, flex: 1, marginBottom: '1.25rem' }}>
                {item.description}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Estimasi Biaya Jasa</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>
                    Rp {Number(item.price || 100000).toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  onClick={() => onSelectService(item.name)}
                  className="tb-btn-primary"
                  style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
                >
                  <span>Pilih</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
