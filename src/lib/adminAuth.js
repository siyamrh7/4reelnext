/**
 * Auth + CORS for the /api/admin/* surface.
 *
 * Two ways in:
 *  - X-Admin-Key header matching ADMIN_API_KEY — for an external admin
 *    platform or curl/scripts, called cross-origin (see ADMIN_ORIGIN CORS).
 *  - The built-in /admin panel's session cookie — same-origin, so the
 *    browser attaches it automatically and the raw key never reaches
 *    client-side JS.
 */
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifySessionToken } from './adminSession';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const ADMIN_ORIGIN  = process.env.ADMIN_ORIGIN || '*';

export function adminCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': ADMIN_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key, X-Admin-User',
  };
}

/** Attach the admin CORS headers to an outgoing NextResponse. */
export function withAdminCors(response) {
  const headers = adminCorsHeaders();
  for (const [k, v] of Object.entries(headers)) response.headers.set(k, v);
  return response;
}

/** Standard OPTIONS handler for admin route files. */
export function adminOptions() {
  return new NextResponse(null, { status: 204, headers: adminCorsHeaders() });
}

/**
 * Checks the X-Admin-Key header OR the /admin panel's session cookie.
 * Returns null if authorized, otherwise a ready-to-return 401 NextResponse
 * (with CORS headers already applied).
 */
export function requireAdmin(request) {
  const key = request.headers.get('x-admin-key');
  if (ADMIN_API_KEY && key === ADMIN_API_KEY) return null;

  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (verifySessionToken(session)) return null;

  return withAdminCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
}
