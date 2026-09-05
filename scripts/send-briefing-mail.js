/**
 * Invio Mail Briefing Quotidiano Rassegna News alle 6:30 (Europe/Rome)
 * Fondazione COINSIEME ETS
 *
 * Legge da Airtable solo i record con stato "proposta" o "da_verificare".
 * Non genera notizie nuove e non invia email se non ci sono record candidati.
 */

const fs = require('fs');
const path = require('path');

function getFormattedDateRome(date = new Date()) {
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function getRomeTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }).format(date).split(':');

  return {
    hours: parseInt(parts[0], 10),
    minutes: parseInt(parts[1], 10)
  };
}

function isRomeTimeWindow(date = new Date()) {
  const { hours, minutes } = getRomeTimeParts(date);
  return hours === 6 && minutes >= 20 && minutes <= 40;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderEmailHtml(records, viewUrl, dateStr) {
  const itemsHtml = records.map((rec, index) => {
    const f = rec.fields || rec;
    const cat = escapeHtml(f.categoria || 'Welfare');
    const dataFonte = escapeHtml(f.data_fonte || '');
    const titolo = escapeHtml(f.titolo_editoriale || f.titolo_originale || `Notizia #${index + 1}`);
    const fonte = escapeHtml(f.fonte || 'Fonte esterna');
    const url = escapeHtml(f.url_fonte || '#');
    const sintesi = escapeHtml(f.sintesi_editoriale || '');
    const rilevanza = escapeHtml(f.rilevanza_coinsieme || '');
    const stato = (f.stato || 'proposta').trim();

    let statoBadge = '<span style="display:inline-block; padding:3px 8px; border-radius:4px; font-size:12px; font-weight:700; background:#fef3c7; color:#92400e;">DA VERIFICARE</span>';
    if (stato === 'proposta') {
      statoBadge = '<span style="display:inline-block; padding:3px 8px; border-radius:4px; font-size:12px; font-weight:700; background:#e0f2fe; color:#0369a1;">PROPOSTA</span>';
    }

    return `
      <div style="background:#ffffff; border:1px solid #e7dfd5; border-top:3px solid #c45e1a; border-radius:8px; padding:18px; margin-bottom:16px;">
        <div style="margin-bottom:8px;">
          <span style="font-size:11px; font-weight:700; text-transform:uppercase; color:#a34d14; background:#fbe8d8; padding:2px 8px; border-radius:4px; letter-spacing:0.5px;">${cat}</span>
          ${dataFonte ? `<span style="font-size:12px; color:#6b5d52; margin-left:8px;">${dataFonte}</span>` : ''}
          <span style="float:right;">${statoBadge}</span>
        </div>
        <h3 style="margin:8px 0 10px 0; font-size:16px; line-height:1.35; color:#3d2208; font-weight:700;">${titolo}</h3>
        <p style="margin:0 0 10px 0; font-size:13.5px; color:#5a4a3a; line-height:1.5;">${sintesi}</p>
        <div style="font-size:12.5px; color:#6b5d52; margin-bottom:10px;">
          <strong>Fonte:</strong> ${fonte} &nbsp;·&nbsp; <a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#c45e1a; text-decoration:underline; font-weight:600;">Apri articolo originale ↗</a>
        </div>
        ${rilevanza ? `<div style="background:#fdf9f5; border-left:3px solid #c45e1a; padding:8px 12px; font-size:12.5px; color:#553311; font-style:italic;"><strong>Rilevanza per COINSIEME:</strong> ${rilevanza}</div>` : ''}
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Briefing Notizie COINSIEME</title>
</head>
<body style="margin:0; padding:0; background:#f4f0ec; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#3d2208;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f0ec; padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px; background:#fafaf8; border-radius:12px; border:1px solid #e2dad0; overflow:hidden;" cellspacing="0" cellpadding="0">
          
          <!-- Header -->
          <tr>
            <td style="background:#3d2208; padding:20px 24px; text-align:left;">
              <div style="font-size:12px; font-weight:700; color:#fbe8d8; text-transform:uppercase; letter-spacing:1px;">Fondazione COINSIEME ETS</div>
              <h1 style="margin:4px 0 0 0; font-size:20px; color:#ffffff; font-weight:700;">Briefing Notizie del Mattino</h1>
              <div style="font-size:13px; color:rgba(255,255,255,0.85); margin-top:4px;">${dateStr} · Rassegna "Cosa si muove intorno a noi"</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 16px 0; font-size:14px; line-height:1.5; color:#5a4a3a;">
                Buongiorno Maurizio, sono presenti <strong>${records.length} notizie candidate</strong> pronte per la tua revisione.
              </p>

              ${itemsHtml}

              <!-- CTA Airtable -->
              <div style="text-align:center; padding:16px 0 8px 0;">
                <a href="${escapeHtml(viewUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#c45e1a; color:#ffffff; font-size:15px; font-weight:700; text-decoration:none; padding:12px 28px; border-radius:6px; box-shadow:0 2px 6px rgba(196,94,26,0.3);">
                  📲 Apri "Briefing Oggi" su Airtable per Approvare
                </a>
                <p style="margin:8px 0 0 0; font-size:12px; color:#887766;">
                  L'approvazione formale avviene da Airtable. Il sito pubblicherà solo i contenuti approvati.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f0ec; padding:14px 24px; text-align:center; font-size:11.5px; color:#776655; border-top:1px solid #e2dad0;">
              Fondazione COINSIEME ETS · Flusso Editoriale Rassegna News
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

async function fetchCandidateRecords(token, baseId, tableName) {
  let allRecords = [];
  let offset = null;

  do {
    const params = new URLSearchParams();
    // Filtro su record 'proposta' o 'da_verificare'
    params.set('filterByFormula', "OR({stato} = 'proposta', {stato} = 'da_verificare')");
    params.set('sort[0][field]', 'data_fonte');
    params.set('sort[0][direction]', 'desc');
    params.set('pageSize', '100');
    if (offset) params.set('offset', offset);

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Errore API Airtable (${res.status} ${res.statusText}): ${errorText}`);
    }

    const data = await res.json();
    if (Array.isArray(data.records)) {
      allRecords = allRecords.concat(data.records);
    }
    offset = data.offset || null;
  } while (offset);

  return allRecords;
}

