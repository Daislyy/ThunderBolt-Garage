import db from '../config/database.js';

const generateBookingCode = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TBG-${dateStr}-${randomNum}`;
};

export const bookingService = {
  async getAllBookings() {
    const [rows] = await db.query(
      `SELECT b.*, 
              u.name as customer_name, u.email as customer_email,
              v.brand as vehicle_brand, v.model as vehicle_model,
              v.year as vehicle_year, v.license_plate, v.transmission,
              s.name as service_name, s.description as service_description
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN vehicles v ON b.vehicle_id = v.id
       JOIN services s ON b.service_id = s.id
       ORDER BY b.id DESC`
    );
    return rows;
  },

  async getBookingsByUserId(userId) {
    const [rows] = await db.query(
      `SELECT b.*, 
              v.brand as vehicle_brand, v.model as vehicle_model,
              v.year as vehicle_year, v.license_plate, v.transmission,
              s.name as service_name, s.description as service_description
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       JOIN services s ON b.service_id = s.id
       WHERE b.user_id = ?
       ORDER BY b.id DESC`,
      [userId]
    );
    return rows;
  },

  async getBookingById(id) {
    const [rows] = await db.query(
      `SELECT b.*, 
              u.name as customer_name, u.email as customer_email,
              v.brand as vehicle_brand, v.model as vehicle_model,
              v.year as vehicle_year, v.license_plate, v.transmission,
              s.name as service_name, s.description as service_description
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN vehicles v ON b.vehicle_id = v.id
       JOIN services s ON b.service_id = s.id
       WHERE b.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async createBooking(bookingData) {
    const { user_id, vehicle_id, service_id, booking_date, booking_time, notes } = bookingData;
    const booking_code = generateBookingCode();
    
    const [result] = await db.query(
      `INSERT INTO bookings (booking_code, user_id, vehicle_id, service_id, booking_date, booking_time, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Menunggu')`,
      [booking_code, user_id, vehicle_id, service_id, booking_date, booking_time, notes || null]
    );
    
    return { id: result.insertId, booking_code, ...bookingData, status: 'Menunggu' };
  },

  async updateBookingStatus(id, { status }) {
    const [result] = await db.query(
      `UPDATE bookings SET status = ? WHERE id = ?`,
      [status, id]
    );
    return result.affectedRows > 0;
  },

  async deleteBooking(id) {
    const [result] = await db.query('DELETE FROM bookings WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};
