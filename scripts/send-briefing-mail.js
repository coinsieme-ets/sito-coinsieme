/**
 * Invio Mail Briefing Quotidiano Rassegna News alle 6:30 (Europe/Rome)
 * Fondazione COINSIEME ETS — "Cosa si muove intorno a noi"
 *
 * Flusso:
 * 1. Legge da Airtable i record candidati ("da_valutare", "segnalata");
 * 2. Applica il controllo ANTI-DUPLICATO (stessa data, stesso destinatario, stesso oggetto);
 * 3. Se il briefing odierno è già stato inviato con successo, l'invio viene SALTATO;
 * 4. Solo se nuovo (o forzato esplicitamente via --force-duplicate), invia tramite Resend;
 * 5. Registra data, ora, destinatario, mittente, Resend Message ID e stato HTTP in briefing-dispatch-log.json.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dispatchLogPath = path.join(root, 'content', 'rassegna', 'briefing-dispatch-log.json');

function getFormattedDateRome(date = new Date()) {
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function getIsoDateRome(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
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
  return hours === 6 && minutes >= 15;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function loadDispatchLog(customPath = dispatchLogPath) {
  try {
    if (fs.existsSync(customPath)) {
      const raw = fs.readFileSync(customPath, 'utf8').replace(/^\uFEFF/, '');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('[Briefing Log] Attenzione nella lettura del log dispatch:', e.message);
  }
  return [];
}

function saveDispatchLog(entries, customPath = dispatchLogPath) {
  try {
    const dir = path.dirname(customPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(customPath, JSON.stringify(entries, null, 2) + '\n', 'utf8');
  } catch (e) {
    console.warn('[Briefing Log] Impossibile salvare il log dispatch:', e.message);
  }
}

function findExistingSuccessfulDispatch(entries, dateIso, dateStr, recipient, subject) {
  const normRecipient = String(recipient).trim().toLowerCase();
  const normSubject = String(subject).trim().toLowerCase();

  return entries.find(e =>
    e.status === 'sent' &&
    Boolean(e.resendMessageId) &&
    (e.dateIso === dateIso || e.dateStr === dateStr) &&
    String(e.recipient).trim().toLowerCase() === normRecipient &&
    String(e.subject).trim().toLowerCase() === normSubject
  );
}

function renderEmailHtml(records, viewUrl, dateStr, segnalazioni = []) {
  const itemsHtml = records.map((rec, index) => {
    const f = rec.fields || rec;
    const cat = escapeHtml(f.categoria || 'Welfare');
    const dataFonte = escapeHtml(f.data_fonte || '');
    const titolo = escapeHtml(f.titolo_editoriale || f.titolo_originale || `Notizia #${index + 1}`);
    const fonte = escapeHtml(f.fonte || 'Fonte esterna');
    const url = escapeHtml(f.url_fonte || '#');
    const sintesi = escapeHtml(f.sintesi_editoriale || '');
    const rilevanza = escapeHtml(f.rilevanza_coinsieme || '');
    const stato = (f.stato || 'da_valutare').trim().toLowerCase();

    let statoBadge = '<span style="display:inline-block; padding:3px 8px; border-radius:4px; font-size:12px; font-weight:700; background:#fef3c7; color:#92400e;">SEGNALATA</span>';
    if (stato === 'da_valutare' || stato === 'proposta') {
      statoBadge = '<span style="display:inline-block; padding:3px 8px; border-radius:4px; font-size:12px; font-weight:700; background:#e0f2fe; color:#0369a1;">DA VALUTARE</span>';
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

  let segnalazioniHtml = '';
  if (segnalazioni && segnalazioni.length > 0) {
    const segItems = segnalazioni.map((s, idx) => {
      const f = s.fields || s;
      const url = escapeHtml(f.url_articolo || f.url || '#');
      const nota = escapeHtml(f.nota || f.note || '');
      const dataSeg = escapeHtml(f.data_segnalazione || '');
      return `
        <div style="background:#fff7ed; border-left:3px solid #ea580c; padding:10px 14px; margin-bottom:10px; border-radius:4px; font-size:13px;">
          <div style="font-weight:700; color:#9a3412;">#${idx + 1} Segnalazione da valutare ${dataSeg ? `(${dataSeg})` : ''}</div>
          <div style="margin:4px 0;"><a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#c45e1a; word-break:break-all; font-weight:600;">${url} ↗</a></div>
          ${nota ? `<div style="color:#7c2d12; font-style:italic; font-size:12.5px;">Nota: ${nota}</div>` : ''}
        </div>
      `;
    }).join('');

    segnalazioniHtml = `
      <div style="margin-top:24px; padding-top:16px; border-top:1px dashed #d6c7b7;">
        <h3 style="font-size:15px; color:#3d2208; margin:0 0 10px 0;">📌 Segnalazioni manuali di Maurizio (${segnalazioni.length})</h3>
        <p style="font-size:12.5px; color:#6b5d52; margin:0 0 12px 0;">Link segnalati da valutare per la trasformazione in scheda rassegna:</p>
        ${segItems}
      </div>
    `;
  }

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

              ${segnalazioniHtml}

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

async function fetchSegnalazioniRecords(token, baseId, tableName = 'Segnalazioni Maurizio') {
  try {
    const params = new URLSearchParams();
    params.set('filterByFormula', "OR({stato} = 'da_valutare', {stato} = '', {Stato} = 'da_valutare')");
    params.set('pageSize', '50');
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.records) ? data.records : [];
  } catch (e) {
    return [];
  }
}

async function fetchCandidateRecords(token, baseId, tableName) {
  let allRecords = [];
  let offset = null;

  do {
    const params = new URLSearchParams();
    params.set('filterByFormula', "OR(LOWER({stato}) = 'da_valutare', LOWER({stato}) = 'segnalata', LOWER({stato}) = 'proposta', LOWER({stato}) = 'da_verificare', LOWER({Stato}) = 'da_valutare', LOWER({Stato}) = 'segnalata')");
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
  let fromAddress = sender || 'onboarding@resend.dev';
  const toList = [String(recipient).trim()];
  const replyTo = 'segreteria@coinsieme.it';

  let res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromAddress,
      to: toList,
      reply_to: replyTo,
      subject: subject,
      html: html
    })
  });

  let responseBody = '';
  if (!res.ok) {
    responseBody = await res.text();
    if (fromAddress !== 'onboarding@resend.dev' && (responseBody.includes('domain') || responseBody.includes('validation') || res.status === 403 || res.status === 422)) {
      console.warn(`[Briefing Mail] Mittente "${fromAddress}" richiede verifica dominio su Resend. Fallback su "onboarding@resend.dev"...`);
      fromAddress = 'onboarding@resend.dev';
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: toList,
          reply_to: replyTo,
          subject: subject,
          html: html
        })
      });
    }

    if (!res.ok) {
      const finalErr = await res.text();
      throw new Error(`Invio email fallito tramite Resend (${res.status} ${res.statusText}): ${finalErr}`);
    }
  }

  const result = await res.json();
  return {
    id: result.id,
    httpStatus: res.status,
    senderUsed: fromAddress
  };
}

async function main(options = {}) {
  const isScheduled = process.env.GITHUB_EVENT_NAME === 'schedule';
  const forceRun = options.force || process.argv.includes('--force') || process.env.FORCE_BRIEFING === 'true' || !isScheduled;
  const forceDuplicate = options.forceDuplicate || process.argv.includes('--force-duplicate') || process.env.FORCE_RESEND_DUPLICATE === 'true';

  // 1. Controllo Timezone Europe/Rome
  if (!forceRun) {
    if (!isRomeTimeWindow()) {
      const { hours, minutes } = getRomeTimeParts();
      console.log(`[Briefing Mail] Ora italiana corrente: ${hours}:${String(minutes).padStart(2, '0')}. Esecuzione non pertinente per questo slot orario. Terminato.`);
      return { skipped: true, reason: 'outside_time_window' };
    }
  }

  const token = options.token || process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = options.baseId || process.env.AIRTABLE_BASE_ID;
  const tableName = options.tableName || process.env.AIRTABLE_TABLE_NAME || 'Notizie';
  const viewUrl = options.viewUrl || process.env.AIRTABLE_VIEW_URL || 'https://airtable.com';
  const resendApiKey = options.resendApiKey || process.env.RESEND_API_KEY;

  // Unico destinatario rigoroso: segreteria@coinsieme.it
  const recipient = (options.recipient || process.env.BRIEFING_RECIPIENT_EMAIL || 'segreteria@coinsieme.it').trim();
  const sender = (options.sender || process.env.BRIEFING_SENDER_EMAIL || 'onboarding@resend.dev').trim();

  const customLogPath = options.dispatchLogPath || dispatchLogPath;

  let candidateRecords = [];
  let segnalazioniRecords = [];

  if (options.mockRecords) {
    candidateRecords = options.mockRecords.filter(r => {
      const s = (r.fields?.stato || r.stato || '').trim().toLowerCase();
      return s === 'da_valutare' || s === 'segnalata' || s === 'proposta' || s === 'da_verificare';
    });
    segnalazioniRecords = options.mockSegnalazioni || [];
  } else {
    if (!token || !baseId) {
      throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN e AIRTABLE_BASE_ID sono obbligatori.');
    }
    console.log(`[Briefing Mail] Recupero notizie candidate da Airtable (Base: ${baseId}, Tabella: ${tableName})...`);
    candidateRecords = await fetchCandidateRecords(token, baseId, tableName);
    segnalazioniRecords = await fetchSegnalazioniRecords(token, baseId, 'Segnalazioni Maurizio');
  }

  console.log(`[Briefing Mail] Notizie candidate trovate: ${candidateRecords.length}, Segnalazioni trovate: ${segnalazioniRecords.length}`);

  // 2. Controllo: nessuna notizia candidata e nessuna segnalazione -> skip
  if (candidateRecords.length === 0 && segnalazioniRecords.length === 0) {
    console.log('[Briefing Mail] Nessuna notizia o segnalazione in attesa. Nessuna email inviata.');
    return { skipped: true, reason: 'no_candidate_records' };
  }

  const dateStr = options.customDateStr || getFormattedDateRome();
  const dateIso = options.customDateIso || getIsoDateRome();
  const subject = `Briefing notizie COINSIEME - ${dateStr}`;

  // 3. CONTROLLO ANTI-DUPLICATO
  const dispatchLog = loadDispatchLog(customLogPath);
  const existingDispatch = findExistingSuccessfulDispatch(dispatchLog, dateIso, dateStr, recipient, subject);

  if (existingDispatch && !forceDuplicate) {
    console.log('\n======================================================================');
    console.log(' BRIEFING GIÀ INVIATO OGGI — INVIO SALTATO (ANTI-DUPLICATO ATTIVO)');
    console.log('======================================================================');
    console.log(`  - Data briefing: ${dateStr} (${dateIso})`);
    console.log(`  - Destinatario unico: ${recipient}`);
    console.log(`  - Oggetto: ${subject}`);
    console.log(`  - Resend Message ID precedente: ${existingDispatch.resendMessageId}`);
    console.log(`  - Inviato precedentemente il: ${existingDispatch.timestampRome || existingDispatch.timestamp}`);
    console.log('  - Esito: NESSUNA NUOVA MAIL RICHIESTA A RESEND (Invio protetto da duplicazione).');
    console.log('======================================================================\n');

    return {
      sent: false,
      skipped: true,
      reason: 'already_sent_today',
      existing: existingDispatch
    };
  }

  if (existingDispatch && forceDuplicate) {
    console.log(`[Briefing Anti-Duplicato] AVVISO: Invio duplicato forzato esplicitamente per la data ${dateStr}.`);
  }

  const htmlContent = renderEmailHtml(candidateRecords, viewUrl, dateStr, segnalazioniRecords);

  if (options.mockSend) {
    console.log('\n======================================================================');
    console.log(' BRIEFING GENERATO CON SUCCESSO (MODALITÀ MOCK)');
    console.log('======================================================================');
    console.log(`  - Destinatario unico: ${recipient}`);
    console.log(`  - Oggetto: ${subject}`);
    console.log(`  - Notizie incluse: ${candidateRecords.length}`);
    console.log('======================================================================\n');
    return { sent: true, mock: true, subject, count: candidateRecords.length, html: htmlContent };
  }

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY è obbligatorio per l\'invio reale della mail.');
  }

  console.log(`[Briefing Mail] Invio in corso di una NUOVA mail a ${recipient} tramite Resend...`);
  const now = new Date();
  const timestampIso = now.toISOString();
  const timestampRome = now.toLocaleString('it-IT', { timeZone: 'Europe/Rome' });

  try {
    const resendResult = await sendViaResend(resendApiKey, sender, recipient, subject, htmlContent);

    // Registra nel log di dispatch
    const logEntry = {
      timestamp: timestampIso,
      timestampRome: timestampRome,
      dateStr: dateStr,
      dateIso: dateIso,
      recipient: recipient,
      sender: resendResult.senderUsed,
      subject: subject,
      resendMessageId: resendResult.id,
      httpStatus: resendResult.httpStatus,
      candidateCount: candidateRecords.length,
      status: 'sent'
    };

    dispatchLog.push(logEntry);
    saveDispatchLog(dispatchLog, customLogPath);

    console.log('\n======================================================================');
    console.log(' NUOVA EMAIL DI BRIEFING INVIATA CON SUCCESSO TRAMITE RESEND');
    console.log('======================================================================');
    console.log(`  - Tipo: Mail NUOVA realmente richiesta all'API Resend`);
    console.log(`  - Destinatario unico: ${recipient}`);
    console.log(`  - Mittente effettivo: ${resendResult.senderUsed}`);
    console.log(`  - Oggetto: ${subject}`);
    console.log(`  - Resend Message ID: ${resendResult.id}`);
    console.log(`  - Risposta HTTP Resend: ${resendResult.httpStatus} OK`);
    console.log(`  - Notizie candidate incluse: ${candidateRecords.length}`);
    console.log(`  - Data/Ora invio (Italia): ${timestampRome}`);
    console.log('======================================================================\n');

    return {
      sent: true,
      newlySent: true,
      id: resendResult.id,
      recipient: recipient,
      count: candidateRecords.length
    };
  } catch (err) {
    const errorEntry = {
      timestamp: timestampIso,
      timestampRome: timestampRome,
      dateStr: dateStr,
      dateIso: dateIso,
      recipient: recipient,
      sender: sender,
      subject: subject,
      status: 'error',
      errorMessage: err.message
    };
    dispatchLog.push(errorEntry);
    saveDispatchLog(dispatchLog, customLogPath);
    throw err;
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('\n[Briefing Mail] ERRORE DI SPEDIZIONE:', err.message);
    process.exit(1);
  });
}

module.exports = {
  main,
  renderEmailHtml,
  isRomeTimeWindow,
  getFormattedDateRome,
  getIsoDateRome,
  loadDispatchLog,
  saveDispatchLog,
  findExistingSuccessfulDispatch
};
