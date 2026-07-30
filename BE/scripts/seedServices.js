import db from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const defaultServices = [
  { name: 'Service Berkala', description: 'Pemeriksaan rutin komponen kendaraan, pembersihan filter, dan tune up standar.' },
  { name: 'Ganti Oli & Filter', description: 'Penggantian oli mesin berkualitas tinggi beserta penggantian filter oli.' },
  { name: 'Tune Up Mesin', description: 'Pembersihan throttle body, busi, dan optimasi performa pembakaran mesin.' },
  { name: 'Perbaikan Sistem Rem', description: 'Pemeriksaan dan penggantian kampas rem, minyak rem, serta pembubutan piringan rem.' },
  { name: 'Spooring & Balancing', description: 'Penyeimbangan dan penyelarasan sudut roda untuk kenyamanan dan keselamatan berkendara.' }
];

async function seedServices() {
  try {
    const [existing] = await db.query('SELECT COUNT(*) as count FROM services');
    if (existing[0].count > 0) {
      console.log('✅ Services table already contains data.');
      process.exit(0);
    }

    for (const service of defaultServices) {
      await db.query('INSERT INTO services (name, description) VALUES (?, ?)', [service.name, service.description]);
    }

    console.log('✅ Default services successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding services:', error.message);
    process.exit(1);
  }
}

seedServices();
