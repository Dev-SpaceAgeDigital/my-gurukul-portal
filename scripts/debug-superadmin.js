const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_ZGcWI3SBP7eg@ep-tiny-cherry-a1tbrbem-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString });

async function debugSuperadmin() {
  const client = await pool.connect();
  try {
    console.log('--- Debugging Superadmin Account ---');
    const email = 'demo.superadmin@madni.org';

    const resAll = await client.query('SELECT id, name, email, role, password FROM "User" WHERE LOWER(email) = $1', [email]);
    console.log('Query without role filter:', resAll.rows);

    const resWithRole = await client.query('SELECT id, name, email, role, password FROM "User" WHERE LOWER(email) = $1 AND role = $2', [email, 'SUPER_ADMIN']);
    console.log('Query WITH role = SUPER_ADMIN:', resWithRole.rows);

    if (resAll.rows.length > 0) {
      const user = resAll.rows[0];
      const match = await bcrypt.compare('DemoSuperAdmin123!', user.password);
      console.log(`Bcrypt compare ('DemoSuperAdmin123!', user.password): ${match}`);
    } else {
      console.log('User not found at all!');
    }

    // List all users in User table to see roles
    const allUsers = await client.query('SELECT email, role FROM "User"');
    console.log('All Users in "User" table:', allUsers.rows);

  } catch (err) {
    console.error('Error debugging superadmin:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

debugSuperadmin();
