// app/api/tickets/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { sendTicketUpdateEmail } from '@/lib/mailer';

export const runtime = 'nodejs';


const uploadDir = join(process.cwd(), 'public', 'uploads');
const ok  = (json, status = 200) => NextResponse.json(json, { status });
const bad = (msg, status = 400)  => NextResponse.json({ message: msg }, { status });
const bearer = (req) => req.headers.get('authorization')?.replace('Bearer ', '') || null;
const norm = (s) => (s || '').toString().trim().toLowerCase();

// PL/EN -> DB
const mapPriorityToDb = {
  standard: 'standard',
  low: 'low',
  high: 'high',
  urgent: 'urgent',

  'niski': 'low',
  'wysoki': 'high',
  'krytyczny': 'urgent',
};


async function getUserMailPrefs(userId, fallbackEmail) {
  try {
    const [rows] = await pool.query(
      'SELECT email, notify_email FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    const u = rows?.[0];
    if (!u) return { email: fallbackEmail || null, notify: true };
    const notify = Object.prototype.hasOwnProperty.call(u, 'notify_email')
      ? Number(u.notify_email) === 1
      : true; // brak kolumny → traktuj jako włączone
    return { email: u.email || fallbackEmail || null, notify };
  } catch (e) {
    if (e?.code === 'ER_BAD_FIELD_ERROR') {
      const [rows2] = await pool.query(
        'SELECT email FROM users WHERE id = ? LIMIT 1',
        [userId]
      );
      const u2 = rows2?.[0];
      return { email: (u2 && u2.email) || fallbackEmail || null, notify: true };
    }
    throw e;
  }
}


export async function GET(request) {
  try {
    const token = bearer(request);
    if (!token) return bad('Brak autoryzacji.', 401);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const isArchived = request.nextUrl.searchParams.get('archived') === 'true';

    const [rows] = await pool.query(
      `SELECT *
         FROM tickets
        WHERE user_id = ?
          AND status ${isArchived ? '= "zamknięty"' : '!= "zamknięty"'}
        ORDER BY created_at DESC`,
      [decoded.id]
    );

    const data = rows.map(r => ({
      ...r,
      attachment_url: r.attachment ? `/uploads/${r.attachment}` : null,
    }));
    return ok(data);
  } catch (err) {
    console.error('[API TICKETS GET ERROR]', err);
    return bad('Błąd pobierania zgłoszeń.', 500);
  }
}



export async function POST(request) {
  try {
    const token = bearer(request);
    if (!token) return bad('Brak autoryzacji.', 401);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const form = await request.formData();
    const title = form.get('title')?.toString() || '';
    const description = form.get('description')?.toString() || '';
    const department = form.get('department')?.toString() || null;
    const file = form.get('attachment');

    if (!title || !description) return bad('Brak wymaganych pól (title/description).');

    let filename = null;
    if (file && typeof file === 'object' && file.size > 0) {
      await mkdir(uploadDir, { recursive: true });
      const ext = (file.name?.split('.').pop() || 'bin').toLowerCase();
      filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(join(uploadDir, filename), buffer);
    }

    const [ins] = await pool.query(
      `INSERT INTO tickets
        (user_id, full_name, email, department, title, description, attachment, status, priority, deadline, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'nowy', 'standard', NULL, NOW())`,
      [
        decoded.id,
        `${decoded.first_name} ${decoded.last_name}`.trim(),
        decoded.email,
        department,
        title,
        description,
        filename,
      ]
    );

    const ticketId = ins.insertId;


    await pool.query(
      `INSERT INTO ticket_history (ticket_id, status, note, changed_by, changed_by_id, changed_at)
       VALUES (?, 'nowy', 'Zgłoszenie utworzone', ?, ?, NOW())`,
      [ticketId, `${decoded.first_name} ${decoded.last_name}`.trim(), decoded.id]
    );



    return ok({ message: 'Zgłoszenie zapisane.', id: ticketId }, 201);
  } catch (err) {
    console.error('[API TICKETS POST ERROR]', err);
    return bad('Błąd zapisu zgłoszenia.', 500);
  }
}



export async function PATCH(request) {
  try {
    const token = bearer(request);
    if (!token) return bad('Brak autoryzacji.', 401);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const body = await request.json();
    const { id } = body;
    let { status, note, priority, deadline } = body;

    if (!id) return bad('Brak wymaganych pól (id).');

    // walidacje & normalizacja
    if (typeof status !== 'undefined') {
      const allowed = ['nowy','rozpatrywany','w realizacji','realizowany','zamknięty','zamkniety'];
      const s = norm(status);
      if (!allowed.includes(s)) return bad('Nieprawidłowy status.');
      status = s; 
    }

    let priorityDb;
    if (typeof priority !== 'undefined') {
      priorityDb = mapPriorityToDb[norm(priority)];
      if (!priorityDb) return bad('Nieprawidłowy priorytet.');
    }

    let deadlineSql = null;
    if (typeof deadline !== 'undefined') {
      if (deadline === null || deadline === '') {
        deadlineSql = null;
      } else {
        const d = new Date(deadline);
        if (isNaN(d)) return bad('Zła data deadline.');
        deadlineSql = d.toISOString().slice(0,19).replace('T',' ');
      }
    }

    const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ? LIMIT 1', [id]);
    if (!rows?.length) return bad('Zgłoszenie nie istnieje.', 404);
    const current = rows[0];

    const changes = {};
    const setParts = [];
    const setParams = [];

    if (typeof status !== 'undefined') {
      const isClosing = ['zamknięty','zamkniety'].includes(status);
      setParts.push('status = ?'); setParams.push(status);
      setParts.push(`closed_at = ${isClosing ? 'NOW()' : 'NULL'}`);
      changes.status = { old: current.status, new: status };
    }
    if (typeof priority !== 'undefined') {
      setParts.push('priority = ?'); setParams.push(priorityDb);
      changes.priority = { old: current.priority, new: priorityDb };
    }
    if (typeof deadline !== 'undefined') {
      setParts.push('deadline = ?'); setParams.push(deadlineSql);
      changes.deadline = { old: current.deadline || null, new: deadlineSql };
    }
    if (setParts.length === 0) return ok({ message: 'Brak zmian.' });

    // UPDATE z fallbackiem na brak closed_at
    try {
      await pool.query(
        `UPDATE tickets SET ${setParts.join(', ')} WHERE id = ?`,
        [...setParams, id]
      );
    } catch (e) {
      if (String(e?.code) === 'ER_BAD_FIELD_ERROR' && setParts.some(p => p.includes('closed_at'))) {
        const onlyNonClosed = setParts.filter(p => !p.includes('closed_at'));
        const onlyParams = [];

        for (let i = 0; i < setParts.length; i++) {
          if (!setParts[i].includes('closed_at')) onlyParams.push(setParams[i]);
        }
        await pool.query(
          `UPDATE tickets SET ${onlyNonClosed.join(', ')} WHERE id = ?`,
          [...onlyParams, id]
        );
      } else {
        throw e;
      }
    }

    const whoName = `${decoded.first_name || ''} ${decoded.last_name || ''}`.trim() || 'Użytkownik';
    const whoId   = decoded.id;

    // historia – osobne wpisy
    const entries = [];
    if (changes.status)   entries.push(['Status zmieniony', changes.status]);
    if (changes.priority) entries.push(['Priorytet zmieniony', changes.priority]);
    if (Object.prototype.hasOwnProperty.call(changes, 'deadline')) entries.push(['Deadline zmieniony', changes.deadline]);

    for (const [label, diff] of entries) {
      const noteText = `${label}: ${diff.old ?? '—'} → ${diff.new ?? '—'}`;
      await pool.query(
        `INSERT INTO ticket_history (ticket_id, status, note, changed_by, changed_by_id, changed_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [id, status || current.status, note || noteText, whoName, whoId]
      );
    }


    const wasClosing = typeof changes.status !== 'undefined' &&
      ['zamknięty','zamkniety'].includes(changes.status.new);
    if (wasClosing) {
      await pool.query(
        `INSERT INTO ticket_history (ticket_id, status, note, changed_by, changed_by_id, changed_at)
         VALUES (?, 'zamknięty', 'Zgłoszenie zamknięte', ?, ?, NOW())`,
        [id, whoName, whoId]
      );
    }


    try {
      const { email: ownerEmail, notify } = await getUserMailPrefs(current.user_id, current.email);
      if (ownerEmail && notify) {
        const [freshRows] = await pool.query('SELECT * FROM tickets WHERE id = ? LIMIT 1', [id]);
        const fresh = freshRows?.[0] || current;
        await sendTicketUpdateEmail({
          to: ownerEmail,
          ticket: fresh,
          changes,
        });
      }
    } catch (mailErr) {
      console.error('[MAIL][PATCH] sendTicketUpdateEmail error:', mailErr?.message || mailErr);
    }

    return ok({ message: 'Zaktualizowano zgłoszenie.', changes });
  } catch (err) {
    console.error('[API TICKETS PATCH ERROR]', err);
    return bad('Błąd aktualizacji zgłoszenia.', 500);
  }
}
