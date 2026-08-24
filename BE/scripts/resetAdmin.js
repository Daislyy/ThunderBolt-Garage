import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const email = 'admin@thunderbolt.com';
const newPassword = 'Admin@1234';

async function resetAdmin() {
  try {
    const hashed = await bcrypt.hash(newPassword, 10);

    const { data: updated, error: updateError } = await db
      .from('users')
      .update({ password: hashed, role: 'admin' })
      .eq('email', email)
      .select('id');

    if (updateError) throw new Error(updateError.message);

    if (!updated || updated.length === 0) {
      // User doesn't exist, create one
      const { data: inserted, error: insertError } = await db
        .from('users')
        .insert({
          name: 'Admin ThunderBolt',
          email,
          password: hashed,
          role: 'admin'
        })
        .select('id')
        .single();

      if (insertError) throw new Error(insertError.message);

      console.log('');
      console.log('✅ Admin baru berhasil dibuat!');
      console.log('─────────────────────────────────');
      console.log('🆔 User ID :', inserted.id);
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
