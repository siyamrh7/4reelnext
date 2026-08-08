'use client';

import { useEffect, useState } from 'react';
import { adminFetch, fmtDate } from '../../adminApi';

const DAYS = [
  { key: '1', label: 'Maandag' },
  { key: '2', label: 'Dinsdag' },
  { key: '3', label: 'Woensdag' },
  { key: '4', label: 'Donderdag' },
  { key: '5', label: 'Vrijdag' },
  { key: '6', label: 'Zaterdag' },
  { key: '0', label: 'Zondag' },
];

const emptyBlackoutForm = { date: '', start: '', end: '', reason: '' };

export default function AvailabilityPage() {
  const [avail, setAvail] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [blackoutForm, setBlackoutForm] = useState(emptyBlackoutForm);
  const [addingBlackout, setAddingBlackout] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminFetch('/api/admin/availability');
        if (!cancelled) setAvail(res.item);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  function setDayRanges(dayKey, ranges) {
    setAvail((prev) => ({ ...prev, weeklyHours: { ...prev.weeklyHours, [dayKey]: ranges } }));
  }

  function addRange(dayKey) {
    const current = avail.weeklyHours[dayKey] || [];
    setDayRanges(dayKey, [...current, { start: '09:00', end: '17:00' }]);
  }

  function updateRange(dayKey, idx, field, value) {
    const current = [...(avail.weeklyHours[dayKey] || [])];
    current[idx] = { ...current[idx], [field]: value };
    setDayRanges(dayKey, current);
  }

  function removeRange(dayKey, idx) {
    const current = (avail.weeklyHours[dayKey] || []).filter((_, i) => i !== idx);
    setDayRanges(dayKey, current);
  }

  async function saveAll() {
    setSaving(true);
    setError('');
    try {
      const res = await adminFetch('/api/admin/availability', {
        method: 'PATCH',
        body: JSON.stringify({
          weeklyHours: avail.weeklyHours,
          slotMinutes: Number(avail.slotMinutes),
          bufferMinutes: Number(avail.bufferMinutes),
          minNoticeHours: Number(avail.minNoticeHours),
          bookingWindowDays: Number(avail.bookingWindowDays),
          blockDutchHolidays: avail.blockDutchHolidays,
          bookingEnabled: avail.bookingEnabled,
          disabledReason: avail.disabledReason,
        }),
      });
      setAvail(res.item);
      setToast('Availability saved');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function addBlackout(e) {
    e.preventDefault();
    if (!blackoutForm.date) return;
    setAddingBlackout(true);
    setError('');
    try {
      const res = await adminFetch('/api/admin/availability/blackouts', {
        method: 'POST',
        body: JSON.stringify({
          date: blackoutForm.date,
          start: blackoutForm.start || null,
          end: blackoutForm.end || null,
          reason: blackoutForm.reason,
        }),
      });
      setAvail(res.item);
      setBlackoutForm(emptyBlackoutForm);
      setToast('Blackout added');
    } catch (e2) {
      setError(e2.message);
    } finally {
      setAddingBlackout(false);
    }
  }

  async function removeBlackout(id) {
    setError('');
    try {
      const res = await adminFetch(`/api/admin/availability/blackouts/${id}`, { method: 'DELETE' });
      setAvail(res.item);
      setToast('Blackout removed');
    } catch (e) {
      setError(e.message);
    }
  }

  if (!avail) {
    return (
      <>
        <div className="a-topbar"><div><div className="a-eyebrow">Booking widget</div><h1>Availability</h1></div></div>
        {error ? <div className="a-panel" style={{ borderColor: 'rgba(255,128,128,.4)', color: '#ff8080' }}>{error}</div> : <div className="a-empty">Loading…</div>}
      </>
    );
  }

  return (
    <>
      <div className="a-topbar">
        <div>
          <div className="a-eyebrow">Booking widget</div>
          <h1>Availability</h1>
        </div>
        <div className="a-topbar-actions">
          <button type="button" className="a-btn primary" disabled={saving} onClick={saveAll}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>

      {error && <div className="a-panel" style={{ borderColor: 'rgba(255,128,128,.4)', color: '#ff8080' }}>{error}</div>}

      <div className="a-panel">
        <div className="a-toggle-row">
          <label className="a-toggle">
            <input type="checkbox" checked={avail.bookingEnabled} onChange={(e) => setAvail({ ...avail, bookingEnabled: e.target.checked })} />
            <span className="a-toggle-track"></span>
          </label>
          <div className="a-toggle-label">
            {avail.bookingEnabled ? 'Bookings are open' : 'Bookings are paused'}
            <small>Master switch — turns the whole booking widget on the site on/off</small>
          </div>
        </div>
        {!avail.bookingEnabled && (
          <div className="a-field" style={{ marginTop: 14 }}>
            <label>Reason shown to visitors</label>
            <input className="a-input" value={avail.disabledReason} onChange={(e) => setAvail({ ...avail, disabledReason: e.target.value })} placeholder="We zijn tot 1 juli op locatie — boekingen gaan daarna weer open." />
          </div>
        )}
      </div>

      <div className="a-panel">
        <h2>Weekly hours</h2>
        <div className="a-week">
          {DAYS.map((day) => {
            const ranges = avail.weeklyHours[day.key] || [];
            return (
              <div className="a-week-day" key={day.key}>
                <div className="a-day-label">{day.label}</div>
                <div className="a-week-ranges">
                  {ranges.length === 0 && <div className="a-day-off">Gesloten</div>}
                  {ranges.map((r, idx) => (
                    <div className="a-range-row" key={idx}>
                      <input type="time" className="a-input" value={r.start} onChange={(e) => updateRange(day.key, idx, 'start', e.target.value)} />
                      <span className="to">–</span>
                      <input type="time" className="a-input" value={r.end} onChange={(e) => updateRange(day.key, idx, 'end', e.target.value)} />
                      <button type="button" className="a-btn ghost sm" onClick={() => removeRange(day.key, idx)}>Remove</button>
                    </div>
                  ))}
                  <button type="button" className="a-btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => addRange(day.key)}>+ Add range</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="a-panel">
        <h2>Slot rules</h2>
        <div className="a-row">
          <div className="a-field">
            <label>Slot length (min)</label>
            <input type="number" className="a-input" min="15" max="120" value={avail.slotMinutes} onChange={(e) => setAvail({ ...avail, slotMinutes: e.target.value })} />
          </div>
          <div className="a-field">
            <label>Buffer between slots (min)</label>
            <input type="number" className="a-input" min="0" max="60" value={avail.bufferMinutes} onChange={(e) => setAvail({ ...avail, bufferMinutes: e.target.value })} />
          </div>
          <div className="a-field">
            <label>Minimum notice (hours)</label>
            <input type="number" className="a-input" min="0" max="168" value={avail.minNoticeHours} onChange={(e) => setAvail({ ...avail, minNoticeHours: e.target.value })} />
          </div>
          <div className="a-field">
            <label>Booking window (days ahead)</label>
            <input type="number" className="a-input" min="1" max="365" value={avail.bookingWindowDays} onChange={(e) => setAvail({ ...avail, bookingWindowDays: e.target.value })} />
          </div>
        </div>
        <label className="a-check">
          <input type="checkbox" checked={avail.blockDutchHolidays} onChange={(e) => setAvail({ ...avail, blockDutchHolidays: e.target.checked })} />
          Block Dutch national holidays automatically
        </label>
      </div>

      <div className="a-panel">
        <h2>Blackouts</h2>
        <p className="a-hint" style={{ marginBottom: 14 }}>Block a specific date, or a time range within a date. Leave start/end empty to block the whole day.</p>

        <form onSubmit={addBlackout}>
          <div className="a-row">
            <div className="a-field">
              <label>Date</label>
              <input type="date" className="a-input" value={blackoutForm.date} onChange={(e) => setBlackoutForm({ ...blackoutForm, date: e.target.value })} required />
            </div>
            <div className="a-field">
              <label>Start (optional)</label>
              <input type="time" className="a-input" value={blackoutForm.start} onChange={(e) => setBlackoutForm({ ...blackoutForm, start: e.target.value })} />
            </div>
            <div className="a-field">
              <label>End (optional)</label>
              <input type="time" className="a-input" value={blackoutForm.end} onChange={(e) => setBlackoutForm({ ...blackoutForm, end: e.target.value })} />
            </div>
            <div className="a-field" style={{ flex: 2, minWidth: 200 }}>
              <label>Reason</label>
              <input className="a-input" value={blackoutForm.reason} onChange={(e) => setBlackoutForm({ ...blackoutForm, reason: e.target.value })} placeholder="Vacation, off-site shoot…" />
            </div>
          </div>
          <button type="submit" className="a-btn" disabled={addingBlackout}>{addingBlackout ? 'Adding…' : '+ Add blackout'}</button>
        </form>

        <div className="a-blackout-list">
          {avail.blackouts.length === 0 && <div className="a-hint">No blackouts set.</div>}
          {avail.blackouts.map((b) => (
            <div className="a-blackout-item" key={b._id}>
              <span className="date">{fmtDate(b.date)}</span>
              <span className="range">{b.start && b.end ? `${b.start}–${b.end}` : 'whole day'}</span>
              <span className="reason">{b.reason || '—'}</span>
              <button type="button" className="a-btn ghost sm" onClick={() => removeBlackout(b._id)}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      {toast && <div className="a-toast">{toast}</div>}
    </>
  );
}
