// src/lib/mailer.js
import nodemailer from 'nodemailer';

let _transporter = null;

function getFrom() {
  const name = process.env.SMTP_FROM_NAME || 'System Ticketowy';
  const user = process.env.SMTP_USER || 'no-reply@example.com';
  return `"${name}" <${user}>`;
}

async function getTransporter() {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure, // true -> 465, false -> 587/STARTTLS
    auth: user && pass ? { user, pass } : undefined,
  });

  return _transporter;
}

/**
 * Normalizuje wartość do ładnego ciągu PL.
 */
function norm(v, fallback = '—') {
  if (v === null || typeof v === 'undefined' || v === '') return fallback;
  return String(v);
}

function fmtDate(d) {
  try { return new Date(d).toString(); } catch { return '—'; }
}

/**
 * Buduje tytuł maila zależny od typu zmiany.
 */
function buildSubject(ticket, changes, subjectOverride) {
  if (subjectOverride) return subjectOverride;

  if (changes && Object.prototype.hasOwnProperty.call(changes, 'message')) {
    return `[#${ticket.id || ''}] Nowa wiadomość: ${ticket.title || 'Zgłoszenie'}`;
  }

  const labels = [];
  if (changes?.status)   labels.push('Status');
  if (changes?.priority) labels.push('Priorytet');
  if (Object.prototype.hasOwnProperty.call(changes || {}, 'deadline')) labels.push('Deadline');

  if (labels.length) {
    return `[#${ticket.id || ''}] Aktualizacja: ${labels.join(', ')} – ${ticket.title || 'Zgłoszenie'}`;
  }
  return `[#${ticket.id || ''}] Aktualizacja zgłoszenia: ${ticket.title || 'Zgłoszenie'}`;
}

/**
 * Buduje HTML (PL) – zawiera sekcję wiadomości, jeśli changes.message istnieje.
 */
function buildHtml({ ticket, changes }) {
  const hasMsg = Object.prototype.hasOwnProperty.call(changes || {}, 'message');
  const from   = norm(changes?.from);
  const msg    = norm(changes?.message);

  const rows = [];

  if (changes?.status) {
    rows.push(`<li><b>Status</b>: <code>${norm(changes.status.old)}</code> → <code>${norm(changes.status.new)}</code></li>`);
  }
  if (changes?.priority) {
    rows.push(`<li><b>Priorytet</b>: <code>${norm(changes.priority.old)}</code> → <code>${norm(changes.priority.new)}</code></li>`);
  }
  if (Object.prototype.hasOwnProperty.call(changes || {}, 'deadline')) {
    rows.push(`<li><b>Deadline</b>: <code>${norm(changes.deadline.old)}</code> → <code>${norm(changes.deadline.new)}</code></li>`);
  }

  return `<!doctype html>
<html lang="pl">
  <body style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#0f172a; line-height:1.5;">
    <div style="max-width:680px;margin:0 auto;padding:20px;">
      <h2 style="margin:0 0 8px;">Witaj,</h2>
      <p style="margin:0 0 16px;">
        Twoje zgłoszenie <b>${norm(ticket.title, 'Zgłoszenie')}</b> (ID: <b>${norm(ticket.id)}</b>) zostało zaktualizowane.
      </p>

      ${hasMsg ? `
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;margin:0 0 16px;">
        <div style="font-weight:700;margin:0 0 8px;">Nowa wiadomość w wątku</div>
        ${from ? `<div style="color:#334155;margin:0 0 6px;">Od: <b>${from}</b></div>` : ``}
        <blockquote style="margin:0;border-left:3px solid #94a3b8;padding-left:10px;white-space:pre-wrap;">${msg}</blockquote>
      </div>
      ` : ``}

      ${rows.length ? `
      <div style="margin:0 0 16px;">
        <div style="font-weight:700;margin:0 0 6px;">Zmiany</div>
        <ul style="margin:0;padding-left:18px;">${rows.join('')}</ul>
      </div>
      ` : ``}

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:12px;">
        <div style="font-weight:700;margin:0 0 6px;">Podsumowanie</div>
        <div>Dział: <b>${norm(ticket.department)}</b></div>
        <div>Utworzone: <b>${fmtDate(ticket.created_at)}</b></div>
        ${ticket.deadline ? `<div>Deadline: <b>${fmtDate(ticket.deadline)}</b></div>` : ``}
        <div>Aktualny status: <b>${norm(ticket.status)}</b></div>
        ${ticket.priority ? `<div>Priorytet: <b>${norm(ticket.priority)}</b></div>` : ``}
      </div>

      <p style="margin:16px 0 0;">Pozdrawiamy,<br/>System Ticketowy</p>
    </div>
  </body>
</html>`;
}

