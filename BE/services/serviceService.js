import db from '../config/database.js';

export const serviceService = {
  async getAllServices() {
    const { data, error } = await db
      .from('services')
      .select('id, name, description, created_at, updated_at')
      .order('id', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async getServiceById(id) {
    const { data, error } = await db
      .from('services')
      .select('id, name, description, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data || null;
  },

  async createService(serviceData) {
    const { name, description } = serviceData;

    const { data, error } = await db
      .from('services')
      .insert({ name, description: description || null })
      .select('id, name, description')
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateService(id, serviceData) {
    const updateData = {};
    if (serviceData.name !== undefined) updateData.name = serviceData.name;
    if (serviceData.description !== undefined) updateData.description = serviceData.description;

    if (Object.keys(updateData).length === 0) return false;

    const { data, error } = await db
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select('id');

    if (error) throw new Error(error.message);
    return data && data.length > 0;
  },

  async deleteService(id) {
    const { data, error } = await db
      .from('services')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw new Error(error.message);
    return data && data.length > 0;
  }
};
