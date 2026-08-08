'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch, fmtDate } from '../adminApi';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await adminFetch('/api/admin/dashboard');
      setData(res);
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleBooking() {
    if (!data) return;
    setToggling(true);
    try {
      await adminFetch('/api/admin/availability', {
        method: 'PATCH',
        body: JSON.stringify({ bookingEnabled: !data.bookingEnabled }),
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setToggling(false);
    }
  }

  return (
    <>
      <div className="a-topbar">
        <div>
          <div className="a-eyebrow">Overview</div>
          <h1>Dashboard</h1>
        </div>
      </div>

      {error && <div className="a-panel" style={{ borderColor: 'rgba(255,128,128,.4)', color: '#ff8080' }}>{error}</div>}

      {!data ? (
        <div className="a-empty">Loading…</div>
      ) : (
        <>
          <div className="a-cards">
            <div className="a-card a-stat accent">
              <div className="a-stat-num">{data.stats.upcoming}</div>
              <div className="a-stat-label">Upcoming bookings</div>
            </div>
            <div className="a-card a-stat">
              <div className="a-stat-num">{data.stats.newQuestions}</div>
              <div className="a-stat-label">New questions</div>
            </div>
            <div className="a-card">
              <div className="a-toggle-row">
                <label className="a-toggle">
                  <input type="checkbox" checked={data.bookingEnabled} onChange={toggleBooking} disabled={toggling} />
                  <span className="a-toggle-track"></span>
                </label>
                <div className="a-toggle-label">
                  {data.bookingEnabled ? 'Bookings open' : 'Bookings paused'}
                  <small>Widget on the site {data.bookingEnabled ? 'accepts' : 'rejects'} new bookings</small>
                </div>
              </div>
            </div>
          </div>

          <div className="a-panel">
            <div className="a-panel-head">
              <h2>Next up</h2>
              <Link href="/admin/bookings" className="a-btn ghost sm">All bookings →</Link>
            </div>
            {data.upcomingBookings.length === 0 ? (
              <div className="a-empty">No upcoming bookings.</div>
            ) : (
              <div className="a-table-wrap">
                <table className="a-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Name</th>
                      <th>Company</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.upcomingBookings.map((b) => (
                      <tr key={b._id} className="clickable" onClick={() => (window.location.href = `/admin/bookings/${b._id}`)}>
                        <td>{fmtDate(b.date)}</td>
                        <td className="mono">{b.time}</td>
                        <td>{b.name}</td>
                        <td className="a-muted">{b.company || '—'}</td>
                        <td><span className={`a-badge ${b.status}`}>{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