/**
 * Tekstowa wersja (fallback).
 */
function buildText({ ticket, changes }) {
  const hasMsg = Object.prototype.hasOwnProperty.call(changes || {}, 'message');
  const from   = norm(changes?.from);
  const msg    = norm(changes?.message);

  const lines = [];
  lines.push(`Witaj,`);
  lines.push(``);
  lines.push(`Twoje zgłoszenie "${norm(ticket.title, 'Zgłoszenie')}" (ID: ${norm(ticket.id)}) zostało zaktualizowane.`);
  lines.push(``);

  if (hasMsg) {
    lines.push(`Nowa wiadomość w wątku:`);
    if (from) lines.push(`Od: ${from}`);
    lines.push(msg);
    lines.push(``);
  }

  const ch = [];
  if (changes?.status)   ch.push(`Status: ${norm(changes.status.old)} -> ${norm(changes.status.new)}`);
  if (changes?.priority) ch.push(`Priorytet: ${norm(changes.priority.old)} -> ${norm(changes.priority.new)}`);
  if (Object.prototype.hasOwnProperty.call(changes || {}, 'deadline'))
    ch.push(`Deadline: ${norm(changes.deadline.old)} -> ${norm(changes.deadline.new)}`);
  if (ch.length) {
    lines.push(`Zmiany:`);
    ch.forEach(l => lines.push(`- ${l}`));
    lines.push(``);
  }

  lines.push(`Podsumowanie:`);
  lines.push(`- Dział: ${norm(ticket.department)}`);
  lines.push(`- Utworzone: ${fmtDate(ticket.created_at)}`);
  if (ticket.deadline) lines.push(`- Deadline: ${fmtDate(ticket.deadline)}`);
  lines.push(`- Aktualny status: ${norm(ticket.status)}`);
  if (ticket.priority) lines.push(`- Priorytet: ${norm(ticket.priority)}`);
  lines.push(``);
  lines.push(`Pozdrawiamy,`);
  lines.push(`System Ticketowy`);

  return lines.join('\n');
}

/**
 * Główna funkcja – używana w PATCH i przy wiadomościach (chat).
 * @param {Object} opts
 * @param {string} opts.to
 * @param {Object} opts.ticket
 * @param {Object} opts.changes  // np. {status:{old,new}, priority:{old,new}, deadline:{old,new}} albo {message, from}
 * @param {string} [opts.subjectOverride]
 */
export async function sendTicketUpdateEmail({ to, ticket, changes = {}, subjectOverride }) {
  if (!to) return;

  const transporter = await getTransporter();
  const subject = buildSubject(ticket || {}, changes, subjectOverride);

  const html = buildHtml({ ticket: ticket || {}, changes });
  const text = buildText({ ticket: ticket || {}, changes });

  await transporter.sendMail({
    from: getFrom(),
    to,
    subject,
    text,
    html,
  });
}

/**
 * Alias używany przez /messages – zostawiamy dla czytelności importów.
 * Przyjmuje te same argumenty co sendTicketUpdateEmail.
 */
export async function sendTicketMessageEmail(opts) {
  return sendTicketUpdateEmail(opts);
}
