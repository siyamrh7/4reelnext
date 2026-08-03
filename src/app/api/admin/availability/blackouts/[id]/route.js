import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { getAvailability } from '@/lib/models';
import { requireAdmin, withAdminCors, adminOptions } from '@/lib/adminAuth';

export async function DELETE(request, { params }) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  await dbConnect();
  const doc = await getAvailability();
  const before = doc.blackouts.length;
  doc.blackouts = doc.blackouts.filter(b => String(b._id) !== id);
  if (doc.blackouts.length === before) {
    return withAdminCors(NextResponse.json({ error: 'Blackout not found' }, { status: 404 }));
  }
  await doc.save();
  return withAdminCors(NextResponse.json({ ok: true, item: doc }));
}

export const OPTIONS = adminOptions;
