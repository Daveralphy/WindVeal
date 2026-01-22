import { NextResponse } from 'next/server';

export async function GET(req) {
  // This is handled automatically by the route handlers
  // Tables are created on first API call via ensureTable()
  return NextResponse.json({ 
    success: true, 
    message: 'Database tables are created automatically on first use' 
  });
}
