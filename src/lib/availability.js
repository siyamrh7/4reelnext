/**
 * Availability math — pure functions, no DB calls.
 *
 * Given the admin's rules + the list of existing bookings, compute:
 *   - whether a specific (date, time) is bookable
 *   - the array of available "HH:mm" slots for a given date
 */

// Anonymous Gregorian Easter algorithm — used for NL holiday calculation
function easter(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31);
  const da = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, mo - 1, da));
}

function addDays(d, n) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

const _holidayCache = {};
export function dutchHolidaysFor(year) {
  if (_holidayCache[year]) return _holidayCache[year];
  const east = easter(year);
  const kd = new Date(Date.UTC(year, 3, 27));
  if (kd.getUTCDay() === 0) kd.setUTCDate(26);
  const list = [
    new Date(Date.UTC(year, 0, 1)),   // Nieuwjaar
    addDays(east, -2),                 // Goede Vrijdag
    east,                              // Eerste Paasdag
    addDays(east, 1),                  // Tweede Paasdag
    kd,                                // Koningsdag
    new Date(Date.UTC(year, 4, 5)),    // Bevrijdingsdag
    addDays(east, 39),                 // Hemelvaart
    addDays(east, 49),                 // Eerste Pinksterdag
    addDays(east, 50),                 // Tweede Pinksterdag
    new Date(Date.UTC(year, 11, 25)),  // Eerste Kerstdag
    new Date(Date.UTC(year, 11, 26)),  // Tweede Kerstdag
  ].map(d => d.toISOString().slice(0, 10));
  _holidayCache[year] = list;
  return list;
}

// "09:00" → 540 (minutes since midnight)
function toMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function fromMin(min) {
  return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
}

/**
 * Generate the unfiltered slot grid for a single date based on weeklyHours + slotMinutes.
 * Returns array of "HH:mm" strings.
 */
function gridFor(dateStr, rules) {
  const [Y, M, D] = dateStr.split('-').map(Number);
  const dow = new Date(Y, M - 1, D).getDay();
  const windows = rules.weeklyHours?.[dow] || [];
  const step = rules.slotMinutes || 30;
  const buf  = rules.bufferMinutes || 0;
  const out = [];
  for (const w of windows) {
    let t = toMin(w.start);
    const end = toMin(w.end);
    while (t + step <= end) {
      out.push(fromMin(t));
      t += step + buf;
    }
  }
  return out;
}

/**
 * Filter the grid for blackouts, holidays, min-notice, and existing bookings.
 *
 * @param {string} dateStr  "YYYY-MM-DD"
 * @param {object} rules    Availability document
 * @param {Array}  bookings  Array of { date, time, status } — only confirmed ones count
 * @param {Date}   now       Current time (allows override for testing)
 * @returns {string[]} Available "HH:mm" slots
 */
export function availableSlots(dateStr, rules, bookings, now = new Date()) {
  if (!rules.bookingEnabled) return [];

  const [Y, M, D] = dateStr.split('-').map(Number);
  const dayDate = new Date(Y, M - 1, D, 0, 0, 0);

  // Min-notice: earliest bookable moment = now + minNoticeHours
  const earliest = new Date(now.getTime() + (rules.minNoticeHours || 0) * 3600_000);

  // Booking window: latest bookable date = today + bookingWindowDays
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const latest = new Date(todayMidnight.getTime() + (rules.bookingWindowDays || 60) * 86_400_000);
  if (dayDate > latest) return [];

  // Block Dutch holidays
  if (rules.blockDutchHolidays) {
    const hd = new Set(dutchHolidaysFor(Y));
    if (hd.has(dateStr)) return [];
  }

  // Full-day blackouts
  const dayBlackouts = (rules.blackouts || []).filter(b => b.date === dateStr);
  const fullDay = dayBlackouts.some(b => !b.start && !b.end);
  if (fullDay) return [];

  // Take the grid for this weekday
  let slots = gridFor(dateStr, rules);

  // Subtract time-window blackouts
  for (const b of dayBlackouts) {
    if (b.start && b.end) {
      const s = toMin(b.start), e = toMin(b.end);
      slots = slots.filter(t => {
        const tm = toMin(t);
        return tm + (rules.slotMinutes || 30) <= s || tm >= e;
      });
    }
  }

  // Subtract existing bookings (confirmed)
  const taken = new Set(
    (bookings || [])
      .filter(b => b.date === dateStr && b.status === 'confirmed')
      .map(b => b.time)
  );
  slots = slots.filter(t => !taken.has(t));

  // Subtract slots before earliest (min-notice + same-day cutoff)
  slots = slots.filter(t => {
    const [h, m] = t.split(':').map(Number);
    const slotDate = new Date(Y, M - 1, D, h, m);
    return slotDate >= earliest;
  });

  return slots;
}

/**
 * Validate a booking request. Returns null if OK, else an error message string.
 */
export async function validateBooking({ dateStr, timeStr, rules, bookings, now = new Date() }) {
  const slots = availableSlots(dateStr, rules, bookings, now);
  if (!slots.includes(timeStr)) {
    return 'Dat tijdstip is niet meer beschikbaar.';
  }
  return null;
}
