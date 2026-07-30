import { vehicleService } from '../services/vehicleService.js';

export const vehicleController = {
  async getAllVehicles(req, res) {
    try {
      const vehicles = await vehicleService.getAllVehicles();
      res.json({ success: true, data: vehicles });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getVehiclesByUser(req, res) {
    try {
      const vehicles = await vehicleService.getVehiclesByUserId(req.params.userId);
      res.json({ success: true, data: vehicles });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getVehicleById(req, res) {
    try {
      const vehicle = await vehicleService.getVehicleById(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }
      res.json({ success: true, data: vehicle });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createVehicle(req, res) {
    try {
      const { user_id, brand, model, year, license_plate } = req.body;
      if (!user_id || !brand || !model || !year || !license_plate) {
        return res.status(400).json({
          success: false,
          message: 'user_id, brand, model, year, and license_plate are required'
        });
      }

      const newVehicle = await vehicleService.createVehicle(req.body);
      res.status(201).json({ success: true, message: 'Vehicle created successfully', data: newVehicle });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateVehicle(req, res) {
    try {
      const updated = await vehicleService.updateVehicle(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Vehicle not found or no changes made' });
      }
      res.json({ success: true, message: 'Vehicle updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteVehicle(req, res) {
    try {
      const deleted = await vehicleService.deleteVehicle(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }
      res.json({ success: true, message: 'Vehicle deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
