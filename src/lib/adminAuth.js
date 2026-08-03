/**
 * Auth + CORS for the /api/admin/* surface.
 *
 * The public site now calls the booking endpoints same-origin (no CORS
 * needed), but the external admin platform still calls /api/admin/* from its
 * own origin, so that surface keeps a small CORS layer gated by ADMIN_ORIGIN.
 */
import { NextResponse } from 'next/server';

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
 * Checks the X-Admin-Key header. Returns null if authorized, otherwise a
 * ready-to-return 401 NextResponse (with CORS headers already applied).
 */
export function requireAdmin(request) {
  const key = request.headers.get('x-admin-key');
  if (!ADMIN_API_KEY || key !== ADMIN_API_KEY) {
    return withAdminCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }
  return null;
}
