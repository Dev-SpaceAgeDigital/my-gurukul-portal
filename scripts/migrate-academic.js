const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query('ALTER TABLE "AcademicYear" ADD COLUMN "statusTag" varchar(50) DEFAULT \'CURRENT\'');
    console.log('Added statusTag successfully.');
  } catch (err) {
    if (err.code !== '42701') console.error('Error adding statusTag:', err);
  }

  try {
    await pool.query('ALTER TABLE "AcademicYear" DROP COLUMN "schoolId" CASCADE');
    console.log('Dropped schoolId successfully.');
  } catch (err) {
    if (err.code !== '42703') console.error('Error dropping schoolId:', err);
  }

  try {
    await pool.query('ALTER TABLE "Standard" ADD COLUMN "batchYear" varchar(100)');
    console.log('Added batchYear successfully.');
  } catch (err) {
    if (err.code !== '42701') console.error('Error adding batchYear:', err);
  }

  await pool.end();
}

run();
