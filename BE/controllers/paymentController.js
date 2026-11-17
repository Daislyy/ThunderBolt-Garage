import midtransClient from 'midtrans-client';
import dotenv from 'dotenv';
import db from '../config/database.js';

dotenv.config();

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

const snap = new midtransClient.Snap({
  isProduction: isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

export const paymentController = {
  // 1. Get Client Key for Frontend
  getClientKey(req, res) {
    res.json({
      success: true,
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
      isProduction: isProduction,
    });
  },

  // 2. Create Snap Transaction Token
  async createSnapToken(req, res) {
    try {
      const { booking_id, gross_amount, customer_name, customer_email, service_name, parts } = req.body;

      if (!booking_id || !gross_amount) {
        return res.status(400).json({ success: false, message: 'booking_id and gross_amount are required' });
      }

      const orderId = `TBG-${booking_id}-${Date.now()}`;

      // Build item details
      const itemDetails = [
        {
          id: `SVC-${booking_id}`,
          price: Math.round(Number(req.body.service_price || gross_amount)),
          quantity: 1,
          name: (service_name || 'Jasa Servis Kendaraan').slice(0, 50),
        },
      ];

      if (Array.isArray(parts) && parts.length > 0) {
        parts.forEach((p, idx) => {
          itemDetails.push({
            id: `PRT-${p.sparepart_id || idx}`,
            price: Math.round(Number(p.price || 0)),
            quantity: Number(p.quantity || 1),
            name: (p.name || 'Suku Cadang').slice(0, 50),
          });
        });
      }

      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: Math.round(Number(gross_amount)),
        },
        customer_details: {
          first_name: customer_name || 'Pelanggan',
          email: customer_email || 'pelanggan@thunderbolt.com',
        },
      };

      const transaction = await snap.createTransaction(parameter);

      // Save initial payment record in Supabase
      try {
        await db.from('payments').insert([
          {
            booking_id: booking_id,
            order_id: orderId,
            gross_amount: gross_amount,
            snap_token: transaction.token,
            transaction_status: 'pending',
            payment_method: 'midtrans',
          },
        ]);
      } catch (dbErr) {
        console.warn('Could not insert payment into db (optional fallback):', dbErr.message);
      }

      res.json({
        success: true,
        token: transaction.token,
        redirect_url: transaction.redirect_url,
        order_id: orderId,
      });
    } catch (error) {
      console.error('Midtrans createSnapToken error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. Record Cash / Tunai Payment
  async recordCashPayment(req, res) {
    try {
      const { booking_id, gross_amount } = req.body;
      const orderId = `CASH-${booking_id}-${Date.now()}`;

      try {
        await db.from('payments').insert([
          {
            booking_id: booking_id,
            order_id: orderId,
            gross_amount: gross_amount,
            transaction_status: 'pending',
            payment_method: 'cash',
            payment_type: 'cash',
            created_at: new Date().toISOString(),
          },
        ]);

        // Update booking status to Menunggu Pembayaran
        await db.from('bookings').update({ status: 'Menunggu Pembayaran' }).eq('id', booking_id);
      } catch (dbErr) {
        console.warn('Could not update cash in db:', dbErr.message);
      }

      res.json({
        success: true,
        message: 'Permintaan pembayaran cash telah dikirim ke admin bengkel',
        order_id: orderId,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 4. Midtrans Webhook Notification
  async handleWebhook(req, res) {
    try {
      const notification = req.body;
      const statusResponse = await snap.transaction.notification(notification);

      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;

      let paymentStatus = 'pending';

      if (transactionStatus === 'capture') {
        paymentStatus = fraudStatus === 'challenge' ? 'challenge' : 'settlement';
      } else if (transactionStatus === 'settlement') {
        paymentStatus = 'settlement';
      } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
        paymentStatus = 'failure';
      } else if (transactionStatus === 'pending') {
        paymentStatus = 'pending';
      }

      // Update payment record in Supabase
      try {
        await db
          .from('payments')
          .update({
            transaction_status: paymentStatus,
            transaction_id: statusResponse.transaction_id,
            payment_type: statusResponse.payment_type,
            paid_at: paymentStatus === 'settlement' ? new Date().toISOString() : null,
          })
          .eq('order_id', orderId);

        // If paid successfully, auto update booking status to Selesai
        if (paymentStatus === 'settlement') {
          const parts = orderId.split('-');
          const bookingId = parts[1];
          if (bookingId) {
            await db.from('bookings').update({ status: 'Selesai' }).eq('id', bookingId);
          }
        }
      } catch (dbErr) {
        console.warn('Webhook DB update warning:', dbErr.message);
      }

      res.json({ success: true, message: 'Notification handled successfully' });
    } catch (error) {
      console.error('Midtrans Webhook error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
