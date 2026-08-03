import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Booking, Question, getAvailability } from '@/lib/models';
import { requireAdmin, withAdminCors, adminOptions } from '@/lib/adminAuth';

export async function GET(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  await dbConnect();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [upcoming, newQuestions, recentBookings, availability] = await Promise.all([
    Booking.countDocuments({ status: 'confirmed', date: { $gte: todayStr } }),
    Question.countDocuments({ status: 'new' }),
    Booking.find({ status: 'confirmed', date: { $gte: todayStr } }).sort({ date: 1, time: 1 }).limit(10),
    getAvailability(),
  ]);

  return withAdminCors(NextResponse.json({
    ok: true,
    stats: { upcoming, newQuestions },
    upcomingBookings: recentBookings,
    bookingEnabled: availability.bookingEnabled,
  }));
}

export const OPTIONS = adminOptions;
