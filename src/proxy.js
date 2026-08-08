/**
 * Guards /admin/* (the built-in admin panel). Renamed from `middleware` in
 * Next.js 16 — see AGENTS.md. This is an optimistic check only (reads the
 * signed cookie, no DB call); every /api/admin/* route still calls
 * requireAdmin() itself as the real gate.
 */
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/adminSession';

export function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const authed = verifySessionToken(session);

  if (pathname === '/admin/login') {
    if (authed) return NextResponse.redirect(new URL('/admin', request.url));
    return NextResponse.next();
  }

  if (!authed) {
    const url = new URL('/admin/login', request.url);
    if (pathname !== '/admin') url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
