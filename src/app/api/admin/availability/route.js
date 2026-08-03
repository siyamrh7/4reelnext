import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbConnect } from '@/lib/db';
import { getAvailability } from '@/lib/models';
import { requireAdmin, withAdminCors, adminOptions } from '@/lib/adminAuth';

export async function GET(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  await dbConnect();
  const doc = await getAvailability();
  return withAdminCors(NextResponse.json({ ok: true, item: doc }));
}

const TimeRange = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end:   z.string().regex(/^\d{2}:\d{2}$/),
});
const PatchAvailabilitySchema = z.object({
  weeklyHours: z.record(z.string(), z.array(TimeRange)).optional(),
  slotMinutes:    z.number().int().min(15).max(120).optional(),
  bufferMinutes:  z.number().int().min(0).max(60).optional(),
  minNoticeHours: z.number().int().min(0).max(168).optional(),
  bookingWindowDays: z.number().int().min(1).max(365).optional(),
  blockDutchHolidays: z.boolean().optional(),
  bookingEnabled: z.boolean().optional(),
  disabledReason: z.string().max(500).optional(),
  updatedBy: z.string().max(120).optional(),
});

export async function PATCH(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const parsed = PatchAvailabilitySchema.safeParse(body);
  if (!parsed.success) {
    return withAdminCors(NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 }));
  }

  await dbConnect();
  const doc = await getAvailability();
  Object.assign(doc, parsed.data);
  await doc.save();
  return withAdminCors(NextResponse.json({ ok: true, item: doc }));
}

export const OPTIONS = adminOptions;
