// services/paymentService.ts
import { apiRequest } from './api';

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

export interface SnapTokenResponse {
  token: string;
  redirect_url: string;
  order_id: string;
}

export interface CashPaymentResponse {
  message: string;
  order_id: string;
}

export interface ClientKeyResponse {
  clientKey: string;
  isProduction: boolean;
}

export const paymentService = {
  /**
   * Get Midtrans Client Key & Mode
   */
  async getClientKey(): Promise<ClientKeyResponse> {
    const res = await apiRequest<ClientKeyResponse>('/payment/client-key', {
      requiresAuth: false,
    });
    return res.data || { clientKey: '', isProduction: false };
  },

  /**
   * Request Snap Token for Midtrans payment
   */
  async createSnapToken(params: CreateSnapTokenParams): Promise<SnapTokenResponse> {
    const res = await apiRequest<SnapTokenResponse>('/payment/snap-token', {
      method: 'POST',
      body: params,
    });
    // Support both direct fields and nested data envelope
    const token = res.data?.token || (res as any).token;
    const redirect_url = res.data?.redirect_url || (res as any).redirect_url;
    const order_id = res.data?.order_id || (res as any).order_id;
    return { token, redirect_url, order_id };
  },

  /**
   * Request / Record Cash Payment at Cashier
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
};
