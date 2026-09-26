const { Client } = require('pg');
const connectionString = 'postgresql://neondb_owner:npg_ZGcWI3SBP7eg@ep-tiny-cherry-a1tbrbem-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkTables() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
    console.table(tables.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
checkTables();
