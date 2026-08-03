/**
 * Google Calendar client — service account with domain-wide delegation,
 * used to create/cancel events (with an auto-generated Meet link) on the
 * studio's calendar when a booking is made/cancelled.
 */
import { google } from 'googleapis';

const CAL_OWNER = process.env.GOOGLE_CALENDAR_OWNER;

export function makeCalendarClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !CAL_OWNER) return null;
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    subject: CAL_OWNER,
  });
  return google.calendar({ version: 'v3', auth });
}

export async function cancelGoogleEvent(eventId) {
  const cal = makeCalendarClient();
  if (!cal) return;
  await cal.events.delete({ calendarId: 'primary', eventId, sendUpdates: 'all' });
}
