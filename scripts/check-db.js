const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.ytajcmuzqmsrvxnnwvcf:S%26gTCA%2B%2B%2Fj2!a8w@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('Connected to Database...');

    // 1. MasterAdmin
    const ma = await pool.query('SELECT id, name, email, password, role FROM "MasterAdmin"');
    console.log('\n=== MASTER ADMIN ACCOUNTS ===');
    console.table(ma.rows);

    // 2. Trusts
    const trusts = await pool.query('SELECT id, "trustName", "is80GEnabled", "taxExemptionNo", "min80GAmount", status FROM "Trust"');
    console.log('\n=== TRUSTS ===');
    console.table(trusts.rows);

    // 3. Schools
    const schools = await pool.query('SELECT id, "schoolName", "trustId", status FROM "School"');
    console.log('\n=== SCHOOLS ===');
    console.table(schools.rows);

    // 4. Alumni count & columns
    const alumni = await pool.query('SELECT count(*) FROM "Alumni"');
    console.log('\n=== ALUMNI TOTAL ===', alumni.rows[0].count);

    // 5. 80G Requests
    const req80g = await pool.query('SELECT * FROM "Donation80GRequest"').catch(() => ({ rows: [] }));
    console.log('\n=== 80G REQUESTS ===');
    console.table(req80g.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
