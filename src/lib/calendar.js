/**
 * Google Calendar client — OAuth2 with a stored refresh token (obtained once
 * via scripts/get-google-refresh-token.mjs), used to create/cancel events
 * (with an auto-generated Meet link) on info@4reelagency.nl's calendar when
 * a booking is made/cancelled.
 *
 * This account's org blocks service-account key creation
 * (iam.managed.disableServiceAccountKeyCreation), so we authenticate as the
 * actual Workspace user instead of a service account with domain-wide
 * delegation — "primary" below refers to whoever owns the refresh token.
 */
import { google } from 'googleapis';

export function makeCalendarClient() {
  const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_OAUTH_REFRESH_TOKEN) return null;
  const auth = new google.auth.OAuth2(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN });
  return google.calendar({ version: 'v3', auth });
}

export async function cancelGoogleEvent(eventId) {
  const cal = makeCalendarClient();
  if (!cal) return;
  await cal.events.delete({ calendarId: 'primary', eventId, sendUpdates: 'all' });
}
