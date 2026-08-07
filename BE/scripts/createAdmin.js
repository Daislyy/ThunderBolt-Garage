import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const adminData = {
  name: 'Admin ThunderBolt',
  email: 'admin@thunderbolt.com',
  password: 'Admin@1234',
  role: 'admin',
};

async function createAdmin() {
  try {
 
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [adminData.email]);
    if (existing.length > 0) {
      console.log('Admin sudah ada dengan email:', adminData.email);
      process.exit(0);
    }

  
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

  
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [adminData.name, adminData.email, hashedPassword, adminData.role]
    );

    console.log('');
    console.log('Admin berhasil dibuat!');
    console.log('─────────────────────────────────');
    console.log('Email   :', adminData.email);
    console.log('Password:', adminData.password);
    console.log('User ID :', result.insertId);
    console.log('─────────────────────────────────');
    console.log('Gunakan kredensial di atas untuk login ke admin panel.');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('Gagal membuat admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
