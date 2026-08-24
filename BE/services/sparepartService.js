import db from '../config/database.js';

export const sparepartService = {
  async getAllSpareparts() {
    const { data, error } = await db
      .from('spareparts')
      .select('id, name, price, created_at, updated_at')
      .order('id', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(r => ({
      ...r,
      price: Number(r.price)
    }));
  },

  async getSparepartById(id) {
    const { data, error } = await db
      .from('spareparts')
      .select('id, name, price, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      ...data,
      price: Number(data.price)
    };
  },

  async createSparepart(sparepartData) {
    const { name, price } = sparepartData;

    const { data, error } = await db
      .from('spareparts')
      .insert({ name, price: Number(price) })
      .select('id, name, price')
      .single();

    if (error) throw new Error(error.message);
    return {
      ...data,
      price: Number(data.price)
    };
  },

  async updateSparepart(id, sparepartData) {
    const updateData = {};
    if (sparepartData.name !== undefined) updateData.name = sparepartData.name;
    if (sparepartData.price !== undefined) updateData.price = Number(sparepartData.price);

    if (Object.keys(updateData).length === 0) return false;

    const { data, error } = await db
      .from('spareparts')
      .update(updateData)
      .eq('id', id)
      .select('id');

    if (error) throw new Error(error.message);
    return data && data.length > 0;
  },

  async deleteSparepart(id) {
    // Check if sparepart is referenced in booking_spareparts
    const { data: check, error: checkError } = await db
      .from('booking_spareparts')
      .select('id')
      .eq('sparepart_id', id);

    if (checkError) throw new Error(checkError.message);
    if (check && check.length > 0) {
      const error = new Error('Sparepart tidak dapat dihapus karena tercatat dalam riwayat booking kendaraan.');
      error.statusCode = 400;
      throw error;
    }

    const { data, error } = await db
      .from('spareparts')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw new Error(error.message);
    return data && data.length > 0;
  },

  async getBookingSpareparts(bookingId) {
    const { data: rows, error } = await db
      .from('booking_spareparts')
      .select(`
        id, booking_id, sparepart_id, quantity, notes,
        spareparts(name, price)
      `)
      .eq('booking_id', bookingId)
      .order('id', { ascending: true });

    if (error) throw new Error(error.message);

    const formattedSpareparts = (rows || []).map(r => ({
      id: r.id,
      booking_id: r.booking_id,
      sparepart_id: r.sparepart_id,
      name: r.spareparts?.name,
      price: Number(r.spareparts?.price || 0),
      quantity: r.quantity,
      notes: r.notes || '',
      subtotal: r.quantity * Number(r.spareparts?.price || 0)
    }));

    const totalPrice = formattedSpareparts.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      spareparts: formattedSpareparts,
      total_price: totalPrice
    };
  },

  async saveBookingSpareparts(bookingId, sparepartsArray = []) {
    // Delete existing spareparts for this booking
    const { error: deleteError } = await db
      .from('booking_spareparts')
      .delete()
      .eq('booking_id', bookingId);

    if (deleteError) throw new Error(deleteError.message);

    // Insert new spareparts if provided
    if (Array.isArray(sparepartsArray) && sparepartsArray.length > 0) {
      const insertData = sparepartsArray.map(item => ({
        booking_id: bookingId,
        sparepart_id: item.sparepart_id,
        quantity: item.quantity || 1,
        notes: item.notes || null
      }));

      const { error: insertError } = await db
        .from('booking_spareparts')
        .insert(insertData);

      if (insertError) throw new Error(insertError.message);
    }

    return true;
  }
};
