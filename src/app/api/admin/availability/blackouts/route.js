import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbConnect } from '@/lib/db';
import { getAvailability } from '@/lib/models';
import { requireAdmin, withAdminCors, adminOptions } from '@/lib/adminAuth';

const BlackoutSchema = z.object({
  date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start:  z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  end:    z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  reason: z.string().max(500).optional().default(''),
});

export async function POST(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const parsed = BlackoutSchema.safeParse(body);
  if (!parsed.success) return withAdminCors(NextResponse.json({ error: 'Invalid input' }, { status: 400 }));

  await dbConnect();
  const doc = await getAvailability();
  doc.blackouts.push({ ...parsed.data, createdBy: request.headers.get('x-admin-user') || 'admin' });
  await doc.save();
  return withAdminCors(NextResponse.json({ ok: true, item: doc }));
}

export const OPTIONS = adminOptions;
