import db from '../config/database.js';

export const serviceService = {
  async getAllServices() {
    const [rows] = await db.query(
      'SELECT id, name, description, created_at, updated_at FROM services ORDER BY id ASC'
    );
    return rows;
  },

  async getServiceById(id) {
    const [rows] = await db.query(
      'SELECT id, name, description, created_at, updated_at FROM services WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async createService(serviceData) {
    const { name, description } = serviceData;
    const [result] = await db.query(
      'INSERT INTO services (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    return { id: result.insertId, name, description: description || null };
  },

  async updateService(id, serviceData) {
    const { name, description } = serviceData;
    const [result] = await db.query(
      'UPDATE services SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?',
      [name, description, id]
    );
    return result.affectedRows > 0;
  },

  async deleteService(id) {
    const [result] = await db.query('DELETE FROM services WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};
