// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export const runtime = 'nodejs';

// Jedyny właściciel panelu admina:
const ADMIN_EMAIL = 'set@email;

const bad = (message, status = 400) => NextResponse.json({ message }, { status });
const ok  = (payload, status = 200) => NextResponse.json(payload, { status });

function requireAdmin(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) throw bad('Brak autoryzacji.', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw bad('Nieprawidłowy token.', 401);
  }
  if (!decoded?.email || decoded.email.toLowerCase() !== ADMIN_EMAIL) {
    throw bad('Brak dostępu.', 403);
  }
  return decoded;
}

function hasProp(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}


export async function GET(req) {
  try {
    requireAdmin(req);


    const [rows] = await pool.query(`
      SELECT * FROM users
      ORDER BY created_at DESC
    `);

    const users = (rows || []).map((u) => ({
      id: u.id,
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: hasProp(u, 'role') ? (u.role || 'user') : 'user',
      department: hasProp(u, 'department') ? u.department : null,
      is_blocked: hasProp(u, 'is_blocked') ? Number(u.is_blocked) : 0,
      is_active: hasProp(u, 'is_active') ? Number(u.is_active) : 1,
      created_at: u.created_at || null,
      updated_at: u.updated_at || null,
    }));

    return ok({ users });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('[ADMIN GET]', e);
    return bad('Błąd pobierania użytkowników.', 500);
  }
}


export async function PATCH(req) {
  try {
    requireAdmin(req);
    const body = await req.json();
    const { id, action } = body;

    if (!id || !action) return bad('Brak wymaganych pól (id, action).');

    const [usrRows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    if (!usrRows?.length) return bad('Użytkownik nie istnieje.', 404);

    const target = usrRows[0];
    const targetEmail = (target.email || '').toLowerCase();
    const isHardAdmin = targetEmail === ADMIN_EMAIL;

    try {
      switch (action) {
        case 'block': {
          if (isHardAdmin) return bad('Nie można zablokować konta administratora głównego.', 400);

          if (!hasProp(target, 'is_blocked')) {
            return bad("Brakuje kolumny 'is_blocked' w tabeli users. Uruchom migrację: ALTER TABLE users ADD COLUMN is_blocked TINYINT(1) NOT NULL DEFAULT 0;", 400);
          }
          await pool.query('UPDATE users SET is_blocked = 1 WHERE id = ?', [id]);
          return ok({ message: 'Użytkownik zablokowany.' });
        }
        case 'unblock': {
          if (!hasProp(target, 'is_blocked')) {
            return bad("Brakuje kolumny 'is_blocked' w tabeli users. Uruchom migrację: ALTER TABLE users ADD COLUMN is_blocked TINYINT(1) NOT NULL DEFAULT 0;", 400);
          }
          await pool.query('UPDATE users SET is_blocked = 0 WHERE id = ?', [id]);
          return ok({ message: 'Użytkownik odblokowany.' });
        }
        case 'delete': {
          if (isHardAdmin) return bad('Nie można usunąć konta administratora głównego.', 400);
          await pool.query('DELETE FROM users WHERE id = ?', [id]);
          return ok({ message: 'Użytkownik usunięty.' });
        }
        case 'password': {
          const { newPassword } = body;
          if (!newPassword || newPassword.length < 6) return bad('Hasło musi mieć min. 6 znaków.');
          const hash = await bcrypt.hash(newPassword, 10);
          await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, id]);
          return ok({ message: 'Hasło zmienione.' });
        }
        case 'role': {
          const { role } = body;
          const allowed = ['user', 'manager', 'admin'];
          if (!allowed.includes(role)) return bad('Nieprawidłowa rola.');
 
          if (!hasProp(target, 'role')) {
            return bad("Brakuje kolumny 'role' w tabeli users. Uruchom migrację: ALTER TABLE users ADD COLUMN role ENUM('user','manager','admin') NOT NULL DEFAULT 'user';", 400);
          }
          await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
          return ok({ message: 'Rola zaktualizowana.' });
        }
        case 'department': {
          const { department } = body;
          const allowed = ['it', 'flota', 'kadry', 'księgowość', 'rozliczenia', null];
          if (department !== null && !allowed.includes(department)) return bad('Nieprawidłowy dział.');

          if (!hasProp(target, 'department')) {
            return bad("Brakuje kolumny 'department' w tabeli users. Uruchom migrację: ALTER TABLE users ADD COLUMN department ENUM('it','flota','kadry','księgowość','rozliczenia') NULL;", 400);
          }
          await pool.query('UPDATE users SET department = ? WHERE id = ?', [department, id]);
          return ok({ message: 'Dział zaktualizowany.' });
        }
        default:
          return bad('Nieobsługiwane działanie.');
      }
    } catch (e) {
o
      if (e?.code === 'ER_BAD_FIELD_ERROR') {
        return bad(`Brak wymaganej kolumny w DB: ${e.sqlMessage || e.message}`, 400);
      }
      throw e;
    }
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('[ADMIN PATCH]', e);
    return bad('Błąd modyfikacji użytkownika.', 500);
  }
}


export async function DELETE(req) {
  try {
    requireAdmin(req);
    const id = Number(req.nextUrl.searchParams.get('id'));
    if (!id) return bad('Brak id.', 400);

    const [rows] = await pool.query('SELECT email FROM users WHERE id = ? LIMIT 1', [id]);
    if (!rows?.length) return bad('Użytkownik nie istnieje.', 404);

    if ((rows[0].email || '').toLowerCase() === ADMIN_EMAIL) {
      return bad('Nie można usunąć konta administratora głównego.', 400);
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return ok({ message: 'Użytkownik usunięty.' });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('[ADMIN DELETE]', e);
    return bad('Błąd usuwania użytkownika.', 500);
  }
}
