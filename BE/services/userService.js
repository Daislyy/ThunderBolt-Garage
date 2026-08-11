import bcrypt from 'bcryptjs';
import db from '../config/database.js';

export const userService = {
  async getAllUsers() {
    const [rows] = await db.query(
      'SELECT id, name, email, profile_image, role, created_at, updated_at FROM users ORDER BY id DESC'
    );
    return rows;
  },

  async getUserById(id) {
    const [rows] = await db.query(
      'SELECT id, name, email, profile_image, role, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async getUserByEmail(email) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  async createUser(userData) {
    const { name, email, password, profile_image, role = 'customer' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, profile_image, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, profile_image || null, role]
    );
    return { id: result.insertId, name, email, role };
  },

  async updateUser(id, userData) {
    const { name, email, profile_image, role } = userData;
    const [result] = await db.query(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), profile_image = COALESCE(?, profile_image), role = COALESCE(?, role) WHERE id = ?',
      [name, email, profile_image, role, id]
    );
    return result.affectedRows > 0;
  },

  async deleteUser(id) {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};
