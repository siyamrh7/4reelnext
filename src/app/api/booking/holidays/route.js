import { NextResponse } from 'next/server';
import { dutchHolidaysFor } from '@/lib/availability';

/** GET /api/booking/holidays?year=2026 — for frontend pre-render of holidays */
export async function GET(request) {
  const year = Number(request.nextUrl.searchParams.get('year')) || new Date().getFullYear();
  return NextResponse.json({ year, dates: dutchHolidaysFor(year) });
}
