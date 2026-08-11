import { sparepartService } from '../services/sparepartService.js';

export const sparepartController = {
  async getAllSpareparts(req, res) {
    try {
      const spareparts = await sparepartService.getAllSpareparts();
      res.json({ success: true, data: spareparts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getBookingSpareparts(req, res) {
    try {
      const bookingId = req.params.id;
      const result = await sparepartService.getBookingSpareparts(bookingId);
      res.json({
        success: true,
        data: result.spareparts,
        total_price: result.total_price
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async saveBookingSpareparts(req, res) {
    try {
      const bookingId = req.params.id;
      const sparepartsArray = Array.isArray(req.body)
        ? req.body
        : (req.body && Array.isArray(req.body.spareparts) ? req.body.spareparts : []);

      await sparepartService.saveBookingSpareparts(bookingId, sparepartsArray);
      res.json({ success: true, message: 'Spareparts saved successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
