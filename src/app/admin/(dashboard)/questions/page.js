'use client';

import { useEffect, useState } from 'react';
import { adminFetch, fmtDateTime } from '../../adminApi';

export default function QuestionsPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [openId, setOpenId] = useState(null);
  const [note, setNote] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      try {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        params.set('limit', '500');
        const res = await adminFetch(`/api/admin/questions?${params.toString()}`);
        if (!cancelled) setItems(res.items);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [status, refreshKey]);

  function toggleOpen(q) {
    if (openId === q._id) {
      setOpenId(null);
      return;
    }
    setOpenId(q._id);
    setNote(q.internalNote || '');
  }

  async function update(qid, patch) {
    setBusyId(qid);
    try {
      const res = await adminFetch(`/api/admin/questions/${qid}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setItems((prev) => prev.map((it) => (it._id === qid ? res.item : it)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="a-topbar">
        <div>
          <div className="a-eyebrow">Inbox</div>
          <h1>Questions</h1>
        </div>
        <div className="a-topbar-actions">
          <select className="a-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="new">New</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
          <button type="button" className="a-btn ghost sm" onClick={() => setRefreshKey((k) => k + 1)}>↻ Refresh</button>
        </div>
      </div>

      {error && <div className="a-panel" style={{ borderColor: 'rgba(255,128,128,.4)', color: '#ff8080' }}>{error}</div>}

      {items === null ? (
        <div className="a-empty">Loading…</div>
      ) : items.length === 0 ? (
        <div className="a-empty">No questions here.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((q) => {
            const open = openId === q._id;
            return (
              <div key={q._id} className="a-panel" style={{ marginBottom: 0, cursor: 'pointer' }}>
                <div onClick={() => toggleOpen(q)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                      <strong>{q.name}</strong>
                      <span className="a-muted" style={{ fontSize: 12.5 }}>{q.email}</span>
                    </div>
                    {!open && <div className="a-muted" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.message}</div>}
                  </div>
                  <span className="a-muted mono" style={{ fontSize: 12, flexShrink: 0 }}>{fmtDateTime(q.createdAt)}</span>
                  <span className={`a-badge ${q.status}`}>{q.status}</span>
                </div>

                {open && (
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--rule)', paddingTop: 16 }} onClick={(e) => e.stopPropagation()}>
                    <div className="a-kv" style={{ marginBottom: 14 }}>
                      {q.phone && <div className="a-kv-row"><span className="k">Phone</span><span className="v">{q.phone}</span></div>}
                      {q.company && <div className="a-kv-row"><span className="k">Company</span><span className="v">{q.company}</span></div>}
                    </div>
                    <div className="a-msg-block" style={{ marginBottom: 14 }}>{q.message}</div>

                    <div className="a-field">
                      <label>Internal note</label>
                      <textarea className="a-textarea" value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <a className="a-btn sm" href={`mailto:${q.email}?subject=${encodeURIComponent('Re: je vraag aan 4REEL')}`}>Reply by email ↗</a>
                      <button type="button" className="a-btn sm" disabled={busyId === q._id} onClick={() => update(q._id, { internalNote: note })}>Save note</button>
                      {q.status !== 'replied' && <button type="button" className="a-btn primary sm" disabled={busyId === q._id} onClick={() => update(q._id, { status: 'replied' })}>Mark replied</button>}
                      {q.status !== 'closed' && <button type="button" className="a-btn sm" disabled={busyId === q._id} onClick={() => update(q._id, { status: 'closed' })}>Close</button>}
                      {q.status !== 'new' && <button type="button" className="a-btn ghost sm" disabled={busyId === q._id} onClick={() => update(q._id, { status: 'new' })}>Reopen</button>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
