import { NextResponse } from 'next/server';
import pool from '../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_chats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT,
        messages JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    return NextResponse.json({ success: true, message: 'Database tables initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
