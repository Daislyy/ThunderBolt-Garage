import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, Trash2, RefreshCw, X, Eye, MessageSquare, TrendingUp } from 'lucide-react'
import api from '../api/axios'

interface RatingItem {
  id: number
  booking_id: number
  user_id: number
  service_id: number
  rating: number
  review: string | null
  created_at: string
  customer_name: string
  customer_email: string
  service_name: string
  booking_code: string
}

function StarRating({ value, size = '1rem' }: { value: number; size?: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.125rem' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          style={{
            width: size,
            height: size,
            fill: star <= value ? '#f59e0b' : 'transparent',
            color: star <= value ? '#f59e0b' : '#e2e8f0',
            transition: 'all 0.2s ease',
          }}
        />
      ))}
    </div>
  )
}

export default function RatingsPage() {
  const [ratings, setRatings] = useState<RatingItem[]>([])
  const [search, setSearch] = useState('')
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [detailRating, setDetailRating] = useState<RatingItem | null>(null)

  const fetchRatings = async () => {
    setLoading(true)
    try {
      setRatings((await api.get('/ratings')).data.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRatings() }, [])

  const filtered = ratings.filter((r) => {
    const q = search.toLowerCase()
    const matchesSearch =
      r.customer_name.toLowerCase().includes(q) ||
      r.service_name.toLowerCase().includes(q) ||
      r.booking_code.toLowerCase().includes(q) ||
      (r.review && r.review.toLowerCase().includes(q))
    const matchesRating = filterRating === null || r.rating === filterRating
    return matchesSearch && matchesRating
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus rating ini?')) return
    setDeletingId(id)
    try {
      await api.delete(`/ratings/${id}`)
      setRatings((p) => p.filter((r) => r.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  // Stats calculations
  const totalRatings = ratings.length
  const avgRating = totalRatings > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
    : '0.0'
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratings.filter((r) => r.rating === star).length,
    percent: totalRatings > 0
      ? Math.round((ratings.filter((r) => r.rating === star).length / totalRatings) * 100)
      : 0,
  }))

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
            Kelola Rating & Review
          </h1>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Lihat ulasan dan penilaian pelanggan terhadap layanan bengkel
          </p>
        </div>
        <button className="klesi-btn-ghost" onClick={fetchRatings}>
          <RefreshCw style={{ width: '1rem', height: '1rem' }} /> Refresh
        </button>
      </motion.div>

      {/* Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Average Rating Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1.5rem',
            padding: '1.5rem',
            border: '1px solid #f1f5f9',
            boxShadow: '0 10px 25px -5px rgba(226, 232, 240, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                backgroundColor: '#fffbeb',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Star style={{ width: '1.25rem', height: '1.25rem', fill: '#f59e0b' }} />
            </div>
            <span style={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Rating Rata-rata
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.05em', margin: 0 }}>
              {loading ? '…' : avgRating}
            </p>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#94a3b8' }}>/ 5.0</span>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <StarRating value={Math.round(Number(avgRating))} size="0.875rem" />
          </div>
        </motion.div>

        {/* Total Reviews Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1.5rem',
            padding: '1.5rem',
            border: '1px solid #f1f5f9',
            boxShadow: '0 10px 25px -5px rgba(226, 232, 240, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                backgroundColor: '#f5f3ff',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <span style={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Total Review
            </span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.05em', margin: 0 }}>
            {loading ? '…' : totalRatings}
          </p>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', margin: '0.25rem 0 0 0' }}>
            {ratings.filter((r) => r.review).length} dengan ulasan tertulis
          </p>
        </motion.div>

        {/* Rating Distribution Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1.5rem',
            padding: '1.5rem',
            border: '1px solid #f1f5f9',
            boxShadow: '0 10px 25px -5px rgba(226, 232, 240, 0.6)',
            gridColumn: 'span 1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                backgroundColor: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <span style={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Distribusi Bintang
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {ratingDistribution.map((d) => (
              <div key={d.star} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', width: '0.75rem', textAlign: 'right' }}>
                  {d.star}
                </span>
                <Star style={{ width: '0.75rem', height: '0.75rem', fill: '#f59e0b', color: '#f59e0b' }} />
                <div
                  style={{
                    flex: 1,
                    height: '0.375rem',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${d.percent}%` }}
                    transition={{ duration: 0.6, delay: (5 - d.star) * 0.1 }}
                    style={{
                      height: '100%',
                      backgroundColor: d.star >= 4 ? '#10b981' : d.star === 3 ? '#f59e0b' : '#ef4444',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#94a3b8', width: '2rem', textAlign: 'right' }}>
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px', minWidth: '200px' }}>
            <Search
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#94a3b8' }}
            />
            <input
              className="klesi-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Cari nama pelanggan, layanan, atau kode booking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="klesi-select"
            value={filterRating ?? ''}
            onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Semua Bintang</option>
            <option value="5">⭐ 5 Bintang</option>
            <option value="4">⭐ 4 Bintang</option>
            <option value="3">⭐ 3 Bintang</option>
            <option value="2">⭐ 2 Bintang</option>
            <option value="1">⭐ 1 Bintang</option>
          </select>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>
          {filtered.length} ulasan ditemukan
        </span>
      </div>

      {/* Table */}
      <div className="klesi-table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Memuat data rating...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
            <Star style={{ width: '3rem', height: '3rem', opacity: 0.4, margin: '0 auto 0.75rem auto' }} />
            <p style={{ fontWeight: 800, color: '#475569', fontSize: '0.875rem' }}>Belum ada rating terdaftar</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="klesi-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Customer</th>
                  <th>Layanan</th>
                  <th>Kode Booking</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Tanggal</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td style={{ color: '#94a3b8', fontWeight: 700 }}>#{r.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '2.25rem',
                            height: '2.25rem',
                            borderRadius: '0.75rem',
                            backgroundColor: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '0.75rem',
                            color: '#64748b',
                            flexShrink: 0,
                          }}
                        >
                          {r.customer_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ color: '#0f172a', fontWeight: 800, display: 'block', fontSize: '0.875rem' }}>{r.customer_name}</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{r.customer_email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#F97316' }}>{r.service_name}</span>
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 900,
                          color: '#F97316',
                          backgroundColor: '#fff7ed',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #ffedd5',
                        }}
                      >
                        {r.booking_code}
                      </code>
                    </td>
                    <td>
                      <StarRating value={r.rating} size="0.875rem" />
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      {r.review ? (
                        <p
                          style={{
                            color: '#64748b',
                            fontSize: '0.8125rem',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '240px',
                          }}
                        >
                          {r.review}
                        </p>
                      ) : (
                        <i style={{ color: '#cbd5e1', fontSize: '0.8125rem' }}>Tidak ada ulasan</i>
                      )}
                    </td>
                    <td style={{ color: '#64748b', fontWeight: 600 }}>
                      {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="klesi-btn-ghost"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.75rem' }}
                          onClick={() => setDetailRating(r)}
                        >
                          <Eye style={{ width: '0.875rem', height: '0.875rem' }} /> Detail
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
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
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

      {/* Detail Modal */}
      <AnimatePresence>
        {detailRating && (
          <div className="klesi-modal-overlay" onClick={(e) => e.target === e.currentTarget && setDetailRating(null)}>
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="klesi-modal"
              style={{ maxWidth: '560px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Detail Rating & Review</h3>
                <button
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                  onClick={() => setDetailRating(null)}
                >
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              {/* Customer Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div
                  style={{
                    width: '2.75rem',
                    height: '2.75rem',
                    borderRadius: '0.875rem',
                    backgroundColor: '#0f172a',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                >
                  {detailRating.customer_name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: '0.9375rem' }}>{detailRating.customer_name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.125rem 0 0 0' }}>{detailRating.customer_email}</p>
                </div>
                <StarRating value={detailRating.rating} size="1.125rem" />
              </div>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Layanan
                  </label>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F97316', margin: 0 }}>{detailRating.service_name}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Kode Booking
                  </label>
                  <code
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 900,
                      color: '#F97316',
                      backgroundColor: '#fff7ed',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #ffedd5',
                    }}
                  >
                    {detailRating.booking_code}
                  </code>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Rating
                  </label>
                  <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    {detailRating.rating}<span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#94a3b8' }}>/5</span>
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Tanggal
                  </label>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', margin: 0 }}>
                    {new Date(detailRating.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Review */}
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Ulasan Pelanggan
                </label>
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '1rem',
                    border: '1px solid #f1f5f9',
                    minHeight: '4rem',
                  }}
                >
                  {detailRating.review ? (
                    <p style={{ color: '#334155', fontSize: '0.875rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                      "{detailRating.review}"
                    </p>
                  ) : (
                    <p style={{ color: '#cbd5e1', fontSize: '0.875rem', fontStyle: 'italic', margin: 0 }}>
                      Pelanggan tidak memberikan ulasan tertulis.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button className="klesi-btn-ghost" onClick={() => setDetailRating(null)}>Tutup</button>
                <button
                  className="klesi-btn-primary"
                  style={{ backgroundColor: '#e11d48', boxShadow: '0 10px 20px -5px rgba(225, 29, 72, 0.3)' }}
                  onClick={() => {
                    handleDelete(detailRating.id)
                    setDetailRating(null)
                  }}
                >
                  <Trash2 style={{ width: '1rem', height: '1rem' }} /> Hapus Rating
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
