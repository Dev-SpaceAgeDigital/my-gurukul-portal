const { Client } = require('pg');
const connectionString = 'postgresql://neondb_owner:npg_ZGcWI3SBP7eg@ep-tiny-cherry-a1tbrbem-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkUserSchema() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'User';");
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
checkUserSchema();
