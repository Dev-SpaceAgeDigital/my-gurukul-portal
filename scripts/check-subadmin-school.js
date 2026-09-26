const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_ZGcWI3SBP7eg@ep-tiny-cherry-a1tbrbem-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString });

async function checkSubadminSchool() {
  const client = await pool.connect();
  try {
    console.log('--- Checking Subadmin School Data ---');
    const res = await client.query(`
      SELECT 
        u.id as user_id, 
        u.email, 
        u.role, 
        u."schoolId", 
        s."schoolName"
      FROM "User" u
      LEFT JOIN "School" s ON u."schoolId" = s.id
      WHERE LOWER(u.email) = $1
    `, ['demo.subadmin@madni.org']);

    console.log('Subadmin Account Info:', res.rows[0]);

    // Also check all schools in DB
    const schools = await client.query('SELECT id, "schoolName" FROM "School"');
    console.log('\nAll Schools in Database:', schools.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSubadminSchool();
