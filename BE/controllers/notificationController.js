import { notificationService } from '../services/notificationService.js';

export const notificationController = {
  async getNotificationsByUser(req, res) {
    try {
      const notifications = await notificationService.getNotificationsByUserId(req.params.userId);
      res.json({ success: true, data: notifications });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createNotification(req, res) {
    try {
      const { user_id, title, message } = req.body;
      if (!user_id || !title || !message) {
        return res.status(400).json({
          success: false,
          message: 'user_id, title, and message are required'
        });
      }

      const newNotif = await notificationService.createNotification(req.body);
      res.status(201).json({ success: true, message: 'Notification created', data: newNotif });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async markAsRead(req, res) {
    try {
      const updated = await notificationService.markAsRead(req.params.id);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteNotification(req, res) {
    try {
      const deleted = await notificationService.deleteNotification(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      res.json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
