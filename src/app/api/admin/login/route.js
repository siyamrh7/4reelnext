import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSessionToken, ADMIN_SESSION_COOKIE, sessionCookieOptions } from '@/lib/adminSession';
import { rateLimit, clientIp } from '@/lib/rateLimit';

const loginRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 10 });

const LoginSchema = z.object({ password: z.string().min(1) });

export async function POST(request) {
  if (!loginRateLimit(clientIp(request))) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Password required' }, { status: 400 });

  const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
  if (!ADMIN_API_KEY || parsed.data.password !== ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  return res;
}
