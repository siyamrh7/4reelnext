/**
 * Small in-memory sliding-window rate limiter keyed by client IP — replaces
 * express-rate-limit now that there's no long-lived Express process.
 *
 * Caveat: on Vercel, each serverless instance (and every cold start) has its
 * own memory, so this resets rather than sharing state globally. That's fine
 * as a basic abuse deterrent; if it ever needs to be airtight across
 * instances, swap this for a shared store (e.g. Upstash Redis).
 */
const buckets = new Map();

export function rateLimit({ windowMs, max }) {
  return function check(key) {
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = [];
      buckets.set(key, bucket);
    }
    while (bucket.length && bucket[0] <= now - windowMs) bucket.shift();
    if (bucket.length >= max) return false;
    bucket.push(now);
    if (bucket.length === 0) buckets.delete(key);
    return true;
  };
}

export function clientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

// Same limits as the original Express middleware.
export const bookingRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 5 });
export const slotRateLimit    = rateLimit({ windowMs: 60_000,      max: 60 });
