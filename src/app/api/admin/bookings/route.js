import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Booking } from '@/lib/models';
import { requireAdmin, withAdminCors, adminOptions } from '@/lib/adminAuth';

export async function GET(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const sp = request.nextUrl.searchParams;
  const status = sp.get('status');
  const from = sp.get('from');
  const to = sp.get('to');
  const limit = Number(sp.get('limit')) || 100;

  const q = {};
  if (status) q.status = status;
  if (from || to) {
    q.date = {};
    if (from) q.date.$gte = from;
    if (to)   q.date.$lte = to;
  }

  await dbConnect();
  const docs = await Booking.find(q).sort({ date: -1, time: -1 }).limit(limit);
  return withAdminCors(NextResponse.json({ ok: true, items: docs }));
}

export const OPTIONS = adminOptions;
