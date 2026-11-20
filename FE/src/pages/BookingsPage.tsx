import { useEffect, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, CalendarCheck, Trash2, RefreshCw, ChevronDown, X,
  Plus, FileSpreadsheet, Package,
  Lock, CheckCircle2, AlertCircle
} from 'lucide-react'
import * as XLSX from 'xlsx'
import BookingStatusBadge from '../components/BookingStatusBadge'
import BrandLogo from '../components/BrandLogo'
import api from '../api/axios'
import {
  getMergedAdminBookings,
  updateSharedBookingStatus,
  saveBookingSpareparts,
  getBookingSpareparts,
  SHARED_ADMIN_BOOKINGS_KEY,
} from '../user/dashboard/userStorage'
import { confirmCashPaymentByAdmin } from '../user/dashboard/paymentService'

interface Booking {
  id: number; booking_code: string; user_id: number; vehicle_id: number; service_id: number
  customer_name: string; customer_email?: string
  vehicle_brand: string; vehicle_model: string; vehicle_year?: number; license_plate: string; transmission?: string | null
  service_name: string; service_description?: string | null; service_price?: number; total_price?: number
  booking_date: string; booking_time: string; notes: string | null; status: string
}

interface SelectItem { id: number; name: string; email?: string; user_id?: number; brand?: string; model?: string; license_plate?: string; description?: string | null }
interface MasterSparepart { id: number; name: string; price: number }
interface BookingSparepartItem { sparepart_id: number; name: string; price: number; quantity: number; notes?: string }

