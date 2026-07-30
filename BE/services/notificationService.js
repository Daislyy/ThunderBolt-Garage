import db from '../config/database.js';

export const notificationService = {
  async getNotificationsByUserId(userId) {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );
    return rows;
  },

  async createNotification(notificationData) {
    const { user_id, title, message, type = 'system', reference_id } = notificationData;
    const [result] = await db.query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id, is_read)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [user_id, title, message, type, reference_id || null]
    );
    return { id: result.insertId, ...notificationData, is_read: false };
  },

  async markAsRead(id) {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  async deleteNotification(id) {
    const [result] = await db.query('DELETE FROM notifications WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};
