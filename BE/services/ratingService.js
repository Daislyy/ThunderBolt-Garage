import db from '../config/database.js';

export const ratingService = {
  async getAllRatings() {
    const [rows] = await db.query(
      `SELECT r.*,
              u.name as customer_name, u.email as customer_email,
              s.name as service_name,
              b.booking_code
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       JOIN services s ON r.service_id = s.id
       JOIN bookings b ON r.booking_id = b.id
       ORDER BY r.id DESC`
    );
    return rows;
  },

  async getRatingById(id) {
    const [rows] = await db.query(
      `SELECT r.*,
              u.name as customer_name, u.email as customer_email,
              s.name as service_name,
              b.booking_code
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       JOIN services s ON r.service_id = s.id
       JOIN bookings b ON r.booking_id = b.id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async getRatingsByService(serviceId) {
    const [rows] = await db.query(
      `SELECT r.*,
              u.name as customer_name, u.email as customer_email,
              s.name as service_name,
              b.booking_code
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       JOIN services s ON r.service_id = s.id
       JOIN bookings b ON r.booking_id = b.id
       WHERE r.service_id = ?
       ORDER BY r.id DESC`,
      [serviceId]
    );
    return rows;
  },

  async getRatingsByUser(userId) {
    const [rows] = await db.query(
      `SELECT r.*,
              u.name as customer_name, u.email as customer_email,
              s.name as service_name,
              b.booking_code
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       JOIN services s ON r.service_id = s.id
       JOIN bookings b ON r.booking_id = b.id
       WHERE r.user_id = ?
       ORDER BY r.id DESC`,
      [userId]
    );
    return rows;
  },

  async createRating(ratingData) {
    const { booking_id, user_id, service_id, rating, review } = ratingData;

    const [result] = await db.query(
      `INSERT INTO ratings (booking_id, user_id, service_id, rating, review)
       VALUES (?, ?, ?, ?, ?)`,
      [booking_id, user_id, service_id, rating, review || null]
    );

    return { id: result.insertId, ...ratingData };
  },

  async deleteRating(id) {
    const [result] = await db.query('DELETE FROM ratings WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};
