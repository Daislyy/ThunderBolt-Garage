import { bookingService } from '../services/bookingService.js';
import { notificationService } from '../services/notificationService.js';

export const bookingController = {
  async getAllBookings(req, res) {
    try {
      const bookings = await bookingService.getAllBookings();
      res.json({ success: true, data: bookings });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getBookingsByUser(req, res) {
    try {
      const bookings = await bookingService.getBookingsByUserId(req.params.userId);
      res.json({ success: true, data: bookings });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getBookingById(req, res) {
    try {
      const booking = await bookingService.getBookingById(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      res.json({ success: true, data: booking });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createBooking(req, res) {
    try {
      const { user_id, vehicle_id, service_id, booking_date, booking_time } = req.body;
      if (!user_id || !vehicle_id || !service_id || !booking_date || !booking_time) {
        return res.status(400).json({
          success: false,
          message: 'user_id, vehicle_id, service_id, booking_date, and booking_time are required'
        });
      }

      const newBooking = await bookingService.createBooking(req.body);
      
      // Auto-create notification for user
      await notificationService.createNotification({
        user_id,
        title: 'Booking Created',
        message: `Booking ${newBooking.booking_code} has been created successfully.`,
        type: 'booking',
        reference_id: newBooking.id
      });

      res.status(201).json({ success: true, message: 'Booking created successfully', data: newBooking });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateBookingStatus(req, res) {
    try {
      let { status } = req.body;
      const bookingId = req.params.id;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }

   
      if (status === 'Selesai') {
        status = 'Menunggu Konfirmasi';
      }

      const updated = await bookingService.updateBookingStatus(bookingId, { status });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Booking not found or no changes made' });
      }

      const booking = await bookingService.getBookingById(bookingId);
      if (booking) {
        let notificationMessage = `Your booking ${booking.booking_code} status changed to ${status}.`;
        if (status === 'Menunggu Konfirmasi') {
          notificationMessage = 'Kendaraan Anda sudah selesai diservis. Mohon cek rincian tagihan dan konfirmasi.';
        }

        await notificationService.createNotification({
          user_id: booking.user_id,
          title: status === 'Menunggu Konfirmasi' ? 'Servis Selesai - Menunggu Konfirmasi' : 'Booking Status Updated',
          message: notificationMessage,
          type: 'booking_status',
          reference_id: booking.id
        });
      }

      res.json({ success: true, message: 'Booking status updated successfully', data: { status } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteBooking(req, res) {
    try {
      const deleted = await bookingService.deleteBooking(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      res.json({ success: true, message: 'Booking deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
