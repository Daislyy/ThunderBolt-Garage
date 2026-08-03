import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedSampleData() {
  try {
    console.log('🌱 Checking sample data in thunderbolt_db...');

    // 1. Check or create default customer
    const [custRows] = await db.query('SELECT id FROM users WHERE email = ?', ['budi@gmail.com']);
    let customerId;
    if (custRows.length === 0) {
      const hashedPass = await bcrypt.hash('123456', 10);
      const [resCust] = await db.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Budi Santoso', 'budi@gmail.com', hashedPass, 'customer']
      );
      customerId = resCust.insertId;
      console.log('✅ Created sample customer: Budi Santoso');
    } else {
      customerId = custRows[0].id;
    }

    // 2. Check or create default vehicle
    const [vehRows] = await db.query('SELECT id FROM vehicles WHERE user_id = ?', [customerId]);
    let vehicleId;
    if (vehRows.length === 0) {
      const [resVeh] = await db.query(
        'INSERT INTO vehicles (user_id, brand, model, year, license_plate, transmission) VALUES (?, ?, ?, ?, ?, ?)',
        [customerId, 'Toyota', 'Avanza Veloz', 2022, 'B 1234 ABC', 'automatic']
      );
      vehicleId = resVeh.insertId;
      console.log('✅ Created sample vehicle: Toyota Avanza Veloz (B 1234 ABC)');
    } else {
      vehicleId = vehRows[0].id;
    }

    // 3. Check or create default services
    let serviceId;
    const [servRows] = await db.query('SELECT id FROM services LIMIT 1');
    if (servRows.length === 0) {
      const [resServ] = await db.query(
        'INSERT INTO services (name, description) VALUES (?, ?)',
        ['Service Berkala & Ganti Oli', 'Pemeriksaan rutin komponen kendaraan, tune up, dan penggantian oli mesin.']
      );
      serviceId = resServ.insertId;
      console.log('✅ Created sample service');
    } else {
      serviceId = servRows[0].id;
    }

    // 4. Check or create sample booking
    const [bookRows] = await db.query('SELECT id FROM bookings LIMIT 1');
    if (bookRows.length === 0) {
      const today = new Date().toISOString().slice(0, 10);
      await db.query(
        `INSERT INTO bookings (booking_code, user_id, vehicle_id, service_id, booking_date, booking_time, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Menunggu')`,
        ['TBG-20260727-8899', customerId, vehicleId, serviceId, today, '09:00:00', 'Bunyi decit pada rem depan saat pengereman.']
      );
      console.log('✅ Created sample booking: TBG-20260727-8899');
    } else {
      console.log('ℹ️ Booking data already exists.');
    }

    console.log('🚀 Sample data seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding sample data:', error.message);
    process.exit(1);
  }
}

seedSampleData();
