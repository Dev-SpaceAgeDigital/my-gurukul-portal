import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './db/schema';

const fallbackUrl = 'postgresql://postgres.ytajcmuzqmsrvxnnwvcf:S%26gTCA%2B%2B%2Fj2!a8w@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres';
const connectionString = process.env.DATABASE_URL || fallbackUrl;


// Singleton pattern for database connection in development to prevent 
// exhausted connections due to hot reloading.
declare global {
  var _pool: Pool | undefined;
}

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Common for cloud DBs, adjust if needed
    max: 20, // Limit connections per serverless instance
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
} else {
  if (!global._pool) {
    global._pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Neon requires SSL even in local dev
    });
  }
  pool = global._pool;
}

export const db = drizzle(pool, { schema });
export const query = (text: string, params?: any[]) => pool.query(text, params);

// Automatically ensure schema on initialization
import('./ensureMasterAdminSchema')
  .then(({ ensureMasterAdminSchema }) => ensureMasterAdminSchema())
  .catch((err) => console.warn('[db] ensureMasterAdminSchema init warning:', err));

export default pool;
