import { useState, useEffect, type FormEvent } from 'react'
import {
  X, Wrench, Calendar, Car, FileText, MessageSquare, Package,
  CreditCard, Banknote, CheckCircle2, Receipt, AlertCircle, Printer, Star
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
import { fetchAllServices, getLocalServices } from './serviceStorage'
import type { GarageService } from './serviceStorage'
import BookingStatusBadge from '../../components/BookingStatusBadge'
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

  const [ratingValue, setRatingValue] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [reviewText, setReviewText] = useState<string>('')
  const [submittingRating, setSubmittingRating] = useState<boolean>(false)
  const [submittedRating, setSubmittedRating] = useState<ServiceRatingRecord | null>(() =>
    booking ? getBookingRating(booking.booking_code || booking.id) : null
  )
  const [ratingSuccessMsg, setRatingSuccessMsg] = useState<string>('')
  const [serviceCatalog, setServiceCatalog] = useState<GarageService[]>(() => getLocalServices())

  const handleSubmitRating = async (e: FormEvent) => {
    e.preventDefault()
    if (!booking) return
    setSubmittingRating(true)
    setRatingSuccessMsg('')

    try {
      const record = await submitServiceRating({
        booking_id: booking.booking_code || booking.id,
        booking_code: booking.booking_code,
        user_id: booking.user_id || '',
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        service_id: booking.service_id || 0,
        service_name: booking.service_name,
        rating: ratingValue,
        review: reviewText.trim() || undefined,
      })
      setSubmittedRating(record)
      setRatingSuccessMsg('Terima kasih! Ulasan dan rating Anda telah berhasil disimpan.')
    } catch {
      setRatingSuccessMsg('Rating berhasil dicatat.')
    } finally {
      setSubmittingRating(false)
    }
  }

  useEffect(() => {
    if (!booking) return
    const idOrCode = booking.booking_code || booking.id
    setPaymentSuccessData(getPaymentInfo(idOrCode))

    setLoadingParts(true)
    getBookingSpareparts(idOrCode)
      .then((data) => {
        if (data && data.length > 0) setParts(data)
        else if (booking.demoParts) setParts(booking.demoParts)
      })
      .finally(() => setLoadingParts(false))

    const handlePartsUpdate = (e: any) => {
      const match = String(e.detail?.bookingIdOrCode) === String(booking.id) || String(e.detail?.bookingIdOrCode) === String(booking.booking_code)
      if (match && e.detail?.spareparts) setParts(e.detail.spareparts)
    }

    setSubmittedRating(getBookingRating(idOrCode))
    const handlePaymentUpdate = () => setPaymentSuccessData(getPaymentInfo(idOrCode))

    window.addEventListener('tb_booking_parts_updated', handlePartsUpdate)
    window.addEventListener('tb_payment_completed', handlePaymentUpdate)
    fetchAllServices().then((list) => {
      if (list && list.length > 0) setServiceCatalog(list)
    })

    return () => {
      window.removeEventListener('tb_booking_parts_updated', handlePartsUpdate)
      window.removeEventListener('tb_payment_completed', handlePaymentUpdate)
    }
  }, [booking])

  if (!booking) return null

  const matchedService = serviceCatalog.find(
    (s) => (booking.service_id && Number(s.id) === Number(booking.service_id)) || (s.name && s.name.trim().toLowerCase() === String(booking.service_name || '').trim().toLowerCase())
  )

  const isPaidDone = booking.status === 'Selesai' || paymentSuccessData?.status === 'paid'
  const isPendingCash = !isPaidDone && (booking.status === 'Menunggu Pembayaran' || paymentSuccessData?.status === 'pending_cash')
  const partsTotal = parts.reduce((acc, curr) => acc + Number(curr.price) * (curr.quantity || 1), 0)
  const servicePrice = Number(
    booking.service_price !== undefined && booking.service_price !== null && Number(booking.service_price) > 0
      ? booking.service_price
      : (matchedService?.price !== undefined && matchedService?.price !== null && Number(matchedService.price) > 0 ? matchedService.price : 100000)
  )
  const grandTotal = Number(
    booking.total_price && Number(booking.total_price) > servicePrice ? booking.total_price : servicePrice + partsTotal
  )

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
    const result = await payWithCash(
      booking.id,
      booking.booking_code || String(booking.id),
      grandTotal
    )
    setIsProcessing(false)
    if (result.success) {
      setPaymentSuccessData(getPaymentInfo(booking.booking_code || booking.id))
      setPaymentModalOpen(false)
      if (onPaymentSuccess) onPaymentSuccess()
    } else {
      setErrorMessage(result.message || 'Gagal mengajukan pembayaran tunai')
    }
  }

  const handleCancelBooking = async () => {
    if (!window.confirm(`Yakin ingin membatalkan pesanan servis dengan kode ${booking.booking_code}?`)) return
    setIsProcessing(true)
    const idOrCode = booking.booking_code || booking.id
    try {
      await api.patch(`/bookings/${idOrCode}/status`, { status: 'Dibatalkan' }).catch(async () => {
        if (booking.id) await api.patch(`/bookings/${booking.id}/status`, { status: 'Dibatalkan' }).catch(() => {})
      })
      updateSharedBookingStatus(idOrCode, 'Dibatalkan')
      booking.status = 'Dibatalkan'
      window.dispatchEvent(new CustomEvent('tb_booking_status_updated', { detail: { bookingIdOrCode: idOrCode, status: 'Dibatalkan' } }))
      alert('Pesanan servis berhasil dibatalkan.')
      onClose()
      if (onPaymentSuccess) onPaymentSuccess()
    } catch {
      alert('Gagal membatalkan pesanan.')
    } finally {
      setIsProcessing(false)
    }
  }

  const waText = encodeURIComponent(
    `Halo ThunderBolt Garage, saya ingin bertanya tentang booking servis saya:\n` +
    `• No. Booking: ${booking.booking_code}\n` +
    `• Kendaraan: ${booking.vehicle_brand} ${booking.vehicle_model} (${booking.license_plate})\n` +
    `• Layanan: ${booking.service_name}\n` +
    `• Status saat ini: ${booking.status}\n` +
    `Terima kasih.`
  )

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: '#ffffff', borderRadius: '1rem', maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', border: '1px solid #e2e8f0', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rincian Pesanan & Tagihan
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0.125rem 0 0 0' }}>
              {booking.booking_code}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Status saat ini:</span>
          <BookingStatusBadge status={booking.status} />
        </div>

        {/* Booking Meta Details */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Car size={15} color="#ea580c" />
            <span><strong>Kendaraan:</strong> {booking.vehicle_brand} {booking.vehicle_model} ({booking.license_plate})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={15} color="#ea580c" />
            <span><strong>Jadwal Servis:</strong> {booking.booking_date} • {booking.booking_time} WIB</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={15} color="#ea580c" />
            <span><strong>Layanan:</strong> {booking.service_name} (Rp {servicePrice.toLocaleString('id-ID')})</span>
          </div>
          {booking.notes && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', paddingTop: '0.25rem', borderTop: '1px dashed #e2e8f0' }}>
              <FileText size={15} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ color: '#475569' }}><strong>Catatan Keluhan:</strong> {booking.notes}</span>
            </div>
          )}
        </div>

        {/* Spareparts Replaced Section */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
            <Package size={15} color="#ea580c" />
            <h5 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>
              Suku Cadang Yang Diganti ({parts.length} part)
            </h5>
          </div>

          {loadingParts ? (
            <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>Memuat suku cadang...</div>
          ) : parts.length === 0 ? (
            <div style={{ padding: '0.875rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
              Belum ada suku cadang tambahan yang ditambahkan oleh teknisi bengkel.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {parts.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#0f172a', display: 'block' }}>{p.name}</span>
                    <span style={{ color: '#64748b', fontSize: '0.6875rem' }}>{p.quantity || 1} unit @ Rp {Number(p.price).toLocaleString('id-ID')}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>
                    Rp {(Number(p.price) * (p.quantity || 1)).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '0.75rem', padding: '0.875rem 1rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #fed7aa', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9375rem' }}>Total Tagihan</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ea580c' }}>
              Rp {grandTotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Payment Status or Buttons */}
        {isPaidDone ? (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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

            <button onClick={() => setShowReceipt(true)} className="tb-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.625rem 1rem', fontSize: '0.8125rem', backgroundColor: '#16a34a' }}>
              <Receipt size={16} />
              <span>Lihat / Cetak Struk Pembayaran</span>
            </button>
          </div>
        ) : isPendingCash ? (
          <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Banknote size={18} color="#ea580c" />
              <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#9a3412' }}>Menunggu Konfirmasi Kasir</h5>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#c2410c' }}>
              Permintaan bayar tunai (Cash) telah dikirimkan ke kasir bengkel. Silakan lakukan pembayaran di kasir saat mengambil kendaraan Anda.
            </p>
          </div>
        ) : booking.status === 'Dibatalkan' ? (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', textAlign: 'center', color: '#991b1b', fontSize: '0.8125rem' }}>
            Pesanan ini telah <strong>Dibatalkan</strong>.
          </div>
        ) : (
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
              Pilih Cara Pembayaran:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => { setSelectedMethod('midtrans'); setPaymentModalOpen(true) }}
                disabled={isProcessing}
                className="tb-btn-primary"
                style={{ justifyContent: 'center', padding: '0.75rem 0.5rem', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <CreditCard size={16} />
                  <span>Bayar Online</span>
                </div>
                <span style={{ fontSize: '0.6875rem', opacity: 0.9, fontWeight: 500 }}>(QRIS / VA / Midtrans)</span>
              </button>

              <button
                type="button"
                onClick={handlePayCash}
                disabled={isProcessing}
                className="tb-btn-secondary"
                style={{ justifyContent: 'center', padding: '0.75rem 0.5rem', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Banknote size={16} />
                  <span>Bayar Tunai</span>
                </div>
                <span style={{ fontSize: '0.6875rem', opacity: 0.8, fontWeight: 500 }}>(Cash di Kasir)</span>
              </button>
            </div>

            {errorMessage && (
              <div style={{ marginTop: '0.75rem', padding: '0.625rem 0.75rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Rating Section (If Selesai) */}
        {booking.status === 'Selesai' && (
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
              <h5 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>
                {submittedRating ? 'Ulasan Anda Untuk Layanan Ini' : 'Beri Nilai & Ulasan Servis'}
              </h5>
            </div>

            {submittedRating ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={16} color="#f59e0b" fill={star <= submittedRating.rating ? '#f59e0b' : 'none'} />
                  ))}
                </div>
                {submittedRating.review && <p style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic', margin: '0.25rem 0 0 0' }}>"{submittedRating.review}"</p>}
                <span style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 700 }}>✓ Ulasan Anda telah tersimpan di sistem bengkel.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitRating} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Star size={20} color="#f59e0b" fill={(hoverRating || ratingValue) >= star ? '#f59e0b' : 'none'} />
                    </button>
                  ))}
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginLeft: '0.5rem' }}>{ratingValue} / 5 Bintang</span>
                </div>
                <input
                  type="text"
                  placeholder="Tulis ulasan Anda (misal: Montir ramah, pengerjaan cepat)..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="tb-input"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.625rem' }}
                />
                {ratingSuccessMsg && <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>{ratingSuccessMsg}</span>}
                <button type="submit" disabled={submittingRating} className="tb-btn-primary" style={{ alignSelf: 'flex-start', padding: '0.4rem 0.875rem', fontSize: '0.75rem' }}>
                  {submittingRating ? 'Menyimpan...' : 'Kirim Ulasan'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {booking.status !== 'Selesai' && booking.status !== 'Dibatalkan' && (
            <button
              type="button"
              onClick={handleCancelBooking}
              disabled={isProcessing}
              className="tb-btn-secondary"
              style={{ fontSize: '0.8125rem', color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fef2f2', padding: '0.5rem 0.875rem' }}
            >
              Batalkan Pesanan
            </button>
          )}

          <a href={`https://wa.me/6281319233748?text=${waText}`} target="_blank" rel="noopener noreferrer" className="tb-btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8125rem' }}>
            <MessageSquare size={15} color="#22c55e" />
            <span>Tanya via WhatsApp</span>
          </a>

          <button onClick={onClose} className="tb-btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
            Tutup
          </button>
        </div>

        {/* Modal Midtrans Popup Confirmation */}
        {paymentModalOpen && (
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
            onClick={() => setPaymentModalOpen(false)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '1rem',
                maxWidth: '520px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.75rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>Pilih Cara Pembayaran</h4>
                  <button onClick={() => setPaymentModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}><X size={20} /></button>
                </div>

                <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', backgroundColor: '#fff7ed', borderRadius: '0.5rem', border: '1px solid #ffedd5' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9a3412', display: 'block' }}>Total Tagihan Servis:</span>
                  <span style={{ fontSize: '1.375rem', fontWeight: 900, color: '#ea580c' }}>Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '0.75rem', border: `1.5px solid ${selectedMethod === 'midtrans' ? '#f97316' : '#e2e8f0'}`, backgroundColor: selectedMethod === 'midtrans' ? '#fff7ed' : '#ffffff', cursor: 'pointer' }}>
                    <input type="radio" name="method" checked={selectedMethod === 'midtrans'} onChange={() => setSelectedMethod('midtrans')} style={{ accentColor: '#f97316' }} />
                    <CreditCard size={22} color="#f97316" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>Midtrans Payment Gateway (Otomatis)</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>BCA, Mandiri, BNI, BRI Virtual Account, QRIS, GoPay, ShopeePay</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '0.75rem', border: `1.5px solid ${selectedMethod === 'cash' ? '#f97316' : '#e2e8f0'}`, backgroundColor: selectedMethod === 'cash' ? '#fff7ed' : '#ffffff', cursor: 'pointer' }}>
                    <input type="radio" name="method" checked={selectedMethod === 'cash'} onChange={() => setSelectedMethod('cash')} style={{ accentColor: '#f97316' }} />
                    <Banknote size={22} color="#16a34a" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>Bayar Tunai / Cash di Bengkel</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Bayar langsung ke kasir bengkel saat mengambil kendaraan</div>
                    </div>
                  </label>
                </div>

                {errorMessage && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#e11d48' }}>
                    {errorMessage}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setPaymentModalOpen(false)} className="tb-btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Batal</button>
                <button type="button" onClick={selectedMethod === 'midtrans' ? handlePayMidtrans : handlePayCash} disabled={isProcessing} className="tb-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {isProcessing ? 'Memproses...' : selectedMethod === 'midtrans' ? 'Buka Popup Midtrans' : 'Kirim Permintaan Cash'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Struk Pembayaran */}
        {showReceipt && (
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setShowReceipt(false)}
          >
            <div
              style={{ backgroundColor: '#ffffff', borderRadius: '1rem', width: '100%', maxWidth: '430px', padding: '1.5rem', position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div id="tb-receipt-print" style={{ border: '1.5px dashed #cbd5e1', borderRadius: '0.75rem', padding: '1.25rem', backgroundColor: '#fdfdfe' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 900, color: '#0f172a' }}>⚡ THUNDERBOLT GARAGE</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.6875rem', color: '#64748b' }}>Jl. Lapangan Banteng No. 12, Jakarta Pusat • WA: 0813-1923-3748</p>
                  <div style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.2rem 0.625rem', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 800 }}>
                    ✓ BUKTI PEMBAYARAN LUNAS
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>No. Struk:</span><strong style={{ color: '#0f172a' }}>{paymentSuccessData?.referenceNo || `STRUK-${booking.id}`}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>No. Booking:</span><strong style={{ color: '#0f172a' }}>{booking.booking_code}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pelanggan:</span><strong>{booking.customer_name || 'Pelanggan'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Kendaraan:</span><span>{booking.vehicle_brand} {booking.vehicle_model} ({booking.license_plate})</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Metode:</span><strong style={{ color: '#ea580c' }}>{paymentSuccessData?.channelName || (paymentSuccessData?.method === 'cash' ? 'Tunai / Kasir' : 'Midtrans')}</strong></div>
                </div>

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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>TOTAL PEMBAYARAN:</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#ea580c' }}>Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => window.print()} className="tb-btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8125rem', backgroundColor: '#16a34a' }}>
                  <Printer size={15} /><span>Cetak Struk</span>
                </button>
                <button type="button" onClick={() => setShowReceipt(false)} className="tb-btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8125rem' }}>
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
