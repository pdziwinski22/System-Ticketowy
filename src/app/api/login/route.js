// app/api/login/route.js
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Podaj e-mail i hasło.' }, { status: 400 });
    }


    const [rows] = await pool.query(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    const user = rows?.[0];

    if (!user) {
      return NextResponse.json({ message: 'Nieprawidłowy e-mail lub hasło.' }, { status: 401 });
    }


    const isBlocked = Object.prototype.hasOwnProperty.call(user, 'is_blocked')
      ? Number(user.is_blocked) === 1
      : 0;
    if (isBlocked) {
      return NextResponse.json(
        { message: 'Konto zablokowane. Skontaktuj się z administratorem.' },
        { status: 403 }
      );
    }


    let validPassword = false;
    if (
      user.password &&
      (user.password.startsWith('$2a$') ||
        user.password.startsWith('$2b$') ||
        user.password.startsWith('$2y$'))
    ) {
      validPassword = await bcrypt.compare(password, user.password);
    } else {

      validPassword = password === user.password;
    }

    if (!validPassword) {
      return NextResponse.json({ message: 'Nieprawidłowy e-mail lub hasło.' }, { status: 401 });
    }


    const isActive =
      !Object.prototype.hasOwnProperty.call(user, 'is_active') ||
      Number(user.is_active) === 1;

    if (!isActive) {
      return NextResponse.json({ message: 'Konto nie zostało aktywowane.' }, { status: 403 });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('Brak JWT_SECRET w zmiennych środowiskowych');
      return NextResponse.json({ message: 'Błąd serwera.' }, { status: 500 });
    }


    const role = (Object.prototype.hasOwnProperty.call(user, 'role') && user.role) ? user.role : 'user';
    const department = Object.prototype.hasOwnProperty.call(user, 'department') ? user.department : null;


    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role,
        department,
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    const res = NextResponse.json(
      {
        message: 'Zalogowano pomyślnie!',
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role,
          department,
        },
      },
      { status: 200 }
    );


    res.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 2, // 2h
    });

    return res;
  } catch (error) {
    console.error('Błąd logowania:', error);
    return NextResponse.json({ message: 'Błąd serwera.' }, { status: 500 });
  }
}


export async function GET() {
  return NextResponse.json({ ok: true, msg: 'Użyj POST dla /api/login' }, { status: 200 });
}
