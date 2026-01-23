import { Pool } from "pg";

// Disable SSL verification for self-signed Supabase certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let pool;

if (!global.pool) {
  global.pool = new Pool({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
  });
}
pool = global.pool;

export default pool;
