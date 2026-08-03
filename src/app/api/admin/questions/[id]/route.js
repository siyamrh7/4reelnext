import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbConnect } from '@/lib/db';
import { Question } from '@/lib/models';
import { requireAdmin, withAdminCors, adminOptions } from '@/lib/adminAuth';

const PatchQuestionSchema = z.object({
  status: z.enum(['new', 'replied', 'closed']).optional(),
  internalNote: z.string().max(2000).optional(),
});

export async function PATCH(request, { params }) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = PatchQuestionSchema.safeParse(body);
  if (!parsed.success) return withAdminCors(NextResponse.json({ error: 'Invalid input' }, { status: 400 }));

  await dbConnect();
  const doc = await Question.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!doc) return withAdminCors(NextResponse.json({ error: 'Not found' }, { status: 404 }));
  return withAdminCors(NextResponse.json({ ok: true, item: doc }));
}

export const OPTIONS = adminOptions;
