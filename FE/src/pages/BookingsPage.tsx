import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CalendarCheck, Trash2, RefreshCw, ChevronDown, X, Wrench, Plus, Calendar, Clock, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import BookingStatusBadge from '../components/BookingStatusBadge'
import BrandLogo from '../components/BrandLogo'
import api from '../api/axios'

interface Booking {
  id: number; booking_code: string; user_id: number; vehicle_id: number; service_id: number
  customer_name: string; customer_email?: string
  vehicle_brand: string; vehicle_model: string; vehicle_year?: number; license_plate: string; transmission?: string | null
  service_name: string; service_description?: string | null
  booking_date: string; booking_time: string; notes: string | null; status: string
}

interface SelectItem { id: number; name: string; email?: string; user_id?: number; brand?: string; model?: string; license_plate?: string; description?: string | null }

const initialAddForm = { user_id: 0, vehicle_id: 0, service_id: 0, booking_date: '', booking_time: '09:00', notes: '' }

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  // Datamasterdropdown
  const [customers, setCustomers] = useState<SelectItem[]>([])
  const [allVehicles, setAllVehicles] = useState<SelectItem[]>([])
  const [services, setServices] = useState<SelectItem[]>([])

  // ModalTambah
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(initialAddForm)
  const [submitting, setSubmitting] = useState(false)


  const [selected, setSelected] = useState<Booking | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [bR, cR, vR, sR] = await Promise.all([
        api.get('/bookings'),
        api.get('/users').catch(() => ({ data: { data: [] } })),
        api.get('/vehicles').catch(() => ({ data: { data: [] } })),
        api.get('/services').catch(() => ({ data: { data: [] } }))
      ])
      setBookings(bR.data.data || [])
      setCustomers(cR.data.data || [])
      setAllVehicles(vR.data.data || [])
      setServices(sR.data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])


  const filtered = bookings.filter(b => {
    const q = search.toLowerCase()
    const matchQ = b.booking_code.toLowerCase().includes(q) || b.customer_name.toLowerCase().includes(q) || b.service_name.toLowerCase().includes(q) || b.license_plate.toLowerCase().includes(q)
    return matchQ && (statusFilter === 'all' || b.status === statusFilter)
  })

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      alert('Tidak ada data booking untuk diexport.')
      return
    }

    const exportData = filtered.map((b, index) => ({
      'No': index + 1,
      'Kode Booking': b.booking_code,
      'Nama Pelanggan': b.customer_name,
      'Email Pelanggan': b.customer_email || '-',
      'Merek Kendaraan': b.vehicle_brand,
      'Model Kendaraan': b.vehicle_model,
      'Nomor Plat': b.license_plate,
      'Layanan': b.service_name,
      'Tanggal Booking': b.booking_date ? new Date(b.booking_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-',
      'Waktu': b.booking_time ? `${b.booking_time.slice(0, 5)} WIB` : '-',
      'Status': b.status,
      'Catatan / Keluhan': b.notes || '-'
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    
    worksheet['!cols'] = [
      { wch: 6 },   // No
      { wch: 16 },  // Kode Booking
      { wch: 24 },  // Nama Pelanggan
      { wch: 28 },  // Email Pelanggan
      { wch: 18 },  // Merek Kendaraan
      { wch: 18 },  // Model Kendaraan
      { wch: 14 },  // Nomor Plat
      { wch: 22 },  // Layanan
      { wch: 20 },  // Tanggal Booking
      { wch: 12 },  // Waktu
      { wch: 14 },  // Status
      { wch: 32 }   // Catatan
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Booking')

    const todayStr = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(workbook, `Data_Booking_Thunderbolt_${todayStr}.xlsx`)
  }


  const userVehicles = allVehicles.filter(v => v.user_id === addForm.user_id)
  const updateAdd = (key: string, val: any) => setAddForm(p => ({ ...p, [key]: val }))

  const openAddModal = () => {
    const firstCust = customers[0]?.id || 0
    const firstVeh = allVehicles.filter(v => v.user_id === firstCust)
    setAddForm({ user_id: firstCust, vehicle_id: firstVeh[0]?.id || 0, service_id: services[0]?.id || 0, booking_date: new Date().toISOString().slice(0, 10), booking_time: '09:00', notes: '' })
    setIsAddOpen(true)
  }

  const handleCustomerChange = (uid: number) => {
    const vehs = allVehicles.filter(v => v.user_id === uid)
    setAddForm(p => ({ ...p, user_id: uid, vehicle_id: vehs[0]?.id || 0 }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.user_id || !addForm.vehicle_id || !addForm.service_id || !addForm.booking_date) return alert('Lengkapi semua field!')
    setSubmitting(true)
    try { await api.post('/bookings', addForm); setIsAddOpen(false); fetchAll() }
    catch (err: any) { alert(err.message || 'Gagal membuat booking') }
    finally { setSubmitting(false) }
  }

  const handleUpdateStatus = async () => {
    if (!selected || !newStatus) return
    setUpdatingId(selected.id)
    try { await api.patch(`/bookings/${selected.id}/status`, { status: newStatus }); setBookings(p => p.map(b => b.id === selected.id ? { ...b, status: newStatus } : b)); setSelected(null) }
    finally { setUpdatingId(null) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus booking ini?')) return
    setDeletingId(id)
    try { await api.delete(`/bookings/${id}`); setBookings(p => p.filter(b => b.id !== id)) }
    finally { setDeletingId(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
     
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>Kelola Booking</h1>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', margin: '0.25rem 0 0 0' }}>Pemesanan servis, penjadwalan, dan kontrol status pengerjaan</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="klesi-btn-ghost" onClick={fetchAll}><RefreshCw style={{ width: '1rem', height: '1rem' }} /> Refresh</button>
          <button className="klesi-btn-excel" onClick={handleExportExcel} title="Export data booking ke format Excel (.xlsx)">
            <FileSpreadsheet style={{ width: '1rem', height: '1rem' }} /> Export Excel
          </button>
          <button className="klesi-btn-primary" onClick={openAddModal}><Plus style={{ width: '1.125rem', height: '1.125rem' }} /> Buat Booking</button>
        </div>
      </motion.div>

      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#94a3b8' }} />
            <input
              className="klesi-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Cari kode, customer, plat, atau jenis layanan…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="klesi-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Diproses">Diproses</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>{filtered.length} transaksi ditemukan</span>
      </div>

      {/* Table Container */}
      <div className="klesi-table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Memuat data booking...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
            <CalendarCheck style={{ width: '3rem', height: '3rem', opacity: 0.4, margin: '0 auto 0.75rem auto' }} />
            <p style={{ fontWeight: 800, color: '#475569', fontSize: '0.875rem' }}>Tidak ada data booking ditemukan</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="klesi-table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Customer</th>
                  <th>Kendaraan</th>
                  <th>Layanan</th>
                  <th>Tanggal & Waktu</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => (
                  <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td>
                      <code style={{ fontSize: '0.75rem', fontWeight: 900, color: '#F97316', backgroundColor: '#fff7ed', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #ffedd5' }}>
                        {b.booking_code}
                      </code>
                    </td>
                    <td>
                      <p style={{ fontWeight: 800, color: '#0f172a', margin: 0 }}>{b.customer_name}</p>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BrandLogo brand={b.vehicle_brand} />
                        <div>
                          <p style={{ fontWeight: 800, color: '#0f172a', margin: 0 }}>{b.vehicle_brand} {b.vehicle_model}</p>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{b.license_plate}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Wrench style={{ width: '0.875rem', height: '0.875rem', color: '#F97316' }} />
                        <span style={{ fontWeight: 800, color: '#F97316' }}>{b.service_name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{new Date(b.booking_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.booking_time?.slice(0, 5)} WIB</span>
                    </td>
                    <td><BookingStatusBadge status={b.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="klesi-btn-ghost"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.75rem' }}
                          onClick={() => { setSelected(b); setNewStatus(b.status) }}
                        >
                          <ChevronDown style={{ width: '0.875rem', height: '0.875rem' }} /> Update
                        </button>
                        <button
                          style={{ padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid #fecdd3', backgroundColor: '#fff1f2', color: '#e11d48', cursor: 'pointer' }}
                          onClick={() => handleDelete(b.id)}
                          disabled={deletingId === b.id}
                        >
                          <Trash2 style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    
      <AnimatePresence>
        {isAddOpen && (
          <div className="klesi-modal-overlay" onClick={e => e.target === e.currentTarget && setIsAddOpen(false)}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="klesi-modal">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Buat Booking Baru</h3>
                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setIsAddOpen(false)}>
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pelanggan *</label>
                  <select className="klesi-select" value={addForm.user_id} onChange={e => handleCustomerChange(Number(e.target.value))} required>
                    <option value={0} disabled>-- Pilih Pelanggan --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kendaraan Pelanggan *</label>
                  <select className="klesi-select" value={addForm.vehicle_id} onChange={e => updateAdd('vehicle_id', Number(e.target.value))} required disabled={!userVehicles.length}>
                    {!userVehicles.length
                      ? <option value={0}>-- Belum ada kendaraan --</option>
                      : userVehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.license_plate})</option>)
                    }
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jenis Layanan *</label>
                  <select className="klesi-select" value={addForm.service_id} onChange={e => updateAdd('service_id', Number(e.target.value))} required>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tanggal *</label>
                    <input className="klesi-input" type="date" required value={addForm.booking_date} onChange={e => updateAdd('booking_date', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Waktu *</label>
                    <input className="klesi-input" type="time" required value={addForm.booking_time} onChange={e => updateAdd('booking_time', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catatan / Keluhan</label>
                  <textarea className="klesi-input" rows={2} placeholder="Catatan keluhan kendaraan…" value={addForm.notes} onChange={e => updateAdd('notes', e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" className="klesi-btn-ghost" onClick={() => setIsAddOpen(false)}>Batal</button>
                  <button type="submit" className="klesi-btn-primary" disabled={submitting || !userVehicles.length}>{submitting ? 'Memproses…' : 'Buat Booking'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

     
      <AnimatePresence>
        {selected && (
          <div className="klesi-modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="klesi-modal">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Detail & Update Status</h3>
                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setSelected(null)}>
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kode Booking</span>
                  <p style={{ fontWeight: 900, color: '#F97316', margin: '0.125rem 0 0 0', fontSize: '0.875rem' }}>{selected.booking_code}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Customer</span>
                  <p style={{ fontWeight: 900, color: '#0f172a', margin: '0.125rem 0 0 0', fontSize: '0.875rem' }}>{selected.customer_name}</p>
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '1rem', border: '1px solid #ffedd5', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.625rem', fontWeight: 900, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                  <Wrench style={{ width: '0.75rem', height: '0.75rem' }} /> Layanan Dipilih
                </span>
                <p style={{ fontWeight: 900, color: '#0f172a', margin: 0, fontSize: '0.9375rem' }}>{selected.service_name}</p>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Calendar style={{ width: '0.75rem', height: '0.75rem' }} /> {new Date(selected.booking_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Clock style={{ width: '0.75rem', height: '0.75rem' }} /> {selected.booking_time?.slice(0, 5)} WIB</span>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ubah Status Pengerjaan</label>
                <select className="klesi-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="klesi-btn-ghost" onClick={() => setSelected(null)}>Batal</button>
                <button className="klesi-btn-primary" onClick={handleUpdateStatus} disabled={updatingId !== null}>{updatingId ? 'Menyimpan…' : 'Simpan Status'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
