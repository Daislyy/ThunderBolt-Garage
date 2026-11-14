import { useState, useEffect } from 'react'
import { Search, CheckCircle2, Wrench, AlertCircle } from 'lucide-react'

interface TrackingRecord {
  code: string
  plateNumber: string
  name: string
  vehicle: string
  service: string
  date: string
  time: string
  status: string // 'Menunggu Konfirmasi' | 'Kendaraan Masuk' | 'Sedang Dikerjakan' | 'Selesai'
  mechanic?: string
  progressPercent: number
  notes?: string
}

interface UserTrackingProps {
  initialQuery?: string
}

const demoRecords: TrackingRecord[] = [
  {
    code: 'TB-1024',
    plateNumber: 'B 4129 SZX',
    name: 'Dimas Wicaksono',
    vehicle: 'Honda Vario 160',
    service: 'Tune Up & Sistem Injeksi',
    date: 'Hari ini',
    time: '09:30 WIB',
    status: 'Sedang Dikerjakan',
    mechanic: 'Budi (Senior Tech)',
    progressPercent: 70,
    notes: 'Pembersihan throttle body selesai, sedang kalibrasi sensor.',
  },
  {
    code: 'TB-1025',
    plateNumber: 'B 6832 TYA',
    name: 'Rian Pratama',
    vehicle: 'Yamaha NMAX 155',
    service: 'Servis Berkala & Ganti Oli',
    date: 'Hari ini',
    time: '10:00 WIB',
    status: 'Selesai',
    mechanic: 'Agus P.',
    progressPercent: 100,
    notes: 'Pengerjaan selesai & uji fungsi normal. Kendaraan siap diambil.',
  },
]

