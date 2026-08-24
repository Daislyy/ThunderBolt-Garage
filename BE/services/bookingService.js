import db from '../config/database.js';

const generateBookingCode = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TBG-${dateStr}-${randomNum}`;
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

    // Flatten nested objects to match frontend expectations
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
    const { data, error } = await db
      .from('bookings')
      .select(`
        *,
        vehicles(brand, model, year, license_plate, transmission),
        services(name, description)
      `)
      .eq('user_id', userId)
      .order('id', { ascending: false });

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

  async getBookingById(id) {
    const { data, error } = await db
      .from('bookings')
      .select(`
        *,
        users(name, email),
        vehicles(brand, model, year, license_plate, transmission),
        services(name, description)
      `)
      .eq('id', id)
      .maybeSingle();

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
    const { user_id, vehicle_id, service_id, booking_date, booking_time, notes } = bookingData;
    const booking_code = generateBookingCode();
    
    const { data, error } = await db
      .from('bookings')
      .insert({
        booking_code, user_id, vehicle_id, service_id,
        booking_date, booking_time,
        notes: notes || null,
        status: 'Menunggu'
      })
      .select('id, booking_code')
      .single();

    if (error) throw new Error(error.message);
    return { id: data.id, booking_code: data.booking_code, ...bookingData, status: 'Menunggu' };
  },

  async updateBookingStatus(id, { status }) {
    const { data, error } = await db
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select('id');

    if (error) throw new Error(error.message);
    return data && data.length > 0;
  },

  async deleteBooking(id) {
    const { data, error } = await db
      .from('bookings')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw new Error(error.message);
    return data && data.length > 0;
  }
};
