const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;

const root = path.resolve(__dirname, '..');
const { fetchCandidateRecords, fetchSegnalazioniRecords, renderEmailHtml, getFormattedDateRome } = require('./send-briefing-mail');

async function checkDnsRecords(domain = 'coinsieme.it') {
  const result = { domain };
  try {
    const mx = await dns.resolveMx(domain);
    result.mx = mx;
  } catch (e) {
    result.mx_error = e.message;
  }

  try {
    const txt = await dns.resolveTxt(domain);
    result.txt = txt.map(t => t.join(' '));
    result.spf = result.txt.filter(t => t.startsWith('v=spf1'));
  } catch (e) {
    result.txt_error = e.message;
  }

  try {
    const dmarc = await dns.resolveTxt(`_dmarc.${domain}`);
    result.dmarc = dmarc.map(t => t.join(' '));
  } catch (e) {
    result.dmarc_error = e.message;
  }

  try {
    const dkim = await dns.resolveTxt(`resend._domainkey.${domain}`);
    result.dkim_resend = dkim.map(t => t.join(' '));
  } catch (e) {
    result.dkim_resend_error = e.message;
  }

  return result;
}

async function getResendDomains(apiKey) {
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      return { status: res.status, error: await res.text() };
    }
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

async function getRecentResendEmails(apiKey) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      return { status: res.status, error: await res.text() };
    }
    const list = await res.json();
    const details = [];
    if (list.data && Array.isArray(list.data)) {
      for (const item of list.data.slice(0, 10)) {
        try {
          const detailRes = await fetch(`https://api.resend.com/emails/${item.id}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/json'
            }
          });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            details.push(detail);
          } else {
            details.push(item);
          }
        } catch (err) {
          details.push(item);
        }
      }
    }
    return { list, details };
  } catch (e) {
    return { error: e.message };
  }
}

async function getEmailStatus(apiKey, emailId) {
  try {
    const res = await fetch(`https://api.resend.com/emails/${emailId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return { error: await res.text(), status: res.status };
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

async function pollUntilDelivered(apiKey, emailId, maxSeconds = 30) {
  const start = Date.now();
  let latest = null;

  while ((Date.now() - start) < maxSeconds * 1000) {
    latest = await getEmailStatus(apiKey, emailId);
    console.log(`[Polling Resend] Email ${emailId} -> last_event: ${latest.last_event || 'unknown'}`);
    if (latest.last_event === 'delivered' || latest.last_event === 'bounced' || latest.last_event === 'complained') {
      return latest;
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  return latest;
}

async function runDiagnosis() {
  console.log('================================================================');
  console.log(' DIAGNOSI COMPLETA RESEND & DELIVERABILITY BRIEFING');
  console.log('================================================================\n');

  const report = {
    timestamp: new Date().toISOString(),
    env: {
      recipient: process.env.BRIEFING_RECIPIENT_EMAIL || '(non impostato, default segreteria@coinsieme.it)',
      sender: process.env.BRIEFING_SENDER_EMAIL || '(non impostato, default briefing@coinsieme.it)',
      hasApiKey: !!process.env.RESEND_API_KEY,
      apiKeyPrefix: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.slice(0, 7) + '...' : 'none'
    }
  };

  console.log('1. Variabili di ambiente:');
  console.log(`   - BRIEFING_RECIPIENT_EMAIL: ${report.env.recipient}`);
  console.log(`   - BRIEFING_SENDER_EMAIL: ${report.env.sender}`);
  console.log(`   - RESEND_API_KEY presente: ${report.env.hasApiKey} (${report.env.apiKeyPrefix})\n`);

  // DNS Check
  console.log('2. Verifica DNS & Deliverability per coinsieme.it...');
  report.dns = await checkDnsRecords('coinsieme.it');
  console.log('   - SPF:', report.dns.spf);
  console.log('   - DMARC:', report.dns.dmarc);
  console.log('   - DKIM Resend:', report.dns.dkim_resend || report.dns.dkim_resend_error);

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY non presente. Interruzione.');
    return report;
  }

  const apiKey = process.env.RESEND_API_KEY;

  // Resend Domains Check
  console.log('\n3. Verifica domini registrati nell\'account Resend...');
  report.resend_domains = await getResendDomains(apiKey);
  console.log('   - Domini Resend:', JSON.stringify(report.resend_domains, null, 2));

  // Recent emails in Resend
  console.log('\n4. Storico ultimi invii Resend...');
  report.recent_emails = await getRecentResendEmails(apiKey);
  if (report.recent_emails.details) {
    for (const em of report.recent_emails.details) {
      console.log(`   - [${em.id}] From: ${em.from} | To: ${JSON.stringify(em.to)} | Subject: "${em.subject}" | Event: ${em.last_event || 'n/a'} | Created: ${em.created_at}`);
    }
  }

  // Prep for re-send
  console.log('\n5. Preparazione e re-invio Briefing...');
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Notizie';
  const viewUrl = process.env.AIRTABLE_VIEW_URL || 'https://airtable.com';
  const recipient = process.env.BRIEFING_RECIPIENT_EMAIL || 'segreteria@coinsieme.it';

  let candidateRecords = [];
  let segnalazioniRecords = [];

  if (token && baseId) {
    try {
      candidateRecords = await fetchCandidateRecords(token, baseId, tableName);
      segnalazioniRecords = await fetchSegnalazioniRecords(token, baseId, 'Segnalazioni Maurizio');
    } catch (e) {
      console.warn('Errore lettura Airtable:', e.message);
    }
  }

  console.log(`   - Record candidati trovati: ${candidateRecords.length}`);
  console.log(`   - Segnalazioni trovate: ${segnalazioniRecords.length}`);

  const dateStr = getFormattedDateRome();
  const subject = `Briefing notizie COINSIEME - ${dateStr}`;
  const htmlContent = renderEmailHtml(candidateRecords, viewUrl, dateStr, segnalazioniRecords);

  let fromAddress = process.env.BRIEFING_SENDER_EMAIL || 'briefing@coinsieme.it';
  let replyTo = 'segreteria@coinsieme.it';

  console.log(`   - Destinatario target: ${recipient}`);
  console.log(`   - Mittente iniziale: ${fromAddress}`);

  let sendPayload = {
    from: fromAddress,
    to: [recipient],
    reply_to: replyTo,
    subject: subject,
    html: htmlContent
  };

  let sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sendPayload)
  });

  let sendData = null;
  if (!sendRes.ok) {
    const errText = await sendRes.text();
    console.warn(`   ✗ Invio iniziale fallito (${sendRes.status}): ${errText}`);
    report.first_attempt_error = { status: sendRes.status, text: errText };

    console.log('   Tentativo di fallback con mittente "onboarding@resend.dev"...');
    sendPayload.from = 'onboarding@resend.dev';
    sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sendPayload)
    });

    if (!sendRes.ok) {
      const fallbackErr = await sendRes.text();
      console.error(`   ✗ Fallback fallito (${sendRes.status}): ${fallbackErr}`);
      report.fallback_error = { status: sendRes.status, text: fallbackErr };
      throw new Error(`Invio Resend completamente fallito: ${fallbackErr}`);
    }
  }

  sendData = await sendRes.json();
  console.log('   ✓ Risposta API Resend:', JSON.stringify(sendData, null, 2));
  report.send_response = sendData;
  report.sent_email_id = sendData.id;

  // Polling delivery status
  console.log(`\n6. Polling stato di consegna per message ID ${sendData.id}...`);
  const finalStatus = await pollUntilDelivered(apiKey, sendData.id, 25);
  report.final_delivery_status = finalStatus;
  console.log('   - Stato finale di consegna:', JSON.stringify(finalStatus, null, 2));

  // Save report file
  const reportPath = path.join(root, 'content', 'rassegna', 'resend-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`\nReport salvato in: ${reportPath}`);

  return report;
}

if (require.main === module) {
  runDiagnosis().catch(err => {
    console.error('ERRORE DIAGNOSI:', err);
    process.exit(1);
  });
}

module.exports = { runDiagnosis };
