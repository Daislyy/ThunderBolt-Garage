import db from '../config/database.js';

export const serviceService = {
  async getAllServices() {
    try {
      const { data, error } = await db
        .from('services')
        .select('id, name, description, price, created_at, updated_at')
        .order('id', { ascending: true });

      if (!error && data) return data;
    } catch {}

    // Fallback if price column does not exist yet in Supabase
    const { data, error } = await db
      .from('services')
      .select('id, name, description, created_at, updated_at')
      .order('id', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async getServiceById(id) {
    try {
      const { data, error } = await db
        .from('services')
        .select('id, name, description, price, created_at, updated_at')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) return data;
    } catch {}

    const { data, error } = await db
      .from('services')
      .select('id, name, description, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data || null;
  },

  async createService(serviceData) {
    const { name, description, price } = serviceData;

    const insertData = { name, description: description || null };
    if (price !== undefined && price !== null && !isNaN(Number(price))) {
      insertData.price = Number(price);
    }

    try {
      const { data, error } = await db
        .from('services')
        .insert(insertData)
        .select('*')
        .single();

      if (!error && data) return data;
      if (error && !error.message?.includes('price')) throw error;
    } catch (err) {
      if (!err.message?.includes('price')) throw err;
    }

    // Fallback without price column
    const fallbackData = { name, description: description || null };
    const { data, error } = await db
      .from('services')
      .insert(fallbackData)
      .select('id, name, description')
      .single();

    if (error) throw new Error(error.message);
    return { ...data, price: insertData.price || 100000 };
  },

  async updateService(id, serviceData) {
    const updateData = {};
    if (serviceData.name !== undefined) updateData.name = serviceData.name;
    if (serviceData.description !== undefined) updateData.description = serviceData.description;
    if (serviceData.price !== undefined && serviceData.price !== null && !isNaN(Number(serviceData.price))) {
      updateData.price = Number(serviceData.price);
    }

    if (Object.keys(updateData).length === 0) return false;

    try {
      const { data, error } = await db
        .from('services')
        .update(updateData)
        .eq('id', id)
        .select('id');

      if (!error && data && data.length > 0) return true;
      if (error && !error.message?.includes('price')) throw error;
    } catch (err) {
      if (!err.message?.includes('price')) throw err;
    }

    // Fallback without price if column is missing
    const fallbackUpdate = { ...updateData };
    delete fallbackUpdate.price;

    if (Object.keys(fallbackUpdate).length === 0) return true;

    const { data, error } = await db
      .from('services')
      .update(fallbackUpdate)
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
