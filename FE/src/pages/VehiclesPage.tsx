import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Car, Trash2, Edit2, Plus, RefreshCw, X } from 'lucide-react'
import BrandLogo from '../components/BrandLogo'
import api from '../api/axios'

interface Vehicle {
  id: number
  user_id: number
  brand: string
  model: string
  year: number
  license_plate: string
  transmission: string | null
  owner_name: string
  owner_email: string
  created_at: string
}

interface UserItem {
  id: number
  name: string
  email: string
}

const initialForm = {
  user_id: 0,
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  license_plate: '',
  transmission: 'automatic'
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [usersList, setUsersList] = useState<UserItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [vRes, uRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/users').catch(() => ({ data: { data: [] } }))
      ])
      setVehicles(vRes.data.data || [])
      setUsersList(uRes.data.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase()
    return v.brand.toLowerCase().includes(q) ||
           v.model.toLowerCase().includes(q) ||
           v.license_plate.toLowerCase().includes(q) ||
           (v.owner_name && v.owner_name.toLowerCase().includes(q))
  })

  const openModal = (v?: Vehicle) => {
    if (v) {
      setEditingId(v.id)
      setFormData({
        user_id: v.user_id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        license_plate: v.license_plate,
        transmission: v.transmission || 'automatic'
      })
    } else {
      setEditingId(null)
      setFormData({ ...initialForm, user_id: usersList[0]?.id || 0 })
    }
    setIsModalOpen(true)
  }

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.brand || !formData.model || !formData.license_plate || !formData.user_id) return

    setSubmitting(true)
    try {
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, formData)
      } else {
        await api.post('/vehicles', formData)
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan kendaraan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kendaraan ini?')) return
    setDeletingId(id)
    try {
      await api.delete(`/vehicles/${id}`)
      setVehicles(prev => prev.filter(v => v.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
     
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>Kelola Kendaraan</h1>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', margin: '0.25rem 0 0 0' }}>Data armada dan spesifikasi kendaraan milik pelanggan bengkel</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="klesi-btn-ghost" onClick={fetchData}><RefreshCw style={{ width: '1rem', height: '1rem' }} /> Refresh</button>
          <button className="klesi-btn-primary" onClick={() => openModal()}><Plus style={{ width: '1.125rem', height: '1.125rem' }} /> Tambah Kendaraan</button>
        </div>
      </motion.div>

 
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#94a3b8' }} />
          <input
            className="klesi-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Cari merek, model, plat nomor, atau pemilik..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>{filtered.length} kendaraan terdaftar</span>
      </div>

    
      <div className="klesi-table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Memuat data kendaraan...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
            <Car style={{ width: '3rem', height: '3rem', opacity: 0.4, margin: '0 auto 0.75rem auto' }} />
            <p style={{ fontWeight: 800, color: '#475569', fontSize: '0.875rem' }}>Tidak ada data kendaraan</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="klesi-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Kendaraan</th>
                  <th>Tahun</th>
                  <th>Plat Nomor</th>
                  <th>Transmisi</th>
                  <th>Pemilik (Customer)</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => (
                  <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td style={{ color: '#94a3b8', fontWeight: 700 }}>#{v.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BrandLogo brand={v.brand} />
                        <div>
                          <p style={{ color: '#0f172a', fontWeight: 800, margin: 0 }}>{v.brand}</p>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{v.model}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#64748b', fontWeight: 700 }}>{v.year}</td>
                    <td>
                      <code style={{ fontSize: '0.75rem', fontWeight: 900, backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', color: '#0f172a' }}>
                        {v.license_plate}
                      </code>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          backgroundColor: v.transmission === 'automatic' ? '#eff6ff' : '#f8fafc',
                          color: v.transmission === 'automatic' ? '#2563eb' : '#64748b',
                          border: `1px solid ${v.transmission === 'automatic' ? '#dbeafe' : '#e2e8f0'}`,
                        }}
                      >
                        {v.transmission || '—'}
                      </span>
                    </td>
                    <td>
                      <p style={{ color: '#0f172a', fontWeight: 800, margin: 0 }}>{v.owner_name || `User #${v.user_id}`}</p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{v.owner_email}</p>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="klesi-btn-ghost"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.75rem' }}
                          onClick={() => openModal(v)}
                        >
                          <Edit2 style={{ width: '0.875rem', height: '0.875rem' }} /> Edit
                        </button>
                        <button
                          style={{ padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid #fecdd3', backgroundColor: '#fff1f2', color: '#e11d48', cursor: 'pointer' }}
                          onClick={() => handleDelete(v.id)}
                          disabled={deletingId === v.id}
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
        {isModalOpen && (
          <div className="klesi-modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="klesi-modal">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{editingId ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru'}</h3>
                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setIsModalOpen(false)}>
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pemilik (Pelanggan) *</label>
                  <select className="klesi-select" value={formData.user_id} onChange={e => updateForm('user_id', Number(e.target.value))} required>
                    <option value={0} disabled>-- Pilih Pelanggan --</option>
                    {usersList.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Merek (Brand) *</label>
                    <input className="klesi-input" type="text" required placeholder="Toyota / Honda" value={formData.brand} onChange={e => updateForm('brand', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model *</label>
                    <input className="klesi-input" type="text" required placeholder="Avanza / Civic" value={formData.model} onChange={e => updateForm('model', e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plat Nomor *</label>
                    <input className="klesi-input" type="text" required placeholder="B 1234 ABC" value={formData.license_plate} onChange={e => updateForm('license_plate', e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tahun Pembuatan *</label>
                    <input className="klesi-input" type="number" required min={1990} max={2030} value={formData.year} onChange={e => updateForm('year', Number(e.target.value))} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jenis Transmisi</label>
                  <select className="klesi-select" value={formData.transmission} onChange={e => updateForm('transmission', e.target.value)}>
                    <option value="automatic">Automatic (Matic)</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" className="klesi-btn-ghost" onClick={() => setIsModalOpen(false)}>Batal</button>
                  <button type="submit" className="klesi-btn-primary" disabled={submitting}>
                    {submitting ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Tambah Kendaraan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
