require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function resetPasswords() {
  try {
    const hash = await bcrypt.hash('Alumni@123', 10);
    await pool.query('UPDATE "Alumni" SET password = $1', [hash]);
    console.log('Successfully updated password to Alumni@123 for all alumni!');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

resetPasswords();
