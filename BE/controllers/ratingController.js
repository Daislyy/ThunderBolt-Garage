import { ratingService } from '../services/ratingService.js';

export const ratingController = {
  async getAllRatings(req, res) {
    try {
      const ratings = await ratingService.getAllRatings();
      res.json({ success: true, data: ratings });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getRatingById(req, res) {
    try {
      const rating = await ratingService.getRatingById(req.params.id);
      if (!rating) {
        return res.status(404).json({ success: false, message: 'Rating not found' });
      }
      res.json({ success: true, data: rating });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getRatingsByService(req, res) {
    try {
      const ratings = await ratingService.getRatingsByService(req.params.serviceId);
      res.json({ success: true, data: ratings });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getRatingsByUser(req, res) {
    try {
      const ratings = await ratingService.getRatingsByUser(req.params.userId);
      res.json({ success: true, data: ratings });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createRating(req, res) {
    try {
      const { booking_id, user_id, service_id, rating } = req.body;
      if (!booking_id || !user_id || !service_id || !rating) {
        return res.status(400).json({
          success: false,
          message: 'booking_id, user_id, service_id, and rating are required'
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      const newRating = await ratingService.createRating(req.body);
      res.status(201).json({ success: true, message: 'Rating created successfully', data: newRating });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteRating(req, res) {
    try {
      const deleted = await ratingService.deleteRating(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Rating not found' });
      }
      res.json({ success: true, message: 'Rating deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
