import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { getAvailability } from '@/lib/models';

/** GET /api/booking/availability — public view of availability config (for the calendar to know which days/times) */
export async function GET() {
  await dbConnect();
  const r = await getAvailability();
  return NextResponse.json({
    ok: true,
    weeklyHours: r.weeklyHours,
    slotMinutes: r.slotMinutes,
    minNoticeHours: r.minNoticeHours,
    bookingWindowDays: r.bookingWindowDays,
    blockDutchHolidays: r.blockDutchHolidays,
    bookingEnabled: r.bookingEnabled,
    disabledReason: r.disabledReason,
  });
}
