export const API_INTERNAL_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5001';

export const COOKIE_MAX_AGE = 60 * 60 * 8; // 8h, matches JWT expiry

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  };
}

// Readable by client JS - holds only non-sensitive identity (name, roles, permissions),
// never the JWT. Used by the client `auth` helpers for UI gating.
export function sessionCookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  };
}
