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
    const { data: existing, error: checkError } = await db
      .from('users')
      .select('id')
      .eq('email', adminData.email);

    if (checkError) throw new Error(checkError.message);

    if (existing && existing.length > 0) {
      console.log('Admin sudah ada dengan email:', adminData.email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const { data, error } = await db
      .from('users')
      .insert({
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        role: adminData.role
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    console.log('');
    console.log('Admin berhasil dibuat!');
    console.log('─────────────────────────────────');
    console.log('Email   :', adminData.email);
    console.log('Password:', adminData.password);
    console.log('User ID :', data.id);
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
