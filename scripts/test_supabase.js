const { Pool } = require('pg');

(async () => {
  const conn = 'postgresql://postgres:WindVeal2021@db.oqomrmchorvflpsfjsdk.supabase.co:5432/postgres';
  const pool = new Pool({ connectionString: conn });
  try {
    const res = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('tables:', res.rows.map(r => r.tablename));

    const users = await pool.query("SELECT to_regclass('public.users') as exists");
    console.log('users table exists:', users.rows[0].exists);

    const history = await pool.query("SELECT to_regclass('public.chat_history') as exists");
    console.log('chat_history table exists:', history.rows[0].exists);

    await pool.end();
  } catch (e) {
    console.error('DB test error:', e.message || e);
    process.exit(1);
  }
})();
