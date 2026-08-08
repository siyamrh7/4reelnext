'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch, fmtDate } from '../../adminApi';

export default function BookingsPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      try {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        params.set('limit', '500');
        const res = await adminFetch(`/api/admin/bookings?${params.toString()}`);
        if (!cancelled) setItems(res.items);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [status, from, to, refreshKey]);

  const filtered = useMemo(() => {
    if (!items) return null;
    if (!q.trim()) return items;
    const needle = q.trim().toLowerCase();
    return items.filter((b) =>
      b.name.toLowerCase().includes(needle) ||
      b.email.toLowerCase().includes(needle) ||
      (b.company || '').toLowerCase().includes(needle)
    );
  }, [items, q]);

  return (
    <>
      <div className="a-topbar">
        <div>
          <div className="a-eyebrow">Intake</div>
          <h1>Bookings</h1>
        </div>
        <div className="a-topbar-actions">
          <button type="button" className="a-btn ghost sm" onClick={() => setRefreshKey((k) => k + 1)}>↻ Refresh</button>
        </div>
      </div>

      <div className="a-panel">
        <div className="a-row">
          <div className="a-field" style={{ flex: 1.4, minWidth: 200 }}>
            <label>Search</label>
            <input className="a-input" placeholder="Name, email, company…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="a-field">
            <label>Status</label>
            <select className="a-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No-show</option>
            </select>
          </div>
          <div className="a-field">
            <label>From</label>
            <input type="date" className="a-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="a-field">
            <label>To</label>
            <input type="date" className="a-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      {error && <div className="a-panel" style={{ borderColor: 'rgba(255,128,128,.4)', color: '#ff8080' }}>{error}</div>}

      <div className="a-table-wrap">
        {filtered === null ? (
          <div className="a-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="a-empty">No bookings match these filters.</div>
        ) : (
          <table className="a-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b._id} className="clickable" onClick={() => (window.location.href = `/admin/bookings/${b._id}`)}>
                  <td className="mono">{fmtDate(b.date)}</td>
                  <td className="mono">{b.time}</td>
                  <td>{b.name}</td>
                  <td className="a-muted">{b.email}</td>
                  <td className="a-muted">{b.company || '—'}</td>
                  <td><span className={`a-badge ${b.status}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
