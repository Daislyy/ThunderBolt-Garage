import db from '../config/database.js';

export const vehicleService = {
  async getAllVehicles() {
    const [rows] = await db.query(
      `SELECT v.*, u.name as owner_name, u.email as owner_email 
       FROM vehicles v 
       JOIN users u ON v.user_id = u.id 
       ORDER BY v.id DESC`
    );
    return rows;
  },

  async getVehiclesByUserId(userId) {
    const [rows] = await db.query(
      'SELECT * FROM vehicles WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );
    return rows;
  },

  async getVehicleById(id) {
    const [rows] = await db.query(
      `SELECT v.*, u.name as owner_name, u.email as owner_email 
       FROM vehicles v 
       JOIN users u ON v.user_id = u.id 
       WHERE v.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async createVehicle(vehicleData) {
    const { user_id, brand, model, year, license_plate, transmission, image } = vehicleData;
    const [result] = await db.query(
      `INSERT INTO vehicles (user_id, brand, model, year, license_plate, transmission, image)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, brand, model, year, license_plate, transmission || null, image || null]
    );
    return { id: result.insertId, ...vehicleData };
  },

  async updateVehicle(id, vehicleData) {
    const { brand, model, year, license_plate, transmission, image } = vehicleData;
    const [result] = await db.query(
      `UPDATE vehicles SET 
        brand = COALESCE(?, brand),
        model = COALESCE(?, model),
        year = COALESCE(?, year),
        license_plate = COALESCE(?, license_plate),
        transmission = COALESCE(?, transmission),
        image = COALESCE(?, image)
       WHERE id = ?`,
      [brand, model, year, license_plate, transmission, image, id]
    );
    return result.affectedRows > 0;
  },

  async deleteVehicle(id) {
    const [result] = await db.query('DELETE FROM vehicles WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};
