const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkData() {
  try {
    const res = await pool.query('SELECT * FROM "AcademicYear"');
    console.log('Total AcademicYears:', res.rowCount);
    console.log('Data:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error fetching data:', err);
  } finally {
    await pool.end();
  }
}

checkData();
