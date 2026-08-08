'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminFetch, fmtDate, fmtDateTime } from '../../../adminApi';

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminFetch(`/api/admin/bookings/${id}`);
        if (cancelled) return;
        setBooking(res.item);
        setNote(res.item.internalNote || '');
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  async function updateStatus(status, extra = {}) {
    setBusy(true);
    try {
      const res = await adminFetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...extra }),
      });
      setBooking(res.item);
      setCancelling(false);
      setToast(`Marked as ${status}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    setSavingNote(true);
    try {
      const res = await adminFetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ internalNote: note }),
      });
      setBooking(res.item);
      setToast('Note saved');
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingNote(false);
    }
  }

  if (error) return <div className="a-panel" style={{ borderColor: 'rgba(255,128,128,.4)', color: '#ff8080' }}>{error}</div>;
  if (!booking) return <div className="a-empty">Loading…</div>;

  return (
    <>
      <div className="a-topbar">
        <div>
          <div className="a-eyebrow">
            <button type="button" className="a-btn ghost sm" onClick={() => router.push('/admin/bookings')} style={{ marginRight: 8 }}>← Back</button>
          </div>
          <h1>{booking.name}</h1>
        </div>
        <span className={`a-badge ${booking.status}`}>{booking.status}</span>
      </div>

      <div className="a-detail-grid">
        <div>
          <div className="a-panel">
            <h2>Details</h2>
            <div className="a-kv">
              <div className="a-kv-row"><span className="k">Date</span><span className="v mono">{fmtDate(booking.date)}</span></div>
              <div className="a-kv-row"><span className="k">Time</span><span className="v mono">{booking.time} · {booking.durationMinutes} min</span></div>
              <div className="a-kv-row"><span className="k">Email</span><span className="v">{booking.email}</span></div>
              <div className="a-kv-row"><span className="k">Phone</span><span className="v">{booking.phone || '—'}</span></div>
              <div className="a-kv-row"><span className="k">Company</span><span className="v">{booking.company || '—'}</span></div>
              <div className="a-kv-row"><span className="k">Meet link</span><span className="v">{booking.meetLink ? <a href={booking.meetLink} target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>Open ↗</a> : '—'}</span></div>
              <div className="a-kv-row"><span className="k">Source</span><span className="v">{booking.source}</span></div>
              <div className="a-kv-row"><span className="k">Booked on</span><span className="v">{fmtDateTime(booking.createdAt)}</span></div>
              {booking.status === 'cancelled' && (
                <div className="a-kv-row"><span className="k">Cancelled by</span><span className="v">{booking.cancelledBy || '—'} — {booking.cancelledReason || 'no reason given'}</span></div>
              )}
            </div>
          </div>

          {booking.message && (
            <div className="a-panel">
              <h2>Message</h2>
              <div className="a-msg-block">{booking.message}</div>
            </div>
          )}

          <div className="a-panel">
            <h2>Internal note</h2>
            <textarea className="a-textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Not visible to the customer…" />
            <div style={{ marginTop: 10 }}>
              <button type="button" className="a-btn primary sm" onClick={saveNote} disabled={savingNote}>{savingNote ? 'Saving…' : 'Save note'}</button>
            </div>
          </div>
        </div>

        <div>
          <div className="a-panel">
            <h2>Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button type="button" className="a-btn" disabled={busy || booking.status === 'completed'} onClick={() => updateStatus('completed')}>Mark completed</button>
              <button type="button" className="a-btn" disabled={busy || booking.status === 'no-show'} onClick={() => updateStatus('no-show')}>Mark no-show</button>
              <button type="button" className="a-btn" disabled={busy || booking.status === 'confirmed'} onClick={() => updateStatus('confirmed')}>Re-open (confirmed)</button>

              {!cancelling ? (
                <button type="button" className="a-btn danger" disabled={busy || booking.status === 'cancelled'} onClick={() => setCancelling(true)}>Cancel booking</button>
              ) : (
                <div style={{ border: '1px solid rgba(255,128,128,.35)', borderRadius: 8, padding: 12 }}>
                  <div className="a-field" style={{ marginBottom: 10 }}>
                    <label>Reason</label>
                    <textarea className="a-textarea" style={{ minHeight: 60 }} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Why is this being cancelled?" />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="a-btn danger sm" disabled={busy} onClick={() => updateStatus('cancelled', { cancelledReason: cancelReason })}>Confirm cancel</button>
                    <button type="button" className="a-btn ghost sm" onClick={() => setCancelling(false)}>Back</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="a-toast">{toast}</div>}
    </>
  );
}
