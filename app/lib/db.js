import { Pool } from "pg";

let pool;

if (!global.pool) {
  global.pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false,
      sslmode: "require",
    },
  });
}
pool = global.pool;

export default pool;
