import db from '../config/database.js';
import bcrypt from 'bcryptjs';

export async function initDb() {
  console.log('Initializing database tables on Aiven MySQL...');

  try {
    // 1. Table users
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        profile_image VARCHAR(255) NULL,
        role ENUM('customer', 'admin') DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure profile_image column is VARCHAR(255) for existing databases
    await db.query('ALTER TABLE users MODIFY COLUMN profile_image VARCHAR(255) NULL;').catch(() => {});

    // 2. Table services
    await db.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Table vehicles
    await db.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INT NOT NULL,
        license_plate VARCHAR(50) NOT NULL,
        transmission VARCHAR(50) NULL,
        image TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Table bookings
    await db.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_code VARCHAR(50) NOT NULL UNIQUE,
        user_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        service_id INT NOT NULL,
        booking_date DATE NOT NULL,
        booking_time VARCHAR(20) NOT NULL,
        notes TEXT NULL,
        status VARCHAR(50) DEFAULT 'Menunggu',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Table notifications
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'system',
        reference_id INT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Table ratings
    await db.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        user_id INT NOT NULL,
        service_id INT NOT NULL,
        rating INT NOT NULL,
        review TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Table spareparts
    await db.query(`
      CREATE TABLE IF NOT EXISTS spareparts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Table booking_spareparts
    await db.query(`
      CREATE TABLE IF NOT EXISTS booking_spareparts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        sparepart_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        CONSTRAINT fk_bs_sparepart FOREIGN KEY (sparepart_id) REFERENCES spareparts(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('All tables created/verified successfully on Aiven MySQL.');

    // Seed default admin if missing
    const [existingAdmin] = await db.query('SELECT id FROM users WHERE email = ?', ['admin@thunderbolt.com']);
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@1234', 10);
      await db.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin ThunderBolt', 'admin@thunderbolt.com', hashedPassword, 'admin']
      );
      console.log('Default admin user created: admin@thunderbolt.com / Admin@1234');
    }

    // Seed default services if empty
    const [existingServices] = await db.query('SELECT id FROM services');
    if (existingServices.length === 0) {
      const defaultServices = [
        ['Servis Berkala & Ganti Oli', 'Pemeriksaan menyeluruh komponen mesin, penggantian oli mesin dan filter, serta penyetelan ulang.'],
        ['Perbaikan Mesin (Engine Overhaul)', 'Diagnosa mendalam dan perbaikan komponen internal mesin untuk performa optimal.'],
        ['Tune Up & Diagnostic System', 'Pembersihan ruang bakar, perbaikan sistem injeksi, dan diagnosa komputerisasi OBD-II.'],
        ['Perbaikan Kaki-kaki & Spooring', 'Pemeriksaan suspensi, ball joint, tie rod, serta penyelarasan roda (spooring & balancing).']
      ];
      for (const [name, description] of defaultServices) {
        await db.query('INSERT INTO services (name, description) VALUES (?, ?)', [name, description]);
      }
      console.log('Default services seeded successfully.');
    }

    // Seed default spareparts if empty
    const [existingSpareparts] = await db.query('SELECT id FROM spareparts');
    if (existingSpareparts.length === 0) {
      const defaultSpareparts = [
        ['Oli Mesin Synthetic 4L', 350000],
        ['Filter Oli Original', 45000],
        ['Kampas Rem Depan Set', 250000],
        ['Busi Iridium Super', 95000],
        ['Filter Udara Mesin', 80000],
        ['Mintel / Minyak Rem DOT 4', 60000],
        ['Aki Mobil 12V 45Ah', 850000],
        ['V-Belt Alternator', 120000]
      ];
      for (const [name, price] of defaultSpareparts) {
        await db.query('INSERT INTO spareparts (name, price) VALUES (?, ?)', [name, price]);
      }
      console.log('Default spareparts seeded successfully.');
    }

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Run direct if executed via CLI
if (process.argv[1] && process.argv[1].includes('initDb.js')) {
  initDb().then(() => process.exit(0)).catch(() => process.exit(1));
}
