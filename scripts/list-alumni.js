require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function listAlumni() {
  try {
    const res = await pool.query('SELECT a.name, a.email, a."batchYear", a."currentTitle", s."schoolName" FROM "Alumni" a LEFT JOIN "School" s ON a."schoolId" = s.id');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

listAlumni();
