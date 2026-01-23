import { NextResponse } from 'next/server';
import pool from '../../lib/db';

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_chats (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title TEXT,
      messages JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  try {
    await ensureTable();
    const res = await pool.query('SELECT id, title, messages, updated_at FROM user_chats WHERE user_id = $1 ORDER BY updated_at DESC', [userId]);
    return NextResponse.json({ chats: res.rows });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { userId, messages, chatId, title } = await req.json();
  if (!userId || !messages) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  try {
    await ensureTable();

    if (chatId) {
      // Update existing chat
      await pool.query(`
        UPDATE user_chats 
        SET messages = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 AND user_id = $3
      `, [JSON.stringify(messages), chatId, userId]);
      return NextResponse.json({ success: true, chatId });
    } else {
      // Create new chat
      // Check limit of 2
      const countRes = await pool.query('SELECT COUNT(*) FROM user_chats WHERE user_id = $1', [userId]);
      const count = parseInt(countRes.rows[0].count);

      if (count >= 2) {
        // Delete oldest
        await pool.query(`
          DELETE FROM user_chats 
          WHERE id = (
            SELECT id FROM user_chats 
            WHERE user_id = $1 
            ORDER BY updated_at ASC 
            LIMIT 1
          )
        `, [userId]);
      }

      // Insert new
      const chatTitle = title || (messages[0]?.content?.substring(0, 30) || 'New Chat');
      const insertRes = await pool.query(`
        INSERT INTO user_chats (user_id, title, messages, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING id
      `, [userId, chatTitle, JSON.stringify(messages)]);
      
      return NextResponse.json({ success: true, chatId: insertRes.rows[0].id, title: chatTitle });
    }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { userId, chatId } = await req.json();
    if (!userId || !chatId) return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    
    await ensureTable();
    await pool.query('DELETE FROM user_chats WHERE id = $1 AND user_id = $2', [chatId, userId]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { userId, chatId, title } = await req.json();
    if (!userId || !chatId || !title) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    await ensureTable();
    await pool.query('UPDATE user_chats SET title = $1 WHERE id = $2 AND user_id = $3', [title, chatId, userId]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
