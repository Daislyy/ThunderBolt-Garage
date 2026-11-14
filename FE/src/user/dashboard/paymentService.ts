import api from '../../api/axios'
import { updateSharedBookingStatus } from './userStorage'

export interface PaymentDetails {
  bookingId: string | number
  bookingCode: string
  method: 'qris' | 'dana' | 'gopay' | 'va' | 'cash' | 'midtrans'
  channelName?: string
  amount: number
  paidAt: string
  status: 'paid'
  referenceNo?: string
  snapToken?: string
}

const PAYMENT_STORAGE_KEY = 'tb_booking_payments'

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess: () => void
          onPending: () => void
          onError: (result: any) => void
          onClose: () => void
        }
      ) => void
    }
  }
}

export function getStoredPayments(): Record<string, PaymentDetails> {
  try {
    const raw = localStorage.getItem(PAYMENT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function isBookingPaid(bookingCodeOrId: string | number): boolean {
  const payments = getStoredPayments()
  return Boolean(payments[String(bookingCodeOrId)])
}

export function getPaymentInfo(bookingCodeOrId: string | number): PaymentDetails | null {
  const payments = getStoredPayments()
  return payments[String(bookingCodeOrId)] || null
}

export function savePaymentRecord(payment: PaymentDetails) {
  const payments = getStoredPayments()
  payments[String(payment.bookingId)] = payment
  payments[String(payment.bookingCode)] = payment

  try {
    localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payments))
  } catch {}

  // Auto update booking status to 'Selesai'
  updateSharedBookingStatus(payment.bookingCode || payment.bookingId, 'Selesai')
  window.dispatchEvent(new CustomEvent('tb_payment_completed', { detail: payment }))
}

/**
 * Direct channel payment (QRIS, DANA, GoPay, VA BCA/Mandiri, Cash)
 */
export function payWithChannel(
  bookingId: string | number,
  bookingCode: string,
  method: 'qris' | 'dana' | 'gopay' | 'va' | 'cash' | 'midtrans',
  channelName: string,
  amount: number
): PaymentDetails {
  const ref = `PAY-${Date.now().toString().slice(-6)}`
  const record: PaymentDetails = {
    bookingId,
    bookingCode,
    method,
    channelName,
    amount,
    paidAt: new Date().toISOString(),
    status: 'paid',
    referenceNo: ref,
  }

  savePaymentRecord(record)

  // Sync to backend if accessible
  api
    .post('/payment/cash', {
      booking_id: bookingId,
      gross_amount: amount,
      payment_type: channelName,
    })
    .catch(() => {})

  return record
}

/**
 * Pay with Cash at Workshop
 */
export async function payWithCash(
  bookingId: string | number,
  bookingCode: string,
  amount: number
): Promise<{ success: boolean; message: string }> {
  try {
    await api.post('/payment/cash', {
      booking_id: bookingId,
      gross_amount: amount,
    })
  } catch {}

  savePaymentRecord({
    bookingId,
    bookingCode,
    method: 'cash',
    channelName: 'Tunai / Cash di Bengkel',
    amount,
    paidAt: new Date().toISOString(),
    status: 'paid',
  })

  return { success: true, message: 'Pembayaran tunai berhasil dikonfirmasi' }
}

/**
 * Pay using Midtrans Snap Popup
 */
export async function payWithMidtrans(bookingData: {
  bookingId: string | number
  bookingCode: string
  amount: number
  customerName?: string
  customerEmail?: string
  serviceName?: string
  parts?: any[]
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await api.post('/payment/snap-token', {
      booking_id: bookingData.bookingId,
      gross_amount: bookingData.amount,
      customer_name: bookingData.customerName,
      customer_email: bookingData.customerEmail,
      service_name: bookingData.serviceName,
      parts: bookingData.parts,
    })

    const snapToken = res.data?.token

    if (!snapToken) {
      throw new Error('Gagal mendapatkan token pembayaran dari Midtrans')
    }

    return new Promise((resolve) => {
      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: () => {
            savePaymentRecord({
              bookingId: bookingData.bookingId,
              bookingCode: bookingData.bookingCode,
              method: 'midtrans',
              channelName: 'Midtrans Snap',
              amount: bookingData.amount,
              paidAt: new Date().toISOString(),
              status: 'paid',
              snapToken: snapToken,
            })
            resolve({ success: true, message: 'Pembayaran Midtrans berhasil' })
          },
          onPending: () => {
            resolve({ success: false, message: 'Menunggu penyelesaian pembayaran' })
          },
          onError: (err) => {
            resolve({ success: false, message: err?.status_message || 'Pembayaran gagal' })
          },
          onClose: () => {
            resolve({ success: false, message: 'Popup pembayaran ditutup oleh pengguna' })
          },
        })
      } else {
        savePaymentRecord({
          bookingId: bookingData.bookingId,
          bookingCode: bookingData.bookingCode,
          method: 'midtrans',
          channelName: 'Midtrans Gateway',
          amount: bookingData.amount,
          paidAt: new Date().toISOString(),
          status: 'paid',
        })
        resolve({ success: true, message: 'Pembayaran Midtrans berhasil' })
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Midtrans error',
    }
  }
}
