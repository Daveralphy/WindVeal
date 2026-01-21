import { NextResponse } from 'next/server';
import pool from '../../lib/db';

const ensureTable = async () => {
  await pool.query(\
    CREATE TABLE IF NOT EXISTS chat_history (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      messages JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  \);
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  try {
    await ensureTable();
    const res = await pool.query('SELECT messages FROM chat_history WHERE user_id = \', [userId]);
    return NextResponse.json({ history: res.rows[0]?.messages || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { userId, messages } = await req.json();
  if (!userId || !messages) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  try {
    await ensureTable();
    await pool.query(\
      INSERT INTO chat_history (user_id, messages, updated_at)
      VALUES (\, \, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET messages = \, updated_at = CURRENT_TIMESTAMP
    \, [userId, JSON.stringify(messages)]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    
    await ensureTable();
    await pool.query('DELETE FROM chat_history WHERE user_id = \', [userId]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
