import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Booking, getAvailability } from '@/lib/models';
import { availableSlots } from '@/lib/availability';
import { slotRateLimit, clientIp } from '@/lib/rateLimit';

/** GET /api/booking/slots?date=YYYY-MM-DD — returns available HH:mm slots */
export async function GET(request) {
  if (!slotRateLimit(clientIp(request))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const date = request.nextUrl.searchParams.get('date') || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  await dbConnect();
  const rules = await getAvailability();
  const bookings = await Booking.find({ date, status: 'confirmed' }).select('date time status').lean();
  const slots = availableSlots(date, rules, bookings);
  return NextResponse.json({ ok: true, date, slots, bookingEnabled: rules.bookingEnabled, disabledReason: rules.disabledReason });
}
