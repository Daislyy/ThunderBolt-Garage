import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Package, Trash2, Edit2, Plus, RefreshCw, X } from 'lucide-react'
import api from '../api/axios'

interface SparepartItem {
  id: number
  name: string
  price: number
  created_at?: string
}

const initialForm = { name: '', price: '' }

const formatCurrency = (val: number | string): string => {
  const num = Number(val)
  if (isNaN(num)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export default function SparepartsPage() {
  const [spareparts, setSpareparts] = useState<SparepartItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchSpareparts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/spareparts')
      setSpareparts(res.data.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpareparts()
  }, [])

  const filtered = spareparts.filter(sp =>
    sp.name.toLowerCase().includes(search.toLowerCase())
  )

  const openModal = (sp?: SparepartItem) => {
    if (sp) {
      setEditingId(sp.id)
      setFormData({ name: sp.name, price: String(sp.price) })
    } else {
      setEditingId(null)
      setFormData(initialForm)
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    const priceNum = Number(formData.price)
    if (isNaN(priceNum) || priceNum < 0) {
      alert('Harga harus berupa angka valid (>= 0)')
      return
    }

    setSubmitting(true)
    try {
      if (editingId) {
        await api.put(`/spareparts/${editingId}`, { name: formData.name.trim(), price: priceNum })
      } else {
        await api.post('/spareparts', { name: formData.name.trim(), price: priceNum })
      }
      setIsModalOpen(false)
      fetchSpareparts()
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menyimpan sparepart')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus sparepart ini?')) return
    setDeletingId(id)
    try {
      await api.delete(`/spareparts/${id}`)
      setSpareparts(p => p.filter(s => s.id !== id))
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menghapus sparepart')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>
            Kelola Sparepart
          </h1>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Daftar suku cadang dan pengaturan harga satuan bengkel
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="klesi-btn-ghost" onClick={fetchSpareparts}>
            <RefreshCw style={{ width: '1rem', height: '1rem' }} /> Refresh
          </button>
          <button className="klesi-btn-primary" onClick={() => openModal()}>
            <Plus style={{ width: '1.125rem', height: '1.125rem' }} /> Tambah Sparepart
          </button>
        </div>
      </motion.div>

      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#94a3b8' }} />
          <input
            className="klesi-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Cari nama sparepart..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>
          {filtered.length} sparepart terdaftar
        </span>
      </div>

      {/* Table */}
      <div className="klesi-table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Memuat data sparepart...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
            <Package style={{ width: '3rem', height: '3rem', opacity: 0.4, margin: '0 auto 0.75rem auto' }} />
            <p style={{ fontWeight: 800, color: '#475569', fontSize: '0.875rem' }}>Belum ada sparepart terdaftar</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="klesi-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Nama Sparepart</th>
                  <th style={{ textAlign: 'right' }}>Harga Satuan</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sp, i) => (
                  <motion.tr key={sp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <td style={{ color: '#94a3b8', fontWeight: 700 }}>#{sp.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.75rem', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316' }}>
                          <Package style={{ width: '1rem', height: '1rem' }} />
                        </div>
                        <span style={{ color: '#0f172a', fontWeight: 800 }}>{sp.name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-block', padding: '0.25rem 0.625rem', borderRadius: '0.5rem', backgroundColor: '#fff7ed', color: '#ea580c', fontWeight: 800, fontSize: '0.875rem', border: '1px solid #ffedd5' }}>
                        {formatCurrency(sp.price)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="klesi-btn-ghost"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.75rem' }}
                          onClick={() => openModal(sp)}
                        >
                          <Edit2 style={{ width: '0.875rem', height: '0.875rem' }} /> Edit
                        </button>
                        <button
                          style={{ padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid #fecdd3', backgroundColor: '#fff1f2', color: '#e11d48', cursor: 'pointer' }}
                          onClick={() => handleDelete(sp.id)}
                          disabled={deletingId === sp.id}
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

      {/* Modal Tambah / Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="klesi-modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="klesi-modal">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  {editingId ? 'Edit Sparepart' : 'Tambah Sparepart Baru'}
                </h3>
                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setIsModalOpen(false)}>
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Nama Sparepart *
                  </label>
                  <input
                    className="klesi-input"
                    type="text"
                    required
                    placeholder="Contoh: Oli Mesin 1L / Kampas Rem"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Harga Satuan (Rp) *
                  </label>
                  <input
                    className="klesi-input"
                    type="number"
                    min="0"
                    step="500"
                    required
                    placeholder="Contoh: 85000"
                    value={formData.price}
                    onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                  />
                  {formData.price !== '' && !isNaN(Number(formData.price)) && (
                    <p style={{ margin: '0.375rem 0 0 0', fontSize: '0.75rem', color: '#ea580c', fontWeight: 700 }}>
                      Format: {formatCurrency(formData.price)}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" className="klesi-btn-ghost" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </button>
                  <button type="submit" className="klesi-btn-primary" disabled={submitting}>
                    {submitting ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Tambah Sparepart'}
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
