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

  async getSparepartById(req, res) {
    try {
      const sparepart = await sparepartService.getSparepartById(req.params.id);
      if (!sparepart) {
        return res.status(404).json({ success: false, message: 'Sparepart tidak ditemukan' });
      }
      res.json({ success: true, data: sparepart });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createSparepart(req, res) {
    try {
      const { name, price } = req.body;
      if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Nama sparepart wajib diisi' });
      }
      if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
        return res.status(400).json({ success: false, message: 'Harga sparepart harus berupa angka yang valid (>= 0)' });
      }

      const newSparepart = await sparepartService.createSparepart({
        name: name.trim(),
        price: Number(price)
      });

      res.status(201).json({
        success: true,
        message: 'Sparepart berhasil ditambahkan',
        data: newSparepart
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateSparepart(req, res) {
    try {
      const { name, price } = req.body;
      if (name !== undefined && name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Nama sparepart tidak boleh kosong' });
      }
      if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
        return res.status(400).json({ success: false, message: 'Harga sparepart harus berupa angka yang valid (>= 0)' });
      }

      const updated = await sparepartService.updateSparepart(req.params.id, {
        name: name ? name.trim() : undefined,
        price: price !== undefined ? Number(price) : undefined
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Sparepart tidak ditemukan atau tidak ada perubahan' });
      }

      res.json({ success: true, message: 'Sparepart berhasil diperbarui' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteSparepart(req, res) {
    try {
      const deleted = await sparepartService.deleteSparepart(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Sparepart tidak ditemukan' });
      }
      res.json({ success: true, message: 'Sparepart berhasil dihapus' });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
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
