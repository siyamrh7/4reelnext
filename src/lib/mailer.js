/**
 * Transactional email via Google Workspace SMTP (info@4reelagency.nl + an
 * App Password) — booking confirmation/notification + question
 * acknowledgement mails. Templates ported verbatim from the Express backend.
 *
 * Gmail/Workspace requires the authenticated account (SMTP_USER) to match
 * the envelope sender, so MAIL_FROM's address must be SMTP_USER itself or a
 * verified "Send As" alias on that mailbox — otherwise Google silently
 * rewrites the From header.
 */
import nodemailer from 'nodemailer';

const STUDIO_EMAIL = process.env.STUDIO_NOTIFY_EMAIL;
const STUDIO_NAME   = process.env.STUDIO_NAME || '4REEL Agency';
const MAIL_FROM     = process.env.MAIL_FROM || `${STUDIO_NAME} <${process.env.SMTP_USER || 'noreply@4reelagency.nl'}>`;

export const mailer = (process.env.SMTP_USER && process.env.SMTP_APP_PASSWORD)
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_APP_PASSWORD },
    })
  : null;

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function customerHtml({ name, dateFmt, meetLink }) {
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#0a0a0a">
  <div style="background:#0a0a0a;padding:18px 20px;color:#d4ff00;font-family:'IBM Plex Mono',monospace;letter-spacing:.2em;font-size:11px;text-transform:uppercase">● REC — 4REEL AGENCY</div>
  <h2 style="margin:24px 0 8px;font-size:24px">Bevestigd, ${esc(name.split(' ')[0])}.</h2>
  <p style="font-size:15px;line-height:1.5;color:#444">Je gesprek met 4REEL staat ingepland. Hieronder alle details — de afspraak staat al in onze agenda.</p>
  <div style="border:1.5px solid #0a0a0a;padding:16px 18px;margin:18px 0;background:#f4f1ea">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#666">Wanneer</div>
    <div style="font-size:18px;font-weight:600;margin-top:4px">${esc(dateFmt)}</div>
  </div>
  ${meetLink ? `<div style="margin:18px 0"><a href="${esc(meetLink)}" style="display:inline-block;background:#d4ff00;color:#0a0a0a;padding:14px 20px;text-decoration:none;font-weight:600;font-family:'IBM Plex Mono',monospace;letter-spacing:.18em;text-transform:uppercase;font-size:13px">Open Google Meet →</a></div>` : `<p style="color:#a00;font-size:13px">⚠️ De Google Meet link volgt apart per mail.</p>`}
  <p style="font-size:13px;color:#666;margin-top:24px">Niet meer beschikbaar? Reply op deze mail en we vinden een ander moment.</p>
  <hr style="border:0;border-top:1px solid #ddd;margin:24px 0">
  <p style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#888">4REEL AGENCY · AMERSFOORT NL · INFO@4REELAGENCY.NL</p>
</div>`;
}

export function studioHtml({ name, email, phone, company, message, dateFmt, meetLink, eventId, id }) {
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;padding:20px">
  <h2>📥 Nieuwe boeking</h2>
  <p><b>${esc(name)}</b>${company ? ' · ' + esc(company) : ''}<br>${esc(email)}${phone ? ' · ' + esc(phone) : ''}</p>
  <div style="background:#f4f1ea;padding:14px 16px;border-left:3px solid #d4ff00;margin:16px 0"><b>${esc(dateFmt)}</b></div>
  ${message ? `<p><b>Bericht:</b><br>${esc(message).replace(/\n/g, '<br>')}</p>` : ''}
  ${meetLink ? `<p>🎥 <a href="${esc(meetLink)}">${esc(meetLink)}</a></p>` : ''}
  <p style="font-size:11px;color:#888;margin-top:18px">DB id: ${esc(String(id))}${eventId ? ' · Calendar id: ' + esc(eventId) : ''}</p>
</div>`;
}

export async function sendBookingMails({ booking, dateFmt, icsContent }) {
  if (!mailer) return;
  // Each send opens its own SMTP connection (no pooling), so running both
  // concurrently roughly halves the wait instead of paying two handshakes
  // back-to-back — this is on the booking request's critical path.
  const results = await Promise.allSettled([
    mailer.sendMail({
      from: MAIL_FROM, to: booking.email,
      subject: `Bevestiging — Gesprek met 4REEL · ${dateFmt}`,
      html: customerHtml({ ...booking, dateFmt, meetLink: booking.meetLink }),
      attachments: icsContent ? [{ filename: '4reel-intake.ics', content: Buffer.from(icsContent) }] : [],
    }),
    mailer.sendMail({
      from: MAIL_FROM, to: STUDIO_EMAIL, replyTo: booking.email,
      subject: `📥 Nieuwe boeking — ${booking.name}${booking.company ? ' (' + booking.company + ')' : ''} · ${dateFmt}`,
      html: studioHtml({ ...booking, dateFmt, meetLink: booking.meetLink, eventId: booking.googleEventId, id: booking._id }),
    }),
  ]);
  if (results[0].status === 'rejected') console.error('customer mail failed', results[0].reason);
  if (results[1].status === 'rejected') console.error('studio mail failed', results[1].reason);
}

export async function sendQuestionMails(q) {
  if (!mailer) return;
  const results = await Promise.allSettled([
    mailer.sendMail({
      from: MAIL_FROM, to: STUDIO_EMAIL, replyTo: q.email,
      subject: `💬 Nieuwe vraag — ${q.name}${q.company ? ' (' + q.company + ')' : ''}`,
      html: `<p><b>Naam:</b> ${esc(q.name)}<br><b>E-mail:</b> ${esc(q.email)}<br>${q.phone ? '<b>Tel:</b> ' + esc(q.phone) + '<br>' : ''}${q.company ? '<b>Bedrijf:</b> ' + esc(q.company) + '<br>' : ''}</p><hr><p>${esc(q.message).replace(/\n/g, '<br>')}</p>`,
    }),
    mailer.sendMail({
      from: MAIL_FROM, to: q.email,
      subject: `Bedankt voor je bericht — 4REEL`,
      html: `<p>Hi ${esc(q.name.split(' ')[0])},</p><p>Bedankt voor je bericht. We lezen ze allemaal en reageren binnen 24 uur op werkdagen.</p><p>— ${STUDIO_NAME}</p>`,
    }),
  ]);
  if (results[0].status === 'rejected') console.error('question mail (studio) failed', results[0].reason);
  if (results[1].status === 'rejected') console.error('question mail (customer) failed', results[1].reason);
}
