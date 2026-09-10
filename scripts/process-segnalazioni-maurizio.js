/**
 * Elaborazione Automatica e Trasferimento Segnalazioni di Maurizio in Notizie
 * Fondazione COINSIEME ETS — Rassegna News "Cosa si muove intorno a noi"
 *
 * Logica e Regole di Governance:
 * 1. Le segnalazioni nuove o in attesa ("da_valutare", "presa_in_carico", o vuote) vengono elaborate e trasferite in "Notizie".
 * 2. Se una segnalazione ha stato "inserito", lo script verifica se la notizia esiste REALMENTE in "Notizie":
 *    - Se esiste già: aggiorna lo stato della segnalazione in "trasferita_in_notizie" per coerenza.
 *    - Se NON esiste in "Notizie": non la considera conclusa e procede al trasferimento effettivo.
 * 3. Dopo il trasferimento avvenuto con successo in "Notizie", la segnalazione viene marcata come "trasferita_in_notizie".
 * 4. Le segnalazioni marcate come "scartata" vengono escluse e non vengono trasferite.
 * 5. Supporta l'estrazione automatica di URL anche se preceduti da testo (es. "La notizia https://...").
 * 6. Mantiene il collegamento tra la segnalazione e la notizia creata (tramite Ref ID segnalazione in rilevanza_coinsieme).
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const auditReportPath = path.join(root, 'content', 'rassegna', 'segnalazioni-audit-report.json');

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function extractCleanUrl(rawStr = '') {
  if (!rawStr) return '';
  const str = String(rawStr).trim();
  const match = str.match(/https?:\/\/[^\s"'>]+/i);
  if (match) return match[0];
  return '';
}

function normalizeUrl(rawUrl = '') {
  const clean = extractCleanUrl(rawUrl);
  if (!clean) return '';
  try {
    const parsed = new URL(clean);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source', 'fbclid', 'gclid'].forEach(p => {
      parsed.searchParams.delete(p);
    });
    let normalized = parsed.origin.toLowerCase() + parsed.pathname.replace(/\/+$/, '').toLowerCase();
    if (parsed.search) normalized += parsed.search.toLowerCase();
    return normalized;
  } catch (e) {
    return clean.toLowerCase().replace(/\/+$/, '');
  }
}

function cleanHtmlText(html = '') {
  return String(html)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDomainName(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.replace(/^www\./, '');
    const parts = host.split('.');
    if (parts.length >= 2) {
      const name = parts[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return host;
  } catch (e) {
    return 'Fonte esterna';
  }
}

async function fetchMetadataFromUrl(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!res.ok) {
      console.warn(`[Segnalazioni] Impossibile scaricare URL (${res.status}): ${url}`);
      return fallbackMetadata(url);
    }

    const html = await res.text();

    // 1. Titolo
    let title = '';
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    if (ogTitle) title = ogTitle[1];
    if (!title) {
      const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleTag) title = titleTag[1];
    }
    title = cleanHtmlText(title || 'Notizia segnalata');

    // 2. Sintesi / Descrizione
    let summary = '';
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                   html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                   html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    if (ogDesc) summary = ogDesc[1];
    summary = cleanHtmlText(summary || `Aggiornamento e approfondimento segnalato da Maurizio su ${title}.`);

    // 3. Fonte
    let source = '';
    const ogSite = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
    if (ogSite) source = cleanHtmlText(ogSite[1]);
    if (!source) source = extractDomainName(url);

    // 4. Data
    let dateStr = '';
    const ogTime = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i) ||
                   html.match(/<meta[^>]*name=["']date["'][^>]*content=["']([^"']+)["']/i);
    if (ogTime && /^\d{4}-\d{2}-\d{2}/.test(ogTime[1])) {
      dateStr = ogTime[1].slice(0, 10);
    }
    if (!dateStr) {
      const urlDate = url.match(/\b(202[4-9])\/(\d{2})\/(\d{2})\b/) || url.match(/\b(202[4-9])-(\d{2})-(\d{2})\b/);
      if (urlDate) {
        dateStr = `${urlDate[1]}-${urlDate[2]}-${urlDate[3]}`;
      }
    }
    if (!dateStr) {
      dateStr = new Date().toISOString().slice(0, 10);
    }

    // 5. Immagine (og:image o twitter:image)
    let image = '';
    const ogImg = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                  html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                  html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                  html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    if (ogImg) {
      image = cleanHtmlText(ogImg[1]);
      if (image && !/^https?:\/\//i.test(image)) {
        try {
          image = new URL(image, url).href;
        } catch (e) {
          image = '';
        }
      }
    }

    return {
      title,
      summary,
      source,
      date: dateStr,
      image
    };
  } catch (err) {
    console.warn(`[Segnalazioni] Errore lettura metadati per ${url}: ${err.message}`);
    return fallbackMetadata(url);
  }
}

function fallbackMetadata(url) {
  const domain = extractDomainName(url);
  const today = new Date().toISOString().slice(0, 10);
  return {
    title: `Aggiornamento da ${domain}`,
    summary: `Segnalazione diretta di approfondimento su ${domain}.`,
    source: domain,
    date: today,
    image: ''
  };
}

async function fetchAllNotizieUrls(token, baseId, tableName = 'Notizie') {
  const records = [];
  let offset = null;

  do {
    const params = new URLSearchParams();
    params.set('fields[]', 'url_fonte');
    params.set('fields[]', 'id');
    params.set('fields[]', 'titolo_editoriale');
    params.set('fields[]', 'stato');
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
      const errText = await res.text();
      console.warn(`[Segnalazioni] Impossibile leggere record Notizie (${res.status}): ${errText}`);
      break;
    }

    const data = await res.json();
    if (Array.isArray(data.records)) {
      data.records.forEach(r => {
        records.push({
          airtableId: r.id,
          id: r.fields?.id || '',
          url_fonte: r.fields?.url_fonte || '',
          normalizedUrl: normalizeUrl(r.fields?.url_fonte || ''),
          titolo_editoriale: r.fields?.titolo_editoriale || '',
          stato: r.fields?.stato || ''
        });
      });
    }
    offset = data.offset || null;
  } while (offset);

  return records;
}

async function fetchAllSegnalazioni(token, baseId, tableName = 'Segnalazioni Maurizio') {
  const records = [];
  let offset = null;

  do {
    const params = new URLSearchParams();
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
      const errText = await res.text();
      console.warn(`[Segnalazioni] Tabella "${tableName}" non raggiungibile (${res.status}): ${errText}`);
      break;
    }

    const data = await res.json();
    if (Array.isArray(data.records)) {
      records.push(...data.records);
    }
    offset = data.offset || null;
  } while (offset);

  return records;
}

function mapToCategory(title = '', desc = '', sourceCategory = '') {
  const t = `${title} ${desc} ${sourceCategory}`.toLowerCase();
  if (/domotic|tecnolog|software|digitale/i.test(t)) return 'Domotica & Tecnologia';
  if (/lavoro|scuola|occupaz|formazione|capacit/i.test(t)) return 'Lavoro e inclusione';
  if (/ricerca|duchenne|malatt|genet/i.test(t)) return 'Disabilità & Ricerca';
  if (/cooperaz|coop/i.test(t)) return 'Cooperazione sociale';
  if (/legge|decreto|riforma|inps|normativa|governo|istituzion/i.test(t)) return 'Riforma disabilita';
  if (/caregiver|cura|anzian|famigli|abitare|casa|vulnerab/i.test(t)) return 'Welfare e cura';
  return 'Welfare e Terzo Settore';
}

async function updateSegnalazioneStato(token, baseId, tableName, recordId, newStato) {
  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          stato: newStato
        },
        typecast: true
      })
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn(`[Segnalazioni] Errore aggiornamento stato segnalazione ${recordId} in "${newStato}": ${err}`);
    } else {
      console.log(`    ✓ Segnalazione ${recordId} aggiornata con stato: "${newStato}"`);
    }
  } catch (e) {
    console.warn(`[Segnalazioni] Eccezione aggiornamento stato segnalazione ${recordId}: ${e.message}`);
  }
}

function buildCleanNotiziePayload(record) {
  // Solo i campi supportati e valorizzati per evitare errori di schema Airtable
  const fields = {
    id: record.id,
    categoria: record.categoria || 'Welfare e Terzo Settore',
    data_fonte: record.data_fonte,
    titolo_originale: record.titolo_originale || record.titolo_editoriale,
    titolo_editoriale: record.titolo_editoriale,
    fonte: record.fonte,
    url_fonte: record.url_fonte,
    sintesi_editoriale: record.sintesi_editoriale,
    rilevanza_coinsieme: record.rilevanza_coinsieme,
    stato: record.stato || 'pubblica'
  };

  if (record.priorita) fields.priorita = record.priorita;
  if (record.posizione_sito) fields.posizione_sito = record.posizione_sito;
  if (typeof record.ordine_editoriale === 'number') fields.ordine_editoriale = record.ordine_editoriale;

  return fields;
}

async function insertIntoNotizie(token, baseId, tableName, recordFields) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  const cleanPayload = buildCleanNotiziePayload(recordFields);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      records: [{ fields: cleanPayload }],
      typecast: true
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Errore inserimento notizia in Airtable (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.records && data.records[0];
}

async function processSegnalazioniMaurizio(options = {}) {
  const token = options.token || process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY;
  const baseId = options.baseId || process.env.AIRTABLE_BASE_ID || 'appPqa952bdRrQJNI';
  const segnalazioniTable = options.segnalazioniTable || 'Segnalazioni Maurizio';
  const notizieTable = options.notizieTable || process.env.AIRTABLE_TABLE_NAME || 'Notizie';

  console.log('======================================================================');
  console.log(' ELABORAZIONE SEGNALAZIONI MAURIZIO & TRASFERIMENTO IN NOTIZIE');
  console.log('======================================================================\n');

  let rawSegnalazioni = [];
  let existingNotizie = [];

  if (options.mockSegnalazioni) {
    rawSegnalazioni = options.mockSegnalazioni;
    existingNotizie = options.mockNotizie || [];
  } else {
    if (!token || !baseId) {
      console.log('[Segnalazioni Maurizio] Token o Base ID mancanti. Operazione terminata.');
      return { processed: 0, skipped: 0, total: 0 };
    }
    existingNotizie = await fetchAllNotizieUrls(token, baseId, notizieTable);
    rawSegnalazioni = await fetchAllSegnalazioni(token, baseId, segnalazioniTable);
  }

  console.log(`[Segnalazioni Maurizio] Totale segnalazioni lette da Airtable: ${rawSegnalazioni.length}`);
  console.log(`[Segnalazioni Maurizio] Totale notizie esistenti in "${notizieTable}": ${existingNotizie.length}\n`);

  const existingNotizieUrlMap = new Map();
  existingNotizie.forEach(n => {
    if (n.normalizedUrl) existingNotizieUrlMap.set(n.normalizedUrl, n);
  });

  const auditLog = {
    timestamp: new Date().toISOString(),
    totalSegnalazioni: rawSegnalazioni.length,
    totalNotizie: existingNotizie.length,
    segnalazioni: []
  };

  const toTransfer = [];
  const alreadyTransferred = [];
  const discarded = [];

  for (const seg of rawSegnalazioni) {
    const f = seg.fields || seg;
    const rawUrl = (f.url_articolo || f.url || '').trim();
    const cleanUrl = extractCleanUrl(rawUrl);
    const normUrl = normalizeUrl(cleanUrl);
    const rawStato = String(f.stato || f.Stato || '').trim().toLowerCase();
    const nota = (f.nota || f.note || '').trim();
    const dataSeg = (f.data_segnalazione || f.data || '').trim();

    const existsInNotizie = normUrl ? existingNotizieUrlMap.get(normUrl) : null;

    const auditItem = {
      recordId: seg.id,
      url: rawUrl,
      cleanUrl: cleanUrl,
      nota: nota,
      statoAttuale: rawStato || '(vuoto)',
      dataSegnalazione: dataSeg,
      existsInNotizie: Boolean(existsInNotizie),
      notiziaMatch: existsInNotizie ? { id: existsInNotizie.id, stato: existsInNotizie.stato, titolo: existsInNotizie.titolo_editoriale } : null
    };

    // Caso 1: Scartata
    if (rawStato === 'scartata' || rawStato === 'scartato') {
      auditItem.decision = 'scartata_esclusa';
      discarded.push(auditItem);
      auditLog.segnalazioni.push(auditItem);
      console.log(`  - [SCARTATA] Record ${seg.id} (${rawUrl}) esclusa.`);
      continue;
    }

    // Caso 2: Esiste già realmente in Notizie
    if (existsInNotizie) {
      auditItem.decision = 'gia_presente_in_notizie';
      if (rawStato !== 'trasferita_in_notizie' && !options.mock && token) {
        console.log(`  - [ALLINEAMENTO STATO] Record ${seg.id} già presente in Notizie (${existsInNotizie.id}). Aggiornamento a 'trasferita_in_notizie'...`);
        await updateSegnalazioneStato(token, baseId, segnalazioniTable, seg.id, 'trasferita_in_notizie');
      }
      alreadyTransferred.push(auditItem);
      auditLog.segnalazioni.push(auditItem);
      continue;
    }

    // Caso 3: URL non valido
    if (!cleanUrl || !/^https?:\/\//i.test(cleanUrl)) {
      auditItem.decision = 'url_non_valido_scartata';
      console.warn(`  - [URL NON VALIDO] Record ${seg.id} ignorato: "${rawUrl}"`);
      auditLog.segnalazioni.push(auditItem);
      continue;
    }

    // Caso 4: Da trasferire (inclusi casi in cui stato era 'inserito' ma non esisteva in Notizie!)
    auditItem.decision = 'da_trasferire';
    if (rawStato === 'inserito' || rawStato === 'inserita') {
      auditItem.note = 'Stato precedente inserito ma non presente in Notizie (falso positivo recuperato)';
      console.log(`  - [RECUPERO ORFANO] Record ${seg.id} aveva stato 'inserito' ma non era presente in Notizie. Procedo al trasferimento.`);
    } else {
      console.log(`  - [NUOVA SEGNALAZIONE DA TRASFERIRE] Record ${seg.id} (${cleanUrl})`);
    }

    toTransfer.push({ seg, cleanUrl, auditItem });
    auditLog.segnalazioni.push(auditItem);
  }

  console.log(`\n[Segnalazioni Maurizio] Riepilogo analisi:`);
  console.log(`  - Già presenti in Notizie: ${alreadyTransferred.length}`);
  console.log(`  - Scartate: ${discarded.length}`);
  console.log(`  - Da trasferire ora in Notizie: ${toTransfer.length}\n`);

  const newlyCreatedRecords = [];

  for (const item of toTransfer) {
    const seg = item.seg;
    const cleanUrl = item.cleanUrl;
    const f = seg.fields || seg;
    const nota = (f.nota || f.note || '').trim();

    console.log(`  - Elaborazione link di Maurizio: ${cleanUrl} ...`);
    const meta = await fetchMetadataFromUrl(cleanUrl);
    const rawCategoria = (f.categoria || '').trim();
    const categoria = rawCategoria ? mapToCategory(meta.title, meta.summary, rawCategoria) : mapToCategory(meta.title, meta.summary, '');

    const dataFonte = meta.date || new Date().toISOString().slice(0, 10);
    const titoloEditoriale = meta.title;
    const titoloOriginale = meta.title;
    const fonte = meta.source;
    const sintesi = meta.summary;
    const rilevanza = nota 
      ? `Segnalazione diretta di Maurizio (Ref ID: ${seg.id}): ${nota}` 
      : `Segnalazione diretta di Maurizio (Ref ID: ${seg.id}) per la rassegna COINSIEME.`;

    const id = `${slugify(fonte)}-${slugify(titoloEditoriale).slice(0, 30)}-${dataFonte}`;

    const notiziaApprovata = {
      id,
      categoria,
      data_fonte: dataFonte,
      data_pubblicazione: dataFonte,
      titolo_originale: titoloOriginale,
      titolo_editoriale: titoloEditoriale,
      fonte,
      url_fonte: cleanUrl,
      sintesi_editoriale: sintesi,
      rilevanza_coinsieme: rilevanza,
      stato: 'pubblica', // Deroga editoriale esplicita di Maurizio: va in pubblicazione diretta
      priorita: 'alta',
      posizione_sito: 'home_evidenza',
      ordine_editoriale: 10
    };

    if (options.mock) {
      console.log(`    [MOCK] Notizia creata: "${titoloEditoriale}" (${fonte})`);
      newlyCreatedRecords.push(notiziaApprovata);
      item.auditItem.transferResult = 'mock_transferred';
      continue;
    }

    try {
      await insertIntoNotizie(token, baseId, notizieTable, notiziaApprovata);
      await updateSegnalazioneStato(token, baseId, segnalazioniTable, seg.id, 'trasferita_in_notizie');
      console.log(`    ✓ Notizia inserita con successo in "${notizieTable}" (stato: pubblica) e segnalazione marcata come "trasferita_in_notizie".`);
      newlyCreatedRecords.push(notiziaApprovata);
      item.auditItem.transferResult = 'success';
      item.auditItem.createdNotiziaId = id;
    } catch (err) {
      console.error(`    ✗ Errore salvataggio notizia per ${cleanUrl}: ${err.message}`);
      item.auditItem.transferResult = 'error';
      item.auditItem.error = err.message;
    }
  }

  // Salva audit report
  try {
    const dir = path.dirname(auditReportPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(auditReportPath, JSON.stringify(auditLog, null, 2) + '\n', 'utf8');
    console.log(`\n[Segnalazioni Maurizio] Report audit salvato in: ${auditReportPath}`);
  } catch (e) {
    console.warn('[Segnalazioni Maurizio] Impossibile salvare audit report:', e.message);
  }

  console.log(`\n[Segnalazioni Maurizio] Operazione completata: ${newlyCreatedRecords.length} nuove notizie trasferite in Notizie.\n`);
  return {
    processed: newlyCreatedRecords.length,
    alreadyTransferred: alreadyTransferred.length,
    discarded: discarded.length,
    records: newlyCreatedRecords,
    auditLog
  };
}

if (require.main === module) {
  processSegnalazioniMaurizio().catch((err) => {
    console.error('[Segnalazioni Maurizio] ERRORE:', err.message);
    process.exit(1);
  });
}

module.exports = {
  processSegnalazioniMaurizio,
  fetchMetadataFromUrl,
  extractDomainName,
  extractCleanUrl,
  normalizeUrl,
  fetchAllSegnalazioni,
  fetchAllNotizieUrls
};
