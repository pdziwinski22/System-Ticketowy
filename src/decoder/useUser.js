export function decodeJwtUtf8(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    // base64url → base64 (standardowy)
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');

    // Dekodowanie do UTF-8
    const binary = atob(padded);
    const bytes = new Uint8Array([...binary].map(c => c.charCodeAt(0)));
    const json = new TextDecoder('utf-8').decode(bytes);

    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getUserFromToken() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  return decodeJwtUtf8(token);
}

export function useUserFromToken() {

  return getUserFromToken();
}