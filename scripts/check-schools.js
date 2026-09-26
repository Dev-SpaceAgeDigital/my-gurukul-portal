const { Client } = require('pg');

const db1Url = "postgresql://neondb_owner:npg_Ede9Ma3WJDzf@ep-blue-bar-aygmgq0p-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const db2Url = "postgresql://neondb_owner:npg_wv2kuCNrVc5q@ep-lingering-star-ayefwu06.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function checkDb(url, dbName) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query('SELECT id, "schoolName", email, "trustId" FROM "School";');
    console.log(`=== Schools in ${dbName} ===`);
    console.log(res.rows);
  } catch (err) {
    console.error(`Error querying ${dbName}:`, err.message);
  } finally {
    await client.end();
  }
}

async function main() {
  await checkDb(db1Url, "DB 1 (Madni Copy)");
  await checkDb(db2Url, "DB 2 (EduTrust SaaS)");
}

main();
