import db from '../config/database.js';

const isValidInt4 = (val) => {
  const n = Number(val);
  return !isNaN(n) && Number.isInteger(n) && n > 0 && n <= 2147483647;
};

export const ratingService = {
  async getAllRatings() {
    const { data, error } = await db
      .from('ratings')
      .select(`
        *,
        users(name, email),
        services(name),
        bookings(booking_code)
      `)
      .order('id', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(r => ({
      ...r,
      customer_name: r.users?.name,
      customer_email: r.users?.email,
      service_name: r.services?.name,
      booking_code: r.bookings?.booking_code,
      users: undefined,
      services: undefined,
      bookings: undefined
    }));
  },

  async getRatingById(id) {
    const { data, error } = await db
      .from('ratings')
      .select(`
        *,
        users(name, email),
        services(name),
        bookings(booking_code)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      ...data,
      customer_name: data.users?.name,
      customer_email: data.users?.email,
      service_name: data.services?.name,
      booking_code: data.bookings?.booking_code,
      users: undefined,
      services: undefined,
      bookings: undefined
    };
  },

  async getRatingsByService(serviceId) {
    let query = db
      .from('ratings')
      .select(`
        *,
        users(name, email),
        services(name),
        bookings(booking_code)
      `)
      .order('id', { ascending: false });

    if (isValidInt4(serviceId)) {
      query = query.eq('service_id', Number(serviceId));
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map(r => ({
      ...r,
      customer_name: r.users?.name,
      customer_email: r.users?.email,
      service_name: r.services?.name,
      booking_code: r.bookings?.booking_code,
      users: undefined,
      services: undefined,
      bookings: undefined
    }));
  },

  async getRatingsByUser(userId) {
    let query = db
      .from('ratings')
      .select(`
        *,
        users(name, email),
        services(name),
        bookings(booking_code)
      `)
      .order('id', { ascending: false });

    if (isValidInt4(userId)) {
      query = query.eq('user_id', Number(userId));
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map(r => ({
      ...r,
      customer_name: r.users?.name,
      customer_email: r.users?.email,
      service_name: r.services?.name,
      booking_code: r.bookings?.booking_code,
      users: undefined,
      services: undefined,
      bookings: undefined
    }));
  },

  async createRating(ratingData) {
    let { booking_id, booking_code, user_id, user_email, customer_email, service_id, service_name, rating, review } = ratingData;

    // 1. Resolve valid user_id in Supabase
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

    // 2. Resolve valid service_id in Supabase
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

    // 3. Resolve valid booking_id in Supabase
    let validBookingId = null;
    if (isValidInt4(booking_id)) {
      const { data: bkCheck } = await db.from('bookings').select('id').eq('id', Number(booking_id)).maybeSingle();
      if (bkCheck) validBookingId = bkCheck.id;
    }
    if (!validBookingId && booking_code) {
      const { data: bkByCode } = await db.from('bookings').select('id').eq('booking_code', String(booking_code).trim()).maybeSingle();
      if (bkByCode) validBookingId = bkByCode.id;
    }
    if (!validBookingId) {
      const { data: existingBooking } = await db.from('bookings').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
      if (existingBooking) {
        validBookingId = existingBooking.id;
      } else {
        // If bookings table is empty, create placeholder vehicle and booking
        let validVehicleId = 1;
        const { data: firstVeh } = await db.from('vehicles').select('id').limit(1).maybeSingle();
        if (firstVeh) {
          validVehicleId = firstVeh.id;
        } else {
          const { data: newVeh } = await db.from('vehicles').insert({
            user_id: validUserId,
            brand: 'Honda',
            model: 'Vario 160',
            year: 2023,
            license_plate: 'B 1234 TBG'
          }).select('id').single();
          if (newVeh) validVehicleId = newVeh.id;
        }

        const { data: newBk } = await db.from('bookings').insert({
          booking_code: booking_code || `TBG-${Date.now().toString().slice(-6)}`,
          user_id: validUserId,
          vehicle_id: validVehicleId,
          service_id: validServiceId,
          booking_date: new Date().toISOString().split('T')[0],
          booking_time: '09:00',
          status: 'Selesai'
        }).select('id').single();
        if (newBk) validBookingId = newBk.id;
      }
    }

    const { data, error } = await db
      .from('ratings')
      .insert({
        booking_id: validBookingId,
        user_id: validUserId,
        service_id: validServiceId,
        rating: Number(rating),
        review: review || null
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteRating(id) {
    const { data, error } = await db
      .from('ratings')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw new Error(error.message);
    return data && data.length > 0;
  }
};
