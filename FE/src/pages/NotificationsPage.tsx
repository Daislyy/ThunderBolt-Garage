import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, Trash2, RefreshCw, Bookmark } from 'lucide-react'
import api from '../api/axios'

interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: string
  reference_id: number | null
  is_read: boolean
  created_at: string
}

const typeConfig: Record<string, { color: string; label: string; bg: string }> = {
  booking:        { color: '#2563eb', label: 'Booking', bg: '#eff6ff' },
  booking_status: { color: '#ea580c', label: 'Status', bg: '#fff7ed' },
  system:         { color: '#7c3aed', label: 'Sistem', bg: '#f5f3ff' },
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAllNotifs = async () => {
    setLoading(true)
    try {
      const usersRes = await api.get('/users')
      const users: { id: number }[] = usersRes.data.data || []
      const allNotifs: Notification[] = []
      for (const u of users.slice(0, 20)) {
        try {
          const res = await api.get(`/notifications/user/${u.id}`)
          if (res.data.data) allNotifs.push(...res.data.data)
        } catch { /* skip */ }
      }
      const unique = Array.from(new Map(allNotifs.map(n => [n.id, n])).values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setNotifs(unique)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllNotifs()
  }, [])

  const handleMarkRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch { /* ignore */ }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus notifikasi ini?')) return
    try {
      await api.delete(`/notifications/${id}`)
      setNotifs(prev => prev.filter(n => n.id !== id))
    } catch { /* ignore */ }
  }

  const unreadCount = notifs.filter(n => !n.is_read).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>Notifikasi Sistem</h1>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', margin: '0.25rem 0 0 0' }}>Riwayat pemberitahuan dan log aktivitas dari seluruh pelanggan</p>
        </div>
        <button className="klesi-btn-ghost" onClick={fetchAllNotifs}>
          <RefreshCw style={{ width: '1rem', height: '1rem' }} /> Refresh
        </button>
      </motion.div>


      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {unreadCount > 0 && (
          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#F97316', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', padding: '0.25rem 0.75rem', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {unreadCount} Belum Dibaca
          </span>
        )}
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>{notifs.length} total notifikasi</span>
      </div>

  
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Memuat notifikasi...</div>
      ) : notifs.length === 0 ? (
        <div className="klesi-card" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
          <Bell style={{ width: '3rem', height: '3rem', opacity: 0.4, margin: '0 auto 0.75rem auto' }} />
          <p style={{ fontWeight: 800, color: '#475569', fontSize: '0.875rem' }}>Tidak ada riwayat notifikasi</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {notifs.map((n, i) => {
            const tc = typeConfig[n.type] ?? { color: '#64748b', label: n.type, bg: '#f8fafc' }
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  backgroundColor: n.is_read ? '#FFFFFF' : '#fffcf9',
                  border: `1px solid ${n.is_read ? '#f1f5f9' : '#ffedd5'}`,
                  borderRadius: '1.25rem',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  boxShadow: n.is_read ? '0 4px 6px -1px rgba(0,0,0,0.02)' : '0 10px 15px -3px rgba(249, 115, 22, 0.08)',
                }}
              >
             
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    backgroundColor: tc.bg,
                    color: tc.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '0.125rem',
                  }}
                >
                  {n.is_read ? <CheckCheck style={{ width: '1.25rem', height: '1.25rem' }} /> : <Bookmark style={{ width: '1.25rem', height: '1.25rem' }} />}
                </div>

       
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9375rem' }}>{n.title}</span>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 900,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: tc.bg,
                        color: tc.color,
                        border: `1px solid ${tc.color}30`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {tc.label}
                    </span>
                    {!n.is_read && (
                      <span style={{ fontSize: '0.625rem', fontWeight: 900, padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: '#F97316', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        BARU
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>{n.message}</p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                    <span>User #{n.user_id}</span>
                    <span>{new Date(n.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {!n.is_read && (
                    <button
                      className="klesi-btn-ghost"
                      style={{ padding: '0.5rem', borderRadius: '0.75rem' }}
                      title="Tandai Sudah Dibaca"
                      onClick={() => handleMarkRead(n.id)}
                    >
                      <CheckCheck style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  )}
                  <button
                    style={{ padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid #fecdd3', backgroundColor: '#fff1f2', color: '#e11d48', cursor: 'pointer' }}
                    title="Hapus Notifikasi"
                    onClick={() => handleDelete(n.id)}
                  >
                    <Trash2 style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