const initialAddForm = { user_id: 0, vehicle_id: 0, service_id: 0, booking_date: '', booking_time: '09:00', notes: '' }
const formatRupiah = (val: number) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const [customers, setCustomers] = useState<SelectItem[]>([])
  const [allVehicles, setAllVehicles] = useState<SelectItem[]>([])
  const [services, setServices] = useState<SelectItem[]>([])
  const [masterSpareparts, setMasterSpareparts] = useState<MasterSparepart[]>([])

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(initialAddForm)
  const [submitting, setSubmitting] = useState(false)

  const [selected, setSelected] = useState<Booking | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [bookingSpareparts, setBookingSpareparts] = useState<BookingSparepartItem[]>([])
  const [loadingSpareparts, setLoadingSpareparts] = useState(false)
  const [isSparepartDropdownOpen, setIsSparepartDropdownOpen] = useState(false)
  const [sparepartSearchQuery, setSparepartSearchQuery] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [bRes, uRes, vRes, sRes, spRes] = await Promise.all([
        api.get('/bookings').catch(() => ({ data: { data: [] } })),
        api.get('/users').catch(() => ({ data: { data: [] } })),
        api.get('/vehicles').catch(() => ({ data: { data: [] } })),
        api.get('/services').catch(() => ({ data: { data: [] } })),
        api.get('/spareparts').catch(() => ({ data: { data: [] } }))
      ])

      const merged = getMergedAdminBookings(bRes.data?.data || [])
      setBookings(merged)
      setCustomers(uRes.data?.data || [])
      setAllVehicles(vRes.data?.data || [])
      setServices(sRes.data?.data || [])
      setMasterSpareparts(spRes.data?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase()
    const mQ = !search || [b.booking_code, b.customer_name, b.vehicle_model, b.license_plate, b.service_name].some(s => s?.toLowerCase().includes(q))
    const mS = statusFilter === 'all' || b.status === statusFilter
    return mQ && mS
  })

  const handleExportExcel = () => {
    const rows = filtered.map(b => ({
      'Kode Booking': b.booking_code,
      'Nama Customer': b.customer_name || '-',
      'Email Customer': b.customer_email || '-',
      'Merek Kendaraan': b.vehicle_brand || '-',
      'Model Kendaraan': b.vehicle_model || '-',
      'Nomor Plat': b.license_plate || '-',
      'Layanan': b.service_name || '-',
      'Tanggal Booking': b.booking_date,
      'Waktu': `${b.booking_time} WIB`,
      'Status': b.status,
      'Catatan': b.notes || '-'
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 18 }, { wch: 22 }, { wch: 26 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 32 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data Booking')
    XLSX.writeFile(wb, `Data_Booking_Thunderbolt_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

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

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!addForm.user_id || !addForm.vehicle_id || !addForm.service_id || !addForm.booking_date) return alert('Lengkapi semua field!')
    setSubmitting(true)
    try {
      await api.post('/bookings', addForm)
      setIsAddOpen(false)
      fetchAll()
    } catch (err: any) {
      alert(err.message || 'Gagal membuat booking')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenDetailModal = async (b: Booking) => {
    setSelected(b)
    setNewStatus(b.status)
    setBookingSpareparts([])
    setIsSparepartDropdownOpen(false)
    setSparepartSearchQuery('')
    setLoadingSpareparts(true)
    try {
      const parts = await getBookingSpareparts(b.booking_code || b.id)
      setBookingSpareparts(parts.map(p => ({
        sparepart_id: p.sparepart_id,
        name: p.name,
        price: Number(p.price),
        quantity: Number(p.quantity || 1),
        notes: p.notes || '',
      })))
    } catch (err) {
      console.error('Gagal mengambil sparepart:', err)
    } finally {
      setLoadingSpareparts(false)
    }
  }

  const isDiproses = selected?.status?.trim().toLowerCase() === 'diproses'

  const handleAddSparepart = (sp: MasterSparepart) => {
    if (!isDiproses) return alert("Sparepart hanya dapat ditambahkan ketika status booking 'Diproses'.")
    setBookingSpareparts(prev => {
      const idx = prev.findIndex(item => item.sparepart_id === sp.id)
      if (idx > -1) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 }
        return copy
      }
      return [...prev, { sparepart_id: sp.id, name: sp.name, price: sp.price, quantity: 1, notes: '' }]
    })
    setIsSparepartDropdownOpen(false)
    setSparepartSearchQuery('')
  }

  const handleQuantityChange = (idx: number, qty: number) => {
    if (!isDiproses) return
    setBookingSpareparts(prev => prev.map((item, i) => i === idx ? { ...item, quantity: Math.max(1, qty) } : item))
  }

  const handleNotesChange = (idx: number, notes: string) => {
    if (!isDiproses) return
    setBookingSpareparts(prev => prev.map((item, i) => i === idx ? { ...item, notes } : item))
  }

  const handleRemoveSparepart = (idx: number) => {
    if (!isDiproses) return
    setBookingSpareparts(prev => prev.filter((_, i) => i !== idx))
  }

  const totalSparepartsPrice = bookingSpareparts.reduce((sum, item) => sum + (item.quantity * item.price), 0)

  const handleUpdateStatus = async () => {
    if (!selected || !newStatus) return
    setUpdatingId(selected.id)
    try {
      updateSharedBookingStatus(selected.booking_code || selected.id, newStatus)

      if (isDiproses) {
        saveBookingSpareparts(
          selected.booking_code || selected.id,
          bookingSpareparts,
          Number((selected as any).service_price || 100000)
        )
      }

      await api.patch(`/bookings/${selected.booking_code || selected.id}/status`, { status: newStatus }).catch(async () => {
        if (selected.id) await api.patch(`/bookings/${selected.id}/status`, { status: newStatus }).catch(() => {})
      })

      if (newStatus === 'Selesai') {
        const grandTotal = Number((selected as any).total_price) || (Number((selected as any).service_price || 100000) + totalSparepartsPrice)
        confirmCashPaymentByAdmin(selected.booking_code || selected.id, grandTotal)
      }

      setBookings(p => p.map(b => (b.id === selected.id || b.booking_code === selected.booking_code ? { ...b, status: newStatus } : b)))
      setSelected(null)
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menyimpan status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus booking ini?')) return
    setDeletingId(id)
    const targetBooking = bookings.find((b) => b.id === id)
    try {
      const codeOrId = targetBooking?.booking_code || id
      await api.delete(`/bookings/${codeOrId}`).catch(() => {})
      try {
        const raw = localStorage.getItem(SHARED_ADMIN_BOOKINGS_KEY)
        if (raw) {
          const arr = JSON.parse(raw)
          localStorage.setItem(SHARED_ADMIN_BOOKINGS_KEY, JSON.stringify(arr.filter((b: any) => b.id !== id && b.booking_code !== targetBooking?.booking_code)))
        }
      } catch {}
      setBookings(p => p.filter(b => b.id !== id && b.booking_code !== targetBooking?.booking_code))
    } finally {
      setDeletingId(null)
    }
  }

  const userVehicles = allVehicles.filter(v => v.user_id === addForm.user_id)

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
            <input className="klesi-input" style={{ paddingLeft: '2.5rem' }} placeholder="Cari kode, customer, plat, atau jenis layanan…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="klesi-select" style={{ width: '190px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Diproses">Diproses</option>
            <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>{filtered.length} pesanan ditemukan</span>
      </div>

      {/* Table */}
      <div className="klesi-table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Memuat data booking...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
            <CalendarCheck style={{ width: '3rem', height: '3rem', opacity: 0.4, margin: '0 auto 0.75rem auto' }} />
            <p style={{ fontWeight: 800, color: '#475569', fontSize: '0.875rem' }}>Tidak ada booking yang cocok</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="klesi-table">
              <thead>
                <tr>
                  <th>Kode Booking</th>
                  <th>Customer</th>
                  <th>Kendaraan</th>
                  <th>Layanan</th>
                  <th>Jadwal Servis</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => (
                  <motion.tr key={b.id || b.booking_code} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <td><span style={{ fontWeight: 800, color: '#ea580c' }}>{b.booking_code}</span></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#0f172a', fontWeight: 700 }}>{b.customer_name || 'Customer'}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{b.customer_email || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <BrandLogo brand={b.vehicle_brand} size="sm" />
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{b.vehicle_model}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.license_plate}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 600, color: '#334155' }}>{b.service_name}</span></td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', color: '#334155' }}>{b.booking_date}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{b.booking_time} WIB</div>
                    </td>
                    <td><BookingStatusBadge status={b.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="klesi-btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleOpenDetailModal(b)}>
                          Detail & Status
                        </button>
                        <button
                          style={{ padding: '0.4rem', borderRadius: '0.75rem', border: '1px solid #fecdd3', backgroundColor: '#fff1f2', color: '#e11d48', cursor: 'pointer' }}
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

      {/* Modal Buat Booking */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="klesi-modal-overlay" onClick={e => e.target === e.currentTarget && setIsAddOpen(false)}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="klesi-modal">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Buat Booking Servis Baru</h3>
                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setIsAddOpen(false)}><X style={{ width: '1.25rem', height: '1.25rem' }} /></button>
              </div>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="tb-label">Customer *</label>
                  <select className="klesi-select" value={addForm.user_id} onChange={e => handleCustomerChange(Number(e.target.value))}>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="tb-label">Kendaraan *</label>
                  <select className="klesi-select" value={addForm.vehicle_id} onChange={e => setAddForm(p => ({ ...p, vehicle_id: Number(e.target.value) }))}>
                    {userVehicles.length === 0 ? <option value={0}>Tidak ada kendaraan</option> : userVehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} - {v.license_plate}</option>)}
                  </select>
                </div>
                <div>
                  <label className="tb-label">Layanan *</label>
                  <select className="klesi-select" value={addForm.service_id} onChange={e => setAddForm(p => ({ ...p, service_id: Number(e.target.value) }))}>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="tb-label">Tanggal Servis *</label>
                    <input type="date" className="klesi-input" value={addForm.booking_date} onChange={e => setAddForm(p => ({ ...p, booking_date: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="tb-label">Waktu *</label>
                    <input type="time" className="klesi-input" value={addForm.booking_time} onChange={e => setAddForm(p => ({ ...p, booking_time: e.target.value }))} required />
                  </div>
                </div>
                <div>
                  <label className="tb-label">Catatan / Keluhan (Opsional)</label>
                  <textarea className="klesi-input" rows={2} placeholder="Keluhan kendaraan..." value={addForm.notes} onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" className="klesi-btn-ghost" onClick={() => setIsAddOpen(false)}>Batal</button>
                  <button type="submit" className="klesi-btn-primary" disabled={submitting}>{submitting ? 'Membuat...' : 'Buat Booking'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Detail & Ubah Status */}
      <AnimatePresence>
        {selected && (
          <div className="klesi-modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="klesi-modal" style={{ maxWidth: '620px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase' }}>Detail Booking Servis</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0.125rem 0 0 0' }}>{selected.booking_code}</h3>
                </div>
                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setSelected(null)}><X style={{ width: '1.25rem', height: '1.25rem' }} /></button>
              </div>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
                <div><span style={{ color: '#94a3b8', display: 'block' }}>Customer:</span><strong>{selected.customer_name}</strong></div>
                <div><span style={{ color: '#94a3b8', display: 'block' }}>Kendaraan:</span><strong>{selected.vehicle_brand} {selected.vehicle_model} ({selected.license_plate})</strong></div>
                <div><span style={{ color: '#94a3b8', display: 'block' }}>Layanan:</span><strong>{selected.service_name} ({formatRupiah((selected as any).service_price || 100000)})</strong></div>
                <div><span style={{ color: '#94a3b8', display: 'block' }}>Jadwal:</span><strong>{selected.booking_date} • {selected.booking_time} WIB</strong></div>
                {selected.notes && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#94a3b8', display: 'block' }}>Keluhan:</span><em>"{selected.notes}"</em></div>}
              </div>

              {/* Spareparts Section */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Package style={{ width: '0.875rem', height: '0.875rem' }} /> Suku Cadang Digunakan ({bookingSpareparts.length})
                  </span>
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      disabled={!isDiproses}
                      onClick={() => isDiproses && setIsSparepartDropdownOpen(!isSparepartDropdownOpen)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        borderRadius: '0.625rem',
                        backgroundColor: isDiproses ? '#fff7ed' : '#f1f5f9',
                        color: isDiproses ? '#ea580c' : '#94a3b8',
                        border: isDiproses ? '1.5px solid #ffedd5' : '1.5px solid #e2e8f0',
                        cursor: isDiproses ? 'pointer' : 'not-allowed',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem'
                      }}
                    >
                      <Plus style={{ width: '0.875rem', height: '0.875rem' }} />
                      <span>Tambah Sparepart</span>
                      {isDiproses && <ChevronDown style={{ width: '0.875rem', height: '0.875rem', transform: isSparepartDropdownOpen ? 'rotate(180deg)' : 'none' }} />}
                    </button>

                    <AnimatePresence>
                      {isDiproses && isSparepartDropdownOpen && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setIsSparepartDropdownOpen(false)} />
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} style={{ position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)', width: '320px', backgroundColor: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', zIndex: 50, padding: '0.75rem' }}>
                            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                              <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '0.875rem', height: '0.875rem', color: '#94a3b8' }} />
                              <input autoFocus className="klesi-input" style={{ paddingLeft: '2rem', fontSize: '0.75rem' }} placeholder="Cari sparepart..." value={sparepartSearchQuery} onChange={e => setSparepartSearchQuery(e.target.value)} />
                            </div>
                            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {masterSpareparts.filter(sp => sp.name.toLowerCase().includes(sparepartSearchQuery.toLowerCase())).map(sp => (
                                <button
                                  key={sp.id}
                                  type="button"
                                  onClick={() => handleAddSparepart(sp)}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff7ed'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{sp.name}</span>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ea580c' }}>{formatRupiah(sp.price)}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {!isDiproses && (
                  <div style={{ marginBottom: '0.75rem', padding: '0.625rem 0.875rem', borderRadius: '0.625rem', backgroundColor: selected.status === 'Selesai' ? '#f0fdf4' : selected.status === 'Menunggu Pembayaran' ? '#fff7ed' : '#f8fafc', border: `1px solid ${selected.status === 'Selesai' ? '#bbf7d0' : selected.status === 'Menunggu Pembayaran' ? '#fed7aa' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: selected.status === 'Selesai' ? '#166534' : selected.status === 'Menunggu Pembayaran' ? '#c2410c' : '#475569' }}>
                    {selected.status === 'Menunggu Pembayaran' ? (
                      <><Lock style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0 }} /><span><strong>Terkunci:</strong> Booking <em>Menunggu Pembayaran</em>. Sparepart tidak dapat diubah lagi.</span></>
                    ) : selected.status === 'Selesai' ? (
                      <><CheckCircle2 style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0 }} /><span><strong>Selesai:</strong> Pengerjaan servis telah selesai. Rincian bersifat permanen.</span></>
                    ) : (
                      <><AlertCircle style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0 }} /><span>Sparepart hanya dapat ditambahkan saat status <strong>Diproses</strong> (status: <em>{selected.status}</em>).</span></>
                    )}
                  </div>
                )}

                {loadingSpareparts ? (
                  <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>Memuat sparepart...</div>
                ) : bookingSpareparts.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
                    Belum ada sparepart ditambahkan
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {bookingSpareparts.map((item, idx) => (
                      <div key={idx} style={{ padding: '0.625rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#0f172a' }}>{item.name}</span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.5rem' }}>{formatRupiah(item.price)} / unit</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="number" min={1} disabled={!isDiproses} className="klesi-input" style={{ width: '3.5rem', padding: '0.25rem', fontSize: '0.75rem', textAlign: 'center' }} value={item.quantity} onChange={e => handleQuantityChange(idx, parseInt(e.target.value) || 1)} />
                            <span style={{ fontSize: '0.8125rem', fontWeight: 800, minWidth: '5.5rem', textAlign: 'right' }}>{formatRupiah(item.quantity * item.price)}</span>
                            {isDiproses && (
                              <button type="button" onClick={() => handleRemoveSparepart(idx)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }} title="Hapus"><X style={{ width: '1rem', height: '1rem' }} /></button>
                            )}
                          </div>
                        </div>
                        <input className="klesi-input" disabled={!isDiproses} style={{ width: '100%', padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} placeholder="Catatan part..." value={item.notes} onChange={e => handleNotesChange(idx, e.target.value)} />
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed #cbd5e1' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#475569' }}>Total Sparepart:</span>
                      <span style={{ fontSize: '1rem', fontWeight: 900, color: '#F97316' }}>{formatRupiah(totalSparepartsPrice)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Select */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="tb-label">Ubah Status Pengerjaan</label>
                <select className="klesi-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Menunggu Pembayaran">Menunggu Pembayaran (Cash)</option>
                  <option value="Selesai">Selesai (Sudah Dibayar)</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
                {selected.status === 'Menunggu Pembayaran' && (
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#ea580c', fontWeight: 600 }}>
                    ⚠️ Customer memilih bayar cash. Pastikan uang sudah diterima kasir sebelum memilih "Selesai".
                  </p>
                )}
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
