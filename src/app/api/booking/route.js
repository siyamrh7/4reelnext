import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createEvent } from 'ics';
import { dbConnect } from '@/lib/db';
import { Booking, getAvailability } from '@/lib/models';
import { validateBooking } from '@/lib/availability';
import { makeCalendarClient } from '@/lib/calendar';
import { sendBookingMails } from '@/lib/mailer';
import { fireWebhook } from '@/lib/webhook';
import { bookingRateLimit, clientIp } from '@/lib/rateLimit';

const TZ           = process.env.STUDIO_TIMEZONE || 'Europe/Amsterdam';
const STUDIO_EMAIL = process.env.STUDIO_NOTIFY_EMAIL;
const STUDIO_NAME  = process.env.STUDIO_NAME || '4REEL Studio';

const BookingSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().default(''),
  company: z.string().max(120).optional().default(''),
  message: z.string().max(2000).optional().default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(15).max(120).optional().default(30),
});

/** POST /api/booking — create event + send mails */
export async function POST(request) {
  if (!bookingRateLimit(clientIp(request))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;

  await dbConnect();
  const rules = await getAvailability();
  if (!rules.bookingEnabled) {
    return NextResponse.json({ error: rules.disabledReason || 'Boekingen staan tijdelijk uit.' }, { status: 503 });
  }

  const bookings = await Booking.find({ date: b.date, status: 'confirmed' }).select('date time status').lean();
  const err = await validateBooking({ dateStr: b.date, timeStr: b.time, rules, bookings });
  if (err) return NextResponse.json({ error: err }, { status: 409 });

  // Atomic-ish: insert, then create GCal event. If insert fails (dup), 500.
  let doc;
  try {
    doc = await Booking.create({ ...b });
  } catch (e) {
    return NextResponse.json({ error: 'Booking save failed' }, { status: 500 });
  }

  // Build ISO date strings
  const startISO = `${b.date}T${b.time}:00`;
  const endDate = new Date(startISO);
  endDate.setMinutes(endDate.getMinutes() + b.durationMinutes);
  const pad = (n) => String(n).padStart(2, '0');
  const endISO = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`;

  // --- Create Google event w/ Meet ---
  const cal = makeCalendarClient();
  if (cal) {
    try {
      const evt = await cal.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        sendUpdates: 'all',
        requestBody: {
          summary: `4REEL · Intake met ${b.name}${b.company ? ' (' + b.company + ')' : ''}`,
          description: [
            `Naam: ${b.name}`,
            `E-mail: ${b.email}`,
            b.phone ? `Telefoon: ${b.phone}` : null,
            b.company ? `Bedrijf: ${b.company}` : null,
            '',
            b.message || '(geen bericht meegestuurd)',
          ].filter(Boolean).join('\n'),
          start: { dateTime: startISO, timeZone: TZ },
          end:   { dateTime: endISO,   timeZone: TZ },
          attendees: [
            { email: b.email, displayName: b.name },
            { email: STUDIO_EMAIL, displayName: STUDIO_NAME, responseStatus: 'accepted' },
          ],
          conferenceData: { createRequest: { requestId: `4reel-${doc._id}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
          reminders: { useDefault: true },
        },
      });
      doc.googleEventId = evt.data.id;
      doc.meetLink = evt.data.hangoutLink || evt.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || null;
      await doc.save();
    } catch (e) {
      console.error('Google Calendar error:', e?.errors || e?.message || e);
    }
  }

  // --- .ics fallback ---
  let icsContent = null;
  try {
    const [Y, M, D] = b.date.split('-').map(Number);
    const [h, m] = b.time.split(':').map(Number);
    const result = createEvent({
      start: [Y, M, D, h, m],
      duration: { minutes: b.durationMinutes },
      title: `4REEL · Intake met ${b.name}`,
      description: b.message || 'Intake gesprek met 4REEL Studio.',
      location: doc.meetLink || 'Google Meet — link volgt',
      url: doc.meetLink || undefined,
      organizer: { name: STUDIO_NAME, email: STUDIO_EMAIL },
      attendees: [{ name: b.name, email: b.email, rsvp: true }],
    });
    if (!result.error) icsContent = result.value;
  } catch (e) { console.error('ICS build failed', e); }

  // --- Mails ---
  const dateFmt = new Date(`${b.date}T${b.time}:00`).toLocaleString('nl-NL', {
    dateStyle: 'full', timeStyle: 'short', timeZone: TZ,
  });
  await sendBookingMails({ booking: doc.toObject(), dateFmt, icsContent });

  // --- Webhook to admin platform ---
  await fireWebhook('booking.created', doc.toObject());

  return NextResponse.json({ ok: true, id: doc._id, meetLink: doc.meetLink });
}
