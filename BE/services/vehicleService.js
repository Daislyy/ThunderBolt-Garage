import db from '../config/database.js';

export const vehicleService = {
  async getAllVehicles() {
    const { data, error } = await db
      .from('vehicles')
      .select(`
        *,
        users(name, email)
      `)
      .order('id', { ascending: false });

    if (error) throw new Error(error.message);

    // Flatten nested users object to match frontend expectations
    return (data || []).map(v => ({
      ...v,
      owner_name: v.users?.name,
      owner_email: v.users?.email,
      users: undefined
    }));
  },

  async getVehiclesByUserId(userId) {
    const { data, error } = await db
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async getVehicleById(id) {
    const { data, error } = await db
      .from('vehicles')
      .select(`
        *,
        users(name, email)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      ...data,
      owner_name: data.users?.name,
      owner_email: data.users?.email,
      users: undefined
    };
  },

  async createVehicle(vehicleData) {
    const { user_id, brand, model, year, license_plate, transmission, image } = vehicleData;

    const { data, error } = await db
      .from('vehicles')
      .insert({
        user_id, brand, model, year, license_plate,
        transmission: transmission || null,
        image: image || null
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateVehicle(id, vehicleData) {
    const updateData = {};
    if (vehicleData.brand !== undefined) updateData.brand = vehicleData.brand;
    if (vehicleData.model !== undefined) updateData.model = vehicleData.model;
    if (vehicleData.year !== undefined) updateData.year = vehicleData.year;
    if (vehicleData.license_plate !== undefined) updateData.license_plate = vehicleData.license_plate;
    if (vehicleData.transmission !== undefined) updateData.transmission = vehicleData.transmission;
    if (vehicleData.image !== undefined) updateData.image = vehicleData.image;

    if (Object.keys(updateData).length === 0) return false;

    const { data, error } = await db
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select('id');

    if (error) throw new Error(error.message);
    return data && data.length > 0;
  },

  async deleteVehicle(id) {
    const { data, error } = await db
      .from('vehicles')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw new Error(error.message);
    return data && data.length > 0;
  }
};
