import db from '../config/database.js';

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
    const { data, error } = await db
      .from('ratings')
      .select(`
        *,
        users(name, email),
        services(name),
        bookings(booking_code)
      `)
      .eq('service_id', serviceId)
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

  async getRatingsByUser(userId) {
    const { data, error } = await db
      .from('ratings')
      .select(`
        *,
        users(name, email),
        services(name),
        bookings(booking_code)
      `)
      .eq('user_id', userId)
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

  async createRating(ratingData) {
    const { booking_id, user_id, service_id, rating, review } = ratingData;

    const { data, error } = await db
      .from('ratings')
      .insert({
        booking_id, user_id, service_id, rating,
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
