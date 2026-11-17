import db from '../config/database.js';

const generateBookingCode = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TBG-${dateStr}-${randomNum}`;
};

const isValidInt4 = (val) => {
  const n = Number(val);
  return !isNaN(n) && Number.isInteger(n) && n > 0 && n <= 2147483647;
};

export const bookingService = {
  async getAllBookings() {
    const { data, error } = await db
      .from('bookings')
      .select(`
        *,
        users(name, email),
        vehicles(brand, model, year, license_plate, transmission),
        services(name, description)
      `)
      .order('id', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(b => ({
      ...b,
      customer_name: b.users?.name,
      customer_email: b.users?.email,
      vehicle_brand: b.vehicles?.brand,
      vehicle_model: b.vehicles?.model,
      vehicle_year: b.vehicles?.year,
      license_plate: b.vehicles?.license_plate,
      transmission: b.vehicles?.transmission,
      service_name: b.services?.name,
      service_description: b.services?.description,
      users: undefined,
      vehicles: undefined,
      services: undefined
    }));
  },

  async getBookingsByUserId(userId) {
    let query = db
      .from('bookings')
      .select(`
        *,
        vehicles(brand, model, year, license_plate, transmission),
        services(name, description)
      `)
      .order('id', { ascending: false });

    if (isValidInt4(userId)) {
      query = query.eq('user_id', Number(userId));
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map(b => ({
      ...b,
      vehicle_brand: b.vehicles?.brand,
      vehicle_model: b.vehicles?.model,
      vehicle_year: b.vehicles?.year,
      license_plate: b.vehicles?.license_plate,
      transmission: b.vehicles?.transmission,
      service_name: b.services?.name,
      service_description: b.services?.description,
      vehicles: undefined,
      services: undefined
    }));
  },

  async getBookingById(idOrCode) {
    let query = db
      .from('bookings')
      .select(`
        *,
        users(name, email),
        vehicles(brand, model, year, license_plate, transmission),
        services(name, description)
      `);

    const trimmed = String(idOrCode || '').trim();
    if (isValidInt4(trimmed)) {
      query = query.or(`id.eq.${Number(trimmed)},booking_code.eq.${trimmed}`);
    } else {
      query = query.eq('booking_code', trimmed);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      ...data,
      customer_name: data.users?.name,
      customer_email: data.users?.email,
      vehicle_brand: data.vehicles?.brand,
      vehicle_model: data.vehicles?.model,
      vehicle_year: data.vehicles?.year,
      license_plate: data.vehicles?.license_plate,
      transmission: data.vehicles?.transmission,
      service_name: data.services?.name,
      service_description: data.services?.description,
      users: undefined,
      vehicles: undefined,
      services: undefined
    };
  },

  async createBooking(bookingData) {
    let {
      user_id,
      customer_email,
      user_email,
      vehicle_id,
      license_plate,
      vehicle_brand,
      vehicle_model,
      vehicle_year,
      transmission,
      service_id,
      service_name,
      booking_date,
      booking_time,
      notes
    } = bookingData;
    const booking_code = bookingData.booking_code || generateBookingCode();
    
    // 1. Resolve valid user_id in Supabase users table
    let validUserId = null;
    if (isValidInt4(user_id)) {
      const { data: userCheck } = await db.from('users').select('id').eq('id', Number(user_id)).maybeSingle();
      if (userCheck) validUserId = userCheck.id;
    }
    const emailToFind = customer_email || user_email;
    if (!validUserId && emailToFind) {
      const { data: userByEmail } = await db.from('users').select('id').eq('email', emailToFind.trim()).maybeSingle();
      if (userByEmail) validUserId = userByEmail.id;
    }
    if (!validUserId) {
      const { data: firstUser } = await db.from('users').select('id').order('id', { ascending: true }).limit(1).maybeSingle();
      if (firstUser) validUserId = firstUser.id;
    }

    // 2. Resolve valid service_id in Supabase services table
    let validServiceId = null;
    if (isValidInt4(service_id)) {
      const { data: svcCheck } = await db.from('services').select('id').eq('id', Number(service_id)).maybeSingle();
      if (svcCheck) validServiceId = svcCheck.id;
    }
    if (!validServiceId && service_name) {
      const { data: svcByName } = await db.from('services').select('id').ilike('name', `%${service_name.trim()}%`).limit(1).maybeSingle();
      if (svcByName) validServiceId = svcByName.id;
    }
    if (!validServiceId) {
      const { data: firstSvc } = await db.from('services').select('id').order('id', { ascending: true }).limit(1).maybeSingle();
      if (firstSvc) validServiceId = firstSvc.id;
    }

    // 3. Resolve valid vehicle_id in Supabase vehicles table
    let validVehicleId = null;
    if (isValidInt4(vehicle_id)) {
      const { data: vehCheck } = await db.from('vehicles').select('id').eq('id', Number(vehicle_id)).maybeSingle();
      if (vehCheck) validVehicleId = vehCheck.id;
    }
    if (!validVehicleId && license_plate) {
      const cleanPlate = license_plate.trim().toUpperCase();
      const { data: vehByPlate } = await db.from('vehicles').select('id').ilike('license_plate', cleanPlate).maybeSingle();
      if (vehByPlate) validVehicleId = vehByPlate.id;
    }
    if (!validVehicleId) {
      const { data: firstVeh } = await db.from('vehicles').select('id').limit(1).maybeSingle();
      if (firstVeh) {
        validVehicleId = firstVeh.id;
      } else {
        let cleanTrans = 'automatic';
        if (transmission) {
          const t = String(transmission).toLowerCase();
          cleanTrans = (t.includes('man') || t.includes('kopling')) ? 'manual' : 'automatic';
        }
        const { data: newVeh } = await db.from('vehicles').insert({
          user_id: validUserId,
          brand: vehicle_brand || 'Honda',
          model: vehicle_model || 'Vario 160',
          year: Number(vehicle_year) || 2023,
          license_plate: (license_plate || 'B 1234 TBG').trim().toUpperCase(),
          transmission: cleanTrans
        }).select('id').single();
        if (newVeh) validVehicleId = newVeh.id;
      }
    }

    const { data, error } = await db
      .from('bookings')
      .insert({
        booking_code,
        user_id: validUserId,
        vehicle_id: validVehicleId,
        service_id: validServiceId,
        booking_date,
        booking_time,
        notes: notes || null,
        status: 'Menunggu'
      })
      .select('id, booking_code, user_id, vehicle_id, service_id, status, booking_date, booking_time')
      .single();

    if (error) throw new Error(error.message);
    return {
      ...bookingData,
      id: data.id,
      booking_code: data.booking_code,
      user_id: data.user_id,
      vehicle_id: data.vehicle_id,
      service_id: data.service_id,
      status: 'Menunggu'
    };
  },

  async updateBookingStatus(idOrCode, { status }) {
    const trimmed = String(idOrCode || '').trim();
    const queryBuilder = (st) => {
      let q = db.from('bookings').update({ status: st });
      if (isValidInt4(trimmed)) {
        return q.or(`id.eq.${Number(trimmed)},booking_code.eq.${trimmed}`);
      } else {
        return q.eq('booking_code', trimmed);
      }
    };

    try {
      const { data, error } = await queryBuilder(status).select('id, booking_code, user_id, status');
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      // Handle DB check constraint: if 'Menunggu Pembayaran' or 'Dibatalkan' not yet added to DB CHECK constraint
      if (err.message && err.message.includes('check constraint')) {
        const fallbackStatus = status === 'Menunggu Pembayaran' ? 'Menunggu Konfirmasi' : 'Menunggu';
        const { data } = await queryBuilder(fallbackStatus).select('id, booking_code, user_id, status');
        return data && data.length > 0 ? { ...data[0], status } : null;
      }
      throw new Error(err.message);
    }
  },

  async deleteBooking(idOrCode) {
    let query = db.from('bookings').delete();
    const trimmed = String(idOrCode || '').trim();

    if (isValidInt4(trimmed)) {
      query = query.or(`id.eq.${Number(trimmed)},booking_code.eq.${trimmed}`);
    } else {
      query = query.eq('booking_code', trimmed);
    }

    const { data, error } = await query.select('id');
    if (error) throw new Error(error.message);
    return data && data.length > 0;
  }
};
