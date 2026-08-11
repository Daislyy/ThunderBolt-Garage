import db from '../config/database.js';

export const sparepartService = {
  async getAllSpareparts() {
    const [rows] = await db.query('SELECT id, name, price FROM spareparts ORDER BY name ASC');
    return rows.map(r => ({
      ...r,
      price: Number(r.price)
    }));
  },

  async getBookingSpareparts(bookingId) {
    const [rows] = await db.query(
      `SELECT bs.id, bs.booking_id, bs.sparepart_id, bs.quantity, bs.notes,
              s.name, s.price, (bs.quantity * s.price) as subtotal
       FROM booking_spareparts bs
       JOIN spareparts s ON bs.sparepart_id = s.id
       WHERE bs.booking_id = ?
       ORDER BY bs.id ASC`,
      [bookingId]
    );

    const formattedSpareparts = rows.map(r => ({
      id: r.id,
      booking_id: r.booking_id,
      sparepart_id: r.sparepart_id,
      name: r.name,
      price: Number(r.price),
      quantity: r.quantity,
      notes: r.notes || '',
      subtotal: Number(r.subtotal)
    }));

    const totalPrice = formattedSpareparts.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      spareparts: formattedSpareparts,
      total_price: totalPrice
    };
  },

  async saveBookingSpareparts(bookingId, sparepartsArray = []) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Delete existing spareparts for this booking
      await connection.query('DELETE FROM booking_spareparts WHERE booking_id = ?', [bookingId]);

      // Insert new spareparts if provided
      if (Array.isArray(sparepartsArray) && sparepartsArray.length > 0) {
        const values = sparepartsArray.map(item => [
          bookingId,
          item.sparepart_id,
          item.quantity || 1,
          item.notes || null
        ]);

        await connection.query(
          'INSERT INTO booking_spareparts (booking_id, sparepart_id, quantity, notes) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};
