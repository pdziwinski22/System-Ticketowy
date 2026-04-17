// app/api/tickets/[id]/messages/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';


import { sendTicketUpdateEmail as sendTicketMessageEmail } from '@/lib/mailer';

export const runtime = 'nodejs';

const ok  = (json, status = 200) => NextResponse.json(json, { status });
const bad = (msg, status = 400)  => NextResponse.json({ message: msg }, { status });


export async function GET(req, ctx) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || null;
    if (!token) return bad('Brak autoryzacji.', 401);
    jwt.verify(token, process.env.JWT_SECRET);


    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    if (!id) return bad('Brak id.', 400);

    const [rows] = await pool.query(
      `SELECT id, ticket_id, author_id, author_name, body, created_at
         FROM ticket_messages
        WHERE ticket_id = ?
        ORDER BY created_at ASC`,
      [id]
    );
    return ok(rows || []);
  } catch (e) {
    console.error('[MSG GET] Error:', e);
    return bad('Błąd pobierania wiadomości.', 500);
  }
}


export async function POST(req, ctx) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || null;
    if (!token) return bad('Brak autoryzacji.', 401);
    const user = jwt.verify(token, process.env.JWT_SECRET);


    const { id: idStr } = await ctx.params;
    const ticketId = Number(idStr);
    if (!ticketId) return bad('Brak id.', 400);

    const { body: content } = await req.json();
    const txt = (content || '').toString().trim();
    if (!txt) return bad('Pusta wiadomość.', 400);


    const [trows] = await pool.query('SELECT * FROM tickets WHERE id = ? LIMIT 1', [ticketId]);
    const ticket = trows?.[0];
    if (!ticket) return bad('Zgłoszenie nie istnieje.', 404);


    await pool.query(
      `INSERT INTO ticket_messages (ticket_id, author_id, author_name, body, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        ticketId,
        user.id || null,
        `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        txt
      ]
    );


    try {
      if (ticket.email) {
        await sendTicketMessageEmail({
          to: ticket.email,
          ticket,
          changes: {
            message: txt,
            from: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
          },
        });
      }
    } catch (mailErr) {
      console.error('[MSG POST] mail error:', mailErr?.message || mailErr);
    }

    return ok({ message: 'Wiadomość dodana.' }, 201);
  } catch (e) {
    console.error('[MSG POST] Error:', e);
    return bad('Błąd zapisu wiadomości.', 500);
  }
}
