import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';
const ok  = (json, status = 200) => NextResponse.json(json, { status });
const bad = (msg, status = 400)  => NextResponse.json({ message: msg }, { status });

export async function GET(_req, { params }) {
  try {
    const p = await params;
    const ticketId = Number(p?.id);
    if (!ticketId) return bad('Zły ticket id', 400);

    const [rows] = await pool.query(
      `SELECT id, ticket_id, status, note, changed_by, changed_by_id, changed_at
         FROM ticket_history
        WHERE ticket_id = ?
        ORDER BY changed_at ASC, id ASC`,
      [ticketId]
    );
    return ok(rows || []);
  } catch (e) {
    console.error('[HISTORY GET] Error:', e);
    return bad('Błąd pobierania historii', 500);
  }
}
