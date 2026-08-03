import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbConnect } from '@/lib/db';
import { Booking } from '@/lib/models';
import { cancelGoogleEvent } from '@/lib/calendar';
import { requireAdmin, withAdminCors, adminOptions } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  await dbConnect();
  const doc = await Booking.findById(id);
  if (!doc) return withAdminCors(NextResponse.json({ error: 'Not found' }, { status: 404 }));
  return withAdminCors(NextResponse.json({ ok: true, item: doc }));
}

const PatchBookingSchema = z.object({
  status:        z.enum(['confirmed', 'cancelled', 'completed', 'no-show']).optional(),
  cancelledReason: z.string().max(500).optional(),
  internalNote: z.string().max(2000).optional(),
});

export async function PATCH(request, { params }) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = PatchBookingSchema.safeParse(body);
  if (!parsed.success) return withAdminCors(NextResponse.json({ error: 'Invalid input' }, { status: 400 }));

  await dbConnect();
  const doc = await Booking.findById(id);
  if (!doc) return withAdminCors(NextResponse.json({ error: 'Not found' }, { status: 404 }));

  // If cancelling, also drop the Google Calendar event
  if (parsed.data.status === 'cancelled' && doc.status !== 'cancelled' && doc.googleEventId) {
    try { await cancelGoogleEvent(doc.googleEventId); } catch (e) { console.error('GCal cancel failed', e); }
    doc.cancelledBy = 'studio';
  }
  Object.assign(doc, parsed.data);
  await doc.save();
  return withAdminCors(NextResponse.json({ ok: true, item: doc }));
}

export const OPTIONS = adminOptions;
