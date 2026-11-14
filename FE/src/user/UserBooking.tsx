import { useState, useEffect } from 'react'
import { CheckCircle2, Send, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react'
import { syncBookingToAdmin } from './dashboard/userStorage'
import { getLocalServices } from './dashboard/serviceStorage'

interface UserBookingProps {
  preselectedService?: string
  onBookingSuccess: (bookingCode: string, platNomor: string) => void
}

export default function UserBooking({ preselectedService, onBookingSuccess }: UserBookingProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicleType: 'motor',
    vehicleModel: '',
    plateNumber: '',
    serviceName: 'Servis Berkala & Ganti Oli',
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: '09:00',
    notes: '',
  })

  const [submittedCode, setSubmittedCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableServices, setAvailableServices] = useState<string[]>(() =>
    getLocalServices().map((s) => s.name)
  )

  useEffect(() => {
    const handleUpdate = () => {
      const list = getLocalServices().map((s) => s.name)
      if (list.length > 0) setAvailableServices(list)
    }
    window.addEventListener('tb_services_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('tb_services_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  useEffect(() => {
    if (preselectedService) {
      setFormData((prev) => ({ ...prev, serviceName: preselectedService }))
    }
  }, [preselectedService])

  const timeSlots = [
    '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim() || !formData.phone.trim() || !formData.vehicleModel.trim() || !formData.plateNumber.trim()) {
      setError('Mohon lengkapi nama, nomor WhatsApp, model kendaraan, dan plat nomor.')
      return
    }

    setLoading(true)

    // Generate unique user-friendly booking reference: e.g. TB-7492
    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    const code = `TB-${randomDigits}`

    // Store in localStorage for user tracking persistence
    const savedBookings = JSON.parse(localStorage.getItem('tb_user_bookings') || '[]')
    const newEntry = {
      code,
      name: formData.name,
      phone: formData.phone,
      vehicle: `${formData.vehicleModel} (${formData.plateNumber.toUpperCase()})`,
      plateNumber: formData.plateNumber.toUpperCase(),
      service: formData.serviceName,
      date: formData.bookingDate,
      time: formData.bookingTime,
      status: 'Menunggu Konfirmasi',
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('tb_user_bookings', JSON.stringify([newEntry, ...savedBookings]))

    // Sync directly to Admin Dashboard & Bookings
    const brandGuess = formData.vehicleModel.split(' ')[0] || 'Kendaraan'
    syncBookingToAdmin({
      id: Date.now(),
      booking_code: code,
      customer_name: formData.name,
      customer_email: `${formData.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      vehicle_brand: brandGuess,
      vehicle_model: formData.vehicleModel,
      license_plate: formData.plateNumber.toUpperCase(),
      service_name: formData.serviceName,
      booking_date: formData.bookingDate,
      booking_time: formData.bookingTime,
      status: 'Menunggu',
      total_price: 150000,
      notes: formData.notes,
      created_at: new Date().toISOString(),
    })

    setTimeout(() => {
      setLoading(false)
      setSubmittedCode(code)
      onBookingSuccess(code, formData.plateNumber.toUpperCase())
    }, 400)
  }

  const handleReset = () => {
    setSubmittedCode(null)
    setFormData((prev) => ({
      ...prev,
      vehicleModel: '',
      plateNumber: '',
      notes: '',
    }))
  }

  const waText = encodeURIComponent(
    `Halo ThunderBolt Garage, saya ingin konfirmasi booking servis:\n` +
    `• No. Booking: ${submittedCode}\n` +
    `• Nama: ${formData.name}\n` +
    `• Kendaraan: ${formData.vehicleModel} (${formData.plateNumber.toUpperCase()})\n` +
    `• Layanan: ${formData.serviceName}\n` +
    `• Jadwal: ${formData.bookingDate} jam ${formData.bookingTime} WIB\n` +
    (formData.notes ? `• Keluhan: ${formData.notes}\n` : '') +
    `Terima kasih.`
  )

  return (
    <section id="booking" className="tb-section">
      <div className="tb-container">
        <div className="tb-section-header">
          <div className="tb-badge">Antrean Terjadwal</div>
          <h2 className="tb-section-title">Form Booking Servis</h2>
          <p className="tb-section-desc">
            Pesan slot kedatangan agar kendaraan Anda segera ditangani teknisi tanpa menunggu antrean panjang.
          </p>
        </div>

        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {submittedCode ? (
            /* Confirmation card */
            <div className="tb-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', borderColor: '#fed7aa' }}>
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                Booking Berhasil Terdaftar!
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
                Simpan kode booking Anda untuk memeriksa status pengerjaan saat di bengkel.
              </p>

              <div
                style={{
                  backgroundColor: '#fff7ed',
                  border: '1px dashed #fdba74',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  display: 'inline-block',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Kode Booking Anda
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em' }}>
                  {submittedCode}
                </div>
              </div>

              <div
                style={{
                  textAlign: 'left',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  color: '#334155',
                  marginBottom: '1.5rem',
                }}
              >
                <div><strong>Nama:</strong> {formData.name}</div>
                <div><strong>Kendaraan:</strong> {formData.vehicleModel} ({formData.plateNumber.toUpperCase()})</div>
                <div><strong>Layanan:</strong> {formData.serviceName}</div>
                <div><strong>Jadwal:</strong> {formData.bookingDate} • {formData.bookingTime} WIB</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a
                  href={`https://wa.me/6281319233748?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tb-btn-primary"
                  style={{ backgroundColor: '#22c55e' }}
                >
                  <MessageSquare size={16} />
                  <span>Kirim ke WhatsApp Bengkel</span>
                </a>

                <button onClick={handleReset} className="tb-btn-secondary">
                  <RefreshCw size={15} />
                  <span>Buat Booking Lain</span>
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="tb-card" style={{ padding: '2rem' }}>
              {error && (
                <div
                  style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    color: '#991b1b',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="tb-label">Nama Lengkap *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Contoh: Muhammad Attar Putra Pratama"
                    className="tb-input"
                    required
                  />
                </div>

                <div>
                  <label className="tb-label">Nomor WhatsApp Aktif *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Contoh: 081319233748"
                    className="tb-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="tb-label">Merk & Tipe Kendaraan *</label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    placeholder="Contoh: Vario 160 / Avanza 2021"
                    className="tb-input"
                    required
                  />
                </div>

                <div>
                  <label className="tb-label">Nomor Polisi (Plat) *</label>
                  <input
                    type="text"
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleChange}
                    placeholder="Contoh: B 1234 ABC"
                    className="tb-input"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="tb-label">Layanan Yang Dibutuhkan *</label>
                <select
                  name="serviceName"
                  value={formData.serviceName}
                  onChange={handleChange}
                  className="tb-select"
                >
                  {availableServices.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value="Pengecekan Umum / Diagnosa Keluhan">
                    Pengecekan Umum / Diagnosa Keluhan
                  </option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="tb-label">Pilih Tanggal *</label>
                  <input
                    type="date"
                    name="bookingDate"
                    value={formData.bookingDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="tb-input"
                    required
                  />
                </div>

                <div>
                  <label className="tb-label">Pilih Jam Kedatangan *</label>
                  <select
                    name="bookingTime"
                    value={formData.bookingTime}
                    onChange={handleChange}
                    className="tb-select"
                  >
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time} WIB
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="tb-label">Keluhan atau Catatan Tambahan (Opsional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Contoh: Ada suara gredek saat tarikan awal, tolong cek kampas ganda."
                  rows={3}
                  className="tb-textarea"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="tb-btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem', justifyContent: 'center' }}
              >
                {loading ? (
                  <span>Mendaftarkan Jadwal...</span>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Daftar Booking Servis</span>
                  </>
                )}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                Konfirmasi pendaftaran akan dikirimkan langsung dan tercatat di sistem bengkel.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
