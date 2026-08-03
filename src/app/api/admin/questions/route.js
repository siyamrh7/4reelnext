import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Question } from '@/lib/models';
import { requireAdmin, withAdminCors, adminOptions } from '@/lib/adminAuth';

export async function GET(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const sp = request.nextUrl.searchParams;
  const status = sp.get('status');
  const limit = Number(sp.get('limit')) || 100;
  const q = status ? { status } : {};

  await dbConnect();
  const docs = await Question.find(q).sort({ createdAt: -1 }).limit(limit);
  return withAdminCors(NextResponse.json({ ok: true, items: docs }));
}

export const OPTIONS = adminOptions;
