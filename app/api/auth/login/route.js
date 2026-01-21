import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0];
    const [salt, hash] = user.password_hash.split(':');

    // Verify password
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    if (hash !== verifyHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Return user info (excluding password)
    const { password_hash, ...safeUser } = user;

    return NextResponse.json({ user: safeUser }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    // Handle case where table might not exist yet
    if (error.code === '42P01') { // undefined_table
       return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}