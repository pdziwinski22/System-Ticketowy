// lib/auth.js
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

/**
 * Weryfikuje token JWT, sprawdza, czy użytkownik ma wymaganą rolę i zwraca zdekodowane dane.
 * @param {Request} request Obiekt Request (dostarczany przez Next.js API Route)
 * @param {string} requiredRole Wymagana rola ('user' lub 'admin').
 * @returns {object | NextResponse} Zdekodowany obiekt payload (w przypadku sukcesu)
 * lub obiekt NextResponse z błędem (w przypadku niepowodzenia autoryzacji).
 */
export function authorize(request, requiredRole) {
    // 1. Sprawdzenie nagłówka Authorization
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
        return NextResponse.json({ error: 'Brak tokena w nagłówku Authorization.' }, { status: 401 });
    }

    try {
        // 2. Weryfikacja tokena JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Sprawdzenie uprawnień
        if (decoded.role !== requiredRole) {
            return NextResponse.json({ error: 'Brak wymaganych uprawnień do zasobu. Wymagana rola: ' + requiredRole }, { status: 403 });
        }

        // 4. Sukces: zwrócenie danych użytkownika
        return decoded;

    } catch (error) {
        // Obsługa błędów JWT (np. wygasły, nieprawidłowy podpis)
        console.error('Błąd weryfikacji JWT:', error.message);
        return NextResponse.json({ error: 'Nieprawidłowy lub wygasły token.' }, { status: 401 });
    }
}
