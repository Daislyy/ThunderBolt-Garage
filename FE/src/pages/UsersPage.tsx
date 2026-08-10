import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Trash2, Edit2, Plus, Shield, User, RefreshCw, X } from 'lucide-react'
import api from '../api/axios'

interface UserRow { id: number; name: string; email: string; role: 'admin' | 'customer'; profile_image: string | null; created_at: string }

const initialForm = { name: '', email: '', password: '', role: 'customer' as 'customer' | 'admin' }

const getProfileImageUrl = (profileImage: string | null | undefined): string => {
  if (!profileImage) return '';
  if (profileImage.startsWith('http://') || profileImage.startsWith('https://') || profileImage.startsWith('data:')) {
    return profileImage;
  }
  return `http://localhost:5000${profileImage}`;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try { setUsers((await api.get('/users')).data.data || []) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  const updateForm = (key: string, val: any) => setFormData(p => ({ ...p, [key]: val }))

  const openModal = (u?: UserRow) => {
    if (u) {
      setEditingId(u.id)
      setFormData({ name: u.name, email: u.email, password: '', role: u.role })
    } else {
      setEditingId(null)
      setFormData(initialForm)
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, { name: formData.name, email: formData.email, role: formData.role })
      } else {
        await api.post('/users', { ...formData, password: formData.password || '123456' })
      }

      setIsModalOpen(false)
      fetchUsers()
    } catch (err: any) { alert(err.response?.data?.message || err.message || 'Gagal menyimpan') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus pelanggan ini?')) return
    setDeletingId(id)
    try { await api.delete(`/users/${id}`); setUsers(p => p.filter(u => u.id !== id)) }
    finally { setDeletingId(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>Kelola Pelanggan</h1>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', margin: '0.25rem 0 0 0' }}>Manajemen data akun pelanggan terdaftar dan peranan akses</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="klesi-btn-ghost" onClick={fetchUsers}><RefreshCw style={{ width: '1rem', height: '1rem' }} /> Refresh</button>
          <button className="klesi-btn-primary" onClick={() => openModal()}><Plus style={{ width: '1.125rem', height: '1.125rem' }} /> Tambah User</button>
        </div>
      </motion.div>

  
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#94a3b8' }} />
          <input
            className="klesi-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Cari nama pelanggan atau email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>{filtered.length} pengguna terdaftar</span>
      </div>

      <div className="klesi-table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Memuat data pelanggan...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
            <Users style={{ width: '3rem', height: '3rem', opacity: 0.4, margin: '0 auto 0.75rem auto' }} />
            <p style={{ fontWeight: 800, color: '#475569', fontSize: '0.875rem' }}>Tidak ada data pelanggan</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="klesi-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Nama Lengkap</th>
                  <th>Email</th>
                  <th>Peranan (Role)</th>
                  <th>Tanggal Terdaftar</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td style={{ color: '#94a3b8', fontWeight: 700 }}>#{u.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '2.25rem',
                            height: '2.25rem',
                            borderRadius: '0.75rem',
                            backgroundColor: '#0f172a',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '0.8125rem',
                            boxShadow: '0 4px 10px rgba(15, 23, 42, 0.1)',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {u.profile_image ? (
                            <img src={getProfileImageUrl(u.profile_image)} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            u.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span style={{ color: '#0f172a', fontWeight: 800 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#64748b', fontWeight: 600 }}>{u.email}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          backgroundColor: u.role === 'admin' ? '#fff7ed' : '#eff6ff',
                          color: u.role === 'admin' ? '#ea580c' : '#2563eb',
                          border: `1px solid ${u.role === 'admin' ? '#ffedd5' : '#dbeafe'}`,
                        }}
                      >
                        {u.role === 'admin' ? <Shield style={{ width: '0.75rem', height: '0.75rem' }} /> : <User style={{ width: '0.75rem', height: '0.75rem' }} />}
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontWeight: 600 }}>{new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="klesi-btn-ghost"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.75rem' }}
                          onClick={() => openModal(u)}
                        >
                          <Edit2 style={{ width: '0.875rem', height: '0.875rem' }} /> Edit
                        </button>
                        <button
                          style={{ padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid #fecdd3', backgroundColor: '#fff1f2', color: '#e11d48', cursor: 'pointer' }}
                          onClick={() => handleDelete(u.id)}
                          disabled={deletingId === u.id}
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
                <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{editingId ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}</h3>
                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setIsModalOpen(false)}>
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Lengkap *</label>
                  <input className="klesi-input" type="text" required placeholder="Ahmad Subagyo" value={formData.name} onChange={e => updateForm('name', e.target.value)} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email *</label>
                  <input className="klesi-input" type="email" required placeholder="nama@email.com" value={formData.email} onChange={e => updateForm('email', e.target.value)} />
                </div>

                {!editingId && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password *</label>
                    <input className="klesi-input" type="password" required placeholder="Masukkan password" value={formData.password} onChange={e => updateForm('password', e.target.value)} />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peranan (Role)</label>
                  <select className="klesi-select" value={formData.role} onChange={e => updateForm('role', e.target.value)}>
                    <option value="customer">Customer (Pelanggan)</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" className="klesi-btn-ghost" onClick={() => setIsModalOpen(false)}>Batal</button>
                  <button type="submit" className="klesi-btn-primary" disabled={submitting}>
                    {submitting ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
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


