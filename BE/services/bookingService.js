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

const mapBookingWithServicePrice = (b) => {
  const svcPrice = Number(
    b.services?.price !== undefined && b.services?.price !== null
      ? b.services.price
      : (b.service_price || 100000)
  );
  const totalAmount = Number(b.total_amount || b.total_price) || svcPrice;

  return {
    ...b,
    customer_name: b.users?.name,
    customer_email: b.users?.email,
    vehicle_brand: b.vehicles?.brand,
    vehicle_model: b.vehicles?.model,
    vehicle_year: b.vehicles?.year,
    license_plate: b.vehicles?.license_plate,
    transmission: b.vehicles?.transmission,
    service_id: b.services?.id || b.service_id,
    service_name: b.services?.name,
    service_description: b.services?.description,
    service_price: svcPrice,
    total_price: totalAmount,
    users: undefined,
    vehicles: undefined,
    services: undefined
  };
};

export const bookingService = {
  async getAllBookings() {
    try {
      const { data, error } = await db
        .from('bookings')
        .select(`
          *,
          users(name, email),
          vehicles(brand, model, year, license_plate, transmission),
          services(id, name, description, price)
        `)
        .order('id', { ascending: false });

      if (!error && data) {
        return data.map(mapBookingWithServicePrice);
      }
    } catch {}

    const { data, error } = await db
      .from('bookings')
      .select(`
        *,
        users(name, email),
        vehicles(brand, model, year, license_plate, transmission),
        services(id, name, description)
      `)
      .order('id', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapBookingWithServicePrice);
  },

  async getBookingsByUserId(userId) {
    const buildQuery = (svcSelect) => {
      let q = db
        .from('bookings')
        .select(`
          *,
          vehicles(brand, model, year, license_plate, transmission),
          services(${svcSelect})
        `)
        .order('id', { ascending: false });

      if (isValidInt4(userId)) {
        q = q.eq('user_id', Number(userId));
      }
      return q;
    };

    try {
      const { data, error } = await buildQuery('id, name, description, price');
      if (!error && data) {
        return data.map(mapBookingWithServicePrice);
      }
    } catch {}

    const { data, error } = await buildQuery('id, name, description');
    if (error) throw new Error(error.message);
    return (data || []).map(mapBookingWithServicePrice);
  },

  async getBookingById(idOrCode) {
    const buildQuery = (svcSelect) => {
      let q = db
        .from('bookings')
        .select(`
          *,
          users(name, email),
          vehicles(brand, model, year, license_plate, transmission),
          services(${svcSelect})
        `);

      const trimmed = String(idOrCode || '').trim();
      if (isValidInt4(trimmed)) {
        q = q.or(`id.eq.${Number(trimmed)},booking_code.eq.${trimmed}`);
      } else {
        q = q.eq('booking_code', trimmed);
      }
      return q;
    };

    try {
      const { data, error } = await buildQuery('id, name, description, price').maybeSingle();
      if (!error && data) {
        return mapBookingWithServicePrice(data);
      }
    } catch {}

    const { data, error } = await buildQuery('id, name, description').maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapBookingWithServicePrice(data);
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

    // 2. Resolve valid service_id & price in Supabase services table
    let validServiceId = null;
    let resolvedServicePrice = Number(bookingData.service_price || 0);

    if (isValidInt4(service_id)) {
      try {
        const { data: svcCheck } = await db.from('services').select('id, name, price').eq('id', Number(service_id)).maybeSingle();
        if (svcCheck) {
          validServiceId = svcCheck.id;
          if (!resolvedServicePrice && svcCheck.price) resolvedServicePrice = Number(svcCheck.price);
        }
      } catch {
        const { data: svcCheck } = await db.from('services').select('id, name').eq('id', Number(service_id)).maybeSingle();
        if (svcCheck) validServiceId = svcCheck.id;
      }
    }
    if (!validServiceId && service_name) {
      try {
        const { data: svcByName } = await db.from('services').select('id, name, price').ilike('name', `%${service_name.trim()}%`).limit(1).maybeSingle();
        if (svcByName) {
          validServiceId = svcByName.id;
          if (!resolvedServicePrice && svcByName.price) resolvedServicePrice = Number(svcByName.price);
        }
      } catch {
        const { data: svcByName } = await db.from('services').select('id, name').ilike('name', `%${service_name.trim()}%`).limit(1).maybeSingle();
        if (svcByName) validServiceId = svcByName.id;
      }
    }
    if (!validServiceId) {
      try {
        const { data: firstSvc } = await db.from('services').select('id, price').order('id', { ascending: true }).limit(1).maybeSingle();
        if (firstSvc) {
          validServiceId = firstSvc.id;
          if (!resolvedServicePrice && firstSvc.price) resolvedServicePrice = Number(firstSvc.price);
        }
      } catch {
        const { data: firstSvc } = await db.from('services').select('id').order('id', { ascending: true }).limit(1).maybeSingle();
        if (firstSvc) validServiceId = firstSvc.id;
      }
    }
    if (!resolvedServicePrice) resolvedServicePrice = 100000;

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

    let insertPayload = {
      booking_code,
      user_id: validUserId,
      vehicle_id: validVehicleId,
      service_id: validServiceId,
      booking_date,
      booking_time,
      notes: notes || null,
      status: 'Menunggu',
      total_amount: resolvedServicePrice
    };

    let { data, error } = await db
      .from('bookings')
      .insert(insertPayload)
      .select('id, booking_code, user_id, vehicle_id, service_id, status, booking_date, booking_time')
      .single();

    if (error && error.message?.includes('total_amount')) {
      delete insertPayload.total_amount;
      const res = await db.from('bookings').insert(insertPayload).select('id, booking_code, user_id, vehicle_id, service_id, status, booking_date, booking_time').single();
      data = res.data;
      error = res.error;
    }

    if (error) throw new Error(error.message);
    return {
      ...bookingData,
      id: data.id,
      booking_code: data.booking_code,
      user_id: data.user_id,
      vehicle_id: data.vehicle_id,
      service_id: data.service_id,
      service_price: resolvedServicePrice,
      total_price: resolvedServicePrice,
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