async function sendViaResend(apiKey, sender, recipient, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: sender,
      to: [recipient],
      subject: subject,
      html: html
    })
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Invio email fallito tramite Resend (${res.status} ${res.statusText}): ${errorBody}`);
  }

  const result = await res.json();
  return result;
}

async function main(options = {}) {
  const isScheduled = process.env.GITHUB_EVENT_NAME === 'schedule';
  const forceRun = options.force || process.argv.includes('--force') || !isScheduled;

  // 1. Controllo Timezone Europe/Rome
  if (!forceRun) {
    if (!isRomeTimeWindow()) {
      const { hours, minutes } = getRomeTimeParts();
      console.log(`[Briefing Mail] Ora italiana corrente: ${hours}:${String(minutes).padStart(2, '0')}. Esecuzione non pertinente per questo slot orario. Terminato con successo.`);
      return { skipped: true, reason: 'outside_time_window' };
    }
  }

  const token = options.token || process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = options.baseId || process.env.AIRTABLE_BASE_ID;
  const tableName = options.tableName || process.env.AIRTABLE_TABLE_NAME || 'Notizie';
  const viewUrl = options.viewUrl || process.env.AIRTABLE_VIEW_URL || 'https://airtable.com';
  const resendApiKey = options.resendApiKey || process.env.RESEND_API_KEY;
  const recipient = options.recipient || process.env.BRIEFING_RECIPIENT_EMAIL || 'segreteria@coinsieme.it';
  const sender = options.sender || process.env.BRIEFING_SENDER_EMAIL || 'briefing@coinsieme.it';

  let candidateRecords = [];

  if (options.mockRecords) {
    candidateRecords = options.mockRecords.filter(r => {
      const s = (r.fields?.stato || r.stato || '').trim();
      return s === 'proposta' || s === 'da_verificare';
    });
  } else {
    if (!token || !baseId) {
      throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN e AIRTABLE_BASE_ID sono obbligatori.');
    }
    console.log(`[Briefing Mail] Recupero notizie candidate da Airtable (Base: ${baseId}, Tabella: ${tableName})...`);
    candidateRecords = await fetchCandidateRecords(token, baseId, tableName);
  }

  console.log(`[Briefing Mail] Notizie candidate trovate: ${candidateRecords.length}`);

  // 2. Controllo: nessuna notizia candidata -> non inviare
  if (candidateRecords.length === 0) {
    console.log('[Briefing Mail] Nessuna notizia in stato "proposta" o "da_verificare". Nessuna email inviata.');
    return { skipped: true, reason: 'no_candidate_records' };
  }

  const dateStr = getFormattedDateRome();
  const subject = `Briefing notizie COINSIEME - ${dateStr}`;
  const htmlContent = renderEmailHtml(candidateRecords, viewUrl, dateStr);

  if (options.mockSend) {
    console.log(`[Briefing Mail - MOCK SEND] Email generata con successo.`);
    console.log(`  - Destinatario: ${recipient || 'mock@example.com'}`);
    console.log(`  - Oggetto: ${subject}`);
    console.log(`  - Notizie incluse: ${candidateRecords.length}`);
    return { sent: true, mock: true, subject, count: candidateRecords.length, html: htmlContent };
  }

  if (!resendApiKey || !recipient) {
    throw new Error('RESEND_API_KEY e BRIEFING_RECIPIENT_EMAIL sono obbligatori per l\'invio reale della mail.');
  }

  console.log(`[Briefing Mail] Invio email a ${recipient} tramite Resend...`);
  const resendResult = await sendViaResend(resendApiKey, sender, recipient, subject, htmlContent);
  console.log(`[Briefing Mail] Email inviata con successo! ID Resend: ${resendResult.id}`);

  return { sent: true, id: resendResult.id, count: candidateRecords.length };
}

if (require.main === module) {
  main().catch(err => {
    console.error('[Briefing Mail] ERRORE:', err.message);
    process.exit(1);
  });
}

module.exports = { main, renderEmailHtml, isRomeTimeWindow, getFormattedDateRome };
