import { useState, useEffect } from 'react'
import {
  X,
  Wrench,
  Calendar,
  Car,
  FileText,
  MessageSquare,
  Package,
  CreditCard,
  Banknote,
  CheckCircle2,
  Receipt,
  AlertCircle,
} from 'lucide-react'
import { payWithMidtrans, payWithCash, getPaymentInfo } from './paymentService'
import type { PaymentDetails } from './paymentService'
import { getBookingSpareparts } from './userStorage'
import type { BookingSparepartItem } from './userStorage'

interface BookingDetailModalProps {
  booking: any
  onClose: () => void
  onPaymentSuccess?: () => void
}

export default function BookingDetailModal({
  booking,
  onClose,
  onPaymentSuccess,
}: BookingDetailModalProps) {
  const [parts, setParts] = useState<BookingSparepartItem[]>([])
  const [loadingParts, setLoadingParts] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<'midtrans' | 'cash'>('midtrans')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [paymentSuccessData, setPaymentSuccessData] = useState<PaymentDetails | null>(() =>
    booking ? getPaymentInfo(booking.booking_code || booking.id) : null
  )

  useEffect(() => {
    if (!booking) return
    const idOrCode = booking.booking_code || booking.id
    setLoadingParts(true)

    getBookingSpareparts(idOrCode)
      .then((data) => {
        if (data && data.length > 0) {
          setParts(data)
        } else if (booking.demoParts) {
          setParts(booking.demoParts)
        }
      })
      .finally(() => setLoadingParts(false))

    const handlePartsUpdate = (e: any) => {
      const match =
        String(e.detail?.bookingIdOrCode) === String(booking.id) ||
        String(e.detail?.bookingIdOrCode) === String(booking.booking_code)
      if (match && e.detail?.spareparts) {
        setParts(e.detail.spareparts)
      }
    }

    window.addEventListener('tb_booking_parts_updated', handlePartsUpdate)
    return () => window.removeEventListener('tb_booking_parts_updated', handlePartsUpdate)
  }, [booking])

  if (!booking) return null

  const isAlreadyDone = booking.status === 'Selesai' || Boolean(paymentSuccessData)
  const partsTotal = parts.reduce((acc, curr) => acc + Number(curr.price) * (curr.quantity || 1), 0)
  const servicePrice = Number(booking.service_price || 100000)
  const grandTotal = Number(booking.total_price) || servicePrice + partsTotal

  const handlePay = async () => {
    setIsProcessing(true)
    setErrorMessage(null)

    if (selectedMethod === 'midtrans') {
      const result = await payWithMidtrans({
        bookingId: booking.id,
        bookingCode: booking.booking_code,
        amount: grandTotal,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        serviceName: booking.service_name,
        parts: parts,
      })

      setIsProcessing(false)
      if (result.success) {
        setPaymentSuccessData(getPaymentInfo(booking.booking_code || booking.id))
        setPaymentModalOpen(false)
        if (onPaymentSuccess) onPaymentSuccess()
      } else if (result.message && !result.message.includes('ditutup')) {
        setErrorMessage(result.message)
      }
    } else {
      // Bayar Tunai di Kasir
      await payWithCash(booking.id, booking.booking_code, grandTotal)
      setIsProcessing(false)
      setPaymentSuccessData(getPaymentInfo(booking.booking_code || booking.id))
      setPaymentModalOpen(false)
      if (onPaymentSuccess) onPaymentSuccess()
    }
  }

  const getStatusBadge = (status: string) => {
    const isDone = status === 'Selesai' || Boolean(paymentSuccessData)
    const isProgress = !isDone && (status === 'Diproses' || status === 'Sedang Dikerjakan')
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.25rem 0.625rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          backgroundColor: isDone ? '#dcfce7' : isProgress ? '#eff6ff' : '#fff7ed',
          color: isDone ? '#15803d' : isProgress ? '#1d4ed8' : '#ea580c',
          border: `1px solid ${isDone ? '#bbf7d0' : isProgress ? '#bfdbfe' : '#ffedd5'}`,
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
        {isDone ? 'Selesai (Sudah Dibayar)' : status}
      </span>
    )
  }

  const waText = encodeURIComponent(
    `Halo ThunderBolt Garage, saya ingin bertanya update servis kendaraan:\n` +
      `• No. Booking: ${booking.booking_code}\n` +
      `• Kendaraan: ${booking.vehicle_model} (${booking.license_plate})\n` +
      `• Status: ${isAlreadyDone ? 'Selesai' : booking.status}\n` +
      `• Total: Rp ${grandTotal.toLocaleString('id-ID')}`
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          maxWidth: '580px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          padding: '1.75rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f97316', letterSpacing: '0.05em' }}>
              RINCIAN PESANAN & TAGIHAN
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              {booking.booking_code}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Pill */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Status saat ini:</span>
          {getStatusBadge(booking.status)}
        </div>

        {/* Vehicle & Schedule Info */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
            fontSize: '0.8125rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
            <Car size={16} color="#f97316" />
            <span>
              <strong>Kendaraan:</strong> {booking.vehicle_brand} {booking.vehicle_model} ({booking.license_plate})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
            <Calendar size={16} color="#f97316" />
            <span>
              <strong>Jadwal Servis:</strong> {booking.booking_date} • {booking.booking_time} WIB
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
            <Wrench size={16} color="#f97316" />
            <span>
              <strong>Layanan:</strong> {booking.service_name} (Rp {servicePrice.toLocaleString('id-ID')})
            </span>
          </div>
          {booking.notes && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#334155', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
              <FileText size={16} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>Catatan Keluhan:</strong> {booking.notes}
              </span>
            </div>
          )}
        </div>

        {/* Suku Cadang Terpasang */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={16} color="#f97316" />
            <span>Suku Cadang Yang Diganti ({parts.length} part)</span>
          </h4>

          {loadingParts ? (
            <div style={{ fontSize: '0.8125rem', color: '#94a3b8', padding: '0.5rem 0' }}>Memuat suku cadang...</div>
          ) : parts.length > 0 ? (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Nama Sparepart</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Harga</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#0f172a', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: '#64748b' }}>{p.quantity || 1}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#64748b' }}>
                        Rp {Number(p.price).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        Rp {(Number(p.price) * (p.quantity || 1)).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ fontSize: '0.8125rem', color: '#64748b', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
              Belum ada suku cadang tambahan yang ditambahkan oleh teknisi bengkel.
            </div>
          )}
        </div>

        {/* Breakdown Biaya */}
        <div
          style={{
            backgroundColor: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontSize: '0.8125rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
            <span>Jasa Servis ({booking.service_name})</span>
            <span style={{ fontWeight: 600 }}>Rp {servicePrice.toLocaleString('id-ID')}</span>
          </div>
          {partsTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Total Sparepart ({parts.length} item)</span>
              <span style={{ fontWeight: 600 }}>Rp {partsTotal.toLocaleString('id-ID')}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #fed7aa',
              paddingTop: '0.5rem',
              marginTop: '0.25rem',
            }}
          >
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9375rem' }}>Total Tagihan</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ea580c' }}>
              Rp {grandTotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Payment Status or Action */}
        {isAlreadyDone ? (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <CheckCircle2 size={24} color="#16a34a" />
            <div>
              <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#166534' }}>
                Pembayaran Lunas
              </h5>
              <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.75rem', color: '#15803d' }}>
                Metode: {paymentSuccessData?.channelName || (paymentSuccessData?.method === 'cash' ? 'Tunai / Cash di Bengkel' : 'Midtrans Snap')}
                {' • '}Status pesanan: <strong>Selesai</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={() => {
                setErrorMessage(null)
                setPaymentModalOpen(true)
              }}
              className="tb-btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.75rem 1rem',
                fontSize: '0.9375rem',
                fontWeight: 700,
              }}
            >
              <CreditCard size={18} />
              <span>Bayar Tagihan Sekarang (Rp {grandTotal.toLocaleString('id-ID')})</span>
            </button>
          </div>
        )}

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a
            href={`https://wa.me/6281319233748?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tb-btn-secondary"
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.8125rem' }}
          >
            <MessageSquare size={15} color="#22c55e" />
            <span>Tanya via WhatsApp</span>
          </a>

          <button
            onClick={onClose}
            className="tb-btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
          >
            Tutup
          </button>
        </div>

        {/* ========================================================= */}
        {/* MODAL PEMILIHAN CARA PEMBAYARAN MIDTRANS / CASH           */}
        {/* ========================================================= */}
        {paymentModalOpen && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              padding: '1.75rem',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>
                  Pilih Cara Pembayaran
                </h4>
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', backgroundColor: '#fff7ed', borderRadius: '0.5rem', border: '1px solid #ffedd5' }}>
                <span style={{ fontSize: '0.75rem', color: '#9a3412', display: 'block' }}>Total Tagihan Servis:</span>
                <span style={{ fontSize: '1.375rem', fontWeight: 900, color: '#ea580c' }}>
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Methods */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Midtrans Snap */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: `1.5px solid ${selectedMethod === 'midtrans' ? '#f97316' : '#e2e8f0'}`,
                    backgroundColor: selectedMethod === 'midtrans' ? '#fff7ed' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="method"
                    checked={selectedMethod === 'midtrans'}
                    onChange={() => setSelectedMethod('midtrans')}
                    style={{ accentColor: '#f97316' }}
                  />
                  <CreditCard size={22} color="#f97316" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
                      Midtrans Payment Gateway (Otomatis)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                      BCA, Mandiri, BNI, BRI Virtual Account, QRIS, GoPay, ShopeePay
                    </div>
                  </div>
                </label>

                {/* Bayar Cash */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: `1.5px solid ${selectedMethod === 'cash' ? '#f97316' : '#e2e8f0'}`,
                    backgroundColor: selectedMethod === 'cash' ? '#fff7ed' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="method"
                    checked={selectedMethod === 'cash'}
                    onChange={() => setSelectedMethod('cash')}
                    style={{ accentColor: '#f97316' }}
                  />
                  <Banknote size={22} color="#16a34a" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
                      Bayar Tunai / Cash di Bengkel
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                      Bayar langsung ke kasir bengkel saat mengambil kendaraan
                    </div>
                  </div>
                </label>
              </div>

              {errorMessage && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#e11d48', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#64748b' }}>
                <Receipt size={14} color="#f97316" />
                <span>Setelah pembayaran berhasil, status pengerjaan otomatis berubah menjadi <strong>Selesai</strong>.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="tb-btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                className="tb-btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {isProcessing
                  ? 'Membuka Midtrans...'
                  : selectedMethod === 'midtrans'
                  ? 'Buka Popup Midtrans'
                  : 'Konfirmasi Cash'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
