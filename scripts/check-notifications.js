const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

async function check() {
  console.log('==============================================');
  console.log('🔍 CHECKING NOTIFICATION & FIREBASE CONFIG');
  console.log('==============================================\n');

  // 1. Check Environment Variables
  console.log('1. ENVIRONMENT VARIABLES:');
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  console.log('  • NEXT_PUBLIC_FIREBASE_PROJECT_ID:', projectId ? `✅ ${projectId}` : '❌ MISSING');
  console.log('  • FIREBASE_CLIENT_EMAIL:', clientEmail ? `✅ ${clientEmail}` : '❌ MISSING');
  console.log('  • FIREBASE_PRIVATE_KEY:', privateKey ? `✅ Present (${privateKey.length} chars)` : '❌ MISSING');
  console.log('  • NEXT_PUBLIC_FIREBASE_VAPID_KEY:', vapidKey ? `✅ Present (${vapidKey.length} chars)` : '❌ MISSING');

  // 2. Check Database Tables & Tokens
  console.log('\n2. DATABASE TOKEN CHECK:');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    const tableRes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'UserFcmToken'
      );
    `);
    console.log('  • UserFcmToken Table Exists:', tableRes.rows[0].exists ? '✅ YES' : '❌ NO');

    if (tableRes.rows[0].exists) {
      const tokensRes = await pool.query('SELECT id, "userId", "role", "createdAt", "updatedAt" FROM "UserFcmToken"');
      console.log(`  • Registered Device Tokens Count: ${tokensRes.rows.length}`);
      if (tokensRes.rows.length > 0) {
        console.table(tokensRes.rows);
      } else {
        console.log('  ⚠️ No device tokens registered yet. (Users must click "Allow" on notification prompt while logged in).');
      }
    }

    const notifRes = await pool.query('SELECT count(*) as total, count(case when "isRead" = false then 1 end) as unread FROM "Notification"');
    console.log(`\n  • In-App Notifications in DB: Total = ${notifRes.rows[0].total}, Unread = ${notifRes.rows[0].unread}`);

  } catch (err) {
    console.error('  ❌ DB Query Error:', err.message);
  } finally {
    await pool.end();
  }

  console.log('\n==============================================');
}

check();
