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

function renderEmailHtml(records, viewUrl, dateStr) {
  if(!Array.isArray(records)||records.length>5)throw new Error('BLOCCO: massimo 5 notizie per briefing');
  const itemsHtml = records.map((rec, index) => {
    const f = rec.fields || rec;
    const cat = escapeHtml(f.categoria || 'Welfare e Terzo Settore');
    const dataFonte = escapeHtml(f.data_fonte || '');
    const titolo = escapeHtml(f.titolo_editoriale || f.titolo_originale || `Notizia #${index + 1}`);
    const fonte = escapeHtml(f.fonte || 'Fonte esterna');
    const url = escapeHtml(f.url_fonte || '#');
    const sintesi = escapeHtml(f.sintesi_editoriale || '');
    const rilevanza = escapeHtml(f.rilevanza || f.rilevanza_coinsieme || '');
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
        <h3 data-airtable-id="${escapeHtml(rec.id)}" style="margin:8px 0 10px 0; font-size:16px; line-height:1.35; color:#3d2208; font-weight:700;">${titolo}</h3>
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
                Buongiorno Maurizio, sono presenti <strong>${records.length} notizie candidate</strong> individuate automaticamente e pronte per la tua decisione editoriale.
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

async function sendViaResend(apiKey, sender, recipient, subject, html) {
  let fromAddress = sender || 'onboarding@resend.dev';
  const toList = [String(recipient).trim()];
  const replyTo = 'segreteria@coinsieme.it';

  let res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'coinsieme-briefing-'+getIsoDateRome()
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
          'Content-Type': 'application/json',
      'Idempotency-Key': 'coinsieme-briefing-'+getIsoDateRome()
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

async function main(options={}) {
 const {readBatch}=require('./daily-briefing');
 const {createApi}=require('./publish-segnalazioni');
 const dateIso=getIsoDateRome(),dateStr=getFormattedDateRome();
 const batch=options.batch||JSON.parse(fs.readFileSync(path.join(root,'scratch','briefing-batch.json'),'utf8'));
 if(batch.date!==dateIso)throw Error('BLOCCO: batch non odierno');
 const api=options.api||createApi(process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN);
 const records=await readBatch(api,batch.records.map(r=>r.id),dateIso);
 for(const r of records){const expected=batch.records.find(x=>x.id===r.id);if(!expected||expected.fields.url_fonte!==r.fields.url_fonte||expected.fields.titolo_editoriale!==r.fields.titolo_editoriale)throw Error('BLOCCO: record cambiato dopo la selezione');}
 const html=renderEmailHtml(records,'https://airtable.com/appPqa952bdRrQJNI/tblonsfQ2mnaelCAn',dateStr);
 const rendered=[...html.matchAll(/data-airtable-id="(rec[a-zA-Z0-9]+)"/g)].map(m=>m[1]);
 if(JSON.stringify(rendered)!==JSON.stringify(records.map(r=>r.id)))throw Error('BLOCCO: HTML diverso dal batch Airtable');
 fs.mkdirSync(path.join(root,'scratch'),{recursive:true});
 fs.writeFileSync(path.join(root,'scratch','briefing-preview.html'),html);
 fs.writeFileSync(path.join(root,'scratch','briefing-verification.json'),JSON.stringify({date:dateIso,count:records.length,recordIds:rendered,airtableReadback:true,htmlMatches:true,preview:Boolean(options.preview)},null,2));
 if(options.preview){console.log('PREVIEW: '+records.length+' record Airtable verificati, zero richieste a Resend');return {preview:true,count:records.length};}
 if(!records.length){console.log('Nessuna notizia nuova: nessuna email');return {skipped:true};}
 const log=loadDispatchLog(),recipient='segreteria@coinsieme.it',subject='Briefing notizie COINSIEME - '+dateStr;
 if(log.some(e=>e.status==='sent'&&e.dateIso===dateIso)){console.log('Gia inviato oggi: invio bloccato');return {skipped:true};}
 if(!process.env.RESEND_API_KEY)throw Error('Credenziale Resend mancante');
 const result=await sendViaResend(process.env.RESEND_API_KEY,process.env.BRIEFING_SENDER_EMAIL||'onboarding@resend.dev',recipient,subject,html);
 log.push({timestamp:new Date().toISOString(),dateIso,dateStr,recipient,subject,resendMessageId:result.id,httpStatus:result.httpStatus,sender:result.senderUsed,candidateCount:records.length,status:'sent'});
 saveDispatchLog(log);
 return {sent:true,count:records.length};
}
if(require.main===module)main({preview:process.argv.includes('--preview')}).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={main,renderEmailHtml,isRomeTimeWindow,getFormattedDateRome,getIsoDateRome,loadDispatchLog,saveDispatchLog,findExistingSuccessfulDispatch};
