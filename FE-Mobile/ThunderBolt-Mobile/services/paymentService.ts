// services/paymentService.ts
// Modul layanan pembayaran untuk memfasilitasi transaksi online via Midtrans Snap maupun pencatatan kasir tunai.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './api';

const PAID_BOOKINGS_STORAGE_KEY = 'tb_mobile_paid_bookings';

// Struktur parameter pembuatan token transaksi pembayaran Midtrans Snap
export interface CreateSnapTokenParams {
  booking_id: number;
  booking_code?: string;
  gross_amount: number;
  customer_name?: string;
  customer_email?: string;
  service_name?: string;
  service_price?: number;
  parts?: Array<{
    sparepart_id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
}

// Struktur respons data token Snap yang dikembalikan oleh server
export interface SnapTokenResponse {
  token: string;
  redirect_url: string;
  order_id: string;
}

// Struktur respons pencatatan pembayaran tunai di kasir
export interface CashPaymentResponse {
  message: string;
  order_id: string;
}

// Struktur respons kunci klien publik Midtrans
export interface ClientKeyResponse {
  clientKey: string;
  isProduction: boolean;
}

export const paymentService = {
  /**
   * Mengambil Client Key Midtrans publik dan mode environment (Sandbox / Production) dari backend.
   */
  async getClientKey(): Promise<ClientKeyResponse> {
    const res = await apiRequest<ClientKeyResponse>('/payment/client-key', {
      requiresAuth: false,
    });
    return res.data || { clientKey: '', isProduction: false };
  },

  /**
   * Mengajukan pembuatan transaksi token Midtrans Snap dan mendapatkan URL redirect pembayaran online.
   */
  async createSnapToken(params: CreateSnapTokenParams): Promise<SnapTokenResponse> {
    const res = await apiRequest<SnapTokenResponse>('/payment/snap-token', {
      method: 'POST',
      body: params,
    });
    // Mendukung pembacaan langsung dari field root maupun wrapper data untuk memastikan kompatibilitas respons
    const token = res.data?.token || (res as any).token;
    const redirect_url = res.data?.redirect_url || (res as any).redirect_url;
    const order_id = res.data?.order_id || (res as any).order_id;
    return { token, redirect_url, order_id };
  },

  /**
   * Mengirim permohonan pembayaran tunai di kasir bengkel ke sistem admin.
   */
  async recordCashPayment(
    booking_id: number,
    gross_amount: number,
    booking_code?: string
  ): Promise<CashPaymentResponse> {
    const res = await apiRequest<CashPaymentResponse>('/payment/cash', {
      method: 'POST',
      body: {
        booking_id,
        gross_amount,
        booking_code,
      },
    });
    const message = res.data?.message || (res as any).message || 'Berhasil';
    const order_id = res.data?.order_id || (res as any).order_id || '';
    return { message, order_id };
  },

  /**
   * Menyimpan status pembayaran booking secara lokal di perangkat.
   */
  async markBookingPaidLocally(bookingIdOrCode: number | string, paymentMethod: 'midtrans' | 'cash' = 'midtrans'): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(PAID_BOOKINGS_STORAGE_KEY);
      const paidMap: Record<string, { paid: boolean; method: string; timestamp: string }> = raw ? JSON.parse(raw) : {};
      paidMap[String(bookingIdOrCode)] = {
        paid: true,
        method: paymentMethod,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(PAID_BOOKINGS_STORAGE_KEY, JSON.stringify(paidMap));
    } catch (err) {
      console.warn('Gagal menyimpan cache pembayaran lokal:', err);
    }
  },

  /**
   * Mengecek apakah booking sudah pernah dibayar secara online/lokal oleh user.
   */
  async isBookingPaidLocally(bookingIdOrCode: number | string): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(PAID_BOOKINGS_STORAGE_KEY);
      if (!raw) return false;
      const paidMap = JSON.parse(raw);
      return Boolean(paidMap[String(bookingIdOrCode)]?.paid);
    } catch {
      return false;
    }
  },
};
