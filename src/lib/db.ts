import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:1234%40Qwer%40Asdf%40Zxcv%40@db.rgsomwpnnhqkyybdivnx.supabase.co:5432/postgres';

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function queryDb(text: string, params?: any[]) {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query(text, params);
      return res;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('Postgres DB Warning (Proceeding with fallback mode):', err.message || err);
    // Return empty fallback rows structure on network/DNS error to prevent 500 server crashes
    return { rows: [], command: 'FALLBACK', rowCount: 0 };
  }
}
