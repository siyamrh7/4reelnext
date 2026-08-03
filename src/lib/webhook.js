/**
 * Push notification to the (external) admin platform when a booking/question
 * comes in. HMAC-signed with ADMIN_WEBHOOK_SECRET so the receiver can verify
 * authenticity — same scheme as the original Express backend.
 *
 * Unlike the original (fire-and-forget), this is awaited by callers: a
 * serverless function can be frozen the instant it returns a response, so an
 * un-awaited fetch might never actually leave the process.
 */
import crypto from 'crypto';

const WEBHOOK_URL    = process.env.ADMIN_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.ADMIN_WEBHOOK_SECRET;

export async function fireWebhook(event, payload) {
  if (!WEBHOOK_URL) return;
  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  const sig = WEBHOOK_SECRET
    ? crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
    : null;
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sig ? { 'X-4REEL-Signature': sig } : {}),
      },
      body,
    });
  } catch (e) {
    console.error('Webhook failed:', e?.message || e);
  }
}
