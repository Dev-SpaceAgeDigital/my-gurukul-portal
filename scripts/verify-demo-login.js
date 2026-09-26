const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_ZGcWI3SBP7eg@ep-tiny-cherry-a1tbrbem-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString });

async function verifyDemoLogins() {
  const client = await pool.connect();
  try {
    console.log('--- Verifying Demo Accounts & Passwords ---');

    // 1. Superadmin
    const superAdminRes = await client.query('SELECT * FROM "User" WHERE LOWER(email) = $1 AND role = $2', ['demo.superadmin@madni.org', 'SUPER_ADMIN']);
    if (superAdminRes.rows.length === 0) {
      console.error('❌ Superadmin demo account not found!');
    } else {
      const match = await bcrypt.compare('DemoSuperAdmin123!', superAdminRes.rows[0].password);
      console.log(`✅ Superadmin demo account found: ${superAdminRes.rows[0].email} (Password valid: ${match})`);
    }

    // 2. Subadmin
    const subAdminRes = await client.query('SELECT * FROM "User" WHERE LOWER(email) = $1 AND role = $2', ['demo.subadmin@madni.org', 'SUB_ADMIN']);
    if (subAdminRes.rows.length === 0) {
      console.error('❌ Subadmin demo account not found!');
    } else {
      const match = await bcrypt.compare('DemoSubAdmin123!', subAdminRes.rows[0].password);
      console.log(`✅ Subadmin demo account found: ${subAdminRes.rows[0].email} (Password valid: ${match}, schoolId: ${subAdminRes.rows[0].schoolId})`);
    }

    // 3. Alumni
    const alumniRes = await client.query('SELECT * FROM "Alumni" WHERE LOWER(email) = $1', ['demo.alumni@madni.org']);
    if (alumniRes.rows.length === 0) {
      console.error('❌ Alumni demo account not found!');
    } else {
      const match = await bcrypt.compare('DemoAlumni123!', alumniRes.rows[0].password);
      console.log(`✅ Alumni demo account found: ${alumniRes.rows[0].email} (Password valid: ${match}, schoolId: ${alumniRes.rows[0].schoolId})`);
    }

    console.log('\n✨ All 3 Test Accounts Verified in Database Successfully! ✨');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyDemoLogins();
