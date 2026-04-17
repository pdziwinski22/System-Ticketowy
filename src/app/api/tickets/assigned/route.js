// app/api/tickets/assigned/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

const ok  = (j, s=200) => NextResponse.json(j, { status: s });
const bad = (m, s=400) => NextResponse.json({ message: m }, { status: s });

export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return bad('Brak autoryzacji.', 401);
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const dept = user?.department;
    if (!dept) return ok([]);

    const [rows] = await pool.query(
      `SELECT * FROM tickets
        WHERE department = ?
          AND (status IS NULL OR status != 'zamknięty')
        ORDER BY created_at DESC`,
      [dept]
    );

    const data = rows.map(r => ({ ...r, attachment_url: r.attachment ? `/uploads/${r.attachment}` : null }));
    return ok(data);
  } catch (e) {
    console.error('[ASSIGNED GET] ', e);
    return bad('Błąd pobierania zgłoszeń działu.', 500);
  }
}
