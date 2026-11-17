import db from '../config/database.js';

const isValidInt4 = (val) => {
  const n = Number(val);
  return !isNaN(n) && Number.isInteger(n) && n > 0 && n <= 2147483647;
};

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

    return (data || []).map(v => ({
      ...v,
      owner_name: v.users?.name,
      owner_email: v.users?.email,
      users: undefined
    }));
  },

  async getVehiclesByUserId(userId, email) {
    let query = db.from('vehicles').select('*, users(name, email)').order('id', { ascending: false });

    if (isValidInt4(userId)) {
      query = query.eq('user_id', Number(userId));
    } else if (email) {
      const emailClean = String(email).trim().toLowerCase();
      const { data: u } = await db.from('users').select('id').ilike('email', emailClean).limit(1);
      if (u && u.length > 0) {
        query = query.eq('user_id', u[0].id);
      }
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map(v => ({
      ...v,
      owner_name: v.users?.name,
      owner_email: v.users?.email,
      users: undefined
    }));
  },

  async getVehicleById(idOrPlate) {
    let query = db
      .from('vehicles')
      .select(`
        *,
        users(name, email)
      `);

    const trimmed = String(idOrPlate || '').trim();
    if (isValidInt4(trimmed)) {
      query = query.or(`id.eq.${Number(trimmed)},license_plate.eq.${trimmed.toUpperCase()}`);
    } else {
      query = query.eq('license_plate', trimmed.toUpperCase());
    }

    const { data, error } = await query.maybeSingle();

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
    const { user_id, user_email, brand, model, year, license_plate, transmission, image } = vehicleData;

    // 1. Resolve valid user_id in Supabase
    let validUserId = null;
    const emailToFind = String(user_email || '').trim().toLowerCase();
    if (emailToFind) {
      const { data: uByEmail } = await db.from('users').select('id').ilike('email', emailToFind).limit(1);
      if (uByEmail && uByEmail.length > 0) validUserId = uByEmail[0].id;
    }
    if (!validUserId && isValidInt4(user_id)) {
      const { data: userCheck } = await db.from('users').select('id').eq('id', Number(user_id)).limit(1);
      if (userCheck && userCheck.length > 0) validUserId = userCheck[0].id;
    }
    if (!validUserId) {
      const { data: firstUser } = await db.from('users').select('id').order('id', { ascending: true }).limit(1);
      if (firstUser && firstUser.length > 0) validUserId = firstUser[0].id;
    }
    if (!validUserId) {
      const { data: newUser } = await db.from('users').insert({
        name: 'Pelanggan',
        email: emailToFind || 'pelanggan@thunderbolt.com',
        role: 'customer'
      }).select('id').single();
      if (newUser) validUserId = newUser.id;
    }

    // 2. Sanitize transmission according to Postgres CHECK (transmission IN ('manual', 'automatic'))
    let cleanTransmission = 'automatic';
    if (transmission) {
      const t = String(transmission).toLowerCase();
      if (t.includes('man') || t.includes('kopling')) {
        cleanTransmission = 'manual';
      } else {
        cleanTransmission = 'automatic';
      }
    }

    const cleanPlate = (license_plate || '').trim().toUpperCase();

    // 3. Check if vehicle with this license plate already exists
    const { data: existingList } = await db.from('vehicles').select('*').ilike('license_plate', cleanPlate).limit(1);
    const existing = existingList && existingList.length > 0 ? existingList[0] : null;

    if (existing) {
      const { data: updated } = await db.from('vehicles').update({
        user_id: validUserId || existing.user_id,
        brand: brand || existing.brand,
        model: model || existing.model,
        year: Number(year) || existing.year,
        transmission: cleanTransmission
      }).eq('id', existing.id).select('*').single();

      return updated || { ...existing, user_id: validUserId || existing.user_id, brand, model, year, transmission: cleanTransmission };
    }

    // 4. Insert new vehicle into Supabase
    const { data, error } = await db
      .from('vehicles')
      .insert({
        user_id: validUserId,
        brand: brand || 'Honda',
        model: model || 'Kendaraan',
        year: Number(year) || 2023,
        license_plate: cleanPlate,
        transmission: cleanTransmission,
        image: image || null
      })
      .select('*')
      .single();

    if (error) {
      console.error('Vehicle insert error in Supabase:', error.message);
      throw new Error(error.message);
    }
    return data;
  },

  async updateVehicle(id, vehicleData) {
    const updateData = {};
    if (vehicleData.brand !== undefined) updateData.brand = vehicleData.brand;
    if (vehicleData.model !== undefined) updateData.model = vehicleData.model;
    if (vehicleData.year !== undefined) updateData.year = Number(vehicleData.year);
    if (vehicleData.license_plate !== undefined) updateData.license_plate = vehicleData.license_plate.trim().toUpperCase();
    if (vehicleData.transmission !== undefined) updateData.transmission = vehicleData.transmission;
    if (vehicleData.image !== undefined) updateData.image = vehicleData.image;

    if (Object.keys(updateData).length === 0) return false;

    let query = db.from('vehicles').update(updateData);
    const trimmed = String(id || '').trim();
    if (isValidInt4(trimmed)) {
      query = query.or(`id.eq.${Number(trimmed)},license_plate.eq.${trimmed.toUpperCase()}`);
    } else {
      query = query.eq('license_plate', trimmed.toUpperCase());
    }

    const { data, error } = await query.select('id');
    if (error) throw new Error(error.message);
    return data && data.length > 0;
  },

  async deleteVehicle(idOrPlate) {
    let query = db.from('vehicles').delete();
    const trimmed = String(idOrPlate || '').trim();
    if (isValidInt4(trimmed)) {
      query = query.or(`id.eq.${Number(trimmed)},license_plate.eq.${trimmed.toUpperCase()}`);
    } else {
      query = query.eq('license_plate', trimmed.toUpperCase());
    }

    const { data, error } = await query.select('id');
    if (error) throw new Error(error.message);
    return data && data.length > 0;
  }
};
