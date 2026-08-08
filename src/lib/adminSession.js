/**
 * Stateless signed session cookie for the built-in /admin panel.
 *
 * There's a single shared admin credential (ADMIN_API_KEY), not a user
 * database, so a full session store would be overkill. Instead we sign a
 * short JSON payload with HMAC-SHA256 (SESSION_SECRET) and stash it in an
 * HttpOnly cookie — the browser can't read or forge it, and we never send
 * ADMIN_API_KEY itself to client-side JS.
 */
import crypto from 'crypto';

export const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is not set');
  return s;
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

/** Mint a signed session token (payload.signature) good for SESSION_TTL_MS. */
export function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/** Verify a session token. Returns true if valid and not expired. */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_TTL_MS / 1000,
};