export default function UserTracking({ initialQuery }: UserTrackingProps) {
  const [query, setQuery] = useState(initialQuery || '')
  const [result, setResult] = useState<TrackingRecord | null>(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
      handleSearch(initialQuery)
    }
  }, [initialQuery])

  const handleSearch = (searchVal?: string) => {
    const val = (searchVal !== undefined ? searchVal : query).trim().toUpperCase()
    if (!val) return

    setSearched(true)

    // Check localStorage saved bookings first
    const saved = JSON.parse(localStorage.getItem('tb_user_bookings') || '[]')
    const matchSaved = saved.find(
      (b: any) => b.code?.toUpperCase() === val || b.plateNumber?.toUpperCase() === val
    )

    if (matchSaved) {
      setResult({
        code: matchSaved.code,
        plateNumber: matchSaved.plateNumber,
        name: matchSaved.name,
        vehicle: matchSaved.vehicle,
        service: matchSaved.service,
        date: matchSaved.date,
        time: matchSaved.time,
        status: matchSaved.status || 'Menunggu Konfirmasi',
        mechanic: 'Antrean Bengkel',
        progressPercent: 25,
        notes: matchSaved.notes || 'Data booking telah tercatat di antrean sistem.',
      })
      return
    }

    // Check demo records
    const matchDemo = demoRecords.find(
      (d) => d.code.toUpperCase() === val || d.plateNumber.toUpperCase() === val
    )

    if (matchDemo) {
      setResult(matchDemo)
    } else {
      setResult(null)
    }
  }

  const steps = [
    { title: 'Booking Terdaftar', desc: 'Jadwal tercatat di sistem' },
    { title: 'Kendaraan Tiba', desc: 'Pemeriksaan awal fisik' },
    { title: 'Pengerjaan Servis', desc: 'Ditangani mekanik bengkel' },
    { title: 'Selesai & Uji Coba', desc: 'Siap diambil pemilik' },
  ]

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'Menunggu Konfirmasi': return 0
      case 'Kendaraan Masuk': return 1
      case 'Sedang Dikerjakan': return 2
      case 'Selesai': return 3
      default: return 0
    }
  }

  return (
    <section id="tracking" className="tb-section" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
      <div className="tb-container">
        <div className="tb-section-header">
          <div className="tb-badge">Transparansi Pengerjaan</div>
          <h2 className="tb-section-title">Lacak Status Kendaraan</h2>
          <p className="tb-section-desc">
            Ketahui langsung progress servis kendaraan Anda secara real-time cukup dengan memasukkan Nomor Plat atau Kode Booking.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ maxWidth: '540px', margin: '0 auto 2.5rem auto' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch()
            }}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Masukkan Nomor Plat (B 1234 ABC) atau Kode (TB-XXXX)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="tb-input"
                style={{ padding: '0.75rem 1rem', fontSize: '0.9375rem' }}
              />
            </div>
            <button type="submit" className="tb-btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
              <Search size={16} />
              <span>Cari</span>
            </button>
          </form>

          {/* Quick chip examples */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Contoh cek:</span>
            <button
              type="button"
              onClick={() => {
                setQuery('B 4129 SZX')
                handleSearch('B 4129 SZX')
              }}
              style={{
                fontSize: '0.75rem',
                border: 'none',
                background: '#f1f5f9',
                color: '#475569',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
            >
              B 4129 SZX
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery('B 6832 TYA')
                handleSearch('B 6832 TYA')
              }}
              style={{
                fontSize: '0.75rem',
                border: 'none',
                background: '#f1f5f9',
                color: '#475569',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
            >
              B 6832 TYA
            </button>
          </div>
        </div>

        {/* Tracking Details Card */}
        {result && (
          <div className="tb-card" style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem' }}>
            {/* Header Result */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid #f1f5f9',
                marginBottom: '1.75rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f97316', textTransform: 'uppercase' }}>
                  {result.code}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {result.vehicle}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  Pemilik: <strong>{result.name}</strong> • Layanan: <strong>{result.service}</strong>
                </p>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  padding: '0.375rem 0.75rem',
                  borderRadius: '9999px',
                  backgroundColor: result.status === 'Selesai' ? '#dcfce7' : '#fff7ed',
                  color: result.status === 'Selesai' ? '#15803d' : '#ea580c',
                  border: `1px solid ${result.status === 'Selesai' ? '#bbf7d0' : '#ffedd5'}`,
                }}
              >
                {result.status === 'Selesai' ? <CheckCircle2 size={15} /> : <Wrench size={15} />}
                <span>{result.status}</span>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div style={{ marginBottom: '2rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  position: 'relative',
                }}
              >
                {steps.map((st, idx) => {
                  const currentIdx = getStepIndex(result.status)
                  const isDone = idx < currentIdx || (idx === currentIdx && result.status === 'Selesai')
                  const isCurrent = idx === currentIdx && result.status !== 'Selesai'

                  return (
                    <div key={st.title} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          margin: '0 auto 0.5rem auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: isDone ? '#22c55e' : isCurrent ? '#f97316' : '#f1f5f9',
                          color: isDone || isCurrent ? '#ffffff' : '#94a3b8',
                          boxShadow: isCurrent ? '0 0 0 4px rgba(249, 115, 22, 0.2)' : 'none',
                        }}
                      >
                        {isDone ? <CheckCircle2 size={14} /> : idx + 1}
                      </div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: isCurrent ? '#f97316' : '#0f172a' }}>
                        {st.title}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.125rem' }}>
                        {st.desc}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Notes & Details */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.625rem',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.8125rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Mekanik Penanggung Jawab:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{result.mechanic || 'Tim Servis ThunderBolt'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Waktu Masuk:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{result.date} • {result.time}</span>
              </div>
              {result.notes && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.25rem', color: '#334155' }}>
                  <strong>Catatan Teknisi:</strong> {result.notes}
                </div>
              )}
            </div>
          </div>
        )}

        {searched && !result && (
          <div style={{ maxWidth: '540px', margin: '0 auto', textAlign: 'center', padding: '2rem 1rem' }}>
            <AlertCircle size={32} color="#f97316" style={{ margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Data Servis Tidak Ditemukan</h4>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
              Pastikan nomor plat atau kode booking yang Anda masukkan sudah sesuai. Atau hubungi admin bengkel untuk pengecekan langsung.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
