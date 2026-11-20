import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Wrench, Trash2, Edit2, Plus, RefreshCw, X } from 'lucide-react'
import {
  fetchAllServices,
  addGarageService,
  updateGarageService,
  deleteGarageService,
} from '../user/dashboard/serviceStorage'
import type { GarageService } from '../user/dashboard/serviceStorage'

const initialForm = { name: '', description: '', price: '100000' }

export default function ServicesPage() {
  const [services, setServices] = useState<GarageService[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchServices = async () => {
    setLoading(true)
    try {
      const data = await fetchAllServices()
      setServices(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()

    const handleUpdate = () => {
      fetchServices()
    }
    window.addEventListener('tb_services_updated', handleUpdate)
    return () => window.removeEventListener('tb_services_updated', handleUpdate)
  }, [])

  const filtered = services.filter((s) => {
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))
  })

  const updateForm = (key: string, val: any) => setFormData((p) => ({ ...p, [key]: val }))

  const openModal = (s?: GarageService) => {
    if (s) {
      setEditingId(s.id)
      setFormData({
        name: s.name,
        description: s.description || '',
        price: String(s.price !== undefined && s.price !== null ? s.price : 100000),
      })
    } else {
      setEditingId(null)
      setFormData(initialForm)
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price) || 0,
      }
      if (editingId) {
        await updateGarageService(editingId, payload)
      } else {
        await addGarageService(payload)
      }
      setIsModalOpen(false)
      await fetchServices()
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan layanan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus layanan ini?')) return
    setDeletingId(id)
    try {
      await deleteGarageService(id)
      setServices((p) => p.filter((s) => s.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>
            Kelola Layanan
          </h1>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Daftar paket perbaikan & estimasi harga servis kendaraan
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="klesi-btn-ghost" onClick={fetchServices}>
            <RefreshCw style={{ width: '1rem', height: '1rem' }} /> Refresh
          </button>
          <button className="klesi-btn-primary" onClick={() => openModal()}>
            <Plus style={{ width: '1.125rem', height: '1.125rem' }} /> Tambah Layanan
          </button>
        </div>
      </motion.div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '1rem',
              height: '1rem',
              color: '#94a3b8',
            }}
          />
          <input
            className="klesi-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Cari jenis layanan atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>
          {filtered.length} layanan terdaftar
        </span>
      </div>

      <div className="klesi-table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Memuat data layanan...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
            <Wrench style={{ width: '3rem', height: '3rem', opacity: 0.4, margin: '0 auto 0.75rem auto' }} />
            <p style={{ fontWeight: 800, color: '#475569', fontSize: '0.875rem' }}>Belum ada layanan terdaftar</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="klesi-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Nama Layanan</th>
                  <th>Deskripsi</th>
                  <th>Estimasi</th>
                  <th>Dibuat Pada</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td style={{ color: '#94a3b8', fontWeight: 700 }}>#{String(s.id).slice(-4)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '2.25rem',
                            height: '2.25rem',
                            borderRadius: '0.75rem',
                            backgroundColor: '#fff7ed',
                            border: '1px solid #ffedd5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#F97316',
                          }}
                        >
                          <Wrench style={{ width: '1rem', height: '1rem' }} />
                        </div>
                        <span style={{ color: '#0f172a', fontWeight: 800 }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#64748b', maxWidth: '340px' }}>
                      {s.description || <i style={{ color: '#cbd5e1' }}>Tidak ada deskripsi</i>}
                    </td>
                    <td style={{ color: '#ea580c', fontWeight: 700, fontSize: '0.8125rem' }}>
                      Rp {Number(s.price || 100000).toLocaleString('id-ID')}
                    </td>
                    <td style={{ color: '#64748b', fontWeight: 600 }}>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="klesi-btn-ghost"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.75rem' }}
                          onClick={() => openModal(s)}
                        >
                          <Edit2 style={{ width: '0.875rem', height: '0.875rem' }} /> Edit
                        </button>
                        <button
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.75rem',
                            border: '1px solid #fecdd3',
                            backgroundColor: '#fff1f2',
                            color: '#e11d48',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
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
          <div className="klesi-modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="klesi-modal">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  {editingId ? 'Edit Layanan' : 'Tambah Layanan Baru'}
                </h3>
                <button
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                  onClick={() => setIsModalOpen(false)}
                >
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#64748b',
                      marginBottom: '0.375rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Nama Layanan *
                  </label>
                  <input
                    className="klesi-input"
                    type="text"
                    required
                    placeholder="Contoh: Servis Berkala / Tune Up"
                    value={formData.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#64748b',
                      marginBottom: '0.375rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Estimasi Biaya / Harga (Rp) *
                  </label>
                  <input
                    className="klesi-input"
                    type="number"
                    min="0"
                    step="1000"
                    required
                    placeholder="Contoh: 100000"
                    value={formData.price}
                    onChange={(e) => updateForm('price', e.target.value)}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#64748b',
                      marginBottom: '0.375rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Deskripsi Layanan
                  </label>
                  <textarea
                    className="klesi-input"
                    rows={3}
                    placeholder="Jelaskan cakupan pengerjaan dan fasilitas servis…"
                    value={formData.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" className="klesi-btn-ghost" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </button>
                  <button type="submit" className="klesi-btn-primary" disabled={submitting}>
                    {submitting ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Tambah Layanan'}
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
