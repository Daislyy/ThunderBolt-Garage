import bcrypt from 'bcryptjs';
import db from '../config/database.js';

export const userService = {
  async getAllUsers() {
    const { data, error } = await db
      .from('users')
      .select('id, name, email, profile_image, role, created_at, updated_at')
      .order('id', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async getUserById(id) {
    const { data, error } = await db
      .from('users')
      .select('id, name, email, profile_image, role, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data || null;
  },

  async getUserByEmail(email) {
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data || null;
  },

  async createUser(userData) {
    const { name, email, password, profile_image, role = 'customer' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await db
      .from('users')
      .insert({ name, email, password: hashedPassword, profile_image: profile_image || null, role })
      .select('id, name, email, role')
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateUser(id, userData) {
    const updateData = {};
    if (userData.name !== undefined) updateData.name = userData.name;
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.profile_image !== undefined) updateData.profile_image = userData.profile_image;
    if (userData.role !== undefined) updateData.role = userData.role;

    if (Object.keys(updateData).length === 0) return false;

    const { data, error } = await db
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id');

    if (error) throw new Error(error.message);
    return data && data.length > 0;
  },

  async deleteUser(id) {
    const { data, error } = await db
      .from('users')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw new Error(error.message);
    return data && data.length > 0;
  }
};
