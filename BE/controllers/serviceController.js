import { serviceService } from '../services/serviceService.js';

export const serviceController = {
  async getAllServices(req, res) {
    try {
      const services = await serviceService.getAllServices();
      res.json({ success: true, data: services });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getServiceById(req, res) {
    try {
      const service = await serviceService.getServiceById(req.params.id);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      res.json({ success: true, data: service });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createService(req, res) {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Service name is required' });
      }

      const newService = await serviceService.createService({ name, description });
      res.status(201).json({ success: true, message: 'Service created successfully', data: newService });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateService(req, res) {
    try {
      const updated = await serviceService.updateService(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Service not found or no changes made' });
      }
      res.json({ success: true, message: 'Service updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteService(req, res) {
    try {
      const deleted = await serviceService.deleteService(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      res.json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
