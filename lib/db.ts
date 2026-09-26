import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './db/schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in environment variables.');
}

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

export default pool;
