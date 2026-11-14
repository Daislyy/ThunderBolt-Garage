import { useState, useEffect, useMemo } from 'react'
import { Package, Search, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react'
import api from '../api/axios'

interface SparepartItem {
  id: number
  name: string
  category: string
  price: number
  stock: number
  brand?: string
}

const defaultSpareparts: SparepartItem[] = [
  { id: 1, name: 'Oli Mesin Synthetic 10W-40 (1L)', category: 'Oli & Pelumas', price: 95000, stock: 24, brand: 'Motul / Shell' },
  { id: 2, name: 'Oli Gardan / Transmisi Matik (120ml)', category: 'Oli & Pelumas', price: 25000, stock: 35, brand: 'OEM Genuine' },
  { id: 3, name: 'Kampas Rem Cakram Depan (Brake Pad)', category: 'Pengereman', price: 65000, stock: 18, brand: 'Nissin / Daytona' },
  { id: 4, name: 'Kampas Rem Tromol Belakang', category: 'Pengereman', price: 55000, stock: 12, brand: 'OEM Genuine' },
  { id: 5, name: 'Busi Iridium Racing / Standar', category: 'Mesin & Penggerak', price: 45000, stock: 30, brand: 'NGK / Denso' },
  { id: 6, name: 'V-Belt & Roller CVT Set', category: 'Mesin & Penggerak', price: 175000, stock: 8, brand: 'Bando / Gates' },
  { id: 7, name: 'Aki Kering Bebas Perawatan 12V 5Ah', category: 'Kelistrikan', price: 245000, stock: 9, brand: 'GS Astra / Yuasa' },
  { id: 8, name: 'Filter Udara Mesin (Air Filter)', category: 'Mesin & Penggerak', price: 40000, stock: 22, brand: 'OEM Genuine' },
]

export default function UserSpareparts() {
  const [items, setItems] = useState<SparepartItem[]>(defaultSpareparts)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  const categories = ['Semua', 'Oli & Pelumas', 'Pengereman', 'Mesin & Penggerak', 'Kelistrikan']

  useEffect(() => {
    api
      .get('/spareparts')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((item: any, idx: number) => ({
            id: item.id || idx + 1,
            name: item.name,
            category: item.category || defaultSpareparts[idx % defaultSpareparts.length].category,
            price: Number(item.price) || 50000,
            stock: item.stock !== undefined ? Number(item.stock) : 15,
            brand: item.brand || 'Original Part',
          }))
          setItems(mapped)
        }
      })
      .catch(() => {
        // Keep default list
      })
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(search.toLowerCase()))
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory
      return matchSearch && matchCat
    })
  }, [items, search, selectedCategory])

  return (
    <section id="sparepart" className="tb-section" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
      <div className="tb-container">
        <div className="tb-section-header">
          <div className="tb-badge">Suku Cadang Asli</div>
          <h2 className="tb-section-title">Katalog Sparepart & Pelumas</h2>
          <p className="tb-section-desc">
            Cek ketersediaan suku cadang dan pelumas di bengkel. Seluruh barang dijamin keasliannya dan bergaransi pasang.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.4375rem 0.875rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: selectedCategory === cat ? '#f97316' : '#e2e8f0',
                    backgroundColor: selectedCategory === cat ? '#fff7ed' : '#ffffff',
                    color: selectedCategory === cat ? '#ea580c' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Cari suku cadang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="tb-input"
                style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
              />
            </div>
          </div>
        </div>

        {/* Spareparts Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {filteredItems.map((part) => (
            <div key={part.id} className="tb-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#64748b',
                    backgroundColor: '#f1f5f9',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                  }}
                >
                  {part.category}
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: part.stock > 0 ? '#15803d' : '#b91c1c',
                    backgroundColor: part.stock > 0 ? '#dcfce7' : '#fee2e2',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                  }}
                >
                  {part.stock > 0 ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                  {part.stock > 0 ? `Tersedia (${part.stock})` : 'Habis'}
                </span>
              </div>

              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                {part.name}
              </h4>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Merk: {part.brand || 'OEM'}</p>

              <div
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block' }}>Harga Satuan</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    Rp {part.price.toLocaleString('id-ID')}
                  </span>
                </div>

                <a
                  href={`https://wa.me/6281319233748?text=${encodeURIComponent(`Halo ThunderBolt Garage, apakah sparepart "${part.name}" ready stok?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tb-btn-secondary"
                  style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                  title="Tanyakan via WhatsApp"
                >
                  <span>Tanya</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
              <Package size={36} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>Suku cadang yang Anda cari tidak ditemukan.</p>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Hubungi kami via WhatsApp untuk pemesanan suku cadang khusus.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

