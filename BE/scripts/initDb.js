import db from '../config/database.js';
import bcrypt from 'bcryptjs';

export async function initDb() {
  console.log('Checking Supabase database...');

  try {
    // Tables are already created in Supabase via SQL editor.
    // Just verify connection and seed default data if needed.

    // Seed default admin if missing
    const { data: existingAdmin, error: adminCheckError } = await db
      .from('users')
      .select('id')
      .eq('email', 'admin@thunderbolt.com');

    if (adminCheckError) throw new Error(adminCheckError.message);

    if (!existingAdmin || existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@1234', 10);
      const { error: adminInsertError } = await db
        .from('users')
        .insert({
          name: 'Admin ThunderBolt',
          email: 'admin@thunderbolt.com',
          password: hashedPassword,
          role: 'admin'
        });

      if (adminInsertError) throw new Error(adminInsertError.message);
      console.log('Default admin user created: admin@thunderbolt.com / Admin@1234');
    } else {
      console.log('Admin user already exists.');
    }

    // Seed default services if empty
    const { data: existingServices, error: svcCheckError } = await db
      .from('services')
      .select('id')
      .limit(1);

    if (svcCheckError) throw new Error(svcCheckError.message);

    if (!existingServices || existingServices.length === 0) {
      const defaultServices = [
        { name: 'Servis Berkala & Ganti Oli', description: 'Pemeriksaan menyeluruh komponen mesin, penggantian oli mesin dan filter, serta penyetelan ulang.' },
        { name: 'Perbaikan Mesin (Engine Overhaul)', description: 'Diagnosa mendalam dan perbaikan komponen internal mesin untuk performa optimal.' },
        { name: 'Tune Up & Diagnostic System', description: 'Pembersihan ruang bakar, perbaikan sistem injeksi, dan diagnosa komputerisasi OBD-II.' },
        { name: 'Perbaikan Kaki-kaki & Spooring', description: 'Pemeriksaan suspensi, ball joint, tie rod, serta penyelarasan roda (spooring & balancing).' }
      ];

      const { error: svcInsertError } = await db
        .from('services')
        .insert(defaultServices);

      if (svcInsertError) throw new Error(svcInsertError.message);
      console.log('Default services seeded successfully.');
    }

    // Seed default spareparts if empty
    const { data: existingSpareparts, error: spCheckError } = await db
      .from('spareparts')
      .select('id')
      .limit(1);

    if (spCheckError) throw new Error(spCheckError.message);

    if (!existingSpareparts || existingSpareparts.length === 0) {
      const defaultSpareparts = [
        { name: 'Oli Mesin Synthetic 4L', price: 350000 },
        { name: 'Filter Oli Original', price: 45000 },
        { name: 'Kampas Rem Depan Set', price: 250000 },
        { name: 'Busi Iridium Super', price: 95000 },
        { name: 'Filter Udara Mesin', price: 80000 },
        { name: 'Mintel / Minyak Rem DOT 4', price: 60000 },
        { name: 'Aki Mobil 12V 45Ah', price: 850000 },
        { name: 'V-Belt Alternator', price: 120000 }
      ];

      const { error: spInsertError } = await db
        .from('spareparts')
        .insert(defaultSpareparts);

      if (spInsertError) throw new Error(spInsertError.message);
      console.log('Default spareparts seeded successfully.');
    }

    console.log('Supabase database initialization complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Run direct if executed via CLI
if (process.argv[1] && process.argv[1].includes('initDb.js')) {
  initDb().then(() => process.exit(0)).catch(() => process.exit(1));
}
