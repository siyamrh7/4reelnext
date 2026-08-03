'use client';

import { useMemo, useRef, useState } from 'react';

const MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

// Dutch national holidays — computed per year so it keeps working in 2027+.
// Easter Sunday via the Anonymous Gregorian algorithm.
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function holidaysFor(y) {
  const east = easter(y);
  // Koningsdag: 27 april, of 26 april als 27 april op zondag valt
  const kd = new Date(y, 3, 27);
  if (kd.getDay() === 0) kd.setDate(26);
  return [
    new Date(y, 0, 1),   // Nieuwjaarsdag
    addDays(east, -2),   // Goede Vrijdag
    east,                // Eerste Paasdag
    addDays(east, 1),    // Tweede Paasdag
    kd,                  // Koningsdag
    new Date(y, 4, 5),   // Bevrijdingsdag
    addDays(east, 39),   // Hemelvaartsdag
    addDays(east, 49),   // Eerste Pinksterdag
    addDays(east, 50),   // Tweede Pinksterdag
    new Date(y, 11, 25), // Eerste Kerstdag
    new Date(y, 11, 26), // Tweede Kerstdag
  ].map(d => { d.setHours(0, 0, 0, 0); return d.getTime(); });
}
const holidayCache = {};
function isHoliday(d) {
  const y = d.getFullYear();
  if (!holidayCache[y]) holidayCache[y] = holidaysFor(y);
  return holidayCache[y].includes(d.getTime());
}
function isWeekend(d) { const w = d.getDay(); return w === 0 || w === 6; }
function fmtDate(d) { const dd = String(d.getDate()).padStart(2, '0'); return `${dd} ${MONTHS[d.getMonth()].toLowerCase()}`; }
// Local YYYY-MM-DD — NOT toISOString(), which shifts to UTC and can land on
// the wrong calendar day for anyone west-of-Greenwich-negative / CET/CEST.
function toDateStr(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfToday() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

export default function BookingWidget() {
  const [mode, setMode] = useState('plan'); // 'plan' | 'ask'
  const [today] = useState(startOfToday);
  const [view, setView] = useState(() => { const t = startOfToday(); return new Date(t.getFullYear(), t.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsState, setSlotsState] = useState('idle'); // idle | loading | loaded | error
  const [bookingThanks, setBookingThanks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState('idle'); // idle | success | error
  const [submitLabelOverride, setSubmitLabelOverride] = useState(null);

  const formRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const companyRef = useRef(null);
  const messageRef = useRef(null);

  const isAsk = mode === 'ask';

  const cells = useMemo(() => {
    const firstDow = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < firstDow; i++) out.push({ key: `lead-${i}`, blank: true });
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(view.getFullYear(), view.getMonth(), day);
      let cls = 'day';
      let clickable = false;
      let title;
      if (d <= today) {
        cls += ' past';
      } else if (isWeekend(d)) {
        cls += ' muted';
      } else if (isHoliday(d)) {
        cls += ' muted';
        title = 'Nationale feestdag';
      } else {
        cls += ' avail';
        clickable = true;
      }
      if (selectedDate && d.toDateString() === selectedDate.toDateString()) cls += ' selected';
      out.push({ key: `d-${day}`, blank: false, day, date: d, cls, clickable, title });
    }
    const total = firstDow + daysInMonth;
    const fill = (7 - (total % 7)) % 7;
    for (let i = 0; i < fill; i++) out.push({ key: `trail-${i}`, blank: true });
    return out;
  }, [view, today, selectedDate]);

  function goPrevMonth() {
    const v = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    const m0 = new Date(today.getFullYear(), today.getMonth(), 1);
    if (v >= m0) setView(v);
  }
  function goNextMonth() {
    setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));
  }

  async function handleSelectDate(d) {
    setSelectedDate(d);
    setSelectedTime(null);
    setBookingThanks(false);
    setSlotsState('loading');
    setSlots([]);
    try {
      const r = await fetch('/api/booking/slots?date=' + encodeURIComponent(toDateStr(d)));
      if (!r.ok) { setSlotsState('error'); return; }
      const data = await r.json();
      setSlots(Array.isArray(data.slots) ? data.slots : []);
      setSlotsState('loaded');
    } catch (e) {
      setSlotsState('error');
    }
  }

  function switchMode(next) {
    setMode(next);
    setSelectedDate(null);
    setSelectedTime(null);
    setBookingThanks(false);
    setSlotsState('idle');
    setSlots([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const name = nameRef.current.value.trim();
    const email = emailRef.current.value.trim();
    const phone = phoneRef.current.value.trim();
    const company = companyRef.current.value.trim();
    const message = messageRef.current.value.trim();
    if (!name || !email) return;

    if (!isAsk && (!selectedDate || !selectedTime)) {
      setSubmitLabelOverride('Kies datum + tijd →');
      setTimeout(() => setSubmitLabelOverride(null), 2200);
      return;
    }

    setSubmitting(true);
    setSubmitState('idle');

    const endpoint = isAsk ? '/api/question' : '/api/booking';
    const payload = isAsk
      ? { name, email, phone, company, message }
      : { name, email, phone, company, message, date: toDateStr(selectedDate), time: selectedTime, durationMinutes: 30 };

    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Server error');

      setSubmitState('success');
      formRef.current.reset();
      setSelectedDate(null);
      setSelectedTime(null);
      setSlots([]);
      setSlotsState('idle');
      if (!isAsk) setBookingThanks(true);
    } catch (err) {
      console.error('Booking failed:', err);
      setSubmitState('error');
      setSubmitting(false);
    }
  }

  let submitLabel;
  if (submitLabelOverride) submitLabel = submitLabelOverride;
  else if (submitting) submitLabel = 'Verzenden…';
  else if (submitState === 'success') submitLabel = isAsk ? 'Vraag verzonden ✓' : 'Gesprek bevestigd ✓';
  else if (submitState === 'error') submitLabel = 'Mislukt — probeer opnieuw';
  else submitLabel = isAsk ? 'Verzend vraag' : 'Plan gesprek';

  return (
    <>
      <div className="plan-tabs" role="tablist">
        <button className={`plan-tab${!isAsk ? ' active' : ''}`} type="button" data-tab="plan" role="tab" aria-selected={!isAsk} onClick={() => switchMode('plan')}>
          <span className="num">01 /</span> Plan een gesprek
        </button>
        <button className={`plan-tab${isAsk ? ' active' : ''}`} type="button" data-tab="ask" role="tab" aria-selected={isAsk} onClick={() => switchMode('ask')}>
          <span className="num">02 /</span> Stel een vraag
        </button>
      </div>

      <div className={`plan-grid${isAsk ? ' contact-only' : ''}`} id="plan-grid">
        <div className="plan-left">
          <h2 id="plan-headline">Plan jouw <span className="stroke">eerste</span> <span className="acc">reel.</span></h2>
          <p id="plan-copy">Kies een datum die schikt en laat je gegevens achter — binnen 24 uur ontvang je een bevestiging plus een eerste idee. <strong>30 minuten, geen verplichtingen.</strong></p>

          <div className="plan-cal">
            <div className="plan-cal-head">
              <span>· Beschikbaar</span>
              <span className="month" id="cal-month">{MONTHS[view.getMonth()]} {view.getFullYear()}</span>
              <span className="nav-btns">
                <button id="cal-prev" aria-label="Vorige maand" type="button" onClick={goPrevMonth}>‹</button>
                <button id="cal-next" aria-label="Volgende maand" type="button" onClick={goNextMonth}>›</button>
              </span>
            </div>
            <div className="plan-days" id="cal-days">
              <span className="dow">Ma</span><span className="dow">Di</span><span className="dow">Wo</span><span className="dow">Do</span><span className="dow">Vr</span><span className="dow">Za</span><span className="dow">Zo</span>
              {cells.map(c => c.blank
                ? <span className="day muted" key={c.key}></span>
                : (
                  <span
                    className={c.cls}
                    key={c.key}
                    title={c.title}
                    onClick={c.clickable ? () => handleSelectDate(c.date) : undefined}
                  >
                    {c.day}
                  </span>
                ))}
            </div>
            <div className="plan-slots" id="cal-slots">
              {bookingThanks ? (
                <span className="empty">Bedankt — we mailen je zo de bevestiging</span>
              ) : slotsState === 'idle' ? (
                <span className="empty">Kies een datum hierboven →</span>
              ) : slotsState === 'loading' ? (
                <span className="empty">… laden</span>
              ) : slotsState === 'error' ? (
                <span className="empty">Kon beschikbaarheid niet laden — probeer opnieuw</span>
              ) : slots.length === 0 ? (
                <span className="empty">Geen tijden beschikbaar op deze dag</span>
              ) : (
                slots.map(t => (
                  <button
                    type="button"
                    className={`slot${selectedTime === t ? ' active' : ''}`}
                    key={t}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <form className="plan-form" id="plan-form" ref={formRef} onSubmit={handleSubmit}>
          <p className="form-intro" id="form-intro">{isAsk ? 'Stel je vraag — binnen 24 uur antwoord per mail.' : 'Vul je gegevens in — wij bevestigen je gesprek per mail.'}</p>
          <div className="field"><label htmlFor="f-name">Naam</label><input id="f-name" name="name" placeholder="Jouw naam" required ref={nameRef} /></div>
          <div className="row2">
            <div className="field"><label htmlFor="f-email">E-mail</label><input id="f-email" name="email" type="email" placeholder="jij@bedrijf.nl" required ref={emailRef} /></div>
            <div className="field"><label htmlFor="f-phone">Telefoon</label><input id="f-phone" name="phone" placeholder="+31 —" ref={phoneRef} /></div>
          </div>
          <div className="field"><label htmlFor="f-company">Bedrijf</label><input id="f-company" name="company" placeholder="Wat is jouw merk?" ref={companyRef} /></div>
          <div className="field">
            <label htmlFor="f-msg" id="f-msg-label">{isAsk ? 'Jouw vraag' : 'Bericht'}</label>
            <textarea
              id="f-msg"
              name="message"
              placeholder={isAsk ? 'Waar wil je meer over weten?' : 'Vertel kort wat je voor ogen hebt — wij komen terug met 2 of 3 ideeen.'}
              required={isAsk}
              ref={messageRef}
            ></textarea>
          </div>

          {!isAsk && (
            <div className={`summary${selectedDate && selectedTime ? ' has' : ''}`} id="plan-summary">
              <span id="plan-sum-text">
                {selectedDate && selectedTime
                  ? fmtDate(selectedDate)
                  : selectedDate
                    ? `${fmtDate(selectedDate)} — kies een tijd`
                    : 'Geen datum gekozen — dat hoeft niet'}
              </span>
              <span id="plan-sum-time">{selectedDate && selectedTime ? selectedTime : ''}</span>
            </div>
          )}

          <button
            className="submit"
            type="submit"
            id="plan-submit"
            disabled={submitting || submitState === 'success'}
            style={submitState === 'success' ? { background: 'var(--accent)', color: 'var(--ink)' } : undefined}
          >
            <span className="submit-label">{submitLabel}</span>
            <span className="arrow">→</span>
          </button>
          <span className="alt">of mail direct <a href="mailto:info@4reelagency.nl">info@4reelagency.nl</a></span>
        </form>
      </div>
    </>
  );
}
