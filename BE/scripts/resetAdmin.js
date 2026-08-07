import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const email = 'admin@thunderbolt.com';
const newPassword = 'Admin@1234';

async function resetAdmin() {
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    const [result] = await db.query(
      'UPDATE users SET password = ?, role = ? WHERE email = ?',
      [hashed, 'admin', email]
    );

    if (result.affectedRows === 0) {
      // User doesn't exist, create one
      const [ins] = await db.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin ThunderBolt', email, hashed, 'admin']
      );
      console.log('');
      console.log('✅ Admin baru berhasil dibuat!');
      console.log('─────────────────────────────────');
      console.log('🆔 User ID :', ins.insertId);
    } else {
      console.log('');
      console.log('✅ Password admin berhasil direset!');
      console.log('─────────────────────────────────');
    }

    console.log('📧 Email   :', email);
    console.log('🔑 Password:', newPassword);
    console.log('👤 Role    : admin');
    console.log('─────────────────────────────────');
    console.log('Gunakan kredensial di atas untuk login ke admin panel.');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdmin();
