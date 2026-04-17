// src/decoder/jwt.js
export function decodeJwtUtf8(token) {
  try {
    if (!token) return null;
    const b64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!b64) return null;
    const bin = atob(b64);
    const bytes = new Uint8Array([...bin].map(c => c.charCodeAt(0)));
    const json = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}
