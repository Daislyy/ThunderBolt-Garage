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
  Printer,
  Star,
} from 'lucide-react'
import { payWithMidtrans, payWithCash, getPaymentInfo } from './paymentService'
import type { PaymentDetails } from './paymentService'
import {
  getBookingSpareparts,
  updateSharedBookingStatus,
  submitServiceRating,
  getBookingRating,
} from './userStorage'
import type { BookingSparepartItem, ServiceRatingRecord } from './userStorage'
import api from '../../api/axios'

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
  const [showReceipt, setShowReceipt] = useState(false)
  const [paymentSuccessData, setPaymentSuccessData] = useState<PaymentDetails | null>(() =>
    booking ? getPaymentInfo(booking.booking_code || booking.id) : null
  )

  // Customer Rating states
  const [ratingValue, setRatingValue] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [reviewText, setReviewText] = useState<string>('')
  const [submittingRating, setSubmittingRating] = useState<boolean>(false)
  const [submittedRating, setSubmittedRating] = useState<ServiceRatingRecord | null>(() =>
    booking ? getBookingRating(booking.booking_code || booking.id) : null
  )
  const [ratingSuccessMsg, setRatingSuccessMsg] = useState<string>('')

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault()
    if (ratingValue < 1 || ratingValue > 5) return
    setSubmittingRating(true)
    try {
      const userStored = localStorage.getItem('customer_user')
      const currentUser = userStored ? JSON.parse(userStored) : null

      const record = await submitServiceRating({
        booking_id: booking.id || 1,
        booking_code: booking.booking_code,
        user_id: booking.user_id || currentUser?.id || 1,
        customer_name: booking.customer_name || currentUser?.name || 'Pelanggan',
        customer_email: booking.customer_email || currentUser?.email || 'pelanggan@email.com',
        service_id: booking.service_id || 1,
        service_name: booking.service_name || 'Layanan Servis ThunderBolt',
        rating: ratingValue,
        review: reviewText.trim(),
      })
      setSubmittedRating(record)
      setRatingSuccessMsg('Terima kasih! Penilaian dan ulasan Anda telah berhasil disimpan.')
    } catch (err) {
      console.error('Failed to submit rating:', err)
    } finally {
      setSubmittingRating(false)
    }
  }

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

    setSubmittedRating(getBookingRating(idOrCode))

    const handlePaymentUpdate = () => {
      setPaymentSuccessData(getPaymentInfo(idOrCode))
    }

    window.addEventListener('tb_booking_parts_updated', handlePartsUpdate)
    window.addEventListener('tb_payment_completed', handlePaymentUpdate)
    return () => {
      window.removeEventListener('tb_booking_parts_updated', handlePartsUpdate)
      window.removeEventListener('tb_payment_completed', handlePaymentUpdate)
    }
  }, [booking])

  if (!booking) return null

  const isPaidDone = booking.status === 'Selesai' || paymentSuccessData?.status === 'paid'
  const isPendingCash = !isPaidDone && (booking.status === 'Menunggu Pembayaran' || paymentSuccessData?.status === 'pending_cash')
  const partsTotal = parts.reduce((acc, curr) => acc + Number(curr.price) * (curr.quantity || 1), 0)
  const servicePrice = Number(booking.service_price || 100000)
  const grandTotal = Number(booking.total_price) || servicePrice + partsTotal

  const handlePayMidtrans = async () => {
    setIsProcessing(true)
    setErrorMessage(null)

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
  }

  const handlePayCash = async () => {
    setIsProcessing(true)
    setErrorMessage(null)
    await payWithCash(booking.id, booking.booking_code, grandTotal)
    setIsProcessing(false)
    setPaymentSuccessData(getPaymentInfo(booking.booking_code || booking.id))
    setPaymentModalOpen(false)
    if (onPaymentSuccess) onPaymentSuccess()
  }

  const handleCancelBooking = async () => {
    if (!window.confirm(`Yakin ingin membatalkan pesanan booking ${booking.booking_code}?`)) return
    setIsProcessing(true)
    try {
      const idOrCode = booking.booking_code || booking.id
      booking.status = 'Dibatalkan'

      // 1. Update status locally across shared admin and customer storages
      updateSharedBookingStatus(idOrCode, 'Dibatalkan')
      if (booking.id) updateSharedBookingStatus(booking.id, 'Dibatalkan')
      if (booking.booking_code) updateSharedBookingStatus(booking.booking_code, 'Dibatalkan')

      // 2. Persist to backend Supabase database
      try {
        await api.patch(`/bookings/${idOrCode}/status`, { status: 'Dibatalkan' })
      } catch (err) {
        if (booking.booking_code && String(idOrCode) !== String(booking.booking_code)) {
          await api.patch(`/bookings/${booking.booking_code}/status`, { status: 'Dibatalkan' }).catch(() => {})
        }
      }

      // 3. Notify all components
      window.dispatchEvent(
        new CustomEvent('tb_booking_status_updated', {
          detail: { idOrCode: booking.booking_code || booking.id, newStatus: 'Dibatalkan' },
        })
      )

      if (onPaymentSuccess) onPaymentSuccess()
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'Dibatalkan') {
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
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
          Dibatalkan
        </span>
      )
    }
    if (isPaidDone) {
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
            backgroundColor: '#dcfce7',
            color: '#15803d',
            border: '1px solid #bbf7d0',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
          Selesai (Lunas)
        </span>
      )
    }
    if (isPendingCash) {
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
            backgroundColor: '#fff7ed',
            color: '#ea580c',
            border: '1px solid #ffedd5',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
          Menunggu Pembayaran Cash
        </span>
      )
    }
    const isProgress = status === 'Diproses' || status === 'Sedang Dikerjakan'
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
          backgroundColor: isProgress ? '#eff6ff' : '#f8fafc',
          color: isProgress ? '#1d4ed8' : '#64748b',
          border: `1px solid ${isProgress ? '#bfdbfe' : '#e2e8f0'}`,
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
        {status}
      </span>
    )
  }

  const waText = encodeURIComponent(
    `Halo ThunderBolt Garage, saya ingin bertanya update servis kendaraan:\n` +
      `• No. Booking: ${booking.booking_code}\n` +
      `• Kendaraan: ${booking.vehicle_model} (${booking.license_plate})\n` +
      `• Status: ${isPaidDone ? 'Selesai (Lunas)' : isPendingCash ? 'Menunggu Pembayaran Cash' : booking.status}\n` +
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
        {isPaidDone ? (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={24} color="#16a34a" />
              <div>
                <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#166534' }}>
                  Pembayaran Lunas & Servis Selesai
                </h5>
                <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.75rem', color: '#15803d' }}>
                  Metode: {paymentSuccessData?.channelName || (paymentSuccessData?.method === 'cash' ? 'Tunai di Kasir Bengkel' : 'Midtrans')}
                  {' • '}No. Bukti: <strong>{paymentSuccessData?.referenceNo || `STRUK-${booking.id}`}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowReceipt(true)}
              className="tb-btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.625rem 1rem',
                fontSize: '0.8125rem',
                backgroundColor: '#16a34a',
              }}
            >
              <Receipt size={16} />
              <span>Lihat / Cetak Struk Pembayaran</span>
            </button>

            {/* Customer Rating & Review Section */}
            <div
              style={{
                marginTop: '0.5rem',
                paddingTop: '0.875rem',
                borderTop: '1px dashed #bbf7d0',
              }}
            >
              {submittedRating ? (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #bbf7d0',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <CheckCircle2 size={13} color="#16a34a" />
                      Ulasan & Penilaian Anda
                    </span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={13}
                          style={{
                            fill: star <= (submittedRating.rating || 5) ? '#f59e0b' : 'transparent',
                            color: star <= (submittedRating.rating || 5) ? '#f59e0b' : '#cbd5e1',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  {submittedRating.review ? (
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{submittedRating.review}"
                    </p>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                      Rating {submittedRating.rating}/5 telah dikirim.
                    </p>
                  )}
                  {ratingSuccessMsg && (
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>
                      ✓ {ratingSuccessMsg}
                    </span>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={handleSubmitRating}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #fed7aa',
                    borderRadius: '0.625rem',
                    padding: '0.875rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#9a3412', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Star size={15} color="#ea580c" fill="#ea580c" />
                      Beri Penilaian Servis Ini
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 700 }}>
                      {ratingValue} / 5 Bintang
                    </span>
                  </div>

                  {/* Interactive Star Selection */}
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '0.25rem 0' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingValue(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          transition: 'transform 0.15s ease',
                          transform: (hoverRating || ratingValue) >= star ? 'scale(1.15)' : 'scale(1)',
                        }}
                      >
                        <Star
                          size={24}
                          style={{
                            fill: (hoverRating || ratingValue) >= star ? '#f59e0b' : 'transparent',
                            color: (hoverRating || ratingValue) >= star ? '#f59e0b' : '#cbd5e1',
                            transition: 'all 0.15s ease',
                          }}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Review Textarea */}
                  <textarea
                    rows={2}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Ceritakan pengalaman servis Anda di bengkel kami (opsional)..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      fontSize: '0.75rem',
                      fontFamily: 'Inter, sans-serif',
                      borderRadius: '0.375rem',
                      border: '1px solid #e2e8f0',
                      padding: '0.5rem',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />

                  <button
                    type="submit"
                    disabled={submittingRating}
                    className="tb-btn-primary"
                    style={{
                      padding: '0.45rem 0.875rem',
                      fontSize: '0.75rem',
                      justifyContent: 'center',
                      backgroundColor: '#f97316',
                    }}
                  >
                    {submittingRating ? 'Mengirim Rating...' : 'Kirim Penilaian Servis'}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : booking.status === 'Dibatalkan' ? (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <AlertCircle size={24} color="#dc2626" />
            <div>
              <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#991b1b' }}>
                Pesanan Servis Dibatalkan
              </h5>
              <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.75rem', color: '#b91c1c' }}>
                Pesanan servis ini telah dibatalkan dan kendaraan dapat didaftarkan kembali.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {isPendingCash && (
              <div
                style={{
                  backgroundColor: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '0.75rem',
                  padding: '0.875rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                }}
              >
                <Banknote size={20} color="#ea580c" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h5 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 800, color: '#9a3412' }}>
                    Permintaan Bayar Tunai (Cash) Terkirim ke Kasir
                  </h5>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#c2410c', lineHeight: 1.4 }}>
                    Silakan bayar di kasir bengkel. Admin kasir akan mengubah status jadi <strong>Selesai</strong> dan menerbitkan struk. Atau Anda juga bisa langsung bayar online di bawah:
                  </p>
                </div>
              </div>
            )}

            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
              Pilih Cara Pembayaran:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Option 1: Midtrans Online Payment */}
              <button
                type="button"
                onClick={handlePayMidtrans}
                disabled={isProcessing}
                className="tb-btn-primary"
                style={{
                  justifyContent: 'center',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <CreditCard size={16} />
                  <span>Bayar Online</span>
                </div>
                <span style={{ fontSize: '0.6875rem', opacity: 0.9, fontWeight: 500 }}>
                  (QRIS / VA / Midtrans)
                </span>
              </button>

              {/* Option 2: Cash Payment */}
              <button
                type="button"
                onClick={handlePayCash}
                disabled={isProcessing || isPendingCash}
                className="tb-btn-secondary"
                style={{
                  justifyContent: 'center',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  alignItems: 'center',
                  textAlign: 'center',
                  backgroundColor: isPendingCash ? '#f8fafc' : '#ffffff',
                  borderColor: isPendingCash ? '#cbd5e1' : '#f97316',
                  color: isPendingCash ? '#94a3b8' : '#ea580c',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Banknote size={16} />
                  <span>{isPendingCash ? 'Permintaan Terkirim' : 'Bayar Tunai'}</span>
                </div>
                <span style={{ fontSize: '0.6875rem', opacity: 0.8, fontWeight: 500 }}>
                  {isPendingCash ? '(Menunggu Admin)' : '(Cash di Kasir)'}
                </span>
              </button>
            </div>

            {errorMessage && (
              <div style={{ padding: '0.625rem 0.75rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Cancel Booking Button */}
          {booking.status !== 'Selesai' && booking.status !== 'Dibatalkan' && (
            <button
              type="button"
              onClick={handleCancelBooking}
              disabled={isProcessing}
              className="tb-btn-secondary"
              style={{
                fontSize: '0.8125rem',
                color: '#dc2626',
                borderColor: '#fca5a5',
                backgroundColor: '#fef2f2',
                padding: '0.5rem 0.875rem',
              }}
            >
              Batalkan Pesanan
            </button>
          )}

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
                onClick={selectedMethod === 'midtrans' ? handlePayMidtrans : handlePayCash}
                disabled={isProcessing}
                className="tb-btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {isProcessing
                  ? 'Memproses...'
                  : selectedMethod === 'midtrans'
                  ? 'Buka Popup Midtrans'
                  : 'Kirim Permintaan Bayar Cash'}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL STRUK PEMBAYARAN RESMI THUNDERBOLT GARAGE           */}
        {/* ========================================================= */}
        {showReceipt && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={() => setShowReceipt(false)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '1rem',
                width: '100%',
                maxWidth: '430px',
                padding: '1.5rem',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                id="tb-receipt-print"
                style={{
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  backgroundColor: '#fdfdfe',
                }}
              >
                {/* Header Struk */}
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.02em' }}>
                    ⚡ THUNDERBOLT GARAGE
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.6875rem', color: '#64748b' }}>
                    Jl. Lapangan Banteng No. 12, Jakarta Pusat • WA: 0813-1923-3748
                  </p>
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: '0.5rem',
                      padding: '0.2rem 0.625rem',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                      borderRadius: '9999px',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                    }}
                  >
                    ✓ BUKTI PEMBAYARAN LUNAS
                  </div>
                </div>

                {/* Metadata Transaksi */}
                <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>No. Struk:</span>
                    <strong style={{ color: '#0f172a' }}>{paymentSuccessData?.referenceNo || `STRUK-${booking.id}`}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>No. Booking:</span>
                    <strong style={{ color: '#0f172a' }}>{booking.booking_code}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tanggal & Jam:</span>
                    <span>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {booking.booking_time || '10:00'} WIB</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Pelanggan:</span>
                    <strong>{booking.customer_name || 'Pelanggan'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Kendaraan:</span>
                    <span>{booking.vehicle_brand} {booking.vehicle_model} ({booking.license_plate})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Metode Bayar:</span>
                    <strong style={{ color: '#ea580c' }}>
                      {paymentSuccessData?.channelName || (paymentSuccessData?.method === 'cash' ? 'Tunai / Kasir' : 'Midtrans')}
                    </strong>
                  </div>
                </div>

                {/* Rincian Item */}
                <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '0.5rem 0', margin: '0.5rem 0', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>Jasa: {booking.service_name}</span>
                    <span style={{ fontWeight: 600 }}>Rp {servicePrice.toLocaleString('id-ID')}</span>
                  </div>
                  {parts.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.6875rem' }}>
                      <span>{p.quantity || 1}x {p.name}</span>
                      <span>Rp {(Number(p.price) * (p.quantity || 1)).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>TOTAL PEMBAYARAN:</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#ea580c' }}>
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>

                <p style={{ textAlign: 'center', fontSize: '0.625rem', color: '#94a3b8', margin: '0.75rem 0 0' }}>
                  Terima kasih atas kepercayaan Anda merawat kendaraan di ThunderBolt Garage. Simpan struk ini sebagai bukti garansi servis resmi.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="tb-btn-primary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.8125rem', backgroundColor: '#16a34a' }}
                >
                  <Printer size={15} />
                  <span>Cetak Struk</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceipt(false)}
                  className="tb-btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.8125rem' }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
